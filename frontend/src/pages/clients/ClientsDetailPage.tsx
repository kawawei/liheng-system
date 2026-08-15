/**
 * @file ClientsDetailPage.tsx
 * @description 客戶詳情與編輯獨立頁面 / CRM Client Detail Page
 * @description_en Full-width client detail view with tabs for basic info, contact timeline, and associated official projects with direct project initiation
 * @description_zh 獨立客戶詳情頁面，包含「基本資料」、「聯繫歷史」、「關聯專案清單」三大頁籤，支援直接為此客戶正式立案與穿透導航
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, InteractionLog, ClientStatus, Project } from '../../types';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { TextField } from '../../components/input/TextField';
import { SelectField, SelectOption } from '../../components/input/SelectField';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { HorizontalTimeline } from '../../components/crm/HorizontalTimeline';
import { AddLogModal } from '../../components/crm/AddLogModal';
import { CreateProjectModal } from '../../components/crm/CreateProjectModal';
import { MOCK_PROJECTS } from '../../mock/projects.mock';
import './ClientsDetailPage.css';

interface ClientsDetailPageProps {
  client: Client;
  onBack: () => void;
  onUpdateClient: (updatedClient: Client) => void;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'pending', label: '待洽談' },
  { value: 'negotiating', label: '洽談中' },
  { value: 'pending_signature', label: '待簽約' },
  { value: 'in_cooperation', label: '合作中' },
  { value: 'delivered', label: '已交付' },
  { value: 'lost', label: '未成交' }
];

export const ClientsDetailPage: React.FC<ClientsDetailPageProps> = ({
  client,
  onBack,
  onUpdateClient,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'projects'>('info');
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // 客戶狀態與基本資料 Local State / Client state
  const [status, setStatus] = useState<ClientStatus>(client.status);
  const [name, setName] = useState(client.name);
  const [contactPerson, setContactPerson] = useState(client.contactPerson);
  const [contactPhone, setContactPhone] = useState(client.contactPhone);
  const [companyName, setCompanyName] = useState(client.companyName || '');
  const [taxId, setTaxId] = useState(client.taxId || '');
  const [companyPhone, setCompanyPhone] = useState(client.companyPhone || '');
  const [email, setEmail] = useState(client.email || '');
  const [address, setAddress] = useState(client.address || '');
  const [systemType, setSystemType] = useState(client.systemType || '');
  const [requirementSummary, setRequirementSummary] = useState(client.requirementSummary || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 聯繫歷史紀錄 State / Interaction log state
  const [logs, setLogs] = useState<InteractionLog[]>(client.logs || []);

  // 尋找關聯專案
  const clientProjects = MOCK_PROJECTS.filter(
    (p) =>
      p.clientId === client.id ||
      (client.companyName && p.clientName.includes(client.companyName)) ||
      p.clientName.includes(client.name)
  );

  // ========================================
  // 驗證表單 / Validate Form
  // ========================================
  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = '請輸入客戶名稱';
    if (!contactPerson.trim()) errs.contactPerson = '請輸入聯絡人姓名';
    if (!contactPhone.trim()) errs.contactPhone = '請輸入聯絡人電話';

    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
      errs.taxId = '統一編號必須為 8 位數字';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = '請輸入有效的 Email 地址';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ========================================
  // 儲存修改處理 / Save Info
  // ========================================
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const updated: Client = {
      ...client,
      status,
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      companyName: companyName.trim(),
      taxId: taxId.trim(),
      companyPhone: companyPhone.trim(),
      email: email.trim(),
      address: address.trim(),
      systemType: systemType.trim(),
      requirementSummary: requirementSummary.trim(),
      logs
    };

    onUpdateClient(updated);
    alert('客戶資料已成功更新！');
  };

  // ========================================
  // 新增聯繫紀錄 / Add Log
  // ========================================
  const handleAddLog = (logType: InteractionLog['type'], summary: string) => {
    const newLog: InteractionLog = {
      id: `log_${Date.now()}`,
      clientId: client.id,
      date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
      type: logType,
      summary: summary.trim(),
      createdByName: '系統工程師'
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    const updated: Client = {
      ...client,
      status,
      name,
      contactPerson,
      contactPhone,
      companyName,
      taxId,
      companyPhone,
      email,
      address,
      systemType,
      requirementSummary,
      logs: updatedLogs
    };
    onUpdateClient(updated);
  };

  // ========================================
  // 正式立案完成 / Project Initiated
  // ========================================
  const handleProjectInitiated = (newProject: Project) => {
    MOCK_PROJECTS.unshift(newProject);
    // 自動將客戶狀態推進為合作中
    const nextStatus: ClientStatus = 'in_cooperation';
    setStatus(nextStatus);
    const updated: Client = {
      ...client,
      status: nextStatus,
      name,
      contactPerson,
      contactPhone,
      companyName,
      taxId,
      companyPhone,
      email,
      address,
      systemType,
      requirementSummary,
      logs,
    };
    onUpdateClient(updated);
    setIsCreateProjectModalOpen(false);
    navigate(`/projects/${newProject.id}?tab=milestones`);
  };

  return (
    <div className="client-detail-container">
      {/* 頂部 Header 標題與操作欄 */}
      <div className="client-detail-header">
        <div className="client-detail-header-left">
          <div className="client-title-row">
            <h1 className="client-title">{name}</h1>
            <StatusBadge
              label={STATUS_OPTIONS.find((s) => s.value === status)?.label || '洽談中'}
              variant={status === 'in_cooperation' ? 'success' : status === 'delivered' ? 'neutral' : 'warning'}
            />
          </div>
          <div className="client-subtitle">
            {companyName ? `公司: ${companyName}` : '個人/未具名公司'}
            {taxId && ` (統編: ${taxId})`}
            {` • 建立於 ${client.createdAt}`}
          </div>
        </div>

        {/* 右側按鈕群組 (狀態下拉選單 + 儲存 + 返回) */}
        <div className="client-detail-header-right">
          {/* 1. 客戶狀態下拉選單 */}
          <div style={{ width: '130px' }}>
            <SelectField
              id="client-status-header-select"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(val) => {
                const newStatus = val as ClientStatus;
                setStatus(newStatus);
                onUpdateClient({ ...client, status: newStatus });
              }}
            />
          </div>

          {/* 2. 儲存修改按鈕 */}
          <Button
            type="submit"
            form="client-edit-form"
            variant="secondary"
            title="儲存修改"
            style={{ padding: '8px 12px' }}
          >
            <TextIcon name="save" size="md" />
          </Button>

          {/* 3. 返回客戶列表按鈕 */}
          <Button variant="secondary" onClick={onBack}>
            <TextIcon name="arrow-left" size="sm" />
            <span>返回客戶列表</span>
          </Button>
        </div>
      </div>

      {/* 頁籤分頁導覽 (左側為 Tab 頁籤，右側為動態按鈕) */}
      <div className="client-tabs-nav">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`tab-item-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <TextIcon name="user" size="sm" />
            <span>客戶基本資料與需求編輯</span>
          </button>

          <button
            type="button"
            className={`tab-item-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <TextIcon name="clock" size="sm" />
            <span>聯繫歷史</span>
          </button>

          <button
            type="button"
            className={`tab-item-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <TextIcon name="layers" size="sm" />
            <span>名下關聯專案 ({clientProjects.length})</span>
          </button>
        </div>

        {/* 僅在「聯繫歷史」頁籤顯示 [新增紀錄] 按鈕 */}
        {activeTab === 'timeline' && (
          <Button
            variant="primary"
            onClick={() => setIsAddLogModalOpen(true)}
          >
            <TextIcon name="plus" size="sm" />
            <span>新增紀錄</span>
          </Button>
        )}

        {/* 僅在「關聯專案」頁籤顯示 [為此客戶新增專案] 按鈕 */}
        {activeTab === 'projects' && (
          <Button
            variant="primary"
            onClick={() => setIsCreateProjectModalOpen(true)}
          >
            <TextIcon name="plus" size="sm" />
            <span>為此客戶新增專案</span>
          </Button>
        )}
      </div>

      {/* Tab 1: 客戶基本資料與需求編輯 */}
      {activeTab === 'info' && (
        <div style={{ width: '100%', background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <form id="client-edit-form" onSubmit={handleSaveInfo} noValidate>
            <TextField
              id="client-name-edit"
              label="客戶 / 單位名稱"
              required
              value={name}
              error={errors.name}
              placeholder="請輸入客戶或單位名稱"
              onChange={(e) => setName(e.target.value)}
            />

            <div className="form-grid-2">
              <TextField
                id="contact-person-edit"
                label="聯絡人姓名"
                required
                value={contactPerson}
                error={errors.contactPerson}
                placeholder="例如：王小明"
                onChange={(e) => setContactPerson(e.target.value)}
              />
              <TextField
                id="contact-phone-edit"
                label="聯絡人電話"
                required
                value={contactPhone}
                error={errors.contactPhone}
                placeholder="例如：0912-345-678"
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <TextField
                id="company-name-edit"
                label="公司名稱 (選填)"
                value={companyName}
                placeholder="例如：台元半導體股份有限公司"
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <TextField
                id="tax-id-edit"
                label="統一編號 (選填，8碼)"
                value={taxId}
                error={errors.taxId}
                placeholder="例如：12345678"
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <TextField
                id="company-phone-edit"
                label="公司電話 (選填)"
                value={companyPhone}
                placeholder="例如：02-27891234"
                onChange={(e) => setCompanyPhone(e.target.value)}
              />
              <TextField
                id="email-edit"
                label="電子郵件 Email (選填)"
                type="email"
                value={email}
                error={errors.email}
                placeholder="例如：contact@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <TextField
              id="address-edit"
              label="地址 (選填)"
              value={address}
              placeholder="例如：新竹縣竹北市台元街 26 號 5 樓"
              onChange={(e) => setAddress(e.target.value)}
            />

            <div style={{ marginBottom: '16px' }}>
              <TextField
                id="system-type-edit"
                label="預計開發系統類型 (選填)"
                value={systemType}
                placeholder="例如：Web 管理系統、App 開發、IoT 物聯網"
                onChange={(e) => setSystemType(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="requirement-summary-edit" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                客戶需求概要 / 專案構想 (選填)
              </label>
              <textarea
                id="requirement-summary-edit"
                className="form-input"
                rows={4}
                value={requirementSummary}
                placeholder="請輸入本次洽談之功能需求、痛點或預算範圍..."
                style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                onChange={(e) => setRequirementSummary(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button type="submit" variant="primary">
                儲存客戶修改
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: 聯繫歷史 */}
      {activeTab === 'timeline' && (
        <div style={{ width: '100%', background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <HorizontalTimeline logs={logs} />
        </div>
      )}

      {/* Tab 3: 名下關聯專案 */}
      {activeTab === 'projects' && (
        <div style={{ width: '100%', background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {name} 名下正式合約專案清單
            </h2>
          </div>

          {clientProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <p style={{ fontSize: '14px', marginBottom: '16px' }}>此客戶目前尚未建立任何正式專案。</p>
              <Button variant="primary" onClick={() => setIsCreateProjectModalOpen(true)}>
                <TextIcon name="plus" size="sm" />
                <span>立即為此客戶建立第一個專案</span>
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clientProjects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => navigate(`/projects/${p.id}?tab=milestones`)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.projectCode}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', gap: '16px' }}>
                      <span>合約總額: NT$ {p.amountTotal.toLocaleString()}</span>
                      <span>工期: {p.durationDays} 天 ({p.startDate} ~ {p.expectedDeliveryDate})</span>
                      <span>負責工程師: {p.assignedEngineers.join(', ')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>進度 {p.progressPercent}%</div>
                      <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progressPercent}%`, height: '100%', backgroundColor: '#2563eb' }} />
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      前往工作台 ➔
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 新增紀錄彈窗 */}
      <AddLogModal
        isOpen={isAddLogModalOpen}
        onClose={() => setIsAddLogModalOpen(false)}
        onSubmit={handleAddLog}
      />

      {/* 客戶轉正式專案立案彈窗 */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        client={client}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSubmit={handleProjectInitiated}
      />
    </div>
  );
};
