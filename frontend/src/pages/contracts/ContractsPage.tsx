import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Contract } from '../../types';

/**
 * @file ContractsPage.tsx
 * @description 合約與報價單管理 / Contracts & Quotations Page
 * @description_en Real-time 5% business tax calculation and Redis code generation preview
 * @description_zh 提供合約清冊、報價單建立與即時 5% 營業稅額自動計算
 */

export const ContractsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [amountUntaxed, setAmountUntaxed] = useState<number | ''>('');

  const [contracts] = useState<Contract[]>([
    {
      id: 'ct_1',
      contractCode: 'CT-20260814-0001',
      clientId: 'cli_1',
      clientName: '台元半導體股份有限公司',
      title: '智慧工廠物聯網平台開發契約',
      amountUntaxed: 1000000,
      taxAmount: 50000,
      amountTotal: 1050000,
      status: 'signed',
      signedAt: '2026-08-14',
      createdAt: '2026-08-14'
    }
  ]);

  // 5% 稅額即時計算 / Real-time 5% Tax Calculation
  const untaxedNum = typeof amountUntaxed === 'number' ? amountUntaxed : 0;
  const calculatedTax = Math.round(untaxedNum * 0.05);
  const calculatedTotal = untaxedNum + calculatedTax;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="contracts" size="lg" />
            <span>合約與報價單管理</span>
          </h1>
          <p className="page-subtitle">報價發號 (QT)、合約簽署 (CT) 與 5% 營業稅即時結算</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          <TextIcon name="plus" size="sm" />
          <span>建立報價/合約</span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>合約單號</th>
              <th>合約名稱</th>
              <th>客戶名稱</th>
              <th>未稅金額</th>
              <th>營業稅 (5%)</th>
              <th>含稅總額</th>
              <th>狀態</th>
              <th>建立日期</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.contractCode}</td>
                <td>{c.title}</td>
                <td>{c.clientName}</td>
                <td>NT$ {c.amountUntaxed.toLocaleString()}</td>
                <td>NT$ {c.taxAmount.toLocaleString()}</td>
                <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                  NT$ {c.amountTotal.toLocaleString()}
                </td>
                <td>
                  <StatusBadge label="已簽署" variant="success" icon="file-check" />
                </td>
                <td>{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 建立合約彈窗 (含 5% 稅額即時試算) */}
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
          <div className="card" style={{ width: '100%', maxWidth: '520px' }}>
            <div className="card-header">
              <h2 className="card-title">建立報價單 / 合約</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowModal(false);
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="contract-title">合約/報價名稱 *</label>
                <input
                  id="contract-title"
                  type="text"
                  className="form-input"
                  placeholder="如 企業官網與後台系統開發合約"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contract-client">客戶名稱 *</label>
                <input
                  id="contract-client"
                  type="text"
                  className="form-input"
                  placeholder="請輸入客戶名稱"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="untaxed-amount">未稅金額 (NT$) *</label>
                <input
                  id="untaxed-amount"
                  type="number"
                  className="form-input"
                  placeholder="請輸入未稅金額 (如 100000)"
                  value={amountUntaxed}
                  onChange={(e) => setAmountUntaxed(e.target.value ? Number(e.target.value) : '')}
                  required
                />
              </div>

              {/* 5% 稅額試算結果 / Calculation Summary */}
              <div
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginTop: '16px',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>營業稅額 (5%)：</span>
                  <span style={{ fontWeight: 600 }}>NT$ {calculatedTax.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ fontWeight: 600 }}>含稅總金額：</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-700)', fontSize: '15px' }}>
                    NT$ {calculatedTotal.toLocaleString()}
                  </span>
                </div>
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
                  確認發號與建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
