import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Providers } from "./providers";
import { cookies } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Kyrgyz Travel",
  description: "Discover Kyrgyzstan tours, routes, maps, bookings, and an AI travel assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = cookies().get("lang")?.value ?? "en";
  return (
    <html lang={lang || "en"}>
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <Providers initialLang={lang}>
          <SiteLayout>{children}</SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
