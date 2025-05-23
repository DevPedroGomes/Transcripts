export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  stripe_customer_id?: string;
  has_active_subscription: boolean;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  limits: {
    transcriptions_per_month: number;
    max_audio_duration_minutes: number;
    max_storage_gb: number;
  };
};

export type TranscriptionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type TranscriptionSource = 
  | 'file'
  | 'youtube'
  | 'live';

export type Transcription = {
  id: string;
  user_id: string;
  title: string;
  source: TranscriptionSource;
  status: TranscriptionStatus;
  file_name?: string;
  file_url?: string;
  youtube_url?: string;
  prompt?: string;
  transcript_raw?: string;
  transcript_processed?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
};

export type TranscriptionSegment = {
  id: string;
  transcription_id: string;
  start: number;
  end: number;
  text: string;
}; 