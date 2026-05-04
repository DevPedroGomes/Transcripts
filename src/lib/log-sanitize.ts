/**
 * Strip secret-like substrings from any string before logging.
 * Patterns covered:
 *  - Deepgram `Token <key>` headers
 *  - Groq `gsk_...` API keys
 *  - HTTP `Bearer <token>` headers
 *  - Stripe-style `sk_test_...` / `sk_live_...`
 *  - Deepgram-style 40-char hex IDs starting with `3ae33e`
 */
const PATTERNS: RegExp[] = [
  /Token\s+\w+/gi,
  /gsk_\w+/gi,
  /Bearer\s+\w+/gi,
  /sk_(test|live)_\w+/gi,
  /3ae33e\w+/gi,
];

export function sanitize(s: string): string {
  let out = s;
  for (const re of PATTERNS) {
    out = out.replace(re, '<redacted>');
  }
  return out;
}
