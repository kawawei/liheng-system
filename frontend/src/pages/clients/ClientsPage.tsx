import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Client } from '../../types';

/**
 * @file ClientsPage.tsx
 * @description CRM 客戶關係管理頁面 / CRM Clients Management Page
 * @description_en Clean form modals without placeholder data and 8-digit tax ID validation
 * @description_zh 提供客戶清冊檢視、篩選與乾淨新增彈窗 (無假資料且含 8 碼統編檢核)
 */

export const ClientsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [clients, setClients] = useState<Client[]>([
    {
      id: 'cli_1',
      companyName: '台元半導體股份有限公司',
      taxId: '12345678',
      contactPerson: '陳協理',
      phone: '02-27891234',
      email: 'chen@taiyuan.com',
      status: 'signed',
      createdAt: '2026-08-10'
    },
    {
      id: 'cli_2',
      companyName: '國泰證券資訊處',
      taxId: '87654321',
      contactPerson: '林經理',
      phone: '02-23456789',
      email: 'lin@cathay.com',
      status: 'signed',
      createdAt: '2026-08-12'
    }
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!companyName.trim()) newErrors.companyName = '請輸入公司名稱';
    if (taxId && !/^\d{8}$/.test(taxId)) newErrors.taxId = '統一編號必須為 8 碼數字';
    if (!contactPerson.trim()) newErrors.contactPerson = '請輸入聯絡人姓名';
    if (!phone.trim()) newErrors.phone = '請輸入電話號碼';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newClient: Client = {
      id: `cli_${Date.now()}`,
      companyName,
      taxId: taxId || undefined,
      contactPerson,
      phone,
      email: email || undefined,
      status: 'potential',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setClients([newClient, ...clients]);
    setShowModal(false);
    // 重設表單 / Reset form
    setCompanyName('');
    setTaxId('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setErrors({});
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="users" size="lg" />
            <span>客戶關係管理 (CRM)</span>
          </h1>
          <p className="page-subtitle">管理潛在商機、拜訪記錄與正式合作客戶</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <TextIcon name="plus" size="sm" />
          <span>新增客戶</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>公司名稱</th>
              <th>統一編號</th>
              <th>聯絡人</th>
              <th>聯絡電話</th>
              <th>電子郵件</th>
              <th>狀態</th>
              <th>建立日期</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.companyName}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.taxId || '-'}</td>
                <td>{c.contactPerson}</td>
                <td>{c.phone}</td>
                <td>{c.email || '-'}</td>
                <td>
                  <StatusBadge
                    label={c.status === 'signed' ? '已簽約' : '潛在洽談'}
                    variant={c.status === 'signed' ? 'success' : 'info'}
                  />
                </td>
                <td>{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增客戶彈窗 / New Client Modal (乾淨表單) */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header">
              <h2 className="card-title">新增客戶資料</h2>
            </div>

            <form onSubmit={handleSave} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="company-name">公司名稱 *</label>
                <input
                  id="company-name"
                  type="text"
                  className={`form-input ${errors.companyName ? 'is-invalid' : ''}`}
                  value={companyName}
                  placeholder="請輸入公司完整名稱"
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                {errors.companyName && <div className="form-error-msg">{errors.companyName}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tax-id">統一編號 (8 碼)</label>
                <input
                  id="tax-id"
                  type="text"
                  maxLength={8}
                  className={`form-input ${errors.taxId ? 'is-invalid' : ''}`}
                  value={taxId}
                  placeholder="如 12345678"
                  onChange={(e) => setTaxId(e.target.value)}
                />
                {errors.taxId && <div className="form-error-msg">{errors.taxId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-person">聯絡人 *</label>
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
                <label className="form-label" htmlFor="phone-input">電話號碼 *</label>
                <input
                  id="phone-input"
                  type="text"
                  className={`form-input ${errors.phone ? 'is-invalid' : ''}`}
                  value={phone}
                  placeholder="如 02-12345678"
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && <div className="form-error-msg">{errors.phone}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
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
      )}
    </div>
  );
};
