'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';

type Transcription = {
  id: string;
  title: string;
  source: 'file' | 'youtube' | 'live';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration_seconds: number | null;
  created_at: string;
  transcript_raw: string | null;
  transcript_processed: string | null;
  file_url: string | null;
  youtube_url: string | null;
  prompt: string | null;
};

export default function TranscriptionDetails({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('transcript');
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchTranscription() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Verificar sessão
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/login');
          return;
        }

        // Buscar transcrição verificando ownership (user_id)
        const { data, error: fetchError } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', session.user.id)
          .single();

        if (fetchError || !data) {
          setError('Transcrição não encontrada ou você não tem permissão para visualizá-la.');
          return;
        }

        setTranscription(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTranscription();
  }, [params.id, router]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      file: 'Arquivo de Áudio',
      youtube: 'Vídeo do YouTube',
      live: 'Gravação ao Vivo',
    };
    return labels[source] || source;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-50 text-green-700 ring-green-600/20',
      processing: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      pending: 'bg-gray-50 text-gray-700 ring-gray-600/20',
      failed: 'bg-red-50 text-red-700 ring-red-600/20',
    };
    const labels: Record<string, string> = {
      completed: 'Completada',
      processing: 'Processando',
      pending: 'Pendente',
      failed: 'Falhou',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.pending}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando transcrição...</p>
        </div>
      </div>
    );
  }

  if (error || !transcription) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <Link href="/dashboard">
                <span className="text-xl">MeetingsTranscript</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Transcrição não encontrada'}</p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasProcessedContent =
    transcription.transcript_processed && transcription.transcript_processed.trim().length > 0;
  const hasRawContent =
    transcription.transcript_raw && transcription.transcript_raw.trim().length > 0;

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
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{transcription.title}</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm">
                  Exportar
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {getStatusBadge(transcription.status)}
              <span className="text-sm text-gray-500">{getSourceLabel(transcription.source)}</span>
              {transcription.duration_seconds && (
                <span className="text-sm text-gray-500">
                  {Math.floor(transcription.duration_seconds / 60)} minutos
                </span>
              )}
              <span className="text-sm text-gray-500">
                Criada em {formatDate(transcription.created_at)}
              </span>
            </div>
            {transcription.prompt && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Prompt utilizado:</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{transcription.prompt}</p>
              </div>
            )}
          </div>

          {transcription.status === 'processing' || transcription.status === 'pending' ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
              <p className="text-yellow-700 dark:text-yellow-300">
                {transcription.status === 'processing'
                  ? 'Sua transcrição está sendo processada. Isso pode levar alguns minutos...'
                  : 'Sua transcrição está na fila de processamento...'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Atualizar Status
              </Button>
            </div>
          ) : transcription.status === 'failed' ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-700 dark:text-red-300">
                Ocorreu um erro ao processar sua transcrição. Por favor, tente novamente.
              </p>
              <Link href="/dashboard/new">
                <Button variant="outline" size="sm" className="mt-4">
                  Criar Nova Transcrição
                </Button>
              </Link>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                {hasProcessedContent && (
                  <TabsTrigger value="transcript">Transcrição Processada</TabsTrigger>
                )}
                <TabsTrigger value="raw">Transcrição Original</TabsTrigger>
              </TabsList>

              {hasProcessedContent && (
                <TabsContent value="transcript" className="mt-0">
                  <div className="bg-white dark:bg-gray-900 border rounded-lg p-6">
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {transcription.transcript_processed}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="raw" className="mt-0">
                <div className="bg-white dark:bg-gray-900 border rounded-lg p-6">
                  {hasRawContent ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {transcription.transcript_raw}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Nenhum conteúdo de transcrição disponível.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {transcription.status === 'completed' && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 mb-4">
                Não está satisfeito com o resultado? Experimente processar novamente com um prompt
                diferente.
              </p>
              <Button variant="outline">Reprocessar com Novo Prompt</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
