/**
 * @file user.service.ts
 * @description 前端帳號管理 API 服務 / Frontend User API Service
 * @description_en Handles CRUD API requests for user accounts and adapts data structures
 * @description_zh 負責使用者帳號之查詢、新增、修改與刪除 API 呼叫，並適配前後端資料模型
 */

import { apiClient } from './api-client';
import { UserAccount, UserRole } from '../types';

interface BackendUser {
  id: string;
  username: string;
  realName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function adaptUser(u: BackendUser): UserAccount {
  return {
    id: u.id,
    name: u.realName,
    account: u.username,
    role: u.role,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
    status: u.isActive ? 'active' : 'inactive'
  };
}

export const userService = {
  /**
   * 取得帳號列表 / Get User List
   */
  async getUsers(params?: { role?: string; search?: string }): Promise<UserAccount[]> {
    const response = await apiClient.get<{ success: boolean; data: BackendUser[] }>('/users', {
      params
    });
    return (response.data.data || []).map(adaptUser);
  },

  /**
   * 取得單一帳號 / Get User By ID
   */
  async getUserById(id: string): Promise<UserAccount> {
    const response = await apiClient.get<{ success: boolean; data: BackendUser }>(`/users/${id}`);
    return adaptUser(response.data.data);
  },

  /**
   * 建立新帳號 / Create New User
   */
  async createUser(data: {
    name: string;
    account: string;
    password?: string;
    role: UserRole;
    status?: 'active' | 'inactive';
  }): Promise<UserAccount> {
    const payload = {
      username: data.account,
      password: data.password || 'admin123',
      realName: data.name,
      role: data.role,
      isActive: data.status !== 'inactive'
    };

    const response = await apiClient.post<{ success: boolean; data: BackendUser }>('/users', payload);
    return adaptUser(response.data.data);
  },

  /**
   * 更新帳號 / Update User
   */
  async updateUser(
    id: string,
    data: {
      name?: string;
      role?: UserRole;
      password?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<UserAccount> {
    const payload: any = {};
    if (data.name !== undefined) payload.realName = data.name;
    if (data.role !== undefined) payload.role = data.role;
    if (data.password && data.password.trim().length > 0) payload.password = data.password;
    if (data.status !== undefined) payload.isActive = data.status === 'active';

    const response = await apiClient.put<{ success: boolean; data: BackendUser }>(`/users/${id}`, payload);
    return adaptUser(response.data.data);
  },

  /**
   * 刪除帳號 (軟刪除) / Soft Delete User
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }
};
