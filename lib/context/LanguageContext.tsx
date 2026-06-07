'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTranslations, type TranslationsDict } from '@/lib/utils/translations';

type Lang = 'en' | 'bn';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationsDict;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: getTranslations('en'),
});

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    // Synchronize client-side state with cookies/localStorage/navigator
    const match = document.cookie.match(/(?:^|; )lang=([^;]*)/);
    const cookieLang = match ? match[1] : null;
    if (cookieLang === 'en' || cookieLang === 'bn') {
      if (cookieLang !== lang) {
        setLangState(cookieLang as Lang);
      }
    } else {
      // Auto-detect browser language if cookie is not set
      const isBn = navigator.language.toLowerCase().startsWith('bn');
      const detected = isBn ? 'bn' : 'en';
      setLangState(detected);
      document.cookie = `lang=${detected}; path=/; max-age=31536000`;
    }
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
    // Reload page so server components are also requested with the updated cookie
    window.location.reload();
  };

  const t = getTranslations(lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
