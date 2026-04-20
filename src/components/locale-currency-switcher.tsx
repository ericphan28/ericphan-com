"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";
import { useCurrency } from "@/lib/currency/context";
import { localeConfigs, supportedLocales } from "@/lib/i18n/types";
import { currencyConfigs, supportedCurrencies } from "@/lib/currency/types";

export function LocaleCurrencySwitcher() {
  const { locale, setLocale, t } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors text-sm"
        aria-label={t("common.language")}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{localeConfigs[locale].flag}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Language section */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{t("common.language")}</p>
          </div>
          <div className="p-1">
            {supportedLocales.map((loc) => {
              const config = localeConfigs[loc];
              return (
                <button
                  key={loc}
                  onClick={() => { setLocale(loc); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    locale === loc ? "bg-accent-bg text-accent" : "hover:bg-card-hover text-foreground"
                  }`}
                >
                  <span className="text-base">{config.flag}</span>
                  <span className="font-medium">{config.name}</span>
                  {locale === loc && <span className="ml-auto text-accent">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Currency section */}
          <div className="px-3 py-2 border-t border-b border-border">
            <p className="text-xs font-medium text-muted uppercase tracking-wider">{t("common.currency")}</p>
          </div>
          <div className="p-1">
            {supportedCurrencies.map((cur) => {
              const config = currencyConfigs[cur];
              return (
                <button
                  key={cur}
                  onClick={() => { setCurrency(cur); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currency === cur ? "bg-accent-bg text-accent" : "hover:bg-card-hover text-foreground"
                  }`}
                >
                  <span className="text-base">{config.flag}</span>
                  <span className="font-medium">{config.code}</span>
                  <span className="text-muted text-xs">{config.symbol}</span>
                  {currency === cur && <span className="ml-auto text-accent">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
