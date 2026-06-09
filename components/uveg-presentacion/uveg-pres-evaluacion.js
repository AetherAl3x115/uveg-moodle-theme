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
    title: "Reto 1. Planeación estratégica institucional",
    points: 100,
    warning: false,
    content: [
      "Lección 1. Introducción al módulo",
      "Lección 2. Diagnóstico y análisis del contexto",
      "Lección 3. Diseño del mapa estratégico",
      "Lección 4. Implementación y evaluación",
    ],
  },
  {
    unit: "Unidad 2",
    icon: "check-circle",
    title: "Reto 2. Implementación y evaluación tecnológica",
    points: 100,
    warning: false,
    content: [
      "Lección 5. Evaluación de impacto tecnológico",
      "Lección 6. Innovación pedagógica y KPIs",
    ],
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
        <div class="pres-eval-title-row">
          <h4 class="pres-eval-title${warningClass}">
            ${hi(icon, 16)}
            ${title}
          </h4>
          ${pts}
        </div>
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
