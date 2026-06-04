/**
 * js/page.js
 * ─────────────────────────────────────────────────────────────
 * Lógica específica de index.html.
 * Maneja: animación de progreso, cards de presentación,
 * toggle vista tarjetas/lista.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "./utils/icons.js";

/* ── SVGs custom de presentación ────────────────────────────── */
// Inline directo — currentColor hereda el color del contenedor
const PRES_SVG = {
  alcances: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"><path d="m21.053 10.22c-1.554-3.627-5.107-5.97-9.053-5.97s-7.499 2.343-9.053 5.97c-.484 1.131-.484 2.43 0 3.561 1.554 3.627 5.107 5.97 9.053 5.97s7.499-2.343 9.053-5.97c.484-1.131.484-2.43 0-3.561zm-1.379 2.97c-1.317 3.073-4.329 5.06-7.674 5.06s-6.356-1.986-7.674-5.06c-.324-.757-.324-1.624 0-2.381 1.317-3.073 4.329-5.06 7.674-5.06s6.356 1.986 7.674 5.06c.324.757.324 1.624 0 2.381zm-7.674-5.94c-2.619 0-4.75 2.131-4.75 4.75s2.131 4.75 4.75 4.75 4.75-2.131 4.75-4.75-2.131-4.75-4.75-4.75zm0 8c-1.792 0-3.25-1.458-3.25-3.25s1.458-3.25 3.25-3.25 3.25 1.458 3.25 3.25-1.458 3.25-3.25 3.25z"/></svg>`,

  esquema: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"><path d="M283.819,141.397c51.282,12.485,89.351,58.71,89.351,113.825c0,13.303-2.218,26.087-6.304,38.005l108.37,73.675C492.349,333.388,502,295.432,502,255.222c0-126.432-95.416-230.582-218.181-244.396V141.397z"/><path d="M336.802,340.057c-21.022,20.021-49.477,32.312-80.802,32.312s-59.78-12.291-80.802-32.312L67.507,413.271c45.126,53.741,112.819,87.903,188.493,87.903s143.367-34.162,188.493-87.903L336.802,340.057z"/><path d="M145.134,293.227c-4.086-11.917-6.304-24.702-6.304-38.005c0-55.115,38.069-101.34,89.351-113.825V10.826C105.416,24.641,10,128.791,10,255.222c0,40.21,9.651,78.166,26.764,111.679L145.134,293.227z"/><line x1="213.237" y1="231.133" x2="308.763" y2="231.133"/><line x1="213.237" y1="280.867" x2="308.763" y2="280.867"/></svg>`,

  metodologia: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="currentColor"><path d="m509.736 290.245c-6.412 47.875-26.265 92.851-57.409 130.064-43.889 52.441-105.572 84.652-173.688 90.7-7.721.685-15.426 1.025-23.084 1.025-56.297.002-110.428-18.364-155.335-52.868l2.618 29.488c.488 5.501-3.575 10.357-9.077 10.845-.3.027-.6.04-.896.04-5.123 0-9.487-3.916-9.949-9.116l-4.861-54.761c-.488-5.501 3.575-10.357 9.076-10.845l54.755-4.861c5.512-.482 10.357 3.575 10.846 9.077.488 5.501-3.575 10.357-9.076 10.845l-32.002 2.841c41.542 32.175 91.731 49.314 143.936 49.315 7.063 0 14.159-.313 21.28-.946 62.795-5.575 119.659-35.27 160.119-83.614 57.862-69.137 71.368-163.448 35.248-246.129-2.211-5.061.1-10.956 5.161-13.167 5.057-2.211 10.956.099 13.167 5.16 18.781 42.99 25.411 90.332 19.171 136.907zm-110.435-221.758-30.273 2.688c-5.501.488-9.564 5.344-9.076 10.845.462 5.201 4.826 9.117 9.949 9.116.296 0 .596-.013.896-.04l54.761-4.862c5.501-.488 9.564-5.344 9.076-10.845l-4.861-54.755c-.489-5.501-5.346-9.559-10.846-9.077-5.501.488-9.564 5.344-9.076 10.845l2.76 31.093c-51.165-39.644-114.425-58.258-179.253-52.505-68.115 6.048-129.798 38.259-173.687 90.7-31.145 37.213-50.995 82.188-57.408 130.064-6.237 46.573.392 93.916 19.17 136.909 1.642 3.758 5.314 6 9.169 6 1.336 0 2.695-.27 3.998-.838 5.061-2.21 7.372-8.105 5.161-13.167-36.116-82.688-22.611-177 35.248-246.132 81.273-97.112 224.675-112.249 324.292-36.039zm-67.996 187.2c0 41.317-33.613 74.93-74.929 74.93s-74.93-33.613-74.93-74.93c0-41.316 33.613-74.93 74.93-74.93 41.315 0 74.929 33.614 74.929 74.93zm-20 0c0-30.288-24.641-54.93-54.929-54.93s-54.93 24.642-54.93 54.93c0 30.289 24.642 54.93 54.93 54.93s54.929-24.641 54.929-54.93z"/></svg>`,

  evaluacion: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-27 0 512 512" width="22" height="22" fill="currentColor"><path d="m215 492c0 11.046875-8.953125 20-20 20h-115c-44.113281 0-80-35.886719-80-80v-352c0-44.113281 35.886719-80 80-80h245.890625c44.109375 0 80 35.886719 80 80v212c0 11.046875-8.957031 20-20 20-11.046875 0-20-8.953125-20-20v-212c0-22.054688-17.945313-40-40-40h-245.890625c-22.054688 0-40 17.945312-40 40v352c0 22.054688 17.945312 40 40 40h115c11.046875 0 20 8.953125 20 20zm235.640625-166.261719c-8.980469-6.429687-21.472656-4.359375-27.902344 4.617188l-98.582031 137.703125c-2.691406 3.121094-6.066406 3.792968-7.871094 3.914062-1.867187.121094-5.476562-.113281-8.574218-3.0625l-63.820313-61.28125c-7.964844-7.648437-20.625-7.394531-28.277344.574219-7.652343 7.96875-7.394531 20.628906.574219 28.277344l63.882812 61.34375c9.570313 9.105469 22.339844 14.175781 35.480469 14.175781 1.128907 0 2.261719-.039062 3.394531-.113281 14.3125-.953125 27.675782-7.914063 36.664063-19.101563.230469-.285156.457031-.582031.671875-.882812l98.980469-138.261719c6.429687-8.980469 4.363281-21.472656-4.621094-27.902344zm-144.75-205.738281h-206c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h206c11.042969 0 20-8.953125 20-20s-8.957031-20-20-20zm20 100c0-11.046875-8.957031-20-20-20h-206c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h206c11.042969 0 20-8.953125 20-20zm-226 60c-11.046875 0-20 8.953125-20 20s8.953125 20 20 20h125.109375c11.046875 0 20-8.953125 20-20s-8.953125-20-20-20zm0 0"/></svg>`,

  cronograma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="22" height="22" fill="currentColor"><path d="m39.5 30.6c-2.3 2.3-4.5 4.5-6.8 6.8-1.4-1.4-2.9-2.9-4.3-4.3-1.8-1.8-4.7 1-2.8 2.8 1.9 1.9 3.8 3.8 5.7 5.7.8.8 2.1.8 2.8 0l8.2-8.2c1.9-1.8-.9-4.6-2.8-2.8z"/><path d="m51.6 8.8c0-.2 0-.4 0-.6 0-1-.9-2-2-2s-2 .9-2 2v.6h-24.7v-.1c0-.2 0-.4 0-.6 0-1-.9-2-2-2s-2 .9-2 2v.8c-4.6 0-8.4 3.8-8.4 8.4v7.7c-.1.3-.2.5-.2.8-.6 4.3-1.6 8.6-3 12.7-.7 1.9-1.5 3.9-2.4 5.7-.8 1.7-.7 3.6.3 5.1s2.6 2.4 4.4 2.4h1.1c.9 3.7 4.2 6.4 8.2 6.4h32.4c4.6 0 8.4-3.8 8.4-8.4v-32.5c0-4.6-3.6-8.2-8.1-8.4zm-32.8 4v.4c0 1 .9 2 2 2s2-.9 2-2c0-.1 0-.3 0-.4h24.8v.6c0 1 .9 2 2 2s2-.9 2-2c0-.2 0-.4 0-.6 2.3.2 4.1 2.1 4.1 4.4v4.8c-.1 0-.3 0-.4 0h-40.9v-4.8c0-2.5 2-4.4 4.4-4.4zm-10.3 34.3c-.2-.4-.3-.8-.1-1.2.9-2 1.8-4 2.5-6.1 1.5-4.4 2.6-8.9 3.2-13.5 0-.1.1-.2.2-.2h40.9s.1 0 .2.1c0 0 .1.1.1.2-.5 4.5-1.5 8.9-2.9 13.1-.7 2.1-1.6 4.2-2.6 6.3-.6 1.2-1.9 2-3.3 2h-37.1c-.5-.2-.9-.4-1.1-.7zm42.8 6.9h-32.5c-1.7 0-3.1-1-3.9-2.4h31.7c2.9 0 5.6-1.7 6.9-4.3.8-1.6 1.5-3.3 2.1-5v7.3c.1 2.4-1.9 4.4-4.3 4.4z"/></svg>`,
};

/* ── Contenido de presentación ──────────────────────────────── */
const ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/></svg>`;

const PRES_CONTENT = {
  alcances: `
    <h3>Alcances del módulo</h3>
    <p>Al concluir este módulo serás capaz de analizar el entorno educativo desde una perspectiva estratégica, identificando áreas de oportunidad para la implementación tecnológica.</p>
    <ul class="pres-list">
      <li>${ARROW}Propósito general y competencias a desarrollar</li>
      <li>${ARROW}Análisis del contexto educativo actual</li>
      <li>${ARROW}Diseño de mapas estratégicos institucionales</li>
      <li>${ARROW}Evaluación y mejora continua de procesos</li>
    </ul>`,
  esquema: `
    <h3>Esquema del contenido</h3>
    <p>El módulo se estructura en dos unidades con 4 lecciones y 2 retos integradores que te permiten aplicar progresivamente los conocimientos adquiridos.</p>
    <ul class="pres-list">
      <li>${ARROW}Unidad 1: Fundamentos y diagnóstico estratégico (4 lecciones)</li>
      <li>${ARROW}Unidad 2: Implementación y evaluación de impacto (2 lecciones)</li>
      <li>${ARROW}2 Retos integradores con entrega en PDF</li>
      <li>${ARROW}Foros de discusión y actividades colaborativas</li>
    </ul>`,
  metodologia: `
    <h3>Metodología</h3>
    <p>Este módulo utiliza un enfoque de aprendizaje basado en proyectos (ABP), donde cada lección construye sobre la anterior para culminar en un plan estratégico real.</p>
    <ul class="pres-list">
      <li>${ARROW}Lecturas teóricas con casos de aplicación real</li>
      <li>${ARROW}Actividades prácticas individuales y colaborativas</li>
      <li>${ARROW}Retroalimentación continua del docente</li>
      <li>${ARROW}Retos integradores como evidencia de aprendizaje</li>
    </ul>`,
  evaluacion: `
    <h3>Evaluación</h3>
    <p>Tu calificación final se construye de forma progresiva a partir de tareas, exámenes y retos. Cada actividad tiene un peso específico en la calificación total del módulo.</p>
    <ul class="pres-list">
      <li>${ARROW}Tareas por lección: 40% de la calificación</li>
      <li>${ARROW}Exámenes por unidad: 30% de la calificación</li>
      <li>${ARROW}Retos integradores: 30% de la calificación</li>
      <li>${ARROW}Calificación mínima aprobatoria: 70/100</li>
    </ul>`,
  cronograma: `
    <h3>Cronograma</h3>
    <p>El módulo tiene una duración de 4 semanas. Cada semana tiene actividades específicas con fechas de entrega definidas para mantener un ritmo de aprendizaje constante.</p>
    <ul class="pres-list">
      <li>${ARROW}Semana 1: Lecciones 1 y 2 + Foro de diagnóstico</li>
      <li>${ARROW}Semana 2: Lecciones 3 y 4 + Reto 1</li>
      <li>${ARROW}Semana 3: Lecciones 5 y 6</li>
      <li>${ARROW}Semana 4: Reto 2 integrador final</li>
    </ul>`,
};

/* ── Inyectar SVGs en las cards de presentación ─────────────── */
function initPresentacionIcons() {
  // Inyecta el SVG correspondiente en cada .pres-icon-wrap
  document.querySelectorAll("[data-pres]").forEach((card) => {
    const key = card.dataset.pres;
    const wrap = card.querySelector(".pres-icon-wrap");
    if (wrap && PRES_SVG[key]) wrap.innerHTML = PRES_SVG[key];
  });
}

/* ── Animación barra de progreso ────────────────────────────── */
function initProgressBar() {
  const pbar = document.querySelector(".pbar[aria-valuenow]");
  const fill = document.querySelector(".pfill");
  if (!pbar || !fill) return;
  const target = pbar.getAttribute("aria-valuenow") + "%";
  requestAnimationFrame(() =>
    setTimeout(() => {
      fill.style.width = target;
    }, 100),
  );
}

/* ── Cards de presentación ──────────────────────────────────── */
function initPresentacionCards() {
  // Activar primera card al cargar
  const first = document.querySelector("[data-pres]");
  if (first) _activatePres(first);

  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pres]");
    if (!card) return;
    _activatePres(card);
  });
}

