import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SessionProvider } from "@/contexts/SessionContext";
import ProtectedRoute from "@/components/ProtectedRoute";
// TODO: Re-enable when Google Maps API is integrated
// import SystemPlacesInitializer from "@/components/SystemPlacesInitializer";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GuestDashboard from "./pages/GuestDashboard";
import SafePlaces from "./pages/SafePlaces";
import SafetyTips from "./pages/SafetyTips";
import TrustedContacts from "./pages/TrustedContacts";
import ShareLocation from "./pages/ShareLocation";
import SafetyCheck from "./pages/SafetyCheck";
import EmergencySOS from "./pages/EmergencySOS";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark">
        <Toaster />
        <Sonner />
        <AuthProvider>
          <SessionProvider>
            {/* TODO: Commented out until Google Maps API integration - will show real places instead of fallback ones */}
            {/* <SystemPlacesInitializer> */}
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/safe-places" element={<SafePlaces />} />
                <Route path="/safety-tips" element={<SafetyTips />} />
                <Route path="/contacts" element={<TrustedContacts />} />
                <Route path="/share-location" element={<ShareLocation />} />
                <Route path="/safety-check" element={<SafetyCheck />} />
                <Route path="/emergency-sos" element={<EmergencySOS />} />
                <Route path="/auth" element={<Index />} />
                <Route path="/guest" element={<GuestDashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            {/* </SystemPlacesInitializer> */}
          </SessionProvider>
        </AuthProvider>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
