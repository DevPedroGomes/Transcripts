'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { AlertCircle, Youtube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface YouTubeInputProps {
  onUrlChange: (url: string) => void;
  onError?: (error: string) => void;
  inputId?: string;
}

export function YouTubeInput({ onUrlChange, onError, inputId }: YouTubeInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const parseYouTubeUrl = (rawUrl: string): string | null => {
    try {
      const parsedUrl = new URL(rawUrl);
      const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
      if (!validDomains.includes(parsedUrl.hostname)) return null;

      let id: string | null = null;
      if (parsedUrl.hostname === 'youtu.be') {
        id = parsedUrl.pathname.slice(1);
      } else {
        id = parsedUrl.searchParams.get('v');
        if (!id && parsedUrl.pathname.startsWith('/embed/')) {
          id = parsedUrl.pathname.split('/embed/')[1];
        }
        if (!id && parsedUrl.pathname.startsWith('/shorts/')) {
          id = parsedUrl.pathname.split('/shorts/')[1];
        }
      }

      if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
      return id;
    } catch {
      return null;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (!newUrl) {
      setError(null);
      setIsValid(false);
      setThumbnail(null);
      setVideoId(null);
      onUrlChange('');
      return;
    }

    const id = parseYouTubeUrl(newUrl);

    if (!id) {
      const errorMsg = 'Por favor, insira uma URL válida do YouTube';
      setError(errorMsg);
      setIsValid(false);
      setThumbnail(null);
      setVideoId(null);
      if (onError) onError(errorMsg);
      return;
    }

    setError(null);
    setIsValid(true);
    setVideoId(id);
    setThumbnail(`https://img.youtube.com/vi/${id}/0.jpg`);
    onUrlChange(newUrl);
  };

  return (
    <div className="space-y-4">
      <Input
        id={inputId}
        type="text"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={handleUrlChange}
        className={
          error ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500' : ''
        }
      />

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {thumbnail && videoId && (
        <div className="border rounded-lg overflow-hidden">
          <div className="relative aspect-video">
            <img
              src={thumbnail}
              alt={`Video: ${videoId}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Youtube className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-medium">Video: {videoId}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Este vídeo será processado para transcrição.
            </p>
          </div>
        </div>
      )}

      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
        <AlertDescription>
          A transcrição de vídeos longos pode levar mais tempo. Recomendamos vídeos de até 2 horas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
