import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { adminLandApi, assignmentApi } from "@/lib/api/client";
import type { Land, FarmerLandAssignment } from "@/lib/api/types";
import { MapPin, Users, RefreshCw } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "জমি", path: "/admin/lands" },
  { label: "ইউনিট মূল্য", path: "/admin/unit-prices" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminLandList = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [assignments, setAssignments] = useState<FarmerLandAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, selectedSeason, year, seasons, season } = usePumpContext();

  const currentSeasonId = selectedSeason?.id ?? null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") { navigate("/auth"); }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => { if (pumpId) fetchLands(); }, [pumpId]);
  useEffect(() => { if (pumpId && currentSeasonId) fetchAssignments(); }, [pumpId, currentSeasonId, year]);

  const fetchLands = async () => {
    if (!pumpId) return;
    setLoading(true);
    try { setLands(await adminLandApi.getByPump(pumpId)); }
    catch { toast({ title: "ত্রুটি", description: "জমির তালিকা আনতে ব্যর্থ", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchAssignments = async () => {
    if (!pumpId || !currentSeasonId) return;
    try { setAssignments(await assignmentApi.getAll(pumpId, currentSeasonId, year)); }
    catch { /* silent */ }
  };

  const getAssignment = useCallback((landId: number) =>
    assignments.find(a => a.landId === landId) ?? null, [assignments]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="জমি তালিকা (অ্যাডমিন)"
        subtitle="Read-only land view"
        navItems={adminNavItems}
        rightContent={
          <div className="flex gap-2 items-center">
            <PumpSelector />
            <Button size="sm" variant="outline" onClick={fetchLands} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Assignment Status Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              জমির বরাদ্দ অবস্থা — {season} / {year}
              {!currentSeasonId && <Badge variant="secondary">মৌসুম নির্বাচন করুন</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : lands.filter(l => l.isActive).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো জমি নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>দাগ/খতিয়ান</TableHead>
                      <TableHead>শতক / বিঘা</TableHead>
                      <TableHead>ট্যাগ</TableHead>
                      <TableHead>বরাদ্দ অবস্থা</TableHead>
                      <TableHead>কৃষক</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.filter(l => l.isActive).map((land) => {
                      const asgn = getAssignment(land.id);
                      return (
                        <TableRow key={land.id}>
                          <TableCell>{land.landmarkNumber}</TableCell>
                          <TableCell className="font-bold text-primary">{(land.sizeShatak ?? 0).toFixed(2)} শতক<br/><span className="text-xs text-muted-foreground font-normal">{((land.sizeShatak ?? 0)/33).toFixed(3)} বিঘা</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{land.tag ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={asgn ? "default" : "outline"}>
                              {asgn ? "বরাদ্দ" : "খালি"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {asgn ? (asgn.farmerName || `কৃষক #${asgn.farmerId}`) : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Lands Table (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              সকল জমির তালিকা ({lands.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : lands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো জমি নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>দাগ/খতিয়ান</TableHead>
                      <TableHead>শতক / বিঘা</TableHead>
                      <TableHead>ট্যাগ</TableHead>
                      <TableHead>অবস্থা</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.map((land) => {
                      return (
                        <TableRow key={land.id}>
                          <TableCell>{land.landmarkNumber}</TableCell>
                          <TableCell className="font-bold text-primary">{(land.sizeShatak ?? 0).toFixed(2)} শতক<br/><span className="text-xs text-muted-foreground font-normal">{((land.sizeShatak ?? 0)/33).toFixed(3)} বিঘা</span></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{land.tag ?? "-"}</TableCell>
                          <TableCell>
                            <Badge variant={land.isActive ? "default" : "secondary"}>
                              {land.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default AdminLandList;
