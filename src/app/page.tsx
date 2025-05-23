import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-xl">MeetingsTranscript</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Transforme Áudio em Texto com IA
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Transcreva reuniões, aulas, entrevistas e qualquer conteúdo de áudio com precisão
                usando tecnologia de ponta em IA.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/auth/signup">
                <Button size="lg">Comece Agora</Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  Ver Planos
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="container py-12 md:py-24">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  className="h-6 w-6 text-primary">
                  <path d="M21 15V6"></path>
                  <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
                  <path d="M12 12H3"></path>
                  <path d="M16 6H3"></path>
                  <path d="M12 18H3"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold">Arquivos de Áudio</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Faça upload de seus arquivos MP3 ou WAV e receba a transcrição rapidamente.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  className="h-6 w-6 text-primary">
                  <path d="m7 18-4-4 4-4"></path>
                  <path d="m17 6 4 4-4 4"></path>
                  <path d="m14 9-4 6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold">Vídeos do YouTube</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Cole o link de qualquer vídeo do YouTube e extraia o texto completo.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-4 rounded-lg border p-6">
              <div className="rounded-full bg-primary/10 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                  className="h-6 w-6 text-primary">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-bold">Gravação ao Vivo</h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Grave reuniões em tempo real e obtenha a transcrição organizada com análise inteligente.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-balance text-center text-sm text-gray-500 dark:text-gray-400 md:text-left">
            &copy; {new Date().getFullYear()} MeetingsTranscript. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
