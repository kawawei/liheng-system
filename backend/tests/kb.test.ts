/**
 * @file kb.test.ts
 * @description 知識庫解析器與切分功能單元測試 / Knowledge Base Parser Unit Tests
 * @description_en Comprehensive unit tests for markdown, source code, spreadsheet, plaintext parsers and factory
 * @description_zh 全面測試知識庫之 Markdown、多語言程式代碼、試算表、純文字解析器與分塊切片策略
 */

import { DocumentParserFactory, MarkdownParser, CodeParser, SpreadsheetParser, PlainTextParser } from '../src/services/parsers';

// 測試用斷言工具
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ 斷言失敗: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 ========================================');
  console.log('🧪 開始執行知識庫 (KB) 解析與切分模組測試');
  console.log('🧪 ========================================\n');

  let passed = 0;
  let total = 0;

  async function testCase(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ [FAIL] ${name}:`, error);
    }
  }

  // 1. Markdown 解析器測試
  await testCase('MarkdownParser - 標題層級切分與程式碼塊保護', async () => {
    const parser = new MarkdownParser();
    const mdContent = `
# 系統架構文檔

這是系統介紹引言。

## 1. 認證機制
用戶透過 JWT 進行認證，Token 有效期為 8 小時。

\`\`\`typescript
const token = jwt.sign({ id: user.id }, SECRET);
console.log('Token created');
\`\`\`

## 2. 資料庫設計
系統使用 PostgreSQL 與 Drizzle ORM。
    `.trim();

    const result = await parser.parse(Buffer.from(mdContent, 'utf-8'), 'architecture.md');

    assert(result.chunks.length >= 2, `切片數量應大於等於 2，實際為: ${result.chunks.length}`);
    assert(result.chunks[0].metadata.fileName === 'architecture.md', '檔名 metadata 正確');
    assert(result.chunks.some((c) => c.content.includes('JWT') && c.content.includes('Token created')), '程式碼塊應完整保留於認證章節切片中');
    assert(result.chunks.some((c) => c.metadata.section?.includes('2. 資料庫設計')), '應成功識別第 2 章節');
  });

  // 2. TypeScript / JavaScript 代碼解析測試
  await testCase('CodeParser - TypeScript 代碼語義邊界與行號保留', async () => {
    const parser = new CodeParser();
    const tsCode = `
import express from 'express';

// 使用者服務介面
export interface IUserService {
  getUser(id: string): Promise<User>;
}

export class UserService implements IUserService {
  private repo: UserRepository;

  constructor(repo: UserRepository) {
    this.repo = repo;
  }

  async getUser(id: string): Promise<User> {
    return await this.repo.findById(id);
  }
}
    `.trim();

    const result = await parser.parse(Buffer.from(tsCode, 'utf-8'), 'user.service.ts');

    assert(result.chunks.length >= 1, `應產生切片，實際為: ${result.chunks.length}`);
    const chunk = result.chunks[0];
    assert(chunk.metadata.language === 'typescript', `語言應為 typescript，實際為: ${chunk.metadata.language}`);
    assert(chunk.content.includes('// [檔案: user.service.ts]'), '切片開頭應包含檔案上下文標記');
    assert(typeof chunk.metadata.startLine === 'number' && typeof chunk.metadata.endLine === 'number', '應記錄起始與結束行號');
  });

  // 3. Python 代碼解析測試
  await testCase('CodeParser - Python 代碼解析與語法識別', async () => {
    const parser = new CodeParser();
    const pyCode = `
import os
import sys

def calculate_embeddings(text: str) -> list[float]:
    """計算文本向量"""
    print(f"Processing text: {text[:20]}")
    return [0.1, 0.2, 0.3]

class ModelManager:
    def __init__(self, model_name: str):
        self.model_name = model_name
    `.trim();

    const result = await parser.parse(Buffer.from(pyCode, 'utf-8'), 'embed.py');

    assert(result.chunks.length >= 1, '應產生切片');
    assert(result.chunks[0].metadata.language === 'python', '語言應為 python');
    assert(result.chunks[0].content.includes('calculate_embeddings'), '應包含函式定義');
  });

  // 4. SQL 語句解析測試
  await testCase('CodeParser - SQL 檔案解析', async () => {
    const parser = new CodeParser();
    const sqlCode = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) NOT NULL
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_amount NUMERIC(10, 2)
);
    `.trim();

    const result = await parser.parse(Buffer.from(sqlCode, 'utf-8'), 'migration.sql');

    assert(result.chunks.length >= 1, '應產生切片');
    assert(result.chunks[0].metadata.language === 'sql', '語言應為 sql');
  });

  // 5. 試算表 / CSV 解析測試
  await testCase('SpreadsheetParser - CSV 數據轉結構化 Markdown 表格', async () => {
    const parser = new SpreadsheetParser();
    const csvContent = `id,name,role,department
1,Alice,Engineer,IT
2,Bob,Manager,Sales
3,Charlie,Designer,Product`;

    const result = await parser.parse(Buffer.from(csvContent, 'utf-8'), 'employees.csv', 'text/csv');

    assert(result.chunks.length >= 1, '應產生切片');
    assert(result.chunks[0].content.includes('| id | name | role | department |'), '應包含 Markdown 表頭');
    assert(result.chunks[0].content.includes('| 1 | Alice | Engineer | IT |'), '應包含表格數據列');
    assert(result.chunks[0].metadata.fileType === 'csv', '檔案類型應為 csv');
  });

  // 6. PlainText 解析測試
  await testCase('PlainTextParser - 純文字設定檔解析', async () => {
    const parser = new PlainTextParser();
    const textContent = `
PORT=3001
NODE_ENV=production
DB_HOST=postgres.internal
    `.trim();

    const result = await parser.parse(Buffer.from(textContent, 'utf-8'), 'app.env');

    assert(result.chunks.length >= 1, '應產生切片');
    assert(result.chunks[0].content.includes('DB_HOST=postgres.internal'), '應包含文字內文');
  });

  // 7. DocumentParserFactory 全域解析工廠分發測試
  await testCase('DocumentParserFactory - 多副檔名智能分發', async () => {
    const tsRes = await DocumentParserFactory.parseDocument(Buffer.from('const x = 1;', 'utf-8'), 'test.ts');
    assert(tsRes.chunks[0].metadata.language === 'typescript', 'test.ts 應由 CodeParser 處理');

    const mdRes = await DocumentParserFactory.parseDocument(Buffer.from('# Title\nContent', 'utf-8'), 'readme.md');
    assert(mdRes.chunks[0].metadata.section === 'Title', 'readme.md 應由 MarkdownParser 處理');

    const csvRes = await DocumentParserFactory.parseDocument(Buffer.from('a,b\n1,2', 'utf-8'), 'data.csv');
    assert(csvRes.chunks[0].content.includes('| a | b |'), 'data.csv 應由 SpreadsheetParser 處理');
  });

  console.log('\n========================================');
  console.log(`📊 測試結果: 通過 ${passed} / ${total} 項測試 (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('測試執行發生嚴重錯誤:', err);
  process.exit(1);
});
