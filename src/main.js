// 頁面以原生 DOM 與 hash 路由運作；Element Plus 僅增強局部控制項。
// 區段依既有執行順序保留，避免初始化與 localStorage 遷移時序改變。
import { installElementUI, showMessage, confirmAction } from "./element-ui.js";
import "./style.css";
import {
  createIcons,
  BriefcaseBusiness,
  NotebookText,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Maximize,
  RotateCw,
  ChevronsUpDown,
  Download,
  Check,
  PencilLine,
  Search,
  Presentation,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link,
} from "lucide";

// ── 共用圖示與 HTML 工具 ──────────────────────────────────────
const icons = {
  BriefcaseBusiness,
  NotebookText,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Maximize,
  RotateCw,
  ChevronsUpDown,
  Download,
  Check,
  PencilLine,
  Search,
  Presentation,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link,
};
import QRCode from "qrcode";
const $ = (s) => document.querySelector(s);
const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) => `<i data-lucide="${name}"></i>`;

// ── 專案與會員示範資料、列表狀態 ──────────────────────────────
const names = [
  "[測試] 2026生技論壇 AI時代 生醫產業新契機",
  "[測試] 手機和 AI 如何改變我們說故事的方式",
  "[測試] 金融共好論壇 | AI 金融 - 消費新關係",
  "2024 500Young論壇",
  "[測試] 投資大趨勢論壇 | 解碼 ETF 主流趨勢",
  "[測試] 創新論壇 | AI X 智慧應用新革命",
  "(模擬)一刻鯨選udn會員整合登入",
  "[Lab 測試] AI 企業應用研討會",
  "活動報名平台 #552",
];
const seed = names.map((name, i) => ({
  id: 106 - i,
  name,
  displayName: name,
  buid: "26",
  unit: i === 3 ? "娛樂生活事業部" : "行動發展部",
  enabled: true,
  permanent: true,
  created: [
    "2026/09/15",
    "2026/09/03",
    "2025/08/05",
    "2024/07/03",
    "2024/06/18",
    "2024/06/03",
    "2024/05/06",
    "2024/05/03",
    "2024/05/02",
  ][i],
  updated: "2026/10/14",
  start: "2026-10-19",
  end: "2026-10-19",
  email: true,
  phone: true,
  button: "前往活動",
}));
// 讀取舊資料失敗時使用種子資料；保留既有 o2o-projects 儲存鍵。
let projects;
try {
  projects = JSON.parse(localStorage.getItem("o2o-projects")) || seed;
} catch {
  projects = seed;
}
if (!Array.isArray(projects)) projects = seed;
let page = 1,
  limit = 20,
  query = "",
  projectUnit = "all",
  current = projects[0],
  tab = "basic",
  collapsed = false;
const members = [
  {
    id: 2,
    account: 432,
    name: "20260918_1",
    email: "member.demo@example.com",
    phone: "0911222333",
    registered: "2026-09-11 12:09:06",
    login: "2026-09-18 10:36:18",
    gender: "女",
  },
  {
    id: 1,
    account: 428,
    name: "Abby",
    email: "abby.demo@example.com",
    phone: "0911222333",
    registered: "2026-09-11 12:00:11",
    login: "2026-09-18 10:36:37",
    gender: "女",
  },
];
const save = () =>
  localStorage.setItem("o2o-projects", JSON.stringify(projects));
const route = () => location.hash.slice(1) || "login";
const go = (r) => {
  location.hash = r;
};

// ── 登入狀態與權限 ────────────────────────────────────────────
// 這是分頁內的示範身分，不代表正式後端驗證。
let demoSession = { authenticated: false };
try {
  const stored = JSON.parse(sessionStorage.getItem("o2o-demo-session"));
  if (stored?.authenticated === true)
    demoSession = {
      authenticated: true,
      unitId: stored.unitId ?? null,
      userId: stored.userId ?? 1,
    };
} catch {
  /* Session state is optional in this front-end demo. */
}

function saveDemoSession() {
  try {
    sessionStorage.setItem("o2o-demo-session", JSON.stringify(demoSession));
  } catch {
    /* Keep the current in-memory session. */
  }
}
function toast(message, type = "info") {
  showMessage(message, type);
}

const button = (text, action, cls = "", attrs = "") =>
  `<button type="button" class="${cls}" data-action="${action}" ${attrs}>${text}</button>`;
function loginPage() {
  const googleMark =
    '<svg class="google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92A6 6 0 0 1 6.1 12c0-.67.12-1.32.31-1.92V7.49H3.07A10 10 0 0 0 2 12c0 1.61.38 3.14 1.07 4.51l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>';
  $("#app").innerHTML =
    `<main class="entry-screen login-screen"><div class="login-card"><h1>O2O 會員活動應用平台 (Demo)</h1>${button(`${googleMark}<span>登入</span>`, "demo-login", "login-button")}</div></main>`;
}
const ALL_UNITS = "*";
const normalized = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();
const sessionUser = () =>
  systemData.users.find(
    (user) => user.id === demoSession.userId && user.enabled !== false,
  );
const enteredUnit = () =>
  systemData.units.find(
    (unit) => String(unit.id) === String(demoSession.unitId),
  )?.name || "";
const activeUnitNames = () =>
  systemData.units
    .filter((unit) => unit.enabled !== false)
    .map((unit) => unit.name);
const assignmentUnitNames = () => [ALL_UNITS, ...activeUnitNames()];
const assignmentRole = (assignment) =>
  systemData.roles.find(
    (role) =>
      role.id === assignment.role &&
      role.enabled !== false &&
      (assignment.unit === ALL_UNITS
        ? role.id === 1 && role.unit === ALL_UNITS
        : role.id !== 1 && role.unit === assignment.unit),
  );
// Management may retain a disabled unit's assignment; business access may not.
const qualifiedAssignments = (
  user = sessionUser(),
  includeDisabledUnits = false,
) => {
  if (!user || user.enabled === false) return [];
  const assignments = userAssignments(user);
  if (
    assignments.length > 1 &&
    assignments.some((item) => item.unit === ALL_UNITS)
  )
    return [];
  return assignments.filter(
    (assignment) =>
      assignments.filter((item) => item.unit === assignment.unit).length ===
        1 &&
      assignmentRole(assignment) &&
      (assignment.unit === ALL_UNITS ||
        systemData.units.some(
          (unit) =>
            unit.name === assignment.unit &&
            (includeDisabledUnits || unit.enabled !== false),
        )),
  );
};
const validAssignments = () => qualifiedAssignments();
const isSystemAdmin = () =>
  Boolean(
    sessionUser() &&
      validAssignments().some((assignment) => assignment.role === 1),
  );
const unitRoles = (unit) =>
  validAssignments()
    .filter((assignment) => assignment.unit === unit)
    .map(assignmentRole);
const hasRolePermission = (role, feature, action) =>
  role.permissions?.includes(feature) &&
  (action === "view" ||
    role.operationPermissions?.includes(`${feature}:${action}`));
const canManageUnit = (unit, action = "view") =>
  Boolean(sessionUser()) &&
  (isSystemAdmin() ||
    qualifiedAssignments(sessionUser(), true).some(
      (assignment) =>
        assignment.unit === unit &&
        hasRolePermission(assignmentRole(assignment), "projects", action),
    ));
const hasUnitManagement = (action = "view") =>
  isSystemAdmin() ||
  systemData.units.some((unit) => canManageUnit(unit.name, action));
const scopeAllows = (unit) =>
  activeUnitNames().includes(unit) &&
  (isSystemAdmin() || (unit === enteredUnit() && unitRoles(unit).length > 0));
const can = (feature, action = "view", unit) => {
  if (feature === "projects")
    return unit === undefined
      ? hasUnitManagement(action)
      : canManageUnit(unit, action);
  unit ??= enteredUnit();
  if (!scopeAllows(unit)) return false;
  if (isSystemAdmin()) return true;
  return unitRoles(unit).some((role) =>
    hasRolePermission(role, feature, action),
  );
};
const scopedUnitFilter = (value) =>
  isSystemAdmin() && value === "all"
    ? "all"
    : scopeAllows(value) && availableUnits().includes(value)
      ? value
      : enteredUnit();
const filterUnits = () => availableUnits().filter(scopeAllows);
const selectableUnits = () =>
  systemData.units.filter(
    (unit) =>
      unit.enabled !== false &&
      (isSystemAdmin() || unitRoles(unit.name).length > 0),
  );
function deny() {
  toast("您沒有此功能的操作權限。", "error");
  return false;
}
// 撤權、登出或切換單位時，同時清除目前專案及報表暫存。
function clearSensitiveState() {
  if ($("#system-modal")) closeSystemModal();
  current = null;
  visibleMembers = [];
  exportHistory = [];
  reportFilters = { from: "2026-04-19", to: "2026-10-19", query: "" };
  systemQuery = "";
  tab = "basic";
  query = "";
  page = 1;
}
function endSession(message = "") {
  clearSensitiveState();
  demoSession = { authenticated: false };
  saveDemoSession();
  loginPage();
  if (route() !== "login") go("login");
  if (message) toast(message, "error");
}
// 路由與操作前重新檢查帳號、角色及目前單位，處理同頁或跨分頁撤權。
function checkSession() {
  if (!demoSession.authenticated) return false;
  if (!sessionUser() || !selectableUnits().length) {
    endSession("帳號已停用，或沒有啟用的單位與角色，無法登入後台。");
    return false;
  }
  if (
    demoSession.unitId != null &&
    !selectableUnits().some(
      (unit) => String(unit.id) === String(demoSession.unitId),
    )
  ) {
    clearSensitiveState();
    demoSession.unitId = null;
    saveDemoSession();
    unitSelectionPage();
    go("select-unit");
    toast("目前單位指派已失效，請重新選擇有效單位。", "error");
    return false;
  }
  return true;
}
const systemRecordAccess = (kind, record, action = "view") => {
  if (kind === "projects") return canManageUnit(record.name, action);
  if (isSystemAdmin()) return true;
  if (kind === "roles" && record.id === 1 && action === "view")
    return can("roles");
  return (
    can(kind, action) &&
    (kind === "users"
      ? userAssignments(record).some(
          (assignment) =>
            assignment.unit === enteredUnit() ||
            (assignment.unit === ALL_UNITS && assignment.role === 1),
        )
      : record.unit === enteredUnit())
  );
};
// 依網址指定的專案判斷權限，避免沿用上一頁的 current 狀態。
function routeAccess() {
  const [name, id] = route().split("/");
  if (["home", "select-unit", "login"].includes(name)) return true;
  if (name === "system") return can(id);
  if (name === "new") return can("project-list", "write");
  if (name === "projects") return can("project-list");
  const project = projects.find((item) => item.id === Number(id));
  if (["edit", "members", "stats"].includes(name))
    return Boolean(
      project &&
        can(
          name === "edit" ? "project-list" : name,
          name === "edit" ? "write" : "view",
          project.unit,
        ),
    );
  return true;
}
function applyAccessUI() {
  const app = $("#app");
  app
    .querySelectorAll('a[href="#projects"], [data-action="nav-group"]')
    .forEach((node) => {
      node.hidden = !can("project-list");
    });
  app
    .querySelectorAll('[data-action="new"]')
    .forEach((node) => (node.hidden = !can("project-list", "write")));
  app.querySelectorAll("[data-action]").forEach((node) => {
    const match = /^(edit|qr|copy|members|stats)-(\d+)$/.exec(
      node.dataset.action,
    );
    if (match) {
      const project = projects.find((item) => item.id === Number(match[2]));
      node.hidden =
        !project ||
        !can(
          ["members", "stats"].includes(match[1]) ? match[1] : "project-list",
          match[1] === "edit" || match[1] === "qr" ? "write" : "view",
          project.unit,
        );
    }
    if (["export", "export-log"].includes(node.dataset.action))
      node.hidden = !can(
        route().split("/")[0],
        node.dataset.action,
        current?.unit,
      );
  });
}

