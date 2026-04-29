import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { farmerApi, landApi } from "@/lib/api/client";
import type { Farmer, Land } from "@/lib/api/types";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "ইউনিট মূল্য", path: "/user/unit-prices" },
];

const schema = z.object({
  landIdentificationNumber: z.string().min(1),
  landmarkNumber: z.string().min(1),
  sizeBigha: z.number().min(0.01),
  sizeShatak: z.number().min(0),
  coordinates: z.string().optional(),
  season: z.string().min(1),
  year: z.number().min(2000),
});
type FormData = z.infer<typeof schema>;

const FarmerLands = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Land | null>(null);
  const [deleting, setDeleting] = useState<Land | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { season, year } = usePumpContext();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { landIdentificationNumber: "", landmarkNumber: "", sizeBigha: 0, sizeShatak: 0, coordinates: "", season, year },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && isAuthenticated && farmerId) fetchData();
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, l] = await Promise.all([farmerApi.getById(parseInt(farmerId!)), landApi.getByFarmer(parseInt(farmerId!))]);
      setFarmer(f); setLands(l);
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  // Filter by season + year
  const filtered = lands.filter((l) => l.season === season && l.year === year);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await landApi.create(parseInt(farmerId!), { ...(data as Required<FormData>), coordinates: data.coordinates || undefined });
      toast({ title: "জমি যোগ হয়েছে" });
      form.reset({ landIdentificationNumber: "", landmarkNumber: "", sizeBigha: 0, sizeShatak: 0, coordinates: "", season, year });
      setShowForm(false); fetchData();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await landApi.update(editing.id, {
        landIdentificationNumber: editing.landIdentificationNumber,
        landmarkNumber: editing.landmarkNumber,
        sizeBigha: editing.sizeBigha,
        sizeShatak: editing.sizeShatak,
        coordinates: editing.coordinates,
        season: editing.season,
        year: editing.year,
      });
      toast({ title: "আপডেট সফল" });
      setEditing(null); fetchData();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await landApi.delete(deleting.id);
      toast({ title: "মুছে ফেলা হয়েছে" });
      setDeleting(null); fetchData();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title={`${farmer?.nameBengali || "কৃষক"} — জমি`}
        subtitle={`${farmer?.farmerCode || ""} • ${season}/${year}`}
        navItems={userNavItems}
        rightContent={
          <div className="flex flex-wrap gap-2 items-center">
            <PumpSelector />
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />জমি</Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader><CardTitle>নতুন জমি যোগ করুন</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="landIdentificationNumber" render={({ field }) => (<FormItem><FormLabel>জমি ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="landmarkNumber" render={({ field }) => (<FormItem><FormLabel>দাগ নম্বর</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="sizeBigha" render={({ field }) => (<FormItem><FormLabel>বিঘা</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="sizeShatak" render={({ field }) => (<FormItem><FormLabel>শতক</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="season" render={({ field }) => (<FormItem><FormLabel>মৌসুম</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="BORO">বোরো</SelectItem><SelectItem value="AMAN">আমন</SelectItem><SelectItem value="AUS">আউশ</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="year" render={({ field }) => (<FormItem><FormLabel>বছর</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || year)} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="coordinates" render={({ field }) => (<FormItem><FormLabel>স্থানাঙ্ক (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
          <CardHeader><CardTitle>জমির তালিকা ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">এই মৌসুম/বছরের জন্য কোনো জমি নেই।</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Land ID</TableHead>
                      <TableHead className="hidden md:table-cell">দাগ নম্বর</TableHead>
                      <TableHead>বিঘা</TableHead>
                      <TableHead className="hidden md:table-cell">শতক</TableHead>
                      <TableHead className="hidden md:table-cell">মৌসুম</TableHead>
                      <TableHead className="hidden md:table-cell">বছর</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono">{l.landIdentificationNumber}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.landmarkNumber}</TableCell>
                        <TableCell className="font-bold">{l.sizeBigha}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.sizeShatak}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.season}</TableCell>
                        <TableCell className="hidden md:table-cell">{l.year}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setEditing({ ...l })}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => setDeleting(l)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>জমি সম্পাদনা</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Land ID</Label><Input value={editing.landIdentificationNumber} onChange={(e) => setEditing({ ...editing, landIdentificationNumber: e.target.value })} /></div>
              <div><Label>দাগ নম্বর</Label><Input value={editing.landmarkNumber} onChange={(e) => setEditing({ ...editing, landmarkNumber: e.target.value })} /></div>
              <div><Label>বিঘা</Label><Input type="number" step="0.01" value={editing.sizeBigha} onChange={(e) => setEditing({ ...editing, sizeBigha: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>শতক</Label><Input type="number" step="0.01" value={editing.sizeShatak} onChange={(e) => setEditing({ ...editing, sizeShatak: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>মৌসুম</Label>
                <Select value={editing.season} onValueChange={(v) => setEditing({ ...editing, season: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="BORO">BORO</SelectItem><SelectItem value="AMAN">AMAN</SelectItem><SelectItem value="AUS">AUS</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>বছর</Label><Input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: parseInt(e.target.value) || year })} /></div>
              <div className="md:col-span-2"><Label>স্থানাঙ্ক</Label><Input value={editing.coordinates || ""} onChange={(e) => setEditing({ ...editing, coordinates: e.target.value })} /></div>
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
            <AlertDialogTitle>জমি মুছতে চান?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.landIdentificationNumber} মুছে যাবে।</AlertDialogDescription>
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

export default FarmerLands;