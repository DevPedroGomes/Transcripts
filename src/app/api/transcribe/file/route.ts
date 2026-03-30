import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/deepgram';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { randomUUID } from 'crypto';
import { sanitizePrompt, validateTitle, isValidAudioFile, MAX_FILE_SIZE } from '@/lib/validation';
import { getClientIP, checkRateLimit } from '@/lib/rate-limiter';
import type { StoredTranscription, TranscribeApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
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

    // Convert File to Buffer and transcribe
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { text: transcriptRaw, durationSeconds } = await transcribeAudio(buffer);

    // Optional AI processing
    let transcriptProcessed: string | undefined;
    let aiSkipped = false;
    if (prompt) {
      const aiResult = await processTranscriptionWithAI(transcriptRaw, prompt);
      transcriptProcessed = aiResult.text;
      if (!aiResult.aiProcessed) {
        aiSkipped = true;
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
    console.error('Erro ao processar arquivo:', error);
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: 'Erro ao processar o arquivo. Tente novamente.' },
      { status: 500 }
    );
  }
}
