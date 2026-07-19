import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, paymentApi, invoiceApi, ledgerApi } from "@/lib/api/client";
import type { FarmerDetailResponse } from "@/lib/api/types";
import { buildReceiptHtml, printReceiptHtml, downloadReceiptAsPng } from "@/lib/invoice/buildReceiptHtml";
import type { Farmer, Payment } from "@/lib/api/types";
import { Plus, Loader2, Download, Pencil, Trash2, FileText, Image } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const PAGE_SIZE = 10;

const schema = z.object({
  amount: z.number().min(1),
  paymentDate: z.string().min(1),
  paymentMethod: z.enum(["CASH", "BANK", "MOBILE_BANKING"]),
  transactionReference: z.string().optional(),
  paymentType: z.enum(["PAYMENT", "ADJUSTMENT", "DEDUCTION"]),
});
type FormData = z.infer<typeof schema>;

const methodLabel: Record<string, string> = { CASH: "নগদ", BANK: "ব্যাংক", MOBILE_BANKING: "মোবাইল ব্যাংকিং" };
const methodColor: Record<string, string> = {
  CASH: "bg-green-500 text-white",
  BANK: "bg-blue-500 text-white",
  MOBILE_BANKING: "bg-pink-500 text-white",
};
const typeLabel: Record<string, string> = { PAYMENT: "পেমেন্ট", ADJUSTMENT: "সমন্বয়", DEDUCTION: "কর্তন" };

