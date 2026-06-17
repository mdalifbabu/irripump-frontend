import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PumpProvider } from "@/contexts/PumpContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import SeasonTypeList from "./pages/admin/SeasonTypeList";
import AuditLogViewer from "./pages/admin/AuditLogViewer";
import AdminSeasonList from "./pages/admin/AdminSeasonList";
import AdminFarmerLedger from "./pages/admin/AdminFarmerLedger";

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
              <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/pumps" element={<ProtectedRoute role="ADMIN"><PumpList /></ProtectedRoute>} />
              <Route path="/admin/pumps/create" element={<ProtectedRoute role="ADMIN"><CreatePump /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><UserList /></ProtectedRoute>} />
              <Route path="/admin/users/create" element={<ProtectedRoute role="ADMIN"><CreateUser /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute role="ADMIN"><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/farmers" element={<ProtectedRoute role="ADMIN"><AdminFarmerList /></ProtectedRoute>} />
              <Route path="/admin/farmers/:farmerId/ledger" element={<ProtectedRoute role="ADMIN"><AdminFarmerLedger /></ProtectedRoute>} />
              <Route path="/admin/lands" element={<ProtectedRoute role="ADMIN"><AdminLandList /></ProtectedRoute>} />
              <Route path="/admin/unit-prices" element={<ProtectedRoute role="ADMIN"><AdminUnitPriceList /></ProtectedRoute>} />
              <Route path="/admin/season-types" element={<ProtectedRoute role="ADMIN"><SeasonTypeList /></ProtectedRoute>} />
              <Route path="/admin/seasons" element={<ProtectedRoute role="ADMIN"><AdminSeasonList /></ProtectedRoute>} />
              <Route path="/admin/audit-log" element={<ProtectedRoute role="ADMIN"><AuditLogViewer /></ProtectedRoute>} />

              {/* User Routes */}
              <Route path="/user/dashboard" element={<ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>} />
              <Route path="/user/farmers" element={<ProtectedRoute role="USER"><FarmerList /></ProtectedRoute>} />
              <Route path="/user/farmers/create" element={<ProtectedRoute role="USER"><CreateFarmer /></ProtectedRoute>} />
              <Route path="/user/farmers/:farmerId" element={<ProtectedRoute role="USER"><FarmerDetail /></ProtectedRoute>} />
              <Route path="/user/farmers/:farmerId/payments" element={<ProtectedRoute role="USER"><FarmerPayments /></ProtectedRoute>} />
              <Route path="/user/farmers/:farmerId/lands" element={<ProtectedRoute role="USER"><FarmerLands /></ProtectedRoute>} />
              <Route path="/user/farmers/:farmerId/ledger" element={<ProtectedRoute role="USER"><FarmerLedger /></ProtectedRoute>} />
              <Route path="/user/lands" element={<ProtectedRoute role="USER"><LandList /></ProtectedRoute>} />
              <Route path="/user/unit-prices" element={<ProtectedRoute role="USER"><UnitPriceList /></ProtectedRoute>} />
              <Route path="/user/seasons" element={<ProtectedRoute role="USER"><SeasonList /></ProtectedRoute>} />

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