// ── 共用版面、單位選擇與分頁 ──────────────────────────────────
function unitSelectionPage() {
  $("#app").innerHTML =
    `<main class="entry-screen unit-screen"><section class="unit-card" aria-labelledby="unit-heading"><h1 id="unit-heading">請選擇單位</h1><div class="unit-options">${
      selectableUnits()
        .map((unit) =>
          button(
            esc(unit.name),
            "select-unit",
            "primary unit-button",
            `data-unit-id="${esc(unit.id)}"`,
          ),
        )
        .join("") ||
      '<p class="unit-empty" role="status">目前沒有可選擇的單位，請聯絡管理員啟用單位。</p>'
    }</div></section></main>`;
}
function shell(content, title) {
  $("#app").innerHTML =
    `<aside class="${collapsed ? "collapsed" : ""}"><div class="platform-name"><span>O2O 會員活動應用平台</span><span>Demo</span></div><a href="#home" class="nav ${route() === "home" ? "active" : ""}">${icon("briefcase-business")}<span>首頁</span></a><button class="nav" data-action="nav-group">${icon("notebook-text")}<span>會員專案列表</span>${icon("chevron-down")}</button><a class="subnav ${route() !== "home" && !route().startsWith("system/") ? "active" : ""}" href="#projects">專案列表</a>${systemNavigation()}</aside><div class="workspace ${collapsed ? "wide" : ""}"><header>${button(icon("panel-left-close"), "sidebar", "plain")}<nav><a href="#home">首頁</a>${title === "首頁" ? "" : `<b>/</b><a href="${route().startsWith("system/") ? "#system/users" : "#projects"}">${route().startsWith("system/") ? "系統管理" : "會員專案列表"}</a><b>/</b><span>${esc(title)}</span>`}</nav><div class="header-right">${button(icon("maximize"), "fullscreen", "plain")}<details class="account-menu"><summary class="avatar" aria-label="帳號選單">C</summary><div class="account-dropdown">${button("切換專案", "switch-unit", "plain")}${button("登出", "logout", "plain")}</div></details></div></header><main>${content}</main></div>`;
  createIcons({ icons });
  applyAccessUI();
}
let paginationTotal = 0;
function paginate(items) {
  page = Math.max(1, Math.min(page, Math.ceil(items.length / limit) || 1));
  return items.slice((page - 1) * limit, page * limit);
}
function pager(total) {
  paginationTotal = total;
  const pages = Math.max(1, Math.ceil(total / limit));
  const visiblePages = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => pages <= 7 || n === 1 || n === pages || Math.abs(n - page) <= 1,
  );
  let previous = 0;
  const numbers = visiblePages
    .map((n) => {
      const gap =
        previous && n - previous > 1
          ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>'
          : "";
      previous = n;
      return (
        gap +
        button(
          n,
          `page-${n}`,
          page === n ? "plain selected" : "plain",
          `${page === n ? 'aria-current="page"' : ""} aria-label="第 ${n} 頁"`,
        )
      );
    })
    .join("");
  return `<div class="pagination" role="navigation" aria-label="列表分頁"><span>共 ${total} 項</span><select id="page-size" aria-label="每頁筆數">${[10, 20, 50].map((n) => `<option ${limit === n ? "selected" : ""} value="${n}">${n}項/頁</option>`).join("")}</select><span class="pagination-pages">${button("‹", "prev", "plain", `aria-label="上一頁" ${page === 1 ? "disabled" : ""}`)}${numbers}${button("›", "next", "plain", `aria-label="下一頁" ${page === pages ? "disabled" : ""}`)}</span><span>前往 <input id="jump" type="number" min="1" max="${pages}" value="${page}" aria-label="跳至頁碼"> 頁</span></div>`;
}
const actionCircle = (name, action, color, label) =>
  `<button class="circle ${color}" data-action="${action}" title="${label}" aria-label="${label}">${icon(name)}</button>`;
const filteredProjects = () =>
  projects.filter(
    (p) =>
      (p.name + p.unit).toLowerCase().includes(query.toLowerCase()) &&
      can("project-list", "view", p.unit) &&
      (projectUnit === "all" || p.unit === projectUnit),
  );

// ── 專案列表與編輯表單 ────────────────────────────────────────
function projectList() {
  projectUnit = scopedUnitFilter(projectUnit);
  const filtered = filteredProjects();
  const rows = paginate(filtered);
  const units = [
    ...new Set([...availableUnits(), ...projects.map((p) => p.unit)]),
  ].filter((unit) => unit && scopeAllows(unit));
  shell(
    `<section class="panel"><div class="toolbar">${button("新增", "new", "primary")}<div class="spacer"></div><select id="project-unit" aria-label="篩選單位">${isSystemAdmin() ? `<option value="all" ${projectUnit === "all" ? "selected" : ""}>全部單位</option>` : ""}${units.map((unit) => `<option value="${esc(unit)}" ${projectUnit === unit ? "selected" : ""}>${esc(unit)}</option>`).join("")}</select><input id="search" placeholder="請輸入專案名稱或單位名稱進行搜尋" value="${esc(query)}" aria-label="搜尋專案">${actionCircle("rotate-cw", "reset-search", "search-icon", "重設搜尋")}</div>${pager(filtered.length)}<div class="table-scroll"><table class="projects"><thead><tr>${["編號", "專案名稱", "隸屬單位", "起迄時間", "建立時間", "更新時間", "QRCode", "複製<br>網址", "編輯", "會員使<br>用記錄", "登入與註<br>冊統計"].map((x, i) => `<th>${i === 0 ? `<button class="sort" data-action="sort">${x} ${icon("chevrons-up-down")}</button>` : x}</th>`).join("")}</tr></thead><tbody>${rows.map((p) => `<tr><td>${p.id}</td><td>${esc(p.name)}</td><td>${p.unit}</td><td>${p.permanent ? "永久有效" : `${esc(p.start)}<br>${esc(p.end)}`}</td><td>${p.created}<br>16:03:09</td><td>${p.updated}<br>18:12:18</td><td>${actionCircle("download", `qr-${p.id}`, "gray", "QRCode")}</td><td>${actionCircle("check", `copy-${p.id}`, "green", "複製網址")}</td><td>${actionCircle("pencil-line", `edit-${p.id}`, "orange", "編輯專案")}</td><td>${actionCircle("search", `members-${p.id}`, "outline", "會員使用記錄")}</td><td>${actionCircle("presentation", `stats-${p.id}`, "outline", "登入與註冊統計")}</td></tr>`).join("") || '<tr><td colspan="11" class="empty">找不到符合的專案，請調整搜尋條件。</td></tr>'}</tbody></table></div></section>`,
    "專案列表",
  );
}
const field = (label, control, required = false) =>
  `<div class="field"><label>${required ? "<em>*</em> " : ""}${label}</label><div class="control">${control}</div></div>`;
const input = (name, value = "", extra = "") =>
  `<input name="${name}" aria-label="${name}" value="${esc(value)}" ${extra}>`;
const radios = (name, opts, value) =>
  opts
    .map(
      ([v, l]) =>
        `<label class="choice"><input type="radio" name="${name}" value="${v}" ${String(value) === v ? "checked" : ""}> ${l}</label>`,
    )
    .join("");
const check = (name, label, checked) =>
  `<label class="choice"><input type="checkbox" name="${name}" ${checked ? "checked" : ""}> ${label}</label>`;
const section = (title, content) =>
  `<section class="form-section"><h3>${title}</h3>${content}</section>`;
