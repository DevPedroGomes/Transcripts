import { NextRequest, NextResponse } from 'next/server';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { sanitizePrompt } from '@/lib/validation';
import { getClientIP, checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit(ip, 'reprocess', { maxRequests: 15, windowMs: 60 * 60 * 1000 });
  if (rateCheck.limited) {
    return NextResponse.json(
      { success: false, error: rateCheck.reason },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { transcriptRaw, prompt: rawPrompt } = body;

    if (!transcriptRaw || typeof transcriptRaw !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Transcrição original é obrigatória.' },
        { status: 400 }
      );
    }

    const prompt = sanitizePrompt(rawPrompt);
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt é obrigatório para reprocessamento.' },
        { status: 400 }
      );
    }

    const aiResult = await processTranscriptionWithAI(transcriptRaw, prompt);

    if (!aiResult.aiProcessed) {
      return NextResponse.json(
        { success: false, error: 'Falha ao processar com IA. Verifique se a chave da API esta configurada e tente novamente.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { transcript_processed: aiResult.text } });
  } catch (error) {
    console.error('Erro ao reprocessar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reprocessar transcrição. Tente novamente.' },
      { status: 500 }
    );
  }
}
