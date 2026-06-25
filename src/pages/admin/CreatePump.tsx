import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { pumpApi } from "@/lib/api/client";
import { Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
];

const createPumpSchema = z.object({
  pumpNameEnglish: z.string().min(1, "English name is required").max(100),
  pumpNameBengali: z.string().min(1, "Bengali name is required").max(100),
  location: z.string().min(1, "Location is required").max(200),
  installationDate: z.string().min(1, "Installation date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]),
  farmerCodePrefix: z.string().min(1, "কৃষক কোড প্রিফিক্স আবশ্যক").max(10),
});

type CreatePumpFormData = z.infer<typeof createPumpSchema>;

const CreatePump = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreatePumpFormData>({
    resolver: zodResolver(createPumpSchema),
    defaultValues: {
      pumpNameEnglish: "",
      pumpNameBengali: "",
      location: "",
      installationDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
      farmerCodePrefix: "",
    },
  });

  const onSubmit = async (data: CreatePumpFormData) => {
    try {
      setLoading(true);
      await pumpApi.create({
        pumpNameEnglish: data.pumpNameEnglish,
        pumpNameBengali: data.pumpNameBengali,
        location: data.location,
        installationDate: data.installationDate,
        status: data.status,
        farmerCodePrefix: data.farmerCodePrefix.trim().toUpperCase(),
      });
      toast({
        title: "Success",
        description: "Pump created successfully",
      });
      navigate("/admin/pumps");
    } catch (error) {
      console.error("Error creating pump:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create pump",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="নতুন পাম্প" subtitle="Create New Pump" navItems={adminNavItems} />

      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pump Information / পাম্প তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="pumpNameEnglish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Name (English)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pump name in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pumpNameBengali"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pump Name (Bengali) / পাম্পের নাম</FormLabel>
                      <FormControl>
                        <Input placeholder="বাংলায় পাম্পের নাম লিখুন" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / অবস্থান</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pump location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="farmerCodePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>কৃষক কোড প্রিফিক্স * (Farmer Code Prefix)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., BK, MP, F"
                          maxLength={10}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">নতুন কৃষকের কোড এই প্রিফিক্স দিয়ে শুরু হবে। উদাহরণ: BK → BK00123</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installation Date / স্থাপনের তারিখ</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status / অবস্থা</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active / সক্রিয়</SelectItem>
                          <SelectItem value="INACTIVE">Inactive / নিষ্ক্রিয়</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance / রক্ষণাবেক্ষণ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/pumps")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Pump
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatePump;