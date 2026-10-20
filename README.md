# O2O 後台 Demo

依據提供的後台截圖製作，使用 Vite + JavaScript / CSS，搭配 Vue 3 與 Element Plus 元件。純前端，沒有串接真實身分驗證或後端 API。會員資料均為示範資料。

## 本機開發

需要 Node.js 22 或更新版本。用 VS Code 開啟此資料夾，在終端機執行：

```sh
npm install
npm run dev
```

開啟終端機顯示的網址。修改程式後瀏覽器會即時更新。

## 頁面與操作

- 首頁：深藍底登入畫面，點擊「登入」即視為通過身分檢查，直接進入專案列表；未登入進入後台網址會返回登入頁。登入狀態保存在目前分頁的 `sessionStorage`，不是正式 Google OAuth 登入。
- 專案列表：單位下拉篩選（預設全部）搭配名稱／單位搜尋、筆數切換、編號排序、新增、編輯、複製網址；重設會清除文字及單位條件。
- 全站主要列表共用專案列表的分頁樣式：專案、使用者、角色、單位、會員使用紀錄及登入／註冊統計皆支援每頁 10／20／50 筆、前後頁、頁碼與跳頁；重新查詢會回到第一頁。
- 新增／編輯：基本資料、圖片預覽、富文字、問卷題目、追蹤碼、備註，確定送出後存至 localStorage。
- QRCode & URL：產生可掃描的 QRCode，下載 PNG 或複製網址；目的頁是本 demo 的活動說明頁。
- 會員使用記錄：日期／會員搜尋、展開明細、匯出 CSV、查看本次開啟期間的最近匯出時間。
- 登入與註冊統計：固定示範統計、分頁與 CSV 匯出。查詢按鈕只驗證日期，不計算真實資料。
- 側邊選單收合與全螢幕切換。

各專案共用示範會員記錄；服務與電子報選單、問卷編輯器是操作示範，沒有串接外部系統。上傳圖片存在目前瀏覽器，建議壓縮後使用。清除網站 localStorage 可還原初始資料。不同裝置／瀏覽器不會同步。

## 放上 GitHub

建立空白 GitHub repository，將此資料夾內容放到 repository 根目錄（package.json 與 .github 直接位於根目錄）。

```sh
git init
git add .
git commit -m "Create O2O admin demo"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```

在 GitHub repository 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。本專案已附部署 workflow；推送 main 後會建置並部署。部署網址由 Actions 的 deploy 工作顯示。若尚未設定 Pages，可在設定後由 Actions 手動執行 Deploy demo to GitHub Pages。

Hash 路由與相對 base 適用 repository 子路徑，不需伺服器 rewrite。

## 經常修改的檔案

- `src/main.js`：頁面內容、示範資料、按鈕行為、表單欄位。
- `src/style.css`：側欄、顏色、表格、表單間距與手機版樣式。
- `index.html`：網站標題、語言及描述。
- `.github/workflows/deploy.yml`：GitHub Pages 部署。

給 Codex 的提示範例：「請修改 src/style.css，將專案列表欄高改成 60px，保持其他頁面不變。」

## 正式建置

```sh
npm run build
npm run preview
```

`dist/` 是部署產物，不需手動修改或提交。QRCode 使用 qrcode，圖示使用 Lucide。沒有使用遠端 CDN 或外部資料 API。

## 系統管理（本機示範）

- 使用者管理：依單位、狀態、姓名或 Email 篩選；點擊姓名編輯使用者。新增／編輯依序包含狀態 switch、姓名、Email 與管理專案；管理專案可新增多組「單位＋角色」，最後一列顯示新增，其餘列顯示刪除。必填、格式及重複設定的警告顯示在對應欄位下方。
- 跨單位設定保存在使用者的 `assignments` 陣列，列表與單位篩選涵蓋全部設定。舊使用者的單位／角色會轉為第一組設定，並保留第一組的 `unit`／`role` 舊欄位及其他原始欄位。最後一位啟用管理員的保護會檢查全部角色設定。
- 每個使用者在同一單位只能設定一個角色；新增及編輯儲存時皆檢查重複單位。角色下拉只顯示所選單位的角色，更換單位會清除原角色；儲存時也會檢查角色所屬單位。舊資料若有重複或跨單位錯配，不自動合併或改配角色，需在編輯時修正後才能儲存。
- 新增使用者第一組的單位預設為目前已查詢的單位；篩選為全部時採第一個示範單位，後續新增列由使用者選擇。舊使用者若無單位，依舊專案歸屬轉換，無專案歸屬時採第一個示範單位。
- 角色管理：依單位、狀態與角色名稱篩選，點擊角色名稱編輯狀態、單位、角色名稱、說明及功能權限。權限依目前後台選單分組；內建管理員保持啟用及完整權限。舊角色自動補上單位、說明與啟用狀態。
- 各單位的角色獨立：不同單位可建立同名角色，功能權限分別儲存；同一單位內角色名稱不可重複。已指派使用者的角色不可直接變更所屬單位，避免造成原指派失效。
- 單位管理：沿用 `#system/projects` 路由，顯示編號、單位名稱與狀態，支援名稱／狀態篩選、新增及點擊名稱編輯。首次從既有專案、使用者與角色的單位名稱去重建立單位資料；資料存於 `o2o-system.units`，不修改 `o2o-projects`。重新命名單位時同步更新本機使用者與角色的單位名稱。
- 選單管理已移除，系統管理固定顯示使用者、角色及單位管理。舊資料的選單設定與 `menus` 權限會在讀取時清除，其他管理資料保留。
- 使用者、角色與單位保存在 `o2o-system`。未建立真實帳號、密碼、登入或後端權限檢查；狀態與權限皆為本機示範設定，專案目前尚未依指派單位限制可見範圍。權限原則與待補強事項見 [權限 review](docs/PERMISSIONS_REVIEW.md)。


## 從 VS Code 直接預覽 index.html

以瀏覽器開啟根目錄的 index.html，或使用 VS Code 的 Live Server 預覽。請保留 preview 資料夾，無須先啟動 Vite。

修改原始碼後執行 npm run build:preview 更新預覽檔；npm run build 會同步產生 dist 與 preview。開發時仍可執行 npm run dev。

## UI ???

??????????????????????? Element Plus?Element UI ? Vue 3 ????? `src/element-ui.js` ???????????????????????????hash ??? localStorage ??????????????????? CDN?
