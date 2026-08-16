/**
 * @file plaintext.parser.ts
 * @description 純文字解析器 / Plain Text Parser
 * @description_en Parses plain text files (.txt, .log, .ini, .conf, etc.) with sliding window chunking
 * @description_zh 解析任意純文字、設定與日誌檔案，採用滑動視窗切塊演算法
 */

import { BaseParser } from './base.parser';
import { DocumentParser, ParsedDocumentResult } from './types';

export class PlainTextParser implements DocumentParser {
  public supports(_extension: string, _mimeType?: string): boolean {
    return true; // 預設支援所有文字檔案作為兜底
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    const fullText = buffer.toString('utf-8');
    const ext = originalName.split('.').pop() || 'txt';

    const chunks = BaseParser.splitText(fullText, {
      chunkSize: 600,
      chunkOverlap: 120,
      fileName: originalName,
      fileType: ext,
      baseMetadata: {
        format: 'plaintext'
      }
    });

    return {
      fullText,
      chunks,
      metadata: {
        originalName,
        format: 'plaintext'
      }
    };
  }
}
