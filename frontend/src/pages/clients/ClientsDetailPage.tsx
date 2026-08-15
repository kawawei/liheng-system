import React, { useState } from 'react';
import { Client, InteractionLog, ClientStatus } from '../../types';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { TextField } from '../../components/input/TextField';
import { SelectField, SelectOption } from '../../components/input/SelectField';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { HorizontalTimeline } from '../../components/crm/HorizontalTimeline';
import './ClientsDetailPage.css';

/**
 * @file ClientsDetailPage.tsx
 * @description 客戶詳情與編輯獨立頁面 / CRM Client Detail Page
 * @description_en Full-width client detail view without card container constraint, featuring 5-column average horizontal timeline with pagination
 * @description_zh 獨立客戶詳情頁面，移除左擠卡片外框，提供滿版表單排版與平均分配 5 欄寬度之橫向時間軸 (超過 5 筆自動分頁)
 */

interface ClientsDetailPageProps {
  client: Client;
  onBack: () => void;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

const LOG_TYPE_OPTIONS: SelectOption[] = [
  { value: 'line', label: 'LINE 訊息', iconName: 'message' },
  { value: 'phone', label: '電話溝通', iconName: 'phone' },
  { value: 'fb', label: 'FB 私訊', iconName: 'fb' },
  { value: 'ig', label: 'IG 訊息', iconName: 'ig' },
  { value: 'threads', label: 'Threads 互動', iconName: 'threads' }
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'pending', label: '待洽談' },
  { value: 'negotiating', label: '洽談中' },
  { value: 'pending_signature', label: '待簽約' },
  { value: 'in_cooperation', label: '合作中' },
  { value: 'delivered', label: '已交付' },
  { value: 'lost', label: '未成交' }
];

const PRESET_SYSTEM_TYPES = [
  'Web 管理系統',
  'iOS / Android App',
  'POS 軟硬體整合',
  'E-Commerce 電商平台',
  'IoT 物聯網監控',
  '其他專案'
];

