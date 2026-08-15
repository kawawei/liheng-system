import React, { useState } from 'react';
import { Client } from '../../../types';
import './ClientFormModal.css';

/**
 * @file ClientFormModal.tsx
 * @description 新增客戶資料彈窗組件 / Client Form Modal Component
 * @description_en Handles creation form with optional company/tax ID/address fields and system type tags
 * @description_zh 處理新增客戶表單，支援名稱首位、公司與統編地址選填以及預計開發系統標籤
 */

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
}

const PRESET_SYSTEM_TYPES = [
  'Web 管理系統',
  'iOS / Android App',
  'POS 軟硬體整合',
  'E-Commerce 電商平台',
  'IoT 物聯網監控',
  '其他專案'
];

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [systemType, setSystemType] = useState('');
  const [requirementSummary, setRequirementSummary] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      taxId: taxId.trim() || undefined,
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      companyPhone: companyPhone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      systemType: systemType.trim() || undefined,
      requirementSummary: requirementSummary.trim() || undefined,
      status: 'potential',
      createdAt: new Date().toISOString().split('T')[0],
      logs: requirementSummary.trim()
        ? [
            {
              id: `log_${Date.now()}`,
              clientId: `cli_${Date.now()}`,
              date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
              type: 'note',
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
    setName('');
    setContactPerson('');
    setContactPhone('');
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
      <div className="card modal-card">
        <div className="card-header">
          <h2 className="card-title">新增客戶資料</h2>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 1. 客戶名稱 (放在最首位) */}
          <div className="form-group">
            <label className="form-label" htmlFor="client-name">客戶 / 單位名稱 *</label>
            <input
              id="client-name"
              type="text"
              className={`form-input ${errors.name ? 'is-invalid' : ''}`}
              value={name}
              placeholder="例如：張先生、台元半導體、某某團隊"
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="form-error-msg">{errors.name}</div>}
          </div>

          {/* 2. 聯絡人雙欄 (必填) */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="contact-person">聯絡人姓名 *</label>
              <input
                id="contact-person"
                type="text"
                className={`form-input ${errors.contactPerson ? 'is-invalid' : ''}`}
                value={contactPerson}
                placeholder="請輸入主要聯絡人"
                onChange={(e) => setContactPerson(e.target.value)}
              />
              {errors.contactPerson && <div className="form-error-msg">{errors.contactPerson}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contact-phone">聯絡人電話 *</label>
              <input
                id="contact-phone"
                type="text"
                className={`form-input ${errors.contactPhone ? 'is-invalid' : ''}`}
                value={contactPhone}
                placeholder="如 0912-345-678"
                onChange={(e) => setContactPhone(e.target.value)}
              />
              {errors.contactPhone && <div className="form-error-msg">{errors.contactPhone}</div>}
            </div>
          </div>

          {/* 3. 公司名稱與統編 (選填) */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="company-name">公司名稱 (選填)</label>
              <input
                id="company-name"
                type="text"
                className="form-input"
                value={companyName}
                placeholder="若無公司可留空"
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tax-id">統一編號 (選填，8碼)</label>
              <input
                id="tax-id"
                type="text"
                maxLength={8}
                className={`form-input ${errors.taxId ? 'is-invalid' : ''}`}
                value={taxId}
                placeholder="如 12345678 (選填)"
                onChange={(e) => setTaxId(e.target.value)}
              />
              {errors.taxId && <div className="form-error-msg">{errors.taxId}</div>}
            </div>
          </div>

          {/* 4. 公司電話、Email、地址 (選填) */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="company-phone">公司電話 (選填)</label>
              <input
                id="company-phone"
                type="text"
                className="form-input"
                value={companyPhone}
                placeholder="如 02-27891234 (選填)"
                onChange={(e) => setCompanyPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email-input">電子郵件 Email (選填)</label>
              <input
                id="email-input"
                type="email"
                className="form-input"
                value={email}
                placeholder="example@domain.com (選填)"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address-input">地址 (選填)</label>
            <input
              id="address-input"
              type="text"
              className="form-input"
              value={address}
              placeholder="如：台北市信義區松仁路 7 號 12 樓 (選填)"
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* 5. 需求系統類型與概要 */}
          <div className="form-group">
            <label className="form-label" htmlFor="system-type">預計開發系統類型 (選填)</label>
            <input
              id="system-type"
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
            <label className="form-label" htmlFor="req-summary">客戶需求概要 / 專案構想 (選填)</label>
            <textarea
              id="req-summary"
              className="form-input"
              rows={3}
              value={requirementSummary}
              placeholder="簡述客戶做什麼樣的系統、主要功能構想或預算範圍..."
              onChange={(e) => setRequirementSummary(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              確認建立
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
