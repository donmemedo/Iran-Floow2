import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ChevronLeft, CircleCheck, MapPin, ShieldCheck, Star } from "lucide-react";
import { Spotlight } from "@/components/client";
import { InquiryForm } from "@/components/forms";
import { Art, ListingCard, pick } from "@/components/ui";
import { api, type Listing } from "@/lib/api";
import { dict, isLocale, num } from "@/lib/i18n";

export default async function ListingPage({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ new?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !/^\d+$/.test(id)) notFound();
  const l = locale;
  const x = await api<Listing | null>(`/api/listings/${id}`, null);
  if (!x) notFound();
  const [similar, sp] = await Promise.all([api<Listing[]>(`/api/listings?category=${x.category}&limit=5`, []), searchParams]);
  const t = dict[l];
  const tl = t.listing;
  const facts = [
    [tl.facts.category, t.categories[x.category]],
    [tl.facts.city, t.cities[x.city]],
    [tl.facts.company, pick(l, x, "company")],
    [tl.facts.rating, `${num(l, x.rating)} / ${num(l, 5)}`],
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6">
      <Link href={`/${l}/explore`} className="press inline-flex items-center gap-1 rounded-full py-2 text-sm text-muted hover:text-fg">
        <ChevronLeft className="size-4 rtl:rotate-180" />{tl.back}
      </Link>
      {sp.new && (
        <p role="status" className="rise mt-2 flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
          <CircleCheck className="size-5" />{tl.published}
        </p>
      )}
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="min-w-0">
          <Art category={x.category} className="rise aspect-[16/10] rounded-[2rem] shadow-soft" />
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-accent">{t.badge[x.deal]}</span>
            {x.verified && <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-400"><BadgeCheck className="size-4" />{tl.verified}</span>}
            {x.insured && <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-3 py-1 text-sky-600 dark:text-sky-400"><ShieldCheck className="size-4" />{tl.insured}</span>}
          </div>
          <h1 className="display mt-4 text-3xl sm:text-5xl">{pick(l, x, "title")}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
            <MapPin className="size-4" />{t.cities[x.city]} · {pick(l, x, "company")} ·
            <Star className="size-4 fill-amber-400 text-amber-400" />{num(l, x.rating)}
          </p>
          <section className="card mt-8 rounded-[2rem] p-6">
            <h2 className="text-lg font-bold">{tl.about}</h2>
            {pick(l, x, "desc") && <p className="mt-3 leading-8 text-muted">{pick(l, x, "desc")}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-fg/[0.04] p-4">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-1 truncate font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <InquiryForm l={l} x={x} />
        </aside>
      </div>
      {similar.length > 1 && (
        <section className="mt-20">
          <h2 className="display text-2xl sm:text-3xl">{tl.similar}</h2>
          <Spotlight className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.filter((s) => s.id !== x.id).slice(0, 4).map((s, i) => <ListingCard key={s.id} l={l} x={s} i={i} />)}
          </Spotlight>
        </section>
      )}
    </main>
  );
}
