import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { userApi, pumpApi } from "@/lib/api/client";
import type { Pump } from "@/lib/api/types";
import { Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15),
  pumpIds: z.array(z.number()).min(1, "Select at least one pump"),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const CreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loadingPumps, setLoadingPumps] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      mobile: "",
      pumpIds: [],
    },
  });

  useEffect(() => {
    const fetchPumps = async () => {
      try {
        const data = await pumpApi.getAll();
        setPumps(data);
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
    fetchPumps();
  }, [toast]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setLoading(true);
      await userApi.create({
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        pumpIds: data.pumpIds,
      });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      navigate("/admin/users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar title="নতুন ব্যবহারকারী" subtitle="Create New User" navItems={adminNavItems} />

      <main className="max-w-2xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information / ব্যবহারকারী তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username / ব্যবহারকারী নাম</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password / পাসওয়ার্ড</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name / পুরো নাম</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email / ইমেইল</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile / মোবাইল</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mobile number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pumpIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Assigned Pumps / নির্ধারিত পাম্প</FormLabel>
                      <FormDescription>
                        Select the pumps this user will manage
                      </FormDescription>
                      {loadingPumps ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading pumps...</span>
                        </div>
                      ) : pumps.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">
                          No pumps available. Create a pump first.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pumps.map((pump) => (
                            <FormField
                              key={pump.id}
                              control={form.control}
                              name="pumpIds"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(pump.id)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...field.value, pump.id]
                                          : field.value.filter((id) => id !== pump.id);
                                        field.onChange(updatedValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {pump.pumpNameEnglish} ({pump.pumpNameBengali})
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/admin/users")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create User
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

export default CreateUser;