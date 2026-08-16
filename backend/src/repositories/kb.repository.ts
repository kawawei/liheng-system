/**
 * @file kb.repository.ts
 * @description 知識庫資料存取層 / Knowledge Base Repository
 * @description_en Handles database CRUD and query operations for kb_documents and kb_chunks tables
 * @description_zh 負責知識庫文檔表與切片分塊表的新增、查詢、更新、軟刪除與切片搜尋操作
 */

import { eq, and, isNull, desc, ilike, sql } from 'drizzle-orm';
import { db } from '../config/database';
import {
  kbDocuments,
  kbChunks,
  KbDocumentRecord,
  NewKbDocumentRecord,
  KbChunkRecord,
  NewKbChunkRecord
} from '../schemas/schema';

export class KbRepository {
  /**
   * 建立知識庫文檔紀錄 / Create Knowledge Base Document
   */
  async createDocument(data: NewKbDocumentRecord): Promise<KbDocumentRecord> {
    const result = await db.insert(kbDocuments).values(data).returning();
    return result[0];
  }

  /**
   * 根據 ID 查詢文檔 / Find Document by ID
   */
  async findDocumentById(id: string): Promise<KbDocumentRecord | null> {
    const result = await db
      .select()
      .from(kbDocuments)
      .where(and(eq(kbDocuments.id, id), isNull(kbDocuments.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 查詢知識庫文檔清單 / Find Documents
   */
  async findDocuments(filter?: { search?: string; status?: string; fileType?: string }): Promise<KbDocumentRecord[]> {
    const conditions = [isNull(kbDocuments.deletedAt)];

    if (filter?.status && filter.status !== 'all') {
      conditions.push(eq(kbDocuments.status, filter.status));
    }

    if (filter?.fileType && filter.fileType !== 'all') {
      conditions.push(eq(kbDocuments.fileType, filter.fileType));
    }

    if (filter?.search && filter.search.trim()) {
      const pattern = `%${filter.search.trim()}%`;
      conditions.push(ilike(kbDocuments.originalName, pattern));
    }

    return await db
      .select()
      .from(kbDocuments)
      .where(and(...conditions))
      .orderBy(desc(kbDocuments.createdAt));
  }

  /**
   * 更新文檔資訊與狀態 / Update Document
   */
  async updateDocument(id: string, data: Partial<NewKbDocumentRecord>): Promise<KbDocumentRecord | null> {
    const result = await db
      .update(kbDocuments)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(kbDocuments.id, id), isNull(kbDocuments.deletedAt)))
      .returning();

    return result[0] || null;
  }

  /**
   * 軟刪除文檔 / Soft Delete Document
   */
  async softDeleteDocument(id: string): Promise<boolean> {
    const result = await db
      .update(kbDocuments)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(kbDocuments.id, id), isNull(kbDocuments.deletedAt)))
      .returning();

    return result.length > 0;
  }

  /**
   * 批次寫入切片分塊 / Batch Insert Chunks
   */
  async createChunks(chunksData: NewKbChunkRecord[]): Promise<KbChunkRecord[]> {
    if (chunksData.length === 0) return [];
    return await db.insert(kbChunks).values(chunksData).returning();
  }

  /**
   * 取得指定文檔的所有切片 / Get Chunks by Document ID
   */
  async findChunksByDocumentId(documentId: string): Promise<KbChunkRecord[]> {
    return await db
      .select()
      .from(kbChunks)
      .where(eq(kbChunks.documentId, documentId))
      .orderBy(kbChunks.chunkIndex);
  }

  /**
   * 刪除指定文檔的所有切片 / Delete Chunks by Document ID
   */
  async deleteChunksByDocumentId(documentId: string): Promise<number> {
    const result = await db.delete(kbChunks).where(eq(kbChunks.documentId, documentId)).returning();
    return result.length;
  }

  /**
   * 關鍵字與全文檢索切片 / Search Chunks
   */
  async searchChunks(options: {
    query: string;
    documentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ chunks: (KbChunkRecord & { documentName?: string })[]; total: number }> {
    const { query, documentId, limit = 10, offset = 0 } = options;
    const searchPattern = `%${query.trim()}%`;

    const baseConditions = [
      isNull(kbDocuments.deletedAt),
      ilike(kbChunks.content, searchPattern)
    ];

    if (documentId) {
      baseConditions.push(eq(kbChunks.documentId, documentId));
    }

    const rows = await db
      .select({
        id: kbChunks.id,
        documentId: kbChunks.documentId,
        chunkIndex: kbChunks.chunkIndex,
        content: kbChunks.content,
        tokenCount: kbChunks.tokenCount,
        metadata: kbChunks.metadata,
        embedding: kbChunks.embedding,
        createdAt: kbChunks.createdAt,
        documentName: kbDocuments.originalName
      })
      .from(kbChunks)
      .innerJoin(kbDocuments, eq(kbChunks.documentId, kbDocuments.id))
      .where(and(...baseConditions))
      .orderBy(desc(kbChunks.createdAt))
      .limit(limit)
      .offset(offset);

    // 計算符合總數
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(kbChunks)
      .innerJoin(kbDocuments, eq(kbChunks.documentId, kbDocuments.id))
      .where(and(...baseConditions));

    return {
      chunks: rows,
      total: countResult[0]?.count || 0
    };
  }
}

export const kbRepository = new KbRepository();
