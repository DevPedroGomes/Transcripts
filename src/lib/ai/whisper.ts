// Serverless-compatible implementation using Deepgram
import { TranscriptionSegment } from "../types";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import ytdl from "ytdl-core";

const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

type WhisperTranscriptionResult = {
  text: string;
  segments: TranscriptionSegment[];
};

/**
 * Transcribe audio using Deepgram API
 * Supports both URL (remote file) and Buffer (uploaded file)
 */
export async function transcribeAudio(source: string | Buffer): Promise<WhisperTranscriptionResult> {
  try {
    let body: string | Buffer;
    let headers: Record<string, string> = {
      'Authorization': `Token ${deepgramApiKey}`,
    };

    if (typeof source === 'string') {
      // It's a URL, send JSON body
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ url: source });
    } else {
      // It's a Buffer, send raw audio
      // Deepgram detects mimetype automatically or we can specify generic audio/mp3
      headers['Content-Type'] = 'audio/mp3';
      body = source;
    }

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true&punctuate=true&diarize=true', {
      method: 'POST',
      headers,
      body: body as unknown as BodyInit
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Deepgram: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Process results
    const transcript = data.results?.channels[0]?.alternatives[0];

    if (!transcript) {
      throw new Error('Nenhuma transcrição foi gerada');
    }

    // Process segments
    const segments = transcript.words.map((word: any, index: number) => ({
      id: `seg-${index}`,
      transcription_id: '', // Filled by caller
      start: word.start,
      end: word.end,
      text: word.word,
      created_at: new Date().toISOString()
    }));

    return {
      text: transcript.transcript,
      segments
    };
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw new Error('Falha ao transcrever áudio: ' + (error as Error).message);
  }
}

/**
 * Get audio stream from YouTube video
 * Returns a buffer of the audio (for simple serverless compatibility)
 * Note: For very long videos, this might hit memory limits. 
 * Ideally, we would stream this directly to Deepgram, but ytdl stream + fetch body stream 
 * can be tricky in some Node environments. Buffering is safer for now for < 50MB files.
 */
export async function downloadYouTubeAudio(youtubeUrl: string): Promise<Buffer> {
  try {
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('URL do YouTube inválida');
    }

    // Get audio stream
    const audioStream = ytdl(youtubeUrl, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Erro ao baixar áudio do YouTube:', error);
    throw new Error('Falha ao baixar áudio do YouTube: ' + (error as Error).message);
  }
}

export async function processTranscriptionText(transcriptText: string) {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([transcriptText]);
    return docs;
  } catch (error) {
    console.error('Erro ao processar texto da transcrição:', error);
    throw new Error('Falha ao processar texto da transcrição');
  }
}
