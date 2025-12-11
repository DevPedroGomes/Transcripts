'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  const [videoTitle, setVideoTitle] = useState<string | null>(null);

  const isValidYouTubeUrl = (url: string) => {
    const regExp = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    return regExp.test(url);
  };

  const extractVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (!newUrl) {
      setError(null);
      setIsValid(false);
      setThumbnail(null);
      setVideoTitle(null);
      onUrlChange('');
      return;
    }

    if (!isValidYouTubeUrl(newUrl)) {
      const errorMsg = 'Por favor, insira uma URL válida do YouTube';
      setError(errorMsg);
      setIsValid(false);
      setThumbnail(null);
      setVideoTitle(null);
      if (onError) onError(errorMsg);
      return;
    }

    setError(null);
    setIsValid(true);
    onUrlChange(newUrl);

    // Em um aplicativo real, você pode buscar os metadados do vídeo
    // usando a API do YouTube para mostrar uma prévia
    const videoId = extractVideoId(newUrl);
    if (videoId) {
      setThumbnail(`https://img.youtube.com/vi/${videoId}/0.jpg`);
      // Simular título do vídeo
      setVideoTitle('Título do vídeo do YouTube');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full max-w-sm items-center space-x-2">
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
        <Button type="button" disabled={!isValid}>
          Verificar
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {thumbnail && (
        <div className="border rounded-lg overflow-hidden">
          <div className="relative aspect-video">
            <img
              src={thumbnail}
              alt={videoTitle || 'Thumbnail do vídeo'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Youtube className="h-12 w-12 text-red-500" />
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-medium">{videoTitle}</h3>
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
