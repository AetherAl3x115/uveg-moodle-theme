/**
 * components/uveg-presentacion/uveg-pres-alcances.js
 * ─────────────────────────────────────────────────────────────
 * Sección "Alcances del Módulo" de la presentación.
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
 *     "icon": "flag",
 *     "title": "Propósito general",
 *     "warning": false,
 *     "content": ["Item de lista con <strong>negritas</strong>..."]
 *   }
 * ]
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const DEFAULT_DATA = [
  {
    icon: "flag",
    title: "Propósito general",
    warning: false,
    content: [
      "Desarrolla proyectos de forma integral basado en metodologías reconocidas de dirección de proyectos y administración para contribuir al logro de los objetivos estratégicos.",
    ],
  },
  {
    icon: "academic-cap",
    title: "Competencias genéricas",
    warning: false,
    content: [
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
    ],
  },
  {
    icon: "puzzle-piece",
    title: "Competencias específicas",
    warning: false,
    content: [
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
    ],
  },
  {
    icon: "check-circle",
    title: "Aprendizajes esperados",
    warning: false,
    content: [
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
      "CG1. Conceptualiza y transforma los procesos de enseñanza – aprendizaje para la mejora de la práctica educativa, a partir de los diferentes escenarios que regulan el aprendizaje humano, a través de las 4 líneas de generación y aplicación del conocimiento: educación disruptiva en la era digital, gestión educativa, política y ética en la educación e innovación educativa.",
    ],
  },
];

class UvegPresAlcances extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _parseData() {
    const raw = this.getAttribute("data");
    if (!raw) return DEFAULT_DATA;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[uveg-pres-alcances] JSON inválido en atributo data:", e);
      return DEFAULT_DATA;
    }
  }

  _renderSection({ icon, title, warning, content }) {
    const warningClass = warning ? " is-warning" : "";
    const items = content.map((item) => `<li>${item}</li>`).join("");

    return `
      <div class="pres-alcances-section">
        <h4 class="pres-alcances-title${warningClass}">
          ${hi(icon, 16)}
          ${title}
        </h4>
        <div class="pres-alcances-body">
          <ul class="pres-alcances-list">
            ${items}
          </ul>
        </div>
      </div>
    `;
  }

  _render() {
    const sections = this._parseData();
    const imgSrc = this.getAttribute("img") || "assets/img/alcance.jpg";

    this.innerHTML = `
      <div class="pres-alcances">
        <img class="pres-alcances-avatar" src="${imgSrc}" alt="Imagen del módulo" />
        ${sections.map((s) => this._renderSection(s)).join("")}
      </div>
    `;
  }
}

customElements.define("uveg-pres-alcances", UvegPresAlcances);
