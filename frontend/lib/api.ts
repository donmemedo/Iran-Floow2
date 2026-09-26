import type { Category, City, Deal, Unit } from "./i18n";

export type Listing = {
  id: number; deal: Deal; category: Category; city: City; unit: Unit; price: number; rating: number;
  title_fa: string; title_en: string; desc_fa: string; desc_en: string; company_fa: string; company_en: string;
  verified: boolean; insured: boolean; featured: boolean;
};
export type Stats = { listings: number; companies: number; cities: number; rating: number; inquiries: number; categories: Partial<Record<Category, number>> };

const BASE = process.env.API_URL ?? "http://localhost:8000";

export async function api<T>(path: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(BASE + path, { cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {}
  return fallback;
}

/** Mirrors backend estimate(): day → per day, month → per started 30 days, else flat. */
export function estimate(price: number, unit: Unit, start?: string, end?: string) {
  if (!start || !end || (unit !== "day" && unit !== "month")) return { total: price, days: 0 };
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 864e5) + 1;
  if (days < 1) return { total: price, days: 0 };
  return { total: unit === "day" ? price * days : price * Math.ceil(days / 30), days };
}
