import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi, pumpApi } from "@/lib/api/client";
import type { DashboardStats, Pump } from "@/lib/api/types";
import { Droplet, Users, DollarSign, LogOut, Map, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalFarmers: 0,
    totalLands: 0,
    totalSizeBigha: 0,
    totalIncome: 0,
    totalDue: 0,
    paymentsThisMonth: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && user?.role !== "USER") {
      toast({
        title: "Access Denied",
        description: "You don't have user access",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated) {
      fetchPumps();
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => {
    if (selectedPumpId) {
      fetchStats(selectedPumpId);
    }
  }, [selectedPumpId]);

  const fetchPumps = async () => {
    try {
      // For user, we'd ideally have an API to get assigned pumps
      // For now, we'll use the admin pumps API which may need adjustment
      const pumpsData = await pumpApi.getAll();
      setPumps(pumpsData);
      if (pumpsData.length > 0) {
        setSelectedPumpId(pumpsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching pumps:", error);
      toast({
        title: "Error",
        description: "Failed to load pumps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (pumpId: number) => {
    try {
      const statsData = await dashboardApi.getStats(pumpId);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Operator Dashboard / অপারেটর ড্যাশবোর্ড</h1>
              <p className="text-sm text-muted-foreground">Pump Operator Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {pumps.length > 0 && (
              <Select
                value={selectedPumpId?.toString()}
                onValueChange={(value) => setSelectedPumpId(Number(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Pump" />
                </SelectTrigger>
                <SelectContent>
                  {pumps.map((pump) => (
                    <SelectItem key={pump.id} value={pump.id.toString()}>
                      {pump.pumpNameBengali || pump.pumpNameEnglish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Farmers / কৃষক</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalFarmers}</div>
              <p className="text-xs text-muted-foreground mt-1">Total farmers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lands / জমি</CardTitle>
              <Map className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Number(stats.totalSizeBigha).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Total bigha</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income / মোট আয়</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">৳{Number(stats.totalIncome).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Collected payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Due / মোট বকেয়া</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">৳{Number(stats.totalDue).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding payments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions / দ্রুত কার্যক্রম</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/user/farmers")}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Farmers / কৃষক পরিচালনা
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/user/unit-prices")}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Unit Prices / ইউনিট মূল্য
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate("/user/farmers")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Track Payments / পেমেন্ট ট্র্যাকিং
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
