'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams, useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUploader } from '@/components/transcription/FileUploader';
import { YouTubeInput } from '@/components/transcription/YouTubeInput';

function NewTranscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type');
  const [activeTab, setActiveTab] = useState(typeParam || 'file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [filePrompt, setFilePrompt] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);

  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubePrompt, setYoutubePrompt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeSuccess, setYoutubeSuccess] = useState<string | null>(null);
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false);

  useEffect(() => {
    if (typeParam && (typeParam === 'file' || typeParam === 'youtube')) {
      setActiveTab(typeParam);
    }
  }, [typeParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/dashboard/new?type=${value}`);
  };

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedFile(file);
    setFileError(null);
    if (!file) {
      setFileSuccess(null);
    }
  }, []);

  const handleFileSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedFile) {
        setFileError('Selecione um arquivo de áudio antes de iniciar a transcrição.');
        return;
      }

      if (!fileTitle.trim()) {
        setFileError('Informe um título para a transcrição.');
        return;
      }

      setIsSubmittingFile(true);
      setFileError(null);
      setFileSuccess(null);

      try {
        const formData = new FormData();
        formData.append('title', fileTitle.trim());
        formData.append('file', selectedFile);
        if (filePrompt.trim()) {
          formData.append('prompt', filePrompt.trim());
        }

        const response = await fetch('/api/transcribe/file', {
          method: 'POST',
          body: formData,
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao iniciar a transcrição do arquivo.');
        }

        const transcriptionId = payload?.data?.transcriptionId as string | undefined;
        setFileSuccess('Transcrição iniciada! Redirecionando para o acompanhamento...');

        if (transcriptionId) {
          setTimeout(() => router.push(`/dashboard/transcription/${transcriptionId}`), 1200);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao iniciar a transcrição do arquivo.';
        setFileError(message);
      } finally {
        setIsSubmittingFile(false);
      }
    },
    [selectedFile, fileTitle, filePrompt, router]
  );

  const handleYoutubeUrlChange = useCallback((url: string) => {
    setYoutubeUrl(url);
    setYoutubeError(null);
    setYoutubeSuccess(null);
  }, []);

  const handleYoutubeSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!youtubeTitle.trim()) {
        setYoutubeError('Informe um título para a transcrição.');
        return;
      }

      if (!youtubeUrl) {
        setYoutubeError('Forneça uma URL válida do YouTube.');
        return;
      }

      setIsSubmittingYoutube(true);
      setYoutubeError(null);
      setYoutubeSuccess(null);

      try {
        const response = await fetch('/api/transcribe/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: youtubeTitle.trim(),
            youtubeUrl,
            prompt: youtubePrompt.trim() || undefined,
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao iniciar a transcrição do vídeo.');
        }

        const transcriptionId = payload?.data?.transcriptionId as string | undefined;
        setYoutubeSuccess('Transcrição iniciada! Redirecionando para o acompanhamento...');

        if (transcriptionId) {
          setTimeout(() => router.push(`/dashboard/transcription/${transcriptionId}`), 1200);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao iniciar a transcrição do vídeo.';
        setYoutubeError(message);
      } finally {
        setIsSubmittingYoutube(false);
      }
    },
    [youtubeTitle, youtubeUrl, youtubePrompt, router]
  );

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
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Voltar para o Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Nova Transcrição</h1>
            <p className="text-gray-500 mt-1">Escolha o método de transcrição</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-8 grid grid-cols-2 gap-4">
              <TabsTrigger
                value="file"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6"
              >
                <div className="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 mb-2"
                  >
                    <path d="M21 15V6"></path>
                    <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                    <path d="M12 12H3"></path>
                    <path d="M16 6H3"></path>
                    <path d="M12 18H3"></path>
                  </svg>
                  Arquivo de Áudio
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6"
              >
                <div className="flex flex-col items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 mb-2"
                  >
                    <path d="m7 18-4-4 4-4"></path>
                    <path d="m17 6 4 4-4 4"></path>
                    <path d="m14 9-4 6"></path>
                  </svg>
                  Vídeo do YouTube
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-0">
              <Card>
                <form
                  onSubmit={handleFileSubmit}
                  encType="multipart/form-data"
                  className="space-y-0"
                >
                  <CardHeader>
                    <CardTitle>Transcrever Arquivo de Áudio</CardTitle>
                    <CardDescription>
                      Faça upload de um arquivo MP3 ou WAV para transcrição.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fileError && (
                        <Alert variant="destructive">
                          <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                      )}
                      {fileSuccess && (
                        <Alert>
                          <AlertDescription>{fileSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="file-title">Título da Transcrição</Label>
                        <Input
                          id="file-title"
                          placeholder="Ex: Reunião de Planejamento"
                          className="mt-1"
                          value={fileTitle}
                          onChange={(event) => setFileTitle(event.target.value)}
                          required
                        />
                      </div>

                      <FileUploader
                        onFileChange={handleFileChange}
                        onError={(message) => {
                          setFileError(message);
                          setFileSuccess(null);
                        }}
                        acceptedFileTypes={['.mp3', '.wav', '.m4a', '.ogg']}
                        maxSizeMB={500}
                      />

                      <div>
                        <Label htmlFor="file-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea
                          id="file-prompt"
                          placeholder="Ex: Destaque os pontos relacionados a vendas e oportunidades de mercado"
                          className="mt-1 min-h-24"
                          value={filePrompt}
                          onChange={(event) => setFilePrompt(event.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmittingFile}>
                      {isSubmittingFile ? 'Enviando...' : 'Iniciar Transcrição'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="youtube" className="mt-0">
              <Card>
                <form onSubmit={handleYoutubeSubmit} className="space-y-0">
                  <CardHeader>
                    <CardTitle>Transcrever Vídeo do YouTube</CardTitle>
                    <CardDescription>
                      Cole a URL de um vídeo do YouTube para transcrever seu áudio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {youtubeError && (
                        <Alert variant="destructive">
                          <AlertDescription>{youtubeError}</AlertDescription>
                        </Alert>
                      )}
                      {youtubeSuccess && (
                        <Alert>
                          <AlertDescription>{youtubeSuccess}</AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="youtube-title">Título da Transcrição</Label>
                        <Input
                          id="youtube-title"
                          placeholder="Ex: Tutorial de Next.js"
                          className="mt-1"
                          value={youtubeTitle}
                          onChange={(event) => setYoutubeTitle(event.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="youtube-url">URL do YouTube</Label>
                        <YouTubeInput
                          inputId="youtube-url"
                          onUrlChange={handleYoutubeUrlChange}
                          onError={(message) => {
                            setYoutubeError(message);
                            setYoutubeSuccess(null);
                          }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="youtube-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea
                          id="youtube-prompt"
                          placeholder="Ex: Extraia os principais conceitos e crie um resumo estruturado"
                          className="mt-1 min-h-24"
                          value={youtubePrompt}
                          onChange={(event) => setYoutubePrompt(event.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard')}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmittingYoutube}>
                      {isSubmittingYoutube ? 'Enviando...' : 'Iniciar Transcrição'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}

export default function NewTranscription() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewTranscriptionContent />
    </Suspense>
  );
}
