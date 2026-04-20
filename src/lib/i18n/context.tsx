"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Locale, Translations, TranslationValue } from "./types";
import { defaultLocale, supportedLocales } from "./types";
import en from "./en";
import vi from "./vi";

// Translation registry - extensible: just import and add new locale
const translationMap: Record<Locale, Translations> = { en, vi };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split(".");
  let current: TranslationValue = obj;
  for (const key of keys) {
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < current.length) {
        current = current[idx] as TranslationValue;
      } else {
        return path;
      }
    } else if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, TranslationValue>)[key];
    } else {
      return path; // fallback to key
    }
  }
  return typeof current === "string" ? current : path;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  try {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && supportedLocales.includes(saved)) return saved;
  } catch {}
  return defaultLocale;
}

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || getInitialLocale);

  // Sync localStorage when initialLocale provided (from URL)
  useEffect(() => {
    if (initialLocale) {
      try { localStorage.setItem("locale", initialLocale); } catch {}
    }
  }, [initialLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    try { localStorage.setItem("locale", newLocale); } catch {}
    // Navigate to new locale URL
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      if (segments[0] && (supportedLocales as string[]).includes(segments[0])) {
        segments[0] = newLocale;
      } else {
        segments.unshift(newLocale);
      }
      const newPath = "/" + segments.join("/") + window.location.search + window.location.hash;
      window.location.href = newPath;
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      let value = getNestedValue(translationMap[locale], key);
      // Fallback to English if key not found in current locale
      if (value === key && locale !== "en") {
        value = getNestedValue(translationMap.en, key);
      }
      // Interpolate params: {{name}} → value
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
        }
      }
      return value;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslation() {
  const { t, locale } = useLocale();
  return { t, locale };
}
