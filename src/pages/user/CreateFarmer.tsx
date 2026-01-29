import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { farmerApi } from "@/lib/api/client";
import { Users, ArrowLeft, Loader2 } from "lucide-react";

const createFarmerSchema = z.object({
  nameBengali: z.string().min(1, "Bengali name is required").max(100),
  nameEnglish: z.string().min(1, "English name is required").max(100),
  fatherName: z.string().min(1, "Father's name is required").max(100),
  village: z.string().min(1, "Village is required").max(100),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  nidNumber: z.string().min(10, "NID must be at least 10 characters").max(20),
});

type CreateFarmerFormData = z.infer<typeof createFarmerSchema>;

const CreateFarmer = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const pumpId = parseInt(searchParams.get("pumpId") || "0");
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateFarmerFormData>({
    resolver: zodResolver(createFarmerSchema),
    defaultValues: {
      nameBengali: "",
      nameEnglish: "",
      fatherName: "",
      village: "",
      mobile: "",
      email: "",
      whatsapp: "",
      nidNumber: "",
    },
  });

  const onSubmit = async (data: CreateFarmerFormData) => {
    if (!pumpId) {
      toast({
        title: "Error",
        description: "No pump selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await farmerApi.create(pumpId, {
        nameBengali: data.nameBengali,
        nameEnglish: data.nameEnglish,
        fatherName: data.fatherName,
        village: data.village,
        mobile: data.mobile,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
        nidNumber: data.nidNumber,
      });
      toast({
        title: "Success",
        description: "Farmer created successfully",
      });
      navigate("/user/farmers");
    } catch (error) {
      console.error("Error creating farmer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create farmer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/user/farmers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Add New Farmer</h1>
            <p className="text-sm text-muted-foreground">নতুন কৃষক যোগ করুন</p>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Farmer Information / কৃষক তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nameBengali"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name (Bengali) / নাম</FormLabel>
                        <FormControl>
                          <Input placeholder="বাংলায় নাম লিখুন" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nameEnglish"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name (English)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name in English" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fatherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Name / পিতার নাম</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father's name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village / গ্রাম</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter village name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile / মোবাইল</FormLabel>
                        <FormControl>
                          <Input placeholder="01XXXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="WhatsApp number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional) / ইমেইল</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nidNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NID Number / জাতীয় পরিচয়পত্র নম্বর</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter NID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/user/farmers")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Farmer
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

export default CreateFarmer;
