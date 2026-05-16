import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "antd/dist/reset.css";
import "./globals.css";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Providers } from "./providers";
import { cookies } from "next/headers";

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
      <body>
        <Providers initialLang={lang}>
          <SiteLayout>{children}</SiteLayout>
        </Providers>
      </body>
    </html>
  );
}
