/**
 * components/uveg-bottom-nav/uveg-bottom-nav.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-bottom-nav>
 *
 * Barra inferior fija — solo visible en móvil (≤576px).
 * Estructura:
 *   [☰ Menú] [🌙 Tema] [🔍 Buscar] [🔔 Notif] [💬 Mensajes]
 *
 * La hamburguesa abre el sidebar con overlay.
 * Los demás replican los controles del topbar.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";
import { toggleTheme } from "../../js/utils/theme.js";

class UvegBottomNav extends HTMLElement {
  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  _render() {
    this.innerHTML = `
      <nav class="mobile-bottom-nav" role="navigation" aria-label="Barra de acciones">

        <!-- Hamburguesa — abre el sidebar -->
        <button class="mbn-item" id="mbn-sidebar-btn" aria-label="Menú" aria-expanded="false">
          <span class="mbn-icon">${hi("bars-3", 22)}</span>
          <span>Menú</span>
        </button>

        <!-- Dark mode -->
        <button class="mbn-item" id="mbn-theme-btn" aria-label="Cambiar tema">
          <span class="mbn-icon mbn-icon--theme">
            ${hi("moon", 22, "mbn-icon-moon")}
            ${hi("sun", 22, "mbn-icon-sun")}
          </span>
          <span>Tema</span>
        </button>

      <!-- Herramientas Google -->
        <button class="mbn-item" id="mbn-gtools-btn" aria-label="Herramientas Google">
          <span class="mbn-icon mbn-icon--gtools">
            <img src="./assets/img/gmail.webp" class="mbn-gtools-icon" alt="Gmail">
            <img src="./assets/img/drive.jpg"  class="mbn-gtools-icon mbn-gtools-icon--drive" alt="Drive">
            <span class="mbn-badge" id="mbn-mail-badge" style="display:none"></span>
          </span>
          <span>Google</span>
        </button>

        <!-- Notificaciones -->
        <button class="mbn-item" id="mbn-notif-btn" aria-label="Notificaciones">
          <span class="mbn-icon mbn-icon--bell">
            ${hi("bell", 22)}
            <span class="mbn-badge" id="mbn-notif-badge" style="display:none"></span>
          </span>
          <span>Avisos</span>
        </button>

        <!-- Mensajes -->
        <button class="mbn-item" id="mbn-msg-btn" aria-label="Mensajes">
          <span class="mbn-icon">${hi("message", 22)}</span>
          <span>Mensajes</span>
        </button>

     </nav>

      <!-- Mini-card Herramientas Google — móvil -->
      <div class="mbn-gtools-card" id="mbn-gtools-card" aria-hidden="true">
        <div class="mbn-gtools-card-title">Herramientas Google disponibles</div>
        <div class="mbn-gtools-card-items">
          <button class="mbn-gtool-item" id="mbn-gtool-mail">
            <span class="mbn-gtool-item-icon">
              <img src="./assets/img/gmail.webp" alt="Gmail">
            </span>
            <span class="mbn-gtool-item-label">UVEG Mail</span>
            <span class="mbn-badge mbn-gtool-badge" id="mbn-mail-badge2" style="display:none"></span>
          </button>
          <button class="mbn-gtool-item" id="mbn-gtool-drive">
            <span class="mbn-gtool-item-icon">
              <img src="./assets/img/drive.jpg" alt="Drive">
            </span>
            <span class="mbn-gtool-item-label">Mi Drive</span>
          </button>
        </div>
      </div>
    `;

    // Sincronizar badge de notificaciones desde el topbar
    const topbar = document.querySelector("uveg-topbar");
    if (topbar) {
      const n = parseInt(topbar.getAttribute("notifications") || "0", 10);
      const badge = this.querySelector("#mbn-notif-badge");
      if (badge && n > 0) {
        badge.textContent = n;
        badge.style.display = "flex";
      }
    }
  }

  _bindEvents() {
    this.addEventListener("click", (e) => {
      // Hamburguesa → toggle sidebar
      if (e.target.closest("#mbn-sidebar-btn")) {
        const sidebar = document.querySelector("uveg-sidebar");
        const isOpen = sidebar?.classList.toggle("mobile-open");
        e.target
          .closest("#mbn-sidebar-btn")
          .setAttribute("aria-expanded", isOpen ? "true" : "false");
        this._toggleOverlay(isOpen);
        return;
      }

      // Tema
      if (e.target.closest("#mbn-theme-btn")) {
        toggleTheme();
        return;
      }

      // Herramientas Google — mini-card propia del bottom nav
      if (e.target.closest("#mbn-gtools-btn")) {
        const card = this.querySelector("#mbn-gtools-card");
        const open = card.getAttribute("aria-hidden") === "false";
        card.setAttribute("aria-hidden", String(open));
        card.classList.toggle("mbn-gtools-card--open", !open);
        return;
      }

      // Items dentro de la mini-card
      if (e.target.closest("#mbn-gtool-mail")) {
        this.querySelector("#mbn-gtools-card")?.setAttribute(
          "aria-hidden",
          "true",
        );
        this.querySelector("#mbn-gtools-card")?.classList.remove(
          "mbn-gtools-card--open",
        );
        document.getElementById("uveg-drive")?.close();
        document.getElementById("uveg-mail")?.toggle();
        return;
      }

      if (e.target.closest("#mbn-gtool-drive")) {
        this.querySelector("#mbn-gtools-card")?.setAttribute(
          "aria-hidden",
          "true",
        );
        this.querySelector("#mbn-gtools-card")?.classList.remove(
          "mbn-gtools-card--open",
        );
        document.getElementById("uveg-mail")?.close();
        document.getElementById("uveg-drive")?.toggle();
        return;
      }

      // Mensajes
      if (e.target.closest("#mbn-msg-btn")) {
        document
          .querySelector("uveg-topbar")
          ?.dispatchEvent(
            new CustomEvent("uveg:messages", { bubbles: true, composed: true }),
          );
        return;
      }
    });
  }

  _toggleOverlay(show) {
    let overlay = document.getElementById("mbn-overlay");
    if (show) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "mbn-overlay";
        overlay.style.cssText = `
          position:fixed;inset:0;z-index:999;
          background:rgba(0,0,0,.4);
          backdrop-filter:blur(2px);
          -webkit-backdrop-filter:blur(2px);
          animation:mbnOverlayIn .2s ease;
        `;
        overlay.addEventListener("click", () => {
          document
            .querySelector("uveg-sidebar")
            ?.classList.remove("mobile-open");
          this._toggleOverlay(false);
          this.querySelector("#mbn-sidebar-btn")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });
        document.body.appendChild(overlay);
      }
    } else {
      overlay?.remove();
    }
  }
}

if (!customElements.get("uveg-bottom-nav")) {
  customElements.define("uveg-bottom-nav", UvegBottomNav);
}
