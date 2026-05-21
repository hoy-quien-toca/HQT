import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Hoy Quien Toca",
  description: "Cartelera de eventos musicales",
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
      </body>
    </html>
  );
}
