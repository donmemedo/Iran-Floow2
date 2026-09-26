"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { Check, House, LayoutGrid, Moon, Plus, Search, Sun, Tag } from "lucide-react";
import type { Listing } from "@/lib/api";
import { deals, dict, money, num, type Deal, type Locale } from "@/lib/i18n";
import { ListingCard, Logo, pick } from "./ui";

export const spring = { type: "spring", bounce: 0, duration: 0.4 } as const;

export function ThemeToggle({ label }: { label: string }) {
  function toggle(e: React.MouseEvent) {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    const apply = () => {
      root.classList.toggle("dark", dark);
      try { localStorage.theme = dark ? "dark" : "light"; } catch {}
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
    const { clientX: x, clientY: y } = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" },
      ),
    );
  }
  return (
    <button onClick={toggle} aria-label={label} className="press grid size-9 place-items-center rounded-full hover:bg-fg/5">
      <Sun className="size-[18px] dark:hidden" />
      <Moon className="hidden size-[18px] dark:block" />
    </button>
  );
}

function LangSwitch({ l }: { l: Locale }) {
  const path = usePathname();
  const router = useRouter();
  const href = path.replace(/^\/(fa|en)/, l === "fa" ? "/en" : "/fa");
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); router.push(href + location.search + location.hash); }}
      aria-label={dict[l].nav.lang}
      className="press grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold hover:bg-fg/5"
    >
      {dict[l].nav.langShort}
    </a>
  );
}

