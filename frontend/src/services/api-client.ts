import axios from 'axios';

/**
 * @file api-client.ts
 * @description API 請求客戶端封裝 / API Client & Interceptor
 * @description_en Axios instance with Bearer Token injection and 401 automatic redirect
 * @description_zh 封裝 Axios 實例，包含 Authorization Header 注入與 401 憑證失效自動跳轉
 */

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ========================================
// 請求攔截器 / Request Interceptor
// ========================================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('liheng_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========================================
// 響應攔截器 (401 自動跳轉) / Response Interceptor
// ========================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('liheng_token');
      localStorage.removeItem('liheng_user');
      localStorage.removeItem('liheng_expires_at');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
