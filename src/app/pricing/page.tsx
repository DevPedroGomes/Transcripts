'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para uso pessoal e teste da plataforma.',
    price: 0,
    priceId: '',
    features: [
      '5 transcrições por mês',
      'Arquivos de até 10 minutos',
      'Análise básica com IA',
      'Exportação em TXT',
      '100MB de armazenamento',
    ],
    limits: {
      transcriptions_per_month: 5,
      max_audio_duration_minutes: 10,
      max_storage_gb: 0.1,
    },
    cta: 'Começar grátis',
  },
  {
    id: 'pro',
    name: 'Profissional',
    description: 'Para profissionais que precisam de transcrições regulares.',
    price: 29,
    priceId: 'price_1abc123def456ghi',
    features: [
      '30 transcrições por mês',
      'Arquivos de até 60 minutos',
      'Análise avançada com IA',
      'Transcrição ao vivo',
      'Exportação em TXT, DOC, PDF',
      '5GB de armazenamento',
      'Prioridade no suporte',
    ],
    limits: {
      transcriptions_per_month: 30,
      max_audio_duration_minutes: 60,
      max_storage_gb: 5,
    },
    cta: 'Assinar plano',
  },
  {
    id: 'business',
    name: 'Empresarial',
    description: 'Para equipes e organizações com alta demanda.',
    price: 79,
    priceId: 'price_2jkl789mno123pqr',
    features: [
      '100 transcrições por mês',
      'Arquivos de até 180 minutos',
      'Análise avançada com IA',
      'Transcrição ao vivo',
      'Exportação em todos os formatos',
      '20GB de armazenamento',
      'Acesso para equipes (5 usuários)',
      'API de integração',
      'Suporte prioritário 24/7',
    ],
    limits: {
      transcriptions_per_month: 100,
      max_audio_duration_minutes: 180,
      max_storage_gb: 20,
    },
    cta: 'Contatar vendas',
  },
];

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Link href="/">
              <span className="text-xl">MeetingsTranscript</span>
            </Link>
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
        <section className="py-12 md:py-24">
          <div className="container flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
                Escolha o plano ideal para suas necessidades
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed">
                Oferecemos opções para todos os tipos de usuários, desde uso pessoal até
                empresarial.
              </p>
            </div>

            <div className="flex items-center space-x-2 mt-8">
              <Button
                variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                onClick={() => setBillingInterval('monthly')}
              >
                Mensal
              </Button>
              <Button
                variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                onClick={() => setBillingInterval('yearly')}
              >
                Anual <span className="ml-1 text-xs">(20% off)</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="container pb-12 md:pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.id === 'pro' ? 'border-primary shadow-lg' : ''}>
                <CardHeader>
                  {plan.id === 'pro' && (
                    <p className="text-sm text-primary font-medium mb-2">Mais Popular</p>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      R${' '}
                      {billingInterval === 'yearly'
                        ? Math.floor(plan.price * 0.8) * 12
                        : plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-gray-500 ml-1">
                        /{billingInterval === 'yearly' ? 'ano' : 'mês'}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.id === 'pro' ? 'default' : 'outline'}
                    asChild
                  >
                    <Link
                      href={
                        plan.id === 'free'
                          ? '/auth/signup'
                          : plan.id === 'business'
                            ? '/contact'
                            : '/auth/signup?plan=pro'
                      }
                    >
                      {plan.cta}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="container pb-24">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Precisa de um plano personalizado?</h2>
            <p className="text-gray-500 mb-6 max-w-xl mx-auto">
              Para grandes empresas e casos de uso específicos, oferecemos planos personalizados que
              atendem às suas necessidades exclusivas.
            </p>
            <Button asChild>
              <Link href="/contact">Fale com nossa equipe</Link>
            </Button>
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
