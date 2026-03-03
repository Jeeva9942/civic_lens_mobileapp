import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TranslationProvider } from "./context/TranslationContext";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import MapPage from "./pages/MapPage";
import ProgressPage from "./pages/ProgressPage";
import ActivityPage from "./pages/ActivityPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import VisionPage from "./pages/VisionPage";
import NotFound from "./pages/NotFound";
import Chatbot from "./components/Chatbot";

const queryClient = new QueryClient();

const App = () => (
  <TranslationProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="max-w-lg mx-auto relative min-h-screen bg-background shadow-2xl shadow-black/10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/vision" element={<VisionPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
            <Chatbot />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </TranslationProvider>
);

export default App;
