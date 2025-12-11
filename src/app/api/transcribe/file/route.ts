import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { processTranscriptionWithAI } from '@/lib/ai/openai';
import { transcribeAudio } from "@/lib/ai/whisper";
import { inngest } from "@/lib/inngest/client";
import { randomUUID } from "crypto";
import {
  sanitizePrompt,
  validateTitle,
  isValidAudioFile,
  MAX_FILE_SIZE_FREE,
  MAX_FILE_SIZE_PAID,
  MONTHLY_LIMIT_FREE,
} from '@/lib/validation';

async function ensureAudioBucket() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada para criar o bucket de áudio.');
  }
  const serviceSupabase = getServiceSupabase();

  const { data: bucket, error: bucketError } =
    await serviceSupabase.storage.getBucket('audio-files');
  if (bucket || !bucketError) {
    return serviceSupabase;
  }

  // Create bucket as PRIVATE for security
  const { error: createError } = await serviceSupabase.storage.createBucket('audio-files', {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB max
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ],
  });

  // Se o bucket já existir, ignoramos o erro; qualquer outro erro é repassado
  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError;
  }

  return serviceSupabase;
}

/**
 * Generate a signed URL for private file access
 * @param filePath - Path to the file in the bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
async function getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase.storage
    .from('audio-files')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Delete audio file from storage after transcription is complete
 * @param filePath - Path to the file in the bucket
 */
async function deleteAudioFile(filePath: string): Promise<boolean> {
  try {
    const serviceSupabase = getServiceSupabase();

    const { error } = await serviceSupabase.storage.from('audio-files').remove([filePath]);

    if (error) {
      console.error('Error deleting audio file:', error);
      return false;
    }

    console.log(`Audio file deleted successfully: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error in deleteAudioFile:', error);
    return false;
  }
}

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

    // Processar o formulário
    const formData = await request.formData();
    const rawTitle = formData.get('title') as string;
    const rawPrompt = formData.get('prompt') as string;
    const audioFile = formData.get('file') as File;

    // Validate and sanitize inputs
    const title = validateTitle(rawTitle);
    const prompt = sanitizePrompt(rawPrompt);

    if (!title) {
      return NextResponse.json(
        { error: 'Título inválido. Deve ter entre 3 e 200 caracteres.' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Arquivo de áudio é obrigatório' }, { status: 400 });
    }

    // Validate audio file type
    if (!isValidAudioFile(audioFile)) {
      return NextResponse.json(
        {
          error:
            'Formato de arquivo inválido. Formatos aceitos: MP3, WAV, WebM, OGG, FLAC, M4A, AAC',
        },
        { status: 400 }
      );
    }

    // Verificar limites do usuário
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profileData) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    // Verificar limites com base no plano do usuário
    const maxFileSize = profileData.has_active_subscription
      ? MAX_FILE_SIZE_PAID
      : MAX_FILE_SIZE_FREE;

    // Verificar tamanho do arquivo
    if (audioFile.size > maxFileSize) {
      const maxMB = Math.floor(maxFileSize / (1024 * 1024));
      return NextResponse.json(
        { error: `O arquivo excede o limite de ${maxMB}MB do seu plano` },
        { status: 403 }
      );
    }

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
      source: 'file',
      status: 'processing',
      file_name: audioFile.name,
      prompt: prompt || null,
    });

    if (insertError) {
      return NextResponse.json(
        { error: 'Falha ao criar registro de transcrição' },
        { status: 500 }
      );
    }

    // Upload do arquivo para o Supabase Storage
    const fileExtension = audioFile.name.split('.').pop();
    const filePath = `${session.user.id}/${transcriptionId}.${fileExtension}`;

    const serviceSupabase = await ensureAudioBucket();

    const { error: uploadError } = await serviceSupabase.storage
      .from('audio-files')
      .upload(filePath, audioFile);

    if (uploadError) {
      await supabase.from('transcriptions').update({ status: 'failed' }).eq('id', transcriptionId);

      return NextResponse.json({ error: 'Falha ao fazer upload do arquivo' }, { status: 500 });
    }

    // Get signed URL for the file (valid for 2 hours for processing)
    const signedUrl = await getSignedUrl(filePath, 7200);

    if (!signedUrl) {
      await supabase.from('transcriptions').update({ status: 'failed' }).eq('id', transcriptionId);

      return NextResponse.json(
        { error: 'Falha ao gerar URL de acesso ao arquivo' },
        { status: 500 }
      );
    }

    // Store the file path (not the signed URL, as it expires)
    await supabase.from('transcriptions').update({ file_url: filePath }).eq('id', transcriptionId);

    // Iniciar processo de transcrição em segundo plano via Inngest
    await inngest.send({
      name: "transcription/process-file",
      data: {
        transcriptionId,
        fileUrl: filePath,
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
