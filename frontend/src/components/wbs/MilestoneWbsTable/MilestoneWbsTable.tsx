/**
 * @file MilestoneWbsTable.tsx
 * @description WBS 里程碑即時編輯表格組件 / Milestone WBS Live Editable Table Component
 * @description_en Direct spreadsheet-style hierarchical WBS table integrating @kawawei/frontend-modules (Select, DatePicker), row selection highlight, predecessor dependency status validation with toast warnings, and auto WBS re-indexing.
 * @description_zh 整合 @kawawei/frontend-modules (Select, DatePicker) 之直出即時編輯 WBS 樹狀表格，支援項目選中狀態、前置依賴狀態防呆驗證 (FS/SS/FF/SF 阻擋並跳出 Toast 警告提示)，及自動 WBS 序號重編。
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
import { Toast, ToastType } from '../../toast';
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

const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// ========================================
// WBS 序號自動遞迴重新編號工具 / Auto Reindex
// ========================================
const reindexWbsNodes = (list: WbsNode[], prefix = ''): WbsNode[] => {
  return list.map((node, index) => {
    const code = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
    return {
      ...node,
      wbsCode: code,
      children: node.children && node.children.length > 0
        ? reindexWbsNodes(node.children, code)
        : node.children,
    };
  });
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 提示彈出輔助函數
  const showToast = (message: string, type: ToastType = 'warning') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  // ========================================
  // 建立 WBS 編號與節點的快速查找 Map
  // ========================================
  const codeMap = useMemo(() => {
    const map = new Map<string, WbsNode>();
    const build = (list: WbsNode[]) => {
      list.forEach((n) => {
        if (n.wbsCode) map.set(n.wbsCode, n);
        if (n.children && n.children.length > 0) build(n.children);
      });
    };
    build(nodes);
    return map;
  }, [nodes]);

  // ========================================
  // 提取所有可用前置任務選項 (僅顯示 WBS 序號)
  // ========================================
  const predecessorSelectOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [
      { label: '無', value: '' },
    ];
    const collect = (list: WbsNode[]) => {
      list.forEach((n) => {
        const code = n.wbsCode || '';
        if (code) {
          options.push({
            label: code,
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
        } else if (!node.children || node.children.length === 0) {
          totalTasks += 1;
          if (node.status === 'COMPLETED') {
            completedTasks += 1;
          }
        }
        if (node.children && node.children.length > 0) {
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
  const handleToggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
  // 排程連動推算 / Schedule Cascade Calculation
  // ========================================
  const cascadeScheduleUpdates = (allNodes: WbsNode[]): WbsNode[] => {
    const map = new Map<string, WbsNode>();
    const buildMap = (list: WbsNode[]) => {
      list.forEach((n) => {
        if (n.wbsCode) map.set(n.wbsCode, n);
        if (n.children && n.children.length > 0) buildMap(n.children);
      });
    };
    buildMap(allNodes);

    const updateCascade = (list: WbsNode[]): WbsNode[] => {
      return list.map((node) => {
        let updatedNode = { ...node };

        if (node.predecessorCode && map.has(node.predecessorCode)) {
          const pred = map.get(node.predecessorCode)!;
          const predPlannedEnd = pred.plannedEndDate || pred.plannedStartDate || '';
          const predPlannedStart = pred.plannedStartDate || '';
          const depType = node.dependencyType || 'FS';
          const dur = node.isMilestone ? 0 : (node.plannedDurationDays || node.durationDays || 14);

          let calculatedStart = node.plannedStartDate || '';

          if (depType === 'FS' && predPlannedEnd) {
            calculatedStart = addDaysToDate(predPlannedEnd, 1);
          } else if (depType === 'SS' && predPlannedStart) {
            calculatedStart = predPlannedStart;
          }

          if (calculatedStart) {
            if (node.allowPullForward) {
              const newEnd = calculateEndDate(calculatedStart, dur);
              updatedNode = {
                ...updatedNode,
                plannedStartDate: calculatedStart,
                plannedEndDate: newEnd,
                startDate: calculatedStart,
                endDate: newEnd,
              };
            } else {
              const currentPlannedStart = node.plannedStartDate || calculatedStart;
              if (calculatedStart > currentPlannedStart) {
                const newEnd = calculateEndDate(calculatedStart, dur);
                updatedNode = {
                  ...updatedNode,
                  plannedStartDate: calculatedStart,
                  plannedEndDate: newEnd,
                  startDate: calculatedStart,
                  endDate: newEnd,
                };
              }
            }
          }
        }

        if (updatedNode.children && updatedNode.children.length > 0) {
          updatedNode.children = updateCascade(updatedNode.children);
        }
        return updatedNode;
      });
    };

    return updateCascade(allNodes);
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

    const newNodes = cascadeScheduleUpdates(updateList(nodes));
    setNodes(newNodes);

    if (onProgressUpdate) {
      let total = 0;
      let completed = 0;
      const count = (items: WbsNode[]) => {
        items.forEach((n) => {
          if (!n.isMilestone && (!n.children || n.children.length === 0)) {
            total++;
            if (n.status === 'COMPLETED') completed++;
          }
          if (n.children && n.children.length > 0) count(n.children);
        });
      };
      count(newNodes);
      onProgressUpdate(total > 0 ? Math.round((completed / total) * 100) : 0);
    }
  };

  // 預計開始日變更
  const handlePlannedStartChange = (nodeId: string, newStart: string) => {
    updateNode(nodeId, (node) => {
      const dur = node.isMilestone ? 0 : (node.plannedDurationDays || node.durationDays || 14);
      const end = node.isMilestone ? newStart : calculateEndDate(newStart, dur);
      return {
        ...node,
        plannedStartDate: newStart,
        plannedEndDate: end,
        startDate: newStart,
        endDate: end,
      };
    });
  };

  // 預計工期變更
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

  // 實際開始日變更
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

  // 實際工期變更
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

  // ========================================
  // 前置依賴狀態防呆驗證邏輯 / Predecessor Status Validation
  // ========================================
  const validatePredecessorConstraint = (node: WbsNode, targetStatus: WbsStatus): boolean => {
    if (targetStatus === 'NOT_STARTED') return true;
    if (!node.predecessorCode || !codeMap.has(node.predecessorCode)) return true;

    const pred = codeMap.get(node.predecessorCode)!;
    const depType = node.dependencyType || 'FS';
    const predStatus = pred.status || 'NOT_STARTED';

    if (depType === 'FS') {
      // FS: 前置必須為 COMPLETED，本工項方可切換為 IN_PROGRESS 或 COMPLETED
      if (predStatus !== 'COMPLETED') {
        const targetText = targetStatus === 'COMPLETED' ? '已完成' : '進行中';
        showToast(`前置任務 (${pred.wbsCode} ${pred.name}) 尚未完成，無法切換為「${targetText}」`, 'warning');
        return false;
      }
    } else if (depType === 'SS') {
      // SS: 前置必須至少為 IN_PROGRESS 或 COMPLETED，本工項方可開始
      if (predStatus === 'NOT_STARTED') {
        const targetText = targetStatus === 'COMPLETED' ? '已完成' : '進行中';
        showToast(`前置任務 (${pred.wbsCode} ${pred.name}) 尚未開始，無法切換為「${targetText}」`, 'warning');
        return false;
      }
    } else if (depType === 'FF') {
      // FF: 前置必須為 COMPLETED，本工項方可標記為 COMPLETED (可進行中)
      if (targetStatus === 'COMPLETED' && predStatus !== 'COMPLETED') {
        showToast(`前置任務 (${pred.wbsCode} ${pred.name}) 尚未完成，無法切換為「已完成」`, 'warning');
        return false;
      }
    } else if (depType === 'SF') {
      // SF: 前置必須至少為 IN_PROGRESS 或 COMPLETED，本工項方可標記為 COMPLETED
      if (targetStatus === 'COMPLETED' && predStatus === 'NOT_STARTED') {
        showToast(`前置任務 (${pred.wbsCode} ${pred.name}) 尚未開始，無法切換為「已完成」`, 'warning');
        return false;
      }
    }

    return true;
  };

  // 進度百分比變更
  const handleProgressChange = (nodeId: string, newPct: number) => {
    const targetNode = Array.from(codeMap.values()).find((n) => n.id === nodeId);
    const validPct = Math.min(100, Math.max(0, newPct || 0));
    const nextStatus: WbsStatus = validPct === 100 ? 'COMPLETED' : validPct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    if (targetNode && !validatePredecessorConstraint(targetNode, nextStatus)) {
      return;
    }

    updateNode(nodeId, (node) => ({
      ...node,
      progress: validPct,
      status: nextStatus,
    }));
  };

  // 狀態下拉選單切換
  const handleStatusSelect = (nodeId: string, newStatus: WbsStatus) => {
    const targetNode = Array.from(codeMap.values()).find((n) => n.id === nodeId);
    if (targetNode && !validatePredecessorConstraint(targetNode, newStatus)) {
      return;
    }

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

  // 勾選是否允許提前 (Pull-Forward)
  const handleTogglePullForward = (nodeId: string, checked: boolean) => {
    updateNode(nodeId, (node) => ({
      ...node,
      allowPullForward: checked,
    }));
  };

  // ========================================
  // 在選中項目後方 (或末尾) 插入新項目 / Insert After Selected
  // ========================================
  const handleInsertItem = (isMilestoneCheckpoint: boolean) => {
    const newId = `wbs_${Date.now()}`;
    const pStart = '2026-08-15';
    const pDur = isMilestoneCheckpoint ? 0 : 14;

    const newNode: WbsNode = {
      id: newId,
      projectId,
      name: isMilestoneCheckpoint ? '新里程碑檢查點' : '新工作項目',
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

    if (!selectedNodeId) {
      const newNodes = reindexWbsNodes([...nodes, newNode]);
      setNodes(newNodes);
      setSelectedNodeId(newId);
      return;
    }

    const insertAfterInList = (list: WbsNode[]): { found: boolean; list: WbsNode[] } => {
      const idx = list.findIndex((n) => n.id === selectedNodeId);
      if (idx !== -1) {
        const item = list[idx];
        newNode.parentId = item.parentId;
        newNode.predecessorCode = item.wbsCode;
        newNode.dependencyType = 'FS';
        const newList = [...list];
        newList.splice(idx + 1, 0, newNode);
        return { found: true, list: newList };
      }

      let found = false;
      const newList = list.map((n) => {
        if (!found && n.children && n.children.length > 0) {
          const res = insertAfterInList(n.children);
          if (res.found) {
            found = true;
            return { ...n, children: res.list };
          }
        }
        return n;
      });

      return { found, list: newList };
    };

    const res = insertAfterInList(nodes);
    const updatedList = res.found ? res.list : [...nodes, newNode];
    const reindexed = reindexWbsNodes(updatedList);
    setNodes(reindexed);
    setSelectedNodeId(newId);
  };

  // 新增子工項或子檢查點 (透過操作列按鈕)
  const handleAddChildTask = (parentNode: WbsNode, isCheckpoint = false, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newId = `wbs_${Date.now()}`;
    const pStart = parentNode.plannedStartDate || parentNode.startDate || '2026-08-15';
    const pDur = isCheckpoint ? 0 : 14;
    const newChild: WbsNode = {
      id: newId,
      projectId,
      parentId: parentNode.id,
      name: isCheckpoint ? '新里程碑檢查點' : '新工作任務項目',
      isMilestone: isCheckpoint,
      predecessorCode: parentNode.children && parentNode.children.length > 0
        ? parentNode.children[parentNode.children.length - 1].wbsCode
        : parentNode.wbsCode,
      dependencyType: 'FS',
      allowPullForward: false,
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

    const newNodes = reindexWbsNodes(addChild(nodes));
    setNodes(newNodes);
    setSelectedNodeId(newId);
  };

  // 直出刪除節點
  const handleDeleteNode = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

    const newNodes = reindexWbsNodes(removeNode(nodes));
    setNodes(newNodes);
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // ========================================
  // 遞迴渲染直出可編輯列 / Recursive Row Renderer
  // ========================================
  const renderRows = (list: WbsNode[], depth = 0): React.ReactNode => {
    return list.map((node) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      const isExpanded = node.isExpanded !== false;
      const isRoot = depth === 0;
      const isSelected = selectedNodeId === node.id;

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
          <tr
            className={`wbs-row ${isRoot ? 'is-root' : ''} ${node.isMilestone ? 'is-milestone' : ''} ${isSelected ? 'is-selected' : ''}`}
            onClick={() => setSelectedNodeId(node.id)}
          >
            {/* 1. WBS 編號 (最左側獨立欄位，含層級縮排與展開按鈕) */}
            <td style={{ width: '90px', minWidth: '90px' }}>
              <div className="wbs-code-cell" style={{ paddingLeft: `${depth * 16}px` }}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="wbs-expand-btn"
                    onClick={(e) => handleToggleExpand(node.id, e)}
                    title={isExpanded ? '收合' : '展開'}
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="wbs-expand-placeholder" />
                )}

                <span className="wbs-code-badge">{node.wbsCode}</span>
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

            {/* 3. 前置依賴組合欄位 (前置工項 Select + 依賴類型 Select + 允許提前 Checkbox) */}
            <td style={{ width: '255px', minWidth: '255px' }}>
              <div className="wbs-dependency-composite-cell">
                {/* 前置工項 Select (只顯示 WBS 序號) */}
                <div style={{ width: '95px', flexShrink: 0 }}>
                  <Select
                    className="wbs-select-field"
                    placeholder="無"
                    options={predecessorSelectOptions}
                    value={node.predecessorCode || ''}
                    onChange={(val: string | number | (string | number)[]) =>
                      updateNode(node.id, (n) => ({ ...n, predecessorCode: String(val) }))
                    }
                    width="100%"
                    height="30px"
                  />
                </div>

                {/* 依賴類型 Select */}
                <div style={{ width: '65px', flexShrink: 0 }}>
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
                </div>

                {/* 允許提前 (Pull-Forward) 放大勾選框 */}
                <label
                  className={`wbs-pull-forward-toggle ${node.allowPullForward ? 'active' : ''}`}
                  title={
                    node.allowPullForward
                      ? '【策略 A：積極提前啟動】前置提早完成時，後續依賴的項目自動往前拉早開始，縮短總工期。'
                      : '【策略 B：維持原計畫基準】即使前置提前完成仍鎖定原計畫開始日（若前置延誤則自動順延）。'
                  }
                >
                  <input
                    type="checkbox"
                    checked={Boolean(node.allowPullForward)}
                    onChange={(e) => handleTogglePullForward(node.id, e.target.checked)}
                  />
                  <span>提前</span>
                </label>
              </div>
            </td>

            {/* 4. 負責人 (使用 @kawawei/frontend-modules Select) */}
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

            {/* 5. 預計開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '165px', minWidth: '165px' }}>
              <DatePicker
                className="wbs-datepicker-field"
                value={pStart}
                onChange={(val: string) => handlePlannedStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 6. 預計結束 (如果是檢查點則不顯示結束日期) */}
            <td style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-milestone-na">—</span>
              ) : (
                <span className="wbs-readonly-date auto-calc">{pEnd || '—'}</span>
              )}
            </td>

            {/* 7. 預計工期 (如果是檢查點則不顯示工期) */}
            <td style={{ width: '90px', minWidth: '90px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-milestone-na">—</span>
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

            {/* 8. 實際開始 (使用 @kawawei/frontend-modules DatePicker) */}
            <td style={{ width: '165px', minWidth: '165px' }}>
              <DatePicker
                className="wbs-datepicker-field"
                value={aStart}
                onChange={(val: string) => handleActualStartChange(node.id, val)}
                width="100%"
              />
            </td>

            {/* 9. 實際結束 (如果是檢查點則不顯示結束日期) */}
            <td style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-milestone-na">—</span>
              ) : (
                <span className="wbs-readonly-date" style={{ color: aEnd ? '#059669' : 'inherit' }}>
                  {aEnd || '—'}
                </span>
              )}
            </td>

            {/* 10. 實際工期 (如果是檢查點則不顯示工期) */}
            <td style={{ width: '90px', minWidth: '90px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-milestone-na">—</span>
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

            {/* 11. 工項進度 (如果是檢查點則不顯示百分比進度) */}
            <td style={{ width: '90px', minWidth: '90px', textAlign: 'center' }}>
              {node.isMilestone ? (
                <span className="wbs-milestone-na">—</span>
              ) : (
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
              )}
            </td>

            {/* 12. 狀態 (使用 @kawawei/frontend-modules Select) */}
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

            {/* 13. 操作 (新增子任務 / 菱形新增檢查點 / 刪除) */}
            <td style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>
              <div className="wbs-actions">
                <button
                  type="button"
                  className="wbs-action-btn add"
                  onClick={(e) => handleAddChildTask(node, false, e)}
                  title="新增子工項任務"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn checkpoint"
                  onClick={(e) => handleAddChildTask(node, true, e)}
                  title="新增子里程碑檢查點 (無工期/結束日/進度)"
                >
                  <Diamond size={15} fill="#f59e0b" color="#b45309" />
                </button>
                <button
                  type="button"
                  className="wbs-action-btn delete"
                  onClick={(e) => handleDeleteNode(node.id, e)}
                  title="刪除"
                >
                  <Trash2 size={15} />
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
      {/* Toast 提示容器 */}
      {toast && (
        <div className="toast-container">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

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
          <Button variant="secondary" size="md" onClick={() => handleInsertItem(true)}>
            <Diamond size={15} fill="#f59e0b" />
            <span>{selectedNodeId ? '在選中項後新增檢查點' : '新增檢查點'}</span>
          </Button>
          <Button variant="primary" size="md" onClick={() => handleInsertItem(false)}>
            <Plus size={16} />
            <span>{selectedNodeId ? '在選中項後新增項目' : '新增主項目'}</span>
          </Button>
        </div>
      </div>

      {/* 樹狀階層 WBS 雙層表頭即時編輯表格 */}
      <div className="wbs-table-container">
        <table className="wbs-table">
          <thead>
            <tr className="wbs-th-row-1">
              <th rowSpan={2} style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>WBS 編號</th>
              <th rowSpan={2} style={{ width: '16%', minWidth: '260px', textAlign: 'center' }}>工作項目名稱</th>
              <th rowSpan={2} style={{ width: '13%', minWidth: '255px', textAlign: 'center' }}>前置依賴 (項目 / 關係 / 提前)</th>
              <th rowSpan={2} style={{ width: '7%', minWidth: '135px', textAlign: 'center' }}>負責人</th>
              <th colSpan={3} className="wbs-th-group planned" style={{ textAlign: 'center' }}>預計時程</th>
              <th colSpan={3} className="wbs-th-group actual" style={{ textAlign: 'center' }}>實際時程</th>
              <th rowSpan={2} style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>進度</th>
              <th rowSpan={2} style={{ width: '7%', minWidth: '125px', textAlign: 'center' }}>狀態</th>
              <th rowSpan={2} style={{ width: '7%', minWidth: '120px', textAlign: 'center' }}>操作</th>
            </tr>
            <tr className="wbs-th-row-2">
              <th style={{ width: '9%', minWidth: '165px', textAlign: 'center' }}>開始日期</th>
              <th style={{ width: '7%', minWidth: '120px', textAlign: 'center' }}>結束日期</th>
              <th style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>工期</th>
              <th style={{ width: '9%', minWidth: '165px', textAlign: 'center' }}>開始日期</th>
              <th style={{ width: '7%', minWidth: '120px', textAlign: 'center' }}>結束日期</th>
              <th style={{ width: '5%', minWidth: '90px', textAlign: 'center' }}>工期</th>
            </tr>
          </thead>
          <tbody>{renderRows(nodes)}</tbody>
        </table>
      </div>
    </div>
  );
};
