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
