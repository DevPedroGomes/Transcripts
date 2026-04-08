export const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

export const DEEPGRAM_DEFAULT_PARAMS =
  'model=nova-2&language=pt-BR&smart_format=true&punctuate=true&diarize=true';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Realtime streaming
export const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

export const DEEPGRAM_REALTIME_PARAMS =
  'model=nova-3&language=pt-BR&smart_format=true&punctuate=true&interim_results=true&endpointing=200&vad_events=true&encoding=opus&sample_rate=48000';

export const REALTIME_MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export const REALTIME_COOLDOWN_MS = 30 * 1000; // 30 seconds between sessions
