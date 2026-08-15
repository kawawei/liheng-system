/**
 * @file client.service.ts
 * @description 前端 CRM 客戶 API 服務模組 / Frontend Client API Service
 * @description_en Handles API calls for clients, interaction history logs, and data adaptation
 * @description_zh 負責客戶清單、客戶建檔、修改、刪除與聯繫歷史記錄之後端 API 呼叫
 */

import { apiClient } from './api-client';
import { Client, InteractionLog, ClientStatus } from '../types';

interface BackendClient {
  id: string;
  name: string;
  companyName?: string | null;
  taxId?: string | null;
  contactPerson: string;
  contactPhone: string;
  companyPhone?: string | null;
  email?: string | null;
  address?: string | null;
  systemType?: string | null;
  requirementSummary?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
  projectsCount?: number;
  projects?: Array<{
    id: string;
    projectCode: string;
    name: string;
    stage: string;
    progressPercent: number;
  }>;
  logs?: Array<{
    id: string;
    clientId: string;
    date: string;
    type: 'line' | 'phone' | 'fb' | 'ig' | 'threads';
    summary: string;
    createdByName: string;
  }>;
}

function adaptClient(c: BackendClient): Client {
  return {
    id: c.id,
    name: c.name,
    companyName: c.companyName || undefined,
    taxId: c.taxId || undefined,
    contactPerson: c.contactPerson,
    contactPhone: c.contactPhone,
    companyPhone: c.companyPhone || undefined,
    email: c.email || undefined,
    address: c.address || undefined,
    systemType: c.systemType || undefined,
    requirementSummary: c.requirementSummary || undefined,
    status: c.status,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
    logs: (c.logs || []).map((l) => ({
      id: l.id,
      clientId: l.clientId,
      date: l.date,
      type: l.type,
      summary: l.summary,
      createdByName: l.createdByName
    }))
  };
}

export const clientService = {
  /**
   * 取得客戶清單 / Get Clients List
   */
  async getClients(params?: { status?: string; search?: string }): Promise<Client[]> {
    const response = await apiClient.get<{ success: boolean; data: BackendClient[] }>('/clients', {
      params
    });
    return (response.data.data || []).map(adaptClient);
  },

  /**
   * 取得單一客戶詳情 (包含聯繫歷史) / Get Client By ID
   */
  async getClientById(id: string): Promise<Client & { projects?: any[] }> {
    const response = await apiClient.get<{ success: boolean; data: BackendClient }>(`/clients/${id}`);
    const adapted = adaptClient(response.data.data);
    return {
      ...adapted,
      projects: response.data.data.projects || []
    };
  },

  /**
   * 建立新客戶 / Create Client
   */
  async createClient(data: Partial<Client>): Promise<Client> {
    const response = await apiClient.post<{ success: boolean; data: BackendClient }>('/clients', {
      name: data.name,
      companyName: data.companyName || null,
      taxId: data.taxId || null,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      companyPhone: data.companyPhone || null,
      email: data.email || null,
      address: data.address || null,
      systemType: data.systemType || null,
      requirementSummary: data.requirementSummary || null,
      status: data.status || 'pending'
    });
    return adaptClient(response.data.data);
  },

  /**
   * 更新客戶 / Update Client
   */
  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    const response = await apiClient.put<{ success: boolean; data: BackendClient }>(`/clients/${id}`, {
      name: data.name,
      companyName: data.companyName,
      taxId: data.taxId,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      companyPhone: data.companyPhone,
      email: data.email,
      address: data.address,
      systemType: data.systemType,
      requirementSummary: data.requirementSummary,
      status: data.status
    });
    return adaptClient(response.data.data);
  },

  /**
   * 刪除客戶 / Delete Client
   */
  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },

  /**
   * 新增客戶跟進紀錄 / Add Activity Log
   */
  async addActivityLog(
    clientId: string,
    data: { contactType: 'line' | 'phone' | 'fb' | 'ig' | 'threads'; summary: string; createdByName?: string }
  ): Promise<InteractionLog> {
    const response = await apiClient.post<{ success: boolean; data: InteractionLog }>(
      `/clients/${clientId}/activity-logs`,
      data
    );
    return response.data.data;
  }
};
