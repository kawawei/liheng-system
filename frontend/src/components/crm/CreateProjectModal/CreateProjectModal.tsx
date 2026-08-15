/**
 * @file CreateProjectModal.tsx
 * @description 客戶轉正式專案立案彈窗組件 / Project Initiation Modal Component
 * @description_en Modal for converting a CRM client to an official project, auto-populating client metadata and initializing WBS
 * @description_zh 為 CRM 客戶進行正式立案之彈窗，自動帶入客戶基本資料，設定案號、合約金額、時程並初始化 WBS 專案
 */

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Rocket } from 'lucide-react';
import { Client, Project, ProjectStage } from '../../../types';
import { Button } from '../../button';
import './CreateProjectModal.css';

interface CreateProjectModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSubmit: (newProject: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  client,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !client) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeliveryDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  })();

  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [amountUntaxed, setAmountUntaxed] = useState('1000000');
  const [startDate, setStartDate] = useState(todayStr);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(defaultDeliveryDate);
  const [assignedEngineers, setAssignedEngineers] = useState<string[]>(['張工程師', '李工程師']);
  const [stage, setStage] = useState<ProjectStage>('development');
  const [applyWbsTemplate, setApplyWbsTemplate] = useState(true);

  useEffect(() => {
    if (client) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const todayCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
      setProjectCode(`PJ-${todayCode}-${randomCode}`);
      setProjectName(`${client.name} ${client.systemType || '軟體系統'}開發專案`);
    }
  }, [client]);

  // 計算總工期天數
  const calculatedDurationDays = (() => {
    const start = new Date(startDate);
    const end = new Date(expectedDeliveryDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 90;
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectCode.trim()) return;

    const untaxed = Number(amountUntaxed) || 0;
    const tax = Math.round(untaxed * 0.05);
    const total = untaxed + tax;

    const newProject: Project = {
      id: `pj_${Date.now()}`,
      projectCode: projectCode.trim(),
      name: projectName.trim(),
      clientId: client.id,
      clientName: client.companyName || client.name,
      stage,
      healthStatus: 'healthy',
      progressPercent: 0,
      assignedEngineers,
      startDate,
      durationDays: calculatedDurationDays,
      expectedDeliveryDate,
      taxType: 'tax_exclusive',
      isTaxAdded: true,
      amountUntaxed: untaxed,
      taxAmount: tax,
      amountTotal: total,
      paymentStages: [
        { id: `stg_${Date.now()}_1`, name: '第 1 期 簽約訂金', percentage: 40, amount: Math.round(total * 0.4), status: 'pending', dueDate: startDate },
        { id: `stg_${Date.now()}_2`, name: '第 2 期 系統交付款', percentage: 40, amount: Math.round(total * 0.4), status: 'pending', dueDate: expectedDeliveryDate },
        { id: `stg_${Date.now()}_3`, name: '第 3 期 驗收尾款', percentage: 20, amount: Math.round(total * 0.2), status: 'pending', dueDate: expectedDeliveryDate },
      ],
      changeOrders: [],
    };

    onSubmit(newProject);
  };

  return (
    <div className="create-project-modal-overlay" onClick={onClose}>
      <div className="create-project-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="create-project-modal-header">
          <div className="create-project-modal-title">
            <Rocket size={20} color="#2563eb" />
            <span>為客戶正式立案（轉為正式專案）</span>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={onClose}
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="create-project-modal-body">
            {/* 客戶名稱 & 專案名稱 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">主約客戶名稱</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={client.companyName || client.name}
                  disabled
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">客戶對口窗口</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={`${client.contactPerson} (${client.contactPhone})`}
                  disabled
                />
              </div>
            </div>

            <div className="create-project-field-group">
              <label className="create-project-field-label">正式專案名稱 *</label>
              <input
                type="text"
                className="create-project-field-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="例如：台元半導體 IoT 物聯網監控平台"
                required
              />
            </div>

            {/* 案號與金額 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">專案案號 *</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  placeholder="PJ-YYYYMMDD-XXXX"
                  required
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">合約總金額 (未稅 NT$) *</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="create-project-field-input"
                  value={amountUntaxed}
                  onChange={(e) => setAmountUntaxed(e.target.value)}
                  placeholder="1000000"
                  required
                />
              </div>
            </div>

            {/* 開工日期與預計交付日 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">立案開工日期</label>
                <input
                  type="date"
                  className="create-project-field-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">
                  預計交付結案日 (約 {calculatedDurationDays} 天工期)
                </label>
                <input
                  type="date"
                  className="create-project-field-input"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 負責工程師與初始階段 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">主責工程師團隊</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={assignedEngineers.join(', ')}
                  onChange={(e) =>
                    setAssignedEngineers(
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="張工程師, 李工程師"
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">初始專案階段</label>
                <select
                  className="create-project-field-input"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProjectStage)}
                >
                  <option value="development">開發中</option>
                  <option value="testing">測試驗證</option>
                  <option value="delivery">交付驗收</option>
                  <option value="closed">正式結案</option>
                  <option value="maintenance">保固維護</option>
                </select>
              </div>
            </div>

            {/* 標準 WBS 範本勾選 */}
            <label className="create-project-template-box">
              <input
                type="checkbox"
                checked={applyWbsTemplate}
                onChange={(e) => setApplyWbsTemplate(e.target.checked)}
              />
              <span>
                <strong>自動套用標準軟體開發 WBS 里程碑架構</strong>（包含架構設計、核心開發、整合測試與驗收交付等階層與關鍵檢查點）
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="create-project-modal-footer">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" type="submit">
              <FolderPlus size={16} />
              <span>確認立案並前往專案工作台</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
