import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { adminApi } from "@/lib/api/client";
import type { Farmer } from "@/lib/api/types";
import { Search, RefreshCw } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "জমি", path: "/admin/lands" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminFarmerList = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => { fetchFarmers(); }, [pumpId]);

  const fetchFarmers = async () => {
    setLoading(true);
    try { setFarmers(await adminApi.getAllFarmers(pumpId || undefined)); }
    catch { toast({ title: "Error", description: "Failed to fetch farmers", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    setLoading(true);
    try { setFarmers(await adminApi.getAllFarmers(pumpId || undefined, searchQuery.trim() || undefined)); }
    catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="সকল কৃষক" subtitle="All Farmers (Admin)" navItems={adminNavItems} rightContent={<div className="flex gap-2 items-center"><PumpSelector /><Button size="sm" variant="outline" onClick={fetchFarmers}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button></div>} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input placeholder="নাম, মোবাইল বা কোড দিয়ে খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
              <Button variant="outline" size="icon" onClick={handleSearch}><Search className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={fetchFarmers}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>কৃষক তালিকা ({farmers.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : farmers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">কোনো কৃষক পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>কোড</TableHead>
                      <TableHead>নাম (বাংলা)</TableHead>
                      <TableHead className="hidden md:table-cell">গ্রাম</TableHead>
                      <TableHead className="hidden lg:table-cell">পাম্প</TableHead>
                      <TableHead>মোবাইল</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmers.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono text-sm">{f.farmerCode}</TableCell>
                        <TableCell className="font-medium">{f.nameBengali}</TableCell>
                        <TableCell className="hidden md:table-cell">{f.village}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{f.pumpName || `#${f.pumpId}`}</TableCell>
                        <TableCell>{f.mobile}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${f.id}`)}>বিস্তারিত</Button>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/farmers/${f.id}/ledger`)}>লেজার</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminFarmerList;