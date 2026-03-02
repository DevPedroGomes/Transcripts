/**
 * Input validation and sanitization utilities for API routes
 */

import { MAX_FILE_SIZE } from './constants';

// Allowed audio MIME types
export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
];

export { MAX_FILE_SIZE };

/**
 * Validate and sanitize a prompt to prevent prompt injection
 */
export function sanitizePrompt(prompt: string | null | undefined): string | null {
  if (!prompt || typeof prompt !== 'string') {
    return null;
  }

  let sanitized = prompt.trim().slice(0, 2000);

  sanitized = sanitized.replace(/ignore\s+(previous|all|above)\s+instructions?/gi, '');
  sanitized = sanitized.replace(/disregard\s+(previous|all|above)\s+instructions?/gi, '');
  sanitized = sanitized.replace(/forget\s+(previous|all|above)\s+instructions?/gi, '');
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '');
  sanitized = sanitized.replace(/\[SYSTEM\]/gi, '');
  sanitized = sanitized.replace(/\[USER\]/gi, '');
  sanitized = sanitized.replace(/\[ASSISTANT\]/gi, '');

  return sanitized.trim() || null;
}

/**
 * Validate YouTube URL with stricter parsing
 */
export function validateYouTubeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
    if (!validDomains.includes(parsedUrl.hostname)) {
      return null;
    }

    let videoId: string | null = null;

    if (parsedUrl.hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1);
    } else {
      videoId = parsedUrl.searchParams.get('v');
      if (!videoId && parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/embed/')[1];
      }
      if (!videoId && parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/shorts/')[1];
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
}

/**
 * Validate audio file MIME type
 */
export function isValidAudioFile(file: File): boolean {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['mp3', 'wav', 'webm', 'ogg', 'flac', 'm4a', 'aac', 'mp4'];
    if (!extension || !validExtensions.includes(extension)) {
      return false;
    }
  }
  return true;
}

/**
 * Validate title input
 */
export function validateTitle(title: string | null | undefined): string | null {
  if (!title || typeof title !== 'string') {
    return null;
  }

  const sanitized = title.trim().slice(0, 200);
  if (sanitized.length < 3) {
    return null;
  }

  const clean = sanitized.replace(/[<>]/g, '');
  return clean || null;
}
