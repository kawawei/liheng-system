import React, { useState } from 'react';
import { InteractionLog } from '../../../types';
import { TextIcon } from '../../icon/TextIcon';
import { Button } from '../../button/Button';
import './HorizontalTimeline.css';

/**
 * @file HorizontalTimeline.tsx
 * @description 橫向時間軸組件 / Horizontal Timeline Component
 * @description_en Displays 5-node evenly allocated horizontal timeline with pagination support
 * @description_zh 橫向水平時間軸，固定平均分配 5 欄寬度，超過 5 筆提供翻頁導覽機制
 */

interface HorizontalTimelineProps {
  logs: InteractionLog[];
}

const PAGE_SIZE = 5;

export const HorizontalTimeline: React.FC<HorizontalTimelineProps> = ({ logs }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalLogs = logs.length;
  const totalPages = Math.ceil(totalLogs / PAGE_SIZE) || 1;

  // 計算當前頁要顯示的 5 筆紀錄 (按時間倒序) / Current 5 logs slice
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const currentLogs = logs.slice(startIndex, startIndex + PAGE_SIZE);

  const getLogTypeTag = (type: InteractionLog['type']) => {
    switch (type) {
      case 'fb':
        return { label: 'FB 私訊', className: 'fb', iconName: 'fb' as const };
      case 'ig':
        return { label: 'IG 訊息', className: 'ig', iconName: 'ig' as const };
      case 'threads':
        return { label: 'Threads 互動', className: 'threads', iconName: 'threads' as const };
      case 'phone':
        return { label: '電話溝通', className: 'phone', iconName: 'phone' as const };
      case 'line':
      default:
        return { label: 'LINE 訊息', className: 'line', iconName: 'message' as const };
    }
  };

  if (totalLogs === 0) {
    return (
      <div className="horizontal-timeline-wrapper" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
        尚無聯繫紀錄，歡迎於上方追加紀錄。
      </div>
    );
  }

  return (
    <div className="horizontal-timeline-wrapper">
      {/* 頁頭標題與分頁導覽按鈕 */}
      <div className="horizontal-timeline-header">
        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TextIcon name="clock" size="md" />
          <span>聯繫歷史時間軸 (共 {totalLogs} 筆)</span>
        </div>

        {totalPages > 1 && (
          <div className="timeline-pagination">
            <span className="page-indicator">
              頁次 {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              <TextIcon name="arrow-left" size="sm" />
              <span>上一頁</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              <span>下一頁</span>
              <TextIcon name="arrow-right" size="sm" />
            </Button>
          </div>
        )}
      </div>

      {/* 橫向時間軸 5 欄平分軌道 */}
      <div className="timeline-track-container">
        {currentLogs.length > 1 && <div className="timeline-track-line" />}

        <div className="horizontal-timeline-grid">
          {currentLogs.map((log) => {
            const tagInfo = getLogTypeTag(log.type);
            return (
              <div key={log.id} className="horizontal-timeline-node">
                <div className={`node-dot-wrapper ${tagInfo.className}`}>
                  <TextIcon name={tagInfo.iconName} size="sm" />
                </div>

                <div className="node-card">
                  <div className="node-type-tag">
                    <span>{tagInfo.label}</span>
                  </div>
                  <div className="node-date">{log.date}</div>
                  <div className="node-summary" title={log.summary}>
                    {log.summary}
                  </div>
                  <div className="node-author">記錄人: {log.createdByName}</div>
                </div>
              </div>
            );
          })}

          {/* 補足少於 5 個的空白預留欄位，確保 5 欄固定平均分配 */}
          {Array.from({ length: PAGE_SIZE - currentLogs.length }).map((_, idx) => (
            <div key={`empty_${idx}`} className="horizontal-timeline-node" style={{ opacity: 0.35 }}>
              <div className="node-dot-wrapper" style={{ borderColor: '#cbd5e1', backgroundColor: '#f1f5f9' }}>
                <TextIcon name="clock" size="sm" color="#94a3b8" />
              </div>
              <div className="node-card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '16px 8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>無紀錄</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
