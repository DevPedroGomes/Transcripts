import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { processTranscriptionWithAI } from "@/lib/ai/openai";
import { downloadYouTubeAudio, transcribeAudio } from "@/lib/ai/whisper";
import { randomUUID } from "crypto";
import ytdl from 'ytdl-core';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Processar o corpo da requisição
    const body = await request.json();
    const { title, youtubeUrl, prompt } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json(
        { error: "Título e URL do YouTube são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar URL do YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json(
        { error: "URL do YouTube inválida" },
        { status: 400 }
      );
    }

    // Obter informações do usuário
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profileData) {
      return NextResponse.json(
        { error: "Perfil de usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar limites com base no plano do usuário
    if (!profileData.has_active_subscription) {
      // Verificar se o usuário gratuito ainda tem transcrições disponíveis
      const { count } = await supabase
        .from("transcriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .gte("created_at", new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());
      
      if ((count || 0) >= 5) {
        return NextResponse.json(
          { error: "Você atingiu o limite de transcrições do plano gratuito" },
          { status: 403 }
        );
      }
      
      // Verificar duração do vídeo (limite de 10 minutos para plano gratuito)
      try {
        const videoInfo = await ytdl.getInfo(youtubeUrl);
        const durationInSeconds = parseInt(videoInfo.videoDetails.lengthSeconds);
        
        if (durationInSeconds > 600) { // 10 minutos
          return NextResponse.json(
            { error: "O plano gratuito permite vídeos de até 10 minutos" },
            { status: 403 }
          );
        }
      } catch (error) {
        console.error("Erro ao verificar informações do vídeo:", error);
        return NextResponse.json(
          { error: "Não foi possível verificar a duração do vídeo" },
          { status: 400 }
        );
      }
    }

    // Criar registro de transcrição no banco
    const transcriptionId = randomUUID();
    
    const { error: insertError } = await supabase
      .from("transcriptions")
      .insert({
        id: transcriptionId,
        user_id: session.user.id,
        title,
        source: "youtube",
        status: "processing",
        youtube_url: youtubeUrl,
        prompt: prompt || null,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Falha ao criar registro de transcrição" },
        { status: 500 }
      );
    }

    // Iniciar processo de transcrição em segundo plano
    // Esta implementação usa setTimeout, mas em produção você usaria
    // um sistema de filas como Bull ou um worker separado
    setTimeout(async () => {
      try {
        // Baixar o áudio do YouTube
        const audioFilePath = await downloadYouTubeAudio(youtubeUrl);
        
        // Transcrever o áudio
        const transcriptionResult = await transcribeAudio(audioFilePath);
        
        // Processar com IA se houver um prompt
        let processedTranscript = null;
        if (prompt) {
          processedTranscript = await processTranscriptionWithAI(
            transcriptionResult.text,
            prompt
          );
        }
        
        // Obter informações do vídeo para duração
        const videoInfo = await ytdl.getInfo(youtubeUrl);
        const durationInSeconds = parseInt(videoInfo.videoDetails.lengthSeconds);
        
        // Atualizar o registro com a transcrição completa
        await supabase
          .from("transcriptions")
          .update({
            status: "completed",
            transcript_raw: transcriptionResult.text,
            transcript_processed: processedTranscript,
            duration_seconds: durationInSeconds,
          })
          .eq("id", transcriptionId);
          
        // Inserir os segmentos da transcrição
        const segments = transcriptionResult.segments.map(segment => ({
          transcription_id: transcriptionId,
          start: segment.start,
          end: segment.end,
          text: segment.text
        }));
        
        if (segments.length > 0) {
          await supabase
            .from("transcription_segments")
            .insert(segments);
        }
        
        // Limpar o arquivo temporário de áudio
        const fs = require('fs');
        if (fs.existsSync(audioFilePath)) {
          fs.unlinkSync(audioFilePath);
        }
          
      } catch (error) {
        console.error("Erro na transcrição:", error);
        await supabase
          .from("transcriptions")
          .update({ status: "failed" })
          .eq("id", transcriptionId);
      }
    }, 0);

    // Responder ao cliente imediatamente
    return NextResponse.json({
      success: true,
      message: "Transcrição iniciada com sucesso",
      data: {
        transcriptionId,
      }
    });
    
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 