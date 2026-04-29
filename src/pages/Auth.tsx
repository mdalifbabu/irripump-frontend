import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet, Shield, User } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: "", password: "" });
  const [userCredentials, setUserCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { adminLogin, userLogin } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCredentials.username || !adminCredentials.password) {
      toast({
        title: "ত্রুটি / Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await adminLogin(adminCredentials.username, adminCredentials.password);
      toast({
        title: "সফল / Success",
        description: "Admin login successful!",
      });
      navigate("/admin/dashboard");
    } catch (error) {
      toast({
        title: "ত্রুটি / Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCredentials.username || !userCredentials.password) {
      toast({
        title: "ত্রুটি / Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await userLogin(userCredentials.username, userCredentials.password);
      toast({
        title: "সফল / Success",
        description: "User login successful!",
      });
      navigate("/user/dashboard");
    } catch (error) {
      toast({
        title: "ত্রুটি / Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প
          </CardTitle>
          <CardDescription className="text-base">
            Irrigation Pump Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Operator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username / ইউজারনেম</Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="Enter admin username"
                    value={adminCredentials.username}
                    onChange={(e) =>
                      setAdminCredentials({ ...adminCredentials, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password / পাসওয়ার্ড</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter password"
                    value={adminCredentials.password}
                    onChange={(e) =>
                      setAdminCredentials({ ...adminCredentials, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "লগইন হচ্ছে..." : "Admin Login / এডমিন লগইন"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="user-username">Username / ইউজারনেম</Label>
                  <Input
                    id="user-username"
                    type="text"
                    placeholder="Enter operator username"
                    value={userCredentials.username}
                    onChange={(e) =>
                      setUserCredentials({ ...userCredentials, username: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Password / পাসওয়ার্ড</Label>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Enter password"
                    value={userCredentials.password}
                    onChange={(e) =>
                      setUserCredentials({ ...userCredentials, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "লগইন হচ্ছে..." : "Operator Login / অপারেটর লগইন"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
