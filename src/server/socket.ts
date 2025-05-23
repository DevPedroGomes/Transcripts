import { Server } from 'socket.io';
import { createServer } from 'http';
import { Deepgram } from '@deepgram/sdk';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuração do Deepgram
// Usando a versão descontinuada da API com aviso explícito 
// @ts-ignore - usando API descontinuada deliberadamente
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY || '');

// Criar servidor HTTP e Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Mapa para armazenar conexões ativas de transcrição
const activeTranscriptions = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Iniciar nova sessão de transcrição
  socket.on('start-transcription', async (data: { transcriptionId: string; userId: string; jwt: string }) => {
    try {
      const { transcriptionId, userId, jwt } = data;
      
      // Verificar autenticação com Supabase
      const { data: user, error } = await supabase.auth.getUser(jwt);
      
      if (error || !user || user.user.id !== userId) {
        socket.emit('error', { message: 'Não autorizado' });
        return;
      }
      
      // Verificar se a transcrição existe e pertence ao usuário
      const { data: transcription, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .eq('user_id', userId)
        .single();
      
      if (transcriptionError || !transcription) {
        socket.emit('error', { message: 'Transcrição não encontrada' });
        return;
      }
      
      // Atualizar status da transcrição para processing
      await supabase
        .from('transcriptions')
        .update({ status: 'processing' })
        .eq('id', transcriptionId);
      
      // Associar socket com a transcrição
      socket.join(`transcription:${transcriptionId}`);
      activeTranscriptions.set(socket.id, {
        transcriptionId,
        userId,
        segments: [],
        fullText: ''
      });
      
      socket.emit('transcription-started', { transcriptionId });
      
      console.log(`Transcrição iniciada: ${transcriptionId}`);
    } catch (error) {
      console.error('Erro ao iniciar transcrição:', error);
      socket.emit('error', { message: 'Erro ao iniciar transcrição' });
    }
  });
  
  // Processar áudio recebido
  socket.on('audio-data', async (audioData) => {
    try {
      const transcription = activeTranscriptions.get(socket.id);
      
      if (!transcription) {
        socket.emit('error', { message: 'Sessão de transcrição não encontrada' });
        return;
      }
      
      // Converter buffer de áudio
      const audioBuffer = Buffer.from(audioData);
      
      // Armazenar em arquivo temporário para contornar problemas de tipagem
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      const tempFile = path.join(tempDir, `audio-${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      // Usar API alternativa para evitar problemas de compatibilidade
      fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true&punctuate=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/webm'
        },
        body: fs.readFileSync(tempFile)
      })
      .then(response => response.json())
      .then(data => {
        // Limpar arquivo temporário
        fs.unlinkSync(tempFile);
        
        if (data.results?.channels && data.results.channels[0]?.alternatives?.length > 0) {
          const transcript = data.results.channels[0].alternatives[0];
          
          // Adicionar ao texto completo
          transcription.fullText += ' ' + transcript.transcript;
          
          // Criar segmentos a partir das palavras
          const newSegments = (transcript.words || []).map((word: any, index: number) => ({
            id: `seg-${Date.now()}-${index}`,
            transcription_id: transcription.transcriptionId,
            start: word.start,
            end: word.end,
            text: word.word
          }));
          
          transcription.segments.push(...newSegments);
          
          // Enviar atualização para o cliente
          socket.emit('transcription-update', {
            text: transcript.transcript,
            segments: newSegments,
            fullText: transcription.fullText.trim()
          });
        }
      })
      .catch(err => {
        console.error('Erro na API do Deepgram:', err);
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        socket.emit('error', { message: 'Erro ao processar áudio' });
      });
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      socket.emit('error', { message: 'Erro ao processar áudio' });
    }
  });
  
  // Finalizar transcrição
  socket.on('end-transcription', async () => {
    try {
      const transcription = activeTranscriptions.get(socket.id);
      
      if (!transcription) {
        socket.emit('error', { message: 'Sessão de transcrição não encontrada' });
        return;
      }
      
      const { transcriptionId, userId, fullText, segments } = transcription;
      
      // Salvar transcrição completa no Supabase
      await supabase
        .from('transcriptions')
        .update({
          status: 'completed',
          transcript_raw: fullText,
          duration_seconds: segments.length > 0 ? Math.max(...segments.map((s: any) => s.end), 0) : 0
        })
        .eq('id', transcriptionId);
      
      // Salvar segmentos
      if (segments.length > 0) {
        await supabase
          .from('transcription_segments')
          .insert(segments.map((s: any) => ({
            transcription_id: transcriptionId,
            start: s.start,
            end: s.end,
            text: s.text
          })));
      }
      
      socket.emit('transcription-completed', {
        transcriptionId,
        text: fullText
      });
      
      // Limpar recursos
      socket.leave(`transcription:${transcriptionId}`);
      activeTranscriptions.delete(socket.id);
      
      console.log(`Transcrição finalizada: ${transcriptionId}`);
    } catch (error) {
      console.error('Erro ao finalizar transcrição:', error);
      socket.emit('error', { message: 'Erro ao finalizar transcrição' });
    }
  });
  
  // Desconexão
  socket.on('disconnect', async () => {
    const transcription = activeTranscriptions.get(socket.id);
    
    if (transcription) {
      try {
        // Transcrição foi interrompida, atualizar status
        await supabase
          .from('transcriptions')
          .update({ status: 'interrupted' })
          .eq('id', transcription.transcriptionId);
        
        activeTranscriptions.delete(socket.id);
      } catch (error) {
        console.error('Erro ao processar desconexão:', error);
      }
    }
    
    console.log('Cliente desconectado:', socket.id);
  });
});

// Iniciar o servidor
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Servidor de WebSocket rodando na porta ${PORT}`);
});

export { io }; 