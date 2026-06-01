/**
 * components/uveg-tabs/uveg-tabs.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-tabs>
 *
 * Uso en HTML — declarativo, los panels son slots:
 *
 *   <uveg-tabs active="unidad1">
 *     <uveg-tab key="avisos"       icon="ti-mail"     label="Avisos"></uveg-tab>
 *     <uveg-tab key="presentacion" icon="ti-bookmark" label="Presentación"></uveg-tab>
 *     <uveg-tab key="unidad1"      icon="ti-book"     label="Unidad 1"></uveg-tab>
 *     <uveg-tab key="unidad2"      icon="ti-book"     label="Unidad 2"></uveg-tab>
 *   </uveg-tabs>
 *
 *   <!-- Panels: cualquier elemento con data-panel="key" -->
 *   <div data-panel="avisos">...</div>
 *   <div data-panel="unidad1">...</div>
 *
 * Atributos observados en <uveg-tabs>:
 *   active  → key del tab activo
 *
 * Eventos emitidos:
 *   uveg:tabchange → { detail: { tab: 'unidad1', prev: 'avisos' } }
 * ─────────────────────────────────────────────────────────────
 */

import {
  springWidth,
  springScale,
  createRipple,
} from "../../js/utils/spring.js";

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
  }

  connectedCallback() {
    this._activeKey = this.getAttribute("active") || this._getTabDefs()[0]?.key;
    this._render();
    this._bindEvents();
    this._syncPanels(this._activeKey);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    if (name === "active") {
      this._switchTab(newVal, false); // false = sin emitir evento
    }
  }

  /* ── Leer definición de tabs desde children <uveg-tab> ───── */

  _getTabDefs() {
    return Array.from(this.querySelectorAll("uveg-tab")).map((el) => ({
      key: el.getAttribute("key"),
      icon: el.getAttribute("icon") || "ti-circle",
      label: el.getAttribute("label") || el.getAttribute("key"),
    }));
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const tabs = this._getTabDefs();

    // Insertar barra de tabs antes del primer <uveg-tab>
    // sin tocar el contenido del slot
    const existing = this.querySelector(".tabs");
    if (existing) existing.remove();

    const bar = document.createElement("div");
    bar.className = "tabs";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Secciones del módulo");

    tabs.forEach((tab) => {
      const btn = document.createElement("button");
      btn.className = `tab${tab.key === this._activeKey ? " active" : ""}`;
      btn.dataset.tab = tab.key;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(tab.key === this._activeKey));
      btn.setAttribute("aria-controls", `panel-${tab.key}`);
      btn.id = `tab-${tab.key}`;

      btn.innerHTML = `
        <i class="ti ${tab.icon}" aria-hidden="true" style="font-size:12px"></i>
        ${tab.label}
      `;

      bar.appendChild(btn);
    });

    // Insertar al inicio del componente
    this.insertBefore(bar, this.firstChild);
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
    springScale(btn, 0.94, 1);
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
    if (prev === key) return;

    this._activeKey = key;

    // Actualizar botones
    this.querySelectorAll(".tab[data-tab]").forEach((btn) => {
      const isActive = btn.dataset.tab === key;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    // Sincronizar panels en el DOM
    this._syncPanels(key);

    // Emitir evento
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

  /**
   * Muestra el panel correspondiente al key activo.
   * Busca elementos con [data-panel="key"] en el documento,
   * no limitado al shadow DOM — compatible con layout externo.
   */
  _syncPanels(key) {
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      const isActive = panel.dataset.panel === key;
      panel.classList.toggle("tab-panel", true);
      panel.classList.toggle("active", isActive);

      // Accesibilidad
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${panel.dataset.panel}`);
      panel.id = `panel-${panel.dataset.panel}`;
    });
  }
}

customElements.define("uveg-tabs", UvegTabs);
