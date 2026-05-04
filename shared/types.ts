// ---- Enums ----

export type NoticePriority = "normal" | "important" | "urgent";
export type ViewMode = "simultaneous" | "rotating" | "single";
export type FetchStatus = "success" | "error";
export type PanelId = "flights" | "notices" | "maintenance";

// ---- Users ----

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  createdAt: string;
  createdBy?: string;
}

// ---- HR Notices ----

export interface Notice {
  _id: string;
  title: string;
  body: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate?: string | null;
  displayOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate?: string | null;
}

// ---- Flights ----

export interface Flight {
  _id: string;
  uid: string;
  summary: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  endDate: string;
  fetchedAt: string;
}

// ---- Maintenance ----

export interface MaintenanceItem {
  _id: string;
  partName: string;
  partNumber?: string | null;
  aircraft?: string | null;
  status: string;
  orderDate?: string | null;
  expectedDelivery?: string | null;
  notes?: string | null;
  uploadId: string;
  createdAt: string;
}

export interface MaintenanceUpload {
  _id: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
  itemCount: number;
}

// ---- Dashboard Config ----

export interface PanelConfig {
  panelId: PanelId;
  visible: boolean;
  displayOrder: number;
}

export interface DashboardConfig {
  _id: string;
  panels: PanelConfig[];
  viewMode: ViewMode;
  rotationIntervalSeconds?: number | null;
  singlePanelFocus?: PanelId | null;
  refreshIntervalSeconds: number;
  updatedAt: string;
  updatedBy?: string;
}

// ---- Calendar Settings ----

export interface CalendarSettings {
  _id: string;
  icsUrl: string;
  pollingIntervalMinutes: number;
  lastFetchAt?: string | null;
  lastFetchStatus?: FetchStatus;
  lastFetchError?: string | null;
  updatedAt: string;
}

// ---- API Responses ----

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
