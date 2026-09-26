import { notFound } from "next/navigation";
import { NewListingForm } from "@/components/forms";
import { dict, isLocale } from "@/lib/i18n";

export default async function NewListing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict[locale].new;
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-4 pt-24 pb-16 sm:px-6">
      <h1 className="display rise text-4xl sm:text-6xl">{t.title}</h1>
      <p className="rise mt-2 text-lg text-muted [--i:1]">{t.sub}</p>
      <NewListingForm l={locale} />
    </main>
  );
}
