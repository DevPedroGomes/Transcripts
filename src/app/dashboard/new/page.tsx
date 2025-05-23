"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewTranscription() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get("type");
  const [activeTab, setActiveTab] = useState(typeParam || "file");

  useEffect(() => {
    if (typeParam && (typeParam === "file" || typeParam === "youtube" || typeParam === "live")) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/new?type=${value}`);
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
            <h1 className="text-3xl font-bold">Nova Transcrição</h1>
            <p className="text-gray-500 mt-1">Escolha o método de transcrição</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-8 grid grid-cols-3 gap-4">
              <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    className="h-6 w-6 mb-2">
                    <path d="M21 15V6"></path>
                    <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                    <path d="M12 12H3"></path>
                    <path d="M16 6H3"></path>
                    <path d="M12 18H3"></path>
                  </svg>
                  Arquivo de Áudio
                </div>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    className="h-6 w-6 mb-2">
                    <path d="m7 18-4-4 4-4"></path>
                    <path d="m17 6 4 4-4 4"></path>
                    <path d="m14 9-4 6"></path>
                  </svg>
                  Vídeo do YouTube
                </div>
              </TabsTrigger>
              <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    className="h-6 w-6 mb-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  Ao Vivo
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transcrever Arquivo de Áudio</CardTitle>
                  <CardDescription>
                    Faça upload de um arquivo MP3 ou WAV para transcrição.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título da Transcrição</Label>
                        <Input id="title" placeholder="Ex: Reunião de Planejamento" className="mt-1" />
                      </div>
                      
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                            className="h-10 w-10 text-gray-400 mb-4">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                          <p className="mb-2 text-sm font-semibold">Clique para fazer upload ou arraste e solte</p>
                          <p className="text-xs text-gray-500">MP3 ou WAV (Max. 500MB)</p>
                        </div>
                        <input type="file" className="hidden" accept=".mp3,.wav" />
                      </div>
                      
                      <div>
                        <Label htmlFor="prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea 
                          id="prompt" 
                          placeholder="Ex: Destaque os pontos relacionados a vendas e oportunidades de mercado" 
                          className="mt-1 min-h-24" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
                  <Button>Iniciar Transcrição</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="youtube" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transcrever Vídeo do YouTube</CardTitle>
                  <CardDescription>
                    Cole a URL de um vídeo do YouTube para transcrever seu áudio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="youtube-title">Título da Transcrição</Label>
                        <Input id="youtube-title" placeholder="Ex: Tutorial de Next.js" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="youtube-url">URL do YouTube</Label>
                        <Input id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="youtube-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea 
                          id="youtube-prompt" 
                          placeholder="Ex: Extraia os principais conceitos e crie um resumo estruturado" 
                          className="mt-1 min-h-24" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
                  <Button>Iniciar Transcrição</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="live" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transcrição ao Vivo</CardTitle>
                  <CardDescription>
                    Inicie uma gravação ao vivo para transcrever em tempo real.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="live-title">Título da Transcrição</Label>
                        <Input id="live-title" placeholder="Ex: Reunião com o Cliente" className="mt-1" />
                      </div>
                      
                      <div>
                        <Label htmlFor="live-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea 
                          id="live-prompt" 
                          placeholder="Ex: Foco em ações e próximos passos mencionados" 
                          className="mt-1 min-h-24" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-sm mb-2">Ao clicar em "Iniciar Gravação", seu microfone será ativado</p>
                        <p className="text-xs text-gray-500">
                          Você pode pausar ou parar a gravação a qualquer momento
                        </p>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/dashboard")}>Cancelar</Button>
                  <Button>Iniciar Gravação</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 