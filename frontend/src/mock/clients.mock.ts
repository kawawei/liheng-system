import { Client } from '../types';

/**
 * @file clients.mock.ts
 * @description CRM 客戶模擬資料檔 / CRM Client Mock Data
 * @description_en Pre-populated clients and contact interaction logs for demonstration
 * @description_zh 提供 CRM 頁面展示用之預設客戶資料與聯繫歷史時間軸紀錄 (管道支援 LINE, 電話, FB, IG, Threads)
 */

export const INITIAL_CLIENTS_MOCK: Client[] = [
  {
    id: 'cli_1',
    name: '台元半導體',
    companyName: '台元半導體股份有限公司',
    taxId: '12345678',
    contactPerson: '陳協理',
    contactPhone: '0912-345-678',
    companyPhone: '02-27891234',
    email: 'chen@taiyuan.com',
    address: '新竹縣竹北市台元街 26 號 5 樓',
    systemType: 'IoT 物聯網監控',
    requirementSummary: '需求晶圓機台即時監控系統，需整合 PLC 數據傳送與看板大螢幕展示。',
    status: 'signed',
    createdAt: '2026-08-10',
    logs: [
      {
        id: 'log_1',
        clientId: 'cli_1',
        date: '2026-08-10 14:30',
        type: 'phone',
        summary: '電話聯繫討論專案啟動會議，確認一期驗收目標與架構細節。',
        createdByName: '陳專案經理'
      },
      {
        id: 'log_2',
        clientId: 'cli_1',
        date: '2026-08-05 10:00',
        type: 'line',
        summary: 'LINE 訊息溝通研發範疇，客戶提出需要支援手機端即時警示 Push Notification。',
        createdByName: '林業務代表'
      }
    ]
  },
  {
    id: 'cli_2',
    name: '國泰證券資訊處',
    companyName: '國泰證券股份有限公司',
    taxId: '87654321',
    contactPerson: '林經理',
    contactPhone: '0988-765-432',
    companyPhone: '02-23456789',
    email: 'lin@cathay.com',
    address: '台北市信義區松仁路 7 號 12 樓',
    systemType: 'Web 管理系統',
    requirementSummary: '內部交易對帳與自動報表產生系統，希望改善原本 Excel 人工作業。',
    status: 'signed',
    createdAt: '2026-08-12',
    logs: [
      {
        id: 'log_3',
        clientId: 'cli_2',
        date: '2026-08-12 11:00',
        type: 'fb',
        summary: 'FB 粉專私訊洽詢，展示既有金融對帳案例，客戶對數據可視化表達滿意。',
        createdByName: '王總經理'
      }
    ]
  },
  {
    id: 'cli_3',
    name: '張先生 (個人工作室)',
    contactPerson: '張大明',
    contactPhone: '0933-111-222',
    email: 'chang@studio.io',
    address: '台中市西區台灣大道二段 100 號',
    systemType: 'POS 軟硬體整合',
    requirementSummary: '想開一家獨立咖啡店，需要小型 iPad POS 點餐系統與藍芽出單機連動。',
    status: 'potential',
    createdAt: '2026-08-14',
    logs: [
      {
        id: 'log_4',
        clientId: 'cli_3',
        date: '2026-08-14 16:20',
        type: 'ig',
        summary: 'IG 商業帳號小盒子私訊諮詢出單機支援型號與菜單模組功能。',
        createdByName: '張專案專員'
      }
    ]
  }
];