function upload(name, cls = "", image = "") {
  return `<label class="upload ${cls}">${image ? `<img src="${esc(image)}" alt="已上傳圖片">` : icon("plus")}<input type="file" name="${name}" accept="image/*" aria-label="${name}"></label>`;
}
function editor(isNew = false, modal = false) {
  const p = isNew
    ? {
        enabled: false,
        email: true,
        phone: true,
        start: "2026-10-19",
        end: "2026-10-19",
        button: "前往活動",
      }
    : current;
  const renderEditor = modal
    ? (content, title) => openSystemModal(content, title, true)
    : shell;
  renderEditor(
    `${button("返回", "back")}<section class="editor-panel"><div class="tabs">${button("基本設定", "tab-basic", tab === "basic" ? "active" : "")}${!isNew ? button("QRCODE & URL", "tab-qr", tab === "qr" ? "active" : "") : ""}</div>${
      tab === "qr" && !isNew
        ? `<div class="qr-page"><h2>專案 QRCODE</h2><canvas id="qr"></canvas><div>${button("下載", "download-qr")}</div><h2>專案 URL</h2><p class="project-url">${esc(projectURL(p))}</p>${button("複製", "copy-current")}</div>`
        : `<form id="project-form">${section(
            "專案內容設定",
            `${!isNew ? field("專案編號", p.id) : ""}${field("所屬單位", esc(isNew ? enteredUnit() : p.unit))}${field(
              "專案啟用",
              radios(
                "enabled",
                [
                  ["true", "啟用"],
                  ["false", "停用"],
                ],
                p.enabled,
              ),
            )}${field("BUID", input("buid", p.buid, 'required class="short"'), true)}${field("專案名稱(後台識別)", input("name", p.name, 'required maxlength="120"'), true)}${field("專案名稱(網頁顯示)", input("displayName", p.displayName))}${field("主辦單位相關訊息　最多 1000 字", `<div class="rich-editor"><div class="rich-toolbar">${["bold", "italic", "underline", "strikethrough", "align-left", "align-center", "align-right", "list", "link"].map((n) => button(icon(n), `rich-${n}`, "plain")).join("")}</div><div contenteditable="true" role="textbox" aria-label="主辦單位相關訊息" id="rich-text">${p.description || ""}</div><small>POWERED BY DEMO</small></div>`)}${field(
              "與活動報名平台連結",
              `${radios(
                "linkEnabled",
                [
                  ["false", "否"],
                  ["true", "是"],
                ],
                !!p.link,
              )}${input("link", p.link, 'placeholder="填寫報名表頁" class="inline-url"')}`,
              true,
            )}${field("起迄時間", `<div class="inline">${input("start", p.start, 'type="date"')} ～ ${input("end", p.end, 'type="date"')}${check("permanent", "永久有效", p.permanent)}</div>`)}${field("QRCODE報到(掃描)次數限制", `${input("scanLimit", p.scanLimit || 0, 'type="number" min="0" class="tiny"')}${check("unlimited", "不限次數", p.unlimited)}`)}${field(
              "預設頁面",
              radios(
                "defaultPage",
                [
                  ["login", "登入"],
                  ["register", "註冊"],
                ],
                p.defaultPage || "login",
              ),
            )}${field("註冊/登入方式", check("email", "Email", p.email) + check("phone", "手機", p.phone), true)}${field("導覽列 LOGO", upload("navLogo", "logo", p.navLogo) + "<small>圖片高度為 30，圖檔需小於 100 kb，預設顯示聯合報 Logo</small>")}${field("活動主圖", upload("banner", "banner", p.banner) + "<small>W1280 x H448 或等比例，圖檔需小於 500 kb</small>")}${field("主辦單位LOGO", upload("organizerLogo", "organizer", p.organizerLogo) + "<small>520*120 (圖檔需小於 100 kb)</small>")}`,
          )}${section("啟用服務與電子報設定", field("啟用服務", `<select name="service"><option value="">請選擇</option><option ${!isNew ? "selected" : ""}>行動發展部 / 行動發展部</option></select>`) + field("啟用電子報", `<select name="newsletter"><option value="">請選擇</option><option ${!isNew ? "selected" : ""}>行動發展部 / 聯合報系行動服務專刊</option></select>`))}${section(
            "結果頁內容設定",
            field(
              "顯示註冊時間",
              radios(
                "showTime",
                [
                  ["true", "是"],
                  ["false", "否"],
                ],
                p.showTime ?? true,
              ),
            ) +
              field(
                "報到序號顯示",
                radios(
                  "showSerial",
                  [
                    ["true", "顯示"],
                    ["false", "隱藏"],
                  ],
                  p.showSerial ?? false,
                ),
              ) +
              field("按鈕顯示文字", input("button", p.button)) +
              field("活動報名網址", input("resultURL", p.resultURL)) +
              field(
                "結果頁訊息",
                `<textarea name="message" maxlength="50" placeholder="50 字內">${esc(p.message)}</textarea>`,
              ),
          )}${section("問卷內容設定", field("問卷設定", '<select name="surveyMode" class="short"><option>只填寫一次問卷</option><option>每次登入填寫</option></select>') + field("CAS欄位", `<div class="cas-fields">${["姓名", "手機", "E-MAIL", "地址", "性別", "生日"].map((n, i) => `<div>${check(`cas${i}`, n, i < 3 && !isNew)}<label class="switch"><input type="checkbox" name="required${i}" aria-label="${n}設為必填"><span></span></label></div>`).join("")}</div>`) + field("自訂問卷項目", `<div class="survey-builder"><div id="survey-fields">${(p.questions || []).map((q) => `<div class="question"><input aria-label="問卷題目" value="${esc(q)}"><button type="button" data-action="remove-question" aria-label="移除題目">×</button></div>`).join("")}<span class="drop-hint">Drag a field from the right to this area</span></div><div class="survey-tools">${["核取方塊群組", "日期欄位", "數字", "單選群組", "選擇", "輸入欄", "文字區塊"].map((n) => button(n, `question-${n}`)).join("")}</div></div>`))}${section("追蹤碼設定", field("輸入追蹤碼 ID", `<div class="inline"><select id="tracker-type" class="short"><option>Google Analytics</option><option>Meta Pixel</option></select><input id="tracker-id" aria-label="追蹤碼 ID">${button("新增", "tracker-add", "success")}</div><table class="tracker-table"><thead><tr><th>追蹤碼名稱</th><th>ID</th><th></th></tr></thead><tbody id="trackers">${(p.trackers || []).map((t) => `<tr><td>${esc(t.type)}</td><td>${esc(t.id)}</td><td>${button("移除", "tracker-remove")}</td></tr>`).join("") || '<tr class="no-tracker"><td colspan="3">未設定追蹤碼</td></tr>'}</tbody></table>`))}${section("備註", field("備註", `<textarea name="notes" maxlength="1000" rows="8">${esc(p.notes)}</textarea>`))}<div class="submit-row"><button class="primary" type="submit">確定送出</button></div></form>`
    }</section>`,
    isNew ? "新增專案" : "編輯專案",
  );
  if (tab === "qr" && !isNew) drawQR();
  $("#project-form")?.addEventListener("submit", (e) =>
    submitProject(e, isNew),
  );
  document.querySelectorAll(".upload input").forEach((el) =>
    el.addEventListener("change", () => {
      const file = el.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast("請選擇小於 2 MB 的圖片", "warning");
        el.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        el.parentElement.querySelector("img")?.remove();
        el.parentElement.querySelector("svg")?.remove();
        el.parentElement.insertAdjacentHTML(
          "afterbegin",
          `<img src="${reader.result}" alt="已上傳圖片">`,
        );
      };
      reader.readAsDataURL(file);
    }),
  );
}
function submitProject(e, isNew) {
  e.preventDefault();
  const form = e.target;
  if (
    !checkSession() ||
    !can("project-list", "write", isNew ? enteredUnit() : current?.unit)
  )
    return deny();
  const fd = new FormData(form);
  const p = {
    ...(!isNew ? current : {}),
    id: isNew ? Math.max(106, ...projects.map((x) => x.id)) + 1 : current.id,
    unit: isNew ? enteredUnit() : current.unit,
    created: isNew ? "2026/10/19" : current.created,
    updated: "2026/10/19",
  };
  for (const [k, v] of fd) if (typeof v === "string") p[k] = v;
  p.unit = isNew ? enteredUnit() : current.unit;
  p.id = isNew ? Math.max(106, ...projects.map((x) => x.id)) + 1 : current.id;
  form
    .querySelectorAll('input[type="checkbox"]')
    .forEach((x) => (p[x.name] = x.checked));
  p.enabled = fd.get("enabled") === "true";
  p.description = $("#rich-text").innerHTML;
  p.questions = [...document.querySelectorAll(".question input")].map(
    (x) => x.value,
  );
  p.trackers = [
    ...document.querySelectorAll("#trackers tr:not(.no-tracker)"),
  ].map((tr) => ({
    type: tr.cells[0].textContent,
    id: tr.cells[1].textContent,
  }));
  document.querySelectorAll(".upload").forEach((x) => {
    if (x.querySelector("img"))
      p[x.querySelector("input").name] = x.querySelector("img").src;
  });
  const next = isNew
    ? [p, ...projects]
    : projects.map((x) => (x.id === p.id ? p : x));
  try {
    localStorage.setItem("o2o-projects", JSON.stringify(next));
    projects = next;
    current = p;
    if (route() === "system/projects") {
      closeSystemModal();
      systemPage();
    } else go("projects");
    toast("專案已儲存", "success");
  } catch {
    toast("瀏覽器儲存空間不足，請縮小上傳圖片後重試", "error");
  }
}

// ── QRCode、會員紀錄與統計示範 ─────────────────────────────────
function projectURL(p) {
  return `${location.origin}${location.pathname}#/member/${p.id}`;
}
async function drawQR() {
  await QRCode.toCanvas($("#qr"), projectURL(current), {
    width: 270,
    margin: 0,
    errorCorrectionLevel: "M",
  });
}
let reportFilters = { from: "2026-04-19", to: "2026-10-19", query: "" };
const dateRange = () =>
  `<div class="date-range"><input type="date" id="from" aria-label="開始日期" value="${esc(reportFilters.from)}"><span>～</span><input type="date" id="to" aria-label="結束日期" value="${esc(reportFilters.to)}"></div>`;
