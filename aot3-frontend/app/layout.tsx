import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/src/components/Providers";
import "./globals.css";

const beauRivage = localFont({
  src: "../public/BeauRivage-Regular.ttf",
  display: "swap",
  variable: "--font-beau-rivage",
});

const loveLight = localFont({
  src: "../public/LoveLight-Regular.ttf",
  display: "swap",
  variable: "--font-love-light",
});

const ropaSans = localFont({
  src: "../public/RopaSans-Regular.ttf",
  display: "swap",
  variable: "--font-ropa-sans",
});

export const metadata: Metadata = {
  title: "AoT³ | Atheneum of Tongues",
  description: "Learn a new language through content you love.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${loveLight.variable} ${ropaSans.variable} ${beauRivage.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
