import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { paymentApi, invoiceApi } from "@/lib/api/client";
import type { PaymentResponse } from "@/lib/api/types";
import { buildInvoicePdf } from "@/lib/invoice/buildInvoicePdf";
import { buildPaymentListPdf } from "@/lib/invoice/buildPaymentListPdf";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";
import { Download, FileText, Loader2, Search, X, CalendarDays } from "lucide-react";

const PAGE_SIZE = 20;
const fmt = (n: number) => `৳${Number(n).toLocaleString("bn-BD")}`;
const methodLabel: Record<string, string> = { CASH: "নগদ", BANK: "ব্যাংক", MOBILE_BANKING: "মোবাইল ব্যাংকিং" };
const typeLabel: Record<string, string> = { PAYMENT: "পেমেন্ট", ADJUSTMENT: "সমন্বয়", DEDUCTION: "কর্তন" };

const PaymentList = () => {
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [downloadingList, setDownloadingList] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [farmerName, setFarmerName] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [reference, setReference] = useState("");
  const [showDate, setShowDate] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, pumps, season, year, selectedSeason } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "USER") { navigate("/auth"); return; }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => { if (pumpId) fetchPayments(0); }, [pumpId, selectedSeason?.id]);

  const fetchPayments = async (
    page: number,
    overrides?: { farmerName?: string; paymentDate?: string; reference?: string }
  ) => {
    if (!pumpId) return;
    setLoading(true);
    try {
      const fn = overrides?.farmerName ?? farmerName;
      const pd = overrides?.paymentDate ?? paymentDate;
      const ref = overrides?.reference ?? reference;
      const result = await paymentApi.getByPumpPaged(pumpId, page, PAGE_SIZE, {
        farmerName: fn || undefined,
        paymentDate: pd || undefined,
        reference: ref || undefined,
        seasonId: selectedSeason?.id,
      });
      setPayments(result.content);
      setCurrentPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast({ title: "ত্রুটি", description: "পেমেন্ট তালিকা আনতে ব্যর্থ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchPayments(0);

  const handleClear = () => {
    setFarmerName("");
    setPaymentDate("");
    setReference("");
    setShowDate(false);
    fetchPayments(0, { farmerName: "", paymentDate: "", reference: "" });
  };

  const pumpName = pumps.find(p => p.id === pumpId)?.pumpNameBengali ?? "";

  const handleDownloadInvoice = async (payment: PaymentResponse) => {
    setDownloadingId(payment.id);
    try {
      const data = await invoiceApi.get(payment.id);
      buildInvoicePdf(data).save(`invoice_${data.farmer.identifier}_${data.invoiceNo}.pdf`);
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message || "ইনভয়েস ডাউনলোড ব্যর্থ", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadList = () => {
    setDownloadingList(true);
    try {
      buildPaymentListPdf({
        pumpName,
        seasonName: season,
        year,
        payments: payments.map(p => ({
          id: p.id,
          farmerId: p.farmerId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          transactionReference: p.transactionReference,
          paymentType: p.paymentType,
          adjustmentReason: p.adjustmentReason,
          isReversed: p.isReversed,
        } as any)),
      }).save(`payments_${pumpName || pumpId}_${season}_${year}.pdf`);
    } finally {
      setDownloadingList(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="পেমেন্ট তালিকা"
        subtitle={`${season} / ${year}`}
        navItems={userNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search bar */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="কৃষকের নাম দিয়ে খুঁজুন..."
                value={farmerName}
                onChange={e => setFarmerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="flex-1 min-w-[160px]"
              />
              <Input
                placeholder="রেফারেন্স..."
                value={reference}
                onChange={e => setReference(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-36"
              />
              <Button
                size="sm"
                variant={showDate ? "secondary" : "outline"}
                onClick={() => {
                  if (showDate) { setPaymentDate(""); fetchPayments(0, { paymentDate: "" }); }
                  setShowDate(v => !v);
                }}
                title={showDate ? "তারিখ ফিল্টার সরান" : "তারিখ দিয়ে ফিল্টার করুন"}
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                তারিখ
                {paymentDate && <span className="ml-1 text-xs opacity-70">{paymentDate}</span>}
              </Button>
              <Button size="sm" onClick={handleSearch}><Search className="w-4 h-4 mr-1" />খুঁজুন</Button>
              {(farmerName || paymentDate || reference) && (
                <Button size="sm" variant="ghost" onClick={handleClear}><X className="w-4 h-4 mr-1" />মুছুন</Button>
              )}
            </div>
            {showDate && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-44"
                />
                {paymentDate && (
                  <Button size="sm" variant="ghost" onClick={() => { setPaymentDate(""); fetchPayments(0, { paymentDate: "" }); }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
                <span className="text-xs text-muted-foreground">নির্দিষ্ট তারিখে ফিল্টার (ঐচ্ছিক)</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">মোট পেমেন্ট: {totalElements}টি</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>সকল পেমেন্ট (সাম্প্রতিক প্রথমে)</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadList} disabled={downloadingList || payments.length === 0}>
                {downloadingList ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                তালিকা ডাউনলোড
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : payments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">কোনো পেমেন্ট পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>তারিখ</TableHead>
                      <TableHead>কৃষক</TableHead>
                      <TableHead>পরিমাণ</TableHead>
                      <TableHead>ধরন</TableHead>
                      <TableHead>পদ্ধতি</TableHead>
                      <TableHead className="hidden md:table-cell">রেফারেন্স</TableHead>
                      <TableHead>অবস্থা</TableHead>
                      <TableHead>ডাউনলোড</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id} className={p.isReversed ? "opacity-50" : ""}>
                        <TableCell className="whitespace-nowrap">{p.paymentDate}</TableCell>
                        <TableCell>
                          <Link
                            to={`/user/farmers/${p.farmerId}`}
                            className="text-primary underline-offset-2 hover:underline font-medium"
                          >
                            {p.farmerName || p.farmerCode || p.farmerId}
                          </Link>
                        </TableCell>
                        <TableCell className="font-bold">{fmt(p.amount)}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabel[p.paymentType] ?? p.paymentType}</Badge></TableCell>
                        <TableCell className="text-sm">{methodLabel[p.paymentMethod] ?? p.paymentMethod}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.transactionReference ?? "-"}</TableCell>
                        <TableCell>
                          {p.isReversed
                            ? <Badge variant="destructive">বাতিল</Badge>
                            : <Badge variant="default">সক্রিয়</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="outline" className="h-7 w-7" title="ইনভয়েস" onClick={() => handleDownloadInvoice(p)} disabled={downloadingId === p.id}>
                            {downloadingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          </Button>
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
                  onPageChange={fetchPayments}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentList;
