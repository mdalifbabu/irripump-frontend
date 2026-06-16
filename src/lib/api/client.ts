import type {
  AuthResponse, User, Pump, Farmer, Land, UnitPrice, Payment, DashboardStats,
  Setting, FarmerPortalData, LoginRequest, RefreshTokenRequest, CreateUserRequest,
  UpdateUserRequest, CreatePumpRequest, CreateFarmerRequest, CreateLandRequest,
  CreateUnitPriceRequest, UpdateUnitPriceRequest, CreatePaymentRequest, UpdatePaymentRequest,
  VerifyFarmerCodeRequest, CreateSettingRequest, FarmerLandAssignment, Season,
  AssignLandRequest, FarmerSummaryResponse, FarmerDetailResponse, CreateSeasonRequest,
  SeasonEnrollmentResponse, SeasonDashboard, LedgerResponse,
} from "./types";

//const API_BASE_URL = "http://localhost:8081/api";
const API_BASE_URL = "http://192.168.0.106:8081/api";

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

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenManager.getToken();
  const headers: HeadersInit = { "Content-Type": "application/json", ...options.headers };
  if (token) (headers as Record<string, string>)["Authorization"] = token;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
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
          (headers as Record<string, string>)["Authorization"] = `${data.type} ${data.accessToken}`;
          const retry = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
          if (!retry.ok) throw new Error(`API Error: ${retry.status}`);
          return retry.json();
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

  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType?.includes("application/json")) return {} as T;
  return response.json();
}

// Auth API
export const authApi = {
  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/admin/login", {
      method: "POST", body: JSON.stringify(data),
    });
    tokenManager.setToken(`${response.type} ${response.accessToken}`);
    tokenManager.setRefreshToken(response.refreshToken);
    tokenManager.setUser({ userId: response.userId, role: response.role });
    return response;
  },
  userLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>("/user/login", {
      method: "POST", body: JSON.stringify(data),
    });
    tokenManager.setToken(`${response.type} ${response.accessToken}`);
    tokenManager.setRefreshToken(response.refreshToken);
    tokenManager.setUser({ userId: response.userId, role: response.role });
    return response;
  },
  logout: async (): Promise<void> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      const user = tokenManager.getUser();
      const endpoint = user?.role === "ADMIN" ? "/admin/logout" : "/user/logout";
      await apiRequest(endpoint, { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => {});
    }
    tokenManager.clear();
  },
};

