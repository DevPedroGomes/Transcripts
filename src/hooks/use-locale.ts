'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTranslation, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'transcripts-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'pt';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pt') return stored;
  } catch {}
  return 'pt';
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    // Sync state with localStorage on mount (handles SSR mismatch)
    const stored = getInitialLocale();
    if (stored !== locale) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
    // Dispatch storage event so other tabs/components can react
    window.dispatchEvent(new Event('locale-change'));
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'pt' ? 'en' : 'pt');
  }, [locale, setLocale]);

  const t = getTranslation(locale);

  return { locale, setLocale, toggleLocale, t };
}
