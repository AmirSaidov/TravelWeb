import Link from "next/link";

const navItems = [
  { href: "/explore", label: "Туры" },
  { href: "/map", label: "Карта" },
  { href: "/experiences", label: "Опыт" },
  { href: "/dashboard", label: "Кабинет" },
  { href: "/ai", label: "AI ассистент" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-[60] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container-page flex min-h-16 items-center justify-between gap-2 py-3 md:grid md:grid-cols-[auto_1fr_auto] md:gap-3 md:py-0">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="truncate font-display text-base font-semibold tracking-tight text-[hsl(var(--primary))] sm:text-lg">
            Kyrgyz Travel
          </span>
        </Link>

        <nav className="hidden justify-self-center items-center gap-8 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="relative text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-4 text-xs font-semibold hover:bg-[hsl(var(--accent))] sm:text-sm"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[hsl(var(--brand))] px-4 text-xs font-semibold text-[hsl(var(--brand-foreground))] shadow-card hover:opacity-95 sm:text-sm"
          >
            Регистрация
          </Link>
        </div>
      </div>
    </header>
  );
}
