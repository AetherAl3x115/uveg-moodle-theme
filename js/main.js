/**
 * main.js
 * ─────────────────────────────────────────────────────────────
 * Punto de entrada de la aplicación.
 *
 * Responsabilidades:
 *   1. Inicializar el tema (dark/light) antes del primer paint
 *   2. Importar y registrar todos los Web Components
 *   3. Orquestar comunicación entre componentes via eventos
 *   4. Manejar accordion de cards (solo una abierta a la vez)
 *
 * ── Flujo de eventos entre componentes ──────────────────────
 *
 *   uveg-sidebar   →[uveg:navigate]→    main.js → activa tab
 *   uveg-topbar    →[uveg:search]→      main.js → (futuro: search modal)
 *   uveg-tabs      →[uveg:tabchange]→   uveg-progress (auto)
 *   uveg-card      →[uveg:openscorm]→   uveg-scorm-drawer (auto)
 *   uveg-card      →[uveg:cardopen]→    main.js → cierra otras cards
 *   uveg-progress  →[uveg:navigate]→    main.js → activa tab
 *
 * ── Por qué no usar Shadow DOM ──────────────────────────────
 *   Los componentes usan el DOM ligero (Light DOM) en lugar de
 *   Shadow DOM para que Bootstrap y main.css apliquen sus estilos
 *   directamente sin necesidad de @import dentro de cada shadow root.
 *   Decisión consciente: simplicidad > encapsulación estricta.
 *
 * ── Módulos ES (type="module") ──────────────────────────────
 *   Este archivo se carga con <script type="module"> en index.html.
 *   Los imports son estáticos para que el browser pueda optimizar
 *   la carga en paralelo. No se usa un bundler — Netlify sirve
 *   los módulos directamente.
 * ─────────────────────────────────────────────────────────────
 */

/* ── 1. Tema — debe inicializarse ANTES del primer paint ───── */
import { initTheme } from "./utils/theme.js";
initTheme();

/* ── 2. Web Components ──────────────────────────────────────── */
import "../../components/uveg-sidebar/uveg-sidebar.js";
import "../../components/uveg-topbar/uveg-topbar.js";
import "../../components/uveg-tabs/uveg-tabs.js";
import "../../components/uveg-card/uveg-card.js";
import "../../components/uveg-progress/uveg-progress.js";
// import "../../components/uveg-scorm-drawer/uveg-scorm-drawer.js"; // reemplazado por uveg-lesson-view
import "../../components/uveg-lesson-view/uveg-lesson-view.js";
import "../../components/uveg-reto-view/uveg-reto-view.js";
import "../../components/uveg-scorm-view/uveg-scorm-view.js";
import "../../components/uveg-sesiones-view/uveg-sesiones-view.js";
import "../components/uveg-glosario/uveg-glosario.js";

/* ── Componentes de Presentación ────────────────────────────── */
import "../../components/uveg-presentacion/uveg-pres-alcances.js";
import "../../components/uveg-presentacion/uveg-pres-esquema.js";
import "../../components/uveg-presentacion/uveg-pres-metodologia.js";
import "../../components/uveg-presentacion/uveg-pres-evaluacion.js";
import "../../components/uveg-presentacion/uveg-pres-cronograma.js";

/* ── 3. App init ────────────────────────────────────────────── */

/**
 * Inicializa la aplicación una vez que el DOM está listo.
 * Se usa DOMContentLoaded en lugar de window.load para no
 * esperar a que carguen imágenes y recursos externos.
 */
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/**
 * Orquesta todos los listeners de eventos entre componentes.
 * Cada listener tiene una sola responsabilidad.
 */
function initApp() {
  initCardAccordion();
  initSidebarNavigation();
  initProgressNavigation();
}

/* ── Card Accordion ─────────────────────────────────────────── */

/**
 * Garantiza que solo una uveg-card esté abierta a la vez.
 *
 * Cuando una card emite uveg:cardopen, busca todas las demás
 * cards abiertas y llama a su método público close().
 *
 * Por qué event delegation en document:
 *   Los eventos bubblean desde uveg-card → document, así que
 *   un solo listener en document cubre todas las cards sin
 *   importar cuántas haya en el HTML.
 */
function initCardAccordion() {
  document.addEventListener("uveg:cardopen", (e) => {
    const openedCardId = e.detail?.cardId;

    document.querySelectorAll("uveg-card").forEach((card) => {
      // Cerrar todas las cards excepto la que acaba de abrirse
      if (card.getAttribute("card-id") !== String(openedCardId)) {
        card.close();
      }
    });
  });
}

/* ── Sidebar Navigation ─────────────────────────────────────── */

/**
 * Sincroniza la navegación del sidebar con los tabs del contenido.
 *
 * El sidebar emite uveg:navigate con { item: 'dashboard' | 'modulos' | ... }.
 * Los items que corresponden a tabs del módulo activan el tab correcto.
 *
 * Mapeo sidebar → tabs:
 *   El sidebar navega entre secciones globales (Dashboard, Módulos, etc.)
 *   No todos los items tienen un tab equivalente — en ese caso
 *   la navegación se maneja aquí para futura implementación.
 */
function initSidebarNavigation() {
  document.addEventListener("uveg:navigate", (e) => {
    const { item, tab } = e.detail || {};

    // Navegación desde uveg-progress (tiene 'tab' en lugar de 'item')
    if (tab) {
      activateTab(tab);
      return;
    }

    // Navegación desde uveg-sidebar
    if (item) {
      // Solo módulos tiene tabs en esta vista
      // Los demás items son placeholders para futuras vistas
      switch (item) {
        case "dashboard":
        case "modulos":
        case "cursos":
          // TODO: navegar a la vista correspondiente
          // Por ahora solo log para el demo
          console.info(`[UVEG] Navegando a: ${item}`);
          break;
        default:
          break;
      }
    }
  });
}

/* ── Progress Panel Navigation ──────────────────────────────── */

/**
 * Cuando uveg-progress emite uveg:navigate con un tab,
 * activa ese tab en uveg-tabs.
 * (uveg-progress ya escucha uveg:tabchange para sincronizarse
 *  en sentido contrario — tabs → progress panel)
 */
function initProgressNavigation() {
  // Ya manejado en initSidebarNavigation via el mismo evento uveg:navigate
  // uveg-progress emite { tab: 'unidad1' } y uveg-sidebar emite { item: 'modulos' }
  // ambos pasan por el mismo listener, el switch los diferencia por propiedad.
}

/* ── Helpers ────────────────────────────────────────────────── */

/**
 * Activa un tab en uveg-tabs programáticamente.
 * Busca el componente uveg-tabs en el DOM y actualiza
 * su atributo 'active', lo que dispara el cambio interno.
 *
 * @param {string} tabKey - Key del tab a activar (ej: 'unidad1')
 */
function activateTab(tabKey) {
  const tabsEl = document.querySelector("uveg-tabs");
  if (!tabsEl) return;
  tabsEl.setAttribute("active", tabKey);
}
