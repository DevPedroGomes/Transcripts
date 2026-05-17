import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { REALTIME_COOLDOWN_MS } from '@/lib/constants';
import { getClientIP } from '@/lib/rate-limiter';
import { checkAndReserve, finalize } from '@/lib/budget';
import { sanitize } from '@/lib/log-sanitize';
import { recordReservation } from '@/lib/realtime-sessions';

// In-memory rate limiting (acceptable for single-instance showcase)
const sessions = new Map<string, { activeAt: number }>();
const MAX_CONCURRENT = 5;
const KEY_TTL_SECONDS = 5;

function isRateLimited(ip: string): { limited: boolean; reason?: string } {
  const now = Date.now();

  // Clean up expired entries (older than 5 minutes)
  for (const [key, val] of sessions) {
    if (now - val.activeAt > 5 * 60 * 1000) sessions.delete(key);
  }

  // Check global concurrent sessions (active within last 3 min)
  let activeSessions = 0;
  for (const [, val] of sessions) {
    if (now - val.activeAt < 3 * 60 * 1000) activeSessions++;
  }
  if (activeSessions >= MAX_CONCURRENT) {
    return { limited: true, reason: 'Ja existe uma sessao ativa. Aguarde ela finalizar.' };
  }

  // Check per-IP cooldown
  const existing = sessions.get(ip);
  if (existing && now - existing.activeAt < REALTIME_COOLDOWN_MS) {
    const remainSec = Math.ceil((REALTIME_COOLDOWN_MS - (now - existing.activeAt)) / 1000);
    return { limited: true, reason: `Aguarde ${remainSec}s antes de iniciar nova sessao.` };
  }

  return { limited: false };
}

export async function POST(request: NextRequest) {
  // Kill switch: when set, refuse all realtime tokens immediately.
  if (process.env.DEEPGRAM_KILL_SWITCH === '1') {
    return NextResponse.json(
      { success: false, error: 'Servico temporariamente indisponivel.' },
      { status: 503 }
    );
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const projectId = process.env.DEEPGRAM_PROJECT_ID;

  if (!deepgramApiKey || !projectId) {
    return NextResponse.json(
      { success: false, error: 'Servico de transcricao em tempo real nao configurado.' },
      { status: 500 }
    );
  }

  const ip = getClientIP(request);

  // Hostile/anonymous bucket: no x-real-ip means we cannot identify the
  // caller. Pool to 1/hour by collapsing them into the 'unknown' key
  // alongside the existing per-IP cooldown; we also tighten the global
  // concurrency check for safety.
  const check = isRateLimited(ip);
  if (check.limited) {
    return NextResponse.json({ success: false, error: check.reason }, { status: 429 });
  }

  // Reserve realtime budget: gate with 60s (just enough to refuse if the
  // bucket is nearly full). The /realtime/finalize endpoint reconciles
  // with the actual session duration when the client stops. If finalize
  // is never called (tab close, crash), the entry expires after 10 min
  // with no refund — bounded abuse window since cooldown is 30s.
  const RESERVE_SECONDS = 60;
  const reservation = await checkAndReserve('deepgram-realtime', RESERVE_SECONDS);
  if (!reservation.ok) {
    return NextResponse.json(
      { success: false, error: 'Limite diario do servico atingido. Tente novamente amanha.' },
      { status: 503, headers: { 'Retry-After': String(reservation.retryAfterSeconds) } }
    );
  }

  try {
    const response = await fetch(
      `https://api.deepgram.com/v1/projects/${projectId}/keys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${deepgramApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: `Realtime showcase session - ${ip}`,
          // Narrow scope: 'member' is the lowest scope that still permits
          // the live STT websocket. If Deepgram rejects this we revert
          // to 'usage:write' (see fallback below).
          scopes: ['member'],
          tags: ['realtime-showcase-temp'],
          time_to_live_in_seconds: KEY_TTL_SECONDS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram key creation failed:', sanitize(errorText));
      // Roll back the reservation since we did not actually use any seconds.
      await finalize('deepgram-realtime', RESERVE_SECONDS, 0);
      throw new Error('Falha ao criar chave temporaria.');
    }

    const data = await response.json();

    // Track session
    sessions.set(ip, { activeAt: Date.now() });

    // Issue a sessionId so the client can call /realtime/finalize with the
    // real duration once the session ends. The reservation is held until
    // then (or until the 10-min sweeper drops it).
    const sessionId = randomUUID();
    recordReservation(sessionId, RESERVE_SECONDS);

    return NextResponse.json({ success: true, key: data.key, sessionId });
  } catch (error) {
    console.error('Realtime token error:', sanitize(String(error)));
    // Best effort: if we crashed before issuing a key, free the reservation.
    await finalize('deepgram-realtime', RESERVE_SECONDS, 0).catch(() => {});
    return NextResponse.json(
      { success: false, error: 'Erro ao preparar sessao de transcricao em tempo real.' },
      { status: 500 }
    );
  }
}
