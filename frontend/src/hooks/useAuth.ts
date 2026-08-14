import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserRole } from '../types';

/**
 * @file useAuth.ts
 * @description 認證與 8 小時效期管理 Hook / Auth & 8-Hour Session Hook
 * @description_en Manages JWT tokens, user profiles, and automatic 8h expiration redirects
 * @description_zh 管理 JWT Token、使用者角色資訊，並實現 8 小時憑證過期自動跳轉機制
 */

const TOKEN_KEY = 'liheng_token';
const USER_KEY = 'liheng_user';
const EXPIRES_KEY = 'liheng_expires_at';
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export function useAuth() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const login = useCallback((role: UserRole, email: string, name: string) => {
    const fakeToken = `jwt_mock_${Date.now()}_${role}`;
    const expiresAt = Date.now() + EIGHT_HOURS_MS;
    const profile: UserProfile = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role
    };

    localStorage.setItem(TOKEN_KEY, fakeToken);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    localStorage.setItem(EXPIRES_KEY, expiresAt.toString());

    setToken(fakeToken);
    setUser(profile);
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // ========================================
  // 8 小時過期定時檢查 / 8h Expiration Check
  // ========================================
  useEffect(() => {
    if (!token) return;

    const expiresAtStr = localStorage.getItem(EXPIRES_KEY);
    if (!expiresAtStr) {
      logout();
      return;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();

    if (now >= expiresAt) {
      logout();
      return;
    }

    const remainingTime = expiresAt - now;
    const timer = setTimeout(() => {
      logout();
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [token, logout]);

  return {
    token,
    user,
    isAuthenticated: !!token,
    isSuperAdmin: user?.role === 'super_admin',
    isEngineer: user?.role === 'engineer',
    login,
    logout
  };
}
