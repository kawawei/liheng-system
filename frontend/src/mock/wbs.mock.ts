/**
 * @file wbs.mock.ts
 * @description 專案 WBS 工作分解結構模擬數據 / Project WBS Mock Dataset
 * @description_en Provides multi-level hierarchical WBS data tailored for software development lifecycles
 * @description_zh 提供軟體開發生命週期之多層級 WBS 工作分解樹狀結構模擬數據
 */

import { WbsNode } from '../types';

export const MOCK_PROJECT_WBS: Record<string, WbsNode[]> = {
  pj_1: [
    {
      id: 'wbs_1',
      projectId: 'pj_1',
      name: 'M1: 系統需求與 SDD 架構設計',
      category: 'architecture',
      status: 'COMPLETED',
      startDate: '2026-08-01',
      endDate: '2026-08-14',
      durationDays: 14,
      budget: 150000,
      actualCost: 140000,
      progress: 100,
      assignees: ['張工程師'],
      isExpanded: true,
      children: [
        {
          id: 'wbs_1_1',
          projectId: 'pj_1',
          parentId: 'wbs_1',
          name: '1.1 需求訪談與 PRD 規格書定稿',
          category: 'requirement',
          status: 'COMPLETED',
          startDate: '2026-08-01',
          endDate: '2026-08-07',
          durationDays: 7,
          budget: 60000,
          actualCost: 55000,
          progress: 100,
          assignees: ['張工程師']
        },
        {
          id: 'wbs_1_2',
          projectId: 'pj_1',
          parentId: 'wbs_1',
          name: '1.2 系統架構設計與 12 張資料表 Drizzle Schema',
          category: 'architecture',
          status: 'COMPLETED',
          startDate: '2026-08-08',
          endDate: '2026-08-14',
          durationDays: 7,
          budget: 90000,
          actualCost: 85000,
          progress: 100,
          assignees: ['李工程師']
        }
      ]
    },
    {
      id: 'wbs_2',
      projectId: 'pj_1',
      name: 'M2: 物聯網核心模組與看板開發',
      category: 'development',
      status: 'IN_PROGRESS',
      startDate: '2026-08-15',
      endDate: '2026-10-15',
      durationDays: 62,
      budget: 600000,
      actualCost: 380000,
      progress: 65,
      assignees: ['張工程師', '李工程師'],
      isExpanded: true,
      children: [
        {
          id: 'wbs_2_1',
          projectId: 'pj_1',
          parentId: 'wbs_2',
          name: '2.1 PLC 數據採集與 Modbus 協議轉換模組 (CO-001)',
          category: 'development',
          status: 'IN_PROGRESS',
          startDate: '2026-08-15',
          endDate: '2026-09-05',
          durationDays: 22,
          budget: 180000,
          actualCost: 120000,
          progress: 70,
          assignees: ['張工程師']
        },
        {
          id: 'wbs_2_2',
          projectId: 'pj_1',
          parentId: 'wbs_2',
          name: '2.2 即時數據可視化看板與警報推播',
          category: 'development',
          status: 'IN_PROGRESS',
          startDate: '2026-09-01',
          endDate: '2026-09-25',
          durationDays: 25,
          budget: 220000,
          actualCost: 150000,
          progress: 60,
          assignees: ['李工程師']
        },
        {
          id: 'wbs_2_3',
          projectId: 'pj_1',
          parentId: 'wbs_2',
          name: '2.3 8h JWT 雙向身分驗證與權限控制',
          category: 'development',
          status: 'COMPLETED',
          startDate: '2026-08-15',
          endDate: '2026-08-25',
          durationDays: 11,
          budget: 200000,
          actualCost: 110000,
          progress: 100,
          assignees: ['張工程師']
        }
      ]
    },
    {
      id: 'wbs_3',
      projectId: 'pj_1',
      name: 'M3: 系統整合測試、QA 與壓力檢測',
      category: 'testing',
      status: 'NOT_STARTED',
      startDate: '2026-10-16',
      endDate: '2026-11-10',
      durationDays: 26,
      budget: 180000,
      actualCost: 0,
      progress: 0,
      assignees: ['李工程師'],
      isExpanded: false,
      children: [
        {
          id: 'wbs_3_1',
          projectId: 'pj_1',
          parentId: 'wbs_3',
          name: '3.1 API 自動化端對端 (E2E) 測試套件',
          category: 'testing',
          status: 'NOT_STARTED',
          startDate: '2026-10-16',
          endDate: '2026-10-28',
          durationDays: 13,
          budget: 90000,
          actualCost: 0,
          progress: 0,
          assignees: ['李工程師']
        },
        {
          id: 'wbs_3_2',
          projectId: 'pj_1',
          parentId: 'wbs_3',
          name: '3.2 高併發高載負壓力測試與弱點掃描',
          category: 'testing',
          status: 'NOT_STARTED',
          startDate: '2026-10-29',
          endDate: '2026-11-10',
          durationDays: 13,
          budget: 90000,
          actualCost: 0,
          progress: 0,
          assignees: ['張工程師']
        }
      ]
    },
    {
      id: 'wbs_4',
      projectId: 'pj_1',
      name: 'M4: Docker 容器部署與客戶 UAT 驗收交付',
      category: 'deployment',
      status: 'NOT_STARTED',
      startDate: '2026-11-11',
      endDate: '2026-11-29',
      durationDays: 19,
      budget: 120000,
      actualCost: 0,
      progress: 0,
      assignees: ['張工程師', '李工程師'],
      isExpanded: false,
      children: [
        {
          id: 'wbs_4_1',
          projectId: 'pj_1',
          parentId: 'wbs_4',
          name: '4.1 伺服器 Docker Compose 環境編排與探針設置',
          category: 'deployment',
          status: 'NOT_STARTED',
          startDate: '2026-11-11',
          endDate: '2026-11-20',
          durationDays: 10,
          budget: 60000,
          actualCost: 0,
          progress: 0,
          assignees: ['張工程師']
        },
        {
          id: 'wbs_4_2',
          projectId: 'pj_1',
          parentId: 'wbs_4',
          name: '4.2 客戶驗收文件簽核與系統移交上線',
          category: 'deployment',
          status: 'NOT_STARTED',
          startDate: '2026-11-21',
          endDate: '2026-11-29',
          durationDays: 9,
          budget: 60000,
          actualCost: 0,
          progress: 0,
          assignees: ['李工程師']
        }
      ]
    }
  ]
};
