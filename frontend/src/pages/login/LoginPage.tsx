import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TextIcon } from '../../components/icon/TextIcon';

/**
 * @file LoginPage.tsx
 * @description 使用者登入頁面 / User Login Page
 * @description_en Form login with real backend authentication, error display, and loading states
 * @description_zh 乾淨表單登入頁面，串接後端真實認證 API，支援防呆校驗與錯誤提示
 */

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const newErrors: { account?: string; password?: string } = {};

    if (!account.trim()) {
      newErrors.account = '請輸入帳號';
    }

    if (!password.trim()) {
      newErrors.password = '請輸入密碼';
    } else if (password.length < 6) {
      newErrors.password = '密碼長度至少需 6 個字元';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(account.trim(), password);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || '登入失敗，請確認帳號密碼';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: "url('/images/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        padding: '24px',
        position: 'relative'
      }}
    >
      {/* 遮罩蓋層 (Overlay for contrast) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none'
        }}
      />

      {/* 登入水晶玻璃卡片 (加大寬度與 Padding) */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '52px 48px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.38), 0 18px 36px -18px rgba(0, 0, 0, 0.28)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Header 區塊 (大氣標題) */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px'
            }}
          >
            利恒系統
          </h1>
        </div>

        {/* 伺服器錯誤提示橫幅 */}
        {serverError && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <TextIcon name="danger" size="sm" color="#b91c1c" />
            <span>{serverError}</span>
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleSubmit} noValidate>
          {/* 帳號 */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="account-input" style={{ fontWeight: 600, color: '#334155', fontSize: '14px', marginBottom: '8px' }}>
              帳號
            </label>
            <div className="input-wrapper">
              <span className="input-prefix-icon" style={{ left: '14px' }}>
                <TextIcon name="user" size="md" color="#94a3b8" />
              </span>
              <input
                id="account-input"
                type="text"
                className={`form-input input-with-icon ${errors.account ? 'is-invalid' : ''}`}
                style={{ padding: '12px 16px 12px 44px', fontSize: '15px' }}
                placeholder="請輸入帳號 (例如: admin)"
                value={account}
                onChange={(e) => {
                  setAccount(e.target.value);
                  if (errors.account) setErrors((prev) => ({ ...prev, account: undefined }));
                  if (serverError) setServerError(null);
                }}
                disabled={isLoading}
              />
            </div>
            {errors.account && <div className="form-error-msg">{errors.account}</div>}
          </div>

          {/* 密碼 */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label" htmlFor="password-input" style={{ fontWeight: 600, color: '#334155', fontSize: '14px', marginBottom: '8px' }}>
              密碼
            </label>
            <div className="input-wrapper">
              <span className="input-prefix-icon" style={{ left: '14px' }}>
                <TextIcon name="lock" size="md" color="#94a3b8" />
              </span>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className={`form-input input-with-icon input-with-suffix ${errors.password ? 'is-invalid' : ''}`}
                style={{ padding: '12px 46px 12px 44px', fontSize: '15px' }}
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  if (serverError) setServerError(null);
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                style={{ right: '10px' }}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? '隱藏密碼' : '顯示密碼'}
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
              >
                <TextIcon name={showPassword ? 'eye-off' : 'eye'} size="md" />
              </button>
            </div>
            {errors.password && <div className="form-error-msg">{errors.password}</div>}
          </div>

          {/* 登入按鈕 */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '17px',
              fontWeight: 700,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 8px 24px -2px rgba(2, 132, 199, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <TextIcon name="login" size="md" color="#ffffff" />
            <span>{isLoading ? '登入中...' : '登入'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
