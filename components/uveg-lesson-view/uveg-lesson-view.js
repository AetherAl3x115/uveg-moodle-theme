/**
 * components/uveg-lesson-view/uveg-lesson-view.js
 */

import { liquidOpen, liquidClose } from "../../js/utils/spring.js";

class UvegLessonView extends HTMLElement {
  connectedCallback() {
    this.style.display = "none";
  }

  show(detail = {}) {
    this._detail = detail;
    this._activeTab = 0;
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
    const title = d.title || "Actividad";
    const type = d.type || "lesson";
    const state = d.state || "progress";
    const dateEnd = d.dateEnd || "—";
    const attempts = d.attempts ?? 3; // hardcodeado demo — cambiar a 1 en producción
    const isReto = type === "reto";
    const tag = isReto ? "Reto integrador" : "Paquete SCORM · Lección";

    const stateLabel =
      { pending: "Pendiente", progress: "En progreso", done: "Completada" }[
        state
      ] || "En progreso";

    const btnLabel =
      state === "done"
        ? "Ver lección completa"
        : state === "pending"
          ? "Actividad bloqueada"
          : isReto
            ? "Ver instrucciones del Reto"
            : attempts === 1
              ? "Iniciar actividad"
              : "Continuar actividad";

    const btnDisabled = state === "pending" ? "disabled" : "";

    const dateStr =
      dateEnd !== "—"
        ? dateEnd
        : new Date().toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

    // Fila de tabla — intento 1 aprobado (demo)
    const score1 = 85;
    const makeTableRow = (num) => `
      <tr>
        <td><span class="lv-inum lv-inum-pass">${num}</span></td>
        <td>
          <div class="lv-attempt-score">
            <svg viewBox="0 0 24 24" class="lv-face lv-face-pass"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            <span class="lv-ccal lv-ccal-good">${score1} / 100</span>
          </div>
        </td>
        <td style="color:var(--color-text-faint)">Intento más alto</td>
        <td style="color:var(--color-text-faint)">${dateStr}</td>
      </tr>`;

    // Cards accordion — estados fijos para demo
    const DEMO_SCORES = [29, 0]; // intento 2 reprobado, intento 3 sin calificar
    const makeAttemptRow = (num) => {
      const score = DEMO_SCORES[num - 2] ?? 0;
      const noScore = score === 0;
      const pass = !noScore && score >= 70;
      const fail = !noScore && score < 70;
      const inumClass = pass
        ? "lv-inum lv-inum-pass"
        : fail
          ? "lv-inum lv-inum-fail"
          : "lv-inum";
      const calClass = pass
        ? "lv-ccal lv-ccal-good"
        : fail
          ? "lv-ccal lv-ccal-fail"
          : "lv-ccal lv-ccal-zero";
      const faceIcon = pass
        ? `<svg viewBox="0 0 24 24" class="lv-face lv-face-pass"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
        : fail
          ? `<svg viewBox="0 0 24 24" class="lv-face lv-face-fail"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
          : "";
      return `
      <div class="lv-attempt-card">
        <span class="${inumClass}">${num}</span>
        <div class="lv-attempt-info">
          <div class="lv-attempt-label">Intento ${num}</div>
          <div class="lv-attempt-date">${dateStr}</div>
        </div>
        <div class="lv-attempt-score">
          ${faceIcon}
          <span class="${calClass}">${score} / 100</span>
        </div>
      </div>`;
    };

    this.innerHTML = `
      <div class="lv-root">

        <!-- Regresar -->
        <button class="lv-back" data-lv-back>
          <span class="lv-back-icon">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </span>
          Regresar al módulo
        </button>

        <!-- Hero -->
        <div class="lv-hero">
          <div class="lv-hero-icon">
            ${
              isReto
                ? `<svg viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`
                : `<svg viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
            }
          </div>
          <div class="lv-hero-info">
            <div class="lv-hero-tag">${tag}</div>
            <div class="lv-hero-title">${title}</div>
            <div class="lv-hero-chips">
              <span class="lv-chip lv-chip-progress">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${stateLabel}
              </span>
              <span class="lv-chip">
                <svg viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                ${isReto ? "Entrega individual" : "Lectura + actividad"}
              </span>
              <span class="lv-chip">
                <svg viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Sin límite de intentos
              </span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="lv-tabs" role="tablist">
          ${this._renderTabs()}
        </div>

