'use client';

import { Sparkles } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface PromptPresetsProps {
  onSelect: (prompt: string) => void;
}

const PRESETS = ['summary', 'actions', 'minutes', 'questions'] as const;

export function PromptPresets({ onSelect }: PromptPresetsProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        {t('presets.label')}:
      </span>
      {PRESETS.map((key) => {
        const labelKey = `presets.${key}.label` as Parameters<typeof t>[0];
        const promptKey = `presets.${key}.prompt` as Parameters<typeof t>[0];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(t(promptKey))}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
