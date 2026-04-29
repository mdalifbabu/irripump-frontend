import type {
  AuthResponse,
  User,
  Pump,
  Farmer,
  Land,
  UnitPrice,
  Payment,
  DashboardStats,
  Setting,
  FarmerPortalData,
  LoginRequest,
  RefreshTokenRequest,
  CreateUserRequest,
  CreatePumpRequest,
  CreateFarmerRequest,
  CreateLandRequest,
  CreateUnitPriceRequest,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  VerifyFarmerCodeRequest,
  CreateSettingRequest,
} from "./types";

const API_BASE_URL = "http://localhost:8081/api";

// Token management
const TOKEN_KEY = "irripump_token";
const REFRESH_TOKEN_KEY = "irripump_refresh_token";
const USER_KEY = "irripump_user";

export const tokenManager = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  getUser: (): { userId: number; role: string } | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },
  setUser: (user: { userId: number; role: string }) =>
    localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// API client with error handling and token refresh
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenManager.getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = token;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data: AuthResponse = await refreshResponse.json();
          tokenManager.setToken(`${data.type} ${data.accessToken}`);
          tokenManager.setRefreshToken(data.refreshToken);
          
          // Retry original request
          (headers as Record<string, string>)["Authorization"] = `${data.type} ${data.accessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.status}`);
          }
          return retryResponse.json();
        }
      } catch {
        tokenManager.clear();
        window.location.href = "/auth";
      }
    }
    tokenManager.clear();
    window.location.href = "/auth";
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  
  return {} as T;
}

// Auth API
export const authApi = {
  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    tokenManager.setToken(`${response.type} ${response.accessToken}`);
    tokenManager.setRefreshToken(response.refreshToken);
    tokenManager.setUser({ userId: response.userId, role: response.role });
    return response;
  },

  userLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/user/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    tokenManager.setToken(`${response.type} ${response.accessToken}`);
    tokenManager.setRefreshToken(response.refreshToken);
    tokenManager.setUser({ userId: response.userId, role: response.role });
    return response;
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    tokenManager.clear();
  },

  refreshToken: async (data: RefreshTokenRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// User API (Admin only)
export const userApi = {
  create: async (data: CreateUserRequest): Promise<User> => {
    return apiRequest<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  impersonate: async (userId: number): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>(`/admin/users/${userId}/impersonate`, {
      method: "POST",
    });
  },

  getAll: async (): Promise<User[]> => {
    return apiRequest<User[]>("/admin/users");
  },

  update: async (userId: number, data: Partial<CreateUserRequest>): Promise<User> => {
    return apiRequest<User>(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (userId: number): Promise<void> => {
    return apiRequest<void>(`/admin/users/${userId}`, { method: "DELETE" });
  },
};

// Pump API
export const pumpApi = {
  create: async (data: CreatePumpRequest): Promise<Pump> => {
    return apiRequest<Pump>("/admin/pumps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<Pump[]> => {
    return apiRequest<Pump[]>("/admin/pumps");
  },

  getById: async (id: number): Promise<Pump> => {
    return apiRequest<Pump>(`/admin/pumps/${id}`);
  },

  update: async (id: number, data: Partial<CreatePumpRequest>): Promise<Pump> => {
    return apiRequest<Pump>(`/admin/pumps/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/admin/pumps/${id}`, { method: "DELETE" });
  },
};

// Farmer API
export const farmerApi = {
  create: async (pumpId: number, data: CreateFarmerRequest): Promise<Farmer> => {
    return apiRequest<Farmer>(`/farmers/pump/${pumpId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  search: async (pumpId: number, query: string): Promise<Farmer[]> => {
    return apiRequest<Farmer[]>(
      `/farmers/pump/${pumpId}/search?query=${encodeURIComponent(query)}`
    );
  },

  getByPump: async (pumpId: number): Promise<Farmer[]> => {
    return apiRequest<Farmer[]>(`/farmers/pump/${pumpId}`);
  },

  getById: async (id: number): Promise<Farmer> => {
    return apiRequest<Farmer>(`/farmers/${id}`);
  },

  update: async (id: number, data: Partial<CreateFarmerRequest>): Promise<Farmer> => {
    return apiRequest<Farmer>(`/farmers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/farmers/${id}`, { method: "DELETE" });
  },
};

// Land API
export const landApi = {
  create: async (farmerId: number, data: CreateLandRequest): Promise<Land> => {
    return apiRequest<Land>(`/lands/farmer/${farmerId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getByFarmer: async (farmerId: number): Promise<Land[]> => {
    return apiRequest<Land[]>(`/lands/farmer/${farmerId}`);
  },

  update: async (id: number, data: Partial<CreateLandRequest>): Promise<Land> => {
    return apiRequest<Land>(`/lands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/lands/${id}`, { method: "DELETE" });
  },
};

// Unit Price API
export const unitPriceApi = {
  create: async (pumpId: number, data: CreateUnitPriceRequest): Promise<UnitPrice> => {
    return apiRequest<UnitPrice>(`/unit-prices/pump/${pumpId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getByPump: async (pumpId: number): Promise<UnitPrice[]> => {
    return apiRequest<UnitPrice[]>(`/unit-prices/pump/${pumpId}`);
  },

  update: async (id: number, data: Partial<CreateUnitPriceRequest>): Promise<UnitPrice> => {
    return apiRequest<UnitPrice>(`/unit-prices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/unit-prices/${id}`, { method: "DELETE" });
  },
};

// Payment API
export const paymentApi = {
  create: async (farmerId: number, data: CreatePaymentRequest): Promise<Payment> => {
    return apiRequest<Payment>(`/payments/farmer/${farmerId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (paymentId: number, data: UpdatePaymentRequest): Promise<Payment> => {
    return apiRequest<Payment>(`/payments/${paymentId}/update`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getByFarmer: async (farmerId: number): Promise<Payment[]> => {
    return apiRequest<Payment[]>(`/payments/farmer/${farmerId}`);
  },

  delete: async (paymentId: number): Promise<void> => {
    return apiRequest<void>(`/payments/${paymentId}`, { method: "DELETE" });
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (pumpId: number): Promise<DashboardStats> => {
    const currentYear = new Date().getFullYear();
    const season =  "AMAN";
    return apiRequest<DashboardStats>(`/dashboard/pump/${pumpId}/season/${season}/year/${currentYear}/stats`);
  },
};

// Invoice/Reports API
export const reportsApi = {
  downloadInvoice: async (farmerId: number): Promise<Blob> => {
    const token = tokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/farmer/${farmerId}/invoice`, {
      headers: {
        Authorization: token || "",
      },
    });
    if (!response.ok) {
      throw new Error("Failed to download invoice");
    }
    return response.blob();
  },
};

// Settings API
export const settingsApi = {
  create: async (pumpId: number, data: CreateSettingRequest): Promise<Setting> => {
    return apiRequest<Setting>(`/settings/pump/${pumpId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getByPump: async (pumpId: number): Promise<Setting[]> => {
    return apiRequest<Setting[]>(`/settings/pump/${pumpId}`);
  },

  update: async (id: number, data: Partial<CreateSettingRequest>): Promise<Setting> => {
    return apiRequest<Setting>(`/settings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/settings/${id}`, { method: "DELETE" });
  },
};

// Farmer Portal API
export const farmerPortalApi = {
  verifyCode: async (data: VerifyFarmerCodeRequest): Promise<FarmerPortalData> => {
    return apiRequest<FarmerPortalData>("/farmer-portal/verify-code", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Hello API (for testing)
export const helloApi = {
  test: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>("/hello");
  },
};