/**
 * @file MilestoneWbsTable.tsx
 * @description WBS 里程碑即時編輯表格組件 / Milestone WBS Live Editable Table Component
 * @description_en Direct spreadsheet-style hierarchical WBS table integrating @kawawei/frontend-modules (Select, DatePicker), with independent WBS Code, Diamond Checkpoint action button, and Predecessor dropdown selectors (FS, FF, SS, SF).
 * @description_zh 整合 @kawawei/frontend-modules (Select, DatePicker) 之直出即時編輯 WBS 樹狀表格，操作欄提供菱形新增檢查點按鈕、前置任務與依賴類型全數採用組件庫 Select 下拉選單。
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronUp,
  Diamond,
} from 'lucide-react';
import { Select, DatePicker } from '@kawawei/frontend-modules';
import { WbsNode, WbsStatus, DependencyType } from '../../../types';
import { Button } from '../../button';
import './MilestoneWbsTable.css';

const ENGINEER_SELECT_OPTIONS = [
  { label: '張工程師', value: '張工程師' },
  { label: '李工程師', value: '李工程師' },
  { label: '王架構師', value: '王架構師' },
  { label: '林工程師', value: '林工程師' },
];

const STATUS_SELECT_OPTIONS = [
  { label: '未開始', value: 'NOT_STARTED' },
  { label: '進行中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
];

const DEPENDENCY_TYPE_OPTIONS = [
  { label: 'FS', value: 'FS' },
  { label: 'FF', value: 'FF' },
  { label: 'SS', value: 'SS' },
  { label: 'SF', value: 'SF' },
];

// ========================================
// 日期自動計算工具 / Date Calc Helper
// ========================================
const calculateEndDate = (startDateStr?: string, duration?: number): string => {
  if (!startDateStr) return '';
  if (duration === 0) return startDateStr;
  const dur = duration || 1;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return '';
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(1, dur) - 1);
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
  // 提取所有可用前置任務選項 / Predecessor Options
  // ========================================
  const predecessorSelectOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [
      { label: '無前置', value: '' },
    ];
    const collect = (list: WbsNode[]) => {
      list.forEach((n) => {
        const code = n.wbsCode || '';
        if (code) {
          options.push({
            label: `${code} ${n.name.slice(0, 10)}${n.name.length > 10 ? '...' : ''}`,
            value: code,
          });
        }
        if (n.children && n.children.length > 0) {
          collect(n.children);
        }
      });
    };
    collect(nodes);
    return options;
  }, [nodes]);

  // ========================================
  // 統計完成度與葉子節點 / Statistics & Leaf Progress
  // ========================================
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalMilestones = 0;
    let completedMilestones = 0;

    const traverse = (list: WbsNode[]) => {
      list.forEach((node) => {
        if (node.isMilestone) {
          totalMilestones += 1;
          if (node.status === 'COMPLETED') completedMilestones += 1;
        }
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
    return { totalTasks, completedTasks, totalMilestones, completedMilestones, overallPercent };
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
      const dur = node.isMilestone ? 0 : (node.plannedDurationDays || node.durationDays || 14);
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
    updateNode(nodeId, (node) => {
      if (node.isMilestone) return node;
      const validDur = Math.max(1, newDur || 1);
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
      const dur = node.isMilestone ? 0 : (node.actualDurationDays ?? 0);
      const end = newStart ? (node.isMilestone ? newStart : calculateEndDate(newStart, dur)) : '';
      return {
        ...node,
        actualStartDate: newStart,
        actualEndDate: end,
      };
    });
  };

  // 實際工期變更 (自動試算實際結束日)
  const handleActualDurationChange = (nodeId: string, newDur: number) => {
    updateNode(nodeId, (node) => {
      if (node.isMilestone) return node;
      const validDur = Math.max(0, newDur || 0);
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

  // 狀態下拉選單切換
  const handleStatusSelect = (nodeId: string, newStatus: WbsStatus) => {
    updateNode(nodeId, (node) => {
      const nextProgress = newStatus === 'COMPLETED' ? 100 : newStatus === 'NOT_STARTED' ? 0 : Math.max(node.progress, 50);
      let actStart = node.actualStartDate || '';
      let actDur = node.isMilestone ? 0 : (node.actualDurationDays || node.plannedDurationDays || 14);
      let actEnd = node.actualEndDate || '';

      if (newStatus === 'IN_PROGRESS' && !actStart) {
        actStart = new Date().toISOString().split('T')[0];
        actEnd = node.isMilestone ? actStart : calculateEndDate(actStart, actDur);
      } else if (newStatus === 'COMPLETED') {
        if (!actStart) actStart = node.plannedStartDate || new Date().toISOString().split('T')[0];
        actEnd = node.isMilestone ? actStart : new Date().toISOString().split('T')[0];
      }

      return {
        ...node,
        status: newStatus,
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
  const handleAddRootMilestone = (isMilestoneCheckpoint = false) => {
    const nextIndex = nodes.length + 1;
    const newId = `wbs_${Date.now()}`;
    const pStart = '2026-08-15';
    const pDur = isMilestoneCheckpoint ? 0 : 30;
    const newRoot: WbsNode = {
      id: newId,
      projectId,
      wbsCode: `${nextIndex}`,
      name: isMilestoneCheckpoint ? '新里程碑檢查點' : '新專案階段',
      isMilestone: isMilestoneCheckpoint,
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

  // 新增子任務或里程碑檢查點 (透過操作按鈕)
  const handleAddChildTask = (parentNode: WbsNode, isCheckpoint = false) => {
    const newId = `wbs_${Date.now()}`;
    const childIndex = (parentNode.children?.length || 0) + 1;
    const parentCode = parentNode.wbsCode || '1';
    const newCode = `${parentCode}.${childIndex}`;
    const pStart = parentNode.plannedStartDate || parentNode.startDate || '2026-08-15';
    const pDur = isCheckpoint ? 0 : 14;
    const newChild: WbsNode = {
      id: newId,
      projectId,
      parentId: parentNode.id,
      wbsCode: newCode,
      name: isCheckpoint ? '新里程碑檢查點' : '新工作任務項目',
      isMilestone: isCheckpoint,
      predecessorCode: parentNode.children && parentNode.children.length > 0
        ? parentNode.children[parentNode.children.length - 1].wbsCode
        : parentCode,
      dependencyType: 'FS',
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
  const renderRows = (list: WbsNode[], depth = 0, prefix = ''): React.ReactNode => {
    return list.map((node, index) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = node.isExpanded !== false;
      const isRoot = depth === 0;
      const displayCode = node.wbsCode || (prefix ? `${prefix}.${index + 1}` : `${index + 1}`);

      // 預計期程與工期
      const pStart = node.plannedStartDate || node.startDate || '';
      const pDur = node.isMilestone ? 0 : (node.plannedDurationDays || node.durationDays || 1);
      const pEnd = node.plannedEndDate || node.endDate || calculateEndDate(pStart, pDur);

      // 實際期程與工期
      const aStart = node.actualStartDate || '';
      const aDur = node.isMilestone ? 0 : (node.actualDurationDays ?? 0);
      const aEnd = node.actualEndDate || (aStart && (node.isMilestone ? aStart : calculateEndDate(aStart, aDur)));

      return (
        <React.Fragment key={node.id}>
          <tr className={`wbs-row ${isRoot ? 'is-root' : ''} ${node.isMilestone ? 'is-milestone' : ''}`}>
            {/* 1. WBS 編號 (最左側獨立欄位，含層級縮排與展開按鈕) */}
            <td style={{ width: '90px', minWidth: '90px' }}>
              <div className="wbs-code-cell" style={{ paddingLeft: `${depth * 16}px` }}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="wbs-expand-btn"
                    onClick={() => handleToggleExpand(node.id)}
                    title={isExpanded ? '收合' : '展開'}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="wbs-expand-placeholder" />
                )}

                <span className="wbs-code-badge">{displayCode}</span>
              </div>
            </td>

            {/* 2. 工作項目名稱 (若為檢查點則顯示菱形標籤) */}
            <td style={{ minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {node.isMilestone && (
                  <span className={`wbs-milestone-tag ${node.status === 'COMPLETED' ? 'completed' : ''}`}>
                    <Diamond size={11} fill={node.status === 'COMPLETED' ? '#10b981' : '#f59e0b'} />
                    <span>檢查點</span>
                  </span>
                )}
                <input
                  type="text"
                  className="wbs-direct-input"
                  style={{
                    fontWeight: isRoot ? 700 : (node.isMilestone ? 600 : 500),
                    color: node.isMilestone ? '#b45309' : 'inherit'
                  }}
                  value={node.name}
                  onChange={(e) =>
                    updateNode(node.id, (n) => ({ ...n, name: e.target.value }))
                  }
                  placeholder="輸入項目名稱..."
                />
              </div>
            </td>

            {/* 3. 前置任務 (使用 @kawawei/frontend-modules Select) */}
            <td style={{ width: '135px', minWidth: '135px' }}>
              <Select
                className="wbs-select-field"
                options={predecessorSelectOptions}
                value={node.predecessorCode || ''}
                onChange={(val: string | number | (string | number)[]) =>
                  updateNode(node.id, (n) => ({ ...n, predecessorCode: String(val) }))
                }
                width="100%"
                height="30px"
              />
            </td>

            {/* 4. 依賴類型 (使用 @kawawei/frontend-modules Select) */}
            <td style={{ width: '85px', minWidth: '85px' }}>
              <Select
                className="wbs-select-field"
                options={DEPENDENCY_TYPE_OPTIONS}
                value={node.dependencyType || 'FS'}
                onChange={(val: string | number | (string | number)[]) =>
                  updateNode(node.id, (n) => ({ ...n, dependencyType: String(val) as DependencyType }))
                }
                width="100%"
                height="30px"
              />
            </td>

            {/* 5. 負責人 (使用 @kawawei/frontend-modules Select) */}
            <td style={{ width: '135px', minWidth: '135px' }}>
              <Select
                className="wbs-select-field"
                options={ENGINEER_SELECT_OPTIONS}
                value={node.assignees?.[0] || '張工程師'}
                onChange={(val: string | number | (string | number)[]) =>
                  updateNode(node.id, (n) => ({ ...n, assignees: [String(val)] }))
                }
                width="100%"
                height="30px"
              />
            </td>

            {/* 6. 預計開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '165px', minWidth: '165px' }}>
              <DatePicker
                className="wbs-datepicker-field"
                value={pStart}
                onChange={(val: string) => handlePlannedStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 7. 預計結束 (自動計算，純文字顯示) */}
            <td style={{ width: '125px', minWidth: '125px', textAlign: 'center' }}>
              <span className="wbs-readonly-date auto-calc">{pEnd || '—'}</span>
            </td>

            {/* 8. 預計工期 (如果是檢查點則固定 0 天) */}
            <td style={{ width: '95px', minWidth: '95px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-direct-days milestone-zero" style={{ display: 'inline-block', lineHeight: '28px' }}>
                  0 天
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <input
                    type="number"
                    min="1"
                    className="wbs-direct-days"
                    value={pDur}
                    onChange={(e) => handlePlannedDurationChange(node.id, Number(e.target.value))}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>天</span>
                </div>
              )}
            </td>

            {/* 9. 實際開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '165px', minWidth: '165px' }}>
              <DatePicker
                className="wbs-datepicker-field"
                value={aStart}
                onChange={(val: string) => handleActualStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 10. 實際結束 (自動計算，純文字顯示) */}
            <td style={{ width: '125px', minWidth: '125px', textAlign: 'center' }}>
              <span className="wbs-readonly-date" style={{ color: aEnd ? '#059669' : 'inherit' }}>
                {aEnd || '—'}
              </span>
            </td>

            {/* 11. 實際工期 (如果是檢查點則固定 0 天) */}
            <td style={{ width: '95px', minWidth: '95px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-direct-days milestone-zero" style={{ display: 'inline-block', lineHeight: '28px' }}>
                  0 天
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <input
                    type="number"
                    min="0"
                    className="wbs-direct-days"
                    value={aDur}
                    onChange={(e) => handleActualDurationChange(node.id, Number(e.target.value))}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>天</span>
                </div>
              )}
            </td>

            {/* 12. 工項進度 */}
            <td style={{ width: '90px', minWidth: '90px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
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

            {/* 13. 狀態 (使用 @kawawei/frontend-modules Select) */}
            <td style={{ width: '125px', minWidth: '125px' }}>
              <Select
                className="wbs-select-field"
                options={STATUS_SELECT_OPTIONS}
                value={node.status || 'NOT_STARTED'}
                onChange={(val: string | number | (string | number)[]) =>
                  handleStatusSelect(node.id, String(val) as WbsStatus)
                }
                width="100%"
                height="30px"
              />
            </td>

            {/* 14. 操作 (新增子任務 / 菱形新增檢查點 / 刪除) */}
            <td style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>
              <div className="wbs-actions">
                <button
                  type="button"
                  className="wbs-action-btn add"
                  onClick={() => handleAddChildTask(node, false)}
                  title="新增子工項任務"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn checkpoint"
                  onClick={() => handleAddChildTask(node, true)}
                  title="新增里程碑檢查點 (0工期)"
                >
                  <Diamond size={15} fill="#f59e0b" color="#b45309" />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn delete"
                  onClick={() => handleDeleteNode(node.id)}
                  title="刪除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </td>
          </tr>

          {/* 遞迴子任務 */}
          {hasChildren && isExpanded && renderRows(node.children || [], depth + 1, displayCode)}
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
            <CheckCircle2 size={15} />
            <span>
              已完成 {stats.completedTasks} / {stats.totalTasks} 個工項任務 ({stats.overallPercent}%)
            </span>
          </span>
          {stats.totalMilestones > 0 && (
            <span className="wbs-stat-pill" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
              <Diamond size={14} fill="#f59e0b" />
              <span>
                里程碑檢查點 {stats.completedMilestones} / {stats.totalMilestones} 個達成
              </span>
            </span>
          )}
        </div>

        <div className="wbs-btn-group">
          <Button variant="secondary" size="md" onClick={() => handleToggleAll(true)}>
            <ChevronDown size={16} />
            <span>展開全部</span>
          </Button>
          <Button variant="secondary" size="md" onClick={() => handleToggleAll(false)}>
            <ChevronUp size={16} />
            <span>收合全部</span>
          </Button>
          <Button variant="secondary" size="md" onClick={() => handleAddRootMilestone(true)}>
            <Diamond size={15} fill="#f59e0b" />
            <span>新增檢查點</span>
          </Button>
          <Button variant="primary" size="md" onClick={() => handleAddRootMilestone(false)}>
            <Plus size={16} />
            <span>新增主階段</span>
          </Button>
        </div>
      </div>

      {/* 樹狀階層 WBS 雙層表頭即時編輯表格 */}
      <div className="wbs-table-container">
        <table className="wbs-table">
          <thead>
            <tr className="wbs-th-row-1">
              <th rowSpan={2} style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>WBS 編號</th>
              <th rowSpan={2} style={{ width: '18%', minWidth: '260px', textAlign: 'center' }}>工作項目名稱</th>
              <th rowSpan={2} style={{ width: '8%', minWidth: '135px', textAlign: 'center' }}>前置任務</th>
              <th rowSpan={2} style={{ width: '5%', minWidth: '85px', textAlign: 'center' }}>依賴類型</th>
              <th rowSpan={2} style={{ width: '8%', minWidth: '135px', textAlign: 'center' }}>負責人</th>
              <th colSpan={3} className="wbs-th-group planned" style={{ textAlign: 'center' }}>預計時程</th>
              <th colSpan={3} className="wbs-th-group actual" style={{ textAlign: 'center' }}>實際時程</th>
              <th rowSpan={2} style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>進度</th>
              <th rowSpan={2} style={{ width: '7%', minWidth: '125px', textAlign: 'center' }}>狀態</th>
              <th rowSpan={2} style={{ width: '7%', minWidth: '120px', textAlign: 'center' }}>操作</th>
            </tr>
            <tr className="wbs-th-row-2">
              <th style={{ width: '10%', minWidth: '165px', textAlign: 'center' }}>開始日期</th>
              <th style={{ width: '7%', minWidth: '125px', textAlign: 'center' }}>結束日期</th>
              <th style={{ width: '5%', minWidth: '95px', textAlign: 'center' }}>工期</th>
              <th style={{ width: '10%', minWidth: '165px', textAlign: 'center' }}>開始日期</th>
              <th style={{ width: '7%', minWidth: '125px', textAlign: 'center' }}>結束日期</th>
              <th style={{ width: '5%', minWidth: '95px', textAlign: 'center' }}>工期</th>
            </tr>
          </thead>
          <tbody>{renderRows(nodes)}</tbody>
        </table>
      </div>
    </div>
  );
};
