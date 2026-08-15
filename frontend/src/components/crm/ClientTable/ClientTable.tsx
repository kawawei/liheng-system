import React from 'react';
import { Client } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';

/**
 * @file ClientTable.tsx
 * @description 客戶資料表格組件 / Client Data Table Component
 * @description_en Renders the main client table list using specified CaaS components
 * @description_zh 負責渲染 CRM 客戶數據列表，採用指定組件庫之 Button 與 StatusBadge 組件
 */

interface ClientTableProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onSelectClient
}) => {
  return (
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
              onClick={() => onSelectClient(c)}
            >
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                {c.address && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TextIcon name="map-pin" size="sm" />
                    <span>{c.address}</span>
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
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TextIcon name="phone" size="sm" />
                  <span>{c.contactPhone}</span>
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
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClient(c);
                  }}
                >
                  <TextIcon name="clock" size="sm" />
                  <span>聯繫紀錄 ({c.logs?.length || 0})</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
