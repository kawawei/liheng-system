import * as React from 'react';

/**
 * @file custom-elements.d.ts
 * @description @kawawei/frontend-modules Web Components JSX 類型定義
 * @description_en Declares TypeScript JSX IntrinsicElements for CaaS Web Components
 * @description_zh 為 @kawawei/frontend-modules 之 Web Components 擴充 React JSX 型別宣告
 */

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'caas-system': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'initial-module'?: string;
        'refresh-interval'?: string | number;
        'chart-theme'?: 'light' | 'dark';
        'sidebar-mode'?: 'push' | 'overlay';
        'show-mode-toggle'?: boolean | string;
        'redirect-url'?: string;
      }, HTMLElement>;
      'caas-metric-card': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        title?: string;
        value?: string | number;
        trend?: string;
        'trend-type'?: 'positive' | 'negative' | 'neutral';
        icon?: string;
      }, HTMLElement>;
      'caas-button': React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLElement> & {
        variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
      }, HTMLElement>;
      'caas-text-field': React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLElement> & {
        label?: string;
        placeholder?: string;
        required?: boolean;
        type?: string;
        value?: string;
      }, HTMLElement>;
      'caas-status-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        label?: string;
        variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
      }, HTMLElement>;
      'caas-alert': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        type?: 'success' | 'warning' | 'error' | 'info';
        message?: string;
        closable?: boolean;
      }, HTMLElement>;
    }
  }
}
