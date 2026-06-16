import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { landApi, assignmentApi, farmerApi } from "@/lib/api/client";
import type { Land, FarmerLandAssignment, Farmer } from "@/lib/api/types";
import { Plus, Loader2, Pencil, Trash2, MapPin, Users, Link, Unlink } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "জমি", path: "/user/lands" },
  { label: "মৌসুম", path: "/user/seasons" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

const schema = z.object({
  landIdentificationNumber: z.string().min(1, "জমির পরিচয় নম্বর প্রয়োজন"),
  landmarkNumber: z.string().min(1, "দাগ/খতিয়ান নম্বর প্রয়োজন"),
  sizeBigha: z.number().min(0, "বিঘা ≥ 0"),
  sizeShatak: z.number().min(0, "শতক ≥ 0"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const LandList = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [assignments, setAssignments] = useState<FarmerLandAssignment[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Land | null>(null);
  const [deleting, setDeleting] = useState<Land | null>(null);
  const [busy, setBusy] = useState(false);
  const [assigningLand, setAssigningLand] = useState<Land | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [unassigning, setUnassigning] = useState<FarmerLandAssignment | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year, seasons } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { landIdentificationNumber: "", landmarkNumber: "", sizeBigha: 0, sizeShatak: 0, description: "" },
  });

  const currentSeasonId = seasons.find(s => s.seasonName === season && s.year === year)?.id ?? null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => { if (pumpId) { fetchLands(); fetchFarmers(); } }, [pumpId]);
  useEffect(() => { if (pumpId && currentSeasonId) fetchAssignments(); }, [pumpId, currentSeasonId, year]);

  const fetchLands = async () => {
    if (!pumpId) return;
    setLoading(true);
    try { setLands(await landApi.getByPump(pumpId)); }
    catch { toast({ title: "ত্রুটি", description: "জমির তালিকা আনতে ব্যর্থ", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchAssignments = async () => {
    if (!pumpId || !currentSeasonId) return;
    setAssignLoading(true);
    try { setAssignments(await assignmentApi.getAll(pumpId, currentSeasonId, year)); }
    catch { /* silent */ }
    finally { setAssignLoading(false); }
  };

  const fetchFarmers = async () => {
    if (!pumpId) return;
    try { setFarmers(await farmerApi.getByPump(pumpId)); }
    catch { /* silent */ }
  };

  const getAssignment = useCallback((landId: number) =>
    assignments.find(a => a.landId === landId) ?? null, [assignments]);

  const onSubmit = async (data: FormData) => {
    if (!pumpId) return;
    setSubmitting(true);
    try {
      await landApi.create({ ...data, pumpId });
      toast({ title: "সফল", description: "জমি তৈরি হয়েছে" });
      form.reset({ landIdentificationNumber: "", landmarkNumber: "", sizeBigha: 0, sizeShatak: 0, description: "" });
      setShowForm(false);
      fetchLands();
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await landApi.update(editing.id, {
        landIdentificationNumber: editing.landIdentificationNumber,
        landmarkNumber: editing.landmarkNumber,
        sizeBigha: editing.sizeBigha,
        sizeShatak: editing.sizeShatak,
        description: editing.description,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      fetchLands();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await landApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchLands();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleAssign = async () => {
    if (!assigningLand || !selectedFarmerId || !currentSeasonId) return;
    setBusy(true);
    try {
      await assignmentApi.assign({
        farmerId: parseInt(selectedFarmerId),
        landId: assigningLand.id,
        seasonId: currentSeasonId,
        year,
      });
      toast({ title: "সফল", description: "জমি বরাদ্দ হয়েছে" });
      setAssigningLand(null);
      setSelectedFarmerId("");
      fetchAssignments();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleUnassign = async () => {
    if (!unassigning) return;
    setBusy(true);
    try {
      await assignmentApi.remove(unassigning.id);
      toast({ title: "বরাদ্দ বাতিল হয়েছে" });
      setUnassigning(null);
      fetchAssignments();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="জমি ব্যবস্থাপনা"
        subtitle="Land Management"
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />নতুন জমি</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />নতুন জমি</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="landIdentificationNumber" render={({ field }) => (
                      <FormItem><FormLabel>জমির পরিচয় নম্বর</FormLabel><FormControl><Input placeholder="e.g., L-001" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="landmarkNumber" render={({ field }) => (
                      <FormItem><FormLabel>দাগ/খতিয়ান নম্বর</FormLabel><FormControl><Input placeholder="e.g., 123" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="sizeBigha" render={({ field }) => (
                      <FormItem><FormLabel>আকার (বিঘা)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sizeShatak" render={({ field }) => (
                      <FormItem><FormLabel>আকার (শতক)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>বিবরণ</FormLabel><FormControl><Input placeholder="ঐচ্ছিক বিবরণ" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
                    <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Assignment Status Table - by pump, season, year */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              জমির বরাদ্দ অবস্থা — {season} / {year}
              {!currentSeasonId && <Badge variant="secondary">মৌসুম নির্বাচন করুন</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || assignLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : lands.filter(l => l.isActive).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো জমি নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>পরিচয় নম্বর</TableHead>
                      <TableHead>দাগ/খতিয়ান</TableHead>
                      <TableHead>মোট শতক</TableHead>
                      <TableHead>বরাদ্দ অবস্থা</TableHead>
                      <TableHead>কৃষক</TableHead>
                      <TableHead>বরাদ্দ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.filter(l => l.isActive).map((land) => {
                      const totalShatak = (land.sizeBigha ?? 0) * 33 + (land.sizeShatak ?? 0);
                      const asgn = getAssignment(land.id);
                      return (
                        <TableRow key={land.id}>
                          <TableCell className="font-medium">{land.landIdentificationNumber}</TableCell>
                          <TableCell>{land.landmarkNumber}</TableCell>
                          <TableCell className="font-bold text-primary">{totalShatak.toFixed(0)} শতক</TableCell>
                          <TableCell>
                            <Badge variant={asgn ? "default" : "outline"}>
                              {asgn ? "বরাদ্দ" : "খালি"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {asgn ? (asgn.farmerName || `কৃষক #${asgn.farmerId}`) : "-"}
                          </TableCell>
                          <TableCell>
                            {currentSeasonId && (
                              asgn ? (
                                <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30" onClick={() => setUnassigning(asgn)}>
                                  <Unlink className="w-3 h-3 mr-1" />বাতিল
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="h-7" onClick={() => { setAssigningLand(land); setSelectedFarmerId(""); }}>
                                  <Link className="w-3 h-3 mr-1" />বরাদ্দ
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Lands CRUD Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              সকল জমির তালিকা ({lands.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : lands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো জমি নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>পরিচয় নম্বর</TableHead>
                      <TableHead>দাগ/খতিয়ান</TableHead>
                      <TableHead>বিঘা</TableHead>
                      <TableHead>শতক</TableHead>
                      <TableHead>মোট শতক</TableHead>
                      <TableHead>অবস্থা</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.map((land) => {
                      const totalShatak = (land.sizeBigha ?? 0) * 33 + (land.sizeShatak ?? 0);
                      return (
                        <TableRow key={land.id}>
                          <TableCell className="font-medium">{land.landIdentificationNumber}</TableCell>
                          <TableCell>{land.landmarkNumber}</TableCell>
                          <TableCell>{land.sizeBigha?.toFixed(2)}</TableCell>
                          <TableCell>{land.sizeShatak?.toFixed(2)}</TableCell>
                          <TableCell className="font-bold text-primary">{totalShatak.toFixed(0)} শতক</TableCell>
                          <TableCell>
                            <Badge variant={land.isActive ? "default" : "secondary"}>
                              {land.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...land })}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(land)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Land Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>জমি সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>পরিচয় নম্বর</Label><Input value={editing.landIdentificationNumber} onChange={(e) => setEditing({ ...editing, landIdentificationNumber: e.target.value })} /></div>
              <div><Label>দাগ/খতিয়ান নম্বর</Label><Input value={editing.landmarkNumber} onChange={(e) => setEditing({ ...editing, landmarkNumber: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>বিঘা</Label><Input type="number" step="0.01" value={editing.sizeBigha} onChange={(e) => setEditing({ ...editing, sizeBigha: parseFloat(e.target.value) || 0 })} /></div>
                <div><Label>শতক</Label><Input type="number" step="0.01" value={editing.sizeShatak} onChange={(e) => setEditing({ ...editing, sizeShatak: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div><Label>মোট শতক (গণনা)</Label><p className="text-sm font-bold text-primary">{((editing.sizeBigha ?? 0) * 33 + (editing.sizeShatak ?? 0)).toFixed(0)} শতক</p></div>
              <div><Label>বিবরণ</Label><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Land Dialog */}
      <Dialog open={!!assigningLand} onOpenChange={(o) => !o && setAssigningLand(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>জমি বরাদ্দ — {assigningLand?.landIdentificationNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>মৌসুম / বছর</Label>
              <p className="text-sm text-muted-foreground">{season} / {year}</p>
            </div>
            <div>
              <Label>কৃষক নির্বাচন করুন</Label>
              <Select value={selectedFarmerId} onValueChange={setSelectedFarmerId}>
                <SelectTrigger><SelectValue placeholder="কৃষক বেছে নিন" /></SelectTrigger>
                <SelectContent>
                  {farmers.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.nameBengali} ({f.farmerCode})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningLand(null)}>বাতিল</Button>
            <Button onClick={handleAssign} disabled={busy || !selectedFarmerId || !currentSeasonId}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}বরাদ্দ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Land Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>জমি মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.landIdentificationNumber} ({deleting?.landmarkNumber}) মুছে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unassign Dialog */}
      <AlertDialog open={!!unassigning} onOpenChange={(o) => !o && setUnassigning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বরাদ্দ বাতিল করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই জমির বরাদ্দ ({season}/{year}) বাতিল হয়ে যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>না</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassign} disabled={busy} className="bg-destructive text-destructive-foreground">হ্যাঁ, বাতিল করুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LandList;
