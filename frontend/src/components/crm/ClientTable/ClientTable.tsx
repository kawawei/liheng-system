/**
 * @file ClientTable.tsx
 * @description 客戶資料表格組件 / Client Data Table Component
 * @description_en Renders CRM client table with clean client status badges, project initiation action, edit, and delete
 * @description_zh 負責渲染 CRM 客戶數據列表，提供清晰之「合作狀態」標籤、「立案 / 新增專案」、「編輯」與「刪除」按鈕
 */

import React from 'react';
import { Client } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';

interface ClientTableProps {
  clients: Client[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
  onInitiateProject: (client: Client) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEditClient,
  onDeleteClient,
  onInitiateProject,
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
            <th style={{ width: '20%' }}>客戶 / 單位名稱</th>
            <th style={{ width: '13%' }}>需求系統類型</th>
            <th style={{ width: '15%' }}>聯絡人 / 電話</th>
            <th style={{ width: '16%' }}>公司名稱 / 統編</th>
            <th style={{ width: '12%' }}>合作狀態</th>
            <th style={{ width: '10%' }}>建立日期</th>
            <th style={{ width: '14%', textAlign: 'center' }}>操作</th>
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
                {/* 1. 客戶名稱與地址 */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  {c.address && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TextIcon name="map-pin" size="sm" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </td>

                {/* 2. 系統類型 */}
                <td>
                  {c.systemType ? (
                    <span className="system-type-badge">{c.systemType}</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>未指定</span>
                  )}
                </td>

                {/* 3. 聯絡人 */}
                <td>
                  <div style={{ fontWeight: 500 }}>{c.contactPerson}</div>
                  {c.contactPhone && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <TextIcon name="phone" size="sm" />
                      <span>{c.contactPhone}</span>
                    </div>
                  )}
                  {(c.lineName || c.lineId) && (
                    <div style={{ fontSize: '12px', color: '#059669', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '11px', background: '#ecfdf5', padding: '1px 4px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>LINE</span>
                      <span>
                        {c.lineName && c.lineId
                          ? `${c.lineName} (${c.lineId})`
                          : c.lineName || c.lineId}
                      </span>
                    </div>
                  )}
                  {!c.contactPhone && !c.lineName && !c.lineId && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>-</div>
                  )}
                </td>

                {/* 4. 公司名稱 / 統編 */}
                <td>
                  <div>{c.companyName || '-'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {c.taxId ? `統編: ${c.taxId}` : '無統編'}
                  </div>
                </td>

                {/* 5. 合作狀態標籤 (不顯示專案進度膠囊，保持純淨) */}
                <td>
                  <StatusBadge
                    label={statusInfo.label}
                    variant={statusInfo.variant}
                  />
                </td>

                {/* 6. 建立日期 */}
                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.createdAt}</td>

                {/* 7. 操作按鈕 (立案 / 編輯 / 刪除) */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      title="為此客戶建立正式專案 (立案)"
                      onClick={() => onInitiateProject(c)}
                      style={{ padding: '6px 9px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <TextIcon name="plus" size="sm" />
                      <span style={{ fontSize: '12px' }}>立案</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      title="編輯客戶資料"
                      onClick={() => onEditClient(c)}
                      style={{ padding: '6px 8px' }}
                    >
                      <TextIcon name="edit" size="sm" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      title="刪除"
                      onClick={() => onDeleteClient(c.id, c.name)}
                      style={{ padding: '6px 8px' }}
                    >
                      <TextIcon name="trash" size="sm" />
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
