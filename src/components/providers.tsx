"use client";

import { type ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n/context";
import { CurrencyProvider } from "@/lib/currency/context";
import type { Locale } from "@/lib/i18n/types";

export function Providers({ children, locale }: { children: ReactNode; locale?: Locale }) {
  return (
    <LocaleProvider initialLocale={locale}>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </LocaleProvider>
  );
}
