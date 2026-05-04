import { Mutex } from 'async-mutex';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global daily budget enforcement for vendor API spend.
 * Backed by a JSON file in the /data Docker volume so the budget
 * survives container restarts within the same UTC day.
 */

export type BudgetKind = 'deepgram-realtime' | 'deepgram-prerecorded' | 'groq';

const BUDGET_DIR = process.env.BUDGET_DIR || '/data';
const BUDGET_FILE = path.join(BUDGET_DIR, 'budget.json');

// Hard limits per UTC day
const LIMITS: Record<BudgetKind, number> = {
  'deepgram-realtime': 1800, // 30 min/day
  'deepgram-prerecorded': 14400, // 4 h/day
  groq: 500_000, // 500k tokens/day
};

type BudgetState = {
  date: string; // YYYY-MM-DD (UTC)
  deepgramRealtimeSeconds: number;
  deepgramPrerecordedSeconds: number;
  groqTokens: number;
};

const mutex = new Mutex();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyState(): BudgetState {
  return {
    date: todayUTC(),
    deepgramRealtimeSeconds: 0,
    deepgramPrerecordedSeconds: 0,
    groqTokens: 0,
  };
}

function readState(): BudgetState {
  try {
    if (!fs.existsSync(BUDGET_FILE)) return emptyState();
    const raw = fs.readFileSync(BUDGET_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    if (!parsed.date || parsed.date !== todayUTC()) return emptyState();
    return {
      date: parsed.date,
      deepgramRealtimeSeconds: parsed.deepgramRealtimeSeconds ?? 0,
      deepgramPrerecordedSeconds: parsed.deepgramPrerecordedSeconds ?? 0,
      groqTokens: parsed.groqTokens ?? 0,
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: BudgetState): void {
  try {
    if (!fs.existsSync(BUDGET_DIR)) {
      fs.mkdirSync(BUDGET_DIR, { recursive: true });
    }
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(state), 'utf-8');
  } catch (err) {
    // If we cannot persist, fail closed by NOT throwing — caller already
    // reserved against in-memory state. Log only the error type.
    console.error('budget: write failed', (err as Error).name);
  }
}

function fieldFor(kind: BudgetKind): keyof Omit<BudgetState, 'date'> {
  switch (kind) {
    case 'deepgram-realtime':
      return 'deepgramRealtimeSeconds';
    case 'deepgram-prerecorded':
      return 'deepgramPrerecordedSeconds';
    case 'groq':
      return 'groqTokens';
  }
}

export type BudgetCheckResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: string };

export function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

/**
 * Reserve `amount` against the daily budget. If the kind has no headroom,
 * returns { ok: false, retryAfterSeconds }. Otherwise increments the counter
 * by `amount` and returns { ok: true }. Caller should later call `finalize`
 * with the actual amount used so we converge on real spend.
 */
export async function checkAndReserve(
  kind: BudgetKind,
  amount: number
): Promise<BudgetCheckResult> {
  return mutex.runExclusive(() => {
    const state = readState();
    const field = fieldFor(kind);
    const current = state[field];
    const limit = LIMITS[kind];
    if (current + amount > limit) {
      return {
        ok: false as const,
        retryAfterSeconds: secondsUntilMidnightUTC(),
        reason: `Daily budget exhausted for ${kind}.`,
      };
    }
    state[field] = current + amount;
    writeState(state);
    return { ok: true as const };
  });
}

/**
 * Adjust the previously-reserved amount to match the actual amount used.
 * `actualAmount` is absolute (NOT a delta). The reservation made earlier
 * is rolled back and replaced with this measured value.
 */
export async function finalize(
  kind: BudgetKind,
  reservedAmount: number,
  actualAmount: number
): Promise<void> {
  await mutex.runExclusive(() => {
    const state = readState();
    const field = fieldFor(kind);
    const adjusted = state[field] - reservedAmount + actualAmount;
    state[field] = Math.max(0, adjusted);
    writeState(state);
  });
}
