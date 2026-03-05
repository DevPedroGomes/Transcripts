'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { getTranscriptionById, updateTranscription, deleteTranscription } from '@/lib/storage';
import type { StoredTranscription } from '@/lib/types';
import { Download, Copy, Trash2, RefreshCw, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function TranscriptionDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('raw');
  const [transcription, setTranscription] = useState<StoredTranscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Reprocess state
  const [showReprocess, setShowReprocess] = useState(false);
  const [reprocessPrompt, setReprocessPrompt] = useState('');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  useEffect(() => {
    const t = getTranscriptionById(params.id);
    setTranscription(t);
    if (t?.transcript_processed?.trim()) {
      setActiveTab('transcript');
    }
    setIsLoading(false);
  }, [params.id]);

  const handleDelete = () => {
    if (!confirm('Tem certeza que deseja excluir esta transcrição?')) return;
    deleteTranscription(params.id);
    router.push('/dashboard');
  };

  const handleExportTxt = () => {
    if (!transcription) return;
    const content = transcription.transcript_processed || transcription.transcript_raw || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${transcription.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!transcription) return;
    const content = transcription.transcript_processed || transcription.transcript_raw || '';
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReprocess = async () => {
    if (!transcription?.transcript_raw || !reprocessPrompt.trim()) return;

    setIsReprocessing(true);
    setReprocessError(null);

    try {
      const response = await fetch('/api/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptRaw: transcription.transcript_raw,
          prompt: reprocessPrompt.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Falha ao reprocessar.');
      }

      const updated = updateTranscription(params.id, {
        transcript_processed: payload.data.transcript_processed,
        prompt: reprocessPrompt.trim(),
      });

      if (updated) {
        setTranscription(updated);
      }

      setShowReprocess(false);
      setReprocessPrompt('');
      setActiveTab('transcript');
    } catch (error) {
      setReprocessError(error instanceof Error ? error.message : 'Erro ao reprocessar.');
    } finally {
      setIsReprocessing(false);
    }
  };

  const formatDuration = (seconds?: number) => {
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
      file: 'Arquivo de Audio',
      youtube: 'Video do YouTube',
      realtime: 'Microfone ao Vivo',
    };
    return labels[source] || source;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-50 text-green-700 ring-green-600/20',
      failed: 'bg-red-50 text-red-700 ring-red-600/20',
    };
    const labels: Record<string, string> = {
      completed: 'Completada',
      failed: 'Falhou',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
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

  if (!transcription) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">Transcrição não encontrada.</p>
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
            <h1 className="text-3xl font-bold">{transcription.title}</h1>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleExportTxt} title="Exportar TXT">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} title="Copiar texto">
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {getStatusBadge(transcription.status)}
              <span className="text-sm text-gray-500">{getSourceLabel(transcription.source)}</span>
              {transcription.duration_seconds && (
                <span className="text-sm text-gray-500">
                  {formatDuration(transcription.duration_seconds)}
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

          {transcription.status === 'failed' ? (
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

          {transcription.status === 'completed' && hasRawContent && (
            <div className="mt-8">
              {showReprocess ? (
                <div className="border rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold">Reprocessar com novo prompt</h3>
                  <Textarea
                    placeholder="Ex: Crie uma lista com os principais tópicos discutidos..."
                    value={reprocessPrompt}
                    onChange={(e) => setReprocessPrompt(e.target.value)}
                    className="min-h-24"
                  />
                  {reprocessError && (
                    <p className="text-sm text-red-500">{reprocessError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReprocess}
                      disabled={isReprocessing || !reprocessPrompt.trim()}
                    >
                      {isReprocessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          Reprocessando...
                        </>
                      ) : (
                        'Reprocessar'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReprocess(false);
                        setReprocessPrompt('');
                        setReprocessError(null);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500 mb-4">
                    Não está satisfeito com o resultado? Experimente processar novamente com um
                    prompt diferente.
                  </p>
                  <Button variant="outline" onClick={() => setShowReprocess(true)}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reprocessar com Novo Prompt
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
