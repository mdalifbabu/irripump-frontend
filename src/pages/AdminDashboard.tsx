import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { pumpApi } from "@/lib/api/client";
import { Droplet, Users, Settings, LogOut, Plus, Building } from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pumps: 0,
    users: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "You don't have admin access",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated) {
      fetchStats();
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchStats = async () => {
    try {
      const pumps = await pumpApi.getAll();
      setStats({
        pumps: pumps.length,
        users: 0, // Will be populated when user list API is available
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (isLoading) {
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
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pumps / মোট পাম্প</CardTitle>
              <Droplet className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.pumps}</div>
              <p className="text-xs text-muted-foreground mt-1">Active irrigation pumps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users / মোট ব্যবহারকারী</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : stats.users}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered pump operators</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions / দ্রুত কার্যক্রম</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/pumps")}>
              <Droplet className="w-4 h-4 mr-2" />
              Manage Pumps / পাম্প পরিচালনা
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/pumps/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Pump / নতুন পাম্প তৈরি
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/users")}>
              <Users className="w-4 h-4 mr-2" />
              Manage Users / ব্যবহারকারী পরিচালনা
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/users/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New User / নতুন ব্যবহারকারী
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/farmers")}>
              <Building className="w-4 h-4 mr-2" />
              View All Farmers / সকল কৃষক
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              System Settings / সিস্টেম সেটিংস
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
