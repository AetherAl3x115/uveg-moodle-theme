/**
 * components/uveg-card/uveg-card.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-card>
 * Iconografía: Heroicons 2 Outline via js/utils/icons.js
 *
 * Estado derivado de progreso real — el simulador fue eliminado.
 * El estado se actualiza cuando page.js llama a markSubActDone(actId).
 * ─────────────────────────────────────────────────────────────
 */

import { springScale, liquidOpen, liquidClose } from "../../js/utils/spring.js";
import { hi } from "../../js/utils/icons.js";

/* ── Configuración de estados ───────────────────────────────── */
const STATE_CONFIG = {
  pending: {
    avClass: "av-pending",
    dotClass: "dot-pending",
    ringStroke: "#cbd5e1",
    ringDash: "26.7 80.1",
    iconClass: "pending",
    iconKey: "clock",
    avatarIcon: "clipboard-document",
    barColor: "#cbd5e1",
    barWidth: "0%",
    barVal: "0%",
    barValColor: "#9ca3af",
    chipText: (done, total) => `${done}/${total}`,
  },
  progress: {
    avClass: "av-progress",
    dotClass: "dot-progress",
    ringStroke: "#7c3aed",
    ringDash: "53.4 53.4",
    iconClass: "progress",
    iconKey: "play-circle",
    avatarIcon: "pencil-square",
    barColor: "#7c3aed",
    barWidth: "50%",
    barVal: "50%",
    barValColor: "#92400e",
    chipText: (done, total) => `${done}/${total}`,
  },
  done: {
    avClass: "av-done",
    dotClass: "dot-done",
    ringStroke: "#22c55e",
    ringDash: "106.8 0",
    iconClass: "done",
    iconKey: "check",
    avatarIcon: "clipboard-list",
    barColor: "#22c55e",
    barWidth: "100%",
    barVal: "100%",
    barValColor: "#166534",
    chipText: (done, total) => `${total}/${total}`,
  },
};

function deriveState(done, total) {
  if (done <= 0) return "pending";
  if (total <= 1 || done >= total) return "done";
  return "progress";
}

