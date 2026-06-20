import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { enrollmentApi } from "@/lib/api/client";
import type { SeasonEnrollmentResponse, Farmer } from "@/lib/api/types";
import { Plus, Search, RefreshCw, Trash2, UserPlus, Users } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const FARMER_PAGE_SIZE = 20;



const createSchema = z.object({
  nameBengali: z.string().min(1, "বাংলা নাম আবশ্যক"),
  nameEnglish: z.string().optional(),
  fatherName: z.string().optional(),
  village: z.string().min(1, "গ্রাম আবশ্যক"),
  mobile: z.string().min(11, "মোবাইল নম্বর সঠিক নয়"),
  email: z.string().email().optional().or(z.literal("")),
  nidNumber: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const FarmerList = () => {
  const [enrolled, setEnrolled] = useState<SeasonEnrollmentResponse[]>([]);
  const [available, setAvailable] = useState<Farmer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [farmerPage, setFarmerPage] = useState(0);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [unenrolling, setUnenrolling] = useState<SeasonEnrollmentResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { pumpId, season, year, seasons } = usePumpContext();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { nameBengali: "", nameEnglish: "", fatherName: "", village: "", mobile: "", email: "", nidNumber: "" },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  // Resolve currentSeasonId when pump/season/year context changes
  useEffect(() => {
    const found = seasons.find(s => s.seasonName === season && s.year === year);
    setCurrentSeasonId(found?.id ?? null);
  }, [seasons, season, year]);

  useEffect(() => {
    if (currentSeasonId) fetchEnrolled();
  }, [currentSeasonId]);

  const fetchEnrolled = async () => {
    if (!currentSeasonId) return;
    setLoading(true);
    try {
      setEnrolled(await enrollmentApi.getEnrolled(currentSeasonId));
    } catch {
      toast({ title: "Error", description: "Failed to fetch enrolled farmers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openEnrollDialog = async () => {
    if (!currentSeasonId) return;
    setEnrollSearch("");
    form.reset();
    try {
      setAvailable(await enrollmentApi.getAvailable(currentSeasonId));
    } catch {
      setAvailable([]);
    }
    setShowEnrollDialog(true);
  };

  const handleEnrollExisting = async (farmerId: number) => {
    if (!currentSeasonId) return;
    setEnrolling(true);
    try {
      await enrollmentApi.enroll(currentSeasonId, farmerId);
      toast({ title: "সফল", description: "কৃষক এই মৌসুমে যোগ করা হয়েছে" });
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
      await enrollmentApi.createAndEnroll(currentSeasonId, {
        pumpId,
        nameBengali: data.nameBengali,
        nameEnglish: data.nameEnglish,
        fatherName: data.fatherName,
        village: data.village,
        mobile: data.mobile,
        email: data.email || undefined,
        nidNumber: data.nidNumber,
      } as any);
      toast({ title: "সফল", description: "নতুন কৃষক তৈরি ও এই মৌসুমে যোগ করা হয়েছে" });
      setShowEnrollDialog(false);
      form.reset();
      fetchEnrolled();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!unenrolling || !currentSeasonId) return;
    setBusy(true);
    try {
      await enrollmentApi.unenroll(currentSeasonId, unenrolling.farmerId);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setUnenrolling(null);
      fetchEnrolled();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const filtered = enrolled.filter(e => {
    const q = searchQuery.toLowerCase();
    return !q || e.nameBengali.toLowerCase().includes(q) || e.mobile.includes(q) || e.farmerCode.includes(q);
  });
  const farmerTotalPages = Math.ceil(filtered.length / FARMER_PAGE_SIZE);
  const pagedFiltered = filtered.slice(farmerPage * FARMER_PAGE_SIZE, (farmerPage + 1) * FARMER_PAGE_SIZE);

  const filteredAvailable = available.filter(f => {
    const q = enrollSearch.toLowerCase();
    return !q || f.nameBengali.toLowerCase().includes(q) || f.mobile.includes(q) || f.farmerCode.includes(q);
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="কৃষক পরিচালনা"
        subtitle={`${season} / ${year} — মৌসুম ভিত্তিক`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            {user?.role !== "ADMIN" && currentSeasonId && (
              <Button size="sm" onClick={openEnrollDialog}><Plus className="w-4 h-4 mr-1" />কৃষক যোগ</Button>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {!currentSeasonId && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            এই মৌসুমের জন্য কোনো সিজন কনফিগার করা নেই।{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/user/seasons")}>মৌসুম তৈরি করুন</Button>
          </CardContent></Card>
        )}

        {currentSeasonId && (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Input placeholder="নাম, মোবাইল বা কোড দিয়ে খুঁজুন..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFarmerPage(0); }} />
                  <Button variant="outline" size="icon" onClick={fetchEnrolled}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>নথিভুক্ত কৃষক — {season}/{year} ({filtered.length})</CardTitle>

              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">এই মৌসুমে কোনো কৃষক নেই।</p>
                    <Button onClick={openEnrollDialog}><UserPlus className="w-4 h-4 mr-2" />কৃষক যোগ করুন</Button>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {pagedFiltered.map((e) => (
                        <Card key={e.enrollmentId}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start" onClick={() => navigate(`/user/farmers/${e.farmerId}`)}>
                              <div>
                                <p className="font-medium">{e.nameBengali}</p>
                                <p className="text-sm text-muted-foreground font-mono">{e.farmerCode}</p>
                                <p className="text-sm text-muted-foreground">{e.mobile}</p>
                              </div>
                              <div className="text-right space-y-1">
                                {e.dueAmount !== undefined && (
                                  <Badge variant={e.dueAmount > 0 ? "destructive" : "default"}>
                                    {e.dueAmount > 0 ? `৳${e.dueAmount.toFixed(0)} বকেয়া` : "পরিশোধিত"}
                                  </Badge>
                                )}
                                <Badge variant="outline">{e.landCount ?? 0} জমি</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/user/farmers/${e.farmerId}/payments`)}>পেমেন্ট</Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/user/farmers/${e.farmerId}/lands`)}>জমি</Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setUnenrolling(e)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>কোড</TableHead>
                            <TableHead>নাম</TableHead>
                            <TableHead>গ্রাম</TableHead>
                            <TableHead>মোবাইল</TableHead>
                            <TableHead>জমি</TableHead>
                            <TableHead>বকেয়া</TableHead>
                            <TableHead>অ্যাকশন</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedFiltered.map((e) => (
                            <TableRow key={e.enrollmentId}>
                              <TableCell className="font-mono text-sm">{e.farmerCode}</TableCell>
                              <TableCell className="font-medium">{e.nameBengali}</TableCell>
                              <TableCell>{e.village}</TableCell>
                              <TableCell>{e.mobile}</TableCell>
                              <TableCell>{e.landCount ?? 0}</TableCell>
                              <TableCell>
                                {e.dueAmount !== undefined ? (
                                  <Badge variant={e.dueAmount > 0 ? "destructive" : "default"}>
                                    {e.dueAmount > 0 ? `৳${e.dueAmount.toFixed(0)}` : "পরিশোধিত"}
                                  </Badge>
                                ) : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${e.farmerId}`)}>বিস্তারিত</Button>
                                  <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${e.farmerId}/payments`)}>পেমেন্ট</Button>
                                  <Button size="sm" variant="outline" onClick={() => navigate(`/user/farmers/${e.farmerId}/lands`)}>জমি</Button>
                                  <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setUnenrolling(e)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <PaginationBar
                      currentPage={farmerPage}
                      totalPages={farmerTotalPages}
                      totalElements={filtered.length}
                      pageSize={FARMER_PAGE_SIZE}
                      onPageChange={setFarmerPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Enroll farmer dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(o) => !o && setShowEnrollDialog(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>কৃষক যোগ করুন — {season}/{year}</DialogTitle></DialogHeader>
          <Tabs defaultValue="select">
            <TabsList className="w-full">
              <TabsTrigger value="select" className="flex-1"><Users className="w-4 h-4 mr-1" />বিদ্যমান থেকে</TabsTrigger>
              <TabsTrigger value="create" className="flex-1"><UserPlus className="w-4 h-4 mr-1" />নতুন তৈরি</TabsTrigger>
            </TabsList>

            {/* Select existing */}
            <TabsContent value="select" className="space-y-3 mt-3">
              <Input
                placeholder="নাম, মোবাইল বা কোড..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
              />
              {filteredAvailable.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">
                  {available.length === 0 ? "এই পাম্পে কোনো নতুন কৃষক নেই।" : "কোনো ফলাফল নেই।"}
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filteredAvailable.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{f.nameBengali}</p>
                        <p className="text-xs text-muted-foreground">{f.mobile} · {f.farmerCode}</p>
                      </div>
                      <Button size="sm" onClick={() => handleEnrollExisting(f.id)} disabled={enrolling}>যোগ</Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Create new */}
            <TabsContent value="create" className="mt-3">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateAndEnroll)} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={form.control} name="nameBengali" render={({ field }) => (
                      <FormItem><FormLabel>নাম (বাংলা) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nameEnglish" render={({ field }) => (
                      <FormItem><FormLabel>নাম (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="fatherName" render={({ field }) => (
                      <FormItem><FormLabel>পিতার নাম</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="village" render={({ field }) => (
                      <FormItem><FormLabel>গ্রাম *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="mobile" render={({ field }) => (
                      <FormItem><FormLabel>মোবাইল *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="nidNumber" render={({ field }) => (
                      <FormItem><FormLabel>NID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

      {/* Unenroll confirmation */}
      <AlertDialog open={!!unenrolling} onOpenChange={(o) => !o && setUnenrolling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কৃষক সরাতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{unenrolling?.nameBengali}" কে {season}/{year} মৌসুম থেকে বাদ দেওয়া হবে। জমি বরাদ্দ অক্ষুণ্ণ থাকবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnenroll} disabled={busy} className="bg-destructive text-destructive-foreground">সরান</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FarmerList;
