import React, { useState } from 'react';
import { InteractionLog } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { Button } from '../../button/Button';
import { SelectField, SelectOption } from '../../input/SelectField';
import './AddLogModal.css';

/**
 * @file AddLogModal.tsx
 * @description 新增聯繫紀錄彈窗組件 / Add Interaction Log Modal Component
 * @description_en Modal for submitting new contact interaction log (FB, IG, Threads, LINE, Phone)
 * @description_zh 新增聯繫紀錄彈窗，支援管道選擇與精緻適中寬度之紀要輸入框
 */

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (logType: InteractionLog['type'], summary: string) => void;
}

const LOG_TYPE_OPTIONS: SelectOption[] = [
  { value: 'line', label: 'LINE 訊息', iconName: 'message' },
  { value: 'phone', label: '電話溝通', iconName: 'phone' },
  { value: 'fb', label: 'FB 私訊', iconName: 'fb' },
  { value: 'ig', label: 'IG 訊息', iconName: 'ig' },
  { value: 'threads', label: 'Threads 互動', iconName: 'threads' }
];

export const AddLogModal: React.FC<AddLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [logType, setLogType] = useState<InteractionLog['type']>('line');
  const [summary, setSummary] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    onSubmit(logType, summary.trim());
    setSummary('');
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="add-log-modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TextIcon name="plus" size="md" />
            <span>新增聯繫紀錄</span>
          </div>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">聯繫管道</label>
            <SelectField
              options={LOG_TYPE_OPTIONS}
              value={logType}
              onChange={(v) => setLogType(v as any)}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">聯繫紀要重點</label>
            <textarea
              className="form-input"
              rows={4}
              value={summary}
              placeholder="請輸入溝通重點紀要..."
              onChange={(e) => setSummary(e.target.value)}
              style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary" disabled={!summary.trim()}>
              <TextIcon name="plus" size="sm" />
              <span>確認新增</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
