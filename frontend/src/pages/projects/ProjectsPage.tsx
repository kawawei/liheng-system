import React from 'react';
import { Link } from 'react-router-dom';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Project } from '../../types';

/**
 * @file ProjectsPage.tsx
 * @description WBS 專案管理看板 / WBS Project Management Page
 * @description_en 7-stage lifecycle Kanban and project list
 * @description_zh 提供 7 大生命週期階段專案看板、進度條與健康狀態指示
 */

export const ProjectsPage: React.FC = () => {
  const projects: Project[] = [
    {
      id: 'pj_1',
      projectCode: 'PJ-20260814-0001',
      name: '利恒智慧工廠物聯網平台',
      clientId: 'cli_1',
      clientName: '台元半導體股份有限公司',
      stage: 'development',
      healthStatus: 'healthy',
      progressPercent: 65,
      assignedEngineers: ['張工程師', '李工程師'],
      startDate: '2026-08-01',
      deliveryDate: '2026-11-30'
    },
    {
      id: 'pj_2',
      projectCode: 'PJ-20260812-0002',
      name: '金融交易風控 AI 引擎',
      clientId: 'cli_2',
      clientName: '國泰證券資訊處',
      stage: 'testing',
      healthStatus: 'warning',
      progressPercent: 90,
      assignedEngineers: ['王架構師'],
      startDate: '2026-06-15',
      deliveryDate: '2026-08-30'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="projects" size="lg" />
            <span>專案管理 (WBS)</span>
          </h1>
          <p className="page-subtitle">7 大專案生命週期流轉、里程碑進度與工程協同</p>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>專案案號</th>
              <th>專案名稱</th>
              <th>客戶名稱</th>
              <th>生命週期階段</th>
              <th>專案進度</th>
              <th>健康指示</th>
              <th>指派工程師</th>
              <th>預計交付</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{p.projectCode}</td>
                <td style={{ fontWeight: 600 }}>
                  <Link to={`/projects/${p.id}`} style={{ color: 'var(--primary-600)' }}>
                    {p.name}
                  </Link>
                </td>
                <td>{p.clientName}</td>
                <td>
                  <StatusBadge
                    label={p.stage === 'development' ? '開發階段' : '測試驗收'}
                    variant="info"
                    icon="layers"
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.progressPercent}%`, height: '100%', backgroundColor: 'var(--primary-600)' }} />
                    </div>
                    <span style={{ fontSize: '12px' }}>{p.progressPercent}%</span>
                  </div>
                </td>
                <td>
                  <StatusBadge
                    label={p.healthStatus === 'healthy' ? '正常' : '警告'}
                    variant={p.healthStatus === 'healthy' ? 'success' : 'warning'}
                    icon={p.healthStatus === 'healthy' ? 'success' : 'warning'}
                  />
                </td>
                <td>{p.assignedEngineers.join(', ')}</td>
                <td>{p.deliveryDate}</td>
                <td>
                  <Link to={`/projects/${p.id}`} className="btn btn-secondary btn-sm">
                    進入工作台
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
