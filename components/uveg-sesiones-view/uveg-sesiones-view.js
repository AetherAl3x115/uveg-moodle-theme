/**
 * components/uveg-sesiones-view/uveg-sesiones-view.js
 *
 * Muestra las sesiones BBB de un asesor o tutor.
 * Mismo patrón que uveg-lesson-view: show(detail) / hide().
 *
 * El botón "Sesiones" de uveg-sidebar dispara el evento
 * uveg:opensesiones con { person } donde person tiene:
 *   {
 *     initials : 'DP',
 *     name     : 'Daniel Pérez',
 *     role     : 'asesor' | 'tutor',
 *     email    : 'danperezm@uveg.edu.mx',
 *     phone    : '4493069160',       // opcional
 *     sessions : [                   // sesiones programadas / pasadas
 *       {
 *         id      : 'bbb-001',
 *         title   : 'Clase demo',
 *         date    : 'Hoy, 4:00 pm',
 *         group   : 'Todos los participantes',
 *         duration: '—',             // '52 min' si ya finalizó
 *         status  : 'live' | 'upcoming' | 'past',
 *         url     : 'https://bbb.uveg.edu.mx/...',
 *       }
 *     ],
 *     recordings: [                  // grabaciones disponibles
 *       {
 *         id      : 'rec-001',
 *         title   : 'Sesión de retroalimentación',
 *         date    : '2 jun 2025',
 *         duration: '52 min',
 *         url     : 'https://bbb.uveg.edu.mx/...',
 *       }
 *     ]
 *   }
 *
 * Para el demo, show() puede recibir datos hardcodeados.
 * Cuando se conecte con Moodle/BBB, solo cambia el origen del objeto.
 */

import { hi } from "../../js/utils/icons.js";

const ROLE_LABEL = { asesor: "Asesor", tutor: "Tutor" };
const ROLE_ICON = { asesor: "profile", tutor: "academic-cap" };

const STATUS_BADGE = {
  live: { cls: "sv-badge-live", label: "En vivo" },
  upcoming: { cls: "sv-badge-upcoming", label: "Próxima" },
  past: { cls: "sv-badge-past", label: "Finalizada" },
};
const DOT_CLS = {
  live: "sv-dot-live sv-dot-pulse",
  upcoming: "sv-dot-upcoming",
  past: "sv-dot-past",
};

const DEMO_SESSIONS = [
  {
    id: "bbb-001",
    title: "Clase demo — Planeación estratégica",
    date: "Hoy, 4:00 pm",
    group: "Todos los participantes",
    duration: "—",
    status: "live",
    url: "#",
  },
  {
    id: "bbb-002",
    title: "Sesión de retroalimentación — Módulo 1",
    date: "Lun 2 jun, 3:00 pm",
    group: "Todos los participantes",
    duration: "52 min",
    status: "past",
    url: "#",
  },
  {
    id: "bbb-003",
    title: "Asesoría individual — Proyecto integrador",
    date: "Vie 13 jun, 5:00 pm",
    group: "Grupo A",
    duration: "—",
    status: "upcoming",
    url: "#",
  },
];

const DEMO_RECORDINGS = [
  {
    id: "rec-001",
    title: "Sesión de retroalimentación — Módulo 1",
    date: "2 jun 2025",
    duration: "52 min",
    url: "#",
  },
  {
    id: "rec-002",
    title: "Clase demo — Módulo 0 introducción",
    date: "26 may 2025",
    duration: "1h 08 min",
    url: "#",
  },
];

class UvegSesionesView extends HTMLElement {
  connectedCallback() {
    this.style.display = "none";
  }

  show(detail = {}) {
    this._detail = detail;
    this.style.display = "block";
    this._render();
    this._bindEvents();
  }

  hide() {
    this.style.display = "none";
    this.innerHTML = "";
    this._detail = null;
  }

