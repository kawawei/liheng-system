/**
 * @file auth.service.ts
 * @description 前端認證 API 服務 / Frontend Auth API Service
 * @description_en Handles API calls for login, logout, and current user profile
 * @description_zh 負責登入、登出與當前登入者資訊之後端 API 呼叫
 */

import { apiClient } from './api-client';
import { UserRole } from '../types';

export interface LoginResponse {
  token: string;
  expiresAt: number;
  user: {
    id: string;
    username: string;
    realName: string;
    role: UserRole;
  };
}

export const authService = {
  /**
   * 使用者登入 / User Login
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<{ success: boolean; data: LoginResponse; message?: string }>(
      '/auth/login',
      { username, password }
    );
    return response.data.data;
  },

  /**
   * 使用者登出 / User Logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // 忽略登出 API 網路異常，前端仍執行本地憑證清除
    }
  },

  /**
   * 獲取當前登入者資料 / Get Current Profile
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  }
};
