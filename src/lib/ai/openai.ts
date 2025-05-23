import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "langchain/schema/output_parser";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";

// Configurar cliente OpenAI com API key
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4-turbo",
  temperature: 0.5,
});

// Criar template para processamento de transcrições
const transcriptionPrompt = PromptTemplate.fromTemplate(`
Você é um assistente especializado em processar transcrições de reuniões e conversas. 
Sua tarefa é analisar a transcrição abaixo e organizá-la de acordo com o prompt do usuário, 
destacando os pontos relevantes e criando um resumo estruturado.

Transcrição:
{transcription}

Instrução do usuário:
{prompt}
`);

// Definir o pipeline completo
const transcriptionChain = RunnableSequence.from([
  transcriptionPrompt,
  model,
  new StringOutputParser(),
]);

export async function processTranscriptionWithAI(rawTranscription: string, prompt: string) {
  try {
    // Processar a transcrição com o pipeline LangChain
    const result = await transcriptionChain.invoke({
      transcription: rawTranscription,
      prompt: prompt || "Faça um resumo estruturado da conversa, destacando pontos importantes e ações a serem tomadas",
    });

    return result;
  } catch (error) {
    console.error('Erro ao processar transcrição com AI:', error);
    throw new Error('Falha ao processar transcrição com IA');
  }
} 