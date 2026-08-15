/**
 * @file project.service.ts
 * @description 前端 WBS 專案管理 API 服務模組 / Frontend Project API Service
 * @description_en Handles API calls for projects, WBS tree synchronization, and change orders
 * @description_zh 負責專案清單、立案、更新、軟刪除、WBS 工作分解樹狀工項與變更單 API 呼叫
 */

import { apiClient } from './api-client';
import { Project, WbsNode, ChangeOrder } from '../types';

export const projectService = {
  /**
   * 取得專案清單 / Get Projects List
   */
  async getProjects(params?: { stage?: string; search?: string; clientId?: string }): Promise<Project[]> {
    const response = await apiClient.get<{ success: boolean; data: Project[] }>('/projects', {
      params
    });
    return response.data.data || [];
  },

  /**
   * 取得單一專案詳情 / Get Project By ID
   */
  async getProjectById(idOrCode: string): Promise<Project & { wbsNodes?: WbsNode[] }> {
    const response = await apiClient.get<{ success: boolean; data: Project & { wbsNodes?: WbsNode[] } }>(
      `/projects/${idOrCode}`
    );
    return response.data.data;
  },

  /**
   * 建立新專案 (正式立案) / Create Project
   */
  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await apiClient.post<{ success: boolean; data: Project }>('/projects', data);
    return response.data.data;
  },

  /**
   * 更新專案 / Update Project
   */
  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.put<{ success: boolean; data: Project }>(`/projects/${id}`, data);
    return response.data.data;
  },

  /**
   * 刪除專案 / Delete Project
   */
  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  /**
   * 取得專案 WBS 節點清冊 / Get WBS Nodes
   */
  async getWbsNodes(projectId: string): Promise<WbsNode[]> {
    const response = await apiClient.get<{ success: boolean; data: WbsNode[] }>(`/projects/${projectId}/wbs`);
    return response.data.data || [];
  },

  /**
   * 批次儲存 WBS 節點清冊 / Batch Save WBS Nodes
   */
  async saveWbsNodes(projectId: string, nodes: WbsNode[]): Promise<WbsNode[]> {
    const response = await apiClient.put<{ success: boolean; data: WbsNode[] }>(`/projects/${projectId}/wbs`, {
      nodes
    });
    return response.data.data || [];
  },

  /**
   * 追加需求變更單 / Add Change Order
   */
  async addChangeOrder(
    projectId: string,
    data: {
      title: string;
      amountUntaxed: number;
      taxAmount: number;
      amountTotal: number;
      addedDays: number;
      status?: 'pending' | 'approved' | 'rejected';
    }
  ): Promise<ChangeOrder> {
    const response = await apiClient.post<{ success: boolean; data: ChangeOrder }>(
      `/projects/${projectId}/change-orders`,
      data
    );
    return response.data.data;
  }
};
