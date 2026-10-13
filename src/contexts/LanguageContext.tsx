import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import translation files
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';
import taTranslations from '@/locales/ta.json';
import teTranslations from '@/locales/te.json';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te';

interface Language {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }
];

const translations = {
  en: enTranslations,
  hi: hiTranslations,
  ta: taTranslations,
  te: teTranslations
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Get initial language from localStorage or default to English
  const [language, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('bluecarbon_language');
    return (saved as SupportedLanguage) || 'en';
  });

  // Save language preference to localStorage
  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    localStorage.setItem('bluecarbon_language', lang);
    
    // Set document language attribute for accessibility
    document.documentElement.lang = lang;
  };

  // Translation function with nested key support
  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // If key not found, try English as fallback
        let englishValue: unknown = translations.en;
        for (const ek of keys) {
          if (englishValue && typeof englishValue === 'object' && ek in englishValue) {
            englishValue = (englishValue as Record<string, unknown>)[ek];
          } else {
            englishValue = null;
            break;
          }
        }
        return (englishValue as string) || fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  };

  // Set initial document language
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t,
    languages: SUPPORTED_LANGUAGES
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Utility hook for easier translation access
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};