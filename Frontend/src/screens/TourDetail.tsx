"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Share2, Heart, MapPin, Mountain, Tent, Utensils, Check, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { bookingApi, reviewsApi, toursApi } from "@/lib/api";
import { geocodePlace } from "@/lib/mapboxGeocoding";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/app";
import { toast } from "@/hooks/use-toast";
import { MiniMap } from "@/components/maps/MiniMap";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = { mountain: Mountain, tent: Tent, utensils: Utensils, horse: Mountain };

const TourDetail = () => {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug =
    typeof params?.slug === "string"
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0]
        : undefined;
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAppStore((s) => s.user);
  const openAuthModal = useAppStore((s) => s.openAuthModal);
  const currency = useAppStore((s) => s.currency);
  const { data: tour, isLoading } = useQuery({
    queryKey: ["tour", slug, currency],
    queryFn: async () => {
      if (!slug) return null;
      return toursApi.getTourBySlug(slug, currency);
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
  const { data: myBookings = [] } = useQuery({
    queryKey: ["my-bookings", currency],
    enabled: Boolean(user),
    queryFn: async () => bookingApi.myBookings(currency),
  });
  const [showMore, setShowMore] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const saved = useAppStore((s) => (tour ? s.saved.includes(tour.id) : false));
  const toggleSave = useAppStore((s) => s.toggleSave);
  const addBooking = useAppStore((s) => s.addBooking);

  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [postingReview, setPostingReview] = useState(false);
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

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined;
  const { data: geoCenter = null } = useQuery({
    queryKey: ["geocode", tour?.location],
    enabled: Boolean(mapboxToken && tour?.location && !tour?.coordinates),
    queryFn: async () => {
      if (!mapboxToken || !tour?.location) return null;
      return geocodePlace({ token: mapboxToken, query: tour.location, country: "kg" });
    },
  });
  const mapCenter = tour?.coordinates ? { lng: tour.coordinates.lng, lat: tour.coordinates.lat } : geoCenter;

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
      const booking = await bookingApi.createBooking({ tourId: tour.id, peopleCount: guests, currency });
      const startDate = (booking as any)?.date
        ? String((booking as any).date)
        : new Date().toISOString().slice(0, 10);
      const endDate = addDays(parseISO(startDate), Math.max(1, tour.durationDays)).toISOString().slice(0, 10);

      addBooking({
        id: String(booking.booking_id),
        tourId: tour.id,
        startDate,
        endDate,
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
      router.push("/dashboard");
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

  const submitReview = async () => {
    if (!tour) return;
    if (!user) return openAuthModal("login");

    const comment = myComment.trim();
    if (!comment) {
      toast({ title: "Review", description: "Please write a short comment.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(myRating) || myRating < 1 || myRating > 5) {
      toast({ title: "Review", description: "Rating must be 1 to 5.", variant: "destructive" });
      return;
    }

    try {
      setPostingReview(true);
      await reviewsApi.create({ tourId: tour.id, rating: myRating, comment });
      setMyComment("");
      setMyRating(5);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews", tour.id] }),
        queryClient.invalidateQueries({ queryKey: ["tours"] }),
      ]);
      toast({ title: "Thanks!", description: "Your review has been posted." });
    } catch (err: any) {
      toast({
        title: "Review error",
        description: err?.response?.data?.error ?? "Failed to post review.",
        variant: "destructive",
      });
    } finally {
      setPostingReview(false);
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

  const gallery = (tour.gallery && tour.gallery.length > 0 ? tour.gallery : [tour.hero]).filter(Boolean);
  const safePhoto = (i: number) => gallery[i] ?? gallery[0];
  const hasReviewed = Boolean(user && reviews.some((r) => String(r.user?.id) === String(user.id)));
  const canReview = Boolean(
    user &&
      Array.isArray(myBookings) &&
      myBookings.some((b: any) => String(b?.tour?.id) === String(tour.id) && String(b?.status) === "confirmed")
  );

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
          <img src={safePhoto(0)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img src={safePhoto(1)} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img src={safePhoto(2)} alt="" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setActivePhoto(0);
              setGalleryOpen(true);
            }}
            className="absolute bottom-3 right-3 rounded-xl bg-white/95 text-xs shadow-card hover:bg-white"
          >
            {t("tour.showAll")}
          </Button>
        </div>
      </div>

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="w-[min(1000px,calc(100vw-1.25rem))] max-w-none rounded-3xl p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="font-display text-base font-semibold">{t("tour.showAll")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 p-4 md:grid-cols-[1fr_280px]">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <img src={safePhoto(activePhoto)} alt="" className="h-[60vh] w-full object-contain" />
            </div>
            <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-auto pr-1 md:grid-cols-1">
              {gallery.map((src, idx) => (
                <button
                  key={`${src}:${idx}`}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={cn(
                    "relative overflow-hidden rounded-xl ring-1 ring-border transition hover:ring-2 hover:ring-brand",
                    idx === activePhoto ? "ring-2 ring-brand" : "",
                  )}
                  aria-label={`Photo ${idx + 1}`}
                >
                  <img src={src} alt="" className="h-24 w-full object-cover md:h-28" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

            <div className="mt-6 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-display text-base font-semibold">Leave a review</div>
                {!user && (
                  <Button
                    variant="outline"
                    className="h-9 rounded-full px-4 text-xs"
                    onClick={() => openAuthModal("login")}
                  >
                    Sign in
                  </Button>
                )}
              </div>

              {!user ? (
                <div className="mt-4 text-sm text-muted-foreground">Sign in to leave a review.</div>
              ) : hasReviewed ? (
                <div className="mt-4 text-sm text-muted-foreground">You already left a review for this tour.</div>
              ) : !canReview ? (
                <div className="mt-4 text-sm text-muted-foreground">You can leave a review after you book this tour.</div>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const v = i + 1;
                      const active = v <= myRating;
                      return (
                        <button
                          key={v}
                          type="button"
                          disabled={postingReview}
                          onClick={() => setMyRating(v)}
                          className={cn("grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted/60")}
                          aria-label={`Rate ${v} stars`}
                        >
                          <Star className={cn("h-5 w-5", active ? "fill-gold text-gold" : "text-muted-foreground")} />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-sm text-muted-foreground">{myRating}/5</span>
                  </div>

                  <Textarea
                    className="mt-3 rounded-2xl"
                    placeholder="Write your experience…"
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    disabled={postingReview}
                  />

                  <div className="mt-3 flex justify-end">
                    <Button
                      onClick={submitReview}
                      disabled={postingReview}
                      className="h-11 rounded-xl bg-brand px-6 text-brand-foreground hover:bg-brand/90"
                    >
                      {postingReview ? "Posting…" : "Post review"}
                    </Button>
                  </div>
                </>
              )}
            </div>
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
                <span className="font-display text-3xl font-semibold">{formatMoney(tour.price, tour.currency)}</span>
                <span className="text-sm text-muted-foreground"> / person</span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <RatingStars value={tour.rating} />
                <div>{reviews.length} {t("tour.reviews")}</div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-border">
              <label className="block border-t border-border p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("tour.guestsLabel")}</span>
                <Input type="number" min={1} max={tour.maxGuests} value={guests} onChange={(e) => setGuests(Math.max(1, Math.min(tour.maxGuests, +e.target.value || 1)))} className="mt-1 h-8 border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
              </label>
            </div>

            <Button onClick={book} className="mt-4 h-12 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90">{t("tour.bookNow")}</Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t("tour.notCharged")}</p>

            <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
              <Row
                label={`${formatMoney(tour.price, tour.currency)} × ${guests} ${guests > 1 ? "people" : "person"}`}
                value={formatMoney(subtotal, tour.currency)}
              />
              <Row label={t("tour.ecoFee")} value={formatMoney(eco, tour.currency)} />
              <Row label={t("tour.serviceFee")} value={formatMoney(service, tour.currency)} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold">{t("tour.total")}</span>
              <span className="font-display text-lg font-semibold">{formatMoney(total, tour.currency)}</span>
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
