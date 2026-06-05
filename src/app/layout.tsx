import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hoy Quien Toca | Cartelera de Eventos Musicales",
    template: "%s | Hoy Quien Toca",
  },
  description: "Descubrí recitales en tu ciudad. Cartelera actualizada de eventos musicales, entrevistas a bandas y toda la movida local en un solo lugar.",
  keywords: ["recitales", "música en vivo", "conciertos", "cartelera musical", "entrevistas a bandas", "hoy quien toca"],
  authors: [{ name: "Hoy Quien Toca" }],
  creator: "Hoy Quien Toca",
  publisher: "Hoy Quien Toca",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://hoyquientoca.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hoy Quien Toca | Cartelera de Eventos Musicales",
    description: "Descubrí recitales en tu ciudad. Cartelera actualizada de eventos musicales y entrevistas.",
    url: "https://hoyquientoca.com",
    siteName: "Hoy Quien Toca",
    images: [
      {
        url: "/logo-rojo.jpg",
        width: 800,
        height: 800,
        alt: "Hoy Quien Toca Logo",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hoy Quien Toca | Cartelera de Eventos Musicales",
    description: "Descubrí recitales en tu ciudad. Cartelera actualizada de eventos musicales.",
    images: ["/logo-rojo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-zinc-800">
        <div className="global-watermark">
          <Image src="/logo.jpg" alt="HQT" width={1000} height={1000} className="grayscale" priority />
        </div>
        <div className="content-wrapper flex flex-col flex-1">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
