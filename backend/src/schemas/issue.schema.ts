/**
 * @file issue.schema.ts
 * @description 問題工單與附件資料模型定義 / Issue Tracking & Attachments Schema
 * @description_en Database schema and Zod validations for software issues, media attachments, and discussion comments
 * @description_zh 定義軟體問題工單、媒體附件 (圖片/影片) 與溝通留言之資料表結構與驗證器
 */

import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { users, clients, projects } from './schema';

// ========================================
// 1. 問題工單主表 / Issues Table
// ========================================
export const issues = pgTable('issues', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  issueNo: varchar('issue_no', { length: 50 }).notNull().unique(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdByName: varchar('created_by_name', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull().default('BUG'), // 'BUG' | 'UI_UX' | 'PERFORMANCE' | 'FEATURE_REQUEST' | 'DATA_ISSUE' | 'OTHER'
  severity: varchar('severity', { length: 30 }).notNull().default('MEDIUM'), // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: varchar('status', { length: 30 }).notNull().default('PENDING'), // 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'
  description: text('description').notNull(),
  environmentInfo: jsonb('environment_info').default(sql`'{}'::jsonb`),
  assignedUserId: uuid('assigned_user_id').references(() => users.id, { onDelete: 'set null' }),
  assignedUserName: varchar('assigned_user_name', { length: 100 }),
  fixedInVersion: varchar('fixed_in_version', { length: 50 }),
  resolutionSummary: text('resolution_summary'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// ========================================
// 2. 媒體附件表 (圖片/影片) / Issue Attachments Table
// ========================================
export const issueAttachments = pgTable('issue_attachments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  issueId: uuid('issue_id').references(() => issues.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileType: varchar('file_type', { length: 30 }).notNull().default('image'), // 'image' | 'video' | 'document'
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull().default(0),
  uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  uploadedByName: varchar('uploaded_by_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// ========================================
// 3. 溝通對話與留言記錄表 / Issue Comments Table
// ========================================
export const issueComments = pgTable('issue_comments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  issueId: uuid('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: varchar('author_name', { length: 100 }).notNull(),
  authorRole: varchar('author_role', { length: 30 }).notNull().default('client'), // 'super_admin' | 'engineer' | 'client'
  content: text('content').notNull(),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`),
  isInternal: boolean('is_internal').notNull().default(false), // 內部私密筆記 (僅管理員/工程師可見)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// ========================================
// Zod 驗證架構 / Zod Validation Schemas
// ========================================
export const createIssueSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  title: z.string().min(2, '標題長度至少需 2 個字元').max(255, '標題長度不可超過 255 字元'),
  category: z.enum(['BUG', 'UI_UX', 'PERFORMANCE', 'FEATURE_REQUEST', 'DATA_ISSUE', 'OTHER']).default('BUG'),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  description: z.string().min(5, '問題描述至少需 5 個字元'),
  environmentInfo: z.record(z.any()).optional().default({}),
  attachmentIds: z.array(z.string().uuid()).optional().default([])
});

export const updateIssueSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  title: z.string().min(2).max(255).optional(),
  category: z.enum(['BUG', 'UI_UX', 'PERFORMANCE', 'FEATURE_REQUEST', 'DATA_ISSUE', 'OTHER']).optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  description: z.string().min(5).optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  assignedUserName: z.string().max(100).optional().nullable()
});

export const updateIssueStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']),
  fixedInVersion: z.string().max(50).optional().nullable(),
  resolutionSummary: z.string().optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
  assignedUserName: z.string().max(100).optional().nullable()
});

export const createIssueCommentSchema = z.object({
  content: z.string().min(1, '留言內容不可為空'),
  isInternal: z.boolean().optional().default(false),
  attachments: z.array(z.any()).optional().default([])
});

export type IssueRecord = typeof issues.$inferSelect;
export type NewIssueRecord = typeof issues.$inferInsert;
export type IssueAttachmentRecord = typeof issueAttachments.$inferSelect;
export type NewIssueAttachmentRecord = typeof issueAttachments.$inferInsert;
export type IssueCommentRecord = typeof issueComments.$inferSelect;
export type NewIssueCommentRecord = typeof issueComments.$inferInsert;
