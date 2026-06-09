/**
 * components/uveg-presentacion/uveg-pres-cronograma.js
 * ─────────────────────────────────────────────────────────────
 * Light DOM — hereda estilos de main.css y variables.css.
 * Iconografía via hi() — Heroicons 2 Outline.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const STORAGE_KEY = "uveg-cronograma-state";

const TYPE_CONFIG = {
  video: { icon: "play", hour: "10:00", cssVar: "video" },
  lectura: { icon: "book", hour: "08:00", cssVar: "lectura" },
  podcast: { icon: "message", hour: "11:00", cssVar: "podcast" },
  presentacion: { icon: "chart-bar", hour: "09:00", cssVar: "presentacion" },
  infografia: { icon: "chart-bar", hour: "12:00", cssVar: "infografia" },
};

const PROG_STATES = {
  atrasado: {
    min: 0,
    max: 30,
    icon: "mood-sad",
    msg: "Vas atrasado",
    cls: "state-atrasado",
  },
  regular: {
    min: 30,
    max: 65,
    icon: "mood-neutral",
    msg: "Vas más o menos",
    cls: "state-regular",
  },
  corriente: {
    min: 65,
    max: 99,
    icon: "mood-happy",
    msg: "Vas al corriente",
    cls: "state-corriente",
  },
  completo: {
    min: 99,
    max: 101,
    icon: "mood-happy",
    msg: "¡Módulo completo!",
    cls: "state-completo",
  },
};

// Valores del simulador para ciclar los 4 estados
const SIM_STEPS = [0, 35, 70, 100];

function _getProgState(pct) {
  return (
    Object.values(PROG_STATES).find((s) => pct >= s.min && pct < s.max) ||
    PROG_STATES.atrasado
  );
}

const DEFAULT_DATA = {
  startDate: "2025-06-02",
  totalDays: 30,
  units: [
    {
      title: "Unidad 1",
      reto: "Reto 1. Planeación estratégica institucional",
      activities: [
        { id: "l1-video", label: "L1. Video", type: "video" },
        { id: "l1-lect", label: "L1. Lectura", type: "lectura" },
        { id: "l2-pod", label: "L2. Podcast", type: "podcast" },
        { id: "l2-pres", label: "L2. Presentación", type: "presentacion" },
        { id: "l3-info", label: "L3. Infografía", type: "infografia" },
        { id: "l3-lect", label: "L3. Lectura", type: "lectura" },
        { id: "l4-pres", label: "L4. Presentación", type: "presentacion" },
        { id: "l4-video", label: "L4. Video", type: "video" },
      ],
    },
    {
      title: "Unidad 2",
      reto: "Reto 2. Implementación y evaluación tecnológica",
      activities: [
        { id: "l5-pod", label: "L5. Podcast", type: "podcast" },
        { id: "l5-info", label: "L5. Infografía", type: "infografia" },
        { id: "l6-lect", label: "L6. Lectura", type: "lectura" },
        { id: "l6-pres", label: "L6. Presentación", type: "presentacion" },
      ],
    },
  ],
};

const VIEWS = { MES: "mes", SEMANA: "semana", LISTA: "lista" };
const VIEW_ORDER = [VIEWS.MES, VIEWS.SEMANA, VIEWS.LISTA];

class UvegPresCronograma extends HTMLElement {
  connectedCallback() {
    this._data = this._parseData();
    this._state = this._loadState();
    this._schedule = this._buildSchedule();
    this._view = VIEWS.MES;
    this._viewIdx = 0;
    this._filter = null;
    this._simStep = 0; // índice en SIM_STEPS
    this._simPct = null; // null = usa progreso real
    this._viewDate = new Date(this._data.startDate + "T00:00:00");
    this._render();
    this._bindEvents();
  }

  /* ── Parsing ──────────────────────────────────────────────── */

  _parseData() {
    const raw = this.getAttribute("data");
    if (!raw) return DEFAULT_DATA;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[uveg-pres-cronograma] JSON inválido:", e);
      return DEFAULT_DATA;
    }
  }

  _loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { completed: {}, positions: {} };
    } catch {
      return { completed: {}, positions: {} };
    }
  }

  _saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
    } catch {}
  }

  /* ── Algoritmo ────────────────────────────────────────────── */

  _buildSchedule() {
    const { startDate, totalDays, units } = this._data;
    const start = new Date(startDate + "T00:00:00");
    const totalActs = units.reduce((s, u) => s + u.activities.length, 0);
    const schedule = {};

    const addItem = (date, item) => {
      const key = _dateKey(date);
      if (!schedule[key]) schedule[key] = [];
      schedule[key].push(item);
    };

    let dayOffset = 0;
    units.forEach((unit, unitIdx) => {
      const proportion = unit.activities.length / totalActs;
      const unitDays =
        unitIdx === units.length - 1
          ? totalDays - 1 - dayOffset
          : Math.round(totalDays * proportion) - 1;
      const unitEnd = dayOffset + unitDays;
      const available = unitEnd - dayOffset;
      const step =
        available > 0
          ? Math.max(1, Math.floor(available / unit.activities.length))
          : 1;

      unit.activities.forEach((act, i) => {
        if (this._state.positions[act.id]) return;
        const d = new Date(start);
        d.setDate(
          d.getDate() +
            dayOffset +
            Math.min(i * step, Math.max(0, available - 1)),
        );
        addItem(d, { ...act, itemType: "activity", unitIdx });
      });

      const retoDate = new Date(start);
      retoDate.setDate(retoDate.getDate() + unitEnd);
      addItem(retoDate, {
        id: `reto-${unitIdx}`,
        label: unit.reto,
        type: "reto",
        itemType: "reto",
        unitIdx,
        fixed: true,
      });

      dayOffset = unitEnd + 1;
    });

    units.forEach((unit) => {
      unit.activities.forEach((act) => {
        const customDate = this._state.positions[act.id];
        if (!customDate) return;
        for (const key of Object.keys(schedule)) {
          schedule[key] = (schedule[key] || []).filter((i) => i.id !== act.id);
        }
        if (!schedule[customDate]) schedule[customDate] = [];
        schedule[customDate].push({ ...act, itemType: "activity" });
      });
    });

    return schedule;
  }

  _progress() {
    // Si hay simulación activa, devuelve el pct simulado
    if (this._simPct !== null) {
      return {
        total: 14,
        done: Math.round((14 * this._simPct) / 100),
        pct: this._simPct,
      };
    }
    const { units } = this._data;
    let total = 0,
      done = 0;
    units.forEach((unit, i) => {
      unit.activities.forEach((act) => {
        total++;
        if (this._state.completed[act.id]) done++;
      });
      total++;
      if (this._state.completed[`reto-${i}`]) done++;
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  /* ── Render ───────────────────────────────────────────────── */

  _render() {
    const { done, total, pct } = this._progress();
    const progState = _getProgState(pct);
    const modEnd = _addDays(this._data.startDate, this._data.totalDays - 1);
    const isSim = this._simPct !== null;

    this.innerHTML = `
      <div class="pres-crono">

        <div class="pres-crono-topbar">
          <div class="pres-crono-prog-face-row">
            <div class="pres-crono-prog-face ${progState.cls}">
              ${hi(progState.icon, 20)}
            </div>
            <div class="pres-crono-prog-nums">
              <div class="pres-crono-prog-pct ${progState.cls}">${pct}<small>%</small></div>
              <div class="pres-crono-prog-sublabel">${done} de ${total} actividades</div>
            </div>
            <div class="pres-crono-prog-status-msg ${progState.cls}">${progState.msg}</div>
            <button class="pres-crono-sim-btn" data-action="sim">
              ${hi("play", 12)}
              ${isSim ? `Simulando ${pct}%` : "Simular estados"}
            </button>
          </div>

          <div class="pres-crono-prog-track">
            <div class="pres-crono-prog-fill ${progState.cls}" style="width:${pct}%"></div>
            <div class="pres-crono-prog-segments">${this._renderSegments()}</div>
          </div>

          <div class="pres-crono-prog-dates">
            <span>${_formatDate(new Date(this._data.startDate + "T00:00:00"))}</span>
            <span>${_formatDate(new Date(modEnd + "T00:00:00"))}</span>
          </div>

          <div class="pres-crono-hint">
   ${hi("info-circle", 14)}
            Fechas sugeridas por el algoritmo — arrastra las actividades libremente
          </div>
        </div>

        <div class="pres-crono-toolbar">
          <div class="pres-crono-nav">
            <button class="pres-crono-nav-btn" data-action="prev">${hi("chevron-left", 14)}</button>
            <span class="pres-crono-nav-label" id="crono-nav-label"></span>
            <button class="pres-crono-nav-btn" data-action="next">${hi("chevron-right", 14)}</button>
          </div>

          <div class="pres-crono-views">
            <span class="pres-crono-views-label">Vista:</span>
            ${VIEW_ORDER.map((v, i) => {
              const label = v.charAt(0).toUpperCase() + v.slice(1);
              const isActive = this._view === v;
              return `
                <button class="pres-crono-view-btn${isActive ? " active fill-from-left" : ""}"
                        data-view="${v}" data-vidx="${i}">
                  <span class="crono-view-hover-bg" aria-hidden="true"></span>
                  ${label}
                </button>`;
            }).join("")}
          </div>

          <div class="pres-crono-filters">
            ${hi("funnel", 13)}
            <select class="pres-crono-filter-sel" id="crono-filter">
              <option value="">Todos</option>
              <option value="video">Video</option>
              <option value="lectura">Lectura</option>
              <option value="podcast">Podcast</option>
              <option value="presentacion">Presentación</option>
              <option value="infografia">Infografía</option>
              <option value="reto">Reto</option>
            </select>
          </div>
        </div>

        <div id="crono-body"></div>

        <div class="pres-crono-legend">
          ${["video", "lectura", "podcast", "presentacion", "infografia"]
            .map(
              (t) => `
            <div class="pres-crono-legend-item">
              <span class="pres-crono-legend-dot ld-${t}"></span>
              ${t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          `,
            )
            .join("")}
          <div class="pres-crono-legend-item">
            <span class="pres-crono-legend-dot ld-reto"></span>Reto (fijo)
          </div>
          <span class="pres-crono-legend-right">
            ${hi("calendar-days", 12)} Fechas sugeridas
          </span>
        </div>

      </div>
    `;

    this._renderBody();

    if (this._simPct === null) {
      this.dispatchEvent(
        new CustomEvent("uveg:cronoprogress", {
          bubbles: true,
          detail: { pct },
        }),
      );
    }
  }

  _renderSegments() {
    const { units } = this._data;
    const total = units.reduce((s, u) => s + u.activities.length + 1, 0);
    return units
      .map((unit, i) => {
        const unitTotal = unit.activities.length + 1;
        const width = Math.round((unitTotal / total) * 100);
        return `<div class="pres-crono-seg" style="width:${width}%" title="${unit.title}"></div>`;
      })
      .join("");
  }

  /* ── Body ─────────────────────────────────────────────────── */

  _renderBody() {
    const body = this.querySelector("#crono-body");
    if (!body) return;
    if (this._view === VIEWS.MES) body.innerHTML = this._renderMes();
    if (this._view === VIEWS.SEMANA) body.innerHTML = this._renderSemana();
    if (this._view === VIEWS.LISTA) body.innerHTML = this._renderLista();
    this._updateNavLabel();
  }

  _updateNavLabel() {
    const label = this.querySelector("#crono-nav-label");
    if (!label) return;
    const y = this._viewDate.getFullYear();
    const m = this._viewDate.getMonth();
    if (this._view === VIEWS.MES) {
      label.textContent = new Date(y, m, 1).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      });
    } else if (this._view === VIEWS.SEMANA) {
      const mon = _startOfWeek(this._viewDate);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      label.textContent = `${mon.getDate()} – ${sun.getDate()} ${sun.toLocaleDateString("es-MX", { month: "short", year: "numeric" })}`;
    } else {
      label.textContent = "Todas las actividades";
    }
  }

  /* ── Vistas ───────────────────────────────────────────────── */

  _renderMes() {
    const y = this._viewDate.getFullYear();
    const m = this._viewDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7;
    const todayKey = _dateKey(new Date());
    const modStart = this._data.startDate;
    const modEnd = _addDays(this._data.startDate, this._data.totalDays - 1);

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return `
      <div class="pres-crono-cal">
        <div class="pres-crono-dow-row">
          ${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => `<div class="pres-crono-dow">${d}</div>`).join("")}
        </div>
        <div class="pres-crono-weeks">
          ${rows
            .map(
              (row) => `
            <div class="pres-crono-week-row">
              ${row
                .map((date) => {
                  if (!date)
                    return `<div class="pres-crono-cell pres-crono-cell--empty"></div>`;
                  const key = _dateKey(date);
                  const items = this._filteredItems(key);
                  return `
                  <div class="pres-crono-cell${key === todayKey ? " is-today" : ""}${key >= modStart && key <= modEnd ? " in-module" : ""}"
                       data-date="${key}">
                    <div class="cell-num">${date.getDate()}</div>
                    <div class="cell-chips">${items.map((i) => this._renderChip(i)).join("")}</div>
                  </div>`;
                })
                .join("")}
            </div>`,
            )
            .join("")}
        </div>
      </div>`;
  }

  _renderSemana() {
    const mon = _startOfWeek(this._viewDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(d.getDate() + i);
      return d;
    });
    const today = _dateKey(new Date());
    const modStart = this._data.startDate;
    const modEnd = _addDays(this._data.startDate, this._data.totalDays - 1);

    return `
      <div class="pres-crono-semana">
        <div class="pres-crono-semana-header">
          ${days
            .map((d, i) => {
              const key = _dateKey(d);
              return `
              <div class="pres-crono-semana-col-header${key === today ? " is-today" : ""}">
                <span class="semana-dow">${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i]}</span>
                <span class="semana-day-num">${d.getDate()}</span>
              </div>`;
            })
            .join("")}
        </div>
        <div class="pres-crono-semana-body">
          ${days
            .map((d) => {
              const key = _dateKey(d);
              const items = this._filteredItems(key);
              const inMod = key >= modStart && key <= modEnd;
              return `
              <div class="pres-crono-semana-col${inMod ? " in-module" : ""}" data-date="${key}">
                ${items.length ? items.map((i) => this._renderChip(i, true)).join("") : `<div class="semana-empty"></div>`}
              </div>`;
            })
            .join("")}
        </div>
      </div>`;
  }

  _renderLista() {
    const modStart = this._data.startDate;
    const start = new Date(modStart + "T00:00:00");
    const rows = [];

    for (let d = 0; d <= this._data.totalDays; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      const key = _dateKey(date);
      const items = this._filteredItems(key);
      if (items.length) rows.push({ date, key, items });
    }

    if (!rows.length)
      return `<div class="pres-crono-lista-empty">Sin actividades para el filtro seleccionado.</div>`;

    return `
      <div class="pres-crono-lista">
        ${rows
          .map(
            ({ date, items }) => `
          <div class="pres-crono-lista-row">
            <div class="pres-crono-lista-date">
              <span class="lista-day">${date.getDate()}</span>
              <span class="lista-month">${date.toLocaleDateString("es-MX", { month: "short" })}</span>
            </div>
            <div class="pres-crono-lista-items">
              ${items.map((i) => this._renderChip(i, true)).join("")}
            </div>
          </div>`,
          )
          .join("")}
      </div>`;
  }

  _renderChip(item, wide = false) {
    const done = !!this._state.completed[item.id];
    const isReto = item.itemType === "reto";
    const cfg = isReto ? null : TYPE_CONFIG[item.type] || TYPE_CONFIG.lectura;
    const icon = isReto ? "trophy" : cfg.icon;
    const hour = isReto ? "23:59" : cfg.hour;
    const cssVar = isReto ? "reto" : cfg.cssVar;

    return `
      <div class="pres-crono-chip act-${cssVar}${done ? " is-done" : ""}${wide ? " is-wide" : ""}"
           data-id="${item.id}" data-reto="${isReto}"
           ${!isReto ? 'draggable="true"' : ""} title="${item.label}">
        <span class="chip-icon">${hi(icon, 9)}</span>
        <span class="chip-label">${item.label}</span>
        <span class="chip-hour">${hour}</span>
        ${done ? `<span class="chip-check">${hi("check-circle", 9)}</span>` : ""}
      </div>`;
  }

  _filteredItems(dateKey) {
    const items = this._schedule[dateKey] || [];
    if (!this._filter) return items;
    return items.filter(
      (i) =>
        i.type === this._filter ||
        (this._filter === "reto" && i.itemType === "reto"),
    );
  }

  /* ── Eventos ──────────────────────────────────────────────── */

  _bindEvents() {
    // Nav + simulador
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      if (btn.dataset.action === "sim") {
        // Cicla entre los 4 estados del simulador
        this._simStep = (this._simStep + 1) % SIM_STEPS.length;
        const next = SIM_STEPS[this._simStep];
        // Al llegar al último paso (100%) y volver a 0, limpiar simulación
        this._simPct = next === 0 && this._simStep === 0 ? null : next;
        this._render();
        this._bindEvents();
        return;
      }

      const fwd = btn.dataset.action === "next";
      if (this._view === VIEWS.MES) {
        this._viewDate.setMonth(this._viewDate.getMonth() + (fwd ? 1 : -1));
      } else if (this._view === VIEWS.SEMANA) {
        this._viewDate.setDate(this._viewDate.getDate() + (fwd ? 7 : -7));
      }
      this._renderBody();
    });

    // Cambio de vista con animación direccional
    this.addEventListener("click", (e) => {
      const btn = e.target.closest(".pres-crono-view-btn");
      if (!btn || btn.classList.contains("active")) return;

      const newView = btn.dataset.view;
      const newIdx = parseInt(btn.dataset.vidx);
      const dir = newIdx > this._viewIdx ? "right" : "left";

      // Ripple
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "crono-view-ripple";
      const size = Math.max(btn.offsetWidth, btn.offsetHeight);
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);

      // Drain anterior
      const prevBtn = this.querySelector(".pres-crono-view-btn.active");
      if (prevBtn) {
        prevBtn.classList.remove(
          "active",
          "fill-from-left",
          "fill-from-right",
          "drain-to-left",
          "drain-to-right",
        );
        prevBtn.classList.add(
          dir === "right" ? "drain-to-left" : "drain-to-right",
        );
        setTimeout(
          () => prevBtn.classList.remove("drain-to-left", "drain-to-right"),
          420,
        );
      }

      // Fill nuevo
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

      this._view = newView;
      this._viewIdx = newIdx;
      this._renderBody();
    });

    // Filtro
    const sel = this.querySelector("#crono-filter");
    if (sel)
      sel.addEventListener("change", (e) => {
        this._filter = e.target.value || null;
        this._renderBody();
      });

    // Toggle completada
    this.addEventListener("click", (e) => {
      const chip = e.target.closest(".pres-crono-chip");
      if (!chip) return;
      const id = chip.dataset.id;
      this._state.completed[id] = !this._state.completed[id];
      this._saveState();
      this._schedule = this._buildSchedule();
      this._simPct = null;
      this._render();
      this._bindEvents();
      // Disparar después de guardar y renderizar
      const { pct } = this._progress();
      this.dispatchEvent(
        new CustomEvent("uveg:cronoprogress", {
          bubbles: true,
          detail: { pct },
        }),
      );
    });

    // Drag & drop
    this.addEventListener("dragstart", (e) => {
      const chip = e.target.closest(".pres-crono-chip");
      if (!chip || chip.dataset.reto === "true") {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", chip.dataset.id);
      chip.classList.add("is-dragging");
    });

    this.addEventListener("dragend", (e) => {
      e.target.closest(".pres-crono-chip")?.classList.remove("is-dragging");
    });

    this.addEventListener("dragover", (e) => {
      const cell = e.target.closest("[data-date]");
      if (cell) {
        e.preventDefault();
        cell.classList.add("is-dragover");
      }
    });

    this.addEventListener("dragleave", (e) => {
      e.target.closest("[data-date]")?.classList.remove("is-dragover");
    });

    this.addEventListener("drop", (e) => {
      e.preventDefault();
      const cell = e.target.closest("[data-date]");
      if (!cell?.dataset.date) return;
      cell.classList.remove("is-dragover");
      const id = e.dataTransfer.getData("text/plain");
      const newDate = cell.dataset.date;
      const modEnd = _addDays(this._data.startDate, this._data.totalDays - 1);
      if (newDate < this._data.startDate || newDate > modEnd) return;
      this._state.positions[id] = newDate;
      this._saveState();
      this._schedule = this._buildSchedule();
      this._simPct = null;
      this._render();
      this._bindEvents();
    });
  }

  /* ── API pública ──────────────────────────────────────────── */
  markCompleted(actId) {
    if (!actId) return;
    this._state.completed[actId] = true;
    this._saveState();
    this._simPct = null;
    this._schedule = this._buildSchedule();
    this._render();
    this._bindEvents();
    const { pct } = this._progress();
    this.dispatchEvent(
      new CustomEvent("uveg:cronoprogress", {
        bubbles: true,
        detail: { pct },
      }),
    );
  }
}

/* ── Helpers ────────────────────────────────────────────────── */
function _dateKey(date) {
  return date.toISOString().slice(0, 10);
}
function _addDays(str, days) {
  const d = new Date(str + "T00:00:00");
  d.setDate(d.getDate() + days);
  return _dateKey(d);
}
function _startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function _formatDate(date) {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

customElements.define("uveg-pres-cronograma", UvegPresCronograma);