const FarmerPayments = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [farmerDetail, setFarmerDetail] = useState<FarmerDetailResponse | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingPngId, setDownloadingPngId] = useState<number | null>(null);
  const [downloadingList, setDownloadingList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; amount: number; reason: string } | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedSeason, year, pumpId, pumps } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH" as const,
      paymentType: "PAYMENT" as const,
      transactionReference: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && isAuthenticated && farmerId) fetchData(0);
  }, [isLoading, isAuthenticated, farmerId, navigate, selectedSeason?.id]);

  const fetchData = async (page: number, farmerObj?: Farmer) => {
    setLoading(true);
    try {
      const id = parseInt(farmerId!);
      let f = farmerObj ?? farmer;
      if (!f) {
        f = await farmerApi.getById(id);
        setFarmer(f);
      }
      const [result, detail] = await Promise.all([
        paymentApi.getByFarmerPaged(id, page, PAGE_SIZE, selectedSeason?.id, selectedSeason?.id ? undefined : year),
        selectedSeason?.id
          ? farmerApi.getDetail(id, selectedSeason.id, selectedSeason.year).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPayments(result.content);
      setCurrentPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setFarmerDetail(detail);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await paymentApi.create(
        parseInt(farmerId!),
        { ...(data as Required<FormData>), transactionReference: data.transactionReference || undefined },
        selectedSeason?.id,
      );
      toast({ title: "পেমেন্ট রেকর্ড হয়েছে" });
      form.reset();
      setShowForm(false);
      fetchData(0);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await paymentApi.update(editing.id, { amount: editing.amount, reason: editing.reason });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      fetchData(currentPage);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await paymentApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchData(currentPage);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    setDownloadingId(payment.id);
    try {
      const id = parseInt(farmerId!);
      const [invoiceData, ledger] = await Promise.all([
        invoiceApi.get(payment.id),
        ledgerApi.getLedger(id),
      ]);
      const pumpBn = pumps.find((p) => p.id === pumpId)?.pumpNameBengali;
      const selectedEntry = ledger.seasons.find((s) => s.seasonId === selectedSeason?.id);
      const html = await buildReceiptHtml({
        mode: "single",
        invoiceNo: invoiceData.invoiceNo,
        issuedAt: new Date().toISOString(),
        pumpName: invoiceData.pump.name,
        pumpNameBengali: pumpBn,
        farmerName: farmer?.nameBengali ?? invoiceData.farmer.name,
        farmerCode: invoiceData.farmer.identifier,
        seasonName: selectedSeason?.seasonName ?? invoiceData.season.name ?? "",
        year: selectedSeason?.year ?? invoiceData.season.year ?? new Date().getFullYear(),
        payment: {
          amount: invoiceData.payment.amount,
          date: invoiceData.payment.paidAt,
          method: invoiceData.payment.method,
        },
        lands: invoiceData.lands,
        totalLandShatak: farmerDetail?.totalLandSizeShatak ?? undefined,
        selectedSeasonTotal: selectedEntry?.billed ?? farmerDetail?.calculatedCost ?? 0,
        selectedSeasonDue: selectedEntry?.outstanding ?? farmerDetail?.dueAmount ?? 0,
        otherSeasonDues: ledger.seasons
          .filter((s) => s.seasonId !== selectedSeason?.id && s.outstanding > 0)
          .map((s) => ({ seasonName: s.seasonName, year: s.year, due: s.outstanding })),
        farmerPortalUrl: `https://www.irripump.com/farmer?code=${invoiceData.farmer.identifier}`,
      });
      printReceiptHtml(html);
      toast({ title: "প্রিন্ট হচ্ছে..." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to print invoice", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoicePng = async (payment: Payment) => {
    setDownloadingPngId(payment.id);
    try {
      const id = parseInt(farmerId!);
      const [invoiceData, ledger] = await Promise.all([
        invoiceApi.get(payment.id),
        ledgerApi.getLedger(id),
      ]);
      const pumpBn = pumps.find((p) => p.id === pumpId)?.pumpNameBengali;
      const selectedEntry = ledger.seasons.find((s) => s.seasonId === selectedSeason?.id);
      const html = await buildReceiptHtml({
        mode: "single",
        invoiceNo: invoiceData.invoiceNo,
        issuedAt: new Date().toISOString(),
        pumpName: invoiceData.pump.name,
        pumpNameBengali: pumpBn,
        farmerName: farmer?.nameBengali ?? invoiceData.farmer.name,
        farmerCode: invoiceData.farmer.identifier,
        seasonName: selectedSeason?.seasonName ?? invoiceData.season.name ?? "",
        year: selectedSeason?.year ?? invoiceData.season.year ?? new Date().getFullYear(),
        payment: {
          amount: invoiceData.payment.amount,
          date: invoiceData.payment.paidAt,
          method: invoiceData.payment.method,
        },
        lands: invoiceData.lands,
        totalLandShatak: farmerDetail?.totalLandSizeShatak ?? undefined,
        selectedSeasonTotal: selectedEntry?.billed ?? farmerDetail?.calculatedCost ?? 0,
        selectedSeasonDue: selectedEntry?.outstanding ?? farmerDetail?.dueAmount ?? 0,
        otherSeasonDues: ledger.seasons
          .filter((s) => s.seasonId !== selectedSeason?.id && s.outstanding > 0)
          .map((s) => ({ seasonName: s.seasonName, year: s.year, due: s.outstanding })),
        farmerPortalUrl: `https://www.irripump.com/farmer?code=${invoiceData.farmer.identifier}`,
      });
      await downloadReceiptAsPng(html, invoiceData.invoiceNo);
      toast({ title: "PNG ডাউনলোড হচ্ছে..." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to download PNG", variant: "destructive" });
    } finally {
      setDownloadingPngId(null);
    }
  };

  const handleDownloadPaymentList = async () => {
    if (!farmer) return;
    setDownloadingList(true);
    try {
      const id = parseInt(farmerId!);
      const all = await paymentApi.getByFarmerPaged(id, 0, 1000, selectedSeason?.id, selectedSeason?.id ? undefined : year);
      const pumpBn = pumps.find((p) => p.id === pumpId)?.pumpNameBengali;
      const stmtDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const statementNo = `STMT-${farmer.farmerCode}-${selectedSeason?.seasonName ?? "ALL"}-${stmtDate}`;
      const due = farmerDetail?.dueAmount ?? 0;
      const html = await buildReceiptHtml({
        mode: "list",
        statementNo,
        issuedAt: new Date().toISOString(),
        pumpName: farmer.pumpName ?? pumps.find((p) => p.id === pumpId)?.pumpNameEnglish ?? "",
        pumpNameBengali: pumpBn,
        farmerName: farmer.nameBengali,
        farmerCode: farmer.farmerCode,
        seasonName: selectedSeason?.seasonName ?? "",
        year: selectedSeason?.year ?? year,
        payments: all.content.map((p) => ({
          date: p.paymentDate,
          amount: p.amount,
          method: p.paymentMethod,
          reference: p.transactionReference,
          isReversed: p.isReversed,
        })),
        selectedSeasonTotal: farmerDetail?.calculatedCost ?? 0,
        selectedSeasonDue: due > 0 ? due : -(farmerDetail?.advanceAmount ?? 0),
        farmerPortalUrl: `https://www.irripump.com/farmer?code=${farmer.farmerCode}`,
      });
      printReceiptHtml(html);
      toast({ title: "প্রিন্ট হচ্ছে..." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setDownloadingList(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const due = farmerDetail?.dueAmount ?? 0;
  const advance = farmerDetail?.advanceAmount ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title={`${farmer?.nameBengali || "কৃষক"} — পেমেন্ট`}
        subtitle={farmer?.farmerCode ?? ""}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" />পেমেন্ট
            </Button>
          </div>
        }
      />

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">

        {/* Season summary strip */}
        {farmerDetail && selectedSeason && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">মৌসুম বিল</p>
              <p className="text-base font-bold">৳{(farmerDetail.calculatedCost ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">মোট পরিশোধ</p>
              <p className="text-base font-bold text-green-600">৳{(farmerDetail.totalPaid ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{due > 0 ? "বকেয়া" : "অগ্রিম"}</p>
              <p className={`text-base font-bold ${due > 0 ? "text-destructive" : "text-green-600"}`}>
                ৳{(due > 0 ? due : advance).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* New payment form */}
        {showForm && (
          <Card>
            <CardHeader><CardTitle>নতুন পেমেন্ট</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>পরিমাণ (৳)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paymentDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>তারিখ</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormLabel>পদ্ধতি</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="CASH">নগদ</SelectItem>
                            <SelectItem value="BANK">ব্যাংক</SelectItem>
                            <SelectItem value="MOBILE_BANKING">মোবাইল ব্যাংকিং</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ধরন</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="PAYMENT">পেমেন্ট</SelectItem>
                            <SelectItem value="ADJUSTMENT">সমন্বয়</SelectItem>
                            <SelectItem value="DEDUCTION">কর্তন</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="transactionReference" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Ref</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Payment list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>পেমেন্ট ইতিহাস ({totalElements}টি)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPaymentList}
                disabled={downloadingList || payments.length === 0}
              >
                {downloadingList ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                তালিকা প্রিন্ট
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">কোনো পেমেন্ট নেই।</div>
            ) : (
              <div>
                {payments.map((p, i) => (
                  <div
                    key={p.id}
                    className={`px-4 py-3 ${i < payments.length - 1 ? "border-b" : ""} ${p.isReversed ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: amount + date */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-lg font-bold ${p.isReversed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            ৳{p.amount.toLocaleString()}
                          </span>
                          <Badge className={`${methodColor[p.paymentMethod] || ""} text-xs`}>
                            {methodLabel[p.paymentMethod] || p.paymentMethod}
                          </Badge>
                          {p.paymentType !== "PAYMENT" && (
                            <Badge variant="outline" className="text-xs">
                              {typeLabel[p.paymentType] || p.paymentType}
                            </Badge>
                          )}
                          {p.isReversed && <Badge variant="destructive" className="text-xs">বাতিল</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{p.paymentDate}</p>
                        {p.transactionReference && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">Ref: {p.transactionReference}</p>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      {!p.isReversed && (
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="রসিদ প্রিন্ট"
                            onClick={() => handleDownloadInvoice(p)}
                            disabled={downloadingId === p.id}
                          >
                            {downloadingId === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Download className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="PNG ডাউনলোড"
                            onClick={() => handleDownloadInvoicePng(p)}
                            disabled={downloadingPngId === p.id}
                          >
                            {downloadingPngId === p.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Image className="w-3.5 h-3.5" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => setEditing({ id: p.id, amount: p.amount, reason: "" })}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="px-4 pb-3">
                  <PaginationBar
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    pageSize={PAGE_SIZE}
                    onPageChange={fetchData}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>পেমেন্ট সংশোধন</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>পরিমাণ</Label>
                <Input
                  type="number"
                  value={editing.amount}
                  onChange={(e) => setEditing({ ...editing, amount: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>কারণ (Reason)</Label>
                <Input
                  value={editing.reason}
                  onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
                  placeholder="সংশোধনের কারণ লিখুন"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy || !editing?.reason}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পেমেন্ট মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>
              ৳{deleting?.amount} ({deleting?.paymentDate}) মুছে যাবে।
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
};

export default FarmerPayments;
