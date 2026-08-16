/**
 * @file kb.service.ts
 * @description 知識庫業務邏輯服務層 / Knowledge Base Service
 * @description_en Handles document storage, parsing pipeline, chunk indexing, search and lifecycle management
 * @description_zh 負責檔案儲存、調用解析工廠切塊、切片向量索引持久化、文檔管理與語意/全文檢索業務邏輯
 */

import fs from 'fs';
import path from 'path';
import { kbRepository, KbRepository } from '../repositories/kb.repository';
import { DocumentParserFactory } from './parsers';
import { KbDocumentRecord, KbChunkRecord, NewKbChunkRecord } from '../schemas/schema';

export class KbService {
  private repository: KbRepository;
  private uploadDir: string;

  constructor(repository: KbRepository = kbRepository) {
    this.repository = repository;
    this.uploadDir = path.resolve(process.cwd(), 'uploads/kb');

    // 確保上傳存儲目錄存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * 儲存並處理上傳文檔 / Upload and Process Document
   */
  async processUploadedFile(file: {
    originalname: string;
    buffer?: Buffer;
    path?: string;
    size: number;
    mimetype: string;
  }): Promise<{ document: KbDocumentRecord; chunkCount: number }> {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); // 修正中文檔名編碼
    const ext = originalName.split('.').pop()?.toLowerCase() || 'txt';
    const timestamp = Date.now();
    const safeFileName = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const targetFilePath = path.join(this.uploadDir, safeFileName);

    // 取得檔案 Buffer
    let fileBuffer: Buffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
      await fs.promises.writeFile(targetFilePath, fileBuffer);
    } else if (file.path) {
      fileBuffer = await fs.promises.readFile(file.path);
      await fs.promises.copyFile(file.path, targetFilePath);
    } else {
      throw new Error('未提供有效之檔案資料 / No valid file buffer or path provided');
    }

    // 1. 建立初始文檔記錄 (狀態: parsing)
    const docRecord = await this.repository.createDocument({
      name: safeFileName,
      originalName,
      fileType: ext,
      fileSize: file.size,
      filePath: targetFilePath,
      status: 'parsing',
      chunkCount: 0,
      metadata: {
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

    try {
      // 2. 調用解析器工廠解析檔案
      const parseResult = await DocumentParserFactory.parseDocument(fileBuffer, originalName, file.mimetype);

      // 3. 準備批次寫入切片資料
      const chunksToInsert: NewKbChunkRecord[] = parseResult.chunks.map((c) => ({
        documentId: docRecord.id,
        chunkIndex: c.chunkIndex,
        content: c.content,
        tokenCount: c.tokenCount,
        metadata: c.metadata,
        embedding: null // 後續接入 AI Embedding 模型時填入向量
      }));

      if (chunksToInsert.length > 0) {
        await this.repository.createChunks(chunksToInsert);
      }

      // 4. 更新文檔狀態為 ready
      const updatedDoc = await this.repository.updateDocument(docRecord.id, {
        status: 'ready',
        chunkCount: chunksToInsert.length,
        metadata: {
          ...((docRecord.metadata as Record<string, unknown>) || {}),
          parserMetadata: parseResult.metadata,
          totalChars: parseResult.fullText.length
        }
      });

      return {
        document: updatedDoc || docRecord,
        chunkCount: chunksToInsert.length
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ [KbService] 解析檔案失敗 [${originalName}]:`, error);

      await this.repository.updateDocument(docRecord.id, {
        status: 'failed',
        errorMessage: errMsg
      });

      throw new Error(`檔案解析失敗: ${errMsg}`);
    }
  }

  /**
   * 取得知識庫文檔清單 / Get Document List
   */
  async getDocuments(filter?: { search?: string; status?: string; fileType?: string }): Promise<KbDocumentRecord[]> {
    return await this.repository.findDocuments(filter);
  }

  /**
   * 取得單一文檔詳情 / Get Document Detail
   */
  async getDocumentById(id: string): Promise<KbDocumentRecord> {
    const doc = await this.repository.findDocumentById(id);
    if (!doc) {
      throw new Error('找不到指定的知識庫文檔 / Document not found');
    }
    return doc;
  }

  /**
   * 取得文檔所屬切片清單 / Get Chunks of Document
   */
  async getDocumentChunks(documentId: string): Promise<KbChunkRecord[]> {
    await this.getDocumentById(documentId); // 確保文檔存在
    return await this.repository.findChunksByDocumentId(documentId);
  }

  /**
   * 刪除文檔 (軟刪除) / Delete Document
   */
  async deleteDocument(id: string): Promise<boolean> {
    await this.getDocumentById(id);
    return await this.repository.softDeleteDocument(id);
  }

  /**
   * 搜尋知識庫切片 (語意/全文關鍵字檢索) / Search KB Chunks
   */
  async searchChunks(options: {
    query: string;
    documentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ chunks: (KbChunkRecord & { documentName?: string })[]; total: number }> {
    if (!options.query || !options.query.trim()) {
      return { chunks: [], total: 0 };
    }
    return await this.repository.searchChunks(options);
  }
}

export const kbService = new KbService();
