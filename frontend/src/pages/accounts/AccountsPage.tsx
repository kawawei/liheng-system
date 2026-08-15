/**
 * @file AccountsPage.tsx
 * @description 帳號管理頁面 / Account Management Page
 * @description_en Page level container for user account list, filtering, creation/edit modal, and account deletion
 * @description_zh 帳號管理頁面，負責系統成員列表、搜尋篩選、新增與編輯帳號彈窗與帳號刪除管理
 */

import React, { useState, useMemo } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { UserAccount, UserRole } from '../../types';
import { INITIAL_USERS_MOCK } from '../../mock/users.mock';
import { AccountTable, AccountFormModal } from '../../components/account';
import { useAuth } from '../../hooks/useAuth';
import './AccountsPage.css';

const USERS_STORAGE_KEY = 'liheng_users_data';

export const AccountsPage: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // ========================================
  // 帳號資料狀態 (支援 LocalStorage 持久化) / Accounts State
  // ========================================
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_USERS_MOCK;
      }
    }
    return INITIAL_USERS_MOCK;
  });

  const saveAccounts = (newAccounts: UserAccount[]) => {
    setAccounts(newAccounts);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newAccounts));
  };

  // ========================================
  // 儲存帳號處理 (新增或編輯) / Save Account Handler
  // ========================================
  const handleSaveAccount = (accountData: UserAccount) => {
    if (editingAccount) {
      const updated = accounts.map((acc) =>
        acc.id === accountData.id ? accountData : acc
      );
      saveAccounts(updated);
      setEditingAccount(null);
    } else {
      const updated = [accountData, ...accounts];
      saveAccounts(updated);
    }
  };

  // ========================================
  // 開啟編輯帳號彈窗 / Open Edit Modal
  // ========================================
  const handleEditAccount = (account: UserAccount) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  // ========================================
  // 刪除帳號處理 / Delete Account Handler
  // ========================================
  const handleDeleteAccount = (accountId: string, accountName: string) => {
    if (window.confirm(`確定要刪除「${accountName}」的系統帳號嗎？此操作無法恢復。`)) {
      const updated = accounts.filter((acc) => acc.id !== accountId);
      saveAccounts(updated);
    }
  };

  // ========================================
  // 統計數據計算 / Statistics Calculation
  // ========================================
  const stats = useMemo(() => {
    const total = accounts.length;
    const adminCount = accounts.filter((a) => a.role === 'super_admin').length;
    const engineerCount = accounts.filter((a) => a.role === 'engineer').length;
    return { total, adminCount, engineerCount };
  }, [accounts]);

  // ========================================
  // 篩選後帳號列表 / Filtered Accounts List
  // ========================================
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.account.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [accounts, searchQuery, roleFilter]);

  return (
    <div className="accounts-page-container">
      {/* 頁面標頭與新增按鈕 / Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TextIcon name="user-cog" size="lg" />
            <span>帳號管理</span>
          </h1>
          <p className="page-subtitle">管理系統成員登入帳號，指派超級管理員與軟體工程師角色權限</p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingAccount(null);
            setShowModal(true);
          }}
        >
          <TextIcon name="plus" size="sm" />
          <span>新增帳號</span>
        </Button>
      </div>

      {/* 角色過濾與搜尋工具列 / Role & Search Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* 左側：角色分頁過濾標籤 */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: '300px' }}>
          <button
            type="button"
            className={`filter-chip-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            全部 ({accounts.length})
          </button>
          <button
            type="button"
            className={`filter-chip-btn ${roleFilter === 'super_admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('super_admin')}
          >
            超級管理員 ({stats.adminCount})
          </button>
          <button
            type="button"
            className={`filter-chip-btn ${roleFilter === 'engineer' ? 'active' : ''}`}
            onClick={() => setRoleFilter('engineer')}
          >
            軟體工程師 ({stats.engineerCount})
          </button>
        </div>

        {/* 右側：搜尋框 */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '240px' }}>
          <div className="input-wrapper" style={{ width: '100%', maxWidth: '320px' }}>
            <span className="input-prefix-icon" style={{ left: '12px' }}>
              <TextIcon name="search" size="sm" color="var(--text-secondary)" />
            </span>
            <input
              type="text"
              className="form-input input-with-icon"
              placeholder="搜尋姓名或帳號..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '38px', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>

      {/* 帳號資料表格 / Accounts Table */}
      <AccountTable
        accounts={filteredAccounts}
        currentUserAccount={user?.email || 'admin'}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* 新增/編輯帳號彈窗 / Add or Edit Account Modal */}
      <AccountFormModal
        isOpen={showModal}
        initialData={editingAccount}
        onClose={() => {
          setShowModal(false);
          setEditingAccount(null);
        }}
        onSubmit={handleSaveAccount}
        existingAccounts={accounts}
      />
    </div>
  );
};
