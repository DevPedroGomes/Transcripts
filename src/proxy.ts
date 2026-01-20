import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { checkRateLimit, getClientIp, createRateLimitHeaders } from './lib/rate-limit';

async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIp(request);

    // Use stricter limits for transcription endpoints
    if (pathname.startsWith('/api/transcribe/')) {
      const rateLimitKey = `transcribe:${clientIP}`;
      const result = await checkRateLimit(rateLimitKey, 'transcription');

      // Add rate limit headers to all responses
      const rateLimitHeaders = createRateLimitHeaders(result);
      for (const key of Object.keys(rateLimitHeaders)) {
        response.headers.set(key, rateLimitHeaders[key]);
      }

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Limite de requisições excedido. Tente novamente mais tarde.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: rateLimitHeaders,
          }
        );
      }
    } else {
      // General API rate limiting
      const rateLimitKey = `api:${clientIP}`;
      const result = await checkRateLimit(rateLimitKey, 'api');

      const rateLimitHeaders = createRateLimitHeaders(result);
      for (const key of Object.keys(rateLimitHeaders)) {
        response.headers.set(key, rateLimitHeaders[key]);
      }

      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Muitas requisições. Tente novamente em breve.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers: rateLimitHeaders,
          }
        );
      }
    }
  }

  // Apply rate limiting to auth endpoints
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
    const clientIP = getClientIp(request);
    const rateLimitKey = `auth:${clientIP}`;
    const result = await checkRateLimit(rateLimitKey, 'auth');

    if (!result.success) {
      const rateLimitHeaders = createRateLimitHeaders(result);

      // For page routes, redirect to a rate limit page or show error
      if (!pathname.startsWith('/api/')) {
        const errorUrl = new URL('/auth/login', request.url);
        errorUrl.searchParams.set('error', 'rate_limit');
        return NextResponse.redirect(errorUrl);
      }

      return NextResponse.json(
        {
          error: 'Muitas tentativas de login. Tente novamente mais tarde.',
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }
  }

  // Supabase auth session handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options?: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se não estiver autenticado e tentar acessar rotas protegidas
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/pricing');

  if (!session && !isAuthRoute && !isPublicRoute && !isApiRoute) {
    const redirectUrl = new URL('/auth/login', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // Se estiver autenticado e tentar acessar rotas de autenticação
  if (session && isAuthRoute) {
    const redirectUrl = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
