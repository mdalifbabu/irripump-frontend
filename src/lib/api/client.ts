import type {
  AuthResponse, User, Pump, Farmer, Land, UnitPrice, Payment, DashboardStats,
  Setting, FarmerPortalData, LoginRequest, RefreshTokenRequest, CreateUserRequest,
  UpdateUserRequest, CreatePumpRequest, CreateFarmerRequest, CreateLandRequest, UpdateLandRequest,
  CreateUnitPriceRequest, UpdateUnitPriceRequest, CreatePaymentRequest, UpdatePaymentRequest,
  VerifyFarmerCodeRequest, CreateSettingRequest, FarmerLandAssignment, Season,
  AssignLandRequest, FarmerSummaryResponse, FarmerDetailResponse, CreateSeasonRequest,
  SeasonEnrollmentResponse, SeasonDashboard, LedgerResponse,
  SeasonType, CreateSeasonTypeRequest, UpdateSeasonTypeRequest,
  AdminDashboardGroupBy, AdminDashboardResponse, AdjustDueRequest, ReasonRequest,
  DueEntry, AuditLogEntry, AuditLogSearchParams, PageResponse, PaymentResponse, InvoiceResponse, YearlyDashboard,
} from "./types";

//const API_BASE_URL = "http://localhost:8081/api";
const API_BASE_URL = "http://192.168.0.106:8081/api";
//const API_BASE_URL = "https://api.irripump.com/api";

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
        const errData = await refreshResponse.json().catch(() => ({})) as { errorCode?: string };
        if (errData.errorCode === "ACCOUNT_DEACTIVATED") {
          localStorage.setItem("irripump_flash", JSON.stringify({ type: "deactivated" }));
        }
      } catch {
        // network error or retry failed — fall through to clear + redirect
      }
    }
    tokenManager.clear();
    window.location.href = "/auth";
    return {} as T;
  }

  if (response.status === 403) {
    const errData = await response.json().catch(() => ({})) as { errorCode?: string; message?: string };
    if (errData.errorCode === "ACCOUNT_DEACTIVATED") {
      tokenManager.clear();
      localStorage.setItem("irripump_flash", JSON.stringify({ type: "deactivated" }));
      window.location.href = "/auth";
      return {} as T;
    }
    throw new Error(errData.message || "Access denied");
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
  setStatus: async (userId: number, isActive: boolean): Promise<User> =>
    apiRequest<User>(`/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  reactivate: async (userId: number): Promise<User> =>
    apiRequest<User>(`/admin/users/${userId}/reactivate`, { method: "PUT" }),
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
  getFarmersPaged: async (pumpId: number | undefined, query: string, page: number, size: number): Promise<PageResponse<Farmer>> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (pumpId) params.append("pumpId", String(pumpId));
    if (query) params.append("query", query);
    return apiRequest<PageResponse<Farmer>>(`/admin/farmers/paged?${params}`);
  },
  updateCodePrefix: async (pumpId: number, prefix: string): Promise<Pump> =>
    apiRequest<Pump>(`/admin/pumps/${pumpId}/code-prefix`, { method: "PATCH", body: JSON.stringify({ prefix }) }),
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
  hardDelete: async (id: number, reason: string): Promise<void> =>
    apiRequest<void>(`/admin/pumps/${id}?force=true`, { method: "DELETE", body: JSON.stringify({ reason }) }),
  reassign: async (id: number, operatorId: number): Promise<Pump> =>
    apiRequest<Pump>(`/admin/pumps/${id}/assign`, { method: "PATCH", body: JSON.stringify({ operatorId }) }),
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
  searchPaged: async (pumpId: number, q: string, page: number, size: number): Promise<PageResponse<Farmer>> =>
    apiRequest<PageResponse<Farmer>>(`/farmers/pump/${pumpId}/search/paged?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),
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
  getByPumpPaged: async (pumpId: number, page: number, size: number, query?: string): Promise<PageResponse<Land>> => {
    const qs = new URLSearchParams({ pumpId: String(pumpId), page: String(page), size: String(size) });
    if (query) qs.append("query", query);
    return apiRequest<PageResponse<Land>>(`/lands/paged?${qs}`);
  },
  getById: async (id: number): Promise<Land> => apiRequest<Land>(`/lands/${id}`),
  getAssignedPaged: async (pumpId: number, seasonId: number, year: number, page: number, size: number): Promise<PageResponse<Land>> =>
    apiRequest<PageResponse<Land>>(`/lands/assigned/paged?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}&page=${page}&size=${size}`),
  getUnassignedPaged: async (pumpId: number, seasonId: number, year: number, page: number, size: number): Promise<PageResponse<Land>> =>
    apiRequest<PageResponse<Land>>(`/lands/unassigned/paged?pumpId=${pumpId}&seasonId=${seasonId}&year=${year}&page=${page}&size=${size}`),
  update: async (id: number, data: UpdateLandRequest): Promise<Land> =>
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
  update: async (id: number, data: UpdateLandRequest): Promise<Land> =>
    apiRequest<Land>(`/admin/lands/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/lands/${id}`, { method: "DELETE" }),
  search: async (pumpId: number, query: string): Promise<Land[]> =>
    apiRequest<Land[]>(`/admin/lands/search?pumpId=${pumpId}&query=${encodeURIComponent(query)}`),
  getDuplicateLandmarks: async (): Promise<Land[]> =>
    apiRequest<Land[]>("/admin/lands/duplicate-landmarks"),
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
  getFarmerHistory: async (farmerId: number, page: number, size: number): Promise<PageResponse<Season>> => {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    return apiRequest<PageResponse<Season>>(`/seasons/farmer/${farmerId}/history?${qs}`);
  },
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
  create: async (farmerId: number, data: CreatePaymentRequest, seasonId?: number): Promise<Payment> => {
    const qs = seasonId ? `?seasonId=${seasonId}` : "";
    return apiRequest<Payment>(`/payments/farmer/${farmerId}${qs}`, { method: "POST", body: JSON.stringify(data) });
  },
  update: async (id: number, data: UpdatePaymentRequest): Promise<Payment> =>
    apiRequest<Payment>(`/payments/${id}/update`, { method: "PUT", body: JSON.stringify(data) }),
  getByFarmer: async (farmerId: number): Promise<Payment[]> =>
    apiRequest<Payment[]>(`/payments/farmer/${farmerId}`),
  getByFarmerPaged: async (farmerId: number, page: number, size: number, seasonId?: number, year?: number): Promise<PageResponse<Payment>> => {
    const qs = new URLSearchParams({ page: String(page), size: String(size) });
    if (seasonId) qs.append("seasonId", String(seasonId));
    else if (year) qs.append("year", String(year));
    return apiRequest<PageResponse<Payment>>(`/payments/farmer/${farmerId}/paged?${qs}`);
  },
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/payments/${id}`, { method: "DELETE" }),
  getTotalPaid: async (farmerId: number): Promise<number> =>
    apiRequest<number>(`/payments/farmer/${farmerId}/total`),
  getByPump: async (pumpId: number): Promise<Payment[]> =>
    apiRequest<Payment[]>(`/payments/pump/${pumpId}`),
  getByPumpPaged: async (
    pumpId: number, page: number, size: number,
    filters?: { farmerName?: string; paymentDate?: string; reference?: string; seasonId?: number }
  ): Promise<PageResponse<PaymentResponse>> => {
    const qs = new URLSearchParams({ pumpId: String(pumpId), page: String(page), size: String(size) });
    if (filters?.farmerName) qs.append("farmerName", filters.farmerName);
    if (filters?.paymentDate) qs.append("paymentDate", filters.paymentDate);
    if (filters?.reference) qs.append("reference", filters.reference);
    if (filters?.seasonId) qs.append("seasonId", String(filters.seasonId));
    return apiRequest<PageResponse<PaymentResponse>>(`/payments/pump/${pumpId}/paged?${qs}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (pumpId: number, season?: string, year?: number): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (season) params.append("season", season);
    if (year) params.append("year", String(year));
    return apiRequest<DashboardStats>(`/dashboard/pump/${pumpId}/stats?${params}`);
  },
  getYearlySummary: async (pumpId: number, year: number): Promise<YearlyDashboard> =>
    apiRequest<YearlyDashboard>(`/dashboard/pump/${pumpId}/year/${year}/summary`),
};

