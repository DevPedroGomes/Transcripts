// Despite the filename, this module now talks to OpenRouter (OpenAI-compatible).
// Filename kept to avoid touching every import site. The `groq` token-budget
// bucket key is also kept for the same reason — it's an internal tracker name.
//
// Rollback path: set LLM_PROVIDER=groq and ensure GROQ_API_KEY is configured;
// the legacy code path is preserved below.
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { sanitize } from '../log-sanitize';

type ChatClient = {
  chat: { completions: { create: (args: any) => Promise<any> } };
};

let client: ChatClient | null = null;
let activeModel = '';

function getClient(): ChatClient {
  if (client) return client;

  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase();

  if (provider === 'openrouter' && process.env.OPENROUTER_API_KEY) {
    activeModel = process.env.LLM_MODEL || 'deepseek/deepseek-chat';
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://transcripts.pgdev.com.br',
        'X-Title': 'qa-pgdev transcripts',
      },
    }) as unknown as ChatClient;
    return client;
  }

  if (provider === 'groq' && process.env.GROQ_API_KEY) {
    activeModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    client = new Groq({ apiKey: process.env.GROQ_API_KEY }) as unknown as ChatClient;
    return client;
  }

  throw new Error(
    'No LLM provider configured. Set LLM_PROVIDER=openrouter + OPENROUTER_API_KEY, or LLM_PROVIDER=groq + GROQ_API_KEY.',
  );
}

const SYSTEM_PROMPT = `Você é um assistente especializado em processar transcrições de reuniões e conversas.
Sua tarefa é analisar a transcrição fornecida e organizá-la de acordo com o prompt do usuário,
destacando os pontos relevantes e criando um resumo estruturado.`;

export type AIProcessingResult = {
  text: string;
  aiProcessed: boolean;
  usageTokens?: number;
};

function isProviderConfigured(): boolean {
  const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase();
  if (provider === 'openrouter') return !!process.env.OPENROUTER_API_KEY;
  if (provider === 'groq') return !!process.env.GROQ_API_KEY;
  return false;
}

export async function processTranscriptionWithAI(
  rawTranscription: string,
  prompt: string,
): Promise<AIProcessingResult> {
  if (!isProviderConfigured()) {
    console.warn('No LLM provider configured, returning raw transcript');
    return { text: rawTranscription, aiProcessed: false };
  }

  const userPrompt =
    prompt ||
    'Faça um resumo estruturado da conversa, destacando pontos importantes e ações a serem tomadas';

  try {
    const c = getClient();
    const response = await c.chat.completions.create({
      model: activeModel,
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transcrição:\n${rawTranscription}\n\nInstrução do usuário:\n${userPrompt}` },
      ],
    });

    const result = response.choices[0]?.message?.content ?? '';
    const usageTokens = response.usage?.total_tokens;
    return { text: result, aiProcessed: true, usageTokens };
  } catch (error) {
    console.error('LLM processing failed, returning raw transcript:', sanitize(String(error)));
    return { text: rawTranscription, aiProcessed: false };
  }
}
