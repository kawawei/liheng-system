import React from 'react';
import { StatusBadge, BadgeVariant } from '../../components/status-badge/StatusBadge';
import { IssueCategory } from '../../types';
import { IconName } from '../../components/icon/TextIcon';

/**
 * @file IssueCategoryBadge.tsx
 * @description 問題分類標籤組件 / Issue Category Badge Component
 * @description_en Renders semantic colored badge for issue classification
 * @description_zh 渲染問題分類標籤 (系統缺陷、介面顯示、效能問題、需求變更等)
 */

interface IssueCategoryBadgeProps {
  category: IssueCategory;
}

const CATEGORY_CONFIG: Record<
  IssueCategory,
  { label: string; variant: BadgeVariant; icon: IconName }
> = {
  BUG: { label: '缺陷 Bug', variant: 'danger', icon: 'bug' },
  UI_UX: { label: '介面 UI/UX', variant: 'info', icon: 'layers' },
  PERFORMANCE: { label: '效能問題', variant: 'warning', icon: 'activity' },
  FEATURE_REQUEST: { label: '需求建議', variant: 'success', icon: 'plus' },
  DATA_ISSUE: { label: '資料異常', variant: 'warning', icon: 'danger' },
  OTHER: { label: '其他諮詢', variant: 'neutral', icon: 'message' }
};

export const IssueCategoryBadge: React.FC<IssueCategoryBadgeProps> = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || { label: category, variant: 'neutral', icon: 'bug' };
  return <StatusBadge label={config.label} variant={config.variant} icon={config.icon} />;
};
