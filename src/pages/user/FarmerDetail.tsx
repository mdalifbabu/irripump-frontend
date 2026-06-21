import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, assignmentApi, paymentApi, unitPriceApi, seasonApi, invoiceApi } from "@/lib/api/client";
import { buildInvoicePdf } from "@/lib/invoice/buildInvoicePdf";
import type { Farmer, FarmerLandAssignment, Payment, UnitPrice, Season, FarmerDetailResponse } from "@/lib/api/types";
import { CreditCard, Map, Phone, Mail, MapPin, Pencil, Trash2, Loader2, TrendingUp, TrendingDown, FileDown } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const PAY_PAGE_SIZE = 10;
const SEASON_PAGE_SIZE = 5;

interface SeasonSummary {
  season: Season;
  assignments: FarmerLandAssignment[];
  totalLandShatak: number;
  totalPaid: number;
  calculatedCost: number;
  due: number;
  advance: number;
}

const FarmerDetail = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farmerDetail, setFarmerDetail] = useState<FarmerDetailResponse | null>(null);
  const [allSeasons, setAllSeasons] = useState<Season[]>([]);
  const [seasonSummaries, setSeasonSummaries] = useState<SeasonSummary[]>([]);
  const [seasonHistoryPage, setSeasonHistoryPage] = useState(0);
  const [seasonHistoryTotal, setSeasonHistoryTotal] = useState(0);
  const [seasonHistoryTotalPages, setSeasonHistoryTotalPages] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payTotalElements, setPayTotalElements] = useState(0);
  const [payCurrentPage, setPayCurrentPage] = useState(0);
  const [payTotalPages, setPayTotalPages] = useState(0);
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState<Farmer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year, selectedSeason } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && isAuthenticated && farmerId && pumpId) fetchData();
  }, [isLoading, isAuthenticated, farmerId, pumpId, navigate]);

  useEffect(() => {
    if (farmerId && pumpId && season && year) fetchData();
  }, [pumpId, season, year]);

  const fetchPayments = async (page: number) => {
    if (!farmerId) return;
    try {
      const result = await paymentApi.getByFarmerPaged(parseInt(farmerId!), page, PAY_PAGE_SIZE, selectedSeason?.id);
      setPayments(result.content);
      setPayCurrentPage(result.number);
      setPayTotalPages(result.totalPages);
      setPayTotalElements(result.totalElements);
    } catch { /* non-critical */ }
  };

  const fetchSeasonHistory = async (page: number, up?: UnitPrice[]) => {
    if (!farmerId || !pumpId) return;
    const prices = up ?? unitPrices;
    try {
      const result = await seasonApi.getFarmerHistory(parseInt(farmerId!), page, SEASON_PAGE_SIZE);
      setSeasonHistoryPage(result.number);
      setSeasonHistoryTotal(result.totalElements);
      setSeasonHistoryTotalPages(result.totalPages);

      const summaries: SeasonSummary[] = [];
      for (const s of result.content) {
        try {
          const asgn = await assignmentApi.getByFarmer(parseInt(farmerId!), pumpId, s.id, s.year);
          const totalLandShatak = asgn.reduce((acc, a) => acc + (a.assignedSizeShatak ?? a.landSizeShatak ?? 0), 0);
          const up_match = prices.find(u => u.season === s.seasonName && u.year === s.year);
          const pricePerShatak = up_match?.pricePerShatak ?? 0;
          const calculatedCost = totalLandShatak * pricePerShatak;
          summaries.push({ season: s, assignments: asgn, totalLandShatak, totalPaid: 0, calculatedCost, due: 0, advance: 0 });
        } catch {
          summaries.push({ season: s, assignments: [], totalLandShatak: 0, totalPaid: 0, calculatedCost: 0, due: 0, advance: 0 });
        }
      }
      setSeasonSummaries(summaries);
    } catch { /* non-critical */ }
  };

  const fetchData = async () => {
    if (!pumpId || !farmerId) return;
    setLoading(true);
    try {
      const [f, allS, p, up] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        seasonApi.getActive(),
        paymentApi.getByFarmerPaged(parseInt(farmerId!), 0, PAY_PAGE_SIZE, selectedSeason?.id),
        unitPriceApi.getByPump(pumpId),
      ]);
      setFarmer(f);
      setAllSeasons(allS);
      setPayments(p.content);
      setPayCurrentPage(p.number);
      setPayTotalPages(p.totalPages);
      setPayTotalElements(p.totalElements);
      setUnitPrices(up);

      // Fetch backend-calculated cost/due for the current season
      const currentSeasonObj = allS.find(s => s.seasonName.toUpperCase() === season.toUpperCase() && s.year === year);
      if (currentSeasonObj) {
        try {
          const detail = await farmerApi.getDetail(parseInt(farmerId!), currentSeasonObj.id, year);
          setFarmerDetail(detail);
        } catch { /* detail is optional */ }
      }

      // Season history is loaded separately (paginated) — pass up directly to avoid stale closure
      await fetchSeasonHistory(0, up);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to fetch", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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
      setEditing(null);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!farmer) return;
    setBusy(true);
    try {
      await farmerApi.delete(farmer.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      navigate("/user/farmers");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };


  const handleDownloadInvoice = async () => {
    const latestPayment = payments[0]; // page 0, ordered DESC → most recent
    if (!latestPayment) {
      toast({ title: "কোনো পেমেন্ট নেই", description: "ইনভয়েস তৈরির জন্য অন্তত একটি পেমেন্ট প্রয়োজন", variant: "destructive" });
      return;
    }
    setDownloading(true);
    try {
      const data = await invoiceApi.get(latestPayment.id);
      buildInvoicePdf(data).save(`invoice_${data.farmer.identifier}_${data.invoiceNo}.pdf`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to download invoice", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const currentSummary = seasonSummaries.find(s => s.season.seasonName.toUpperCase() === season.toUpperCase() && s.season.year === year);

  const backendCost = farmerDetail?.calculatedCost ?? currentSummary?.calculatedCost ?? 0;
  const backendPaid = farmerDetail?.totalPaid ?? 0;
  const backendDue = farmerDetail?.dueAmount ?? currentSummary?.due ?? 0;
  const backendAdvance = farmerDetail?.advanceAmount ?? currentSummary?.advance ?? 0;

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }
  if (!farmer) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Farmer not found</p></div>;

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
        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">বর্তমান মৌসুম</p>
              <p className="text-lg font-bold">{season}/{year}</p>
              <p className="text-sm">{farmerDetail?.landCount != null ? `${farmerDetail.landCount} জমি` : currentSummary ? `${currentSummary.totalLandShatak.toFixed(2)} শতক` : "তথ্য নেই"}</p>
              {currentSummary && <p className="text-xs text-muted-foreground">{(currentSummary.totalLandShatak/33).toFixed(3)} বিঘা</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">মোট খরচ</p>
              <p className="text-lg font-bold text-blue-600">৳{backendCost.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">ব্যাকএন্ড হিসাব</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">মোট পরিশোধ</p>
              <p className="text-lg font-bold text-green-600">৳{backendPaid.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">{payTotalElements} লেনদেন</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">বকেয়া / অগ্রিম</p>
              {backendDue > 0 ? (
                <p className="text-lg font-bold text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" />৳{backendDue.toFixed(0)}
                </p>
              ) : backendAdvance > 0 ? (
                <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />৳{backendAdvance.toFixed(0)} অগ্রিম
                </p>
              ) : (
                <p className="text-lg font-bold text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate(`/user/farmers/${farmerId}/lands`)}>
            <Map className="w-4 h-4 mr-2" />জমি পরিচালনা
          </Button>
          <Button onClick={() => navigate(`/user/farmers/${farmerId}/payments`)}>
            <CreditCard className="w-4 h-4 mr-2" />পেমেন্ট পরিচালনা
          </Button>
          <Button variant="outline" onClick={handleDownloadInvoice} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
            ইনভয়েস ডাউনলোড
          </Button>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="overview">সারসংক্ষেপ</TabsTrigger>
            <TabsTrigger value="seasons">মৌসুম ইতিহাস</TabsTrigger>
            <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
            <TabsTrigger value="info">ব্যক্তিগত তথ্য</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4">
            {currentSummary ? (
              <Card>
                <CardHeader><CardTitle>{season}/{year} মৌসুমের বিবরণ</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>দাগ নম্বর</TableHead>
                        <TableHead>শতক / বিঘা</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSummary.assignments.map(a => {
                        const ls = a.assignedSizeShatak ?? a.landSizeShatak ?? 0;
                        return (
                          <TableRow key={a.id}>
                            <TableCell>{a.landmarkNumber}</TableCell>
                            <TableCell className="font-bold">{ls.toFixed(2)} শতক<br/><span className="text-xs text-muted-foreground font-normal">{(ls/33).toFixed(3)} বিঘা</span></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                    <div><p className="text-xs text-muted-foreground">মোট জমি</p><p className="font-bold">{currentSummary.totalLandShatak.toFixed(2)} শতক</p><p className="text-xs text-muted-foreground">{(currentSummary.totalLandShatak/33).toFixed(3)} বিঘা</p></div>
                    <div><p className="text-xs text-muted-foreground">খরচ (ব্যাকএন্ড)</p><p className="font-bold text-blue-600">৳{backendCost.toFixed(2)}</p></div>
                    <div><p className="text-xs text-muted-foreground">পরিশোধ</p><p className="font-bold text-green-600">৳{backendPaid.toFixed(2)}</p></div>
                    <div>
                      <p className="text-xs text-muted-foreground">বকেয়া</p>
                      <p className={`font-bold ${backendDue > 0 ? "text-red-600" : "text-green-600"}`}>
                        {backendDue > 0 ? `৳${backendDue.toFixed(2)}` : `অগ্রিম ৳${backendAdvance.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">
                এই মৌসুমে ({season}/{year}) কোনো জমি বরাদ্দ নেই।{" "}
                <Button variant="link" className="p-0" onClick={() => navigate(`/user/farmers/${farmerId}/lands`)}>জমি যোগ করুন</Button>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* Season history */}
          <TabsContent value="seasons">
            <div className="space-y-4">
              {seasonSummaries.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">কোনো মৌসুম ডেটা নেই।</CardContent></Card>
              ) : seasonSummaries.map(ss => (
                <Card key={ss.season.id} className={ss.season.seasonName === season && ss.season.year === year ? "border-primary" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{ss.season.seasonNameBengali || ss.season.seasonName} — {ss.season.year}</CardTitle>
                      {ss.season.isCurrent && <Badge>বর্তমান</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div><p className="text-muted-foreground">জমি</p><p className="font-bold">{ss.assignments.length} পিস · {ss.totalLandShatak.toFixed(2)} শতক</p></div>
                      <div><p className="text-muted-foreground">খরচ</p><p className="font-bold text-blue-600">৳{ss.calculatedCost.toFixed(0)}</p></div>
                      <div>
                        <Button size="sm" variant="outline" className="mt-1"
                          onClick={() => navigate(`/admin/farmers/${farmerId}/ledger`)}>
                          লেজার
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <PaginationBar
                currentPage={seasonHistoryPage}
                totalPages={seasonHistoryTotalPages}
                totalElements={seasonHistoryTotal}
                pageSize={SEASON_PAGE_SIZE}
                onPageChange={fetchSeasonHistory}
              />
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>পেমেন্ট ইতিহাস ({payTotalElements}টি)</CardTitle>
                  <Button size="sm" onClick={() => navigate(`/user/farmers/${farmerId}/payments`)}>
                    <CreditCard className="w-4 h-4 mr-1" />পরিচালনা
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">কোনো পেমেন্ট নেই।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>তারিখ</TableHead>
                          <TableHead>পরিমাণ</TableHead>
                          <TableHead>পদ্ধতি</TableHead>
                          <TableHead>ধরন</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{p.paymentDate}</TableCell>
                            <TableCell className="font-bold">৳{p.amount.toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline">{p.paymentMethod}</Badge></TableCell>
                            <TableCell><Badge variant={p.paymentType === "PAYMENT" ? "default" : "secondary"}>{p.paymentType}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationBar
                      currentPage={payCurrentPage}
                      totalPages={payTotalPages}
                      totalElements={payTotalElements}
                      pageSize={PAY_PAGE_SIZE}
                      onPageChange={fetchPayments}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal info */}
          <TabsContent value="info">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div><Label className="text-muted-foreground">নাম (বাংলা)</Label><p className="text-lg font-medium">{farmer.nameBengali}</p></div>
                    <div><Label className="text-muted-foreground">নাম (English)</Label><p className="text-lg">{farmer.nameEnglish || "—"}</p></div>
                    <div><Label className="text-muted-foreground">পিতার নাম</Label><p className="text-lg">{farmer.fatherName || "—"}</p></div>
                    <div><Label className="text-muted-foreground">NID</Label><p className="text-lg font-mono">{farmer.nidNumber || "—"}</p></div>
                    <div><Label className="text-muted-foreground">কোড</Label><p className="text-lg font-mono">{farmer.farmerCode}</p></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">গ্রাম</Label><p className="text-lg">{farmer.village}</p></div></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">মোবাইল</Label><p className="text-lg">{farmer.mobile}</p></div></div>
                    {farmer.whatsapp && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500" /><div><Label className="text-muted-foreground">WhatsApp</Label><p className="text-lg">{farmer.whatsapp}</p></div></div>}
                    {farmer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><div><Label className="text-muted-foreground">Email</Label><p className="text-lg">{farmer.email}</p></div></div>}
                    <div><Label className="text-muted-foreground">নিবন্ধন তারিখ</Label><p className="text-lg">{farmer.registrationDate || "—"}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>কৃষক সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>নাম (বাংলা) *</Label><Input value={editing.nameBengali} onChange={(e) => setEditing({ ...editing, nameBengali: e.target.value })} /></div>
              <div><Label>নাম (English)</Label><Input value={editing.nameEnglish || ""} onChange={(e) => setEditing({ ...editing, nameEnglish: e.target.value })} /></div>
              <div><Label>পিতার নাম</Label><Input value={editing.fatherName || ""} onChange={(e) => setEditing({ ...editing, fatherName: e.target.value })} /></div>
              <div><Label>গ্রাম *</Label><Input value={editing.village} onChange={(e) => setEditing({ ...editing, village: e.target.value })} /></div>
              <div><Label>মোবাইল *</Label><Input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={editing.whatsapp || ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>NID</Label><Input value={editing.nidNumber || ""} onChange={(e) => setEditing({ ...editing, nidNumber: e.target.value })} /></div>
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
            <AlertDialogDescription>"{farmer.nameBengali}" নিষ্ক্রিয় করা হবে।</AlertDialogDescription>
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
