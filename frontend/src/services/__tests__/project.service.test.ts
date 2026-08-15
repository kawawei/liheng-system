import { describe, it, expect, vi } from 'vitest';
import { projectService } from '../project.service';
import { apiClient } from '../api-client';

/**
 * @file project.service.test.ts
 * @description WBS 專案前端服務單元測試 / Project Service Unit Tests
 * @description_en Verifies project service methods and WBS nodes sync against mocked API client without writing real database records
 * @description_zh 驗證專案管理服務與 WBS 工項同步 API 請求組裝，純單元測試不污染真實資料庫
 */

describe('projectService', () => {
  it('getProjects should query /projects with filters', async () => {
    const mockProjects = [
      {
        id: 'pj_1',
        projectCode: 'PJ-20260814-0001',
        name: '利恒智慧工廠物聯網平台',
        stage: 'development',
        progressPercent: 65,
        assignedEngineers: ['張工程師'],
        amountTotal: 1050000
      }
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockProjects }
    } as any);

    const result = await projectService.getProjects({ stage: 'development' });

    expect(apiClient.get).toHaveBeenCalledWith('/projects', {
      params: { stage: 'development' }
    });
    expect(result).toHaveLength(1);
    expect(result[0].projectCode).toBe('PJ-20260814-0001');
  });

  it('saveWbsNodes should put payload to /projects/:id/wbs', async () => {
    const mockNodes = [
      {
        id: 'wbs_1',
        wbsCode: '1',
        name: '需求訪談',
        status: 'COMPLETED' as const,
        progress: 100
      }
    ];

    vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: { success: true, data: mockNodes }
    } as any);

    const result = await projectService.saveWbsNodes('pj_1', mockNodes as any);

    expect(apiClient.put).toHaveBeenCalledWith('/projects/pj_1/wbs', {
      nodes: mockNodes
    });
    expect(result).toHaveLength(1);
  });

  it('addChangeOrder should post to /projects/:id/change-orders', async () => {
    const coData = {
      title: '追加 Modbus 驅動',
      amountUntaxed: 50000,
      taxAmount: 2500,
      amountTotal: 52500,
      addedDays: 7
    };

    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: 'co_1',
          code: 'CO-20260815-0001',
          ...coData,
          status: 'approved',
          createdAt: '2026-08-15'
        }
      }
    } as any);

    const result = await projectService.addChangeOrder('pj_1', coData);

    expect(apiClient.post).toHaveBeenCalledWith('/projects/pj_1/change-orders', coData);
    expect(result.code).toBe('CO-20260815-0001');
  });
});
