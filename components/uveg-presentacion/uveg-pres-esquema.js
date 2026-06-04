/**
 * components/uveg-presentacion/uveg-pres-esquema.js
 * ─────────────────────────────────────────────────────────────
 * Sección "Esquema del contenido" de la presentación.
 * Light DOM — hereda variables.css y main.css.
 *
 * Atributo `src` → URL de la imagen subida en Moodle
 * Atributo `alt` → texto alternativo (opcional)
 *
 * Uso en page.js:
 *   <uveg-pres-esquema src="https://.../esquema.png" alt="...">
 *   </uveg-pres-esquema>
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

class UvegPresEsquema extends HTMLElement {
  static get observedAttributes() {
    return ["src", "alt"];
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const src = this.getAttribute("src") || "";
    const alt = this.getAttribute("alt") || "Esquema del contenido del módulo";

    this.innerHTML = `
      <section class="pe-section" aria-label="Esquema del contenido">

        ${
          src
            ? `
          <div class="pe-img-wrap">
            <img
              class="pe-img"
              src="${src}"
              alt="${alt}"
              loading="lazy"
            >
          </div>
        `
            : `
          <div class="pe-placeholder" role="img" aria-label="Imagen de esquema pendiente">
            <div class="pe-placeholder-icon">
              ${hi("photo", 48)}
            </div>
            <p class="pe-placeholder-text">
              El diagrama del esquema se mostrará aquí.<br>
              <span>Sube la imagen desde el editor de Moodle y pasa la URL al atributo <code>src</code>.</span>
            </p>
          </div>
        `
        }

      </section>
    `;
  }
}

customElements.define("uveg-pres-esquema", UvegPresEsquema);
