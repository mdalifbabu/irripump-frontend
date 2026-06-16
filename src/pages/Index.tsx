import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Droplet, Users, Wheat } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

  // If already logged in, go straight to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center">
            <Droplet className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প</h1>
            <p className="text-xs text-muted-foreground">Irrigation Pump Management</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-10">
        <div className="text-center space-y-3 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-bold">সেচ ব্যবস্থাপনা সিস্টেম</h2>
          <p className="text-muted-foreground text-base">Irrigation Management System for Bangladesh</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button size="lg" className="flex-1 gap-2 h-12 text-base" onClick={() => navigate("/auth")}>
            <Users className="w-5 h-5" />
            লগইন করুন
          </Button>
          <Button size="lg" variant="outline" className="flex-1 gap-2 h-12 text-base" onClick={() => navigate("/farmer")}>
            <Wheat className="w-5 h-5" />
            কৃষক পোর্টাল
          </Button>
        </div>
      </main>

      <footer className="bg-card border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
        © 2025 আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প
      </footer>
    </div>
  );
};

export default Index;