// User API (Admin only)
export const userApi = {
  create: async (data: CreateUserRequest): Promise<User> =>
    apiRequest<User>("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  getAll: async (): Promise<User[]> => apiRequest<User[]>("/admin/users"),
  getById: async (id: number): Promise<User> => apiRequest<User>(`/admin/users/${id}`),
  update: async (id: number, data: UpdateUserRequest): Promise<User> =>
    apiRequest<User>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/users/${id}`, { method: "DELETE" }),
  resetPassword: async (id: number, newPassword: string): Promise<void> =>
    apiRequest<void>(`/admin/users/reset-password/${id}`, {
      method: "PATCH", body: JSON.stringify({ newPassword }),
    }),
  assignPump: async (userId: number, pumpId: number): Promise<void> =>
    apiRequest<void>(`/admin/users/${userId}/assign-pump/${pumpId}`, { method: "POST" }),
  removePump: async (userId: number, pumpId: number): Promise<void> =>
    apiRequest<void>(`/admin/users/${userId}/pumps/${pumpId}`, { method: "DELETE" }),
  impersonate: async (userId: number): Promise<{ token: string }> =>
    apiRequest<{ token: string }>(`/admin/users/${userId}/impersonate`, { method: "POST" }),
};

// Admin stats
export const adminApi = {
  getStats: async (): Promise<{ totalUsers: number; totalPumps: number; totalFarmers: number }> =>
    apiRequest("/admin/stats"),
  getAllFarmers: async (pumpId?: number, query?: string): Promise<Farmer[]> => {
    const params = new URLSearchParams();
    if (pumpId) params.append("pumpId", String(pumpId));
    if (query) params.append("query", query);
    return apiRequest<Farmer[]>(`/admin/farmers?${params}`);
  },
};

// Pump API
export const pumpApi = {
  create: async (data: CreatePumpRequest): Promise<Pump> =>
    apiRequest<Pump>("/admin/pumps", { method: "POST", body: JSON.stringify(data) }),
  getAll: async (): Promise<Pump[]> => apiRequest<Pump[]>("/admin/pumps"),
  getById: async (id: number): Promise<Pump> => apiRequest<Pump>(`/admin/pumps/${id}`),
  update: async (id: number, data: Partial<CreatePumpRequest>): Promise<Pump> =>
    apiRequest<Pump>(`/admin/pumps/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/pumps/${id}`, { method: "DELETE" }),
  getAssigned: async (): Promise<Pump[]> => apiRequest<Pump[]>("/user/assigned-pumps"),
};

// Farmer API
export const farmerApi = {
  create: async (pumpId: number, data: CreateFarmerRequest): Promise<Farmer> =>
    apiRequest<Farmer>(`/farmers/pump/${pumpId}`, { method: "POST", body: JSON.stringify(data) }),
  getByPump: async (pumpId: number): Promise<Farmer[]> =>
    apiRequest<Farmer[]>(`/farmers/pump/${pumpId}`),
  search: async (pumpId: number, query: string): Promise<Farmer[]> =>
    apiRequest<Farmer[]>(`/farmers/pump/${pumpId}/search?query=${encodeURIComponent(query)}`),
  getSummary: async (pumpId: number, seasonId: number, year: number): Promise<FarmerSummaryResponse[]> =>
    apiRequest<FarmerSummaryResponse[]>(`/farmers/pump/${pumpId}/summary?seasonId=${seasonId}&year=${year}`),
  getById: async (id: number): Promise<Farmer> => apiRequest<Farmer>(`/farmers/${id}`),
  getDetail: async (id: number, seasonId: number, year: number): Promise<FarmerDetailResponse> =>
    apiRequest<FarmerDetailResponse>(`/farmers/${id}/detail?seasonId=${seasonId}&year=${year}`),
  update: async (id: number, data: Partial<CreateFarmerRequest>): Promise<Farmer> =>
    apiRequest<Farmer>(`/farmers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/farmers/${id}`, { method: "DELETE" }),
};

// Land API
export const landApi = {
  create: async (data: CreateLandRequest): Promise<Land> =>
    apiRequest<Land>("/lands", { method: "POST", body: JSON.stringify(data) }),
  getByPump: async (pumpId: number): Promise<Land[]> =>
    apiRequest<Land[]>(`/lands?pumpId=${pumpId}`),
  getActivByPump: async (pumpId: number): Promise<Land[]> =>
    apiRequest<Land[]>(`/lands/active?pumpId=${pumpId}`),
  getAvailable: async (pumpId: number, seasonId: number, year: number): Promise<Land[]> =>
    apiRequest<Land[]>(`/lands/available?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}`),
  search: async (pumpId: number, query: string): Promise<Land[]> =>
    apiRequest<Land[]>(`/lands/search?pumpId=${pumpId}&query=${encodeURIComponent(query)}`),
  getById: async (id: number): Promise<Land> => apiRequest<Land>(`/lands/${id}`),
  update: async (id: number, data: Partial<CreateLandRequest>): Promise<Land> =>
    apiRequest<Land>(`/lands/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/lands/${id}`, { method: "DELETE" }),
};

// Admin Land API
export const adminLandApi = {
  create: async (data: CreateLandRequest): Promise<Land> =>
    apiRequest<Land>("/admin/lands", { method: "POST", body: JSON.stringify(data) }),
  getByPump: async (pumpId: number): Promise<Land[]> =>
    apiRequest<Land[]>(`/admin/lands?pumpId=${pumpId}`),
  getById: async (id: number): Promise<Land> => apiRequest<Land>(`/admin/lands/${id}`),
  update: async (id: number, data: Partial<CreateLandRequest>): Promise<Land> =>
    apiRequest<Land>(`/admin/lands/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/lands/${id}`, { method: "DELETE" }),
  search: async (pumpId: number, query: string): Promise<Land[]> =>
    apiRequest<Land[]>(`/admin/lands/search?pumpId=${pumpId}&query=${encodeURIComponent(query)}`),
};

// Farmer-Land Assignment API
export const assignmentApi = {
  assign: async (data: AssignLandRequest): Promise<FarmerLandAssignment> =>
    apiRequest<FarmerLandAssignment>("/farmer-land-assignments", {
      method: "POST", body: JSON.stringify(data),
    }),
  remove: async (assignmentId: number): Promise<void> =>
    apiRequest<void>(`/farmer-land-assignments/${assignmentId}`, { method: "DELETE" }),
  getAll: async (pumpId: number, seasonId: number, year: number): Promise<FarmerLandAssignment[]> =>
    apiRequest<FarmerLandAssignment[]>(
      `/farmer-land-assignments?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}`
    ),
  getByFarmer: async (farmerId: number, pumpId: number, seasonId: number, year: number): Promise<FarmerLandAssignment[]> =>
    apiRequest<FarmerLandAssignment[]>(
      `/farmer-land-assignments/farmer/${farmerId}?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}`
    ),
  getStats: async (pumpId: number, seasonId: number, year: number): Promise<Record<string, number>> =>
    apiRequest(`/farmer-land-assignments/statistics?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}`),
};

// Season API
export const seasonApi = {
  getAll: async (): Promise<Season[]> => apiRequest<Season[]>("/seasons"),
  getActive: async (): Promise<Season[]> => apiRequest<Season[]>("/seasons/active"),
  getCurrent: async (): Promise<Season> => apiRequest<Season>("/seasons/current"),
  getById: async (id: number): Promise<Season> => apiRequest<Season>(`/seasons/${id}`),
  getByYear: async (year: number): Promise<Season[]> => apiRequest<Season[]>(`/seasons/year/${year}`),
  // Pump+Year scoped (primary — operator navbar uses this)
  getByPumpAndYear: async (pumpId: number, year: number): Promise<Season[]> =>
    apiRequest<Season[]>(`/seasons/pump/${pumpId}/year/${year}`),
  createForPumpYear: async (pumpId: number, year: number, data: Omit<CreateSeasonRequest, "pumpId" | "year">): Promise<Season> =>
    apiRequest<Season>(`/seasons/pump/${pumpId}/year/${year}/seasons`, { method: "POST", body: JSON.stringify(data) }),
  getDashboard: async (seasonId: number): Promise<SeasonDashboard> =>
    apiRequest<SeasonDashboard>(`/seasons/${seasonId}/dashboard`),
  // Pump-specific (legacy)
  getByPump: async (pumpId: number): Promise<Season[]> =>
    apiRequest<Season[]>(`/seasons/pump/${pumpId}`),
  getActiveByPump: async (pumpId: number): Promise<Season[]> =>
    apiRequest<Season[]>(`/seasons/pump/${pumpId}/active`),
  getCurrentByPump: async (pumpId: number): Promise<Season> =>
    apiRequest<Season>(`/seasons/pump/${pumpId}/current`),
  create: async (data: CreateSeasonRequest): Promise<Season> =>
    apiRequest<Season>("/seasons", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: number, data: Partial<CreateSeasonRequest>): Promise<Season> =>
    apiRequest<Season>(`/seasons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  setCurrent: async (id: number): Promise<Season> =>
    apiRequest<Season>(`/seasons/${id}/set-current`, { method: "PUT" }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/seasons/${id}`, { method: "DELETE" }),
};

// Unit Price API
export const unitPriceApi = {
  create: async (pumpId: number, data: CreateUnitPriceRequest): Promise<UnitPrice> =>
    apiRequest<UnitPrice>(`/unit-prices/pump/${pumpId}`, { method: "POST", body: JSON.stringify(data) }),
  getByPump: async (pumpId: number): Promise<UnitPrice[]> =>
    apiRequest<UnitPrice[]>(`/unit-prices/pump/${pumpId}`),
  update: async (id: number, data: UpdateUnitPriceRequest): Promise<UnitPrice> =>
    apiRequest<UnitPrice>(`/unit-prices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/unit-prices/${id}`, { method: "DELETE" }),
};

export const adminUnitPriceApi = {
  create: async (pumpId: number, data: CreateUnitPriceRequest): Promise<UnitPrice> =>
    apiRequest<UnitPrice>(`/admin/unit-prices/pump/${pumpId}`, { method: "POST", body: JSON.stringify(data) }),
  getByPump: async (pumpId: number): Promise<UnitPrice[]> =>
    apiRequest<UnitPrice[]>(`/admin/unit-prices/pump/${pumpId}`),
  update: async (id: number, data: UpdateUnitPriceRequest): Promise<UnitPrice> =>
    apiRequest<UnitPrice>(`/admin/unit-prices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/unit-prices/${id}`, { method: "DELETE" }),
};

// Payment API
export const paymentApi = {
  create: async (farmerId: number, data: CreatePaymentRequest): Promise<Payment> =>
    apiRequest<Payment>(`/payments/farmer/${farmerId}`, { method: "POST", body: JSON.stringify(data) }),
  update: async (id: number, data: UpdatePaymentRequest): Promise<Payment> =>
    apiRequest<Payment>(`/payments/${id}/update`, { method: "PUT", body: JSON.stringify(data) }),
  getByFarmer: async (farmerId: number): Promise<Payment[]> =>
    apiRequest<Payment[]>(`/payments/farmer/${farmerId}`),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/payments/${id}`, { method: "DELETE" }),
  getTotalPaid: async (farmerId: number): Promise<number> =>
    apiRequest<number>(`/payments/farmer/${farmerId}/total`),
};

