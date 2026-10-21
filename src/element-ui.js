import { h, render, ref, defineComponent } from "vue";
import { ElButton, ElTag, ElAlert, ElMessageBox, ElSwitch } from "element-plus";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/tag/style/css";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/switch/style/css";

// 以隱藏欄位將 Vue 開關值交回原生 FormData，沿用既有表單儲存流程。
const UserStatusSwitch = defineComponent({
  props: {
    initial: Boolean,
    inputId: { type: String, default: "user-enabled" },
    disabled: Boolean,
  },
  setup(props) {
    const enabled = ref(props.initial);
    return () =>
      h("div", { class: "user-status-control" }, [
        h("input", {
          type: "hidden",
          name: "enabled",
          value: String(enabled.value),
        }),
        h(ElSwitch, {
          id: props.inputId,
          disabled: props.disabled,
          modelValue: enabled.value,
          "aria-label": "狀態",
          "onUpdate:modelValue": (value) => {
            enabled.value = value;
          },
        }),
      ]);
  },
});

// 局部掛載 Vue 控制項，保留原生表單與 data-action 事件委派。
const mounted = new Set();

function enhanceControls() {
  // 頁面重繪後卸載已離開 DOM 的元件，避免累積失效的掛載紀錄。
  for (const host of mounted) {
    if (!host.isConnected) {
      render(null, host);
      mounted.delete(host);
    }
  }
  document
    .querySelectorAll(
      "#app button, #system-modal button, #app .status-tag, #system-modal .user-enabled-switch",
    )
    .forEach((source) => {
      if (source.closest("[data-element-host], .el-message-box")) return;
      // 導覽與文字編輯工具保留既有截圖版型。
      if (
        source.matches(".nav, .plain, .modal-close") ||
        source.closest(".rich-toolbar")
      )
        return;
      const host = document.createElement("span");
      host.dataset.elementHost = "";
      host.className = "element-control";
      const attrs = Object.fromEntries(
        Array.from(source.attributes, (a) => [a.name, a.value]),
      );
      const content = source.innerHTML;
      source.replaceWith(host);
      if (source.matches(".user-enabled-switch")) {
        render(
          h(UserStatusSwitch, {
            initial: source.dataset.enabled === "true",
            inputId: source.dataset.inputId || "user-enabled",
            disabled: source.dataset.disabled === "true",
          }),
          host,
        );
      } else if (source.matches(".status-tag")) {
        render(
          h(
            ElTag,
            {
              type: source.classList.contains("on") ? "success" : "info",
              effect: "light",
            },
            () => source.textContent,
          ),
          host,
        );
      } else {
        const nativeType = source.getAttribute("type") || "button";
        delete attrs.type;
        delete attrs.disabled;
        render(
          h(
            ElButton,
            {
              ...attrs,
              nativeType,
              circle:
                source.classList.contains("circle") ||
                source.classList.contains("round"),
              disabled: source.disabled,
              type: source.classList.contains("primary")
                ? "primary"
                : source.classList.contains("success")
                  ? "success"
                  : source.classList.contains("danger")
                    ? "danger"
                    : "",
            },
            () => h("span", { innerHTML: content }),
          ),
          host,
        );
      }
      mounted.add(host);
    });
}
let queued = false;

// 合併同一輪 DOM 變更，避免每次新增節點都重複增強控制項。
export function installElementUI() {
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      enhanceControls();
      queued = false;
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  enhanceControls();
}
let alertTimer;

// 每次只顯示一則提示；新訊息先卸載上一則，並重設自動關閉時間。
export function showMessage(message, type = "info") {
  clearTimeout(alertTimer);
  document.querySelectorAll(".system-alert-host").forEach((host) => {
    render(null, host);
    host.remove();
  });
  const host = document.createElement("div");
  host.className = "system-alert-host";
  // 原生 dialog 位於頂層，提示需放入該視窗內才能保持可見。
  const container =
    document.querySelector("#system-modal[open]") || document.body;
  container.append(host);
  const dismiss = () => {
    clearTimeout(alertTimer);
    render(null, host);
    host.remove();
  };
  render(
    h(ElAlert, {
      title: String(message),
      type,
      showIcon: true,
      center: false,
      closable: true,
      onClose: dismiss,
    }),
    host,
  );
  alertTimer = setTimeout(dismiss, 4000);
}

// 取消或關閉確認框皆回傳 false，由呼叫端決定是否繼續寫入。
export async function confirmAction(message) {
  try {
    await ElMessageBox.confirm(message, "操作確認", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning",
      closeOnClickModal: false,
      appendTo: document.querySelector("#system-modal[open]") || document.body,
    });
    return true;
  } catch {
    return false;
  }
}
