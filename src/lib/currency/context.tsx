"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CurrencyCode } from "./types";
import { defaultCurrency, supportedCurrencies, currencyConfigs } from "./types";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  /** Format a USD amount into current currency */
  formatPrice: (usdAmount: number) => string;
  /** Convert USD to current currency (raw number) */
  convert: (usdAmount: number) => number;
  config: typeof currencyConfigs[CurrencyCode];
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function getInitialCurrency(): CurrencyCode {
  if (typeof window === "undefined") return defaultCurrency;
  try {
    const saved = localStorage.getItem("currency") as CurrencyCode | null;
    if (saved && supportedCurrencies.includes(saved)) return saved;
  } catch {}
  return defaultCurrency;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(getInitialCurrency);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try { localStorage.setItem("currency", code); } catch {}
  }, []);

  const convert = useCallback(
    (usdAmount: number) => {
      const config = currencyConfigs[currency];
      return Math.round(usdAmount * config.rateFromUSD);
    },
    [currency]
  );

  const formatPrice = useCallback(
    (usdAmount: number) => {
      const config = currencyConfigs[currency];
      const converted = usdAmount * config.rateFromUSD;
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        maximumFractionDigits: config.decimals,
        minimumFractionDigits: 0,
      }).format(converted);
    },
    [currency]
  );

  const config = currencyConfigs[currency];

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convert, config }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
