# Quick Setup Guide - MeetingsTranscript

Guia passo a passo para configurar e rodar a aplicação MeetingsTranscript com arquitetura serverless moderna.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Configuração de Serviços](#2-configuração-de-serviços)
   - [Supabase (Banco de Dados & Auth)](#21-supabase)
   - [Deepgram (Transcrição)](#22-deepgram)
   - [OpenAI (Inteligência)](#23-openai)
   - [Upstash (Rate Limiting)](#24-upstash-redis)
   - [Inngest (Background Jobs)](#25-inngest)
3. [Configurar Variáveis de Ambiente](#3-configurar-variáveis-de-ambiente)
4. [Instalação e Execução Local](#4-instalação-e-execução-local)
5. [Deploy em Produção](#5-deploy-em-produção)

---

## 1. Pré-requisitos

- **Node.js** 18+ ([download](https://nodejs.org/))
- **npm** ou **yarn**
- **Git**

> **Nota:** Não é mais necessário instalar FFmpeg localmente, pois o processamento de áudio foi refatorado para ser compatível com serverless.

---

## 2. Configuração de Serviços

### 2.1 Supabase
O Supabase gerencia autenticação, banco de dados e armazenamento de arquivos.

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **Project Settings > API** e copie:
   - Project URL
   - `anon` public key
   - `service_role` secret key (Mantenha segura!)
3. Vá em **SQL Editor** e execute o script em `supabase/schema.sql` para criar as tabelas.
4. Vá em **Storage** e crie um bucket público chamado `transcriptions`.

### 2.2 Deepgram
Responsável pela transcrição de áudio Speech-to-Text.

1. Crie uma conta em [deepgram.com](https://deepgram.com).
2. Crie uma nova API Key com permissões de membro.
3. Copie a chave gerada.

### 2.3 OpenAI
Responsável pelo processamento inteligente (resumos, extração de insights).

1. Crie uma conta em [platform.openai.com](https://platform.openai.com).
2. Gere uma nova API Key.
3. Certifique-se de ter créditos disponíveis na conta.

### 2.4 Upstash Redis
Responsável pelo controle de taxa (Rate Limiting) distribuído.

1. Crie uma conta em [upstash.com](https://upstash.com).
2. Crie um novo banco de dados Redis.
3. No painel do banco, copie as variáveis na seção **REST API**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 2.5 Inngest
Responsável pelo processamento de tarefas em segundo plano (transcrições longas).

1. Para desenvolvimento local, o Inngest roda localmente sem necessidade de conta.
2. Para produção, crie uma conta em [inngest.com](https://inngest.com) e conecte com seu projeto Vercel.

---

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto e preencha com suas chaves:

```env
# APP
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta

# DEEPGRAM
DEEPGRAM_API_KEY=sua-chave-deepgram

# OPENAI
OPENAI_API_KEY=sk-sua-chave-openai

# UPSTASH REDIS (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://seu-banco.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-upstash

# INNGEST (Apenas para produção)
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=

# SOCKET SERVER (Opcional - Transcrição ao Vivo)
NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:3001
```

---

## 4. Instalação e Execução Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento do Inngest
O Inngest precisa rodar em paralelo para processar os eventos de transcrição.
```bash
npx inngest-cli@latest dev
```
Isso abrirá o dashboard do Inngest em `http://localhost:8288`.

### 3. Iniciar a aplicação Next.js
Em outro terminal:
```bash
npm run dev
```
Acesse `http://localhost:3000`.

### 4. (Opcional) Iniciar servidor Socket
Se for testar a transcrição ao vivo:
```bash
npm run dev:socket
```

---

## 5. Deploy em Produção

### Vercel (Recomendado)

1. Faça o push do código para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as variáveis de ambiente (copie do `.env.local`).
4. **Deploy!**

### Configurando o Inngest em Produção

1. Após o deploy na Vercel, vá ao dashboard do Inngest.
2. Conecte seu projeto Vercel.
3. O Inngest detectará automaticamente suas funções.
4. Adicione as variáveis `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` fornecidas pelo Inngest nas configurações do seu projeto na Vercel.

### Observação sobre WebSocket
A funcionalidade de transcrição ao vivo via WebSocket (`src/server/socket.ts`) requer um servidor Node.js persistente. Na Vercel (serverless), isso não funcionará nativamente.
- **Opção A:** Desativar a funcionalidade ao vivo se não for crítica.
- **Opção B:** Deploy do arquivo `src/server/socket.ts` em um serviço como Railway ou Render.
