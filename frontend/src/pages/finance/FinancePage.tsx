import React, { useState } from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Receivable } from '../../types';
import { useAuth } from '../../hooks/useAuth';

/**
 * @file FinancePage.tsx
 * @description 財務收支與多階段收款頁面 / Finance & Multi-Stage Receivables Page
 * @description_en Multi-stage invoicing, bank reconciliation, and RBAC guard
 * @description_zh 專屬超級管理員存取之財務模組，提供多階段收款期程、發票開立與毛利核銷
 */

export const FinancePage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  const [receivables] = useState<Receivable[]>([
    {
      id: 'rec_1',
      receiptCode: 'REC-20260814-0001',
      projectId: 'pj_1',
      projectName: '利恒智慧工廠物聯網平台',
      stageName: '第一期：簽約款 (30%)',
      amount: 315000,
      invoiceNumber: 'AB-12345678',
      bankAccount: '台北富邦銀行 (012-123456789012)',
      status: 'received',
      dueDate: '2026-08-20',
      receivedAt: '2026-08-14'
    },
    {
      id: 'rec_2',
      receiptCode: 'REC-20260814-0002',
      projectId: 'pj_1',
      projectName: '利恒智慧工廠物聯網平台',
      stageName: '第二期：交付款 (40%)',
      amount: 420000,
      status: 'pending',
      dueDate: '2026-10-15'
    }
  ]);

  if (!isSuperAdmin) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <TextIcon name="warning" size="lg" color="#b91c1c" />
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '12px', color: '#b91c1c' }}>
          權限不足 (403 Forbidden)
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          財務收支模組僅限「超級管理員」角色存取。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="finance" size="lg" />
            <span>財務收支與多階段收款</span>
          </h1>
          <p className="page-subtitle">多階段收款發號 (REC)、發票開立、銀行入帳核銷與毛利計算</p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => alert('已匯出 Excel 財務報表 (範例展示)')}
        >
          <TextIcon name="file-check" size="sm" />
          <span>匯出財務總表 (Excel)</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">多階段收款清冊</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>收款單號</th>
                <th>關聯專案</th>
                <th>期程階段</th>
                <th>應收金額</th>
                <th>發票號碼</th>
                <th>入帳帳戶</th>
                <th>狀態</th>
                <th>到期日期</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.receiptCode}</td>
                  <td>{r.projectName}</td>
                  <td>{r.stageName}</td>
                  <td style={{ fontWeight: 600 }}>NT$ {r.amount.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.invoiceNumber || '-'}</td>
                  <td>{r.bankAccount || '-'}</td>
                  <td>
                    <StatusBadge
                      label={r.status === 'received' ? '已入帳核銷' : '待請款'}
                      variant={r.status === 'received' ? 'success' : 'warning'}
                      icon={r.status === 'received' ? 'success' : 'clock'}
                    />
                  </td>
                  <td>{r.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
