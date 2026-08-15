import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button';
import { Client, InteractionLog } from '../../types';
import { INITIAL_CLIENTS_MOCK } from '../../mock/clients.mock';
import { ClientTable, ClientFormModal, ClientDetailDrawer } from '../../components/crm';
import './ClientsPage.css';

/**
 * @file ClientsPage.tsx
 * @description CRM 客戶關係管理頁面 / CRM Clients Management Page
 * @description_en Page level container leveraging @kawawei/frontend-modules component library
 * @description_zh 頁面級容器，使用規範指定之 @kawawei/frontend-modules 組件庫並協調 CRM 子組件
 */

export const ClientsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS_MOCK);

  // ========================================
  // 新增客戶處理 / Create Client Handler
  // ========================================
  const handleCreateClient = (newClient: Client) => {
    setClients([newClient, ...clients]);
  };

  // ========================================
  // 新增聯繫紀錄處理 / Add Interaction Log Handler
  // ========================================
  const handleAddLog = (newLog: InteractionLog) => {
    if (!selectedClient) return;
    const updatedClients = clients.map((c) => {
      if (c.id === selectedClient.id) {
        const updatedLogs = [newLog, ...(c.logs || [])];
        const updatedClient = { ...c, logs: updatedLogs };
        setSelectedClient(updatedClient);
        return updatedClient;
      }
      return c;
    });

    setClients(updatedClients);
  };

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

      {/* 客戶數據表格組件 / Client Table Sub-component */}
      <ClientTable
        clients={clients}
        onSelectClient={(c) => setSelectedClient(c)}
      />

      {/* 新增客戶彈窗組件 / Client Creation Form Modal Sub-component */}
      <ClientFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateClient}
      />

      {/* 客戶詳情與時間軸 Drawer 組件 / Client Detail Drawer Sub-component */}
      <ClientDetailDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onAddLog={handleAddLog}
      />
    </div>
  );
};
