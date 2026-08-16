/**
 * @file parser.factory.ts
 * @description 文檔解析器工廠 / Document Parser Factory
 * @description_en Factory that selects appropriate parser based on file extension and MIME type
 * @description_zh 根據檔案副檔名與 MIME 類型分發合適解析器的解析工廠
 */

import { CodeParser } from './code.parser';
import { MarkdownParser } from './markdown.parser';
import { PdfParser } from './pdf.parser';
import { PlainTextParser } from './plaintext.parser';
import { SpreadsheetParser } from './spreadsheet.parser';
import { DocumentParser, ParsedDocumentResult } from './types';
import { WordParser } from './word.parser';

export class DocumentParserFactory {
  private static parsers: DocumentParser[] = [
    new MarkdownParser(),
    new CodeParser(),
    new PdfParser(),
    new WordParser(),
    new SpreadsheetParser(),
    new PlainTextParser() // 兜底放在最後
  ];

  /**
   * 根據檔案名稱與 MIME 類型解析檔案 / Parse Document
   */
  public static async parseDocument(
    buffer: Buffer,
    originalName: string,
    mimeType?: string
  ): Promise<ParsedDocumentResult> {
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    // 依序找到第一個支援該格式的解析器
    const parser = this.parsers.find((p) => p.supports(ext, mimeType)) || new PlainTextParser();

    try {
      return await parser.parse(buffer, originalName, mimeType);
    } catch (error) {
      console.warn(`[ParserFactory] 解析器執行異常，降級使用純文字解析:`, error);
      const fallbackParser = new PlainTextParser();
      return await fallbackParser.parse(buffer, originalName, mimeType);
    }
  }
}

export * from './types';
export * from './base.parser';
export * from './markdown.parser';
export * from './code.parser';
export * from './pdf.parser';
export * from './word.parser';
export * from './spreadsheet.parser';
export * from './plaintext.parser';
