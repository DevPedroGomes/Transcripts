'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { getAllTranscriptions, deleteTranscription } from '@/lib/storage';
import type { StoredTranscription } from '@/lib/types';
import { Trash2 } from 'lucide-react';

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
    if (!confirm('Tem certeza que deseja excluir esta transcrição?')) return;
    deleteTranscription(id);
    setTranscriptions(getAllTranscriptions());
  };

  const filteredTranscriptions = transcriptions.filter((t) => {
    if (activeTab === 'all') return true;
    return t.source === activeTab;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    return `${mins} minuto${mins !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      file: 'Arquivo',
      youtube: 'YouTube',
      realtime: 'Microfone',
    };
    return labels[source] || source;
  };

  const getExcerpt = (text?: string) => {
    if (!text) return 'Sem conteúdo disponível.';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando suas transcrições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header showNewButton />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Suas Transcrições</h1>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas ({transcriptions.length})</TabsTrigger>
              <TabsTrigger value="file">
                Arquivos ({transcriptions.filter((t) => t.source === 'file').length})
              </TabsTrigger>
              <TabsTrigger value="youtube">
                YouTube ({transcriptions.filter((t) => t.source === 'youtube').length})
              </TabsTrigger>
              <TabsTrigger value="realtime">
                Microfone ({transcriptions.filter((t) => t.source === 'realtime').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredTranscriptions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    {activeTab === 'all'
                      ? 'Você ainda não tem transcrições.'
                      : `Você ainda não tem transcrições do tipo ${getSourceLabel(activeTab)}.`}
                  </p>
                  <Link href={`/dashboard/new${activeTab !== 'all' ? `?type=${activeTab}` : ''}`}>
                    <Button>Criar Transcrição</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTranscriptions.map((transcription) => (
                    <Link key={transcription.id} href={`/dashboard/transcription/${transcription.id}`}>
                      <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{transcription.title}</CardTitle>
                              <CardDescription>
                                {getSourceLabel(transcription.source)} –{' '}
                                {formatDuration(transcription.duration_seconds)}
                              </CardDescription>
                            </div>
                            <button
                              onClick={(e) => handleDelete(transcription.id, e)}
                              className="ml-2 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {getExcerpt(transcription.transcript_raw)}
                          </p>
                          <div className="flex items-center justify-between mt-4">
                            {getStatusBadge(transcription.status)}
                            <span className="text-xs text-gray-500">
                              {formatDate(transcription.created_at)}
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
