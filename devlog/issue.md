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
