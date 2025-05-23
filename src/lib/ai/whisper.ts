// Nota: Esta é uma implementação simplificada para integração com Faster-Whisper
// A implementação real dependerá de como você hospedará o modelo (API externa, serviço local, etc.)

import { TranscriptionSegment } from '../types';
import { UnstructuredLoader } from "langchain/document_loaders/fs/unstructured";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { pipeline } from 'stream';

const streamPipeline = promisify(pipeline);
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

type WhisperTranscriptionResult = {
  text: string;
  segments: TranscriptionSegment[];
};

// Função para transcrever áudio utilizando Deepgram REST API
export async function transcribeAudio(audioFileUrl: string): Promise<WhisperTranscriptionResult> {
  try {
    // Verificar se o arquivo é local (para uploads) ou URL remota (para YouTube)
    const isLocalFile = !audioFileUrl.startsWith('http');
    let filePath = audioFileUrl;

    if (!isLocalFile) {
      // Download do arquivo para pasta temporária
      const tempFile = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
      await downloadFile(audioFileUrl, tempFile);
      filePath = tempFile;
    }

    // Carregar o arquivo de áudio
    const audioBuffer = fs.readFileSync(filePath);
    
    // Enviar para Deepgram usando fetch diretamente
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true&punctuate=true&diarize=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': 'audio/mp3'
      },
      body: audioBuffer
    });

    if (!response.ok) {
      throw new Error(`Erro na API Deepgram: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Processar os resultados
    const transcript = data.results?.channels[0]?.alternatives[0];
    
    if (!transcript) {
      throw new Error('Nenhuma transcrição foi gerada');
    }
    
    // Processar segmentos
    const segments = transcript.words.map((word: any, index: number) => ({
      id: `seg-${index}`,
      transcription_id: '', // Será preenchido pelo servidor
      start: word.start,
      end: word.end,
      text: word.word,
      created_at: new Date().toISOString()
    }));
    
    // Limpar arquivo temporário se foi baixado
    if (!isLocalFile && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return {
      text: transcript.transcript,
      segments
    };
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    throw new Error('Falha ao transcrever áudio: ' + (error as Error).message);
  }
}

// Função para baixar arquivo de uma URL
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo: ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(destPath);
  await streamPipeline(response.body!, fileStream);
}

// Função para baixar áudio do YouTube
export async function downloadYouTubeAudio(youtubeUrl: string): Promise<string> {
  try {
    // Verificar se é uma URL válida do YouTube
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('URL do YouTube inválida');
    }
    
    // Obter informações do vídeo
    const info = await ytdl.getInfo(youtubeUrl);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length === 0) {
      throw new Error('Não foi possível encontrar formatos de áudio para este vídeo');
    }
    
    // Definir arquivo temporário
    const tempFilePath = path.join(os.tmpdir(), `youtube-${Date.now()}.mp3`);
    
    // Baixar e converter para MP3
    return new Promise((resolve, reject) => {
      const audioStream = ytdl(youtubeUrl, { 
        quality: 'highestaudio',
        filter: 'audioonly' 
      });
      
      ffmpeg(audioStream)
        .audioBitrate(128)
        .save(tempFilePath)
        .on('end', () => {
          console.log(`Áudio do YouTube baixado e convertido: ${tempFilePath}`);
          resolve(tempFilePath);
        })
        .on('error', (err) => {
          console.error('Erro ao processar o áudio:', err);
          reject(new Error(`Falha ao processar áudio do YouTube: ${err.message}`));
        });
    });
  } catch (error) {
    console.error('Erro ao baixar áudio do YouTube:', error);
    throw new Error('Falha ao baixar áudio do YouTube: ' + (error as Error).message);
  }
}

// Função para processar o texto da transcrição com LangChain para criar chunks analisáveis
export async function processTranscriptionText(transcriptText: string) {
  try {
    // Dividir o texto em chunks para processamento
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