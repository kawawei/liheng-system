/**
 * @file index.ts
 * @description 前端全域 TypeScript 類型定義 / Frontend Global Type Definitions
 * @description_en Defines data models for Users, Roles, Clients, Contracts, Projects, and Finances
 * @description_zh 定義使用者、角色、CRM客戶、合約報價、專案管理與財務收支等型別介面
 */

export type UserRole = 'super_admin' | 'engineer' | 'client';

export * from './issue.types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserAccount {
  id: string;
  name: string;
  account: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  status?: 'active' | 'inactive';
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  expiresAt: number | null;
}

export type ClientStatus =
  | 'pending'
  | 'negotiating'
  | 'pending_signature'
  | 'in_cooperation'
  | 'delivered'
  | 'lost';

export interface InteractionLog {
  id: string;
  clientId: string;
  date: string;
  type: 'line' | 'phone' | 'fb' | 'ig' | 'threads';
  summary: string;
  createdByName: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  taxId?: string;
  contactPerson: string;
  contactPhone?: string;
  lineName?: string;
  lineId?: string;
  companyPhone?: string;
  email?: string;
  address?: string;
  systemType?: string;
  requirementSummary?: string;
  status: ClientStatus;
  notes?: string;
  createdAt: string;
  logs?: InteractionLog[];
}

export type ContractStatus = 'negotiating' | 'pending_signature' | 'signed' | 'terminated';

export interface Contract {
  id: string;
  contractCode: string;
  clientId: string;
  clientName: string;
  title: string;
  amountUntaxed: number;
  taxAmount: number;
  amountTotal: number;
  status: ContractStatus;
  pdfUrl?: string;
  signedAt?: string;
  createdAt: string;
}

export type ProjectStage =
  | 'development'
  | 'testing'
  | 'delivery'
  | 'maintenance'
  | 'closed';

export type TaxType = 'tax_inclusive' | 'tax_exclusive';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface PaymentStage {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  status: 'pending' | 'invoiced' | 'received';
  dueDate?: string;
  invoiceNumber?: string;
  receivedAt?: string;
}

export interface ChangeOrder {
  id: string;
  code: string;
  title: string;
  amountUntaxed: number;
  taxAmount: number;
  amountTotal: number;
  addedDays: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Project {
  id: string;
  projectCode: string;
  name: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  stage: ProjectStage;
  healthStatus: HealthStatus;
  progressPercent: number;
  assignedEngineers: string[];
  startDate: string;
  durationDays: number;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  taxType: 'tax_inclusive' | 'tax_exclusive';
  isTaxAdded: boolean;
  amountUntaxed: number;
  taxAmount: number;
  amountTotal: number;
  paymentStages?: PaymentStage[];
  changeOrders?: ChangeOrder[];
  description?: string;
}

export interface Receivable {
  id: string;
  receiptCode: string;
  projectId: string;
  projectName: string;
  stageName: string;
  amount: number;
  invoiceNumber?: string;
  bankAccount?: string;
  status: 'pending' | 'invoiced' | 'received';
  dueDate: string;
  receivedAt?: string;
}

export type WbsStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type DependencyType = 'FS' | 'FF' | 'SS' | 'SF';

export interface WbsNode {
  id: string;
  projectId: string;
  parentId?: string;
  wbsCode?: string;
  name: string;
  description?: string;
  isMilestone?: boolean;
  predecessorCode?: string;
  dependencyType?: DependencyType;
  allowPullForward?: boolean; // 勾選是否允許提前啟動 (Pull-Forward)
  status: WbsStatus;
  // 預計期程與工期 / Planned dates & duration
  plannedStartDate?: string;
  plannedEndDate?: string;
  plannedDurationDays?: number;
  // 實際期程與工期 / Actual dates & duration
  actualStartDate?: string;
  actualEndDate?: string;
  actualDurationDays?: number;
  // 相容通用欄位
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  budget?: number;
  actualCost?: number;
  progress: number;
  assignees?: string[];
  children?: WbsNode[];
  isExpanded?: boolean;
}

