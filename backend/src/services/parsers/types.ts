/**
 * @file types.ts
 * @description 知識庫解析器資料型別定義 / KB Parser Types
 * @description_en Type definitions for document parsing and chunking operations
 * @description_zh 定義文檔解析、分塊切片與中繼資料結構
 */

export interface ChunkMetadata {
  fileName: string;
  fileType: string;
  section?: string;
  startLine?: number;
  endLine?: number;
  pageNumber?: number;
  sheetName?: string;
  language?: string;
  [key: string]: unknown;
}

export interface GeneratedChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: ChunkMetadata;
}

export interface ParsedDocumentResult {
  fullText: string;
  chunks: GeneratedChunk[];
  metadata: Record<string, unknown>;
}

export interface DocumentParser {
  supports(extension: string, mimeType?: string): boolean;
  parse(buffer: Buffer, originalName: string, mimeType?: string): Promise<ParsedDocumentResult>;
}
