import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { TextIcon } from '../../components/icon/TextIcon';

/**
 * @file LoginPage.tsx
 * @description 使用者登入頁面 / User Login Page
 * @description_en Clean form login without role selector or 8-hour text, with input validation
 * @description_zh 乾淨表單登入頁面，移除角色選擇選單，直接登入並進行必填格式防呆校驗
 */

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = '請輸入電子信箱';
    } else if (!email.includes('@')) {
      newErrors.email = '電子信箱格式不正確';
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

    // 根據帳號由系統自動識別角色 (若為 admin 則為超級管理員，否則為工程師)
    const role: UserRole = email.toLowerCase().includes('admin') ? 'super_admin' : 'engineer';
    const userName = role === 'super_admin' ? '系統管理員' : '研發工程師';
    login(role, email, userName);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '36px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--primary-600)',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '20px',
              marginBottom: '12px'
            }}
          >
            LH
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            利恒軟體管理系統
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            請輸入帳號密碼以存取系統
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 電子信箱 / Email Input (乾淨無預設假資料) */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">電子信箱</label>
            <input
              id="email-input"
              type="email"
              className={`form-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="請輸入電子信箱"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            {errors.email && <div className="form-error-msg">{errors.email}</div>}
          </div>

          {/* 密碼 / Password Input (乾淨無預設假資料) */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password-input">密碼</label>
            <input
              id="password-input"
              type="password"
              className={`form-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="請輸入密碼"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            {errors.password && <div className="form-error-msg">{errors.password}</div>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '15px' }}
          >
            <TextIcon name="file-check" size="md" />
            <span>登入</span>
          </button>
        </form>
      </div>
    </div>
  );
};
