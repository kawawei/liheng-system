# 問題排查與修復紀錄 (Issue & Troubleshooting Log)

本文件用於記錄專案開發過程中遇到的 Bug、Error 及異常行為，並詳細記載原因分析與解決方案。

---

## 記錄格式模板 (Template)

```markdown
YYYY-MM-DD HH:MM — [問題標題]

問題描述
- 場景：...
- 錯誤訊息：...

原因分析
- ...

解決方案
- ...

驗證結果
- ...

紀錄時間：HH:MM
```

---

## 問題紀錄列表 (Issues List)

### 2026-08-14 20:08 — [修復 React 19 與 @kawawei/frontend-modules 版本不吻合 Error: Incompatible React versions]

**問題描述**
- 場景：升級至 React 19 後，於瀏覽器控制台拋出全頁面崩潰異常。
- 錯誤訊息：`Uncaught Error: Incompatible React versions: The "react" and "react-dom" packages must have the exact same version. Instead got: - react: 19.2.8 - react-dom: 19.2.6`

**原因分析**
- 第三方組件庫 `@kawawei/frontend-modules` 於構建發布時，將 `react-dom` 完整打包（Bundle）進入其產物 `.js` 檔案中，且檔案內部硬編碼寫死了 `ReactDOM` 版本檢查為 `19.2.6`。當宿主專案為 19.0.0 或 19.2.8 時即會觸發版本不符異常。
- 另外 Docker Compose 配置有 `/app/frontend/node_modules` 匿名 Volume 隔離，導致宿主機 npm 安裝未能自動同步至容器內。

**解決方案**
- 於根目錄與前端 package.json 中將 `react` 與 `react-dom` 設定並覆蓋 (pnpm.overrides) 為 `19.2.6`，與套件內置之 `ReactDOM 19.2.6` 達成 100% 精準對齊。
- 進入容器執行 `pnpm install` 並清除 Vite 舊快取 `node_modules/.vite` 後重啟容器。

**驗證結果**
- 容器內 `pnpm list react react-dom` 確認對齊為 `19.2.6`。
- `pnpm --filter frontend build` 成功建構無錯誤。
- 重新整理瀏覽器控制台錯誤徹底消失。

紀錄時間：20:08

### 2026-08-15 22:58 — [立案彈窗組件庫 Select 下拉滾動受阻與 DatePicker 日曆邊界遮擋修復]

**問題描述**
- 場景：CRM 客戶轉正式專案立案彈窗中，主責工程師團隊下拉多選核取選單無法在視窗內完整滾動；立案開工日期的日曆面板（DatePicker）展開時在底部被彈窗按鈕遮擋，且向上展開時左側週日數字貼邊裁切。
- 錯誤現象：`<Select>` 選單超出瀏覽器 Viewport 下緣導致截斷；`<DatePicker>` 面板向下展開被彈窗底欄覆蓋，向上展開時最左側週日紅字（26, 2, 9...）與翻月箭頭缺乏左側內距。

**原因分析**
- `@kawawei/frontend-modules` 的 `<Select>` 組件採用 `createPortal(..., document.body)` 搭配 `position: fixed`，其 `top` 座標取自宿主元素 `getBoundingClientRect().bottom`。當 Select 被放置於彈窗底部時，展開的 260px 下拉面板直接超出瀏覽器視窗下邊界。
- `<DatePicker>` 內部 `.caas-calendar-popover` 預設向下展開 (`top: 100%`)，在彈窗下半部會被 Modal Footer 遮擋；改為向上展開時，因彈窗網格列左側緊鄰 Modal 邊界，內部日曆格未預留充足左側內距導致貼邊。

**解決方案**
- **Select 欄位佈局優化**：將「主責工程師團隊」與「初始專案階段」移至彈窗正中上半段，為展開的下拉視窗提供超過 450px 的充足可視空間，工程師核取清單可自由上下滾動。
- **DatePicker 向上展開與邊界修復**：透過 CSS 覆蓋 `.create-project-modal .caas-calendar-popover`，強制 `bottom: calc(100% + 8px) !important; top: auto !important; z-index: 99999 !important; min-width: 320px !important; padding: 14px 18px !important;`，使其向彈窗上方空間展開並擁有 18px 的左側安全內距。

**驗證結果**
- 工程師下拉選單 5 位名單完整呈現，Checkbox 勾選與多選 Tag 標籤流暢正常。
- 日曆選擇器點擊時向上方充裕空間展開，最左側週日欄位具備舒適留白，無任何遮擋或裁切。
- 前端 `npm run build` 打包編譯通過無錯誤。

紀錄時間：22:58

### 2026-08-16 00:04 — [客戶詳情頁 Tab 樣式失效、立案彈窗 5% 勾選框對齊與預設商業資料清理]

**問題描述**
- 場景 1：客戶詳情頁 (`ClientsDetailPage`) 的頁籤按鈕出現原生黑色外框且擠壓在一起。
- 場景 2：資料庫初始化時自帶台元半導體、國泰證券等預設假資料。
- 場景 3：專案立案彈窗 (`ProjectCreateModal`) 中，未稅金額輸入框與「外加 5% 營業稅」核取框未在同一水平線上、輸入框內有原生上下箭頭調節鈕，且新增階段按鈕出現 `+ + 新增階段` 重複圖示。

