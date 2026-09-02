/**
 * @file issue.service.ts
 * @description 問題工單與多媒體附件 API 服務 / Issue Tracking API Service
 * @description_en Handles API calls for software issue lifecycle, attachment uploads, comments, and status updates
 * @description_zh 提供工單查詢、建立、多媒體上傳 (圖片/影片)、狀態變更 (標記已修復) 與對話留言之 API 請求封裝
 */

import { apiClient } from './api-client';
import {
  IssueRecord,
  IssueDetail,
  IssueFilter,
  CreateIssueInput,
  UpdateIssueStatusInput,
  IssueAttachment,
  IssueComment
} from '../types';

export const issueService = {
  /**
   * 取得工單列表 / Get issues list
   */
  async getIssues(filter?: IssueFilter): Promise<IssueRecord[]> {
    const params = new URLSearchParams();
    if (filter?.projectId) params.append('projectId', filter.projectId);
    if (filter?.clientId) params.append('clientId', filter.clientId);
    if (filter?.status && filter.status !== 'ALL') params.append('status', filter.status);
    if (filter?.category && filter.category !== 'ALL') params.append('category', filter.category);
    if (filter?.severity && filter.severity !== 'ALL') params.append('severity', filter.severity);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.assignedUserId) params.append('assignedUserId', filter.assignedUserId);

    const response = await apiClient.get<{ success: boolean; data: IssueRecord[] }>(
      `/issues?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * 取得工單詳情 / Get issue detail
   */
  async getIssueById(id: string): Promise<IssueDetail> {
    const response = await apiClient.get<{ success: boolean; data: IssueDetail }>(`/issues/${id}`);
    return response.data.data;
  },

  /**
   * 建立工單 / Create issue
   */
  async createIssue(payload: CreateIssueInput): Promise<IssueRecord> {
    const response = await apiClient.post<{ success: boolean; data: IssueRecord }>(
      '/issues',
      payload
    );
    return response.data.data;
  },

  /**
   * 變更工單狀態 (如標記已修復) / Update issue status
   */
  async updateStatus(id: string, payload: UpdateIssueStatusInput): Promise<IssueRecord> {
    const response = await apiClient.patch<{ success: boolean; data: IssueRecord }>(
      `/issues/${id}/status`,
      payload
    );
    return response.data.data;
  },

  /**
   * 發布留言 / Add comment
   */
  async addComment(
    id: string,
    payload: { content: string; isInternal?: boolean; attachments?: any[] }
  ): Promise<IssueComment> {
    const response = await apiClient.post<{ success: boolean; data: IssueComment }>(
      `/issues/${id}/comments`,
      payload
    );
    return response.data.data;
  },

  /**
   * 上傳圖片或影片附件 / Upload media attachment
   */
  async uploadMedia(file: File, issueId?: string): Promise<IssueAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (issueId) {
      formData.append('issueId', issueId);
    }

    const response = await apiClient.post<{ success: boolean; data: IssueAttachment }>(
      '/issues/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.data;
  },

  /**
   * 刪除工單 / Delete issue
   */
  async deleteIssue(id: string): Promise<boolean> {
    const response = await apiClient.delete<{ success: boolean }>(`/issues/${id}`);
    return response.data.success;
  }
};
