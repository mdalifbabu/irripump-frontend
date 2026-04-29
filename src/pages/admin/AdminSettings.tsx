import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { settingsApi } from "@/lib/api/client";
import type { Setting } from "@/lib/api/types";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState<Setting | null>(null);
  const [deleting, setDeleting] = useState<Setting | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => { if (pumpId) fetchSettings(); }, [pumpId]);

  const fetchSettings = async () => {
    if (!pumpId) return;
    setLoading(true);
    try { setSettings(await settingsApi.getByPump(pumpId)); }
    catch { console.error("Error fetching settings"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!pumpId || !newKey || !newValue) return;
    try {
      await settingsApi.create(pumpId, { key: newKey, value: newValue, category: newCategory || "general" });
      toast({ title: "সেটিং তৈরি হয়েছে" });
      setNewKey(""); setNewValue(""); setNewCategory(""); fetchSettings();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await settingsApi.update(editing.id, { key: editing.key, value: editing.value, category: editing.category });
      toast({ title: "আপডেট সফল" });
      setEditing(null); fetchSettings();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await settingsApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null); fetchSettings();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="সিস্টেম সেটিংস" subtitle="System Settings" navItems={adminNavItems} rightContent={<PumpSelector />} />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>নতুন সেটিং যোগ করুন</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><Label>Key</Label><Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. farmer_code_prefix" /></div>
              <div><Label>Value</Label><Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. FRM" /></div>
              <div><Label>Category</Label><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="general" /></div>
              <div className="flex items-end"><Button onClick={handleCreate} className="w-full" disabled={!pumpId}><Plus className="w-4 h-4 mr-1" />যোগ করুন</Button></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>সেটিংস তালিকা ({settings.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : settings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">কোনো সেটিং পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Value</TableHead><TableHead>Category</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {settings.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.key}</TableCell>
                        <TableCell>{s.value}</TableCell>
                        <TableCell>{s.category}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...s })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(s)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>সেটিং সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Key</Label><Input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} /></div>
              <div><Label>Value</Label><Input value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
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
            <AlertDialogTitle>সেটিং মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.key}" মুছে যাবে।</AlertDialogDescription>
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

export default AdminSettings;