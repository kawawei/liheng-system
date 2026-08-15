/**
 * @file seed.ts
 * @description 資料庫初始化與預設種子資料植入 / Database Init & Seed
 * @description_en Initializes extensions, creates all tables, and seeds initial users, clients, and projects
 * @description_zh 自動初始化資料庫擴展、建立使用者、客戶與專案資料表並植入標準預設種子資料
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

export async function initDatabaseAndSeed(): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. 啟用 uuid-ossp 與 pgcrypto 擴展
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "vector";`);
    } catch {
      // 忽略非 pgvector 環境
    }

    // 2. 建立 users 資料表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        real_name VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'engineer',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      );
    `);

    // 3. 建立 clients 資料表
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        company_name VARCHAR(100),
        tax_id VARCHAR(20),
        contact_person VARCHAR(50) NOT NULL,
        contact_phone VARCHAR(30) NOT NULL,
        company_phone VARCHAR(30),
        email VARCHAR(100),
        address VARCHAR(200),
        system_type VARCHAR(50),
        requirement_summary TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      );
    `);

    // 4. 建立 client_activity_logs 資料表
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        user_id UUID,
        created_by_name VARCHAR(50) NOT NULL,
        contact_type VARCHAR(20) NOT NULL DEFAULT 'phone',
        summary TEXT NOT NULL,
        activity_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. 建立 projects 資料表
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        client_name VARCHAR(100),
        stage VARCHAR(30) NOT NULL DEFAULT 'development',
        health_status VARCHAR(20) NOT NULL DEFAULT 'healthy',
        progress_percent INTEGER NOT NULL DEFAULT 0,
        assigned_engineers JSONB DEFAULT '[]'::jsonb,
        start_date VARCHAR(20),
        duration_days INTEGER DEFAULT 0,
        expected_delivery_date VARCHAR(20),
        tax_type VARCHAR(30) DEFAULT 'tax_exclusive',
        is_tax_added BOOLEAN DEFAULT true,
        amount_untaxed NUMERIC(14, 2) DEFAULT 0,
        tax_amount NUMERIC(14, 2) DEFAULT 0,
        amount_total NUMERIC(14, 2) DEFAULT 0,
        payment_stages JSONB DEFAULT '[]'::jsonb,
        change_orders JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      );
    `);

    // 6. 建立 project_wbs 資料表
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_wbs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        wbs_code VARCHAR(50) NOT NULL,
        parent_id VARCHAR(100),
        name VARCHAR(200) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
        planned_start_date VARCHAR(20),
        planned_end_date VARCHAR(20),
        planned_duration_days INTEGER DEFAULT 0,
        actual_start_date VARCHAR(20),
        actual_end_date VARCHAR(20),
        actual_duration_days INTEGER DEFAULT 0,
        progress INTEGER DEFAULT 0,
        assignees JSONB DEFAULT '[]'::jsonb,
        is_milestone BOOLEAN DEFAULT false,
        predecessor_code VARCHAR(50),
        dependency_type VARCHAR(10),
        allow_pull_forward BOOLEAN DEFAULT false,
        is_expanded BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      );
    `);

    // ========================================
    // 預設管理者與工程師帳號種子
    // ========================================
    const adminCheck = await client.query(
      `SELECT id FROM users WHERE username = 'admin' AND deleted_at IS NULL`
    );

    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (username, password_hash, real_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', adminHash, '系統管理員', 'super_admin', true]
      );
      console.log('✅ [DB Seed] 建立預設超級管理員: admin / admin123');
    }

    const engineerCheck = await client.query(
      `SELECT id FROM users WHERE username = 'dev' AND deleted_at IS NULL`
    );

    if (engineerCheck.rows.length === 0) {
      const devHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO users (username, password_hash, real_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        ['dev', devHash, '研發工程師', 'engineer', true]
      );
      console.log('✅ [DB Seed] 建立預設研發工程師: dev / admin123');
    }

    // ========================================
    // 預設客戶與專案種子資料 (若無客戶)
    // ========================================
    const clientsCheck = await client.query(`SELECT COUNT(*) as count FROM clients WHERE deleted_at IS NULL`);
    if (parseInt(clientsCheck.rows[0]?.count || '0', 10) === 0) {
      // 1. 台元半導體
      const cli1Res = await client.query(`
        INSERT INTO clients (name, company_name, tax_id, contact_person, contact_phone, company_phone, email, address, system_type, requirement_summary, status)
        VALUES (
          '台元半導體',
          '台元半導體股份有限公司',
          '12345678',
          '陳協理',
          '0912-345-678',
          '02-27891234',
          'chen@taiyuan.com',
          '新竹縣竹北市台元街 26 號 5 樓',
          'IoT 物聯網監控',
          '需求晶圓機台即時監控系統，需整合 PLC 數據傳送與看板大螢幕展示。',
          'in_cooperation'
        ) RETURNING id;
      `);
      const cli1Id = cli1Res.rows[0].id;

      await client.query(`
        INSERT INTO client_activity_logs (client_id, created_by_name, contact_type, summary, activity_date)
        VALUES 
          ($1, '陳專案經理', 'phone', '電話聯繫討論專案啟動會議，確認一期驗收目標與架構細節。', '2026-08-10 14:30:00+08'),
          ($1, '林業務代表', 'line', 'LINE 訊息溝通研發範疇，客戶提出需要支援手機端即時警示 Push Notification。', '2026-08-05 10:00:00+08');
      `, [cli1Id]);

      // 2. 國泰證券資訊處
      const cli2Res = await client.query(`
        INSERT INTO clients (name, company_name, tax_id, contact_person, contact_phone, company_phone, email, address, system_type, requirement_summary, status)
        VALUES (
          '國泰證券資訊處',
          '國泰證券股份有限公司',
          '87654321',
          '林經理',
          '0988-765-432',
          '02-23456789',
          'lin@cathay.com',
          '台北市信義區松仁路 7 號 12 樓',
          'Web 管理系統',
          '內部交易對帳與自動報表產生系統，希望改善原本 Excel 人工作業。',
          'delivered'
        ) RETURNING id;
      `);
      const cli2Id = cli2Res.rows[0].id;

      await client.query(`
        INSERT INTO client_activity_logs (client_id, created_by_name, contact_type, summary, activity_date)
        VALUES 
          ($1, '黃資深業務', 'phone', '電話確認上線後滿月巡檢計畫與例行維護窗口對接。', '2026-08-12 11:20:00+08');
      `, [cli2Id]);

      // 3. 立案專案 1: 利恒智慧工廠物聯網平台
      const pj1Res = await client.query(`
        INSERT INTO projects (
          project_code, name, client_id, client_name, stage, health_status, progress_percent,
          assigned_engineers, start_date, duration_days, expected_delivery_date,
          tax_type, is_tax_added, amount_untaxed, tax_amount, amount_total,
          payment_stages, change_orders
        ) VALUES (
          'PJ-20260814-0001',
          '利恒智慧工廠物聯網平台',
          $1,
          '台元半導體股份有限公司',
          'development',
          'healthy',
          65,
          '["張工程師", "李工程師"]'::jsonb,
          '2026-08-01',
          120,
          '2026-11-29',
          'tax_exclusive',
          true,
          1000000,
          50000,
          1050000,
          '[
            {"id": "stg_1", "name": "第 1 期 訂金 (簽約)", "percentage": 40, "amount": 420000, "status": "received", "dueDate": "2026-08-05", "invoiceNumber": "INV-202608-0012"},
            {"id": "stg_2", "name": "第 2 期 系統交付款", "percentage": 40, "amount": 420000, "status": "invoiced", "dueDate": "2026-10-15", "invoiceNumber": "INV-202608-0045"},
            {"id": "stg_3", "name": "第 3 期 驗收尾款", "percentage": 20, "amount": 210000, "status": "pending", "dueDate": "2026-11-30"}
          ]'::jsonb,
          '[
            {
              "id": "co_1",
              "code": "CO-20260815-0001",
              "title": "追加 PLC 設備高頻數據採集與 Modbus 協定轉換模組",
              "amountUntaxed": 80000,
              "taxAmount": 4000,
              "amountTotal": 84000,
              "addedDays": 14,
              "status": "approved",
              "createdAt": "2026-08-15"
            }
          ]'::jsonb
        ) RETURNING id;
      `, [cli1Id]);
      const pj1Id = pj1Res.rows[0].id;

      // 植入 pj1 的 WBS 節點
      await client.query(`
        INSERT INTO project_wbs (
          project_id, wbs_code, parent_id, name, status,
          planned_start_date, planned_end_date, planned_duration_days,
          actual_start_date, actual_end_date, actual_duration_days,
          progress, assignees, is_milestone, predecessor_code, dependency_type, allow_pull_forward, sort_order
        ) VALUES 
          ($1, '1', NULL, '系統需求與 SDD 架構設計', 'COMPLETED', '2026-08-01', '2026-08-14', 14, '2026-08-01', '2026-08-14', 14, 100, '["張工程師"]'::jsonb, false, NULL, NULL, false, 0),
          ($1, '1.1', '1', '需求訪談與 PRD 規格書定稿', 'COMPLETED', '2026-08-01', '2026-08-07', 7, '2026-08-01', '2026-08-07', 7, 100, '["張工程師"]'::jsonb, false, NULL, NULL, false, 1),
          ($1, '1.2', '1', '系統架構設計與 12 張資料表 Drizzle Schema', 'COMPLETED', '2026-08-08', '2026-08-14', 7, '2026-08-08', '2026-08-14', 7, 100, '["李工程師"]'::jsonb, false, '1.1', 'FS', false, 2),
          ($1, '2', NULL, '核心後端與邊緣物聯網閘道研發', 'IN_PROGRESS', '2026-08-15', '2026-09-15', 31, '2026-08-15', NULL, 0, 50, '["張工程師", "李工程師"]'::jsonb, false, '1', 'FS', false, 3),
          ($1, '2.1', '2', 'MQTT 與 Modbus 通訊協定採集驅動', 'IN_PROGRESS', '2026-08-15', '2026-08-31', 17, '2026-08-15', NULL, 0, 60, '["張工程師"]'::jsonb, false, NULL, NULL, false, 4),
          ($1, '2.2', '2', '即時警報引擎與 WebSocket 廣播推送', 'NOT_STARTED', '2026-09-01', '2026-09-15', 15, NULL, NULL, 0, 0, '["李工程師"]'::jsonb, false, '2.1', 'FS', false, 5),
          ($1, '3', NULL, '系統上線前整體驗收交付 (里程碑)', 'NOT_STARTED', '2026-11-29', '2026-11-29', 0, NULL, NULL, 0, 0, '["張工程師"]'::jsonb, true, '2', 'FS', false, 6);
      `, [pj1Id]);

      // 4. 立案專案 2: 金融交易風控 AI 引擎
      const pj2Res = await client.query(`
        INSERT INTO projects (
          project_code, name, client_id, client_name, stage, health_status, progress_percent,
          assigned_engineers, start_date, duration_days, expected_delivery_date,
          tax_type, is_tax_added, amount_untaxed, tax_amount, amount_total,
          payment_stages
        ) VALUES (
          'PJ-20260812-0002',
          '金融交易風控 AI 引擎',
          $1,
          '國泰證券資訊處',
          'testing',
          'warning',
          90,
          '["王架構師"]'::jsonb,
          '2026-06-15',
          75,
          '2026-08-29',
          'tax_inclusive',
          false,
          1500000,
          71429,
          1500000,
          '[
            {"id": "stg_2_1", "name": "第 1 期 簽約訂金", "percentage": 50, "amount": 750000, "status": "received", "dueDate": "2026-06-20", "invoiceNumber": "INV-202606-0088"},
            {"id": "stg_2_2", "name": "第 2 期 驗收交付", "percentage": 50, "amount": 750000, "status": "invoiced", "dueDate": "2026-08-30", "invoiceNumber": "INV-202608-0099"}
          ]'::jsonb
        ) RETURNING id;
      `, [cli2Id]);
      const pj2Id = pj2Res.rows[0].id;

      await client.query(`
        INSERT INTO project_wbs (
          project_id, wbs_code, parent_id, name, status,
          planned_start_date, planned_end_date, planned_duration_days,
          actual_start_date, actual_end_date, actual_duration_days,
          progress, assignees, is_milestone, sort_order
        ) VALUES 
          ($1, '1', NULL, 'AI 模型訓練與風控規則配置', 'COMPLETED', '2026-06-15', '2026-07-31', 46, '2026-06-15', '2026-07-31', 46, 100, '["王架構師"]'::jsonb, false, 0),
          ($1, '2', NULL, '壓力測試與高頻交易回測', 'IN_PROGRESS', '2026-08-01', '2026-08-25', 25, '2026-08-01', NULL, 0, 80, '["王架構師"]'::jsonb, false, 1);
      `, [pj2Id]);

      console.log('✅ [DB Seed] 成功植入 CRM 預設客戶與 WBS 專案種子數據！');
    }
  } catch (error) {
    console.error('❌ [DB Seed Error] 初始化資料庫失敗:', error);
  } finally {
    client.release();
  }
}
