import { useNavigate, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  const error = useRouteError() as { statusText?: string; message?: string; status?: number } | null;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl font-black text-muted-foreground/30">
          {error?.status ?? "!"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            {error?.status === 404 ? "পেজ পাওয়া যায়নি" : "কিছু একটা ভুল হয়েছে"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {error?.statusText || error?.message || "An unexpected error occurred"}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            ফিরে যান
          </Button>
          <Button onClick={() => navigate("/")}>
            হোমে যান
          </Button>
        </div>
      </div>
    </div>
  );
}
