'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { Language, Direction, Translations, translations } from '../../lib/i18n';

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Ensure DOM is fixed to English LTR
  useEffect(() => {
    try {
      localStorage.removeItem('balos_language_preference');
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang: 'en',
        dir: 'ltr',
        isArabic: false,
        t: translations.en,
        setLang: () => {},
        toggleLang: () => {},
      }}
    >
      <div dir="ltr">
        {children}
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
