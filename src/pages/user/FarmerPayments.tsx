import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, paymentApi, invoiceApi } from "@/lib/api/client";
import type { FarmerDetailResponse } from "@/lib/api/types";
import { buildInvoicePdf } from "@/lib/invoice/buildInvoicePdf";
import { buildPaymentListPdf } from "@/lib/invoice/buildPaymentListPdf";
import type { Farmer, Payment } from "@/lib/api/types";
import { Plus, Loader2, Download, Pencil, Trash2, FileText } from "lucide-react";
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
  const [downloadingList, setDownloadingList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: number; amount: number; reason: string } | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { selectedSeason } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: undefined, paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "CASH" as const, paymentType: "PAYMENT" as const, transactionReference: "" },
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
        paymentApi.getByFarmerPaged(id, page, PAGE_SIZE, selectedSeason?.id),
        selectedSeason?.id
          ? farmerApi.getDetail(id, selectedSeason.id, selectedSeason.year).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPayments(result.content);
      setCurrentPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setFarmerDetail(detail);
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await paymentApi.create(parseInt(farmerId!), { ...(data as Required<FormData>), transactionReference: data.transactionReference || undefined }, selectedSeason?.id);
      toast({ title: "পেমেন্ট রেকর্ড হয়েছে" });
      form.reset(); setShowForm(false); fetchData(0);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await paymentApi.update(editing.id, { amount: editing.amount, reason: editing.reason });
      toast({ title: "আপডেট সফল" });
      setEditing(null); fetchData(currentPage);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await paymentApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null); fetchData(currentPage);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDownloadInvoice = async (payment: Payment) => {
    setDownloadingId(payment.id);
    try {
      const data = await invoiceApi.get(payment.id);
      buildInvoicePdf(data).save(`invoice_${data.farmer.identifier}_${data.invoiceNo}.pdf`);
      toast({ title: "ইনভয়েস ডাউনলোড হয়েছে" });
    } catch (e: any) { toast({ title: "Error", description: e.message || "Failed to download invoice", variant: "destructive" }); }
    finally { setDownloadingId(null); }
  };

  const handleDownloadPaymentList = () => {
    if (!farmer) return;
    setDownloadingList(true);
    try {
      buildPaymentListPdf({
        farmerName: farmer.nameBengali,
        farmerCode: farmer.farmerCode,
        pumpName: farmer.pumpName ?? "",
        seasonName: selectedSeason?.seasonName,
        year: selectedSeason?.year,
        payments,
        calculatedCost: farmerDetail?.calculatedCost,
        totalLandShatak: farmerDetail?.totalLandSizeShatak ?? undefined,
        dueAmount: farmerDetail?.dueAmount,
        advanceAmount: farmerDetail?.advanceAmount,
      }).save(`payments_${farmer.farmerCode}${selectedSeason ? `_${selectedSeason.seasonName}_${selectedSeason.year}` : ""}.pdf`);
    } finally {
      setDownloadingList(false);
    }
  };

  const methodLabel: Record<string, string> = { CASH: "নগদ", BANK: "ব্যাংক", MOBILE_BANKING: "মোবাইল ব্যাংকিং" };
  const methodColor: Record<string, string> = { CASH: "bg-green-500", BANK: "bg-blue-500", MOBILE_BANKING: "bg-pink-500" };
  const methodBadge = (m: string) => <Badge className={methodColor[m] || ""}>{methodLabel[m] || m}</Badge>;

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title={`${farmer?.nameBengali || "কৃষক"} — পেমেন্ট`}
        subtitle={`${farmer?.farmerCode || ""}`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />পেমেন্ট</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle>নতুন পেমেন্ট</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>পরিমাণ (৳)</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="paymentDate" render={({ field }) => (<FormItem><FormLabel>তারিখ</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (<FormItem><FormLabel>পদ্ধতি</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="CASH">নগদ</SelectItem><SelectItem value="BANK">ব্যাংক</SelectItem><SelectItem value="MOBILE_BANKING">মোবাইল ব্যাংকিং</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paymentType" render={({ field }) => (<FormItem><FormLabel>ধরন</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="PAYMENT">পেমেন্ট</SelectItem><SelectItem value="ADJUSTMENT">সমন্বয়</SelectItem><SelectItem value="DEDUCTION">কর্তন</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="transactionReference" render={({ field }) => (<FormItem><FormLabel>Transaction Ref</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
                    <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>পেমেন্ট ইতিহাস ({totalElements}টি)</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadPaymentList} disabled={downloadingList || payments.length === 0}>
                {downloadingList ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                পেমেন্ট তালিকা
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো পেমেন্ট নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>পরিমাণ</TableHead>
                      <TableHead className="hidden md:table-cell">পদ্ধতি</TableHead>
                      <TableHead className="hidden md:table-cell">ধরন</TableHead>
                      <TableHead className="hidden md:table-cell">Ref</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.paymentDate}</TableCell>
                        <TableCell className="font-bold">৳{p.amount.toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{methodBadge(p.paymentMethod)}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline">{p.paymentType}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{p.transactionReference || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" title="ইনভয়েস" onClick={() => handleDownloadInvoice(p)} disabled={downloadingId === p.id}>
                              {downloadingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ id: p.id, amount: p.amount, reason: "" })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PAGE_SIZE}
                  onPageChange={fetchData}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>পেমেন্ট সংশোধন</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>পরিমাণ</Label><Input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value === "" ? undefined : parseFloat(e.target.value) })} /></div>
              <div><Label>কারণ (Reason)</Label><Input value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} placeholder="সংশোধনের কারণ লিখুন" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy || !editing?.reason}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পেমেন্ট মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>৳{deleting?.amount} ({deleting?.paymentDate}) মুছে যাবে।</AlertDialogDescription>
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

export default FarmerPayments;