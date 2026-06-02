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
 *   active-item    → key del item activo
 *                    (dashboard|modulos|cursos|mensajes|perfil|config)
 *
 * Eventos emitidos:
 *   uveg:navigate  → { detail: { item: 'dashboard' } }
 *
 * Sección BLOQUES:
 *   Tres acordeones colapsables bajo la navegación principal.
 *   Cada bloque usa liquidOpen/liquidClose de spring.js para
 *   la animación de apertura/cierre con física de resorte.
 *   Estado inicial: Mi Progreso → cerrado, Mi Menú → cerrado,
 *   Próximas actividades → abierto.
 * ─────────────────────────────────────────────────────────────
 */

import { springWidth, liquidOpen, liquidClose } from "../../js/utils/spring.js";

/** Items de navegación principal */
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

/** Items de Mi Menú */
const MENU_ITEMS = [
  { icon: "ti-home", label: "Inicio" },
  { icon: "ti-book-2", label: "Módulos" },
  { icon: "ti-circle-check", label: "Evaluación" },
  { icon: "ti-chart-bar", label: "Informes" },
  { icon: "ti-info-circle", label: "Centro de información" },
  { icon: "ti-news", label: "Revistas de investigación" },
];

/** Próximas actividades — datos estáticos de ejemplo */
const NEXT_ACTIVITIES = [
  {
    type: "foro",
    label: "Foro",
    title: "Foro de diagnóstico",
    date: "28 may 2026",
  },
  {
    type: "lectura",
    label: "Lectura",
    title: "Lectura: Tendencias",
    date: "29 may 2026",
  },
  {
    type: "actividad",
    label: "Actividad",
    title: "Actividad 1. Análisis",
    date: "30 may 2026",
  },
];

const COLLAPSED_WIDTH = 58;
const EXPANDED_WIDTH = 220;

class UvegSidebar extends HTMLElement {
  static get observedAttributes() {
    return ["user-name", "user-role", "user-initials", "active-item"];
  }

