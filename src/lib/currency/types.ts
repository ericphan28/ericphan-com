// Extensible currency system
// To add a new currency: add to CurrencyCode union + currencyConfigs

export type CurrencyCode = "USD" | "VND";
// Future: "EUR" | "GBP" | "AUD" | "JPY" | "KRW" etc.

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameVi: string;
  flag: string;
  decimals: number;
  locale: string; // for Intl.NumberFormat
  // Rate relative to USD (1 USD = X of this currency)
  rateFromUSD: number;
}

export const currencyConfigs: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    nameVi: "Đô la Mỹ",
    flag: "🇺🇸",
    decimals: 0,
    locale: "en-US",
    rateFromUSD: 1,
  },
  VND: {
    code: "VND",
    symbol: "₫",
    name: "Vietnamese Dong",
    nameVi: "Việt Nam Đồng",
    flag: "🇻🇳",
    decimals: 0,
    locale: "vi-VN",
    rateFromUSD: 25_500, // approximate, update as needed
  },
  // Future currencies: just add here
};

export const defaultCurrency: CurrencyCode = "USD";
export const supportedCurrencies = Object.keys(currencyConfigs) as CurrencyCode[];
