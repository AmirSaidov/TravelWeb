import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="container-page py-10 text-sm text-[hsl(var(--muted-foreground))]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-display text-base font-semibold text-[hsl(var(--foreground))]">Kyrgyz Travel</div>
            <p className="mt-1 max-w-xl">
              We empower travelers to experience the raw beauty of Kyrgyzstan while supporting local communities and preserving nature.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-[hsl(var(--foreground))]">Privacy</Link>
            <Link href="/terms" className="hover:text-[hsl(var(--foreground))]">Terms</Link>
            <Link href="/sitemap" className="hover:text-[hsl(var(--foreground))]">Sitemap</Link>
          </div>
        </div>
        <div className="mt-8 text-xs">
          © {new Date().getFullYear()} Kyrgyz Travel. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

