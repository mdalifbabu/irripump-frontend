import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { pumpApi, userApi } from "@/lib/api/client";
import { Droplet, Users, Plus, Building, Settings } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pumps: 0, users: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) fetchStats();
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchStats = async () => {
    try {
      const [pumps, users] = await Promise.all([
        pumpApi.getAll(),
        userApi.getAll().catch(() => []),
      ]);
      setStats({ pumps: pumps.length, users: users.length });
    } catch { console.error("Error fetching stats"); }
    finally { setLoading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="অ্যাডমিন ড্যাশবোর্ড" subtitle="আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প" navItems={adminNavItems} rightContent={<PumpSelector />} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">মোট পাম্প</CardTitle><Droplet className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{loading ? "..." : stats.pumps}</div><p className="text-xs text-muted-foreground mt-1">Active pumps</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">মোট ব্যবহারকারী</CardTitle><Users className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{loading ? "..." : stats.users}</div><p className="text-xs text-muted-foreground mt-1">Registered operators</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>দ্রুত কার্যক্রম</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/pumps")}><Droplet className="w-4 h-4 mr-2" />পাম্প পরিচালনা</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/pumps/create")}><Plus className="w-4 h-4 mr-2" />নতুন পাম্প তৈরি</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/users")}><Users className="w-4 h-4 mr-2" />ব্যবহারকারী পরিচালনা</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/users/create")}><Plus className="w-4 h-4 mr-2" />নতুন ব্যবহারকারী</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/farmers")}><Building className="w-4 h-4 mr-2" />সকল কৃষক</Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/admin/settings")}><Settings className="w-4 h-4 mr-2" />সিস্টেম সেটিংস</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;