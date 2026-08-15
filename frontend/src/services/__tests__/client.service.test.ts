import { describe, it, expect, vi } from 'vitest';
import { clientService } from '../client.service';
import { apiClient } from '../api-client';

/**
 * @file client.service.test.ts
 * @description CRM 客戶前端服務單元測試 / Client Service Unit Tests
 * @description_en Verifies client service methods against mocked API client without writing real database records
 * @description_zh 驗證客戶服務之 API 請求組裝與資料適配轉換，確保純讀寫邏輯安全不寫入真實資料庫
 */

describe('clientService', () => {
  it('getClients should query /clients and adapt data', async () => {
    const mockClients = [
      {
        id: 'cli_1',
        name: '台元半導體',
        contactPerson: '陳協理',
        contactPhone: '0912-345-678',
        status: 'in_cooperation',
        createdAt: '2026-08-15T00:00:00.000Z',
        logs: []
      }
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockClients }
    } as any);

    const result = await clientService.getClients({ status: 'in_cooperation' });

    expect(apiClient.get).toHaveBeenCalledWith('/clients', {
      params: { status: 'in_cooperation' }
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('台元半導體');
    expect(result[0].createdAt).toBe('2026-08-15');
  });

  it('createClient should send post payload to /clients', async () => {
    const payload = {
      name: '宏達科技',
      contactPerson: '王總經理',
      contactPhone: '0922-111-222'
    };

    const mockResponse = {
      id: 'cli_new',
      ...payload,
      status: 'pending',
      createdAt: '2026-08-15T12:00:00.000Z',
      logs: []
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { success: true, data: mockResponse }
    } as any);

    const created = await clientService.createClient(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/clients', expect.objectContaining({
      name: '宏達科技',
      contactPerson: '王總經理'
    }));
    expect(created.id).toBe('cli_new');
  });

  it('addActivityLog should post to /clients/:id/activity-logs', async () => {
    const logData = {
      contactType: 'phone' as const,
      summary: '電話討論二期需求'
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'log_1',
          clientId: 'cli_1',
          date: '2026-08-15 15:30',
          type: 'phone',
          summary: '電話討論二期需求',
          createdByName: '陳專案經理'
        }
      }
    } as any);

    const result = await clientService.addActivityLog('cli_1', logData);

    expect(apiClient.post).toHaveBeenCalledWith('/clients/cli_1/activity-logs', logData);
    expect(result.summary).toBe('電話討論二期需求');
  });
});
