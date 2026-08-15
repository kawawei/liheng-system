import React, { useState, useEffect } from 'react';
import { Project, PaymentStage, Client } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { Button } from '../../button/Button';
import { TextField } from '../../input/TextField';
import { SelectField, SelectOption } from '../../input/SelectField';
import { INITIAL_CLIENTS_MOCK } from '../../../mock/clients.mock';
import './ProjectCreateModal.css';

/**
 * @file ProjectCreateModal.tsx
 * @description 一鍵立案 / 新增專案彈窗組件 / Project Creation Modal Component
 * @description_en Modal for project chartering with duration date calculation, tax calculations, and dynamic dual-way payment stages
 * @description_zh 負責專案立案流程，支援工期結案日自動計算、含稅/未稅/外加5%稅金試算與動態階段雙向換算
 */

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (newProject: Omit<Project, 'id'>) => void;
  clients?: Client[];
}

interface FormPaymentStage {
  id: string;
  name: string;
  percentage: string;
  amount: string;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  clients = INITIAL_CLIENTS_MOCK
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 基本資訊 State
  const [projectCode, setProjectCode] = useState(`PJ-${todayStr.replace(/-/g, '')}-0001`);
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [durationDays, setDurationDays] = useState<number | string>(60);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [assignedEngineers, setAssignedEngineers] = useState('張工程師, 李工程師');

  // 計稅與金額 State
  const [taxType, setTaxType] = useState<'tax_inclusive' | 'tax_exclusive'>('tax_inclusive');
  const [rawAmount, setRawAmount] = useState<string>('500000');
  const [isTaxAdded, setIsTaxAdded] = useState(true);

  // 付款階段 State
  const [paymentStages, setPaymentStages] = useState<FormPaymentStage[]>([
    { id: 'stg_1', name: '第 1 期 訂金 (簽約)', percentage: '40', amount: '200000' },
    { id: 'stg_2', name: '第 2 期 系統交付款', percentage: '40', amount: '200000' },
    { id: 'stg_3', name: '第 3 期 驗收尾款', percentage: '20', amount: '100000' }
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 1. 自動計算預計結案日期 (開始日期 + 工期天數)
  useEffect(() => {
    if (!startDate || isNaN(Number(durationDays)) || Number(durationDays) <= 0) {
      setExpectedDeliveryDate('');
      return;
    }
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(durationDays));
    setExpectedDeliveryDate(d.toISOString().split('T')[0]);
  }, [startDate, durationDays]);

  // 2. 計算總額、未稅與稅額
  const parsedRaw = Number(rawAmount) || 0;
  let computedAmountUntaxed = 0;
  let computedTaxAmount = 0;
  let computedAmountTotal = 0;

  if (taxType === 'tax_inclusive') {
    computedAmountTotal = parsedRaw;
    computedAmountUntaxed = Math.round(parsedRaw / 1.05);
    computedTaxAmount = computedAmountTotal - computedAmountUntaxed;
  } else {
    computedAmountUntaxed = parsedRaw;
    if (isTaxAdded) {
      computedTaxAmount = Math.round(parsedRaw * 0.05);
      computedAmountTotal = computedAmountUntaxed + computedTaxAmount;
    } else {
      computedTaxAmount = 0;
      computedAmountTotal = computedAmountUntaxed;
    }
  }

  // 3. 當總金額變更時，依據現有各階段之 % 數自動重算金額
  useEffect(() => {
    if (computedAmountTotal <= 0) return;
    setPaymentStages((prev) =>
      prev.map((stage) => {
        const pct = Number(stage.percentage) || 0;
        const newAmt = Math.round(computedAmountTotal * (pct / 100));
        return { ...stage, amount: newAmt > 0 ? newAmt.toString() : '' };
      })
    );
  }, [computedAmountTotal]);

  // 4. 動態新增階段
  const handleAddStage = () => {
    const nextIdx = paymentStages.length + 1;
    setPaymentStages((prev) => [
      ...prev,
      {
        id: `stg_${Date.now()}`,
        name: `第 ${nextIdx} 期 款項`,
        percentage: '0',
        amount: '0'
      }
    ]);
  };

  // 5. 動態刪除階段
  const handleRemoveStage = (id: string) => {
    if (paymentStages.length <= 1) return;
    setPaymentStages((prev) => prev.filter((s) => s.id !== id));
  };

  // 6. 階段名稱變更
  const handleStageNameChange = (id: string, newName: string) => {
    setPaymentStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  // 7. 雙向試算：輸入 % 數 ➔ 自動計算金額
  const handlePercentageChange = (id: string, newPctStr: string) => {
    const newPct = Number(newPctStr) || 0;
    const newAmt = computedAmountTotal > 0 ? Math.round(computedAmountTotal * (newPct / 100)) : 0;

    setPaymentStages((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              percentage: newPctStr,
              amount: newAmt > 0 ? newAmt.toString() : ''
            }
          : s
      )
    );
  };

  // 8. 雙向試算：輸入金額 ➔ 自動計算 % 數
  const handleAmountChange = (id: string, newAmtStr: string) => {
    const newAmt = Number(newAmtStr) || 0;
    const newPct =
      computedAmountTotal > 0
        ? Number(((newAmt / computedAmountTotal) * 100).toFixed(1))
        : 0;

    setPaymentStages((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              amount: newAmtStr,
              percentage: newPct > 0 ? newPct.toString() : '0'
            }
          : s
      )
    );
  };

