import React from 'react';
import { IssueRecord, IssueStatus } from '../../types';
import { IssueSeverityBadge } from './IssueSeverityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';

/**
 * @file IssueKanban.tsx
 * @description 問題工單看板視圖組件 / Issue Kanban Board View
 * @description_en Renders a 4-column lifecycle Kanban board for software issues
 * @description_zh 提供待處理、處理中、已修復、已結案之 4 欄式工單看板視圖
 */

interface IssueKanbanProps {
  issues: IssueRecord[];
  onSelectIssue: (issue: IssueRecord) => void;
  loading: boolean;
}

const COLUMNS: { status: IssueStatus; label: string; headerColor: string; bgColor: string }[] = [
  { status: 'PENDING', label: '待處理', headerColor: '#ef4444', bgColor: '#fef2f2' },
  { status: 'IN_PROGRESS', label: '處理中', headerColor: '#f59e0b', bgColor: '#fffbeb' },
  { status: 'RESOLVED', label: '已修復', headerColor: '#10b981', bgColor: '#ecfdf5' },
  { status: 'CLOSED', label: '已結案', headerColor: '#6b7280', bgColor: '#f3f4f6' }
];

export const IssueKanban: React.FC<IssueKanbanProps> = ({ issues, onSelectIssue, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        看板載入中...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        alignItems: 'flex-start',
        overflowX: 'auto'
      }}
    >
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status);

        return (
          <div
            key={col.status}
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* 欄位標題 / Column Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: col.bgColor
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: col.headerColor
                  }}
                />
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {col.label}
                </span>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                {colIssues.length}
              </span>
            </div>

            {/* 卡片列表 / Cards List */}
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {colIssues.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  暫無此狀態工單
                </div>
              ) : (
                colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => onSelectIssue(issue)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      padding: '12px',
                      border: '1px solid var(--border-color)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-700)' }}>
                        {issue.issueNo}
                      </span>
                      <IssueSeverityBadge severity={issue.severity} />
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                      {issue.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <IssueCategoryBadge category={issue.category} />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {issue.createdByName}
                      </span>
                    </div>

                    {issue.status === 'RESOLVED' && issue.fixedInVersion && (
                      <div style={{ fontSize: '11px', backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        修復版號: {issue.fixedInVersion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
