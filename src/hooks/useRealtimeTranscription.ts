'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DEEPGRAM_WS_URL,
  DEEPGRAM_REALTIME_PARAMS,
  REALTIME_MAX_DURATION_MS,
} from '@/lib/constants';

export type RealtimeState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error';

export function useRealtimeTranscription() {
  const [state, setState] = useState<RealtimeState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const finalTextRef = useRef('');
  const onAutoStopRef = useRef<((transcript: string, durationSeconds: number) => void) | null>(null);

  // Keep ref in sync for use in callbacks
  useEffect(() => {
    finalTextRef.current = finalText;
  }, [finalText]);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(new Uint8Array(0));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const start = useCallback(async (): Promise<void> => {
    setError(null);
    setInterimText('');
    setFinalText('');
    finalTextRef.current = '';
    setElapsedSeconds(0);
    setState('requesting');

    try {
      // 1. Get temporary key from server
      const tokenRes = await fetch('/api/transcribe/realtime/token', { method: 'POST' });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Falha ao obter token.');
      }

      // 2. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // 3. Open WebSocket to Deepgram
      const wsUrl = `${DEEPGRAM_WS_URL}?${DEEPGRAM_REALTIME_PARAMS}`;
      const ws = new WebSocket(wsUrl, ['token', tokenData.key]);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onerror = () => reject(new Error('Falha ao conectar com o servico de transcricao.'));
        const timeout = setTimeout(() => reject(new Error('Timeout ao conectar.')), 5000);
        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      // 4. Handle incoming transcript messages
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'Results') {
            const alt = msg.channel?.alternatives?.[0];
            if (!alt) return;
            if (msg.is_final) {
              if (alt.transcript.trim()) {
                setFinalText((prev) => {
                  const updated = prev + (prev ? ' ' : '') + alt.transcript.trim();
                  return updated;
                });
                setInterimText('');
              }
            } else {
              setInterimText(alt.transcript || '');
            }
          }
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onclose = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          setState('error');
          setError('Conexao com o servico foi encerrada inesperadamente.');
          cleanup();
        }
      };

      ws.onerror = () => {
        setState('error');
        setError('Erro na conexao com o servico de transcricao.');
        cleanup();
      };

      // 5. Start MediaRecorder to capture audio
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      mediaRecorder.start(250); // Send chunks every 250ms

      // 6. Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);

        if (elapsed * 1000 >= REALTIME_MAX_DURATION_MS) {
          const transcript = finalTextRef.current;
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          cleanup();
          setState('idle');
          if (transcript.trim() && onAutoStopRef.current) {
            onAutoStopRef.current(transcript, duration);
          }
        }
      }, 1000);

      setState('recording');
    } catch (err) {
      cleanup();
      setState('error');
      const message = err instanceof Error ? err.message : 'Erro desconhecido.';
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError(
          'Permissao de microfone negada. Habilite o acesso ao microfone nas configuracoes do navegador.'
        );
      } else {
        setError(message);
      }
    }
  }, [cleanup]);

  const stop = useCallback((): { finalTranscript: string; durationSeconds: number } => {
    setState('stopping');
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    cleanup();
    setState('idle');
    return {
      finalTranscript: finalTextRef.current,
      durationSeconds: duration,
    };
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState('idle');
    setError(null);
    setInterimText('');
    setFinalText('');
    finalTextRef.current = '';
    setElapsedSeconds(0);
  }, [cleanup]);

  const setOnAutoStop = useCallback((cb: (transcript: string, durationSeconds: number) => void) => {
    onAutoStopRef.current = cb;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    state,
    error,
    interimText,
    finalText,
    elapsedSeconds,
    start,
    stop,
    reset,
    setOnAutoStop,
  };
}
