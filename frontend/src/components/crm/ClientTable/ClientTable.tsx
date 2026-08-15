import React from 'react';
import { Client } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';

/**
 * @file ClientTable.tsx
 * @description 客戶資料表格組件 / Client Data Table Component
 * @description_en Renders client table with Edit and Delete actions
 * @description_zh 負責渲染 CRM 客戶數據列表，提供「編輯」與紅色警示「刪除」按鈕
 */

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEditClient,
  onDeleteClient
}) => {
  const getStatusInfo = (status: Client['status']) => {
    switch (status) {
      case 'pending':
        return { label: '待洽談', variant: 'info' as const };
      case 'negotiating':
        return { label: '洽談中', variant: 'warning' as const };
      case 'pending_signature':
        return { label: '待簽約', variant: 'info' as const };
      case 'in_cooperation':
        return { label: '合作中', variant: 'success' as const };
      case 'delivered':
        return { label: '已交付', variant: 'success' as const };
      case 'lost':
      default:
        return { label: '未成交', variant: 'neutral' as const };
    }
  };

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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const statusInfo = getStatusInfo(c.status);
            return (
              <tr
                key={c.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onEditClient(c)}
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
                    label={statusInfo.label}
                    variant={statusInfo.variant}
                  />
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.createdAt}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEditClient(c)}
                    >
                      <TextIcon name="file-check" size="sm" />
                      <span>編輯</span>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeleteClient(c.id, c.name)}
                    >
                      <TextIcon name="trash" size="sm" />
                      <span>刪除</span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
