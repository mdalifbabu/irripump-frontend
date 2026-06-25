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
  activeUntil?: string;
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
  farmerCodePrefix?: string;
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
  landmarkNumber: string;
  sizeShatak: number;
  coordinates?: string;
  description?: string;
  tag?: string;
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
  landmarkNumber?: string;
  seasonId: number;
  seasonName?: string;
  year: number;
  landSizeShatak?: number;
  assignedSizeShatak?: number;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Season {
  id: number;
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
  seasonName: string;
  seasonNameBengali: string;
  year: number;
  totalFarmers: number;
  totalLands: number;
  totalLandSizeShatak: number;
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
  seasonName: string;
  year: number;
  billed: number;
  collected: number;
  outstanding: number;
  allocations: LedgerAllocation[];
}

export interface LedgerResponse {
  farmerId: number;
  pumpId: number;
  farmerCode: string;
  nameBengali: string;
  creditBalance: number;
  seasons: SeasonLedger[];
}

export interface CreateSeasonRequest {
  pumpId: number;
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
  // Payments allocated to the current season only
  payments: Payment[];
  // Current season context
  currentSeasonId?: number;
  currentSeasonName?: string;
  currentSeasonNameBengali?: string;
  currentSeasonYear?: number;
  // Season-wise ledger from FIFO allocation data
  seasonLedgers?: SeasonLedger[];
  // Sum of outstanding across ALL seasons (including fully-active past)
  totalOutstanding: number;
  // Current season outstanding + past seasons with unpaid balance (settled seasons excluded)
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
  totalLandSizeShatak?: number;
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
  totalLandSizeShatak?: number;
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
  landmarkNumber: string;
  sizeShatak?: number;
  coordinates?: string;
  description?: string;
  tag?: string;
}

export interface UpdateLandRequest {
  landmarkNumber?: string;
  sizeShatak?: number;
  coordinates?: string;
  description?: string;
  tag?: string;
  isActive?: boolean;
}

export interface YearlySeasonSummary {
  seasonId: number;
  seasonName: string;
  seasonNameBengali: string;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface YearlyDashboard {
  pumpId: number;
  year: number;
  totalDue: number;
  totalIncome: number;
  seasons: YearlySeasonSummary[];
}

export interface AssignLandRequest {
  farmerId: number;
  landId: number;
  seasonId: number;
  year: number;
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

// ── Admin module: dashboard, overrides, audit log ──────────

export type AdminDashboardGroupBy = "pump" | "operator" | "year";

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
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-indexed)
  size: number;
  last: boolean;
}

export interface PaymentResponse {
  id: number;
  farmerId: number;
  farmerName: string;
  farmerCode: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference?: string;
  paymentType: string;
  adjustmentReason?: string;
  isReversed: boolean;
  reversedAt?: string;
  reversedReason?: string;
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

