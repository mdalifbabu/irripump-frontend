import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { farmerApi, landApi } from "@/lib/api/client";
import type { Farmer, Land } from "@/lib/api/types";
import { Map, ArrowLeft, Plus, Loader2 } from "lucide-react";

const createLandSchema = z.object({
  landIdentificationNumber: z.string().min(1, "Land ID is required"),
  landmarkNumber: z.string().min(1, "Landmark number is required"),
  sizeBigha: z.number().min(0.01, "Size must be greater than 0"),
  sizeShatak: z.number().min(0, "Shatak cannot be negative"),
  coordinates: z.string().optional(),
  season: z.string().min(1, "Season is required"),
  year: z.number().min(2000, "Year must be valid"),
});

type CreateLandFormData = z.infer<typeof createLandSchema>;

const FarmerLands = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const currentYear = new Date().getFullYear();

  const form = useForm<CreateLandFormData>({
    resolver: zodResolver(createLandSchema),
    defaultValues: {
      landIdentificationNumber: "",
      landmarkNumber: "",
      sizeBigha: 0,
      sizeShatak: 0,
      coordinates: "",
      season: "BORO",
      year: currentYear,
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated && farmerId) {
      fetchData();
    }
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmerData, landsData] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        landApi.getByFarmer(parseInt(farmerId!)),
      ]);
      setFarmer(farmerData);
      setLands(landsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateLandFormData) => {
    try {
      setSubmitting(true);
      await landApi.create(parseInt(farmerId!), {
        landIdentificationNumber: data.landIdentificationNumber,
        landmarkNumber: data.landmarkNumber,
        sizeBigha: data.sizeBigha,
        sizeShatak: data.sizeShatak,
        coordinates: data.coordinates || undefined,
        season: data.season,
        year: data.year,
      });
      toast({
        title: "Success",
        description: "Land added successfully",
      });
      form.reset({
        landIdentificationNumber: "",
        landmarkNumber: "",
        sizeBigha: 0,
        sizeShatak: 0,
        coordinates: "",
        season: "BORO",
        year: currentYear,
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error("Error creating land:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add land",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/user/farmers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Map className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {farmer?.nameBengali || "Farmer"} - Lands
              </h1>
              <p className="text-sm text-muted-foreground">
                Code: {farmer?.farmerCode} | {farmer?.village}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Land
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Land / নতুন জমি যোগ করুন</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="landIdentificationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Land ID Number / জমি শনাক্ত নম্বর</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter land ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="landmarkNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landmark Number / দাগ নম্বর</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter landmark number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="sizeBigha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size (Bigha) / বিঘা</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sizeShatak"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size (Shatak) / শতক</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="season"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Season / মৌসুম</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BORO">Boro / বোরো</SelectItem>
                              <SelectItem value="AMAN">Aman / আমন</SelectItem>
                              <SelectItem value="AUS">Aus / আউশ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year / বছর</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || currentYear)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="coordinates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coordinates (Optional) / স্থানাঙ্ক</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 23.8103, 90.4125" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Land
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Land Records / জমির তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {lands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No lands registered yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Land ID</TableHead>
                    <TableHead>Landmark No.</TableHead>
                    <TableHead>Size (Bigha)</TableHead>
                    <TableHead>Size (Shatak)</TableHead>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lands.map((land) => (
                    <TableRow key={land.id}>
                      <TableCell className="font-mono">{land.landIdentificationNumber}</TableCell>
                      <TableCell>{land.landmarkNumber}</TableCell>
                      <TableCell className="font-bold">{land.sizeBigha}</TableCell>
                      <TableCell>{land.sizeShatak}</TableCell>
                      <TableCell>{land.season}</TableCell>
                      <TableCell>{land.year}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerLands;
