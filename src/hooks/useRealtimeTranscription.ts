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
  const sessionIdRef = useRef<string | null>(null);
  const onAutoStopRef = useRef<((transcript: string, durationSeconds: number) => void) | null>(null);

  // Finalize the server-side budget reservation with the real session
  // duration. Best-effort: failure here is invisible to the user — the
  // server-side sweeper drops stale reservations after 10 min anyway.
  const finalizeSession = useCallback((durationSeconds: number) => {
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (!sessionId) return;
    const payload = JSON.stringify({ sessionId, durationSeconds });
    // sendBeacon survives navigation/tab-close, which is the leak case
    // we care most about. Fall back to fetch() with keepalive for the
    // dev path (sendBeacon is sometimes flaky in jsdom).
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/transcribe/realtime/finalize', blob);
        return;
      }
    } catch { /* fall through */ }
    fetch('/api/transcribe/realtime/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, []);

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
    if (sessionIdRef.current) {
      const duration = startTimeRef.current
        ? Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
        : 0;
      finalizeSession(duration);
    }
  }, [finalizeSession]);

  const start = useCallback(async (): Promise<void> => {
    setError(null);
    setInterimText('');
    setFinalText('');
    finalTextRef.current = '';
    setElapsedSeconds(0);
    setState('requesting');

    try {
      // 1. Fetch token and request microphone in parallel
      const [tokenRes, stream] = await Promise.all([
        fetch('/api/transcribe/realtime/token', { method: 'POST' }),
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        }),
      ]);
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.success) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error(tokenData.error || 'Falha ao obter token.');
      }
      sessionIdRef.current = tokenData.sessionId ?? null;
      streamRef.current = stream;

      // 3. Open WebSocket to Deepgram
      const wsUrl = `${DEEPGRAM_WS_URL}?${DEEPGRAM_REALTIME_PARAMS}`;
      const ws = new WebSocket(wsUrl, ['token', tokenData.key]);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onerror = () => reject(new Error('connection_failed'));
        const timeout = setTimeout(() => reject(new Error('connection_timeout')), 5000);
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
          setError('connection_closed');
          cleanup();
        }
      };

      ws.onerror = () => {
        setState('error');
        setError('connection_failed');
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

      mediaRecorder.start(100); // Send chunks every 100ms for low latency

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
      const raw = err instanceof Error ? err.message : 'unknown_error';
      if (raw.includes('Permission denied') || raw.includes('NotAllowedError')) {
        setError('permission_denied');
      } else if (raw === 'connection_failed' || raw === 'connection_timeout' || raw === 'connection_closed') {
        setError(raw);
      } else {
        setError(raw);
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

  // Tab close: refund the realtime reservation with whatever elapsed time
  // we have. sendBeacon (inside finalizeSession) survives the unload.
  useEffect(() => {
    const handler = () => {
      if (sessionIdRef.current) {
        const duration = startTimeRef.current
          ? Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000))
          : 0;
        finalizeSession(duration);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [finalizeSession]);

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
