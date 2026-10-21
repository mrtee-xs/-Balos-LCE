import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const DEFAULT_SUPABASE_URL = 'https://xsiitikrcckzivadvact.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaWl0aWtyY2Nreml2YWR2YWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODU3MDQsImV4cCI6MjEwNTU2MTcwNH0.c7ifHSefGyqy_MsZj63fJTXA2d_9rs7aaKSJJqjJmvE';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // 1. Immediately allow public pages and API endpoints (MCP connector, webhooks, Privacy Policy, Terms)
  const isPublicOrApi =
    pathname.startsWith('/api') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms');

  if (isPublicOrApi) {
    return response;
  }

  // 2. Resilient Supabase configuration (falls back to project credentials if Vercel env not yet configured)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Never crash Edge Middleware with 500 error
    if (!pathname.startsWith('/login') && !pathname.startsWith('/auth/callback')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = pathname.startsWith('/login');
    const isAuthCallback = pathname.startsWith('/auth/callback');

    // If user is not signed in and attempting to access protected dashboard routes
    if (!user && !isLoginPage && !isAuthCallback) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If user is signed in and attempting to access login page
    if (user && isLoginPage) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  } catch {
    // Graceful recovery: if auth check throws, redirect protected pages to login
    if (!pathname.startsWith('/login') && !pathname.startsWith('/auth/callback')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}