function reportTop(type) {
  return `<div class="report-heading"><span class="project-badge">${esc(current.name)}</span>${button("返回", "back")}</div><div class="toolbar"><label>${type === "members" ? "使用期間：" : "登入 / 註冊期間："}</label>${dateRange()}${type === "members" ? '<label>會員查詢：</label><input id="member-search" placeholder="以會員名稱、Email或手機號碼搜尋">' : ""}<div class="spacer"></div>${button("查詢", "report-query", "primary")}${button("匯出", "export")}</div>`;
}
let visibleMembers = members;
function memberRows() {
  return (
    paginate(visibleMembers)
      .map(
        (m) =>
          `<tr><td><button class="plain expand" data-action="expand-${m.id}" aria-label="展開 ${m.name}" aria-expanded="false">${icon("chevron-right")}</button></td><td>${m.id}</td><td>${m.account}</td><td>${m.name}</td><td>${m.email}</td><td>${m.phone}</td><td>${m.registered}</td><td>${m.login}</td><td>0</td><td></td></tr><tr class="member-detail" id="detail-${m.id}" hidden><td colspan="10"><div class="detail-grid">${[
            ["報到序號", m.id],
            ["會員帳號", m.account],
            ["會員姓名", m.name],
            ["會員Email", m.email],
            ["會員手機", m.phone],
            ["註冊時間", m.registered],
            ["最後登陸時間", m.login],
            ["掃描QRCODE", 0],
            ["最後掃描時間", ""],
            ["地址", ""],
            ["性別", m.gender],
            ["生日", ""],
          ]
            .map(([k, v]) => `<div><strong>${k}：</strong>${v}</div>`)
            .join(
              "",
            )}</div><div class="divider">客製化表單</div><p><strong>您最希望 AI 優先應用於下列哪個生醫領域？：</strong>精準醫療與個人化治療</p></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="10" class="empty">沒有符合條件的會員記錄</td></tr>'
  );
}
function memberPage() {
  paginate(visibleMembers);
  shell(
    `<section class="panel">${reportTop("members")}<div class="report-pagination">${pager(visibleMembers.length)}${button("匯出紀錄", "export-log")}</div><div class="table-scroll"><table><thead><tr>${["", "報到序號", "會員帳號", "會員姓名", "會員Email", "會員手機", "註冊時間", "最後登陸時間", "掃描QRCODE", "最後掃描時間"].map((n) => `<th>${n}</th>`).join("")}</tr></thead><tbody id="member-rows">${memberRows()}</tbody></table></div></section>`,
    "會員使用紀錄",
  );
  $("#member-search").value = reportFilters.query;
}
function statsPage() {
  const dates = Array.from(
    { length: 14 },
    (_, i) => `2026/09/${String(14 - i).padStart(2, "0")}`,
  );
  const rows = paginate(dates);
  shell(
    `<section class="panel">${reportTop("stats")}<div class="stats-cards">${[
      [
        "活動統計",
        ["活動人數", "完成活動", "活動完成率"],
        ["0", "1", "100.00%"],
      ],
      [
        "手機統計",
        ["登入", "註冊", "驗證", "註冊完成率"],
        ["0", "0", "0", "0.00%"],
      ],
      [
        "Email 統計",
        ["登入", "註冊", "驗證", "註冊完成率"],
        ["0", "0", "0", "0.00%"],
      ],
    ]
      .map(
        ([t, labels, vals]) =>
          `<section><h3>${t}</h3><div>${labels.map((l, i) => `<p>${l}<span>${vals[i]}</span></p>`).join("")}</div></section>`,
      )
      .join(
        "",
      )}</div><div class="report-pagination">${pager(14)}${button("匯出紀錄", "export-log")}</div><div class="table-scroll"><table class="stats-table"><thead><tr><th rowspan="2">日期</th><th>全部</th><th colspan="5">手機</th><th colspan="5">Email</th></tr><tr>${["完成活動", ...Array(2).fill(["登入", "註冊", "驗證 ⓘ", "當日註冊完成率 ⓘ", "當日驗證 ⓘ"]).flat()].map((n) => `<th>${n}</th>`).join("")}</tr></thead><tbody>${rows
      .map(
        (d) =>
          `<tr><td>${d}</td>${Array.from({ length: 11 }, (_, i) => `<td>${[4, 9].includes(i) ? "0.00%" : "0"}</td>`).join("")}</tr>`,
      )
      .join("")}</tbody></table></div></section>`,
    "登入與註冊統計",
  );
}

// ── 路由分派 ──────────────────────────────────────────────────
function render() {
  let r = route();
  const parts = r.split("/");
  if (demoSession.authenticated && !checkSession()) return;
  if (r === "login") {
    if (demoSession.authenticated) {
      go("select-unit");
      return;
    }
    loginPage();
    return;
  }
  const publicActivity = parts[1] === "member";
  if (!publicActivity && !demoSession.authenticated) {
    go("login");
    return;
  }
  if (!publicActivity) {
    const selectedUnit = selectableUnits().find(
      (unit) => String(unit.id) === String(demoSession.unitId),
    );
    if (r === "select-unit") {
      unitSelectionPage();
      return;
    }
    if (!selectedUnit) {
      go("select-unit");
      return;
    }
  }
  if (!publicActivity && !routeAccess()) {
    clearSensitiveState();
    shell(
      '<section class="panel"><h1>無法存取</h1><p>您沒有此頁面的權限，請從選單選擇其他功能或切換專案。</p></section>',
      "無法存取",
    );
    return;
  }
  if (["edit", "members", "stats"].includes(parts[0])) {
    current = projects.find((x) => x.id === Number(parts[1]));
    if (!current || !scopeAllows(current.unit)) {
      go("projects");
      return;
    }
  }
  if (r.startsWith("system/")) {
    systemPage();
    return;
  }
  if (r === "home") {
    shell(
      '<section class="dashboard-home"><h1>O2O 會員活動應用平台</h1><p>後台管理系統</p></section>',
      "首頁",
    );
  } else if (r === "projects") projectList();
  else if (r === "new") editor(true);
  else if (parts[0] === "edit") editor();
  else if (parts[0] === "members") memberPage();
  else if (parts[0] === "stats") statsPage();
  else if (parts[1] === "member") {
    shell(
      `<div class="home"><h1>O2O 活動示範</h1><p>${esc(projects.find((p) => p.id === Number(parts[2]))?.name || "找不到專案")}</p><p>此網址為 QRCode 示範目的頁。</p><a href="#projects">返回專案列表</a></div>`,
      "活動示範",
    );
  } else go("home");
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("網址已複製", "success");
  } catch {
    toast("複製失敗，請手動複製專案網址", "error");
  }
}
function download(content, name, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── 全域事件委派 ──────────────────────────────────────────────
// 頁面重繪後仍由 document 接收 data-action，不需逐一重新綁定按鈕。
let exportHistory = [];
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]");
  if (!b) return;
  const a = b.dataset.action;
  if (
    !["demo-login", "logout"].includes(a) &&
    (!checkSession() ||
      (a !== "select-unit" && a !== "switch-unit" && !routeAccess()))
  )
    return;
  const projectAction = /^(edit|qr|copy|members|stats)-(\d+)$/.exec(a);
  if (projectAction) {
    const project = projects.find(
      (item) => item.id === Number(projectAction[2]),
    );
    const feature = ["members", "stats"].includes(projectAction[1])
      ? projectAction[1]
      : "project-list";
    if (
      !project ||
      !can(
        feature,
        ["edit", "qr"].includes(projectAction[1]) ? "write" : "view",
        project.unit,
      )
    )
      return deny();
  }
  if (a === "new" && !can("project-list", "write")) return deny();
  const editorAction =
    /^(tab-|question-|rich-|tracker-)/.test(a) ||
    ["remove-question", "copy-current", "download-qr"].includes(a);
  if (
    editorAction &&
    (!/^(new|edit\/\d+)$/.test(route()) ||
      !can(
        "project-list",
        "write",
        route() === "new" ? enteredUnit() : current?.unit,
      ))
  )
    return deny();
  if (
    (a === "report-query" || a.startsWith("expand-")) &&
    (!/^(members|stats)\/\d+$/.test(route()) ||
      !can(route().split("/")[0], "view", current?.unit))
  )
    return deny();
  if (
    ["export", "export-log"].includes(a) &&
    !can(route().split("/")[0], a, current?.unit)
  )
    return deny();
  if (a.startsWith("sys-")) {
    e.preventDefault();
    systemAction(a, b);
    return;
  }
  const r = route();
  if (a === "demo-login") {
    const email = normalized(
      sessionStorage.getItem("o2o-demo-login-email") ??
        systemData.users.find((user) => user.id === 1)?.email,
    );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast("請輸入有效的 Email。", "error");
    const matches = systemData.users.filter(
      (user) => normalized(user.email) === email,
    );
    if (matches.length !== 1) {
      toast(
        matches.length
          ? "此 Email 有重複的使用者資料，請聯絡管理員。"
          : "此 Google 帳號尚未建立使用者，請聯絡管理員。",
        "error",
      );
      return;
    }
    demoSession = { authenticated: true, userId: matches[0].id };
    if (!checkSession()) return;
    saveDemoSession();
    projectUnit = "all";
    query = "";
    page = 1;
    go("select-unit");
  } else if (a === "logout") {
    endSession();
  } else if (a === "switch-unit") {
    if (!checkSession()) return;
    clearSensitiveState();
    demoSession.unitId = null;
    saveDemoSession();
    go("select-unit");
  } else if (a === "select-unit") {
    if (!demoSession.authenticated) return;
    const unit = selectableUnits().find(
      (unit) => String(unit.id) === b.dataset.unitId,
    );
    if (!unit) return;
    demoSession.unitId = unit.id;
    projectUnit = unit.name;
    systemUnit = unit.name;
    saveDemoSession();
    go("home");
  } else if (a === "sidebar") {
    collapsed = !collapsed;
    render();
  } else if (a === "nav-group") {
    const sub = $(".subnav");
    sub.hidden = !sub.hidden;
    b.setAttribute("aria-expanded", !sub.hidden);
  } else if (a === "fullscreen") {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  } else if (a === "new") {
    tab = "basic";
    go("new");
  } else if (a === "back") go("projects");
  else if (a === "reset-search") {
    query = "";
    projectUnit = enteredUnit();
    page = 1;
    projectList();
  } else if (a === "sort") {
    projects.reverse();
    projectList();
  } else if (a.startsWith("page-") || a === "prev" || a === "next") {
    const total = paginationTotal;
    page = Math.max(
      1,
      Math.min(
        Math.ceil(total / limit) || 1,
        a === "prev" ? page - 1 : a === "next" ? page + 1 : Number(a.slice(5)),
      ),
    );
    render();
  } else if (a.startsWith("tab-")) {
    tab = a.slice(4);
    editor(r === "new");
  } else if (/^(edit|qr|members|stats|copy)-\d+$/.test(a)) {
    const [act, id] = a.split("-");
    current = projects.find((p) => p.id === Number(id));
    page = 1;
    if (act === "copy") copy(projectURL(current));
    else if (act === "qr") {
      tab = "qr";
      go(`edit/${id}`);
    } else {
      tab = "basic";
      if (act === "members") {
        limit = 10;
        visibleMembers = members;
      }
      if (act === "stats") limit = 10;
      go(`${act}/${id}`);
    }
  } else if (a === "copy-current") copy(projectURL(current));
  else if (a === "download-qr") {
    const link = document.createElement("a");
    link.href = $("#qr").toDataURL();
    link.download = `project-${current.id}-qrcode.png`;
    link.click();
  } else if (a.startsWith("expand-")) {
    const row = $(`#detail-${a.slice(7)}`);
    row.hidden = !row.hidden;
    b.setAttribute("aria-expanded", !row.hidden);
    b.innerHTML = icon(row.hidden ? "chevron-right" : "chevron-down");
    createIcons({ icons });
  } else if (a === "report-query") {
    if ($("#from").value > $("#to").value) {
      toast("開始日期不可晚於結束日期", "warning");
      return;
    }
    reportFilters = {
      from: $("#from").value,
      to: $("#to").value,
      query: $("#member-search")?.value || "",
    };
    page = 1;
    if (r.startsWith("members")) {
      const q = $("#member-search").value.toLowerCase();
      visibleMembers = members.filter(
        (m) =>
          (m.name + m.email + m.phone).toLowerCase().includes(q) &&
          m.registered.slice(0, 10) >= $("#from").value &&
          m.registered.slice(0, 10) <= $("#to").value,
      );
      memberPage();
    } else {
      statsPage();
      toast("已更新統計查詢（示範資料）", "success");
    }
  } else if (a === "export") {
    const rows = r.startsWith("members")
      ? [
          ["報到序號", "會員帳號", "會員姓名", "Email", "手機", "註冊時間"],
          ...visibleMembers.map((m) => [
            m.id,
            m.account,
            m.name,
            m.email,
            m.phone,
            m.registered,
          ]),
        ]
      : [
          ["日期", "完成活動", "手機登入", "Email登入"],
          ...Array.from({ length: 14 }, (_, i) => [
            `2026/09/${14 - i}`,
            0,
            0,
            0,
          ]),
        ];
    download(
      "\uFEFF" +
        rows
          .map((row) =>
            row
              .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
              .join(","),
          )
          .join("\r\n"),
      "O2O-demo-export.csv",
      "text/csv;charset=utf-8",
    );
    exportHistory.unshift({
      projectId: current.id,
      feature: r.split("/")[0],
      userId: demoSession.userId,
      time: new Date().toLocaleString("zh-TW"),
    });
    toast("CSV 已匯出", "success");
  } else if (a === "export-log") {
    toast(
      exportHistory.some(
        (item) =>
          item.projectId === current.id &&
          item.feature === r.split("/")[0] &&
          item.userId === demoSession.userId,
      )
        ? `最近匯出：${exportHistory.find((item) => item.projectId === current.id && item.feature === r.split("/")[0] && item.userId === demoSession.userId).time}`
        : "尚無匯出紀錄",
    );
  } else if (a.startsWith("question-")) {
    $("#survey-fields").insertAdjacentHTML(
      "beforeend",
      `<div class="question"><input aria-label="問卷題目" placeholder="${esc(a.slice(9))}：請輸入題目"><button type="button" data-action="remove-question" aria-label="移除題目">×</button></div>`,
    );
  } else if (a === "remove-question") b.closest(".question").remove();
  else if (a === "tracker-add") {
    const id = $("#tracker-id").value.trim();
    if (!id) {
      toast("請輸入追蹤碼 ID", "warning");
      return;
    }
    $(".no-tracker")?.remove();
    $("#trackers").insertAdjacentHTML(
      "beforeend",
      `<tr><td>${esc($("#tracker-type").value)}</td><td>${esc(id)}</td><td>${button("移除", "tracker-remove")}</td></tr>`,
    );
    $("#tracker-id").value = "";
  } else if (a === "tracker-remove") b.closest("tr").remove();
  else if (a.startsWith("rich-")) {
    const cmd =
      {
        "align-left": "justifyLeft",
        "align-center": "justifyCenter",
        "align-right": "justifyRight",
        list: "insertUnorderedList",
        link: "createLink",
      }[a.slice(5)] || a.slice(5);
    if (cmd === "createLink") {
      const url = prompt("請輸入 https:// 網址");
      if (url && /^https?:\/\//.test(url))
        document.execCommand(cmd, false, url);
    } else document.execCommand(cmd);
    $("#rich-text")?.focus();
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    const pos = e.target.selectionStart;
    query = e.target.value;
    page = 1;
    projectList();
    $("#search").focus();
    $("#search").setSelectionRange(pos, pos);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.matches('[name="assignment-unit"]')) {
    const form = e.target.closest("form");
    const rows = [...form.querySelectorAll('[name="assignment-unit"]')];
    if (
      (e.target.value === ALL_UNITS && rows.length > 1) ||
      rows.some((select) => select !== e.target && select.value === ALL_UNITS)
    ) {
      e.target.value = e.target.dataset.previousValue || "";
      $("#error-assignments").textContent =
        "全部單位不可與其他指派並存，請先移除其他指派。";
      toast("請先移除其他指派，再選擇全部單位。", "warning");
      return;
    }
    e.target.dataset.previousValue = e.target.value;
    const row = e.target.closest(".assignment-row");
    const roleSelect = row.querySelector('[name="assignment-role"]');
    roleSelect.innerHTML = assignmentRoleOptions(e.target.value, null);
    roleSelect.disabled = !e.target.value;
    roleSelect.setAttribute("aria-invalid", "false");
    e.target.setAttribute("aria-invalid", "false");
    row.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
    const add = form.querySelector('[data-action="sys-assignment-add"]');
    if (add) add.disabled = rows.some((select) => select.value === ALL_UNITS);
    $("#error-assignments").textContent = "";
  }
  if (e.target.id === "project-unit") {
    projectUnit = e.target.value;
    page = 1;
    projectList();
  }
  if (e.target.id === "page-size") {
    limit = Number(e.target.value);
    page = 1;
    render();
  }
  if (e.target.id === "jump") {
    page = Math.max(
      1,
      Math.min(Number(e.target.max), Math.trunc(Number(e.target.value)) || 1),
    );
    render();
  }
});
window.addEventListener("hashchange", () => {
  if ($("#system-modal")) closeSystemModal();
  page = 1;
  systemQuery = "";
  systemUnit = enteredUnit();
  projectUnit = enteredUnit();
  systemStatus = "all";
  systemEdit = null;
  if (/^(members|stats)/.test(route())) {
    limit = 10;
    visibleMembers = members;
    reportFilters = { from: "2026-04-19", to: "2026-10-19", query: "" };
  }
  render();
  window.scrollTo(0, 0);
});

// ── 系統管理資料與舊資料遷移 ──────────────────────────────────
const systemDefaults = {
  users: [
    {
      id: 1,
      name: "系統管理員",
      account: "admin",
      email: "admin@example.com",
      role: 1,
      enabled: true,
    },
    {
      id: 2,
      name: "專案編輯",
      account: "editor",
      email: "editor@example.com",
      role: 2,
      enabled: true,
    },
  ],
  roles: [
    {
      id: 1,
      name: "系統管理員",
      permissions: ["home", "project-list", "users", "roles", "projects"],
    },
    { id: 2, name: "專案編輯", permissions: ["projects"] },
  ],
};
const systemSections = [
  { id: "users", name: "使用者管理" },
  { id: "roles", name: "角色管理" },
  { id: "projects", name: "單位管理" },
];
let systemData;
let removedMenuSettings = false;
try {
  const stored = JSON.parse(localStorage.getItem("o2o-system"));
  systemData =
    stored && ["users", "roles"].every((k) => Array.isArray(stored[k]))
      ? stored
      : structuredClone(systemDefaults);
} catch {
  systemData = structuredClone(systemDefaults);
}
if ("menus" in systemData) {
  delete systemData.menus;
  removedMenuSettings = true;
}
for (const key of ["users", "roles"]) {
  for (const item of systemData[key]) {
    if (/^\?+$/.test(item.name))
      item.name =
        systemDefaults[key].find((x) => x.id === item.id)?.name || "未命名";
  }
}
const permissionFeatures = [
  { id: "project-list", name: "專案列表", actions: ["write"] },
  { id: "members", name: "會員使用記錄", actions: ["export", "export-log"] },
  { id: "stats", name: "登入與註冊統計", actions: ["export", "export-log"] },
  { id: "users", name: "使用者管理", actions: ["write"] },
  { id: "roles", name: "角色管理", actions: ["write"] },
  { id: "projects", name: "單位管理", actions: ["write"] },
];
const permissionActionLabels = {
  view: "檢視",
  write: "新增／編輯",
  export: "匯出",
  "export-log": "檢視匯出紀錄",
};
const allPermissionIds = () => permissionFeatures.map((feature) => feature.id);
const allOperationIds = () =>
  permissionFeatures.flatMap((feature) =>
    feature.actions.map((action) => `${feature.id}:${action}`),
  );
// 權限分為功能檢視與個別操作；矩陣互動保持操作勾選時同時具有檢視權。
function rolePermissionTable(role) {
  const views = role.id === 1 ? allPermissionIds() : role.permissions || [];
  const operations =
    role.id === 1 ? allOperationIds() : role.operationPermissions || [];
  return `<div class="permission-editor"><p class="permission-help" id="permission-help">各單位建立的角色彼此獨立。勾選「操作」時，會自動勾選「檢視」。</p><table class="permission-table" aria-labelledby="role-permissions-label" aria-describedby="permission-help"><thead><tr><th scope="col">功能</th><th scope="col">操作權限</th></tr></thead><tbody>${permissionFeatures.map((feature) => `<tr data-permission-row><th scope="row">${esc(feature.name)}</th><td><div class="permission-options"><label class="permission-choice permission-all"><input type="checkbox" data-permission-all aria-label="${esc(feature.name)}全選" ${role.id === 1 ? "disabled" : ""}>全選</label>${["view", ...feature.actions].map((action) => `<label class="permission-choice"><input type="checkbox" name="${action === "view" ? "permissions" : "operationPermissions"}" value="${action === "view" ? feature.id : `${feature.id}:${action}`}" data-permission-action="${action}" aria-label="${esc(feature.name)}${permissionActionLabels[action]}" ${(action === "view" ? views.includes(feature.id) : operations.includes(`${feature.id}:${action}`)) ? "checked" : ""} ${role.id === 1 ? "disabled" : ""}>${permissionActionLabels[action]}</label>`).join("")}</div></td></tr>`).join("")}</tbody></table></div>`;
}
function setupRolePermissions(dialog) {
  if (!dialog.querySelector(".role-form")) return;
  dialog.classList.add("role-modal");
  const sync = (row) => {
    const inputs = [...row.querySelectorAll("[data-permission-action]")];
    const selected = inputs.filter((input) => input.checked).length;
    const all = row.querySelector("[data-permission-all]");
    all.checked = selected === inputs.length;
    all.indeterminate = selected > 0 && selected < inputs.length;
  };
  dialog.querySelectorAll("[data-permission-row]").forEach((row) => {
    const view = row.querySelector('[data-permission-action="view"]');
    if (
      [...row.querySelectorAll('[name="operationPermissions"]')].some(
        (input) => input.checked,
      )
    )
      view.checked = true;
    sync(row);
    row.addEventListener("change", (event) => {
      const input = event.target;
      if (input.matches("[data-permission-all]"))
        row.querySelectorAll("[data-permission-action]").forEach((item) => {
          item.checked = input.checked;
        });
      else if (input === view && !view.checked)
        row
          .querySelectorAll('[name="operationPermissions"]')
          .forEach((item) => {
            item.checked = false;
          });
      else if (input.checked) view.checked = true;
      sync(row);
    });
  });
}
// Keep organization records separate from activity projects; migrate the old names once.
if (!Array.isArray(systemData.units)) {
  const names = [
    ...new Set(
      [
        ...projects.map((p) => p.unit),
        ...systemData.users.map((u) => u.unit),
        ...systemData.users.flatMap((u) =>
          Array.isArray(u.assignments) ? u.assignments.map((a) => a.unit) : [],
        ),
        ...systemData.roles.map((role) => role.unit),
      ].filter(
        (unit) => typeof unit === "string" && unit.trim() && unit !== ALL_UNITS,
      ),
    ),
  ];
  systemData.units = (names.length ? names : ["行動發展部"]).map(
    (name, index) => ({ id: index + 1, name, enabled: true }),
  );
}
const availableUnits = () => systemData.units.map((unit) => unit.name);
const systemList = (kind) =>
  kind === "projects" ? systemData.units : systemData[kind];
const defaultUnit = () => availableUnits()[0] || "行動發展部";
// Older users may only have a project assignment. Resolve its unit without dropping other fields.
for (const user of systemData.users) {
  if (!user.unit)
    user.unit =
      projects.find((p) => String(p.id) === String(user.projectId))?.unit ||
      defaultUnit();
  if (!Array.isArray(user.assignments))
    user.assignments = [{ unit: user.unit, role: user.role }];
  user.assignments = user.assignments.map((assignment) => ({
    ...assignment,
    role: Number(assignment.role) || null,
  }));
  // Keep the first assignment in the legacy fields for older saved-data consumers.
  user.unit = user.assignments[0]?.unit;
  user.role = user.assignments[0]?.role;
}
const userAssignments = (user) => user.assignments || [];
const userHasRole = (user, roleId) =>
  userAssignments(user).some((assignment) => assignment.role === roleId);
const userHasUnitRole = (user, roleId) =>
  qualifiedAssignments(user, true).some(
    (assignment) =>
      assignment.role === roleId &&
      systemData.roles.some(
        (role) => role.id === roleId && role.unit === assignment.unit,
      ),
  );
const userTableRows = (user, index) => {
  const assignments = userAssignments(user).length
    ? userAssignments(user)
    : [{ unit: user.unit || "未指派", role: user.role }];
  const visibleAssignments = assignments.filter(
    (assignment) =>
      (assignment.unit === ALL_UNITS && assignment.role === 1) ||
      (scopeAllows(assignment.unit) &&
        (systemUnit === "all" || assignment.unit === systemUnit)),
  );
  const units = visibleAssignments
    .map((assignment) =>
      assignment.unit === ALL_UNITS ? "全部單位" : esc(assignment.unit),
    )
    .join("<br>");
  const roles = visibleAssignments
    .map((assignment) => {
      const role = systemData.roles.find((role) => role.id === assignment.role);
      return esc(role?.name || "未指派");
    })
    .join("<br>");
  return `<tr class="user-assignment-row ${index % 2 ? "user-row-even" : "user-row-odd"}"><td>${esc(user.id)}</td><td>${esc(user.name)}</td><td>${esc(user.email)}</td><td class="user-unit">${units}</td><td class="user-unit-role">${roles}</td><td>${sysStatus(user.enabled)}</td><td>${sysEditButton("users", user)}</td></tr>`;
};
for (const role of systemData.roles) {
  // These capabilities are available to everyone who can access their page.
  for (const [field, retired] of [
    ["permissions", ["home"]],
    ["operationPermissions", ["project-list:qr", "project-list:copy"]],
  ]) {
    if (
      Array.isArray(role[field]) &&
      role[field].some((id) => retired.includes(id))
    ) {
      role[field] = role[field].filter((id) => !retired.includes(id));
      removedMenuSettings = true;
    }
  }
  if (Array.isArray(role.permissions) && role.permissions.includes("menus")) {
    role.permissions = role.permissions.filter(
      (permission) => permission !== "menus",
    );
    removedMenuSettings = true;
  }
  if (!role.unit) role.unit = defaultUnit();
  if (typeof role.enabled !== "boolean") role.enabled = true;
  if (typeof role.description !== "string") role.description = "";
  if (role.id === 1) {
    role.permissions = allPermissionIds();
    role.enabled = true;
  }
}
// Only the built-in role is migrated to global scope. General '*' roles stay invalid.
// 舊管理員指派收斂為唯一的「全部單位」，保留其餘帳號與角色資料。
function migrateAdminScope(data) {
  const before = JSON.stringify(data);
  const admin = data.roles.find((role) => role.id === 1);
  if (admin) {
    admin.unit = ALL_UNITS;
    admin.enabled = true;
    admin.permissions = allPermissionIds();
    admin.operationPermissions = allOperationIds();
    for (const user of data.users) {
      const assignments = user.assignments || [];
      if (assignments.some((assignment) => Number(assignment.role) === 1)) {
        user.assignments = [
          {
            ...assignments.find((assignment) => Number(assignment.role) === 1),
            unit: ALL_UNITS,
            role: 1,
          },
        ];
        user.unit = ALL_UNITS;
        user.role = 1;
      }
    }
  }
  return JSON.stringify(data) !== before;
}
removedMenuSettings = migrateAdminScope(systemData) || removedMenuSettings;
if (removedMenuSettings) {
  try {
    localStorage.setItem("o2o-system", JSON.stringify(systemData));
  } catch {
    /* Removed settings remain ignored if storage is unavailable. */
  }
}
let systemQuery = "",
  systemUnit = "all",
  systemStatus = "all",
  systemEdit = null,
  systemGroupOpen = true;
function persistSystem() {
  try {
    localStorage.setItem("o2o-system", JSON.stringify(systemData));
    return true;
  } catch {
    toast("無法儲存，請確認瀏覽器允許本機儲存且空間足夠", "error");
    return false;
  }
}

// ── 系統管理列表與編輯視窗 ────────────────────────────────────
function systemNavigation() {
  if (!systemSections.some((section) => can(section.id))) return "";
  return `<button class="nav" data-action="sys-group" aria-expanded="${systemGroupOpen}" title="系統管理">${icon("settings")}<span>系統管理</span>${icon(systemGroupOpen ? "chevron-down" : "chevron-right")}</button><div class="system-subnav" ${systemGroupOpen ? "" : "hidden"}>${systemSections
    .filter((m) => can(m.id))
    .map(
      (m) =>
        `<a class="subnav ${route() === `system/${m.id}` ? "active" : ""}" href="#system/${m.id}">${esc(m.name)}</a>`,
    )
    .join("")}</div>`;
}
const sysButton = (label, action, id = "", extra = "") =>
  `<button type="button" data-action="sys-${action}" data-id="${esc(id)}" ${extra}>${label}</button>`;
const sysEditButton = (kind, record) =>
  sysButton("編輯", "edit", record.id, `aria-haspopup="dialog" ${can(kind, "write") && systemRecordAccess(kind, record, "write") ? "" : "disabled"}`);
const sysStatus = (enabled) =>
  `<span class="status-tag ${enabled ? "on" : "off"}">${enabled ? "啟用" : "停用"}</span>`;
function systemPage() {
  systemUnit = scopedUnitFilter(systemUnit);
  const kind = route().split("/")[1];
  const menu = systemSections.find((m) => m.id === kind);
  if (!menu) {
    go("system/users");
    return;
  }
  if (!checkSession() || !can(kind)) return deny();
  const list = systemList(kind);
  const filtered = list.filter(
    (x) =>
      systemRecordAccess(kind, x) &&
      (kind === "users"
        ? `${x.name} ${x.email || ""}`
        : kind === "roles"
          ? x.name
          : `${x.name} ${x.account || ""} ${x.email || ""} ${x.unit || ""}`
      )
        .toLowerCase()
        .includes(systemQuery.toLowerCase()) &&
      (systemStatus === "all" ||
        (x.enabled !== false) === (systemStatus === "on")) &&
      (!["users", "roles"].includes(kind) ||
        systemUnit === "all" ||
        (kind === "users"
          ? userAssignments(x).some(
              (assignment) =>
                assignment.unit === systemUnit ||
                (assignment.unit === ALL_UNITS && assignment.role === 1),
            )
          : x.id === 1 || x.unit === systemUnit)),
  );
  const rows = paginate(filtered);
  const unitFilter = ["users", "roles"].includes(kind)
    ? `<select name="unit" aria-label="篩選單位">${isSystemAdmin() ? `<option value="all" ${systemUnit === "all" ? "selected" : ""}>全部單位</option>` : ""}${filterUnits()
        .map(
          (unit) =>
            `<option value="${esc(unit)}" ${systemUnit === unit ? "selected" : ""}>${esc(unit)}</option>`,
        )
        .join("")}</select>`
    : "";
  const statusFilter = ["users", "roles", "projects"].includes(kind)
    ? `<select name="status" aria-label="篩選狀態">${[
        ["all", "全部狀態"],
        ["on", "啟用"],
        ["off", "停用"],
      ]
        .map(
          ([v, l]) =>
            `<option value="${v}" ${systemStatus === v ? "selected" : ""}>${l}</option>`,
        )
        .join("")}</select>`
    : "";
  const headers = {
    users: ["編號", "姓名", "Email", "單位", "單位角色", "狀態", "操作"],
    roles: ["編號", "角色名稱", "單位", "說明", "狀態", "操作"],
    projects: ["編號", "單位名稱", "狀態", "操作"],
  };
  shell(
    `<section class="panel system-panel"><div class="toolbar">${can(kind, "write") ? sysButton("新增", "new", "", 'class="primary"') : ""}<div class="spacer"></div><form id="system-filter">${unitFilter}${statusFilter}<input name="query" aria-label="${kind === "users" ? "搜尋姓名或 Email" : "搜尋管理資料"}" placeholder="${kind === "users" ? "請輸入姓名或 Email" : kind === "roles" ? "請輸入角色名稱" : kind === "projects" ? "請輸入單位名稱" : "搜尋名稱、帳號或單位"}" value="${esc(systemQuery)}"><button type="submit" class="round search-icon" aria-label="查詢" title="查詢">${icon("search")}</button>${sysButton(icon("rotate-cw"), "reset", "", 'class="round search-icon" aria-label="重設搜尋" title="重設搜尋"')}</form></div>${pager(filtered.length)}<div class="table-scroll"><table class="system-table system-table--${kind}"><thead><tr>${headers[kind].map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${
      rows
        .map((x, index) => {
          if (kind === "users") return userTableRows(x, index);
          const cells =
            kind === "roles"
              ? [
                  x.id,
                  `${esc(x.name)}`,
                  x.unit === ALL_UNITS ? "全部單位" : esc(x.unit),
                  `${esc(x.description)}${x.id !== 1 && x.unit === ALL_UNITS ? '<p class="field-error">失效：一般角色不可屬於全部單位，請修正。</p>' : ""}`,
                  sysStatus(x.enabled),
                  sysEditButton(kind, x),
                ]
              : [
                  x.id,
                  `${esc(x.name)}`,
                  sysStatus(x.enabled !== false),
                  sysEditButton(kind, x),
                ];
          return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
        })
        .join("") ||
      `<tr><td colspan="${headers[kind].length}" class="empty">沒有符合的資料，請調整搜尋條件或新增資料。</td></tr>`
    }</tbody></table></div></section>`,
    menu.name,
  );
  if (!can(kind, "write"))
    $("#app")
      .querySelectorAll('[data-action="sys-edit"]')
      .forEach((node) => {
        node.removeAttribute("data-action");
        node.removeAttribute("aria-haspopup");
      });
  $("#app")
    .querySelectorAll('[data-action="sys-edit"]')
    .forEach((node) => {
      const record = list.find((item) => String(item.id) === node.dataset.id);
      if (!record || !systemRecordAccess(kind, record, "write")) {
        node.removeAttribute("data-action");
        node.removeAttribute("aria-haspopup");
      }
    });
  $("#system-filter").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    systemQuery = f.get("query").trim();
    systemStatus = f.get("status") || "all";
    systemUnit = scopedUnitFilter(f.get("unit"));
    page = 1;
    systemPage();
  };
}
let modalReturnFocus;
function closeSystemModal() {
  const dialog = $("#system-modal");
  if (dialog?.open) dialog.close();
  dialog?.remove();
  systemEdit = null;
  document.body.classList.remove("modal-open");
  if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
}
function openSystemModal(content, title, project = false) {
  $("#system-modal")?.remove();
  document.body.insertAdjacentHTML(
    "beforeend",
    '<dialog id="system-modal" class="system-modal" aria-labelledby="system-modal-title"></dialog>',
  );
  const dialog = $("#system-modal");
  dialog.innerHTML = content;
  if (project) {
    dialog.classList.add("project-modal");
    dialog.querySelector('[data-action="back"]')?.remove();
    dialog.querySelector(".tabs")?.remove();
    dialog.insertAdjacentHTML(
      "afterbegin",
      '<h2 id="system-modal-title">' + esc(title) + "</h2>",
    );
    dialog
      .querySelector(".submit-row")
      .insertAdjacentHTML("beforeend", sysButton("取消", "cancel"));
  } else dialog.querySelector("h2").id = "system-modal-title";
  dialog.insertAdjacentHTML(
    "afterbegin",
    '<button type="button" class="modal-close plain" data-action="sys-cancel" aria-label="關閉視窗">×</button>',
  );
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeSystemModal();
  });
  document.body.classList.add("modal-open");
  setupRolePermissions(dialog);
  dialog.showModal();
  createIcons({ icons });
  dialog.querySelector("input, select, textarea")?.focus();
}
function systemForm(kind) {
  const x =
    systemList(kind).find((x) => String(x.id) === String(systemEdit)) || {};
  if (kind === "users") return userForm(x);
  if (kind === "roles") return roleForm(x);
  if (kind === "projects") return unitForm(x);
  return "";
}
function unitForm(unit) {
  return `<form id="system-form" class="system-form user-form" novalidate><h2>${unit.id ? "編輯" : "新增"}單位</h2><div class="user-fields"><div class="user-field"><label for="unit-enabled">狀態</label><span class="user-enabled-switch" data-input-id="unit-enabled" data-enabled="${unit.enabled !== false}"></span></div><div class="user-field"><label for="unit-name"><em aria-hidden="true">*</em> 單位名稱</label><div class="user-field-control"><input id="unit-name" name="name" value="${esc(unit.name || "")}" maxlength="100" required aria-describedby="error-name"><p id="error-name" class="field-error" aria-live="polite"></p></div></div></div><p id="system-error" role="alert"></p><div class="inline user-form-actions">${sysButton("取消", "cancel")}<button type="submit" class="primary">儲存</button></div></form>`;
}

