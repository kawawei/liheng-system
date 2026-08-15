/**
 * @file AccountTable.tsx
 * @description 帳號列表表格組件 / Account List Table Component
 * @description_en Renders user accounts with edit and delete operations, preventing self-modification for logged-in super admin
 * @description_zh 負責渲染系統帳號數據列表，支援編輯與刪除操作，並自動防呆避免管理員編輯或刪除自身帳號
 */

import React from 'react';
import { UserAccount } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import './AccountTable.css';

interface AccountTableProps {
  accounts: UserAccount[];
  currentUserAccount?: string;
  onEditAccount: (account: UserAccount) => void;
  onDeleteAccount: (accountId: string, accountName: string) => void;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  currentUserAccount,
  onEditAccount,
  onDeleteAccount
}) => {
  // ========================================
  // 角色標籤資訊轉換 / Role Badge Mapper
  // ========================================
  const getRoleInfo = (role: UserAccount['role']) => {
    switch (role) {
      case 'super_admin':
        return { label: '超級管理員', variant: 'info' as const };
      case 'engineer':
      default:
        return { label: '軟體工程師', variant: 'neutral' as const };
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="table-container empty-state-container">
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
          <TextIcon name="users" size="lg" style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p>尚無帳號資料，請點擊上方按鈕新增帳號</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '20%' }}>姓名</th>
            <th style={{ width: '20%' }}>帳號</th>
            <th style={{ width: '18%' }}>系統角色</th>
            <th style={{ width: '14%' }}>狀態</th>
            <th style={{ width: '12%' }}>建立日期</th>
            <th style={{ width: '16%', textAlign: 'center' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => {
            const roleInfo = getRoleInfo(acc.role);
            // 判斷是否為當前登入者自己 (超級管理員不可編輯或刪除自己)
            const isSelf =
              Boolean(currentUserAccount) &&
              (acc.account.toLowerCase() === currentUserAccount?.toLowerCase() ||
                (acc.role === 'super_admin' && currentUserAccount === 'admin'));

            return (
              <tr key={acc.id}>
                {/* 姓名 */}
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {acc.name}
                  </span>
                </td>

                {/* 帳號 */}
                <td>
                  <code
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace'
                    }}
                  >
                    {acc.account}
                  </code>
                </td>

                {/* 角色 */}
                <td>
                  <StatusBadge label={roleInfo.label} variant={roleInfo.variant} />
                </td>

                {/* 狀態 */}
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#10b981',
                      fontWeight: 500
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981'
                      }}
                    />
                    正常啟用
                  </span>
                </td>

                {/* 建立日期 */}
                <td>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {acc.createdAt || '-'}
                  </span>
                </td>

                {/* 操作 */}
                <td style={{ textAlign: 'center' }}>
                  <div className="action-buttons-group">
                    {/* 編輯按鈕 (所有人包含自己皆可編輯) */}
                    <button
                      type="button"
                      className="action-icon-btn edit"
                      onClick={() => onEditAccount(acc)}
                      title={isSelf ? '編輯個人帳號' : `編輯 ${acc.name}`}
                      aria-label="編輯帳號"
                    >
                      <TextIcon name="edit" size="md" />
                    </button>

                    {/* 刪除按鈕 (不可刪除自己，補上隱藏佔位以確保對齊) */}
                    {!isSelf ? (
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        onClick={() => onDeleteAccount(acc.id, acc.name)}
                        title={`刪除 ${acc.name}`}
                        aria-label="刪除帳號"
                      >
                        <TextIcon name="trash" size="md" />
                      </button>
                    ) : (
                      <div className="action-icon-placeholder" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