  // 統計目前各階段總 % 數與總金額
  const totalPercentage = paymentStages.reduce(
    (sum, s) => sum + (Number(s.percentage) || 0),
    0
  );
  const totalStageAmount = paymentStages.reduce(
    (sum, s) => sum + (Number(s.amount) || 0),
    0
  );

  // 表單送出處理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = '請輸入專案名稱';
    if (!clientId) newErrors.clientId = '請選擇所屬客戶';
    if (parsedRaw <= 0) newErrors.rawAmount = '專案金額必須大於 0';
    if (!startDate) newErrors.startDate = '請選擇立案開始日期';
    if (Number(durationDays) <= 0) newErrors.durationDays = '預估工期必須大於 0 天';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedClient = clients.find((c: Client) => c.id === clientId);

    const convertedStages: PaymentStage[] = paymentStages.map((s) => ({
      id: s.id,
      name: s.name,
      percentage: Number(s.percentage) || 0,
      amount: Number(s.amount) || 0,
      status: 'pending'
    }));

    const newProject: Omit<Project, 'id'> = {
      projectCode,
      name: name.trim(),
      clientId,
      clientName: selectedClient ? selectedClient.name : '未知客戶',
      stage: 'development',
      healthStatus: 'healthy',
      progressPercent: 0,
      assignedEngineers: assignedEngineers.split(',').map((e) => e.trim()).filter(Boolean),
      startDate,
      durationDays: Number(durationDays),
      expectedDeliveryDate,
      taxType,
      isTaxAdded: taxType === 'tax_exclusive' ? isTaxAdded : false,
      amountUntaxed: computedAmountUntaxed,
      taxAmount: computedTaxAmount,
      amountTotal: computedAmountTotal,
      paymentStages: convertedStages,
      changeOrders: []
    };

