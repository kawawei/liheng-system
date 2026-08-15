# 功能規格說明書 (SPEC) - 立衡軟體開發專案與營運管理內部系統

> **文件說明**: 本文檔詳細定義全域 UI/UX 規範、Icon 尺寸規格、組件庫標準、前台邏輯判斷、欄位屬性驗證、單號編碼原則、WebSocket 即時推播事件、8 小時憑證過期機制與前端路由守衛，作為前端 (React)、後端 (Node.js) 開發與 QA 測試案例撰寫之實作依據。

---

## 0. 文件修訂紀錄 (Revision History)

| 版本 | 修訂日期 | 修訂者 | 變更說明 / 摘要 | 審核狀態 |
| :---: | :---: | :---: | :--- | :---: |
| v1.0.0 | 2026-08-14 | PM / Dev Team | 初稿建立：詳細展開 CRM、合約報價、PMS 專案研發、多階段收支毛利、LINE 專案群組雙向 AI 協同、pgvector 向量檢索之功能規格。 | 待審核 |
| v1.0.1 | 2026-08-14 | PM / Dev Team | 全面規範對齊：完全禁用 Emoji、文字 Icon 大中小尺寸標準、亮色主題、@kawawei/frontend-modules 組件庫、PWA 規範、URL 標籤頁狀態保持、WebSocket 全量即時更新、8 小時憑證過期自動跳轉、Redis 年月日+四位序號自動發號規則、後端強制驗證與禁止預設資料。 | 待審核 |
| v1.0.2 | 2026-08-14 | PM / Dev Team | 補齊測試案例與驗收標準：新增第 6 章「功能測試案例與驗收清單」，包含欄位防呆、8h 憑證過期自動跳轉、Redis 單號原子性與 WebSocket 雙向推播驗證。 | 待審核 |

---

## 1. 全域 UI/UX 與視覺規範 (Global Conventions)

### 1.1 視覺主題與組件庫標準
* **主題規範**: 先以**亮色主題 (Light Theme)** 為主，背景以乾淨純白 (`#FFFFFF`) 與柔和灰 (`#F8FAFC`, `#F1F5F9`) 為主基調，文字與邊框具備高對比度。
* **組件庫規範**: 統一引入並使用 **`@kawawei/frontend-modules`** Web Components 組件庫 (基於 Shadow DOM 封裝，實現零侵入性 UI 整合)。
* **Emoji 限制**: 全系統介面、按鈕、表格、狀態標籤、提示訊息**完全禁用 Emoji 字符**，一律採用純文字狀態或標準 SVG/Icon 呈現。

### 1.2 文字與圖標 (Icon) 尺寸規格
所有系統 Icon (SVG / Font Icon) 必須使用統一定義的常規尺寸，並支援自定義尺寸：

| 尺寸等級 (Size) | 像素尺寸 (Pixel) | 使用情境 (Usage Scenario) |
| :--- | :---: | :--- |
| **小 (sm)** | `16px x 16px` | 表格行內操作按鈕、標籤 Badge 內綴圖標、輸入框輔助圖標 |
| **中 (md)** | `20px x 20px` (預設) | 主導航欄選單、次級按鈕、卡片標題圖標、操作按鈕 |
| **大 (lg)** | `24px x 24px` | 模組主標題圖標、頂部快捷按鈕、Dashboard KPI 核心指標圖標 |
| **自定義 (custom)** | `自定義 W x H` | 特殊圖表、空狀態插圖、登入頁品牌標誌 |

### 1.3 UI 狀態視覺與行為表現

