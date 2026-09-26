import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Building2, Check, ChevronRight, Plus, ShieldCheck, Signature, Star } from "lucide-react";
import { CountUp, HeroSearch, HeroVisual, Spotlight } from "@/components/client";
import { catIcon, catTint, Heading, ListingCard } from "@/components/ui";
import { api, type Listing, type Stats } from "@/lib/api";
import { categories, dict, isLocale, money, num } from "@/lib/i18n";

const wide = new Set([0, 5, 6, 7]);
const edge = "px-[max(1rem,calc((100vw-80rem)/2+1.5rem))]";

function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`aurora pointer-events-none absolute inset-0 ${className}`}>
      <span className="-start-[10%] -top-[15%] size-[34rem] bg-[var(--g1)]" />
      <span className="-end-[10%] top-[5%] size-[30rem] bg-[var(--g2)] [animation-delay:-8s]" />
      <span className="start-[35%] top-[45%] size-[24rem] bg-[var(--g3)] [animation-delay:-15s]" />
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const l = locale;
  const t = dict[l];
  const s = t.sections;
  const [stats, featured] = await Promise.all([
    api<Stats | null>("/api/stats", null),
    api<Listing[]>("/api/listings?featured=true&limit=8", []),
  ]);
  // One card per category so the hero stack shows different colours.
  const hero = featured.filter((x, i, a) => a.findIndex((y) => y.category === x.category) === i).sort((a, b) => a.id - b.id);

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-28 pb-12 sm:pt-36 lg:pb-20">
        <Aurora className="-z-10" />
        <div aria-hidden className="grid-fade pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="rise min-w-0">
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative size-2 rounded-full bg-emerald-500" />
              </span>
              {t.hero.eyebrow}
            </span>
            <h1 className="display mt-6 text-5xl sm:text-7xl lg:text-[5.25rem]">
              {t.hero.title1}
              <br />
              <span className="text-gradient">{t.hero.title2}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{t.hero.sub}</p>
            <HeroSearch l={l} />
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
              {t.hero.chips.map((c) => (
                <li key={c} className="flex items-center gap-1.5"><Check className="size-4 text-emerald-500" />{c}</li>
              ))}
            </ul>
          </div>
          <HeroVisual l={l} items={hero} />
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="card reveal grid grid-cols-2 gap-y-8 rounded-[2rem] p-8 sm:grid-cols-4">
            {([["listings", stats.listings, 0], ["companies", stats.companies, 0], ["cities", stats.cities, 0], ["rating", stats.rating, 1]] as const).map(([k, v, d]) => (
              <div key={k} className="text-center">
                <div className="display text-gradient text-4xl sm:text-5xl"><CountUp l={l} value={v} decimals={d} /></div>
                <div className="mt-1 text-sm text-muted">{t.stats[k]}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories bento */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <Heading title={s.categoriesTitle} sub={s.categoriesSub} />
        <Spotlight className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((c, i) => {
            const Icon = catIcon[c];
            return (
              <Link key={c} href={`/${l}/explore?category=${c}`}
                className={`spot press lift card reveal group relative min-h-44 overflow-hidden rounded-[1.75rem] p-5 ${wide.has(i) ? "lg:col-span-2" : ""}`}>
                <span className={`grid size-12 place-items-center rounded-2xl bg-linear-to-br ${catTint[c]} text-white shadow-lg`}>
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <ArrowUpRight className="absolute end-5 top-5 size-5 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-fg rtl:-scale-x-100" />
                <h3 className="title mt-10 font-semibold sm:text-lg">{t.categories[c]}</h3>
                <p className="text-sm text-muted">{s.count(num(l, stats?.categories[c] ?? 0))}</p>
                <Icon aria-hidden className="absolute -end-6 -bottom-6 size-36 text-fg/[0.04] transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6" strokeWidth={1} />
              </Link>
            );
          })}
        </Spotlight>
      </section>

      {/* Featured rail */}
      {featured.length > 0 && (
        <section className="pb-16">
          <div className="mx-auto flex max-w-7xl items-end justify-between gap-4 px-4 sm:px-6">
            <h2 className="display reveal text-3xl sm:text-5xl">{s.featuredTitle}</h2>
            <Link href={`/${l}/explore`} className="press flex shrink-0 items-center gap-1 font-medium text-accent">
              {s.seeAll}<ChevronRight className="size-4 rtl:rotate-180" />
            </Link>
          </div>
          <Spotlight className={`no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6 ${edge} scroll-px-[max(1rem,calc((100vw-80rem)/2+1.5rem))]`}>
            {featured.map((x, i) => (
              <div key={x.id} className="w-[78%] shrink-0 snap-start sm:w-[340px]"><ListingCard l={l} x={x} i={i} /></div>
            ))}
          </Spotlight>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6">
        <Heading title={s.howTitle} />
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {s.how.map((h, i) => (
            <li key={h.t} className="card reveal relative overflow-hidden rounded-[2rem] p-7">
              <span className="display text-gradient text-7xl">{num(l, i + 1)}</span>
              <h3 className="title mt-6 text-xl font-bold">{h.t}</h3>
              <p className="mt-2 text-muted">{h.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust — always dark, like a product keynote slide */}
      <section className="px-4 py-8 sm:px-6">
        <div className="reveal relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#07070a] px-6 py-16 text-white sm:px-12 sm:py-24">
          <Aurora className="-z-10 opacity-50" />
          <h2 className="display text-4xl sm:text-6xl">{s.trustTitle}</h2>
          <p className="mt-4 max-w-2xl text-lg text-white/60">{s.trustSub}</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.trust.map((x, i) => {
              const Icon = [BadgeCheck, Signature, ShieldCheck, Star][i];
              return (
                <div key={x.t} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
                  <Icon className="size-7 text-[#9db8ff]" strokeWidth={1.75} />
                  <h3 className="mt-5 text-lg font-semibold">{x.t}</h3>
                  <p className="mt-2 text-sm text-white/60">{x.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 sm:px-6">
        <Heading center title={s.pricingTitle} sub={s.pricingSub} />
        <Spotlight className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {s.plans.map((p) => (
            <div key={p.name} className={`spot card reveal relative flex flex-col rounded-[2rem] p-7 ${p.popular ? "ring-2 ring-accent" : ""}`}>
              {p.popular && <span className="bg-brand absolute -top-3 start-7 rounded-full px-3 py-1 text-xs font-semibold text-white">{s.popular}</span>}
              <h3 className="font-semibold text-muted">{p.name}</h3>
              <p className="mt-3">
                <span className="display text-3xl">{p.price ? money(l, p.price) : s.free}</span>
                {p.price > 0 && <span className="block text-sm text-muted">{s.month}</span>}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.feats.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" />{f}</li>)}
              </ul>
              <Link href={`/${l}/new`} className={`press mt-8 grid h-11 place-items-center rounded-full font-semibold ${p.popular ? "bg-brand text-white shadow-lg shadow-accent/30" : "bg-fg/[0.06]"}`}>
                {s.choose}
              </Link>
            </div>
          ))}
        </Spotlight>
        <div className="card reveal mt-4 flex flex-col items-start gap-4 rounded-[2rem] p-7 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-fg text-bg"><Building2 className="size-6" /></span>
          <div>
            <h3 className="font-semibold">{s.enterpriseT}</h3>
            <p className="text-sm text-muted">{s.enterpriseD}</p>
          </div>
          <a href="mailto:sales@floow2.ir" className="press grid h-11 place-items-center rounded-full bg-fg px-6 font-semibold text-bg sm:ms-auto">{s.enterpriseCta}</a>
        </div>
        <p className="mt-6 text-center text-sm text-muted">{s.featuredAd}</p>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="bg-brand reveal relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] px-6 py-20 text-center text-white sm:py-28">
          <div aria-hidden className="absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
          <h2 className="display mx-auto max-w-3xl text-4xl sm:text-6xl">{s.ctaTitle}</h2>
          <p className="mt-4 text-lg text-white/80">{s.ctaSub}</p>
          <Link href={`/${l}/new`} className="press mt-10 inline-flex h-13 items-center gap-2 rounded-full bg-white px-8 text-lg font-semibold text-black shadow-2xl">
            <Plus className="size-5" />{t.hero.secondary}
          </Link>
        </div>
      </section>
    </main>
  );
}
