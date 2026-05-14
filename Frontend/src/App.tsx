import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const TourDetail = lazy(() => import("./pages/TourDetail"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Experiences = lazy(() => import("./pages/Experiences"));
const RoutePage = lazy(() => import("./pages/RoutePage"));
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const AuthPage = lazy(() => import("./pages/Auth").then((m) => ({ default: m.AuthPage })));
const AuthRoute = lazy(() => import("./pages/AuthRoute").then((m) => ({ default: m.AuthRoute })));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="container-page py-10">
    <div className="animate-pulse rounded-3xl border border-border bg-muted/40 p-8">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#ef4444",
          colorInfo: "#ef4444",
          colorSuccess: "#22c55e",
          borderRadius: 24,
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        },
      }}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/tour/:slug" element={<TourDetail />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/experiences" element={<Experiences />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/route" element={<RoutePage />} />
                <Route path="/ai" element={<AIAssistantPage />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/sitemap" element={<Sitemap />} />
                <Route path="/info/:topic" element={<InfoPage />} />
              </Route>
              <Route path="/login" element={<AuthRoute mode="login" />} />
              <Route path="/register" element={<AuthRoute mode="register" />} />
              <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
