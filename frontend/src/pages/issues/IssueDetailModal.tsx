import React, { useState, useEffect, useCallback, useRef } from 'react';
import { message } from '@kawawei/frontend-modules';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import { IssueStatusBadge } from './IssueStatusBadge';
import { IssueCategoryBadge } from './IssueCategoryBadge';
import { IssueSeverityBadge } from './IssueSeverityBadge';
import {
  IssueDetail,
  IssueStatus,
  IssueAttachment,
  UserRole
} from '../../types';
import { issueService } from '../../services/issue.service';

/**
 * @file IssueDetailModal.tsx
 * @description 問題工單詳情與修復處理中心 / Issue Ticket Detail & Resolution Modal
 * @description_en Detailed view of issue ticket with media player, status lifecycle transitions, and comments timeline
 * @description_zh 展示工單全貌、媒體播放預覽 (圖片 Lightbox/影片播放)、生命週期狀態切換 (標記已修復/填寫版本) 與雙向留言對話
 */

interface IssueDetailModalProps {
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  currentUserRole?: UserRole;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issueId,
  isOpen,
  onClose,
  onUpdated,
  currentUserRole
}) => {
  const [detail, setDetail] = useState<IssueDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [isInternalComment, setIsInternalComment] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [commentAttachments, setCommentAttachments] = useState<IssueAttachment[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState<boolean>(false);

  // 狀態變更模態相關
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [fixedVersion, setFixedVersion] = useState<string>('');
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // 圖片 Lightbox 放大
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStaff = currentUserRole === 'super_admin' || currentUserRole === 'engineer';

  // ========================================
  // 載入工單詳情 / Fetch Issue Detail
  // ========================================
  const fetchDetail = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const data = await issueService.getIssueById(issueId);
      setDetail(data);
    } catch (err: any) {
      console.error('Failed to load issue detail:', err);
      message.error(err.response?.data?.message || '載入工單詳情失敗');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [issueId, onClose]);

  useEffect(() => {
    if (isOpen && issueId) {
      fetchDetail();
    } else {
      setDetail(null);
      setCommentText('');
      setCommentAttachments([]);
      setIsInternalComment(false);
      setIsResolveModalOpen(false);
    }
  }, [isOpen, issueId, fetchDetail]);

  if (!isOpen || !issueId) return null;

  // ========================================
  // 狀態切換處理 / Handle Status Changes
  // ========================================
  const handleQuickStatusChange = async (newStatus: IssueStatus) => {
    if (!detail) return;
    setUpdatingStatus(true);
    try {
      await issueService.updateStatus(detail.issue.id, {
        status: newStatus
      });
      message.success('工單狀態已更新');
      await fetchDetail();
      onUpdated();
    } catch (err: any) {
      message.error(err.response?.data?.message || '更新狀態失敗');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    setUpdatingStatus(true);
    try {
      await issueService.updateStatus(detail.issue.id, {
        status: 'RESOLVED',
        fixedInVersion: fixedVersion.trim() || undefined,
        resolutionSummary: resolutionSummary.trim() || undefined
      });
      message.success('已成功標記為已修復！');
      setIsResolveModalOpen(false);
      await fetchDetail();
      onUpdated();
    } catch (err: any) {
      message.error(err.response?.data?.message || '標記修復失敗');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ========================================
  // 發布留言 / Handle Add Comment
  // ========================================
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      await issueService.addComment(detail.issue.id, {
        content: commentText.trim(),
        isInternal: isInternalComment,
        attachments: commentAttachments
      });
      message.success('留言已發布');
      setCommentText('');
      setCommentAttachments([]);
      setIsInternalComment(false);
      await fetchDetail();
      onUpdated();
    } catch (err: any) {
      message.error(err.response?.data?.message || '發布留言失敗');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUploadCommentAttachment = async (file: File) => {
    if (!detail) return;
    setUploadingMedia(true);
    try {
      const att = await issueService.uploadMedia(file, detail.issue.id);
      setCommentAttachments((prev) => [...prev, att]);
      message.success(`已附加檔案：${file.name}`);
    } catch (err: any) {
      message.error(err.response?.data?.message || '上傳檔案失敗');
    } finally {
      setUploadingMedia(false);
    }
  };

  const issue = detail?.issue;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '960px',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* 頂部導航 / Header */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                {issue?.issueNo || '載入中...'}
              </span>
              {issue && <IssueStatusBadge status={issue.status} />}
              {issue && <IssueSeverityBadge severity={issue.severity} />}
              {issue && <IssueCategoryBadge category={issue.category} />}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              ✕
            </button>
          </div>

          {/* 主體內容雙欄佈局 / Body 2-Columns */}
          {loading || !issue ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              工單資料載入中...
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              
              {/* 左側：問題內容、佐證媒體與修復說明 / Left Panel */}
              <div
                style={{
                  flex: '1 1 60%',
                  padding: '24px',
                  overflowY: 'auto',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* 標題與基本資料 */}
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {issue.title}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div><strong>回報者:</strong> {issue.createdByName}</div>
                    {detail.client && <div><strong>客戶公司:</strong> {detail.client.companyName || detail.client.name}</div>}
                    {detail.project && <div><strong>專案:</strong> [{detail.project.projectCode}] {detail.project.name}</div>}
                    <div><strong>提出時間:</strong> {new Date(issue.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                {/* 修復結果特別展示卡 (若已修復) */}
                {issue.status === 'RESOLVED' && (
                  <div
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#047857', fontWeight: 600, fontSize: '15px' }}>
                      <TextIcon name="success" size="md" />
                      <span>此問題已修復 (Resolved)</span>
                      {issue.fixedInVersion && (
                        <span style={{ backgroundColor: '#059669', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
                          修復版本: {issue.fixedInVersion}
                        </span>
                      )}
                    </div>
                    {issue.resolutionSummary && (
                      <div style={{ fontSize: '14px', color: '#065f46', whiteSpace: 'pre-wrap' }}>
                        {issue.resolutionSummary}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#047857' }}>
                      修復時間：{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleString() : '已記錄'}
                    </div>
                  </div>
                )}

                {/* 詳細描述 / Description */}
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    問題詳細描述與重現步驟
                  </h4>
                  <div
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {issue.description}
                  </div>
                </div>

                {/* 圖片與影片附件 / Attachments & Media Player */}
                {detail.attachments && detail.attachments.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      佐證圖片與影片 ({detail.attachments.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                      {detail.attachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#fff'
                          }}
                        >
                          {att.fileType === 'image' ? (
                            <img
                              src={att.filePath}
                              alt={att.fileName}
                              onClick={() => setPreviewImageUrl(att.filePath)}
                              style={{
                                width: '100%',
                                height: '140px',
                                objectFit: 'cover',
                                cursor: 'zoom-in',
                                display: 'block'
                              }}
                            />
                          ) : att.fileType === 'video' ? (
                            <video
                              src={att.filePath}
                              controls
                              preload="metadata"
                              style={{ width: '100%', height: '140px', backgroundColor: '#000', display: 'block' }}
                            />
                          ) : (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                              <a href={att.filePath} target="_blank" rel="noreferrer">
                                下載附件 ({att.fileName})
                              </a>
                            </div>
                          )}
                          <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.fileName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 環境資訊 / Environment Info */}
                {issue.environmentInfo && Object.keys(issue.environmentInfo).length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      回報環境資訊
                    </h4>
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        lineHeight: '1.5'
                      }}
                    >
                      <div>OS / Platform: {issue.environmentInfo.platform}</div>
                      <div>User Agent: {issue.environmentInfo.userAgent}</div>
                      <div>Screen Size: {issue.environmentInfo.windowSize}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 右側：狀態流轉控制 + 對話留言時間軸 / Right Panel */}
              <div
                style={{
                  flex: '1 1 40%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#fafafa',
                  overflow: 'hidden'
                }}
              >
                {/* 狀態管理操作條 (內部團隊可見) / Status Actions Bar */}
                {isStaff && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      內部狀態操作管理：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {issue.status === 'PENDING' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TextIcon name="activity" size="sm" />
                            <span>開始處理</span>
                          </span>
                        </Button>
                      )}

                      {issue.status !== 'RESOLVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={updatingStatus}
                          onClick={() => setIsResolveModalOpen(true)}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TextIcon name="success" size="sm" />
                            <span>標記為已修復</span>
                          </span>
                        </Button>
                      )}

                      {issue.status !== 'CLOSED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange('CLOSED')}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <TextIcon name="file-check" size="sm" />
                            <span>結案</span>
                          </span>
                        </Button>
                      )}

                      {issue.status === 'CLOSED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={updatingStatus}
                          onClick={() => handleQuickStatusChange('IN_PROGRESS')}
                        >
                          重新開啟
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 留言紀錄時間軸 / Comments Timeline */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    溝通對話與進度紀錄 ({detail.comments.length})
                  </div>

                  {detail.comments.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      尚無留言紀錄
                    </div>
                  ) : (
                    detail.comments.map((cmt) => (
                      <div
                        key={cmt.id}
                        style={{
                          backgroundColor: cmt.isInternal ? '#fffbeb' : '#ffffff',
                          border: cmt.isInternal ? '1px solid #fef3c7' : '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                              {cmt.authorName}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: cmt.authorRole === 'client' ? 'var(--primary-50)' : '#e0e7ff',
                                color: cmt.authorRole === 'client' ? 'var(--primary-700)' : '#3730a3'
                              }}
                            >
                              {cmt.authorRole === 'client' ? '客戶' : '工程研發'}
                            </span>
                            {cmt.isInternal && (
                              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                                內部備註
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {cmt.content}
                        </div>

                        {/* 留言附件 */}
                        {cmt.attachments && cmt.attachments.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            {cmt.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.filePath}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '12px', color: 'var(--primary-600)', textDecoration: 'underline' }}
                              >
                                📎 {att.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 留言輸入區 / Comment Input Box */}
                <form
                  onSubmit={handleAddComment}
                  style={{
                    padding: '14px',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <textarea
                    rows={2}
                    placeholder="輸入回覆或補充說明..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadCommentAttachment(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <TextIcon name="attachment" size="sm" />
                        <span>{uploadingMedia ? '上傳中...' : '附加圖片/檔案'}</span>
                      </button>

                      {isStaff && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#92400e', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={(e) => setIsInternalComment(e.target.checked)}
                          />
                          <span>僅內部可見</span>
                        </label>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={submittingComment || !commentText.trim()}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <TextIcon name="send" size="sm" />
                        <span>{submittingComment ? '送出中' : '發布'}</span>
                      </span>
                    </Button>
                  </div>
                </form>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* 標記修復專用彈窗 / Resolve Details Modal */}
      {isResolveModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 600 }}>
              標記問題為「已修復 (Resolved)」
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              請填寫修復版本與簡要說明，系統將記錄於工單並通知客戶驗證。
            </p>

            <form onSubmit={handleConfirmResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  預計修復版本 / 發布版號 (如 v1.2.3)
                </label>
                <input
                  type="text"
                  placeholder="例如: v1.0.4-hotfix"
                  value={fixedVersion}
                  onChange={(e) => setFixedVersion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  修復原因與處理說明
                </label>
                <textarea
                  rows={4}
                  placeholder="說明問題根因 (Root Cause) 與解決方案..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" onClick={() => setIsResolveModalOpen(false)}>
                  取消
                </Button>
                <Button type="submit" variant="primary" disabled={updatingStatus}>
                  {updatingStatus ? '儲存中...' : '確認已修復'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 圖片 Lightbox 放大檢視 / Image Lightbox */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            cursor: 'zoom-out',
            padding: '40px'
          }}
        >
          <img
            src={previewImageUrl}
            alt="放大預覽"
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px' }}
          />
        </div>
      )}
    </>
  );
};