function roleForm(role) {
  const unit = role.unit || (systemUnit !== "all" ? systemUnit : defaultUnit());
  const field = (label, name, control, required = false) =>
    `<div class="user-field"><label for="role-${name}">${required ? '<em aria-hidden="true">*</em> ' : ""}${label}</label><div class="user-field-control">${control}<p class="field-error" id="error-${name}" aria-live="polite"></p></div></div>`;
  return `<form id="system-form" class="system-form role-form" novalidate><h2>${role.id ? "編輯" : "新增"}角色</h2><div class="user-fields"><div class="user-field"><label for="role-enabled">狀態</label><span class="user-enabled-switch" data-input-id="role-enabled" data-enabled="${role.enabled !== false}" data-disabled="${role.id === 1}"></span></div>${field(
    "單位",
    "unit",
    `<select id="role-unit" name="unit" ${role.id === 1 ? "disabled" : ""} required aria-describedby="error-unit"><option value="">${role.id !== 1 && unit === ALL_UNITS ? "原全部單位範圍已失效，請選擇個別單位" : "請選擇單位"}</option>${(role.id ===
    1
      ? [ALL_UNITS]
      : activeUnitNames()
    )
      .map(
        (value) =>
          `<option value="${esc(value)}" ${value === unit ? "selected" : ""}>${value === ALL_UNITS ? "全部單位" : esc(value)}</option>`,
      )
      .join("")}</select>`,
    true,
  )}${field("角色名稱", "name", `<input id="role-name" name="name" value="${esc(role.name || "")}" required maxlength="100" aria-describedby="error-name">`, true)}${field("說明", "description", `<textarea id="role-description" name="description" rows="3" maxlength="1000" aria-describedby="error-description">${esc(role.description || "")}</textarea>`)}<div class="user-field"><span class="permission-field-label" id="role-permissions-label">功能權限</span>${rolePermissionTable(role)}</div></div><p id="system-error" role="alert"></p><div class="inline user-form-actions">${sysButton("取消", "cancel")}<button type="submit" class="primary">儲存</button></div></form>`;
}
function validateRoleForm(form, existing) {
  const data = new FormData(form),
    values = {
      name: String(data.get("name") || "").trim(),
      unit: existing?.id === 1 ? ALL_UNITS : String(data.get("unit") || ""),
      description: String(data.get("description") || "").trim(),
      enabled: existing?.id === 1 ? true : data.get("enabled") === "true",
      permissions:
        existing?.id === 1
          ? allPermissionIds()
          : data
              .getAll("permissions")
              .filter((id) => allPermissionIds().includes(id)),
      operationPermissions:
        existing?.id === 1
          ? allOperationIds()
          : data
              .getAll("operationPermissions")
              .filter(
                (id) =>
                  allOperationIds().includes(id) &&
                  data.getAll("permissions").includes(id.split(":")[0]),
              ),
    };
  const errors = {};
  if (existing?.id !== 1 && !activeUnitNames().includes(values.unit))
    errors.unit = "一般角色必須選擇啟用中的個別單位。";
  else if (existing?.id !== 1 && !can("roles", "write", values.unit))
    errors.unit = "您沒有此單位的角色編輯權限。";
  if (!values.name) errors.name = "請輸入角色名稱。";
  else if (
    values.name.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(values.name)
  )
    errors.name = "角色名稱請使用 100 字以內的文字。";
  else if (
    systemData.roles.some(
      (role) =>
        role.id !== existing?.id &&
        role.unit === values.unit &&
        role.name.trim().toLowerCase() === values.name.toLowerCase(),
    )
  )
    errors.name = "此單位已有相同的角色名稱。";
  if (
    existing &&
    existing.id !== 1 &&
    existing.unit !== ALL_UNITS &&
    existing.unit !== values.unit &&
    systemData.users.some((user) => userHasRole(user, existing.id))
  )
    errors.unit =
      "此角色已指派使用者，無法變更所屬單位；請在其他單位建立新角色。";
  if (values.description.length > 1000)
    errors.description = "說明不可超過 1000 字。";
  for (const name of ["unit", "name", "description"]) {
    form.querySelector(`#error-${name}`).textContent = errors[name] || "";
    form.elements[name].setAttribute(
      "aria-invalid",
      String(Boolean(errors[name])),
    );
  }
  if (Object.keys(errors).length) {
    form.elements[Object.keys(errors)[0]].focus();
    return null;
  }
  return values;
}
function userForm(user) {
  const assignments = user.id
    ? userAssignments(user)
    : [
        {
          unit: activeUnitNames().includes(systemUnit)
            ? systemUnit
            : enteredUnit(),
          role: null,
        },
      ];
  const field = (label, name, control) =>
    `<div class="user-field"><label for="user-${name}"><em aria-hidden="true">*</em> ${label}</label><div class="user-field-control">${control}<p class="field-error" id="error-${name}" aria-live="polite"></p></div></div>`;
  const attrs = (name) =>
    `id="user-${name}" name="${name}" required aria-describedby="error-${name}"`;
  return `<form id="system-form" class="system-form user-form multi-unit-user-form" novalidate><h2>${user.id ? "編輯" : "新增"}使用者</h2><div class="user-fields"><div class="user-field"><label for="user-enabled">狀態</label><span class="user-enabled-switch" data-enabled="${user.enabled !== false}"></span></div>${field("姓名", "name", `<input ${attrs("name")} value="${esc(user.name || "")}" maxlength="100" autocomplete="name">`)}${field("Email", "email", `<input ${attrs("email")} type="email" value="${esc(user.email || "")}" maxlength="254" autocomplete="email">`)}<div class="user-field"><span class="permission-field-label" id="assignments-label"><em aria-hidden="true">*</em> 單位與角色</span><div class="assignment-editor" role="group" aria-labelledby="assignments-label" aria-describedby="error-assignments"><div id="assignment-rows">${assignmentRows(assignments)}</div><p class="field-error" id="error-assignments" aria-live="polite"></p></div></div></div><p id="system-error" role="alert"></p><div class="inline user-form-actions">${sysButton("取消", "cancel")}<button type="submit" class="primary">儲存</button></div></form>`;
}
function assignmentRoleOptions(unit, selectedRole) {
  const roles = systemData.roles.filter(
    (role) =>
      role.enabled !== false &&
      (unit === ALL_UNITS
        ? role.id === 1
        : role.id !== 1 &&
          activeUnitNames().includes(unit) &&
          role.unit === unit),
  );
  const selected = systemData.roles.find((role) => role.id === selectedRole);
  const invalidSelection =
    selectedRole && !roles.some((role) => role.id === selectedRole);
  const placeholder = unit && !roles.length ? "此單位尚無角色" : "請選擇角色";
  return `<option value="" ${invalidSelection ? "selected" : ""}>${invalidSelection ? "原角色已失效，請重新選擇" : placeholder}</option>${roles.map((role) => `<option value="${role.id}" ${role.id === selectedRole ? "selected" : ""}>${esc(role.name)}</option>`).join("")}`;
}
function assignmentRows(assignments) {
  return assignments
    .map(
      (assignment, index) =>
        `<div class="assignment-row"><div class="assignment-select-field assignment-unit"><select name="assignment-unit" data-previous-value="${esc(assignment.unit)}" id="assignment-unit-${index}" aria-label="第 ${index + 1} 列單位" required aria-describedby="error-assignment-unit-${index}"><option value="">請選擇單位</option>${assignmentUnitNames()
          .map(
            (unit) =>
              `<option value="${esc(unit)}" ${unit === assignment.unit ? "selected" : ""}>${unit === ALL_UNITS ? "全部單位" : esc(unit)}</option>`,
          )
          .join(
            "",
          )}</select><p class="field-error" id="error-assignment-unit-${index}" aria-live="polite"></p></div><div class="assignment-select-field assignment-role"><select name="assignment-role" id="assignment-role-${index}" aria-label="第 ${index + 1} 列角色" ${!assignment.unit ? "disabled" : ""} required aria-describedby="error-assignment-role-${index}">${assignmentRoleOptions(assignment.unit, assignment.role)}</select><p class="field-error" id="error-assignment-role-${index}" aria-live="polite"></p></div>${sysButton(icon(index === assignments.length - 1 ? "plus" : "trash-2"), index === assignments.length - 1 ? "assignment-add" : "assignment-remove", "", `class="assignment-action circle ${index === assignments.length - 1 ? "success assignment-add" : "danger assignment-remove"}" data-assignment-index="${index}" ${index === assignments.length - 1 && assignments.some((item) => item.unit === ALL_UNITS) ? "disabled" : ""} aria-label="${index === assignments.length - 1 ? "新增單位與角色" : `刪除第 ${index + 1} 列單位與角色`}"`)}</div>`,
    )
    .join("");
}
function readAssignmentRows(form) {
  return [...form.querySelectorAll(".assignment-row")].map((row) => ({
    unit: row.querySelector('[name="assignment-unit"]').value,
    role: Number(row.querySelector('[name="assignment-role"]').value) || null,
  }));
}
function updateAssignmentRows(action, button) {
  const form = $("#system-form");
  const assignments = readAssignmentRows(form);
  if (
    action === "sys-assignment-add" &&
    assignments.some((assignment) => assignment.unit === ALL_UNITS)
  ) {
    $("#error-assignments").textContent = "已選擇全部單位，不可新增其他指派。";
    toast("已選擇全部單位，不可新增其他指派。", "warning");
    return;
  }
  if (action === "sys-assignment-add")
    assignments.push({ unit: "", role: null });
  else if (assignments.length > 1)
    assignments.splice(Number(button.dataset.assignmentIndex), 1);
  $("#assignment-rows").innerHTML = assignmentRows(assignments);
  createIcons({ icons });
  $("#error-assignments").textContent = "";
  const index =
    action === "sys-assignment-add"
      ? assignments.length - 1
      : Math.min(
          Number(button.dataset.assignmentIndex),
          assignments.length - 1,
        );
  $(`#assignment-unit-${index}`)?.focus();
}
// 儲存前獨立檢查 Email 唯一性與單位／角色指派，不只依賴畫面選項。
function validateUserForm(form, existing) {
  const data = new FormData(form),
    values = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      assignments: readAssignmentRows(form),
      enabled: data.get("enabled") === "true",
    };
  const errors = {};
  if (!values.name) errors.name = "請輸入姓名。";
  else if (
    values.name.length > 100 ||
    /[\u0000-\u001f\u007f]/.test(values.name)
  )
    errors.name = "姓名格式不正確，請輸入 100 字以內的姓名。";
  const emailInput = form.elements.email;
  emailInput.value = values.email;
  if (!values.email) errors.email = "請輸入 Email。";
  else if (
    emailInput.validity.typeMismatch ||
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  )
    errors.email = "請輸入有效的 Email，例如 name@example.com。";
  if (
    !errors.email &&
    systemData.users.some(
      (user) =>
        user.id !== existing?.id &&
        normalized(user.email) === normalized(values.email),
    )
  ) {
    errors.email = "此 Email 已存在，請編輯既有使用者的單位與角色。";
    toast(errors.email, "warning");
  }
  let assignmentInvalid = false;
  const seen = new Set();
  values.assignments.forEach((assignment, index) => {
    let unitError = assignmentUnitNames().includes(assignment.unit)
      ? ""
      : "請選擇單位。";
    const role = systemData.roles.find((role) => role.id === assignment.role);
    let roleError =
      !role || role.enabled === false
        ? "請選擇角色。"
        : !assignmentRole(assignment)
          ? "角色不屬於所選單位，請重新選擇。"
          : "";
    if (!unitError && seen.has(assignment.unit))
      unitError = "同一單位只能設定一個角色，請刪除重複的單位。";
    seen.add(assignment.unit);
    for (const [field, message] of [
      ["unit", unitError],
      ["role", roleError],
    ]) {
      form.querySelector(`#error-assignment-${field}-${index}`).textContent =
        message;
      form
        .querySelector(`#assignment-${field}-${index}`)
        .setAttribute("aria-invalid", String(Boolean(message)));
    }
    if (unitError || roleError) assignmentInvalid = true;
  });
  if (!values.assignments.length)
    errors.assignments = "請至少設定一組單位與角色。";
  if (
    values.assignments.length > 1 &&
    values.assignments.some((assignment) => assignment.unit === ALL_UNITS)
  )
    errors.assignments = "全部單位不可與其他指派並存，請先移除其他指派。";
  if (
    existing &&
    userHasUnitRole(existing, 1) &&
    existing.enabled &&
    systemData.users.filter((u) => u.enabled && userHasUnitRole(u, 1))
      .length === 1
  ) {
    if (!values.enabled) errors.enabled = "至少需保留一位啟用的系統管理員。";
    if (!values.assignments.some((assignment) => assignment.role === 1))
      errors.assignments = "至少需保留一位啟用的系統管理員。";
  }
  for (const name of ["name", "email"]) {
    form.querySelector(`#error-${name}`).textContent = errors[name] || "";
    form.elements[name].setAttribute(
      "aria-invalid",
      String(Boolean(errors[name])),
    );
  }
  form.querySelector("#error-assignments").textContent =
    errors.assignments || "";
  let statusError = form.querySelector("#error-enabled");
  if (!statusError) {
    statusError = document.createElement("p");
    statusError.id = "error-enabled";
    statusError.className = "field-error";
    statusError.setAttribute("aria-live", "polite");
    form.querySelector(".user-status-control").append(statusError);
  }
  statusError.textContent = errors.enabled || "";
  form
    .querySelector('[role="switch"]')
    ?.setAttribute("aria-describedby", "error-enabled");
  form
    .querySelector('[role="switch"]')
    ?.setAttribute("aria-invalid", String(Boolean(errors.enabled)));
  if (Object.keys(errors).length || assignmentInvalid) {
    if (errors.enabled) form.querySelector('[role="switch"]')?.focus();
    else if (errors.name || errors.email)
      form.elements[errors.name ? "name" : "email"].focus();
    else
      form
        .querySelector(
          '#assignment-rows [aria-invalid="true"], #assignment-rows select',
        )
        ?.focus();
    return null;
  }
  values.unit = values.assignments[0].unit;
  values.role = values.assignments[0].role;
  return values;
}
// 寫入前重新授權；單位更名需同步專案、角色與使用者指派。
async function saveSystemForm(e) {
  e.preventDefault();
  if (e.target.dataset.confirming === "true") return;
  const kind = route().split("/")[1],
    data = new FormData(e.target),
    list = systemList(kind);
  const existing = list.find((x) => String(x.id) === String(systemEdit));
  if (!checkSession() || !can(kind, "write")) return deny();
  if (existing && !systemRecordAccess(kind, existing, "write")) return deny();
  const name = data.get("name").trim();
  let record = {
    ...existing,
    id: existing?.id || Math.max(0, ...list.map((x) => Number(x.id))) + 1,
    name,
  };
  if (kind === "users") {
    const values = validateUserForm(e.target, existing);
    if (!values) return;
    if (
      existing?.enabled !== false &&
      userHasRole(existing || {}, 1) &&
      !values.enabled
    ) {
      e.target.dataset.confirming = "true";
      let confirmed;
      try {
        confirmed = await confirmAction("使用者為系統管理員，確定要停用?");
      } finally {
        delete e.target.dataset.confirming;
      }
      if (!confirmed) return;
      if (
        !e.target.isConnected ||
        systemList(kind) !== list ||
        list.find((item) => item.id === existing.id) !== existing ||
        !checkSession() ||
        !systemRecordAccess(kind, existing, "write")
      )
        return;
      // Revalidate last-administrator protection after waiting for confirmation.
      const checked = validateUserForm(e.target, existing);
      if (!checked) return;
      Object.assign(values, checked);
    }
    record = { ...record, ...values };
  } else if (kind === "roles") {
    const values = validateRoleForm(e.target, existing);
    if (!values) return;
    record = { ...record, ...values };
  } else if (kind === "projects") {
    const warning = !name
      ? "請輸入單位名稱。"
      : name.length > 100 || /[\u0000-\u001f\u007f]/.test(name)
        ? "單位名稱請使用 100 字以內的文字。"
        : list.some(
              (unit) =>
                unit.id !== existing?.id &&
                normalized(unit.name) === normalized(name),
            )
          ? "單位名稱已存在。"
          : "";
    e.target.querySelector("#error-name").textContent = warning;
    e.target.elements.name.setAttribute(
      "aria-invalid",
      String(Boolean(warning)),
    );
    if (warning) {
      e.target.elements.name.focus();
      return;
    }
    record.enabled = data.get("enabled") === "true";
  }
  const before = structuredClone(systemData);
  const projectsBefore = structuredClone(projects);
  if (kind === "projects" && existing && existing.name !== name) {
    for (const item of [
      ...projects,
      ...systemData.users,
      ...systemData.roles,
    ]) {
      if (item.unit === existing.name) item.unit = name;
    }
    for (const user of systemData.users) {
      for (const assignment of userAssignments(user)) {
        if (assignment.unit === existing.name) assignment.unit = name;
      }
    }
  }
  for (const user of systemData.users) {
    user.unit = user.assignments?.[0]?.unit;
    user.role = user.assignments?.[0]?.role;
  }
  if (existing) list[list.indexOf(existing)] = record;
  else list.push(record);
  try {
    save();
  } catch {
    projects = projectsBefore;
    systemData = before;
    toast("無法儲存專案歸屬，請確認瀏覽器儲存空間。", "error");
    return;
  }
  if (!persistSystem()) {
    systemData = before;
    projects = projectsBefore;
    save();
    return;
  }
  projectUnit = scopedUnitFilter(projectUnit);
  systemUnit = scopedUnitFilter(systemUnit);
  closeSystemModal();
  render();
  if (demoSession.authenticated && routeAccess() && route() !== "select-unit")
    toast("設定已儲存", "success");
}
async function systemAction(action, b) {
  if (action === "sys-group" && window.innerWidth <= 650) {
    document.querySelector("aside").classList.toggle("mobile-expanded");
    return;
  }
  if (action === "sys-group") {
    systemGroupOpen = !systemGroupOpen;
    if (collapsed) collapsed = false;
    render();
    return;
  }
  const kind = route().split("/")[1];
  if (!systemSections.some((m) => m.id === kind)) return;
  if (
    !["sys-cancel", "sys-reset"].includes(action) &&
    (!checkSession() || !can(kind, "write"))
  )
    return deny();
  if (
    kind === "users" &&
    ["sys-assignment-add", "sys-assignment-remove"].includes(action)
  ) {
    updateAssignmentRows(action, b);
    return;
  }
  const list = systemList(kind),
    x = list.find((x) => String(x.id) === b.dataset.id);
  if (x && !systemRecordAccess(kind, x, "write")) return deny();
  if (action === "sys-new" || action === "sys-edit") {
    systemEdit = x?.id ?? "new";
    modalReturnFocus = b;
    openSystemModal(systemForm(kind));
    $("#system-form").addEventListener("submit", saveSystemForm);
    return;
  }
  if (action === "sys-cancel") {
    closeSystemModal();
    return;
  }
  if (action === "sys-reset") {
    systemQuery = "";
    systemUnit = enteredUnit();
    systemStatus = "all";
    page = 1;
    systemPage();
    return;
  }
  if (!x) return;
  const before = structuredClone(systemData);
  if (action === "sys-toggle") {
    if (kind === "roles" && x.id === 1) return deny();
    if (
      kind === "users" &&
      x.enabled &&
      userHasUnitRole(x, 1) &&
      systemData.users.filter((u) => u.enabled && userHasUnitRole(u, 1))
        .length === 1
    ) {
      toast("至少需保留一位啟用的系統管理員", "warning");
      return;
    }
    if (
      !(await confirmAction(
        kind === "users" && x.enabled !== false && userHasRole(x, 1)
          ? "使用者為系統管理員，確定要停用?"
          : `確定${x.enabled !== false ? "停用" : "啟用"}「${x.name}」？`,
      ))
    )
      return;
    if (!checkSession() || !systemRecordAccess(kind, x, "write")) return deny();
    x.enabled = x.enabled === false;
  } else if (action === "sys-delete") {
    return;
  } else return;
  if (!persistSystem()) {
    systemData = before;
    return;
  }
  render();
  if (demoSession.authenticated && routeAccess() && route() !== "select-unit")
    toast("設定已更新", "success");
}

