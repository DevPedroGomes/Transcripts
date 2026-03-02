import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

const transcriptionPrompt = PromptTemplate.fromTemplate(`
Você é um assistente especializado em processar transcrições de reuniões e conversas.
Sua tarefa é analisar a transcrição abaixo e organizá-la de acordo com o prompt do usuário,
destacando os pontos relevantes e criando um resumo estruturado.

Transcrição:
{transcription}

Instrução do usuário:
{prompt}
`);

function getChain() {
  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
    temperature: 0.5,
  });

  return RunnableSequence.from([transcriptionPrompt, model, new StringOutputParser()]);
}

export async function processTranscriptionWithAI(rawTranscription: string, prompt: string) {
  const chain = getChain();

  const result = await chain.invoke({
    transcription: rawTranscription,
    prompt:
      prompt ||
      'Faça um resumo estruturado da conversa, destacando pontos importantes e ações a serem tomadas',
  });

  return result;
}
