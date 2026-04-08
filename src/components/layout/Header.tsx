'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/i18n';
import { getTranslation } from '@/lib/i18n';

interface HeaderProps {
  showNewButton?: boolean;
  rightContent?: React.ReactNode;
  locale?: Locale;
  onToggleLocale?: () => void;
}

export function Header({ showNewButton = false, rightContent, locale, onToggleLocale }: HeaderProps) {
  // If locale/toggle are provided externally, use them; otherwise fall back to own hook
  const ownLocale = useLocale();
  const activeLocale = locale ?? ownLocale.locale;
  const handleToggle = onToggleLocale ?? ownLocale.toggleLocale;
  const t = getTranslation(activeLocale);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-neutral-900">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
          <span>MeetingsTranscript</span>
        </Link>
        <div className="flex items-center gap-3">
          {showNewButton && (
            <Link href="/dashboard/new">
              <Button size="sm">{t('header.newTranscription')}</Button>
            </Link>
          )}
          {rightContent}
          <button
            onClick={handleToggle}
            className="flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
            aria-label="Toggle language"
          >
            <span className={activeLocale === 'en' ? 'font-bold text-neutral-900' : ''}>EN</span>
            <span className="text-neutral-300">|</span>
            <span className={activeLocale === 'pt' ? 'font-bold text-neutral-900' : ''}>PT</span>
          </button>
        </div>
      </div>
    </header>
  );
}
