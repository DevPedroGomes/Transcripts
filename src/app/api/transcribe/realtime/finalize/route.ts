import { NextRequest, NextResponse } from 'next/server';
import { finalize } from '@/lib/budget';
import { takeReservation } from '@/lib/realtime-sessions';
import { REALTIME_MAX_DURATION_MS } from '@/lib/constants';
import { sanitize } from '@/lib/log-sanitize';

const MAX_SESSION_SECONDS = Math.ceil(REALTIME_MAX_DURATION_MS / 1000);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, durationSeconds } = body ?? {};

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId obrigatorio.' }, { status: 400 });
    }
    if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
      return NextResponse.json({ success: false, error: 'durationSeconds invalido.' }, { status: 400 });
    }

    const reservation = takeReservation(sessionId);
    if (!reservation) {
      return NextResponse.json({ success: true, refunded: 0 });
    }

    const actual = Math.min(Math.ceil(durationSeconds), MAX_SESSION_SECONDS);
    await finalize('deepgram-realtime', reservation.reserved, actual);

    return NextResponse.json({ success: true, refunded: Math.max(0, reservation.reserved - actual) });
  } catch (error) {
    console.error('Realtime finalize error:', sanitize(String(error)));
    return NextResponse.json({ success: false, error: 'Falha ao finalizar sessao.' }, { status: 500 });
  }
}
