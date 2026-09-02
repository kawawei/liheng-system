import React from 'react';
import { StatusBadge, BadgeVariant } from '../../components/status-badge/StatusBadge';
import { IssueStatus } from '../../types';
import { IconName } from '../../components/icon/TextIcon';

/**
 * @file IssueStatusBadge.tsx
 * @description 工單狀態標籤組件 / Issue Status Badge Component
 * @description_en Renders semantic colored badge for issue status without emoji
 * @description_zh 渲染工單處理狀態標籤 (待處理、處理中、已修復、已結案、不予處理)
 */

interface IssueStatusBadgeProps {
  status: IssueStatus;
}

const STATUS_CONFIG: Record<
  IssueStatus,
  { label: string; variant: BadgeVariant; icon: IconName }
> = {
  PENDING: { label: '待處理', variant: 'danger', icon: 'clock' },
  IN_PROGRESS: { label: '處理中', variant: 'warning', icon: 'activity' },
  RESOLVED: { label: '已修復', variant: 'success', icon: 'success' },
  CLOSED: { label: '已結案', variant: 'neutral', icon: 'file-check' },
  REJECTED: { label: '不予處理', variant: 'neutral', icon: 'eye-off' }
};

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, variant: 'neutral', icon: 'clock' };
  return <StatusBadge label={config.label} variant={config.variant} icon={config.icon} />;
};
