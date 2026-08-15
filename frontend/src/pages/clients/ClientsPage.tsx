import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { Client } from '../../types';
import { INITIAL_CLIENTS_MOCK } from '../../mock/clients.mock';
import { ClientTable, ClientFormModal } from '../../components/crm';
import { ClientsDetailPage } from './ClientsDetailPage';
import './ClientsPage.css';

/**
 * @file ClientsPage.tsx
 * @description CRM 客戶關係管理頁面 / CRM Clients Management Page
 * @description_en Page level container handling client list, creation modal, deletion, and full-page client detail editing
 * @description_zh 頁面級容器，負責客戶列表、新增彈窗、刪除操作與導頁進入 ClientsDetailPage 獨立詳情頁
 */

export const ClientsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS_MOCK);

  // ========================================
  // 新增客戶處理 / Create Client Handler
  // ========================================
  const handleCreateClient = (newClient: Client) => {
    setClients([newClient, ...clients]);
  };

  // ========================================
  // 刪除客戶處理 / Delete Client Handler
  // ========================================
  const handleDeleteClient = (clientId: string, clientName?: string) => {
    const targetName = clientName || '此客戶';
    if (window.confirm(`確定要刪除「${targetName}」嗎？此操作無法恢復。`)) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      if (editingClient && editingClient.id === clientId) {
        setEditingClient(null);
      }
    }
  };

  // ========================================
  // 更新客戶資料與狀態 / Update Client Handler
  // ========================================
  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    setEditingClient(updatedClient);
  };

  // 若處於編輯狀態，則完全以全頁面渲染 ClientsDetailPage (非抽屜非 Modal)
  if (editingClient) {
    return (
      <ClientsDetailPage
        client={editingClient}
        onBack={() => setEditingClient(null)}
        onUpdateClient={handleUpdateClient}
        onDeleteClient={(id) => handleDeleteClient(id, editingClient.name)}
      />
    );
  }

  return (
    <div>
      {/* 頁面標頭與新增按鈕 / Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="users" size="lg" />
            <span>客戶關係管理 (CRM)</span>
          </h1>
          <p className="page-subtitle">管理客戶聯絡資訊、系統開發需求概要與拜訪聯繫時間軸</p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
        >
          <TextIcon name="plus" size="sm" />
          <span>新增客戶</span>
        </Button>
      </div>

      {/* 客戶數據表格組件 (含編輯與刪除按鈕) / Client Table Component */}
      <ClientTable
        clients={clients}
        onEditClient={(c) => setEditingClient(c)}
        onDeleteClient={(id, name) => handleDeleteClient(id, name)}
      />

      {/* 新增客戶彈窗組件 / Client Creation Form Modal Component */}
      <ClientFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  );
};
