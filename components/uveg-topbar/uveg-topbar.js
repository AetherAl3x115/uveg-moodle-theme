/**
 * components/uveg-topbar/uveg-topbar.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-topbar>
 *
 * Uso:
 *   <uveg-topbar
 *     user-name="Ricardo Zandate"
 *     user-initials="RZ"
 *     user-role="Alumnos"
 *     notifications="3">
 *   </uveg-topbar>
 *
 * Atributos observados:
 *   user-name      → nombre completo del usuario
 *   user-initials  → iniciales para el avatar
 *   user-role      → rol/grupo del usuario
 *   notifications  → número de notificaciones (0 = sin dot)
 *
 * Eventos emitidos:
 *   uveg:search    → usuario abrió búsqueda
 *   uveg:messages  → usuario abrió mensajes
 * ─────────────────────────────────────────────────────────────
 */

import { toggleTheme } from "../../js/utils/theme.js";
import { springWidth } from "../../js/utils/spring.js";
import { hi } from "../../js/utils/icons.js";

class UvegTopbar extends HTMLElement {
  static get observedAttributes() {
    return ["user-name", "user-initials", "user-role", "notifications"];
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this.isConnected) this._render();
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const userName = this.getAttribute("user-name") || "Usuario";
    const userInitials = this.getAttribute("user-initials") || "U";
    const userRole = this.getAttribute("user-role") || "";
    const notifications = parseInt(
      this.getAttribute("notifications") || "0",
      10,
    );

    const notifDot =
      notifications > 0
        ? `<span class="tb-notif-dot" aria-label="${notifications} notificaciones"></span>`
        : "";

    const roleBadge = userRole
      ? `<span class="tb-role">${userRole}</span>`
      : "";

    this.innerHTML = `
      <div class="topbar">

        <!-- Izquierda: brand -->
        <div class="tb-left">
          <span class="tb-brand">UVEG</span>
          <span class="tb-sep" aria-hidden="true"></span>
          <span class="tb-subtitle">Universidad Virtual del Estado de Guanajuato</span>
        </div>

        <!-- Derecha: acciones + usuario -->
        <div class="tb-right">

          <!-- Toggle dark mode -->
          <button
            class="tb-theme-toggle"
            id="tb-theme-btn"
            aria-label="Cambiar tema"
            title="Cambiar tema claro/oscuro">
            ${hi("moon", 18, "tb-icon icon-moon")}
            ${hi("sun", 18, "tb-icon icon-sun")}
          </button>

          <!-- Búsqueda -->
          <button
            class="tb-icon"
            id="tb-search-btn"
            aria-label="Buscar"
            title="Buscar"
            style="background:none;border:none;cursor:pointer;padding:0;line-height:1">
            ${hi("magnifying-glass", 18)}
          </button>

          <!-- Notificaciones -->
          <div class="tb-bell-wrap">
            <button
              class="tb-icon"
              id="tb-notif-btn"
              aria-label="Notificaciones${notifications > 0 ? ` (${notifications} nuevas)` : ""}"
              title="Notificaciones"
              style="background:none;border:none;cursor:pointer;padding:0;line-height:1">
             ${hi("bell", 18)}
            </button>
            ${notifDot}
          </div>

          <!-- Mensajes -->
          <button
            class="tb-icon"
            id="tb-msg-btn"
            aria-label="Mensajes"
            title="Mensajes"
            style="background:none;border:none;cursor:pointer;padding:0;line-height:1">
        ${hi("message", 18)}
          </button>

          <span class="tb-sep" aria-hidden="true"></span>

          <!-- Usuario -->
          ${roleBadge}
          <div
            class="tb-avatar"
            role="button"
            tabindex="0"
            aria-label="Perfil de ${userName}"
            title="${userName}">
            ${userInitials}
          </div>
          <span class="tb-username">${userName}</span>

        </div>
      </div>
    `;
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    this.addEventListener("click", this._handleClick.bind(this));
  }

  _handleClick(e) {
    // Dark mode toggle
    const themeBtn = e.target.closest("#tb-theme-btn");
    if (themeBtn) {
      toggleTheme();
      springScale(themeBtn, 0.8, 1);
      return;
    }

    // Búsqueda
    const searchBtn = e.target.closest("#tb-search-btn");
    if (searchBtn) {
      springScale(searchBtn, 0.85, 1);
      this.dispatchEvent(
        new CustomEvent("uveg:search", {
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    // Mensajes
    const msgBtn = e.target.closest("#tb-msg-btn");
    if (msgBtn) {
      springScale(msgBtn, 0.85, 1);
      this.dispatchEvent(
        new CustomEvent("uveg:messages", {
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }
  }
}

customElements.define("uveg-topbar", UvegTopbar);
