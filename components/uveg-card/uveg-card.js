/**
 * components/uveg-card/uveg-card.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-card>
 *
 * Uso básico (lección):
 *   <uveg-card
 *     card-id="0"
 *     title="Lección 1. Introducción al módulo"
 *     type="Lectura + actividad"
 *     state="done"
 *     date-start="25 may"
 *     date-end="28 may"
 *     progress-done="2"
 *     progress-total="2"
 *     scorm-title="Lección 1">
 *   </uveg-card>
 *
 * Uso reto:
 *   <uveg-card
 *     card-id="4"
 *     variant="reto"
 *     title="Reto 1. Planeación estratégica"
 *     subtitle="Entrega individual · hasta 100 pts"
 *     state="pending"
 *     date-start="1 jun"
 *     date-end="17 jun">
 *   </uveg-card>
 *
 * Atributos observados:
 *   card-id, title, subtitle, type, state, variant,
 *   date-start, date-end, progress-done, progress-total, scorm-title
 *
 * Estados válidos: pending | done
 * Variantes:       default | reto
 *
 * Eventos emitidos:
 *   uveg:openscorm  → { detail: { title, cardId } }
 *   uveg:cardopen   → { detail: { cardId } }
 * ─────────────────────────────────────────────────────────────
 */

import { springScale, liquidOpen, liquidClose } from "../../js/utils/spring.js";

/* ── Configuración de estados ───────────────────────────────── */
const STATE_CONFIG = {
  pending: {
    avClass: "av-pending",
    dotClass: "dot-pending",
    badgeClass: "b-pending",
    badgeIcon: "ti-lock",
    badgeLabel: "Pendiente",
    ringStroke: "#d1d5db",
    ringDash: "0 106.8",
    iconClass: "pending",
    iconName: "ti-dots",
    barColor: "#d1d5db",
    barWidth: "0%",
    barVal: "0%",
    barValColor: "#9ca3af",
    chipText: (done, total) => `${done}/${total}`,
  },
  progress: {
    avClass: "av-progress",
    dotClass: "dot-progress",
    badgeClass: "b-progress",
    badgeIcon: "ti-player-play",
    badgeLabel: "En progreso",
    ringStroke: "#3b82f6",
    ringDash: "53.4 53.4",
    iconClass: "progress",
    iconName: "ti-clock",
    barColor: "#3b82f6",
    barWidth: "50%",
    barVal: "50%",
    barValColor: "#1e40af",
    chipText: (done, total) => `${Math.ceil(total / 2)}/${total}`,
  },
  done: {
    avClass: "av-done",
    dotClass: "dot-done",
    badgeClass: "b-done",
    badgeIcon: "ti-check",
    badgeLabel: "Completada",
    ringStroke: "#22c55e",
    ringDash: "106.8 0",
    iconClass: "done",
    iconName: "ti-check",
    barColor: "#22c55e",
    barWidth: "100%",
    barVal: "100%",
    barValColor: "#166534",
    chipText: (done, total) => `${total}/${total}`,
  },
};

class UvegCard extends HTMLElement {
  static get observedAttributes() {
    return [
      "card-id",
      "title",
      "subtitle",
      "type",
      "state",
      "variant",
      "date-start",
      "date-end",
      "progress-done",
      "progress-total",
      "scorm-title",
    ];
  }

  constructor() {
    super();
    this._isOpen = false;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    this._render();
    this._bindEvents();
  }

  /* ── Helpers ────────────────────────────────────────────── */

  _attr(name, fallback = "") {
    return this.getAttribute(name) ?? fallback;
  }

  _isReto() {
    return this._attr("variant") === "reto";
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const id = this._attr("card-id", "0");
    const state = this._attr("state", "pending");
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.pending;
    const done = parseInt(this._attr("progress-done", "0"), 10);
    const total = parseInt(this._attr("progress-total", "2"), 10);
    const isReto = this._isReto();

    this.innerHTML = isReto
      ? this._renderReto(id, state, cfg)
      : this._renderLesson(id, state, cfg, done, total);
  }

