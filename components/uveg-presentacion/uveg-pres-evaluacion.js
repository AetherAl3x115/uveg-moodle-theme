/**
 * components/uveg-presentacion/uveg-pres-evaluacion.js
 * ─────────────────────────────────────────────────────────────
 * Sección "Evaluación" de la presentación.
 *
 * Light DOM — hereda estilos de main.css y variables.css.
 * Iconografía via hi() de icons.js — Heroicons 2 Outline.
 *
 * Datos via atributo `data` (JSON string). El equipo de TI
 * edita solo el JSON desde Moodle — sin tocar JS ni CSS.
 *
 * Esquema del array:
 * [
 *   {
 *     "icon": "check-circle",
 *     "title": "Reto 1. Planeación estratégica",
 *     "warning": false,
 *     "content": ["Lección 1. Gestión estratégica educativa"]
 *   }
 * ]
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const DEFAULT_DATA = [
  {
    icon: "check-circle",
    title: "Reto 1. Planeación estratégica",
    warning: false,
    content: [
      "Lección 1. Gestión estratégica educativa",
      "Lección 2. Gestión estratégica educativa",
      "Lección 3. Gestión estratégica educativa",
    ],
  },
  {
    icon: "check-circle",
    title: "Reto 2. Planeación estratégica educativa",
    warning: false,
    content: [
      "Lección 1. Gestión estratégica educativa",
      "Lección 2. Gestión estratégica educativa",
      "Lección 3. Gestión estratégica educativa",
    ],
  },
  {
    icon: "check-circle",
    title: "Reto 3. Proyecto educativo",
    warning: false,
    content: [
      "Lección 1. Gestión estratégica educativa",
      "Lección 2. Gestión estratégica educativa",
      "Lección 3. Gestión estratégica educativa",
    ],
  },
  {
    icon: "check-circle",
    title: "Reto 4. Ciclo de vida del proyecto",
    warning: false,
    content: ["Lección 1. Gestión estratégica educativa"],
  },
  {
    icon: "check-circle",
    title: "Reto 5. Proyecto educativo",
    warning: false,
    content: ["Lección 1. Gestión estratégica educativa"],
  },
];

class UvegPresEvaluacion extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _parseData() {
    const raw = this.getAttribute("data");
    if (!raw) return DEFAULT_DATA;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[uveg-pres-evaluacion] JSON inválido en atributo data:", e);
      return DEFAULT_DATA;
    }
  }

  _renderSection({ icon, title, warning, content }) {
    const warningClass = warning ? " is-warning" : "";
    const items = content.map((item) => `<li>${item}</li>`).join("");

    return `
      <div class="pres-eval-section">
        <h4 class="pres-eval-title${warningClass}">
          ${hi(icon, 16)}
          ${title}
        </h4>
        <div class="pres-eval-body">
          <ul class="pres-eval-list">
            ${items}
          </ul>
        </div>
      </div>
    `;
  }

  _render() {
    const sections = this._parseData();
    this.innerHTML = `
      <div class="pres-eval">
        ${sections.map((s) => this._renderSection(s)).join("")}
      </div>
    `;
  }
}

customElements.define("uveg-pres-evaluacion", UvegPresEvaluacion);
