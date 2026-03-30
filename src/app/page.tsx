import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileAudio, Youtube, Mic, ArrowRight } from 'lucide-react';
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
        <section className="py-20 md:py-32">
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

        {/* Features */}
        <section className="border-t border-neutral-200 bg-white py-20">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-neutral-900">
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
        <section className="border-t border-neutral-200 py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center">
            <p className="text-sm text-neutral-400 font-mono tracking-wide">
              Deepgram Nova-3 &middot; Groq Llama 3.3 &middot; Next.js 16 &middot; React 19
              &middot; Tailwind CSS 4
            </p>
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
