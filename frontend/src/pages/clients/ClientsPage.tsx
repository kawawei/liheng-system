import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Client, InteractionLog } from '../../types';
import './ClientsPage.css';

/**
 * @file ClientsPage.tsx
 * @description CRM 客戶關係管理頁面 / CRM Clients Management Page
 * @description_en Flexible client management, optional company/tax ID/address fields, and interactive contact timeline
 * @description_zh 提供彈性客戶資料維護 (名稱在前、公司統編與地址選填)、潛在需求概要紀錄與聯繫歷史時間軸
 */

const PRESET_SYSTEM_TYPES = [
  'Web 管理系統',
  'iOS / Android App',
  'POS 軟硬體整合',
  'E-Commerce 電商平台',
  'IoT 物聯網監控',
  '其他專案'
];

export const ClientsPage: React.FC = () => {
  // Modal 與 Drawer 狀態 / Modal & Drawer state
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // 新增客戶表單欄位 / New client form fields
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

  // 新增聯繫紀錄欄位 / New log fields
  const [logType, setLogType] = useState<'phone' | 'meeting' | 'line' | 'email' | 'note'>('phone');
  const [logSummary, setLogSummary] = useState('');

  // 初始客戶清單 (含示範潛在商機與歷史紀錄) / Pre-populated client data
  const [clients, setClients] = useState<Client[]>([
    {
      id: 'cli_1',
      name: '台元半導體',
      companyName: '台元半導體股份有限公司',
      taxId: '12345678',
      contactPerson: '陳協理',
      contactPhone: '0912-345-678',
      companyPhone: '02-27891234',
      email: 'chen@taiyuan.com',
      address: '新竹縣竹北市台元街 26 號 5 樓',
      systemType: 'IoT 物聯網監控',
      requirementSummary: '需求晶圓機台即時監控系統，需整合 PLC 數據傳送與看板大螢幕展示。',
      status: 'signed',
      createdAt: '2026-08-10',
      logs: [
        {
          id: 'log_1',
          clientId: 'cli_1',
          date: '2026-08-10 14:30',
          type: 'meeting',
          summary: '完成合約簽署與專案啟動會議，確認一期驗收目標與架構細節。',
          createdByName: '陳專案經理'
        },
        {
          id: 'log_2',
          clientId: 'cli_1',
          date: '2026-08-05 10:00',
          type: 'phone',
          summary: '致電討論研發範疇，客戶提出需要支援手機端即時警示 Push Notification。',
          createdByName: '林業務代表'
        }
      ]
    },
    {
      id: 'cli_2',
      name: '國泰證券資訊處',
      companyName: '國泰證券股份有限公司',
      taxId: '87654321',
      contactPerson: '林經理',
      contactPhone: '0988-765-432',
      companyPhone: '02-23456789',
      email: 'lin@cathay.com',
      address: '台北市信義區松仁路 7 號 12 樓',
      systemType: 'Web 管理系統',
      requirementSummary: '內部交易對帳與自動報表產生系統，希望改善原本 Excel 人工作業。',
      status: 'signed',
      createdAt: '2026-08-12',
      logs: [
        {
          id: 'log_3',
          clientId: 'cli_2',
          date: '2026-08-12 11:00',
          type: 'meeting',
          summary: '首次訪談簡報，展示既有金融對帳案例，客戶對數據可視化表達滿意。',
          createdByName: '王總經理'
        }
      ]
    },
    {
      id: 'cli_3',
      name: '張先生 (個人工作室)',
      contactPerson: '張大明',
      contactPhone: '0933-111-222',
      email: 'chang@studio.io',
      address: '台中市西區台灣大道二段 100 號',
      systemType: 'POS 軟硬體整合',
      requirementSummary: '想開一家獨立咖啡店，需要小型 iPad POS 點餐系統與藍芽出單機連動。',
      status: 'potential',
      createdAt: '2026-08-14',
      logs: [
        {
          id: 'log_4',
          clientId: 'cli_3',
          date: '2026-08-14 16:20',
          type: 'line',
          summary: '加 LINE 諮詢出單機支援型號與菜單模組功能，已發送初步報價清單。',
          createdByName: '張專案專員'
        }
      ]
    }
  ]);

  // ========================================
  // 表單驗證與建立處理 / Save Handler
  // ========================================
  const handleSave = (e: React.FormEvent) => {
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

    setClients([newClient, ...clients]);
    setShowModal(false);
    resetForm();
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

  // ========================================
  // 新增聯繫歷史紀錄 / Add Interaction Log
  // ========================================
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !logSummary.trim()) return;

    const newLog: InteractionLog = {
      id: `log_${Date.now()}`,
      clientId: selectedClient.id,
      date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
      type: logType,
      summary: logSummary.trim(),
      createdByName: '系統管理員'
    };

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
    setLogSummary('');
  };

  const getLogTypeTag = (type: InteractionLog['type']) => {
    switch (type) {
      case 'phone':
        return { label: '電話溝通', className: 'phone' };
      case 'meeting':
        return { label: '會議拜訪', className: 'meeting' };
      case 'line':
        return { label: 'LINE / 訊息', className: 'line' };
      case 'email':
        return { label: 'Email 往來', className: 'email' };
      case 'note':
      default:
        return { label: '需求備忘', className: 'note' };
    }
  };

  return (
    <div>
      {/* 標頭與功能按鈕 / Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="users" size="lg" />
            <span>客戶關係管理 (CRM)</span>
          </h1>
          <p className="page-subtitle">管理客戶聯絡資訊、系統開發需求概要與拜訪聯繫時間軸</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <TextIcon name="plus" size="sm" />
          <span>新增客戶</span>
        </button>
      </div>

      {/* 客戶列表 / Client Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>客戶 / 單位名稱</th>
              <th>需求系統類型</th>
              <th>聯絡人 / 電話</th>
              <th>公司名稱 / 統編</th>
              <th>狀態</th>
              <th>建立日期</th>
              <th>操作 / 聯繫歷史</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedClient(c)}
              >
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  {c.address && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 {c.address}
                    </div>
                  )}
                </td>
                <td>
                  {c.systemType ? (
                    <span className="system-type-badge">{c.systemType}</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>未指定</span>
                  )}
                </td>
                <td>
                  <div>{c.contactPerson}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    📞 {c.contactPhone}
                  </div>
                </td>
                <td>
                  <div>{c.companyName || '-'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {c.taxId ? `統編: ${c.taxId}` : '無統編'}
                  </div>
                </td>
                <td>
                  <StatusBadge
                    label={c.status === 'signed' ? '已簽約' : '潛在洽談'}
                    variant={c.status === 'signed' ? 'success' : 'info'}
                  />
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.createdAt}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(c);
                    }}
                  >
                    <TextIcon name="clock" size="sm" />
                    <span>聯繫紀錄 ({c.logs?.length || 0})</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新增客戶彈窗 / New Client Modal */}
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
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header">
              <h2 className="card-title">新增客戶資料</h2>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} noValidate>
              {/* 1. 客戶名稱（放在最前） */}
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

              {/* 2. 聯絡人雙欄 */}
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

              {/* 3. 公司名稱與統編（選填） */}
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

              {/* 4. 公司電話、Email、地址（選填） */}
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

      {/* 客戶詳情與聯繫歷史時間軸 Drawer / Client Detail Drawer */}
      {selectedClient && (
        <div className="drawer-backdrop" onClick={() => setSelectedClient(null)}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">{selectedClient.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {selectedClient.companyName ? `公司: ${selectedClient.companyName}` : '無公司資訊'}
                  {selectedClient.taxId ? ` (統編: ${selectedClient.taxId})` : ''}
                </div>
              </div>
              <button
                type="button"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
                onClick={() => setSelectedClient(null)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-body">
              {/* 客戶概況資訊卡 */}
              <div className="client-detail-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>客戶基本資料與需求</span>
                  <StatusBadge
                    label={selectedClient.status === 'signed' ? '已簽約' : '潛在洽談'}
                    variant={selectedClient.status === 'signed' ? 'success' : 'info'}
                  />
                </div>

                <div className="client-detail-grid">
                  <div className="client-detail-item">
                    <span className="client-detail-label">聯絡人 / 電話</span>
                    <span className="client-detail-value">
                      {selectedClient.contactPerson} ({selectedClient.contactPhone})
                    </span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">公司電話</span>
                    <span className="client-detail-value">{selectedClient.companyPhone || '-'}</span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">Email</span>
                    <span className="client-detail-value">{selectedClient.email || '-'}</span>
                  </div>
                  <div className="client-detail-item">
                    <span className="client-detail-label">預計開發系統</span>
                    <span className="client-detail-value">
                      {selectedClient.systemType ? (
                        <span className="system-type-badge">{selectedClient.systemType}</span>
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                  {selectedClient.address && (
                    <div className="client-detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="client-detail-label">地址</span>
                      <span className="client-detail-value">📍 {selectedClient.address}</span>
                    </div>
                  )}
                </div>

                {selectedClient.requirementSummary && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                    <span className="client-detail-label">需求概要描述：</span>
                    <p style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px', lineHeight: 1.5 }}>
                      {selectedClient.requirementSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* 新增聯繫紀錄表單 */}
              <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
                  + 新增聯繫 / 拜訪紀錄
                </div>
                <form onSubmit={handleAddLog}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <select
                      className="form-input"
                      style={{ width: '130px', fontSize: '13px' }}
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as any)}
                    >
                      <option value="phone">📞 電話溝通</option>
                      <option value="meeting">🤝 會議拜訪</option>
                      <option value="line">💬 LINE / 訊息</option>
                      <option value="email">✉️ Email 往來</option>
                      <option value="note">📝 需求備忘</option>
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, fontSize: '13px' }}
                      placeholder="輸入聯繫紀要重點..."
                      value={logSummary}
                      onChange={(e) => setLogSummary(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      disabled={!logSummary.trim()}
                    >
                      新增紀錄
                    </button>
                  </div>
                </form>
              </div>

              {/* 聯繫歷史時間軸 */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                聯繫歷史時間軸 ({(selectedClient.logs || []).length})
              </div>

              {(!selectedClient.logs || selectedClient.logs.length === 0) ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                  尚無聯繫紀錄，歡迎於上方追加紀錄。
                </div>
              ) : (
                <div className="timeline-container">
                  {selectedClient.logs.map((log) => {
                    const tagInfo = getLogTypeTag(log.type);
                    return (
                      <div key={log.id} className="timeline-item">
                        <div className={`timeline-dot ${tagInfo.className}`} />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-type-tag">{tagInfo.label}</span>
                            <span className="timeline-date">{log.date}</span>
                          </div>
                          <div className="timeline-summary">{log.summary}</div>
                          <div className="timeline-author">記錄人: {log.createdByName}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedClient(null)}
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
