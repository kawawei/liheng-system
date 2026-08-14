import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';

/**
 * @file SearchPage.tsx
 * @description 全局向量語意檢索與 AI 問答頁面 / Semantic Search & RAG AI Page
 * @description_en pgvector 1536-dim semantic search and natural language project QA
 * @description_zh 提供基於 pgvector 向量索引之自然語言語意檢索與 RAG 專案狀態問答
 */

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasSearched(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="search" size="lg" />
            <span>全局向量語意檢索 (pgvector)</span>
          </h1>
          <p className="page-subtitle">透過 1536 維度 Embedding 進行跨模組自然語言搜尋與專案 RAG 問答</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '15px', padding: '12px 16px' }}
            placeholder="請輸入自然語言查詢 (例如：上次半導體客戶簽約的合約金額是多少？)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', flexShrink: 0 }}>
            <TextIcon name="search" size="md" />
            <span>語意檢索</span>
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">檢索結果 (相似度 Top 關聯項目)</h2>
            <StatusBadge label="餘弦相似度 > 0.89" variant="success" icon="success" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                  [合約] CT-20260814-0001: 智慧工廠物聯網平台開發契約
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>相似度 0.94</span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                客戶：台元半導體股份有限公司 ｜ 含稅總金額：NT$ 1,050,000 ｜ 狀態：已簽署生效
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
