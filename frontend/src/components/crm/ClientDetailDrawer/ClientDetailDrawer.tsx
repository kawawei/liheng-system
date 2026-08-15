import React, { useState } from 'react';
import { Client, InteractionLog } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';
import { SelectField, SelectOption } from '../../input/SelectField';
import './ClientDetailDrawer.css';

/**
 * @file ClientDetailDrawer.tsx
 * @description 客戶詳情與聯繫時間軸 Drawer 組件 / Client Detail Drawer Component
 * @description_en Displays client metadata and interaction timeline using FB, IG, Threads, LINE, Phone
 * @description_zh 展示客戶詳細資訊與系統需求，支援 FB, IG, Threads, LINE, 電話聯繫紀錄
 */

interface ClientDetailDrawerProps {
  client: Client | null;
  onClose: () => void;
  onAddLog: (log: InteractionLog) => void;
}

const LOG_TYPE_OPTIONS: SelectOption[] = [
  { value: 'line', label: 'LINE 訊息', iconName: 'message' },
  { value: 'phone', label: '電話溝通', iconName: 'phone' },
  { value: 'fb', label: 'FB 私訊', iconName: 'fb' },
  { value: 'ig', label: 'IG 訊息', iconName: 'ig' },
  { value: 'threads', label: 'Threads 互動', iconName: 'threads' }
];

export const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({
  client,
  onClose,
  onAddLog
}) => {
  const [logType, setLogType] = useState<'line' | 'phone' | 'fb' | 'ig' | 'threads'>('line');
  const [logSummary, setLogSummary] = useState('');

  if (!client) return null;

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;

    const newLog: InteractionLog = {
      id: `log_${Date.now()}`,
      clientId: client.id,
      date: new Date().toLocaleString('zh-TW', { hour12: false }).replace(/\//g, '-'),
      type: logType,
      summary: logSummary.trim(),
      createdByName: '系統管理員'
    };

    onAddLog(newLog);
    setLogSummary('');
  };

  const getLogTypeTag = (type: InteractionLog['type']) => {
    switch (type) {
      case 'fb':
        return { label: 'FB 私訊', className: 'meeting', iconName: 'fb' as const };
      case 'ig':
        return { label: 'IG 訊息', className: 'email', iconName: 'ig' as const };
      case 'threads':
        return { label: 'Threads 互動', className: 'note', iconName: 'threads' as const };
      case 'phone':
        return { label: '電話溝通', className: 'phone', iconName: 'phone' as const };
      case 'line':
      default:
        return { label: 'LINE 訊息', className: 'line', iconName: 'message' as const };
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{client.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {client.companyName ? `公司: ${client.companyName}` : '無公司資訊'}
              {client.taxId ? ` (統編: ${client.taxId})` : ''}
            </div>
          </div>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}
            onClick={onClose}
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
                label={client.status === 'signed' ? '已簽約' : '潛在洽談'}
                variant={client.status === 'signed' ? 'success' : 'info'}
              />
            </div>

            <div className="client-detail-grid">
              <div className="client-detail-item">
                <span className="client-detail-label">聯絡人 / 電話</span>
                <span className="client-detail-value">
                  {client.contactPerson} ({client.contactPhone})
                </span>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">公司電話</span>
                <span className="client-detail-value">{client.companyPhone || '-'}</span>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">Email</span>
                <span className="client-detail-value">{client.email || '-'}</span>
              </div>
              <div className="client-detail-item">
                <span className="client-detail-label">預計開發系統</span>
                <span className="client-detail-value">
                  {client.systemType ? (
                    <span className="system-type-badge">{client.systemType}</span>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              {client.address && (
                <div className="client-detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="client-detail-label">地址</span>
                  <span className="client-detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TextIcon name="map-pin" size="sm" />
                    <span>{client.address}</span>
                  </span>
                </div>
              )}
            </div>

            {client.requirementSummary && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
                <span className="client-detail-label">需求概要描述：</span>
                <p style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px', lineHeight: 1.5 }}>
                  {client.requirementSummary}
                </p>
              </div>
            )}
          </div>

          {/* 新增聯繫紀錄表單 */}
          <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
              <TextIcon name="plus" size="sm" />
              <span>新增聯繫 / 拜訪紀錄</span>
            </div>
            <form onSubmit={handleAddLogSubmit}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <SelectField
                  options={LOG_TYPE_OPTIONS}
                  value={logType}
                  onChange={(v) => setLogType(v as any)}
                  style={{ width: '150px' }}
                />
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!logSummary.trim()}
                >
                  <TextIcon name="plus" size="sm" />
                  <span>新增紀錄</span>
                </Button>
              </div>
            </form>
          </div>

          {/* 聯繫歷史時間軸 */}
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>
            聯繫歷史時間軸 ({(client.logs || []).length})
          </div>

          {(!client.logs || client.logs.length === 0) ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
              尚無聯繫紀錄，歡迎於上方追加紀錄。
            </div>
          ) : (
            <div className="timeline-container">
              {client.logs.map((log) => {
                const tagInfo = getLogTypeTag(log.type);
                return (
                  <div key={log.id} className="timeline-item">
                    <div className={`timeline-dot ${tagInfo.className}`} />
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-type-tag">
                          <TextIcon name={tagInfo.iconName} size="sm" />
                          <span>{tagInfo.label}</span>
                        </span>
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
          <Button
            variant="secondary"
            onClick={onClose}
          >
            關閉
          </Button>
        </div>
      </div>
    </div>
  );
};
