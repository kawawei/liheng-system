/**
 * @file CreateProjectModal.tsx
 * @description 客戶轉正式專案立案彈窗組件 / Project Initiation Modal Component
 * @description_en Modal for converting a CRM client to an official project, auto-populating client metadata, sequential project code generation, and tax options
 * @description_zh 為 CRM 客戶進行正式立案之彈窗，自動依當日序號生成案號、提供未稅/含稅 5% 計稅選擇與時程推算並初始化 WBS 專案
 */

import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Rocket } from 'lucide-react';
import { Client, Project, ProjectStage, TaxType } from '../../../types';
import { Button } from '../../button';
import { MOCK_PROJECTS } from '../../../mock/projects.mock';
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
  const [taxType, setTaxType] = useState<TaxType>('tax_exclusive');
  const [amountInput, setAmountInput] = useState('1000000');
  const [startDate, setStartDate] = useState(todayStr);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(defaultDeliveryDate);
  const [assignedEngineers, setAssignedEngineers] = useState<string[]>(['張工程師', '李工程師']);
  const [stage, setStage] = useState<ProjectStage>('development');
  const [applyWbsTemplate, setApplyWbsTemplate] = useState(true);

  // 依當日年月日與既有專案數量依序生成案號 (例如：PJ-20260815-0001)
  useEffect(() => {
    if (client) {
      const todayCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const prefix = `PJ-${todayCode}-`;
      const existingToday = MOCK_PROJECTS.filter((p) => p.projectCode?.startsWith(prefix));
      const seq = existingToday.length + 1;
      const seqStr = String(seq).padStart(4, '0');
      setProjectCode(`${prefix}${seqStr}`);
      setProjectName(`${client.name} ${client.systemType || '軟體系統'}開發專案`);
    }
  }, [client]);

  // 金額與營業稅 (5%) 即時動態推算
  const parsedInput = Math.max(0, Number(amountInput) || 0);

  const { amountUntaxed, taxAmount, amountTotal } = (() => {
    if (taxType === 'tax_exclusive') {
      const untaxed = parsedInput;
      const tax = Math.round(untaxed * 0.05);
      const total = untaxed + tax;
      return { amountUntaxed: untaxed, taxAmount: tax, amountTotal: total };
    } else {
      const total = parsedInput;
      const untaxed = Math.round(total / 1.05);
      const tax = total - untaxed;
      return { amountUntaxed: untaxed, taxAmount: tax, amountTotal: total };
    }
  })();

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
      taxType,
      isTaxAdded: taxType === 'tax_exclusive',
      amountUntaxed,
      taxAmount,
      amountTotal,
      paymentStages: [
        { id: `stg_${Date.now()}_1`, name: '第 1 期 簽約訂金', percentage: 40, amount: Math.round(amountTotal * 0.4), status: 'pending', dueDate: startDate },
        { id: `stg_${Date.now()}_2`, name: '第 2 期 系統交付款', percentage: 40, amount: Math.round(amountTotal * 0.4), status: 'pending', dueDate: expectedDeliveryDate },
        { id: `stg_${Date.now()}_3`, name: '第 3 期 驗收尾款', percentage: 20, amount: Math.round(amountTotal * 0.2), status: 'pending', dueDate: expectedDeliveryDate },
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
            {/* 客戶名稱 & 窗口 */}
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

            {/* 專案名稱 */}
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

            {/* 案號 (系統自動生成，不可自行輸入) & 營業稅計稅方式 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">專案案號 (系統依序號自動生成)</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={projectCode}
                  disabled
                  title="案號由系統依照年月日與序號自動生成，不可修改"
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">計稅方式 *</label>
                <select
                  className="create-project-field-input"
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as TaxType)}
                >
                  <option value="tax_exclusive">未稅 (外加 5% 營業稅)</option>
                  <option value="tax_inclusive">含稅 (已內含 5% 營業稅)</option>
                </select>
              </div>
            </div>

            {/* 合約金額輸入 (無上下調節箭頭) 與即時試算 */}
            <div className="create-project-field-group">
              <label className="create-project-field-label">
                {taxType === 'tax_exclusive' ? '輸入未稅金額 (NT$) *' : '輸入含稅合約總金額 (NT$) *'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="create-project-field-input"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="1000000"
                required
              />

              {/* 稅額即時試算摘要條 */}
              <div className="create-project-tax-summary">
                <div className="create-project-tax-item">
                  <span>未稅金額:</span>
                  <strong>NT$ {amountUntaxed.toLocaleString()}</strong>
                </div>
                <div className="create-project-tax-item">
                  <span>營業稅 (5%):</span>
                  <strong>NT$ {taxAmount.toLocaleString()}</strong>
                </div>
                <div className="create-project-tax-item" style={{ color: '#2563eb' }}>
                  <span>合約總計 (含稅):</span>
                  <strong style={{ fontSize: '14px', color: '#1d4ed8' }}>NT$ {amountTotal.toLocaleString()}</strong>
                </div>
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
