/**
 * @file spreadsheet.parser.ts
 * @description 試算表解析器 / Spreadsheet Parser (XLSX, XLS, CSV)
 * @description_en Parses Excel and CSV files, extracts sheets, and converts rows to structured Markdown table chunks
 * @description_zh 解析 Excel 試算表與 CSV 數據，轉換工作表內容為結構化 Markdown 表格並依數據行切塊
 */

import * as XLSX from 'xlsx';
import { BaseParser } from './base.parser';
import { DocumentParser, GeneratedChunk, ParsedDocumentResult } from './types';

export class SpreadsheetParser implements DocumentParser {
  public supports(extension: string, mimeType?: string): boolean {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return (
      ['xlsx', 'xls', 'csv'].includes(ext) ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'text/csv'
    );
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const chunks: GeneratedChunk[] = [];
    const allTexts: string[] = [];
    let chunkIndex = 1;

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (jsonData.length === 0) continue;

      // 取得所有表頭欄位
      const headers = Object.keys(jsonData[0]);
      if (headers.length === 0) continue;

      // 產生 Markdown 表頭
      const headerRow = `| ${headers.join(' | ')} |`;
      const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;

      // 依批次 (例如每 25 列) 分割為一個 Chunk
      const BATCH_SIZE = 25;
      for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
        const slice = jsonData.slice(i, i + BATCH_SIZE);
        const dataRows = slice.map((row) => {
          return `| ${headers.map((h) => String(row[h] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`;
        });

        const chunkText = [
          `[檔案: ${originalName}] [工作表: ${sheetName}] (第 ${i + 1} - ${i + slice.length} 筆資料)`,
          headerRow,
          dividerRow,
          ...dataRows
        ].join('\n');

        allTexts.push(chunkText);

        chunks.push({
          chunkIndex: chunkIndex++,
          content: chunkText,
          tokenCount: BaseParser.estimateTokenCount(chunkText),
          metadata: {
            fileName: originalName,
            fileType: originalName.split('.').pop() || 'xlsx',
            sheetName,
            startRow: i + 1,
            endRow: i + slice.length,
            totalRows: jsonData.length
          }
        });
      }
    }

    const fullText = allTexts.join('\n\n');

    return {
      fullText,
      chunks,
      metadata: {
        originalName,
        sheetNames: workbook.SheetNames,
        format: 'spreadsheet'
      }
    };
  }
}
