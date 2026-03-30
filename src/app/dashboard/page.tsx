'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { getAllTranscriptions, deleteTranscription } from '@/lib/storage';
import type { StoredTranscription } from '@/lib/types';
import { Trash2, Clock, Calendar } from 'lucide-react';
import { formatDuration, formatDate, getSourceIcon, getSourceLabel } from '@/lib/formatters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [transcriptions, setTranscriptions] = useState<StoredTranscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    setTranscriptions(getAllTranscriptions());
    setIsLoading(false);
  }, []);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteTranscription(deleteTarget);
      setTranscriptions(getAllTranscriptions());
    }
    setDeleteTarget(null);
  };

  const filteredTranscriptions = transcriptions.filter((t) => {
    if (activeTab === 'all') return true;
    return t.source === activeTab;
  });

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
      <main className="flex-1 bg-[#fafafa]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Suas Transcricoes</h1>
            <p className="mt-1 text-sm text-neutral-500">
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
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 py-16 bg-white">
                  <p className="mb-4 text-neutral-500">
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
                      <Card className="group h-full overflow-hidden bg-white border-neutral-200 rounded-2xl card-shadow hover-lift">
                        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="truncate text-base font-medium text-neutral-900">
                              {t.title}
                            </CardTitle>
                          </div>
                          <button
                            onClick={(e) => handleDeleteClick(t.id, e)}
                            className="shrink-0 rounded-md p-1.5 text-neutral-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="line-clamp-2 text-sm text-neutral-500">
                            {getExcerpt(t.transcript_raw)}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-neutral-400">
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir transcricao"
        description="Tem certeza que deseja excluir esta transcricao? Esta acao nao pode ser desfeita."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