// Dashboard API
export const dashboardApi = {
  getStats: async (pumpId: number, season?: string, year?: number): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (season) params.append("season", season);
    if (year) params.append("year", String(year));
    return apiRequest<DashboardStats>(`/dashboard/pump/${pumpId}/stats?${params}`);
  },
};

// Season Enrollment API
export const enrollmentApi = {
  /** Farmers enrolled in a specific season */
  getEnrolled: async (seasonId: number): Promise<SeasonEnrollmentResponse[]> =>
    apiRequest<SeasonEnrollmentResponse[]>(`/seasons/${seasonId}/enrollments`),

  /** Pump farmers NOT yet enrolled in this season (picker list) */
  getAvailable: async (seasonId: number): Promise<Farmer[]> =>
    apiRequest<Farmer[]>(`/seasons/${seasonId}/enrollments/available`),

  /** Enroll an existing farmer */
  enroll: async (seasonId: number, farmerId: number): Promise<SeasonEnrollmentResponse> =>
    apiRequest<SeasonEnrollmentResponse>(`/seasons/${seasonId}/enrollments`, {
      method: "POST",
      body: JSON.stringify({ farmerId }),
    }),

  /** Create a new farmer and immediately enroll them */
  createAndEnroll: async (seasonId: number, data: CreateFarmerRequest): Promise<SeasonEnrollmentResponse> =>
    apiRequest<SeasonEnrollmentResponse>(`/seasons/${seasonId}/enrollments/create-and-enroll`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Remove a farmer from this season */
  unenroll: async (seasonId: number, farmerId: number): Promise<void> =>
    apiRequest<void>(`/seasons/${seasonId}/enrollments/${farmerId}`, { method: "DELETE" }),
};

// Reports API
export const reportsApi = {
  downloadInvoice: async (farmerId: number): Promise<Blob> => {
    const token = tokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/farmer/${farmerId}/invoice`, {
      headers: { Authorization: token || "" },
    });
    if (!response.ok) throw new Error("Failed to download invoice");
    return response.blob();
  },
  downloadJasperInvoice: async (farmerId: number, season: string, year: number): Promise<Blob> => {
    const token = tokenManager.getToken();
    const response = await fetch(
      `${API_BASE_URL}/reports/invoice/farmer/${farmerId}?season=${encodeURIComponent(season)}&year=${year}`,
      { headers: { Authorization: token || "" } }
    );
    if (!response.ok) throw new Error("Failed to generate invoice");
    return response.blob();
  },
};

// Settings API
export const settingsApi = {
  save: async (pumpId: number, data: CreateSettingRequest): Promise<Setting> =>
    apiRequest<Setting>(`/settings/pump/${pumpId}`, { method: "POST", body: JSON.stringify(data) }),
  getAll: async (pumpId: number): Promise<Setting[]> =>
    apiRequest<Setting[]>(`/settings/pump/${pumpId}`),
  get: async (pumpId: number, key: string): Promise<string> =>
    apiRequest<string>(`/settings/pump/${pumpId}/${key}`),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/settings/${id}`, { method: "DELETE" }),
};

// Farmer Portal API
export const farmerPortalApi = {
  verifyCode: async (data: VerifyFarmerCodeRequest): Promise<FarmerPortalData> =>
    apiRequest<FarmerPortalData>("/farmer-portal/verify-code", {
      method: "POST", body: JSON.stringify(data),
    }),
};

// Ledger API
export const ledgerApi = {
  getLedger: async (farmerId: number): Promise<LedgerResponse> =>
    apiRequest<LedgerResponse>(`/farmers/${farmerId}/ledger`),
};
