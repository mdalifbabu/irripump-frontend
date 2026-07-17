import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./landing/LandingPage";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  return <LandingPage />;
};

export default Index;
