import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { auditLogApi } from "@/lib/api/client";
import type { AuditLogEntry } from "@/lib/api/types";
import { RefreshCw, Search } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const adminNavItems = [
  { label: "ড্যাশবোর্ড", path: "/admin/dashboard" },
  { label: "পাম্প", path: "/admin/pumps" },
  { label: "ব্যবহারকারী", path: "/admin/users" },
  { label: "কৃষক", path: "/admin/farmers" },
  { label: "মৌসুম ধরন", path: "/admin/season-types" },
  { label: "অডিট লগ", path: "/admin/audit-log" },
  { label: "সেটিংস", path: "/admin/settings" },
];

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorId, setActorId] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { navigate("/auth"); return; }
    if (!isLoading && user?.role !== "ADMIN") {
      toast({ title: "Access Denied", variant: "destructive" });
      navigate("/auth"); return;
    }
    if (!isLoading && isAuthenticated) fetchLogs();
  }, [isLoading, isAuthenticated, user, navigate, toast]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      setLogs(await auditLogApi.search({
        actorId: actorId ? Number(actorId) : undefined,
        entityType: entityType || undefined,
        from: from || undefined,
        to: to || undefined,
      }));
    } catch { toast({ title: "Error", description: "Failed to fetch audit log", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <AppNavbar
        title="অডিট লগ"
        subtitle="Audit Log (read-only)"
        navItems={adminNavItems}
        rightContent={<Button size="sm" variant="outline" onClick={fetchLogs} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>}
      />

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            <div><Label className="text-xs">Actor ID</Label><Input value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="e.g. 5" /></div>
            <div><Label className="text-xs">Entity (table)</Label><Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. payments" /></div>
            <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="flex items-end"><Button className="w-full" onClick={fetchLogs}><Search className="w-4 h-4 mr-1" />খুঁজুন</Button></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>লগ এন্ট্রি ({logs.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : logs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">কোনো এন্ট্রি পাওয়া যায়নি।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="hidden md:table-cell">Old → New</TableHead>
                      <TableHead className="hidden md:table-cell">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{log.actorName}</span>
                            <Badge variant="outline" className="text-xs">{log.role}</Badge>
                            {log.adminImpersonation && <Badge variant="secondary" className="text-xs">impersonation</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.actionType}</TableCell>
                        <TableCell className="text-xs">{log.tableName}{log.recordId ? ` #${log.recordId}` : ""}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                          {log.oldValue ?? "—"} → {log.newValue ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs max-w-xs truncate">{log.reason ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuditLogViewer;
