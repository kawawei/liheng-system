import React from 'react';
import { TextIcon } from '../../components/icon/TextIcon';
import { StatusBadge } from '../../components/status-badge/StatusBadge';

/**
 * @file DashboardPage.tsx
 * @description 系統營運總覽儀表板 / Dashboard Overview Page
 * @description_en Key metrics, active project summary, and recent activity timeline
 * @description_zh 展示核心營運指標、進行中專案概況與即時動態時間軸
 */

export const DashboardPage: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TextIcon name="dashboard" size="lg" />
            <span>營運與研發總覽</span>
          </h1>
          <p className="page-subtitle">立衡軟體即時專案進度、客戶流轉與收支狀態</p>
        </div>
      </div>

      {/* 統計卡片區域 / Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>進行中專案</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            8 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>個</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge label="進度正常 6" variant="success" icon="success" />
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>本月活躍客戶</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            14 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>家</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge label="追蹤中 5" variant="info" icon="clock" />
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>待簽署合約</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            3 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>份</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge label="總額 NT$ 1,280,000" variant="warning" icon="warning" />
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>本月專案毛利率</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            58.4 <span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>%</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <StatusBadge label="健康度良好" variant="success" icon="success" />
          </div>
        </div>
      </div>

      {/* 進行中專案清單 / Active Projects Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">重點專案研發動態</h2>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>專案案號</th>
                <th>專案名稱</th>
                <th>客戶名稱</th>
                <th>當前階段</th>
                <th>進度</th>
                <th>健康狀態</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)' }}>PJ-20260814-0001</td>
                <td style={{ fontWeight: 600 }}>立衡智慧工廠物聯網平台</td>
                <td>台元半導體股份有限公司</td>
                <td>開發中 (Development)</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '65%', height: '100%', backgroundColor: 'var(--primary-600)' }} />
                    </div>
                    <span style={{ fontSize: '12px' }}>65%</span>
                  </div>
                </td>
                <td>
                  <StatusBadge label="正常 (Healthy)" variant="success" icon="success" />
                </td>
              </tr>
              <tr>
                <td style={{ fontFamily: 'var(--font-mono)' }}>PJ-20260812-0002</td>
                <td style={{ fontWeight: 600 }}>金融交易風控 AI 引擎</td>
                <td>國泰證券資訊處</td>
                <td>測試驗收 (Testing)</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '90%', height: '100%', backgroundColor: 'var(--primary-600)' }} />
                    </div>
                    <span style={{ fontSize: '12px' }}>90%</span>
                  </div>
                </td>
                <td>
                  <StatusBadge label="警告 (Warning)" variant="warning" icon="warning" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
