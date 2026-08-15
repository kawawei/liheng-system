import React from 'react';
import { TextIcon } from '../icon/TextIcon';
import { Button } from '../button';
import { UserProfile } from '../../types';

/**
 * @file Header.tsx
 * @description 頂部全域導航列 / Top Header Navigation
 * @description_en Displays global brand title, sidebar hamburger toggle, user name, and enlarged logout button
 * @description_zh 顯示系統品牌標頭、漢堡選單按鈕、使用者姓名與加大款登出按鈕
 */

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  isSidebarCollapsed,
  onToggleSidebar
}) => {
  return (
    <header
      style={{
        height: '60px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        paddingRight: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10
      }}
    >
      {/* 左側對齊區：漢堡選單切換按鈕與品牌標頭 / Left Alignment Block: Hamburger & Brand */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* 與下方側邊欄圖示精確對齊之容器 / Alignment Container matching Sidebar Width */}
        <div
          style={{
            width: isSidebarCollapsed ? '64px' : '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            paddingLeft: isSidebarCollapsed ? 0 : '20px',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
            boxSizing: 'border-box'
          }}
        >
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? '展開側邊欄' : '折疊側邊欄'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <TextIcon name="menu" size="md" />
          </button>
        </div>

        {/* 品牌標識與標題 / Brand Logo & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--primary-600)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            LH
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>
              利恒軟體管理系統
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              利恒軟體開發內部專案管理平台
            </div>
          </div>
        </div>
      </div>

      {/* 右側使用者姓名與加大款登出按鈕 / Right User Name & Enlarged Logout Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user && (
          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user.name}
          </span>
        )}

        <Button
          variant="danger"
          size="md"
          onClick={onLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          <TextIcon name="logout" size="md" />
          <span>登出</span>
        </Button>
      </div>
    </header>
  );
};

