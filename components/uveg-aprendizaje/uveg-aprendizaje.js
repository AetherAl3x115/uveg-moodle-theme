/**
 * components/uveg-aprendizaje/uveg-aprendizaje.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-aprendizaje>
 * Light DOM — hereda variables.css y main.css.
 *
 * Atributo `data` → JSON string con array de recursos:
 *   [
 *     {
 *       type:    "biblioteca" | "web" | "video"
 *       label:   string  — título del recurso
 *       url:     string  — enlace
 *       desc:    string  — descripción opcional
 *     },
 *     ...
 *   ]
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const TYPE_CONFIG = {
  biblioteca: {
    label: "Biblioteca virtual UVEG",
    icon: "book",
    tokenBg: "--color-tint-bg",
    tokenColor: "--color-accent-dark",
  },
  web: {
    label: "Recursos autorizados",
    icon: "academic-cap",
    tokenBg: "--color-done-bg",
    tokenColor: "--color-done-text",
  },
  video: {
    label: "Videos de retroalimentación",
    icon: "play-circle",
    tokenBg: "--color-reto-bg",
    tokenColor: "--color-reto-text",
  },
};

class UvegAprendizaje extends HTMLElement {
  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render();
      this._bindEvents();
    }
  }

  _getResources() {
    try {
      return JSON.parse(this.getAttribute("data") || "[]");
    } catch {
      return [];
    }
  }

  _render() {
    const resources = this._getResources();
    this._query = this._query || "";

    // Agrupar por type
    const groups = {};
    resources.forEach((r) => {
      const t = r.type || "web";
      if (!groups[t]) groups[t] = [];
      groups[t].push(r);
    });

    this.innerHTML = `
      <div class="ap-root">

        <div class="ap-section-title">
          ${hi("pencil-square", 18)}
          Aprender Mas +
        </div>

        <div class="ap-search">
          ${hi("magnifying-glass", 16)}
          <input
            class="ap-search-input"
            type="text"
            placeholder="Buscar recurso..."
            value="${this._query}"
            data-ap-search
            aria-label="Buscar recursos"
          >
        </div>

        <div class="ap-list" data-ap-list>
          ${this._renderGroups(groups, resources)}
        </div>

      </div>
    `;
  }

  _renderGroups(groups, allResources) {
    const q = this._query.toLowerCase();

    const filtered = allResources.filter(
      (r) =>
        !q ||
        r.label.toLowerCase().includes(q) ||
        (r.desc || "").toLowerCase().includes(q),
    );

    if (!filtered.length) {
      return `
        <div class="ap-empty">
          ${hi("magnifying-glass", 32)}
          <p>No se encontraron recursos</p>
        </div>`;
    }

    // Reagrupar filtrados
    const filteredGroups = {};
    filtered.forEach((r) => {
      const t = r.type || "web";
      if (!filteredGroups[t]) filteredGroups[t] = [];
      filteredGroups[t].push(r);
    });

    return Object.keys(filteredGroups)
      .map((type) => {
        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.web;
        const items = filteredGroups[type];
        return `
          <div class="ap-group">
            <div class="ap-group-header">
              <span class="ap-group-icon ap-group-icon--${type}">
                ${hi(cfg.icon, 14)}
              </span>
              <span class="ap-group-label">${cfg.label}</span>
            </div>
            <div class="ap-group-items">
              ${items.map((r) => this._renderItem(r, type)).join("")}
            </div>
          </div>`;
      })
      .join("");
  }

  _renderItem(r, type) {
    return `
      <a class="ap-item ap-item--${type}" href="${r.url || "#"}" target="_blank" rel="noopener">
        <span class="ap-item-icon ap-item-icon--${type}">
          ${hi(TYPE_CONFIG[type]?.icon || "book", 16)}
        </span>
        <span class="ap-item-body">
          <span class="ap-item-label">${r.label}</span>
          ${r.desc ? `<span class="ap-item-desc">${r.desc}</span>` : ""}
        </span>
        <span class="ap-item-arrow">
          ${hi("arrow-right", 14)}
        </span>
      </a>`;
  }

  _bindEvents() {
    this.querySelector("[data-ap-search]")?.addEventListener("input", (e) => {
      this._query = e.target.value;
      this._refreshList();
    });
  }

  _refreshList() {
    const resources = this._getResources();
    const groups = {};
    resources.forEach((r) => {
      const t = r.type || "web";
      if (!groups[t]) groups[t] = [];
      groups[t].push(r);
    });
    const list = this.querySelector("[data-ap-list]");
    if (!list) return;
    list.innerHTML = this._renderGroups(groups, resources);
  }
}

customElements.define("uveg-aprendizaje", UvegAprendizaje);
