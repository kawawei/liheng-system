/**
 * @file ClientsDetailPage.tsx
 * @description 客戶詳情與新增/編輯共用全頁面 / CRM Client Detail & Create Unified Page
 * @description_en Unified full-width client view supporting both new client creation and existing client detail editing with tabs for basic info, contact timeline, and projects
 * @description_zh 統一全頁面客戶視圖，支援「新增客戶」與「客戶詳情編輯」，包含「基本資料」、「聯繫歷史」、「關聯專案清單」三大頁籤
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
  client?: Client | null;
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
  const isNew = !client || !client.id;

  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'projects'>('info');
  const [isAddLogModalOpen, setIsAddLogModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 客戶狀態與基本資料 Local State / Client state
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'pending');
  const [name, setName] = useState(client?.name || '');
  const [contactPerson, setContactPerson] = useState(client?.contactPerson || '');
  const [contactPhone, setContactPhone] = useState(client?.contactPhone || '');
  const [lineName, setLineName] = useState(client?.lineName || '');
  const [lineId, setLineId] = useState(client?.lineId || '');
  const [companyName, setCompanyName] = useState(client?.companyName || '');
  const [taxId, setTaxId] = useState(client?.taxId || '');
  const [companyPhone, setCompanyPhone] = useState(client?.companyPhone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');
  const [systemType, setSystemType] = useState(client?.systemType || '');
  const [requirementSummary, setRequirementSummary] = useState(client?.requirementSummary || '');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 聯繫歷史紀錄 State / Interaction log state
  const [logs, setLogs] = useState<InteractionLog[]>(client?.logs || []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // 載入關聯專案列表 (僅編輯既有客戶時)
  const fetchClientProjects = useCallback(async () => {
    if (!client?.id) return;
    setLoadingProjects(true);
    try {
      const data = await projectService.getProjects({ clientId: client.id });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load client projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [client?.id]);

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

    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
      errs.taxId = '統一編號如欲填寫，必須為 8 位數字';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = '請輸入有效的 Email 地址';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ========================================
  // 儲存修改或建立客戶 / Save or Create Client
  // ========================================
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      message.error('請檢查表單必填欄位與格式');
      return;
    }

    setSubmitting(true);
    try {
      if (isNew) {
        // 新增客戶模式
        const payload: Partial<Client> = {
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim() || undefined,
          lineName: lineName.trim() || undefined,
          lineId: lineId.trim() || undefined,
          companyName: companyName.trim() || undefined,
          taxId: taxId.trim() || undefined,
          companyPhone: companyPhone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          systemType: systemType.trim() || undefined,
          requirementSummary: requirementSummary.trim() || undefined,
          status
        };

        const created = await clientService.createClient(payload);
        message.success(`客戶「${created.name}」建檔成功！`);
        onUpdateClient(created);
      } else {
        // 編輯客戶模式
        const updated: Client = {
          ...client!,
          status,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim() || undefined,
          lineName: lineName.trim() || undefined,
          lineId: lineId.trim() || undefined,
          companyName: companyName.trim() || undefined,
          taxId: taxId.trim() || undefined,
          companyPhone: companyPhone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          systemType: systemType.trim() || undefined,
          requirementSummary: requirementSummary.trim() || undefined,
          logs
        };

        await clientService.updateClient(client!.id, updated);
        onUpdateClient(updated);
        message.success('客戶資料已成功更新！');
      }
    } catch (err: any) {
      console.error('Failed to save client:', err);
      message.error(err.response?.data?.message || (isNew ? '新增客戶失敗' : '更新客戶失敗'));
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // 新增聯繫紀錄 (API) / Add Log
  // ========================================
  const handleAddLog = async (logType: InteractionLog['type'], summaryText: string) => {
    if (!client?.id) return;
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
    if (!client?.id) return;
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
      {/* 頂部客戶標題列 / Top Client Title Header */}
      <div className="client-detail-header">
        <div className="client-detail-title-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 className="client-detail-title" style={{ margin: 0 }}>
            {isNew ? (name ? `新增客戶：${name}` : '新增客戶資料') : (name || '客戶詳情')}
          </h1>
          <StatusBadge label={currentStatusInfo.label} variant={currentStatusInfo.variant} />
        </div>
      </div>

      {/* 頁籤切換導航與右側操作列 / Tab Navigation & Right Actions */}
      <div className="client-tabs-nav">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`tab-item-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <TextIcon name="building" size="sm" />
            <span>基本資料</span>
          </button>

          {!isNew && (
            <>
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
                <TextIcon name="projects" size="sm" />
                <span>名下關聯專案 ({projects.length})</span>
              </button>
            </>
          )}
        </div>

        {/* 頁籤右側操作群組 (狀態下拉選單、新增紀錄、儲存修改/確認建立、返回列表) */}
        <div className="client-tabs-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
          {/* 僅在聯繫歷史頁籤時顯示 [+ 新增紀錄] 按鈕 */}
          {!isNew && activeTab === 'timeline' && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsAddLogModalOpen(true)}
              style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px' }}
            >
              <TextIcon name="plus" size="sm" />
              <span>新增紀錄</span>
            </Button>
          )}

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
            disabled={submitting}
            onClick={handleSaveInfo}
            style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TextIcon name="save" size="sm" />
            <span>{submitting ? '處理中...' : (isNew ? '確認建立客戶' : '儲存修改')}</span>
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

      {/* Tab 內容區塊 / Tab Content */}
      <div className="client-detail-content">
        {/* 頁籤 1: 基本資料 */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="client-detail-form card">
            <div className="form-section-title">核心資訊</div>
            <div className="form-grid-2">
              <TextField
                label="客戶 / 單位簡稱"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 台元半導體、張先生"
                error={errors.name}
              />
              <TextField
                label="公司登記全名 (選填)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例如: 台元半導體股份有限公司"
              />
            </div>

            <div className="form-grid-2">
              <TextField
                label="統一編號 (選填)"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="8 碼數字"
                error={errors.taxId}
              />
              <TextField
                label="預估開發系統類型 (選填)"
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
                label="行動電話 (選填)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="例如: 0912-345-678"
              />
            </div>

            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <TextField
                label="LINE 名稱 (選填)"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                placeholder="例如: 小陳 (顯示名稱 / 暱稱)"
              />
              <TextField
                label="LINE ID (選填)"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="例如: chen_12345"
              />
            </div>

            <div className="form-grid-2" style={{ marginTop: '12px' }}>
              <TextField
                label="公司代表號 (選填)"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="例如: 02-2789-1234"
              />
              <TextField
                label="電子郵件 Email (選填)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例如: contact@company.com"
                error={errors.email}
              />
            </div>

            <div className="form-grid-1" style={{ marginTop: '12px' }}>
              <TextField
                label="通訊 / 公司地址 (選填)"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例如: 新竹縣竹北市台元街 26 號"
              />
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>專案構想與需求概要</div>
            <div className="form-grid-1">
              <div className="form-field-wrapper">
                <label className="form-label" htmlFor="requirement-summary-textarea" style={{ fontSize: '13px', marginBottom: '6px' }}>
                  需求與專案構想描述 (選填)
                </label>
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
                    border: '1px solid var(--border-color, #e2e8f0)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            </div>
          </form>
        )}

        {/* 頁籤 2: 聯繫歷史 */}
        {!isNew && activeTab === 'timeline' && (
          <div className="client-detail-timeline-card card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div className="form-section-title" style={{ margin: 0, border: 'none' }}>
                聯繫歷程時間軸 ({logs.length})
              </div>
            </div>

            <HorizontalTimeline logs={logs} />
          </div>
        )}

        {/* 頁籤 3: 名下關聯專案 */}
        {!isNew && activeTab === 'projects' && (
          <div className="client-detail-projects-card card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>名下關聯專案列表</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  展示此客戶已簽約或立案之所有軟硬體專案期程與研發進度
                </p>
              </div>

              <Button
                type="button"
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
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                載入專案資料中...
              </div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
                <TextIcon name="projects" size="lg" color="#cbd5e1" style={{ marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>此客戶目前尚無關聯專案</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <TextIcon name="plus" size="sm" />
                  <span>立即為此客戶立案</span>
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="client-project-item card"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      transition: 'border-color 0.15s ease'
                    }}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>
                          {proj.projectCode}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                          {proj.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        交付目標：{proj.expectedDeliveryDate || '未定'} ｜ 總工期：{proj.durationDays || 0} 天
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-600)' }}>
                          {proj.progressPercent}%
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>進度</div>
                      </div>
                      <TextIcon name="arrow-right" size="sm" color="var(--text-secondary)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新增聯繫紀錄彈窗 */}
      {!isNew && (
        <AddLogModal
          isOpen={isAddLogModalOpen}
          onClose={() => setIsAddLogModalOpen(false)}
          onSubmit={handleAddLog}
        />
      )}

      {/* 為客戶新增專案立案彈窗 */}
      {!isNew && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          client={client}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onSubmit={handleProjectInitiated}
        />
      )}
    </div>
  );
};
