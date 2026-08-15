/**
 * @file AccountFormModal.tsx
 * @description 新增與編輯帳號彈窗組件 / Account Form Modal Component (Create & Edit)
 * @description_en Modal form for creating and editing user accounts. Securely hides existing passwords and requires clicking "Change Password" to update.
 * @description_zh 帳號表單彈窗，支援新增與編輯成員帳號。編輯時絕不顯示已存密碼，需主動點擊「修改密碼」方可輸入新密碼
 */

import React, { useState, useEffect } from 'react';
import { UserAccount } from '../../../types';
import { Button } from '../../button/Button';
import { TextField } from '../../input/TextField';
import { TextIcon } from '../../icon/TextIcon';
import './AccountFormModal.css';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: UserAccount) => void;
  existingAccounts: UserAccount[];
  initialData?: UserAccount | null;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingAccounts,
  initialData
}) => {
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEdit = Boolean(initialData);

  // ========================================
  // 初始化與資料同步 / Sync Data on Open
  // ========================================
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setAccount(initialData.account || '');
        setPassword('');
        setIsChangingPassword(false);
      } else {
        setName('');
        setAccount('');
        setPassword('');
        setIsChangingPassword(true);
      }
      setShowPassword(false);
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // ========================================
  // 表單重設 / Form Reset
  // ========================================
  const resetForm = () => {
    setName('');
    setAccount('');
    setPassword('');
    setShowPassword(false);
    setIsChangingPassword(false);
    setErrors({});
  };

  // ========================================
  // 表單提交處理 / Submit Handler
  // ========================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '請輸入姓名';
    }

    if (!account.trim()) {
      newErrors.account = '請輸入帳號';
    } else {
      const duplicate = existingAccounts.some(
        (acc) =>
          acc.account.toLowerCase() === account.trim().toLowerCase() &&
          acc.id !== initialData?.id
      );
      if (duplicate) {
        newErrors.account = '該帳號已被使用，請更換其他帳號';
      }
    }

    // 密碼校驗：新增時必填；編輯時若點擊修改密碼則必填且 >= 6 碼
    if (!isEdit) {
      if (!password.trim()) {
        newErrors.password = '請輸入密碼';
      } else if (password.length < 6) {
        newErrors.password = '密碼長度至少需 6 個字元';
      }
    } else if (isChangingPassword) {
      if (!password.trim()) {
        newErrors.password = '請輸入欲修改的新密碼';
      } else if (password.length < 6) {
        newErrors.password = '新密碼長度至少需 6 個字元';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPassword = isChangingPassword && password.trim() ? password.trim() : initialData?.password;

    const accountData: UserAccount = {
      id: initialData ? initialData.id : `usr_${Date.now()}`,
      name: name.trim(),
      account: account.trim(),
      password: newPassword,
      role: initialData ? initialData.role : 'engineer',
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
      status: initialData?.status || 'active'
    };

    onSubmit(accountData);
    resetForm();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題列 / Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TextIcon name={isEdit ? 'edit' : 'user-cog'} size="md" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? '編輯系統帳號' : '新增系統帳號'}
            </h2>
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
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* 表單內容 / Form Content */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 第一排：姓名 + 帳號 / Row 1: Name + Account */}
            <div className="form-grid-2">
              {/* 姓名 */}
              <TextField
                label="姓名"
                placeholder="請輸入使用者姓名 (如: 陳大明)"
                value={name}
                autoComplete="off"
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                error={errors.name}
                required
              />

              {/* 帳號 */}
              <TextField
                label="帳號"
                placeholder="請輸入登入帳號 (如: dachen)"
                value={account}
                autoComplete="off"
                onChange={(e) => {
                  setAccount(e.target.value);
                  if (errors.account) setErrors((prev) => ({ ...prev, account: '' }));
                }}
                error={errors.account}
                required
              />
            </div>

            {/* 第二排：密碼區塊 / Row 2: Password Section */}
            {isEdit && !isChangingPassword ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ marginBottom: '8px' }}>密碼</label>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsChangingPassword(true);
                      setPassword('');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
                  >
                    <TextIcon name="lock" size="sm" />
                    <span>修改密碼</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label required" style={{ margin: 0 }}>
                    {isEdit ? '設定新密碼' : '密碼'}
                  </label>
                  {isEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPassword('');
                        if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-600)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      取消修改密碼
                    </button>
                  )}
                </div>

                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="new_user_password_input"
                    id="new_user_password_input"
                    autoComplete="new-password"
                    className={`form-input input-with-suffix ${errors.password ? 'is-invalid' : ''}`}
                    placeholder={isEdit ? '請輸入要修改的新密碼 (至少 6 碼)' : '請設定登入密碼 (至少 6 碼)'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    autoFocus={isEdit}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? '隱藏密碼' : '顯示密碼'}
                    aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <TextIcon name={showPassword ? 'eye-off' : 'eye'} size="sm" />
                  </button>
                </div>
                {errors.password && <div className="form-error-msg">{errors.password}</div>}
              </div>
            )}
          </div>

          {/* 按鈕區 / Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '28px',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px'
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              取消
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? '儲存修改' : '確認建立帳號'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
