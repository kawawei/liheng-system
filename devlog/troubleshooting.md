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

---

## 3. 前端 Runtime 報錯: Incompatible React versions (- react: 19.2.8, - react-dom: 19.2.6) [2026-08-14 20:08]

### 問題描述 (Issue)
* 在升級 React 19 後，瀏覽器控制台拋出 `Uncaught Error: Incompatible React versions: The "react" and "react-dom" packages must have the exact same version. Instead got: - react: 19.0.0 (或 19.2.8) - react-dom: 19.2.6`。

### 原因分析 (Root Cause)
1. **第三方組件庫硬編碼與 Bundle 內置 ReactDOM**：排查 `@kawawei/frontend-modules@0.1.11` 構建產物 `dist/caas-modules.umd.js` 發現，該套件在發布時將 `react-dom` 完整打入產物，且內部硬編碼了版本號檢查 `Zh.version = "19.2.6"` 及 `version: "19.2.6"`。React 19 核心要求 `react` 與 `react-dom` 必須完全同版號，當主專案使用 19.0.0 或 19.2.8 時，即會在 Runtime 拋出此異常。
2. **Docker 匿名 Volume (Anonymous Volume) 隔離與 Vite 快取**：`docker/local/compose.yaml` 中掛載了 `- /app/frontend/node_modules` 匿名卷，導致宿主機更新 package.json 後，容器內部的 `node_modules` 與 Vite 預編譯快取 (`node_modules/.vite`) 未同步更新。

### 解決方案 (Solution)
1. **精準對齊套件內置 React 版本**：在根目錄與前端 `package.json` 中將 `react` 與 `react-dom` 精準設定並覆蓋 (`pnpm.overrides`) 為 `19.2.6`，達成與 `@kawawei/frontend-modules` 內置 `ReactDOM 19.2.6` 100% 精準對齊。
2. **同步 Docker 容器內部與清理 Vite 快取**：直接進入容器執行 `pnpm install` 更新套件，清除 `node_modules/.vite` 快取並重啟 `liheng-system-frontend` 容器服務。

### 驗證結果 (Verification)
* 執行 `pnpm --filter frontend build` 成功建構無錯誤。
* 容器內 `pnpm list react react-dom` 確認 `react@19.2.6` 與 `react-dom@19.2.6` 完全一致。
* 重新整理瀏覽器頁面後 `Incompatible React versions` 錯誤徹底消失。

紀錄時間：20:08