  constructor() {
    super();
    this._collapsed = false;
    // Estado de cada bloque — true = abierto
    this._blocks = {
      progreso: false,
      menu: false,
      actividades: true, // abierto por default
    };
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._bindEvents();
    this.style.width = `${EXPANDED_WIDTH}px`;
    // Abrir bloque de actividades sin animación al montar
    requestAnimationFrame(() => this._openInitial());
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    this._render();
    this._bindEvents();
    requestAnimationFrame(() => this._openInitial());
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
          <div class="sb-user" role="button" tabindex="0"
               aria-label="Perfil de ${userName}">
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

          <!-- ── Bloques ───────────────────────────────────── -->
          <div class="sb-sep" role="separator"></div>
          <div class="sb-section-label" aria-hidden="true">Bloques</div>

          <!-- Bloque: Mi Progreso -->
          ${this._renderBlock(
            "progreso",
            "ti-chart-donut",
            "Mi Progreso",
            this._renderBlockProgreso(),
          )}

          <!-- Bloque: Mi Menú -->
          ${this._renderBlock(
            "menu",
            "ti-menu-2",
            "Mi Menú",
            this._renderBlockMenu(),
          )}

          <!-- Bloque: Próximas actividades -->
          ${this._renderBlock(
            "actividades",
            "ti-calendar-event",
            "Próximas actividades",
            this._renderBlockActividades(),
          )}

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
      <div class="sb-item ${isActive ? "active" : ""}"
           data-key="${item.key}"
           role="button" tabindex="0"
           aria-current="${isActive ? "page" : "false"}"
           aria-label="${item.label}">
        <i class="ti ${item.icon}" aria-hidden="true"></i>
        <span class="sb-label">${item.label}</span>
        ${badge}
        <span class="sb-tooltip" aria-hidden="true">${item.label}</span>
      </div>
    `;
  }

  /**
   * Renderiza la estructura de un bloque acordeón.
   * @param {string} key      - Clave del bloque (progreso|menu|actividades)
   * @param {string} icon     - Clase Tabler del icono
   * @param {string} label    - Etiqueta visible
   * @param {string} bodyHtml - HTML del contenido interno
   */
  _renderBlock(key, icon, label, bodyHtml) {
    const isOpen = this._blocks[key];
    return `
      <div class="sb-block" data-block="${key}">
        <div class="sb-block-header"
             role="button" tabindex="0"
             aria-expanded="${isOpen}"
             aria-controls="sb-block-body-${key}">
          <i class="ti ${icon}" aria-hidden="true"></i>
          <span class="sb-label sb-block-label">${label}</span>
          <i class="ti ti-chevron-down sb-block-chevron ${isOpen ? "open" : ""}"
             aria-hidden="true"></i>
        </div>
        <div class="sb-block-wrap" id="sb-block-wrap-${key}"
             style="height:0;overflow:hidden">
          <div class="sb-block-inner" id="sb-block-inner-${key}"
               style="transform:scaleY(0.92);opacity:0;transform-origin:top center">
            <div class="sb-block-body" id="sb-block-body-${key}"
                 role="region" aria-label="${label}">
              ${bodyHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderBlockProgreso() {
    return `
      <div class="sb-prog-card">
        <div class="sb-prog-circle" aria-label="70% de avance">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26"
              fill="none" stroke="var(--color-border)" stroke-width="4"/>
            <circle cx="32" cy="32" r="26"
              fill="none" stroke="var(--color-progress-fill-from)" stroke-width="4"
              stroke-dasharray="114.7 49.2"
              stroke-dashoffset="40.8"
              stroke-linecap="round"
              transform="rotate(-90 32 32)"/>
          </svg>
          <span class="sb-prog-pct">70%</span>
        </div>
        <div class="sb-prog-msg">Avanzando muy bien</div>
        <div class="sb-prog-sub">7 de 10 actividades completadas</div>
        <button class="sb-prog-link">
          Ver detalle
          <i class="ti ti-arrow-right" style="font-size:10px" aria-hidden="true"></i>
        </button>
      </div>
    `;
  }

  _renderBlockMenu() {
    return MENU_ITEMS.map(
      (item) => `
      <div class="sb-menu-item" role="button" tabindex="0"
           aria-label="${item.label}">
        <div class="sb-menu-icon" aria-hidden="true">
          <i class="ti ${item.icon}"></i>
        </div>
        <span class="sb-menu-label">${item.label}</span>
      </div>
    `,
    ).join("");
  }

  _renderBlockActividades() {
    const items = NEXT_ACTIVITIES.map(
      (act) => `
      <div class="sb-act-item" role="button" tabindex="0"
           aria-label="${act.title}, ${act.date}">
        <div class="sb-act-dot sb-act-dot--${act.type}" aria-hidden="true"></div>
        <div class="sb-act-info">
          <span class="sb-act-title">${act.title}</span>
          <span class="sb-act-date">${act.date}</span>
        </div>
        <span class="sb-act-tag sb-act-tag--${act.type}">${act.label}</span>
      </div>
    `,
    ).join("");

    return `
      ${items}
      <div class="sb-act-cal" role="button" tabindex="0">
        <i class="ti ti-calendar" aria-hidden="true"></i>
        Ver calendario completo
      </div>
    `;
  }

  /* ── Apertura inicial sin animación ─────────────────────── */

  _openInitial() {
    Object.entries(this._blocks).forEach(([key, isOpen]) => {
      if (!isOpen) return;
      const wrap = this.querySelector(`#sb-block-wrap-${key}`);
      const inner = this.querySelector(`#sb-block-inner-${key}`);
      if (!wrap || !inner) return;
      // Sin animación — snap directo
      wrap.style.height = inner.scrollHeight + "px";
      inner.style.transform = "scaleY(1)";
      inner.style.opacity = "1";
    });
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    this.addEventListener("click", this._handleClick.bind(this));
    this.addEventListener("keydown", this._handleKeydown.bind(this));
  }

  _handleClick(e) {
    // Toggle sidebar
    if (e.target.closest("#sb-toggle")) {
      this._toggleCollapse();
      return;
    }

    // Toggle bloque acordeón
    const header = e.target.closest(".sb-block-header");
    if (header) {
      const block = header.closest(".sb-block");
      if (block) this._toggleBlock(block.dataset.block);
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
    const focused = e.target.closest(
      ".sb-item[data-key], #sb-toggle, .sb-block-header, .sb-menu-item, .sb-act-item, .sb-act-cal",
    );
    if (focused) {
      e.preventDefault();
      focused.click();
    }
  }

  /* ── Toggle bloque acordeón ─────────────────────────────── */

  _toggleBlock(key) {
    if (!key || !(key in this._blocks)) return;

    const isOpen = this._blocks[key];
    const wrap = this.querySelector(`#sb-block-wrap-${key}`);
    const inner = this.querySelector(`#sb-block-inner-${key}`);
    const header = this.querySelector(`[data-block="${key}"] .sb-block-header`);
    const chevron = header?.querySelector(".sb-block-chevron");

    if (!wrap || !inner) return;

    this._blocks[key] = !isOpen;

    // Actualizar aria + chevron
    header?.setAttribute("aria-expanded", String(!isOpen));
    chevron?.classList.toggle("open", !isOpen);

    if (!isOpen) {
      // Abrir — liquidOpen + rebote en el header
      liquidOpen(wrap, inner);
      this._bounceHeader(header);
    } else {
      // Cerrar — liquidClose
      liquidClose(wrap, inner);
    }
  }

  /**
   * Rebote de escala en el header al abrir un bloque.
   * Mismo patrón que _activateItem — squish → overshoot → settle.
   */
  _bounceHeader(el) {
    if (!el) return;
    el.style.transform = "scale(0.94)";
    el.style.transition = "transform 0ms";
    requestAnimationFrame(() => {
      el.style.transition = "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scale(1)";
    });
  }

  /* ── Toggle sidebar colapsar ────────────────────────────── */

  _toggleCollapse() {
    this._collapsed = !this._collapsed;
    const sidebar = this.querySelector(".sidebar");
    const toggleBtn = this.querySelector("#sb-toggle");

    toggleBtn.setAttribute("aria-expanded", String(!this._collapsed));
    toggleBtn.setAttribute(
      "aria-label",
      this._collapsed ? "Expandir sidebar" : "Colapsar sidebar",
    );

    this.style.width = `${this.offsetWidth}px`;

    if (this._collapsed) {
      // Colapsar wraps sin cambiar _blocks — al expandir se restauran
      Object.keys(this._blocks).forEach((key) => {
        const wrap = this.querySelector(`#sb-block-wrap-${key}`);
        const inner = this.querySelector(`#sb-block-inner-${key}`);
        if (wrap && inner) {
          wrap.style.height = "0px";
          inner.style.transform = "scaleY(0.92)";
          inner.style.opacity = "0";
        }
      });
      sidebar.classList.add("collapsed");
      springWidth(this, COLLAPSED_WIDTH);
    } else {
      springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
        sidebar.classList.remove("collapsed");
        // Restaurar los que estaban abiertos
        requestAnimationFrame(() => this._openInitial());
      });
    }
  }

  /**
   * Retorna los elementos de la sección BLOQUES que se ocultan al colapsar.
   * Separador 2, label "Bloques", y los 3 sb-block.
   */
  _getBlocksSection() {
    return [
      ...this.querySelectorAll(".sb-block"),
      ...this.querySelectorAll(".sb-section-label"),
      this.querySelectorAll(".sb-sep")[1], // el segundo separador (antes de BLOQUES)
    ].filter(Boolean);
  }

  /* ── Activar nav item ───────────────────────────────────── */

  _activateItem(key) {
    this.querySelectorAll(".sb-item[data-key]").forEach((el) => {
      const isActive = el.dataset.key === key;
      el.classList.toggle("active", isActive);
      el.setAttribute("aria-current", isActive ? "page" : "false");

      if (isActive) {
        el.style.transform = "scale(0.92)";
        el.style.transition = "transform 0ms";
        requestAnimationFrame(() => {
          el.style.transition =
            "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)";
          el.style.transform = "scale(1)";
        });
      }
    });

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
