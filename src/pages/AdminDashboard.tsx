import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, adminDashboardApi } from "@/lib/api/client";
import type { AdminDashboardGroupBy, AdminDashboardResponse } from "@/lib/api/types";
import { Droplet, Users, Plus, Building, Settings } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const GROUP_BY_LABEL: Record<AdminDashboardGroupBy, string> = {
  pump: "পাম্প",
  operator: "অপারেটর",
  year: "বছর",
  seasonType: "মৌসুম ধরন",
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPumps: 0, totalUsers: 0, totalFarmers: 0 });
  const [groupBy, setGroupBy] = useState<AdminDashboardGroupBy>("pump");
  const [yearFilter, setYearFilter] = useState("");
  const [aggregated, setAggregated] = useState<AdminDashboardResponse | null>(null);
  const [aggLoading, setAggLoading] = useState(false);
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
      const data = await adminApi.getStats();
      setStats(data);
    } catch { console.error("Error fetching admin stats"); }
    finally { setLoading(false); }
  };

  const fetchAggregated = async () => {
    setAggLoading(true);
    try {
      setAggregated(await adminDashboardApi.getAggregated(groupBy, yearFilter ? Number(yearFilter) : undefined));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setAggLoading(false); }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "ADMIN") fetchAggregated();
  }, [isLoading, isAuthenticated, user, groupBy]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="অ্যাডমিন ড্যাশবোর্ড" subtitle="আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প" navItems={adminNavItems} rightContent={<PumpSelector />} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">মোট পাম্প</CardTitle><Droplet className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{loading ? "..." : stats.totalPumps}</div><p className="text-xs text-muted-foreground mt-1">নিবন্ধিত পাম্প</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">মোট ব্যবহারকারী</CardTitle><Users className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{loading ? "..." : stats.totalUsers}</div><p className="text-xs text-muted-foreground mt-1">অপারেটর</p></CardContent></Card>
          <Card className="col-span-2 md:col-span-1"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">মোট কৃষক</CardTitle><Building className="w-4 h-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{loading ? "..." : stats.totalFarmers}</div><p className="text-xs text-muted-foreground mt-1">নিবন্ধিত কৃষক</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle>সমগ্র ব্যবস্থার রিপোর্ট</CardTitle>
              <div className="flex gap-2 items-center">
                <Select value={groupBy} onValueChange={(v: AdminDashboardGroupBy) => setGroupBy(v)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pump">পাম্প অনুসারে</SelectItem>
                    <SelectItem value="operator">অপারেটর অনুসারে</SelectItem>
                    <SelectItem value="year">বছর অনুসারে</SelectItem>
                    <SelectItem value="seasonType">মৌসুম ধরন অনুসারে</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="w-24" type="number" placeholder="বছর" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchAggregated()} />
                <Button size="sm" variant="outline" onClick={fetchAggregated} disabled={aggLoading}>খুঁজুন</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {aggLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : !aggregated || aggregated.rows.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">কোনো তথ্য পাওয়া যায়নি।</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{GROUP_BY_LABEL[groupBy]}</TableHead>
                        <TableHead>মোট দেনা</TableHead>
                        <TableHead>মোট আদায়</TableHead>
                        <TableHead>বকেয়া</TableHead>
                        {groupBy === "operator" && <TableHead>আদায়ের হার</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregated.rows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="font-medium">{row.label}</TableCell>
                          <TableCell>৳{row.totalBilled.toFixed(2)}</TableCell>
                          <TableCell className="text-green-700">৳{row.totalCollected.toFixed(2)}</TableCell>
                          <TableCell className={row.totalOutstanding > 0 ? "text-red-600" : ""}>৳{row.totalOutstanding.toFixed(2)}</TableCell>
                          {groupBy === "operator" && <TableCell>{row.collectionRate != null ? `${(row.collectionRate * 100).toFixed(1)}%` : "—"}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-muted-foreground mt-3">সিস্টেম-জুড়ে বকেয়া: <span className="font-semibold text-red-600">৳{aggregated.systemWideOutstanding.toFixed(2)}</span></p>
              </>
            )}
          </CardContent>
        </Card>

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
