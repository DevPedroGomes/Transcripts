export type TranscriptionStatus = 'completed' | 'failed';

export type TranscriptionSource = 'file' | 'youtube' | 'realtime';

export type StoredTranscription = {
  id: string;
  title: string;
  source: TranscriptionSource;
  status: TranscriptionStatus;
  file_name?: string;
  youtube_url?: string;
  prompt?: string;
  transcript_raw?: string;
  transcript_processed?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
};

export type TranscribeApiResponse = {
  success: boolean;
  error?: string;
  data?: StoredTranscription;
  ai_skipped?: boolean;
};

export type TranscriptionSegment = {
  id: string;
  transcription_id: string;
  start: number;
  end: number;
  text: string;
};
