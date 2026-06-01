/**
 * components/uveg-sidebar/uveg-sidebar.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-sidebar>
 *
 * Uso:
 *   <uveg-sidebar
 *     user-name="Alejandro Landa"
 *     user-role="Administrador"
 *     user-initials="AL"
 *     active-item="dashboard">
 *   </uveg-sidebar>
 *
 * Atributos observados:
 *   user-name      → nombre del usuario en el pill
 *   user-role      → rol del usuario
 *   user-initials  → iniciales para el avatar
 *   active-item    → key del item activo (dashboard|modulos|cursos|mensajes|perfil|config)
 *
 * Eventos emitidos:
 *   uveg:navigate  → { detail: { item: 'dashboard' } }
 * ─────────────────────────────────────────────────────────────
 */

import { springWidth } from "../../js/utils/spring.js";

/** Definición de los items de navegación */
const NAV_ITEMS = [
  { key: "dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
  { key: "modulos", icon: "ti-book-2", label: "Módulos" },
  { key: "cursos", icon: "ti-school", label: "Cursos" },
  { key: "mensajes", icon: "ti-message-circle", label: "Mensajes", badge: 3 },
];

const NAV_ITEMS_BOTTOM = [
  { key: "perfil", icon: "ti-user-circle", label: "Mi perfil" },
  { key: "config", icon: "ti-settings", label: "Configuración" },
];

const COLLAPSED_WIDTH = 58; // px — sidebar colapsada
const EXPANDED_WIDTH = 220; // px — sidebar expandida

class UvegSidebar extends HTMLElement {
  /** Atributos que disparan attributeChangedCallback al cambiar */
  static get observedAttributes() {
    return ["user-name", "user-role", "user-initials", "active-item"];
  }

  constructor() {
    super();
    this._collapsed = false;
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._bindEvents();
    // Fijar punto de partida para springWidth — sin esto arranca desde 0
    this.style.width = `${EXPANDED_WIDTH}px`;
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    // Re-render solo si ya está en el DOM
    if (this.isConnected) this._render();
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const userName = this.getAttribute("user-name") || "Usuario";
    const userRole = this.getAttribute("user-role") || "Estudiante";
    const userInitials = this.getAttribute("user-initials") || "U";
    const activeItem = this.getAttribute("active-item") || "dashboard";

    this.innerHTML = `
      <div class="sidebar ${this._collapsed ? "collapsed" : ""}" id="uveg-sb">

        <!-- Top: logo + usuario -->
        <div class="sb-top">
          <div class="sb-logo-row">
            <div class="sb-logo">UV</div>
            <div class="sb-brand">
              <div class="sb-brand-main">UVEG</div>
              <div class="sb-brand-sub">Objetos de Aprendizaje</div>
            </div>
          </div>
          <div class="sb-user" role="button" tabindex="0" aria-label="Perfil de ${userName}">
            <div class="sb-av" aria-hidden="true">${userInitials}</div>
            <div>
              <div class="sb-uname">${userName}</div>
              <div class="sb-urole">${userRole}</div>
            </div>
          </div>
        </div>

        <!-- Navegación principal -->
        <nav class="sb-nav" role="navigation" aria-label="Navegación principal">
          ${NAV_ITEMS.map((item) => this._renderNavItem(item, activeItem)).join("")}

          <div class="sb-sep" role="separator"></div>

          ${NAV_ITEMS_BOTTOM.map((item) => this._renderNavItem(item, activeItem)).join("")}
        </nav>

        <!-- Botón colapsar -->
        <button
          class="sb-collapse"
          id="sb-toggle"
          aria-label="${this._collapsed ? "Expandir sidebar" : "Colapsar sidebar"}"
          aria-expanded="${!this._collapsed}">
          <i class="ti ti-arrow-bar-left" aria-hidden="true"></i>
          <span>Colapsar</span>
        </button>

      </div>
    `;
  }

  _renderNavItem(item, activeItem) {
    const isActive = item.key === activeItem;
    const badge = item.badge
      ? `<span class="sb-badge" aria-label="${item.badge} notificaciones">${item.badge}</span>`
      : "";

    return `
      <div
        class="sb-item ${isActive ? "active" : ""}"
        data-key="${item.key}"
        role="button"
        tabindex="0"
        aria-current="${isActive ? "page" : "false"}"
        aria-label="${item.label}">
        <i class="ti ${item.icon}" aria-hidden="true"></i>
        <span class="sb-label">${item.label}</span>
        ${badge}
        <span class="sb-tooltip" aria-hidden="true">${item.label}</span>
      </div>
    `;
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    // Delegación de eventos — un solo listener en el componente
    this.addEventListener("click", this._handleClick.bind(this));
    this.addEventListener("keydown", this._handleKeydown.bind(this));
  }

  _handleClick(e) {
    // Toggle colapsar
    const toggleBtn = e.target.closest("#sb-toggle");
    if (toggleBtn) {
      this._toggleCollapse();
      return;
    }

    // Nav item
    const navItem = e.target.closest(".sb-item[data-key]");
    if (navItem) {
      this._activateItem(navItem.dataset.key);
      return;
    }
  }

  _handleKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const focused = e.target.closest(".sb-item[data-key], #sb-toggle");
    if (focused) {
      e.preventDefault();
      focused.click();
    }
  }

  _toggleCollapse() {
    this._collapsed = !this._collapsed;

    const sidebar = this.querySelector(".sidebar");
    const toggleBtn = this.querySelector("#sb-toggle");

    // Actualizar aria
    toggleBtn.setAttribute("aria-expanded", String(!this._collapsed));
    toggleBtn.setAttribute(
      "aria-label",
      this._collapsed ? "Expandir sidebar" : "Colapsar sidebar",
    );

    // Fijar ancho actual como punto de partida — evita salto visual
    this.style.width = `${this.offsetWidth}px`;

    if (this._collapsed) {
      // Colapsar: clase primero (oculta labels), luego spring
      sidebar.classList.add("collapsed");
      springWidth(this, COLLAPSED_WIDTH);
    } else {
      // Expandir: spring primero, clase al terminar
      // Si quitamos collapsed antes, el CSS salta a 220px instantáneo
      springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
        sidebar.classList.remove("collapsed");
      });
    }
  }

  _activateItem(key) {
    // Actualizar UI
    this.querySelectorAll(".sb-item[data-key]").forEach((el) => {
      const isActive = el.dataset.key === key;
      el.classList.toggle("active", isActive);
      el.setAttribute("aria-current", isActive ? "page" : "false");
    });

    // Emitir evento para que el resto de la app reaccione
    this.dispatchEvent(
      new CustomEvent("uveg:navigate", {
        bubbles: true,
        composed: true,
        detail: { item: key },
      }),
    );
  }
}

customElements.define("uveg-sidebar", UvegSidebar);
