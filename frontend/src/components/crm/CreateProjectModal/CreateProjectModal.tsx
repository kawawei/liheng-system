import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Rocket } from 'lucide-react';
import { Select, DatePicker } from '@kawawei/frontend-modules';
import { Client, Project, ProjectStage, TaxType } from '../../../types';
import { Button } from '../../button';
import './CreateProjectModal.css';

interface CreateProjectModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSubmit: (newProject: Project) => void;
}

const ENGINEER_OPTIONS = [
  { label: '張工程師', value: '張工程師' },
  { label: '李工程師', value: '李工程師' },
  { label: '王架構師', value: '王架構師' },
  { label: '陳工程師', value: '陳工程師' },
  { label: '蔡工程師', value: '蔡工程師' },
];

const STAGE_OPTIONS = [
  { label: '開發中', value: 'development' },
  { label: '測試驗證', value: 'testing' },
  { label: '交付驗收', value: 'delivery' },
  { label: '正式結案', value: 'closed' },
  { label: '保固維護', value: 'maintenance' },
];

const TAX_OPTIONS = [
  { label: '未稅', value: 'tax_exclusive' },
  { label: '含稅 (已內含 5% 營業稅)', value: 'tax_inclusive' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  client,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !client) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [projectName, setProjectName] = useState('');
  const [projectCode] = useState('');
  const [taxType, setTaxType] = useState<TaxType>('tax_exclusive');
  const [isTaxAdded, setIsTaxAdded] = useState(true); // 選未稅時是否外加 5% 營業稅
  const [amountInput, setAmountInput] = useState('1000000');
  const [startDate, setStartDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState<number>(90);
  const [assignedEngineers, setAssignedEngineers] = useState<string[]>(['張工程師', '李工程師']);
  const [stage, setStage] = useState<ProjectStage>('development');
  const [applyWbsTemplate, setApplyWbsTemplate] = useState(true);

  // 初始化專案名稱
  useEffect(() => {
    if (client) {
      setProjectName(`${client.name} ${client.systemType || '軟體系統'}開發專案`);
    }
  }, [client]);

  // 金額與營業稅 (5%) 即時動態推算
  const parsedInput = Math.max(0, Number(amountInput) || 0);

  const { amountUntaxed, taxAmount, amountTotal } = (() => {
    if (taxType === 'tax_exclusive') {
      const untaxed = parsedInput;
      const tax = isTaxAdded ? Math.round(untaxed * 0.05) : 0;
      const total = untaxed + tax;
      return { amountUntaxed: untaxed, taxAmount: tax, amountTotal: total };
    } else {
      const total = parsedInput;
      const untaxed = Math.round(total / 1.05);
      const tax = total - untaxed;
      return { amountUntaxed: untaxed, taxAmount: tax, amountTotal: total };
    }
  })();

  // 根據「開工日期」+「預估工期天數」自動計算「預計交付結案日」
  const expectedDeliveryDate = (() => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return todayStr;
    const target = new Date(start);
    target.setDate(target.getDate() + (Number(durationDays) || 0));
    return target.toISOString().split('T')[0];
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
      durationDays: Number(durationDays) || 1,
      expectedDeliveryDate,
      taxType,
      isTaxAdded: taxType === 'tax_exclusive' ? isTaxAdded : false,
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="create-project-modal-body">
            {/* 1. 客戶名稱 & 窗口 */}
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

            {/* 2. 正式專案名稱 */}
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

            {/* 3. 負責工程師 (Select 多選核取) 與 初始階段 (Select 單選) - 配置於上半部確保選單展開空間充裕 */}
            <div className="create-project-grid-2">
              <div className="create-project-field-group">
                <label className="create-project-field-label">主責工程師團隊 (下拉核取多選)</label>
                <Select
                  options={ENGINEER_OPTIONS}
                  value={assignedEngineers}
                  multiple
                  showCheckbox
                  placeholder="請勾選主責工程師..."
                  onChange={(v) => setAssignedEngineers(v as string[])}
                  width="100%"
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">初始專案階段</label>
                <Select
                  options={STAGE_OPTIONS}
                  value={stage}
                  onChange={(v) => setStage(v as ProjectStage)}
                  width="100%"
                />
              </div>
            </div>

            {/* 4. 案號 (系統依序號自動生成) & 計稅方式 (使用 @kawawei/frontend-modules Select) */}
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
                <Select
                  options={TAX_OPTIONS}
                  value={taxType}
                  onChange={(v) => setTaxType(v as TaxType)}
                  width="100%"
                />
              </div>
            </div>

            {/* 5. 合約金額輸入 (無上下調節箭頭) 與即時試算 */}
            <div className="create-project-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="create-project-field-label">
                  {taxType === 'tax_exclusive' ? '輸入未稅金額 (NT$) *' : '輸入含稅合約總金額 (NT$) *'}
                </label>
                {/* 未稅模式下自選是否外加 5% 營業稅 */}
                {taxType === 'tax_exclusive' && (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e40af', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isTaxAdded}
                      onChange={(e) => setIsTaxAdded(e.target.checked)}
                      style={{ width: '15px', height: '15px', accentColor: '#2563eb', cursor: 'pointer' }}
                    />
                    <span>外加 5% 營業稅</span>
                  </label>
                )}
              </div>
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

            {/* 6. 開工日期 (DatePicker) & 預估工期天數輸入 & 預計交付結案日 (3欄並排) */}
            <div className="create-project-grid-3">
              <div className="create-project-field-group">
                <label className="create-project-field-label">立案開工日期</label>
                <DatePicker
                  value={startDate}
                  onChange={(val: string) => setStartDate(val)}
                  width="100%"
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">預估工期 (天數) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="create-project-field-input"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  placeholder="90"
                  required
                />
              </div>
              <div className="create-project-field-group">
                <label className="create-project-field-label">預計交付結案日 (自動推算)</label>
                <input
                  type="text"
                  className="create-project-field-input"
                  value={`${expectedDeliveryDate} (共 ${durationDays} 天)`}
                  disabled
                />
              </div>
            </div>

            {/* 7. 標準 WBS 範本勾選 */}
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