// ── 啟動與跨分頁同步 ──────────────────────────────────────────
projectUnit = enteredUnit();
systemUnit = enteredUnit();
if (/^(members|stats)/.test(route())) limit = 10;
render();

installElementUI();

document.addEventListener("click", (event) => {
  document.querySelectorAll(".account-menu[open]").forEach((menu) => {
    if (!menu.contains(event.target)) menu.open = false;
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape")
    document.querySelectorAll(".account-menu[open]").forEach((menu) => {
      menu.open = false;
      menu.querySelector("summary").focus();
    });
});
// 其他分頁變更管理資料時，重查 session 並移除可能已失效的編輯內容。
window.addEventListener("storage", (event) => {
  if (event.key === null) return endSession("管理資料已清除，請重新登入。");
  if (!["o2o-system", "o2o-projects"].includes(event.key)) return;
  try {
    if (event.key === "o2o-system") {
      const data = JSON.parse(event.newValue);
      if (
        !data ||
        !Array.isArray(data.users) ||
        !Array.isArray(data.roles) ||
        !Array.isArray(data.units)
      )
        return endSession("管理資料已變更，請重新登入。");
      systemData = data;
      if (migrateAdminScope(systemData)) persistSystem();
    } else projects = JSON.parse(event.newValue) || [];
    if ($("#system-modal")) closeSystemModal();
    render();
  } catch {
    endSession("管理資料無法讀取，請重新登入。");
  }
});
