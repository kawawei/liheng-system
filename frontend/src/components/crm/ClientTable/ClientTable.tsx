/**
 * @file ClientTable.tsx
 * @description 客戶資料表格組件 / Client Data Table Component
 * @description_en Renders CRM client table with separated columns for contact, phone, company, tax ID, and larger status text
 * @description_zh 負責渲染 CRM 客戶數據列表，分開獨立呈現聯絡人、電話/LINE、公司名稱與統一編號欄位，支援水平滑動與加大狀態/立案字體
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
      <table className="data-table" style={{ minWidth: '1180px' }}>
        <thead>
          <tr>
            <th style={{ width: '16%' }}>客戶 / 單位名稱</th>
            <th style={{ width: '13%' }}>需求系統類型</th>
            <th style={{ width: '10%' }}>聯絡人</th>
            <th style={{ width: '15%' }}>電話 / LINE</th>
            <th style={{ width: '13%' }}>公司名稱</th>
            <th style={{ width: '9%' }}>統一編號</th>
            <th style={{ width: '9%', textAlign: 'center' }}>合作狀態</th>
            <th style={{ width: '8%' }}>建立日期</th>
            <th style={{ width: '11%', textAlign: 'center' }}>操作</th>
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
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{c.name}</div>
                  {c.address && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TextIcon name="map-pin" size="sm" />
                      <span>{c.address}</span>
                    </div>
                  )}
                </td>

                {/* 2. 系統類型 */}
                <td>
                  {c.systemType ? (
                    <span className="system-type-badge" style={{ fontSize: '12.5px', padding: '3px 8px' }}>{c.systemType}</span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>未指定</span>
                  )}
                </td>

                {/* 3. 聯絡人姓名 (獨立欄位) */}
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {c.contactPerson || '-'}
                  </div>
                </td>

                {/* 4. 電話與 LINE (獨立欄位) */}
                <td>
                  {c.contactPhone && (
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TextIcon name="phone" size="sm" />
                      <span>{c.contactPhone}</span>
                    </div>
                  )}
                  {(c.lineName || c.lineId) && (
                    <div style={{ fontSize: '12.5px', color: '#059669', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: c.contactPhone ? '3px' : '0' }}>
                      <span style={{ fontWeight: 700, fontSize: '11px', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>LINE</span>
                      <span>
                        {c.lineName && c.lineId
                          ? `${c.lineName} (${c.lineId})`
                          : c.lineName || c.lineId}
                      </span>
                    </div>
                  )}
                  {!c.contactPhone && !c.lineName && !c.lineId && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>-</span>
                  )}
                </td>

                {/* 5. 公司名稱 (獨立欄位) */}
                <td>
                  <div style={{ fontSize: '13.5px', color: c.companyName ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {c.companyName || '-'}
                  </div>
                </td>

                {/* 6. 統一編號 (獨立欄位) */}
                <td>
                  <div style={{ fontSize: '13px', color: c.taxId ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {c.taxId || '-'}
                  </div>
                </td>

                {/* 7. 合作狀態標籤 (放大文字，視覺醒目) */}
                <td style={{ textAlign: 'center' }}>
                  <StatusBadge
                    label={statusInfo.label}
                    variant={statusInfo.variant}
                  />
                </td>

                {/* 8. 建立日期 */}
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {c.createdAt}
                </td>

                {/* 9. 操作按鈕 (立案 / 編輯 / 刪除) */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      title="為此客戶建立正式專案 (立案)"
                      onClick={() => onInitiateProject(c)}
                      style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <TextIcon name="plus" size="sm" />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, letterSpacing: '0.5px' }}>立案</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      title="編輯客戶資料"
                      onClick={() => onEditClient(c)}
                      style={{ padding: '6px 9px' }}
                    >
                      <TextIcon name="edit" size="sm" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      title="刪除客戶"
                      onClick={() => onDeleteClient(c.id, c.name)}
                      style={{ padding: '6px 9px' }}
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
