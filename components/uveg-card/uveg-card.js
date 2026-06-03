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
    badgeIcon: "ti-clock",
    badgeLabel: "Pendiente",
    ringStroke: "#cbd5e1",
    ringDash: "26.7 80.1",
    iconClass: "pending",
    iconName: "ti-clock",
    barColor: "#cbd5e1",
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
      "desc",
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
          <div class="c-accent-bar ${state}" data-accentbar></div>
          <div class="c-row" style="flex:1">

             <!-- Avatar con dot de estado -->
            <div class="av ${cfg.avClass}" data-av>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M8 9h8"/><path d="M8 13h6"/><path d="m14.5 17.5 2.5-2.5 1.5 1.5-2.5 2.5H14.5v-1.5z"/></svg>
              <span class="av-dot ${cfg.dotClass}" data-dot></span>
            </div>

            <!-- Info -->
            <div class="c-info">
              <div class="c-title">${title}</div>
              <div class="c-desc">${this._attr("desc", "Explora los contenidos y actividades de esta lección para avanzar en el módulo.")}</div>
              <span class="badge ${cfg.badgeClass}" data-badge>
                <i class="ti ${cfg.badgeIcon}" style="font-size:9px" aria-hidden="true"></i>
                ${cfg.badgeLabel}
              </span>
            </div>

         <!-- Columna derecha: ring + chevron arriba, chip abajo -->
            <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:4px;flex-shrink:0">
              <div style="display:flex;align-items:center;gap:5px">
                <div class="state-circle" data-sc role="button" tabindex="0" aria-label="Ver progreso">
                  ${this._renderRing(id, cfg)}
                  <div class="sc-icon ${cfg.iconClass}" data-scicon>
                    <i class="ti ${cfg.iconName}" aria-hidden="true"></i>
                  </div>
                </div>
                <i class="ti ti-chevron-down" data-chevron aria-hidden="true"
                  style="font-size:14px;color:#94a3b8;transition:transform .3s cubic-bezier(.4,0,.2,1)"></i>
              </div>
              <span class="cf-chip" data-chip>${cfg.chipText(done, total)}</span>
            </div>

          </div>
        </div>

        <!-- Footer vacío — estructura conservada -->
        <div class="c-footer" style="padding:0;border:none;min-height:0"></div>

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
                <div class="c-top" style="padding:14px 14px 0;display:block">

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

  _svgByType(type) {
    // SVG duotone inline por tipo de actividad
    const svgs = {
      video: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="24" y="50" width="156" height="156" rx="14" fill="#e50061" opacity=".18"/><rect x="24" y="50" width="156" height="156" rx="14" stroke="#e50061" stroke-width="14" fill="none"/><path d="M180 128L236 92v72z" fill="#e50061" opacity=".5"/><path d="M180 128L236 92v72z" stroke="#e50061" stroke-width="12" stroke-linejoin="round" fill="none"/></svg>`,
      podcast: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="88" y="16" width="80" height="120" rx="40" fill="#7c3aed" opacity=".2"/><rect x="88" y="16" width="80" height="120" rx="40" stroke="#7c3aed" stroke-width="14" fill="none"/><path d="M48 128c0 44.2 35.8 80 80 80s80-35.8 80-80" stroke="#7c3aed" stroke-width="14" stroke-linecap="round" fill="none"/><line x1="128" y1="208" x2="128" y2="240" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/><line x1="96" y1="240" x2="160" y2="240" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/></svg>`,
      infografia: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="140" width="48" height="76" rx="6" fill="#0891b2" opacity=".2"/><rect x="104" y="96" width="48" height="120" rx="6" fill="#0891b2" opacity=".35"/><rect x="176" y="48" width="48" height="168" rx="6" fill="#0891b2" opacity=".55"/><rect x="32" y="140" width="48" height="76" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/><rect x="104" y="96" width="48" height="120" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/><rect x="176" y="48" width="48" height="168" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/></svg>`,
      presentacion: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="16" y="40" width="224" height="152" rx="12" fill="#d97706" opacity=".15"/><rect x="16" y="40" width="224" height="152" rx="12" stroke="#d97706" stroke-width="14" fill="none"/><line x1="128" y1="192" x2="128" y2="224" stroke="#d97706" stroke-width="14" stroke-linecap="round"/><line x1="80" y1="224" x2="176" y2="224" stroke="#d97706" stroke-width="14" stroke-linecap="round"/><path d="M72 116 L108 80 L144 108 L184 68" stroke="#d97706" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
      lectura: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M128 208C128 208 24 160 24 80V48L128 16L232 48V80C232 160 128 208 128 208Z" fill="#16a34a" opacity=".15"/><path d="M128 208C128 208 24 160 24 80V48L128 16L232 48V80C232 160 128 208 128 208Z" stroke="#16a34a" stroke-width="14" stroke-linejoin="round" fill="none"/><path d="M88 128 L112 152 L168 96" stroke="#16a34a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    };
    return svgs[type] || svgs.lectura;
  }

  _renderSubActs(state) {
    // Mapa de tipos: ícono SVG + etiqueta del badge + color clase
    const TIPOS = {
      video: { label: "VIDEO", badgeClass: "video" },
      podcast: { label: "PODCAST", badgeClass: "podcast" },
      infografia: { label: "INFOGRAFÍA", badgeClass: "infografia" },
      presentacion: { label: "PRESENTACIÓN", badgeClass: "presentacion" },
      lectura: { label: "LECTURA", badgeClass: "lectura" },
    };

    // Distribución por card-id: cada lección tiene su propio par de tipos
    const id = parseInt(this._attr("card-id"), 10);
    const DISTRIBUCIONES = {
      0: ["video", "lectura"],
      1: ["podcast", "presentacion"],
      2: ["infografia", "lectura"],
      3: ["presentacion", "video"],
      5: ["podcast", "infografia"],
      6: ["lectura", "presentacion"],
    };

    // Nombres de sub-actividades por card-id
    const NOMBRES = {
      0: [
        "L1. Video — ¿Qué es la planeación estratégica?",
        "L1. Lectura — Fundamentos del módulo",
      ],
      1: [
        "L2. Podcast — Diagnóstico educativo en contexto",
        "L2. Presentación — Herramientas de análisis situacional",
      ],
      2: [
        "L3. Infografía — Componentes del mapa estratégico",
        "L3. Lectura — Diseño institucional por objetivos",
      ],
      3: [
        "L4. Presentación — Fases de implementación",
        "L4. Video — Casos de éxito en gestión educativa",
      ],
      5: [
        "L5. Podcast — Impacto de la tecnología en el aula",
        "L5. Infografía — Indicadores de evaluación tecnológica",
      ],
      6: [
        "L6. Lectura — Innovación pedagógica aplicada",
        "L6. Presentación — KPIs para proyectos educativos",
      ],
    };

    // Fallback si el card-id no está mapeado
    const tipos = DISTRIBUCIONES[id] ?? ["lectura", "presentacion"];
    const nombres = NOMBRES[id] ?? ["Actividad 1", "Actividad 2"];

    return tipos
      .map((tipo, i) => {
        const cfg = TIPOS[tipo];
        return `
        <div class="sub-act-card ${tipo}">
        <div class="sub-act-row">
            <div class="sub-act-icon ${tipo}">${this._svgByType(tipo)}</div>
            <div class="sub-act-name">${nombres[i]}</div>
            <span class="sub-act-badge ${tipo}">${cfg.label}</span>
          </div>
        </div>
      `;
      })
      .join("");
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    const card = this.querySelector(".card");
    if (!card) return;

    card.addEventListener("click", this._handleCardClick.bind(this));

    card.addEventListener("mouseenter", () => {
      card.classList.remove("hover-out");
    });
    card.addEventListener("mouseleave", () => {
      card.classList.add("hover-out");
      setTimeout(() => card.classList.remove("hover-out"), 300);
    });
    card.addEventListener("mousedown", () => {
      springScale(card, 1.015, 0.984);
    });
    card.addEventListener("mouseup", () => {
      springScale(card, 0.984, 1.015);
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
      const chevron = this.querySelector("[data-chevron]");
      if (chevron) chevron.style.transform = "rotate(180deg)";

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
      const chevron = this.querySelector("[data-chevron]");
      if (chevron) chevron.style.transform = "rotate(0deg)";
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
