import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet, Shield, User, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [userCredentials, setUserCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminLogin, userLogin, isAuthenticated, user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCredentials.username || !adminCredentials.password) {
      toast({ title: "ত্রুটি", description: "Username ও password দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await adminLogin(adminCredentials.username, adminCredentials.password);
      toast({ title: "সফল", description: "Admin login সফল হয়েছে" });
      navigate("/admin/dashboard");
    } catch (error) {
      toast({ title: "ত্রুটি", description: error instanceof Error ? error.message : "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCredentials.username || !userCredentials.password) {
      toast({ title: "ত্রুটি", description: "Username ও password দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await userLogin(userCredentials.username, userCredentials.password);
      toast({ title: "সফল", description: "Operator login সফল হয়েছে" });
      navigate("/user/dashboard");
    } catch (error) {
      toast({ title: "ত্রুটি", description: error instanceof Error ? error.message : "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
          হোম পেজে ফিরুন
        </Button>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Droplet className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প</CardTitle>
            <CardDescription className="text-base">Irrigation Pump Management System</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  অপারেটর
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user">
                <form onSubmit={handleUserLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-username">Username</Label>
                    <Input
                      id="user-username"
                      type="text"
                      placeholder="অপারেটর username"
                      value={userCredentials.username}
                      onChange={(e) => setUserCredentials({ ...userCredentials, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <Input
                      id="user-password"
                      type="password"
                      placeholder="Password"
                      value={userCredentials.password}
                      onChange={(e) => setUserCredentials({ ...userCredentials, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "লগইন হচ্ছে..." : "অপারেটর লগইন"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username">Username</Label>
                    <Input
                      id="admin-username"
                      type="text"
                      placeholder="Admin username"
                      value={adminCredentials.username}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "লগইন হচ্ছে..." : "Admin লগইন"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
