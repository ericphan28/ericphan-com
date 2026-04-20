import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ericphan.com"),
  title: "Eric Phan — Developer & DX Consultant",
  description:
    "Former founder & PM turned developer. I build production SaaS platforms, government digital services, and AI-powered tools with Next.js, TypeScript, Supabase, and Vercel.",
  keywords: [
    "full-stack developer",
    "Next.js developer",
    "TypeScript",
    "Supabase",
    "Vercel",
    "SaaS development",
    "freelance developer",
    "Vietnam developer",
  ],
  authors: [{ name: "Eric Phan" }],
  openGraph: {
    title: "Eric Phan — Full-Stack Developer & Digital Transformation Consultant",
    description:
      "Production SaaS platforms, government portals, and AI tools. Next.js + TypeScript + Supabase + Vercel.",
    url: "https://ericphan.com",
    siteName: "ericphan.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eric Phan — Full-Stack Developer & Digital Transformation Consultant",
    description:
      "I build production SaaS, gov portals & AI tools with Next.js + Supabase.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var t=localStorage.getItem("theme");("dark"===t||!t&&matchMedia("(prefers-color-scheme:dark)").matches)&&document.documentElement.classList.add("dark")}catch(e){}}()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
