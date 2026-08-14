import React from 'react';
import { NavLink } from 'react-router-dom';
import { TextIcon, IconName } from '../icon/TextIcon';
import { UserRole } from '../../types';

/**
 * @file Sidebar.tsx
 * @description 側邊導航欄組件 / Sidebar Navigation Component
 * @description_en Renders navigation links with RBAC role-based filtering (hides finance for engineers)
 * @description_zh 渲染系統側邊導航欄，支援 RBAC 雙角色過濾 (工程師自動隱藏財務收支模組)
 */

interface SidebarProps {
  role?: UserRole;
}

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: '系統總覽', icon: 'dashboard', roles: ['super_admin', 'engineer'] },
  { to: '/clients', label: '客戶管理 (CRM)', icon: 'users', roles: ['super_admin', 'engineer'] },
  { to: '/contracts', label: '合約與報價', icon: 'contracts', roles: ['super_admin', 'engineer'] },
  { to: '/projects', label: '專案研發 (PMS)', icon: 'projects', roles: ['super_admin', 'engineer'] },
  { to: '/finance', label: '財務收支', icon: 'finance', roles: ['super_admin'] },
  { to: '/search', label: '全局語意檢索', icon: 'search', roles: ['super_admin', 'engineer'] }
];

export const Sidebar: React.FC<SidebarProps> = ({ role = 'super_admin' }) => {
  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}
    >
      {/* 品牌標識 / Brand Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
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
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>利恒軟體管理系統</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Liheng System v1.0</div>
        </div>
      </div>

      {/* 導航選單 / Navigation Menu */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              color: isActive ? '#ffffff' : '#94a3b8',
              backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
              transition: 'background-color 0.15s ease, color 0.15s ease'
            })}
          >
            <TextIcon name={item.icon} size="md" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 系統狀態 / System Health Indicator */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#64748b'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'inline-block'
          }}
        />
        <span>系統連線正常 (Healthy)</span>
      </div>
    </aside>
  );
};
