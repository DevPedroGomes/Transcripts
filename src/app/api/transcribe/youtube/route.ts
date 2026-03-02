import { NextRequest, NextResponse } from 'next/server';
import { downloadYouTubeAudio, transcribeAudio } from '@/lib/ai/whisper';
import { processTranscriptionWithAI } from '@/lib/ai/openai';
import { randomUUID } from 'crypto';
import { sanitizePrompt, validateTitle, validateYouTubeUrl } from '@/lib/validation';
import type { StoredTranscription, TranscribeApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
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
    const message =
      error instanceof Error ? error.message : 'Erro ao processar o vídeo. Tente novamente.';
    return NextResponse.json<TranscribeApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
