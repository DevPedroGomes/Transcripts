-- Criação das tabelas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  has_active_subscription BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  file_name TEXT,
  file_url TEXT,
  youtube_url TEXT,
  prompt TEXT,
  transcript_raw TEXT,
  transcript_processed TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcription_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE NOT NULL,
  start NUMERIC NOT NULL,
  "end" NUMERIC NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Funções e triggers

-- Atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transcriptions_updated_at
BEFORE UPDATE ON transcriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_segments ENABLE ROW LEVEL SECURITY;

-- Criar policies
CREATE POLICY "Usuários podem ver apenas seus próprios perfis"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seus próprios perfis"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuários podem ver apenas suas próprias transcrições"
ON transcriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias transcrições"
ON transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar apenas suas próprias transcrições"
ON transcriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar apenas suas próprias transcrições"
ON transcriptions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver apenas segmentos de suas próprias transcrições"
ON transcription_segments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM transcriptions
  WHERE transcriptions.id = transcription_segments.transcription_id
  AND transcriptions.user_id = auth.uid()
));

CREATE POLICY "Usuários podem inserir segmentos apenas em suas próprias transcrições"
ON transcription_segments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM transcriptions
  WHERE transcriptions.id = transcription_segments.transcription_id
  AND transcriptions.user_id = auth.uid()
));

-- Trigger para criar perfil quando um novo usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 