  _renderLesson(id, state, cfg, done, total) {
    const title = this._attr("title");
    const type = this._attr("type");
    const dateStart = this._attr("date-start");
    const dateEnd = this._attr("date-end");
    const scormTitle = this._attr("scorm-title", title);

    return `
      <div class="card" data-card-id="${id}" data-state="${state}">
        <div class="c-top">
          <div class="c-row">

            <!-- Avatar con dot de estado -->
            <div class="av ${cfg.avClass}" data-av>
              <i class="ti ti-book-2" aria-hidden="true"></i>
              <span class="av-dot ${cfg.dotClass}" data-dot></span>
            </div>

            <!-- Info -->
            <div class="c-info">
              <div class="c-title">${title}</div>
              <div class="c-type">${type}</div>
              <span class="badge ${cfg.badgeClass}" data-badge>
                <i class="ti ${cfg.badgeIcon}" style="font-size:9px" aria-hidden="true"></i>
                ${cfg.badgeLabel}
              </span>
            </div>

            <!-- State circle (click = toggle bar/ring) -->
            <div
              class="state-circle"
              data-sc
              role="button"
              tabindex="0"
              aria-label="Ver progreso detallado"
              title="Click para cambiar vista">
              ${this._renderRing(id, cfg)}
              <div class="sc-icon ${cfg.iconClass}" data-scicon>
                <i class="ti ${cfg.iconName}" aria-hidden="true"></i>
              </div>
              <div class="state-bar-wrap" aria-hidden="true">
                <div class="state-bar">
                  <div class="state-bar-fill" data-barfill style="background:${cfg.barColor};width:${cfg.barWidth}"></div>
                </div>
                <span class="state-bar-val" data-barval style="color:${cfg.barValColor}">${cfg.barVal}</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="c-footer">
          <div class="cf-date"><i class="ti ti-calendar" style="font-size:11px" aria-hidden="true"></i> ${dateStart}</div>
          <div class="cf-date"><i class="ti ti-clock"    style="font-size:11px" aria-hidden="true"></i> ${dateEnd}</div>
          <div class="cf-sep"></div>
          <span class="cf-chip" data-chip>${cfg.chipText(done, total)}</span>
        </div>

        <!-- Blob expandible -->
        <div class="blob-wrap" data-bw>
          <div class="blob-inner" data-bi>
            <div class="b-div"></div>
            <button class="sim-btn" data-sim aria-label="Simular progreso">
              <i class="ti ti-player-play" style="font-size:10px" aria-hidden="true"></i>
              Simular progreso
            </button>
            <div class="sub-section-title">Recursos de aprendizaje</div>
            <div class="sub-acts-grid">
              ${this._renderSubActs(state)}
            </div>
            <button class="btn-go${state === "pending" ? " btn-locked" : ""}"
              data-scorm-btn
              data-scorm-title="${this._attr("scorm-title", this._attr("title"))}"
              ${state === "pending" ? 'disabled aria-disabled="true"' : ""}
            >
              ${state === "pending" ? "Bloqueada" : state === "done" ? "Ver lección completa" : "Continuar lección"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderReto(id, state, cfg) {
    const title = this._attr("title");
    const subtitle = this._attr(
      "subtitle",
      "Entrega individual · hasta 100 pts",
    );
    const dateStart = this._attr("date-start");
    const dateEnd = this._attr("date-end");

    return `
      <div class="card card-reto" data-card-id="${id}" data-state="${state}">
        <div class="c-top">

          <!-- Header gradient UVEG -->
          <div class="reto-header">
            <div class="reto-header-icon">
              <i class="ti ti-trophy" aria-hidden="true"></i>
            </div>
            <div class="reto-header-info">
              <div class="reto-header-tag">RETO INTEGRADOR</div>
              <div class="reto-header-title">${title}</div>
              <div class="reto-header-sub">${subtitle}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
              <span class="badge" data-badge
                style="background:rgba(255,255,255,.15);color:#fff;border:.5px solid rgba(255,255,255,.2)">
                <i class="ti ti-clock" style="font-size:9px" aria-hidden="true"></i> Vence pronto
              </span>
              <div class="state-circle" data-sc role="button" tabindex="0" aria-label="Ver progreso">
                ${this._renderRing(id, cfg, true)}
                <div class="sc-icon ${cfg.iconClass}" data-scicon style="color:rgba(255,255,255,.6)">
                  <i class="ti ${cfg.iconName}" aria-hidden="true"></i>
                </div>
                <div class="state-bar-wrap" aria-hidden="true">
                  <div class="state-bar">
                    <div class="state-bar-fill" data-barfill style="background:${cfg.barColor};width:${cfg.barWidth}"></div>
                  </div>
                  <span class="state-bar-val" data-barval style="color:${cfg.barValColor}">${cfg.barVal}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="c-footer">
          <div class="cf-date"><i class="ti ti-calendar" style="font-size:11px" aria-hidden="true"></i> ${dateStart}</div>
          <div class="cf-date"><i class="ti ti-clock"    style="font-size:11px" aria-hidden="true"></i> Vence: ${dateEnd}</div>
          <div class="cf-sep"></div>
          <span class="cf-chip" data-chip>0/1</span>
        </div>

        <!-- Blob expandible -->
        <div class="blob-wrap" data-bw>
          <div class="blob-inner" data-bi>
            <div class="b-div"></div>
            <button class="sim-btn" data-sim aria-label="Simular progreso">
              <i class="ti ti-player-play" style="font-size:10px" aria-hidden="true"></i>
              Simular progreso
            </button>
            <div class="b-desc">
              Diseña un plan estratégico viable para una institución educativa ficticia,
              aplicando los marcos de gestión revisados en esta unidad.
            </div>
            <div class="b-dates">
              <div class="bd-item">
                <span class="bd-lbl">Apertura</span>
                <span class="bd-val">${dateStart}</span>
              </div>
              <div class="bd-item">
                <span class="bd-lbl">Entrega</span>
                <span class="bd-val">${dateEnd}</span>
              </div>
            </div>
            <button class="btn-go btn-reto" data-scorm-btn
              data-scorm-title="${title}">
              <i class="ti ti-bolt" aria-hidden="true"></i> Ver instrucciones del Reto
            </button>
            <p class="note">
              <i class="ti ti-info-circle" aria-hidden="true"></i>
              2 intentos permitidos · Calificación mínima: 70
            </p>
          </div>
        </div>
      </div>
    `;
  }

  _renderRing(id, cfg, whiteTrack = false) {
    const trackColor = whiteTrack ? "rgba(255,255,255,.2)" : "#e5e7eb";
    return `
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="17" fill="none" stroke="${trackColor}" stroke-width="3"/>
        <circle cx="22" cy="22" r="17" fill="none"
          stroke="${cfg.ringStroke}" stroke-width="3"
          stroke-dasharray="${cfg.ringDash}"
          stroke-dashoffset="26.7"
          stroke-linecap="round"
          data-ring/>
      </svg>
    `;
  }

  _renderSubActs(state) {
    const locked = state === "pending";
    const tareaLinkLabel =
      state === "done"
        ? "Ver resultado"
        : locked
          ? "Pendiente"
          : "Iniciar actividad";
    const examenLinkLabel = state === "done" ? "Ver resultado" : "Pendiente";
    const lockIcon = `<i class="ti ti-lock" style="font-size:10px" aria-hidden="true"></i>`;
    const arrowIcon = `<i class="ti ti-arrow-right" style="font-size:10px" aria-hidden="true"></i>`;

    return `
      <div class="sub-act-card tarea">
        <div class="sub-act-top">
          <div class="sub-act-icon" style="background:#EEF2FF">
            <i class="ti ti-file-text" style="color:#4338ca;font-size:15px" aria-hidden="true"></i>
          </div>
          <span class="sub-act-badge tarea">TAREA</span>
        </div>
        <div class="sub-act-name">Análisis de contexto educativo</div>
        <div class="sub-act-desc">Aplica el marco FODA para analizar tu institución.</div>
        <div class="sub-act-footer">
          <button class="sub-act-link" style="${locked ? "color:#9ca3af" : ""}">
            ${tareaLinkLabel} ${locked ? lockIcon : arrowIcon}
          </button>
          <div class="sub-act-pts">
            <div class="pts-donut">
              ${
                state === "done"
                  ? `
                <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
                  <circle cx="19" cy="19" r="13" fill="none" stroke="#e5e7eb" stroke-width="3"/>
                  <circle cx="19" cy="19" r="13" fill="none" stroke="#22c55e" stroke-width="3"
                    stroke-dasharray="72 9.7" stroke-dashoffset="20.4" stroke-linecap="round"/>
                </svg>
                <div class="pts-val" style="color:#166634">90</div>
              `
                  : `
                <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
                  <circle cx="19" cy="19" r="13" fill="none" stroke="#e5e7eb" stroke-width="3"/>
                </svg>
                <div class="pts-val" style="color:#9ca3af">—</div>
              `
              }
            </div>
            <span class="sub-act-pts-label">pts</span>
          </div>
        </div>
      </div>

      <div class="sub-act-card examen">
        <div class="sub-act-top">
          <div class="sub-act-icon" style="background:#fdf4ff">
            <i class="ti ti-clipboard-check" style="color:#7e22ce;font-size:15px" aria-hidden="true"></i>
          </div>
          <span class="sub-act-badge examen">EXAMEN</span>
        </div>
        <div class="sub-act-name">Evaluación de la lección</div>
        <div class="sub-act-desc">${locked ? "Disponible al completar la tarea." : "Demuestra tu comprensión de los conceptos."}</div>
        <div class="sub-act-footer">
          <button class="sub-act-link" style="color:#9ca3af">
            ${examenLinkLabel} ${lockIcon}
          </button>
          <div class="sub-act-pts">
            <div class="pts-donut">
              <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
                <circle cx="19" cy="19" r="13" fill="none" stroke="#e5e7eb" stroke-width="3"/>
              </svg>
              <div class="pts-val" style="color:#9ca3af">—</div>
            </div>
            <span class="sub-act-pts-label">pts</span>
          </div>
        </div>
      </div>
    `;
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    const card = this.querySelector(".card");
    if (!card) return;

    card.addEventListener("click", this._handleCardClick.bind(this));

    card.addEventListener("mouseenter", () => {
      if (!this._isOpen) springScale(card, 1, 1.013);
    });
    card.addEventListener("mouseleave", () => {
      if (!this._isOpen) springScale(card, 1.013, 1);
    });
    card.addEventListener("mousedown", () => {
      springScale(card, this._isOpen ? 1 : 1.013, 0.984);
    });
    card.addEventListener("mouseup", () => {
      springScale(card, 0.984, this._isOpen ? 1 : 1.013);
    });
  }

  _handleCardClick(e) {
    if (e.target.closest("[data-sim]")) {
      e.stopPropagation();
      this._simulateProgress();
      return;
    }

    if (e.target.closest("[data-sc]")) {
      e.stopPropagation();
      this._toggleBarMode();
      return;
    }

    if (e.target.closest("[data-scorm-btn]")) {
      e.stopPropagation();
      const btn = e.target.closest("[data-scorm-btn]");
      this.dispatchEvent(
        new CustomEvent("uveg:openscorm", {
          bubbles: true,
          composed: true,
          detail: {
            title: btn.dataset.scormTitle,
            cardId: this._attr("card-id"),
          },
        }),
      );
      return;
    }

    this._toggleExpand();
  }

  _toggleExpand() {
    const card = this.querySelector(".card");
    const bw = this.querySelector("[data-bw]");
    const bi = this.querySelector("[data-bi]");
    if (!bw || !bi) return;

    this._isOpen = !this._isOpen;
    card.classList.toggle("open", this._isOpen);

    if (this._isOpen) {
      liquidOpen(bw, bi);
      springScale(card, 0.984, 1.013);
      setTimeout(() => springScale(card, 1.013, 1), 100);

      this.dispatchEvent(
        new CustomEvent("uveg:cardopen", {
          bubbles: true,
          composed: true,
          detail: { cardId: this._attr("card-id") },
        }),
      );
    } else {
      liquidClose(bw, bi);
      springScale(card, 1, 1);
    }
  }

  _toggleBarMode() {
    const sc = this.querySelector("[data-sc]");
    if (!sc) return;
    sc.classList.toggle("bar-mode");
    springScale(sc, 0.85, 1);
  }

  _simulateProgress() {
    const card = this.querySelector(".card");
    const current = card.dataset.state;

    // FIX 1: solo pending ↔ done, sin pasar por progress
    const next = current === "pending" ? "done" : "pending";

    // FIX 2: capturar wasOpen ANTES del re-render
    // setAttribute → attributeChangedCallback → _render() destruye el DOM
    const wasOpen = this._isOpen;

    this.setAttribute("state", next);

    // Si estaba abierta, restaurar blob y clase open tras el re-render
    if (wasOpen) {
      const bw = this.querySelector("[data-bw]");
      const bi = this.querySelector("[data-bi]");
      const cardNew = this.querySelector(".card");

      cardNew?.classList.add("open");

      if (bw && bi) {
        // El contenido cambió (estado distinto) — recalcular altura real
        requestAnimationFrame(() => {
          bw.style.height = bi.scrollHeight + "px";
        });
      }
    }
  }

  /* ── Public API ─────────────────────────────────────────── */

  close() {
    if (!this._isOpen) return;
    const bw = this.querySelector("[data-bw]");
    const bi = this.querySelector("[data-bi]");
    const card = this.querySelector(".card");
    if (bw && bi) liquidClose(bw, bi);
    card?.classList.remove("open");
    this._isOpen = false;
  }
}

customElements.define("uveg-card", UvegCard);
