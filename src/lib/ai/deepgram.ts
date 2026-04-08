import { TranscriptionSegment } from '../types';
import { DEEPGRAM_API_URL, DEEPGRAM_DEFAULT_PARAMS } from '../constants';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const execFileAsync = promisify(execFile);

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
    console.error(`Deepgram API error: ${response.status} ${response.statusText} - ${errorText}`);

    if (response.status === 402 || response.status === 403) {
      throw new Error(
        'Servico de transcricao indisponivel no momento. Tente novamente mais tarde.'
      );
    }

    throw new Error(
      'Servico de transcricao indisponivel no momento. Tente novamente mais tarde.'
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
 * Download audio from a YouTube video as a Buffer using yt-dlp.
 */
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200MB (~2h of audio)

export async function downloadYouTubeAudio(youtubeUrl: string): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `yt-audio-${Date.now()}.wav`);

  try {
    const { stderr } = await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--extract-audio',
      '--audio-format', 'wav',
      '--audio-quality', '0',
      '--max-filesize', '200m',
      '--socket-timeout', '30',
      '--js-runtimes', 'node',
      '-o', tmpFile,
      youtubeUrl,
    ], { timeout: 120_000 });

    if (stderr) {
      console.log('yt-dlp stderr:', stderr);
    }

    // yt-dlp appends format extension before converting, check both patterns
    const wavFile = fs.existsSync(tmpFile) ? tmpFile : null;
    const webmBase = tmpFile.replace('.wav', '.webm');
    const possibleFile = wavFile || (fs.existsSync(webmBase) ? webmBase : null);

    if (!possibleFile) {
      // List what files were actually created
      const dir = path.dirname(tmpFile);
      const prefix = path.basename(tmpFile).replace('.wav', '');
      const files = fs.readdirSync(dir).filter(f => f.includes(prefix));
      console.error('yt-dlp output files:', files);
      throw new Error('yt-dlp did not produce output file');
    }

    const stats = fs.statSync(possibleFile);
    if (stats.size > MAX_AUDIO_BYTES) {
      throw new Error('O video e muito longo (limite: ~2 horas). Tente com um video mais curto.');
    }

    const buffer = fs.readFileSync(possibleFile);
    return buffer;
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string };
    const message = err.message || '';
    const stderr = err.stderr || '';
    const combined = message + ' ' + stderr;

    console.error('yt-dlp error:', combined.substring(0, 500));

    if (combined.includes('Private video')) {
      throw new Error('Este video e privado. Verifique se o video e publico.');
    }
    if (combined.includes('confirm you\'re not a bot') || combined.includes('confirm your age') || combined.includes('Sign in')) {
      throw new Error('O YouTube bloqueou o download deste video a partir do servidor. Tente com outro video ou use a opcao de upload de arquivo.');
    }
    if (combined.includes('Video unavailable') || combined.includes('removed') || combined.includes('not available')) {
      throw new Error('Este video nao esta disponivel. Ele pode ter sido removido.');
    }
    if (combined.includes('age')) {
      throw new Error('Este video possui restricao de idade e nao pode ser processado.');
    }
    if (combined.includes('muito longo')) {
      throw error as Error;
    }

    throw new Error('Falha ao baixar audio do YouTube. Verifique o link e tente novamente.');
  } finally {
    // Clean up any temp files
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    try { fs.unlinkSync(tmpFile.replace('.wav', '.webm')); } catch { /* ignore */ }
  }
}
