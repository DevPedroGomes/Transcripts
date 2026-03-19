import { FileAudio, Youtube, Mic } from 'lucide-react';

export function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(dateString: string, variant: 'short' | 'long' = 'short'): string {
  if (variant === 'long') {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export function getSourceIcon(source: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    file: <FileAudio className="h-4 w-4" />,
    youtube: <Youtube className="h-4 w-4" />,
    realtime: <Mic className="h-4 w-4" />,
  };
  return icons[source] || null;
}

export function getSourceLabel(source: string, variant: 'short' | 'long' = 'short'): string {
  if (variant === 'long') {
    const labels: Record<string, string> = {
      file: 'Arquivo de Audio',
      youtube: 'Video do YouTube',
      realtime: 'Microfone ao Vivo',
    };
    return labels[source] || source;
  }
  const labels: Record<string, string> = {
    file: 'Arquivo',
    youtube: 'YouTube',
    realtime: 'Microfone',
  };
  return labels[source] || source;
}
