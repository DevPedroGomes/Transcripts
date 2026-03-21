import { NextRequest, NextResponse } from 'next/server';
import { REALTIME_COOLDOWN_MS } from '@/lib/constants';

// In-memory rate limiting (acceptable for single-instance showcase)
const sessions = new Map<string, { activeAt: number }>();
const MAX_CONCURRENT = 5;
const KEY_TTL_SECONDS = 10;

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

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
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const projectId = process.env.DEEPGRAM_PROJECT_ID;

  if (!deepgramApiKey || !projectId) {
    return NextResponse.json(
      { success: false, error: 'Servico de transcricao em tempo real nao configurado.' },
      { status: 500 }
    );
  }

  const ip = getClientIP(request);
  const check = isRateLimited(ip);
  if (check.limited) {
    return NextResponse.json({ success: false, error: check.reason }, { status: 429 });
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
          scopes: ['usage:write'],
          time_to_live_in_seconds: KEY_TTL_SECONDS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram key creation failed:', errorText);
      throw new Error('Falha ao criar chave temporaria.');
    }

    const data = await response.json();

    // Track session
    sessions.set(ip, { activeAt: Date.now() });

    return NextResponse.json({ success: true, key: data.key });
  } catch (error) {
    console.error('Realtime token error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao preparar sessao de transcricao em tempo real.' },
      { status: 500 }
    );
  }
}
