/**
 * @file MilestoneWbsTable.tsx
 * @description WBS 里程碑樹狀表格組件 / Milestone WBS Tree Table Component
 * @description_en Hierarchical WBS tree table supporting infinite depth, inline in-place editing, status toggling, progress tracking, and budget monitoring.
 * @description_zh 實作多層級 WBS 樹狀階層表格，支援展開/摺疊、行內直接編輯 (零彈窗)、即時狀態流轉、工項進度與預算成本監控。
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
  Check,
  X,
  ChevronUp,
} from 'lucide-react';
import { WbsNode, WbsStatus } from '../../../types';
import { Button } from '../../button';
import './MilestoneWbsTable.css';

// ========================================
// 狀態標籤設定 / Status Config
// ========================================
const STATUS_CONFIG: Record<WbsStatus, { label: string; icon: React.ComponentType<{ size?: number }>; className: string }> = {
  NOT_STARTED: { label: '未開始', icon: Circle, className: 'not-started' },
  IN_PROGRESS: { label: '進行中', icon: Clock, className: 'in-progress' },
  COMPLETED: { label: '已完成', icon: CheckCircle2, className: 'completed' },
};

const ENGINEER_OPTIONS = ['張工程師', '李工程師', '王架構師', '林工程師'];

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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<WbsNode>>({});

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
  // 行內直接編輯操作 / Inline In-Place Edit Actions
  // ========================================
  const startInlineEdit = (node: WbsNode) => {
    setEditingNodeId(node.id);
    setEditFormData({
      name: node.name,
      assignees: node.assignees || ['張工程師'],
      startDate: node.startDate || '2026-08-15',
      endDate: node.endDate || '2026-08-30',
      durationDays: node.durationDays || 15,
      budget: node.budget || 0,
      actualCost: node.actualCost || 0,
      progress: node.progress || 0,
      status: node.status,
    });
  };

  const cancelInlineEdit = () => {
    setEditingNodeId(null);
    setEditFormData({});
  };

  const saveInlineEdit = (nodeId: string) => {
    if (!editFormData.name?.trim()) return;

    // 計算工期天數
    let dur = editFormData.durationDays || 1;
    if (editFormData.startDate && editFormData.endDate) {
      const start = new Date(editFormData.startDate).getTime();
      const end = new Date(editFormData.endDate).getTime();
      if (end >= start) {
        dur = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    const updateNode = (list: WbsNode[]): WbsNode[] => {
      return list.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            name: editFormData.name!.trim(),
            assignees: editFormData.assignees || ['張工程師'],
            startDate: editFormData.startDate,
            endDate: editFormData.endDate,
            durationDays: dur,
            budget: Number(editFormData.budget) || 0,
            actualCost: Number(editFormData.actualCost) || 0,
            progress: Number(editFormData.progress) || 0,
          };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateNode(n.children) };
        }
        return n;
      });
    };

    setNodes(updateNode(nodes));
    setEditingNodeId(null);
    setEditFormData({});
  };

  // ========================================
  // 行內直接新增工項 / Inline Add Actions
  // ========================================
  const handleAddRootMilestone = () => {
    const nextIndex = nodes.length + 1;
    const newId = `wbs_${Date.now()}`;
    const newRoot: WbsNode = {
      id: newId,
      projectId,
      name: `M${nextIndex}: 新專案里程碑`,
      assignees: ['張工程師'],
      startDate: '2026-08-15',
      endDate: '2026-09-15',
      durationDays: 31,
      budget: 100000,
      actualCost: 0,
      progress: 0,
      status: 'NOT_STARTED',
      isExpanded: true,
      children: [],
    };

    setNodes([...nodes, newRoot]);
    startInlineEdit(newRoot);
  };

  const handleAddChildTask = (parentNode: WbsNode) => {
    const newId = `wbs_${Date.now()}`;
    const newChild: WbsNode = {
      id: newId,
      projectId,
      parentId: parentNode.id,
      name: '新工作任務項目',
      assignees: parentNode.assignees || ['張工程師'],
      startDate: parentNode.startDate || '2026-08-15',
      endDate: parentNode.endDate || '2026-08-30',
      durationDays: 15,
      budget: 50000,
      actualCost: 0,
      progress: 0,
      status: 'NOT_STARTED',
    };

    const addChild = (list: WbsNode[]): WbsNode[] => {
      return list.map((n) => {
        if (n.id === parentNode.id) {
          return {
            ...n,
            isExpanded: true,
            children: [...(n.children || []), newChild],
          };
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: addChild(n.children) };
        }
        return n;
      });
    };

    setNodes(addChild(nodes));
    startInlineEdit(newChild);
  };

  // ========================================
  // 行內直接刪除節點 / Direct Delete Action
  // ========================================
  const handleDeleteNode = (nodeId: string) => {
    const removeNode = (list: WbsNode[]): WbsNode[] => {
      return list
        .filter((n) => n.id !== nodeId)
        .map((n) => {
          if (n.children && n.children.length > 0) {
            return { ...n, children: removeNode(n.children) };
          }
          return n;
        });
    };

    setNodes(removeNode(nodes));
    if (editingNodeId === nodeId) {
      cancelInlineEdit();
    }
  };

  // ========================================
  // 遞迴渲染列 / Recursive Row Renderer
  // ========================================
  const renderRows = (list: WbsNode[], depth = 0): React.ReactNode => {
    return list.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = node.isExpanded !== false;
      const isRoot = depth === 0;
      const isEditing = editingNodeId === node.id;
      const statusObj = STATUS_CONFIG[node.status] || STATUS_CONFIG.NOT_STARTED;
      const StatusIcon = statusObj.icon;
      const isOverBudget = (node.actualCost || 0) > (node.budget || 0);

      if (isEditing) {
        // ========================================
        // 1. 行內編輯狀態視圖 (Inline Edit Row)
        // ========================================
        return (
          <tr key={node.id} className="wbs-row is-editing">
            {/* 1. 名稱編輯 */}
            <td>
              <div className="wbs-name-cell" style={{ paddingLeft: `${depth * 24}px` }}>
                <span className="wbs-expand-placeholder" />
                <input
                  type="text"
                  autoFocus
                  className="wbs-inline-text-input"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveInlineEdit(node.id);
                    if (e.key === 'Escape') cancelInlineEdit();
                  }}
                  placeholder="請輸入工作項目名稱..."
                />
              </div>
            </td>

            {/* 2. 負責人選單 */}
            <td>
              <select
                className="wbs-inline-select"
                value={editFormData.assignees?.[0] || '張工程師'}
                onChange={(e) => setEditFormData({ ...editFormData, assignees: [e.target.value] })}
              >
                {ENGINEER_OPTIONS.map((eng) => (
                  <option key={eng} value={eng}>
                    {eng}
                  </option>
                ))}
              </select>
            </td>

            {/* 3. 計畫期程 (開始/結束日) */}
            <td>
              <div className="wbs-inline-date-group">
                <input
                  type="date"
                  className="wbs-inline-date-input"
                  value={editFormData.startDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                />
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <input
                  type="date"
                  className="wbs-inline-date-input"
                  value={editFormData.endDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                />
              </div>
            </td>

            {/* 4. 分配預算 */}
            <td style={{ textAlign: 'right' }}>
              <input
                type="number"
                className="wbs-inline-num-input"
                value={editFormData.budget ?? 0}
                onChange={(e) => setEditFormData({ ...editFormData, budget: Number(e.target.value) })}
                placeholder="預算"
              />
            </td>

            {/* 5. 發生成本 */}
            <td style={{ textAlign: 'right' }}>
              <input
                type="number"
                className="wbs-inline-num-input"
                value={editFormData.actualCost ?? 0}
                onChange={(e) => setEditFormData({ ...editFormData, actualCost: Number(e.target.value) })}
                placeholder="成本"
              />
            </td>

            {/* 6. 工項進度 */}
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  style={{ width: '55px', padding: '4px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  value={editFormData.progress ?? 0}
                  onChange={(e) => setEditFormData({ ...editFormData, progress: Number(e.target.value) })}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
              </div>
            </td>

            {/* 7. 狀態 */}
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

            {/* 8. 行內操作 (保存 / 取消) */}
            <td>
              <div className="wbs-actions">
                <button
                  type="button"
                  className="wbs-action-btn save"
                  onClick={() => saveInlineEdit(node.id)}
                  title="儲存變更 (Enter)"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn cancel"
                  onClick={cancelInlineEdit}
                  title="取消 (Esc)"
                >
                  <X size={15} />
                </button>
              </div>
            </td>
          </tr>
        );
      }

      // ========================================
      // 2. 常規展示狀態視圖 (Display Row)
      // ========================================
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

                <span
                  style={{
                    fontWeight: isRoot ? 700 : 500,
                    cursor: 'pointer',
                  }}
                  onClick={() => startInlineEdit(node)}
                  title="點擊進行行內直接編輯"
                >
                  {node.name}
                </span>
              </div>
            </td>

            {/* 2. 負責人 */}
            <td>
              {node.assignees && node.assignees.length > 0 ? (
                node.assignees.map((name) => (
                  <span
                    key={name}
                    className="wbs-assignee-badge"
                    onClick={() => startInlineEdit(node)}
                    style={{ cursor: 'pointer' }}
                    title="點擊修改負責人"
                  >
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
                <span onClick={() => startInlineEdit(node)} style={{ cursor: 'pointer' }} title="點擊修改期程">
                  {node.startDate} <span style={{ color: 'var(--text-muted)' }}>→</span> {node.endDate}
                  {node.durationDays ? ` (${node.durationDays}天)` : ''}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>—</span>
              )}
            </td>

            {/* 4. 分配預算 */}
            <td
              style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              onClick={() => startInlineEdit(node)}
              title="點擊修改預算"
            >
              NT$ {(node.budget || 0).toLocaleString()}
            </td>

            {/* 5. 發生成本 */}
            <td
              style={{
                textAlign: 'right',
                fontFamily: 'var(--font-mono)',
                color: isOverBudget ? '#ef4444' : 'inherit',
                fontWeight: isOverBudget ? 700 : 'normal',
                cursor: 'pointer',
              }}
              onClick={() => startInlineEdit(node)}
              title="點擊修改成本"
            >
              NT$ {(node.actualCost || 0).toLocaleString()}
            </td>

            {/* 6. 工項進度 */}
            <td>
              <div
                className="wbs-progress-box"
                onClick={() => startInlineEdit(node)}
                style={{ cursor: 'pointer' }}
                title="點擊修改進度"
              >
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
                  onClick={() => handleAddChildTask(node)}
                  title="直接新增子工項 (行內編輯)"
                >
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn"
                  onClick={() => startInlineEdit(node)}
                  title="行內編輯"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn delete"
                  onClick={() => handleDeleteNode(node.id)}
                  title="直接刪除此工項"
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
          <Button variant="primary" size="sm" onClick={handleAddRootMilestone}>
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
              <th style={{ width: '11%' }}>負責工程師</th>
              <th style={{ width: '22%' }}>計畫期程 (工期)</th>
              <th style={{ width: '10%', textAlign: 'right' }}>計畫預算</th>
              <th style={{ width: '10%', textAlign: 'right' }}>已發生成本</th>
              <th style={{ width: '10%' }}>工項進度</th>
              <th style={{ width: '8%' }}>狀態</th>
              <th style={{ width: '7%', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>{renderRows(nodes)}</tbody>
        </table>
      </div>
    </div>
  );
};
