import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import LogisticsDashboard from "./pages/LogisticsDashboard.tsx";
import Match from "./pages/Match.tsx";
import Admin from "./pages/Admin.tsx";
import Insights from "./pages/Insights.tsx";
import FoodMap from "./pages/FoodMap.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/logistics" element={<LogisticsDashboard />} />
            <Route path="/match" element={<Match />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/food-map" element={<FoodMap />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
