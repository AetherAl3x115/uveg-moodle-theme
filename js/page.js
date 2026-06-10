/**
 * js/page.js
 * ─────────────────────────────────────────────────────────────
 * Lógica específica de index.html.
 * Maneja: animación de progreso, cards de presentación,
 * toggle vista tarjetas/lista, SPA para lesson/reto/scorm views.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "./utils/icons.js";

/* ── SVGs custom de presentación ────────────────────────────── */
const PRES_SVG = {
  alcances: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="m21.053 10.22c-1.554-3.627-5.107-5.97-9.053-5.97s-7.499 2.343-9.053 5.97c-.484 1.131-.484 2.43 0 3.561 1.554 3.627 5.107 5.97 9.053 5.97s7.499-2.343 9.053-5.97c.484-1.131.484-2.43 0-3.561zm-1.379 2.97c-1.317 3.073-4.329 5.06-7.674 5.06s-6.356-1.986-7.674-5.06c-.324-.757-.324-1.624 0-2.381 1.317-3.073 4.329-5.06 7.674-5.06s6.356 1.986 7.674 5.06c.324.757.324 1.624 0 2.381zm-7.674-5.94c-2.619 0-4.75 2.131-4.75 4.75s2.131 4.75 4.75 4.75 4.75-2.131 4.75-4.75-2.131-4.75-4.75-4.75zm0 8c-1.792 0-3.25-1.458-3.25-3.25s1.458-3.25 3.25-3.25 3.25 1.458 3.25 3.25-1.458 3.25-3.25 3.25z"/></svg>`,

  esquema: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="M283.819,141.397c51.282,12.485,89.351,58.71,89.351,113.825c0,13.303-2.218,26.087-6.304,38.005l108.37,73.675C492.349,333.388,502,295.432,502,255.222c0-126.432-95.416-230.582-218.181-244.396V141.397z"/><path d="M336.802,340.057c-21.022,20.021-49.477,32.312-80.802,32.312s-59.78-12.291-80.802-32.312L67.507,413.271c45.126,53.741,112.819,87.903,188.493,87.903s143.367-34.162,188.493-87.903L336.802,340.057z"/><path d="M145.134,293.227c-4.086-11.917-6.304-24.702-6.304-38.005c0-55.115,38.069-101.34,89.351-113.825V10.826C105.416,24.641,10,128.791,10,255.222c0,40.21,9.651,78.166,26.764,111.679L145.134,293.227z"/><line x1="213.237" y1="231.133" x2="308.763" y2="231.133"/><line x1="213.237" y1="280.867" x2="308.763" y2="280.867"/></svg>`,

  metodologia: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="currentColor"><path d="m509.736 290.245c-6.412 47.875-26.265 92.851-57.409 130.064-43.889 52.441-105.572 84.652-173.688 90.7-7.721.685-15.426 1.025-23.084 1.025-56.297.002-110.428-18.364-155.335-52.868l2.618 29.488c.488 5.501-3.575 10.357-9.077 10.845-.3.027-.6.04-.896.04-5.123 0-9.487-3.916-9.949-9.116l-4.861-54.761c-.488-5.501 3.575-10.357 9.076-10.845l54.755-4.861c5.512-.482 10.357 3.575 10.846 9.077.488 5.501-3.575 10.357-9.076 10.845l-32.002 2.841c41.542 32.175 91.731 49.314 143.936 49.315 7.063 0 14.159-.313 21.28-.946 62.795-5.575 119.659-35.27 160.119-83.614 57.862-69.137 71.368-163.448 35.248-246.129-2.211-5.061.1-10.956 5.161-13.167 5.057-2.211 10.956.099 13.167 5.16 18.781 42.99 25.411 90.332 19.171 136.907zm-110.435-221.758-30.273 2.688c-5.501.488-9.564 5.344-9.076 10.845.462 5.201 4.826 9.117 9.949 9.116.296 0 .596-.013.896-.04l54.761-4.862c5.501-.488 9.564-5.344 9.076-10.845l-4.861-54.755c-.489-5.501-5.346-9.559-10.846-9.077-5.501.488-9.564 5.344-9.076 10.845l2.76 31.093c-51.165-39.644-114.425-58.258-179.253-52.505-68.115 6.048-129.798 38.259-173.687 90.7-31.145 37.213-50.995 82.188-57.408 130.064-6.237 46.573.392 93.916 19.17 136.909 1.642 3.758 5.314 6 9.169 6 1.336 0 2.695-.27 3.998-.838 5.061-2.21 7.372-8.105 5.161-13.167-36.116-82.688-22.611-177 35.248-246.132 81.273-97.112 224.675-112.249 324.292-36.039zm-67.996 187.2c0 41.317-33.613 74.93-74.929 74.93s-74.93-33.613-74.93-74.93c0-41.316 33.613-74.93 74.93-74.93 41.315 0 74.929 33.614 74.929 74.93zm-20 0c0-30.288-24.641-54.93-54.929-54.93s-54.93 24.642-54.93 54.93c0 30.289 24.642 54.93 54.93 54.93s54.929-24.641 54.929-54.93z"/></svg>`,

  evaluacion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-27 0 512 512" width="22" height="22" fill="currentColor"><path d="m215 492c0 11.046875-8.953125 20-20 20h-115c-44.113281 0-80-35.886719-80-80v-352c0-44.113281 35.886719-80 80-80h245.890625c44.109375 0 80 35.886719 80 80v212c0 11.046875-8.957031 20-20 20-11.046875 0-20-8.953125-20-20v-212c0-22.054688-17.945313-40-40-40h-245.890625c-22.054688 0-40 17.945312-40 40v352c0 22.054688 17.945312 40 40 40h115c11.046875 0 20 8.953125 20 20zm235.640625-166.261719c-8.980469-6.429687-21.472656-4.359375-27.902344 4.617188l-98.582031 137.703125c-2.691406 3.121094-6.066406 3.792968-7.871094 3.914062-1.867187.121094-5.476562-.113281-8.574218-3.0625l-63.820313-61.28125c-7.964844-7.648437-20.625-7.394531-28.277344.574219-7.652343 7.96875-7.394531 20.628906.574219 28.277344l63.882812 61.34375c9.570313 9.105469 22.339844 14.175781 35.480469 14.175781 1.128907 0 2.261719-.039062 3.394531-.113281 14.3125-.953125 27.675782-7.914063 36.664063-19.101563.230469-.285156.457031-.582031.671875-.882812l98.980469-138.261719c6.429687-8.980469 4.363281-21.472656-4.621094-27.902344zm-144.75-205.738281h-206c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h206c11.042969 0 20-8.953125 20-20s-8.957031-20-20-20zm20 100c0-11.046875-8.957031-20-20-20h-206c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h206c11.042969 0 20-8.953125 20-20zm-226 60c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h125.109375c11.046875 0 20-8.953125 20-20s-8.953125-20-20-20zm0 0"/></svg>`,

  cronograma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="22" height="22" fill="currentColor"><path d="m39.5 30.6c-2.3 2.3-4.5 4.5-6.8 6.8-1.4-1.4-2.9-2.9-4.3-4.3-1.8-1.8-4.7 1-2.8 2.8 1.9 1.9 3.8 3.8 5.7 5.7.8.8 2.1.8 2.8 0l8.2-8.2c1.9-1.8-.9-4.6-2.8-2.8z"/><path d="m51.6 8.8c0-.2 0-.4 0-.6 0-1-.9-2-2-2s-2 .9-2 2v.6h-24.7v-.1c0-.2 0-.4 0-.6 0-1-.9-2-2-2s-2 .9-2 2v.8c-4.6 0-8.4 3.8-8.4 8.4v7.7c-.1.3-.2.5-.2.8-.6 4.3-1.6 8.6-3 12.7-.7 1.9-1.5 3.9-2.4 5.7-.8 1.7-.7 3.6.3 5.1s2.6 2.4 4.4 2.4h1.1c.9 3.7 4.2 6.4 8.2 6.4h32.4c4.6 0 8.4-3.8 8.4-8.4v-32.5c0-4.6-3.6-8.2-8.1-8.4zm-32.8 4v.4c0 1 .9 2 2 2s2-.9 2-2c0-.1 0-.3 0-.4h24.8v.6c0 1 .9 2 2 2s2-.9 2-2c0-.2 0-.4 0-.6 2.3.2 4.1 2.1 4.1 4.4v4.8c-.1 0-.3 0-.4 0h-40.9v-4.8c0-2.5 2-4.4 4.4-4.4zm-10.3 34.3c-.2-.4-.3-.8-.1-1.2.9-2 1.8-4 2.5-6.1 1.5-4.4 2.6-8.9 3.2-13.5 0-.1.1-.2.2-.2h40.9s.1 0 .2.1c0 0 .1.1.1.2-.5 4.5-1.5 8.9-2.9 13.1-.7 2.1-1.6 4.2-2.6 6.3-.6 1.2-1.9 2-3.3 2h-37.1c-.5-.2-.9-.4-1.1-.7zm42.8 6.9h-32.5c-1.7 0-3.1-1-3.9-2.4h31.7c2.9 0 5.6-1.7 6.9-4.3.8-1.6 1.5-3.3 2.1-5v7.3c.1 2.4-1.9 4.4-4.3 4.4z"/></svg>`,
};

const PRES_COMPONENT = {
  alcances: "uveg-pres-alcances",
  esquema: "uveg-pres-esquema",
  metodologia: "uveg-pres-metodologia",
  evaluacion: "uveg-pres-evaluacion",
  cronograma: "uveg-pres-cronograma",
};

function initPresentacionIcons() {
  document.querySelectorAll("[data-pres]").forEach((card) => {
    const key = card.dataset.pres;
    const wrap = card.querySelector(".pres-icon-wrap");
    if (wrap && PRES_SVG[key]) wrap.innerHTML = PRES_SVG[key];
  });
}

function initProgressBar() {
  const fill = document.querySelector(".pfill");
  const ppct = document.querySelector(".ppct");
  const pbar = document.querySelector(".pbar");
  if (!fill) return;

  function calcPct() {
    try {
      const raw = localStorage.getItem("uveg-cronograma-state");
      const state = raw ? JSON.parse(raw) : { completed: {} };
      const total = 14;
      const done = Object.values(state.completed).filter(Boolean).length;
      return total ? Math.round((done / total) * 100) : 0;
    } catch {
      return 0;
    }
  }

  function updateBar(pct) {
    if (pbar) pbar.setAttribute("aria-valuenow", pct);
    fill.style.width = pct + "%";
    if (ppct) ppct.textContent = pct + "%";

    // Mismo criterio que PROG_STATES en uveg-pres-cronograma.js
    fill.classList.remove(
      "state-atrasado",
      "state-regular",
      "state-corriente",
      "state-completo",
    );
    ppct.classList.remove(
      "state-atrasado",
      "state-regular",
      "state-corriente",
      "state-completo",
    );

    let state;
    if (pct >= 99) state = "state-completo";
    else if (pct >= 65) state = "state-corriente";
    else if (pct >= 30) state = "state-regular";
    else state = "state-atrasado";

    fill.classList.add(state);
    if (ppct) ppct.classList.add(state);
  }

  requestAnimationFrame(() => setTimeout(() => updateBar(calcPct()), 100));

  document.addEventListener("uveg:cronoprogress", (e) =>
    updateBar(e.detail.pct),
  );
}

function initPresentacionCards() {
  const first = document.querySelector("[data-pres]");
  if (first) _activatePres(first);
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pres]");
    if (!card) return;
    _activatePres(card);
  });
}

const _presCache = {};

function _activatePres(card) {
  const key = card.dataset.pres;
  const componentTag = PRES_COMPONENT[key];
  if (!componentTag) return;

  document.querySelectorAll("[data-pres]").forEach((c) => {
    c.classList.toggle("active", c === card);
    c.setAttribute("aria-selected", String(c === card));
  });

  const color = getComputedStyle(card).getPropertyValue("--pres-color").trim();
  const bg = getComputedStyle(card).getPropertyValue("--pres-bg").trim();
  const label = card.querySelector(".pres-label")?.textContent || "";
  const pc = document.getElementById("pres-content");
  if (!pc) return;

  pc.style.opacity = "0";
  pc.offsetHeight;
  pc.style.transition = "opacity .25s ease";
  pc.style.opacity = "1";
  setTimeout(() => (pc.style.transition = ""), 260);

  pc.style.setProperty("--pres-color", color);
  pc.style.setProperty("--pres-bg", bg);

  Object.values(_presCache).forEach((el) => (el.style.display = "none"));

  if (key === "cronograma") _flushCronoPending();

  if (!_presCache[key]) {
    const header = document.createElement("div");
    header.className = "pres-content-header";
    header.style.cssText = `--pres-color:${color};--pres-bg:${bg}`;
    header.innerHTML = `
      <span class="pres-content-pill">
        <span class="pres-content-pill-icon">${PRES_SVG[key] || ""}</span>
        ${label}
      </span>`;

    const comp = document.createElement(componentTag);
    if (key === "esquema") {
      comp.setAttribute("src", "./assets/img/esquema.jpg");
      comp.setAttribute("alt", "Ciclo de Planeación Estratégica Educativa");
    }

    const wrapper = document.createElement("div");
    wrapper.dataset.presWrapper = key;
    wrapper.appendChild(header);
    wrapper.appendChild(comp);

    pc.appendChild(wrapper);
    _presCache[key] = wrapper;
  } else {
    _presCache[key].style.display = "";
  }
}

function _applyViewMode(tvWrap, mode) {
  const outerCard = tvWrap.closest(".unit-outer-card");
  if (!outerCard) return;
  tvWrap.querySelectorAll("[data-view]").forEach((b) => {
    const active = b.dataset.view === mode;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  outerCard.querySelectorAll(".cards-grid").forEach((grid) => {
    grid.classList.toggle("view-list", mode === "list");
  });
  outerCard.querySelectorAll("uveg-card").forEach((card) => {
    const bw = card.querySelector("[data-bw]");
    const bi = card.querySelector("[data-bi]");
    if (bw && bi && card.querySelector(".card.open")) {
      bw.style.height = "auto";
      requestAnimationFrame(() => {
        bw.style.height = bi.scrollHeight + "px";
      });
    }
  });
}

function _applyViewModeToPanel(panel, mode) {
  // Actualizar botones del tv-wrap que existe en el panel
  panel.querySelectorAll(".tv-wrap [data-view]").forEach((b) => {
    const active = b.dataset.view === mode;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  // Aplicar a todos los cards-grid del panel
  panel.querySelectorAll(".cards-grid").forEach((grid) => {
    grid.classList.toggle("view-list", mode === "list");
  });
  // Recalcular altura de cards abiertos
  panel.querySelectorAll("uveg-card").forEach((card) => {
    const bw = card.querySelector("[data-bw]");
    const bi = card.querySelector("[data-bi]");
    if (bw && bi && card.querySelector(".card.open")) {
      bw.style.height = "auto";
      requestAnimationFrame(() => {
        bw.style.height = bi.scrollHeight + "px";
      });
    }
  });
}

function initViewToggle() {
  // Default lista en todos los paneles al cargar
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    _applyViewModeToPanel(panel, "list");
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    const panel = btn.closest("[data-panel]");
    if (!panel) return;
    _applyViewModeToPanel(panel, btn.dataset.view);
  });
}

/* ── Helpers SPA ────────────────────────────────────────────── */
function _getPanels(center, ...exclude) {
  return [
    ...center.querySelectorAll("[data-panel]"),
    center.querySelector("uveg-tabs"),
    center.querySelector(".hrow"),
    center.querySelector(".breadcrumb-nav"),
  ].filter((el) => el && !exclude.includes(el));
}

function _hidePanels(panels) {
  panels.forEach((el) => {
    el.dataset.lvHidden = el.style.display || "";
    el.style.display = "none";
  });
}

function _showPanels(panels) {
  panels.forEach((el) => {
    el.style.display = el.dataset.lvHidden || "";
    delete el.dataset.lvHidden;
  });
}

/* ── Reto View SPA ──────────────────────────────────────────── */
function initRetoView() {
  const center = document.querySelector(".center");
  const rv = document.querySelector("uveg-reto-view");
  if (!center || !rv) return;

  customElements.whenDefined("uveg-reto-view").then(() => {
    _bindRetoViewEvents(center, rv);
  });
}

function _bindRetoViewEvents(center, rv) {
  document.addEventListener("uveg:openscorm", (e) => {
    const { viewType = "scorm" } = e.detail || {};
    if (viewType !== "reto") return;

    const { title = "", scormTitle = "", cardId = "", actId = "" } = e.detail;
    _hidePanels(_getPanels(center, rv));
    rv.show({
      title: scormTitle || title,
      cardId,
      actId,
      type: "reto",
      state: "progress",
      attempts: 3,
    });
    setTimeout(() => {
      center.scrollTop = 0;
    }, 50);
  });

  rv.addEventListener("uveg:retoback", () => {
    rv.hide();
    _showPanels(_getPanels(center, rv));
    center.scrollTop = 0;
  });
}

/* ── Scorm View SPA ─────────────────────────────────────────── */
function initScormView() {
  const center = document.querySelector(".center");
  const sv = document.querySelector("uveg-scorm-view");
  if (!center || !sv) return;

  customElements.whenDefined("uveg-scorm-view").then(() => {
    _bindScormViewEvents(center, sv);
  });
}

function _bindScormViewEvents(center, sv) {
  document.addEventListener("uveg:openscorm", (e) => {
    const { viewType = "scorm" } = e.detail || {};
    if (viewType !== "scorm") return;

    const {
      title = "",
      scormTitle = "",
      cardId = "",
      actId = "",
      type = "lectura",
      src = "",
    } = e.detail;
    _hidePanels(_getPanels(center, sv));
    sv.show({
      title: scormTitle || title,
      cardId,
      actId,
      type,
      state: "progress",
      src,
    });
    setTimeout(() => {
      center.scrollTop = 0;
    }, 50);
  });

  sv.addEventListener("uveg:scormback", () => {
    sv.hide();
    _showPanels(_getPanels(center, sv));
    center.scrollTop = 0;
  });
}

const _cronoPending = new Set();

function _markCronoAct(actId) {
  const crono = document.querySelector("uveg-pres-cronograma");
  if (crono && typeof crono.markCompleted === "function") {
    crono.markCompleted(actId);
  } else {
    _cronoPending.add(actId);
  }
}

function _flushCronoPending() {
  const crono = document.querySelector("uveg-pres-cronograma");
  if (!crono || typeof crono.markCompleted !== "function") return;
  _cronoPending.forEach((id) => crono.markCompleted(id));
  _cronoPending.clear();
}

/* ── Activity Complete — conecta con cronograma y card ──────── */
function initActivityComplete() {
  document.addEventListener("uveg:activitycomplete", (e) => {
    const { actId, cardId } = e.detail || {};

    // 1. Marcar en cronograma
    _markCronoAct(actId);

    // 2. Actualizar estado de la uveg-card correspondiente
    if (cardId !== undefined && cardId !== null) {
      const card = document.querySelector(`uveg-card[card-id="${cardId}"]`);
      if (!card) return;
      const isReto = card.getAttribute("variant") === "reto";
      if (isReto) {
        card.markRetoDone?.(e.detail?.score);
      } else {
        card.markSubActDone?.(actId);
      }
    }
  });
}

/* ── Sesiones View SPA (sin cambios) ────────────────────────── */
function initSesionesView() {
  const center = document.querySelector(".center");
  const sv = document.querySelector("uveg-sesiones-view");
  if (!center || !sv) return;

  customElements.whenDefined("uveg-sesiones-view").then(() => {
    _bindSesionesViewEvents(center, sv);
  });
}

function _bindSesionesViewEvents(center, sv) {
  const getSiblings = () =>
    [
      center.querySelector("uveg-tabs"),
      center.querySelector(".hrow"),
      center.querySelector(".breadcrumb-nav"),
    ].filter(Boolean);

  document.addEventListener("uveg:opensesiones", (e) => {
    const lv = document.querySelector("uveg-lesson-view");
    if (lv) lv.hide();
    getSiblings().forEach((el) => {
      el.style.display = "none";
    });
    center.classList.add("sv-active");
    sv.show(e.detail?.person || {});
    setTimeout(() => {
      center.scrollTop = 0;
    }, 50);
  });

  sv.addEventListener("uveg:sesionesback", () => {
    sv.hide();
    center.classList.remove("sv-active");
    getSiblings().forEach((el) => {
      el.style.display = "";
    });
    center.scrollTop = 0;
  });
}

// ── Reto tabs U1 ─────────────────────────────────────────
document.querySelectorAll("#reto-tabs-u1 .reto-tab-node").forEach((node) => {
  node.addEventListener("click", () => {
    const tabs = document.getElementById("reto-tabs-u1");
    document.querySelectorAll("#reto-tabs-u1 .reto-tab-node").forEach((n) => {
      n.classList.remove("active");
      n.setAttribute("aria-pressed", "false");
    });
    node.classList.add("active");
    node.setAttribute("aria-pressed", "true");
    const reto = node.dataset.reto;
    tabs.dataset.active = reto;
    document.getElementById("u1-r1").style.display =
      reto === "r1" ? "" : "none";
    document.getElementById("u1-r2").style.display =
      reto === "r2" ? "" : "none";
  });
});

/* ── Init ───────────────────────────────────────────────────── */
initProgressBar();
initPresentacionIcons();
initPresentacionCards();
initViewToggle();
initRetoView();
initScormView();
initActivityComplete();
initSesionesView();
