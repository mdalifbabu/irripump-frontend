import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ledgerApi } from "@/lib/api/client";
import type { LedgerResponse, SeasonLedger } from "@/lib/api/types";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { userNavItems } from "@/lib/navItems";



const FarmerLedger = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!farmerId) return;
    (async () => {
      setLoading(true);
      try {
        setLedger(await ledgerApi.getLedger(Number(farmerId)));
      } catch {
        toast({ title: "Error", description: "Could not load ledger", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId]);

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="পেমেন্ট খাতা"
        subtitle={ledger ? `${ledger.nameBengali} — ${ledger.farmerCode}` : ""}
        navItems={userNavItems}
        rightContent={
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />ফিরে যান
          </Button>
        }
      />

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
        {!ledger ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">কোনো লেজার পাওয়া যায়নি</CardContent></Card>
        ) : (
          <>
            {/* Credit balance card */}
            {ledger.creditBalance > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="flex items-center gap-3 py-4">
                  <Wallet className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">অগ্রিম জমা (অনুবন্টিত)</p>
                    <p className="text-xl font-bold text-green-800">৳{ledger.creditBalance.toFixed(2)}</p>
                    <p className="text-xs text-green-600">পরবর্তী দেনায় স্বয়ংক্রিয়ভাবে কাটা যাবে</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard
                label="মোট দেনা"
                value={ledger.seasons.reduce((s, r) => s + r.billed, 0)}
                icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
                color="text-orange-700"
              />
              <SummaryCard
                label="মোট আদায়"
                value={ledger.seasons.reduce((s, r) => s + r.collected, 0)}
                icon={<TrendingDown className="w-4 h-4 text-green-500" />}
                color="text-green-700"
              />
              <SummaryCard
                label="বকেয়া"
                value={ledger.seasons.reduce((s, r) => s + r.outstanding, 0)}
                icon={<Wallet className="w-4 h-4 text-red-500" />}
                color="text-red-700"
              />
            </div>

            {/* Per-season ladder */}
            {ledger.seasons.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">এখনো কোনো দেনা তৈরি হয়নি</CardContent></Card>
            ) : (
              ledger.seasons.map((sl) => <SeasonLedgerCard key={sl.seasonId} sl={sl} />)
            )}
          </>
        )}
      </main>
    </div>
  );
};

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`text-lg font-bold ${color}`}>৳{value.toFixed(0)}</p>
      </CardContent>
    </Card>
  );
}

function SeasonLedgerCard({ sl }: { sl: SeasonLedger }) {
  const isPaid = sl.outstanding <= 0;
  return (
    <Card className={isPaid ? "border-green-200" : "border-orange-200"}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            {sl.seasonName} — {sl.year}
          </CardTitle>
          <Badge variant={isPaid ? "default" : "destructive"}>
            {isPaid ? "পরিশোধিত" : `৳${sl.outstanding.toFixed(0)} বকেয়া`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Season financials */}
        <div className="grid grid-cols-3 text-sm gap-2">
          <div><p className="text-muted-foreground">দেনা</p><p className="font-semibold">৳{sl.billed.toFixed(2)}</p></div>
          <div><p className="text-muted-foreground">আদায়</p><p className="font-semibold text-green-700">৳{sl.collected.toFixed(2)}</p></div>
          <div><p className="text-muted-foreground">বকেয়া</p><p className={`font-semibold ${sl.outstanding > 0 ? "text-red-600" : "text-green-700"}`}>৳{sl.outstanding.toFixed(2)}</p></div>
        </div>

        {/* Payment allocation rows */}
        {sl.allocations.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">পেমেন্ট বিস্তারিত</p>
            {sl.allocations.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{a.paymentDate}</span>
                  <Badge variant="outline" className="text-xs">{a.paymentMethod}</Badge>
                </div>
                <span className="font-medium text-green-700">+৳{a.amountApplied.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        {sl.allocations.length === 0 && (
          <p className="text-xs text-muted-foreground italic">এখনো কোনো পেমেন্ট নেই</p>
        )}
      </CardContent>
    </Card>
  );
}

export default FarmerLedger;
