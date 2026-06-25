import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { dashboardApi } from "@/lib/api/client";
import type { YearlyDashboard } from "@/lib/api/types";
import { Users, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import { userNavItems } from "@/lib/navItems";

const UserDashboard = () => {
  const [yearly, setYearly] = useState<YearlyDashboard | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, year, loadingPumps } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "USER") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => {
    if (!pumpId || !year) return;
    dashboardApi.getYearlySummary(pumpId, year)
      .then(setYearly)
      .catch(() => {});
  }, [pumpId, year]);

  if (isLoading || loadingPumps) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const fmt = (n: number) => `৳${Number(n).toLocaleString("bn-BD", { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="অপারেটর ড্যাশবোর্ড"
        subtitle="Pump Operator Panel"
        navItems={userNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Yearly summary cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">মোট আয় ({year})</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold text-green-600">
                {yearly ? fmt(yearly.totalIncome) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">মোট বকেয়া ({year})</CardTitle>
              <TrendingDown className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-3xl font-bold text-red-600">
                {yearly ? fmt(yearly.totalDue) : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Season-wise breakdown */}
        {yearly && yearly.seasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                মৌসুমভিত্তিক সারাংশ — {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>মৌসুম</TableHead>
                      <TableHead className="text-right">বিলকৃত</TableHead>
                      <TableHead className="text-right">সংগ্রহিত</TableHead>
                      <TableHead className="text-right">বকেয়া</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearly.seasons.map((s) => (
                      <TableRow key={s.seasonId}>
                        <TableCell>
                          <div className="font-medium">{s.seasonNameBengali}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {s.seasonName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(s.totalBilled)}</TableCell>
                        <TableCell className="text-right text-green-600">{fmt(s.totalCollected)}</TableCell>
                        <TableCell className="text-right text-red-600">{fmt(s.totalOutstanding)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardHeader><CardTitle>দ্রুত কার্যক্রম</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
              onClick={() => navigate("/user/farmers")}
            >
              <Users className="w-4 h-4" />কৃষক পরিচালনা
            </button>
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
              onClick={() => navigate("/user/seasons")}
            >
              <DollarSign className="w-4 h-4" />মৌসুম ব্যবস্থাপনা
            </button>
            <button
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-accent text-sm transition-colors"
              onClick={() => navigate("/user/unit-prices")}
            >
              <TrendingUp className="w-4 h-4" />ইউনিট মূল্য
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
