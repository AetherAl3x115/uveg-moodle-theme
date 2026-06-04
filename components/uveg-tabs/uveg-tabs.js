/**
 * components/uveg-tabs/uveg-tabs.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-tabs>
 * Fill direccional + dot emergente estilo gota.
 * Iconografía: Heroicons 2 Outline via js/utils/icons.js
 */

import { springScale, createRipple } from "../../js/utils/spring.js";
import { hi } from "../../js/utils/icons.js";

/* ── Mapa icon attr → clave hi() ────────────────────────────── */
const TAB_ICON_MAP = {
  "ti-mail": "mail",
  "ti-bookmark": "bookmark",
  "ti-book": "book",
  "ti-circle": "info-circle",
};

function tabIcon(iconAttr) {
  const key = TAB_ICON_MAP[iconAttr] || "info-circle";
  return hi(key, 12);
}

/* ── <uveg-tab> — elemento hijo declarativo ─────────────────── */
class UvegTab extends HTMLElement {
  static get observedAttributes() {
    return ["key", "icon", "label"];
  }
}
customElements.define("uveg-tab", UvegTab);

/* ── <uveg-tabs> — contenedor principal ─────────────────────── */
class UvegTabs extends HTMLElement {
  static get observedAttributes() {
    return ["active"];
  }

  constructor() {
    super();
    this._activeKey = null;
    this._activeIdx = null;
    this._dot = null;
    this._dotReady = false;
    this._resizeObs = null;
  }

  connectedCallback() {
    this._activeKey = this.getAttribute("active") || this._getTabDefs()[0]?.key;
    this._render();
    this._bindEvents();
    this._syncPanels(this._activeKey);

    requestAnimationFrame(() => {
      const active = this.querySelector(".tab.active");
      if (active) this._moveDot(active, false);

      this._resizeObs = new ResizeObserver(() => {
        const a = this.querySelector(".tab.active");
        if (a) this._moveDot(a, false);
      });
      this._resizeObs.observe(this.querySelector(".tabs"));
    });
  }

