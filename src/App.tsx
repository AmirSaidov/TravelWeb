import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import { AuthPage } from "./pages/Auth";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          </Route>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
