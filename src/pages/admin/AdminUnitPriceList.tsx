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
import { adminUnitPriceApi } from "@/lib/api/client";
import type { UnitPrice } from "@/lib/api/types";
import { Plus, Loader2, Pencil, Trash2, DollarSign } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "জমি", path: "/admin/lands" },
  { label: "ইউনিট মূল্য", path: "/admin/unit-prices" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const schema = z.object({
  pricePerShatak: z.number().min(1, "Price must be > 0"),
  effectiveFrom: z.string().min(1, "Start date required"),
  effectiveTo: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const AdminUnitPriceList = () => {
  const [prices, setPrices] = useState<UnitPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UnitPrice | null>(null);
  const [deleting, setDeleting] = useState<UnitPrice | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, season, year, seasons } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      pricePerShatak: 0,
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") { navigate("/auth"); }
  }, [isLoading, isAuthenticated, user, navigate]);

  useEffect(() => { if (pumpId) fetchPrices(); }, [pumpId]);

  const filtered = prices.filter((p) => (p.season ?? "").toUpperCase() === season && p.year === year);

  const fetchPrices = async () => {
    if (!pumpId) return;
    setLoading(true);
    try { setPrices(await adminUnitPriceApi.getByPump(pumpId)); }
    catch { toast({ title: "Error", description: "Failed to fetch unit prices", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data: FormData) => {
    if (!pumpId) return;
    const seasonId = seasons.find((s) => s.seasonName === season && s.year === year)?.id;
    if (!seasonId) {
      toast({ title: "Error", description: "Season not found. Please select a valid season.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await adminUnitPriceApi.create(pumpId, {
        pricePerShatak: data.pricePerShatak,
        seasonId,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || undefined,
      });
      toast({ title: "সফল", description: "Unit price created" });
      form.reset({ pricePerShatak: 0, effectiveFrom: new Date().toISOString().split("T")[0], effectiveTo: "" });
      setShowForm(false);
      fetchPrices();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminUnitPriceApi.update(editing.id, {
        pricePerShatak: editing.pricePerShatak,
        effectiveFrom: editing.effectiveFrom,
        effectiveTo: editing.effectiveTo,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null);
      fetchPrices();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await adminUnitPriceApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null);
      fetchPrices();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="ইউনিট মূল্য (অ্যাডমিন)"
        subtitle="Unit Prices"
        navItems={adminNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />নতুন</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />নতুন একক মূল্য — {season} / {year}</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="pricePerShatak" render={({ field }) => (
                      <FormItem>
                        <FormLabel>মূল্য / শতক (৳)</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                        {field.value > 0 && <p className="text-xs text-muted-foreground">= ৳{(field.value * 33).toLocaleString()}/বিঘা</p>}
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="effectiveFrom" render={({ field }) => (
                      <FormItem><FormLabel>কার্যকর শুরু</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="effectiveTo" render={({ field }) => (
                      <FormItem><FormLabel>কার্যকর শেষ (ঐচ্ছিক)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
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
          <CardHeader><CardTitle>ইউনিট মূল্য তালিকা — {season} / {year} ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">এই মৌসুম/বছরের জন্য কোনো মূল্য নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>মৌসুম</TableHead>
                      <TableHead>বছর</TableHead>
                      <TableHead>মূল্য / শতক</TableHead>
                      <TableHead>মূল্য / বিঘা (হিসাব)</TableHead>
                      <TableHead className="hidden md:table-cell">শুরু</TableHead>
                      <TableHead className="hidden md:table-cell">শেষ</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><Badge variant="outline">{p.season}</Badge></TableCell>
                        <TableCell>{p.year}</TableCell>
                        <TableCell className="font-bold">৳{p.pricePerShatak.toLocaleString()}/শতক</TableCell>
                        <TableCell className="text-muted-foreground">৳{(p.pricePerShatak * 33).toLocaleString()}/বিঘা</TableCell>
                        <TableCell className="hidden md:table-cell">{p.effectiveFrom}</TableCell>
                        <TableCell className="hidden md:table-cell">{p.effectiveTo || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...p })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(p)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>মূল্য সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>মূল্য / শতক (৳)</Label>
                <Input type="number" value={editing.pricePerShatak} onChange={(e) => setEditing({ ...editing, pricePerShatak: parseFloat(e.target.value) || 0 })} />
                {editing.pricePerShatak > 0 && <p className="text-xs text-muted-foreground mt-1">= ৳{(editing.pricePerShatak * 33).toLocaleString()}/বিঘা</p>}
              </div>
              <div><Label>কার্যকর শুরু</Label><Input type="date" value={editing.effectiveFrom} onChange={(e) => setEditing({ ...editing, effectiveFrom: e.target.value })} /></div>
              <div><Label>কার্যকর শেষ</Label><Input type="date" value={editing.effectiveTo ?? ""} onChange={(e) => setEditing({ ...editing, effectiveTo: e.target.value })} /></div>
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
            <AlertDialogTitle>মূল্য মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.season} / {deleting?.year} — ৳{deleting?.pricePerShatak}/শতক মুছে যাবে।</AlertDialogDescription>
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

export default AdminUnitPriceList;
