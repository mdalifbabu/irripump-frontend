import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { seasonApi, adminOverrideApi } from "@/lib/api/client";
import type { Season } from "@/lib/api/types";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";
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

const AdminSeasonList = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [hardDeleting, setHardDeleting] = useState<Season | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) fetchSeasons();
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchSeasons = async () => {
    setLoading(true);
    try { setSeasons(await seasonApi.getAll()); }
    catch { toast({ title: "Error", description: "Failed to fetch seasons", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleHardDelete = async () => {
    if (!hardDeleting || !reason.trim()) return;
    setBusy(true);
    try {
      await adminOverrideApi.hardDeleteSeason(hardDeleting.id, { reason: reason.trim() });
      toast({ title: "স্থায়ীভাবে মুছে ফেলা হয়েছে" });
      setHardDeleting(null); setReason("");
      await fetchSeasons();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="সকল মৌসুম"
        subtitle="Seasons across all pumps"
        navItems={adminNavItems}
        rightContent={<Button size="sm" variant="outline" onClick={fetchSeasons} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader><CardTitle>মৌসুম তালিকা ({seasons.length})</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              অপারেটরদের ডিলিট শুধু আর্কাইভ করে (isActive=false)। স্থায়ী মুছে ফেলা শুধু এডমিনের জন্য — এর সাথে সংশ্লিষ্ট সব দেনা, বরাদ্দ ও তালিকাভুক্তিও মুছে যাবে।
            </p>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pump</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Kind</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.pumpNameEnglish ?? `#${s.pumpId}`}</TableCell>
                        <TableCell>{s.year}</TableCell>
                        <TableCell>{s.seasonKind && <Badge variant="outline">{s.seasonKind}</Badge>}</TableCell>
                        <TableCell className="font-medium">{s.seasonName}</TableCell>
                        <TableCell>
                          {s.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Archived</Badge>}
                          {s.isCurrent && <Badge variant="outline" className="ml-1">Current</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setHardDeleting(s)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      <Dialog open={!!hardDeleting} onOpenChange={(o) => { if (!o) { setHardDeleting(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>মৌসুম স্থায়ীভাবে মুছুন</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{hardDeleting?.seasonName}" ({hardDeleting?.year}) এবং এর সব দেনা, বরাদ্দ ও তালিকাভুক্তি স্থায়ীভাবে মুছে যাবে। এই কাজ অপরিবর্তনীয়।
          </p>
          <div>
            <Label>কারণ (বাধ্যতামূলক)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="হার্ড ডিলিটের কারণ লিখুন..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setHardDeleting(null); setReason(""); }}>বাতিল</Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={busy || !reason.trim()}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}স্থায়ীভাবে মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSeasonList;
