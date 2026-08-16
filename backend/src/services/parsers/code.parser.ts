/**
 * @file code.parser.ts
 * @description 程式碼文檔解析器 / Source Code Parser
 * @description_en Parses source code files (TS/JS/Py/Go/Java/SQL/JSON/YAML/etc.) with syntax-aware boundary chunking
 * @description_zh 解析各語言原始碼與設定檔，依據函式、類別與區塊邊界切分，保留行號與檔案上下文路徑
 */

import { BaseParser } from './base.parser';
import { DocumentParser, GeneratedChunk, ParsedDocumentResult } from './types';

// 支援的語言副檔名映射
const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript-react',
  js: 'javascript',
  jsx: 'javascript-react',
  py: 'python',
  java: 'java',
  go: 'go',
  rs: 'rust',
  c: 'c',
  cpp: 'cpp',
  h: 'c-header',
  hpp: 'cpp-header',
  cs: 'csharp',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  vue: 'vue',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  graphql: 'graphql',
  gql: 'graphql',
  env: 'dotenv',
  dockerfile: 'dockerfile',
  makefile: 'makefile'
};

export class CodeParser implements DocumentParser {
  public supports(extension: string, _mimeType?: string): boolean {
    const ext = extension.toLowerCase().replace(/^\./, '');
    return Boolean(LANGUAGE_MAP[ext]) || ext.includes('config') || ext === 'dockerfile' || ext === 'makefile';
  }

  public async parse(buffer: Buffer, originalName: string, _mimeType?: string): Promise<ParsedDocumentResult> {
    const content = buffer.toString('utf-8');
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    const ext = originalName.split('.').pop()?.toLowerCase() || 'txt';
    const language = LANGUAGE_MAP[ext] || ext;

    const chunks: GeneratedChunk[] = [];
    let currentChunkLines: string[] = [];
    let startLine = 1;
    let chunkIndex = 1;

    // 判斷是否為新的語法區塊開頭 (函式、類別、介面、裝飾器、SQL 宣告)
    const isBlockStart = (line: string): boolean => {
      const trimmed = line.trim();
      return (
        /^(export\s+)?(default\s+)?(class|interface|type|enum|struct|function|const|let|var|async\s+function)\s+/.test(trimmed) ||
        /^(def|async\s+def|func|fn|pub\s+fn|public|private|protected)\s+/.test(trimmed) ||
        /^(@[a-zA-Z0-9_]+)/.test(trimmed) ||
        /^(CREATE|ALTER|DROP|SELECT|INSERT|UPDATE|DELETE)\s+/i.test(trimmed)
      );
    };

    const flushChunk = (endLine: number) => {
      if (currentChunkLines.length === 0) return;
      const rawCode = currentChunkLines.join('\n').trim();
      if (!rawCode) return;

      const codeWithHeader = `// [檔案: ${originalName}] [語言: ${language}] [行號: L${startLine}-L${endLine}]\n${rawCode}`;

      chunks.push({
        chunkIndex: chunkIndex++,
        content: codeWithHeader,
        tokenCount: BaseParser.estimateTokenCount(codeWithHeader),
        metadata: {
          fileName: originalName,
          fileType: ext,
          language,
          startLine,
          endLine
        }
      });

      currentChunkLines = [];
    };

    const TARGET_CHUNK_LINES = 60; // 每個代碼塊約 40~70 行
    const MIN_CHUNK_LINES = 20;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 如果累積行數已達一定規模，且遇到了新的函式/類別/宣告開頭，進行切塊
      if (currentChunkLines.length >= MIN_CHUNK_LINES && isBlockStart(line)) {
        flushChunk(lineNum - 1);
        startLine = lineNum;
      }

      currentChunkLines.push(line);

      // 若單一區塊過長強制切分
      if (currentChunkLines.length >= TARGET_CHUNK_LINES) {
        flushChunk(lineNum);
        startLine = lineNum + 1;
      }
    }

    // 結算剩餘代碼
    flushChunk(lines.length);

    return {
      fullText: content,
      chunks,
      metadata: {
        totalLines: lines.length,
        language,
        originalName,
        format: 'source-code'
      }
    };
  }
}
