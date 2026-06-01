/**
 * components/uveg-progress/uveg-progress.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-progress>
 *
 * Panel derecho con:
 *   - Ring circular de progreso general
 *   - Lista de secciones del módulo
 *   - Próximas actividades
 *
 * Uso:
 *   <uveg-progress
 *     percent="70"
 *     done="7"
 *     total="10"
 *     message="Avanzando muy bien">
 *   </uveg-progress>
 *
 * Atributos observados:
 *   percent   → porcentaje de avance (0-100)
 *   done      → actividades completadas
 *   total     → total de actividades
 *   message   → mensaje motivacional
 *
 * Eventos escuchados:
 *   uveg:tabchange → actualiza sección activa en el panel
 * ─────────────────────────────────────────────────────────────
 */

/** Circunferencia del ring: 2π × r = 2π × 34 ≈ 213.7 */
const RING_CIRCUMFERENCE = 213.7;

/** Próximas actividades — en producción vendrían de la API */
const UPCOMING = [
  {
    icon: "ti-calendar",
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    name: "Foro de diagnóstico",
    date: "28 may 2026",
    badge: "Foro",
    badgeBg: "#eff6ff",
    badgeColor: "#1e40af",
  },
  {
    icon: "ti-file-text",
    iconBg: "#f0fdf4",
    iconColor: "#22c55e",
    name: "Lectura: Tendencias",
    date: "29 may 2026",
    badge: "Lectura",
    badgeBg: "#f0fdf4",
    badgeColor: "#166534",
  },
  {
    icon: "ti-pencil",
    iconBg: "#fff7ed",
    iconColor: "#f97316",
    name: "Actividad 1. Análisis",
    date: "30 may 2026",
    badge: "Actividad",
    badgeBg: "#fff7ed",
    badgeColor: "#9a3412",
  },
];

/** Secciones del módulo */
const SECTIONS = [
  { key: "presentacion", label: "Presentación" },
  { key: "unidad1", label: "Unidad 1" },
  { key: "unidad2", label: "Unidad 2" },
];

class UvegProgress extends HTMLElement {
  static get observedAttributes() {
    return ["percent", "done", "total", "message"];
  }

  constructor() {
    super();
    this._activeSection = "presentacion";
  }

  connectedCallback() {
    this._render();
    this._listenTabChanges();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal || !this.isConnected) return;
    this._render();
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const percent = parseInt(this.getAttribute("percent") || "70", 10);
    const done = this.getAttribute("done") || "7";
    const total = this.getAttribute("total") || "10";
    const message = this.getAttribute("message") || "Avanzando muy bien";

    // Calcular stroke-dasharray para el ring
    const filled = (percent / 100) * RING_CIRCUMFERENCE;
    const empty = RING_CIRCUMFERENCE - filled;

