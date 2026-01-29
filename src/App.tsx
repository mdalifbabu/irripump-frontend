import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

// User pages
import FarmerList from "./pages/user/FarmerList";
import CreateFarmer from "./pages/user/CreateFarmer";
import FarmerDetail from "./pages/user/FarmerDetail";
import FarmerPayments from "./pages/user/FarmerPayments";
import FarmerLands from "./pages/user/FarmerLands";
import UnitPriceList from "./pages/user/UnitPriceList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
            
            {/* User Routes */}
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/farmers" element={<FarmerList />} />
            <Route path="/user/farmers/create" element={<CreateFarmer />} />
            <Route path="/user/farmers/:farmerId" element={<FarmerDetail />} />
            <Route path="/user/farmers/:farmerId/payments" element={<FarmerPayments />} />
            <Route path="/user/farmers/:farmerId/lands" element={<FarmerLands />} />
            <Route path="/user/unit-prices" element={<UnitPriceList />} />
            
            {/* Farmer Portal */}
            <Route path="/farmer" element={<FarmerPortal />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
