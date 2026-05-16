import Link from "next/link";

const Sitemap = () => {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Sitemap</h1>
      <div className="mt-6 grid gap-2 text-sm">
        <Link href="/" className="text-brand hover:underline">
          Home
        </Link>
        <Link href="/explore" className="text-brand hover:underline">
          Explore
        </Link>
        <Link href="/map" className="text-brand hover:underline">
          Map
        </Link>
        <Link href="/experiences" className="text-brand hover:underline">
          Experiences
        </Link>
        <Link href="/dashboard" className="text-brand hover:underline">
          Dashboard
        </Link>
        <Link href="/info/visa" className="text-brand hover:underline">
          Visa
        </Link>
        <Link href="/info/best-time" className="text-brand hover:underline">
          Best time
        </Link>
        <Link href="/info/etiquette" className="text-brand hover:underline">
          Etiquette
        </Link>
        <Link href="/info/safety" className="text-brand hover:underline">
          Safety
        </Link>
        <Link href="/privacy" className="text-brand hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="text-brand hover:underline">
          Terms
        </Link>
      </div>
    </div>
  );
};

export default Sitemap;
