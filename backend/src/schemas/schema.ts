/**
 * @file schema.ts
 * @description Drizzle ORM 資料庫模型定義 / Drizzle Database Schemas
 * @description_en Database table definitions including users table and roles
 * @description_zh 定義系統核心資料庫資料表結構，包含使用者表 (users) 與軟刪除欄位
 */

import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ========================================
// 使用者與帳號資料表 / Users Table
// ========================================
export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  realName: varchar('real_name', { length: 50 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('engineer'), // 'super_admin' | 'engineer'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
