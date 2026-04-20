// Extensible i18n type system
// To add a new language: 1) Add to Locale union 2) Create translations file 3) Add to localeConfig

export type Locale = "en" | "vi";
// Future: "ja" | "ko" | "zh" | "fr" | "de" etc.

export interface LocaleConfig {
  code: Locale;
  name: string;        // Native name
  nameEn: string;      // English name
  flag: string;        // Emoji flag
  direction: "ltr" | "rtl";
  dateLocale: string;  // for Intl.DateTimeFormat
}

export const localeConfigs: Record<Locale, LocaleConfig> = {
  en: {
    code: "en",
    name: "English",
    nameEn: "English",
    flag: "🇺🇸",
    direction: "ltr",
    dateLocale: "en-US",
  },
  vi: {
    code: "vi",
    name: "Tiếng Việt",
    nameEn: "Vietnamese",
    flag: "🇻🇳",
    direction: "ltr",
    dateLocale: "vi-VN",
  },
  // Future locales: just add here + create translation file
};

export const defaultLocale: Locale = "en";
export const supportedLocales = Object.keys(localeConfigs) as Locale[];

// Translation key structure - nested object with string leaves
export type TranslationValue = string | TranslationValue[] | { [key: string]: TranslationValue };
export type Translations = Record<string, TranslationValue>;
