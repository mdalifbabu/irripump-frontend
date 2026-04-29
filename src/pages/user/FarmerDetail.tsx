import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { farmerApi, landApi, paymentApi } from "@/lib/api/client";
import type { Farmer, Land, Payment } from "@/lib/api/types";
import { CreditCard, Map, Phone, Mail, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

const FarmerDetail = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Farmer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && isAuthenticated && farmerId) fetchData();
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, l, p] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        landApi.getByFarmer(parseInt(farmerId!)),
        paymentApi.getByFarmer(parseInt(farmerId!)),
      ]);
      setFarmer(f); setLands(l); setPayments(p);
    } catch { toast({ title: "Error", description: "Failed to fetch farmer", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await farmerApi.update(editing.id, {
        nameBengali: editing.nameBengali,
        nameEnglish: editing.nameEnglish,
        fatherName: editing.fatherName,
        village: editing.village,
        mobile: editing.mobile,
        email: editing.email,
        whatsapp: editing.whatsapp,
        nidNumber: editing.nidNumber,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null); fetchData();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!farmer) return;
    setBusy(true);
    try {
      await farmerApi.delete(farmer.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      navigate("/user/farmers");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const totalLand = lands.reduce((s, l) => s + l.sizeBigha, 0);
  const totalPay = payments.reduce((s, p) => p.paymentType === "REFUND" ? s - p.amount : s + p.amount, 0);

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  if (!farmer) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Farmer not found</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title={farmer.nameBengali}
        subtitle={`${farmer.farmerCode} • ${farmer.village || ""}`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" variant="outline" onClick={() => setEditing({ ...farmer })}><Pencil className="w-4 h-4 mr-1" />সম্পাদনা</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 className="w-4 h-4 mr-1" />মুছুন</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট জমি</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{totalLand.toFixed(2)} বিঘা</div><p className="text-sm text-muted-foreground">{lands.length} plots</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">মোট পেমেন্ট</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">৳{totalPay.toLocaleString()}</div><p className="text-sm text-muted-foreground">{payments.length} txns</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">কৃষক কোড</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold font-mono">{farmer.farmerCode}</div><Badge variant="outline" className="mt-1">Active</Badge></CardContent></Card>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/user/farmers/${farmerId}/lands`)}><Map className="w-4 h-4 mr-2" />জমি পরিচালনা</Button>
          <Button onClick={() => navigate(`/user/farmers/${farmerId}/payments`)}><CreditCard className="w-4 h-4 mr-2" />পেমেন্ট পরিচালনা</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>কৃষক বিবরণ</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div><Label className="text-muted-foreground">নাম (বাংলা)</Label><p className="text-lg font-medium">{farmer.nameBengali}</p></div>
                <div><Label className="text-muted-foreground">নাম (English)</Label><p className="text-lg">{farmer.nameEnglish}</p></div>
                <div><Label className="text-muted-foreground">পিতার নাম</Label><p className="text-lg">{farmer.fatherName}</p></div>
                <div><Label className="text-muted-foreground">NID</Label><p className="text-lg font-mono">{farmer.nidNumber}</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">গ্রাম</Label><p className="text-lg">{farmer.village}</p></div></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">মোবাইল</Label><p className="text-lg">{farmer.mobile}</p></div></div>
                {farmer.whatsapp && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" /><div><Label className="text-muted-foreground">WhatsApp</Label><p className="text-lg">{farmer.whatsapp}</p></div></div>}
                {farmer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">Email</Label><p className="text-lg">{farmer.email}</p></div></div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>কৃষক সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>নাম (বাংলা)</Label><Input value={editing.nameBengali} onChange={(e) => setEditing({ ...editing, nameBengali: e.target.value })} /></div>
              <div><Label>নাম (English)</Label><Input value={editing.nameEnglish} onChange={(e) => setEditing({ ...editing, nameEnglish: e.target.value })} /></div>
              <div><Label>পিতার নাম</Label><Input value={editing.fatherName} onChange={(e) => setEditing({ ...editing, fatherName: e.target.value })} /></div>
              <div><Label>গ্রাম</Label><Input value={editing.village} onChange={(e) => setEditing({ ...editing, village: e.target.value })} /></div>
              <div><Label>মোবাইল</Label><Input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={editing.whatsapp || ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>NID</Label><Input value={editing.nidNumber} onChange={(e) => setEditing({ ...editing, nidNumber: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কৃষক মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{farmer.nameBengali}" এবং সংশ্লিষ্ট সব ডাটা মুছে যাবে।</AlertDialogDescription>
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

export default FarmerDetail;