import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
import type { Locale } from "@/lib/i18n/types";
import { supportedLocales } from "@/lib/i18n/types";

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const alternates: Record<string, string> = {};
  for (const loc of supportedLocales) {
    alternates[loc] = `https://ericphan.com/${loc}`;
  }
  return {
    alternates: {
      canonical: `https://ericphan.com/${locale}`,
      languages: alternates,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale as Locale)) {
    notFound();
  }

  return (
    <Providers locale={locale as Locale}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </Providers>
  );
}
