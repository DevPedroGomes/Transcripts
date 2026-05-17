/**
 * In-memory tracker for realtime session reservations.
 * Token endpoint reserves a session slot and stores the reservation by
 * sessionId; the finalize endpoint reconciles it with the actual duration
 * the client reports. Entries older than 10 min are dropped (no refund)
 * to bound abuse from clients that never call finalize.
 *
 * Single-instance showcase only — multi-replica would need shared storage.
 */

type SessionReservation = {
  reserved: number;
  createdAt: number;
};

const sessions = new Map<string, SessionReservation>();
const MAX_AGE_MS = 10 * 60 * 1000;

export function recordReservation(sessionId: string, reservedSeconds: number): void {
  sessions.set(sessionId, { reserved: reservedSeconds, createdAt: Date.now() });
  pruneExpired();
}

export function takeReservation(sessionId: string): SessionReservation | null {
  pruneExpired();
  const entry = sessions.get(sessionId);
  if (!entry) return null;
  sessions.delete(sessionId);
  return entry;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, val] of sessions) {
    if (now - val.createdAt > MAX_AGE_MS) sessions.delete(key);
  }
}
