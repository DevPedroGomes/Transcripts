'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { getTranscriptionById, updateTranscription, deleteTranscription } from '@/lib/storage';
import type { StoredTranscription } from '@/lib/types';
import {
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Check,
  ArrowLeft,
  FileAudio,
  Youtube,
  Mic,
  Clock,
  Calendar,
} from 'lucide-react';
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
    if (!confirm('Tem certeza que deseja excluir esta transcricao?')) return;
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
    if (!seconds) return null;
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

  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      file: <FileAudio className="h-4 w-4" />,
      youtube: <Youtube className="h-4 w-4" />,
      realtime: <Mic className="h-4 w-4" />,
    };
    return icons[source] || null;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      failed: 'bg-destructive/10 text-destructive ring-destructive/20',
    };
    const labels: Record<string, string> = {
      completed: 'Completada',
      failed: 'Falhou',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-muted text-muted-foreground ring-border'}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Transcricao nao encontrada.</p>
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
        <div className="container max-w-4xl py-8 space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>

          {/* Header section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">{transcription.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleCopy} title="Copiar texto">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTxt} title="Exportar TXT">
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              {getStatusBadge(transcription.status)}
              <span className="inline-flex items-center gap-1.5">
                {getSourceIcon(transcription.source)}
                {getSourceLabel(transcription.source)}
              </span>
              {formatDuration(transcription.duration_seconds) && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(transcription.duration_seconds)}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(transcription.created_at)}
              </span>
            </div>

            {/* Prompt used */}
            {transcription.prompt && (
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Prompt utilizado:</p>
                <p className="text-sm">{transcription.prompt}</p>
              </div>
            )}
          </div>

          {/* Content */}
          {transcription.status === 'failed' ? (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground text-center">
                  Ocorreu um erro ao processar sua transcricao. Por favor, tente novamente.
                </p>
                <Link href="/dashboard/new">
                  <Button variant="outline" size="sm">
                    Criar Nova Transcricao
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                {hasProcessedContent && (
                  <TabsTrigger value="transcript">Processada</TabsTrigger>
                )}
                <TabsTrigger value="raw">Original</TabsTrigger>
              </TabsList>

              {hasProcessedContent && (
                <TabsContent value="transcript" className="mt-4">
                  <Card>
                    <CardContent className="p-6">
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                        {transcription.transcript_processed}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="raw" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    {hasRawContent ? (
                      <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                        {transcription.transcript_raw}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum conteudo de transcricao disponivel.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Reprocess section */}
          {transcription.status === 'completed' && hasRawContent && (
            <div className="pt-2">
              {showReprocess ? (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Reprocessar com novo prompt</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Ex: Crie uma lista com os principais topicos discutidos..."
                      value={reprocessPrompt}
                      onChange={(e) => setReprocessPrompt(e.target.value)}
                      className="min-h-24"
                    />
                    {reprocessError && (
                      <p className="text-sm text-destructive">{reprocessError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReprocess}
                        disabled={isReprocessing || !reprocessPrompt.trim()}
                      >
                        {isReprocessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Reprocessando...
                          </>
                        ) : (
                          'Reprocessar'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowReprocess(false);
                          setReprocessPrompt('');
                          setReprocessError(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-sm text-muted-foreground">
                    Nao esta satisfeito? Reprocesse com um prompt diferente.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setShowReprocess(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
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
