/**
 * @file pdf.parser.ts
 * @description PDF 文件解析器 / PDF Document Parser
 * @description_en Parses PDF documents using PDFParse, extracts text content and splits by pages or sliding windows
 * @description_zh 解析 PDF 文件，提取純文字內容並依據頁碼與段落進行語意切塊
 */

import { PDFParse } from 'pdf-parse';
import { BaseParser } from './base.parser';
import { DocumentParser, GeneratedChunk, ParsedDocumentResult } from './types';

export class PdfParser implements DocumentParser {
  public supports(extension: string, mimeType?: string): boolean {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return ext === 'pdf' || mimeType === 'application/pdf';
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    let fullText = '';
    let totalPages = 1;
    let info: Record<string, unknown> = {};

    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      fullText = textResult?.text || '';
      totalPages = textResult?.total || 1;
      try {
        info = (await parser.getInfo()) as unknown as Record<string, unknown>;
      } catch {
        // 忽略 info 解析異常
      }
      await parser.destroy();
    } catch (err) {
      console.warn(`[PdfParser] PDFParse 提取異常，降級字串解析:`, err);
      fullText = buffer.toString('utf-8');
    }

    // 將 PDF 文字進行切分
    const chunks: GeneratedChunk[] = BaseParser.splitText(fullText, {
      chunkSize: 700,
      chunkOverlap: 120,
      fileName: originalName,
      fileType: 'pdf',
      baseMetadata: {
        totalPdfPages: totalPages
      }
    });

    return {
      fullText,
      chunks,
      metadata: {
        totalPages,
        originalName,
        format: 'pdf',
        info
      }
    };
  }
}
