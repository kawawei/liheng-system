import * as React from 'react';

/**
 * @file custom-elements.d.ts
 * @description @kawawei/frontend-modules Web Components JSX 型別宣告
 * @description_en Declares React 18/19 JSX IntrinsicElements for caas-* Web Components
 * @description_zh 為 @kawawei/frontend-modules 之 Web Components 擴充 React 18/19 JSX 型別宣告
 */

interface CaasMetricCardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  value?: string | number;
  trend?: string;
  'trend-type'?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

interface CaasButtonProps extends React.ButtonHTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface CaasTextFieldProps extends React.InputHTMLAttributes<HTMLElement> {
  label?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value?: string;
}

interface CaasStatusBadgeProps extends React.HTMLAttributes<HTMLElement> {
  label?: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

interface CaasElements {
  'caas-system': React.HTMLAttributes<HTMLElement> & {
    'initial-module'?: string;
    'refresh-interval'?: string | number;
    'chart-theme'?: 'light' | 'dark';
    'sidebar-mode'?: 'push' | 'overlay';
    'show-mode-toggle'?: boolean | string;
    'redirect-url'?: string;
  };
  'caas-metric-card': CaasMetricCardProps;
  'caas-button': CaasButtonProps;
  'caas-text-field': CaasTextFieldProps;
  'caas-status-badge': CaasStatusBadgeProps;
  'caas-alert': React.HTMLAttributes<HTMLElement> & {
    type?: 'success' | 'warning' | 'error' | 'info';
    message?: string;
    closable?: boolean;
  };
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends CaasElements {}
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends CaasElements {}
  }
}

export {};
