/**
 * @file kb.schema.ts
 * @description 知識庫資料庫模型與驗證結構 / Knowledge Base Schemas & Types
 * @description_en Defines schemas for knowledge base documents, chunks, and Zod validation rules
 * @description_zh 定義知識庫文檔表、分塊切片表結構以及相關的 Zod 驗證架構
 */

import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

// ========================================
// 自訂 pgvector 向量類型 / Custom pgvector Type
// ========================================
const vector = customType<{ data: number[] | null; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[] | null): string {
    if (!value) return '';
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] | null {
    if (!value) return null;
    try {
      return JSON.parse(value.replace(/^\[/, '[').replace(/\]$/, ']'));
    } catch {
      return null;
    }
  }
});

// ========================================
// 1. 知識庫文檔主表 / Knowledge Base Documents Table
// ========================================
export const kbDocuments = pgTable('kb_documents', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // 'md', 'ts', 'py', 'pdf', 'docx', 'xlsx', 'txt' ...
  fileSize: integer('file_size').notNull().default(0),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pending'), // 'pending' | 'parsing' | 'ready' | 'failed'
  errorMessage: text('error_message'),
  chunkCount: integer('chunk_count').notNull().default(0),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
});

// ========================================
// 2. 知識庫切片分塊表 / Knowledge Base Chunks Table
// ========================================
export const kbChunks = pgTable('kb_chunks', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  documentId: uuid('document_id').notNull().references(() => kbDocuments.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count').notNull().default(0),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`), // { section, startLine, endLine, language, pageNumber, ... }
  embedding: vector('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// ========================================
// TypeScript 類型推導 / TypeScript Types
// ========================================
export type KbDocumentRecord = typeof kbDocuments.$inferSelect;
export type NewKbDocumentRecord = typeof kbDocuments.$inferInsert;
export type KbChunkRecord = typeof kbChunks.$inferSelect;
export type NewKbChunkRecord = typeof kbChunks.$inferInsert;

// ========================================
// Zod 請求驗證結構 / Zod Schemas
// ========================================
export const searchKbSchema = z.object({
  query: z.string().min(1, '搜尋關鍵字不能為空 / Search query is required'),
  documentId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().min(0).default(0)
});

export type SearchKbInput = z.infer<typeof searchKbSchema>;
