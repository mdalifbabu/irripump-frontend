import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { farmerPortalApi } from "@/lib/api/client";
import type { FarmerPortalData, SeasonLedger } from "@/lib/api/types";
import { Droplet, User, MapPin, CreditCard, BookOpen, ArrowLeft, Wallet } from "lucide-react";
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
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [farmerData, setFarmerData] = useState<FarmerPortalData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill code from URL param but DO NOT auto-verify — user must supply mobile
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) setFarmerCode(code.toUpperCase());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerCode.trim()) {
      toast({ title: "ত্রুটি", description: "কৃষক কোড দিন", variant: "destructive" });
      return;
    }
    if (!mobile.trim()) {
      toast({ title: "ত্রুটি", description: "মোবাইল নম্বর দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await farmerPortalApi.verifyCode({ farmerCode: farmerCode.trim(), mobile: mobile.trim() });
      setFarmerData(data);
    } catch (error) {
      toast({
        title: "ত্রুটি / Error",
        description: error instanceof Error ? error.message : "কোড বা মোবাইল নম্বর মেলেনি",
        variant: "destructive",
      });
      setFarmerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setFarmerData(null); setFarmerCode(""); setMobile(""); };

  if (farmerData) {
    const currentSeasonLabel = farmerData.currentSeasonNameBengali
      ? `${farmerData.currentSeasonNameBengali} ${farmerData.currentSeasonYear ?? ""}`
      : farmerData.currentSeasonName
        ? `${farmerData.currentSeasonName} ${farmerData.currentSeasonYear ?? ""}`
        : "—";

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />হোম পেজে ফিরুন
          </Button>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                <Droplet className="w-8 h-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">স্বাগতম, {farmerData.farmer.nameBengali}</CardTitle>
              <CardDescription>Farmer Code: {farmerData.farmer.farmerCode}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />কৃষক তথ্য / Farmer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-muted-foreground">নাম (বাংলা)</Label><p className="font-medium">{farmerData.farmer.nameBengali}</p></div>
              <div><Label className="text-muted-foreground">Name (English)</Label><p className="font-medium">{farmerData.farmer.nameEnglish}</p></div>
              <div><Label className="text-muted-foreground">পিতার নাম</Label><p className="font-medium">{farmerData.farmer.fatherName}</p></div>
              <div><Label className="text-muted-foreground">গ্রাম</Label><p className="font-medium">{farmerData.farmer.village}</p></div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">মোট পরিশোধ / Total Paid</CardTitle>
                <CreditCard className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">৳{farmerData.totalPaid.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">মোট বকেয়া / Total Due</CardTitle>
                <Wallet className="w-4 h-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">৳{farmerData.totalDue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">বর্তমান মৌসুম + পূর্ববর্তী বকেয়া</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">সর্বমোট বকেয়া / Outstanding</CardTitle>
                <Wallet className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">৳{(farmerData.totalOutstanding ?? farmerData.totalDue).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">সমস্ত মৌসুমের মোট বকেয়া</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />জমির রেকর্ড / Land Records
              </CardTitle>
              {farmerData.currentSeasonId && (
                <p className="text-sm text-muted-foreground">
                  বর্তমান মৌসুম: <span className="font-semibold text-primary">{currentSeasonLabel}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              {farmerData.lands.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>দাগ নং</TableHead>
                      <TableHead>আকার (শতক)</TableHead>
                      <TableHead>বর্তমান মৌসুম</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmerData.lands.map((land) => (
                      <TableRow key={land.id}>
                        <TableCell>{land.landmarkNumber}</TableCell>
                        <TableCell>
                          <span className="font-bold">{(land.sizeShatak ?? 0).toFixed(2)} শতক</span>
                          <br /><span className="text-xs text-muted-foreground">{((land.sizeShatak ?? 0) / 33).toFixed(3)} বিঘা</span>
                        </TableCell>
                        <TableCell>
                          {farmerData.currentSeasonId ? (
                            <Badge variant="outline" className="text-primary border-primary">{currentSeasonLabel}</Badge>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">কোনো জমির রেকর্ড নেই</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />মৌসুমভিত্তিক হিসাব / Due Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!farmerData.seasonLedgers || farmerData.seasonLedgers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">এখনো কোনো দেনা তৈরি হয়নি</p>
              ) : (
                farmerData.seasonLedgers.map((sl) => (
                  <SeasonLedgerRow key={sl.seasonId} sl={sl} isCurrentSeason={sl.seasonId === farmerData.currentSeasonId} />
                ))
              )}
            </CardContent>
          </Card>

          {farmerData.currentSeasonId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />বর্তমান মৌসুমের পেমেন্ট
                </CardTitle>
                <p className="text-xs text-muted-foreground">শুধু {currentSeasonLabel} — পূর্ববর্তী মৌসুমের পেমেন্ট উপরের লেজারে</p>
              </CardHeader>
              <CardContent>
                {farmerData.payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>তারিখ</TableHead>
                        <TableHead>পরিমাণ</TableHead>
                        <TableHead>পদ্ধতি</TableHead>
                        <TableHead>রেফারেন্স</TableHead>
                        <TableHead>ধরন</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmerData.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.paymentDate).toLocaleDateString("en-GB")}</TableCell>
                          <TableCell className="font-medium">৳{payment.amount.toFixed(2)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{payment.transactionReference || "—"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              payment.paymentType === "PAYMENT" ? "bg-green-100 text-green-700"
                                : payment.paymentType === "DEDUCTION" ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {payment.paymentType === "PAYMENT" ? "পেমেন্ট" : payment.paymentType === "ADJUSTMENT" ? "সমন্বয়" : "কর্তন"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">এই মৌসুমে এখনো কোনো পেমেন্ট নেই</p>
                )}
              </CardContent>
            </Card>
          )}

          <Button onClick={handleReset} variant="outline" className="w-full">লগআউট / Logout</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />হোম পেজে ফিরুন
        </Button>
        <Card className="shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Droplet className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">কৃষক পোর্টাল</CardTitle>
            <CardDescription className="text-base">আপনার কোড ও মোবাইল নম্বর দিয়ে বকেয়া দেখুন</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="farmer-code">কৃষক কোড / Farmer Code</Label>
                <Input
                  id="farmer-code"
                  type="text"
                  placeholder="যেমন: BK00123"
                  value={farmerCode}
                  onChange={(e) => setFarmerCode(e.target.value.toUpperCase())}
                  className="text-lg py-6 uppercase"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">মোবাইল নম্বর / Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/[^0-9+]/g, ""))}
                  className="text-lg py-6"
                  required
                  autoComplete="tel"
                />
                <p className="text-sm text-muted-foreground">নিবন্ধিত মোবাইল নম্বর দিন</p>
              </div>
              <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                {loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন / Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function SeasonLedgerRow({ sl, isCurrentSeason }: { sl: SeasonLedger; isCurrentSeason: boolean }) {
  const isPaid = sl.outstanding <= 0;
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${
      isCurrentSeason ? "border-primary bg-primary/5"
        : isPaid ? "border-green-200 bg-green-50/50"
        : "border-orange-200 bg-orange-50/50"
    }`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{sl.seasonName} — {sl.year}</span>
          {isCurrentSeason && <Badge className="text-xs bg-primary">বর্তমান মৌসুম</Badge>}
          {!isCurrentSeason && isPaid && <Badge variant="outline" className="text-xs text-green-700 border-green-300">পরিশোধিত</Badge>}
        </div>
        <Badge variant={isPaid ? "default" : "destructive"} className={isPaid ? "bg-green-600" : ""}>
          {isPaid ? "পরিশোধিত" : `৳${sl.outstanding.toFixed(0)} বকেয়া`}
        </Badge>
      </div>
      <div className="grid grid-cols-3 text-sm gap-2">
        <div><p className="text-muted-foreground text-xs">দেনা</p><p className="font-semibold">৳{sl.billed.toFixed(2)}</p></div>
        <div><p className="text-muted-foreground text-xs">আদায়</p><p className="font-semibold text-green-700">৳{sl.collected.toFixed(2)}</p></div>
        <div><p className="text-muted-foreground text-xs">বকেয়া</p><p className={`font-semibold ${sl.outstanding > 0 ? "text-red-600" : "text-green-700"}`}>৳{sl.outstanding.toFixed(2)}</p></div>
      </div>
      {sl.allocations.length > 0 && (
        <div className="border-t pt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">পেমেন্ট বিস্তারিত</p>
          {sl.allocations.map((a, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{a.paymentDate}</span>
              <Badge variant="outline" className="text-xs">{a.paymentMethod}</Badge>
              <span className="font-medium text-green-700">+৳{a.amountApplied.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      {sl.allocations.length === 0 && (
        <p className="text-xs text-muted-foreground italic">এখনো কোনো পেমেন্ট নেই</p>
      )}
      {!isCurrentSeason && (
        <p className="text-xs text-muted-foreground italic border-t pt-2">পূর্ববর্তী মৌসুম — শুধুমাত্র দেখার জন্য</p>
      )}
    </div>
  );
}

export default FarmerPortal;
