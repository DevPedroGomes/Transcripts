import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/deepgram';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { randomUUID } from 'crypto';
import { sanitizePrompt, validateTitle, isValidAudioFile, MAX_FILE_SIZE } from '@/lib/validation';
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
  const rateCheck = checkRateLimit(ip, 'transcribe-file', { maxRequests: 10, windowMs: 60 * 60 * 1000 });
  if (rateCheck.limited) {
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: rateCheck.reason },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const rawTitle = formData.get('title') as string;
    const rawPrompt = formData.get('prompt') as string;
    const audioFile = formData.get('file') as File;

    const title = validateTitle(rawTitle);
    const prompt = sanitizePrompt(rawPrompt);

    if (!title) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'Título inválido. Deve ter entre 3 e 200 caracteres.' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'Arquivo de áudio é obrigatório.' },
        { status: 400 }
      );
    }

    if (!isValidAudioFile(audioFile)) {
      return NextResponse.json<TranscribeApiResponse>(
        {
          success: false,
          error: 'Formato de arquivo inválido. Aceitos: MP3, WAV, WebM, OGG, FLAC, M4A, AAC.',
        },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      const maxMB = Math.floor(MAX_FILE_SIZE / (1024 * 1024));
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: `O arquivo excede o limite de ${maxMB}MB.` },
        { status: 400 }
      );
    }

    // Reserve prerecorded budget: estimate 5 min/file.
    const RESERVE_SECONDS = 300;
    const reservation = await checkAndReserve('deepgram-prerecorded', RESERVE_SECONDS);
    if (!reservation.ok) {
      return NextResponse.json<TranscribeApiResponse>(
        { success: false, error: 'Limite diario do servico atingido. Tente novamente amanha.' },
        { status: 503, headers: { 'Retry-After': String(reservation.retryAfterSeconds) } }
      );
    }

    // Convert File to Buffer and transcribe
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let transcriptRaw: string;
    let durationSeconds: number | undefined;
    try {
      const result = await transcribeAudio(buffer);
      transcriptRaw = result.text;
      durationSeconds = result.durationSeconds;
    } catch (e) {
      await finalize('deepgram-prerecorded', RESERVE_SECONDS, 0).catch(() => {});
      throw e;
    }
    await finalize('deepgram-prerecorded', RESERVE_SECONDS, durationSeconds ?? RESERVE_SECONDS).catch(() => {});

    // Optional AI processing
    let transcriptProcessed: string | undefined;
    let aiSkipped = false;
    if (prompt) {
      const groqReserve = 5000; // rough token estimate
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
      source: 'file',
      status: 'completed',
      file_name: audioFile.name,
      prompt: prompt ?? undefined,
      transcript_raw: transcriptRaw,
      transcript_processed: transcriptProcessed,
      duration_seconds: durationSeconds,
      created_at: now,
      updated_at: now,
    };

    return NextResponse.json<TranscribeApiResponse>({ success: true, data: transcription, ai_skipped: aiSkipped || undefined });
  } catch (error) {
    console.error('Erro ao processar arquivo:', sanitize(String(error)));
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: 'Erro ao processar o arquivo. Tente novamente.' },
      { status: 500 }
    );
  }
}
