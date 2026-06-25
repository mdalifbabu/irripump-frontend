import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { seasonApi, enrollmentApi } from "@/lib/api/client";
import type { Season, CreateSeasonRequest } from "@/lib/api/types";
import { Plus, Star, Trash2, RefreshCw, CalendarDays, Loader2, Shuffle } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import { userNavItems } from "@/lib/navItems";



const emptyForm: CreateSeasonRequest = {
  pumpId: 0, seasonName: "", seasonNameBengali: "",
  description: "", startDate: "", endDate: "", year: new Date().getFullYear(),
  isActive: true, isCurrent: false,
};

export default function SeasonList() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateSeasonRequest>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Season | null>(null);
  const [busy, setBusy] = useState(false);

  // Magic Button state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTarget, setTransferTarget] = useState<Season | null>(null);
  const [transferSourceId, setTransferSourceId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);
  const [allYearsSeasons, setAllYearsSeasons] = useState<Season[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId, year, seasons: contextSeasons, refreshSeasons } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (pumpId && year) fetchSeasons();
  }, [pumpId, year]);

  const fetchSeasons = async () => {
    if (!pumpId || !year) return;
    setLoading(true);
    try {
      const data = await seasonApi.getByPumpAndYear(pumpId, year);
      setSeasons(data);
    } catch {
      toast({ title: "Error", description: "মৌসুম লোড করা যায়নি", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openForm = () => {
    setForm({ ...emptyForm, pumpId: pumpId ?? 0, year });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.seasonName || !form.seasonNameBengali || !form.startDate || !form.endDate) {
      toast({ title: "Error", description: "সব প্রয়োজনীয় তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await seasonApi.create({ ...form, pumpId: pumpId! });
      toast({ title: "সফল", description: "মৌসুম তৈরি হয়েছে" });
      setShowForm(false);
      fetchSeasons();
      refreshSeasons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (season: Season) => {
    try {
      await seasonApi.setCurrent(season.id);
      toast({ title: "সফল", description: `"${season.seasonNameBengali}" বর্তমান মৌসুম সেট হয়েছে` });
      fetchSeasons();
      refreshSeasons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await seasonApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchSeasons();
      refreshSeasons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const openTransfer = async (targetSeason: Season) => {
    setTransferTarget(targetSeason);
    setTransferSourceId("");
    setAllYearsSeasons([]);
    setShowTransfer(true);
    try {
      const all = await seasonApi.getByPump(pumpId!);
      const prevYear = targetSeason.year - 1;
      setAllYearsSeasons(
        all
          .filter(s => s.id !== targetSeason.id && (s.year === targetSeason.year || s.year === prevYear))
          .sort((a, b) => b.year - a.year || a.seasonName.localeCompare(b.seasonName))
      );
    } catch {
      toast({ title: "Error", description: "মৌসুম তালিকা আনতে ব্যর্থ", variant: "destructive" });
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget || !transferSourceId) return;
    setTransferring(true);
    try {
      const result = await enrollmentApi.transferFrom(transferTarget.id, Number(transferSourceId));
      toast({
        title: "স্থানান্তর সম্পন্ন",
        description: `${result.transferredFarmers}জন কৃষক ও তাদের জমি "${transferTarget.seasonNameBengali}"-এ স্থানান্তরিত হয়েছে।`,
      });
      setShowTransfer(false);
      fetchSeasons();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTransferring(false);
    }
  };

  const prevYear = transferTarget ? transferTarget.year - 1 : null;
  const sameYearSources = allYearsSeasons.filter(s => transferTarget && s.year === transferTarget.year);
  const prevYearSources = allYearsSeasons.filter(s => transferTarget && s.year === prevYear);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="মৌসুম ব্যবস্থাপনা"
        subtitle="Season Management"
        navItems={userNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{year} সালে {seasons.length}টি মৌসুম</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSeasons}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />রিফ্রেশ
            </Button>
            <Button size="sm" onClick={openForm} disabled={!pumpId}>
              <Plus className="w-4 h-4 mr-1" />নতুন মৌসুম
            </Button>
          </div>
        </div>

        {!pumpId ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">একটি পাম্প নির্বাচন করুন</CardContent></Card>
        ) : loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : seasons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">{year} সালে কোনো মৌসুম নেই।</p>
              <Button className="mt-4" onClick={openForm}><Plus className="w-4 h-4 mr-1" />প্রথম মৌসুম তৈরি করুন</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {seasons.map((s) => (
              <Card key={s.id} className={s.isCurrent ? "border-primary ring-1 ring-primary" : ""}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {s.seasonNameBengali}
                      {s.isCurrent && <Badge className="text-xs">বর্তমান</Badge>}
                      {!s.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">নিষ্ক্রিয়</Badge>}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{s.seasonName} · {s.year}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>শুরু: {s.startDate}</p>
                    <p>শেষ: {s.endDate}</p>
                    {s.description && <p className="italic">{s.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!s.isCurrent && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSetCurrent(s)}>
                        <Star className="w-3.5 h-3.5 mr-1" />বর্তমান করুন
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openTransfer(s)}>
                      <Shuffle className="w-3.5 h-3.5 mr-1" />স্থানান্তর
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(s)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Season Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>নতুন মৌসুম তৈরি করুন</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>মৌসুমের নাম (ইংরেজি) *</Label>
                <Input placeholder="যেমন: Boro" value={form.seasonName} onChange={(e) => setForm({ ...form, seasonName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>মৌসুমের নাম (বাংলা) *</Label>
                <Input placeholder="যেমন: বোরো" value={form.seasonNameBengali} onChange={(e) => setForm({ ...form, seasonNameBengali: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>শুরুর তারিখ *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>শেষের তারিখ *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>বছর *</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })} />
            </div>
            <div className="space-y-1">
              <Label>বিবরণ</Label>
              <Input placeholder="ঐচ্ছিক বিবরণ" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <span className="text-sm">সক্রিয়</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-primary" checked={form.isCurrent ?? false} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
                <span className="text-sm">বর্তমান মৌসুম</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />সংরক্ষণ হচ্ছে...</> : "সংরক্ষণ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Magic Button — Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={(o) => { if (!o) setShowTransfer(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shuffle className="w-4 h-4" />কৃষক স্থানান্তর
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {transferTarget?.year} বা {prevYear} সালের একটি মৌসুম থেকে সকল কৃষক ও তাদের জমি বরাদ্দ{" "}
              <strong>"{transferTarget?.seasonNameBengali}"</strong>-এ কপি করুন।
              পেমেন্ট, বকেয়া বা হিসাব কপি হবে না — নতুন মৌসুম পরিষ্কার থাকবে।
            </p>
            <div className="space-y-1">
              <Label>উৎস মৌসুম *</Label>
              <Select value={transferSourceId} onValueChange={setTransferSourceId}>
                <SelectTrigger><SelectValue placeholder="উৎস মৌসুম নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {allYearsSeasons.length === 0 && (
                    <SelectItem value="__none" disabled>কোনো মৌসুম পাওয়া যায়নি</SelectItem>
                  )}
                  {sameYearSources.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{transferTarget?.year} সাল (একই বছর)</SelectLabel>
                      {sameYearSources.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.seasonNameBengali}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {prevYearSources.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{prevYear} সাল (আগের বছর)</SelectLabel>
                      {prevYearSources.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.seasonNameBengali}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>বাতিল</Button>
            <Button onClick={handleTransfer} disabled={transferring || !transferSourceId}>
              {transferring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />স্থানান্তর হচ্ছে...</> : "স্থানান্তর করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>মৌসুম মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.seasonNameBengali}" মৌসুম মুছে যাবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">
              মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
