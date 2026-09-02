import React, { useState, useEffect, useCallback } from 'react';
import { message } from '@kawawei/frontend-modules';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { IssueRecord, Project, IssueFilter } from '../../types';
import { issueService } from '../../services/issue.service';
import { projectService } from '../../services/project.service';
import { useAuth } from '../../hooks/useAuth';
import { IssueList } from './IssueList';
import { IssueKanban } from './IssueKanban';
import { CreateIssueModal } from './CreateIssueModal';
import { IssueDetailModal } from './IssueDetailModal';

/**
 * @file IssuesPage.tsx
 * @description 客戶問題工單與修復追蹤管理主頁面 / Issue Tracking Management Page
 * @description_en Comprehensive issue tracker with dual view (Kanban & List), metrics cards, media attachments, and resolution workflow
 * @description_zh 提供工單指標統計、雙視圖切換 (看板/清單)、富媒體提單、工程師修復標記與雙向溝通對話
 */

export const IssuesPage: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // 篩選狀態
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 模態彈窗狀態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // ========================================
  // 載入專案與工單 / Fetch Projects & Issues
  // ========================================
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const filter: IssueFilter = {
        projectId: selectedProject || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        search: searchQuery.trim() || undefined
      };
      const data = await issueService.getIssues(filter);
      setIssues(data);
    } catch (err: any) {
      console.error('Failed to load issues:', err);
      message.error(err.response?.data?.message || '載入問題工單失敗');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedStatus, selectedCategory, selectedSeverity, searchQuery]);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // ========================================
  // 統計指標計算 / Metrics
  // ========================================
  const countTotal = issues.length;
  const countPending = issues.filter((i) => i.status === 'PENDING').length;
  const countInProgress = issues.filter((i) => i.status === 'IN_PROGRESS').length;
  const countResolved = issues.filter((i) => i.status === 'RESOLVED').length;
  const countClosed = issues.filter((i) => i.status === 'CLOSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 頂部頁頭與操作按鈕 / Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            問題回報與修復追蹤 (Issue Tracker)
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            集中管理軟體缺陷、介面異常與需求回報，即時追蹤修復進度與佐證媒體
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 視圖切換按鈕 / View Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                border: 'none',
                backgroundColor: viewMode === 'kanban' ? 'var(--primary-50)' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'kanban' ? 600 : 500,
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <TextIcon name="projects" size="sm" />
              <span>看板模式</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                border: 'none',
                backgroundColor: viewMode === 'list' ? 'var(--primary-50)' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'list' ? 600 : 500,
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <TextIcon name="contracts" size="sm" />
              <span>清單模式</span>
            </button>
          </div>

          {/* 建立問題工單按鈕 / New Issue Button */}
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <TextIcon name="plus" size="sm" />
              <span>登打 Issue / 回報問題</span>
            </span>
          </Button>
        </div>
      </div>

      {/* 統計指標卡片 / Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>總工單數</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{countTotal}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
          <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 600 }}>待處理 (Pending)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{countPending}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
          <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 600 }}>處理中 (In Progress)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{countInProgress}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
          <div style={{ fontSize: '13px', color: '#047857', fontWeight: 600 }}>已修復 (Resolved)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{countResolved}</div>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>已結案 (Closed)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6b7280', marginTop: '4px' }}>{countClosed}</div>
        </div>
      </div>

      {/* 篩選與搜尋列 / Filter Bar */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        {/* 專案篩選 */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          >
            <option value="">所有專案 / 系統</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 狀態篩選 */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">所有狀態</option>
            <option value="PENDING">待處理 (Pending)</option>
            <option value="IN_PROGRESS">處理中 (In Progress)</option>
            <option value="RESOLVED">已修復 (Resolved)</option>
            <option value="CLOSED">已結案 (Closed)</option>
            <option value="REJECTED">不予處理 (Rejected)</option>
          </select>
        </div>

        {/* 分類篩選 */}
        <div style={{ minWidth: '140px' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">所有問題分類</option>
            <option value="BUG">缺陷異常 (Bug)</option>
            <option value="UI_UX">介面顯示 (UI/UX)</option>
            <option value="PERFORMANCE">效能卡頓 (Performance)</option>
            <option value="FEATURE_REQUEST">需求建議 (Feature Request)</option>
            <option value="DATA_ISSUE">資料異常 (Data Issue)</option>
            <option value="OTHER">其他諮詢 (Other)</option>
          </select>
        </div>

        {/* 嚴重度篩選 */}
        <div style={{ minWidth: '130px' }}>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          >
            <option value="ALL">所有嚴重等級</option>
            <option value="CRITICAL">致命阻斷 (Critical)</option>
            <option value="HIGH">高嚴重度 (High)</option>
            <option value="MEDIUM">中等程度 (Medium)</option>
            <option value="LOW">輕微問題 (Low)</option>
          </select>
        </div>

        {/* 搜尋關鍵字 */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder="搜尋案號、主旨或問題描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* 內容視圖 (看板 / 清單) / View Content */}
      {viewMode === 'kanban' ? (
        <IssueKanban
          issues={issues}
          onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
          loading={loading}
        />
      ) : (
        <IssueList
          issues={issues}
          onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
          loading={loading}
        />
      )}

      {/* 提單彈窗 / Create Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchIssues}
        projects={projects}
      />

      {/* 工單詳情與修復處理中心 / Detail Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onUpdated={fetchIssues}
        currentUserRole={user?.role}
      />

    </div>
  );
};
