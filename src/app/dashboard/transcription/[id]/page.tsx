"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export default function TranscriptionDetails({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("transcript");
  
  // Simulação de dados - seria substituído por uma chamada ao Supabase
  const transcription = {
    id: params.id,
    title: params.id === "1" 
      ? "Reunião de Planejamento Trimestral" 
      : "Tutorial de React - Curso Completo",
    source: params.id === "1" ? "file" : "youtube",
    status: "completed",
    created_at: "2023-06-12T10:30:00Z",
    duration_seconds: params.id === "1" ? 600 : 2700,
    transcript_raw: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, 
    vitae aliquam nisl nunc eu nisl. Nullam euismod, nisl eget aliquam ultricies, nunc nisl aliquet nunc, vitae aliquam nisl nunc eu nisl.
    
    Pessoa 1: Bom dia a todos, vamos começar nossa reunião de planejamento.
    
    Pessoa 2: Sim, precisamos discutir as metas para o próximo trimestre.
    
    Pessoa 1: Exatamente. Nossos resultados anteriores mostram que precisamos focar mais em vendas diretas.
    
    Pessoa 3: Concordo. Os números de conversão online caíram 5% no último mês.
    
    Pessoa 2: Isso pode estar relacionado à nova interface que implementamos.
    
    Pessoa 1: Bom ponto. Vamos analisar os dados de usabilidade e fazer ajustes se necessário.
    
    Pessoa 3: Também precisamos discutir o lançamento do novo produto em agosto.
    
    Pessoa 1: Sim, o departamento de desenvolvimento confirmou que estará pronto para testes em julho.
    
    Pessoa 2: Excelente. Marketing já começou a preparar a campanha?
    
    Pessoa 3: Sim, temos três conceitos diferentes sendo trabalhados. Apresentaremos na próxima semana.
    
    Pessoa 1: Perfeito. Alguma outra questão importante para discutirmos hoje?
    
    Pessoa 2: Precisamos definir o orçamento para o próximo trimestre.
    
    Pessoa 1: Vamos deixar isso para a segunda parte da reunião. Primeiro, vamos revisar os KPIs atuais.`.repeat(5),
    
    transcript_processed: params.id === "1" ? 
    `# Reunião de Planejamento Trimestral - Resumo
    
    ## Principais Pontos Financeiros:
    
    1. **Queda nas conversões online**
       - Redução de 5% no último mês
       - Possível relação com a nova interface implementada
       - Ação: Analisar dados de usabilidade e fazer ajustes
    
    2. **Planejamento orçamentário**
       - Necessidade de definir orçamento para o próximo trimestre
       - Pendente de discussão na segunda parte da reunião
    
    ## Estratégias de vendas
    
    - Foco maior em vendas diretas no próximo trimestre
    - Revisão dos KPIs atuais de vendas
    
    ## Lançamento de novo produto
    
    - Previsão: Agosto
    - Testes começam em julho
    - Marketing: 3 conceitos de campanha em desenvolvimento
    - Apresentação dos conceitos: próxima semana
    
    ## Próximos passos
    
    1. Análise de dados de usabilidade da interface
    2. Revisão dos KPIs atuais
    3. Definição do orçamento trimestral
    4. Avaliação dos conceitos de marketing` : 
    "Conteúdo processado do tutorial de React..."
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Link href="/dashboard">
              <span className="text-xl">MeetingsTranscript</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full h-8 w-8 bg-gray-200 flex items-center justify-center">
              <span className="font-medium text-sm">U</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
              ← Voltar para o Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{transcription.title}</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Compartilhar</Button>
                <Button variant="outline" size="sm">Exportar</Button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Completada
              </span>
              <span className="text-sm text-gray-500">
                {transcription.source === "file" ? "Arquivo de Áudio" : "Vídeo do YouTube"}
              </span>
              <span className="text-sm text-gray-500">
                {Math.floor(transcription.duration_seconds / 60)} minutos
              </span>
              <span className="text-sm text-gray-500">
                Criada em {new Date(transcription.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="transcript">Transcrição Processada</TabsTrigger>
              <TabsTrigger value="raw">Transcrição Original</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcript" className="mt-0">
              <div className="bg-white dark:bg-gray-900 border rounded-lg p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{transcription.transcript_processed}</pre>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="mt-0">
              <div className="bg-white dark:bg-gray-900 border rounded-lg p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{transcription.transcript_raw}</pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              Não está satisfeito com o resultado? Experimente processar novamente com um prompt diferente.
            </p>
            <Button variant="outline">Reprocessar com Novo Prompt</Button>
          </div>
        </div>
      </main>
    </div>
  );
} 