export const ClientsDetailPage: React.FC<ClientsDetailPageProps> = ({
  client,
  onBack,
  onUpdateClient,
  onDeleteClient
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');

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
  const [logType, setLogType] = useState<'line' | 'phone' | 'fb' | 'ig' | 'threads'>('line');
  const [logSummary, setLogSummary] = useState('');
  const [logs, setLogs] = useState<InteractionLog[]>(client.logs || []);

  // 保存客戶基本資料與狀態修改 / Save handler
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = '請輸入客戶 / 單位名稱';
    if (!contactPerson.trim()) newErrors.contactPerson = '請輸入聯絡人姓名';
    if (!contactPhone.trim()) newErrors.contactPhone = '請輸入聯絡人電話';
    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
      newErrors.taxId = '統一編號如欲填寫，必須為 8 碼數字';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updatedClient: Client = {
      ...client,
      name: name.trim(),
      status,
      companyName: companyName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      companyPhone: companyPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      systemType: systemType.trim() || undefined,
      requirementSummary: requirementSummary.trim() || undefined,
      logs
    };

    onUpdateClient(updatedClient);
    alert('客戶資料與狀態已成功儲存！');
  };

  // 即時變更客戶狀態 / Change status
  const handleStatusChange = (newStatus: string) => {
    const updatedStatus = newStatus as ClientStatus;
    setStatus(updatedStatus);
    const updatedClient: Client = {
      ...client,
      status: updatedStatus,
      logs
    };
    onUpdateClient(updatedClient);
  };

  // 新增聯繫紀錄 / Add interaction log
  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;

    const newLog: InteractionLog = {
      id: `log_${Date.now()}`,
      clientId: client.id,
      date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
      type: logType,
      summary: logSummary.trim(),
      createdByName: '系統管理員'
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    setLogSummary('');

    onUpdateClient({
      ...client,
      status,
      logs: updatedLogs
    });
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 返回與標頭區域 / Navigation & Header */}
      <div style={{ marginBottom: '16px' }}>
        <Button variant="secondary" size="sm" onClick={onBack}>
          <TextIcon name="arrow-left" size="sm" />
          <span>返回客戶列表</span>
        </Button>
      </div>

      <div className="client-detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{name}</h1>
            <StatusBadge
              label={
                status === 'delivered'
                  ? '已交付'
                  : status === 'in_cooperation'
                  ? '合作中'
                  : status === 'pending_signature'
                  ? '待簽約'
                  : status === 'negotiating'
                  ? '洽談中'
                  : status === 'pending'
                  ? '待洽談'
                  : '未成交'
              }
              variant={
                status === 'delivered' || status === 'in_cooperation'
                  ? 'success'
                  : status === 'negotiating'
                  ? 'warning'
                  : status === 'pending_signature' || status === 'pending'
                  ? 'info'
                  : 'neutral'
              }
            />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {companyName ? `公司: ${companyName}` : '個人/無公司'}
            {taxId ? ` (統編: ${taxId})` : ''} • 建立於 {client.createdAt}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 客戶狀態切換器 / Status Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>客戶狀態:</span>
            <SelectField
              options={STATUS_OPTIONS}
              value={status}
              onChange={handleStatusChange}
              style={{ width: '140px' }}
            />
          </div>

          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(`確定要刪除「${client.name}」的客戶資料嗎？此操作無法撤銷。`)) {
                onDeleteClient(client.id);
                onBack();
              }
            }}
          >
            <TextIcon name="trash" size="sm" />
            <span>刪除客戶</span>
          </Button>
        </div>
      </div>

      {/* 頁籤分頁導覽 / Tabs Navigation */}
      <div className="client-tabs-nav">
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
          <span>聯繫歷史時間軸 ({logs.length})</span>
        </button>
      </div>

      {/* Tab 1: 客戶基本資料與需求編輯 (無硬包卡片，彈性直鋪全寬) */}
      {activeTab === 'info' && (
        <div style={{ width: '100%', background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <form onSubmit={handleSaveInfo} noValidate>
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
                placeholder="請輸入主要聯絡人"
                onChange={(e) => setContactPerson(e.target.value)}
              />

              <TextField
                id="contact-phone-edit"
                label="聯絡人電話"
                required
                value={contactPhone}
                error={errors.contactPhone}
                placeholder="如 0912-345-678"
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <TextField
                id="company-name-edit"
                label="公司名稱 (選填)"
                value={companyName}
                placeholder="若無公司可留空"
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <TextField
                id="tax-id-edit"
                label="統一編號 (選填，8碼)"
                maxLength={8}
                value={taxId}
                error={errors.taxId}
                placeholder="如 12345678 (選填)"
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>

            <div className="form-grid-2">
              <TextField
                id="company-phone-edit"
                label="公司電話 (選填)"
                value={companyPhone}
                placeholder="如 02-27891234 (選填)"
                onChange={(e) => setCompanyPhone(e.target.value)}
              />

              <TextField
                id="email-input-edit"
                type="email"
                label="電子郵件 Email (選填)"
                value={email}
                placeholder="example@domain.com (選填)"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <TextField
              id="address-input-edit"
              label="地址 (選填)"
              value={address}
              placeholder="如：台北市信義區松仁路 7 號 12 樓 (選填)"
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="form-group">
              <label className="form-label" htmlFor="system-type-edit">預計開發系統類型 (選填)</label>
              <input
                id="system-type-edit"
                type="text"
                className="form-input"
                value={systemType}
                placeholder="可點選下方標籤或自行輸入"
                onChange={(e) => setSystemType(e.target.value)}
              />
              <div className="system-type-chips">
                {PRESET_SYSTEM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip-btn ${systemType === t ? 'active' : ''}`}
                    onClick={() => setSystemType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="req-summary-edit">客戶需求概要 / 專案構想 (選填)</label>
              <textarea
                id="req-summary-edit"
                className="form-input"
                rows={4}
                value={requirementSummary}
                placeholder="簡述客戶做什麼樣的系統、主要功能構想或預算範圍..."
                onChange={(e) => setRequirementSummary(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button type="submit" variant="primary">
                <TextIcon name="file-check" size="sm" />
                <span>儲存修改</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: 橫向時間軸 (平均 5 欄寬度、5 筆分頁翻頁) / Horizontal Timeline */}
      {activeTab === 'timeline' && (
        <div style={{ width: '100%' }}>
          {/* 新增聯繫紀錄表單 */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
              <TextIcon name="plus" size="sm" />
              <span>新增聯繫 / 拜訪紀錄 (支援 FB, IG, Threads, LINE, 電話)</span>
            </div>
            <form onSubmit={handleAddLogSubmit}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <SelectField
                  options={LOG_TYPE_OPTIONS}
                  value={logType}
                  onChange={(v) => setLogType(v as any)}
                  style={{ width: '160px' }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="輸入聯繫紀要重點..."
                  value={logSummary}
                  onChange={(e) => setLogSummary(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!logSummary.trim()}
                >
                  <TextIcon name="plus" size="sm" />
                  <span>新增紀錄</span>
                </Button>
              </div>
            </form>
          </div>

          {/* 橫向時間軸 (平均分配 5 欄寬度、超過 5 筆分頁) */}
          <HorizontalTimeline logs={logs} />
        </div>
      )}
    </div>
  );
};
