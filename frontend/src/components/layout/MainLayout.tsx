import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';

/**
 * @file MainLayout.tsx
 * @description 系統主版面骨架 / Main Layout Shell
 * @description_en Top-Header vertical layout shell with sidebar collapse state management
 * @description_zh 整合全寬頂部導航列、亮色側邊欄與子頁面渲染容器，並管理側邊欄折疊狀態
 */

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 頂部全寬導航列 / Top Header Bar */}
      <Header
        user={user}
        onLogout={logout}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 側邊欄與內容主區塊 / Sidebar & Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar role={user?.role} isCollapsed={isSidebarCollapsed} />
        <main
          className="page-body"
          style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-app)', padding: '24px 32px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

