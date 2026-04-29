import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { dashboardApi } from "@/lib/api/client";
import type { DashboardStats } from "@/lib/api/types";
import { Users, DollarSign, Map, CreditCard } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

const UserDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalFarmers: 0, totalLands: 0, totalSizeBigha: 0, totalIncome: 0, totalDue: 0, paymentsThisMonth: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, loadingPumps } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "USER") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => {
    if (!pumpId) return;
    dashboardApi.getStats(pumpId).then((data) => {
      setStats(data);
      console.log("Dashboard stats:", data);
    }).catch(() => {});
  }, [pumpId]);

  if (isLoading || loadingPumps) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="অপারেটর ড্যাশবোর্ড"
        subtitle="Pump Operator Panel"
        navItems={userNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs md:text-sm font-medium">কৃষক</CardTitle><Users className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl md:text-3xl font-bold">{stats.totalFarmers}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs md:text-sm font-medium">মোট জমি (বিঘা)</CardTitle><Map className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl md:text-3xl font-bold">{Number(stats.totalSizeBigha).toFixed(2)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs md:text-sm font-medium">মোট আয়</CardTitle><DollarSign className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl md:text-3xl font-bold text-green-600">৳{Number(stats.totalIncome).toFixed(0)}</div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs md:text-sm font-medium">মোট বকেয়া</CardTitle><DollarSign className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-xl md:text-3xl font-bold text-red-600">৳{Number(stats.totalDue).toFixed(0)}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>দ্রুত কার্যক্রম</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/farmers")}><Users className="w-4 h-4 mr-2" />কৃষক পরিচালনা</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/unit-prices")}><DollarSign className="w-4 h-4 mr-2" />ইউনিট মূল্য</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/farmers")}><CreditCard className="w-4 h-4 mr-2" />পেমেন্ট ট্র্যাকিং</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;