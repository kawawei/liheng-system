/**
 * @file database.ts
 * @description PostgreSQL 資料庫連線與 Drizzle ORM 配置 / Database Connection & Drizzle ORM Config
 * @description_en Configures pg connection pool and initializes Drizzle ORM instance
 * @description_zh 配置 PostgreSQL 連線池與 Drizzle ORM 實例，提供全域資料庫操作介面
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../schemas/schema';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// ========================================
// PostgreSQL 連線池配置 / PostgreSQL Pool Config
// ========================================
export const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5434', 10),
  user: process.env.DB_USER || 'liheng_admin',
  password: process.env.DB_PASSWORD || 'liheng_secure_password_2026',
  database: process.env.DB_NAME || 'liheng_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// ========================================
// Drizzle ORM 實例 / Drizzle ORM Instance
// ========================================
export const db = drizzle(pool, { schema });
