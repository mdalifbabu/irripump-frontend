import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { pumpApi, userApi } from "@/lib/api/client";
import type { Pump, User } from "@/lib/api/types";
import { Plus, RefreshCw, Pencil, Trash2, Loader2, UserCog } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const PumpList = () => {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pump | null>(null);
  const [deleting, setDeleting] = useState<Pump | null>(null);
  const [reassigning, setReassigning] = useState<Pump | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [hardDeleting, setHardDeleting] = useState<Pump | null>(null);
  const [hardDeleteReason, setHardDeleteReason] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { refreshPumps } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) { fetchPumps(); fetchOperators(); }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchPumps = async () => {
    setLoading(true);
    try {
      const data = await pumpApi.getAll();
      setPumps(data);
    } catch { toast({ title: "Error", description: "Failed to fetch pumps", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const fetchOperators = async () => {
    try { setOperators(await userApi.getAll()); } catch { /* ignore */ }
  };

  const handleReassign = async () => {
    if (!reassigning || !selectedOperatorId) return;
    setBusy(true);
    try {
      await pumpApi.reassign(reassigning.id, Number(selectedOperatorId));
      toast({ title: "পুনর্বরাদ্দ সফল" });
      setReassigning(null); setSelectedOperatorId("");
      await fetchPumps();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleHardDelete = async () => {
    if (!hardDeleting || !hardDeleteReason.trim()) return;
    setBusy(true);
    try {
      await pumpApi.hardDelete(hardDeleting.id, hardDeleteReason.trim());
      toast({ title: "স্থায়ীভাবে মুছে ফেলা হয়েছে" });
      setHardDeleting(null); setHardDeleteReason("");
      await fetchPumps();
      await refreshPumps();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await pumpApi.update(editing.id, {
        pumpNameEnglish: editing.pumpNameEnglish,
        pumpNameBengali: editing.pumpNameBengali,
        location: editing.location,
        installationDate: editing.installationDate,
        status: editing.status,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      await fetchPumps();
      await refreshPumps();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await pumpApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      await fetchPumps();
      await refreshPumps();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge className="bg-green-500">Active</Badge>;
      case "INACTIVE": return <Badge variant="secondary">Inactive</Badge>;
      case "MAINTENANCE": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Maintenance</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="পাম্প পরিচালনা"
        subtitle="Pump Management"
        navItems={adminNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" variant="outline" onClick={fetchPumps} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
            <Button size="sm" onClick={() => navigate("/admin/pumps/create")}><Plus className="w-4 h-4 mr-1" />নতুন</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader><CardTitle>সকল পাম্প ({pumps.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : pumps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pumps found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name (Bengali)</TableHead>
                      <TableHead className="hidden md:table-cell">Name (English)</TableHead>
                      <TableHead className="hidden md:table-cell">Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pumps.map((pump) => (
                      <TableRow key={pump.id}>
                        <TableCell className="font-medium">{pump.pumpNameBengali}</TableCell>
                        <TableCell className="hidden md:table-cell">{pump.pumpNameEnglish}</TableCell>
                        <TableCell className="hidden md:table-cell">{pump.location}</TableCell>
                        <TableCell>{getStatusBadge(pump.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" title="সম্পাদনা" onClick={() => setEditing({ ...pump })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8" title="অপারেটর পুনর্বরাদ্দ" onClick={() => { setReassigning(pump); setSelectedOperatorId(""); }}><UserCog className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" title="আর্কাইভ (সফট ডিলিট)" onClick={() => setDeleting(pump)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="destructive" className="h-8 text-xs" title="স্থায়ীভাবে মুছুন" onClick={() => { setHardDeleting(pump); setHardDeleteReason(""); }}>Hard Delete</Button>
                          </div>
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>পাম্প সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name (Bengali)</Label><Input value={editing.pumpNameBengali} onChange={(e) => setEditing({ ...editing, pumpNameBengali: e.target.value })} /></div>
              <div><Label>Name (English)</Label><Input value={editing.pumpNameEnglish} onChange={(e) => setEditing({ ...editing, pumpNameEnglish: e.target.value })} /></div>
              <div><Label>Location</Label><Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
              <div><Label>Installation Date</Label><Input type="date" value={editing.installationDate} onChange={(e) => setEditing({ ...editing, installationDate: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v: any) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পাম্প মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.pumpNameBengali}" এবং সংশ্লিষ্ট সব ডাটা মুছে যাবে। এই কাজ অপরিবর্তনীয়।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reassigning} onOpenChange={(o) => !o && setReassigning(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>অপারেটর পুনর্বরাদ্দ</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{reassigning?.pumpNameBengali}" একজন নতুন অপারেটরকে বরাদ্দ করা হবে। বিদ্যমান বরাদ্দ নিষ্ক্রিয় হবে। পাম্পের সব ইতিহাস (কৃষক, মৌসুম, দেনা) পাম্পের সাথেই থাকবে।
          </p>
          <div>
            <Label>নতুন অপারেটর</Label>
            <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
              <SelectTrigger><SelectValue placeholder="অপারেটর বেছে নিন" /></SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={String(op.id)}>{op.fullName} ({op.username})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassigning(null)}>বাতিল</Button>
            <Button onClick={handleReassign} disabled={busy || !selectedOperatorId}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}পুনর্বরাদ্দ করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hardDeleting} onOpenChange={(o) => { if (!o) { setHardDeleting(null); setHardDeleteReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>পাম্প স্থায়ীভাবে মুছুন</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{hardDeleting?.pumpNameBengali}" এবং এর সব কৃষক, মৌসুম, দেনা ও পেমেন্ট স্থায়ীভাবে মুছে যাবে। এই কাজ অপরিবর্তনীয়। সাধারণ আর্কাইভের জন্য উপরের ট্র্যাশ আইকন ব্যবহার করুন।
          </p>
          <div>
            <Label>কারণ (বাধ্যতামূলক)</Label>
            <Textarea value={hardDeleteReason} onChange={(e) => setHardDeleteReason(e.target.value)} placeholder="হার্ড ডিলিটের কারণ লিখুন..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setHardDeleting(null); setHardDeleteReason(""); }}>বাতিল</Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={busy || !hardDeleteReason.trim()}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}স্থায়ীভাবে মুছুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PumpList;