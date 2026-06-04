/**
 * components/uveg-presentacion/uveg-pres-metodologia.js
 * ─────────────────────────────────────────────────────────────
 * Sección "Metodología" de la presentación.
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
 *     "icon": "book",
 *     "title": "Estructura y Evaluación",
 *     "warning": false,
 *     "content": ["Párrafo con <strong>negritas</strong>..."]
 *   }
 * ]
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const DEFAULT_DATA = [
  {
    icon: "book",
    title: "Estructura y Evaluación",
    warning: false,
    content: [
      "El Módulo está dividido en <strong>2 Unidades</strong>. La calificación final mínima necesaria para aprobar el Módulo es de <strong>80</strong>.",
      "Cada Unidad está conformada por Lecciones, en las cuales podrás encontrar Ejercicios de práctica necesarios para que realices el Reto o Retos que integran la Unidad. Algunos Retos serán evaluados a través de Rúbricas (rejillas o matrices de evaluación), por lo que debes tomar en cuenta los criterios que aparecen en ellas.",
    ],
  },
  {
    icon: "clock",
    title: "Duración y Dedicación",
    warning: false,
    content: [
      "La duración total del Módulo es de <strong>6.5 semanas (45 días)</strong>. Se contempla que dediques un aproximado de <strong>2.5 horas diarias</strong> para el reconocimiento de la estructura del Módulo y la realización de las Lecciones, en las que deberás llevar a cabo la revisión de los contenidos, lecturas, videos, infografía y otros recursos, así como los procesos necesarios (investigación, reflexión, análisis, etc.) para la elaboración de los Retos.",
    ],
  },
  {
    icon: "users",
    title: "Acompañamiento",
    warning: false,
    content: [
      "En todo momento estarás acompañado o acompañada por un Asesor o Asesora, quien te guiará y te ayudará a resolver tus dudas de los diferentes temas, tanto en los Ejercicios como en tus Retos.",
    ],
  },
  {
    icon: "exclamation-triangle",
    title: "Políticas de Integridad y Formato",
    warning: true,
    content: [
      "Es importante que tomes en cuenta que, en todos los programas académicos de la UVEG <strong>queda prohibida la publicación de material con registro de derechos de autor</strong>, ya sea contenido textual o bien imágenes, gráficos, dibujos comerciales, emblemas, eslogan, lemas, distintivos, logotipos y todo elemento con derechos reservados.",
      "Si llegas a utilizar citas o recursos audiovisuales sin derechos reservados para la realización de tus Retos deberás incluir las citas y referencias de las fuentes bibliográficas que hayas utilizado, las cuales deben estar redactadas de acuerdo con el <strong>Formato APA</strong>, última edición.",
    ],
  },
];

class UvegPresMetodologia extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _parseData() {
    const raw = this.getAttribute("data");
    if (!raw) return DEFAULT_DATA;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(
        "[uveg-pres-metodologia] JSON inválido en atributo data:",
        e,
      );
      return DEFAULT_DATA;
    }
  }

  _renderSection({ icon, title, warning, content }) {
    const warningClass = warning ? " is-warning" : "";
    const paragraphs = content
      .map((p) => `<p class="pres-met-p">${p}</p>`)
      .join("");

    return `
      <div class="pres-met-section">
        <h4 class="pres-met-title${warningClass}">
          ${hi(icon, 16)}
          ${title}
        </h4>
        <div class="pres-met-body">
          ${paragraphs}
        </div>
      </div>
    `;
  }

  _render() {
    const sections = this._parseData();
    this.innerHTML = `
      <div class="pres-met">
        ${sections.map((s) => this._renderSection(s)).join("")}
      </div>
    `;
  }
}

customElements.define("uveg-pres-metodologia", UvegPresMetodologia);
