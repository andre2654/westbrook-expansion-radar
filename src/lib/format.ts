export function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function usdShort(n: number): string {
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}K`;
  return usd(n);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
