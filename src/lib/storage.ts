'use client';

import type { StoredTranscription } from './types';

const STORAGE_KEY = 'meetingstranscript_transcriptions';

function getAll(): StoredTranscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: StoredTranscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error(
        'Armazenamento local cheio. Exclua transcrições antigas para liberar espaço.'
      );
    }
    throw e;
  }
}

export function getAllTranscriptions(): StoredTranscription[] {
  return getAll().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getTranscriptionById(id: string): StoredTranscription | null {
  return getAll().find((t) => t.id === id) ?? null;
}

export function addTranscription(t: StoredTranscription): void {
  const items = getAll();
  items.push(t);
  persist(items);
}

export function updateTranscription(
  id: string,
  updates: Partial<StoredTranscription>
): StoredTranscription | null {
  const items = getAll();
  const index = items.findIndex((t) => t.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
  persist(items);
  return items[index];
}

export function deleteTranscription(id: string): boolean {
  const items = getAll();
  const filtered = items.filter((t) => t.id !== id);
  if (filtered.length === items.length) return false;
  persist(filtered);
  return true;
}
