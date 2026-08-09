import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { landEnrollmentApi, assignmentApi, farmerApi, landApi } from "@/lib/api/client";

const PICKER_SIZE = 15;
import type { SeasonLandEnrollmentResponse, FarmerLandAssignment, Farmer, Land } from "@/lib/api/types";
import { Plus, Loader2, MapPin, Users, Link, Unlink, UserPlus, X } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const LAND_PAGE_SIZE = 20;

const createSchema = z.object({
  landmarkNumber: z.string().min(1, "দাগ/খতিয়ান নম্বর প্রয়োজন"),
  sizeBigha: z.number().min(0.01, "শতক > 0 হতে হবে"),
  description: z.string().optional(),
  tag: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

/**
 * Season-context land management: which lands are enrolled in the selected season, and
 * assign/unassign them to farmers within that season. Land's own create/update/(soft-)delete
 * — independent of any season — lives on the separate Land Master List page.
 */
const LandList = () => {
  const [enrolled, setEnrolled] = useState<SeasonLandEnrollmentResponse[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [landPage, setLandPage] = useState(0);
  const [landSearch, setLandSearch] = useState("");

  // "Add to season" dialog — existing-or-new picker, mirroring the farmer enroll dialog
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [available, setAvailable] = useState<Land[]>([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const [removingEnrollment, setRemovingEnrollment] = useState<SeasonLandEnrollmentResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const [assignments, setAssignments] = useState<FarmerLandAssignment[]>([]);
  const [assigningLand, setAssigningLand] = useState<SeasonLandEnrollmentResponse | null>(null);
  const [unassigning, setUnassigning] = useState<FarmerLandAssignment | null>(null);
  const [tagPromptLand, setTagPromptLand] = useState<{ id: number; landmarkNumber: string; tag?: string } | null>(null);
  const [tagPromptValue, setTagPromptValue] = useState("");

  // farmer picker state (inside assign dialog)
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerResults, setPickerResults] = useState<Farmer[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerSelectedFarmer, setPickerSelectedFarmer] = useState<Farmer | null>(null);
  const pickerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year, seasons } = usePumpContext();

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { landmarkNumber: "", sizeBigha: 0, description: "", tag: "" },
  });

  const currentSeasonId = seasons.find(s => s.seasonName === season && s.year === year)?.id ?? null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (pumpId && currentSeasonId) {
      fetchEnrolled();
      fetchAssignments();
    }
  }, [pumpId, currentSeasonId, year]);

  const fetchEnrolled = async () => {
    if (!currentSeasonId) return;
    setEnrolledLoading(true);
    try {
      setEnrolled(await landEnrollmentApi.getEnrolled(currentSeasonId));
    } catch { /* silent */ }
    finally { setEnrolledLoading(false); }
  };

  const fetchAssignments = async () => {
    if (!pumpId || !currentSeasonId) return;
    try { setAssignments(await assignmentApi.getAll(pumpId, currentSeasonId, year)); }
    catch { /* silent */ }
  };

  const refresh = () => { fetchEnrolled(); fetchAssignments(); };

  const getAssignment = useCallback((landId: number) =>
    assignments.find(a => a.landId === landId) ?? null, [assignments]);

  // ── "Add to season" — existing-or-new picker ──────────────────────────────
  const openEnrollDialog = async () => {
    if (!currentSeasonId) return;
    setEnrollSearch("");
    createForm.reset();
    try {
      setAvailable(await landEnrollmentApi.getAvailable(currentSeasonId));
    } catch {
      setAvailable([]);
    }
    setShowEnrollDialog(true);
  };

  const handleEnrollExisting = async (landId: number) => {
    if (!currentSeasonId) return;
    setEnrolling(true);
    try {
      await landEnrollmentApi.enroll(currentSeasonId, landId);
      toast({ title: "সফল", description: "জমি এই মৌসুমে যোগ করা হয়েছে" });
      setShowEnrollDialog(false);
      fetchEnrolled();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleCreateAndEnroll = async (data: CreateForm) => {
    if (!currentSeasonId || !pumpId) return;
    setEnrolling(true);
    try {
      await landEnrollmentApi.createAndEnroll(currentSeasonId, {
        pumpId,
        landmarkNumber: data.landmarkNumber,
        sizeShatak: data.sizeBigha,
        description: data.description,
        tag: data.tag || undefined,
      });
      toast({ title: "সফল", description: "নতুন জমি তৈরি ও এই মৌসুমে যোগ করা হয়েছে" });
      setShowEnrollDialog(false);
      createForm.reset();
      fetchEnrolled();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemoveFromSeason = async () => {
    if (!removingEnrollment || !currentSeasonId) return;
    setBusy(true);
    try {
      await landEnrollmentApi.unenroll(currentSeasonId, removingEnrollment.landId);
      toast({ title: "অপসারণ সফল" });
      setRemovingEnrollment(null);
      fetchEnrolled();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  // ── Assign / unassign (existing farmer-picker pattern, reused as-is) ──────
  const loadPickerFarmers = async (q: string) => {
    if (!pumpId) return;
    setPickerLoading(true);
    try {
      const result = await farmerApi.searchPaged(pumpId, q, 0, PICKER_SIZE);
      setPickerResults(result.content);
    } catch { /* silent */ }
    finally { setPickerLoading(false); }
  };

  useEffect(() => {
    if (!assigningLand || !pumpId) {
      if (!assigningLand) { setPickerQuery(""); setPickerResults([]); setPickerSelectedFarmer(null); }
      return;
    }
    const delay = pickerQuery ? 300 : 0;
    if (pickerDebounce.current) clearTimeout(pickerDebounce.current);
    pickerDebounce.current = setTimeout(() => loadPickerFarmers(pickerQuery), delay);
    return () => { if (pickerDebounce.current) clearTimeout(pickerDebounce.current); };
  }, [assigningLand, pickerQuery, pumpId]);

  const handleAssign = async () => {
    if (!assigningLand || !pickerSelectedFarmer || !currentSeasonId) return;
    setBusy(true);
    try {
      await assignmentApi.assign({
        farmerId: pickerSelectedFarmer.id,
        landId: assigningLand.landId,
        seasonId: currentSeasonId,
        year,
      });
      toast({ title: "সফল", description: "জমি বরাদ্দ হয়েছে" });
      const justAssigned = assigningLand;
      setAssigningLand(null);
      refresh();
      setTagPromptLand({ id: justAssigned.landId, landmarkNumber: justAssigned.landmarkNumber });
      setTagPromptValue("");
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
      refresh();
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleTagUpdate = async () => {
    if (!tagPromptLand) return;
    setBusy(true);
    try {
      await landApi.update(tagPromptLand.id, { tag: tagPromptValue });
      toast({ title: "ট্যাগ আপডেট হয়েছে" });
      setTagPromptLand(null);
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const filteredEnrolled = enrolled.filter(e => {
    const q = landSearch.toLowerCase();
    return !q || e.landmarkNumber.toLowerCase().includes(q);
  });
  const landTotalPages = Math.ceil(filteredEnrolled.length / LAND_PAGE_SIZE);
  const pagedEnrolled = filteredEnrolled.slice(landPage * LAND_PAGE_SIZE, (landPage + 1) * LAND_PAGE_SIZE);

  const filteredAvailable = available.filter(l => {
    const q = enrollSearch.toLowerCase();
    return !q || l.landmarkNumber.toLowerCase().includes(q) || (l.tag ?? "").toLowerCase().includes(q);
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const noSeason = !currentSeasonId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="জমি ব্যবস্থাপনা"
        subtitle={`${season} / ${year} — মৌসুম ভিত্তিক`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            {currentSeasonId && (
              <Button size="sm" onClick={openEnrollDialog}><Plus className="w-4 h-4 mr-1" />জমি যোগ</Button>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {noSeason ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            এই মৌসুমের জন্য কোনো সিজন কনফিগার করা নেই।{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/user/seasons")}>মৌসুম তৈরি করুন</Button>
          </CardContent></Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                নথিভুক্ত জমি — {season}/{year} ({filteredEnrolled.length})
              </CardTitle>
              {enrolled.length > 0 && (
                <Input
                  placeholder="দাগ নং দিয়ে খুঁজুন..."
                  value={landSearch}
                  onChange={(e) => { setLandSearch(e.target.value); setLandPage(0); }}
                  className="mt-2 max-w-xs"
                />
              )}
            </CardHeader>
            <CardContent>
              {enrolledLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : enrolled.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">এই মৌসুমে কোনো জমি নেই।</p>
                  <Button onClick={openEnrollDialog}><Plus className="w-4 h-4 mr-2" />জমি যোগ করুন</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>দাগ/খতিয়ান</TableHead>
                        <TableHead>শতক</TableHead>
                        <TableHead>কৃষক</TableHead>
                        <TableHead>অ্যাকশন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedEnrolled.map((e) => {
                        const asgn = getAssignment(e.landId);
                        return (
                          <TableRow key={e.enrollmentId}>
                            <TableCell>{e.landmarkNumber}</TableCell>
                            <TableCell>
                              <span className="font-bold text-primary">{(e.sizeShatak ?? 0).toFixed(2)} শতক</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {e.isAssigned ? (
                                e.assignedFarmerName || (asgn ? (asgn.farmerName || `কৃষক #${asgn.farmerId}`) : "—")
                              ) : (
                                <Badge variant="outline">খালি</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {e.isAssigned ? (
                                  asgn && (
                                    <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30" onClick={() => setUnassigning(asgn)}>
                                      <Unlink className="w-3 h-3 mr-1" />বরাদ্দ বাতিল
                                    </Button>
                                  )
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" className="h-7" onClick={() => setAssigningLand(e)}>
                                      <Link className="w-3 h-3 mr-1" />বরাদ্দ
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-destructive border-destructive/30" onClick={() => setRemovingEnrollment(e)}>
                                      অপসারণ
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <PaginationBar
                    currentPage={landPage}
                    totalPages={landTotalPages}
                    totalElements={filteredEnrolled.length}
                    pageSize={LAND_PAGE_SIZE}
                    onPageChange={setLandPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add land to season dialog — existing-or-new picker */}
      <Dialog open={showEnrollDialog} onOpenChange={(o) => !o && setShowEnrollDialog(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>জমি যোগ করুন — {season}/{year}</DialogTitle></DialogHeader>
          <Tabs defaultValue="select">
            <TabsList className="w-full">
              <TabsTrigger value="select" className="flex-1"><MapPin className="w-4 h-4 mr-1" />বিদ্যমান থেকে</TabsTrigger>
              <TabsTrigger value="create" className="flex-1"><UserPlus className="w-4 h-4 mr-1" />নতুন তৈরি</TabsTrigger>
            </TabsList>

            {/* Select existing */}
            <TabsContent value="select" className="space-y-3 mt-3">
              <Input
                placeholder="দাগ নম্বর বা ট্যাগ..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
              />
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">
                  {available.length === 0 ? "এই পাম্পে যোগ করার মতো কোনো জমি নেই।" : "কোনো ফলাফল নেই।"}
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filteredAvailable.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{l.landmarkNumber}</p>
                        <p className="text-xs text-muted-foreground">{(l.sizeShatak ?? 0).toFixed(2)} শতক{l.tag ? ` · ${l.tag}` : ""}</p>
                      </div>
                      <Button size="sm" onClick={() => handleEnrollExisting(l.id)} disabled={enrolling}>যোগ</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Create new */}
            <TabsContent value="create" className="mt-3">
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateAndEnroll)} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={createForm.control} name="landmarkNumber" render={({ field }) => (
                      <FormItem><FormLabel>দাগ/খতিয়ান নম্বর *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={createForm.control} name="sizeBigha" render={({ field }) => (
                      <FormItem><FormLabel>শতক *</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={createForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>বিবরণ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={createForm.control} name="tag" render={({ field }) => (
                      <FormItem><FormLabel>ট্যাগ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowEnrollDialog(false)}>বাতিল</Button>
                    <Button type="submit" disabled={enrolling}>তৈরি ও যোগ করুন</Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Tag update prompt (after assign) */}
      <Dialog open={!!tagPromptLand} onOpenChange={(o) => { if (!o) setTagPromptLand(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>ট্যাগ আপডেট করবেন?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            জমি <strong>{tagPromptLand?.landmarkNumber}</strong> একজন কৃষকের কাছে বরাদ্দ হয়েছে।
            এই জমির জন্য একটি অনুসন্ধানযোগ্য ট্যাগ যোগ করতে পারেন।
          </p>
          <div>
            <Label>ট্যাগ</Label>
            <Input value={tagPromptValue} onChange={(e) => setTagPromptValue(e.target.value)} placeholder="যেমন: উত্তর মাঠ, সেচ এলাকা ক" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagPromptLand(null)}>এড়িয়ে যান</Button>
            <Button onClick={handleTagUpdate} disabled={busy || !tagPromptValue.trim()}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}ট্যাগ সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Land Dialog */}
      <Dialog open={!!assigningLand} onOpenChange={(o) => !o && setAssigningLand(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>জমি বরাদ্দ — {assigningLand?.landmarkNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{season} / {year}</p>
            {pickerSelectedFarmer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
                <Users className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium flex-1">{pickerSelectedFarmer.nameBengali}</span>
                <span className="text-xs text-muted-foreground">{pickerSelectedFarmer.farmerCode}</span>
                <button className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setPickerSelectedFarmer(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div>
              <Label>কৃষক খুঁজুন</Label>
              <Input
                className="mt-1"
                placeholder="নাম বা কোড লিখুন"
                value={pickerQuery}
                onChange={e => setPickerQuery(e.target.value)}
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-md">
              {pickerLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : pickerResults.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">কোনো কৃষক পাওয়া যায়নি</div>
              ) : (
                pickerResults.map((f, i) => (
                  <button
                    key={f.id}
                    className={`w-full text-left px-3 py-2 transition-colors hover:bg-accent ${
                      pickerSelectedFarmer?.id === f.id ? "bg-primary/10" : ""
                    } ${i > 0 ? "border-t" : ""}`}
                    onClick={() => setPickerSelectedFarmer(f)}
                  >
                    <div className="text-sm font-medium">{f.nameBengali}</div>
                    <div className="text-xs text-muted-foreground">{f.farmerCode} · {f.village}</div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningLand(null)}>বাতিল</Button>
            <Button onClick={handleAssign} disabled={busy || !pickerSelectedFarmer || !currentSeasonId}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}বরাদ্দ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from season confirmation */}
      <AlertDialog open={!!removingEnrollment} onOpenChange={(o) => !o && setRemovingEnrollment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>জমি অপসারণ করবেন?</AlertDialogTitle>
            <AlertDialogDescription>"{removingEnrollment?.landmarkNumber}" কে {season}/{year} মৌসুম থেকে বাদ দেওয়া হবে। জমিটি সকল জমির তালিকায় থেকে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFromSeason} disabled={busy} className="bg-destructive text-destructive-foreground">অপসারণ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unassign confirmation */}
      <AlertDialog open={!!unassigning} onOpenChange={(o) => !o && setUnassigning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বরাদ্দ বাতিল করবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই জমির বরাদ্দ ({season}/{year}) বাতিল হয়ে যাবে।</AlertDialogDescription>
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
