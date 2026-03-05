import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileAudio, Youtube, Mic } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header
        rightContent={
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        }
      />
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Transforme Áudio em Texto com IA
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Transcreva reuniões, aulas, entrevistas e qualquer conteúdo de áudio com precisão
                usando tecnologia de ponta em IA.
              </p>
            </div>
            <Link href="/dashboard">
              <Button size="lg">Começar</Button>
            </Link>
          </div>
        </section>
        <section className="container py-12 md:py-24">
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Arquivos de Audio</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Faca upload de arquivos MP3, WAV, M4A e outros formatos para transcricao.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Youtube className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Videos do YouTube</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Cole o link de qualquer video do YouTube e extraia o texto completo.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Microfone ao Vivo</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Transcreva em tempo real usando seu microfone com Deepgram Nova-3.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} MeetingsTranscript. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
