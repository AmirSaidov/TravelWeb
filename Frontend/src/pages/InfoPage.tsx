import { Link, useParams } from "react-router-dom";

const copy: Record<
  string,
  { title: string; body: string }
> = {
  visa: {
    title: "Visa",
    body: "General visa information for Kyrgyzstan. Rules depend on citizenship; please verify with official sources before travel.",
  },
  "best-time": {
    title: "Best time to visit",
    body: "Kyrgyzstan is most popular in late spring–early autumn for hiking; winter is great for skiing. Weather varies by altitude.",
  },
  etiquette: {
    title: "Etiquette",
    body: "Respect local customs: modest dress in villages, remove shoes when invited into a home, and ask before photographing people.",
  },
  safety: {
    title: "Safety tips",
    body: "Standard travel precautions apply. For mountain routes, check weather and road conditions, and consider a local guide for remote treks.",
  },
};

const InfoPage = () => {
  const { topic } = useParams<{ topic: string }>();
  const item = (topic && copy[topic]) || null;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{item?.title ?? "Information"}</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        {item?.body ?? "Choose a topic from the footer: Visa, Best time to visit, Etiquette, Safety tips."}
      </p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link to="/info/visa" className="font-medium text-brand hover:underline">
          Visa
        </Link>
        <Link to="/info/best-time" className="font-medium text-brand hover:underline">
          Best time
        </Link>
        <Link to="/info/etiquette" className="font-medium text-brand hover:underline">
          Etiquette
        </Link>
        <Link to="/info/safety" className="font-medium text-brand hover:underline">
          Safety
        </Link>
      </div>
    </div>
  );
};

export default InfoPage;

