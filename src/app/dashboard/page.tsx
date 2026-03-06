'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { getAllTranscriptions, deleteTranscription } from '@/lib/storage';
import type { StoredTranscription } from '@/lib/types';
import { Trash2, FileAudio, Youtube, Mic, Clock, Calendar } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [transcriptions, setTranscriptions] = useState<StoredTranscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTranscriptions(getAllTranscriptions());
    setIsLoading(false);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta transcricao?')) return;
    deleteTranscription(id);
    setTranscriptions(getAllTranscriptions());
  };

  const filteredTranscriptions = transcriptions.filter((t) => {
    if (activeTab === 'all') return true;
    return t.source === activeTab;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getSourceIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      file: <FileAudio className="h-4 w-4" />,
      youtube: <Youtube className="h-4 w-4" />,
      realtime: <Mic className="h-4 w-4" />,
    };
    return icons[source] || null;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      file: 'Arquivo',
      youtube: 'YouTube',
      realtime: 'Microfone',
    };
    return labels[source] || source;
  };

  const getExcerpt = (text?: string) => {
    if (!text) return 'Sem conteudo disponivel.';
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showNewButton />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Suas Transcricoes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {transcriptions.length} transcricao{transcriptions.length !== 1 ? 'es' : ''} salva{transcriptions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="file">Arquivos</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="realtime">Microfone</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredTranscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
                  <p className="mb-4 text-muted-foreground">
                    {activeTab === 'all'
                      ? 'Nenhuma transcricao ainda.'
                      : `Nenhuma transcricao do tipo ${getSourceLabel(activeTab)}.`}
                  </p>
                  <Link href={`/dashboard/new${activeTab !== 'all' ? `?type=${activeTab}` : ''}`}>
                    <Button>Criar Transcricao</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTranscriptions.map((t) => (
                    <Link key={t.id} href={`/dashboard/transcription/${t.id}`}>
                      <Card className="group h-full overflow-hidden transition-all hover:border-primary/40 hover:shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base font-medium">
                              {t.title}
                            </CardTitle>
                          </div>
                          <button
                            onClick={(e) => handleDelete(t.id, e)}
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {getExcerpt(t.transcript_raw)}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              {getSourceIcon(t.source)}
                              {getSourceLabel(t.source)}
                            </span>
                            {formatDuration(t.duration_seconds) && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(t.duration_seconds)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(t.created_at)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
