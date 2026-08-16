/**
 * @file schema.ts
 * @description Drizzle ORM 資料庫模型定義 / Drizzle Database Schemas
 * @description_en Database table definitions including users, clients, activity logs, projects, and WBS nodes
 * @description_zh 定義系統核心資料表結構，包含使用者表、客戶表、聯繫日誌、專案表與 WBS 節點
 */

import { pgTable, uuid, varchar, boolean, timestamp, text, integer, numeric, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ========================================
// 1. 使用者與帳號資料表 / Users Table
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

// ========================================
// 2. 客戶資料表 / Clients Table
// ========================================
export const clients = pgTable('clients', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  companyName: varchar('company_name', { length: 100 }),
  taxId: varchar('tax_id', { length: 20 }),
  contactPerson: varchar('contact_person', { length: 50 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 30 }).notNull(),
  companyPhone: varchar('company_phone', { length: 30 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  systemType: varchar('system_type', { length: 50 }),
  requirementSummary: text('requirement_summary'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// ========================================
// 3. 客戶跟進聯繫日誌表 / Client Activity Logs
// ========================================
export const clientActivityLogs = pgTable('client_activity_logs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  userId: uuid('user_id'),
  createdByName: varchar('created_by_name', { length: 50 }).notNull(),
  contactType: varchar('contact_type', { length: 20 }).notNull().default('phone'),
  summary: text('summary').notNull(),
  activityDate: timestamp('activity_date', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// ========================================
// 4. 專案管理主表 / Projects Table
// ========================================
export const projects = pgTable('projects', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  projectCode: varchar('project_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  clientId: uuid('client_id').references(() => clients.id),
  clientName: varchar('client_name', { length: 100 }),
  stage: varchar('stage', { length: 30 }).notNull().default('development'),
  healthStatus: varchar('health_status', { length: 20 }).notNull().default('healthy'),
  progressPercent: integer('progress_percent').notNull().default(0),
  assignedEngineers: jsonb('assigned_engineers').default(sql`'[]'::jsonb`),
  startDate: varchar('start_date', { length: 20 }),
  durationDays: integer('duration_days').default(0),
  expectedDeliveryDate: varchar('expected_delivery_date', { length: 20 }),
  taxType: varchar('tax_type', { length: 30 }).default('tax_exclusive'),
  isTaxAdded: boolean('is_tax_added').default(true),
  amountUntaxed: numeric('amount_untaxed', { precision: 14, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).default('0'),
  amountTotal: numeric('amount_total', { precision: 14, scale: 2 }).default('0'),
  paymentStages: jsonb('payment_stages').default(sql`'[]'::jsonb`),
  changeOrders: jsonb('change_orders').default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// ========================================
// 5. 專案 WBS 工作分解結構節點表 / Project WBS Table
// ========================================
export const projectWbs = pgTable('project_wbs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  wbsCode: varchar('wbs_code', { length: 50 }).notNull(),
  parentId: varchar('parent_id', { length: 100 }),
  name: varchar('name', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('NOT_STARTED'),
  plannedStartDate: varchar('planned_start_date', { length: 20 }),
  plannedEndDate: varchar('planned_end_date', { length: 20 }),
  plannedDurationDays: integer('planned_duration_days').default(0),
  actualStartDate: varchar('actual_start_date', { length: 20 }),
  actualEndDate: varchar('actual_end_date', { length: 20 }),
  actualDurationDays: integer('actual_duration_days').default(0),
  progress: integer('progress').default(0),
  assignees: jsonb('assignees').default(sql`'[]'::jsonb`),
  isMilestone: boolean('is_milestone').default(false),
  predecessorCode: varchar('predecessor_code', { length: 50 }),
  dependencyType: varchar('dependency_type', { length: 10 }),
  allowPullForward: boolean('allow_pull_forward').default(false),
  isExpanded: boolean('is_expanded').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ClientRecord = typeof clients.$inferSelect;
export type NewClientRecord = typeof clients.$inferInsert;
export type ClientActivityLogRecord = typeof clientActivityLogs.$inferSelect;
export type ProjectRecord = typeof projects.$inferSelect;
export type NewProjectRecord = typeof projects.$inferInsert;
export type ProjectWbsRecord = typeof projectWbs.$inferSelect;
export type NewProjectWbsRecord = typeof projectWbs.$inferInsert;

export * from './kb.schema';