| 狀態類別 (State) | 觸發情境 (Trigger Scenario) | 前端表現方式 (UI Behavior) | 備註 |
| :--- | :--- | :--- | :--- |
| **Normal** | 預設正常狀態 | 亮色主題樣式，文字深灰 (`#0F172A`)，背景淺白 | 預設樣式 |
| **Loading** | API 請求處理中 (> 200ms) | 按鈕顯示旋轉 Loading Spinner，且設定為 `Disabled` | 禁止重複點擊 |
| **Skeleton** | 頁面或卡片初始載入 | 顯示灰色脈衝骨架屏 (Skeleton Screen) | 提升感知流暢度 |
| **Disabled** | 欄位未填齊 / 無權限操作 | 元素透明度 50%，滑鼠游標變更為 `not-allowed` | 禁止觸發 Click |
| **Error (Input)** | 欄位格式驗證失敗 (Regex) | Input 邊框變紅色 (`#EF4444`)，下方顯示紅字提示訊息 | 即時單欄驗證 |
| **Toast Alert** | API 執行結果回饋 (成功/失敗) | 畫面右上角彈出 Toast，3 秒後自動滑出消失 (成功:綠, 失敗:紅, 警告:黃) | 全域 Toast 組件 |
| **Modal / Dialog**| 新增/編輯、確認刪除 | 背景半透明遮罩 (`rgba(0,0,0,0.5)`)，ESC 鍵或點擊外部可關閉 (防呆確認除外) | 保持操作專注 |
| **Empty State** | 列表無任何資料 | 畫面中央顯示圖標 + 提示文字「尚無相關資料」+「立即新增」按鈕 | 避免空白畫面 |

### 1.4 PWA 與 RWD 響應式規範
* **RWD 自適應**: 採用 Flexbox 與 Grid 佈局，支援 Desktop (1920px, 1440px)、筆電 (1024px) 與平板/手機 (768px, 375px) 之自適應排版。
* **PWA 支援**:
  * 提供 `manifest.json` 與 Service Worker 快取機制。
  * 支援 iOS (Safari 加入主畫面) 與 Android (Chrome 安裝應用程式)，提供原生 App 般的全螢幕體驗。

### 1.5 標籤頁 (Tabs) 與頁面刷新狀態保持
* **無狀態丟失原則**: 所有頁面的標籤頁 (Tabs)、分頁 (Page)、篩選條件 (Filters) 必須與 **URL Query Parameters** 進行雙向綁定（例：`/projects/PJ-20260814-0001?tab=logs&page=2`）。
* **行為限制**: 用戶在任何分頁或標籤頁按下瀏覽器重新整理 (F5 / Refresh) 時，**嚴禁回退至預設首頁或其他標籤頁**，必須精確停留於刷新前的頁面與標籤。

### 1.6 單號自動編碼規則
所有系統單據均由後端在建立時自動發號，格式強制為「**業務前綴 - 年月日 - 四位流水號**」：

| 單據類型 | 前綴 (Prefix) | 編碼格式 (Format) | 範例 (Example) |
| :--- | :---: | :--- | :--- |
| **報價單** | `QT` | `QT-YYYYMMDD-XXXX` | `QT-20260814-0001` |
| **合約書** | `CT` | `CT-YYYYMMDD-XXXX` | `CT-20260814-0001` |
| **專案案號** | `PJ` | `PJ-YYYYMMDD-XXXX` | `PJ-20260814-0001` |
| **收款單** | `REC` | `REC-YYYYMMDD-XXXX` | `REC-20260814-0001` |
| **支出單** | `EXP` | `EXP-YYYYMMDD-XXXX` | `EXP-20260814-0001` |

* **發號機制**: 當日第一筆由 `0001` 開始累加，跨日自動重置為 `0001`；後端採用資料庫事務或 Redis 原子計數器，確保在高並發下單號唯一且不重複。

### 1.7 憑證 8 小時過期與自動跳轉機制
* **JWT 有效期**: Access Token 有效時間設定為 **8 小時** (`8h`)。
* **過期偵測與跳轉**:
  1. 前端 Axios / Fetch 封裝全域 Response 攔截器，當收到 `401 Unauthorized` 且錯誤碼為 `ERR_AUTH_EXPIRED` 時，立即清空本地 Token 與使用者狀態，並自動跳轉至 `/login` 登入頁。
  2. 前端設定定時器 (Timer) 監控 Token 剩餘效期，當到達 8 小時過期臨界點時，自動跳轉至登入頁並彈出提示「登入憑證已過期，請重新登入」，**不需要用戶手動刷新頁面即可觸發跳轉**。

