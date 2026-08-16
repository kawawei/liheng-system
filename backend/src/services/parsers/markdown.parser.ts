/**
 * @file markdown.parser.ts
 * @description Markdown 文檔解析器 / Markdown Document Parser
 * @description_en Parses markdown files (.md, .mdx), splits by heading hierarchy, preserves code blocks and section context
 * @description_zh 解析 Markdown 格式文檔，依標題層級與語意段落智能切分，保留章節階層上下文與代碼塊完整性
 */

import { BaseParser } from './base.parser';
import { DocumentParser, GeneratedChunk, ParsedDocumentResult } from './types';

export class MarkdownParser implements DocumentParser {
  public supports(extension: string, _mimeType?: string): boolean {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return ['md', 'mdx', 'markdown'].includes(ext);
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    const content = buffer.toString('utf-8');
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    const chunks: GeneratedChunk[] = [];
    let currentSection = 'Introduction';
    let currentLines: string[] = [];
    let startLine = 1;
    let chunkIndex = 1;

    const flushSection = (endLine: number) => {
      if (currentLines.length === 0) return;
      const sectionText = currentLines.join('\n').trim();
      if (!sectionText) return;

      // 若當前章節內容過長，使用 BaseParser 進一步按子段落切分
      if (sectionText.length > 800) {
        const subChunks = BaseParser.splitText(sectionText, {
          chunkSize: 700,
          chunkOverlap: 100,
          fileName: originalName,
          fileType: 'md',
          baseMetadata: {
            section: currentSection,
            startLine,
            endLine
          }
        });

        subChunks.forEach((sub) => {
          chunks.push({
            ...sub,
            chunkIndex: chunkIndex++
          });
        });
      } else {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: `[章節: ${currentSection}]\n${sectionText}`,
          tokenCount: BaseParser.estimateTokenCount(sectionText),
          metadata: {
            fileName: originalName,
            fileType: 'md',
            section: currentSection,
            startLine,
            endLine
          }
        });
      }

      currentLines = [];
    };

    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 追蹤程式碼塊開關
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      // 檢查是否為標題行 (且不在代碼塊內)
      const headerMatch = !inCodeBlock && line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // 先結算前一個章節
        flushSection(lineNum - 1);
        currentSection = headerMatch[2].trim();
        startLine = lineNum;
        currentLines.push(line);
      } else {
        currentLines.push(line);
      }
    }

    // 結算最後一段
    flushSection(lines.length);

    return {
      fullText: content,
      chunks,
      metadata: {
        totalLines: lines.length,
        originalName,
        format: 'markdown'
      }
    };
  }
}
