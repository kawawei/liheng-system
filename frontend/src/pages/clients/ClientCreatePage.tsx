/**
 * @file ClientCreatePage.tsx
 * @description 新增客戶獨立分頁組件 / Client Creation Full Page Component
 * @description_en Full-page view for creating CRM client records with structured sections
 * @description_zh 獨立全頁面客戶建檔視圖，具備結構化分區、完整的格式檢驗與非必填 LINE 名稱/ID 支援
 */

import React, { useState } from 'react';
import { message } from '@kawawei/frontend-modules';
import { Client } from '../../types';
import { Button } from '../../components/button/Button';
import { TextField } from '../../components/input/TextField';
import { TextIcon } from '../../components/icon/TextIcon';
import { clientService } from '../../services/client.service';
import './ClientCreatePage.css';

interface ClientCreatePageProps {
  onBack: () => void;
  onClientCreated: (client: Client) => void;
}

export const ClientCreatePage: React.FC<ClientCreatePageProps> = ({
  onBack,
  onClientCreated
}) => {
  const [submitting, setSubmitting] = useState(false);

  // 表單資料狀態
  const [name, setName] = useState('');
  const [systemType, setSystemType] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [lineName, setLineName] = useState('');
  const [lineId, setLineId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [requirementSummary, setRequirementSummary] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = '請輸入客戶 / 單位名稱';
    if (!contactPerson.trim()) errs.contactPerson = '請輸入主要聯絡人姓名';

    if (taxId.trim() && !/^\d{8}$/.test(taxId.trim())) {
      errs.taxId = '統一編號如欲填寫，必須為 8 位數字';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = '請輸入有效的 Email 電子郵件格式';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      message.error('請檢查表單必填項目與格式');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Client> = {
        name: name.trim(),
        systemType: systemType.trim() || undefined,
        contactPerson: contactPerson.trim(),
        contactPhone: contactPhone.trim() || undefined,
        lineName: lineName.trim() || undefined,
        lineId: lineId.trim() || undefined,
        companyName: companyName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        companyPhone: companyPhone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        requirementSummary: requirementSummary.trim() || undefined,
        status: 'pending'
      };

      const created = await clientService.createClient(payload);
      message.success(`客戶「${created.name}」建檔成功！`);
      onClientCreated(created);
    } catch (err: any) {
      console.error('Failed to create client:', err);
      message.error(err.response?.data?.message || '新增客戶失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-create-page">
      {/* 頂部頁面標頭 / Page Header */}
      <div className="client-create-header">
        <div>
          <h1 className="client-create-title">新增客戶資料</h1>
          <p className="client-create-subtitle">建立新的 CRM 客戶資料、聯絡管道與初步專案需求概要</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TextIcon name="arrow-left" size="sm" />
            <span>返回客戶列表</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            disabled={submitting}
            onClick={handleSubmit}
            style={{ height: '38px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TextIcon name="save" size="sm" />
            <span>{submitting ? '建立中...' : '確認建立客戶'}</span>
          </Button>
        </div>
      </div>

      {/* 主體表單卡片 / Form Card */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="client-create-form-card">
          {/* 區塊 1: 核心資訊 */}
          <div className="client-create-section-title">
            <TextIcon name="building" size="sm" />
            <span>基本核心資訊</span>
          </div>

          <div className="form-grid-2">
            <TextField
              id="client-name"
              label="客戶 / 單位名稱"
              required
              value={name}
              error={errors.name}
              placeholder="例如：張先生、台元半導體、某某團隊"
              onChange={(e) => setName(e.target.value)}
            />

            <TextField
              id="system-type"
              label="預計開發系統類型 (選填)"
              value={systemType}
              placeholder="例如：IoT 物聯網監控、Web 管理系統、App 等..."
              onChange={(e) => setSystemType(e.target.value)}
            />
          </div>

          {/* 區塊 2: 聯絡人資訊 */}
          <div className="client-create-section-title">
            <TextIcon name="users" size="sm" />
            <span>主要聯絡人資訊</span>
          </div>

          <div className="form-grid-2">
            <TextField
              id="contact-person"
              label="主要聯絡人姓名"
              required
              value={contactPerson}
              error={errors.contactPerson}
              placeholder="請輸入主要聯絡人姓名"
              onChange={(e) => setContactPerson(e.target.value)}
            />

            <TextField
              id="contact-phone"
              label="行動電話 (選填)"
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

          {/* 區塊 3: 公司登記與稅務 */}
          <div className="client-create-section-title">
            <TextIcon name="contracts" size="sm" />
            <span>公司商業與通訊資訊</span>
          </div>

          <div className="form-grid-2">
            <TextField
              id="company-name"
              label="公司登記全名 (選填)"
              value={companyName}
              placeholder="若無公司或為個人案件可留空"
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
              placeholder="如 02-2789-1234"
              onChange={(e) => setCompanyPhone(e.target.value)}
            />

            <TextField
              id="email-input"
              type="email"
              label="電子郵件 Email (選填)"
              value={email}
              error={errors.email}
              placeholder="example@domain.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-grid-1">
            <TextField
              id="address-input"
              label="通訊 / 公司地址 (選填)"
              value={address}
              placeholder="例如：台北市信義區松仁路 7 號 12 樓"
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* 區塊 4: 需求構想與概要 */}
          <div className="client-create-section-title">
            <TextIcon name="contracts" size="sm" />
            <span>專案構想與需求描述 (選填)</span>
          </div>

          <div className="form-grid-1">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="requirement-summary" style={{ fontSize: '13px', marginBottom: '6px' }}>
                客戶需求概要 / 專案構想描述
              </label>
              <textarea
                id="requirement-summary"
                className="form-input"
                rows={4}
                value={requirementSummary}
                placeholder="簡述客戶提出的系統構想、功能期待、預算範圍或時程要求，建檔後將自動作為首篇需求紀錄..."
                onChange={(e) => setRequirementSummary(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
