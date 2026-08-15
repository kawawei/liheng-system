import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUrlTabs } from '../../hooks/useUrlTabs';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';

/**
 * @file ProjectDetailPage.tsx
 * @description 專案工作台詳情頁 / Project Workspace Detail Page
 * @description_en 5-Tab workspace (Milestones, Logs, QA, LINE Sync, Finance) with useUrlTabs persistence
 * @description_zh 專案核心工作台，提供 5 大 Tab 頁籤並採用 useUrlTabs 保持 URL Query 狀態 (F5 不重置)
 */

type ProjectTab = 'milestones' | 'logs' | 'qa' | 'line_sync' | 'finance';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentTab, setTab] = useUrlTabs<ProjectTab>('milestones');

  // LINE 雙向即時訊息模擬狀態
  const [lineMessages, setLineMessages] = useState<Array<{ sender: string; text: string; time: string; isBot?: boolean }>>([
    { sender: '台元半導體 - 陳協理', text: '請問後台匯出 Excel 報表的功能目前進度如何？', time: '14:20' },
    { sender: '系統 (LINE Bot)', text: '工程師已接獲需求，目前正在進行測試驗收。', time: '14:21', isBot: true }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setLineMessages((prev) => [
      ...prev,
      {
        sender: '利恒後台 (工程師)',
        text: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputMsg('');
  };

  const tabsConfig: Array<{ key: ProjectTab; label: string; icon: 'layers' | 'calendar' | 'warning' | 'message' | 'finance' }> = [
    { key: 'milestones', label: '里程碑進度', icon: 'layers' },
    { key: 'logs', label: '工程進度日誌', icon: 'calendar' },
    { key: 'qa', label: 'QA 缺陷監控', icon: 'warning' },
    { key: 'line_sync', label: 'LINE 雙向動態與 AI', icon: 'message' },
    { key: 'finance', label: '專案收支與損益', icon: 'finance' }
  ];

  return (
    <div>
      {/* 麵包屑導航 / Breadcrumbs */}
      <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <Link to="/projects" style={{ color: 'var(--primary-600)' }}>專案管理</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span>{id || 'PJ-20260814-0001'} (利恒智慧工廠物聯網平台)</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="projects" size="lg" />
            <span>利恒智慧工廠物聯網平台</span>
          </h1>
          <p className="page-subtitle">案號：PJ-20260814-0001 ｜ 客戶：台元半導體股份有限公司</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <StatusBadge label="開發階段" variant="info" icon="layers" />
          <StatusBadge label="進度正常 65%" variant="success" icon="success" />
        </div>
      </div>

      {/* 5 大 Tab 頁籤標籤列 (支援 URL Query 保持) */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
          gap: '8px'
        }}
      >
        {tabsConfig.map((t) => {
          const isActive = currentTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                backgroundColor: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
            >
              <TextIcon name={t.icon} size="sm" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 內容切換區域 */}
      <div className="card">
        {currentTab === 'milestones' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">專案 4 大研發里程碑</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>M1: 系統架構與資料庫設計 (SDD)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>完成 12 張資料表與 Drizzle ORM 設定</div>
                </div>
                <StatusBadge label="已完成 (100%)" variant="success" icon="success" />
              </div>
              <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>M2: 前後端核心模組開發</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CRM、WBS 看板與 8h JWT 認證</div>
                </div>
                <StatusBadge label="進行中 (70%)" variant="info" icon="clock" />
              </div>
            </div>
          </div>
        )}

        {currentTab === 'logs' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">工程師每日進度回報日誌</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>2026-08-14 (張工程師)</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>17:30</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  完成了前端 Docker 容器化配置與健康檢查探針實作，確保 Vite 開發伺服器與 Nginx 產物符合 healthcheck 規範。
                </p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'qa' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">QA Bug 缺陷監控</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              目前未發現重大阻礙 (Critical Issues)。所有測試用例通過。
            </p>
          </div>
        )}

        {currentTab === 'line_sync' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">LINE 專案群組即時對話與雙向推播</h2>
            </div>
            <div
              style={{
                height: '240px',
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              {lineMessages.map((m, idx) => (
                <div key={idx} style={{ padding: '10px 14px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: m.isBot ? 'var(--primary-600)' : 'var(--text-primary)' }}>{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <div style={{ fontSize: '14px' }}>{m.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendLine} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="輸入要推播至客戶 LINE 群組的訊息..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <TextIcon name="send" size="sm" />
                <span>發送至 LINE 群</span>
              </button>
            </form>
          </div>
        )}

        {currentTab === 'finance' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">專案財務毛利與多階段核銷</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>合約含稅總額</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  NT$ 1,050,000
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已入帳總額</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success-text)', marginTop: '4px' }}>
                  NT$ 315,000 (30%)
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>預估專案毛利率</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-700)', marginTop: '4px' }}>
                  62.5%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
