'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileAudio, Youtube, Mic, ArrowRight, Waves, Brain, FileText, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useLocale } from '@/hooks/use-locale';

export default function Home() {
  const { locale, toggleLocale, t } = useLocale();

  const features = [
    {
      icon: FileAudio,
      title: t('features.audio.title'),
      description: t('features.audio.description'),
      href: '/dashboard/new?type=file',
    },
    {
      icon: Youtube,
      title: t('features.youtube.title'),
      description: t('features.youtube.description'),
      href: '/dashboard/new?type=youtube',
    },
    {
      icon: Mic,
      title: t('features.mic.title'),
      description: t('features.mic.description'),
      href: '/dashboard/new?type=realtime',
    },
  ];

  const pipelineSteps = [
    {
      icon: Waves,
      title: t('pipeline.step1.title'),
      description: t('pipeline.step1.description'),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: Brain,
      title: t('pipeline.step2.title'),
      description: t('pipeline.step2.description'),
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: FileText,
      title: t('pipeline.step3.title'),
      description: t('pipeline.step3.description'),
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: Sparkles,
      title: t('pipeline.step4.title'),
      description: t('pipeline.step4.description'),
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Header
        locale={locale}
        onToggleLocale={toggleLocale}
        rightContent={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="border-neutral-200 text-neutral-900 hover:bg-neutral-50">
              {t('header.dashboard')}
            </Button>
          </Link>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter sm:text-5xl md:text-6xl leading-[0.95] text-neutral-900">
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-neutral-500 leading-relaxed">
              {t('hero.description')}
            </p>
            <div className="mt-10 flex gap-4">
              <Link href="/dashboard/new">
                <Button size="lg" className="gap-2 rounded-full px-8">
                  {t('hero.cta')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-neutral-200 text-neutral-900 hover:bg-white rounded-full px-8">
                  {t('hero.dashboard')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-t border-neutral-200 bg-white py-16">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">{t('pipeline.label')}</span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">
              {t('pipeline.title')}
            </h2>
            <p className="text-neutral-500 mb-8 max-w-2xl">
              {t('pipeline.description')}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.title} className="bg-white border border-neutral-200 rounded-2xl p-5 card-shadow hover-lift">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`rounded-xl p-2 ${step.color}`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono text-neutral-400">{t('pipeline.step')} {i + 1}</span>
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
              {t('features.title')}
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
                { label: t('tech.speechToText'), tech: "Deepgram Nova-3" },
                { label: t('tech.llm'), tech: "Groq Llama 3.3 70B" },
                { label: t('tech.realtime'), tech: "WebSocket + Deepgram" },
                { label: t('tech.frontend'), tech: "Next.js 16, React 19" },
                { label: t('tech.styling'), tech: "Tailwind CSS 4" },
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
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