### 1.8 資料驗證與 Mock 數據規範
* **後端強制驗證**: 所有後端 API 必須使用 Schema 驗證套件 (如 `Zod` 或 `Joi`) 進行嚴格的資料型態、長度與格式檢驗，**嚴禁僅依賴前端驗證就寫入資料庫**。
* **禁止預設值帶入**: 所有新增表單在打開時，除日期預設為今日外，其餘欄位**一律禁止默認帶入測試假資料**，確保資料輸入之乾淨與真實。
* **模擬數據獨立**: 所有本地開發與測試用的模擬數據 (Mock Data)，一律抽離獨立存放在 `mock/` 目錄中，嚴禁散落在業務程式碼內。

---

## 2. 詳細頁面與元件規格 (Detailed Specifications)

### 2.1 客戶關係管理頁面 (CRM - `/clients` & `/clients/:id`)

#### 2.1.1 新增/編輯客戶表單欄位與驗證

| 欄位名稱 | 元件類型 | 必填 | 驗證規則 (Regex / Rule) | 預設值 | 說明 |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `name` | Text Input | 是 | 字數 1-100 字 | 空白 | 客戶 / 單位名稱 (置於最首位) |
| `contact_person` | Text Input | 是 | 字數 1-50 字 | 空白 | 主要聯絡人姓名 |
| `contact_phone` | Text Input | 是 | 手機或電話格式 | 空白 | 聯絡人電話 |
| `company_name` | Text Input | 否 | 字數 1-100 字 | 空白 | 公司名稱 (無公司可留空) |
| `tax_id` | Text Input | 否 | 台灣統編 8 碼數字 (`^\d{8}$`) | 空白 | 統一編號 (選填) |
| `company_phone` | Text Input | 否 | 市話格式 | 空白 | 公司電話 (選填) |
| `email` | Text Input | 否 | Email 格式 | 空白 | 電子郵件 (選填) |
| `address` | Text Input | 否 | 字數 1-200 字 | 空白 | 公司/通訊地址 (選填) |
| `system_type` | Input / Chips | 否 | Web系統/App/POS/電商/IoT等 | 空白 | 預計開發系統類型 |
| `requirement_summary`| Textarea | 否 | 最大 1000 字 | 空白 | 客戶需求概要與專案構想描述 |
| `status` | Select | 是 | `pending` / `negotiating` / `pending_signature` / `in_cooperation` / `delivered` / `lost` | `pending` | 客戶生命週期狀態 (待洽談 -> 洽談中 -> 待簽約 -> 合作中 -> 已交付 -> 未成交) |

#### 2.1.2 聯繫歷史時間軸管道規範 (`contact_type`)
聯繫紀錄僅限使用以下 5 種標準溝通管道：
1. `line`: LINE 訊息
2. `phone`: 電話溝通
3. `fb`: FB 私訊 (Facebook)
4. `ig`: IG 訊息 (Instagram)
5. `threads`: Threads 互動紀錄

---

### 2.2 合約與報價單管理頁面 (Contracts - `/contracts`)

#### 2.2.1 建立合約/報價單表單

| 欄位名稱 | 元件類型 | 必填 | 驗證規則 | 說明 |
| :--- | :--- | :---: | :--- | :--- |
| `code` | Readonly Input | 是 | 系統自動發號 (`QT-YYYYMMDD-XXXX` / `CT-YYYYMMDD-XXXX`) | 自動產生 |
| `type` | Select | 是 | `quotation` (報價單) / `contract` (開發合約) / `maintenance` (維護約) | 單據類型 |
| `title` | Text Input | 是 | 2-100 字 | 合約/報價單主題名稱 |
| `client_id` | Select (Search) | 是 | 必須存在於客戶庫 | 關聯客戶 |
| `amount_untaxed` | Number Input | 是 | $> 0$ 整數 | 未稅金額 (輸入時自動計算 5% 稅額與含稅總額) |
| `tax_rate` | Number Input | 是 | 預設 `5` (%) | 營業稅率 |
| `amount_taxed` | Number Display | 是 | `amount_untaxed * (1 + tax_rate/100)` | 自動計算之含稅總額 |
| `status` | Select | 是 | `negotiating` / `pending_sign` / `signed` / `closed` | 簽署狀態 |
| `start_date` | Date Picker | 否 | 日期 | 合約起始日期 |
| `end_date` | Date Picker | 否 | $\ge \text{start\_date}$ | 合約終止日期 |
| `file_attachment`| File Upload | 否 | 接受 `.pdf, .png, .jpg`, 限制 $\le 20\text{MB}$ | 合約用印掃描檔 / 報價單 PDF |

