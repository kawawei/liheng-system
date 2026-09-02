/**
 * @file issue.repository.ts
 * @description 問題工單、附件與留言資料存取層 / Issue Tracking Repository
 * @description_en Handles database operations for software issues, media attachments, and comments
 * @description_zh 負責問題工單主表、媒體附件、對話留言與狀態統計之資料庫持久化操作
 */

import { eq, and, isNull, or, ilike, desc, asc, count } from 'drizzle-orm';
import { db } from '../config/database';
import {
  issues,
  issueAttachments,
  issueComments,
  IssueRecord,
  NewIssueRecord,
  IssueAttachmentRecord,
  NewIssueAttachmentRecord,
  IssueCommentRecord,
  NewIssueCommentRecord
} from '../schemas/schema';

export interface IssueFilterParams {
  projectId?: string;
  clientId?: string;
  status?: string;
  category?: string;
  severity?: string;
  search?: string;
  assignedUserId?: string;
}

export class IssueRepository {
  /**
   * 查詢問題工單列表 / Find issues by filter
   */
  async findAll(filter?: IssueFilterParams): Promise<IssueRecord[]> {
    const conditions = [isNull(issues.deletedAt)];

    if (filter?.projectId) {
      conditions.push(eq(issues.projectId, filter.projectId));
    }

    if (filter?.clientId) {
      conditions.push(eq(issues.clientId, filter.clientId));
    }

    if (filter?.status && filter.status !== 'ALL') {
      conditions.push(eq(issues.status, filter.status));
    }

    if (filter?.category && filter.category !== 'ALL') {
      conditions.push(eq(issues.category, filter.category));
    }

    if (filter?.severity && filter.severity !== 'ALL') {
      conditions.push(eq(issues.severity, filter.severity));
    }

    if (filter?.assignedUserId) {
      conditions.push(eq(issues.assignedUserId, filter.assignedUserId));
    }

    if (filter?.search && filter.search.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(issues.title, searchPattern),
          ilike(issues.issueNo, searchPattern),
          ilike(issues.description, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(issues)
      .where(and(...conditions))
      .orderBy(desc(issues.createdAt));
  }

  /**
   * 根據 ID 查詢問題工單 / Find issue by ID
   */
  async findById(id: string): Promise<IssueRecord | null> {
    const result = await db
      .select()
      .from(issues)
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 根據工單編號查詢 / Find issue by Issue No
   */
  async findByIssueNo(issueNo: string): Promise<IssueRecord | null> {
    const result = await db
      .select()
      .from(issues)
      .where(and(eq(issues.issueNo, issueNo), isNull(issues.deletedAt)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 建立問題工單 / Create issue
   */
  async create(data: NewIssueRecord): Promise<IssueRecord> {
    const result = await db.insert(issues).values(data).returning();
    return result[0];
  }

  /**
   * 更新問題工單 / Update issue
   */
  async update(id: string, data: Partial<NewIssueRecord>): Promise<IssueRecord | null> {
    const result = await db
      .update(issues)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)))
      .returning();

    return result[0] || null;
  }

  /**
   * 軟刪除問題工單 / Soft delete issue
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(issues)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(issues.id, id), isNull(issues.deletedAt)))
      .returning({ id: issues.id });

    return result.length > 0;
  }

  /**
   * 查詢當日工單數量（用於生成流水號）/ Count issues created today
   */
  async countToday(datePrefix: string): Promise<number> {
    const searchPattern = `${datePrefix}%`;
    const result = await db
      .select({ count: count() })
      .from(issues)
      .where(ilike(issues.issueNo, searchPattern));

    return Number(result[0]?.count || 0);
  }

  // ========================================
  // 附件管理 / Attachments Operations
  // ========================================

  /**
   * 建立附件記錄 / Create attachment record
   */
  async createAttachment(data: NewIssueAttachmentRecord): Promise<IssueAttachmentRecord> {
    const result = await db.insert(issueAttachments).values(data).returning();
    return result[0];
  }

  /**
   * 關聯附件至工單 / Associate attachments to issue
   */
  async bindAttachmentsToIssue(attachmentIds: string[], issueId: string): Promise<void> {
    if (!attachmentIds || attachmentIds.length === 0) return;
    for (const attId of attachmentIds) {
      await db
        .update(issueAttachments)
        .set({ issueId })
        .where(eq(issueAttachments.id, attId));
    }
  }

  /**
   * 查詢工單的所有附件 / Find attachments by issue ID
   */
  async findAttachmentsByIssueId(issueId: string): Promise<IssueAttachmentRecord[]> {
    return await db
      .select()
      .from(issueAttachments)
      .where(eq(issueAttachments.issueId, issueId))
      .orderBy(asc(issueAttachments.createdAt));
  }

  // ========================================
  // 留言記錄 / Comments Operations
  // ========================================

  /**
   * 建立留言記錄 / Create comment
   */
  async createComment(data: NewIssueCommentRecord): Promise<IssueCommentRecord> {
    const result = await db.insert(issueComments).values(data).returning();
    return result[0];
  }

  /**
   * 查詢工單的所有留言 / Find comments by issue ID
   */
  async findCommentsByIssueId(issueId: string, includeInternal: boolean = true): Promise<IssueCommentRecord[]> {
    const conditions = [
      eq(issueComments.issueId, issueId),
      isNull(issueComments.deletedAt)
    ];

    if (!includeInternal) {
      conditions.push(eq(issueComments.isInternal, false));
    }

    return await db
      .select()
      .from(issueComments)
      .where(and(...conditions))
      .orderBy(asc(issueComments.createdAt));
  }
}

export const issueRepository = new IssueRepository();
