import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Share2, Heart, HeartCrack, MapPin, Mountain, Tent, Utensils, Check, MessageCircle, Send, Instagram, Facebook, Ellipsis } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { tours, reviews } from "@/mocks/data";
import { RatingStars } from "@/components/ui-bits/RatingStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [shareOpen, setShareOpen] = useState(false);
  const [saveBurstKey, setSaveBurstKey] = useState(0);
  const [breakHeartKey, setBreakHeartKey] = useState(0);
  const [showBrokenHeart, setShowBrokenHeart] = useState(false);
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
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = encodeURIComponent(tour.title);
  const shareItems = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${shareTitle}%20${encodeURIComponent(shareUrl)}`,
      icon: MessageCircle,
      bg: "bg-[#25D366]",
      x: 95,
      y: 76,
      z: 50,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareTitle}`,
      icon: Send,
      bg: "bg-[#229ED9]",
      x: 71,
      y: 80,
      z: 40,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: Facebook,
      bg: "bg-[#1877F2]",
      x: 50,
      y: 90,
      z: 30,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/",
      icon: Instagram,
      bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      x: 34,
      y: 106,
      z: 20,
    },
    {
      id: "more",
      label: "More",
      href: "",
      icon: Ellipsis,
      bg: "bg-white text-[#374151]",
      x: 24,
      y: 130,
      z: 10,
    },
  ];

  const saveParticles = [
    { x: -26, y: -18 },
    { x: -30, y: 0 },
    { x: -24, y: 18 },
    { x: -8, y: 24 },
    { x: 8, y: 24 },
    { x: 24, y: 16 },
    { x: 30, y: 0 },
    { x: 24, y: -16 },
    { x: 8, y: -24 },
    { x: -8, y: -24 },
  ];

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

  const handleSaveClick = () => {
    const willSave = !saved;
    if (willSave) {
      setSaveBurstKey((k) => k + 1);
    } else {
      setBreakHeartKey((k) => k + 1);
      setShowBrokenHeart(true);
      window.setTimeout(() => setShowBrokenHeart(false), 520);
    }
    toggleSave(tour.id);
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
          <div className="relative overflow-visible">
            <Button
              variant="ghost"
              onClick={() => setShareOpen((s) => !s)}
              className="rounded-full border border-[#9dd9c3]/40 bg-[#EAF7F1] px-4 py-2 text-[#0f5e48] hover:bg-[#dff3ea]"
            >
              <Share2 className={`h-4 w-4 transition-transform duration-300 ${shareOpen ? "rotate-45" : ""}`} />
              {t("tour.share")}
            </Button>
            <AnimatePresence>
              {shareOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 h-[130px] w-[220px] origin-bottom-right"
                >
                  {shareItems.map((item, index) => {
                    const Icon = item.icon;
                    const commonProps = {
                      key: item.id,
                      title: item.label,
                      initial: { x: 58, y: 120, scale: 0.35, opacity: 0 },
                      animate: { x: item.x, y: item.y, scale: 1, opacity: 1 },
                      exit: { x: 58, y: 120, scale: 0.35, opacity: 0 },
                      transition: { type: "spring", stiffness: 360, damping: 22, delay: index * 0.03 },
                      className: `pointer-events-auto absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full shadow-[0_8px_18px_rgba(15,23,42,0.2)] ring-4 ring-white ${item.bg}`,
                    } as const;

                    if (item.id === "more") {
                      return (
                        <motion.button
                          {...commonProps}
                          onClick={() => setShareOpen(false)}
                          whileHover={{ scale: 1.12, zIndex: 90 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ zIndex: item.z }}
                          className={`${commonProps.className} text-[#374151] transition-all`}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.button>
                      );
                    }

                    return (
                      <motion.a
                        {...commonProps}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.12, zIndex: 90 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ zIndex: item.z }}
                        className={`${commonProps.className} text-white transition-all`}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.a>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            type="button"
            onClick={handleSaveClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#9dd9c3]/40 bg-[#EAF7F1] px-4 py-2 text-[#0f5e48] transition-colors hover:bg-[#dff3ea]"
          >
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <AnimatePresence>
                {saved && (
                  <span key={saveBurstKey} className="absolute inset-0">
                    {saveParticles.map((p, i) => (
                      <motion.span
                        key={`${saveBurstKey}-${i}`}
                        initial={{ x: p.x, y: p.y, scale: 0.9, opacity: 0 }}
                        animate={{ x: 0, y: 0, scale: 0.2, opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.015 }}
                        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF6B8A]"
                      />
                    ))}
                  </span>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {showBrokenHeart && (
                  <motion.span
                    key={breakHeartKey}
                    initial={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
                    animate={{ y: 16, rotate: 18, opacity: 0, scale: 0.75 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeIn" }}
                    className="absolute inset-0 inline-flex items-center justify-center"
                  >
                    <HeartCrack className="h-4 w-4 text-[#FF4D6D] drop-shadow-[0_0_8px_rgba(255,77,109,0.65)]" />
                  </motion.span>
                )}
              </AnimatePresence>
              {saved && (
                <>
                  <motion.span
                    initial={{ scale: 0.2, opacity: 0.7 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full border border-[#FF4D6D]"
                  />
                  <motion.span
                    initial={{ scale: 0.2, opacity: 0.5 }}
                    animate={{ scale: 2.3, opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
                    className="absolute inset-0 rounded-full border border-[#FF9BB0]"
                  />
                </>
              )}
              <motion.span
                key={saved ? "saved" : "idle"}
                initial={{ scale: 0.7, rotate: -18 }}
                animate={saved ? { scale: [0.9, 1.28, 1], rotate: [0, -8, 0] } : { scale: [1, 0.92, 1], rotate: [0, 8, 0] }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="inline-flex"
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-[#FF4D6D] text-[#FF4D6D] drop-shadow-[0_0_8px_rgba(255,77,109,0.65)]" : "text-[#0f8f6a]"}`} />
              </motion.span>
            </span>
            {t("tour.save")}
          </motion.button>
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

