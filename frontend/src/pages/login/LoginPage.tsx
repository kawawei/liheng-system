import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { TextIcon } from '../../components/icon/TextIcon';

/**
 * @file LoginPage.tsx
 * @description 使用者登入頁面 / User Login Page
 * @description_en Strictly adheres to clean form policy (no hardcoded credentials) with role-selection & validation
 * @description_zh 嚴格遵循乾淨表單規範 (嚴禁預填假資料)，提供角色選擇與必填即時驗證
 */

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('super_admin');
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

    const userName = role === 'super_admin' ? '管理員 (Admin)' : '工程師 (Engineer)';
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
          maxWidth: '420px',
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
            立衡軟體管理系統
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            請輸入帳號憑證以存取系統
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 角色選擇 / Role Selection */}
          <div className="form-group">
            <label className="form-label" htmlFor="role-select">登入角色 (Role)</label>
            <select
              id="role-select"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="super_admin">超級管理員 (Super Admin - 完整權限)</option>
              <option value="engineer">軟體工程師 (Engineer - 專案與日誌)</option>
            </select>
          </div>

          {/* 電子信箱 / Email Input (無預設假資料) */}
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">電子信箱 (Email)</label>
            <input
              id="email-input"
              type="email"
              className={`form-input ${errors.email ? 'is-invalid' : ''}`}
              placeholder="請輸入公司信箱 (如 admin@liheng.com)"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            {errors.email && <div className="form-error-msg">{errors.email}</div>}
          </div>

          {/* 密碼 / Password Input (無預設假資料) */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password-input">密碼 (Password)</label>
            <input
              id="password-input"
              type="password"
              className={`form-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="請輸入登入密碼"
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
            <span>安全登入 (8小時效期)</span>
          </button>
        </form>
      </div>
    </div>
  );
};