/* ── Mapa card-id → sub-actividades con sus IDs de cronograma ── */
const SUB_ACT_MAP = {
  0: [
    {
      actId: "l1-video",
      tipo: "video",
      nombre: "L1. Video — ¿Qué es la planeación estratégica?",
    },
    {
      actId: "l1-lect",
      tipo: "lectura",
      nombre: "L1. Lectura — Fundamentos del módulo",
    },
  ],
  1: [
    {
      actId: "l2-pod",
      tipo: "podcast",
      nombre: "L2. Podcast — Diagnóstico educativo en contexto",
    },
    {
      actId: "l2-pres",
      tipo: "presentacion",
      nombre: "L2. Presentación — Herramientas de análisis situacional",
    },
  ],
  2: [
    {
      actId: "l3-info",
      tipo: "infografia",
      nombre: "L3. Infografía — Componentes del mapa estratégico",
    },
    {
      actId: "l3-lect",
      tipo: "lectura",
      nombre: "L3. Lectura — Diseño institucional por objetivos",
    },
  ],
  3: [
    {
      actId: "l4-pres",
      tipo: "presentacion",
      nombre: "L4. Presentación — Fases de implementación",
    },
    {
      actId: "l4-video",
      tipo: "video",
      nombre: "L4. Video — Casos de éxito en gestión educativa",
    },
  ],
  5: [
    {
      actId: "l5-pod",
      tipo: "podcast",
      nombre: "L5. Podcast — Impacto de la tecnología en el aula",
    },
    {
      actId: "l5-info",
      tipo: "infografia",
      nombre: "L5. Infografía — Indicadores de evaluación tecnológica",
    },
  ],
  6: [
    {
      actId: "l6-lect",
      tipo: "lectura",
      nombre: "L6. Lectura — Innovación pedagógica aplicada",
    },
    {
      actId: "l6-pres",
      tipo: "presentacion",
      nombre: "L6. Presentación — KPIs para proyectos educativos",
    },
  ],
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
    this._loadProgress();
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

  /* ── Persistencia localStorage ──────────────────────────── */
  _storageKey() {
    return `uveg-card-${this._attr("card-id")}`;
  }

  _loadProgress() {
    try {
      const saved = localStorage.getItem(this._storageKey());
      if (!saved) return;
      const { done, completedActs } = JSON.parse(saved);
      if (done > 0) this.setAttribute("progress-done", done);
      this._completedActs = new Set(completedActs || []);
    } catch (_) {
      this._completedActs = new Set();
    }

    if (this._isReto()) {
      try {
        const s = parseInt(
          localStorage.getItem(`uveg-reto-${this._attr("card-id")}`),
          10,
        );
        if (!isNaN(s)) this._retoScore = s;
      } catch (_) {}
    }
  }

  _saveProgress(done, actId) {
    if (!this._completedActs) this._completedActs = new Set();
    if (actId) this._completedActs.add(actId);
    try {
      localStorage.setItem(
        this._storageKey(),
        JSON.stringify({ done, completedActs: [...this._completedActs] }),
      );
    } catch (_) {}
  }

  /* ── API pública: marcar sub-actividad completada ───────── */
  markSubActDone(actId) {
    const id = parseInt(this._attr("card-id"), 10);
    const subActs = SUB_ACT_MAP[id] || [];
    const total =
      subActs.length || parseInt(this._attr("progress-total", "2"), 10);

    const card = this.querySelector(".card");
    if (!card) return;

    // Evitar doble conteo si ya estaba completada
    if (!this._completedActs) this._completedActs = new Set();
    if (this._completedActs.has(actId)) return;

    const subEl = this.querySelector(`[data-act-id="${actId}"]`);
    if (subEl) subEl.classList.add("is-done");

    const doneCurrent = parseInt(this._attr("progress-done", "0"), 10);
    const doneNext = Math.min(doneCurrent + 1, total);
    this._saveProgress(doneNext, actId);
    this.setAttribute("progress-done", doneNext);
    // attributeChangedCallback re-renderiza automáticamente
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const id = this._attr("card-id", "0");
    const done = parseInt(this._attr("progress-done", "0"), 10);
    const total = parseInt(this._attr("progress-total", "2"), 10);

    const stateAttr = this.hasAttribute("progress-done")
      ? ""
      : this._attr("state", "");
    const state = stateAttr || deriveState(done, total);
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.pending;

    this.innerHTML = this._isReto()
      ? this._renderReto(id, state, cfg)
      : this._renderLesson(id, state, cfg, done, total);

    // Restaurar is-done visual en sub-acts ya completadas
    if (this._completedActs?.size) {
      this._completedActs.forEach((aid) => {
        const el = this.querySelector(`[data-act-id="${aid}"]`);
        if (el) el.classList.add("is-done");
      });
    }

    if (this._isReto()) {
      const barVal = this.querySelector("[data-barval]");
      const barFill = this.querySelector("[data-barfill]");
      if (this._retoScore !== undefined) {
        _applyRetoScore(this._retoScore, barVal, barFill);
      } else {
        if (barVal) {
          barVal.textContent = "--";
          barVal.style.color = "rgba(255,255,255,.5)";
        }
        if (barFill) {
          barFill.style.width = "0%";
        }
      }
    }
  }

  _renderLesson(id, state, cfg, done, total) {
    const title = this._attr("title");

    return `
      <div class="card" data-card-id="${id}" data-state="${state}">
        <div class="c-top">
          <div class="c-accent-bar ${state}" data-accentbar></div>
          <div class="c-row" style="flex:1">

            <div class="av ${cfg.avClass}" data-av>
              ${hi(cfg.avatarIcon, 18)}
              <span class="av-dot ${cfg.dotClass}" data-dot></span>
            </div>

            <div class="c-info">
              <div class="c-title">${title}</div>
              <div class="c-desc">${this._attr("desc", "Explora los contenidos y actividades de esta lección para avanzar en el módulo.")}</div>
            </div>

            <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;gap:4px;flex-shrink:0">
              <div style="display:flex;align-items:center;gap:5px">
                <div class="state-circle" data-sc role="button" tabindex="0" aria-label="Ver progreso">
                  ${this._renderRing(id, cfg)}
                  <div class="sc-icon ${cfg.iconClass}" data-scicon>
                    ${hi(cfg.iconKey, 14)}
                  </div>
                </div>
                <span data-chevron aria-hidden="true"
                  style="display:flex;align-items:center;color:#94a3b8;transition:transform .3s cubic-bezier(.4,0,.2,1)">
                  ${hi("chevron-down", 14)}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div class="c-footer" style="padding:0;border:none;min-height:0"></div>

        <div class="blob-wrap" data-bw>
          <div class="blob-inner" data-bi>
            <div class="b-div"></div>
            <div class="sub-acts-grid">
              ${this._renderSubActs(id)}
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

    return `
      <div class="card card-reto" data-card-id="${id}" data-state="${state}">
        <div class="c-top" style="padding:14px 14px 0;display:block">
          <div class="reto-header">
            <div class="reto-header-icon">
              ${hi("trophy", 20)}
            </div>
            <div class="reto-header-info">
              <div class="reto-header-title">${title}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
              <span class="badge"
                style="background:rgba(255,255,255,.15);color:#fff;border:.5px solid rgba(255,255,255,.2)">
                ${hi("clock", 9)}
                Vence pronto
              </span>
              <div class="state-circle" data-sc role="button" tabindex="0" aria-label="Ver progreso">
                ${this._renderRing(id, cfg, true)}
                <div class="sc-icon ${cfg.iconClass}" data-scicon style="color:rgba(255,255,255,.6)">
                  ${hi(cfg.iconKey, 14)}
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

        <div class="c-footer">
          <div class="c-desc" style="flex:1;margin:0;font-size:var(--font-size-sm)">${this._attr("desc", "Diseña un plan estratégico viable para una institución educativa ficticia, aplicando los marcos de gestión revisados en esta unidad.")}</div>
          <span class="cf-chip" data-chip style="flex-shrink:0;align-self:flex-start">0/1</span>
        </div>

        <div class="blob-wrap" data-bw>
          <div class="blob-inner" data-bi>
            <div class="b-div"></div>
            <div class="sub-acts-grid">
              <div class="sub-act-card entrega"
                data-scorm-btn
                data-scorm-title="${title}"
                data-act-type="reto">
                <div class="sub-act-row">
                  <div class="sub-act-icon entrega"><img src="/assets/img/icons/pdf.png" width="28" height="28" style="object-fit:contain" alt="PDF"></div>
                 <div class="sub-act-name">Recurso en PDF</div>
                  <div class="reto-score-pill" data-reto-pill>
                   <span data-barval style="font-size:11px;font-weight:700;color:#94a3b8">--</span>
                    <span style="font-size:9px;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderRing(id, cfg, whiteTrack = false) {
    const trackColor = whiteTrack ? "rgba(255,255,255,.2)" : "#e5e7eb";
    return `
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" style="position:absolute;top:0;left:0;pointer-events:none">
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

  _svgByType(tipo) {
    const svgs = {
      video: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="24" y="50" width="156" height="156" rx="14" fill="#e50061" opacity=".18"/><rect x="24" y="50" width="156" height="156" rx="14" stroke="#e50061" stroke-width="14" fill="none"/><path d="M180 128L236 92v72z" fill="#e50061" opacity=".5"/><path d="M180 128L236 92v72z" stroke="#e50061" stroke-width="12" stroke-linejoin="round" fill="none"/></svg>`,
      podcast: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="88" y="16" width="80" height="120" rx="40" fill="#7c3aed" opacity=".2"/><rect x="88" y="16" width="80" height="120" rx="40" stroke="#7c3aed" stroke-width="14" fill="none"/><path d="M48 128c0 44.2 35.8 80 80 80s80-35.8 80-80" stroke="#7c3aed" stroke-width="14" stroke-linecap="round" fill="none"/><line x1="128" y1="208" x2="128" y2="240" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/><line x1="96" y1="240" x2="160" y2="240" stroke="#7c3aed" stroke-width="14" stroke-linecap="round"/></svg>`,
      infografia: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="32" y="140" width="48" height="76" rx="6" fill="#0891b2" opacity=".2"/><rect x="104" y="96" width="48" height="120" rx="6" fill="#0891b2" opacity=".35"/><rect x="176" y="48" width="48" height="168" rx="6" fill="#0891b2" opacity=".55"/><rect x="32" y="140" width="48" height="76" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/><rect x="104" y="96" width="48" height="120" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/><rect x="176" y="48" width="48" height="168" rx="6" stroke="#0891b2" stroke-width="12" fill="none"/></svg>`,
      presentacion: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><rect x="16" y="40" width="224" height="152" rx="12" fill="#d97706" opacity=".15"/><rect x="16" y="40" width="224" height="152" rx="12" stroke="#d97706" stroke-width="14" fill="none"/><line x1="128" y1="192" x2="128" y2="224" stroke="#d97706" stroke-width="14" stroke-linecap="round"/><line x1="80" y1="224" x2="176" y2="224" stroke="#d97706" stroke-width="14" stroke-linecap="round"/><path d="M72 116 L108 80 L144 108 L184 68" stroke="#d97706" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
      lectura: `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M128 208C128 208 24 160 24 80V48L128 16L232 48V80C232 160 128 208 128 208Z" fill="#16a34a" opacity=".15"/><path d="M128 208C128 208 24 160 24 80V48L128 16L232 48V80C232 160 128 208 128 208Z" stroke="#16a34a" stroke-width="14" stroke-linejoin="round" fill="none"/><path d="M88 128 L112 152 L168 96" stroke="#16a34a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    };
    return svgs[tipo] || svgs.lectura;
  }

  _renderSubActs(id) {
    const cardId = parseInt(id, 10);
    const subActs = SUB_ACT_MAP[cardId];
    if (!subActs) return "";

    const TIPO_LABELS = {
      video: "VIDEO",
      podcast: "PODCAST",
      infografia: "INFOGRAFÍA",
      presentacion: "PRESENTACIÓN",
      lectura: "LECTURA",
    };

    return subActs
      .map(
        ({ actId, tipo, nombre }) => `
      <div class="sub-act-card ${tipo}"
           data-act-id="${actId}"
           data-act-type="${tipo}"
           data-scorm-title="${nombre}">
        <div class="sub-act-row">
          <div class="sub-act-icon ${tipo}">${this._svgByType(tipo)}</div>
          <div class="sub-act-name">${nombre}</div>
          <span class="sub-act-badge ${tipo}">${TIPO_LABELS[tipo] || tipo.toUpperCase()}</span>
        </div>
      </div>
    `,
      )
      .join("");
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    const card = this.querySelector(".card");
    if (!card) return;

    card.addEventListener("click", this._handleCardClick.bind(this));
    card.addEventListener("mouseenter", () =>
      card.classList.remove("hover-out"),
    );
    card.addEventListener("mouseleave", () => {
      card.classList.add("hover-out");
      setTimeout(() => card.classList.remove("hover-out"), 300);
    });
    card.addEventListener("mousedown", () => springScale(card, 1.015, 0.984));
    card.addEventListener("mouseup", () => springScale(card, 0.984, 1.015));
  }

  _handleCardClick(e) {
    if (e.target.closest("[data-sc]")) {
      e.stopPropagation();
      this._toggleBarMode();
      return;
    }

    // Sub-act-card con data-act-id → uveg-scorm-view (contenido)
    const subAct = e.target.closest("[data-act-id]");
    if (subAct) {
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("uveg:openscorm", {
          bubbles: true,
          composed: true,
          detail: {
            title: this._attr("title"),
            scormTitle: subAct.dataset.scormTitle || this._attr("title"),
            cardId: this._attr("card-id"),
            actId: subAct.dataset.actId,
            type: subAct.dataset.actType || "lectura",
            viewType: "scorm", // → uveg-scorm-view
          },
        }),
      );
      return;
    }

    // Entrega del reto → uveg-reto-view
    const retoBtn = e.target.closest("[data-act-type='reto']");
    if (retoBtn) {
      e.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("uveg:openscorm", {
          bubbles: true,
          composed: true,
          detail: {
            title: this._attr("title"),
            scormTitle: retoBtn.dataset.scormTitle || this._attr("title"),
            cardId: this._attr("card-id"),
            actId: `reto-${this._attr("unit-idx", "0")}`,
            type: "reto",
            viewType: "reto", // → uveg-reto-view
          },
        }),
      );
      return;
    }

    // btn-go de lección (botón inferior del blob)
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
            type: "lectura",
            viewType: "scorm",
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
    const chevron = this.querySelector("[data-chevron]");
    if (!bw || !bi) return;

    this._isOpen = !this._isOpen;
    card.classList.toggle("open", this._isOpen);

    if (this._isOpen) {
      liquidOpen(bw, bi);
      springScale(card, 0.984, 1.013);
      setTimeout(() => springScale(card, 1.013, 1), 100);
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
      if (chevron) chevron.style.transform = "rotate(0deg)";
    }
  }

  _toggleBarMode() {
    const sc = this.querySelector("[data-sc]");
    if (!sc) return;
    sc.classList.toggle("bar-mode");
    springScale(sc, 0.85, 1);

    if (this._isReto()) {
      const barVal = this.querySelector("[data-reto-pill] [data-barval]");
      const barFill = this.querySelector("[data-barfill]");
      if (this._retoScore === undefined) {
        this._retoScore = Math.floor(Math.random() * 101);
      }
      _applyRetoScore(this._retoScore, barVal, barFill);
    }
  }

  /* ── Public API ─────────────────────────────────────────── */

  markRetoDone(score) {
    if (!this._isReto()) return;

    const cardId = this._attr("card-id");
    let pts = score ?? null;
    if (pts === null) {
      try {
        pts = parseInt(localStorage.getItem(`uveg-reto-${cardId}`), 10) || null;
      } catch (_) {}
    }
    if (pts !== null && !isNaN(pts)) this._retoScore = pts;

    const chip = this.querySelector("[data-chip]");
    if (chip) chip.textContent = "1/1";
    this.setAttribute("state", "done");
  }

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

function _applyRetoScore(pts, barVal, barFill) {
  if (!barVal) return;
  const pct = pts + "%";
  const face =
    pts >= 70
      ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
      : pts >= 50
        ? `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`
        : `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
  const color = pts >= 70 ? "#166534" : pts >= 50 ? "#92400e" : "#991b1b";
  const bg = pts >= 70 ? "#22c55e" : pts >= 50 ? "#f59e0b" : "#ef4444";
  barVal.innerHTML = `${face} ${pts}`;
  barVal.style.color = color;
  if (barFill) {
    barFill.style.width = pct;
    barFill.style.background = bg;
  }
}

customElements.define("uveg-card", UvegCard);