**原因分析**
- **Tab 樣式失效**：`ClientsDetailPage.tsx` 導航容器與按鈕使用的 class 命名為 `client-detail-tabs-bar` 與 `client-tab-btn`，而 `ClientsDetailPage.css` 內定義的是 `.client-tabs-nav` 與 `.tab-item-btn`，導致樣式未成功套用。
- **預設假資料**：`backend/src/utils/seed.ts` 中植入了展示用的客戶、專案與 WBS 模擬數據。
- **立案彈窗排版與箭頭**：金額輸入框外層包了 `TextField`（自帶 label 與內部 wrapper），與右側獨立的 `tax-checkbox-container` 容器使用 `align-items: flex-end` 對齊時，因高度與 margin 差異產生垂直落差；瀏覽器預設對 `input[type=number]` 渲染 spin buttons；按鈕既有 `<TextIcon name="plus" />` 圖示，文案中又硬寫了 `+ 新增階段`。

**解決方案**
- **Tab 類名統一**：將 `ClientsDetailPage.tsx` 類名修正為 `client-tabs-nav` 與 `tab-item-btn`，恢復藍色高亮底線與懸停樣式。
- **種子資料純淨化與 TRUNCATE**：更新 `seed.ts` 徹底移除商業數據植入邏輯，僅保留管理員帳號 (`admin` / `admin123`)，並對資料庫執行 `TRUNCATE TABLE` 清空所有業務表。
- **立案彈窗排版重構**：
  - 將金額標籤獨立置頂，下方以 `display: flex; align-items: center; gap: 16px;` 容器同時包裹 `input` 與 `tax-checkbox-label`，統一為 `42px` 等高並加大勾選框為 `19px` 與字級 `14px`。
  - 在 `index.css` 與組件 CSS 中全域加入 `::-webkit-outer-spin-button, ::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }` 與 `appearance: textfield;`。
  - 將按鈕文案修正為純文字 `新增階段`。
  - 多階段表格新增獨立「期數」欄位（`1`, `2`, `3`... 唯讀徽章），專案負責人改用 `@kawawei/frontend-modules` 之 `<Select multiple showCheckbox />`。

**驗證結果**
- 前端與後端編譯建構 100% 通過（`pnpm build`）。
- 8 項前端單元測試全部通過（`pnpm test`）。
- 實機檢視客戶列表、專案立案彈窗與客戶詳情頁，所有樣式與排版皆精確對齊。

紀錄時間：00:04

### 2026-08-16 13:28 — [根目錄 tsconfig.json Project References 與 Vite noEmit 衝突診斷修復]

**問題描述**
- 場景：IDE 於根目錄 `tsconfig.json` 提示診斷錯誤。
- 錯誤訊息：
  - `參考的專案 '/Users/kawa_wei/Desktop/code-mac.nosync/liheng-system/frontend' 之設定 "composite" 必須為 true。`
  - `參考的專案 '/Users/kawa_wei/Desktop/code-mac.nosync/liheng-system/frontend' 不得停用發出。`

**原因分析**
- 根目錄 `tsconfig.json` 原先配置了 `"references": [{ "path": "./frontend" }, { "path": "./backend" }]`。在 TypeScript Project References 機制下，被參照的專案必須具備 `"composite": true` 且禁止設定 `"noEmit": true`。
- `frontend` 為 Vite 專案（由 Vite 負責打包與發出產物，TypeScript 只負責 `noEmit` 類型檢查），導致 IDE 的 TypeScript Language Server 拋出衝突錯誤。

**解決方案**
- 調整根目錄 `tsconfig.json`，移除不需要的 Project References，作為 Monorepo Workspace 通用基底配置，前後端各自維持獨立的 TypeScript 建構與類型檢查設定。

**驗證結果**
- `pnpm --filter backend build` 與 `pnpm --filter frontend build` 均 100% 成功建構無錯誤。
- IDE 診斷問題徹底消除。

紀錄時間：13:28

### 2026-08-30 17:47 — [生產環境 Node.js ESM 執行期 ERR_MODULE_NOT_FOUND 模組解析問題排查與修復]

**問題描述**
- 場景：生產環境後端 Docker 容器啟動後進入 unhealthy 狀態，重啟失敗。
- 錯誤訊息：`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/backend/dist/controllers/auth.controller' imported from /app/backend/dist/index.js`。

**原因分析**
- 後端 `package.json` 聲明了 `"type": "module"`（原生 ES Modules 模式）。Node.js 原生執行編譯產物 `dist/index.js` 時，嚴格要求相對路徑 import 語句必須包含 `.js` 副檔名（例如 `import ... from './controllers/auth.controller.js'`）。
- 由於 TypeScript 源碼中採用標準無副檔名導入，編譯後的 `dist/index.js` 保留了無副檔名形式，導致原生 `node dist/index.js` 載入失敗。

**解決方案**
- 將後端 `package.json` 中的 `tsx` 執行引擎移至 `dependencies` 生產依賴中。
- 將 `npm start` 調整為 `tsx src/index.ts`，並相應優化 `docker/server/Dockerfile.backend`，直接透過 tsx 進行統一的 ESM 模組路徑解析與執行。

**驗證結果**
- 後端容器 `liheng-system-backend` 順利啟動，健康檢查即刻轉為 `healthy`。
- 登入端點 `POST /api/v1/auth/login` 與客戶管理端點 `GET /api/v1/clients` 測試全部 100% 回應正常。

紀錄時間：17:47


