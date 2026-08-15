/**
 * @file ClientsDetailPage.tsx
 * @description 客戶詳情與編輯獨立頁面 / CRM Client Detail Page
 * @description_en Full-width client detail view with tabs for basic info, contact timeline, and associated official projects with direct project initiation
 * @description_zh 獨立客戶詳情頁面，包含「基本資料」、「聯繫歷史」、「關聯專案清單」三大頁籤，支援直接為此客戶正式立案與穿透導航 (串接後端 API 與 @kawawei/frontend-modules 消息組件)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from '@kawawei/frontend-modules';
import { Client, InteractionLog, ClientStatus, Project } from '../../types';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { TextField } from '../../components/input/TextField';
import { SelectField, SelectOption } from '../../components/input/SelectField';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { HorizontalTimeline } from '../../components/crm/HorizontalTimeline';
import { AddLogModal } from '../../components/crm/AddLogModal';
import { CreateProjectModal } from '../../components/crm/CreateProjectModal';
import { clientService } from '../../services/client.service';
import { projectService } from '../../services/project.service';
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

const clientStatusMap: Record<ClientStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
  pending: { label: '待洽談', variant: 'info' },
  negotiating: { label: '洽談中', variant: 'warning' },
  pending_signature: { label: '待簽約', variant: 'warning' },
  in_cooperation: { label: '合作中', variant: 'info' },
  delivered: { label: '已交付', variant: 'success' },
  lost: { label: '未成交', variant: 'neutral' }
};

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // 載入關聯專案列表 / Load Associated Projects
  const fetchClientProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await projectService.getProjects({ clientId: client.id });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load client projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [client.id]);

  useEffect(() => {
    fetchClientProjects();
  }, [fetchClientProjects]);

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
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      message.error('請檢查表單填寫格式');
      return;
    }

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

    try {
      await clientService.updateClient(client.id, updated);
      onUpdateClient(updated);
      message.success('客戶資料已成功更新！');
    } catch (err: any) {
      message.error(err.response?.data?.message || '更新失敗');
    }
  };

  // ========================================
  // 新增聯繫紀錄 (API) / Add Log
  // ========================================
  const handleAddLog = async (logType: InteractionLog['type'], summaryText: string) => {
    try {
      const createdLog = await clientService.addActivityLog(client.id, {
        contactType: logType,
        summary: summaryText.trim()
      });

      const updatedLogs = [createdLog, ...logs];
      setLogs(updatedLogs);
      message.success('聯繫紀錄已成功新增');
      setIsAddLogModalOpen(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || '新增聯繫紀錄失敗');
    }
  };

  // ========================================
  // 正式立案完成 (API) / Project Initiated
  // ========================================
  const handleProjectInitiated = async (newProjectData: Project) => {
    try {
      const created = await projectService.createProject({
        ...newProjectData,
        clientId: client.id,
        clientName: client.companyName || client.name
      });
      message.success(`專案「${created.name}」已正式立案，案號：${created.projectCode}`);
      setStatus('in_cooperation');
      setIsCreateProjectModalOpen(false);
      await fetchClientProjects();
      navigate(`/projects/${created.id}?tab=milestones`);
    } catch (err: any) {
      message.error(err.response?.data?.message || '專案立案失敗');
    }
  };

  const currentStatusInfo = clientStatusMap[status] || { label: status, variant: 'neutral' as const };

  return (
    <div className="client-detail-page">
      {/* 頂部導覽列 / Top Action Header */}
      <div className="client-detail-header">
        <div className="client-detail-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 className="client-detail-title" style={{ margin: 0 }}>{name || '客戶詳情'}</h1>
          <StatusBadge label={currentStatusInfo.label} variant={currentStatusInfo.variant} />
        </div>

        <div className="client-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
          {/* 客戶階段下拉選單 */}
          <div className="header-status-select-wrapper" style={{ width: '130px' }}>
            <SelectField
              value={status}
              onChange={(val) => setStatus(val as ClientStatus)}
              options={STATUS_OPTIONS}
              style={{ height: '36px', fontSize: '13px' }}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSaveInfo}
            style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TextIcon name="save" size="sm" />
            <span>儲存修改</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            style={{ height: '36px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TextIcon name="arrow-left" size="sm" />
            <span>返回列表</span>
          </Button>
        </div>
      </div>

      {/* 頁籤切換導航 / Tab Navigation */}
      <div className="client-detail-tabs-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="client-detail-tabs">
          <button
            type="button"
            className={`client-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <TextIcon name="building" size="sm" />
            <span>基本資料與需求編輯</span>
          </button>
          <button
            type="button"
            className={`client-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <TextIcon name="clock" size="sm" />
            <span>聯繫歷史</span>
          </button>
          <button
            type="button"
            className={`client-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <TextIcon name="projects" size="sm" />
            <span>名下關聯專案 ({projects.length})</span>
          </button>
        </div>

        {/* 僅在聯繫歷史頁籤時顯示 [+ 新增紀錄] 按鈕 */}
        {activeTab === 'timeline' && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsAddLogModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}
          >
            <TextIcon name="plus" size="sm" />
            <span>新增紀錄</span>
          </Button>
        )}
      </div>

      {/* Tab 內容區塊 / Tab Content */}
      <div className="client-detail-content">
        {/* 頁籤 1: 基本資料與需求編輯 */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="client-detail-form card">
            <div className="form-section-title">核心資訊</div>
            <div className="form-grid-2">
              <TextField
                label="客戶 / 單位簡稱"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 台元半導體"
                error={errors.name}
              />
              <TextField
                label="公司登記全名"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如: 台元半導體股份有限公司"
              />
            </div>

            <div className="form-grid-2">
              <TextField
                label="統一編號"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="8 碼數字"
                error={errors.taxId}
              />
              <TextField
                label="預估開發系統類型"
                value={systemType}
                onChange={(e) => setSystemType(e.target.value)}
                placeholder="例如: IoT 物聯網監控 / POS / Web 平台"
              />
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>聯絡人資訊</div>
            <div className="form-grid-2">
              <TextField
                label="主要聯絡人"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="例如: 陳協理"
                error={errors.contactPerson}
              />
              <TextField
                label="行動電話"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="例如: 0912-345-678"
                error={errors.contactPhone}
              />
            </div>

            <div className="form-grid-2">
              <TextField
                label="公司代表號"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="例如: 02-2789-1234"
              />
              <TextField
                label="電子郵件"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例如: contact@company.com"
                error={errors.email}
              />
            </div>

            <div className="form-grid-1">
              <TextField
                label="通訊 / 公司地址"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例如: 新竹縣竹北市台元街 26 號"
              />
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>專案構想與需求概要</div>
            <div className="form-grid-1">
              <div className="form-field-wrapper">
                <label className="form-label" htmlFor="requirement-summary-textarea">需求與專案構想描述</label>
                <textarea
                  id="requirement-summary-textarea"
                  className="form-textarea"
                  rows={4}
                  value={requirementSummary}
                  onChange={(e) => setRequirementSummary(e.target.value)}
                  placeholder="請輸入客戶提出的系統構想、技術要求與時程期待..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
          </form>
        )}

        {/* 頁籤 2: 聯繫歷史時間軸 */}
        {activeTab === 'timeline' && (
          <div className="client-timeline-container card">
            <HorizontalTimeline
              logs={logs}
            />
          </div>
        )}

        {/* 頁籤 3: 名下關聯專案 */}
        {activeTab === 'projects' && (
          <div className="client-projects-tab-container card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  名下關聯專案列表
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  展示此客戶已簽約或立案之所有軟硬體專案期程與研發進度
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateProjectModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <TextIcon name="plus" size="sm" />
                <span>為此客戶新增專案</span>
              </Button>
            </div>

            {loadingProjects ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>載入專案中...</div>
            ) : projects.length === 0 ? (
              <div className="empty-projects-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <TextIcon name="projects" size="lg" color="var(--text-muted)" />
                <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  此客戶目前尚無關聯專案
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  style={{ marginTop: '8px' }}
                >
                  <TextIcon name="plus" size="sm" />
                  <span>立即為此客戶立案</span>
                </Button>
              </div>
            ) : (
              <div className="client-projects-grid">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="client-project-card"
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      marginBottom: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-600)' }}>
                            {proj.projectCode}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1'
                            }}
                          >
                            {proj.stage === 'development' ? '開發中' : proj.stage === 'testing' ? '測試驗證' : proj.stage === 'delivery' ? '交付驗收' : proj.stage === 'closed' ? '已結案' : '保固維護'}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {proj.name}
                        </h4>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/projects/${proj.id}?tab=milestones`)}
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                      >
                        <span>進入專案工作台</span>
                        <TextIcon name="arrow-right" size="sm" />
                      </Button>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>開工日期: </span>
                        <span>{proj.startDate || '未排定'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>預計結案: </span>
                        <span>{proj.expectedDeliveryDate || '未排定'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>合約總額: </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          NT$ {proj.amountTotal.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>負責工程師: </span>
                        <span>{proj.assignedEngineers?.join(', ') || '尚未指派'}</span>
                      </div>
                    </div>

                    {/* 進度條 */}
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>研發進度</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{proj.progressPercent}%</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${proj.progressPercent}%`,
                            backgroundColor: 'var(--primary-600)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新增聯繫歷史彈窗 */}
      <AddLogModal
        isOpen={isAddLogModalOpen}
        onClose={() => setIsAddLogModalOpen(false)}
        onSubmit={handleAddLog}
      />

      {/* 為此客戶正式立案彈窗 */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        client={client}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSubmit={handleProjectInitiated}
      />
    </div>
  );
};
