import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { seasonApi, pumpApi } from "@/lib/api/client";
import type { Season, Pump } from "@/lib/api/types";
import { RefreshCw } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

const AdminSeasonList = () => {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) fetchPumps();
  }, [isLoading, isAuthenticated, user]);

  const fetchPumps = async () => {
    try {
      const data = await pumpApi.getAll();
      setPumps(data);
      if (data.length > 0) setSelectedPumpId(data[0].id);
    } catch {
      toast({ title: "Error", description: "Failed to fetch pumps", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (selectedPumpId && selectedYear) fetchSeasons();
  }, [selectedPumpId, selectedYear]);

  const fetchSeasons = async () => {
    if (!selectedPumpId) return;
    setLoading(true);
    try {
      setSeasons(await seasonApi.getByPumpAndYear(selectedPumpId, selectedYear));
    } catch {
      toast({ title: "Error", description: "Failed to fetch seasons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="মৌসুম তালিকা (অ্যাডমিন)"
        subtitle="Seasons — read-only view"
        navItems={adminNavItems}
        rightContent={<Button size="sm" variant="outline" onClick={fetchSeasons} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">পাম্প</p>
                <Select
                  value={selectedPumpId ? String(selectedPumpId) : ""}
                  onValueChange={(v) => setSelectedPumpId(Number(v))}
                >
                  <SelectTrigger className="w-48"><SelectValue placeholder="পাম্প নির্বাচন" /></SelectTrigger>
                  <SelectContent>
                    {pumps.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.pumpNameBengali}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">বছর</p>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>মৌসুম তালিকা ({seasons.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : seasons.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {selectedPumpId ? "নির্বাচিত পাম্প ও বছরে কোনো মৌসুম নেই।" : "একটি পাম্প নির্বাচন করুন।"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ধরন</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>শুরু</TableHead>
                      <TableHead>শেষ</TableHead>
                      <TableHead>অবস্থা</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.seasonKind && <Badge variant="outline">{s.seasonKind}</Badge>}</TableCell>
                        <TableCell className="font-medium">
                          {s.seasonNameBengali}
                          <span className="text-xs text-muted-foreground ml-1">({s.seasonName})</span>
                        </TableCell>
                        <TableCell className="text-sm">{s.startDate}</TableCell>
                        <TableCell className="text-sm">{s.endDate}</TableCell>
                        <TableCell>
                          {s.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Archived</Badge>}
                          {s.isCurrent && <Badge variant="outline" className="ml-1">Current</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSeasonList;
