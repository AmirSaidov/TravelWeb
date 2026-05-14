import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteLayout } from "@/components/layout/SiteLayout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import TourDetail from "./pages/TourDetail";
import MapPage from "./pages/MapPage";
import Dashboard from "./pages/Dashboard";
import Experiences from "./pages/Experiences";
import RoutePage from "./pages/RoutePage";
import AIAssistantPage from "./pages/AIAssistantPage";
import { AuthPage } from "./pages/Auth";
import { AuthRoute } from "./pages/AuthRoute";
import NotFound from "./pages/NotFound.tsx";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Sitemap from "./pages/Sitemap";
import InfoPage from "./pages/InfoPage";

const queryClient = new QueryClient();

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
        </BrowserRouter>
      </TooltipProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
