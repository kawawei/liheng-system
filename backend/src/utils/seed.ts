/**
 * @file seed.ts
 * @description 資料庫初始化與預設管理員帳號 / Database Init & Admin Seed
 * @description_en Initializes extensions and creates all tables, only creating default admin/engineer accounts if they do not exist (no mock business data seeded)
 * @description_zh 自動初始化資料庫擴展與建立資料表，僅建立必要之預設管理者與研發工程師帳號，絕不寫入任何預設商業或測試數據
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
        contact_phone VARCHAR(30),
        line_name VARCHAR(100),
        line_id VARCHAR(100),
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
      ALTER TABLE clients ALTER COLUMN contact_phone DROP NOT NULL;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS line_name VARCHAR(100);
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS line_id VARCHAR(100);
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

    // 7. 建立 kb_documents 知識庫文檔主表
    await client.query(`
      CREATE TABLE IF NOT EXISTS kb_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        file_path VARCHAR(500) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        error_message TEXT,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMPTZ
      );
    `);

    // 8. 建立 kb_chunks 知識庫切片分塊表
    await client.query(`
      CREATE TABLE IF NOT EXISTS kb_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        embedding vector(1536),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // ========================================
    // 預設管理者與工程師帳號種子 (僅供登入使用)
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

    console.log('✅ [DB Init] 資料庫結構就緒，無預設商業資料。');
  } catch (error) {
    console.error('❌ [DB Seed Error] 初始化資料庫失敗:', error);
  } finally {
    client.release();
  }
}
