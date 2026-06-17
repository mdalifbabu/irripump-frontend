import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { adminSeasonTypeApi } from "@/lib/api/client";
import type { SeasonType } from "@/lib/api/types";
import { Plus, RefreshCw, Pencil, Trash2, Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const SeasonTypeList = () => {
  const [seasonTypes, setSeasonTypes] = useState<SeasonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameBn, setNewNameBn] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editing, setEditing] = useState<SeasonType | null>(null);
  const [deleting, setDeleting] = useState<SeasonType | null>(null);
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
    if (!isLoading && isAuthenticated) fetchSeasonTypes();
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchSeasonTypes = async () => {
    setLoading(true);
    try { setSeasonTypes(await adminSeasonTypeApi.getAll()); }
    catch { toast({ title: "Error", description: "Failed to fetch season types", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      await adminSeasonTypeApi.create({ code: newCode, nameEnglish: newNameEn, nameBengali: newNameBn, description: newDesc || undefined });
      toast({ title: "তৈরি হয়েছে" });
      setCreating(false); setNewCode(""); setNewNameEn(""); setNewNameBn(""); setNewDesc("");
      await fetchSeasonTypes();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminSeasonTypeApi.update(editing.id, {
        nameEnglish: editing.nameEnglish,
        nameBengali: editing.nameBengali,
        description: editing.description,
        isActive: editing.isActive,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      await fetchSeasonTypes();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleToggleActive = async (st: SeasonType) => {
    setBusy(true);
    try {
      await adminSeasonTypeApi.update(st.id, { isActive: !st.isActive });
      await fetchSeasonTypes();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminSeasonTypeApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      await fetchSeasonTypes();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="মৌসুম ধরন ক্যাটালগ"
        subtitle="Season Type Catalog"
        navItems={adminNavItems}
        rightContent={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchSeasonTypes} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
            <Button size="sm" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-1" />নতুন</Button>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader><CardTitle>সকল মৌসুম ধরন ({seasonTypes.length})</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              অপারেটররা মৌসুম তৈরির সময় এই তালিকা থেকে বেছে নেয়। একটি ধরন নিষ্ক্রিয় করলে অপারেটররা নতুন মৌসুমে তা ব্যবহার করতে পারবে না — বিদ্যমান মৌসুম প্রভাবিত হবে না।
            </p>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name (English)</TableHead>
                      <TableHead>Name (Bengali)</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasonTypes.map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="font-mono text-sm">{st.code}</TableCell>
                        <TableCell>{st.nameEnglish}</TableCell>
                        <TableCell>{st.nameBengali}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={!!st.isActive} onCheckedChange={() => handleToggleActive(st)} disabled={busy} />
                            <Badge variant={st.isActive ? "default" : "secondary"}>{st.isActive ? "Active" : "Disabled"}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...st })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(st)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>নতুন মৌসুম ধরন</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code (must match BORO / AMAN / AUS)</Label><Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="BORO" /></div>
            <div><Label>Name (English)</Label><Input value={newNameEn} onChange={(e) => setNewNameEn(e.target.value)} /></div>
            <div><Label>Name (Bengali)</Label><Input value={newNameBn} onChange={(e) => setNewNameBn(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>বাতিল</Button>
            <Button onClick={handleCreate} disabled={busy || !newCode || !newNameEn || !newNameBn}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}তৈরি করুন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>মৌসুম ধরন সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Code</Label><Input value={editing.code} disabled /></div>
              <div><Label>Name (English)</Label><Input value={editing.nameEnglish} onChange={(e) => setEditing({ ...editing, nameEnglish: e.target.value })} /></div>
              <div><Label>Name (Bengali)</Label><Input value={editing.nameBengali} onChange={(e) => setEditing({ ...editing, nameBengali: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
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
            <AlertDialogTitle>মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.nameEnglish}" ক্যাটালগ থেকে মুছে যাবে। বিদ্যমান মৌসুম প্রভাবিত হবে না।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SeasonTypeList;
