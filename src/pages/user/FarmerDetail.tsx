import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { farmerApi, landApi, paymentApi } from "@/lib/api/client";
import type { Farmer, Land, Payment } from "@/lib/api/types";
import { User, ArrowLeft, CreditCard, Map, Phone, Mail, MapPin } from "lucide-react";

const FarmerDetail = () => {
  const { farmerId } = useParams<{ farmerId: string }>();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated && farmerId) {
      fetchData();
    }
  }, [isLoading, isAuthenticated, farmerId, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [farmerData, landsData, paymentsData] = await Promise.all([
        farmerApi.getById(parseInt(farmerId!)),
        landApi.getByFarmer(parseInt(farmerId!)),
        paymentApi.getByFarmer(parseInt(farmerId!)),
      ]);
      setFarmer(farmerData);
      setLands(landsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmer details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalLandSize = lands.reduce((sum, land) => sum + land.sizeBigha, 0);
  const totalPayments = payments.reduce((sum, p) => {
    if (p.paymentType === "REFUND") return sum - p.amount;
    return sum + p.amount;
  }, 0);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Farmer not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/user/farmers")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{farmer.nameBengali}</h1>
              <p className="text-sm text-muted-foreground">
                {farmer.nameEnglish} | Code: {farmer.farmerCode}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/user/farmers/${farmerId}/lands`)}>
              <Map className="w-4 h-4 mr-2" />
              Manage Lands
            </Button>
            <Button onClick={() => navigate(`/user/farmers/${farmerId}/payments`)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payments
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Land / মোট জমি
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalLandSize.toFixed(2)} বিঘা</div>
              <p className="text-sm text-muted-foreground">{lands.length} plots registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payments / মোট পেমেন্ট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">৳{totalPayments.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">{payments.length} transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Farmer Code / কৃষক কোড
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{farmer.farmerCode}</div>
              <Badge variant="outline" className="mt-1">Active</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Farmer Details / কৃষক বিবরণ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name (Bengali)</label>
                  <p className="text-lg font-medium">{farmer.nameBengali}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name (English)</label>
                  <p className="text-lg">{farmer.nameEnglish}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Father's Name</label>
                  <p className="text-lg">{farmer.fatherName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NID Number</label>
                  <p className="text-lg font-mono">{farmer.nidNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Village</label>
                    <p className="text-lg">{farmer.village}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                    <p className="text-lg">{farmer.mobile}</p>
                  </div>
                </div>
                {farmer.whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                      <p className="text-lg">{farmer.whatsapp}</p>
                    </div>
                  </div>
                )}
                {farmer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-lg">{farmer.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerDetail;
