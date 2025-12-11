/**
 * Input validation and sanitization utilities for API routes
 */

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

// Maximum file sizes
export const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_PAID = 50 * 1024 * 1024; // 50MB

// Maximum video duration in seconds
export const MAX_VIDEO_DURATION_FREE = 600; // 10 minutes
export const MAX_VIDEO_DURATION_PAID = 3600; // 1 hour

// Monthly transcription limits
export const MONTHLY_LIMIT_FREE = 5;

/**
 * Validate and sanitize a prompt to prevent prompt injection
 * @param prompt - Raw user input
 * @returns Sanitized prompt
 */
export function sanitizePrompt(prompt: string | null | undefined): string | null {
  if (!prompt || typeof prompt !== 'string') {
    return null;
  }

  // Trim and limit length
  let sanitized = prompt.trim().slice(0, 2000);

  // Remove potential injection patterns
  // Remove attempts to override system prompts
  sanitized = sanitized.replace(/ignore\s+(previous|all|above)\s+instructions?/gi, '');
  sanitized = sanitized.replace(/disregard\s+(previous|all|above)\s+instructions?/gi, '');
  sanitized = sanitized.replace(/forget\s+(previous|all|above)\s+instructions?/gi, '');

  // Remove markdown code blocks that might contain injection
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '');

  // Remove attempts to break out of prompt context
  sanitized = sanitized.replace(/\[SYSTEM\]/gi, '');
  sanitized = sanitized.replace(/\[USER\]/gi, '');
  sanitized = sanitized.replace(/\[ASSISTANT\]/gi, '');

  return sanitized.trim() || null;
}

/**
 * Validate YouTube URL with stricter parsing
 * @param url - URL to validate
 * @returns Validated and normalized URL or null if invalid
 */
export function validateYouTubeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Parse the URL properly
    const parsedUrl = new URL(url);

    // Check for valid YouTube domains
    const validDomains = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'];
    if (!validDomains.includes(parsedUrl.hostname)) {
      return null;
    }

    // Extract video ID based on URL format
    let videoId: string | null = null;

    if (parsedUrl.hostname === 'youtu.be') {
      // Format: https://youtu.be/VIDEO_ID
      videoId = parsedUrl.pathname.slice(1);
    } else {
      // Format: https://youtube.com/watch?v=VIDEO_ID
      videoId = parsedUrl.searchParams.get('v');

      // Also check for embed format
      if (!videoId && parsedUrl.pathname.startsWith('/embed/')) {
        videoId = parsedUrl.pathname.split('/embed/')[1];
      }

      // Also check for shorts format
      if (!videoId && parsedUrl.pathname.startsWith('/shorts/')) {
        videoId = parsedUrl.pathname.split('/shorts/')[1];
      }
    }

    // Validate video ID format (11 characters, alphanumeric + underscore + hyphen)
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    // Return normalized URL
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch {
    return null;
  }
}

/**
 * Validate audio file MIME type
 * @param file - File to validate
 * @returns true if valid audio file
 */
export function isValidAudioFile(file: File): boolean {
  // Check MIME type
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    // Some browsers might not set the correct MIME type
    // Fall back to extension check
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
 * @param title - Title to validate
 * @returns Sanitized title or null if invalid
 */
export function validateTitle(title: string | null | undefined): string | null {
  if (!title || typeof title !== 'string') {
    return null;
  }

  // Trim and limit length
  const sanitized = title.trim().slice(0, 200);

  // Must have at least 3 characters
  if (sanitized.length < 3) {
    return null;
  }

  // Remove potentially harmful characters but keep Unicode for i18n
  const clean = sanitized.replace(/[<>]/g, '');

  return clean || null;
}

/**
 * Validate UUID format
 * @param id - UUID to validate
 * @returns true if valid UUID
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
