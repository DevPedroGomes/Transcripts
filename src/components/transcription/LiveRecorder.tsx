'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { useRealtimeTranscription } from '@/hooks/useRealtimeTranscription';
import { REALTIME_MAX_DURATION_MS } from '@/lib/constants';

interface LiveRecorderProps {
  onTranscriptionComplete: (transcript: string, durationSeconds: number) => void;
}

export function LiveRecorder({ onTranscriptionComplete }: LiveRecorderProps) {
  const { state, error, interimText, finalText, elapsedSeconds, start, stop, reset } =
    useRealtimeTranscription();

  const maxSeconds = REALTIME_MAX_DURATION_MS / 1000;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    const result = stop();
    if (result.finalTranscript.trim()) {
      onTranscriptionComplete(result.finalTranscript, result.durationSeconds);
    }
  };

  const isRecording = state === 'recording';
  const isRequesting = state === 'requesting';
  const hasTranscript = finalText.trim().length > 0;

  // Browser compatibility check
  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  if (!isSupported) {
    return (
      <Alert>
        <AlertDescription>
          Seu navegador nao suporta gravacao de audio. Use Chrome, Edge ou Firefox.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4">
        {state === 'idle' && !hasTranscript && (
          <Button type="button" onClick={start} className="gap-2" size="lg">
            <Mic className="h-5 w-5" />
            Iniciar Gravacao
          </Button>
        )}

        {isRequesting && (
          <Button disabled size="lg" className="gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            Conectando...
          </Button>
        )}

        {isRecording && (
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3 rounded-full bg-destructive/10 px-4 py-2">
              <div className="relative">
                <div className="h-3 w-3 bg-destructive rounded-full" />
                <div className="absolute inset-0 h-3 w-3 bg-destructive rounded-full animate-ping" />
              </div>
              <span className="text-sm font-mono font-medium text-destructive">
                {formatTime(elapsedSeconds)} / {formatTime(maxSeconds)}
              </span>
            </div>
            <Button
              type="button"
              onClick={handleStop}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Parar
            </Button>
          </div>
        )}

        {state === 'error' && (
          <Button type="button" onClick={reset} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </div>

      {/* Live transcript display */}
      {(isRecording || hasTranscript) && (
        <div className="rounded-lg border bg-muted/40 p-5 min-h-[140px] max-h-[320px] overflow-y-auto">
          {finalText && <span className="text-sm leading-relaxed">{finalText}</span>}
          {interimText && (
            <span className="text-sm text-muted-foreground italic">
              {finalText ? ' ' : ''}
              {interimText}
            </span>
          )}
          {isRecording && !finalText && !interimText && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Ouvindo... comece a falar.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Limite de {maxSeconds / 60} minutos por sessao. Transcricao via Deepgram Nova-3 em
        portugues.
      </p>
    </div>
  );
}
