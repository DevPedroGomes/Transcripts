"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Pause, Play, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { io, Socket } from "socket.io-client";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import AudioRecorder from 'audio-recorder-polyfill';

interface LiveRecorderProps {
  transcriptionId: string;
  onTranscriptionComplete: (text: string, duration: number) => void;
  onError?: (error: string) => void;
}

export function LiveRecorder({
  transcriptionId,
  onTranscriptionComplete,
  onError,
}: LiveRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStatus, setRecordingStatus] = useState<
    "idle" | "connecting" | "recording" | "paused" | "processing" | "completed" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscription, setLiveTranscription] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  // Configurar WebSocket
  useEffect(() => {
    return () => {
      // Limpar recursos ao desmontar
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isRecording]);

  const connectSocket = async () => {
    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }
      
      // Obter token JWT para autenticação
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        throw new Error("Sessão inválida");
      }
      
      // Conectar ao servidor Socket.IO
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:3001';
      const socket = io(socketUrl);
      
      socket.on('connect', () => {
        console.log('Conectado ao servidor WebSocket');
        
        // Iniciar sessão de transcrição
        socket.emit('start-transcription', {
          transcriptionId,
          userId: user.id,
          jwt: session.access_token
        });
      });
      
      socket.on('transcription-started', () => {
        setRecordingStatus("recording");
        startRecording(socket);
      });
      
      socket.on('transcription-update', (data) => {
        setLiveTranscription(data.fullText);
      });
      
      socket.on('transcription-completed', (data) => {
        setRecordingStatus("completed");
        if (onTranscriptionComplete) {
          onTranscriptionComplete(data.text, recordingTime);
        }
      });
      
      socket.on('error', (error) => {
        setErrorMessage(error.message || "Erro na transcrição ao vivo");
        setRecordingStatus("error");
        if (onError) onError(error.message);
      });
      
      socket.on('disconnect', () => {
        console.log('Desconectado do servidor WebSocket');
        if (recordingStatus === "recording") {
          setErrorMessage("Conexão com o servidor perdida");
          setRecordingStatus("error");
        }
      });
      
      socketRef.current = socket;
      setRecordingStatus("connecting");
      
    } catch (error) {
      console.error("Erro ao conectar socket:", error);
      setErrorMessage("Erro ao iniciar transcrição ao vivo");
      setRecordingStatus("error");
      if (onError) onError("Erro ao iniciar transcrição ao vivo");
    }
  };

  const startRecording = async (socket: Socket) => {
    try {
      setErrorMessage(null);
      
      // Polyfill para garantir compatibilidade com todos navegadores
      window.MediaRecorder = window.MediaRecorder || AudioRecorder;
      
      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      
      // Criar o MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      // Configurar tratamento de dados
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket.connected) {
          // Enviar dados para o servidor via WebSocket
          socket.emit('audio-data', event.data);
        }
      };
      
      // Iniciar gravação
      mediaRecorder.start(1000); // Captura a cada 1 segundo
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      const errorMsg = "Não foi possível acessar o microfone. Verifique as permissões.";
      setErrorMessage(errorMsg);
      setRecordingStatus("error");
      if (onError) onError(errorMsg);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      setRecordingStatus("paused");
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      setRecordingStatus("recording");
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (!socketRef.current || !mediaRecorderRef.current) return;
    
    try {
      // Parar a gravação
      mediaRecorderRef.current.stop();
      
      // Parar as faixas de áudio
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Limpar o timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setIsRecording(false);
      setIsPaused(false);
      setRecordingStatus("processing");
      
      // Informar ao servidor que a transcrição terminou
      socketRef.current.emit('end-transcription');
      
    } catch (error) {
      console.error("Erro ao parar gravação:", error);
      setErrorMessage("Erro ao finalizar a gravação");
      setRecordingStatus("error");
      if (onError) onError("Erro ao finalizar a gravação");
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col items-center justify-center gap-4 p-6 border rounded-lg">
        <div className="text-center">
          {recordingStatus === "idle" && (
            <p className="text-gray-500 mb-4">Clique no botão abaixo para iniciar a gravação</p>
          )}
          
          {recordingStatus === "connecting" && (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-gray-500">Conectando ao servidor...</p>
            </div>
          )}
          
          {(recordingStatus === "recording" || recordingStatus === "paused") && (
            <div className="space-y-2">
              <p className={`text-2xl font-bold ${isPaused ? "text-amber-500" : "text-red-500"}`}>
                {formatTime(recordingTime)}
              </p>
              <p className="text-sm text-gray-500">
                {isPaused ? "Gravação pausada" : "Gravando..."}
              </p>
              {liveTranscription && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md max-h-32 overflow-y-auto text-sm text-left">
                  <p className="text-gray-700 dark:text-gray-300">{liveTranscription}</p>
                </div>
              )}
            </div>
          )}
          
          {recordingStatus === "processing" && (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-lg font-medium">Processando áudio...</p>
            </div>
          )}
          
          {recordingStatus === "completed" && (
            <div className="space-y-2">
              <p className="text-lg font-medium text-green-600">Transcrição concluída!</p>
              <p className="text-sm text-gray-500">Duração total: {formatTime(recordingTime)}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {recordingStatus === "idle" && (
            <Button onClick={connectSocket} className="flex items-center gap-2" size="lg">
              <Mic className="h-5 w-5" />
              Iniciar Gravação
            </Button>
          )}
          
          {recordingStatus === "connecting" && (
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Conectando...
            </Button>
          )}
          
          {recordingStatus === "recording" && (
            <>
              <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                <StopCircle className="h-4 w-4" />
                Finalizar
              </Button>
            </>
          )}
          
          {recordingStatus === "paused" && (
            <>
              <Button onClick={resumeRecording} variant="outline" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Continuar
              </Button>
              <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                <StopCircle className="h-4 w-4" />
                Finalizar
              </Button>
            </>
          )}
          
          {recordingStatus === "processing" && (
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </Button>
          )}
          
          {recordingStatus === "error" && (
            <Button onClick={connectSocket} className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 