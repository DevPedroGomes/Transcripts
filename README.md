# MeetingsTranscript

Aplicação de transcrição de áudio e vídeo com processamento por IA, construída com Next.js 16, Supabase e LangChain.

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Next.js 16     │◄────┤   API Routes    │◄────┤  Supabase DB    │
│   (Frontend)    │     │   (Backend)     │     │  (PostgreSQL)   │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐     ┌─────────────────┐
         │              │                 │     │                 │
         │              │ Deepgram API +  │     │    Inngest      │
         │              │   LangChain     │     │  (Background)   │
         │              │                 │     │                 │
         │              └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Upstash Redis  │
│ (Rate Limiting) │
└─────────────────┘
```

## Funcionalidades

### Transcrição de Arquivos de Áudio
Upload de arquivos MP3, WAV, M4A, OGG para transcrição automática via Deepgram.

### Transcrição de Vídeos do YouTube
Cole uma URL do YouTube e o áudio será extraído e transcrito automaticamente.

### Processamento com IA
Opcionalmente, processe a transcrição com prompts personalizados usando LangChain + OpenAI (resumos, extração de ações, etc).

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Shadcn UI |
| Backend | Next.js API Routes, Inngest (background jobs) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| IA | Deepgram (STT), LangChain + OpenAI (processamento) |
| Infra | Upstash Redis (rate limiting) |

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` baseado no `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# AI Services
DEEPGRAM_API_KEY=sua-chave-deepgram
OPENAI_API_KEY=sua-chave-openai

# Rate Limiting
UPSTASH_REDIS_REST_URL=https://seu-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token

# Inngest (produção)
INNGEST_EVENT_KEY=sua-chave
INNGEST_SIGNING_KEY=sua-chave

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configurar Supabase

Execute o script SQL em `supabase/schema.sql` para criar as tabelas e políticas RLS.

### 3. Executar Localmente

```bash
# Instalar dependências
npm install

# Iniciar Inngest Dev Server (em um terminal)
npx inngest-cli@latest dev

# Iniciar Next.js (em outro terminal)
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia Next.js com Turbopack |
| `npm run build` | Build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa ESLint |

## Deploy

### Railway (Recomendado)

1. Conecte o repositório GitHub ao Railway
2. Configure as variáveis de ambiente
3. Build: `npm run build`
4. Start: `npm run start`

### Vercel

1. Importe o projeto na Vercel
2. Configure as variáveis de ambiente
3. Conecte o Inngest ao projeto

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── transcribe/    # Endpoints de transcrição
│   │   └── inngest/       # Handler do Inngest
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard do usuário
│   └── pricing/           # Página de preços
├── components/            # Componentes React
│   ├── ui/               # Shadcn UI primitives
│   └── transcription/    # Componentes de transcrição
├── lib/                   # Bibliotecas e integrações
│   ├── ai/               # Deepgram + LangChain
│   ├── supabase/         # Clients Supabase
│   ├── inngest/          # Funções background
│   └── rate-limit.ts     # Rate limiting
└── proxy.ts              # Middleware (auth + rate limit)
```

## Limites por Plano

| Recurso | Gratuito | Pago |
|---------|----------|------|
| Transcrições/mês | 5 | Ilimitado |
| Tamanho arquivo | 10MB | 50MB |
| Duração vídeo | 10 min | 60 min |

## Segurança

- Row Level Security (RLS) no Supabase
- Rate limiting via Upstash Redis
- Validação de inputs em todas as APIs
- Sanitização de prompts contra injection
