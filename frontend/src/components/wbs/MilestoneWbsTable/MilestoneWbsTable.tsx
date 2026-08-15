/**
 * @file MilestoneWbsTable.tsx
 * @description WBS 里程碑樹狀表格組件 / Milestone WBS Tree Table Component
 * @description_en Hierarchical WBS tree table supporting infinite depth, status toggling, progress tracking, budget monitoring, and node CRUD modals.
 * @description_zh 實作多層級 WBS 樹狀階層表格，支援展開/摺疊、即時狀態流轉、工項進度、預算成本監控與節點 CRUD 操作。
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  X,
  Save,
  ChevronUp
} from 'lucide-react';
import { WbsNode, WbsStatus } from '../../../types';
import { Button } from '../../button';
import './MilestoneWbsTable.css';

// ========================================
// 類別標籤設定 / Category Config
// ========================================
const CATEGORY_MAP: Record<string, { label: string; className: string }> = {
  requirement: { label: '需求分析', className: 'wbs-cat-req' },
  architecture: { label: '架構設計', className: 'wbs-cat-arch' },
  development: { label: '核心開發', className: 'wbs-cat-dev' },
  testing: { label: 'QA 測試', className: 'wbs-cat-test' },
  deployment: { label: '部署交付', className: 'wbs-cat-deploy' },
};

// ========================================
// 狀態標籤設定 / Status Config
// ========================================
const STATUS_CONFIG: Record<WbsStatus, { label: string; icon: React.ComponentType<{ size?: number }>; className: string }> = {
  NOT_STARTED: { label: '未開始', icon: Circle, className: 'not-started' },
  IN_PROGRESS: { label: '進行中', icon: Clock, className: 'in-progress' },
  COMPLETED: { label: '已完成', icon: CheckCircle2, className: 'completed' },
};

// ========================================
// 節點表單資料介面 / Node Form Interface
// ========================================
interface NodeFormData {
  name: string;
  category: 'requirement' | 'architecture' | 'development' | 'testing' | 'deployment';
  assignee: string;
  startDate: string;
  endDate: string;
  durationDays: string;
  budget: string;
  actualCost: string;
  progress: string;
  status: WbsStatus;
  description: string;
}

const DEFAULT_FORM: NodeFormData = {
  name: '',
  category: 'development',
  assignee: '張工程師',
  startDate: '2026-08-15',
  endDate: '2026-08-30',
  durationDays: '15',
  budget: '100000',
  actualCost: '0',
  progress: '0',
  status: 'NOT_STARTED',
  description: '',
};

interface MilestoneWbsTableProps {
  projectId: string;
  initialNodes: WbsNode[];
  onProgressUpdate?: (overallProgress: number) => void;
}

export const MilestoneWbsTable: React.FC<MilestoneWbsTableProps> = ({
  projectId,
  initialNodes,
  onProgressUpdate,
}) => {
  const [nodes, setNodes] = useState<WbsNode[]>(initialNodes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WbsNode | null>(null);
  const [addingParentId, setAddingParentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NodeFormData>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<WbsNode | null>(null);

  // ========================================
  // 統計完成度與葉子節點 / Statistics & Leaf Progress
  // ========================================
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalBudget = 0;
    let totalActualCost = 0;

    const traverse = (list: WbsNode[]) => {
      list.forEach((node) => {
        if (!node.children || node.children.length === 0) {
          totalTasks += 1;
          if (node.status === 'COMPLETED') {
            completedTasks += 1;
          }
          totalBudget += node.budget || 0;
          totalActualCost += node.actualCost || 0;
        } else {
          traverse(node.children);
        }
      });
    };

    traverse(nodes);
    const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, overallPercent, totalBudget, totalActualCost };
  }, [nodes]);

  // ========================================
  // 展開 / 收合節點 / Toggle Expand
  // ========================================
  const handleToggleExpand = (nodeId: string) => {
    const updateExpand = (list: WbsNode[]): WbsNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateExpand(node.children) };
        }
        return node;
      });
    };
    setNodes(updateExpand(nodes));
  };

  // 全部展開 / 全部收合
  const handleToggleAll = (expand: boolean) => {
    const setAll = (list: WbsNode[]): WbsNode[] => {
      return list.map((node) => ({
        ...node,
        isExpanded: expand,
        children: node.children ? setAll(node.children) : undefined,
      }));
    };
    setNodes(setAll(nodes));
  };

  // ========================================
  // 狀態切換流轉 / Status Transition
  // ========================================
  const handleStatusTransition = (nodeId: string, currentStatus: WbsStatus) => {
    const nextStatus: WbsStatus =
      currentStatus === 'NOT_STARTED'
        ? 'IN_PROGRESS'
        : currentStatus === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'NOT_STARTED';

    const updateStatus = (list: WbsNode[]): WbsNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          const nextProgress = nextStatus === 'COMPLETED' ? 100 : nextStatus === 'NOT_STARTED' ? 0 : Math.max(node.progress, 50);
          return { ...node, status: nextStatus, progress: nextProgress };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateStatus(node.children) };
        }
        return node;
      });
    };

    const newNodes = updateStatus(nodes);
    setNodes(newNodes);

    if (onProgressUpdate) {
      let total = 0;
      let completed = 0;
      const count = (items: WbsNode[]) => {
        items.forEach((n) => {
          if (!n.children || n.children.length === 0) {
            total++;
            if (n.status === 'COMPLETED') completed++;
          } else {
            count(n.children);
          }
        });
      };
      count(newNodes);
      onProgressUpdate(total > 0 ? Math.round((completed / total) * 100) : 0);
    }
  };

  // ========================================
  // 新增 / 編輯節點動作 / Add & Edit Actions
  // ========================================
  const handleOpenAddRoot = () => {
    setEditingNode(null);
    setAddingParentId(null);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleOpenAddChild = (parentId: string) => {
    setEditingNode(null);
    setAddingParentId(parentId);
    setFormData(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (node: WbsNode) => {
    setEditingNode(node);
    setAddingParentId(null);
    setFormData({
      name: node.name,
      category: node.category || 'development',
      assignee: node.assignees?.[0] || '張工程師',
      startDate: node.startDate || '2026-08-15',
      endDate: node.endDate || '2026-08-30',
      durationDays: String(node.durationDays || 15),
      budget: String(node.budget || 0),
      actualCost: String(node.actualCost || 0),
      progress: String(node.progress || 0),
      status: node.status,
      description: node.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingNode) {
      // 編輯既有節點
      const updateNode = (list: WbsNode[]): WbsNode[] => {
        return list.map((n) => {
          if (n.id === editingNode.id) {
            return {
              ...n,
              name: formData.name.trim(),
              category: formData.category,
              assignees: [formData.assignee],
              startDate: formData.startDate,
              endDate: formData.endDate,
              durationDays: Number(formData.durationDays) || 0,
              budget: Number(formData.budget) || 0,
              actualCost: Number(formData.actualCost) || 0,
              progress: Number(formData.progress) || 0,
              status: formData.status,
              description: formData.description,
            };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: updateNode(n.children) };
          }
          return n;
        });
      };
      setNodes(updateNode(nodes));
    } else {
      // 新增節點
      const newNode: WbsNode = {
        id: `wbs_${Date.now()}`,
        projectId,
        parentId: addingParentId || undefined,
        name: formData.name.trim(),
        category: formData.category,
        assignees: [formData.assignee],
        startDate: formData.startDate,
        endDate: formData.endDate,
        durationDays: Number(formData.durationDays) || 0,
        budget: Number(formData.budget) || 0,
        actualCost: Number(formData.actualCost) || 0,
        progress: Number(formData.progress) || 0,
        status: formData.status,
        description: formData.description,
        isExpanded: true,
      };

      if (addingParentId) {
        const addChild = (list: WbsNode[]): WbsNode[] => {
          return list.map((n) => {
            if (n.id === addingParentId) {
              return {
                ...n,
                isExpanded: true,
                children: [...(n.children || []), newNode],
              };
            }
            if (n.children && n.children.length > 0) {
              return { ...n, children: addChild(n.children) };
            }
            return n;
          });
        };
        setNodes(addChild(nodes));
      } else {
        setNodes([...nodes, newNode]);
      }
    }

    setIsModalOpen(false);
  };

  // ========================================
  // 刪除節點 / Delete Node
  // ========================================
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    const removeNode = (list: WbsNode[]): WbsNode[] => {
      return list
        .filter((n) => n.id !== deleteTarget.id)
        .map((n) => {
          if (n.children && n.children.length > 0) {
            return { ...n, children: removeNode(n.children) };
          }
          return n;
        });
    };

    setNodes(removeNode(nodes));
    setDeleteTarget(null);
  };

  // ========================================
  // 遞迴渲染列 / Recursive Row Renderer
  // ========================================
  const renderRows = (list: WbsNode[], depth = 0): React.ReactNode => {
    return list.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = node.isExpanded !== false;
      const isRoot = depth === 0;
      const statusObj = STATUS_CONFIG[node.status] || STATUS_CONFIG.NOT_STARTED;
      const StatusIcon = statusObj.icon;
      const catObj = node.category ? CATEGORY_MAP[node.category] : null;
      const isOverBudget = (node.actualCost || 0) > (node.budget || 0);

      return (
        <React.Fragment key={node.id}>
          <tr className={`wbs-row ${isRoot ? 'is-root' : ''}`}>
            {/* 1. 工作項目名稱 (階層縮排) */}
            <td>
              <div className="wbs-name-cell" style={{ paddingLeft: `${depth * 24}px` }}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="wbs-expand-btn"
                    onClick={() => handleToggleExpand(node.id)}
                    title={isExpanded ? '收合' : '展開'}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <span className="wbs-expand-placeholder" />
                )}

                <span style={{ fontWeight: isRoot ? 700 : 500 }}>{node.name}</span>

                {catObj && (
                  <span className={`wbs-cat-badge ${catObj.className}`}>
                    {catObj.label}
                  </span>
                )}
              </div>
            </td>

            {/* 2. 負責人 */}
            <td>
              {node.assignees && node.assignees.length > 0 ? (
                node.assignees.map((name) => (
                  <span key={name} className="wbs-assignee-badge">
                    {name}
                  </span>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </td>

            {/* 3. 計畫期程 */}
            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {node.startDate && node.endDate ? (
                <span>
                  {node.startDate} <span style={{ color: 'var(--text-muted)' }}>→</span> {node.endDate}
                  {node.durationDays ? ` (${node.durationDays}天)` : ''}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </td>

            {/* 4. 分配預算 */}
            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
              NT$ {(node.budget || 0).toLocaleString()}
            </td>

            {/* 5. 發生成本 */}
            <td
              style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: isOverBudget ? '#ef4444' : 'inherit',
                fontWeight: isOverBudget ? 700 : 'normal',
              }}
            >
              NT$ {(node.actualCost || 0).toLocaleString()}
            </td>

            {/* 6. 工項進度 */}
            <td>
              <div className="wbs-progress-box">
                <div className="wbs-progress-track">
                  <div
                    className={`wbs-progress-fill ${node.progress === 100 ? 'completed' : ''}`}
                    style={{ width: `${node.progress || 0}%` }}
                  />
                </div>
                <span className="wbs-progress-text">{node.progress || 0}%</span>
              </div>
            </td>

            {/* 7. 狀態切換 */}
            <td>
              <button
                type="button"
                className={`wbs-status-btn ${statusObj.className}`}
                onClick={() => handleStatusTransition(node.id, node.status)}
                title="點擊切換狀態"
              >
                <StatusIcon size={13} />
                <span>{statusObj.label}</span>
              </button>
            </td>

            {/* 8. 操作 */}
            <td>
              <div className="wbs-actions">
                <button
                  type="button"
                  className="wbs-action-btn add"
                  onClick={() => handleOpenAddChild(node.id)}
                  title="新增子工項"
                >
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn"
                  onClick={() => handleOpenEdit(node)}
                  title="編輯工項"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn delete"
                  onClick={() => setDeleteTarget(node)}
                  title="刪除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </td>
          </tr>

          {/* 遞迴子任務 */}
          {hasChildren && isExpanded && renderRows(node.children || [], depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="wbs-wrapper">
      {/* 頂部工具列與完成度膠囊統計 */}
      <div className="wbs-header-bar">
        <div className="wbs-stats-group">
          <span className="wbs-stat-pill success">
            <CheckCircle2 size={14} />
            <span>
              已完成 {stats.completedTasks} / {stats.totalTasks} 個工項任務 ({stats.overallPercent}%)
            </span>
          </span>

          <span className="wbs-stat-pill info">
            <span>
              預算達成：NT$ {stats.totalActualCost.toLocaleString()} / NT$ {stats.totalBudget.toLocaleString()}
            </span>
          </span>
        </div>

        <div className="wbs-btn-group">
          <Button variant="secondary" size="sm" onClick={() => handleToggleAll(true)}>
            <ChevronDown size={14} />
            <span>展開全部</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleToggleAll(false)}>
            <ChevronUp size={14} />
            <span>收合全部</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAddRoot}>
            <Plus size={14} />
            <span>新增主里程碑</span>
          </Button>
        </div>
      </div>

      {/* 樹狀階層 WBS 表格 */}
      <div className="wbs-table-container">
        <table className="wbs-table">
          <thead>
            <tr>
              <th style={{ width: '32%' }}>工作項目名稱</th>
              <th style={{ width: '10%' }}>負責工程師</th>
              <th style={{ width: '18%' }}>計畫期程 (工期)</th>
              <th style={{ width: '10%', textAlign: 'right' }}>計畫預算</th>
              <th style={{ width: '10%', textAlign: 'right' }}>已發生成本</th>
              <th style={{ width: '12%' }}>工項進度</th>
              <th style={{ width: '8%' }}>狀態</th>
              <th style={{ width: '8%', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>{renderRows(nodes)}</tbody>
        </table>
      </div>

      {/* 新增 / 編輯節點 Modal */}
      {isModalOpen && (
        <div className="wbs-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="wbs-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wbs-modal-header">
              <h3 className="wbs-modal-title">
                {editingNode
                  ? '編輯 WBS 工作項目'
                  : addingParentId
                  ? '新增子工項 / 任務'
                  : '新增主里程碑項目'}
              </h3>
              <button
                type="button"
                className="wbs-expand-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="wbs-modal-body">
                <div className="wbs-form-field">
                  <label className="wbs-form-label">
                    工作項目名稱 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="wbs-form-input"
                    placeholder="例如：M2 核心模組開發 或 2.1 數據採集"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="wbs-form-grid">
                  <div className="wbs-form-field">
                    <label className="wbs-form-label">階段類別</label>
                    <select
                      className="wbs-form-select"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as NodeFormData['category'],
                        })
                      }
                    >
                      <option value="requirement">需求分析</option>
                      <option value="architecture">架構設計</option>
                      <option value="development">核心開發</option>
                      <option value="testing">QA 測試</option>
                      <option value="deployment">部署交付</option>
                    </select>
                  </div>

                  <div className="wbs-form-field">
                    <label className="wbs-form-label">負責工程師</label>
                    <select
                      className="wbs-form-select"
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    >
                      <option value="張工程師">張工程師</option>
                      <option value="李工程師">李工程師</option>
                      <option value="王架構師">王架構師</option>
                      <option value="林工程師">林工程師</option>
                    </select>
                  </div>
                </div>

                <div className="wbs-form-grid">
                  <div className="wbs-form-field">
                    <label className="wbs-form-label">開始日期</label>
                    <input
                      type="date"
                      className="wbs-form-input"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="wbs-form-field">
                    <label className="wbs-form-label">預計結束日期</label>
                    <input
                      type="date"
                      className="wbs-form-input"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="wbs-form-grid">
                  <div className="wbs-form-field">
                    <label className="wbs-form-label">分配預算 (NT$)</label>
                    <input
                      type="number"
                      className="wbs-form-input"
                      placeholder="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    />
                  </div>

                  <div className="wbs-form-field">
                    <label className="wbs-form-label">已發生成本 (NT$)</label>
                    <input
                      type="number"
                      className="wbs-form-input"
                      placeholder="0"
                      value={formData.actualCost}
                      onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="wbs-form-grid">
                  <div className="wbs-form-field">
                    <label className="wbs-form-label">當前狀態</label>
                    <select
                      className="wbs-form-select"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as WbsStatus,
                          progress: e.target.value === 'COMPLETED' ? '100' : formData.progress,
                        })
                      }
                    >
                      <option value="NOT_STARTED">未開始</option>
                      <option value="IN_PROGRESS">進行中</option>
                      <option value="COMPLETED">已完成</option>
                    </select>
                  </div>

                  <div className="wbs-form-field">
                    <label className="wbs-form-label">工項進度 (0 - 100%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="wbs-form-input"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="wbs-modal-footer">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  取消
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  <Save size={14} />
                  <span>{editingNode ? '儲存變更' : '確認新增'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deleteTarget && (
        <div className="wbs-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="wbs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="wbs-modal-header">
              <h3 className="wbs-modal-title" style={{ color: '#ef4444' }}>
                確認刪除工項
              </h3>
              <button
                type="button"
                className="wbs-expand-btn"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="wbs-modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                確定要刪除工作項目 <strong>「{deleteTarget.name}」</strong> 嗎？
                {deleteTarget.children && deleteTarget.children.length > 0 && (
                  <span style={{ color: '#ef4444', display: 'block', marginTop: '6px' }}>
                    ⚠️ 注意：此項目底下包含 {deleteTarget.children.length} 個子任務，將一併刪除！
                  </span>
                )}
              </p>
            </div>
            <div className="wbs-modal-footer">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                取消
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                確認刪除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
