/**
 * @file ClientTable.tsx
 * @description 客戶資料表格組件 / Client Data Table Component
 * @description_en Renders CRM client table with multi-project status chips, direct navigation to project WBS, and project initiation actions
 * @description_zh 負責渲染 CRM 客戶數據列表，提供「合作狀態與多專案進度膠囊」、「立案 / 新增專案」、「編輯」與「刪除」按鈕
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, Project, ProjectStage } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { StatusBadge } from '../../status-badge/StatusBadge';
import { Button } from '../../button/Button';
import { MOCK_PROJECTS } from '../../../mock/projects.mock';

interface ClientTableProps {
  clients: Client[];
  projects?: Project[];
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string, clientName: string) => void;
  onInitiateProject: (client: Client) => void;
}

const STAGE_LABEL_MAP: Record<ProjectStage, { label: string; className: string }> = {
  development: { label: '開發中', className: 'development' },
  testing: { label: '測試驗證', className: 'testing' },
  delivery: { label: '交付驗收', className: 'delivery' },
  closed: { label: '正式結案', className: 'closed' },
  maintenance: { label: '保固維護', className: 'maintenance' },
};

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  projects = MOCK_PROJECTS,
  onEditClient,
  onDeleteClient,
  onInitiateProject,
}) => {
  const navigate = useNavigate();

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '18%' }}>客戶 / 單位名稱</th>
            <th style={{ width: '12%' }}>需求系統類型</th>
            <th style={{ width: '14%' }}>聯絡人 / 電話</th>
            <th style={{ width: '15%' }}>公司名稱 / 統編</th>
            <th style={{ width: '22%' }}>合作狀態與專案進度</th>
            <th style={{ width: '9%' }}>建立日期</th>
            <th style={{ width: '10%', textAlign: 'center' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            // 尋找名下關聯的所有專案
            const clientProjects = projects.filter(
              (p) =>
                p.clientId === c.id ||
                (c.companyName && p.clientName.includes(c.companyName)) ||
                p.clientName.includes(c.name)
            );

            const hasActiveProject = clientProjects.some((p) => p.stage !== 'closed');
            const hasProjects = clientProjects.length > 0;

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
                  <div>{c.contactPerson}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TextIcon name="phone" size="sm" />
                    <span>{c.contactPhone}</span>
                  </div>
                </td>

                {/* 4. 公司名稱 / 統編 */}
                <td>
                  <div>{c.companyName || '-'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {c.taxId ? `統編: ${c.taxId}` : '無統編'}
                  </div>
                </td>

                {/* 5. 合作狀態與專案進度膠囊 (支援點擊直接穿透跳轉專案) */}
                <td>
                  <div className="crm-status-group" onClick={(e) => e.stopPropagation()}>
                    {!hasProjects ? (
                      <StatusBadge label="洽談中 (尚無專案)" variant="warning" />
                    ) : (
                      <>
                        <StatusBadge
                          label={hasActiveProject ? `合作中 (共 ${clientProjects.length} 專案)` : `已交付 (共 ${clientProjects.length} 專案)`}
                          variant={hasActiveProject ? 'success' : 'neutral'}
                        />
                        <div className="crm-projects-list">
                          {clientProjects.map((p) => {
                            const stageInfo = STAGE_LABEL_MAP[p.stage] || { label: p.stage, className: 'development' };
                            return (
                              <div
                                key={p.id}
                                className="crm-project-chip"
                                title={`點擊直接前往「${p.name}」WBS 工作台`}
                                onClick={() => navigate(`/projects/${p.id}?tab=milestones`)}
                              >
                                <span>🏷️ {p.name}</span>
                                <span className={`crm-project-chip-stage ${stageInfo.className}`}>
                                  {stageInfo.label} {p.progressPercent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </td>

                {/* 6. 建立日期 */}
                <td style={{ fontFamily: 'var(--font-mono)' }}>{c.createdAt}</td>

                {/* 7. 操作按鈕 (立案 / 編輯 / 刪除) */}
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      title={hasProjects ? '為此客戶新增專案 (立案)' : '為此客戶首次立案'}
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
