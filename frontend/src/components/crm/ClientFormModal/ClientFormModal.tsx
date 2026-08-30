/**
 * @file ClientFormModal.tsx
 * @description 新增客戶資料分頁式彈窗組件 / Tabbed Client Form Modal Component
 * @description_en Tabbed modal dialog for streamlined, scroll-free client creation with LINE name and ID support
 * @description_zh 分頁式新增客戶彈窗，分為「基本與聯絡人」、「公司與通訊」、「需求與概要」三大分頁，支援 LINE 名稱與 ID 選填，零滾動條極簡設計
 */

import React, { useState } from 'react';
import { Client } from '../../../types';
import { Button } from '../../button/Button';
import { TextField } from '../../input/TextField';
import { TextIcon } from '../../icon/TextIcon';
import './ClientFormModal.css';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
}

type TabKey = 'basic' | 'company' | 'requirement';

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  // 表單資料狀態
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineId, setLineId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [systemType, setSystemType] = useState('');
  const [requirementSummary, setRequirementSummary] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = '請輸入客戶 / 單位名稱';
    if (!contactPerson.trim()) newErrors.contactPerson = '請輸入聯絡人姓名';
    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
      newErrors.taxId = '統一編號如欲填寫，必須為 8 碼數字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      // 若基本欄位有錯，自動切回第一分頁
      if (!name.trim() || !contactPerson.trim()) {
        setActiveTab('basic');
      } else if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
        setActiveTab('company');
      }
      return;
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim() || undefined,
      lineName: lineName.trim() || undefined,
      lineId: lineId.trim() || undefined,
      companyPhone: companyPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      systemType: systemType.trim() || undefined,
      requirementSummary: requirementSummary.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      logs: requirementSummary.trim()
        ? [
            {
              id: `log_${Date.now()}`,
              clientId: `cli_${Date.now()}`,
              date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
              type: 'line',
              summary: `[建檔需求概要] ${requirementSummary.trim()}`,
              createdByName: '系統管理員'
            }
          ]
        : []
    };

    onSubmit(newClient);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setActiveTab('basic');
    setName('');
    setContactPerson('');
    setContactPhone('');
    setLineName('');
    setLineId('');
    setCompanyName('');
    setTaxId('');
    setCompanyPhone('');
    setEmail('');
    setAddress('');
    setSystemType('');
    setRequirementSummary('');
    setErrors({});
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card client-tab-modal">
        {/* 頂部標題與關閉按鈕 */}
        <div className="tab-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TextIcon name="users" size="md" />
            <h2 className="tab-modal-title">新增客戶資料</h2>
          </div>
          <button
            type="button"
            className="tab-modal-close"
            onClick={onClose}
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* 分頁導覽列 (Tabs) */}
        <div className="modal-tab-nav">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            <span className="tab-step-badge">1</span>
            <span>基本與聯絡人</span>
            {(errors.name || errors.contactPerson) && <span className="tab-error-dot">●</span>}
          </button>

          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <span className="tab-step-badge">2</span>
            <span>公司與通訊</span>
            {errors.taxId && <span className="tab-error-dot">●</span>}
          </button>

          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'requirement' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirement')}
          >
            <span className="tab-step-badge">3</span>
            <span>需求與概要</span>
          </button>
        </div>

        {/* 分頁表單內容區 (高度精巧無滾動) */}
        <form onSubmit={handleSubmit} noValidate className="tab-modal-form">
          <div className="tab-content-area">
            {/* 分頁 1: 基本與聯絡人 */}
            {activeTab === 'basic' && (
              <div className="tab-pane">
                <div className="form-grid-2">
                  <TextField
                    id="client-name"
                    label="客戶 / 單位名稱"
                    required
                    value={name}
                    error={errors.name}
                    placeholder="例如：張先生、台元半導體"
                    onChange={(e) => setName(e.target.value)}
                  />

                  <TextField
                    id="system-type"
                    label="預計開發系統類型 (選填)"
                    value={systemType}
                    placeholder="例如：IoT 物聯網監控、Web 平台"
                    onChange={(e) => setSystemType(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <TextField
                    id="contact-person"
                    label="主要聯絡人姓名"
                    required
                    value={contactPerson}
                    error={errors.contactPerson}
                    placeholder="請輸入主要聯絡人"
                    onChange={(e) => setContactPerson(e.target.value)}
                  />

                  <TextField
                    id="contact-phone"
                    label="聯絡人電話 (選填)"
                    value={contactPhone}
                    placeholder="如 0912-345-678"
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <TextField
                    id="contact-line-name"
                    label="LINE 名稱 (選填)"
                    value={lineName}
                    placeholder="例如：小陳 (顯示名稱 / 暱稱)"
                    onChange={(e) => setLineName(e.target.value)}
                  />

                  <TextField
                    id="contact-line-id"
                    label="LINE ID (選填)"
                    value={lineId}
                    placeholder="例如：chen_12345"
                    onChange={(e) => setLineId(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 分頁 2: 公司與通訊 */}
            {activeTab === 'company' && (
              <div className="tab-pane">
                <div className="form-grid-2">
                  <TextField
                    id="company-name"
                    label="公司登記全名 (選填)"
                    value={companyName}
                    placeholder="若無公司可留空"
                    onChange={(e) => setCompanyName(e.target.value)}
                  />

                  <TextField
                    id="tax-id"
                    label="統一編號 (選填，8碼)"
                    maxLength={8}
                    value={taxId}
                    error={errors.taxId}
                    placeholder="如 12345678"
                    onChange={(e) => setTaxId(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <TextField
                    id="company-phone"
                    label="公司代表號 (選填)"
                    value={companyPhone}
                    placeholder="如 02-27891234"
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />

                  <TextField
                    id="email-input"
                    type="email"
                    label="電子郵件 Email (選填)"
                    value={email}
                    placeholder="example@domain.com"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <TextField
                  id="address-input"
                  label="通訊 / 公司地址 (選填)"
                  value={address}
                  placeholder="如：台北市信義區松仁路 7 號 12 樓"
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}

            {/* 分頁 3: 需求與概要 */}
            {activeTab === 'requirement' && (
              <div className="tab-pane">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="req-summary" style={{ fontSize: '13px', marginBottom: '6px' }}>
                    客戶需求概要 / 專案構想 (選填)
                  </label>
                  <textarea
                    id="req-summary"
                    className="form-input"
                    rows={6}
                    value={requirementSummary}
                    placeholder="簡述客戶提出的系統構想、技術要求、時程期待或預算範圍，建檔後將自動作為首篇需求日誌..."
                    onChange={(e) => setRequirementSummary(e.target.value)}
                    style={{ resize: 'none', height: '160px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 底部操作切換與確認按鈕 */}
          <div className="tab-modal-footer">
            <Button
              variant="secondary"
              onClick={onClose}
              style={{ height: '36px', padding: '0 14px' }}
            >
              取消
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeTab !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === 'requirement' ? 'company' : 'basic')}
                  style={{ height: '36px', padding: '0 14px' }}
                >
                  上一步
                </Button>
              )}

              {activeTab !== 'requirement' ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActiveTab(activeTab === 'basic' ? 'company' : 'requirement')}
                  style={{ height: '36px', padding: '0 16px' }}
                >
                  下一步
                </Button>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                style={{ height: '36px', padding: '0 20px' }}
              >
                確認建立
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