---

### 2.3 專案研發管理頁面 (PMS - `/projects/:id`)

#### 2.3.1 專案詳情 Tab 頁籤規格 (URL 雙向綁定)
* 頁面 URL 範例：`/projects/PJ-20260814-0001?tab=milestones`
* 包含 5 大 Tab 頁籤：
  1. `milestones`: 里程碑與進度表（節點名稱、預計交付日、完成狀態、進度百分比 0-100%）。
  2. `logs`: 工程師進度回報日誌（回報日期、完成工作、進行中項目、技術/時程阻礙）。
  3. `qa`: 測試狀況與線上運行監控（Bug 清單、嚴重等級 Critical/Major/Minor、修復狀態、伺服器運行燈號）。
  4. `line_sync`: LINE 專案群組動態串流與雙向發送面板。
  5. `finance`: 專案專屬收支、多階段收款狀態與實際毛利損益。

---

### 2.4 財務收支與多階段收款頁面 (Finance - `/finance`)

#### 2.4.1 多階段收款期程與核銷表單
* **多階段收款欄位**:
  * 單號: 自動產生 `REC-YYYYMMDD-XXXX`
  * 階段名稱 (如：第一階段訂金)、預計請款日、未稅金額、含稅金額
  * **請款 (開立發票)**: 發票開立日期、發票號碼 (`^[A-Z]{2}-\d{8}$`)、發票備註
  * **入帳核銷**: 實收日期、實收金額、入帳銀行帳戶（由公司銀行清單中選擇），核銷後狀態變更為 `已入帳`

#### 2.4.2 專案與公司支出表單
* 單號: 自動產生 `EXP-YYYYMMDD-XXXX`
* 支出名稱、日期、類別 (伺服器/API/外包/公司營運)、歸屬對象 (指定專案 / 公司共用)、金額 (未稅/含稅)、供應商、發票/收據號碼、憑證附件、付款銀行帳戶、付款狀態 (`待付款` / `已付款`)。

#### 2.4.3 財務匯出功能
* 點擊「匯出收支清冊」：前端請求後端生成標準 Excel/CSV 檔案並自動觸發瀏覽器下載。

---

## 3. WebSocket 即時數據監聽與同步規格 (Realtime Sync)

為確保多用戶協同作業時資料即時一致，**所有資料更新均透過 WebSocket 推播，前端監聽事件即時更新 React 狀態，不進行全頁刷新**。

### 3.1 WebSocket 事件清單 (Event Definitions)

| 事件名稱 (Event Name) | 觸發時機 (Trigger Scenario) | Payload 內容 (Data Schema) | 前端響應行為 (Frontend Action) |
| :--- | :--- | :--- | :--- |
| `client:updated` | 客戶資料新增、編輯或狀態流轉 | `{ client_id, status, updated_at, data }` | 更新客戶列表或詳情對應 State |
| `contract:updated`| 合約狀態變更 (如變更為已簽署) | `{ contract_id, status, updated_at }` | 更新合約清冊 Badge 與連動提醒 |
| `project:progress`| 工程師提交日誌或更新里程碑 | `{ project_id, progress_rate, log }` | 更新專案進度條與日誌列表 |
| `project:qa_status`| Bug 新增/修復或伺服器狀態變更 | `{ project_id, bug_id, health_status }` | 更新 QA 列表與健康燈號 |
| `finance:received`| 專案款項已入帳核銷 | `{ project_id, rec_id, amount_received }` | 更新收支列表與專案毛利統計 |
| `line:message_new`| LINE 群組收到新訊息 | `{ project_id, group_id, sender_name, text }` | 將新訊息 Append 到 LINE 動態串流 |
| `ai:task_generated`| AI 提煉對話生成待辦事項 | `{ project_id, task_title, priority }` | 彈出通知並在專案待辦中高亮顯示 |

