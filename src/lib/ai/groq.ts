import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Você é um assistente especializado em processar transcrições de reuniões e conversas.
Sua tarefa é analisar a transcrição fornecida e organizá-la de acordo com o prompt do usuário,
destacando os pontos relevantes e criando um resumo estruturado.`;

export async function processTranscriptionWithAI(rawTranscription: string, prompt: string) {
  const userPrompt = prompt
    || 'Faça um resumo estruturado da conversa, destacando pontos importantes e ações a serem tomadas';

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Transcrição:\n${rawTranscription}\n\nInstrução do usuário:\n${userPrompt}` },
    ],
  });

  return response.choices[0]?.message?.content ?? '';
}
