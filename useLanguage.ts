
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { translations, LanguageKey } from '../utils/translations';

type LanguageCode = 'en' | 'bn';

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (language: LanguageCode) => void;
  t: (key: LanguageKey) => string;
}

export const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    // Initialize language from localStorage, default to 'en'
    const storedLang = localStorage.getItem('appLang');
    return (storedLang === 'en' || storedLang === 'bn') ? storedLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('appLang', lang);
  }, [lang]);

  const setLang = useCallback((language: LanguageCode) => {
    setLangState(language);
  }, []);

  const t = useCallback((key: LanguageKey): string => {
    // Fallback to English if the key is missing in the current language
    return translations[lang][key] || translations['en'][key] || String(key);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
  }), [lang, setLang, t]);

  // Fix: Ensure the opening parenthesis for multi-line JSX immediately follows `return`
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
