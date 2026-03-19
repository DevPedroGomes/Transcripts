import { NextRequest, NextResponse } from 'next/server';
import { downloadYouTubeAudio, transcribeAudio } from '@/lib/ai/deepgram';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { randomUUID } from 'crypto';
import { sanitizePrompt, validateTitle, validateYouTubeUrl } from '@/lib/validation';
import { getClientIP, checkRateLimit } from '@/lib/rate-limiter';
import type { StoredTranscription, TranscribeApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
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

    // Download YouTube audio
    const audioBuffer = await downloadYouTubeAudio(youtubeUrl);

    // Transcribe
    const { text: transcriptRaw, durationSeconds } = await transcribeAudio(audioBuffer);

    // Optional AI processing
    let transcriptProcessed: string | undefined;
    if (prompt) {
      transcriptProcessed = await processTranscriptionWithAI(transcriptRaw, prompt);
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

    return NextResponse.json<TranscribeApiResponse>({ success: true, data: transcription });
  } catch (error) {
    console.error('Erro ao processar YouTube:', error);
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: 'Erro ao processar o video. Tente novamente.' },
      { status: 500 }
    );
  }
}