function _activatePres(card) {
  const key = card.dataset.pres;
  const content = PRES_CONTENT[key];
  if (!content) return;

  // Actualizar estado activo en cards
  document.querySelectorAll("[data-pres]").forEach((c) => {
    c.classList.toggle("active", c === card);
    c.setAttribute("aria-selected", String(c === card));
  });

  // Actualizar header de contenido con pill del color de la sección
  const color = getComputedStyle(card).getPropertyValue("--pres-color").trim();
  const bg = getComputedStyle(card).getPropertyValue("--pres-bg").trim();
  const label = card.querySelector(".pres-label")?.textContent || "";

  const pc = document.getElementById("pres-content");
  if (!pc) return;

  // Animación de entrada
  pc.style.animation = "none";
  pc.offsetHeight; // reflow
  pc.style.animation = "fadeSlideIn .3s cubic-bezier(.4,0,.2,1)";

  pc.innerHTML = `
    <div class="pres-content-header" style="--pres-color:${color};--pres-bg:${bg}">
      <span class="pres-content-pill">
        <span class="pres-content-pill-icon">${PRES_SVG[key] || ""}</span>
        ${label}
      </span>
    </div>
    ${content}
  `;
}

/* ── Toggle vista tarjetas / lista ──────────────────────────── */
function initViewToggle() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;
    const mode = btn.dataset.view;
    document.querySelectorAll("[data-view]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    document.querySelectorAll(".cards-grid").forEach((grid) => {
      grid.classList.toggle("view-list", mode === "list");
    });
    document.querySelectorAll("uveg-card").forEach((card) => {
      const bw = card.querySelector("[data-bw]");
      const bi = card.querySelector("[data-bi]");
      if (bw && bi && card.querySelector(".card.open")) {
        bw.style.height = "auto";
        requestAnimationFrame(() => {
          bw.style.height = bi.scrollHeight + "px";
        });
      }
    });
  });
}

/* ── Init ───────────────────────────────────────────────────── */
initProgressBar();
initPresentacionIcons();
initPresentacionCards();
initViewToggle();
