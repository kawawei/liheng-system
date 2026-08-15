import { Project } from '../types';

/**
 * @file projects.mock.ts
 * @description 專案管理模擬資料庫 / WBS Projects Mock Dataset
 * @description_en Mock project records complying with 5-stage lifecycle, tax types, and payment stages
 * @description_zh 提供 WBS 專案管理之模擬數據，涵蓋 5 大生命週期、計稅與多階段請款期程
 */

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'pj_1',
    projectCode: 'PJ-20260814-0001',
    name: '利恒智慧工廠物聯網平台',
    clientId: 'cli_1',
    clientName: '台元半導體股份有限公司',
    stage: 'development',
    healthStatus: 'healthy',
    progressPercent: 65,
    assignedEngineers: ['張工程師', '李工程師'],
    startDate: '2026-08-01',
    durationDays: 120,
    expectedDeliveryDate: '2026-11-29',
    taxType: 'tax_exclusive',
    isTaxAdded: true,
    amountUntaxed: 1000000,
    taxAmount: 50000,
    amountTotal: 1050000,
    paymentStages: [
      { id: 'stg_1', name: '第 1 期 訂金 (簽約)', percentage: 40, amount: 420000, status: 'received', dueDate: '2026-08-05', invoiceNumber: 'INV-202608-0012' },
      { id: 'stg_2', name: '第 2 期 系統交付款', percentage: 40, amount: 420000, status: 'invoiced', dueDate: '2026-10-15', invoiceNumber: 'INV-202608-0045' },
      { id: 'stg_3', name: '第 3 期 驗收尾款', percentage: 20, amount: 210000, status: 'pending', dueDate: '2026-11-30' }
    ],
    changeOrders: [
      {
        id: 'co_1',
        code: 'CO-20260815-0001',
        title: '追加 PLC 設備高頻數據採集與 Modbus 協定轉換模組',
        amountUntaxed: 80000,
        taxAmount: 4000,
        amountTotal: 84000,
        addedDays: 14,
        status: 'approved',
        createdAt: '2026-08-15'
      }
    ]
  },
  {
    id: 'pj_2',
    projectCode: 'PJ-20260812-0002',
    name: '金融交易風控 AI 引擎',
    clientId: 'cli_2',
    clientName: '國泰證券資訊處',
    stage: 'testing',
    healthStatus: 'warning',
    progressPercent: 90,
    assignedEngineers: ['王架構師'],
    startDate: '2026-06-15',
    durationDays: 75,
    expectedDeliveryDate: '2026-08-29',
    taxType: 'tax_inclusive',
    isTaxAdded: false,
    amountUntaxed: 761905,
    taxAmount: 38095,
    amountTotal: 800000,
    paymentStages: [
      { id: 'stg_1', name: '第 1 期 簽約訂金', percentage: 50, amount: 400000, status: 'received', dueDate: '2026-06-20', invoiceNumber: 'INV-202606-0008' },
      { id: 'stg_2', name: '第 2 期 上線驗收尾款', percentage: 50, amount: 400000, status: 'pending', dueDate: '2026-08-30' }
    ],
    changeOrders: []
  },
  {
    id: 'pj_3',
    projectCode: 'PJ-20260810-0003',
    name: '智慧門市 POS 軟硬體整合系統',
    clientId: 'cli_3',
    clientName: '張先生 (個人工作室)',
    stage: 'delivery',
    healthStatus: 'healthy',
    progressPercent: 95,
    assignedEngineers: ['林工程師'],
    startDate: '2026-07-01',
    durationDays: 45,
    expectedDeliveryDate: '2026-08-15',
    taxType: 'tax_exclusive',
    isTaxAdded: false,
    amountUntaxed: 280000,
    taxAmount: 0,
    amountTotal: 280000,
    paymentStages: [
      { id: 'stg_1', name: '第 1 期 訂金', percentage: 50, amount: 140000, status: 'received', dueDate: '2026-07-05', invoiceNumber: 'INV-202607-0019' },
      { id: 'stg_2', name: '第 2 期 驗收款', percentage: 50, amount: 140000, status: 'invoiced', dueDate: '2026-08-18' }
    ],
    changeOrders: []
  }
];
