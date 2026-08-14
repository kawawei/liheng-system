# 問題追蹤與排查紀錄 (Troubleshooting Log)

## 1. 前端容器 Vite 500: Failed to resolve import "@kawawei/frontend-modules" [2026-08-14 19:25]

### 問題描述 (Issue)
* 在前端引入 `@kawawei/frontend-modules` 後，瀏覽器訪問 `http://localhost:5173/` 報錯 `500 Internal Server Error`，Vite 顯示無法解析 `@kawawei/frontend-modules`。
* 瀏覽器擴充功能 content script 同步捕獲到 500 錯誤。

### 原因分析 (Root Cause)
1. **Docker 構建快取與 Volume 掛載層級**：本地開發環境透過 Docker Compose Volume 掛載宿主機之 `frontend/` 目錄至容器內 `/app/frontend`。在 pnpm 預設的 symlink 模式下，宿主機之 `node_modules/@kawawei/frontend-modules` 是向上三層的相對連結 (`../../../node_modules/...`)，進入容器後無法對應到正確的 `.pnpm` 目錄。
2. **Dockerfile 複製時包含宿主機 node_modules**：原先未配置 `.dockerignore`，導致本機殘留的 symlinks 覆蓋了容器內的安裝產物。

### 解決方案 (Solution)
1. **設定 Hoisted 依賴模式**：在 `.npmrc` 與 `frontend/.npmrc` 中新增 `node-linker=hoisted` 與 `shamefully-hoist=true`，讓所有依賴平鋪於 `node_modules`。
2. **建立 `.dockerignore`**：在根目錄與 `frontend/` 目錄建立 `.dockerignore`，嚴格忽略 `node_modules` 與 `dist`。
3. **優化 Dockerfile.frontend**：獨立執行 `COPY frontend/package.json frontend/.npmrc* ./` 並於容器內執行 `pnpm install`。
4. **重新構建容器**：清除舊 volume 並執行 `docker compose up -d --build`，重啟後 `GET /src/main.tsx` 與 `GET /health` 均順利回傳 `200 OK`，`@kawawei/frontend-modules` 正常載入。