    this.innerHTML = `
      <div class="rpanel">

        <!-- Ring de progreso general -->
        <div class="rp-title">Tu progreso</div>
        <div class="pc-wrap">
          <div class="pc-ring" role="img" aria-label="Progreso: ${percent}%">
            <svg width="86" height="86" viewBox="0 0 86 86" aria-hidden="true">
              <circle
                cx="43" cy="43" r="34"
                fill="none"
                stroke="var(--color-border)"
                stroke-width="6"/>
              <circle
                cx="43" cy="43" r="34"
                fill="none"
                stroke="url(#uveg-progress-grd)"
                stroke-width="6"
                stroke-dasharray="${filled.toFixed(1)} ${empty.toFixed(1)}"
                stroke-dashoffset="53.4"
                stroke-linecap="round"
                data-progress-ring/>
              <defs>
                <linearGradient id="uveg-progress-grd" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stop-color="var(--uveg-blue)"/>
                  <stop offset="100%" stop-color="var(--uveg-navy)"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="pc-ring-label" aria-hidden="true">${percent}%</div>
          </div>
          <p>
            <strong>${message}</strong><br>
            ${done} de ${total} actividades<br>completadas
          </p>
          <button class="rp-link" aria-label="Ver detalle de progreso">
            Ver detalle
            <i class="ti ti-arrow-right" style="font-size:10px" aria-hidden="true"></i>
          </button>
        </div>

        <div class="rp-sep" role="separator"></div>

        <!-- Secciones del módulo -->
        <div class="rp-title">En esta sección</div>
        <nav class="sec-list" role="navigation" aria-label="Secciones del módulo">
          ${SECTIONS.map(
            (sec, i) => `
            <div
              class="sec-item${sec.key === this._activeSection ? " active" : ""}"
              data-section="${sec.key}"
              role="button"
              tabindex="0"
              aria-current="${sec.key === this._activeSection ? "true" : "false"}">
              <div class="sec-num${sec.key === this._activeSection ? " active" : ""}"
                aria-hidden="true">${i + 1}</div>
              <span class="sec-name">${sec.label}</span>
            </div>
          `,
          ).join("")}
        </nav>

        <div class="rp-sep" role="separator"></div>

        <!-- Próximas actividades -->
        <div class="rp-title">Próximas actividades</div>
        ${UPCOMING.map(
          (item) => `
          <div class="prox-item">
            <div class="prox-icon"
              style="background:${item.iconBg}"
              aria-hidden="true">
              <i class="ti ${item.icon}" style="font-size:13px;color:${item.iconColor}"></i>
            </div>
            <div class="prox-info">
              <div class="prox-name" title="${item.name}">${item.name}</div>
              <div class="prox-date">${item.date}</div>
            </div>
            <span class="prox-badge"
              style="background:${item.badgeBg};color:${item.badgeColor}">
              ${item.badge}
            </span>
          </div>
        `,
        ).join("")}

        <button class="rp-link" style="margin-top:10px" aria-label="Ver calendario completo">
          <i class="ti ti-calendar" style="font-size:10px" aria-hidden="true"></i>
          Ver calendario completo
        </button>

      </div>
    `;

    this._bindEvents();
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    this.addEventListener("click", this._handleClick.bind(this));
    this.addEventListener("keydown", this._handleKeydown.bind(this));
  }

  _handleClick(e) {
    const secItem = e.target.closest("[data-section]");
    if (!secItem) return;

    const key = secItem.dataset.section;
    this._setActiveSection(key);

    // Sincronizar tabs del módulo
    this.dispatchEvent(
      new CustomEvent("uveg:navigate", {
        bubbles: true,
        composed: true,
        detail: { tab: key },
      }),
    );
  }

  _handleKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const secItem = e.target.closest("[data-section]");
    if (secItem) {
      e.preventDefault();
      secItem.click();
    }
  }

  _setActiveSection(key) {
    this._activeSection = key;

    this.querySelectorAll("[data-section]").forEach((el) => {
      const isActive = el.dataset.section === key;
      el.classList.toggle("active", isActive);
      el.setAttribute("aria-current", String(isActive));

      const num = el.querySelector(".sec-num");
      if (num) num.classList.toggle("active", isActive);
    });
  }

  /**
   * Escucha cambios de tab desde uveg-tabs para mantener
   * el panel derecho sincronizado automáticamente.
   */
  _listenTabChanges() {
    window.addEventListener("uveg:tabchange", (e) => {
      const key = e.detail?.tab;
      if (key && SECTIONS.find((s) => s.key === key)) {
        this._setActiveSection(key);
      }
    });
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Actualiza el progreso con animación del ring.
   * @param {number} percent - Nuevo porcentaje (0-100)
   * @param {number} done    - Actividades completadas
   * @param {number} total   - Total de actividades
   */
  updateProgress(percent, done, total) {
    this.setAttribute("percent", percent);
    this.setAttribute("done", done);
    this.setAttribute("total", total);
  }
}

customElements.define("uveg-progress", UvegProgress);
