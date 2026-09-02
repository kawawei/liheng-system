import React from 'react';
import { NavLink } from 'react-router-dom';
import { TextIcon, IconName } from '../icon/TextIcon';
import { UserRole } from '../../types';

/**
 * @file Sidebar.tsx
 * @description 亮色主題側邊導航欄組件 / Light Theme Sidebar Navigation Component
 * @description_en Renders light-themed navigation links with full-width active status and toggleable collapse mode
 * @description_zh 渲染亮色主題側邊導航欄，支援選中效果佔滿寬度、RBAC 角色過濾與展開/折疊切換
 */

interface SidebarProps {
  role?: UserRole;
  isCollapsed?: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '儀表板', icon: 'dashboard', roles: ['super_admin', 'engineer'] },
  { to: '/clients', label: '客戶管理 (CRM)', icon: 'users', roles: ['super_admin', 'engineer'] },
  { to: '/projects', label: '專案管理 (WBS)', icon: 'projects', roles: ['super_admin', 'engineer'] },
  { to: '/issues', label: '問題追蹤 (Issues)', icon: 'bug', roles: ['super_admin', 'engineer', 'client'] },
  { to: '/finance', label: '財務收支', icon: 'finance', roles: ['super_admin'] },
  { to: '/search', label: '知識庫', icon: 'knowledge', roles: ['super_admin', 'engineer'] },
  { to: '/accounts', label: '帳號管理', icon: 'user-cog', roles: ['super_admin'] }
];

export const Sidebar: React.FC<SidebarProps> = ({ role = 'super_admin', isCollapsed = false }) => {
  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      style={{
        width: isCollapsed ? '64px' : '240px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* 導航選單 / Navigation Menu */}
      <nav style={{ padding: '16px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={isCollapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: isCollapsed ? '12px 0' : '12px 20px',
              width: '100%',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--primary-600)' : '4px solid transparent',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box'
            })}
          >
            <TextIcon name={item.icon} size="md" />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 系統狀態 / System Health Indicator */}
      <div
        style={{
          padding: isCollapsed ? '16px 0' : '16px 20px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '8px',
          color: 'var(--text-secondary)'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block',
            flexShrink: 0
          }}
        />
        {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>系統連線正常 (Healthy)</span>}
      </div>
    </aside>
  );
};

