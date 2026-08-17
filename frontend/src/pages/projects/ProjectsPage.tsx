import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { message } from '@kawawei/frontend-modules';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Button } from '../../components/button/Button';
import { Project, ProjectStage } from '../../types';
import { ProjectCreateModal } from '../../components/wbs/ProjectCreateModal';
import { projectService } from '../../services/project.service';

/**
 * @file ProjectsPage.tsx
 * @description WBS 專案管理看板 / WBS Project Management Page
 * @description_en 5-stage lifecycle Kanban and project list with chartering modal via backend API
 * @description_zh 提供 5 大生命週期階段專案看板、工期試算、多階段付款與簽約立案彈窗 (串接真實 API 與 @kawawei/frontend-modules 消息組件)
 */

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const stageMap: Record<ProjectStage, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
    development: { label: '開發中', variant: 'info' },
    testing: { label: '測試驗證', variant: 'warning' },
    delivery: { label: '交付驗收', variant: 'info' },
    maintenance: { label: '保固維護', variant: 'success' },
    closed: { label: '已結案', variant: 'neutral' }
  };

  // ========================================
  // 載入專案清單 / Fetch Projects List
  // ========================================
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      message.error(err.response?.data?.message || '載入專案資料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ========================================
  // 建立專案處理 / Create Project Handler
  // ========================================
  const handleCreateProject = async (newProjData: Omit<Project, 'id'>) => {
    try {
      const created = await projectService.createProject(newProjData);
      message.success(`專案「${created.name}」已成功立案！案號：${created.projectCode}`);
      setIsCreateModalOpen(false);
      await fetchProjects();
    } catch (err: any) {
      message.error(err.response?.data?.message || '建立專案失敗');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q)) ||
      (p.assignedEngineers && p.assignedEngineers.some((eng) => eng.toLowerCase().includes(q)));
    return matchesStage && matchesSearch;
  });

  // 判斷時程是否逾期
  const getScheduleTag = (p: Project) => {
    if (p.stage === 'closed') {
      return <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>已結案</span>;
    }
    const today = new Date().toISOString().split('T')[0];
    if (p.expectedDeliveryDate && today > p.expectedDeliveryDate) {
      const diffDays = Math.ceil(
        (new Date(today).getTime() - new Date(p.expectedDeliveryDate).getTime()) / (1000 * 3600 * 24)
      );
      return (
        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
          延遲 +{diffDays} 天
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        正常進行中
      </span>
    );
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <TextIcon name="projects" size="lg" />
            <span>專案管理 (WBS)</span>
          </h1>
          <p className="page-subtitle">5 大專案生命週期流轉、工期試算與多階段收支管理</p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <TextIcon name="plus" size="md" />
          <span>新增專案 (簽約立案)</span>
        </Button>
      </div>

      {/* 階段過濾與搜尋工具列 / Stage & Search Toolbar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* 左側：5 大階段快速過濾 Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: '300px' }}>
          {[
            { key: 'all', label: `全部專案 (${projects.length})` },
            { key: 'development', label: `開發中 (${projects.filter((p) => p.stage === 'development').length})` },
            { key: 'testing', label: `測試驗證 (${projects.filter((p) => p.stage === 'testing').length})` },
            { key: 'delivery', label: `交付驗收 (${projects.filter((p) => p.stage === 'delivery').length})` },
            { key: 'closed', label: `正式結案 (${projects.filter((p) => p.stage === 'closed').length})` },
            { key: 'maintenance', label: `保固維護 (${projects.filter((p) => p.stage === 'maintenance').length})` }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStageFilter(tab.key)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: stageFilter === tab.key ? 600 : 500,
                backgroundColor: stageFilter === tab.key ? 'var(--primary-600)' : '#ffffff',
                color: stageFilter === tab.key ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: stageFilter === tab.key ? 'var(--primary-600)' : 'var(--border-color)',
                borderRadius: '20px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 右側：搜尋框 */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '240px' }}>
          <div className="input-wrapper" style={{ width: '100%', maxWidth: '320px' }}>
            <span className="input-prefix-icon" style={{ left: '12px' }}>
              <TextIcon name="search" size="sm" color="var(--text-secondary)" />
            </span>
            <input
              type="text"
              className="form-input input-with-icon"
              placeholder="搜尋專案名稱、案號、客戶..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '38px', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          載入專案資料中...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>專案案號</th>
                <th>專案名稱</th>
                <th>客戶名稱</th>
                <th>當前階段</th>
                <th>工期 / 預計結案</th>
                <th>專案總額</th>
                <th>專案進度</th>
                <th>健康狀態</th>
                <th>負責人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => {
                const stageInfo = stageMap[p.stage] || { label: '開發中', variant: 'info' };
                return (
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
                        label={stageInfo.label}
                        variant={stageInfo.variant}
                        icon="layers"
                      />
                    </td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                          {p.durationDays ? `${p.durationDays} 天` : '-'}
                        </span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>|</span>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                          {p.expectedDeliveryDate || '-'}
                        </span>
                      </div>
                      <div style={{ marginTop: '2px' }}>{getScheduleTag(p)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        NT$ {(p.amountTotal || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {p.taxType === 'tax_inclusive' ? '含稅' : p.isTaxAdded ? '未稅+5%' : '未稅'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '70px', height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${p.progressPercent}%`, height: '100%', backgroundColor: 'var(--primary-600)' }} />
                        </div>
                        <span style={{ fontSize: '12px' }}>{p.progressPercent}%</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        label={p.healthStatus === 'healthy' ? '正常' : p.healthStatus === 'warning' ? '警告' : '嚴重'}
                        variant={p.healthStatus === 'healthy' ? 'success' : p.healthStatus === 'warning' ? 'warning' : 'danger'}
                        icon={p.healthStatus === 'healthy' ? 'success' : 'warning'}
                      />
                    </td>
                    <td>{(p.assignedEngineers || []).join(', ')}</td>
                    <td>
                      <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          title="查看專案工作台"
                          style={{ padding: '8px 12px' }}
                        >
                          <TextIcon name="eye" size="md" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 一鍵立案彈窗 */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};
