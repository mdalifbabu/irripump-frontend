import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { farmerApi, pumpApi } from "@/lib/api/client";
import type { Farmer, Pump } from "@/lib/api/types";
import { Users, Plus, ArrowLeft, Search, RefreshCw } from "lucide-react";

const FarmerList = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [selectedPumpId, setSelectedPumpId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPumps, setLoadingPumps] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!isLoading && isAuthenticated) {
      fetchPumps();
    }
  }, [isLoading, isAuthenticated, navigate]);

  const fetchPumps = async () => {
    try {
      const data = await pumpApi.getAll();
      setPumps(data);
      if (data.length > 0) {
        setSelectedPumpId(data[0].id);
      }
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

  useEffect(() => {
    if (selectedPumpId) {
      fetchFarmers();
    }
  }, [selectedPumpId]);

  const fetchFarmers = async () => {
    if (!selectedPumpId) return;
    try {
      setLoading(true);
      const data = await farmerApi.getByPump(selectedPumpId);
      setFarmers(data);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch farmers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedPumpId || !searchQuery.trim()) {
      fetchFarmers();
      return;
    }
    try {
      setLoading(true);
      const data = await farmerApi.search(selectedPumpId, searchQuery);
      setFarmers(data);
    } catch (error) {
      console.error("Error searching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to search farmers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loadingPumps) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/user/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Farmer Management</h1>
              <p className="text-sm text-muted-foreground">কৃষক পরিচালনা</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/user/farmers/create?pumpId=${selectedPumpId}`)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Farmer
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-64">
                <Select
                  value={selectedPumpId?.toString() || ""}
                  onValueChange={(value) => setSelectedPumpId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Pump" />
                  </SelectTrigger>
                  <SelectContent>
                    {pumps.map((pump) => (
                      <SelectItem key={pump.id} value={pump.id.toString()}>
                        {pump.pumpNameEnglish}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search by name, mobile, or farmer code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={fetchFarmers}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Farmers / কৃষক তালিকা</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : farmers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No farmers found. Add your first farmer to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer Code</TableHead>
                    <TableHead>Name (Bengali)</TableHead>
                    <TableHead>Name (English)</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {farmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-mono">{farmer.farmerCode}</TableCell>
                      <TableCell className="font-medium">{farmer.nameBengali}</TableCell>
                      <TableCell>{farmer.nameEnglish}</TableCell>
                      <TableCell>{farmer.village}</TableCell>
                      <TableCell>{farmer.mobile}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/user/farmers/${farmer.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/user/farmers/${farmer.id}/payments`)}
                          >
                            Payments
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/user/farmers/${farmer.id}/lands`)}
                          >
                            Lands
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FarmerList;
