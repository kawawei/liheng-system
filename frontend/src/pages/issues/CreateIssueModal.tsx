import React, { useState, useEffect, useRef } from 'react';
import { message } from '@kawawei/frontend-modules';
import { TextIcon } from '../../components/icon/TextIcon';
import { Button } from '../../components/button/Button';
import {
  Project,
  IssueCategory,
  IssueSeverity,
  CreateIssueInput,
  IssueAttachment
} from '../../types';
import { issueService } from '../../services/issue.service';

/**
 * @file CreateIssueModal.tsx
 * @description 建立問題工單彈窗 / Create Software Issue Modal
 * @description_en Modal for submitting issue tickets with clipboard paste, video upload, and auto environment detection
 * @description_zh 提供客戶或工程師登打問題、支援剪貼簿 Ctrl+V 貼上截圖、影片拖曳上傳與自動環境偵測
 */

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects
}) => {
  const [projectId, setProjectId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<IssueCategory>('BUG');
  const [severity, setSeverity] = useState<IssueSeverity>('MEDIUM');
  const [description, setDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [envInfo, setEnvInfo] = useState<Record<string, any>>({});
  const [showEnvInfo, setShowEnvInfo] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================
  // 自動擷取用戶端環境 / Detect Client Environment
  // ========================================
  useEffect(() => {
    if (isOpen) {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        submittedAt: new Date().toLocaleString()
      };
      setEnvInfo(info);
    }
  }, [isOpen]);

  // ========================================
  // 監聽剪貼簿貼上 (Ctrl+V / Cmd+V) / Paste Handler
  // ========================================
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `clipboard-screenshot-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: blob.type });
            await handleUploadFile(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ========================================
  // 檔案上傳處理 / File Upload Handler
  // ========================================
  const handleUploadFile = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      message.error('檔案大小不能超過 100MB');
      return;
    }

    setUploading(true);
    try {
      const att = await issueService.uploadMedia(file);
      setAttachments((prev) => [...prev, att]);
      message.success(`已加入附件：${file.name}`);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      message.error(err.response?.data?.message || '附件上傳失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const file of files) {
        await handleUploadFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await handleUploadFile(file);
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // ========================================
  // 提交工單 / Submit Issue
  // ========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      message.warning('請填寫問題標題');
      return;
    }

    if (!description.trim()) {
      message.warning('請填寫問題描述或重現步驟');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateIssueInput = {
        projectId: projectId || null,
        title: title.trim(),
        category,
        severity,
        description: description.trim(),
        environmentInfo: envInfo,
        attachmentIds: attachments.map((a) => a.id)
      };

      const created = await issueService.createIssue(payload);
      message.success(`問題工單已成功提交！案號：${created.issueNo}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create issue:', err);
      message.error(err.response?.data?.message || '建立工單失敗');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}
      >
        {/* 頂部標題列 / Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TextIcon name="bug" size="md" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                登打軟體問題 (Issue 回報)
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                請提供詳細問題描述、重現步驟與截圖/影片佐證
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 表單內容區 / Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
            
            {/* 關聯專案 / Project Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                關聯專案 / 系統
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px'
                }}
              >
                <option value="">-- 請選擇關聯專案 (可選) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode}] {p.name} {p.clientName ? `(${p.clientName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 問題主旨 / Issue Title */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                問題主旨 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="例如：訂單列表點擊匯出 Excel 出現 500 錯誤、按鈕破版無法點擊"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* 分類與嚴重程度 / Category & Severity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                  問題分類
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="BUG">缺陷異常 (Bug)</option>
                  <option value="UI_UX">介面顯示 (UI/UX)</option>
                  <option value="PERFORMANCE">效能卡頓 (Performance)</option>
                  <option value="FEATURE_REQUEST">需求變更/新建議 (Feature Request)</option>
                  <option value="DATA_ISSUE">資料異常 (Data Issue)</option>
                  <option value="OTHER">其他諮詢 (Other)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                  嚴重等級
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px'
                  }}
                >
                  <option value="CRITICAL">致命阻斷 (Critical - 系統無法使用)</option>
                  <option value="HIGH">高嚴重度 (High - 主要功能受阻)</option>
                  <option value="MEDIUM">中等程度 (Medium - 一般缺陷或顯示)</option>
                  <option value="LOW">輕微問題 (Low - 建議或微小瑕疵)</option>
                </select>
              </div>
            </div>

            {/* 詳細說明 / Description */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                詳細描述與重現步驟 <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={5}
                placeholder="1. 操作步驟：登入系統 ➜ 點擊財務報表 ➜ 點擊列印&#10;2. 預期結果：正常下載 PDF&#10;3. 實際結果：畫面出現空白且無法操作"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            {/* 媒體附件上傳區 (支援貼圖與影片) / Media Attachments */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  圖片 / 影片佐證附件
                </label>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  支援直接按 <kbd style={{ padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', border: '1px solid #d1d5db' }}>Ctrl+V / Cmd+V</kbd> 貼上截圖
                </span>
              </div>

              {/* 拖曳區 / Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-muted)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileInputChange}
                />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', color: 'var(--primary-600)', marginBottom: '6px' }}>
                  <TextIcon name="image" size="lg" />
                  <TextIcon name="video" size="lg" />
                </div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {uploading ? '檔案上傳中...' : '點擊或拖曳圖片 / 影片至此處上傳'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  支援 PNG, JPG, GIF, MP4, MOV, WebM (單檔最大 100MB)
                </p>
              </div>

              {/* 已上傳檔案列表 / Uploaded Files Preview */}
              {attachments.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' }}>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        position: 'relative',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        backgroundColor: '#fff',
                        fontSize: '12px'
                      }}
                    >
                      {att.fileType === 'image' ? (
                        <img
                          src={att.filePath}
                          alt={att.fileName}
                          style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '80px',
                            backgroundColor: '#1f2937',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <TextIcon name="video" size="lg" />
                          <span style={{ fontSize: '11px' }}>影片附件</span>
                        </div>
                      )}
                      <div style={{ padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {att.fileName}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAttachment(att.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 客戶端環境資訊折疊區 / Environment Info Accordion */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowEnvInfo((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0
                }}
              >
                <TextIcon name={showEnvInfo ? 'eye-off' : 'eye'} size="sm" />
                <span>{showEnvInfo ? '隱藏自動採集的環境資訊' : '查看自動採集的瀏覽器/裝置環境資訊 (將自動隨工單送出)'}</span>
              </button>
              {showEnvInfo && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}
                >
                  <div><strong>瀏覽器:</strong> {envInfo.userAgent}</div>
                  <div><strong>平台與解析度:</strong> {envInfo.platform} / {envInfo.windowSize}</div>
                  <div><strong>回報時間:</strong> {envInfo.submittedAt}</div>
                </div>
              )}
            </div>

          </div>

          {/* 底部按鈕列 / Footer Buttons */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#fafafa'
            }}
          >
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || uploading}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TextIcon name="send" size="sm" />
                <span>{submitting ? '提交中...' : '送出問題工單'}</span>
              </div>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
