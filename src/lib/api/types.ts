// API Response Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  type: string;
  userId: number;
  role: "ADMIN" | "USER";
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  pumpIds?: number[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Pump {
  id: number;
  pumpNameBengali: string;
  pumpNameEnglish: string;
  location: string;
  installationDate: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Farmer {
  id: number;
  pumpId: number;
  pumpName?: string;
  farmerCode: string;
  codeValidUntil?: string;
  nameBengali: string;
  nameEnglish?: string;
  fatherName?: string;
  village: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  nidNumber?: string;
  photoUrl?: string;
  registrationDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Land {
  id: number;
  pumpId: number;
  pumpName?: string;
  landIdentificationNumber: string;
  landmarkNumber: string;
  sizeBigha: number;
  sizeShatak: number;
  coordinates?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmerLandAssignment {
  id: number;
  farmerId: number;
  farmerName?: string;
  farmerCode?: string;
  landId: number;
  landIdentificationNumber?: string;
  landmarkNumber?: string;
  seasonId: number;
  seasonName?: string;
  year: number;
  landSizeBigha?: number;
  landSizeShatak?: number;
  assignedSizeBigha?: number;
  assignedSizeShatak?: number;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export type SeasonKind = "BORO" | "AMAN" | "AUS";

export interface Season {
  id: number;
  seasonKind?: SeasonKind;
  seasonName: string;
  seasonNameBengali: string;
  description?: string;
  startDate: string;
  endDate: string;
  year: number;
  isActive?: boolean;
  isCurrent?: boolean;
  pumpId?: number;
  pumpNameBengali?: string;
  pumpNameEnglish?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeasonDashboard {
  seasonId: number;
  seasonKind?: SeasonKind;
  seasonName: string;
  seasonNameBengali: string;
  year: number;
  totalFarmers: number;
  totalLands: number;
  totalLandSizeBigha: number;
  pricePerShatak: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface LedgerAllocation {
  paymentId: number;
  amountApplied: number;
  paymentDate: string;
  paymentMethod: string;
  allocatedAt: string;
}

export interface SeasonLedger {
  dueId: number;
  seasonId: number;
  seasonKind?: SeasonKind;
  seasonName: string;
  year: number;
  billed: number;
  collected: number;
  outstanding: number;
  allocations: LedgerAllocation[];
}

export interface LedgerResponse {
  farmerId: number;
  farmerCode: string;
  nameBengali: string;
  creditBalance: number;
  seasons: SeasonLedger[];
}

export interface CreateSeasonRequest {
  pumpId: number;
  seasonKind: SeasonKind;
  seasonName: string;
  seasonNameBengali: string;
  description?: string;
  startDate: string;
  endDate: string;
  year: number;
  isActive?: boolean;
  isCurrent?: boolean;
}

export interface UnitPrice {
  id: number;
  pumpId: number;
  seasonId?: number;
  pricePerShatak: number;
  season?: string;
  year?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  farmerId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK" | "MOBILE_BANKING";
  transactionReference?: string;
  paymentType: "PAYMENT" | "ADJUSTMENT" | "DEDUCTION";
  adjustmentReason?: string;
  isReversed?: boolean;
  reversedAt?: string;
  reversedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalFarmers: number;
  totalLands: number;
  totalLandSize: number;
  totalIncome: number;
  totalDue: number;
  totalCost: number;
  pricePerShatak?: number;
  seasonName?: string;
  year?: number;
}

export interface Setting {
  id: number;
  settingKey: string;
  settingValue: string;
  settingCategory: string;
}

export interface FarmerPortalData {
  id?: number;
  farmer: Farmer;
  lands: Land[];
  payments: Payment[];
  totalDue: number;
  totalPaid: number;
}

export interface FarmerSummaryResponse {
  id: number;
  farmerCode: string;
  nameBengali: string;
  nameEnglish?: string;
  village: string;
  mobile: string;
  isActive?: boolean;
  seasonId?: number;
  year?: number;
  landCount?: number;
  totalLandSizeBigha?: number;
  dueAmount?: number;
}

export interface SeasonEnrollmentResponse {
  enrollmentId: number;
  farmerId: number;
  farmerCode: string;
  nameBengali: string;
  nameEnglish?: string;
  village: string;
  mobile: string;
  isActive?: boolean;
  seasonId: number;
  seasonName: string;
  year: number;
  landCount?: number;
  dueAmount?: number;
}

export interface FarmerDetailResponse {
  id: number;
  pumpId: number;
  pumpName?: string;
  farmerCode: string;
  codeValidUntil?: string;
  nameBengali: string;
  nameEnglish?: string;
  fatherName?: string;
  village: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  nidNumber?: string;
  photoUrl?: string;
  registrationDate?: string;
  isActive?: boolean;
  seasonId?: number;
  seasonName?: string;
  year?: number;
  landCount?: number;
  totalLandSizeBigha?: number;
  calculatedCost?: number;
  totalPaid?: number;
  dueAmount?: number;
  advanceAmount?: number;
}

// Request Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  mobile: string;
  pumpIds: number[];
}

export interface UpdateUserRequest {
  username: string;
  fullName: string;
  email: string;
  mobile: string;
}

export interface CreatePumpRequest {
  pumpNameBengali: string;
  pumpNameEnglish: string;
  location: string;
  installationDate: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface CreateFarmerRequest {
  pumpId?: number;
  nameBengali: string;
  nameEnglish?: string;
  fatherName?: string;
  village: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  nidNumber?: string;
  photoUrl?: string;
}

export interface CreateLandRequest {
  pumpId: number;
  landIdentificationNumber: string;
  landmarkNumber: string;
  sizeBigha: number;
  sizeShatak: number;
  coordinates?: string;
  description?: string;
}

export interface AssignLandRequest {
  farmerId: number;
  landId: number;
  seasonId: number;
  year: number;
  assignedSizeBigha?: number;
  assignedSizeShatak?: number;
  notes?: string;
}

export interface CreateUnitPriceRequest {
  pricePerShatak: number;
  seasonId: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdateUnitPriceRequest {
  pricePerShatak?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface CreatePaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BANK" | "MOBILE_BANKING";
  transactionReference?: string;
  paymentType: "PAYMENT" | "ADJUSTMENT" | "DEDUCTION";
}

export interface UpdatePaymentRequest {
  amount: number;
  reason: string;
}

export interface VerifyFarmerCodeRequest {
  farmerCode: string;
}

export interface CreateSettingRequest {
  key: string;
  value: string;
  category: string;
}

// ── Admin module: season-type catalog, dashboard, overrides, audit log ──────────

export interface SeasonType {
  id: number;
  code: SeasonKind;
  nameEnglish: string;
  nameBengali: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSeasonTypeRequest {
  code: string;
  nameEnglish: string;
  nameBengali: string;
  description?: string;
}

export interface UpdateSeasonTypeRequest {
  nameEnglish?: string;
  nameBengali?: string;
  description?: string;
  isActive?: boolean;
}

export type AdminDashboardGroupBy = "pump" | "operator" | "year" | "seasonType";

export interface AdminDashboardRow {
  key: string;
  label: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate?: number;
}

export interface AdminDashboardResponse {
  groupBy: AdminDashboardGroupBy;
  rows: AdminDashboardRow[];
  systemWideOutstanding: number;
}

export interface AdjustDueRequest {
  newAmount?: number;
  waive?: boolean;
  reason: string;
}

export interface ReasonRequest {
  reason: string;
}

export interface DueEntry {
  id: number;
  amount: number;
  remaining: number;
}

export interface AuditLogEntry {
  id: number;
  actorId?: number;
  actorName: string;
  role: "ADMIN" | "USER";
  adminImpersonation: boolean;
  actionType: string;
  tableName: string;
  recordId?: number;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  timestamp: string;
}

export interface AuditLogSearchParams {
  actorId?: number;
  entityType?: string;
  from?: string;
  to?: string;
}

// ── Invoice: backend returns this JSON, the PDF is rendered client-side ──────────

export interface InvoiceResponse {
  invoiceNo: string;
  issuedAt: string;
  pump: { name: string; identifier: string };
  operator: { name: string };
  season: { name?: string; type?: string; year?: number };
  farmer: { name: string; identifier: string };
  lands: { landmarkNumber: string; area: string }[];
  payment: { amount: number; paidAt: string; method: string };
  allocations: { seasonName: string; dueDate: string; applied: number; remainingAfter: number }[];
  balances: { totalDue: number; totalPaid: number; outstanding: number; creditBalance: number };
}

