import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { farmerApi, paymentApi, reportsApi } from "@/lib/api/client";
import type { Farmer, Payment } from "@/lib/api/types";
import { CreditCard, ArrowLeft, Plus, Loader2, Download } from "lucide-react";

const createPaymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["CASH", "BKASH", "NAGAD", "BANK"]),
  transactionReference: z.string().optional(),
  paymentType: z.enum(["PAYMENT", "REFUND", "ADVANCE"]),
});

type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

const FarmerPayments = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const form = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      paymentType: "PAYMENT",
      transactionReference: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated && farmerId) {
      fetchData();
    }
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmerData, paymentsData] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        paymentApi.getByFarmer(parseInt(farmerId!)),
      ]);
      setFarmer(farmerData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreatePaymentFormData) => {
    try {
      setSubmitting(true);
      await paymentApi.create(parseInt(farmerId!), {
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference || undefined,
        paymentType: data.paymentType,
      });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      form.reset();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloading(true);
      const blob = await reportsApi.downloadInvoice(parseInt(farmerId!));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${farmer?.farmerCode || farmerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-green-500",
      BKASH: "bg-pink-500",
      NAGAD: "bg-orange-500",
      BANK: "bg-blue-500",
    };
    return <Badge className={colors[method] || ""}>{method}</Badge>;
  };

  const getPaymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      PAYMENT: "bg-green-500",
      REFUND: "bg-red-500",
      ADVANCE: "bg-blue-500",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/user/farmers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {farmer?.nameBengali || "Farmer"} - Payments
              </h1>
              <p className="text-sm text-muted-foreground">
                Code: {farmer?.farmerCode} | {farmer?.village}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownloadInvoice} disabled={downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Invoice
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Record New Payment / নতুন পেমেন্ট রেকর্ড</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount / পরিমাণ (৳)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date / তারিখ</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CASH">Cash / নগদ</SelectItem>
                              <SelectItem value="BKASH">bKash</SelectItem>
                              <SelectItem value="NAGAD">Nagad</SelectItem>
                              <SelectItem value="BANK">Bank / ব্যাংক</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Type / ধরন</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PAYMENT">Payment / পেমেন্ট</SelectItem>
                              <SelectItem value="ADVANCE">Advance / অগ্রিম</SelectItem>
                              <SelectItem value="REFUND">Refund / ফেরত</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transactionReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Ref (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Transaction ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Payment
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History / পেমেন্ট ইতিহাস</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No payments recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount (৳)</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.paymentDate}</TableCell>
                      <TableCell className="font-bold">৳{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                      <TableCell>{getPaymentTypeBadge(payment.paymentType)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.transactionReference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerPayments;
