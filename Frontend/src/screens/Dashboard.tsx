"use client";

import { useTranslation } from "react-i18next";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAppStore } from "@/store/app";
import { bookingApi, toursApi } from "@/lib/api";
import { TourCard } from "@/components/ui-bits/TourCard";
import { toast } from "@/hooks/use-toast";
import { Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildStaticMapUrl } from "@/lib/mapboxStatic";
import { geocodePlace } from "@/lib/mapboxGeocoding";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user, bookings, saved, signIn, cancelBooking, currency, setAvatar } = useAppStore();
  const [tab, setTab] = useState<"bookings" | "saved" | "profile">("bookings");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const { data: serverBookings = [], isLoading: serverBookingsLoading } = useQuery({
    queryKey: ["my-bookings", currency],
    enabled: Boolean(user),
    queryFn: () => bookingApi.myBookings(currency),
  });
  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const past = bookings.filter((b) => b.status !== "upcoming");
  const todayIso = new Date().toISOString().slice(0, 10);
  const isPastServerBooking = (b: any) => {
    const d = typeof b?.date === "string" ? b.date : null;
    if (b?.status === "cancelled") return true;
    if (d) return d < todayIso;
    return false;
  };
  const serverUpcomingBookings = serverBookings.filter((b: any) => !isPastServerBooking(b));
  const serverPastBookings = serverBookings.filter((b: any) => isPastServerBooking(b));
  const serverPastCount = serverPastBookings.length;
  const [pastOpen, setPastOpen] = useState(false);

  const { data: apiTours = [] } = useQuery({
    queryKey: ["tours", currency],
    queryFn: () => toursApi.getTours(currency),
  });

  const savedTours = apiTours.filter((tr) => saved.includes(tr.id));

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/(^-|-$)/g, "");
  const visitedRegions = useMemo(() => {
    const places = new Set<string>();
    serverBookings.forEach((b: any) => {
      const loc = typeof b?.tour?.location === "string" ? b.tour.location.trim() : "";
      if (loc) places.add(loc);
    });
    return Array.from(places);
  }, [serverBookings]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string | undefined;
  const { data: kgCenter = null } = useQuery({
    queryKey: ["kg-center"],
    enabled: Boolean(mapboxToken),
    queryFn: async () => {
      if (!mapboxToken) return null;
      return geocodePlace({ token: mapboxToken, query: "Kyrgyzstan", country: "kg" });
    },
  });
  const { data: visitedCoords = [] } = useQuery({
    queryKey: ["visited-geocodes", visitedRegions],
    enabled: Boolean(mapboxToken && visitedRegions.length > 0),
    queryFn: async () => {
      if (!mapboxToken || visitedRegions.length === 0) return [];

      const cacheKey = "geoCache:v1";
      const cache: Record<string, { lng: number; lat: number }> = (() => {
        try {
          return JSON.parse(localStorage.getItem(cacheKey) || "{}");
        } catch {
          return {};
        }
      })();

      const out: Array<{ lng: number; lat: number }> = [];
      for (const place of visitedRegions) {
        const cached = cache[place];
        if (cached && Number.isFinite(cached.lng) && Number.isFinite(cached.lat)) {
          out.push(cached);
          continue;
        }
        const geo = await geocodePlace({ token: mapboxToken, query: place, country: "kg" });
        if (geo) {
          cache[place] = geo;
          out.push(geo);
        }
      }

      try {
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      } catch {
        // ignore
      }

      return out;
    },
  });
  const footprintMapUrl = useMemo(() => {
    if (!mapboxToken) return null;
    const markers = visitedCoords.map((c) => ({ lng: c.lng, lat: c.lat, color: "ef4444" }));
    if (markers.length === 0) {
      if (!kgCenter) return null;
      return buildStaticMapUrl({ token: mapboxToken, width: 520, height: 320, center: { lng: kgCenter.lng, lat: kgCenter.lat, zoom: 5.2 } });
    }
    if (markers.length === 1 && kgCenter) {
      // Avoid "auto" zooming too far in when there is only a single visited point.
      // Keep Kyrgyzstan in a general overview and show the marker on top.
      return buildStaticMapUrl({
        token: mapboxToken,
        width: 520,
        height: 320,
        markers,
        center: { lng: kgCenter.lng, lat: kgCenter.lat, zoom: 5.2 },
      });
    }
    return buildStaticMapUrl({ token: mapboxToken, width: 520, height: 320, markers });
  }, [kgCenter, mapboxToken, visitedCoords]);

  const memberSinceLabel = useMemo(() => {
    const raw = user?.createdAt;
    if (!raw) return "—";
    try {
      return format(parseISO(raw), "MMM yyyy");
    } catch {
      return "—";
    }
  }, [user?.createdAt]);

  const saveProfile = () => {
    if (!user) return;
    signIn({ ...user, name, email, phone });
    toast({ title: t("dashboard.profileSaved") });
  };

  const onAvatarFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Avatar", description: "Please choose an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 1024 * 1024) {
      toast({ title: "Avatar", description: "Image is too large (max 1MB).", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (!url) return;
      setAvatar(url);
      toast({ title: "Avatar updated" });
    };
    reader.readAsDataURL(file);
  };

  const cancelServerBooking = async (bookingId: number) => {
    try {
      await bookingApi.cancel({ bookingId });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings", currency] });
      toast({ title: t("dashboard.bookingCancelled") });
    } catch (err: any) {
      toast({
        title: t("dashboard.cancelError"),
        description: err?.response?.data?.error ?? t("dashboard.cancelFailed"),
        variant: "destructive",
      });
    }
  };

  const payServerBooking = async (bookingId: number) => {
    try {
      await bookingApi.pay({ bookingId, currency });
      await queryClient.invalidateQueries({ queryKey: ["my-bookings", currency] });
      toast({ title: "Payment successful" });
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err?.response?.data?.error ?? "Failed to complete payment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container-page py-10">
      <div>
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {user?.name ? t("dashboard.welcomeBack", { name: user.name }) : t("dashboard.welcomeBackShort")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("dashboard.manageText")}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-8">
        <TabsList className="h-auto w-full justify-start gap-6 bg-transparent p-0">
          {[
            { id: "bookings", label: t("dashboard.bookings") },
            { id: "saved", label: t("dashboard.saved") },
            { id: "profile", label: t("dashboard.profile") },
          ].map((it) => (
            <TabsTrigger
              key={it.id}
              value={it.id}
              className={cn(
                "rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-medium text-muted-foreground shadow-none",
                "data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent"
              )}
            >
              {it.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="h-px w-full bg-border" />

        <TabsContent value="bookings" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h2 className="text-2xl font-semibold">{t("dashboard.upcomingTrips")}</h2>
              <div className="mt-6 grid gap-6">
                {serverBookingsLoading ? (
                  <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                    {t("dashboard.loadingBookings")}
                  </div>
                ) : serverBookings.length > 0 ? (
                  serverUpcomingBookings.map((b: any) => (
                    <div key={b.id} className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                        <div className="relative aspect-[4/3] md:aspect-auto">
                          <img src={b.tour.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        </div>
                        <div className="p-6 md:p-8">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-display text-2xl font-semibold">{b.tour.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">{b.tour.location}</div>
                            </div>
                            <div className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-[11px] font-semibold tracking-wide text-accent-foreground">
                              {b.status === "confirmed"
                                ? t("dashboard.statusConfirmed")
                                : b.status === "pending"
                                  ? t("dashboard.statusPending")
                                  : b.status === "cancelled"
                                    ? t("dashboard.statusCancelled")
                                    : String(b.status).toUpperCase()}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4" /> {b.date ?? "—"}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4" /> {t("dashboard.guests", { n: b.people_count })}
                            </span>
                          </div>
                          {b.status === "pending" && (
                            <div className="mt-3 text-xs text-amber-600">
                              {b.payment_due_at
                                ? `Оплатите до ${String(b.payment_due_at).slice(0, 16).replace("T", " ")}`
                                : "Ожидается оплата"}
                            </div>
                          )}
                          <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild className="h-11 rounded-xl bg-brand px-6 text-brand-foreground hover:bg-brand/90">
                              <Link href={`/route?to=${encodeURIComponent((b?.tour?.location || b?.tour?.title || "").trim())}`}>
                                {t("dashboard.viewItinerary")}
                              </Link>
                            </Button>
                            <Button variant="outline" className="h-11 rounded-xl px-6" disabled>
                              {t("dashboard.manage")}
                            </Button>
                            {b.status === "pending" && (
                              <Button
                                className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                                onClick={() => payServerBooking(Number(b.id))}
                              >
                                Оплатить
                              </Button>
                            )}
                            {b.status === "pending" && (
                              <Button
                                variant="ghost"
                                className="h-11 rounded-xl text-destructive hover:text-destructive"
                                onClick={() => cancelServerBooking(Number(b.id))}
                              >
                                {t("dashboard.cancel")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : upcoming.length === 0 ? (
                  <EmptyState text={t("dashboard.noBookings")} />
                ) : (
                  upcoming.map((b) => {
                    const tr = apiTours.find((x) => x.id === b.tourId);
                    if (!tr) {
                      return (
                        <div key={b.id} className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                          Booking #{b.id} (tour #{b.tourId}) — tour details not loaded.
                        </div>
                      );
                    }
                    return (
                      <div key={b.id} className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                          <div className="relative aspect-[4/3] md:aspect-auto">
                            <img src={tr.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
                          </div>
                          <div className="p-6 md:p-8">
                            <div className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground">
                              {t("dashboard.statusConfirmed")}
                            </div>
                            <div className="font-display text-2xl font-semibold">{tr.title}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{tr.region}</div>
                            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {b.startDate} — {b.endDate}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Users className="h-4 w-4" /> {t("dashboard.guests", { n: b.guests })}
                              </span>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-3">
                              <Button asChild className="h-11 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                                <Link href={`/route?to=${encodeURIComponent((tr.location || tr.region || tr.title).trim())}`}>
                                  {t("dashboard.viewItinerary")}
                                </Link>
                              </Button>
                              <Button variant="outline" className="h-11 rounded-xl px-6" disabled>
                                {t("dashboard.manage")}
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-11 rounded-xl text-destructive hover:text-destructive"
                                onClick={() => cancelBooking(b.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

                {(serverBookings.length > 0 ? serverPastCount > 0 : past.length > 0) && (
                <button className="mt-8 text-sm font-medium text-primary hover:underline" onClick={() => setPastOpen((v) => !v)}>
                  {t("dashboard.pastBookings", { n: serverBookings.length > 0 ? serverPastCount : past.length })}
                </button>
              )}

              {pastOpen && (
                <div className="mt-6 grid gap-6">
                  {(serverBookings.length > 0 ? serverPastBookings : past).length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
                      {t("dashboard.noBookings")}
                    </div>
                  ) : serverBookings.length > 0 ? (
                    serverPastBookings.map((b: any) => (
                      <div key={`past-${b.id}`} className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card opacity-95">
                        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                          <div className="relative aspect-[4/3] md:aspect-auto">
                            <img src={b.tour.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                          </div>
                          <div className="p-6 md:p-8">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="font-display text-2xl font-semibold">{b.tour.title}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{b.tour.location}</div>
                              </div>
                              <div className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                                {b.status === "confirmed"
                                  ? t("dashboard.statusConfirmed")
                                  : b.status === "pending"
                                    ? t("dashboard.statusPending")
                                    : b.status === "cancelled"
                                      ? t("dashboard.statusCancelled")
                                      : String(b.status).toUpperCase()}
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> {b.date ?? "—"}
                              </span>
                              <span className="inline-flex items-center gap-2">
                                <Users className="h-4 w-4" /> {t("dashboard.guests", { n: b.people_count })}
                              </span>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-3">
                              <Button asChild variant="outline" className="h-11 rounded-xl px-6">
                                <Link href={`/route?to=${encodeURIComponent((b?.tour?.location || b?.tour?.title || "").trim())}`}>
                                  {t("dashboard.viewItinerary")}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    past.map((b) => {
                      const tr = apiTours.find((x) => x.id === b.tourId);
                      if (!tr) return null;
                      return (
                        <div key={`past-local-${b.id}`} className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card opacity-95">
                          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
                            <div className="relative aspect-[4/3] md:aspect-auto">
                              <img src={tr.hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            </div>
                            <div className="p-6 md:p-8">
                              <div className="absolute right-6 top-6 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground">
                                {String(b.status).toUpperCase()}
                              </div>
                              <div className="font-display text-2xl font-semibold">{tr.title}</div>
                              <div className="mt-1 text-sm text-muted-foreground">{tr.region}</div>
                              <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-2">
                                  <Calendar className="h-4 w-4" /> {b.startDate} — {b.endDate}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Users className="h-4 w-4" /> {t("dashboard.guests", { n: b.guests })}
                                </span>
                              </div>
                              <div className="mt-8 flex flex-wrap gap-3">
                                <Button asChild variant="outline" className="h-11 rounded-xl px-6">
                                  <Link href={`/route?to=${encodeURIComponent((tr.location || tr.region || tr.title).trim())}`}>
                                    {t("dashboard.viewItinerary")}
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
                <div className="flex flex-col items-center text-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-background"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-lg font-semibold text-foreground ring-4 ring-background">
                      {(user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="mt-5 font-display text-3xl font-semibold">{user?.name ?? "Traveler"}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t("dashboard.title")}</div>
                  <Button variant="outline" className="mt-6 h-11 w-full rounded-xl" onClick={() => setTab("profile")}>
                    {t("dashboard.editProfile")}
                  </Button>
                </div>
                <div className="mt-6 border-t border-border pt-6 text-sm">
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-muted-foreground">{t("dashboard.memberSince")}</span>
                    <span className="font-medium">{memberSinceLabel}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
                <div className="font-display text-lg font-semibold">{t("dashboard.travelFootprint")}</div>
                <div className="mt-4 overflow-hidden rounded-2xl bg-muted">
                  {footprintMapUrl ? (
                    <img src={footprintMapUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="relative aspect-[4/3] bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.08),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.06),transparent_60%)]" />
                  )}
                </div>
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium shadow-card ring-1 ring-border/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {visitedRegions.length}
                    </span>
                    {t("dashboard.regionsVisited")}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {savedTours.length === 0 ? (
            <EmptyState text={t("dashboard.noSaved")} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {savedTours.map((tr) => (
                <TourCard key={tr.id} tour={tr} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6 max-w-xl">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-base font-semibold text-foreground">
                  {(user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-display text-lg font-semibold">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                e.target.value = "";
                onAvatarFile(file);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => avatarInputRef.current?.click()}>
                Change avatar…
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setAvatar("")}>
                Remove avatar
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+996 …" />
              </div>
            </div>
            <Button onClick={saveProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {t("dashboard.saveProfile")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

export default Dashboard;