        <!-- Historial compacto -->
        <div class="lv-hist-compact">
          <div class="lv-hist-compact-head">
            <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Historial de intentos
          </div>

          <!-- Intento 1 — siempre visible, tabla con headers -->
          <table class="lv-hist-compact-table">
            <thead>
              <tr>
                <th>Intento</th>
                <th>Calificación</th>
                <th>Método</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${makeTableRow(1)}
            </tbody>
          </table>

          ${
            attempts > 1
              ? `
          <!-- Accordion intentos 2..N -->
          <div class="lv-blob-wrap" data-lv-blobwrap>
            <div class="lv-blob-inner" data-lv-blobinner>
              <div class="lv-prev-header">
                <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Historial de intentos anteriores
              </div>
              <div class="lv-attempts-grid">
                ${Array.from({ length: attempts - 1 }, (_, i) => makeAttemptRow(i + 2)).join("")}
              </div>
            </div>
          </div>`
              : ""
          }

          <!-- Footer -->
          <div class="lv-hist-footer">
            ${
              attempts > 1
                ? `<button class="lv-ver-mas" data-lv-vermas>
                  <span class="lv-vermas-label">Ver todos los intentos</span>
                  <svg viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                </button>`
                : `<span></span>`
            }
            <button class="lv-btn-entrar" data-lv-entrar ${btnDisabled}>
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
              ${btnLabel}
            </button>
          </div>
        </div>

      </div><!-- /lv-root -->
    `;
  }

  _renderTabs() {
    const tabs = [
      {
        label: "Paquete SCORM",
        icon: `<svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>`,
      },
      {
        label: "Configuración",
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
      },
      {
        label: "Reportes",
        icon: `<svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
      },
      {
        label: "Más",
        icon: `<svg viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>`,
      },
    ];
    return tabs
      .map(
        (t, i) => `
      <button class="lv-tab${i === this._activeTab ? " active fill-from-left" : ""}"
              data-lv-tab="${i}" role="tab" aria-selected="${i === this._activeTab}">
        ${t.icon}<span>${t.label}</span>
      </button>`,
      )
      .join("");
  }

  _bindEvents() {
    this.querySelector("[data-lv-back]")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("uveg:lessonback", { bubbles: true, composed: true }),
      );
    });

    // Tabs
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-lv-tab]");
      if (!btn) return;
      const newIdx = parseInt(btn.dataset.lvTab);
      if (newIdx === this._activeTab) return;
      const dir = newIdx > this._activeTab ? "right" : "left";
      const prev = this.querySelector(".lv-tab.active");
      if (prev) {
        prev.classList.remove(
          "active",
          "fill-from-left",
          "fill-from-right",
          "drain-to-left",
          "drain-to-right",
        );
        prev.classList.add(
          dir === "right" ? "drain-to-left" : "drain-to-right",
        );
        prev.setAttribute("aria-selected", "false");
        setTimeout(
          () => prev.classList.remove("drain-to-left", "drain-to-right"),
          380,
        );
      }
      btn.classList.remove(
        "drain-to-left",
        "drain-to-right",
        "fill-from-left",
        "fill-from-right",
      );
      btn.classList.add(
        "active",
        dir === "right" ? "fill-from-left" : "fill-from-right",
      );
      btn.setAttribute("aria-selected", "true");
      this._activeTab = newIdx;
    });

    // Accordion ver todos los intentos — abierto por default, texto dinámico
    const vermas = this.querySelector("[data-lv-vermas]");
    const blobWrap = this.querySelector("[data-lv-blobwrap]");
    const blobInner = this.querySelector("[data-lv-blobinner]");
    if (vermas && blobWrap && blobInner) {
      // Abrir por default: liquidOpen arranca desde height:0 (CSS) y anima
      // Usamos requestAnimationFrame para que el DOM ya esté painted
      requestAnimationFrame(() => {
        liquidOpen(blobWrap, blobInner);
        vermas.classList.add("open");
        vermas.querySelector(".lv-vermas-label").textContent =
          "Ocultar intentos";
      });

      vermas.addEventListener("click", () => {
        const open = vermas.classList.toggle("open");
        vermas.querySelector(".lv-vermas-label").textContent = open
          ? "Ocultar intentos"
          : "Ver todos los intentos";
        if (open) {
          liquidOpen(blobWrap, blobInner);
        } else {
          liquidClose(blobWrap, blobInner);
        }
      });
    }
  }
}

customElements.define("uveg-lesson-view", UvegLessonView);
