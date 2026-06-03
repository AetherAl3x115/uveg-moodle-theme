/**
 * components/uveg-sidebar/uveg-sidebar.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-sidebar>
 */

import { springWidth, liquidOpen, liquidClose } from "../../js/utils/spring.js";

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

const MENU_ITEMS = [
  { icon: "ti-home", label: "Inicio", color: "var(--color-act-dot-actividad)" },
  { icon: "ti-book-2", label: "Módulos", color: "var(--color-accent)" },
  {
    icon: "ti-circle-check",
    label: "Evaluación",
    color: "var(--color-done-dot)",
  },
  {
    icon: "ti-chart-bar",
    label: "Informes",
    color: "var(--color-act-dot-foro)",
  },
  {
    icon: "ti-info-circle",
    label: "Centro de información",
    color: "var(--color-accent-navy)",
  },
  {
    icon: "ti-news",
    label: "Revistas de investigación",
    color: "var(--color-progress-fill-from)",
  },
];

const NEXT_ACTIVITIES = [
  {
    type: "foro",
    label: "Foro",
    title: "Foro de diagnóstico",
    date: "28 may 2026",
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

/**
 * Datos mock del progreso.
 * Se reemplazan cuando el cronograma llame a window.uvegUpdateProgress(data).
 *
 * Estructura esperada:
 * {
 *   pct:          number,              // 0-100
 *   completadas:  number,              // actividades completadas del cronograma
 *   recomendadas: number,              // actividades que debías llevar a esta fecha
 *   estado:       'bien'|'regular'|'atrasado'
 * }
 */
const PROGRESO_DEFAULT = {
  pct: 70,
  completadas: 5,
  recomendadas: 7,
  estado: "bien",
};

/**
 * Config visual por estado — iconos Tabler, sin emojis.
 */
const PROGRESO_CONFIG = {
  bien: {
    stroke: "#22c55e",
    badgeBg: "#f0fdf4",
    badgeColor: "#166534",
    badgeIcon: "ti-mood-happy",
    badgeText: "Al día",
    msg: "Avanzando muy bien",
  },
  regular: {
    stroke: "#f59e0b",
    badgeBg: "#fffbeb",
    badgeColor: "#92400e",
    badgeIcon: "ti-mood-empty",
    badgeText: "Regular",
    msg: "Vas un poco atrasado",
  },
  atrasado: {
    stroke: "#ef4444",
    badgeBg: "#fef2f2",
    badgeColor: "#991b1b",
    badgeIcon: "ti-mood-sad",
    badgeText: "Atrasado",
    msg: "Necesitas ponerte al día",
  },
};

/* ── Helpers SVG ─────────────────────────────────────────────── */
// Radio = 26, circunferencia = 2π·26 ≈ 163.36
function _progresoDash(pct) {
  const c = 2 * Math.PI * 26;
  const fill = (pct / 100) * c;
  return `${fill.toFixed(1)} ${(c - fill).toFixed(1)}`;
}

class UvegSidebar extends HTMLElement {
  static get observedAttributes() {
    return ["user-name", "user-role", "user-initials", "active-item"];
  }

  constructor() {
    super();
    this._collapsed = false;
    this._blocks = {
      progreso: false,
      menu: false,
      actividades: true,
    };
    this._progreso = { ...PROGRESO_DEFAULT };
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._bindEvents();
    this._registerGlobalAPI();
    this.style.width = `${EXPANDED_WIDTH}px`;
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

        <nav class="sb-nav" role="navigation" aria-label="Navegación principal">
          ${NAV_ITEMS.map((item) => this._renderNavItem(item, activeItem)).join("")}
          <div class="sb-sep" role="separator"></div>
          ${NAV_ITEMS_BOTTOM.map((item) => this._renderNavItem(item, activeItem)).join("")}
          <div class="sb-sep" role="separator"></div>
          <div class="sb-section-label" aria-hidden="true">Bloques</div>
          ${this._renderBlock("progreso", "ti-chart-donut", "Mi Progreso", this._renderBlockProgreso())}
          ${this._renderBlock("menu", "ti-menu-2", "Mi Menú", this._renderBlockMenu())}
          ${this._renderBlock("actividades", "ti-calendar-event", "Próximas actividades", this._renderBlockActividades())}
        </nav>

        <button class="sb-collapse" id="sb-toggle"
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
           data-key="${item.key}" role="button" tabindex="0"
           aria-current="${isActive ? "page" : "false"}"
           aria-label="${item.label}">
        <i class="ti ${item.icon}" aria-hidden="true"></i>
        <span class="sb-label">${item.label}</span>
        ${badge}
        <span class="sb-tooltip" aria-hidden="true">${item.label}</span>
      </div>
    `;
  }

  _renderBlock(key, icon, label, bodyHtml) {
    const isOpen = this._blocks[key];
    return `
      <div class="sb-block" data-block="${key}">
        <div class="sb-block-header" role="button" tabindex="0"
             aria-expanded="${isOpen}" aria-controls="sb-block-body-${key}">
          <i class="ti ${icon}" aria-hidden="true"></i>
          <span class="sb-label sb-block-label">${label}</span>
          <i class="ti ti-chevron-down sb-block-chevron ${isOpen ? "open" : ""}" aria-hidden="true"></i>
        </div>
        <div class="sb-block-wrap" id="sb-block-wrap-${key}" style="height:0;overflow:hidden">
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

  /* ── Bloque: Mi Progreso ────────────────────────────────── */

  _renderBlockProgreso() {
    const { pct, completadas, recomendadas, estado } = this._progreso;
    const cfg = PROGRESO_CONFIG[estado] || PROGRESO_CONFIG.bien;
    const dash = _progresoDash(pct);

    return `
      <div class="sb-prog-card" id="sb-prog-card" data-estado="${estado}">

        <!-- Círculo SVG -->
        <div class="sb-prog-circle" aria-label="${pct}% de avance">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26"
              fill="none" stroke="var(--color-border)" stroke-width="4"/>
            <circle id="sb-prog-arc" cx="32" cy="32" r="26"
              fill="none"
              stroke="${cfg.stroke}"
              stroke-width="4"
              stroke-dasharray="${dash}"
              stroke-dashoffset="0"
              stroke-linecap="round"
              transform="rotate(-90 32 32)"/>
          </svg>
          <span class="sb-prog-pct" id="sb-prog-pct">${pct}%</span>
        </div>

        <!-- Badge de estado -->
        <span class="sb-prog-badge" id="sb-prog-badge"
              style="background:${cfg.badgeBg};color:${cfg.badgeColor}">
          <i class="ti ${cfg.badgeIcon}" aria-hidden="true"></i>
          ${cfg.badgeText}
        </span>

        <!-- Mensaje -->
        <div class="sb-prog-msg" id="sb-prog-msg">${cfg.msg}</div>

        <!-- Subtexto cronograma -->
        <div class="sb-prog-sub" id="sb-prog-sub">
          ${completadas} de ${recomendadas} actividades recomendadas
        </div>

        <!-- Link cronograma -->
        <button class="sb-prog-link" id="sb-prog-link">
          Ver cronograma
          <i class="ti ti-arrow-right" style="font-size:10px" aria-hidden="true"></i>
        </button>

      </div>
    `;
  }

  /* ── Actualizar progreso sin re-render ──────────────────── */

  _updateProgresoDOM(prev) {
    const { pct, completadas, recomendadas, estado } = this._progreso;
    const cfg = PROGRESO_CONFIG[estado] || PROGRESO_CONFIG.bien;
    const card = this.querySelector("#sb-prog-card");
    if (!card) return;

    card.dataset.estado = estado;

    // Arco SVG animado
    const arc = card.querySelector("#sb-prog-arc");
    if (arc) {
      arc.setAttribute("stroke", cfg.stroke);
      this._animateArc(arc, prev.pct, pct);
    }

    // Porcentaje animado
    const pctEl = card.querySelector("#sb-prog-pct");
    if (pctEl) this._animatePct(pctEl, prev.pct, pct);

    // Badge
    const badge = card.querySelector("#sb-prog-badge");
    if (badge) {
      badge.style.background = cfg.badgeBg;
      badge.style.color = cfg.badgeColor;
      badge.innerHTML = `<i class="ti ${cfg.badgeIcon}" aria-hidden="true"></i> ${cfg.badgeText}`;
    }

    // Mensaje y subtexto
    const msg = card.querySelector("#sb-prog-msg");
    if (msg) msg.textContent = cfg.msg;

    const sub = card.querySelector("#sb-prog-sub");
    if (sub)
      sub.textContent = `${completadas} de ${recomendadas} actividades recomendadas`;

    // Rebote en la tarjeta
    this._bounceCard(card);

    // Recalcular altura del wrap si el bloque está abierto
    if (this._blocks.progreso) {
      const wrap = this.querySelector("#sb-block-wrap-progreso");
      const inner = this.querySelector("#sb-block-inner-progreso");
      if (wrap && inner)
        requestAnimationFrame(() => {
          wrap.style.height = inner.scrollHeight + "px";
        });
    }
  }

  _animateArc(arc, fromPct, toPct) {
    if (!arc) return;
    if (arc._arcRaf) cancelAnimationFrame(arc._arcRaf);
    let cur = fromPct,
      vel = 0;
    const tick = () => {
      vel = (vel + (toPct - cur) * 0.08) * 0.8;
      cur += vel;
      arc.setAttribute("stroke-dasharray", _progresoDash(cur));
      if (Math.abs(cur - toPct) > 0.2 || Math.abs(vel) > 0.2) {
        arc._arcRaf = requestAnimationFrame(tick);
      } else {
        arc.setAttribute("stroke-dasharray", _progresoDash(toPct));
        arc._arcRaf = null;
      }
    };
    tick();
  }

  _animatePct(el, fromPct, toPct) {
    if (!el) return;
    if (el._pctRaf) cancelAnimationFrame(el._pctRaf);
    let cur = fromPct,
      vel = 0;
    const tick = () => {
      vel = (vel + (toPct - cur) * 0.08) * 0.8;
      cur += vel;
      el.textContent = Math.round(cur) + "%";
      if (Math.abs(cur - toPct) > 0.3 || Math.abs(vel) > 0.3) {
        el._pctRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = toPct + "%";
        el._pctRaf = null;
      }
    };
    tick();
  }

  _bounceCard(el) {
    if (!el) return;
    el.style.transform = "scale(0.96)";
    el.style.transition = "transform 0ms";
    requestAnimationFrame(() => {
      el.style.transition = "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scale(1)";
    });
  }

  /* ── API global: window.uvegUpdateProgress ──────────────── */

  _registerGlobalAPI() {
    window.uvegUpdateProgress = (data) => {
      const prev = { ...this._progreso };
      this._progreso = {
        ...this._progreso,
        ...data,
        estado:
          data.estado ||
          this._inferEstado(
            data.pct ?? this._progreso.pct,
            data.completadas,
            data.recomendadas,
          ),
      };
      this._updateProgresoDOM(prev);
    };
  }

  _inferEstado(pct, completadas, recomendadas) {
    if (completadas == null || recomendadas == null) {
      if (pct >= 70) return "bien";
      if (pct >= 40) return "regular";
      return "atrasado";
    }
    if (completadas >= recomendadas) return "bien";
    if (completadas >= recomendadas * 0.6) return "regular";
    return "atrasado";
  }

  /* ── Bloques: Menú y Actividades ────────────────────────── */

  _renderBlockMenu() {
    const items = MENU_ITEMS.map(
      (item, idx) => `
      <div class="sb-menu-item" role="button" tabindex="0"
           aria-label="${item.label}" data-menu-idx="${idx}">
        <!-- Círculo con color único por ítem -->
        <div class="sb-menu-icon" aria-hidden="true"
             style="--item-color:${item.color}">
          <i class="ti ${item.icon}"></i>
        </div>
       <span class="sb-menu-label">${item.label}</span>
        <i class="ti ti-chevron-right sb-menu-arrow" aria-hidden="true"></i>
      </div>
    `,
    ).join("");
    return `<div class="sb-menu-dock" id="sb-menu-dock">${items}</div>`;
  }

  _renderBlockActividades() {
    const items = NEXT_ACTIVITIES.map(
      (act) => `
      <div class="sb-act-item" role="button" tabindex="0" aria-label="${act.title}, ${act.date}">
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
      const header = this.querySelector(
        `[data-block="${key}"] .sb-block-header`,
      );
      if (!wrap || !inner) return;
      // Todos nacen cerrados visualmente — liquidOpen hace la entrada animada
      setTimeout(() => {
        liquidOpen(wrap, inner);
        this._bounceHeader(header);
      }, 120);
    });
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    this.addEventListener("click", this._handleClick.bind(this));
    this.addEventListener("keydown", this._handleKeydown.bind(this));
  }

  _handleClick(e) {
    if (e.target.closest("#sb-toggle")) {
      this._toggleCollapse();
      return;
    }
    const header = e.target.closest(".sb-block-header");
    if (header) {
      const block = header.closest(".sb-block");
      if (block) {
        if (this._collapsed) {
          this._expandToBlock(block.dataset.block);
        } else {
          this._toggleBlock(block.dataset.block);
        }
      }
      return;
    }
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
    header?.setAttribute("aria-expanded", String(!isOpen));
    chevron?.classList.toggle("open", !isOpen);

    if (!isOpen) {
      // Abrir — liquidOpen + rebote en el header
      liquidOpen(wrap, inner);
      this._bounceHeader(header);
    } else {
      // Cerrar — mismas constantes que el HTML original (0.3 * 0.66)
      if (wrap._liquidRaf) cancelAnimationFrame(wrap._liquidRaf);
      inner.style.transition = ""; // limpiar por si _openInitial dejó "none"
      let vel = 0,
        cur = parseFloat(wrap.style.height) || inner.scrollHeight;
      let sv = 0,
        sc = 1;
      let ov = 0,
        oc = 1;
      inner.style.transformOrigin = "top center";
      const tick = () => {
        vel = (vel + (0 - cur) * 0.3) * 0.66;
        cur += vel;
        sv = (sv + (0.7 - sc) * 0.3) * 0.66;
        sc += sv;
        ov = (ov + (0 - oc) * 0.3) * 0.66;
        oc += ov;
        wrap.style.height = `${Math.max(cur, 0)}px`;
        inner.style.transform = `scaleY(${Math.max(sc, 0.7)})`;
        inner.style.opacity = `${Math.max(oc, 0)}`;
        if (cur > 0.4 || Math.abs(vel) > 0.4) {
          wrap._liquidRaf = requestAnimationFrame(tick);
        } else {
          wrap.style.height = "0px";
          inner.style.transform = "scaleY(0.7)";
          inner.style.opacity = "0";
          wrap._liquidRaf = null;
        }
      };
      tick();
    }
  }

  _bounceHeader(el) {
    if (!el) return;
    el.style.transform = "scale(0.94)";
    el.style.transition = "transform 0ms";
    requestAnimationFrame(() => {
      el.style.transition = "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = "scale(1)";
    });
  }

  /* ── Expandir sidebar hacia un bloque específico ────────── */

  _expandToBlock(key) {
    if (!key || !(key in this._blocks)) return;

    this._blocks[key] = true;
    this._collapsed = false;

    const sidebar = this.querySelector(".sidebar");
    const toggleBtn = this.querySelector("#sb-toggle");

    toggleBtn?.setAttribute("aria-expanded", "true");
    toggleBtn?.setAttribute("aria-label", "Colapsar sidebar");
    sidebar.classList.remove("collapsed");

    springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
      requestAnimationFrame(() => {
        sidebar.classList.add("sb-opening");
        setTimeout(() => sidebar.classList.remove("sb-opening"), 420);
        this._openInitial();
        const targetHeader = this.querySelector(
          `[data-block="${key}"] .sb-block-header`,
        );
        this._bounceHeader(targetHeader);
        const targetBlock = this.querySelector(`[data-block="${key}"]`);
        if (targetBlock) {
          setTimeout(() => {
            targetBlock.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }, 120);
        }
      });
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
      sidebar.classList.remove("collapsed");
      springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
        requestAnimationFrame(() => this._openInitial());
      });
    }
  }

  _getBlocksSection() {
    return [
      ...this.querySelectorAll(".sb-block"),
      ...this.querySelectorAll(".sb-section-label"),
      this.querySelectorAll(".sb-sep")[1],
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
