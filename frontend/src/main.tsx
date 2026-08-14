import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

/**
 * @file main.tsx
 * @description 前端應用程式入口點 / Frontend Application Entry Point
 * @description_en Mounts React 18 root and global styles
 * @description_zh 掛載 React 18 根節點並載入全域樣式系統
 */

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
