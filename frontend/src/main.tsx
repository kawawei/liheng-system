import React from 'react';
import ReactDOM from 'react-dom/client';
import '@kawawei/frontend-modules';
import '@kawawei/frontend-modules/style.css';
import { App } from './App';
import './styles/index.css';

/**
 * @file main.tsx
 * @description 前端應用程式入口點 / Frontend Application Entry Point
 * @description_en Registers @kawawei/frontend-modules CaaS components and mounts React 18
 * @description_zh 載入 @kawawei/frontend-modules 組件庫並掛載 React 18 根節點
 */

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
