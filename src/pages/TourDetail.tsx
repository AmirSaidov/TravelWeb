import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Share2, Heart, MapPin, Mountain, Tent, Utensils, Check } from "lucide-react";
import { tours, reviews } from "@/mocks/data";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app";
import { toast } from "@/hooks/use-toast";

const iconMap: Record<string, any> = { mountain: Mountain, tent: Tent, utensils: Utensils, horse: Mountain };

const TourDetail = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tour = useMemo(() => tours.find((tr) => tr.slug === slug) ?? tours[0], [slug]);
  const tReviews = reviews.filter((r) => r.tourId === tour.id);
  const [showMore, setShowMore] = useState(false);
  const saved = useAppStore((s) => s.saved.includes(tour.id));
  const toggleSave = useAppStore((s) => s.toggleSave);
  const addBooking = useAppStore((s) => s.addBooking);

  const [start, setStart] = useState("2026-08-14");
  const [end, setEnd] = useState("2026-08-21");
  const [guests, setGuests] = useState(2);
  const subtotal = tour.price * guests;
  const eco = 25;
  const service = 0;
  const total = subtotal + eco + service;

  const book = () => {
    addBooking({
      id: Math.random().toString(36).slice(2),
      tourId: tour.id,
      startDate: start,
      endDate: end,
      guests,
      total,
      status: "upcoming",
      createdAt: new Date().toISOString(),
    });
    toast({ title: "Booking confirmed", description: `${tour.title} · ${start} → ${end}` });
    navigate("/dashboard");
  };

  return (
    <div className="container-page py-10">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{tour.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <RatingStars value={tour.rating} />
            <span className="font-medium text-foreground">{tour.reviewCount} {t("tour.reviews")}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {tour.location}</span>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-muted"><Share2 className="h-4 w-4" />{t("tour.share")}</button>
          <button onClick={() => toggleSave(tour.id)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-muted">
            <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} />{t("tour.save")}
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-6 grid gap-3 overflow-hidden rounded-3xl md:grid-cols-3">
        <div className="relative md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto">
          <img src={tour.gallery[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="aspect-[4/3] overflow-hidden bg-muted"><img src={tour.gallery[1]} alt="" className="h-full w-full object-cover" /></div>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img src={tour.gallery[2] ?? tour.gallery[0]} alt="" className="h-full w-full object-cover" />
          <button className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-card hover:bg-white">📷 {t("tour.showAll")}</button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Host */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h2 className="font-display text-xl font-semibold">{t("tour.hostedBy")} {tour.host.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tour.host.team}</p>
            </div>
            <img src={tour.host.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
          </div>

          {/* Highlights */}
          <div className="grid gap-5 border-b border-border py-6 sm:grid-cols-2">
            {tour.highlights.map((h) => {
              const Icon = iconMap[h.icon] ?? Mountain;
              return (
                <div key={h.title} className="flex gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-accent-foreground"><Icon className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-semibold">{h.title}</div>
                    <p className="text-sm text-muted-foreground">{h.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* About */}
          <div className="border-b border-border py-6">
            <h2 className="font-display text-xl font-semibold">{t("tour.about")}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
              {(showMore ? tour.longDescription : tour.longDescription.split("\n\n")[0]).split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {!showMore && (
              <button onClick={() => setShowMore(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
                {t("tour.showMore")} ›
              </button>
            )}
          </div>

          {/* Included */}
          <div className="py-6">
            <h2 className="font-display text-xl font-semibold">{t("tour.included")}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {tour.included.map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-brand" />{x}
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          {tReviews.length > 0 && (
            <div className="border-t border-border py-6">
              <h2 className="font-display text-xl font-semibold">Reviews · {tour.rating.toFixed(2)} ({tour.reviewCount})</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {tReviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-3">
                      <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="text-sm font-semibold">{r.author}</div>
                        <div className="text-xs text-muted-foreground">{r.date}</div>
                      </div>
                    </div>
                    <RatingStars value={r.rating} className="mt-3" showValue={false} />
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking widget */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-card p-6 shadow-elevated ring-1 ring-border">
            <div className="flex items-end justify-between">
              <div>
                <span className="font-display text-3xl font-semibold">${tour.price}</span>
                <span className="text-sm text-muted-foreground"> / person</span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <RatingStars value={tour.rating} />
                <div>{tour.reviewCount} {t("tour.reviews")}</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-2">
                <label className="border-r border-border p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.startDate")}</span>
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium outline-none" />
                </label>
                <label className="p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.endDate")}</span>
                  <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full bg-transparent text-sm font-medium outline-none" />
                </label>
              </div>
              <label className="block border-t border-border p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.guestsLabel")}</span>
                <input type="number" min={1} max={tour.maxGuests} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(tour.maxGuests, +e.target.value || 1)))} className="mt-1 w-full bg-transparent text-sm font-medium outline-none" />
              </label>
            </div>

            <Button onClick={book} className="mt-4 h-12 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">{t("tour.bookNow")}</Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("tour.notCharged")}</p>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Row label={`$${tour.price} × ${guests} ${guests > 1 ? "people" : "person"}`} value={`$${subtotal.toLocaleString()}`} />
              <Row label={t("tour.ecoFee")} value={`$${eco}`} />
              <Row label={t("tour.serviceFee")} value={`$${service}`} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">{t("tour.total")}</span>
              <span className="font-display text-lg font-semibold">${total.toLocaleString()}</span>
            </div>
            <div className="mt-4 rounded-xl bg-brand-soft px-3 py-2 text-center text-xs font-medium text-accent-foreground">
              {t("tour.freeCancellation", { date: "Aug 7th" })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{value}</span></div>
);

export default TourDetail;
