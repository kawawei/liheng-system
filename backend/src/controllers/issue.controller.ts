/**
 * @file issue.controller.ts
 * @description 問題工單與多媒體附件控制器 / Issue Tracking Controller
 * @description_en Handles HTTP requests for software issue management, status transitions, comments, and media uploads
 * @description_zh 處理問題工單的 CRUD、狀態變更、留言發布與圖片/影片媒體上傳處理
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createIssueSchema,
  updateIssueSchema,
  updateIssueStatusSchema,
  createIssueCommentSchema
} from '../schemas/schema';
import { issueService } from '../services/issue.service';

// ========================================
// Multer 媒體上傳設定 / Media Upload Multer Config
// ========================================
const uploadDir = path.resolve(process.cwd(), 'uploads', 'issues');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `issue-media-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支援的檔案格式 (${file.mimetype})，僅支援常見圖片、MP4/WebM 影片與 PDF`));
  }
};

export const issueUploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 最大 100MB 影片或圖片
  }
});

export class IssueController {
  /**
   * 上傳圖片/影片附件 / Upload issue media attachment
   */
  async uploadMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '未接收到上傳檔案',
          code: 'NO_FILE_UPLOADED'
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: '請先登入',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const isVideo = req.file.mimetype.startsWith('video/');
      const isImage = req.file.mimetype.startsWith('image/');
      const fileType = isVideo ? 'video' : (isImage ? 'image' : 'document');

      // 靜態訪問 URL (例如 /uploads/issues/filename)
      const webPath = `/uploads/issues/${req.file.filename}`;

      const attachment = await issueService.saveAttachment({
        fileName: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
        filePath: webPath,
        fileType,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        issueId: req.body.issueId || undefined,
        currentUser: req.user
      });

      res.status(201).json({
        success: true,
        message: '媒體檔案上傳成功',
        data: attachment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得工單清單 / Get issues list
   */
  async getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const { projectId, clientId, status, category, severity, search, assignedUserId } = req.query;

      const issues = await issueService.getIssues(
        {
          projectId: projectId as string,
          clientId: clientId as string,
          status: status as string,
          category: category as string,
          severity: severity as string,
          search: search as string,
          assignedUserId: assignedUserId as string
        },
        req.user
      );

      res.json({
        success: true,
        data: issues
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得工單詳情 / Get issue detail
   */
  async getIssueById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const id = req.params.id as string;
      const result = await issueService.getIssueDetail(id, req.user);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 建立工單 / Create issue
   */
  async createIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const validated = createIssueSchema.parse(req.body);
      const newIssue = await issueService.createIssue(validated, req.user);

      res.status(201).json({
        success: true,
        message: '問題工單建立成功',
        data: newIssue
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新工單基本資訊 / Update issue
   */
  async updateIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const id = req.params.id as string;
      const validated = updateIssueSchema.parse(req.body);
      const updated = await issueService.updateIssue(id, validated, req.user);

      res.json({
        success: true,
        message: '工單更新成功',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 變更工單狀態 / Update issue status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const id = req.params.id as string;
      const validated = updateIssueStatusSchema.parse(req.body);
      const updated = await issueService.updateStatus(id, validated, req.user);

      res.json({
        success: true,
        message: '工單狀態已變更',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新增留言記錄 / Add comment
   */
  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const id = req.params.id as string;
      const validated = createIssueCommentSchema.parse(req.body);
      const comment = await issueService.addComment(id, validated, req.user);

      res.status(201).json({
        success: true,
        message: '留言已發布',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刪除工單 / Delete issue
   */
  async deleteIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: '請先登入', code: 'UNAUTHORIZED' });
        return;
      }

      const id = req.params.id as string;
      const success = await issueService.deleteIssue(id);

      res.json({
        success,
        message: success ? '工單已刪除' : '工單刪除失敗'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const issueController = new IssueController();
