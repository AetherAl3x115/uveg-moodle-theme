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
    unit: "Unidad 1",
    icon: "check-circle",
    title: "Reto 1. Planeación estratégica",
    points: 15,
    warning: false,
    content: [
      "Lección 1. Gestión estratégica educativa",
      "Lección 2. Planeación estratégica",
      "Lección 3. El diagnóstico",
    ],
  },
  {
    unit: "Unidad 1",
    icon: "check-circle",
    title: "Reto 2. Planeación estratégica educativa",
    points: 20,
    warning: false,
    content: [
      "Lección 4. Alineación de estrategias",
      "Lección 5. Estrategia aplicada",
      "Lección 6. La evaluación y monitoreo de la estrategia",
    ],
  },

  {
    unit: "Unidad 2",
    icon: "check-circle",
    title: "Reto 3. Proyecto educativo",
    points: 20,
    warning: false,
    content: [
      "Lección 7. Proyecto educativo",
      "Lección 8. Diversidad de proyectos educativos",
    ],
  },

  {
    unit: "Unidad 2",
    icon: "check-circle",
    title: "Reto 4. Ciclo de vida del proyecto educativo",
    points: 20,
    warning: false,
    content: ["Lección 9. Planificación"],
  },

  {
    unit: "Unidad 2",
    icon: "check-circle",
    title: "Reto 5. Proyecto",
    points: 25,
    warning: false,
    content: ["Lección 10. Procesos de un proyecto"],
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

  _renderSection({ icon, title, warning, content, points }) {
    const warningClass = warning ? " is-warning" : "";
    const items = content.map((item) => `<li>${item}</li>`).join("");
    const pts =
      points != null
        ? `<span class="pres-eval-points">${points} pts</span>`
        : "";
    return `
      <div class="pres-eval-section">
       <div class="pres-eval-body">
          <ul class="pres-eval-list">
            ${items}
          </ul>
        </div>
        <div class="pres-eval-title-row">
          <h4 class="pres-eval-title${warningClass}">
            ${hi(icon, 16)}
            ${title}
          </h4>
          ${pts}
        </div>
      </div>
    `;
  }

  _render() {
    const sections = this._parseData();
    let lastUnit = null;
    const html = sections
      .map((s) => {
        let unitHeader = "";
        if (s.unit && s.unit !== lastUnit) {
          lastUnit = s.unit;
          unitHeader = `<div class="pres-eval-unit-header">${s.unit}</div>`;
        }
        return unitHeader + this._renderSection(s);
      })
      .join("");
    this.innerHTML = `<div class="pres-eval">${html}</div>`;
  }
}

customElements.define("uveg-pres-evaluacion", UvegPresEvaluacion);
