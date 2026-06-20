import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePumpContext } from "@/contexts/PumpContext";
import { adminApi } from "@/lib/api/client";
import { Loader2, Settings } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PumpSelector from "@/components/PumpSelector";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "জমি", path: "/admin/lands" },
  { label: "মৌসুম", path: "/admin/seasons" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AdminSettings = () => {
  const [prefix, setPrefix] = useState("");
  const [currentPrefix, setCurrentPrefix] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { pumpId, pumps } = usePumpContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  useEffect(() => {
    if (!pumpId || !pumps) return;
    const pump = pumps.find((p) => p.id === pumpId);
    const cp = pump?.farmerCodePrefix ?? "F";
    setCurrentPrefix(cp);
    setPrefix(cp);
  }, [pumpId, pumps]);

  const handleSave = async () => {
    if (!pumpId || !prefix.trim()) return;
    setSaving(true);
    try {
      await adminApi.updateCodePrefix(pumpId, prefix.trim().toUpperCase());
      setCurrentPrefix(prefix.trim().toUpperCase());
      toast({ title: "সফল", description: "কৃষক কোড প্রিফিক্স আপডেট হয়েছে" });
    } catch (e: any) {
      toast({ title: "ত্রুটি", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="সেটিংস"
        subtitle="Settings"
        navItems={adminNavItems}
        rightContent={<PumpSelector />}
      />

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              কৃষক কোড প্রিফিক্স
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              প্রতিটি নতুন কৃষকের কোড এই প্রিফিক্স দিয়ে শুরু হবে।
              বর্তমান: <span className="font-bold text-primary">{currentPrefix}</span>
              (উদাহরণ: {currentPrefix}00001)
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>নতুন প্রিফিক্স (সর্বোচ্চ ১০ অক্ষর)</Label>
                <Input
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="e.g., F, BP, MP"
                  maxLength={10}
                />
              </div>
              <Button onClick={handleSave} disabled={saving || !prefix.trim() || prefix === currentPrefix}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                সংরক্ষণ
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
