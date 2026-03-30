import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groq;
}

const SYSTEM_PROMPT = `Você é um assistente especializado em processar transcrições de reuniões e conversas.
Sua tarefa é analisar a transcrição fornecida e organizá-la de acordo com o prompt do usuário,
destacando os pontos relevantes e criando um resumo estruturado.`;

export type AIProcessingResult = {
  text: string;
  aiProcessed: boolean;
};

export async function processTranscriptionWithAI(rawTranscription: string, prompt: string): Promise<AIProcessingResult> {
  if (!process.env.GROQ_API_KEY) {
    console.warn('GROQ_API_KEY not configured, returning raw transcript');
    return { text: rawTranscription, aiProcessed: false };
  }

  const userPrompt = prompt
    || 'Faça um resumo estruturado da conversa, destacando pontos importantes e ações a serem tomadas';

  try {
    const response = await getGroqClient().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transcrição:\n${rawTranscription}\n\nInstrução do usuário:\n${userPrompt}` },
      ],
    });

    const result = response.choices[0]?.message?.content ?? '';
    return { text: result, aiProcessed: true };
  } catch (error) {
    console.error('Groq AI processing failed, returning raw transcript:', error);
    return { text: rawTranscription, aiProcessed: false };
  }
}
