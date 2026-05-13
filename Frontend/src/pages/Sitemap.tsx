import { Link } from "react-router-dom";

const Sitemap = () => {
  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Sitemap</h1>
      <div className="mt-6 grid gap-2 text-sm">
        <Link to="/" className="text-brand hover:underline">
          Home
        </Link>
        <Link to="/explore" className="text-brand hover:underline">
          Explore
        </Link>
        <Link to="/map" className="text-brand hover:underline">
          Map
        </Link>
        <Link to="/experiences" className="text-brand hover:underline">
          Experiences
        </Link>
        <Link to="/dashboard" className="text-brand hover:underline">
          Dashboard
        </Link>
        <Link to="/info/visa" className="text-brand hover:underline">
          Visa
        </Link>
        <Link to="/info/best-time" className="text-brand hover:underline">
          Best time
        </Link>
        <Link to="/info/etiquette" className="text-brand hover:underline">
          Etiquette
        </Link>
        <Link to="/info/safety" className="text-brand hover:underline">
          Safety
        </Link>
        <Link to="/privacy" className="text-brand hover:underline">
          Privacy
        </Link>
        <Link to="/terms" className="text-brand hover:underline">
          Terms
        </Link>
      </div>
    </div>
  );
};

export default Sitemap;

