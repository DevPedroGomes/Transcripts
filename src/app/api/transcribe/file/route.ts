import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/client";
import { processTranscriptionWithAI } from "@/lib/ai/openai";
import { transcribeAudio } from "@/lib/ai/whisper";
import { randomUUID } from "crypto";

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

    // Processar o formulário
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const prompt = formData.get("prompt") as string;
    const audioFile = formData.get("file") as File;

    if (!title || !audioFile) {
      return NextResponse.json(
        { error: "Título e arquivo de áudio são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar limites do usuário
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
      
      // Verificar tamanho do arquivo (limite de 10 minutos para plano gratuito ~ 10MB para arquivo de 128kbps)
      if (audioFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "O plano gratuito permite arquivos de até 10MB (aproximadamente 10 minutos)" },
          { status: 403 }
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
        source: "file",
        status: "processing",
        file_name: audioFile.name,
        prompt: prompt || null,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Falha ao criar registro de transcrição" },
        { status: 500 }
      );
    }

    // Upload do arquivo para o Supabase Storage
    const fileExtension = audioFile.name.split(".").pop();
    const filePath = `${session.user.id}/${transcriptionId}.${fileExtension}`;
    
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("audio-files")
      .upload(filePath, audioFile);

    if (uploadError) {
      await supabase
        .from("transcriptions")
        .update({ status: "failed" })
        .eq("id", transcriptionId);
        
      return NextResponse.json(
        { error: "Falha ao fazer upload do arquivo" },
        { status: 500 }
      );
    }

    // Obter a URL pública do arquivo
    const { data: { publicUrl } } = supabase.storage
      .from("audio-files")
      .getPublicUrl(filePath);

    // Atualizar a URL do arquivo na transcrição
    await supabase
      .from("transcriptions")
      .update({ file_url: publicUrl })
      .eq("id", transcriptionId);

    // Iniciar processo de transcrição em segundo plano
    // Esta implementação usa setTimeout, mas em produção você usaria
    // um sistema de filas como Bull ou um worker separado
    setTimeout(async () => {
      try {
        // Transcrever o áudio
        const transcriptionResult = await transcribeAudio(publicUrl);
        
        // Processar com IA se houver um prompt
        let processedTranscript = null;
        if (prompt) {
          processedTranscript = await processTranscriptionWithAI(
            transcriptionResult.text,
            prompt
          );
        }
        
        // Obter duração aproximada pelo arquivo de áudio
        // Para simplificar, vamos usar o número de segmentos como estimativa
        const durationSeconds = transcriptionResult.segments.length > 0
          ? Math.ceil(Math.max(...transcriptionResult.segments.map(s => s.end)))
          : Math.ceil(audioFile.size / 16000); // estimativa simples
        
        // Atualizar o registro com a transcrição completa
        await supabase
          .from("transcriptions")
          .update({
            status: "completed",
            transcript_raw: transcriptionResult.text,
            transcript_processed: processedTranscript,
            duration_seconds: durationSeconds,
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