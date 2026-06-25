import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { adminUnitPriceApi } from "@/lib/api/client";
import type { UnitPrice } from "@/lib/api/types";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "জমি", path: "/admin/lands" },
  { label: "ইউনিট মূল্য", path: "/admin/unit-prices" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminUnitPriceList = () => {
  const [prices, setPrices] = useState<UnitPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") { navigate("/auth"); }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => { if (pumpId) fetchPrices(); }, [pumpId]);

  const filtered = prices.filter((p) => (p.season ?? "").toUpperCase() === season && p.year === year);

  const fetchPrices = async () => {
    if (!pumpId) return;
    setLoading(true);
    try { setPrices(await adminUnitPriceApi.getByPump(pumpId)); }
    catch { toast({ title: "Error", description: "Failed to fetch unit prices", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="ইউনিট মূল্য (অ্যাডমিন)"
        subtitle="Unit Prices — read only"
        navItems={adminNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>ইউনিট মূল্য তালিকা — {season} / {year} ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">এই মৌসুম/বছরের জন্য কোনো মূল্য নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>মৌসুম</TableHead>
                      <TableHead>বছর</TableHead>
                      <TableHead>মূল্য / শতক</TableHead>
                      <TableHead>মূল্য / বিঘা (হিসাব)</TableHead>
                      <TableHead className="hidden md:table-cell">শুরু</TableHead>
                      <TableHead className="hidden md:table-cell">শেষ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><Badge variant="outline">{p.season}</Badge></TableCell>
                        <TableCell>{p.year}</TableCell>
                        <TableCell className="font-bold">৳{p.pricePerShatak.toLocaleString()}/শতক</TableCell>
                        <TableCell className="text-muted-foreground">৳{(p.pricePerShatak * 33).toLocaleString()}/বিঘা</TableCell>
                        <TableCell className="hidden md:table-cell">{p.effectiveFrom}</TableCell>
                        <TableCell className="hidden md:table-cell">{p.effectiveTo || "-"}</TableCell>
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

export default AdminUnitPriceList;
