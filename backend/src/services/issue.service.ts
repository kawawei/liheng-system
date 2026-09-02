/**
 * @file issue.service.ts
 * @description 問題工單商業邏輯服務層 / Issue Tracking Service
 * @description_en Handles business logic for issue tickets, attachment binding, status flow, and role-based permissions
 * @description_zh 負責工單編號自動生成、狀態流轉邏輯、雙向留言對話與客戶/工程師角色權限控制
 */

import { issueRepository, IssueFilterParams } from '../repositories/issue.repository';
import { projectRepository } from '../repositories/project.repository';
import { clientRepository } from '../repositories/client.repository';
import { userRepository } from '../repositories/user.repository';
import {
  IssueRecord,
  IssueAttachmentRecord,
  IssueCommentRecord,
  NewIssueAttachmentRecord
} from '../schemas/schema';
import { AuthJwtPayload } from '../middlewares/auth.middleware';

export interface CreateIssueDto {
  projectId?: string | null;
  clientId?: string | null;
  title: string;
  category: 'BUG' | 'UI_UX' | 'PERFORMANCE' | 'FEATURE_REQUEST' | 'DATA_ISSUE' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  environmentInfo?: Record<string, any>;
  attachmentIds?: string[];
}

export interface UpdateIssueDto {
  projectId?: string | null;
  title?: string;
  category?: 'BUG' | 'UI_UX' | 'PERFORMANCE' | 'FEATURE_REQUEST' | 'DATA_ISSUE' | 'OTHER';
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description?: string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
}

export interface UpdateIssueStatusDto {
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  fixedInVersion?: string | null;
  resolutionSummary?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
}

export interface CreateCommentDto {
  content: string;
  isInternal?: boolean;
  attachments?: any[];
}

export interface IssueDetailResponse {
  issue: IssueRecord;
  attachments: IssueAttachmentRecord[];
  comments: IssueCommentRecord[];
  project?: any;
  client?: any;
}

export class IssueService {
  /**
   * 生成工單編號 / Generate unique Issue Number (e.g. ISS-20260902-0001)
   */
  private async generateIssueNo(): Promise<string> {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const datePrefix = `ISS-${yyyy}${mm}${dd}`;

    const countToday = await issueRepository.countToday(datePrefix);
    const seq = String(countToday + 1).padStart(4, '0');
    return `${datePrefix}-${seq}`;
  }

  /**
   * 查詢問題工單列表 / Get issues list with role scoping
   */
  async getIssues(filter: IssueFilterParams, currentUser: AuthJwtPayload): Promise<IssueRecord[]> {
    const activeFilter: IssueFilterParams = { ...filter };

    // 若為客戶角色，限制僅能查詢自己所屬公司的工單
    if ((currentUser as any).role === 'client' && (currentUser as any).clientId) {
      activeFilter.clientId = (currentUser as any).clientId;
    }

    return await issueRepository.findAll(activeFilter);
  }

  /**
   * 查詢問題工單詳情 / Get issue detail with attachments & comments
   */
  async getIssueDetail(id: string, currentUser: AuthJwtPayload): Promise<IssueDetailResponse> {
    const issue = await issueRepository.findById(id);
    if (!issue) {
      throw new Error('找不到指定的工單或已被刪除');
    }

    // 權限檢查：若是客戶角色，只能查看自己公司的工單
    const isClient = (currentUser as any).role === 'client';
    if (isClient && (currentUser as any).clientId && issue.clientId !== (currentUser as any).clientId) {
      throw new Error('無權限查看此工單');
    }

    const attachments = await issueRepository.findAttachmentsByIssueId(id);
    const comments = await issueRepository.findCommentsByIssueId(id, !isClient);

    let project = null;
    if (issue.projectId) {
      project = await projectRepository.findById(issue.projectId);
    }

    let client = null;
    if (issue.clientId) {
      client = await clientRepository.findById(issue.clientId);
    }

    return {
      issue,
      attachments,
      comments,
      project,
      client
    };
  }

  /**
   * 建立問題工單 / Create a new issue ticket
   */
  async createIssue(dto: CreateIssueDto, currentUser: AuthJwtPayload): Promise<IssueRecord> {
    const issueNo = await this.generateIssueNo();

    let clientId = dto.clientId;
    // 若為客戶角色，自動綁定客戶 ID
    if ((currentUser as any).role === 'client' && (currentUser as any).clientId) {
      clientId = (currentUser as any).clientId;
    }

    // 若指定了專案且未指定客戶，自動推導客戶 ID
    if (dto.projectId && !clientId) {
      const project = await projectRepository.findById(dto.projectId);
      if (project?.clientId) {
        clientId = project.clientId;
      }
    }

    const newIssue = await issueRepository.create({
      issueNo,
      projectId: dto.projectId || null,
      clientId: clientId || null,
      createdByUserId: currentUser.userId,
      createdByName: (currentUser as any).realName || currentUser.username,
      title: dto.title,
      category: dto.category,
      severity: dto.severity,
      status: 'PENDING',
      description: dto.description,
      environmentInfo: dto.environmentInfo || {}
    });

    // 若有上傳附件 ID 陣列，綁定至此工單
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      await issueRepository.bindAttachmentsToIssue(dto.attachmentIds, newIssue.id);
    }

