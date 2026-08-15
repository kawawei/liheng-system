/**
 * @file project.repository.ts
 * @description WBS 專案與里程碑資料存取層 / Project & WBS Repository
 * @description_en Handles database operations for projects, WBS tree nodes, and change orders
 * @description_zh 負責專案主表、WBS 樹狀工項結構與變更單資料庫持久化操作
 */

import { eq, and, isNull, or, ilike, desc, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { projects, projectWbs, ProjectRecord, NewProjectRecord, ProjectWbsRecord } from '../schemas/schema';

export class ProjectRepository {
  /**
   * 取得專案清單 / Find all active projects
   */
  async findAll(filter?: { stage?: string; search?: string; clientId?: string }): Promise<ProjectRecord[]> {
    const conditions = [isNull(projects.deletedAt)];

    if (filter?.stage && filter.stage !== 'all') {
      conditions.push(eq(projects.stage, filter.stage));
    }

    if (filter?.clientId) {
      conditions.push(eq(projects.clientId, filter.clientId));
    }

    if (filter?.search && filter.search.trim()) {
      const searchPattern = `%${filter.search.trim()}%`;
      conditions.push(
        or(
          ilike(projects.name, searchPattern),
          ilike(projects.projectCode, searchPattern),
          ilike(projects.clientName, searchPattern)
        )!
      );
    }

    return await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt));
  }

  /**
   * 根據 ID 或 ProjectCode 尋找專案 / Find project by ID or code
   */
  async findById(idOrCode: string): Promise<ProjectRecord | null> {
    const conditions = [
      isNull(projects.deletedAt),
      or(eq(projects.id, idOrCode), eq(projects.projectCode, idOrCode))!
    ];

    const result = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 建立新專案 / Create project
   */
  async create(data: NewProjectRecord): Promise<ProjectRecord> {
    const result = await db.insert(projects).values(data).returning();
    return result[0];
  }

  /**
   * 更新專案資料 / Update project
   */
  async update(id: string, data: Partial<NewProjectRecord>): Promise<ProjectRecord | null> {
    const result = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .returning();

    return result[0] || null;
  }

  /**
   * 軟刪除專案 / Soft delete project
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await db
      .update(projects)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
      .returning({ id: projects.id });

    return result.length > 0;
  }

  /**
   * 查詢專案所有 WBS 節點 / Find all WBS nodes of project
   */
  async findWbsNodes(projectId: string): Promise<ProjectWbsRecord[]> {
    return await db
      .select()
      .from(projectWbs)
      .where(and(eq(projectWbs.projectId, projectId), isNull(projectWbs.deletedAt)))
      .orderBy(asc(projectWbs.sortOrder), asc(projectWbs.wbsCode));
  }

  /**
   * 批次覆寫/儲存 WBS 節點 / Batch save or replace WBS nodes
   */
  async saveWbsNodes(projectId: string, nodes: any[]): Promise<ProjectWbsRecord[]> {
    // 軟刪除舊節點
    await db
      .update(projectWbs)
      .set({ deletedAt: new Date() })
      .where(and(eq(projectWbs.projectId, projectId), isNull(projectWbs.deletedAt)));

    if (!nodes || nodes.length === 0) return [];

    const insertValues = nodes.map((node, index) => ({
      projectId,
      wbsCode: node.wbsCode,
      parentId: node.parentId || null,
      name: node.name,
      status: node.status || 'NOT_STARTED',
      plannedStartDate: node.plannedStartDate || null,
      plannedEndDate: node.plannedEndDate || null,
      plannedDurationDays: node.plannedDurationDays ?? 0,
      actualStartDate: node.actualStartDate || null,
      actualEndDate: node.actualEndDate || null,
      actualDurationDays: node.actualDurationDays ?? 0,
      progress: node.progress ?? 0,
      assignees: node.assignees || [],
      isMilestone: !!node.isMilestone,
      predecessorCode: node.predecessorCode || null,
      dependencyType: node.dependencyType || null,
      allowPullForward: !!node.allowPullForward,
      isExpanded: node.isExpanded ?? true,
      sortOrder: index
    }));

    return await db.insert(projectWbs).values(insertValues).returning();
  }
}

export const projectRepository = new ProjectRepository();
