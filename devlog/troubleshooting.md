# 問題追蹤與排查紀錄 (Troubleshooting Log)

## 1. 前端容器 Vite 500: Failed to resolve import "@kawawei/frontend-modules" [2026-08-14 19:25]

### 問題描述 (Issue)
* 在前端引入 `@kawawei/frontend-modules` 後，瀏覽器訪問 `http://localhost:5173/` 報錯 `500 Internal Server Error`，Vite 顯示無法解析 `@kawawei/frontend-modules`。

### 原因分析 (Root Cause)
1. **Docker 構建快取與 Volume 掛載層級**：本地開發環境透過 Docker Compose Volume 掛載宿主機之 `frontend/` 目錄至容器內 `/app/frontend`。在 pnpm 預設的 symlink 模式下，宿主機之 `node_modules/@kawawei/frontend-modules` 是向上三層的相對連結 (`../../../node_modules/...`)，進入容器後無法對應到正確的 `.pnpm` 目錄。
2. **Dockerfile 複製時包含宿主機 node_modules**：原先未配置 `.dockerignore`，導致本機殘留的 symlinks 覆蓋了容器內的安裝產物。

### 解決方案 (Solution)
1. **設定 Hoisted 依賴模式**：在 `.npmrc` 與 `frontend/.npmrc` 中新增 `node-linker=hoisted` 與 `shamefully-hoist=true`，讓所有依賴平鋪於 `node_modules`。
2. **建立 `.dockerignore`**：在根目錄與 `frontend/` 目錄建立 `.dockerignore`，嚴格忽略 `node_modules` 與 `dist`。

---

## 2. 瀏覽器 Runtime 報錯: Cannot read properties of undefined (reading 'S') [2026-08-14 19:37]

### 問題描述 (Issue)
* 瀏覽器控制台拋出 `Uncaught TypeError: Cannot read properties of undefined (reading 'S')` at `@kawawei_frontend-modules.js`。

### 原因分析 (Root Cause)
* **React 18 與 React 19 JSX Symbol 不相容**：`@kawawei/frontend-modules@0.1.11` 組件庫打包產物內部採用了 React 19 的新版 JSX 運行時 `Symbol.for("react.transitional.element")`。當宿主前端專案使用 React 18 (`"react": "^18.3.1"`) 時，React 18 的 `react-dom/client` 無法解析 React 19 的 `react.transitional.element` 節點 Symbol，導致節點解構時嘗試存取內建 symbol `reading 'S'` 拋出 `TypeError` 崩潰。

### 解決方案 (Solution)
* **升級宿主專案 React 至 19.x**：將 `frontend/package.json` 中的 `react`, `react-dom`, `@types/react`, `@types/react-dom` 同步升級至 `19.0.0`，並更新 [`custom-elements.d.ts`](file:///Users/kawa_wei/Desktop/code-mac.nosync/liheng-system/frontend/src/custom-elements.d.ts) 宣告。升級後 React 19 核心引擎原生完美支援該組件庫產物，`reading 'S'` 異常徹底消失。
