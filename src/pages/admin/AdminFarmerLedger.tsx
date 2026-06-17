import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ledgerApi, adminOverrideApi } from "@/lib/api/client";
import type { LedgerResponse, SeasonLedger, LedgerAllocation } from "@/lib/api/types";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet, Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
];

const AdminFarmerLedger = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<SeasonLedger | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [waive, setWaive] = useState(false);
  const [adjustReason, setAdjustReason] = useState("");
  const [reversing, setReversing] = useState<LedgerAllocation | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [removing, setRemoving] = useState<SeasonLedger | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchLedger = async () => {
    if (!farmerId) return;
    setLoading(true);
    try { setLedger(await ledgerApi.getLedger(Number(farmerId))); }
    catch { toast({ title: "Error", description: "Could not load ledger", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLedger(); }, [farmerId]);

  const handleAdjust = async () => {
    if (!adjusting || !adjustReason.trim()) return;
    setBusy(true);
    try {
      await adminOverrideApi.adjustDue(adjusting.dueId, {
        newAmount: waive ? undefined : (newAmount ? Number(newAmount) : undefined),
        waive,
        reason: adjustReason.trim(),
      });
      toast({ title: waive ? "মওকুফ করা হয়েছে" : "সমন্বয় করা হয়েছে" });
      setAdjusting(null); setNewAmount(""); setWaive(false); setAdjustReason("");
      await fetchLedger();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleReverse = async () => {
    if (!reversing || !reverseReason.trim()) return;
    setBusy(true);
    try {
      await adminOverrideApi.reversePayment(reversing.paymentId, { reason: reverseReason.trim() });
      toast({ title: "পেমেন্ট বাতিল করা হয়েছে" });
      setReversing(null); setReverseReason("");
      await fetchLedger();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleForceRemove = async () => {
    if (!removing || !removeReason.trim() || !farmerId) return;
    setBusy(true);
    try {
      await adminOverrideApi.forceRemoveFarmer(removing.seasonId, Number(farmerId), { reason: removeReason.trim() });
      toast({ title: "মৌসুম থেকে অপসারণ করা হয়েছে" });
      setRemoving(null); setRemoveReason("");
      await fetchLedger();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="কৃষক লেজার (এডমিন)"
        subtitle={ledger ? `${ledger.nameBengali} — ${ledger.farmerCode}` : ""}
        navItems={adminNavItems}
        rightContent={<Button variant="outline" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-1" />ফিরে যান</Button>}
      />

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
        {!ledger ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">কোনো লেজার পাওয়া যায়নি</CardContent></Card>
        ) : (
          <>
            {ledger.creditBalance > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="flex items-center gap-3 py-4">
                  <Wallet className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">অগ্রিম জমা (অনুবন্টিত)</p>
                    <p className="text-xl font-bold text-green-800">৳{ledger.creditBalance.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="মোট দেনা" value={ledger.seasons.reduce((s, r) => s + r.billed, 0)} icon={<TrendingUp className="w-4 h-4 text-orange-500" />} color="text-orange-700" />
              <SummaryCard label="মোট আদায়" value={ledger.seasons.reduce((s, r) => s + r.collected, 0)} icon={<TrendingDown className="w-4 h-4 text-green-500" />} color="text-green-700" />
              <SummaryCard label="বকেয়া" value={ledger.seasons.reduce((s, r) => s + r.outstanding, 0)} icon={<Wallet className="w-4 h-4 text-red-500" />} color="text-red-700" />
            </div>

            {ledger.seasons.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">এখনো কোনো দেনা তৈরি হয়নি</CardContent></Card>
            ) : (
              ledger.seasons.map((sl) => (
                <Card key={sl.dueId} className={sl.outstanding <= 0 ? "border-green-200" : "border-orange-200"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {sl.seasonName} — {sl.year}
                        {sl.seasonKind && <Badge variant="outline" className="text-xs">{sl.seasonKind}</Badge>}
                      </CardTitle>
                      <Badge variant={sl.outstanding <= 0 ? "default" : "destructive"}>
                        {sl.outstanding <= 0 ? "পরিশোধিত" : `৳${sl.outstanding.toFixed(0)} বকেয়া`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 text-sm gap-2">
                      <div><p className="text-muted-foreground">দেনা</p><p className="font-semibold">৳{sl.billed.toFixed(2)}</p></div>
                      <div><p className="text-muted-foreground">আদায়</p><p className="font-semibold text-green-700">৳{sl.collected.toFixed(2)}</p></div>
                      <div><p className="text-muted-foreground">বকেয়া</p><p className={`font-semibold ${sl.outstanding > 0 ? "text-red-600" : "text-green-700"}`}>৳{sl.outstanding.toFixed(2)}</p></div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setAdjusting(sl); setNewAmount(String(sl.billed)); setWaive(false); }}>
                        দেনা সমন্বয় / মওকুফ
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRemoving(sl)}>
                        মৌসুম থেকে জোরপূর্বক অপসারণ
                      </Button>
                    </div>

                    {sl.allocations.length > 0 && (
                      <div className="border-t pt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">পেমেন্ট বিস্তারিত</p>
                        {sl.allocations.map((a, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{a.paymentDate}</span>
                              <Badge variant="outline" className="text-xs">{a.paymentMethod}</Badge>
                              <span className="font-medium text-green-700">+৳{a.amountApplied.toFixed(2)}</span>
                            </div>
                            <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => setReversing(a)}>
                              বাতিল করুন
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}
      </main>

      {/* Adjust / waive due */}
      <Dialog open={!!adjusting} onOpenChange={(o) => !o && setAdjusting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>দেনা সমন্বয় / মওকুফ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={waive} onCheckedChange={(v) => setWaive(!!v)} id="waive" />
              <Label htmlFor="waive">সম্পূর্ণ মওকুফ করুন (বাকি বকেয়া শূন্য হবে)</Label>
            </div>
            {!waive && (
              <div><Label>নতুন দেনার পরিমাণ</Label><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} /></div>
            )}
            <div><Label>কারণ (বাধ্যতামূলক)</Label><Textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjusting(null)}>বাতিল</Button>
            <Button onClick={handleAdjust} disabled={busy || !adjustReason.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}নিশ্চিত করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reverse payment */}
      <Dialog open={!!reversing} onOpenChange={(o) => !o && setReversing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>পেমেন্ট বাতিল করুন</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">৳{reversing?.amountApplied.toFixed(2)} এই বরাদ্দ থেকে সরিয়ে কৃষকের জন্য পুনরায় উপলব্ধ করা হবে (FIFO পুনঃবরাদ্দ চলবে)।</p>
          <div><Label>কারণ (বাধ্যতামূলক)</Label><Textarea value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReversing(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleReverse} disabled={busy || !reverseReason.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}নিশ্চিত করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force remove from season */}
      <Dialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>মৌসুম থেকে জোরপূর্বক অপসারণ</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">বকেয়া থাকলেও কৃষককে "{removing?.seasonName}" ({removing?.year}) থেকে অপসারণ করা হবে। অপারেটররা এটি করতে পারে না।</p>
          <div><Label>কারণ (বাধ্যতামূলক)</Label><Textarea value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>বাতিল</Button>
            <Button variant="destructive" onClick={handleForceRemove} disabled={busy || !removeReason.trim()}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}নিশ্চিত করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`text-lg font-bold ${color}`}>৳{value.toFixed(0)}</p>
      </CardContent>
    </Card>
  );
}

export default AdminFarmerLedger;