    onCreateProject(newProject);
    onClose();
  };

  if (!isOpen) return null;

  const clientOptions: SelectOption[] = clients.map((c: Client) => ({
    value: c.id,
    label: `${c.name} ${c.companyName ? `(${c.companyName})` : ''}`
  }));

  return (
    <div className="project-modal-overlay" onClick={onClose}>
      <div className="project-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal 頂部 Header */}
        <div className="project-modal-header">
          <div className="project-modal-header-left">
            <TextIcon name="projects" size="lg" />
            <div>
              <h2 className="project-modal-title">客戶簽約立案 (WBS 新增專案)</h2>
              <p className="project-modal-subtitle">
                設定專案時程、計稅模式與多階段付款比例
              </p>
            </div>
          </div>
          <button type="button" className="project-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal 表單內容 */}
        <form onSubmit={handleSubmit} className="project-modal-body">
          {/* 區塊 1: 基本資訊 */}
          <div className="project-form-section">
            <div className="project-form-section-title">
              <TextIcon name="building" size="sm" />
              <span>基本資料與關聯客戶</span>
            </div>
            <div className="project-form-row">
              <div className="project-form-col">
                <TextField
                  label="專案案號 (自動發號)"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  readOnly
                />
              </div>
              <div className="project-form-col">
                <SelectField
                  label="所屬客戶 *"
                  value={clientId}
                  onChange={setClientId}
                  options={clientOptions}
                />
                {errors.clientId && <div className="field-error-text">{errors.clientId}</div>}
              </div>
            </div>

            <div className="project-form-row">
              <div className="project-form-col" style={{ flex: 2 }}>
                <TextField
                  label="專案名稱 *"
                  placeholder="例如：智慧物流雲端管理系統"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
              </div>
              <div className="project-form-col" style={{ flex: 1 }}>
                <TextField
                  label="指派工程師"
                  placeholder="工程師姓名 (以逗點分隔)"
                  value={assignedEngineers}
                  onChange={(e) => setAssignedEngineers(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 區塊 2: 立案時程與工期試算 */}
          <div className="project-form-section">
            <div className="project-form-section-title">
              <TextIcon name="calendar" size="sm" />
              <span>立案時程與工期試算</span>
            </div>
            <div className="project-form-row">
              <div className="project-form-col">
                <label className="custom-input-label">立案開始日期 *</label>
                <input
                  type="date"
                  className="custom-native-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && <div className="field-error-text">{errors.startDate}</div>}
              </div>
              <div className="project-form-col">
                <TextField
                  label="預估工期 (天數) *"
                  type="number"
                  placeholder="60"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  error={errors.durationDays}
                />
              </div>
              <div className="project-form-col">
                <label className="custom-input-label">預計結案日期 (自動試算)</label>
                <div className="project-calc-badge">
                  <TextIcon name="clock" size="sm" />
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {expectedDeliveryDate || '請輸入工期'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 區塊 3: 專案金額與計稅模式 */}
          <div className="project-form-section">
            <div className="project-form-section-title">
              <TextIcon name="finance" size="sm" />
              <span>專案金額與計稅模式</span>
            </div>

            {/* 計稅模式選擇 */}
            <div className="tax-type-switcher">
              <button
                type="button"
                className={`tax-switch-btn ${taxType === 'tax_inclusive' ? 'active' : ''}`}
                onClick={() => setTaxType('tax_inclusive')}
              >
                含稅金額模式 (原始金額即含稅總額)
              </button>
              <button
                type="button"
                className={`tax-switch-btn ${taxType === 'tax_exclusive' ? 'active' : ''}`}
                onClick={() => setTaxType('tax_exclusive')}
              >
                未稅金額模式 (依需求外加5%稅金)
              </button>
            </div>

            <div className="project-form-row" style={{ alignItems: 'flex-end', marginTop: '12px' }}>
              <div className="project-form-col" style={{ flex: 1.2 }}>
                <TextField
                  label={taxType === 'tax_inclusive' ? '合約含稅總金額 (NT$) *' : '合約未稅金額 (NT$) *'}
                  type="number"
                  placeholder="500000"
                  value={rawAmount}
                  onChange={(e) => setRawAmount(e.target.value)}
                  error={errors.rawAmount}
                />
              </div>

              {taxType === 'tax_exclusive' && (
                <div className="project-form-col" style={{ flex: 0.8, paddingBottom: '10px' }}>
                  <label className="tax-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isTaxAdded}
                      onChange={(e) => setIsTaxAdded(e.target.checked)}
                    />
                    <span>外加 5% 營業稅</span>
                  </label>
                </div>
              )}
            </div>

            {/* 即時試算金額匯總卡 */}
            <div className="tax-summary-bar">
              <div className="tax-summary-item">
                <span className="tax-summary-label">未稅金額</span>
                <span className="tax-summary-val">NT$ {computedAmountUntaxed.toLocaleString()}</span>
              </div>
              <div className="tax-summary-item">
                <span className="tax-summary-label">營業稅 (5%)</span>
                <span className="tax-summary-val">NT$ {computedTaxAmount.toLocaleString()}</span>
              </div>
              <div className="tax-summary-item highlight">
                <span className="tax-summary-label">專案含稅總額</span>
                <span className="tax-summary-val highlight">
                  NT$ {computedAmountTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 區塊 4: 動態多階段付款規劃 */}
          <div className="project-form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className="project-form-section-title" style={{ marginBottom: 0 }}>
                <TextIcon name="layers" size="sm" />
                <span>多階段付款期數規劃 (雙向比例與金額試算)</span>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddStage}>
                <TextIcon name="plus" size="sm" />
                <span>+ 新增階段</span>
              </Button>
            </div>

            <div className="stages-table-wrapper">
              <table className="stages-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>階段名稱</th>
                    <th style={{ width: '22%' }}>比例 (%)</th>
                    <th style={{ width: '25%' }}>階段應收金額 (NT$)</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>刪除</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentStages.map((stage) => (
                    <tr key={stage.id}>
                      <td>
                        <input
                          type="text"
                          className="stage-input"
                          value={stage.name}
                          onChange={(e) => handleStageNameChange(stage.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="percent-input-wrapper">
                          <input
                            type="number"
                            step="0.1"
                            className="stage-input"
                            value={stage.percentage}
                            onChange={(e) => handlePercentageChange(stage.id, e.target.value)}
                          />
                          <span className="unit-label">%</span>
                        </div>
                      </td>
                      <td>
                        <div className="percent-input-wrapper">
                          <input
                            type="number"
                            className="stage-input"
                            value={stage.amount}
                            onChange={(e) => handleAmountChange(stage.id, e.target.value)}
                          />
                          <span className="unit-label">元</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {paymentStages.length > 1 && (
                          <button
                            type="button"
                            className="stage-delete-btn"
                            onClick={() => handleRemoveStage(stage.id)}
                            title="刪除階段"
                          >
                            <TextIcon name="trash" size="sm" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 階段合計提示列 */}
            <div className="stages-footer-summary">
              <div>
                <span>累計比例：</span>
                <strong style={{ color: totalPercentage === 100 ? '#10b981' : '#f59e0b' }}>
                  {totalPercentage.toFixed(1)}% / 100%
                </strong>
              </div>
              <div>
                <span>階段總額合計：</span>
                <strong style={{ color: totalStageAmount === computedAmountTotal ? '#10b981' : '#f59e0b' }}>
                  NT$ {totalStageAmount.toLocaleString()} / NT$ {computedAmountTotal.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Modal 底部按鈕 */}
          <div className="project-modal-footer">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" variant="primary" size="md">
              <TextIcon name="file-check" size="md" />
              <span>確認簽約立案</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
