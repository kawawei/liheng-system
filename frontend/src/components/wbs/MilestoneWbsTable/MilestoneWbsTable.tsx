/**
 * @file MilestoneWbsTable.tsx
 * @description WBS 里程碑即時編輯表格組件 / Milestone WBS Live Editable Table Component
 * @description_en Direct spreadsheet-style hierarchical WBS table integrating @kawawei/frontend-modules (Select, DatePicker), with 2-tier header, unified 36px height, no number spinner arrows, wide horizontal scroll, and auto-calculated end dates.
 * @description_zh 整合 @kawawei/frontend-modules (Select, DatePicker) 之直出即時編輯 WBS 樹狀表格，採用雙層表頭分拆預計與實際時程，統一垂直高度 36px 與 13px 字級。
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  ChevronUp,
} from 'lucide-react';
import { Select, DatePicker } from '@kawawei/frontend-modules';
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

const ENGINEER_SELECT_OPTIONS = [
  { label: '張工程師', value: '張工程師' },
  { label: '李工程師', value: '李工程師' },
  { label: '王架構師', value: '王架構師' },
  { label: '林工程師', value: '林工程師' },
];

// ========================================
// 日期自動計算工具 / Date Calc Helper
// ========================================
const calculateEndDate = (startDateStr?: string, duration?: number): string => {
  if (!startDateStr || !duration || duration <= 0) return '';
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return '';
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(1, duration) - 1);
  return end.toISOString().split('T')[0];
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

  // ========================================
  // 統計完成度與葉子節點 / Statistics & Leaf Progress
  // ========================================
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;

    const traverse = (list: WbsNode[]) => {
      list.forEach((node) => {
        if (!node.children || node.children.length === 0) {
          totalTasks += 1;
          if (node.status === 'COMPLETED') {
            completedTasks += 1;
          }
        } else {
          traverse(node.children);
        }
      });
    };

    traverse(nodes);
    const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, overallPercent };
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
  // 直出即時修改欄位 / Update Node Field
  // ========================================
  const updateNode = (nodeId: string, updater: (n: WbsNode) => WbsNode) => {
    const updateList = (list: WbsNode[]): WbsNode[] => {
      return list.map((node) => {
        if (node.id === nodeId) {
          return updater(node);
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateList(node.children) };
        }
        return node;
      });
    };

    const newNodes = updateList(nodes);
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

  // 預計開始日變更 (自動試算預計結束日)
  const handlePlannedStartChange = (nodeId: string, newStart: string) => {
    updateNode(nodeId, (node) => {
      const dur = node.plannedDurationDays || node.durationDays || 14;
      const end = calculateEndDate(newStart, dur);
      return {
        ...node,
        plannedStartDate: newStart,
        plannedEndDate: end,
        startDate: newStart,
        endDate: end,
      };
    });
  };

  // 預計工期變更 (自動試算預計結束日)
  const handlePlannedDurationChange = (nodeId: string, newDur: number) => {
    const validDur = Math.max(1, newDur || 1);
    updateNode(nodeId, (node) => {
      const start = node.plannedStartDate || node.startDate || '2026-08-15';
      const end = calculateEndDate(start, validDur);
      return {
        ...node,
        plannedDurationDays: validDur,
        plannedEndDate: end,
        durationDays: validDur,
        endDate: end,
      };
    });
  };

  // 實際開始日變更 (自動試算實際結束日)
  const handleActualStartChange = (nodeId: string, newStart: string) => {
    updateNode(nodeId, (node) => {
      const dur = node.actualDurationDays || 0;
      const end = newStart && dur > 0 ? calculateEndDate(newStart, dur) : '';
      return {
        ...node,
        actualStartDate: newStart,
        actualEndDate: end,
      };
    });
  };

  // 實際工期變更 (自動試算實際結束日)
  const handleActualDurationChange = (nodeId: string, newDur: number) => {
    const validDur = Math.max(0, newDur || 0);
    updateNode(nodeId, (node) => {
      const start = node.actualStartDate || '';
      const end = start && validDur > 0 ? calculateEndDate(start, validDur) : '';
      return {
        ...node,
        actualDurationDays: validDur,
        actualEndDate: end,
      };
    });
  };

  // 進度百分比變更
  const handleProgressChange = (nodeId: string, newPct: number) => {
    const validPct = Math.min(100, Math.max(0, newPct || 0));
    updateNode(nodeId, (node) => {
      const newStatus: WbsStatus = validPct === 100 ? 'COMPLETED' : validPct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
      return {
        ...node,
        progress: validPct,
        status: newStatus,
      };
    });
  };

  // 狀態切換流轉
  const handleStatusTransition = (nodeId: string, currentStatus: WbsStatus) => {
    const nextStatus: WbsStatus =
      currentStatus === 'NOT_STARTED'
        ? 'IN_PROGRESS'
        : currentStatus === 'IN_PROGRESS'
        ? 'COMPLETED'
        : 'NOT_STARTED';

    updateNode(nodeId, (node) => {
      const nextProgress = nextStatus === 'COMPLETED' ? 100 : nextStatus === 'NOT_STARTED' ? 0 : Math.max(node.progress, 50);
      let actStart = node.actualStartDate || '';
      let actDur = node.actualDurationDays || node.plannedDurationDays || node.durationDays || 14;
      let actEnd = node.actualEndDate || '';

      if (nextStatus === 'IN_PROGRESS' && !actStart) {
        actStart = new Date().toISOString().split('T')[0];
        actEnd = calculateEndDate(actStart, actDur);
      } else if (nextStatus === 'COMPLETED') {
        if (!actStart) actStart = node.plannedStartDate || new Date().toISOString().split('T')[0];
        actEnd = new Date().toISOString().split('T')[0];
      }

      return {
        ...node,
        status: nextStatus,
        progress: nextProgress,
        actualStartDate: actStart,
        actualDurationDays: actDur,
        actualEndDate: actEnd,
      };
    });
  };

  // ========================================
  // 直出新增工項 / Direct Add Actions
  // ========================================
  const handleAddRootMilestone = () => {
    const nextIndex = nodes.length + 1;
    const newId = `wbs_${Date.now()}`;
    const pStart = '2026-08-15';
    const pDur = 30;
    const newRoot: WbsNode = {
      id: newId,
      projectId,
      name: `M${nextIndex}: 新專案里程碑`,
      assignees: ['張工程師'],
      plannedStartDate: pStart,
      plannedDurationDays: pDur,
      plannedEndDate: calculateEndDate(pStart, pDur),
      actualStartDate: '',
      actualDurationDays: 0,
      actualEndDate: '',
      startDate: pStart,
      endDate: calculateEndDate(pStart, pDur),
      durationDays: pDur,
      progress: 0,
      status: 'NOT_STARTED',
      isExpanded: true,
      children: [],
    };

    setNodes([...nodes, newRoot]);
  };

  const handleAddChildTask = (parentNode: WbsNode) => {
    const newId = `wbs_${Date.now()}`;
    const pStart = parentNode.plannedStartDate || parentNode.startDate || '2026-08-15';
    const pDur = 14;
    const newChild: WbsNode = {
      id: newId,
      projectId,
      parentId: parentNode.id,
      name: '新工作任務項目',
      assignees: parentNode.assignees || ['張工程師'],
      plannedStartDate: pStart,
      plannedDurationDays: pDur,
      plannedEndDate: calculateEndDate(pStart, pDur),
      actualStartDate: '',
      actualDurationDays: 0,
      actualEndDate: '',
      startDate: pStart,
      endDate: calculateEndDate(pStart, pDur),
      durationDays: pDur,
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
  };

  // 直出刪除節點
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
  };

  // ========================================
  // 遞迴渲染直出可編輯列 / Recursive Row Renderer
  // ========================================
  const renderRows = (list: WbsNode[], depth = 0): React.ReactNode => {
    return list.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = node.isExpanded !== false;
      const isRoot = depth === 0;
      const statusObj = STATUS_CONFIG[node.status] || STATUS_CONFIG.NOT_STARTED;
      const StatusIcon = statusObj.icon;

      // 預計期程與工期
      const pStart = node.plannedStartDate || node.startDate || '';
      const pDur = node.plannedDurationDays || node.durationDays || 1;
      const pEnd = node.plannedEndDate || node.endDate || calculateEndDate(pStart, pDur);

      // 實際期程與工期
      const aStart = node.actualStartDate || '';
      const aDur = node.actualDurationDays ?? 0;
      const aEnd = node.actualEndDate || (aStart && aDur > 0 ? calculateEndDate(aStart, aDur) : '');

      return (
        <React.Fragment key={node.id}>
          <tr className={`wbs-row ${isRoot ? 'is-root' : ''}`}>
            {/* 1. 工作項目名稱 (階層縮排，直出輸入框) */}
            <td style={{ minWidth: '260px' }}>
              <div className="wbs-name-cell" style={{ paddingLeft: `${depth * 22}px` }}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="wbs-expand-btn"
                    onClick={() => handleToggleExpand(node.id)}
                    title={isExpanded ? '收合' : '展開'}
                  >
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>
                ) : (
                  <span className="wbs-expand-placeholder" />
                )}

                <input
                  type="text"
                  className="wbs-direct-input"
                  style={{ fontWeight: isRoot ? 700 : 500 }}
                  value={node.name}
                  onChange={(e) =>
                    updateNode(node.id, (n) => ({ ...n, name: e.target.value }))
                  }
                  placeholder="輸入項目名稱..."
                />
              </div>
            </td>

            {/* 2. 負責人 (使用 @kawawei/frontend-modules Select) */}
            <td style={{ width: '130px', minWidth: '130px' }}>
              <Select
                options={ENGINEER_SELECT_OPTIONS}
                value={node.assignees?.[0] || '張工程師'}
                onChange={(val: string | number | (string | number)[]) =>
                  updateNode(node.id, (n) => ({ ...n, assignees: [String(val)] }))
                }
                width="100%"
              />
            </td>

            {/* 3. 預計開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '155px', minWidth: '155px' }}>
              <DatePicker
                value={pStart}
                onChange={(val: string) => handlePlannedStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 4. 預計結束 (自動計算，純文字顯示) */}
            <td style={{ width: '110px', minWidth: '110px' }}>
              <span className="wbs-readonly-date auto-calc">{pEnd || '—'}</span>
            </td>

            {/* 5. 預計工期 (直出天數，無上下箭頭) */}
            <td style={{ width: '75px', minWidth: '75px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="number"
                  min="1"
                  className="wbs-direct-days"
                  value={pDur}
                  onChange={(e) => handlePlannedDurationChange(node.id, Number(e.target.value))}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>天</span>
              </div>
            </td>

            {/* 6. 實際開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '155px', minWidth: '155px' }}>
              <DatePicker
                value={aStart}
                onChange={(val: string) => handleActualStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 7. 實際結束 (自動計算，純文字顯示) */}
            <td style={{ width: '110px', minWidth: '110px' }}>
              <span className="wbs-readonly-date" style={{ color: aEnd ? '#059669' : 'inherit' }}>
                {aEnd || '—'}
              </span>
            </td>

            {/* 8. 實際工期 (直出天數，無上下箭頭) */}
            <td style={{ width: '75px', minWidth: '75px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="number"
                  min="0"
                  className="wbs-direct-days"
                  value={aDur}
                  onChange={(e) => handleActualDurationChange(node.id, Number(e.target.value))}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>天</span>
              </div>
            </td>

            {/* 9. 工項進度 (直出數字，無上下箭頭) */}
            <td style={{ width: '75px', minWidth: '75px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="wbs-direct-pct"
                  value={node.progress || 0}
                  onChange={(e) => handleProgressChange(node.id, Number(e.target.value))}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
              </div>
            </td>

            {/* 10. 狀態 (點擊快速流轉) */}
            <td style={{ width: '90px', minWidth: '90px' }}>
              <button
                type="button"
                className={`wbs-status-btn ${statusObj.className}`}
                onClick={() => handleStatusTransition(node.id, node.status)}
                title="點擊切換狀態"
              >
                <StatusIcon size={12} />
                <span>{statusObj.label}</span>
              </button>
            </td>

            {/* 11. 操作 (新增子工項 / 刪除) */}
            <td style={{ width: '65px', minWidth: '65px' }}>
              <div className="wbs-actions">
                <button
                  type="button"
                  className="wbs-action-btn add"
                  onClick={() => handleAddChildTask(node)}
                  title="新增子工項"
                >
                  <Plus size={15} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn delete"
                  onClick={() => handleDeleteNode(node.id)}
                  title="刪除此工項"
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

      {/* 樹狀階層 WBS 雙層表頭即時編輯表格 */}
      <div className="wbs-table-container">
        <table className="wbs-table">
          <thead>
            <tr className="wbs-th-row-1">
              <th rowSpan={2} style={{ width: '24%' }}>工作項目名稱</th>
              <th rowSpan={2} style={{ width: '10%' }}>負責人</th>
              <th colSpan={3} className="wbs-th-group planned">預計時程</th>
              <th colSpan={3} className="wbs-th-group actual">實際時程</th>
              <th rowSpan={2} style={{ width: '6%' }}>進度</th>
              <th rowSpan={2} style={{ width: '8%' }}>狀態</th>
              <th rowSpan={2} style={{ width: '6%', textAlign: 'center' }}>操作</th>
            </tr>
            <tr className="wbs-th-row-2">
              <th style={{ width: '12%' }}>開始日期</th>
              <th style={{ width: '8%' }}>結束日期</th>
              <th style={{ width: '5%' }}>工期</th>
              <th style={{ width: '12%' }}>開始日期</th>
              <th style={{ width: '8%' }}>結束日期</th>
              <th style={{ width: '5%' }}>工期</th>
            </tr>
          </thead>
          <tbody>{renderRows(nodes)}</tbody>
        </table>
      </div>
    </div>
  );
};
