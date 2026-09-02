/**
 * @file issue.types.ts
 * @description 問題工單與多媒體附件前端類型定義 / Issue Tracking Types
 * @description_en Frontend TypeScript interfaces for issues, attachments, comments, and filters
 * @description_zh 定義問題工單、媒體附件、對話留言、建立輸入與篩選條件之型別介面
 */

export type IssueCategory = 'BUG' | 'UI_UX' | 'PERFORMANCE' | 'FEATURE_REQUEST' | 'DATA_ISSUE' | 'OTHER';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';

export interface IssueAttachment {
  id: string;
  issueId?: string | null;
  fileName: string;
  filePath: string;
  fileType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;
  uploadedByUserId?: string | null;
  uploadedByName?: string | null;
  createdAt: string;
}

export interface IssueComment {
  id: string;
  issueId: string;
  userId?: string | null;
  authorName: string;
  authorRole: 'super_admin' | 'engineer' | 'client';
  content: string;
  attachments?: IssueAttachment[];
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssueRecord {
  id: string;
  issueNo: string;
  projectId?: string | null;
  clientId?: string | null;
  createdByUserId?: string | null;
  createdByName: string;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  description: string;
  environmentInfo?: Record<string, any>;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  fixedInVersion?: string | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueDetail {
  issue: IssueRecord;
  attachments: IssueAttachment[];
  comments: IssueComment[];
  project?: {
    id: string;
    name: string;
    projectCode: string;
  } | null;
  client?: {
    id: string;
    name: string;
    companyName?: string;
  } | null;
}

export interface CreateIssueInput {
  projectId?: string | null;
  clientId?: string | null;
  title: string;
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  environmentInfo?: Record<string, any>;
  attachmentIds?: string[];
}

export interface UpdateIssueStatusInput {
  status: IssueStatus;
  fixedInVersion?: string | null;
  resolutionSummary?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
}

export interface IssueFilter {
  projectId?: string;
  clientId?: string;
  status?: string;
  category?: string;
  severity?: string;
  search?: string;
  assignedUserId?: string;
}
