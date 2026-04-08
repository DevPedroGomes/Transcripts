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
  Clock,
  Calendar,
} from 'lucide-react';
import { formatDuration, formatDate, getSourceIcon } from '@/lib/formatters';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLocale } from '@/hooks/use-locale';

export default function TranscriptionDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, toggleLocale, t } = useLocale();
  const [activeTab, setActiveTab] = useState('raw');
  const [transcription, setTranscription] = useState<StoredTranscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Reprocess state
  const [showReprocess, setShowReprocess] = useState(false);
  const [reprocessPrompt, setReprocessPrompt] = useState('');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  useEffect(() => {
    const data = getTranscriptionById(params.id);
    setTranscription(data);
    if (data?.transcript_processed?.trim()) {
      setActiveTab('transcript');
    }
    setIsLoading(false);
  }, [params.id]);

  const handleDelete = () => {
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
        throw new Error(payload.error || t('detail.reprocess.error'));
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
      setReprocessError(error instanceof Error ? error.message : t('detail.reprocess.error'));
    } finally {
      setIsReprocessing(false);
    }
  };

  const getSourceLabel = (source: string): string => {
    const key = `detail.source.${source}` as Parameters<typeof t>[0];
    return t(key);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
      failed: 'bg-destructive/10 text-destructive ring-destructive/20',
    };
    const statusKey = `detail.status.${status}` as Parameters<typeof t>[0];
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] || 'bg-muted text-muted-foreground ring-border'}`}
      >
        {t(statusKey)}
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
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{t('detail.notFound')}</p>
            <Link href="/dashboard">
              <Button>{t('detail.backToDashboard')}</Button>
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
      <Header locale={locale} onToggleLocale={toggleLocale} />
      <main className="flex-1">
        <div className="container max-w-4xl py-8 space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('detail.backToDashboard')}
          </Link>

          {/* Header section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">{transcription.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleCopy} title={t('detail.copyText')}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTxt} title={t('detail.exportTxt')}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={t('detail.delete')}
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
                {formatDate(transcription.created_at, 'long')}
              </span>
            </div>

            {/* Prompt used */}
            {transcription.prompt && (
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">{t('detail.promptUsed')}</p>
                <p className="text-sm">{transcription.prompt}</p>
              </div>
            )}
          </div>

          {/* Content */}
          {transcription.status === 'failed' ? (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <p className="text-muted-foreground text-center">
                  {t('detail.errorMessage')}
                </p>
                <Link href="/dashboard/new">
                  <Button variant="outline" size="sm">
                    {t('detail.createNew')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                {hasProcessedContent && (
                  <TabsTrigger value="transcript">{t('detail.tab.processed')}</TabsTrigger>
                )}
                <TabsTrigger value="raw">{t('detail.tab.raw')}</TabsTrigger>
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
                        {t('detail.noContent')}
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
                    <h3 className="font-semibold">{t('detail.reprocess.title')}</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder={t('detail.reprocess.placeholder')}
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
                            {t('detail.reprocess.processing')}
                          </>
                        ) : (
                          t('detail.reprocess.button')
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
                        {t('detail.reprocess.cancel')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <p className="text-sm text-muted-foreground">
                    {t('detail.reprocess.cta')}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setShowReprocess(true)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('detail.reprocess.ctaButton')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteDialog}
        title={t('dashboard.delete.title')}
        description={t('dashboard.delete.description')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}
