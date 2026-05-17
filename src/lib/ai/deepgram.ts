import { TranscriptionSegment } from '../types';
import { DEEPGRAM_API_URL, DEEPGRAM_DEFAULT_PARAMS } from '../constants';
import { sanitize } from '../log-sanitize';
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
 * Sniff audio mime type from common magic bytes. Deepgram dispatches by
 * content-type, so a wrong header (e.g. m4a buffer claimed as audio/mp3)
 * makes its parser fall back to a heuristic that occasionally drops the
 * first 100ms.
 */
function sniffAudioMime(buf: Buffer): string {
  if (buf.length >= 12 && buf.slice(4, 8).toString() === 'ftyp') return 'audio/mp4';
  if (buf.length >= 4 && buf.slice(0, 4).toString() === 'RIFF') return 'audio/wav';
  if (buf.length >= 4 && buf.slice(0, 4).toString() === 'OggS') return 'audio/ogg';
  if (buf.length >= 4 && buf.slice(0, 4).toString() === 'fLaC') return 'audio/flac';
  if (buf.length >= 4 && buf.slice(0, 4).toString() === '\x1a\x45\xdf\xa3') return 'audio/webm';
  if (buf.length >= 3 && (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (buf.length >= 3 && buf.slice(0, 3).toString() === 'ID3') return 'audio/mpeg';
  return 'application/octet-stream';
}

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
    headers['Content-Type'] = sniffAudioMime(source);
    body = source;
  }

  const response = await fetch(`${DEEPGRAM_API_URL}?${DEEPGRAM_DEFAULT_PARAMS}`, {
    method: 'POST',
    headers,
    body: body as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Deepgram API error: ${response.status} ${response.statusText} - ${sanitize(errorText)}`);

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

  const formatted = formatDiarized(transcript);
  return { text: formatted || transcript.transcript, segments, durationSeconds };
}

type DGSentence = { text: string; start: number; end: number };
type DGParagraph = { sentences?: DGSentence[]; speaker?: number; start?: number; end?: number };
type DGAlternative = {
  transcript: string;
  paragraphs?: { paragraphs?: DGParagraph[] };
};

function fmtTs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Build a transcript string with speaker labels and timestamps from the
 * Deepgram `paragraphs.paragraphs[]` structure (returned when smart_format
 * + diarize are enabled). Falls back to '' so callers can use the plain
 * `transcript` string when paragraphs are absent (e.g. very short clips
 * with a single speaker may omit them).
 */
function formatDiarized(alt: DGAlternative): string {
  const paragraphs = alt.paragraphs?.paragraphs;
  if (!paragraphs || paragraphs.length === 0) return '';

  const lines: string[] = [];
  for (const p of paragraphs) {
    const sentences = p.sentences ?? [];
    if (sentences.length === 0) continue;
    const text = sentences.map((s) => s.text).join(' ').trim();
    if (!text) continue;
    const start = typeof p.start === 'number' ? p.start : sentences[0]?.start ?? 0;
    const speaker = typeof p.speaker === 'number' ? `Falante ${p.speaker + 1}` : 'Falante';
    lines.push(`[${fmtTs(start)} · ${speaker}] ${text}`);
  }
  return lines.join('\n\n');
}

/**
 * Download audio from a YouTube video as a Buffer using yt-dlp.
 */
const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200MB (~2h of audio)

export async function downloadYouTubeAudio(youtubeUrl: string): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  // m4a keeps the AAC stream from YouTube without re-encoding to WAV.
  // WAV at quality 0 was ~10MB/min — a 1h video filled ~600MB and OOM'd the
  // 512MB container. m4a stays under ~1MB/min, and Deepgram accepts it
  // natively as audio/mp4.
  const tmpFile = path.join(tmpDir, `yt-audio-${Date.now()}.m4a`);

  try {
    // YouTube ramped up anti-bot in 2025. Each `youtube:player_client` value
    // hits a different ingest endpoint with different fingerprinting. Trying
    // multiple in one invocation gives yt-dlp the best chance of finding a
    // path that doesn't trigger the "Sign in to confirm you are not a bot"
    // wall — especially from cloud-provider IPs which YouTube flags hard.
    // Order matters: ios first because mobile clients see fewer challenges
    // for cloud egress, then web_safari, then default web.
    //
    // --force-ipv4 because some VPS IPv6 ranges are pre-flagged by YouTube.
    // --user-agent matches a real browser to avoid easy fingerprinting.
    const { stderr } = await execFileAsync('yt-dlp', [
      '--no-playlist',
      '--extract-audio',
      '--audio-format', 'm4a',
      '--audio-quality', '0',
      '--max-filesize', '200m',
      '--socket-timeout', '30',
      '--js-runtimes', 'node',
      '--no-cache-dir',
      '--no-write-info-json',
      '--no-write-playlist-metafiles',
      '--cache-dir', '/tmp/ytdlp-cache',
      '--force-ipv4',
      '--user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      '--extractor-args', 'youtube:player_client=ios,web_safari,web',
      '--retries', '3',
      '--fragment-retries', '3',
      '-o', tmpFile,
      youtubeUrl,
    ], { timeout: 120_000 });

    if (stderr) {
      console.log('yt-dlp stderr:', sanitize(stderr));
    }

    // yt-dlp may produce m4a, webm, or rarely .opus depending on stream
    const prefix = tmpFile.replace(/\.m4a$/, '');
    const candidates = [tmpFile, `${prefix}.webm`, `${prefix}.opus`, `${prefix}.aac`];
    const possibleFile = candidates.find((f) => fs.existsSync(f)) ?? null;

    if (!possibleFile) {
      // List what files were actually created
      const dir = path.dirname(tmpFile);
      const baseName = path.basename(prefix);
      const files = fs.readdirSync(dir).filter(f => f.includes(baseName));
      console.error('yt-dlp output files:', sanitize(files.join(',')));
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

    console.error('yt-dlp error:', sanitize(combined.substring(0, 500)));

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
    // Clean up any temp files yt-dlp may have produced
    const prefix = tmpFile.replace(/\.m4a$/, '');
    for (const ext of ['.m4a', '.webm', '.opus', '.aac']) {
      try { fs.unlinkSync(`${prefix}${ext}`); } catch { /* ignore */ }
    }
  }
}
