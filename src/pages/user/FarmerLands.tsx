import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, landApi, assignmentApi, seasonApi } from "@/lib/api/client";
import type { Farmer, Land, FarmerLandAssignment, Season } from "@/lib/api/types";
import { Plus, Loader2, Trash2, Search, MapPin } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "মৌসুম", path: "/user/seasons" },
  { label: "জমি", path: "/user/lands" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

const FarmerLands = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [assignments, setAssignments] = useState<FarmerLandAssignment[]>([]);
  const [availableLands, setAvailableLands] = useState<Land[]>([]);
  const [allLands, setAllLands] = useState<Land[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateLand, setShowCreateLand] = useState(false);
  const [landSearch, setLandSearch] = useState("");
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [removing, setRemoving] = useState<FarmerLandAssignment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newLand, setNewLand] = useState({ landIdentificationNumber: "", landmarkNumber: "", sizeBigha: undefined as number | undefined, sizeShatak: undefined as number | undefined, description: "", tag: "" });
  const [tagPromptLand, setTagPromptLand] = useState<Land | null>(null);
  const [tagPromptValue, setTagPromptValue] = useState("");
  const [tagBusy, setTagBusy] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && isAuthenticated && farmerId) fetchData();
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  useEffect(() => {
    if (farmerId && pumpId && season && year) fetchData();
  }, [pumpId, season, year]);

  const resolveSeasonId = useCallback(async (): Promise<number | null> => {
    try {
      const ss = await seasonApi.getByYear(year);
      const found = ss.find(s => s.seasonName.toUpperCase() === season.toUpperCase());
      if (found) return found.id;
      // fallback: current season
      const current = await seasonApi.getCurrent().catch(() => null);
      return current?.id ?? null;
    } catch { return null; }
  }, [season, year]);

  const fetchData = async () => {
    if (!pumpId || !farmerId) return;
    setLoading(true);
    try {
      const [f, ss, lands] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        seasonApi.getByYear(year),
        landApi.getByPump(pumpId),
      ]);
      setFarmer(f);
      setSeasons(ss);
      setAllLands(lands);

      const seasonId = ss.find(s => s.seasonName.toUpperCase() === season.toUpperCase())?.id
        ?? (await seasonApi.getCurrent().catch(() => null))?.id;

      if (seasonId) {
        const asgn = await assignmentApi.getByFarmer(parseInt(farmerId!), pumpId, seasonId, year);
        setAssignments(asgn);
        const assignedLandIds = new Set(asgn.map(a => a.landId));
        setAvailableLands(lands.filter(l => !assignedLandIds.has(l.id) && l.isActive !== false));
      } else {
        setAssignments([]);
        setAvailableLands(lands.filter(l => l.isActive !== false));
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredAvailable = availableLands.filter(l =>
    !landSearch.trim() ||
    l.landIdentificationNumber.toLowerCase().includes(landSearch.toLowerCase()) ||
    l.landmarkNumber.toLowerCase().includes(landSearch.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedLand || !farmerId || !pumpId) return;
    setSubmitting(true);
    try {
      const seasonId = await resolveSeasonId();
      if (!seasonId) {
        toast({ title: "মৌসুম পাওয়া যায়নি", description: `${season} ${year} মৌসুম সিস্টেমে নেই।`, variant: "destructive" });
        return;
      }
      await assignmentApi.assign({
        farmerId: parseInt(farmerId!),
        landId: selectedLand.id,
        seasonId,
        year,
      });
      toast({ title: "জমি যুক্ত হয়েছে" });
      const justAssigned = selectedLand;
      setShowAddDialog(false);
      setSelectedLand(null);
      setLandSearch("");
      fetchData();
      setTagPromptLand(justAssigned);
      setTagPromptValue(justAssigned.tag ?? "");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagUpdate = async () => {
    if (!tagPromptLand) return;
    setTagBusy(true);
    try {
      await landApi.update(tagPromptLand.id, { tag: tagPromptValue });
      toast({ title: "ট্যাগ আপডেট হয়েছে" });
      setTagPromptLand(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setTagBusy(false);
    }
  };

  const handleCreateLand = async () => {
    if (!pumpId || !farmerId) return;
    if (!newLand.landIdentificationNumber || !newLand.landmarkNumber) {
      toast({ title: "জমি ID ও দাগ নম্বর প্রয়োজন", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const seasonId = await resolveSeasonId();
      if (!seasonId) {
        toast({ title: "মৌসুম পাওয়া যায়নি", description: `${season} ${year} মৌসুম সিস্টেমে নেই।`, variant: "destructive" });
        return;
      }
      const createdLand = await landApi.create({
        pumpId,
        landIdentificationNumber: newLand.landIdentificationNumber,
        landmarkNumber: newLand.landmarkNumber,
        sizeBigha: newLand.sizeBigha,
        sizeShatak: newLand.sizeShatak,
        description: newLand.description || undefined,
        tag: newLand.tag || undefined,
      });
      await assignmentApi.assign({ farmerId: parseInt(farmerId!), landId: createdLand.id, seasonId, year });
      toast({ title: "জমি তৈরি ও যুক্ত হয়েছে" });
      setShowCreateLand(false);
      setNewLand({ landIdentificationNumber: "", landmarkNumber: "", sizeBigha: undefined as number | undefined, sizeShatak: undefined as number | undefined, description: "", tag: "" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    setBusy(true);
    try {
      await assignmentApi.remove(removing.id);
      toast({ title: "জমি সরানো হয়েছে" });
      setRemoving(null);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const totalShatakAll = assignments.reduce((s, a) => {
    const lb = a.assignedSizeBigha ?? a.landSizeBigha ?? 0;
    const ls = a.assignedSizeShatak ?? a.landSizeShatak ?? 0;
    return s + lb * 33 + ls;
  }, 0);
  const totalBigha = totalShatakAll / 33;

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title={`${farmer?.nameBengali || "কৃষক"} — জমি`}
        subtitle={`${farmer?.farmerCode || ""} • ${season}/${year}`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />বিদ্যমান জমি
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateLand(true)}>
              <Plus className="w-4 h-4 mr-1" />নতুন জমি
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">মৌসুম</p><p className="text-xl font-bold">{season}/{year}</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">মোট জমি</p><p className="text-xl font-bold">{totalShatakAll.toFixed(1)} শতক</p><p className="text-xs text-muted-foreground">{totalBigha.toFixed(3)} বিঘা</p></CardContent></Card>
          <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">জমির সংখ্যা</p><p className="text-xl font-bold">{assignments.length} পিস</p></CardContent></Card>
        </div>

        {/* Current assignments */}
        <Card>
          <CardHeader>
            <CardTitle>বরাদ্দকৃত জমি — {season} {year} ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">এই মৌসুমে কোনো জমি বরাদ্দ নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>জমি ID</TableHead>
                      <TableHead>দাগ নম্বর</TableHead>
                      <TableHead>বিঘা</TableHead>
                      <TableHead>শতক</TableHead>
                      <TableHead>মোট শতক</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => {
                      const lb = a.assignedSizeBigha ?? a.landSizeBigha ?? 0;
                      const ls = a.assignedSizeShatak ?? a.landSizeShatak ?? 0;
                      const rowShatak = lb * 33 + ls;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-mono font-medium">{a.landIdentificationNumber}</TableCell>
                          <TableCell>{a.landmarkNumber}</TableCell>
                          <TableCell>{lb.toFixed(2)}</TableCell>
                          <TableCell>{ls.toFixed(2)}</TableCell>
                          <TableCell><span className="font-bold text-primary">{rowShatak.toFixed(1)} শতক</span><br /><span className="text-xs text-muted-foreground">{(rowShatak / 33).toFixed(3)} বিঘা</span></TableCell>
                          <TableCell>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setRemoving(a)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={4} className="text-right">মোট জমি:</TableCell>
                      <TableCell><span className="text-primary font-bold">{totalShatakAll.toFixed(1)} শতক</span><br /><span className="text-xs text-muted-foreground">{totalBigha.toFixed(3)} বিঘা</span></TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Select existing land dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { if (!o) { setShowAddDialog(false); setSelectedLand(null); setLandSearch(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>বিদ্যমান জমি বরাদ্দ করুন — {season} {year}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="জমি ID বা দাগ নম্বর দিয়ে খুঁজুন..."
                value={landSearch}
                onChange={(e) => setLandSearch(e.target.value)}
              />
            </div>
            <div className="border rounded-md max-h-64 overflow-y-auto">
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">
                  {availableLands.length === 0 ? "এই মৌসুমে সব জমি বরাদ্দ হয়েছে।" : "কোনো ফলাফল নেই।"}
                </p>
              ) : filteredAvailable.map(l => (
                <div
                  key={l.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted border-b last:border-0 transition-colors ${selectedLand?.id === l.id ? "bg-primary/10 border-primary" : ""}`}
                  onClick={() => setSelectedLand(l)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-mono font-medium">{l.landIdentificationNumber}</p>
                      <p className="text-sm text-muted-foreground">দাগ: {l.landmarkNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{(l.sizeBigha * 33 + l.sizeShatak).toFixed(1)} শতক</Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">{(l.sizeBigha + l.sizeShatak / 33).toFixed(3)} বিঘা</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedLand && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                <p className="text-sm font-medium">নির্বাচিত: <span className="font-mono">{selectedLand.landIdentificationNumber}</span></p>
                <p className="text-sm text-muted-foreground">
                  মোট: {(selectedLand.sizeBigha * 33 + selectedLand.sizeShatak).toFixed(1)} শতক ({(selectedLand.sizeBigha + selectedLand.sizeShatak / 33).toFixed(3)} বিঘা)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setSelectedLand(null); }}>বাতিল</Button>
            <Button onClick={handleAssign} disabled={!selectedLand || submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              বরাদ্দ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create new land dialog */}
      <Dialog open={showCreateLand} onOpenChange={setShowCreateLand}>
        <DialogContent>
          <DialogHeader><DialogTitle>নতুন জমি তৈরি ও বরাদ্দ — {season} {year}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <Label>জমি ID *</Label>
              <Input value={newLand.landIdentificationNumber} onChange={(e) => setNewLand({ ...newLand, landIdentificationNumber: e.target.value })} placeholder="যেমন: L-2025-001" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label>দাগ নম্বর *</Label>
              <Input value={newLand.landmarkNumber} onChange={(e) => setNewLand({ ...newLand, landmarkNumber: e.target.value })} placeholder="দাগ/খতিয়ান নম্বর" />
            </div>
            <div>
              <Label>বিঘা</Label>
              <Input type="number" step="0.01" min="0" value={newLand.sizeBigha ?? ""} onChange={(e) => setNewLand({ ...newLand, sizeBigha: e.target.value === "" ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>শতক</Label>
              <Input type="number" step="0.01" min="0" value={newLand.sizeShatak ?? ""} onChange={(e) => setNewLand({ ...newLand, sizeShatak: e.target.value === "" ? undefined : parseFloat(e.target.value) })} />
            </div>
            {((newLand.sizeBigha ?? 0) > 0 || (newLand.sizeShatak ?? 0) > 0) && (
              <div className="col-span-2 rounded-md bg-muted p-2 text-sm">
                মোট = {newLand.sizeBigha ?? 0} + ({newLand.sizeShatak ?? 0}/33) = <strong>{((newLand.sizeBigha ?? 0) + (newLand.sizeShatak ?? 0) / 33).toFixed(3)} বিঘা</strong>
              </div>
            )}
            <div className="col-span-2">
              <Label>বিবরণ (ঐচ্ছিক)</Label>
              <Input value={newLand.description} onChange={(e) => setNewLand({ ...newLand, description: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>ট্যাগ / ফ্ল্যাগ (ঐচ্ছিক)</Label>
              <Input value={newLand.tag} onChange={(e) => setNewLand({ ...newLand, tag: e.target.value })} placeholder="অনুসন্ধানযোগ্য লেবেল" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLand(false)}>বাতিল</Button>
            <Button onClick={handleCreateLand} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              তৈরি ও বরাদ্দ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>জমি বরাদ্দ বাতিল করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              জমি <strong>{removing?.landIdentificationNumber}</strong> এই মৌসুমের জন্য সরানো হবে।
              জমির রেকর্ড মুছবে না, শুধু বরাদ্দ বাতিল হবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={busy} className="bg-destructive text-destructive-foreground">
              সরান
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tag update prompt — shown after a land is singly assigned */}
      <Dialog open={!!tagPromptLand} onOpenChange={(o) => { if (!o) setTagPromptLand(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ট্যাগ আপডেট করবেন?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            জমি <strong>{tagPromptLand?.landIdentificationNumber}</strong> এই কৃষকের সাথে বরাদ্দ হয়েছে।
            একটি অনুসন্ধানযোগ্য ট্যাগ যোগ করতে পারেন।
          </p>
          <div>
            <Label>ট্যাগ</Label>
            <Input value={tagPromptValue} onChange={(e) => setTagPromptValue(e.target.value)} placeholder="যেমন: উত্তর মাঠ, সেচ এলাকা ক" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagPromptLand(null)}>এড়িয়ে যান</Button>
            <Button onClick={handleTagUpdate} disabled={tagBusy || !tagPromptValue.trim()}>
              {tagBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}ট্যাগ সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmerLands;
