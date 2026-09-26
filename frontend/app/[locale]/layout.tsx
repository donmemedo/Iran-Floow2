import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "../globals.css";
import { Nav, TabBar } from "@/components/client";
import { Footer } from "@/components/ui";
import { dict, isLocale } from "@/lib/i18n";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

// Runs before paint so the saved/system theme never flashes.
const themeScript = `try{var t=localStorage.theme;if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = dict[isLocale(locale) ? locale : "fa"].meta;
  return { title: t.title, description: t.description };
}

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "fa";
  return (
    <html lang={l} dir={l === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="overflow-x-clip pb-24 md:pb-0">
        <Nav l={l} />
        {children}
        <Footer l={l} />
        <TabBar l={l} />
      </body>
    </html>
  );
}
