export type SupportedCurrency = "USD" | "AUD" | "VND";

const USD_RATE: Record<SupportedCurrency, number> = { USD: 1, AUD: 0.65, VND: 0.000038 };

export function budgetToUsd(amount: number | null, currency: keyof typeof USD_RATE) {
  return amount === null ? null : Number((amount * USD_RATE[currency]).toFixed(6));
}

export function usdToCurrency(amountUsd: number, currency: SupportedCurrency) {
  const amount = amountUsd / USD_RATE[currency];
  return Number(amount.toFixed(currency === "VND" ? 0 : 2));
}

export function formatCurrency(amount: number, currency: SupportedCurrency) {
  return new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(amount);
}

export function formatUsdInCurrency(amountUsd: number, currency: SupportedCurrency) {
  return formatCurrency(usdToCurrency(amountUsd, currency), currency);
}

export function usdExchangeRate(currency: SupportedCurrency) {
  return usdToCurrency(1, currency);
}
