import Image from "next/image";
import Link from "next/link";
import { HomeSearch } from "@/components/home/HomeSearch";
import { HomeTours } from "@/components/home/HomeTours";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=60"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 gradient-hero-overlay" />
        </div>

        <div className="container-page relative py-20 text-white sm:py-28">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-6xl text-balance">
            Планируйте путешествие с AI‑ассистентом.
          </h1>
          <p className="mt-5 max-w-2xl text-white/90">
            Маршрут, список вещей, отели и советы — за пару секунд.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/ai"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 font-semibold text-[hsl(var(--foreground))] hover:bg-white/95"
            >
              Открыть AI ассистента
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 font-semibold text-white hover:bg-white/15"
            >
              Смотреть туры
            </Link>
          </div>

          <div className="mt-10">
            <HomeSearch />
          </div>
        </div>
      </section>

      <HomeTours />
    </>
  );
}
