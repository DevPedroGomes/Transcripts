import { NextRequest, NextResponse } from 'next/server';
import { processTranscriptionWithAI } from '@/lib/ai/openai';
import { randomUUID } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sanitizePrompt, validateTitle, isValidUUID, MONTHLY_LIMIT_FREE } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Processar o corpo da requisição
    const body = await request.json();
    const { title: rawTitle, prompt: rawPrompt } = body;

    // Validate and sanitize inputs
    const title = validateTitle(rawTitle);
    const prompt = sanitizePrompt(rawPrompt);

    if (!title) {
      return NextResponse.json(
        { error: 'Título inválido. Deve ter entre 3 e 200 caracteres.' },
        { status: 400 }
      );
    }

    // Verificar limites do usuário
    // Aqui você verificaria a assinatura do usuário e seus limites

    // Obter informações do usuario
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    // Verificar limites com base no plano do usuário
    if (!profileData.has_active_subscription) {
      // Verificar se o usuário gratuito ainda tem transcrições disponíveis
      const { count } = await supabase
        .from('transcriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString());

      if ((count || 0) >= MONTHLY_LIMIT_FREE) {
        return NextResponse.json(
          {
            error: `Você atingiu o limite de ${MONTHLY_LIMIT_FREE} transcrições do plano gratuito (últimos 30 dias)`,
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
      source: 'live',
      status: 'pending', // Começa como pending, será atualizado para "processing" quando iniciar a gravação
      prompt: prompt || null,
    });

    if (insertError) {
      return NextResponse.json(
        { error: 'Falha ao criar registro de transcrição' },
        { status: 500 }
      );
    }

    // Para transcrição ao vivo, apenas criamos o registro e retornamos o ID
    // O processo real de gravação e transcrição acontece no cliente via WebSockets

    // Responder ao cliente
    return NextResponse.json({
      success: true,
      message: 'Sessão de transcrição ao vivo criada',
      data: {
        transcriptionId,
      },
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Rota para processar o resultado de uma transcrição ao vivo após finalização
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Processar o corpo da requisição
    const body = await request.json();
    const { transcriptionId, transcriptText, audioDuration } = body;

    // Validate inputs
    if (!transcriptionId || !isValidUUID(transcriptionId)) {
      return NextResponse.json({ error: 'ID de transcrição inválido' }, { status: 400 });
    }

    if (
      !transcriptText ||
      typeof transcriptText !== 'string' ||
      transcriptText.trim().length === 0
    ) {
      return NextResponse.json({ error: 'Texto da transcrição é obrigatório' }, { status: 400 });
    }

    // Validate audio duration if provided
    const duration = typeof audioDuration === 'number' && audioDuration > 0 ? audioDuration : 0;

    // Verificar se a transcrição existe e pertence ao usuário
    const { data: transcription, error: fetchError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !transcription) {
      return NextResponse.json({ error: 'Transcrição não encontrada' }, { status: 404 });
    }

    // Processar com IA se houver um prompt
    let processedTranscript = null;
    if (transcription.prompt) {
      processedTranscript = await processTranscriptionWithAI(transcriptText, transcription.prompt);
    }

    // Atualizar o registro com a transcrição
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update({
        status: 'completed',
        transcript_raw: transcriptText.trim(),
        transcript_processed: processedTranscript,
        duration_seconds: duration,
      })
      .eq('id', transcriptionId);

    if (updateError) {
      return NextResponse.json({ error: 'Falha ao atualizar transcrição' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Transcrição finalizada com sucesso',
      data: {
        processedTranscript,
      },
    });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
