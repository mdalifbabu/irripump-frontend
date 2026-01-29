import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, ArrowLeft } from "lucide-react";

const UserList = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && user?.role !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "You don't have admin access",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  if (isLoading) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">User Management</h1>
              <p className="text-sm text-muted-foreground">ব্যবহারকারী পরিচালনা</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/users/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Users / সকল ব্যবহারকারী</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>User list API endpoint not available in the current API collection.</p>
              <p className="mt-2">You can create new users using the button above.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserList;
