import { NextRequest, NextResponse } from 'next/server';
import { processTranscriptionWithAI } from '@/lib/ai/groq';
import { sanitizePrompt } from '@/lib/validation';

export async function POST(request: NextRequest) {
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

    const result = await processTranscriptionWithAI(transcriptRaw, prompt);

    return NextResponse.json({ success: true, data: { transcript_processed: result } });
  } catch (error) {
    console.error('Erro ao reprocessar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao reprocessar transcrição. Tente novamente.' },
      { status: 500 }
    );
  }
}
