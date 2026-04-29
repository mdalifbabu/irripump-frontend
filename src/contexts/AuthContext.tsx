import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, tokenManager } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/api/types";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { userId: number; role: string } | null;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => Promise<AuthResponse>;
  userLogin: (username: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ userId: number; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = tokenManager.getUser();
    const token = tokenManager.getToken();
    
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const adminLogin = async (username: string, password: string) => {
    const response = await authApi.adminLogin({ username, password });
    setUser({ userId: response.userId, role: response.role });
    return response;
  };

  const userLogin = async (username: string, password: string) => {
    const response = await authApi.userLogin({ username, password });
    setUser({ userId: response.userId, role: response.role });
    return response;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isLoading,
        adminLogin,
        userLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
