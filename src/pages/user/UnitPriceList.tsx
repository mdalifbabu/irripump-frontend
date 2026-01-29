import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { unitPriceApi, pumpApi } from "@/lib/api/client";
import type { UnitPrice, Pump } from "@/lib/api/types";
import { DollarSign, ArrowLeft, Plus, Loader2 } from "lucide-react";

const createUnitPriceSchema = z.object({
  pricePerBigha: z.number().min(1, "Price must be greater than 0"),
  season: z.string().min(1, "Season is required"),
  year: z.number().min(2000, "Year must be valid"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  effectiveTo: z.string().min(1, "Effective to date is required"),
});

type CreateUnitPriceFormData = z.infer<typeof createUnitPriceSchema>;

const UnitPriceList = () => {
  const [prices, setPrices] = useState<UnitPrice[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPumps, setLoadingPumps] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const currentYear = new Date().getFullYear();

  const form = useForm<CreateUnitPriceFormData>({
    resolver: zodResolver(createUnitPriceSchema),
    defaultValues: {
      pricePerBigha: 0,
      season: "BORO",
      year: currentYear,
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: "",
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated) {
      fetchPumps();
    }
  }, [isLoading, isAuthenticated, navigate]);

  const fetchPumps = async () => {
    try {
      const data = await pumpApi.getAll();
      setPumps(data);
      if (data.length > 0) {
        setSelectedPumpId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching pumps:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pumps",
        variant: "destructive",
      });
    } finally {
      setLoadingPumps(false);
    }
  };

  useEffect(() => {
    if (selectedPumpId) {
      fetchPrices();
    }
  }, [selectedPumpId]);

  const fetchPrices = async () => {
    if (!selectedPumpId) return;
    try {
      setLoading(true);
      const data = await unitPriceApi.getByPump(selectedPumpId);
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch unit prices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateUnitPriceFormData) => {
    if (!selectedPumpId) return;
    try {
      setSubmitting(true);
      await unitPriceApi.create(selectedPumpId, {
        pricePerBigha: data.pricePerBigha,
        season: data.season,
        year: data.year,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
      });
      toast({
        title: "Success",
        description: "Unit price created successfully",
      });
      form.reset({
        pricePerBigha: 0,
        season: "BORO",
        year: currentYear,
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
      });
      setShowForm(false);
      fetchPrices();
    } catch (error) {
      console.error("Error creating unit price:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create unit price",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loadingPumps) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/user/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Unit Prices</h1>
              <p className="text-sm text-muted-foreground">একক মূল্য পরিচালনা</p>
            </div>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Price
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="w-full md:w-64">
              <Select
                value={selectedPumpId?.toString() || ""}
                onValueChange={(value) => setSelectedPumpId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Pump" />
                </SelectTrigger>
                <SelectContent>
                  {pumps.map((pump) => (
                    <SelectItem key={pump.id} value={pump.id.toString()}>
                      {pump.pumpNameEnglish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Unit Price / নতুন একক মূল্য</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="pricePerBigha"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Bigha (৳)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter price"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="effectiveFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective From / কার্যকর শুরু</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="effectiveTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Effective To / কার্যকর শেষ</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Price
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Unit Prices / একক মূল্য তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : prices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No unit prices configured yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price per Bigha</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Effective To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>
                        <Badge variant="outline">{price.season}</Badge>
                      </TableCell>
                      <TableCell>{price.year}</TableCell>
                      <TableCell className="font-bold">৳{price.pricePerBigha.toLocaleString()}</TableCell>
                      <TableCell>{price.effectiveFrom}</TableCell>
                      <TableCell>{price.effectiveTo}</TableCell>
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

export default UnitPriceList;
