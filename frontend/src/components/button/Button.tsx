import React from 'react';
import './Button.css';

/**
 * @file Button.tsx
 * @description 通用按鈕組件 / Generic Button Component
 * @description_en Encapsulates CaaS Web Component caas-button with React props support
 * @description_zh 封裝 @kawawei/frontend-modules 之 caas-button Web Component 供全域使用
 */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <caas-button
      variant={variant}
      size={size}
      disabled={disabled}
      className={`custom-button ${className}`}
      {...props}
    >
      {children}
    </caas-button>
  );
};
