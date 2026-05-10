import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Share2, Heart, MapPin, Mountain, Tent, Utensils, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { bookingApi, reviewsApi, toursApi } from "@/lib/api";
import { geocodePlace } from "@/lib/mapboxGeocoding";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app";
import { toast } from "@/hooks/use-toast";
import { MiniMap } from "@/components/maps/MiniMap";

const iconMap: Record<string, any> = { mountain: Mountain, tent: Tent, utensils: Utensils, horse: Mountain };

const TourDetail = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", slug],
    queryFn: async () => {
      if (!slug) return null;
      return toursApi.getTourBySlug(slug);
    },
  });
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", tour?.id],
    enabled: Boolean(tour?.id),
    queryFn: async () => {
      if (!tour) return [];
      return reviewsApi.getByTourId(tour.id);
    },
  });
  const [showMore, setShowMore] = useState(false);
  const saved = useAppStore((s) => (tour ? s.saved.includes(tour.id) : false));
  const toggleSave = useAppStore((s) => s.toggleSave);
  const addBooking = useAppStore((s) => s.addBooking);
  const user = useAppStore((s) => s.user);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const locale = (() => {
    const lng = (i18n.language || "en").toLowerCase();
    if (lng.startsWith("ru")) return ru;
    if (lng.startsWith("kg") || lng.startsWith("ky")) return ru;
    return enUS;
  })();
  const formatReviewDate = (value: string | null) => {
    if (!value) return "";
    try {
      return format(parseISO(value), "d MMM yyyy", { locale });
    } catch {
      return "";
    }
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const { data: geoCenter = null } = useQuery({
    queryKey: ["geocode", tour?.location],
    enabled: Boolean(mapboxToken && tour?.location),
    queryFn: async () => {
      if (!mapboxToken || !tour?.location) return null;
      return geocodePlace({ token: mapboxToken, query: tour.location, country: "kg" });
    },
  });
  const mapCenter = geoCenter;

  const [start, setStart] = useState("2026-08-14");
  const [end, setEnd] = useState("2026-08-21");
  const [guests, setGuests] = useState(1);
  const subtotal = (tour?.price ?? 0) * guests;
  const eco = 25;
  const service = 0;
  const total = subtotal + eco + service;

  const book = async () => {
    if (!tour) return;
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book.", variant: "destructive" });
      openAuthModal("login");
      return;
    }

    try {
      const booking = await bookingApi.createBooking({ tourId: tour.id, peopleCount: guests, date: start });

      addBooking({
        id: String(booking.booking_id),
        tourId: tour.id,
        startDate: start,
        endDate: end,
        guests,
        total,
        status: "upcoming",
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Booking created",
        description: booking.payment_due_at
          ? `Please complete payment by ${booking.payment_due_at.slice(0, 16).replace("T", " ")}`
          : "Please complete payment in time to confirm your booking.",
      });
      navigate("/dashboard");
      return;
    } catch (err: any) {
      toast({
        title: "Booking error",
        description: err?.response?.data?.error ?? "Failed to create booking.",
        variant: "destructive",
      });
      return;
    }
  };

  if (isLoading || !tour) {
    return (
      <div className="container-page py-10">
        <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Loading tour…
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      {/* Title */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{tour.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <RatingStars value={tour.rating} />
            <span className="font-medium text-foreground">{reviews.length} {t("tour.reviews")}</span>
            <span>В·</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {tour.location}</span>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <Button variant="ghost" className="rounded-full px-3 py-2"><Share2 className="h-4 w-4" />{t("tour.share")}</Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!user) return openAuthModal("login");
              toggleSave(tour.id);
            }}
            className="rounded-full px-3 py-2"
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-destructive text-destructive" : ""}`} />{t("tour.save")}
          </Button>
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
          <Button variant="outline" size="sm" className="absolute bottom-3 right-3 rounded-xl bg-white/95 text-xs shadow-card hover:bg-white">?? {t("tour.showAll")}</Button>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
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
              <Button variant="link" onClick={() => setShowMore(true)} className="mt-3 h-auto p-0 text-sm font-semibold">
                {t("tour.showMore")} ›
              </Button>
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
          <div className="border-t border-border py-6">
            <h2 className="font-display text-xl font-semibold">Reviews · {reviews.length}</h2>
            {reviewsLoading ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Loading reviews…
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No reviews yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-border p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                        {r.user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{r.user.name}</div>
                        <div className="text-xs text-muted-foreground">{formatReviewDate(r.created_at)}</div>
                      </div>
                    </div>
                    <RatingStars value={r.rating} className="mt-3" showValue={false} />
                    <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Where you'll be */}
          <div className="border-t border-border py-6">
            <h2 className="font-display text-xl font-semibold">{t("tour.whereYoullBe")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{tour.location}</p>
            <div className="mt-5 overflow-hidden rounded-3xl ring-1 ring-border">
              <div className="h-[280px] w-full sm:h-[360px]">
                <MiniMap center={mapCenter} zoom={10} />
              </div>
            </div>
          </div>
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
                <div>{reviews.length} {t("tour.reviews")}</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-2">
                <label className="border-r border-border p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.startDate")}</span>
                  <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 h-8 border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                </label>
                <label className="p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.endDate")}</span>
                  <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 h-8 border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                </label>
              </div>
              <label className="block border-t border-border p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.guestsLabel")}</span>
                <Input type="number" min={1} max={tour.maxGuests} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(tour.maxGuests, +e.target.value || 1)))} className="mt-1 h-8 border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </label>
            </div>

            <Button onClick={book} className="mt-4 h-12 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">{t("tour.bookNow")}</Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("tour.notCharged")}</p>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Row label={`$${tour.price} Г— ${guests} ${guests > 1 ? "people" : "person"}`} value={`$${subtotal.toLocaleString()}`} />
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
