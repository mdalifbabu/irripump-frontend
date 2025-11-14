import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Droplet } from "lucide-react";

const FarmerPortal = () => {
  const [farmerCode, setFarmerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter your farmer code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    // TODO: Implement farmer code verification and data display
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Not Implemented",
        description: "Farmer portal functionality coming soon",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Droplet className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ফার্মার পোর্টাল
          </CardTitle>
          <CardDescription className="text-base">
            Farmer Portal - আলহাজ্ব ইয়াকুব আলী সেচ প্রকল্প
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="farmer-code" className="text-base">
                ফার্মার কোড দিন / Enter Farmer Code
              </Label>
              <Input
                id="farmer-code"
                type="text"
                placeholder="Enter your farmer code"
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value)}
                className="text-lg py-6"
                required
              />
              <p className="text-sm text-muted-foreground">
                আপনার মোবাইল নম্বরে পাঠানো কোড দিন
              </p>
            </div>
            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              {loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন / Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerPortal;