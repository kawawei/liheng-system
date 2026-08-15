/**
 * @file seed.ts
 * @description 資料庫初始化與預設種子資料植入 / Database Init & Seed
 * @description_en Initializes extensions, creates tables if missing, and seeds initial administrator
 * @description_zh 自動初始化資料庫擴展、建立使用者資料表並植入預設管理員與初始工程師帳號
 */

import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

export async function initDatabaseAndSeed(): Promise<void> {
  const client = await pool.connect();
  try {
    // 1. 啟用 uuid-ossp 與 pgcrypto 擴展
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 嘗試啟用 vector 擴展 (若映像支援)
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS "vector";`);
    } catch {
      // 忽略非 pgvector 環境
    }

    // 2. 建立 users 資料表 (若不存在)
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

    // 3. 檢查是否已有管理員，若無則植入預設管理員
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
      console.log('✅ [DB Seed] 成功建立預設超級管理員: admin / admin123');
    }

    // 4. 植入預設研發工程師 (若無)
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
      console.log('✅ [DB Seed] 成功建立預設研發工程師: dev / admin123');
    }
  } catch (error) {
    console.error('❌ [DB Seed Error] 初始化資料庫失敗:', error);
  } finally {
    client.release();
  }
}