---

## 4. 錯誤代碼與前端反饋對照表 (Error Handling)

| 錯誤代碼 (Code) | HTTP 狀態 | 前端 Toast 提示文字 | 處理機制 |
| :--- | :---: | :--- | :--- |
| `ERR_AUTH_EXPIRED` | 401 | 登入憑證已過期，請重新登入 | 清除 Token，自動跳轉至 `/login` |
| `ERR_FORBIDDEN` | 403 | 您沒有權限執行此操作 | 彈出警告 Toast，阻止非法請求 |
| `ERR_VALIDATION_FAILED`| 422 | 請檢查輸入資料格式是否正確 | 標記欄位紅框並顯示後端驗證訊息 |
| `ERR_DUPLICATE_TAX_ID` | 409 | 此統一編號已存在於客戶庫中 | Input 標記紅色，提示客戶已重複 |
| `ERR_LINE_API_ERROR` | 502 | LINE 訊息推播失敗，請檢查 Token | 提示檢查 LINE Bot 設定或配額 |
| `ERR_SERVER_EXCEPTION` | 500 | 系統伺服器忙碌中，請稍後再試 | 記錄錯誤 Log，顯示通用錯誤 Toast |

---

## 5. 前端路由守衛與權限矩陣 (Route Guards)

| 路由路徑 (Route) | 頁面名稱 | 超級管理員 | 工程師 |
| :--- | :--- | :---: | :---: |
| `/login` | 帳號登入頁面 | 允許 | 允許 |
| `/dashboard` | 系統總覽儀表板 | 完整數據 | 指派專案數據 |
| `/clients/*` | 客戶管理 (CRM) | 完整編輯 | 僅讀取關聯客戶 |
| `/contracts/*` | 合約與報價單管理 | 完整編輯 | 僅讀取關聯合約 |
| `/projects/*` | 專案進度與研發管理 | 完整操作 | 完整操作被指派專案 |
| `/finance/*` | 財務收支與多階段收款 | 完整操作 | 403 路由攔截並隱藏選單 |
| `/search` | 全局向量搜尋與問答 | 允許 | 允許 |

---

## 6. 功能測試案例與驗收清單 (Test Cases & Verification)

| 測試案例編號 (TC-ID) | 測試模組 | 測試情境與輸入 (Test Scenario) | 預期結果 (Expected Outcome) | 驗收類型 |
| :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-001` | 認證 | 輸入正確帳密點擊登入 | 獲取 8h JWT，存入 localStorage 並跳轉 `/dashboard` | 整合測試 |
| `TC-AUTH-002` | 認證 | Token 效期達到 8 小時或 API 回傳 401 | 自動清空本地 Token，無需手動刷新直接跳轉 `/login` | 單元/E2E |
| `TC-CLIENT-001`| CRM | 輸入統編為 `12345` 點擊儲存 | 後端 Zod 攔截回傳 422，前端 Input 標紅並提示需為 8 碼數字 | 單元測試 |
| `TC-CONTRACT-001`| 合約 | 建立合約輸入未稅金額 `100,000` | 前端自動計算含稅 `105,000`，由 Redis 發出單號 `CT-YYYYMMDD-0001` | 整合測試 |
| `TC-PROJECT-001` | PMS | 點擊專案詳情切換至 Tab `logs` 並按 F5 刷新 | URL 為 `?tab=logs`，頁面刷新後仍停留在 `logs` 標籤頁不重置 | 前端測試 |
| `TC-REALTIME-001`| WebSocket | 後端收到 LINE Webhook 新訊息 | 前端專案詳情 LINE 動態面板即時 Append 訊息，無整頁刷新 | 整合測試 |
| `TC-FINANCE-001` | 財務 | 專案收款 `300,000`，專案支出 `120,000` | 系統精確結算實際毛利 `180,000`，毛利率 `60.0%` | 單元測試 |
| `TC-HEALTH-001`  | 容器與監控 | 請求 `GET /api/v1/health` 且 DB/Redis 正常連線 | 回傳 HTTP 200，包含 DB、Redis 與記憶體指標；Docker 容器狀態為 `(healthy)` | 整合測試 |

