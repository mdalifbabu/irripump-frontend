import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi } from "@/lib/api/client";
import type { Farmer } from "@/lib/api/types";
import { Plus, Loader2, Pencil, Trash2, Users, Search, X } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const PAGE_SIZE = 20;

/**
 * Global master list of farmers for the pump — edit/(soft-)delete, independent of any
 * season. Creation reuses the existing standalone CreateFarmer page. Season-scoped work
 * (enroll a farmer into a season) lives on the separate FarmerList (season Management) page.
 */
const FarmerMasterList = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Farmer | null>(null);
  const [editForm, setEditForm] = useState<Partial<Farmer>>({});
  const [deleting, setDeleting] = useState<Farmer | null>(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (pumpId) fetchFarmersPaged(0);
  }, [pumpId]);

  const fetchFarmersPaged = async (page: number, q?: string) => {
    if (!pumpId) return;
    setLoading(true);
    try {
      const result = await farmerApi.searchPaged(pumpId, (q !== undefined ? q : query) || "", page, PAGE_SIZE);
      setFarmers(result.content);
      setPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await farmerApi.update(editing.id, {
        nameBengali: editForm.nameBengali,
        nameEnglish: editForm.nameEnglish,
        fatherName: editForm.fatherName,
        village: editForm.village,
        mobile: editForm.mobile,
        email: editForm.email || undefined,
        nidNumber: editForm.nidNumber,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      fetchFarmersPaged(page);
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await farmerApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchFarmersPaged(0);
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="সকল কৃষক"
        subtitle="Farmer Master List — সকল মৌসুম নির্বিশেষে"
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => navigate(`/user/farmers/create?pumpId=${pumpId ?? ""}`)}>
              <Plus className="w-4 h-4 mr-1" />নতুন কৃষক
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                সকল কৃষকের তালিকা ({totalElements})
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="নাম, মোবাইল বা কোড"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchFarmersPaged(0)}
                  className="w-44 h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={() => fetchFarmersPaged(0)}><Search className="w-3.5 h-3.5" /></Button>
                {query && <Button size="sm" variant="ghost" className="h-8" onClick={() => { setQuery(""); fetchFarmersPaged(0, ""); }}><X className="w-3.5 h-3.5" /></Button>}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : farmers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">কোনো কৃষক নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>কোড</TableHead>
                      <TableHead>নাম</TableHead>
                      <TableHead>গ্রাম</TableHead>
                      <TableHead>মোবাইল</TableHead>
                      <TableHead>অবস্থা</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farmers.map((f) => (
                      <TableRow
                        key={f.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/user/farmers/${f.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{f.farmerCode}</TableCell>
                        <TableCell className="font-medium">{f.nameBengali}</TableCell>
                        <TableCell>{f.village}</TableCell>
                        <TableCell>{f.mobile}</TableCell>
                        <TableCell>
                          <Badge variant={f.isActive ? "default" : "secondary"}>
                            {f.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                              setEditing(f);
                              setEditForm({ ...f });
                            }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(f)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <PaginationBar
                  currentPage={page}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => fetchFarmersPaged(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Farmer Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>কৃষক সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>নাম (বাংলা)</Label><Input value={editForm.nameBengali ?? ""} onChange={(e) => setEditForm({ ...editForm, nameBengali: e.target.value })} /></div>
              <div><Label>নাম (English)</Label><Input value={editForm.nameEnglish ?? ""} onChange={(e) => setEditForm({ ...editForm, nameEnglish: e.target.value })} /></div>
              <div><Label>পিতার নাম</Label><Input value={editForm.fatherName ?? ""} onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })} /></div>
              <div><Label>গ্রাম</Label><Input value={editForm.village ?? ""} onChange={(e) => setEditForm({ ...editForm, village: e.target.value })} /></div>
              <div><Label>মোবাইল</Label><Input value={editForm.mobile ?? ""} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} /></div>
              <div><Label>ইমেইল</Label><Input value={editForm.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><Label>NID</Label><Input value={editForm.nidNumber ?? ""} onChange={(e) => setEditForm({ ...editForm, nidNumber: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Farmer Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কৃষক মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.nameBengali} মুছে যাবে। কোনো মৌসুমে জমি বরাদ্দের ইতিহাস থাকলে মুছা যাবে না।</AlertDialogDescription>
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

export default FarmerMasterList;
