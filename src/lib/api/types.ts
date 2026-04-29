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
  pumpIds: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Pump {
  id: number;
  pumpNameBengali: string;
  pumpNameEnglish: string;
  location: string;
  installationDate: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  createdAt?: string;
  updatedAt?: string;
}

export interface Farmer {
  id: number;
  farmerCode: string;
  nameBengali: string;
  nameEnglish: string;
  fatherName: string;
  village: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  nidNumber: string;
  pumpId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Land {
  id: number;
  farmerId: number;
  landIdentificationNumber: string;
  landmarkNumber: string;
  sizeBigha: number;
  sizeShatak: number;
  coordinates?: string;
  season: string;
  year: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnitPrice {
  id: number;
  pumpId: number;
  pricePerBigha: number;
  season: string;
  year: number;
  effectiveFrom: string;
  effectiveTo: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: number;
  farmerId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BKASH" | "NAGAD" | "BANK";
  transactionReference?: string;
  paymentType: "PAYMENT" | "REFUND" | "ADVANCE";
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalFarmers: number;
  totalLands: number;
  totalSizeBigha: number;
  totalIncome: number;
  totalDue: number;
  paymentsThisMonth: number;
}

export interface Setting {
  id: number;
  pumpId: number;
  key: string;
  value: string;
  category: string;
}

export interface FarmerPortalData {
  farmer: Farmer;
  lands: Land[];
  payments: Payment[];
  totalDue: number;
  totalPaid: number;
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

export interface CreatePumpRequest {
  pumpNameBengali: string;
  pumpNameEnglish: string;
  location: string;
  installationDate: string;
  status: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
}

export interface CreateFarmerRequest {
  nameBengali: string;
  nameEnglish: string;
  fatherName: string;
  village: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  nidNumber: string;
}

export interface CreateLandRequest {
  landIdentificationNumber: string;
  landmarkNumber: string;
  sizeBigha: number;
  sizeShatak: number;
  coordinates?: string;
  season: string;
  year: number;
}

export interface CreateUnitPriceRequest {
  pricePerBigha: number;
  season: string;
  year: number;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface CreatePaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod: "CASH" | "BKASH" | "NAGAD" | "BANK";
  transactionReference?: string;
  paymentType: "PAYMENT" | "REFUND" | "ADVANCE";
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
