"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import es from "./locales/es.json";
import en from "./locales/en.json";

type Locale = "es" | "en";
type Translations = typeof es;

interface I18nContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

const translations: Record<Locale, Translations> = { es, en };

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    // Basic persistence
    const saved = localStorage.getItem("wealthos_locale") as Locale;
    if (saved && (saved === "es" || saved === "en")) {
      setLocale(saved);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("wealthos_locale", newLocale);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[locale];

    for (const k of keys) {
      if (value[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      value = value[k];
    }

    if (typeof value !== "string") {
      console.warn(`Translation key does not resolve to a string: ${key}`);
      return key;
    }

    if (params) {
      return Object.keys(params).reduce((str, paramKey) => {
        return str.replace(`{${paramKey}}`, String(params[paramKey]));
      }, value);
    }

    return value;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
