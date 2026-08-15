import React, { useState } from 'react';
import { Client, InteractionLog } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';
import './ClientDetailDrawer.css';

/**
 * @file ClientDetailDrawer.tsx
 * @description 客戶詳情與聯繫時間軸 Drawer 組件 / Client Detail Drawer Component
 * @description_en Displays client metadata, requirement summary, and vertical interaction timeline using specified CaaS components
 * @description_zh 展示客戶詳細資訊與系統需求，並使用指定組件庫 Button 處理聯繫歷史時間軸互動
 */

interface ClientDetailDrawerProps {
  client: Client | null;
  onClose: () => void;
  onAddLog: (log: InteractionLog) => void;
}

export const ClientDetailDrawer: React.FC<ClientDetailDrawerProps> = ({
  client,
  onClose,
  onAddLog
}) => {
  const [logType, setLogType] = useState<'phone' | 'meeting' | 'line' | 'email' | 'note'>('phone');
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
      case 'phone':
        return { label: '電話溝通', className: 'phone', iconName: 'phone' as const };
      case 'meeting':
        return { label: '會議拜訪', className: 'meeting', iconName: 'users' as const };
      case 'line':
        return { label: 'LINE / 訊息', className: 'line', iconName: 'message' as const };
      case 'email':
        return { label: 'Email 往來', className: 'email', iconName: 'mail' as const };
      case 'note':
      default:
        return { label: '需求備忘', className: 'note', iconName: 'file-check' as const };
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
          <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TextIcon name="plus" size="sm" />
              <span>新增聯繫 / 拜訪紀錄</span>
            </div>
            <form onSubmit={handleAddLogSubmit}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  className="form-input"
                  style={{ width: '140px', fontSize: '13px' }}
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as any)}
                >
                  <option value="phone">電話溝通</option>
                  <option value="meeting">會議拜訪</option>
                  <option value="line">LINE / 訊息</option>
                  <option value="email">Email 往來</option>
                  <option value="note">需求備忘</option>
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!logSummary.trim()}
                >
                  新增紀錄
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
