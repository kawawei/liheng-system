/**
 * @file index.ts
 * @description 前端全域 TypeScript 類型定義 / Frontend Global Type Definitions
 * @description_en Defines data models for Users, Roles, Clients, Contracts, Projects, and Finances
 * @description_zh 定義使用者、角色、CRM客戶、合約報價、專案管理與財務收支等型別介面
 */

export type UserRole = 'super_admin' | 'engineer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
  expiresAt: number | null;
}

export type ClientStatus = 'potential' | 'following' | 'signed' | 'churned';

export interface InteractionLog {
  id: string;
  clientId: string;
  date: string;
  type: 'phone' | 'meeting' | 'line' | 'email' | 'note';
  summary: string;
  createdByName: string;
}

export interface Client {
  id: string;
  name: string;
  companyName?: string;
  taxId?: string;
  contactPerson: string;
  contactPhone: string;
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
  | 'proposal'
  | 'spec'
  | 'development'
  | 'testing'
  | 'delivery'
  | 'maintenance'
  | 'closed';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

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
  deliveryDate: string;
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
