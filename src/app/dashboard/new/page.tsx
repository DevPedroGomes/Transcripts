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
import { LiveRecorder } from '@/components/transcription/LiveRecorder';
import { Header } from '@/components/layout/Header';
import { addTranscription } from '@/lib/storage';
import { sanitizePrompt } from '@/lib/validation';
import { FileAudio, Youtube, Mic } from 'lucide-react';
import type { TranscribeApiResponse, StoredTranscription } from '@/lib/types';

function NewTranscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type');
  const [activeTab, setActiveTab] = useState(typeParam || 'file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [filePrompt, setFilePrompt] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState('');

  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubePrompt, setYoutubePrompt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [isSubmittingYoutube, setIsSubmittingYoutube] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState('');

  // Realtime state
  const [realtimeTitle, setRealtimeTitle] = useState('');
  const [realtimePrompt, setRealtimePrompt] = useState('');
  const [realtimeTranscript, setRealtimeTranscript] = useState<string | null>(null);
  const [realtimeDuration, setRealtimeDuration] = useState(0);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [isSubmittingRealtime, setIsSubmittingRealtime] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('');

  useEffect(() => {
    if (typeParam && (typeParam === 'file' || typeParam === 'youtube' || typeParam === 'realtime')) {
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
      setFileStatus('Enviando arquivo...');

      try {
        const formData = new FormData();
        formData.append('title', fileTitle.trim());
        formData.append('file', selectedFile);
        if (filePrompt.trim()) {
          formData.append('prompt', filePrompt.trim());
        }

        setFileStatus('Transcrevendo áudio... isso pode levar alguns minutos.');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);

        const response = await fetch('/api/transcribe/file', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const payload: TranscribeApiResponse = await response.json();

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Falha ao processar o arquivo.');
        }

        setFileStatus('Salvando...');
        addTranscription(payload.data);
        router.push(`/dashboard/transcription/${payload.data.id}`);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setFileError('A requisição expirou. O arquivo pode ser muito grande. Tente novamente.');
        } else {
          setFileError(error instanceof Error ? error.message : 'Falha ao processar o arquivo.');
        }
      } finally {
        setIsSubmittingFile(false);
        setFileStatus('');
      }
    },
    [selectedFile, fileTitle, filePrompt, router]
  );

  const handleYoutubeUrlChange = useCallback((url: string) => {
    setYoutubeUrl(url);
    setYoutubeError(null);
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
      setYoutubeStatus('Baixando áudio do YouTube...');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);

        setYoutubeStatus('Baixando e transcrevendo... isso pode levar alguns minutos.');

        const response = await fetch('/api/transcribe/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: youtubeTitle.trim(),
            youtubeUrl,
            prompt: youtubePrompt.trim() || undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const payload: TranscribeApiResponse = await response.json();

        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.error || 'Falha ao processar o vídeo.');
        }

        setYoutubeStatus('Salvando...');
        addTranscription(payload.data);
        router.push(`/dashboard/transcription/${payload.data.id}`);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setYoutubeError('A requisição expirou. O vídeo pode ser muito longo. Tente novamente.');
        } else {
          setYoutubeError(error instanceof Error ? error.message : 'Falha ao processar o vídeo.');
        }
      } finally {
        setIsSubmittingYoutube(false);
        setYoutubeStatus('');
      }
    },
    [youtubeTitle, youtubeUrl, youtubePrompt, router]
  );

  const handleRealtimeComplete = useCallback((transcript: string, durationSeconds: number) => {
    setRealtimeTranscript(transcript);
    setRealtimeDuration(durationSeconds);
    setRealtimeError(null);
  }, []);

  const handleRealtimeSave = useCallback(async () => {
    if (!realtimeTitle.trim()) {
      setRealtimeError('Informe um titulo para a transcricao.');
      return;
    }
    if (!realtimeTranscript) {
      setRealtimeError('Grave uma transcricao primeiro.');
      return;
    }

    setIsSubmittingRealtime(true);
    setRealtimeError(null);

    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      let transcriptProcessed: string | undefined;

      const prompt = sanitizePrompt(realtimePrompt);
      if (prompt) {
        setRealtimeStatus('Processando com IA...');
        try {
          const res = await fetch('/api/reprocess', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcriptRaw: realtimeTranscript, prompt }),
          });
          const payload = await res.json();
          if (res.ok && payload.success) {
            transcriptProcessed = payload.data.transcript_processed;
          }
        } catch {
          /* proceed without AI processing */
        }
      }

      const transcription: StoredTranscription = {
        id,
        title: realtimeTitle.trim(),
        source: 'realtime',
        status: 'completed',
        prompt: prompt ?? undefined,
        transcript_raw: realtimeTranscript,
        transcript_processed: transcriptProcessed,
        duration_seconds: realtimeDuration,
        created_at: now,
        updated_at: now,
      };

      setRealtimeStatus('Salvando...');
      addTranscription(transcription);
      router.push(`/dashboard/transcription/${id}`);
    } catch (error) {
      setRealtimeError(error instanceof Error ? error.message : 'Erro ao salvar transcricao.');
    } finally {
      setIsSubmittingRealtime(false);
      setRealtimeStatus('');
    }
  }, [realtimeTitle, realtimePrompt, realtimeTranscript, realtimeDuration, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              &larr; Voltar para o Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Nova Transcrição</h1>
            <p className="text-gray-500 mt-1">Escolha o método de transcrição</p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-8 grid grid-cols-3 gap-4">
              <TabsTrigger
                value="file"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6"
              >
                <div className="flex flex-col items-center">
                  <FileAudio className="h-6 w-6 mb-2" />
                  Arquivo de Audio
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6"
              >
                <div className="flex flex-col items-center">
                  <Youtube className="h-6 w-6 mb-2" />
                  Video do YouTube
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="realtime"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-6"
              >
                <div className="flex flex-col items-center">
                  <Mic className="h-6 w-6 mb-2" />
                  Microfone ao Vivo
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-0">
              <Card>
                <form onSubmit={handleFileSubmit} encType="multipart/form-data" className="space-y-0">
                  <CardHeader>
                    <CardTitle>Transcrever Arquivo de Áudio</CardTitle>
                    <CardDescription>
                      Faça upload de um arquivo de áudio (MP3, WAV, M4A, OGG, FLAC, WebM, AAC) para transcrição.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fileError && (
                        <Alert variant="destructive">
                          <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                      )}

                      <div>
                        <Label htmlFor="file-title">Título da Transcrição</Label>
                        <Input
                          id="file-title"
                          placeholder="Ex: Reunião de Planejamento"
                          className="mt-1"
                          value={fileTitle}
                          onChange={(e) => setFileTitle(e.target.value)}
                          required
                        />
                      </div>

                      <FileUploader
                        onFileChange={handleFileChange}
                        onError={(message) => setFileError(message)}
                        acceptedFileTypes={['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm', '.aac']}
                        maxSizeMB={50}
                      />

                      <div>
                        <Label htmlFor="file-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea
                          id="file-prompt"
                          placeholder="Ex: Destaque os pontos relacionados a vendas e oportunidades de mercado"
                          className="mt-1 min-h-24"
                          value={filePrompt}
                          onChange={(e) => setFilePrompt(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    {isSubmittingFile && fileStatus && (
                      <p className="text-sm text-gray-500 w-full text-center animate-pulse">
                        {fileStatus}
                      </p>
                    )}
                    <div className="flex justify-between w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmittingFile}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmittingFile}>
                        {isSubmittingFile ? 'Processando...' : 'Iniciar Transcrição'}
                      </Button>
                    </div>
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

                      <div>
                        <Label htmlFor="youtube-title">Título da Transcrição</Label>
                        <Input
                          id="youtube-title"
                          placeholder="Ex: Tutorial de Next.js"
                          className="mt-1"
                          value={youtubeTitle}
                          onChange={(e) => setYoutubeTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="youtube-url">URL do YouTube</Label>
                        <YouTubeInput
                          inputId="youtube-url"
                          onUrlChange={handleYoutubeUrlChange}
                          onError={(message) => setYoutubeError(message)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="youtube-prompt">Prompt de Processamento (Opcional)</Label>
                        <Textarea
                          id="youtube-prompt"
                          placeholder="Ex: Extraia os principais conceitos e crie um resumo estruturado"
                          className="mt-1 min-h-24"
                          value={youtubePrompt}
                          onChange={(e) => setYoutubePrompt(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA irá processar a transcrição de acordo com seu prompt após concluir.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3">
                    {isSubmittingYoutube && youtubeStatus && (
                      <p className="text-sm text-gray-500 w-full text-center animate-pulse">
                        {youtubeStatus}
                      </p>
                    )}
                    <div className="flex justify-between w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmittingYoutube}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmittingYoutube}>
                        {isSubmittingYoutube ? 'Processando...' : 'Iniciar Transcrição'}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="realtime" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transcricao em Tempo Real</CardTitle>
                  <CardDescription>
                    Use seu microfone para transcrever audio ao vivo com IA.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realtimeError && (
                      <Alert variant="destructive">
                        <AlertDescription>{realtimeError}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="realtime-title">Titulo da Transcricao</Label>
                      <Input
                        id="realtime-title"
                        placeholder="Ex: Reuniao de Planejamento"
                        className="mt-1"
                        value={realtimeTitle}
                        onChange={(e) => setRealtimeTitle(e.target.value)}
                      />
                    </div>

                    <LiveRecorder onTranscriptionComplete={handleRealtimeComplete} />

                    {realtimeTranscript && (
                      <div>
                        <Label htmlFor="realtime-prompt">
                          Prompt de Processamento (Opcional)
                        </Label>
                        <Textarea
                          id="realtime-prompt"
                          placeholder="Ex: Faca um resumo estruturado com os pontos principais"
                          className="mt-1 min-h-24"
                          value={realtimePrompt}
                          onChange={(e) => setRealtimePrompt(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          A IA ira processar a transcricao de acordo com seu prompt ao salvar.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                {realtimeTranscript && (
                  <CardFooter className="flex flex-col gap-3">
                    {isSubmittingRealtime && realtimeStatus && (
                      <p className="text-sm text-gray-500 w-full text-center animate-pulse">
                        {realtimeStatus}
                      </p>
                    )}
                    <div className="flex justify-between w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmittingRealtime}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleRealtimeSave}
                        disabled={isSubmittingRealtime || !realtimeTitle.trim()}
                      >
                        {isSubmittingRealtime ? 'Salvando...' : 'Salvar Transcricao'}
                      </Button>
                    </div>
                  </CardFooter>
                )}
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