  disconnectedCallback() {
    this._resizeObs?.disconnect();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === "active") this._switchTab(newVal, false);
  }

  /* ── Tab defs ───────────────────────────────────────────── */

  _getTabDefs() {
    return Array.from(this.querySelectorAll("uveg-tab")).map((el) => ({
      key: el.getAttribute("key"),
      icon: el.getAttribute("icon") || "ti-circle",
      label: el.getAttribute("label") || el.getAttribute("key"),
    }));
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    this.querySelector(".tabs-outer")?.remove();

    const outer = document.createElement("div");
    outer.className = "tabs-outer";
    outer.style.cssText = "position:relative; width:fit-content;";

    // Dot
    this._dot = document.createElement("div");
    this._dot.className = "tab-dot";
    outer.appendChild(this._dot);

    const bar = document.createElement("div");
    bar.className = "tabs";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Secciones del módulo");

    const defs = this._getTabDefs();
    defs.forEach((tab, idx) => {
      const isActive = tab.key === this._activeKey;
      if (isActive) this._activeIdx = idx;

      const btn = document.createElement("button");
      btn.className = `tab${isActive ? " active fill-from-left" : ""}`;
      btn.dataset.tab = tab.key;
      btn.dataset.idx = idx;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(isActive));
      btn.setAttribute("aria-controls", `panel-${tab.key}`);
      btn.id = `tab-${tab.key}`;

      const hoverBg = document.createElement("span");
      hoverBg.className = "tab-hover-bg";
      hoverBg.setAttribute("aria-hidden", "true");

      // Heroicon en lugar de <i class="ti ...">
      btn.innerHTML = `${tabIcon(tab.icon)} ${tab.label}`;
      btn.insertBefore(hoverBg, btn.firstChild);
      bar.appendChild(btn);
    });

    outer.appendChild(bar);
    this.insertBefore(outer, this.firstChild);
  }

  /* ── Dot ────────────────────────────────────────────────── */

  _getDotCenter(btn) {
    const outerRect = this.querySelector(".tabs-outer").getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    return btnRect.left - outerRect.left + btnRect.width / 2;
  }

  _triggerBubble() {
    this._dot.classList.remove("up");
    void this._dot.offsetWidth;
    this._dot.classList.add("up");
  }

  _moveDot(btn, animate = true) {
    const center = this._getDotCenter(btn);

    if (!animate || !this._dotReady) {
      this._dot.style.transition = "none";
      this._dot.style.left = `${center}px`;
      requestAnimationFrame(() => {
        this._dot.style.transition = "";
        this._dotReady = true;
        this._triggerBubble();
      });
      return;
    }

    this._dot.classList.remove("up");
    this._dot.style.left = `${center}px`;
    setTimeout(() => this._triggerBubble(), 130);
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    const bar = this.querySelector(".tabs");
    if (!bar) return;
    bar.addEventListener("click", this._handleClick.bind(this));
    bar.addEventListener("keydown", this._handleKeydown.bind(this));
  }

  _handleClick(e) {
    const btn = e.target.closest(".tab[data-tab]");
    if (!btn || btn.classList.contains("active")) return;

    createRipple(btn, e, "tab-ripple", 500);
    springScale(btn, 0.97, 1);
    this._switchTab(btn.dataset.tab, true);
  }

  _handleKeydown(e) {
    const tabs = Array.from(this.querySelectorAll(".tab[data-tab]"));
    const idx = tabs.findIndex((t) => t === document.activeElement);
    if (idx === -1) return;

    let next = -1;
    if (e.key === "ArrowRight") next = (idx + 1) % tabs.length;
    if (e.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = tabs.length - 1;

    if (next !== -1) {
      e.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    }
  }

  /* ── Tab switching ──────────────────────────────────────── */

  _switchTab(key, emit = true) {
    const prev = this._activeKey;
    const prevIdx = this._activeIdx;
    if (prev === key) return;

    const newBtn = this.querySelector(`.tab[data-tab="${key}"]`);
    const newIdx = parseInt(newBtn?.dataset.idx ?? 0);
    const dir = newIdx > prevIdx ? "right" : "left";

    this._activeKey = key;
    this._activeIdx = newIdx;

    this.querySelectorAll(".tab[data-tab]").forEach((btn) => {
      if (btn.classList.contains("active")) {
        btn.classList.remove(
          "active",
          "fill-from-left",
          "fill-from-right",
          "drain-to-left",
          "drain-to-right",
        );
        btn.classList.add(dir === "right" ? "drain-to-left" : "drain-to-right");
        btn.setAttribute("aria-selected", "false");
        setTimeout(
          () => btn.classList.remove("drain-to-left", "drain-to-right"),
          420,
        );
      }
    });

    if (newBtn) {
      newBtn.classList.remove(
        "drain-to-left",
        "drain-to-right",
        "fill-from-left",
        "fill-from-right",
      );
      newBtn.classList.add(
        "active",
        dir === "right" ? "fill-from-left" : "fill-from-right",
      );
      newBtn.setAttribute("aria-selected", "true");
      this._moveDot(newBtn, true);
    }

    this._syncPanels(key);

    if (emit) {
      this.dispatchEvent(
        new CustomEvent("uveg:tabchange", {
          bubbles: true,
          composed: true,
          detail: { tab: key, prev },
        }),
      );
    }
  }

  /* ── Panels ─────────────────────────────────────────────── */

  _syncPanels(key) {
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      const isActive = panel.dataset.panel === key;
      panel.classList.toggle("tab-panel", true);
      panel.classList.toggle("active", isActive);
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${panel.dataset.panel}`);
      panel.id = `panel-${panel.dataset.panel}`;
    });
  }
}

customElements.define("uveg-tabs", UvegTabs);
