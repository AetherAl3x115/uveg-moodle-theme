/**
 * js/page.js
 * ─────────────────────────────────────────────────────────────
 * Lógica específica de index.html.
 * Maneja: animación de progreso, cards de presentación,
 * toggle vista tarjetas/lista.
 *
 * Separado de main.js porque es lógica de página, no de app.
 * ─────────────────────────────────────────────────────────────
 */

/* ── Contenido de presentación ──────────────────────────────── */
const PRES_CONTENT = {
  alcances: `
    <h3>Alcances del módulo</h3>
    <p>Al concluir este módulo serás capaz de analizar el entorno educativo desde una perspectiva estratégica, identificando áreas de oportunidad para la implementación tecnológica.</p>
    <ul class="pres-list">
      <li><i class="ti ti-arrow-right"></i>Propósito general y competencias a desarrollar</li>
      <li><i class="ti ti-arrow-right"></i>Análisis del contexto educativo actual</li>
      <li><i class="ti ti-arrow-right"></i>Diseño de mapas estratégicos institucionales</li>
      <li><i class="ti ti-arrow-right"></i>Evaluación y mejora continua de procesos</li>
    </ul>`,
  esquema: `
    <h3>Esquema del contenido</h3>
    <p>El módulo se estructura en dos unidades con 4 lecciones y 2 retos integradores que te permiten aplicar progresivamente los conocimientos adquiridos.</p>
    <ul class="pres-list">
      <li><i class="ti ti-arrow-right"></i>Unidad 1: Fundamentos y diagnóstico estratégico (4 lecciones)</li>
      <li><i class="ti ti-arrow-right"></i>Unidad 2: Implementación y evaluación de impacto (2 lecciones)</li>
      <li><i class="ti ti-arrow-right"></i>2 Retos integradores con entrega en PDF</li>
      <li><i class="ti ti-arrow-right"></i>Foros de discusión y actividades colaborativas</li>
    </ul>`,
  metodologia: `
    <h3>Metodología</h3>
    <p>Este módulo utiliza un enfoque de aprendizaje basado en proyectos (ABP), donde cada lección construye sobre la anterior para culminar en un plan estratégico real.</p>
    <ul class="pres-list">
      <li><i class="ti ti-arrow-right"></i>Lecturas teóricas con casos de aplicación real</li>
      <li><i class="ti ti-arrow-right"></i>Actividades prácticas individuales y colaborativas</li>
      <li><i class="ti ti-arrow-right"></i>Retroalimentación continua del docente</li>
      <li><i class="ti ti-arrow-right"></i>Retos integradores como evidencia de aprendizaje</li>
    </ul>`,
  evaluacion: `
    <h3>Evaluación</h3>
    <p>Tu calificación final se construye de forma progresiva a partir de tareas, exámenes y retos. Cada actividad tiene un peso específico en la calificación total del módulo.</p>
    <ul class="pres-list">
      <li><i class="ti ti-arrow-right"></i>Tareas por lección: 40% de la calificación</li>
      <li><i class="ti ti-arrow-right"></i>Exámenes por unidad: 30% de la calificación</li>
      <li><i class="ti ti-arrow-right"></i>Retos integradores: 30% de la calificación</li>
      <li><i class="ti ti-arrow-right"></i>Calificación mínima aprobatoria: 70/100</li>
    </ul>`,
};

/* ── Animación barra de progreso ────────────────────────────── */
function initProgressBar() {
  // Lee el valor del atributo aria-valuenow para no hardcodear el 70%
  const pbar = document.querySelector(".pbar[aria-valuenow]");
  const fill = document.querySelector(".pfill");
  if (!pbar || !fill) return;

  const target = pbar.getAttribute("aria-valuenow") + "%";

  // RAF + setTimeout para garantizar que el CSS transition esté activo
  requestAnimationFrame(() => {
    setTimeout(() => {
      fill.style.width = target;
    }, 100);
  });
}

/* ── Cards de presentación ──────────────────────────────────── */
function initPresentacionCards() {
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-pres]");
    if (!card) return;

    const content = PRES_CONTENT[card.dataset.pres];
    if (!content) return;

    // Actualizar estado activo
    document.querySelectorAll("[data-pres]").forEach((c) => {
      c.classList.toggle("active", c === card);
      c.setAttribute("aria-selected", String(c === card));
    });

    // Actualizar contenido con animación
    const pc = document.getElementById("pres-content");
    if (!pc) return;
    pc.style.animation = "none";
    pc.offsetHeight; // reflow para reiniciar animación
    pc.style.animation = "fadeSlideIn .3s cubic-bezier(.4,0,.2,1)";
    pc.innerHTML = content;
  });
}

/* ── Toggle vista tarjetas / lista ──────────────────────────── */
function initViewToggle() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn) return;

    const mode = btn.dataset.view;

    // Actualizar botones
    document.querySelectorAll("[data-view]").forEach((b) => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });

    // Actualizar grids
    document.querySelectorAll(".cards-grid").forEach((grid) => {
      grid.classList.toggle("view-list", mode === "list");
    });

    // Recalcular altura de cards abiertas tras cambio de layout
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
// Llamadas al final — después de todas las definiciones
// type="module" no hace hoisting de funciones como scripts normales
initProgressBar();
initPresentacionCards();
initViewToggle();
