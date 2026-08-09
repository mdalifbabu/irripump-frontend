import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { landApi } from "@/lib/api/client";
import type { Land } from "@/lib/api/types";
import { Plus, Loader2, Pencil, Trash2, MapPin, Search, X } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";
import PaginationBar from "@/components/PaginationBar";
import { userNavItems } from "@/lib/navItems";

const PAGE_SIZE = 20;

const schema = z.object({
  landmarkNumber: z.string().min(1, "দাগ/খতিয়ান নম্বর প্রয়োজন"),
  sizeBigha: z.number().min(0.01, "শতক > 0 হতে হবে"),
  description: z.string().optional(),
  tag: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

/**
 * Global master list of lands for the pump — create/update/(soft-)delete, independent of
 * any season. Season-scoped work (enroll a land into a season, assign/unassign) lives on
 * the separate "Land Management" page (LandList.tsx).
 */
const LandMasterList = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Land | null>(null);
  const [editBigha, setEditBigha] = useState(0);
  const [deleting, setDeleting] = useState<Land | null>(null);
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { pumpId } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { landmarkNumber: "", sizeBigha: 0, description: "", tag: "" },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (pumpId) fetchLandsPaged(0);
  }, [pumpId]);

  const fetchLandsPaged = async (page: number, q?: string) => {
    if (!pumpId) return;
    setLoading(true);
    try {
      const result = await landApi.getByPumpPaged(pumpId, page, PAGE_SIZE, (q !== undefined ? q : query) || undefined);
      setLands(result.content);
      setPage(result.number);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: FormData) => {
    if (!pumpId) return;
    setSubmitting(true);
    try {
      await landApi.create({ pumpId, landmarkNumber: data.landmarkNumber, sizeShatak: data.sizeBigha, description: data.description, tag: data.tag || undefined });
      toast({ title: "সফল", description: "জমি তৈরি হয়েছে" });
      form.reset({ landmarkNumber: "", sizeBigha: 0, description: "", tag: "" });
      setShowForm(false);
      fetchLandsPaged(0);
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await landApi.update(editing.id, {
        landmarkNumber: editing.landmarkNumber,
        sizeShatak: editBigha,
        description: editing.description,
        tag: editing.tag,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      fetchLandsPaged(page);
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await landApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchLandsPaged(0);
    } catch (e: any) { toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="সকল জমি"
        subtitle="Land Master List — সকল মৌসুম নির্বিশেষে"
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />নতুন জমি</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />নতুন জমি</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="landmarkNumber" render={({ field }) => (
                      <FormItem><FormLabel>দাগ/খতিয়ান নম্বর</FormLabel><FormControl><Input placeholder="e.g., 123" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="sizeBigha" render={({ field }) => (
                      <FormItem><FormLabel>শতক</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>বিবরণ</FormLabel><FormControl><Input placeholder="ঐচ্ছিক বিবরণ" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="tag" render={({ field }) => (
                    <FormItem><FormLabel>ট্যাগ / ফ্ল্যাগ</FormLabel><FormControl><Input placeholder="অনুসন্ধানযোগ্য লেবেল (ঐচ্ছিক)" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>বাতিল</Button>
                    <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                সকল জমির তালিকা ({totalElements})
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="দাগ নম্বর বা ট্যাগ"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchLandsPaged(0)}
                  className="w-44 h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={() => fetchLandsPaged(0)}><Search className="w-3.5 h-3.5" /></Button>
                {query && <Button size="sm" variant="ghost" className="h-8" onClick={() => { setQuery(""); fetchLandsPaged(0, ""); }}><X className="w-3.5 h-3.5" /></Button>}
              </div>
            </div>
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
                      <TableHead>শতক</TableHead>
                      <TableHead>ট্যাগ</TableHead>
                      <TableHead>অবস্থা</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lands.map((land) => (
                      <TableRow key={land.id}>
                        <TableCell>{land.landmarkNumber}</TableCell>
                        <TableCell>
                          <span className="font-bold text-primary">{(land.sizeShatak ?? 0).toFixed(2)} শতক</span>
                          <br /><span className="text-xs text-muted-foreground">{((land.sizeShatak ?? 0) / 33).toFixed(3)} বিঘা</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{land.tag ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant={land.isActive ? "default" : "secondary"}>
                            {land.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                              setEditing({ ...land });
                              setEditBigha(land.sizeShatak ?? 0);
                            }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(land)}>
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
                  onPageChange={(p) => fetchLandsPaged(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Land Dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>জমি সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>দাগ/খতিয়ান নম্বর</Label><Input value={editing.landmarkNumber} onChange={(e) => setEditing({ ...editing, landmarkNumber: e.target.value })} /></div>
              <div><Label>শতক</Label><Input type="number" step="0.01" min="0" value={editBigha} onChange={(e) => setEditBigha(e.target.value === "" ? 0 : parseFloat(e.target.value))} /></div>
              <div><Label>বিবরণ</Label><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>ট্যাগ / ফ্ল্যাগ</Label><Input value={editing.tag ?? ""} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} placeholder="অনুসন্ধানযোগ্য লেবেল" /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>বাতিল</Button>
            <Button onClick={handleUpdate} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Land Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>জমি মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.landmarkNumber} মুছে যাবে। কোনো মৌসুমে বরাদ্দের ইতিহাস থাকলে মুছা যাবে না।</AlertDialogDescription>
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

export default LandMasterList;
