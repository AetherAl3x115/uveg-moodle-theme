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
          <span class="tb-sep tb-sep--brand" aria-hidden="true"></span>
          <!-- tb-subtitle se oculta en móvil vía responsive.css -->
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

          <!-- Herramientas Google -->
          <div class="tb-gtools-wrap" style="position:relative">
            <button
              class="tb-gtools-btn"
              id="tb-gtools-btn"
              aria-label="Herramientas Google"
              title="Herramientas Google">
              <img src="./assets/img/gmail.webp" class="tb-gtools-icon" alt="Gmail">
              <img src="./assets/img/drive.jpg"  class="tb-gtools-icon" alt="Drive">
              <span class="tb-mail-badge" id="mail-badge" aria-label="Correos no leídos" hidden></span>
            </button>
            <!-- Mini-card herramientas -->
            <div class="tb-gtools-card" id="tb-gtools-card" aria-hidden="true">
              <div class="tb-gtools-card-title">Herramientas Google disponibles</div>
              <div class="tb-gtools-card-items">
                <button class="tb-gtool-item" id="tb-mail-btn">
                  <span class="tb-gtool-item-icon">
                    <img src="./assets/img/gmail.webp" alt="Gmail">
                  </span>
                  <span class="tb-gtool-item-label">UVEG Mail</span>
                  <span class="tb-mail-badge tb-gtool-badge" id="mail-badge-card" aria-label="Correos no leídos" hidden></span>
                </button>
                <button class="tb-gtool-item" id="tb-drive-btn">
                  <span class="tb-gtool-item-icon">
                    <img src="./assets/img/drive.jpg" alt="Drive">
                  </span>
                  <span class="tb-gtool-item-label">Mi Drive</span>
                </button>
              </div>
            </div>
          </div>

      <span class="tb-sep" aria-hidden="true"></span>

          <!-- Usuario — tb-username oculto en móvil vía responsive.css -->
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
      return;
    }

    // Herramientas Google — toggle mini-card
    const gtoolsBtn = e.target.closest("#tb-gtools-btn");
    if (gtoolsBtn) {
      const card = this.querySelector("#tb-gtools-card");
      const open = card.getAttribute("aria-hidden") === "false";
      card.setAttribute("aria-hidden", String(open));
      card.classList.toggle("tb-gtools-card--open", !open);
      return;
    }

    // Cerrar mini-card al hacer click fuera
    if (!e.target.closest(".tb-gtools-wrap")) {
      const card = this.querySelector("#tb-gtools-card");
      if (card) {
        card.setAttribute("aria-hidden", "true");
        card.classList.remove("tb-gtools-card--open");
      }
    }

    // Gmail
    const mailBtn = e.target.closest("#tb-mail-btn");
    if (mailBtn) {
      const card = this.querySelector("#tb-gtools-card");
      card?.setAttribute("aria-hidden", "true");
      card?.classList.remove("tb-gtools-card--open");
      this.dispatchEvent(
        new CustomEvent("uveg:mail", { bubbles: true, composed: true }),
      );
      return;
    }

    // Mensajes
    const msgBtn = e.target.closest("#tb-msg-btn");
    if (msgBtn) {
      this.dispatchEvent(
        new CustomEvent("uveg:messages", {
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }

    // Mi Drive
    const driveBtn = e.target.closest("#tb-drive-btn");
    if (driveBtn) {
      const card = this.querySelector("#tb-gtools-card");
      card?.setAttribute("aria-hidden", "true");
      card?.classList.remove("tb-gtools-card--open");
      this.dispatchEvent(
        new CustomEvent("uveg:drive", { bubbles: true, composed: true }),
      );
      return;
    }
  }
}

customElements.define("uveg-topbar", UvegTopbar);
