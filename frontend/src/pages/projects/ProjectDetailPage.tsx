import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUrlTabs } from '../../hooks/useUrlTabs';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';
import { Button } from '../../components/button/Button';
import { SelectField, SelectOption } from '../../components/input/SelectField';
import { MilestoneWbsTable } from '../../components/wbs';
import { Project, ProjectStage, ChangeOrder } from '../../types';
import { MOCK_PROJECTS } from '../../mock/projects.mock';
import { MOCK_PROJECT_WBS } from '../../mock/wbs.mock';

/**
 * @file ProjectDetailPage.tsx
 * @description 專案工作台詳情頁 / Project Workspace Detail Page
 * @description_en 5-Tab workspace with stage dropdown selector, duration tracker, change orders, and payment stages
 * @description_zh 專案核心工作台，提供階段下拉切換選單、工期時程動態指示、需求追加變更單與多階段付款清冊
 */

type ProjectTab = 'milestones' | 'qa' | 'change_orders' | 'finance' | 'line_sync';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentTab, setTab] = useUrlTabs<ProjectTab>('milestones');

  const project: Project =
    MOCK_PROJECTS.find((p) => p.id === id || p.projectCode === id) || MOCK_PROJECTS[0];

  const [currentStage, setCurrentStage] = useState<ProjectStage>(project.stage);
  const [progressPercent, setProgressPercent] = useState<number>(project.progressPercent);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(project.changeOrders || []);


  const STAGE_OPTIONS: SelectOption[] = [
    { value: 'development', label: '1. 開發中', iconName: 'layers' },
    { value: 'testing', label: '2. 測試驗證', iconName: 'layers' },
    { value: 'delivery', label: '3. 交付驗收', iconName: 'layers' },
    { value: 'maintenance', label: '4. 保固維護', iconName: 'layers' },
    { value: 'closed', label: '5. 正式結案', iconName: 'layers' }
  ];

  // 追加需求變更單 State
  const [isAddCoOpen, setIsAddCoOpen] = useState(false);
  const [coTitle, setCoTitle] = useState('');
  const [coAmountUntaxed, setCoAmountUntaxed] = useState<string>('50000');
  const [coAddedDays, setCoAddedDays] = useState<string>('7');

  // LINE 雙向即時訊息模擬狀態
  const [lineMessages, setLineMessages] = useState<Array<{ sender: string; text: string; time: string; isBot?: boolean }>>([
    { sender: `${project.clientName} - 負責人`, text: '請問系統目前測試與驗收進度如何？', time: '14:20' },
    { sender: '系統 (LINE Bot)', text: '工程師已接獲需求，目前正在進行測試環境驗收。', time: '14:21', isBot: true }
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSendLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setLineMessages((prev) => [
      ...prev,
      {
        sender: '利恒後台 (工程師)',
        text: inputMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputMsg('');
  };

  // 新增變更單處理
  const handleAddChangeOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coTitle.trim()) return;

    const untaxed = Number(coAmountUntaxed) || 0;
    const tax = Math.round(untaxed * 0.05);
    const total = untaxed + tax;
    const addedDays = Number(coAddedDays) || 0;

    const newCO: ChangeOrder = {
      id: `co_${Date.now()}`,
      code: `CO-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-000${changeOrders.length + 1}`,
      title: coTitle.trim(),
      amountUntaxed: untaxed,
      taxAmount: tax,
      amountTotal: total,
      addedDays,
      status: 'approved',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setChangeOrders([...changeOrders, newCO]);
    setCoTitle('');
    setCoAmountUntaxed('50000');
    setCoAddedDays('7');
    setIsAddCoOpen(false);
  };

  // 累計追加金額與展延工期
  const totalApprovedCoAmount = changeOrders
    .filter((co) => co.status === 'approved')
    .reduce((sum, co) => sum + co.amountTotal, 0);

  const totalAddedDays = changeOrders
    .filter((co) => co.status === 'approved')
    .reduce((sum, co) => sum + co.addedDays, 0);

  const finalAmountTotal = (project.amountTotal || 0) + totalApprovedCoAmount;

  const tabsConfig: Array<{ key: ProjectTab; label: string; icon: 'layers' | 'warning' | 'contracts' | 'finance' | 'message' }> = [
    { key: 'milestones', label: '里程碑進度', icon: 'layers' },
    { key: 'qa', label: 'QA 缺陷監控', icon: 'warning' },
    { key: 'change_orders', label: `需求變更單 (${changeOrders.length})`, icon: 'contracts' },
    { key: 'finance', label: '多階段付款與收支', icon: 'finance' },
    { key: 'line_sync', label: 'LINE 雙向動態與 AI', icon: 'message' }
  ];

  return (
    <div>
      {/* 專案主標題與狀態 Header (含階段下拉選單與返回列表按鈕) */}
      <div className="page-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <TextIcon name="projects" size="lg" />
            <span>{project.name}</span>
          </h1>
          <p className="page-subtitle">
            案號：{project.projectCode} ｜ 客戶：{project.clientName} ｜ 負責人：{project.assignedEngineers.join(', ')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* 專案階段下拉切換選單 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>專案階段:</span>
            <SelectField
              options={STAGE_OPTIONS}
              value={currentStage}
              onChange={(val) => setCurrentStage(val as ProjectStage)}
              style={{ width: '150px' }}
            />
          </div>

          <StatusBadge
            label={`進度 ${progressPercent}%`}
            variant={progressPercent >= 90 ? 'success' : 'info'}
            icon="success"
          />

          <Link to="/projects" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="md">
              <TextIcon name="arrow-left" size="sm" />
              <span>返回專案列表</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 專案核心時程、金額與工期總覽卡 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>立案開始日期</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {project.startDate}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>工期與預計結案</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {project.durationDays + totalAddedDays} 天 ({project.expectedDeliveryDate})
          </div>
          {totalAddedDays > 0 && (
            <div style={{ fontSize: '11px', color: 'var(--primary-600)', marginTop: '2px' }}>
              (含變更單展延 +{totalAddedDays} 天)
            </div>
          )}
        </div>

        <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>合約原始金額</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            NT$ {(project.amountTotal || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {project.taxType === 'tax_inclusive' ? '含稅總額' : project.isTaxAdded ? '未稅 + 5% 稅金' : '未稅總額'}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: '#1e40af' }}>最新專案總額 (含追加)</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            NT$ {finalAmountTotal.toLocaleString()}
          </div>
          {totalApprovedCoAmount > 0 && (
            <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
              (含變更追加 NT$ {totalApprovedCoAmount.toLocaleString()})
            </div>
          )}
        </div>
      </div>

      {/* 6 大 Tab 頁籤標籤列 (支援 URL Query 保持) */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        {tabsConfig.map((t) => {
          const isActive = currentTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary-600)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                backgroundColor: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease'
              }}
            >
              <TextIcon name={t.icon} size="sm" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 內容切換區域 */}
      <div className="card">
        {/* Tab 1: 里程碑進度 (WBS 樹狀表格) */}
        {currentTab === 'milestones' && (
          <MilestoneWbsTable
            projectId={project.id}
            initialNodes={MOCK_PROJECT_WBS[project.id] || MOCK_PROJECT_WBS['pj_1']}
            onProgressUpdate={(pct) => setProgressPercent(pct)}
          />
        )}

        {/* Tab 2: QA 缺陷監控 */}
        {currentTab === 'qa' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">QA Bug 缺陷監控與線上健康狀態</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              目前未發現重大缺陷 (Critical Issues)。所有自動化測試與 Docker 探針運行正常。
            </p>
          </div>
        )}

        {/* Tab 4: 需求追加與變更單 */}
        {currentTab === 'change_orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ margin: 0 }}>需求追加與變更單管理 (Change Orders)</h2>
              <Button variant="primary" size="sm" onClick={() => setIsAddCoOpen(!isAddCoOpen)}>
                <TextIcon name="plus" size="sm" />
                <span>+ 新增需求變更單</span>
              </Button>
            </div>

            {/* 新增變更單表單 */}
            {isAddCoOpen && (
              <form onSubmit={handleAddChangeOrder} style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>填寫追加需求與費用明細</div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>追加需求標題 *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="例如：追加報表匯出功能"
                      value={coTitle}
                      onChange={(e) => setCoTitle(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>追加未稅金額 (NT$) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={coAmountUntaxed}
                      onChange={(e) => setCoAmountUntaxed(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 500 }}>追加工期 (天數) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={coAddedDays}
                      onChange={(e) => setCoAddedDays(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setIsAddCoOpen(false)}>取消</Button>
                  <Button type="submit" variant="primary" size="sm">確認建立變更單</Button>
                </div>
              </form>
            )}

            {/* 變更單列表 */}
            {changeOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                尚無任何需求追加變更單。
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>單號</th>
                      <th>追加需求說明</th>
                      <th>未稅金額</th>
                      <th>含稅金額 (5%)</th>
                      <th>追加工期</th>
                      <th>狀態</th>
                      <th>建立日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changeOrders.map((co) => (
                      <tr key={co.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{co.code}</td>
                        <td style={{ fontWeight: 600 }}>{co.title}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>NT$ {co.amountUntaxed.toLocaleString()}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-600)' }}>
                          NT$ {co.amountTotal.toLocaleString()}
                        </td>
                        <td>+{co.addedDays} 天</td>
                        <td>
                          <StatusBadge label="已核准生效" variant="success" icon="success" />
                        </td>
                        <td>{co.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: 多階段付款與收支 */}
        {currentTab === 'finance' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">多階段請款期程清冊 (Payment Stages)</h2>
            </div>

            {/* 多階段請款表格 */}
            <div className="table-container" style={{ marginBottom: '24px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>請款階段</th>
                    <th>款項比例 (%)</th>
                    <th>應收金額 (NT$)</th>
                    <th>預計請款日</th>
                    <th>發票單號</th>
                    <th>收款狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.paymentStages || []).map((stage) => (
                    <tr key={stage.id}>
                      <td style={{ fontWeight: 600 }}>{stage.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{stage.percentage}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        NT$ {stage.amount.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{stage.dueDate || '-'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{stage.invoiceNumber || '尚未開立'}</td>
                      <td>
                        <StatusBadge
                          label={stage.status === 'received' ? '已入帳核銷' : stage.status === 'invoiced' ? '已開立發票' : '待請款'}
                          variant={stage.status === 'received' ? 'success' : stage.status === 'invoiced' ? 'info' : 'warning'}
                          icon={stage.status === 'received' ? 'success' : 'clock'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>最新專案含稅總額</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  NT$ {finalAmountTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>已入帳總額</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                  NT$ 420,000 (40%)
                </div>
              </div>
              <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>預估專案毛利率</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-600)', marginTop: '4px' }}>
                  62.5%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: LINE 雙向動態與 AI */}
        {currentTab === 'line_sync' && (
          <div>
            <div className="card-header">
              <h2 className="card-title">LINE 專案群組即時對話與雙向推播</h2>
            </div>
            <div
              style={{
                height: '240px',
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              {lineMessages.map((m, idx) => (
                <div key={idx} style={{ padding: '10px 14px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: m.isBot ? 'var(--primary-600)' : 'var(--text-primary)' }}>{m.sender}</span>
                    <span>{m.time}</span>
                  </div>
                  <div style={{ fontSize: '14px' }}>{m.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendLine} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="輸入要推播至客戶 LINE 群組的訊息..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                <TextIcon name="send" size="sm" />
                <span>發送至 LINE 群</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
