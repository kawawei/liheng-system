import { describe, it, expect, vi } from 'vitest';
import { authService } from '../auth.service';
import { apiClient } from '../api-client';

/**
 * @file auth.service.test.ts
 * @description 認證服務前端單元測試 / Auth Service Frontend Unit Tests
 */

describe('authService', () => {
  it('login sends correct payload and returns data', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          token: 'mock_jwt_token',
          expiresAt: 123456789,
          user: {
            id: 'usr_1',
            username: 'admin',
            realName: '系統管理員',
            role: 'super_admin' as const
          }
        }
      }
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce(mockResponse as any);

    const result = await authService.login('admin', 'admin123');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    expect(result.token).toBe('mock_jwt_token');
    expect(result.user.username).toBe('admin');
  });

  it('logout calls logout endpoint', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true } } as any);
    await authService.logout();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });
});
