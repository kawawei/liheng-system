/**
 * @file ClientsPage.tsx
 * @description CRM 客戶關係管理頁面 / CRM Clients Management Page
 * @description_en Page level container handling client list, unified full-page creation & detail editing via ClientsDetailPage, project initiation, and deletion
 * @description_zh 頁面級容器，負責客戶列表、多專案膠囊展示、統一全頁面新增與詳情編輯 (ClientsDetailPage)、為客戶正式立案與刪除
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from '@kawawei/frontend-modules';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { Client, Project } from '../../types';
import { ClientTable, CreateProjectModal } from '../../components/crm';
import { ClientsDetailPage } from './ClientsDetailPage';
import { clientService } from '../../services/client.service';
import { projectService } from '../../services/project.service';
import './ClientsPage.css';

export const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [initiatingClient, setInitiatingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // ========================================
  // 載入客戶列表 / Fetch Clients List
  // ========================================
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      message.error(err.response?.data?.message || '載入客戶資料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ========================================
  // 篩選客戶列表 / Filtered Clients
  // ========================================
  const filteredClients = clients.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
      (c.contactPhone && c.contactPhone.toLowerCase().includes(q)) ||
      (c.lineName && c.lineName.toLowerCase().includes(q)) ||
      (c.lineId && c.lineId.toLowerCase().includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q)) ||
      (c.systemType && c.systemType.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  // ========================================
  // 刪除客戶處理 (API 軟刪除) / Delete Client Handler
  // ========================================
  const handleDeleteClient = async (clientId: string, clientName?: string) => {
    const targetName = clientName || '此客戶';
    if (window.confirm(`確定要刪除「${targetName}」嗎？此操作無法恢復。`)) {
      try {
        await clientService.deleteClient(clientId);
        message.success(`已成功刪除客戶「${targetName}」`);
        if (editingClient && editingClient.id === clientId) {
          setEditingClient(null);
        }
        await fetchClients();
      } catch (err: any) {
        message.error(err.response?.data?.message || '刪除客戶失敗');
      }
    }
  };

  // ========================================
  // 更新客戶資料與狀態 / Update Client Handler
  // ========================================
  const handleUpdateClient = async (updatedClient: Client) => {
    setEditingClient(updatedClient);
    await fetchClients();
  };

  // ========================================
  // 正式立案完成 (API) / Project Initiated Handler
  // ========================================
  const handleProjectInitiated = async (newProjectData: Project) => {
    try {
      const created = await projectService.createProject({
        ...newProjectData,
        clientId: initiatingClient?.id || newProjectData.clientId,
        clientName: initiatingClient?.companyName || initiatingClient?.name || newProjectData.clientName
      });
      message.success(`專案「${created.name}」已正式立案，案號：${created.projectCode}`);
      setInitiatingClient(null);
      await fetchClients();
      navigate(`/projects/${created.id}?tab=milestones`);
    } catch (err: any) {
      message.error(err.response?.data?.message || '專案立案失敗');
    }
  };

  // 1. 若處於新增客戶狀態，統一渲染 ClientsDetailPage
  if (isCreating) {
    return (
      <ClientsDetailPage
        client={null}
        onBack={() => setIsCreating(false)}
        onUpdateClient={(created) => {
          setIsCreating(false);
          setEditingClient(created);
          fetchClients();
        }}
      />
    );
  }

  // 2. 若處於編輯狀態，則以全頁面渲染 ClientsDetailPage
  if (editingClient) {
    return (
      <ClientsDetailPage
        client={editingClient}
        onBack={() => setEditingClient(null)}
        onUpdateClient={handleUpdateClient}
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
          <p className="page-subtitle">管理客戶聯絡資訊、專案進度膠囊、拜訪聯繫歷史與正式立案</p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreating(true)}
        >
          <TextIcon name="plus" size="sm" />
          <span>新增客戶</span>
        </Button>
      </div>

      {/* 合作狀態過濾與搜尋工具列 / Status & Search Toolbar */}
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
        {/* 左側：狀態快速過濾 Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: '300px' }}>
          {[
            { key: 'all', label: `全部客戶 (${clients.length})` },
            { key: 'pending', label: `待洽談 (${clients.filter((c) => c.status === 'pending').length})` },
            { key: 'negotiating', label: `洽談中 (${clients.filter((c) => c.status === 'negotiating').length})` },
            { key: 'in_cooperation', label: `合作中 (${clients.filter((c) => c.status === 'in_cooperation').length})` },
            { key: 'delivered', label: `已交付 (${clients.filter((c) => c.status === 'delivered').length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: statusFilter === tab.key ? 600 : 500,
                backgroundColor: statusFilter === tab.key ? 'var(--primary-600)' : '#ffffff',
                color: statusFilter === tab.key ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === tab.key ? 'var(--primary-600)' : 'var(--border-color)',
                borderRadius: '20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
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
              placeholder="搜尋客戶名稱、聯絡人、電話、LINE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '38px', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>

      {/* 客戶數據表格組件 */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          載入客戶資料中...
        </div>
      ) : (
        <ClientTable
          clients={filteredClients}
          onEditClient={(c) => setEditingClient(c)}
          onDeleteClient={(id, name) => handleDeleteClient(id, name)}
          onInitiateProject={(c) => setInitiatingClient(c)}
        />
      )}

      {/* 為客戶轉正式專案立案彈窗組件 */}
      <CreateProjectModal
        isOpen={Boolean(initiatingClient)}
        client={initiatingClient}
        onClose={() => setInitiatingClient(null)}
        onSubmit={handleProjectInitiated}
      />
    </div>
  );
};
