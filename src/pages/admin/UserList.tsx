import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { Plus, UserPlus, Pencil, Trash2, Loader2, RefreshCw, RotateCcw, KeyRound } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
];

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [resettingPwd, setResettingPwd] = useState<User | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", description: "You don't have admin access", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) fetchUsers();
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await userApi.getAll()); }
    catch { /* endpoint may not exist on backend */ }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await userApi.update(editing.id, {
        username: editing.username,
        fullName: editing.fullName,
        email: editing.email,
        mobile: editing.mobile,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null); fetchUsers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await userApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null); fetchUsers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleToggleStatus = async (u: User) => {
    setBusy(true);
    try {
      await userApi.setStatus(u.id, !(u.isActive ?? true));
      await fetchUsers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleResetPassword = async () => {
    if (!resettingPwd || !newPwd.trim()) return;
    setBusy(true);
    try {
      await userApi.resetPassword(resettingPwd.id, newPwd.trim());
      toast({ title: "পাসওয়ার্ড রিসেট সফল" });
      setResettingPwd(null);
      setNewPwd("");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleReactivate = async (u: User) => {
    setBusy(true);
    try {
      await userApi.reactivate(u.id);
      toast({ title: "Reactivated", description: `${u.fullName} — active for 1 more month` });
      await fetchUsers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const isExpired = (u: User) =>
    u.activeUntil != null && new Date(u.activeUntil) < new Date();

  const expiryLabel = (u: User) => {
    if (!u.activeUntil) return "No expiry";
    const d = new Date(u.activeUntil);
    return `Active until ${d.toLocaleDateString("en-BD")}`;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="ব্যবহারকারী পরিচালনা"
        subtitle="User Management"
        navItems={adminNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" variant="outline" onClick={fetchUsers}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
            <Button size="sm" onClick={() => navigate("/admin/users/create")}><Plus className="w-4 h-4 mr-1" />নতুন</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader><CardTitle>সকল ব্যবহারকারী / All Users ({users.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-4">
                <UserPlus className="w-12 h-12 mx-auto opacity-50" />
                <p>কোনো ব্যবহারকারী পাওয়া যায়নি।</p>
                <Button onClick={() => navigate("/admin/users/create")}><Plus className="w-4 h-4 mr-2" />নতুন ব্যবহারকারী</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Status / Expiry</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const expired = isExpired(u);
                      const active = (u.isActive ?? true) && !expired;
                      return (
                        <TableRow key={u.id} className={expired ? "bg-red-50/50" : ""}>
                          <TableCell className="font-mono text-sm">{u.username}</TableCell>
                          <TableCell className="font-medium">{u.fullName}</TableCell>
                          <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Switch checked={active} onCheckedChange={() => handleToggleStatus(u)} disabled={busy} />
                                <Badge variant={active ? "default" : "destructive"}>
                                  {expired ? "Expired" : active ? "Active" : "Disabled"}
                                </Badge>
                              </div>
                              <p className={`text-xs ${expired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                {expiryLabel(u)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {(expired || !(u.isActive ?? true)) && (
                                <Button size="sm" variant="outline" className="h-8 text-green-700 border-green-300" onClick={() => handleReactivate(u)} disabled={busy}>
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" />পুনরায় সক্রিয়
                                </Button>
                              )}
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...u })} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600" onClick={() => { setResettingPwd(u); setNewPwd(""); }} title="Reset Password"><KeyRound className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(u)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ব্যবহারকারী সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Username</Label><Input value={editing.username} onChange={(e) => setEditing({ ...editing, username: e.target.value })} /></div>
              <div><Label>Full Name</Label><Input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Mobile</Label><Input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} /></div>
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
            <AlertDialogTitle>ব্যবহারকারী মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.fullName}" মুছে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={busy} className="bg-destructive text-destructive-foreground">মুছুন</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!resettingPwd} onOpenChange={(o) => !o && setResettingPwd(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>পাসওয়ার্ড রিসেট — {resettingPwd?.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>নতুন পাসওয়ার্ড</Label>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড দিন"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResettingPwd(null)}>বাতিল</Button>
            <Button onClick={handleResetPassword} disabled={busy || !newPwd.trim()}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}রিসেট করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserList;