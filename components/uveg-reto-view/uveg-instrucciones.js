/**
 * components/uveg-instrucciones/uveg-instrucciones.js
 *
 * Atributos:
 *   title     — texto del label "Instrucciones:" (default: "Instrucciones")
 *   reto      — número/etiqueta del reto, ej: "1" → muestra círculo "R1"
 *   subtitle  — título largo del reto
 *   puntos    — texto de puntos, ej: "25" → muestra aviso "hasta 25 puntos"
 *   steps     — JSON array de { text, enlace?, plus? }
 *               enlace: { label, url, type }  type: "pdf"|"doc"|"excel"|"video"|"guia"
 *               plus:   true → muestra el círculo "+" al final del texto
 */

const ENLACE_CONFIG = {
  pdf: {
    bgVar: "--color-warning" /* #dc2626 */,
    textVar: "--color-warning",
    borderRgb: "220,38,38",
    icon: "assets/img/icons/pdf.png",
  },
  doc: {
    bgVar: "--color-accent",
    textVar: "--color-accent",
    borderRgb: "37,99,235",
    icon: "assets/img/icons/word.png",
  },
  excel: {
    bgVar: "--color-done-text",
    textVar: "--color-done-text",
    borderRgb: "22,101,52",
    icon: "assets/img/icons/excel.png",
  },
  video: {
    bgVar: "--color-entrega-accent",
    textVar: "--color-entrega-accent",
    borderRgb: "234,88,12",
    icon: "assets/img/icons/video.png",
  },
  guia: {
    bgVar: "--color-accent-navy",
    textVar: "--color-accent-navy",
    borderRgb: "76,69,229",
    icon: "assets/img/icons/word.png",
  },
};

class UvegInstrucciones extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _render() {
    const title = this.getAttribute("title") || "Instrucciones";
    const reto = this.getAttribute("reto") || "";
    const subtitle = this.getAttribute("subtitle") || "";
    const puntos = this.getAttribute("puntos") || "";
    const materia = this.getAttribute("materia") || "";
    const raw = this.getAttribute("steps") || "[]";
    const steps = JSON.parse(raw);

    this.innerHTML = `
      <div class="ins-root">

        ${materia ? `<div class="ins-mat-header">${materia}</div>` : ""}

        ${
          reto || subtitle
            ? `
        <div class="ins-r1-row">
          ${reto ? `<div class="ins-r1-badge">R${reto}</div>` : ""}
          ${subtitle ? `<p class="ins-r1-title">${subtitle}</p>` : ""}
        </div>`
            : ""
        }

        ${
          puntos
            ? `
        <div class="ins-aviso">
          <img class="ins-aviso-icon" src="assets/img/icons/importante.png" alt="importante">
          <p class="ins-aviso-text">
            <strong>Importante:</strong> Con este Reto podrás obtener hasta ${puntos} puntos.
          </p>
        </div>`
            : ""
        }

        <p class="ins-label">${title}:</p>

        <div class="ins-steps">
          ${steps.map((step, i) => this._renderStep(step, i)).join("")}
        </div>

      </div>`;
  }

  _renderStep(step, i) {
    const enlace = step.enlace ? this._renderEnlace(step.enlace) : "";
    const plus = step.plus
      ? `<span class="ins-plus" aria-hidden="true">+</span>`
      : "";

    return `
      <div class="ins-step">
        <p class="ins-step-text">${i + 1}. ${step.text}${plus}</p>
        ${enlace}
      </div>`;
  }

  _renderEnlace(enlace) {
    const cfg = ENLACE_CONFIG[enlace.type] || ENLACE_CONFIG.guia;
    const rgb = cfg.borderRgb;
    const isGuia = enlace.type === "guia";

    if (isGuia) {
      return `
        <div class="ins-guia-pill" style="
          background: rgba(${cfg.borderRgb}, 0.06);
          border: 1px solid rgba(${cfg.borderRgb}, 0.30);
        ">
          <img class="ins-guia-icon" src="${cfg.icon}" alt="guía">
          <span class="ins-guia-label">
            <strong style="color: var(${cfg.textVar})">Guía:</strong>
            <span style="color: var(${cfg.textVar})">${enlace.label}</span>
          </span>
        </div>`;
    }

    return `
      <a class="ins-file-pill"
         href="${enlace.url || "#"}"
         target="_blank"
         rel="noopener noreferrer"
         style="
           background: rgba(${rgb}, 0.06);
           border: 1px solid rgba(${rgb}, 0.30);
         ">
        <img class="ins-file-icon" src="${cfg.icon}" alt="${enlace.type}">
        <span class="ins-file-label" style="color: var(${cfg.textVar})">
          ${enlace.label}
        </span>
      </a>`;
  }
}

customElements.define("uveg-instrucciones", UvegInstrucciones);
