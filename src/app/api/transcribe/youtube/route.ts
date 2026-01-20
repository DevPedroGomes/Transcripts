import { NextRequest, NextResponse } from "next/server";
import { processTranscriptionWithAI } from "@/lib/ai/openai";
import { downloadYouTubeAudio, transcribeAudio } from "@/lib/ai/whisper";
import { inngest } from "@/lib/inngest/client";
import { randomUUID } from "crypto";
import ytdl from "ytdl-core";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sanitizePrompt,
  validateTitle,
  validateYouTubeUrl,
  MAX_VIDEO_DURATION_FREE,
  MAX_VIDEO_DURATION_PAID,
  MONTHLY_LIMIT_FREE,
} from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Processar o corpo da requisição
    const body = await request.json();
    const { title: rawTitle, youtubeUrl: rawYoutubeUrl, prompt: rawPrompt } = body;

    // Validate and sanitize inputs
    const title = validateTitle(rawTitle);
    const youtubeUrl = validateYouTubeUrl(rawYoutubeUrl);
    const prompt = sanitizePrompt(rawPrompt);

    if (!title) {
      return NextResponse.json(
        { error: 'Título inválido. Deve ter entre 3 e 200 caracteres.' },
        { status: 400 }
      );
    }

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'URL do YouTube inválida. Verifique se o link está correto.' },
        { status: 400 }
      );
    }

    // Obter informações do usuário
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    // Verificar duração do vídeo
    const maxDuration = profileData.has_active_subscription
      ? MAX_VIDEO_DURATION_PAID
      : MAX_VIDEO_DURATION_FREE;

    let videoDuration = 0;
    try {
      const videoInfo = await ytdl.getInfo(youtubeUrl);
      videoDuration = parseInt(videoInfo.videoDetails.lengthSeconds);

      if (videoDuration > maxDuration) {
        const maxMinutes = Math.floor(maxDuration / 60);
        return NextResponse.json(
          { error: `O vídeo excede o limite de ${maxMinutes} minutos do seu plano` },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Erro ao verificar informações do vídeo:', error);
      return NextResponse.json(
        {
          error:
            'Não foi possível acessar o vídeo. Verifique se o link está correto e o vídeo é público.',
        },
        { status: 400 }
      );
    }

    // Verificar limites de transcrições para usuários gratuitos
    if (!profileData.has_active_subscription) {
      const { count } = await supabase
        .from('transcriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      if ((count || 0) >= MONTHLY_LIMIT_FREE) {
        return NextResponse.json(
          {
            error: `Você atingiu o limite de ${MONTHLY_LIMIT_FREE} transcrições do plano gratuito(últimos 30 dias)`,
          },
          { status: 403 }
        );
      }
    }

    // Criar registro de transcrição no banco
    const transcriptionId = randomUUID();

    const { error: insertError } = await supabase.from('transcriptions').insert({
      id: transcriptionId,
      user_id: session.user.id,
      title,
      source: 'youtube',
      status: 'processing',
      youtube_url: youtubeUrl,
      prompt: prompt || null,
    });

    if (insertError) {
      return NextResponse.json(
        { error: 'Falha ao criar registro de transcrição' },
        { status: 500 }
      );
    }

    // Iniciar processo de transcrição em segundo plano via Inngest
    await inngest.send({
      name: "transcription/process-youtube",
      data: {
        transcriptionId,
        youtubeUrl,
        prompt: prompt || null,
        userId: session.user.id,
      },
    });

    // Responder ao cliente imediatamente
    return NextResponse.json({
      success: true,
      message: 'Transcrição iniciada com sucesso',
      data: {
        transcriptionId,
      },
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
