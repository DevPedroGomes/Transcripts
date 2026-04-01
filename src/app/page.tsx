import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileAudio, Youtube, Mic, ArrowRight, Waves, Brain, FileText, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';

const features = [
  {
    icon: FileAudio,
    title: 'Arquivos de Audio',
    description: 'Upload de arquivos MP3, WAV, M4A, OGG, FLAC, WebM e AAC com ate 50MB.',
    href: '/dashboard/new?type=file',
  },
  {
    icon: Youtube,
    title: 'Videos do YouTube',
    description: 'Cole o link de qualquer video publico do YouTube e extraia o texto completo.',
    href: '/dashboard/new?type=youtube',
  },
  {
    icon: Mic,
    title: 'Microfone ao Vivo',
    description: 'Transcreva em tempo real usando seu microfone com Deepgram Nova-3.',
    href: '/dashboard/new?type=realtime',
  },
];

const pipelineSteps = [
  {
    icon: Waves,
    title: 'Captura de Audio',
    description: 'O audio e capturado via upload de arquivo, stream de YouTube (ytdl-core), ou microfone do navegador via WebSocket.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'Speech-to-Text (Deepgram)',
    description: 'O audio e enviado para a API Deepgram Nova-3, que converte fala em texto com alta precisao, suportando multiplos idiomas.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: FileText,
    title: 'Transcricao Bruta',
    description: 'O texto bruto retornado pelo Deepgram e salvo. Inclui timestamps, duracao e metadados da fonte original.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: Sparkles,
    title: 'Processamento com IA (Groq)',
    description: 'O Llama 3.3 70B via Groq formata, organiza e limpa a transcricao. Voce pode customizar o prompt de processamento.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Header
        rightContent={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-neutral-200 text-neutral-900 hover:bg-neutral-50">
              Dashboard
            </Button>
          </Link>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter sm:text-5xl md:text-6xl leading-[0.95] text-neutral-900">
              Transforme Audio em Texto com IA
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-neutral-500 leading-relaxed">
              Transcreva reunioes, aulas, entrevistas e qualquer conteudo de audio com precisao.
              Upload de arquivos, links do YouTube ou gravacao ao vivo.
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/dashboard/new">
                <Button size="lg" className="gap-2 rounded-full px-8">
                  Comecar <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-neutral-200 text-neutral-900 hover:bg-white rounded-full px-8">
                  Ver Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-t border-neutral-200 bg-white py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Pipeline</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
              Como funciona
            </h2>
            <p className="text-neutral-500 mb-8 max-w-2xl">
              Cada audio passa por 4 etapas automaticas, do input ate a transcricao final formatada.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.title} className="bg-white border border-neutral-200 rounded-2xl p-5 card-shadow hover-lift">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`rounded-xl p-2 ${step.color}`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono text-neutral-400">Etapa {i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features (3 input methods) */}
        <section className="border-t border-neutral-200 py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-neutral-900">
              Tres formas de transcrever
            </h2>
            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
              {features.map((f) => (
                <Link
                  key={f.title}
                  href={f.href}
                  className="group bg-white border border-neutral-200 rounded-2xl p-6 hover-lift card-shadow"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-orange-50 p-3">
                    <f.icon className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="mb-2 font-semibold text-neutral-900">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-500">{f.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="border-t border-neutral-200 py-12 bg-white">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-sm max-w-3xl mx-auto">
              {[
                { label: "Speech-to-Text", tech: "Deepgram Nova-3" },
                { label: "LLM", tech: "Groq Llama 3.3 70B" },
                { label: "Realtime", tech: "WebSocket + Deepgram" },
                { label: "Frontend", tech: "Next.js 16, React 19" },
                { label: "Styling", tech: "Tailwind CSS 4" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <p className="font-semibold text-neutral-900 text-xs">{item.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.tech}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-6 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} MeetingsTranscript
          </p>
        </div>
      </footer>
    </div>
  );
}