  _render() {
    const d = this._detail || {};

    // Persona — fallback demo si no viene data
    const initials = d.initials || "DP";
    const name = d.name || "Daniel Pérez";
    const role = d.role || "asesor";
    const email = d.email || "danperezm@uveg.edu.mx";
    const phone = d.phone || null;
    const sessions = Array.isArray(d.sessions) ? d.sessions : DEMO_SESSIONS;
    const recordings = Array.isArray(d.recordings)
      ? d.recordings
      : DEMO_RECORDINGS;

    const roleLabel = ROLE_LABEL[role] || "Asesor";
    const roleIcon = ROLE_ICON[role] || "profile";

    this.innerHTML = `
      <div class="sv-root">
      <!-- Regresar -->
     <button class="sv-back" type="button" data-sv-back>
        <span class="sv-back-icon">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </span>
        Regresar al módulo
      </button>

      <!-- Hero -->
      <div class="sv-hero">
        <div class="sv-hero-avatar">${initials}</div>
        <div class="sv-hero-info">
          <div class="sv-hero-role">
            ${hi(roleIcon, 11)}
            ${roleLabel}
          </div>
          <div class="sv-hero-name">${name}</div>
          <div class="sv-hero-chips">
            <span class="sv-chip">
              ${hi("mail", 10)}
              ${email}
            </span>
            ${phone ? `<span class="sv-chip">${hi("phone", 10)} ${phone}</span>` : ""}
          </div>
        </div>
      </div>

      <!-- Sesiones programadas -->
      <div class="sv-section-label">Sesiones programadas</div>
      <div class="sv-card">
        ${
          sessions.length
            ? sessions.map((s) => this._renderSession(s)).join("")
            : `<div class="sv-empty">
               ${hi("calendar", 28)}
               Sin sesiones programadas
             </div>`
        }
      </div>

      <hr class="sv-divider">

      <!-- Grabaciones -->
      <div class="sv-section-label">Grabaciones disponibles</div>
      ${
        recordings.length
          ? recordings.map((r) => this._renderRecording(r)).join("")
          : `<div class="sv-card">
             <div class="sv-empty">
               ${hi("video", 28)}
               Sin grabaciones disponibles
             </div>
           </div>`
      }
    </div>
    `;
  }

  _renderSession(s) {
    const badge = STATUS_BADGE[s.status] || STATUS_BADGE.past;
    const dot = DOT_CLS[s.status] || "sv-dot-past";
    const isLive = s.status === "live";

    const btnLabel = isLive
      ? `${hi("play", 11)} Ingresar`
      : `${hi("arrow-right", 11)} Abrir`;
    const btnCls = isLive ? "sv-btn-bbb sv-btn-bbb-primary" : "sv-btn-bbb";

    return `
      <div class="sv-row">
        <span class="sv-dot ${dot}"></span>
        <div class="sv-row-info">
          <div class="sv-row-title">${s.title}</div>
          <div class="sv-row-meta">
            <span>${hi("calendar", 10)} ${s.date}</span>
            ${s.group ? `<span>${hi("users", 10)} ${s.group}</span>` : ""}
            ${s.duration !== "—" ? `<span>${hi("clock", 10)} ${s.duration}</span>` : ""}
          </div>
        </div>
        <span class="sv-badge ${badge.cls}">${badge.label}</span>
        <a class="${btnCls}" href="${s.url}" target="_blank" rel="noopener noreferrer">
          ${btnLabel}
        </a>
      </div>
    `;
  }

  _renderRecording(r) {
    return `
      <div class="sv-rec-card">
        <div class="sv-rec-header">
          ${hi("video", 14)}
          <span class="sv-rec-title">${r.title}</span>
          <span class="sv-rec-date">${r.date}</span>
        </div>
        <div class="sv-rec-body">
          <span class="sv-rec-duration">
            ${hi("clock", 10)} ${r.duration}
          </span>
          <span class="sv-rec-host">Alojado en BigBlueButton</span>
          <a class="sv-btn-bbb" href="${r.url}" target="_blank" rel="noopener noreferrer">
            ${hi("arrow-right", 11)} Abrir grabación
          </a>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.querySelector("[data-sv-back]")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("uveg:sesionesback", { bubbles: true, composed: true }),
      );
    });
  }
}

customElements.define("uveg-sesiones-view", UvegSesionesView);
