import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app";
import { tours } from "@/mocks/data";
import { TourCard } from "@/components/ui-bits/TourCard";
import { toast } from "@/hooks/use-toast";
import { Calendar, Users } from "lucide-react";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, bookings, saved, signIn, cancelBooking } = useAppStore();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const past = bookings.filter((b) => b.status !== "upcoming");
  const savedTours = tours.filter((tr) => saved.includes(tr.id));

  const saveProfile = () => {
    if (!user) return;
    signIn({ ...user, name, email, phone });
    toast({ title: "Profile saved" });
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("dashboard.title")}</h1>
      <Tabs defaultValue="bookings" className="mt-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="bookings">{t("dashboard.bookings")}</TabsTrigger>
          <TabsTrigger value="history">{t("dashboard.history")}</TabsTrigger>
          <TabsTrigger value="saved">{t("dashboard.saved")}</TabsTrigger>
          <TabsTrigger value="profile">{t("dashboard.profile")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          {upcoming.length === 0 ? (
            <EmptyState text={t("dashboard.noBookings")} />
          ) : (
            <div className="grid gap-4">
              {upcoming.map((b) => {
                const tr = tours.find((x) => x.id === b.tourId)!;
                return (
                  <div key={b.id} className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                    <img src={tr.hero} alt="" className="h-24 w-32 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand">{t("dashboard.upcoming")}</div>
                      <Link to={`/tour/${tr.slug}`} className="font-display text-lg font-semibold hover:underline">{tr.title}</Link>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{b.startDate} → {b.endDate}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{b.guests} guests</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-semibold">${b.total.toLocaleString()}</div>
                      <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)} className="text-destructive">Cancel</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {past.length === 0 ? <EmptyState text="No past trips yet." /> : (
            <div className="grid gap-3">
              {past.map((b) => {
                const tr = tours.find((x) => x.id === b.tourId)!;
                return (
                  <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                    <img src={tr.hero} alt="" className="h-16 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-medium">{tr.title}</div>
                      <div className="text-xs text-muted-foreground">{b.startDate} · ${b.total}</div>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize">{b.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {savedTours.length === 0 ? <EmptyState text="No saved tours yet." /> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {savedTours.map((tr) => <TourCard key={tr.id} tour={tr} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6 max-w-xl">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <img src={user?.avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              <div>
                <div className="font-display text-lg font-semibold">{user?.name}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+996 …" /></div>
            </div>
            <Button onClick={saveProfile} className="bg-brand text-brand-foreground hover:bg-brand/90">{t("dashboard.saveProfile")}</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-3xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">{text}</div>
);

export default Dashboard;
