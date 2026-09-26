import { notFound } from "next/navigation";
import { Spotlight } from "@/components/client";
import { EmptyState, ExploreShell } from "@/components/forms";
import { ListingCard } from "@/components/ui";
import { api, type Listing } from "@/lib/api";
import { dict, isLocale } from "@/lib/i18n";

const KEYS = ["q", "deal", "category", "city", "sort"];

export default async function Explore({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const clean: Record<string, string> = Object.fromEntries(KEYS.flatMap((k) => (typeof sp[k] === "string" && sp[k] ? [[k, sp[k]]] : [])));
  const items = await api<Listing[]>(`/api/listings?${new URLSearchParams(clean)}`, []);
  const t = dict[locale].explore;

  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-4 pt-24 pb-16 sm:px-6">
      <h1 className="display rise text-4xl sm:text-6xl">{t.title}</h1>
      <p className="rise mt-2 text-muted [--i:1]">{t.sub}</p>
      <ExploreShell l={locale} params={clean} count={items.length}>
        {items.length ? (
          <Spotlight className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((x, i) => <ListingCard key={x.id} l={locale} x={x} i={i} />)}
          </Spotlight>
        ) : <EmptyState l={locale} />}
      </ExploreShell>
    </main>
  );
}
