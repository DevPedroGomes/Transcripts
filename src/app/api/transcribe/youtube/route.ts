import { NextRequest, NextResponse } from 'next/server';
import { downloadYouTubeAudio, transcribeAudio } from '@/lib/ai/deepgram';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { randomUUID } from 'crypto';
import { sanitizePrompt, validateTitle, validateYouTubeUrl } from '@/lib/validation';
import { getClientIP, checkRateLimit } from '@/lib/rate-limiter';
import { checkAndReserve, finalize } from '@/lib/budget';
import { sanitize } from '@/lib/log-sanitize';
import type { StoredTranscription, TranscribeApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (process.env.DEEPGRAM_KILL_SWITCH === '1') {
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: 'Servico temporariamente indisponivel.' },
      { status: 503 }
    );
  }

  const ip = getClientIP(request);
  const rateCheck = checkRateLimit(ip, 'transcribe-youtube', { maxRequests: 5, windowMs: 60 * 60 * 1000 });
  if (rateCheck.limited) {
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: rateCheck.reason },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { title: rawTitle, youtubeUrl: rawUrl, prompt: rawPrompt } = body;

    const title = validateTitle(rawTitle);
    const youtubeUrl = validateYouTubeUrl(rawUrl);
    const prompt = sanitizePrompt(rawPrompt);

    if (!title) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'Título inválido. Deve ter entre 3 e 200 caracteres.' },
        { status: 400 }
      );
    }

    if (!youtubeUrl) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'URL do YouTube inválida. Verifique se o link está correto.' },
        { status: 400 }
      );
    }

    // YouTube duration is unknown before download. Two-phase reservation:
    //   1) reserve a conservative gate (10 min) just to refuse if nearly full,
    //   2) after download, top up to match the actual buffer size at 8KB/s,
    //      which is the lowest-density compressed-audio floor (overestimates
    //      duration in the safe direction).
    const GATE_RESERVE_SECONDS = 600;
    const reservation = await checkAndReserve('deepgram-prerecorded', GATE_RESERVE_SECONDS);
    if (!reservation.ok) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'Limite diario do servico atingido. Tente novamente amanha.' },
        { status: 503, headers: { 'Retry-After': String(reservation.retryAfterSeconds) } }
      );
    }

    // Download YouTube audio
    let transcriptRaw: string;
    let durationSeconds: number | undefined;
    let totalReserved = GATE_RESERVE_SECONDS;
    try {
      const audioBuffer = await downloadYouTubeAudio(youtubeUrl);
      const MIN_BYTES_PER_SECOND = 8000;
      const estimatedFromSize = Math.min(
        Math.ceil(audioBuffer.length / MIN_BYTES_PER_SECOND),
        7200
      );
      if (estimatedFromSize > GATE_RESERVE_SECONDS) {
        const topup = estimatedFromSize - GATE_RESERVE_SECONDS;
        const topupRes = await checkAndReserve('deepgram-prerecorded', topup);
        if (!topupRes.ok) {
          await finalize('deepgram-prerecorded', GATE_RESERVE_SECONDS, 0).catch(() => {});
          return NextResponse.json<TranscribeApiResponse>(
            { success: false, error: 'Limite diario do servico atingido. Tente novamente amanha.' },
            { status: 503, headers: { 'Retry-After': String(topupRes.retryAfterSeconds) } }
          );
        }
        totalReserved = estimatedFromSize;
      }
      const result = await transcribeAudio(audioBuffer);
      transcriptRaw = result.text;
      durationSeconds = result.durationSeconds;
    } catch (e) {
      await finalize('deepgram-prerecorded', totalReserved, 0).catch(() => {});
      throw e;
    }
    await finalize('deepgram-prerecorded', totalReserved, durationSeconds ?? totalReserved).catch(() => {});

    // Optional AI processing
    let transcriptProcessed: string | undefined;
    let aiSkipped = false;
    if (prompt) {
      const groqReserve = 5000;
      const groqRes = await checkAndReserve('groq', groqReserve);
      if (!groqRes.ok) {
        aiSkipped = true;
      } else {
        const aiResult = await processTranscriptionWithAI(transcriptRaw, prompt);
        transcriptProcessed = aiResult.text;
        if (!aiResult.aiProcessed) {
          aiSkipped = true;
        }
        await finalize('groq', groqReserve, aiResult.usageTokens ?? groqReserve).catch(() => {});
      }
    }

    const now = new Date().toISOString();
    const transcription: StoredTranscription = {
      id: randomUUID(),
      title,
      source: 'youtube',
      status: 'completed',
      youtube_url: youtubeUrl,
      prompt: prompt ?? undefined,
      transcript_raw: transcriptRaw,
      transcript_processed: transcriptProcessed,
      duration_seconds: durationSeconds,
      created_at: now,
      updated_at: now,
    };

    return NextResponse.json<TranscribeApiResponse>({ success: true, data: transcription, ai_skipped: aiSkipped || undefined });
  } catch (error) {
    console.error('Erro ao processar YouTube:', sanitize(String(error)));
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: 'Erro ao processar o video. Tente novamente.' },
      { status: 500 }
    );
  }
}
