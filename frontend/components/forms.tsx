"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, Handshake, LoaderCircle, Megaphone, Plus, Search, Tag } from "lucide-react";
import { estimate, type Listing } from "@/lib/api";
import {
  categories, cities, deals, dict, jalali, money, num, toLatinDigits, units,
  type Category, type City, type Deal, type Locale, type Unit,
} from "@/lib/i18n";
import { Segmented, Spotlight, spring } from "./client";
import { catIcon, ListingCard } from "./ui";

const PHONE = /^(\+98|0)?9\d{9}$/;

function Field({ label, error, hint, children }: { label: string; error?: string | false; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      <AnimatePresence initial={false}>
        {(error || hint) && (
          <motion.span
            key={error || hint}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className={`block overflow-hidden pt-1.5 text-xs ${error ? "text-[#ff453a]" : "text-muted"}`}
          >
            {error || hint}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

async function post(path: string, body: unknown) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/* ---------- Explore filters ---------- */

export function ExploreShell({ l, params, count, children }: {
  l: Locale; params: Record<string, string>; count: number; children: React.ReactNode;
}) {
  const t = dict[l];
  const router = useRouter();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const set = (k: string, v?: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v); else p.delete(k);
    start(() => router.replace(`/${l}/explore?${p}`, { scroll: false }));
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const cat = params.category as Category | undefined;

  return (
    <>
      <div className="glass sticky top-16 z-30 -mx-4 mt-6 space-y-3 px-4 py-3 sm:mx-0 sm:rounded-3xl sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-fg/[0.06] px-4">
            <Search className="size-4 shrink-0 text-muted" />
            <input
              value={q}
              placeholder={t.hero.search}
              aria-label={t.hero.cta}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
              onChange={(e) => {
                setQ(e.target.value);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => set("q", e.target.value.trim()), 300);
              }}
            />
            {pending && <LoaderCircle className="size-4 animate-spin text-muted" />}
          </div>
          <Segmented id="explore-deal" value={(params.deal as Deal) ?? "all"} onChange={(v) => set("deal", v === "all" ? "" : v)}
            options={[{ value: "all" as const, label: t.deals.all }, ...deals.map((d) => ({ value: d, label: t.deals[d] }))]} />
          <div className="flex gap-2">
            <select value={params.city ?? ""} onChange={(e) => set("city", e.target.value)} aria-label={t.new.city}
              className="press h-10 flex-1 cursor-pointer rounded-full bg-fg/[0.06] px-4 text-sm outline-none">
              <option value="">{t.explore.allCities}</option>
              {cities.map((c) => <option key={c} value={c}>{t.cities[c]}</option>)}
            </select>
            <select value={params.sort ?? "new"} onChange={(e) => set("sort", e.target.value === "new" ? "" : e.target.value)} aria-label="sort"
              className="press h-10 flex-1 cursor-pointer rounded-full bg-fg/[0.06] px-4 text-sm outline-none">
              {Object.entries(t.explore.sort).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[undefined, ...categories].map((c) => {
            const Icon = c ? catIcon[c] : null;
            const active = c === cat;
            return (
              <button key={c ?? "all"} onClick={() => set("category", c)}
                className={`press flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${active ? "border-transparent bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>
                {Icon && <Icon className="size-4" strokeWidth={1.75} />}
                {c ? t.categories[c] : t.explore.allCategories}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-6 mb-4 text-sm text-muted">{t.explore.count(num(l, count))}</p>
      <div className={`transition-opacity duration-200 ${pending ? "opacity-50" : ""}`}>{children}</div>
    </>
  );
}

/* ---------- Inquiry / booking ---------- */

export function InquiryForm({ l, x }: { l: Locale; x: Listing }) {
  const t = dict[l];
  const tl = t.listing;
  const dated = x.unit === "day" || x.unit === "month";
  const empty = { company: "", phone: "", start: "", end: "", message: "" };
  const [f, setF] = useState(empty);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const phone = toLatinDigits(f.phone).replace(/[\s-]/g, "");
  const errs = {
    company: !f.company.trim() && t.errors.required,
    phone: !phone ? t.errors.required : !PHONE.test(phone) && t.errors.phone,
    end: !!(f.start && f.end && f.end < f.start) && t.errors.dates,
  };
  const est = estimate(x.price, x.unit, f.start, f.end);
  const on = (k: keyof typeof empty) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
  });
  const err = (k: keyof typeof errs) => touched[k] && errs[k];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ company: true, phone: true, end: true });
    if (Object.values(errs).some(Boolean)) return;
    setState("sending");
    try {
      await post(`/api/listings/${x.id}/inquiries`, { company: f.company.trim(), phone, start: f.start || null, end: f.end || null, message: f.message });
      navigator.vibrate?.(12);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="card overflow-hidden rounded-[2rem] p-6">
      <AnimatePresence mode="wait" initial={false}>
        {state === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={spring}
            className="py-10 text-center" role="status">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
              className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Check className="size-8" strokeWidth={2.5} />
            </motion.span>
            <h3 className="mt-5 text-xl font-bold">{tl.successT}</h3>
            <p className="mt-1 text-muted">{tl.successD}</p>
            <button onClick={() => { setF(empty); setTouched({}); setState("idle"); }} className="press mt-6 rounded-full bg-fg/[0.06] px-5 py-2 text-sm font-semibold">
              {tl.again}
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={spring} className="space-y-4">
            <div>
              <p className="text-sm text-muted">{x.deal === "request" ? t.budget : t.listing.estimate}</p>
              <p className="display text-3xl">
                <motion.span key={est.total} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="inline-block">
                  {money(l, est.total)}
                </motion.span>
                {!est.days && t.per[x.unit] && <span className="text-base font-normal text-muted"> / {t.per[x.unit]}</span>}
              </p>
              {est.days > 0 && <p className="text-sm text-muted">{tl.days(num(l, est.days))}</p>}
            </div>
            <h2 className="border-t border-line pt-4 text-lg font-bold">{tl.action[x.deal]}</h2>
            <Field label={tl.company} error={err("company")}>
              <input className="field" autoComplete="organization" aria-invalid={!!err("company")} {...on("company")} />
            </Field>
            <Field label={tl.phone} error={err("phone")}>
              <input className="field text-start" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09121234567" aria-invalid={!!err("phone")} {...on("phone")} />
            </Field>
            {dated && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={tl.start} hint={f.start && l === "fa" ? jalali(l, f.start) : undefined}>
                  <input type="date" className="field" {...on("start")} />
                </Field>
                <Field label={tl.end} error={err("end")} hint={f.end && l === "fa" ? jalali(l, f.end) : undefined}>
                  <input type="date" className="field" min={f.start || undefined} aria-invalid={!!err("end")} {...on("end")} />
                </Field>
              </div>
            )}
            <Field label={tl.message}>
              <textarea rows={3} className="field resize-none" placeholder={tl.messagePh} {...on("message")} />
            </Field>
            {state === "error" && <p role="alert" className="rounded-2xl bg-[#ff453a]/10 px-4 py-3 text-sm text-[#ff453a]">{t.errors.generic}</p>}
            <button disabled={state === "sending"} className="press bg-brand flex h-12 w-full items-center justify-center gap-2 rounded-full font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-70">
              {state === "sending" ? <><LoaderCircle className="size-5 animate-spin" />{tl.sending}</> : tl.submit}
            </button>
            <p className="text-center text-xs text-muted">{tl.note}</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- New listing ---------- */

const dealIcon = { rent: CalendarDays, sale: Tag, service: Handshake, request: Megaphone };

export function NewListingForm({ l }: { l: Locale }) {
  const t = dict[l];
  const tn = t.new;
  const router = useRouter();
  const [deal, setDeal] = useState<Deal>("rent");
  const [category, setCategory] = useState<Category>("construction");
  const [unit, setUnit] = useState<Unit>("day");
  const [city, setCity] = useState<City>("tehran");
  const [f, setF] = useState({ title: "", description: "", price: "", company: "" });
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const price = Number(toLatinDigits(f.price).replace(/[^\d]/g, "")) || 0;
  const errs = {
    title: f.title.trim().length < 3 && t.errors.required,
    price: !price && t.errors.price,
    company: f.company.trim().length < 2 && t.errors.required,
  };
  const on = (k: keyof typeof f) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value }),
  });
  const preview: Listing = {
    id: 0, deal, category, city, unit, price: price || 0, rating: 5, verified: false, insured: false, featured: false,
    title_fa: f.title || tn.titlePh, title_en: f.title || tn.titlePh, desc_fa: "", desc_en: "",
    company_fa: f.company || tn.company, company_en: f.company || tn.company,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errs).some(Boolean)) return;
    setState("sending");
    try {
      const x: Listing = await post("/api/listings", {
        deal, category, unit, city, price, title: f.title.trim(), description: f.description.trim(), company: f.company.trim(),
      });
      navigator.vibrate?.(12);
      router.push(`/${l}/listing/${x.id}?new=1`);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
      <form onSubmit={submit} noValidate className="space-y-8">
        <fieldset>
          <legend className="mb-3 text-lg font-bold">{tn.dealQ}</legend>
          <Spotlight className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {deals.map((d) => {
              const Icon = dealIcon[d];
              const active = d === deal;
              return (
                <button type="button" key={d} role="radio" aria-checked={active}
                  onClick={() => { setDeal(d); setUnit(d === "sale" ? "item" : d === "service" ? "project" : unit === "item" ? "day" : unit); }}
                  className={`spot press card relative rounded-3xl p-4 text-start ${active ? "ring-2 ring-accent" : ""}`}>
                  <Icon className={`size-6 ${active ? "text-accent" : "text-muted"}`} strokeWidth={1.75} />
                  <span className="mt-4 block font-semibold">{tn.dealOpts[d]}</span>
                  <span className="block text-xs text-muted">{tn.dealHints[d]}</span>
                  {active && (
                    <motion.span layoutId="deal-check" transition={spring} className="absolute end-3 top-3 grid size-5 place-items-center rounded-full bg-accent text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </Spotlight>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-lg font-bold">{tn.category}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((c) => {
              const Icon = catIcon[c];
              return (
                <button type="button" key={c} role="radio" aria-checked={c === category} onClick={() => setCategory(c)}
                  className={`press flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-start text-sm transition-colors ${c === category ? "border-transparent bg-fg text-bg" : "border-line hover:bg-fg/5"}`}>
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{t.categories[c]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="card space-y-5 rounded-[2rem] p-6">
          <Field label={tn.titleL} error={touched && errs.title}>
            <input className="field" placeholder={tn.titlePh} maxLength={120} aria-invalid={!!(touched && errs.title)} {...on("title")} />
          </Field>
          <Field label={tn.descL}>
            <textarea rows={4} className="field resize-none" placeholder={tn.descPh} maxLength={2000} {...on("description")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={deal === "request" ? tn.budget : tn.price} error={touched && errs.price} hint={price ? money(l, price) : undefined}>
              <input className="field" inputMode="numeric" dir="ltr" placeholder="4,500,000" aria-invalid={!!(touched && errs.price)}
                value={price ? num("en", price) : f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            </Field>
            <Field label={tn.city}>
              <select className="field cursor-pointer" value={city} onChange={(e) => setCity(e.target.value as City)}>
                {cities.map((c) => <option key={c} value={c}>{t.cities[c]}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium">{tn.unit}</span>
            <Segmented id="unit" value={unit} onChange={setUnit} options={units.map((u) => ({ value: u, label: t.unitOpts[u] }))} />
          </div>
          <Field label={tn.company} error={touched && errs.company}>
            <input className="field" autoComplete="organization" aria-invalid={!!(touched && errs.company)} {...on("company")} />
          </Field>
        </div>

        {state === "error" && <p role="alert" className="rounded-2xl bg-[#ff453a]/10 px-4 py-3 text-sm text-[#ff453a]">{t.errors.generic}</p>}
        <button disabled={state === "sending"} className="press bg-brand flex h-13 w-full items-center justify-center gap-2 rounded-full text-lg font-semibold text-white shadow-lg shadow-accent/30 disabled:opacity-70 sm:w-auto sm:px-10">
          {state === "sending" ? <LoaderCircle className="size-5 animate-spin" /> : <Plus className="size-5" />}
          {state === "sending" ? tn.publishing : tn.submit}
        </button>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <div className="pointer-events-none"><ListingCard l={l} x={preview} /></div>
          <p className="mt-3 text-center text-xs text-muted">{t.nav.explore} · {t.cities[city]}</p>
        </div>
      </aside>
    </div>
  );
}

export function EmptyState({ l }: { l: Locale }) {
  const t = dict[l].explore;
  return (
    <div className="card rise rounded-[2rem] px-6 py-20 text-center">
      <Search className="mx-auto size-10 text-muted" strokeWidth={1.5} />
      <h2 className="mt-4 text-xl font-bold">{t.emptyT}</h2>
      <p className="mt-1 text-muted">{t.emptyD}</p>
      <Link href={`/${l}/new`} className="press bg-brand mt-6 inline-flex h-11 items-center gap-2 rounded-full px-6 font-semibold text-white">
        <Plus className="size-4" />{t.emptyCta}
      </Link>
    </div>
  );
}
