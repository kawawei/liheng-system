/**
 * @file client.repository.ts
 * @description CRM 客戶資料存取層 / Client Repository
 * @description_en Handles database operations for clients and contact activity logs
 * @description_zh 負責客戶主表與聯繫日誌表之 CRUD、搜尋篩選與軟刪除資料庫操作
 */

import { eq, and, isNull, or, ilike, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { clients, clientActivityLogs, ClientRecord, NewClientRecord, ClientActivityLogRecord } from '../schemas/schema';

export class ClientRepository {
  /**
   * 取得所有未刪除客戶 / Find all active clients
   */
  async findAll(filter?: { status?: string; search?: string }): Promise<ClientRecord[]> {
    const conditions = [isNull(clients.deletedAt)];

    if (filter?.status && filter.status !== 'all') {
      conditions.push(eq(clients.status, filter.status));
    }

    if (filter?.search && filter.search.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(clients.name, searchPattern),
          ilike(clients.companyName, searchPattern),
          ilike(clients.contactPerson, searchPattern),
          ilike(clients.contactPhone, searchPattern),
          ilike(clients.taxId, searchPattern),
          ilike(clients.systemType, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt));
  }

  /**
   * 根據 ID 查詢客戶 / Find client by ID
   */
  async findById(id: string): Promise<ClientRecord | null> {
    const result = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 建立新客戶 / Create client
   */
  async create(data: NewClientRecord): Promise<ClientRecord> {
    const result = await db.insert(clients).values(data).returning();
    return result[0];
  }

  /**
   * 更新客戶資料 / Update client
   */
  async update(id: string, data: Partial<NewClientRecord>): Promise<ClientRecord | null> {
    const result = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .returning();

    return result[0] || null;
  }

  /**
   * 軟刪除客戶 / Soft delete client
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(clients)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(clients.id, id), isNull(clients.deletedAt)))
      .returning({ id: clients.id });

    return result.length > 0;
  }

  /**
   * 取得客戶的聯繫歷史日誌 / Get client activity logs
   */
  async findActivityLogsByClientId(clientId: string): Promise<ClientActivityLogRecord[]> {
    return await db
      .select()
      .from(clientActivityLogs)
      .where(eq(clientActivityLogs.clientId, clientId))
      .orderBy(desc(clientActivityLogs.activityDate));
  }

  /**
   * 新增聯繫日誌 / Add activity log
   */
  async addActivityLog(data: {
    clientId: string;
    userId?: string;
    createdByName: string;
    contactType: string;
    summary: string;
    activityDate?: Date;
  }): Promise<ClientActivityLogRecord> {
    const result = await db.insert(clientActivityLogs).values(data).returning();
    return result[0];
  }
}

export const clientRepository = new ClientRepository();
