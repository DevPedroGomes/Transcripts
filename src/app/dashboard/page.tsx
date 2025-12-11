'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/auth';
import { signOut } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';

type Transcription = {
  id: string;
  title: string;
  source: 'file' | 'youtube' | 'live';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration_seconds: number | null;
  created_at: string;
  transcript_raw: string | null;
};

type Profile = {
  id: string;
  name: string | null;
  has_active_subscription: boolean;
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
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

        // Buscar perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, has_active_subscription')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
        } else {
          setProfile(profileData);
        }

        // Buscar transcrições do usuário
        const { data: transcriptionsData, error: transcriptionsError } = await supabase
          .from('transcriptions')
          .select('id, title, source, status, duration_seconds, created_at, transcript_raw')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (transcriptionsError) {
          throw new Error('Erro ao carregar transcrições');
        }

        setTranscriptions(transcriptionsData || []);

        // Contar transcrições do mês (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count } = await supabase
          .from('transcriptions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        setMonthlyCount(count || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const filteredTranscriptions = transcriptions.filter((t) => {
    if (activeTab === 'all') return true;
    return t.source === activeTab;
  });

  const formatDuration = (seconds: number | null) => {
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

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      file: 'Arquivo',
      youtube: 'YouTube',
      live: 'Ao vivo',
    };
    return labels[source] || source;
  };

  const getExcerpt = (text: string | null) => {
    if (!text) return 'Transcrição em processamento...';
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const maxTranscriptions = profile?.has_active_subscription ? 'ilimitadas' : '5';

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
            <Link href="/dashboard/new">
              <Button>Nova Transcrição</Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-full h-8 w-8 bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
              title={profile?.name || 'Sair'}
            >
              <span className="font-medium text-sm">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Suas Transcrições</h1>
            <Link href="/dashboard/new">
              <Button>Nova Transcrição</Button>
            </Link>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas ({transcriptions.length})</TabsTrigger>
              <TabsTrigger value="file">
                Arquivos ({transcriptions.filter((t) => t.source === 'file').length})
              </TabsTrigger>
              <TabsTrigger value="youtube">
                YouTube ({transcriptions.filter((t) => t.source === 'youtube').length})
              </TabsTrigger>
              <TabsTrigger value="live">
                Ao vivo ({transcriptions.filter((t) => t.source === 'live').length})
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
                    <Link
                      key={transcription.id}
                      href={`/dashboard/transcription/${transcription.id}`}
                    >
                      <Card className="overflow-hidden hover:border-primary/50 transition-colors h-full">
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg truncate">{transcription.title}</CardTitle>
                          <CardDescription>
                            {getSourceLabel(transcription.source)} -{' '}
                            {formatDuration(transcription.duration_seconds)}
                          </CardDescription>
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

              <div className="mt-8 text-center text-gray-500">
                <p>
                  Você utilizou {monthlyCount} de {maxTranscriptions} transcrições
                  {!profile?.has_active_subscription && ' no plano gratuito (últimos 30 dias)'}.
                </p>
                {!profile?.has_active_subscription && (
                  <Link href="/pricing">
                    <Button className="mt-4" variant="outline" size="sm">
                      Fazer Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
