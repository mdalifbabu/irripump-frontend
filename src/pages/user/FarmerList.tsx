import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, paymentApi, landApi, unitPriceApi } from "@/lib/api/client";
import type { Farmer } from "@/lib/api/types";
import { Plus, Search, RefreshCw, Trash2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

interface FarmerWithDue extends Farmer { pendingAmount?: number; }

const FarmerList = () => {
  const [farmers, setFarmers] = useState<FarmerWithDue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Farmer | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => { if (pumpId) fetchFarmers(); }, [pumpId]);

  const fetchFarmers = async () => {
    if (!pumpId) return;
    setLoading(true);
    try {
      const data = await farmerApi.getByPump(pumpId);
      const withDue = await Promise.all(data.map(async (f) => {
        try {
          const [payments, lands] = await Promise.all([paymentApi.getByFarmer(f.id), landApi.getByFarmer(f.id)]);
          let prices: any[] = [];
          try { prices = await unitPriceApi.getByPump(pumpId); } catch {}
          const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
          const totalBigha = lands.reduce((s, l) => s + l.sizeBigha, 0);
          const price = prices[0]?.pricePerBigha ?? 0;
          return { ...f, pendingAmount: Math.max(0, totalBigha * price - totalPaid) };
        } catch { return { ...f, pendingAmount: undefined }; }
      }));
      setFarmers(withDue);
    } catch { toast({ title: "Error", description: "Failed to fetch farmers", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!pumpId || !searchQuery.trim()) { fetchFarmers(); return; }
    setLoading(true);
    try {
      const data = await farmerApi.search(pumpId, searchQuery);
      setFarmers(data.map((f) => ({ ...f, pendingAmount: undefined })));
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await farmerApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null); fetchFarmers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="কৃষক পরিচালনা"
        subtitle="Farmer Management"
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => navigate(`/user/farmers/create?pumpId=${pumpId}`)}><Plus className="w-4 h-4 mr-1" />কৃষক</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardContent className="pt-4">
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
              <>
                <div className="md:hidden space-y-3">
                  {farmers.map((f) => (
                    <Card key={f.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start" onClick={() => navigate(`/user/farmers/${f.id}`)}>
                          <div>
                            <p className="font-medium">{f.nameBengali}</p>
                            <p className="text-sm text-muted-foreground font-mono">{f.farmerCode}</p>
                            <p className="text-sm text-muted-foreground">{f.mobile}</p>
                          </div>
                          {f.pendingAmount !== undefined && (
                            <Badge variant={f.pendingAmount > 0 ? "destructive" : "default"}>
                              {f.pendingAmount > 0 ? `৳${f.pendingAmount.toFixed(0)} বকেয়া` : "পরিশোধিত"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/user/farmers/${f.id}/payments`); }}>পেমেন্ট</Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/user/farmers/${f.id}/lands`); }}>জমি</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleting(f); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>কোড</TableHead>
                        <TableHead>নাম</TableHead>
                        <TableHead>গ্রাম</TableHead>
                        <TableHead>মোবাইল</TableHead>
                        <TableHead>বকেয়া</TableHead>
                        <TableHead>অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmers.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-sm">{f.farmerCode}</TableCell>
                          <TableCell className="font-medium">{f.nameBengali}</TableCell>
                          <TableCell>{f.village}</TableCell>
                          <TableCell>{f.mobile}</TableCell>
                          <TableCell>
                            {f.pendingAmount !== undefined ? (
                              <Badge variant={f.pendingAmount > 0 ? "destructive" : "default"}>
                                {f.pendingAmount > 0 ? `৳${f.pendingAmount.toFixed(0)}` : "পরিশোধিত"}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${f.id}`)}>বিস্তারিত</Button>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${f.id}/payments`)}>পেমেন্ট</Button>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${f.id}/lands`)}>জমি</Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(f)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কৃষক মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.nameBengali}" এবং সংশ্লিষ্ট সব ডাটা (জমি, পেমেন্ট) মুছে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FarmerList;