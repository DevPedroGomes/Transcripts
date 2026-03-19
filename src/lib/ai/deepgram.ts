import { TranscriptionSegment } from '../types';
import { DEEPGRAM_API_URL, DEEPGRAM_DEFAULT_PARAMS } from '../constants';
import ytdl from '@distube/ytdl-core';

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

type WhisperTranscriptionResult = {
  text: string;
  segments: TranscriptionSegment[];
  durationSeconds?: number;
};

/**
 * Transcribe audio using Deepgram API.
 * Supports both URL (remote file) and Buffer (uploaded file).
 */
export async function transcribeAudio(
  source: string | Buffer
): Promise<WhisperTranscriptionResult> {
  if (!deepgramApiKey) {
    throw new Error('DEEPGRAM_API_KEY não configurada.');
  }

  let body: string | Buffer;
  const headers: Record<string, string> = {
    Authorization: `Token ${deepgramApiKey}`,
  };

  if (typeof source === 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ url: source });
  } else {
    headers['Content-Type'] = 'audio/mp3';
    body = source;
  }

  const response = await fetch(`${DEEPGRAM_API_URL}?${DEEPGRAM_DEFAULT_PARAMS}`, {
    method: 'POST',
    headers,
    body: body as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Erro na API Deepgram: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  const transcript = data.results?.channels[0]?.alternatives[0];

  if (!transcript) {
    throw new Error('Nenhuma transcrição foi gerada');
  }

  const segments: TranscriptionSegment[] = (transcript.words ?? []).map(
    (word: { start: number; end: number; word: string }, index: number) => ({
      id: `seg-${index}`,
      transcription_id: '',
      start: word.start,
      end: word.end,
      text: word.word,
    })
  );

  const durationSeconds = data.metadata?.duration
    ? Math.round(data.metadata.duration)
    : undefined;

  return { text: transcript.transcript, segments, durationSeconds };
}

/**
 * Download audio from a YouTube video as a Buffer.
 */
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200MB (~2h of audio)

export async function downloadYouTubeAudio(youtubeUrl: string): Promise<Buffer> {
  if (!ytdl.validateURL(youtubeUrl)) {
    throw new Error('URL do YouTube inválida');
  }

  try {
    const audioStream = ytdl(youtubeUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    for await (const chunk of audioStream) {
      totalBytes += chunk.length;
      if (totalBytes > MAX_AUDIO_BYTES) {
        audioStream.destroy();
        throw new Error(
          'O vídeo é muito longo (limite: ~2 horas). Tente com um vídeo mais curto.'
        );
      }
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    const message = (error as Error).message || '';

    if (message.includes('private') || message.includes('login')) {
      throw new Error('Este vídeo é privado ou requer login. Verifique se o vídeo é público.');
    }
    if (message.includes('unavailable') || message.includes('removed')) {
      throw new Error('Este vídeo não está disponível. Ele pode ter sido removido.');
    }
    if (message.includes('age')) {
      throw new Error('Este vídeo possui restrição de idade e não pode ser processado.');
    }

    throw new Error('Falha ao baixar audio do YouTube. Verifique o link e tente novamente.');
  }
}
