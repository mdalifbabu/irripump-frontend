import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { farmerPortalApi } from "@/lib/api/client";
import type { FarmerPortalData } from "@/lib/api/types";
import { Droplet, User, MapPin, CreditCard, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FarmerPortal = () => {
  const [farmerCode, setFarmerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [farmerData, setFarmerData] = useState<FarmerPortalData | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerCode.trim()) {
      toast({
        title: "ত্রুটি / Error",
        description: "Please enter your farmer code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await farmerPortalApi.verifyCode({ farmerCode: farmerCode.trim() });
      setFarmerData(data);
      toast({
        title: "সফল / Success",
        description: "Farmer verified successfully!",
      });
    } catch (error) {
      toast({
        title: "ত্রুটি / Error",
        description: error instanceof Error ? error.message : "Invalid farmer code",
        variant: "destructive",
      });
      setFarmerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFarmerData(null);
    setFarmerCode("");
  };

  if (farmerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Droplet className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">
                স্বাগতম / Welcome, {farmerData.farmer.nameBengali}
              </CardTitle>
              <CardDescription>
                Farmer Code: {farmerData.farmer.farmerCode}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Farmer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Farmer Information / কৃষক তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name (Bengali)</Label>
                <p className="font-medium">{farmerData.farmer.nameBengali}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Name (English)</Label>
                <p className="font-medium">{farmerData.farmer.nameEnglish}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Father's Name</Label>
                <p className="font-medium">{farmerData.farmer.fatherName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Village</Label>
                <p className="font-medium">{farmerData.farmer.village}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Mobile</Label>
                <p className="font-medium">{farmerData.farmer.mobile}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">NID</Label>
                <p className="font-medium">{farmerData.farmer.nidNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Paid / মোট পরিশোধ</CardTitle>
                <CreditCard className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ৳{farmerData.totalPaid.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Due / মোট বকেয়া</CardTitle>
                <CreditCard className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ৳{farmerData.totalDue.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Land Records / জমির রেকর্ড
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmerData.lands.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Land ID</TableHead>
                      <TableHead>Landmark</TableHead>
                      <TableHead>Size (Bigha)</TableHead>
                      <TableHead>Season</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmerData.lands.map((land) => (
                      <TableRow key={land.id}>
                        <TableCell>{land.landIdentificationNumber}</TableCell>
                        <TableCell>{land.landmarkNumber}</TableCell>
                        <TableCell>{land.sizeBigha.toFixed(2)}</TableCell>
                        <TableCell>{land.season}</TableCell>
                        <TableCell>{land.year}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No land records found</p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Payment History / পেমেন্ট ইতিহাস
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmerData.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmerData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">৳{payment.amount.toFixed(2)}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{payment.transactionReference || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              payment.paymentType === "PAYMENT"
                                ? "bg-green-100 text-green-700"
                                : payment.paymentType === "REFUND"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {payment.paymentType}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">No payment records found</p>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleReset} variant="outline" className="w-full">
            Logout / লগআউট
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ফার্মার পোর্টাল
          </CardTitle>
          <CardDescription className="text-base">
            Farmer Portal - আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="farmer-code" className="text-base">
                ফার্মার কোড দিন / Enter Farmer Code
              </Label>
              <Input
                id="farmer-code"
                type="text"
                placeholder="e.g., YAP-2026-BDNB4J"
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value.toUpperCase())}
                className="text-lg py-6 uppercase"
                required
              />
              <p className="text-sm text-muted-foreground">
                আপনার মোবাইল নম্বরে পাঠানো কোড দিন
              </p>
            </div>
            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              {loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন / Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerPortal;