// Season Type catalog (admin-managed; operators read the active list)
export const seasonTypeApi = {
  getActive: async (): Promise<SeasonType[]> => apiRequest<SeasonType[]>("/season-types"),
};

export const adminSeasonTypeApi = {
  getAll: async (): Promise<SeasonType[]> => apiRequest<SeasonType[]>("/admin/season-types"),
  create: async (data: CreateSeasonTypeRequest): Promise<SeasonType> =>
    apiRequest<SeasonType>("/admin/season-types", { method: "POST", body: JSON.stringify(data) }),
  update: async (id: number, data: UpdateSeasonTypeRequest): Promise<SeasonType> =>
    apiRequest<SeasonType>(`/admin/season-types/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: async (id: number): Promise<void> =>
    apiRequest<void>(`/admin/season-types/${id}`, { method: "DELETE" }),
};

// Aggregated cross-cutting admin dashboard
export const adminDashboardApi = {
  getAggregated: async (groupBy: AdminDashboardGroupBy, year?: number, pumpId?: number): Promise<AdminDashboardResponse> => {
    const params = new URLSearchParams({ groupBy });
    if (year) params.append("year", String(year));
    if (pumpId) params.append("pumpId", String(pumpId));
    return apiRequest<AdminDashboardResponse>(`/admin/dashboard?${params}`);
  },
};

// Admin override authority — each action requires a reason, each is audited
export const adminOverrideApi = {
  adjustDue: async (dueId: number, data: AdjustDueRequest): Promise<DueEntry> =>
    apiRequest<DueEntry>(`/admin/dues/${dueId}/adjust`, { method: "POST", body: JSON.stringify(data) }),
  reversePayment: async (paymentId: number, data: ReasonRequest): Promise<Payment> =>
    apiRequest<Payment>(`/admin/payments/${paymentId}/reverse`, { method: "POST", body: JSON.stringify(data) }),
  forceRemoveFarmer: async (seasonId: number, farmerId: number, data: ReasonRequest): Promise<void> =>
    apiRequest<void>(`/admin/seasons/${seasonId}/farmers/${farmerId}?force=true`, {
      method: "DELETE", body: JSON.stringify(data),
    }),
  hardDeleteSeason: async (seasonId: number, data: ReasonRequest): Promise<void> =>
    apiRequest<void>(`/admin/seasons/${seasonId}?force=true`, { method: "DELETE", body: JSON.stringify(data) }),
};

// Read-only audit log
export const auditLogApi = {
  search: async (params: AuditLogSearchParams): Promise<PageResponse<AuditLogEntry>> => {
    const qs = new URLSearchParams();
    if (params.actorId) qs.append("actorId", String(params.actorId));
    if (params.entityType) qs.append("entityType", params.entityType);
    if (params.from) qs.append("from", params.from);
    if (params.to) qs.append("to", params.to);
    qs.append("page", String(params.page ?? 0));
    qs.append("size", String(params.size ?? 50));
    return apiRequest<PageResponse<AuditLogEntry>>(`/admin/audit?${qs}`);
  },
  getTableNames: async (): Promise<string[]> =>
    apiRequest<string[]>("/admin/audit/tables"),
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

  /** Magic Button: transfer all farmers + land assignments from sourceSeasonId into targetSeasonId */
  transferFrom: async (targetSeasonId: number, sourceSeasonId: number): Promise<{ transferredFarmers: number }> =>
    apiRequest<{ transferredFarmers: number }>(
      `/seasons/${targetSeasonId}/enrollments/transfer-from/${sourceSeasonId}`,
      { method: "POST" }
    ),
};

// Reports API (payment receipt is still server-rendered — out of scope for the invoice rework)
export const reportsApi = {
  downloadPaymentReceipt: async (farmerId: number): Promise<Blob> => {
    const token = tokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/reports/farmer/${farmerId}/payment-receipt`, {
      headers: { Authorization: token || "" },
    });
    if (!response.ok) throw new Error("Failed to download receipt");
    return response.blob();
  },
};

// Invoice API — JSON only; the PDF is built client-side, see lib/invoice/buildInvoicePdf.ts
export const invoiceApi = {
  get: async (paymentId: number): Promise<InvoiceResponse> =>
    apiRequest<InvoiceResponse>(`/invoices/${paymentId}`),
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
  getLedger: async (farmerId: number, seasonId?: number): Promise<LedgerResponse> => {
    const qs = seasonId ? `?seasonId=${seasonId}` : "";
    return apiRequest<LedgerResponse>(`/farmers/${farmerId}/ledger${qs}`);
  },
};
