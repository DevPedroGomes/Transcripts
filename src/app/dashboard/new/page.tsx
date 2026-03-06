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
import { FileAudio, Youtube, Mic, ArrowLeft } from 'lucide-react';
import type { TranscribeApiResponse, StoredTranscription } from '@/lib/types';

function NewTranscriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = searchParams.get('type');
  const [activeTab, setActiveTab] = useState(typeParam || 'file');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [filePrompt, setFilePrompt] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState('');

  // YouTube state
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
        setFileError('Selecione um arquivo de audio.');
        return;
      }
      if (!fileTitle.trim()) {
        setFileError('Informe um titulo.');
        return;
      }

      setIsSubmittingFile(true);
      setFileError(null);
      setFileStatus('Enviando arquivo...');

      try {
        const formData = new FormData();
        formData.append('title', fileTitle.trim());
        formData.append('file', selectedFile);
        if (filePrompt.trim()) formData.append('prompt', filePrompt.trim());

        setFileStatus('Transcrevendo audio... isso pode levar alguns minutos.');
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
          setFileError('A requisicao expirou. Tente novamente.');
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
        setYoutubeError('Informe um titulo.');
        return;
      }
      if (!youtubeUrl) {
        setYoutubeError('Forneca uma URL valida do YouTube.');
        return;
      }

      setIsSubmittingYoutube(true);
      setYoutubeError(null);
      setYoutubeStatus('Baixando e transcrevendo... isso pode levar alguns minutos.');

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000);

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
          throw new Error(payload.error || 'Falha ao processar o video.');
        }

        setYoutubeStatus('Salvando...');
        addTranscription(payload.data);
        router.push(`/dashboard/transcription/${payload.data.id}`);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setYoutubeError('A requisicao expirou. Tente novamente.');
        } else {
          setYoutubeError(error instanceof Error ? error.message : 'Falha ao processar o video.');
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
      setRealtimeError('Informe um titulo.');
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
        } catch { /* proceed without AI processing */ }
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
      setRealtimeError(error instanceof Error ? error.message : 'Erro ao salvar.');
    } finally {
      setIsSubmittingRealtime(false);
      setRealtimeStatus('');
    }
  }, [realtimeTitle, realtimePrompt, realtimeTranscript, realtimeDuration, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-3xl py-8">
          {/* Back link + title */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Nova Transcricao</h1>
            <p className="mt-1 text-sm text-muted-foreground">Escolha o metodo de transcricao</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-3">
              <TabsTrigger value="file" className="gap-2 py-3">
                <FileAudio className="h-4 w-4" />
                <span className="hidden sm:inline">Arquivo</span>
              </TabsTrigger>
              <TabsTrigger value="youtube" className="gap-2 py-3">
                <Youtube className="h-4 w-4" />
                <span className="hidden sm:inline">YouTube</span>
              </TabsTrigger>
              <TabsTrigger value="realtime" className="gap-2 py-3">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Ao Vivo</span>
              </TabsTrigger>
            </TabsList>

            {/* FILE TAB */}
            <TabsContent value="file" className="mt-0">
              <Card>
                <form onSubmit={handleFileSubmit} encType="multipart/form-data">
                  <CardHeader>
                    <CardTitle>Transcrever Arquivo de Audio</CardTitle>
                    <CardDescription>
                      MP3, WAV, M4A, OGG, FLAC, WebM, AAC (max 50MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {fileError && (
                      <Alert variant="destructive">
                        <AlertDescription>{fileError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="file-title">Titulo</Label>
                      <Input
                        id="file-title"
                        placeholder="Ex: Reuniao de Planejamento"
                        value={fileTitle}
                        onChange={(e) => setFileTitle(e.target.value)}
                        required
                      />
                    </div>
                    <FileUploader
                      onFileChange={handleFileChange}
                      onError={(msg) => setFileError(msg)}
                      acceptedFileTypes={['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm', '.aac']}
                      maxSizeMB={50}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="file-prompt">Prompt de Processamento (Opcional)</Label>
                      <Textarea
                        id="file-prompt"
                        placeholder="Ex: Destaque os pontos sobre vendas"
                        className="min-h-20"
                        value={filePrompt}
                        onChange={(e) => setFilePrompt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A IA processara a transcricao com base no prompt.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t pt-6">
                    {isSubmittingFile && fileStatus && (
                      <p className="w-full text-center text-sm text-muted-foreground animate-pulse">
                        {fileStatus}
                      </p>
                    )}
                    <div className="flex w-full justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmittingFile}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmittingFile}>
                        {isSubmittingFile ? 'Processando...' : 'Iniciar Transcricao'}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* YOUTUBE TAB */}
            <TabsContent value="youtube" className="mt-0">
              <Card>
                <form onSubmit={handleYoutubeSubmit}>
                  <CardHeader>
                    <CardTitle>Transcrever Video do YouTube</CardTitle>
                    <CardDescription>
                      Cole a URL de um video publico para transcrever o audio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {youtubeError && (
                      <Alert variant="destructive">
                        <AlertDescription>{youtubeError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="youtube-title">Titulo</Label>
                      <Input
                        id="youtube-title"
                        placeholder="Ex: Tutorial de Next.js"
                        value={youtubeTitle}
                        onChange={(e) => setYoutubeTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-url">URL do YouTube</Label>
                      <YouTubeInput
                        inputId="youtube-url"
                        onUrlChange={handleYoutubeUrlChange}
                        onError={(msg) => setYoutubeError(msg)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube-prompt">Prompt de Processamento (Opcional)</Label>
                      <Textarea
                        id="youtube-prompt"
                        placeholder="Ex: Extraia os principais conceitos"
                        className="min-h-20"
                        value={youtubePrompt}
                        onChange={(e) => setYoutubePrompt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A IA processara a transcricao com base no prompt.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 border-t pt-6">
                    {isSubmittingYoutube && youtubeStatus && (
                      <p className="w-full text-center text-sm text-muted-foreground animate-pulse">
                        {youtubeStatus}
                      </p>
                    )}
                    <div className="flex w-full justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        disabled={isSubmittingYoutube}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmittingYoutube}>
                        {isSubmittingYoutube ? 'Processando...' : 'Iniciar Transcricao'}
                      </Button>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* REALTIME TAB */}
            <TabsContent value="realtime" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Transcricao em Tempo Real</CardTitle>
                  <CardDescription>
                    Use seu microfone para transcrever audio ao vivo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {realtimeError && (
                    <Alert variant="destructive">
                      <AlertDescription>{realtimeError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="realtime-title">Titulo</Label>
                    <Input
                      id="realtime-title"
                      placeholder="Ex: Reuniao de Planejamento"
                      value={realtimeTitle}
                      onChange={(e) => setRealtimeTitle(e.target.value)}
                    />
                  </div>

                  <LiveRecorder onTranscriptionComplete={handleRealtimeComplete} />

                  {realtimeTranscript && (
                    <div className="space-y-2">
                      <Label htmlFor="realtime-prompt">Prompt de Processamento (Opcional)</Label>
                      <Textarea
                        id="realtime-prompt"
                        placeholder="Ex: Faca um resumo estruturado"
                        className="min-h-20"
                        value={realtimePrompt}
                        onChange={(e) => setRealtimePrompt(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A IA processara a transcricao com base no prompt ao salvar.
                      </p>
                    </div>
                  )}
                </CardContent>
                {realtimeTranscript && (
                  <CardFooter className="flex flex-col gap-3 border-t pt-6">
                    {isSubmittingRealtime && realtimeStatus && (
                      <p className="w-full text-center text-sm text-muted-foreground animate-pulse">
                        {realtimeStatus}
                      </p>
                    )}
                    <div className="flex w-full justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
