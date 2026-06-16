import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PumpProvider } from "@/contexts/PumpContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import FarmerPortal from "./pages/FarmerPortal";
import NotFound from "./pages/NotFound";

// Admin pages
import PumpList from "./pages/admin/PumpList";
import CreatePump from "./pages/admin/CreatePump";
import UserList from "./pages/admin/UserList";
import CreateUser from "./pages/admin/CreateUser";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFarmerList from "./pages/admin/AdminFarmerList";
import AdminLandList from "./pages/admin/AdminLandList";
import AdminUnitPriceList from "./pages/admin/AdminUnitPriceList";

// User pages
import FarmerList from "./pages/user/FarmerList";
import CreateFarmer from "./pages/user/CreateFarmer";
import FarmerDetail from "./pages/user/FarmerDetail";
import FarmerPayments from "./pages/user/FarmerPayments";
import FarmerLands from "./pages/user/FarmerLands";
import FarmerLedger from "./pages/user/FarmerLedger";
import LandList from "./pages/user/LandList";
import UnitPriceList from "./pages/user/UnitPriceList";
import SeasonList from "./pages/user/SeasonList";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PumpProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/pumps" element={<PumpList />} />
              <Route path="/admin/pumps/create" element={<CreatePump />} />
              <Route path="/admin/users" element={<UserList />} />
              <Route path="/admin/users/create" element={<CreateUser />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/farmers" element={<AdminFarmerList />} />
              <Route path="/admin/lands" element={<AdminLandList />} />
              <Route path="/admin/unit-prices" element={<AdminUnitPriceList />} />

              {/* User Routes */}
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/farmers" element={<FarmerList />} />
              <Route path="/user/farmers/create" element={<CreateFarmer />} />
              <Route path="/user/farmers/:farmerId" element={<FarmerDetail />} />
              <Route path="/user/farmers/:farmerId/payments" element={<FarmerPayments />} />
              <Route path="/user/farmers/:farmerId/lands" element={<FarmerLands />} />
              <Route path="/user/farmers/:farmerId/ledger" element={<FarmerLedger />} />
              <Route path="/user/lands" element={<LandList />} />
              <Route path="/user/unit-prices" element={<UnitPriceList />} />
              <Route path="/user/seasons" element={<SeasonList />} />

              {/* Farmer Portal */}
              <Route path="/farmer" element={<FarmerPortal />} />

              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </PumpProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;