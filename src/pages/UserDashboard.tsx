import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Users, DollarSign, LogOut, Settings } from "lucide-react";

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pumps: 0,
    farmers: 0,
    totalIncome: 0,
    totalDue: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
    fetchStats();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "user");

    if (!roles || roles.length === 0) {
      toast({
        title: "Access Denied",
        description: "You don't have user access",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned pumps
      const { data: assignments } = await supabase
        .from("user_pump_assignments")
        .select("pump_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      const pumpIds = assignments?.map(a => a.pump_id) || [];

      // Get farmers count
      const { count: farmersCount } = await supabase
        .from("farmers")
        .select("id", { count: "exact", head: true })
        .in("pump_id", pumpIds);

      // Get payments
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .in("pump_id", pumpIds);

      const totalIncome = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        pumps: pumpIds.length,
        farmers: farmersCount || 0,
        totalIncome,
        totalDue: 0, // Calculate based on lands and prices
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">User Dashboard</h1>
              <p className="text-sm text-muted-foreground">Pump Operator Panel</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">My Pumps</CardTitle>
              <Droplet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.pumps}</div>
              <p className="text-xs text-muted-foreground mt-1">Assigned pumps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Farmers</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.farmers}</div>
              <p className="text-xs text-muted-foreground mt-1">Total farmers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৳{loading ? "..." : stats.totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Collected payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Due</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৳{loading ? "..." : stats.totalDue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding payments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/farmers")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Farmers
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/lands")}>
              <Droplet className="w-4 h-4 mr-2" />
              Manage Lands
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/payments")}>
              <DollarSign className="w-4 h-4 mr-2" />
              Track Payments
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/user/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings & Pricing
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;