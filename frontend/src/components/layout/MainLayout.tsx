import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';

/**
 * @file MainLayout.tsx
 * @description 系統主版面骨架 / Main Layout Shell
 * @description_en Combines Sidebar, Header, and page content Outlet with auth context
 * @description_zh 整合側邊欄、頂部導航列與子頁面渲染容器，並注入認證狀態
 */

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      <Sidebar role={user?.role} />
      <div className="main-content">
        <Header user={user} onLogout={logout} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
