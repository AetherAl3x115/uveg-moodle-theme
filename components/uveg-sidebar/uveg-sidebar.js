/**
 * components/uveg-sidebar/uveg-sidebar.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-sidebar>
 * Iconografía: Heroicons 2 Outline via js/utils/icons.js
 */

import { springWidth, liquidOpen, liquidClose } from "../../js/utils/spring.js";
import { hi } from "../../js/utils/icons.js";

const NAV_ITEMS = [
  { key: "dashboard", icon: "dashboard", label: "Escritorio" },
  { key: "modulos", icon: "modules", label: "Módulos" },
  { key: "cursos", icon: "courses", label: "Mis Cursos" },
  { key: "mensajes", icon: "messages", label: "Mensajes", badge: 3 },
];

const NAV_ITEMS_BOTTOM = [
  { key: "perfil", icon: "profile", label: "Mi perfil" },
  { key: "config", icon: "settings", label: "Configuración" },
];

const MENU_ITEMS = [
  { icon: "home", label: "Inicio", color: "var(--color-act-dot-actividad)" },
  { icon: "book", label: "Módulos", color: "var(--color-accent)" },
  { icon: "check-circle", label: "Evaluación", color: "var(--color-done-dot)" },
  { icon: "chart-bar", label: "Informes", color: "var(--color-act-dot-foro)" },
  {
    icon: "info-circle",
    label: "Centro de información",
    color: "var(--color-accent-navy)",
  },
  {
    icon: "newspaper",
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

const ADVISOR_DATA = [
  {
    role: "asesor",
    roleLabel: "Asesor",
    roleIcon: "profile",
    initials: "DP",
    name: "Daniel Pérez",
    email: "danperezm@uveg.edu.mx",
    phone: "4493069160",
    sessionsUrl: "#sesiones-asesor",
  },
  {
    role: "tutor",
    roleLabel: "Tutor",
    roleIcon: "courses",
    initials: "LA",
    name: "Lucía de los Ángeles",
    email: "lumanuell@uveg.edu.mx",
    phone: null,
    sessionsUrl: "#sesiones-tutor",
  },
];

const COLLAPSED_WIDTH = 58;
const EXPANDED_WIDTH = 248;

const PROGRESO_DEFAULT = {
  pct: 70,
  completadas: 5,
  recomendadas: 7,
  estado: "bien",
};

const PROGRESO_CONFIG = {
  bien: {
    stroke: "#22c55e",
    badgeBg: "#f0fdf4",
    badgeColor: "#166534",
    badgeIcon: "mood-happy",
    badgeText: "Al día",
    msg: "Avanzando muy bien",
  },
  regular: {
    stroke: "#f59e0b",
    badgeBg: "#fffbeb",
    badgeColor: "#92400e",
    badgeIcon: "mood-neutral",
    badgeText: "Regular",
    msg: "Vas un poco atrasado",
  },
  atrasado: {
    stroke: "#ef4444",
    badgeBg: "#fef2f2",
    badgeColor: "#991b1b",
    badgeIcon: "mood-sad",
    badgeText: "Atrasado",
    msg: "Necesitas ponerte al día",
  },
};

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
      advisor: false,
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
          ${this._renderBlock("progreso", "chart-pie", "Mi Progreso", this._renderBlockProgreso())}
          ${this._renderBlock("menu", "bars-3", "Mi Menú", this._renderBlockMenu())}
          ${this._renderBlock("actividades", "calendar-days", "Próximas actividades", this._renderBlockActividades())}
        </nav>

        ${this._renderBlockAdvisor()}

        <button class="sb-collapse" id="sb-toggle"
          aria-label="${this._collapsed ? "Expandir sidebar" : "Colapsar sidebar"}"
          aria-expanded="${!this._collapsed}">
          ${hi("collapse", 16)}
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
        ${hi(item.icon, 18)}
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
          ${hi(icon, 18)}
          <span class="sb-label sb-block-label">${label}</span>
          <span class="sb-block-chevron ${isOpen ? "open" : ""}" aria-hidden="true">
            ${hi("chevron-down", 14)}
          </span>
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

        <span class="sb-prog-badge" id="sb-prog-badge"
              style="background:${cfg.badgeBg};color:${cfg.badgeColor}">
          ${hi(cfg.badgeIcon, 13)}
          ${cfg.badgeText}
        </span>

        <div class="sb-prog-msg" id="sb-prog-msg">${cfg.msg}</div>

        <div class="sb-prog-sub" id="sb-prog-sub">
          ${completadas} de ${recomendadas} actividades recomendadas
        </div>

        <button class="sb-prog-link" id="sb-prog-link">
          Ver cronograma
          ${hi("arrow-right", 10)}
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

    const arc = card.querySelector("#sb-prog-arc");
    if (arc) {
      arc.setAttribute("stroke", cfg.stroke);
      this._animateArc(arc, prev.pct, pct);
    }

    const pctEl = card.querySelector("#sb-prog-pct");
    if (pctEl) this._animatePct(pctEl, prev.pct, pct);

    const badge = card.querySelector("#sb-prog-badge");
    if (badge) {
      badge.style.background = cfg.badgeBg;
      badge.style.color = cfg.badgeColor;
      badge.innerHTML = `${hi(cfg.badgeIcon, 13)} ${cfg.badgeText}`;
    }

    const msg = card.querySelector("#sb-prog-msg");
    if (msg) msg.textContent = cfg.msg;

    const sub = card.querySelector("#sb-prog-sub");
    if (sub)
      sub.textContent = `${completadas} de ${recomendadas} actividades recomendadas`;

    this._bounceCard(card);

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
         <div class="sb-menu-icon" aria-hidden="true" style="--item-color:${item.color}">
        ${hi(item.icon, 15)}
      </div>
        <span class="sb-menu-label">${item.label}</span>
        ${hi("chevron-right", 14, "sb-menu-arrow")}
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
        ${hi("calendar", 14)}
        Ver calendario completo
      </div>
    `;
  }

  /* ── Bloque: Mi Asesor / Tutor ──────────────────────────── */

  _renderBlockAdvisor() {
    const isOpen = this._blocks.advisor;

    const closedHtml = `
      <div class="sb-advisor-closed" id="sb-advisor-closed"
           role="button" tabindex="0" aria-label="Ver asesor y tutor"
           style="${isOpen ? "display:none" : ""}">
        <div class="sb-advisor-stack" aria-hidden="true">
          <div class="sb-advisor-av sb-advisor-av--asesor">${ADVISOR_DATA[0].initials}</div>
          <div class="sb-advisor-av sb-advisor-av--tutor">${ADVISOR_DATA[1].initials}</div>
        </div>
        <div class="sb-advisor-closed-info">
          <div class="sb-advisor-closed-names">${ADVISOR_DATA[0].name.split(" ")[0]} · ${ADVISOR_DATA[1].name.split(" ")[0]}</div>
          <div class="sb-advisor-closed-sub">Asesor y tutor</div>
        </div>
        ${hi("chevron-down", 14, "sb-advisor-closed-ch")}
      </div>
    `;

    const personsHtml = ADVISOR_DATA.map(
      (p) => `
      <div class="sb-advisor-person">
        <div class="sb-advisor-person-top">
          <div class="sb-advisor-av-wrap">
            <div class="sb-advisor-av sb-advisor-av--${p.role}">${p.initials}</div>
            <div class="sb-advisor-av-dot sb-advisor-av-dot--${p.role}" aria-hidden="true"></div>
          </div>
          <div class="sb-advisor-meta">
            <div class="sb-advisor-role">
              ${hi(p.roleIcon, 12)}
              ${p.roleLabel}
            </div>
            <div class="sb-advisor-name">${p.name}</div>
            <div class="sb-advisor-email">
              ${hi("mail", 11)}${p.email}
            </div>
            ${
              p.phone
                ? `
            <div class="sb-advisor-phone">
              ${hi("phone", 11)}${p.phone}
            </div>`
                : ""
            }
          </div>
        </div>
        <div class="sb-advisor-actions">
          <button class="sb-advisor-btn sb-advisor-btn--msg"
                  aria-label="Enviar mensaje a ${p.name}"
                  onclick="window.location.href='mailto:${p.email}'">
            ${hi("message", 14)}
            Mensaje
          </button>
          <button class="sb-advisor-btn sb-advisor-btn--sessions"
                  aria-label="Ver sesiones grabadas de ${p.name}"
                  data-sv-open
                  data-sv-person='${JSON.stringify({ initials: p.initials, name: p.name, role: p.role, email: p.email, phone: p.phone })}'>
            <span class="sb-sessions-icon-wrap">
              ${hi("video", 14)}
              <span class="sb-sessions-dot" aria-hidden="true"></span>
            </span>
            Sesiones
          </button>
        </div>
      </div>
    `,
    ).join("");

    const openHtml = `
      <div class="sb-advisor-open" id="sb-advisor-open"
           style="${isOpen ? "" : "display:none"}">
        <div class="sb-advisor-open-hdr"
             role="button" tabindex="0" aria-label="Cerrar panel asesor y tutor">
          ${hi("users", 16)}
          <span class="sb-advisor-open-title">Mi asesor / tutor</span>
          ${hi("chevron-up", 14, "sb-advisor-open-ch")}
        </div>
        <div class="sb-advisor-body-wrap" id="sb-advisor-body-wrap"
             style="height:0;overflow:hidden">
          <div class="sb-advisor-body-inner" id="sb-advisor-body-inner"
               style="transform:scaleY(0.92);opacity:0;transform-origin:top center">
            ${personsHtml}
          </div>
        </div>
      </div>
    `;

    return `
      <div class="sb-advisor-wrap" id="sb-advisor-wrap" data-block="advisor">
        ${closedHtml}
        ${openHtml}
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
    const advisorClosed = e.target.closest("#sb-advisor-closed");
    if (advisorClosed) {
      if (this._collapsed) {
        this._expandToBlock("advisor");
      } else {
        this._toggleAdvisor(true);
      }
      return;
    }
    const advisorOpenHdr = e.target.closest(".sb-advisor-open-hdr");
    if (advisorOpenHdr) {
      this._toggleAdvisor(false);
      return;
    }
    const sesionesBtn = e.target.closest("[data-sv-open]");
    if (sesionesBtn) {
      const person = JSON.parse(sesionesBtn.dataset.svPerson);
      this.dispatchEvent(
        new CustomEvent("uveg:opensesiones", {
          bubbles: true,
          composed: true,
          detail: { person },
        }),
      );
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
      liquidOpen(wrap, inner);
      this._bounceHeader(header);
    } else {
      if (wrap._liquidRaf) cancelAnimationFrame(wrap._liquidRaf);
      inner.style.transition = "";
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

  /* ── Toggle advisor ─────────────────────────────────────── */

  _toggleAdvisor(open) {
    const closed = this.querySelector("#sb-advisor-closed");
    const openEl = this.querySelector("#sb-advisor-open");
    const wrap = this.querySelector("#sb-advisor-body-wrap");
    const inner = this.querySelector("#sb-advisor-body-inner");
    if (!closed || !openEl || !wrap || !inner) return;

    this._blocks.advisor = open;

    if (open) {
      closed.style.display = "none";
      openEl.style.display = "block";
      liquidOpen(wrap, inner);
    } else {
      if (wrap._liquidRaf) cancelAnimationFrame(wrap._liquidRaf);
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
          openEl.style.display = "none";
          closed.style.display = "flex";
        }
      };
      tick();
    }
  }

  /* ── Expandir sidebar hacia un bloque específico ────────── */

  _expandToBlock(key) {
    if (!key) return;
    if (key === "advisor") {
      this._blocks.advisor = true;
      this._collapsed = false;
      const sidebar = this.querySelector(".sidebar");
      const toggleBtn = this.querySelector("#sb-toggle");
      toggleBtn?.setAttribute("aria-expanded", "true");
      toggleBtn?.setAttribute("aria-label", "Colapsar sidebar");
      sidebar.classList.remove("collapsed");
      springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
        requestAnimationFrame(() => {
          this._toggleAdvisor(true);
        });
      });
      return;
    }
    if (!(key in this._blocks)) return;

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
      if (this._blocks.advisor) {
        const advisorOpen = this.querySelector("#sb-advisor-open");
        const advisorClosed = this.querySelector("#sb-advisor-closed");
        const wrap = this.querySelector("#sb-advisor-body-wrap");
        const inner = this.querySelector("#sb-advisor-body-inner");
        if (advisorOpen && advisorClosed && wrap && inner) {
          wrap.style.height = "0px";
          inner.style.transform = "scaleY(0.92)";
          inner.style.opacity = "0";
          advisorOpen.style.display = "none";
          advisorClosed.style.display = "flex";
          this._blocks.advisor = false;
        }
      }
      sidebar.classList.add("collapsed");
      springWidth(this, COLLAPSED_WIDTH);
    } else {
      sidebar.classList.remove("collapsed");
      springWidth(this, EXPANDED_WIDTH, 0.18, 0.68, () => {
        requestAnimationFrame(() => this._openInitial());
      });
    }
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