export function Nav({ l }: { l: Locale }) {
  const t = dict[l].nav;
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(scrollY > 8);
    f();
    addEventListener("scroll", f, { passive: true });
    return () => removeEventListener("scroll", f);
  }, []);
  const links = [
    { href: `/${l}/explore`, label: t.explore },
    { href: `/${l}#how`, label: t.how },
    { href: `/${l}#pricing`, label: t.pricing },
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${scrolled ? "glass border-x-0 border-t-0 !border-b-line" : "border-transparent"}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href={`/${l}`} className="press flex items-center gap-2 text-lg font-extrabold"><Logo />{dict[l].brand}</Link>
        <div className="hidden items-center gap-1 text-sm md:flex">
          {links.map((x) => (
            <Link key={x.href} href={x.href} className={`press rounded-full px-3 py-1.5 hover:bg-fg/5 ${path === x.href ? "text-fg" : "text-muted"}`}>
              {x.label}
            </Link>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-1">
          <LangSwitch l={l} />
          <ThemeToggle label={t.theme} />
          <Link href={`/${l}/new`} className="press ms-1 hidden h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-sm font-semibold text-bg sm:inline-flex">
            <Plus className="size-4" />{t.post}
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function TabBar({ l }: { l: Locale }) {
  const t = dict[l].nav;
  const path = usePathname();
  const items = [
    { href: `/${l}`, icon: House, label: t.home },
    { href: `/${l}/explore`, icon: LayoutGrid, label: t.explore },
    { href: `/${l}/new`, icon: Plus, label: t.post, primary: true },
    { href: `/${l}#pricing`, icon: Tag, label: t.pricing },
  ];
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-50 mb-[env(safe-area-inset-bottom)] flex rounded-[28px] p-1.5 shadow-soft md:hidden">
      {items.map(({ href, icon: Icon, label, primary }) => {
        const active = path === href;
        return (
          <Link key={href} href={href} className={`press relative flex flex-1 flex-col items-center gap-0.5 rounded-[22px] py-1.5 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}>
            {active && <motion.span layoutId="tab" transition={spring} className="absolute inset-0 rounded-[22px] bg-accent/10" />}
            {primary
              ? <span className="bg-brand relative grid size-6 place-items-center rounded-full text-white"><Icon className="size-4" /></span>
              : <Icon className="relative size-6" strokeWidth={1.75} />}
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Feeds cursor position to every `.spot` child so their glow follows the pointer. */
export function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      onPointerMove={(e) => {
        for (const el of e.currentTarget.querySelectorAll<HTMLElement>(".spot")) {
          const r = el.getBoundingClientRect();
          el.style.setProperty("--x", `${e.clientX - r.left}px`);
          el.style.setProperty("--y", `${e.clientY - r.top}px`);
        }
      }}
    >
      {children}
    </div>
  );
}

export function Segmented<T extends string>({ id, options, value, onChange, className = "" }: {
  id: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div role="radiogroup" className={`no-scrollbar inline-flex max-w-full overflow-x-auto rounded-full bg-fg/[0.06] p-1 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${o.value === value ? "text-fg" : "text-muted hover:text-fg"}`}
        >
          {o.value === value && <motion.span layoutId={id} transition={spring} className="absolute inset-0 rounded-full bg-elev shadow-soft" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CountUp({ l, value, decimals = 0 }: { l: Locale; value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const fmt = (v: number) => num(l, v, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  useEffect(() => {
    if (!inView || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = animate(0, value, { duration: 1.4, ease: [0.2, 0.8, 0.2, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = fmt(v); } });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value]);
  return <span ref={ref}>{fmt(value)}</span>;
}

export function HeroSearch({ l }: { l: Locale }) {
  const t = dict[l];
  const router = useRouter();
  const [deal, setDeal] = useState<"all" | Deal>("all");
  const [q, setQ] = useState("");
  return (
    <form
      className="mt-8 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q.trim()) p.set("q", q.trim());
        if (deal !== "all") p.set("deal", deal);
        router.push(`/${l}/explore?${p}`);
      }}
    >
      <Segmented id="hero-deal" value={deal} onChange={setDeal}
        options={[{ value: "all" as const, label: t.deals.all }, ...deals.map((d) => ({ value: d, label: t.deals[d] }))]} />
      <div className="glass mt-3 flex items-center gap-2 rounded-full p-1.5 ps-5 shadow-soft focus-within:ring-4 focus-within:ring-accent/20">
        <Search className="size-5 shrink-0 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.hero.search} aria-label={t.hero.cta}
          className="min-w-0 flex-1 bg-transparent py-2.5 outline-none placeholder:text-muted" />
        <button className="press bg-brand h-11 shrink-0 rounded-full px-6 font-semibold text-white shadow-lg shadow-accent/30">{t.hero.cta}</button>
      </div>
    </form>
  );
}

/** Floating stack of live listings that tilts with the pointer on springs. */
export function HeroVisual({ l, items }: { l: Locale; items: Listing[] }) {
  const t = dict[l].hero;
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cfg = { stiffness: 120, damping: 20 };
  const rotateY = useSpring(useTransform(mx, [-1, 1], [-10, 10]), cfg);
  const rotateX = useSpring(useTransform(my, [-1, 1], [8, -8]), cfg);
  const pos = [
    { top: "0%", insetInlineStart: "0%", rotate: -6 },
    { top: "18%", insetInlineStart: "38%", rotate: 5 },
    { top: "42%", insetInlineStart: "10%", rotate: -2 },
  ];
  const deal = items[1] ?? items[0];
  return (
    <div
      className="relative hidden h-[540px] [perspective:1400px] lg:block"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="absolute inset-0">
        {items.slice(0, 3).map((x, i) => (
          <motion.div
            key={x.id}
            initial={{ opacity: 0, y: 80, rotate: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: pos[i].rotate, scale: 1 }}
            transition={{ type: "spring", bounce: 0.25, duration: 1, delay: 0.2 + i * 0.12 }}
            whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
            style={{ top: pos[i].top, insetInlineStart: pos[i].insetInlineStart, z: i * 40 }}
            className="absolute w-[58%]"
          >
            <ListingCard l={l} x={x} />
          </motion.div>
        ))}
        {deal && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.8, delay: 0.9 }}
            aria-hidden
            style={{ z: 160 }}
            className="glass absolute -bottom-2 end-0 bg-elev/85 flex items-center gap-3 rounded-2xl p-3 pe-5 shadow-soft"
          >
            <span className="grid size-10 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-5" /></span>
            <span className="text-sm">
              <b className="block">{t.toast}</b>
              <span className="text-muted">{pick(l, deal, "title")} · {money(l, deal.price)}</span>
            </span>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.3, duration: 0.8, delay: 1.05 }}
          aria-hidden
          style={{ z: 120 }}
          className="glass absolute end-4 top-2 bg-elev/85 flex items-center gap-3 rounded-2xl p-3 pe-5 shadow-soft"
        >
          <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-fg/10" />
            <motion.circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" strokeLinecap="round" stroke="url(#ring)"
              initial={{ pathLength: 0 }} animate={{ pathLength: 0.87 }} transition={{ duration: 1.6, delay: 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
            <defs><linearGradient id="ring"><stop stopColor="var(--g1)" /><stop offset="1" stopColor="var(--g3)" /></linearGradient></defs>
          </svg>
          <span className="text-sm">
            <b className="block text-lg leading-tight">{num(l, 0.87, { style: "percent" })}</b>
            <span className="text-muted">{t.utilization}</span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
