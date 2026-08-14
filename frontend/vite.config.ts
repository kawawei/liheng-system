import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * @file vite.config.ts
 * @description 前端 Vite 構建與開發配置 / Frontend Vite Build & Dev Config
 * @description_en Configures plugins, path aliases, port, host, and dev server health endpoint
 * @description_zh 配置 React 插件、路徑別名、端口監聽與開發伺服器健康端點
 */
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'healthcheck-endpoint',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/health' || req.url === '/api/health') {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString(), service: 'liheng-system-frontend' }));
            return;
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
});
