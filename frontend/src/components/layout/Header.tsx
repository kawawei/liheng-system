import React from 'react';
import { TextIcon } from '../icon/TextIcon';
import { StatusBadge } from '../status-badge/StatusBadge';
import { UserProfile } from '../../types';

/**
 * @file Header.tsx
 * @description 頂部全域導航列 / Top Header Navigation
 * @description_en Displays user role status, current time, and logout controls
 * @description_zh 顯示當前登入者資訊、角色標籤與登出操作按鈕
 */

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}
    >
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        立衡軟體開發內部專案管理平台
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            <StatusBadge
              label={user.role === 'super_admin' ? '超級管理員' : '軟體工程師'}
              variant={user.role === 'super_admin' ? 'info' : 'neutral'}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <TextIcon name="logout" size="sm" />
          <span>登出</span>
        </button>
      </div>
    </header>
  );
};
