'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, Direction, Translations, translations, getDir } from '../../lib/i18n';

import { Globe } from 'lucide-react';

interface LanguageContextType {
  lang: Language;
  dir: Direction;
  isArabic: boolean;
  t: Translations;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  dir: 'ltr',
  isArabic: false,
  t: translations.en,
  setLang: () => {},
  toggleLang: () => {},
});

const STORAGE_KEY = 'balos_language_preference';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  // Sync initial language preference from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === 'ar' || saved === 'en') {
        setLangState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = getDir(saved);
      } else {
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
      }
    } catch {
      // LocalStorage access might fail in privacy modes; fallback to English
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
      document.documentElement.dir = getDir(newLang);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const dir = useMemo(() => getDir(lang), [lang]);
  const isArabic = lang === 'ar';
  const t = useMemo(() => translations[lang] || translations.en, [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        dir,
        isArabic,
        t,
        setLang,
        toggleLang,
      }}
    >
      <div dir={dir} className={isArabic ? 'font-arabic' : ''}>
        {children}

        {/* Standalone 1-Click Floating Language Switcher Widget */}
        <aside
          aria-label="Language Switcher"
          className="fixed bottom-20 md:bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 backdrop-blur-md border border-border shadow-lg ring-1 ring-black/5"
        >
          <div className="flex items-center gap-1.5 pl-2.5 pr-1 rtl:pl-1 rtl:pr-2.5 text-ink-soft">
            <Globe className="w-3.5 h-3.5 text-creek shrink-0" />
            <span className="text-[11px] font-bold text-ink">Lang:</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                lang === 'en'
                  ? 'bg-ink text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
              title="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                lang === 'ar'
                  ? 'bg-ink text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink hover:bg-seaglass'
              }`}
              title="التحويل إلى العربية"
            >
              العربية
            </button>
          </div>
        </aside>
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
