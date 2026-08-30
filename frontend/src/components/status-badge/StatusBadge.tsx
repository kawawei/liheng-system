import React from 'react';
import { TextIcon, IconName } from '../icon/TextIcon';

/**
 * @file StatusBadge.tsx
 * @description 狀態徽章組件 / Status Badge Component
 * @description_en Renders semantic colored badges with text icons without emoji
 * @description_zh 渲染語意化色彩狀態標籤，搭配標準文字圖標且不使用 Emoji
 */

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: IconName;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  icon
}) => {
  const getStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          borderColor: 'var(--color-success-border)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning-text)',
          borderColor: 'var(--color-warning-border)'
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          borderColor: 'var(--color-danger-border)'
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-info-bg)',
          color: 'var(--color-info-text)',
          borderColor: 'var(--color-info-border)'
        };
      case 'neutral':
      default:
        return {
          backgroundColor: 'var(--bg-muted)',
          color: 'var(--text-secondary)',
          borderColor: 'var(--border-color)'
        };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '13px',
        fontWeight: 600,
        border: '1px solid transparent',
        whiteSpace: 'nowrap',
        ...getStyle()
      }}
    >
      {icon && <TextIcon name={icon} size="sm" />}
      {label}
    </span>
  );
};
