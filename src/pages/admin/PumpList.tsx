import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { pumpApi } from "@/lib/api/client";
import type { Pump } from "@/lib/api/types";
import { Droplet, Plus, ArrowLeft, RefreshCw } from "lucide-react";

const PumpList = () => {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
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

    if (!isLoading && isAuthenticated) {
      fetchPumps();
    }
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchPumps = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>;
      case "MAINTENANCE":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              <Droplet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pump Management</h1>
              <p className="text-sm text-muted-foreground">পাম্প পরিচালনা</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPumps} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/admin/pumps/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pump
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Pumps / সকল পাম্প</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pumps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pumps found. Create your first pump to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name (English)</TableHead>
                    <TableHead>Name (Bengali)</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Installation Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pumps.map((pump) => (
                    <TableRow key={pump.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">{pump.id}</TableCell>
                      <TableCell className="font-medium">{pump.pumpNameEnglish}</TableCell>
                      <TableCell>{pump.pumpNameBengali}</TableCell>
                      <TableCell>{pump.location}</TableCell>
                      <TableCell>{pump.installationDate}</TableCell>
                      <TableCell>{getStatusBadge(pump.status)}</TableCell>
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

export default PumpList;
