import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { socialOrigin } from "../lib/social-metadata";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const ogImage = `${socialOrigin(incoming.get("host"))}/og-qrecorde.png`;
  const title = "QRecorde — Presentes digitais, memórias reais";
  const description = "Entregue presentes digitais para o público do seu evento, com QR Codes rastreáveis, patrocinadores e métricas em tempo real.";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, siteName: "QRecorde", images: [{ url: ogImage, alt: "QRecorde — Presentes digitais. Memórias reais." }], locale: "pt_BR", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
