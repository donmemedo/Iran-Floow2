import Link from "next/link";
import {
  BadgeCheck, Construction, Factory, HardHat, MapPin, Microscope, Pickaxe, Star, Truck, Warehouse, Wrench, type LucideIcon,
} from "lucide-react";
import type { Listing } from "@/lib/api";
import { dict, money, num, type Category, type Locale } from "@/lib/i18n";

export const catIcon: Record<Category, LucideIcon> = {
  construction: Construction, industrial: Factory, warehouse: Warehouse, transport: Truck,
  mining: Pickaxe, maintenance: Wrench, personnel: HardHat, lab: Microscope,
};

export const catTint: Record<Category, string> = {
  construction: "from-amber-300 via-orange-500 to-rose-500",
  industrial: "from-sky-400 via-blue-600 to-indigo-700",
  warehouse: "from-emerald-300 via-teal-500 to-cyan-700",
  transport: "from-violet-400 via-purple-600 to-indigo-700",
  mining: "from-stone-400 via-stone-600 to-zinc-800",
  maintenance: "from-rose-300 via-red-500 to-orange-600",
  personnel: "from-pink-300 via-pink-500 to-rose-600",
  lab: "from-lime-300 via-green-500 to-emerald-700",
};

export const pick = (l: Locale, x: Listing, k: "title" | "desc" | "company") => x[`${k}_${l}`];

export function Logo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f6bff" /><stop offset=".55" stopColor="#7b5cff" /><stop offset="1" stopColor="#00c2a8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lg)" />
      <path d="M18 40c6-14 22-14 28-2M18 26c6 12 22 12 28-2" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Art({ category, className = "" }: { category: Category; className?: string }) {
  const Icon = catIcon[category];
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-linear-to-br ${catTint[category]} ${className}`}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="absolute -end-10 -top-10 size-2/3 rounded-full bg-white/25 blur-3xl" />
      <Icon className="relative size-[34%] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,.3)] transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
    </div>
  );
}

export function Price({ l, x, className = "" }: { l: Locale; x: Listing; className?: string }) {
  const t = dict[l];
  return (
    <p className={className}>
      {x.deal === "request" && <span className="text-sm text-muted">{t.budget} </span>}
      <span className="font-bold">{money(l, x.price)}</span>
      {t.per[x.unit] && <span className="text-sm text-muted"> / {t.per[x.unit]}</span>}
    </p>
  );
}

export function ListingCard({ l, x, i = 0 }: { l: Locale; x: Listing; i?: number }) {
  const t = dict[l];
  return (
    <Link
      href={`/${l}/listing/${x.id}`}
      style={{ "--i": i } as React.CSSProperties}
      className="spot lift press card rise group block overflow-hidden rounded-3xl hover:shadow-2xl"
    >
      <div className="relative">
        <Art category={x.category} className="aspect-[4/3]" />
        <span className="glass absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">{t.badge[x.deal]}</span>
        {x.verified && (
          <span title={t.listing.verified} className="absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#2f6bff] shadow-lg">
            <BadgeCheck className="size-[18px]" />
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="title line-clamp-1 font-semibold">{pick(l, x, "title")}</h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" />
          {t.cities[x.city]} · {pick(l, x, "company")}
        </p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <Price l={l} x={x} />
          <span className="flex items-center gap-1 text-sm font-medium">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {num(l, x.rating)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function Heading({ title, sub, center }: { title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`reveal max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <h2 className="display text-4xl sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </div>
  );
}

export function Footer({ l }: { l: Locale }) {
  const t = dict[l];
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-2 font-bold text-fg"><Logo className="size-6" />{t.brand}</div>
        <span>{t.footer.tagline}</span>
        <div className="flex gap-5 sm:ms-auto">
          <a href="#" className="hover:text-fg">{t.footer.privacy}</a>
          <a href="#" className="hover:text-fg">{t.footer.terms}</a>
          <span>{t.footer.copy}</span>
        </div>
      </div>
    </footer>
  );
}
