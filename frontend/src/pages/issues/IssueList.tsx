import React from 'react';
import { IssueRecord } from '../../types';
import { IssueStatusBadge } from './IssueStatusBadge';
import { IssueSeverityBadge } from './IssueSeverityBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';

/**
 * @file IssueList.tsx
 * @description 問題工單清單視圖 / Issue List Table View Component
 * @description_en Renders a detailed table view for software issues with click-to-view interaction
 * @description_zh 渲染工單清單表格視圖，支援狀態、嚴重度、分類與修復狀態展示
 */

interface IssueListProps {
  issues: IssueRecord[];
  onSelectIssue: (issue: IssueRecord) => void;
  loading: boolean;
}

export const IssueList: React.FC<IssueListProps> = ({ issues, onSelectIssue, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        工單列表載入中...
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div
        style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}
      >
        <p style={{ margin: 0, fontSize: '15px' }}>目前無相符的問題工單紀錄</p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
            <th style={{ padding: '12px 16px', width: '150px' }}>工單編號</th>
            <th style={{ padding: '12px 16px' }}>問題主旨</th>
            <th style={{ padding: '12px 16px', width: '120px' }}>分類</th>
            <th style={{ padding: '12px 16px', width: '110px' }}>嚴重度</th>
            <th style={{ padding: '12px 16px', width: '110px' }}>處理狀態</th>
            <th style={{ padding: '12px 16px', width: '120px' }}>修復版本</th>
            <th style={{ padding: '12px 16px', width: '100px' }}>回報人</th>
            <th style={{ padding: '12px 16px', width: '150px' }}>提出時間</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              style={{
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-700)' }}>
                {issue.issueNo}
              </td>
              <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {issue.title}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <IssueCategoryBadge category={issue.category} />
              </td>
              <td style={{ padding: '14px 16px' }}>
                <IssueSeverityBadge severity={issue.severity} />
              </td>
              <td style={{ padding: '14px 16px' }}>
                <IssueStatusBadge status={issue.status} />
              </td>
              <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {issue.fixedInVersion ? (
                  <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {issue.fixedInVersion}
                  </span>
                ) : (
                  '-'
                )}
              </td>
              <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {issue.createdByName}
              </td>
              <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {new Date(issue.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
