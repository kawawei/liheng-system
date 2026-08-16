/**
 * @file base.parser.ts
 * @description 基礎解析器與切分工具 / Base Parser & Chunking Utilities
 * @description_en Base parser utilities including token estimation, sliding window chunking, and text sanitization
 * @description_zh 提供基礎解析工具，包含 Token 數量估算、通用滑動視窗切塊演算法與文本正規化清理
 */

import { ChunkMetadata, GeneratedChunk } from './types';

export class BaseParser {
  /**
   * 估算文字 Token 數目 / Estimate Token Count
   * 繁簡中文約 1 字 = 1.3 ~ 1.5 tokens，英文字串約 4 字元 = 1 token
   */
  public static estimateTokenCount(text: string): number {
    if (!text) return 0;
    const chineseMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g);
    const chineseCount = chineseMatches ? chineseMatches.length : 0;
    const otherText = text.replace(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g, '');
    const words = otherText.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(chineseCount * 1.5 + words * 1.3);
  }

  /**
   * 滑動視窗切塊演算法 / Sliding Window Text Splitter
   */
  public static splitText(
    text: string,
    options: {
      chunkSize?: number;
      chunkOverlap?: number;
      separators?: string[];
      fileName: string;
      fileType: string;
      baseMetadata?: Partial<ChunkMetadata>;
    }
  ): GeneratedChunk[] {
    const {
      chunkSize = 600,
      chunkOverlap = 120,
      separators = ['\n\n', '\n', '。', '.', '；', ';', ' ', ''],
      fileName,
      fileType,
      baseMetadata = {}
    } = options;

    const sanitized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const chunks: GeneratedChunk[] = [];
    
    // 依分隔符號遞迴切分或按長度切分
    const rawSegments = this.recursiveSplit(sanitized, chunkSize, chunkOverlap, separators);

    rawSegments.forEach((segment, index) => {
      const trimmed = segment.trim();
      if (!trimmed) return;

      chunks.push({
        chunkIndex: index + 1,
        content: trimmed,
        tokenCount: this.estimateTokenCount(trimmed),
        metadata: {
          fileName,
          fileType,
          ...baseMetadata
        }
      });
    });

    return chunks;
  }

  /**
   * 遞迴式文字切分演算法 / Recursive Character Text Splitter
   */
  private static recursiveSplit(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    separators: string[]
  ): string[] {
    if (text.length <= chunkSize) {
      return [text];
    }

    const currentSep = separators.find((sep) => text.includes(sep)) ?? '';
    const nextSeparators = separators.filter((sep) => sep !== currentSep);

    let parts: string[];
    if (currentSep === '') {
      parts = text.split('');
    } else {
      parts = text.split(currentSep);
    }

    const result: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const piece = currentChunk ? (currentSep ? currentChunk + currentSep + part : currentChunk + part) : part;

      if (piece.length <= chunkSize) {
        currentChunk = piece;
      } else {
        if (currentChunk) {
          result.push(currentChunk);
          // 保留重疊部分 (Overlap)
          const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
          currentChunk = currentChunk.slice(overlapStart) + (currentSep ? currentSep + part : part);
        } else {
          // 單個 part 就超過 chunkSize，交給下一級分隔符進一步切分
          if (nextSeparators.length > 0) {
            const subChunks = this.recursiveSplit(part, chunkSize, chunkOverlap, nextSeparators);
            result.push(...subChunks);
          } else {
            // 無法再細分，直接硬切
            for (let j = 0; j < part.length; j += chunkSize - chunkOverlap) {
              result.push(part.slice(j, j + chunkSize));
            }
          }
          currentChunk = '';
        }
      }
    }

    if (currentChunk.trim()) {
      result.push(currentChunk);
    }

    return result;
  }
}
