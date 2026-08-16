/**
 * @file word.parser.ts
 * @description Word 文檔解析器 / Word Document Parser
 * @description_en Parses Word (.docx) documents using mammoth, extracts text and structural paragraphs
 * @description_zh 解析 Word (.docx) 文件，提取純文字與段落標題並進行結構化切塊
 */

import mammoth from 'mammoth';
import { BaseParser } from './base.parser';
import { DocumentParser, GeneratedChunk, ParsedDocumentResult } from './types';

export class WordParser implements DocumentParser {
  public supports(extension: string, mimeType?: string): boolean {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return (
      ['docx', 'doc'].includes(ext) ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    );
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value || '';

    const chunks: GeneratedChunk[] = BaseParser.splitText(fullText, {
      chunkSize: 700,
      chunkOverlap: 120,
      fileName: originalName,
      fileType: 'docx',
      baseMetadata: {
        format: 'docx'
      }
    });

    return {
      fullText,
      chunks,
      metadata: {
        originalName,
        format: 'docx',
        warnings: result.messages || []
      }
    };
  }
}
