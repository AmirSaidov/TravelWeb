"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Home, Map as MapIcon, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const NotFound = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <section className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/404-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-95"
        />
        {/* Keep photo bright: only a very light contrast overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),rgba(0,0,0,0)_48%),linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.18)_70%,rgba(0,0,0,0.32)_100%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-64px)] items-end justify-center px-6 pb-12 pt-10 text-white sm:px-10 sm:pb-16">
        <div className="flex w-full max-w-3xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild className="h-11 rounded-full bg-white/95 px-6 font-semibold text-foreground hover:bg-white">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("notFound.backHome")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-full border-white/35 bg-white/10 px-6 text-white hover:bg-white/15">
            <Link href="/map">
              <MapIcon className="mr-2 h-4 w-4" />
              {t("notFound.openMap")}
            </Link>
          </Button>
          <Button asChild className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
            <Link href="/ai">
              <Navigation className="mr-2 h-4 w-4" />
              {t("notFound.askAi")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