    return newIssue;
  }

  /**
   * 更新問題工單內容 / Update issue basic info
   */
  async updateIssue(id: string, dto: UpdateIssueDto, currentUser: AuthJwtPayload): Promise<IssueRecord> {
    const existing = await issueRepository.findById(id);
    if (!existing) {
      throw new Error('找不到指定的工單');
    }

    const updateData: Partial<any> = {};
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.severity !== undefined) updateData.severity = dto.severity;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.assignedUserId !== undefined) {
      updateData.assignedUserId = dto.assignedUserId;
      if (dto.assignedUserId) {
        const user = await userRepository.findById(dto.assignedUserId);
        updateData.assignedUserName = user?.realName || user?.username || null;
      } else {
        updateData.assignedUserName = null;
      }
    }

    const updated = await issueRepository.update(id, updateData);
    if (!updated) {
      throw new Error('更新工單失敗');
    }

    return updated;
  }

  /**
   * 變更問題工單狀態 (例如標記已修復、結案) / Update issue status
   */
  async updateStatus(id: string, dto: UpdateIssueStatusDto, currentUser: AuthJwtPayload): Promise<IssueRecord> {
    const existing = await issueRepository.findById(id);
    if (!existing) {
      throw new Error('找不到指定的工單');
    }

    const updateData: Partial<any> = {
      status: dto.status
    };

    if (dto.fixedInVersion !== undefined) {
      updateData.fixedInVersion = dto.fixedInVersion;
    }
    if (dto.resolutionSummary !== undefined) {
      updateData.resolutionSummary = dto.resolutionSummary;
    }
    if (dto.assignedUserId !== undefined) {
      updateData.assignedUserId = dto.assignedUserId;
      updateData.assignedUserName = dto.assignedUserName || null;
    }

    if (dto.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (dto.status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updated = await issueRepository.update(id, updateData);
    if (!updated) {
      throw new Error('狀態變更失敗');
    }

    // 自動新增一筆系統/工程師變更狀態日誌留言
    const roleName = currentUser.role === 'super_admin' ? '系統管理員' : (currentUser.role === 'engineer' ? '研發工程師' : '客戶');
    const statusMap: Record<string, string> = {
      PENDING: '待處理',
      IN_PROGRESS: '處理中',
      RESOLVED: '已修復',
      CLOSED: '已結案',
      REJECTED: '不予處理'
    };

    let logMessage = `【狀態變更】工單狀態變更為「${statusMap[dto.status] || dto.status}」`;
    if (dto.status === 'RESOLVED' && dto.fixedInVersion) {
      logMessage += `，預計修復版本：${dto.fixedInVersion}`;
    }
    if (dto.resolutionSummary) {
      logMessage += `\n處理說明：${dto.resolutionSummary}`;
    }

    await issueRepository.createComment({
      issueId: id,
      userId: currentUser.userId,
      authorName: (currentUser as any).realName || currentUser.username,
      authorRole: currentUser.role,
      content: logMessage,
      isInternal: false
    });

    return updated;
  }

  /**
   * 新增工單留言對話 / Add comment to issue
   */
  async addComment(issueId: string, dto: CreateCommentDto, currentUser: AuthJwtPayload): Promise<IssueCommentRecord> {
    const existing = await issueRepository.findById(issueId);
    if (!existing) {
      throw new Error('找不到指定的工單');
    }

    // 客戶角色不可建立內部私密留言
    const isClient = (currentUser as any).role === 'client';
    const isInternal = isClient ? false : !!dto.isInternal;

    return await issueRepository.createComment({
      issueId,
      userId: currentUser.userId,
      authorName: (currentUser as any).realName || currentUser.username,
      authorRole: currentUser.role,
      content: dto.content,
      attachments: dto.attachments || [],
      isInternal
    });
  }

  /**
   * 儲存媒體附件紀錄 / Save uploaded attachment
   */
  async saveAttachment(data: {
    fileName: string;
    filePath: string;
    fileType: 'image' | 'video' | 'document';
    mimeType: string;
    fileSize: number;
    issueId?: string;
    currentUser: AuthJwtPayload;
  }): Promise<IssueAttachmentRecord> {
    return await issueRepository.createAttachment({
      issueId: data.issueId || null,
      fileName: data.fileName,
      filePath: data.filePath,
      fileType: data.fileType,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      uploadedByUserId: data.currentUser.userId,
      uploadedByName: (data.currentUser as any).realName || data.currentUser.username
    });
  }

  /**
   * 軟刪除工單 / Delete issue
   */
  async deleteIssue(id: string): Promise<boolean> {
    return await issueRepository.softDelete(id);
  }
}

export const issueService = new IssueService();
