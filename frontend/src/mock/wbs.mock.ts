/**
 * @file wbs.mock.ts
 * @description 專案 WBS 工作分解結構模擬數據 / Project WBS Mock Dataset
 * @description_en Provides multi-level hierarchical WBS data with planned vs actual schedules
 * @description_zh 提供軟體開發生命週期之多層級 WBS 模擬數據，包含預計與實際雙軌時程
 */

import { WbsNode } from '../types';

export const MOCK_PROJECT_WBS: Record<string, WbsNode[]> = {
  pj_1: [
    {
      id: 'wbs_1',
      projectId: 'pj_1',
      name: 'M1: 系統需求與 SDD 架構設計',
      status: 'COMPLETED',
      plannedStartDate: '2026-08-01',
      plannedEndDate: '2026-08-14',
      plannedDurationDays: 14,
      actualStartDate: '2026-08-01',
      actualEndDate: '2026-08-14',
      actualDurationDays: 14,
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
          status: 'COMPLETED',
          plannedStartDate: '2026-08-01',
          plannedEndDate: '2026-08-07',
          plannedDurationDays: 7,
          actualStartDate: '2026-08-01',
          actualEndDate: '2026-08-07',
          actualDurationDays: 7,
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
          status: 'COMPLETED',
          plannedStartDate: '2026-08-08',
          plannedEndDate: '2026-08-14',
          plannedDurationDays: 7,
          actualStartDate: '2026-08-08',
          actualEndDate: '2026-08-14',
          actualDurationDays: 7,
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
      status: 'IN_PROGRESS',
      plannedStartDate: '2026-08-15',
      plannedEndDate: '2026-10-15',
      plannedDurationDays: 62,
      actualStartDate: '2026-08-15',
      actualEndDate: '2026-10-20',
      actualDurationDays: 67,
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
          status: 'IN_PROGRESS',
          plannedStartDate: '2026-08-15',
          plannedEndDate: '2026-09-05',
          plannedDurationDays: 22,
          actualStartDate: '2026-08-15',
          actualEndDate: '2026-09-08',
          actualDurationDays: 25,
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
          status: 'IN_PROGRESS',
          plannedStartDate: '2026-09-01',
          plannedEndDate: '2026-09-25',
          plannedDurationDays: 25,
          actualStartDate: '2026-09-01',
          actualEndDate: '2026-09-25',
          actualDurationDays: 25,
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
          status: 'COMPLETED',
          plannedStartDate: '2026-08-15',
          plannedEndDate: '2026-08-25',
          plannedDurationDays: 11,
          actualStartDate: '2026-08-15',
          actualEndDate: '2026-08-25',
          actualDurationDays: 11,
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
      status: 'NOT_STARTED',
      plannedStartDate: '2026-10-16',
      plannedEndDate: '2026-11-10',
      plannedDurationDays: 26,
      actualStartDate: '',
      actualEndDate: '',
      actualDurationDays: 0,
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
          status: 'NOT_STARTED',
          plannedStartDate: '2026-10-16',
          plannedEndDate: '2026-10-28',
          plannedDurationDays: 13,
          actualStartDate: '',
          actualEndDate: '',
          actualDurationDays: 0,
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
          status: 'NOT_STARTED',
          plannedStartDate: '2026-10-29',
          plannedEndDate: '2026-11-10',
          plannedDurationDays: 13,
          actualStartDate: '',
          actualEndDate: '',
          actualDurationDays: 0,
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
      status: 'NOT_STARTED',
      plannedStartDate: '2026-11-11',
      plannedEndDate: '2026-11-29',
      plannedDurationDays: 19,
      actualStartDate: '',
      actualEndDate: '',
      actualDurationDays: 0,
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
          status: 'NOT_STARTED',
          plannedStartDate: '2026-11-11',
          plannedEndDate: '2026-11-20',
          plannedDurationDays: 10,
          actualStartDate: '',
          actualEndDate: '',
          actualDurationDays: 0,
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
          status: 'NOT_STARTED',
          plannedStartDate: '2026-11-21',
          plannedEndDate: '2026-11-29',
          plannedDurationDays: 9,
          actualStartDate: '',
          actualEndDate: '',
          actualDurationDays: 0,
          budget: 60000,
          actualCost: 0,
          progress: 0,
          assignees: ['李工程師']
        }
      ]
    }
  ]
};
