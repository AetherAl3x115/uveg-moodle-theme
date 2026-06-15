/**
 * components/uveg-aviso/uveg-aviso.js
 * Card con franja lateral degradada, ícono PNG institucional y lista con palomitas.
 *
 * Atributos:
 *   variant   — "importante" | "info" | "advertencia"  (default: importante)
 *   title     — texto del título
 *   items     — JSON array de strings (puntos de la lista)
 */

const AVISO_CONFIG = {
  importante: {
    color: "#f74a8a",
    gradient: "linear-gradient(to bottom, #ffc0cb, #f74a8a)",
    icon: "assets/img/icons/importante.png",
  },
  info: {
    color: "#1445c4",
    gradient: "linear-gradient(to bottom, #4A90D9, #0d55de)",
    icon: "assets/img/icons/situacion.png",
  },
  advertencia: {
    color: "#1e3a8a",
    gradient: "linear-gradient(to bottom, #1565C0, #1E3A8A)",
    icon: "assets/img/icons/caso.png",
  },
};

class UvegAviso extends HTMLElement {
  connectedCallback() {
    this._render();
  }

  _render() {
    const variant = this.getAttribute("variant") || "importante";
    const title = this.getAttribute("title") || "Importante";
    const raw = this.getAttribute("items") || "[]";
    const items = JSON.parse(raw);
    const cfg = AVISO_CONFIG[variant] || AVISO_CONFIG.importante;

    this.innerHTML = `
      <div class="av-root">
        <div class="av-stripe" style="background:${cfg.gradient}">
          <img class="av-icon" src="${cfg.icon}" alt="${variant}">
        </div>
        <div class="av-body">
          <p class="av-title" style="color:${cfg.color}">${title}</p>
          <ul class="av-list">
            ${items
              .map(
                (item) => `
              <li class="av-item">
                <svg class="av-check" viewBox="0 0 16 16" fill="none"
                     style="stroke:${cfg.color}">
                  <path d="M3 8l3.5 3.5L13 4" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${item}</span>
              </li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>`;
  }
}

customElements.define("uveg-aviso", UvegAviso);
