/**
 * @file kb.controller.ts
 * @description 知識庫控制器 / Knowledge Base Controller
 * @description_en Handles HTTP requests for file upload, document parsing, chunk query and semantic search
 * @description_zh 處理知識庫檔案上傳、解析流程觸發、文檔清單、分塊內容檢視與檢索之 HTTP 請求與響應
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { kbService } from '../services/kb.service';
import { searchKbSchema } from '../schemas/kb.schema';

// 配置 Multer 內存儲存，供流暢提取與解析
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 上限 50MB
  }
});

export class KbController {
  /**
   * 上傳並解析檔案 / Upload & Process Document
   * POST /api/v1/kb/documents
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: '請選擇要上傳的檔案 / Please select a file to upload',
          code: 'FILE_REQUIRED'
        });
        return;
      }

      const result = await kbService.processUploadedFile({
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      res.status(201).json({
        success: true,
        message: `檔案 ${result.document.originalName} 上傳並解析成功，共產生 ${result.chunkCount} 個切片`,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得知識庫文檔列表 / Get Documents List
   * GET /api/v1/kb/documents
   */
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const fileType = req.query.fileType as string | undefined;

      const docs = await kbService.getDocuments({ search, status, fileType });

      res.status(200).json({
        success: true,
        data: docs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得單一文檔詳情 / Get Document by ID
   * GET /api/v1/kb/documents/:id
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const doc = await kbService.getDocumentById(id);

      res.status(200).json({
        success: true,
        data: doc,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 取得文檔的切片清單 / Get Document Chunks
   * GET /api/v1/kb/documents/:id/chunks
   */
  async getDocumentChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const chunks = await kbService.getDocumentChunks(id);

      res.status(200).json({
        success: true,
        data: chunks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 刪除文檔 / Delete Document
   * DELETE /api/v1/kb/documents/:id
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await kbService.deleteDocument(id);

      res.status(200).json({
        success: true,
        message: '文檔已成功刪除 / Document deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 檢索知識庫切片 / Search Chunks
   * POST /api/v1/kb/search
   */
  async searchChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = searchKbSchema.parse(req.body);
      const result = await kbService.searchChunks(input);

      res.status(200).json({
        success: true,
        data: result.chunks,
        total: result.total,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const kbController = new KbController();
