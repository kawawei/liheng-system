import React from 'react';
import { StatusBadge, BadgeVariant } from '../../components/status-badge/StatusBadge';
import { IssueSeverity } from '../../types';
import { IconName } from '../../components/icon/TextIcon';

/**
 * @file IssueSeverityBadge.tsx
 * @description 嚴重程度標籤組件 / Issue Severity Badge Component
 * @description_en Renders semantic colored badge for issue severity levels
 * @description_zh 渲染問題嚴重程度標籤 (致命阻斷、高嚴重度、中等、輕微)
 */

interface IssueSeverityBadgeProps {
  severity: IssueSeverity;
}

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { label: string; variant: BadgeVariant; icon: IconName }
> = {
  CRITICAL: { label: '致命阻斷', variant: 'danger', icon: 'danger' },
  HIGH: { label: '高嚴重度', variant: 'warning', icon: 'warning' },
  MEDIUM: { label: '中等程度', variant: 'info', icon: 'clock' },
  LOW: { label: '輕微問題', variant: 'neutral', icon: 'message' }
};

export const IssueSeverityBadge: React.FC<IssueSeverityBadgeProps> = ({ severity }) => {
  const config = SEVERITY_CONFIG[severity] || { label: severity, variant: 'neutral', icon: 'clock' };
  return <StatusBadge label={config.label} variant={config.variant} icon={config.icon} />;
};
