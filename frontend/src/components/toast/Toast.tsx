/**
 * @file Toast.tsx
 * @description 全域 Toast 消息提示組件 / Toast Notification Component
 * @description_en Toast notification banner displaying warnings, errors, and success alerts
 * @description_zh 消息提示條組件，支援 warning、error、success 等類型與自動關閉機制
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface ToastProps {
  type?: ToastType;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'warning',
  message,
  onClose,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={18} color="#d97706" />;
      case 'error':
        return <XCircle size={18} color="#dc2626" />;
      case 'success':
        return <CheckCircle size={18} color="#059669" />;
      default:
        return <Info size={18} color="#2563eb" />;
    }
  };

  return (
    <div className={`toast-item ${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="關閉提示"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
