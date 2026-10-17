'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getBrandConfig } from '../../lib/utils';
import { Loader2, Globe } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const brand = getBrandConfig();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('balos_language_preference') as 'en' | 'ar' | null;
      if (saved === 'ar' || saved === 'en') {
        setLang(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      }
    } catch {}
  }, []);

  const changeLang = (newLang: 'en' | 'ar') => {
    setLang(newLang);
    try {
      localStorage.setItem('balos_language_preference', newLang);
      document.cookie = `balos_language_preference=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    } catch {}
  };

  const isAr = lang === 'ar';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-seaglass text-ink relative">
      {/* Top right 1-click language switcher */}
      <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center p-0.5 rounded-xl border border-border bg-surface shadow-xs">
        <button
          type="button"
          onClick={() => changeLang('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
            lang === 'en'
              ? 'bg-ink text-white shadow-xs font-bold'
              : 'text-ink-muted hover:text-ink hover:bg-seaglass'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => changeLang('ar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
            lang === 'ar'
              ? 'bg-ink text-white shadow-xs font-bold'
              : 'text-ink-muted hover:text-ink hover:bg-seaglass'
          }`}
        >
          العربية
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Brand identity header */}
        <div className="mb-8 text-center">
          {brand.logoUrl ? (
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-10 mx-auto mb-4 object-contain"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-creek text-white font-heading font-bold text-xl mb-3 shadow-sm">
              {brand.name.charAt(0)}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-ink font-heading">
            {brand.name}
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            {isAr
              ? 'تسجيل الدخول للوصول إلى لوحة العمليات العقارية'
              : 'Sign in to access your operations dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-coral-light border border-coral/30 text-coral text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek text-sm transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-white text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-creek/20 focus:border-creek text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-creek hover:bg-creek-hover active:bg-creek-active text-white text-sm font-medium transition flex items-center justify-center shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          Protected agency environment. Powered by Balos AI.
        </p>
      </div>
    </main>
  );
}
