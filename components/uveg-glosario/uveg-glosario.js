/**
 * components/uveg-glosario/uveg-glosario.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-glosario>
 * Light DOM — hereda variables.css y main.css.
 *
 * Atributo `data` → JSON string con array de términos:
 *   [
 *     {
 *       term:    string  — término
 *       def:     string  — definición completa
 *       author:  string  — autor (opcional)
 *       date:    string  — fecha (opcional)
 *     },
 *     ...
 *   ]
 *
 * Layout:
 *   - 1 definición por letra  → avatar inline con título (diseño original)
 *   - 2+ definiciones         → avatar solo en fila propia, entradas con
 *                               badge-ícono azul sin título repetido
 * ─────────────────────────────────────────────────────────────
 */

import { liquidOpen, liquidClose } from "../../js/utils/spring.js";
import { hi } from "../../js/utils/icons.js";

class UvegGlosario extends HTMLElement {
  static get observedAttributes() {
    return ["data"];
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._render();
      this._bindEvents();
    }
  }

  /* ── Helpers ────────────────────────────────────────────── */

  _getTerms() {
    try {
      return JSON.parse(this.getAttribute("data") || "[]");
    } catch {
      return [];
    }
  }

  _getLetters(terms) {
    return [
      "TODAS",
      ...[...new Set(terms.map((t) => t.term[0].toUpperCase()))].sort(),
    ];
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    const terms = this._getTerms();
    const letters = this._getLetters(terms);
    this._activeFilter = this._activeFilter || "TODAS";
    this._query = this._query || "";

    this.innerHTML = `
      <div class="gl-root">

        <!-- Toolbar: búsqueda + filtro alfabético -->
        <div class="gl-toolbar">
          <div class="gl-search">
            ${hi("magnifying-glass", 16)}
            <input
              class="gl-search-input"
              type="text"
              placeholder="Buscar término o definición..."
              value="${this._query}"
              data-gl-search
              aria-label="Buscar en el glosario"
            >
          </div>
          <div class="gl-alpha" role="group" aria-label="Filtrar por letra">
            ${letters
              .map(
                (l) => `
              <button
                class="gl-pill${l === this._activeFilter ? " active" : ""}"
                data-gl-letter="${l}"
                aria-pressed="${l === this._activeFilter}"
              >${l}</button>
            `,
              )
              .join("")}
          </div>
        </div>

        <!-- Lista de entradas -->
        <div class="gl-list" data-gl-list>
          ${this._renderEntries(terms)}
        </div>

        <!-- FAB añadir -->
        <div class="gl-fab-wrap">
          <button class="gl-fab" data-gl-add>
            ${hi("plus", 16)}
            Añadir entrada
          </button>
        </div>

      </div>
    `;
  }

  _renderEntries(terms) {
    const filtered = terms.filter((t) => {
      const matchLetter =
        this._activeFilter === "TODAS" ||
        t.term[0].toUpperCase() === this._activeFilter;
      const q = this._query.toLowerCase();
      const matchQuery =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.def.toLowerCase().includes(q);
      return matchLetter && matchQuery;
    });

    if (!filtered.length) {
      return `
        <div class="gl-empty">
          ${hi("magnifying-glass", 32)}
          <p>No se encontraron términos</p>
        </div>`;
    }

    // Agrupar por letra
    const groups = {};
    filtered.forEach((t) => {
      const l = t.term[0].toUpperCase();
      if (!groups[l]) groups[l] = [];
      groups[l].push(t);
    });

    return Object.keys(groups)
      .sort()
      .map((letter) => {
        const items = groups[letter];
        const isMulti = items.length > 1;

        if (!isMulti) {
          // ── 1 definición: diseño original ──────────────────
          return `
            <div class="gl-group">
              <div class="gl-group-label" aria-hidden="true">${letter}</div>
              ${this._renderEntrySingle(items[0], `${letter}-0`)}
            </div>`;
        }

        // ── 2+ definiciones: avatar en fila propia, badges ──
        const entries = items
          .map((t, i) =>
            i === 0
              ? this._renderEntryFirst(t, `${letter}-${i}`)
              : this._renderEntrySub(t, `${letter}-${i}`),
          )
          .join("");

        return `
          <div class="gl-group gl-group-multi">
            <div class="gl-group-label" aria-hidden="true">${letter}</div>
            <div class="gl-multi-card">
              <div class="gl-multi-avatar" aria-hidden="true">${letter}</div>
              ${entries}
            </div>
          </div>`;
      })
      .join("");
  }

  /* Diseño original — 1 sola definición por letra */
  _renderEntrySingle(t, id) {
    return `
      <div class="gl-entry" data-gl-entry="${id}">
        <div class="gl-entry-row" data-gl-toggle="${id}" role="button" tabindex="0"
          aria-expanded="false" aria-controls="gl-body-${id}">
          <div class="gl-initial" aria-hidden="true">${t.term[0]}</div>
          <div class="gl-entry-info">
            <div class="gl-entry-term">${t.term}</div>
            <div class="gl-entry-preview">${t.def}</div>
          </div>
          <div class="gl-chevron" aria-hidden="true">
            ${hi("chevron-down", 16)}
          </div>
        </div>
        <div class="gl-body" id="gl-body-${id}" data-gl-body="${id}">
          <div class="gl-body-inner" data-gl-inner="${id}">
            <div class="gl-divider"></div>
            <div class="gl-def-header">
              ${hi("book", 13)}
              Definición
            </div>
            <p class="gl-body-text">${t.def}</p>
            <div class="gl-meta">
              ${t.author ? `<span class="gl-meta-item">${hi("profile", 12)} ${t.author}</span>` : ""}
              ${t.date ? `<span class="gl-meta-item">${hi("calendar", 12)} ${t.date}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* Primera entrada de grupo multi — badge azul + título visible */
  _renderEntryFirst(t, id) {
    return `
      <div class="gl-entry gl-entry-first" data-gl-entry="${id}">
        <div class="gl-entry-row" data-gl-toggle="${id}" role="button" tabindex="0"
          aria-expanded="false" aria-controls="gl-body-${id}">
          <div class="gl-entry-badge" aria-hidden="true">
            ${hi("book", 14)}
          </div>
          <div class="gl-entry-info">
            <div class="gl-entry-term">${t.term}</div>
            <div class="gl-entry-preview">${t.def}</div>
          </div>
          <div class="gl-chevron" aria-hidden="true">
            ${hi("chevron-down", 16)}
          </div>
        </div>
        <div class="gl-body" id="gl-body-${id}" data-gl-body="${id}">
          <div class="gl-body-inner" data-gl-inner="${id}">
            <div class="gl-divider"></div>
            <div class="gl-def-header">
              ${hi("book", 13)}
              Definición
            </div>
            <p class="gl-body-text">${t.def}</p>
            <div class="gl-meta">
              ${t.author ? `<span class="gl-meta-item">${hi("profile", 12)} ${t.author}</span>` : ""}
              ${t.date ? `<span class="gl-meta-item">${hi("calendar", 12)} ${t.date}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* Entradas 2..N de grupo multi — badge azul, sin título */
  _renderEntrySub(t, id) {
    return `
      <div class="gl-entry gl-entry-sub" data-gl-entry="${id}">
        <div class="gl-entry-row" data-gl-toggle="${id}" role="button" tabindex="0"
          aria-expanded="false" aria-controls="gl-body-${id}">
          <div class="gl-entry-badge" aria-hidden="true">
            ${hi("book", 14)}
          </div>
          <div class="gl-entry-info">
            <div class="gl-entry-term">${t.term}</div>
            <div class="gl-entry-preview">${t.def}</div>
          </div>
          <div class="gl-chevron" aria-hidden="true">
            ${hi("chevron-down", 16)}
          </div>
        </div>
        <div class="gl-body" id="gl-body-${id}" data-gl-body="${id}">
          <div class="gl-body-inner" data-gl-inner="${id}">
            <div class="gl-divider"></div>
            <div class="gl-def-header">
              ${hi("book", 13)}
              Definición
            </div>
            <p class="gl-body-text">${t.def}</p>
            <div class="gl-meta">
              ${t.author ? `<span class="gl-meta-item">${hi("profile", 12)} ${t.author}</span>` : ""}
              ${t.date ? `<span class="gl-meta-item">${hi("calendar", 12)} ${t.date}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ── Eventos ────────────────────────────────────────────── */

  _bindEvents() {
    // Búsqueda
    this.querySelector("[data-gl-search]")?.addEventListener("input", (e) => {
      this._query = e.target.value;
      this._refreshList();
    });

    // Filtro alfabético
    this.querySelectorAll("[data-gl-letter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._activeFilter = btn.dataset.glLetter;
        this.querySelectorAll("[data-gl-letter]").forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        this._refreshList();
      });
    });

    // Toggle entradas
    this.querySelectorAll("[data-gl-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => this._toggleEntry(toggle));
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._toggleEntry(toggle);
        }
      });
    });
  }

  _toggleEntry(toggle) {
    const id = toggle.dataset.glToggle;
    const entry = this.querySelector(`[data-gl-entry="${id}"]`);
    const body = this.querySelector(`[data-gl-body="${id}"]`);
    const inner = this.querySelector(`[data-gl-inner="${id}"]`);
    if (!entry || !body || !inner) return;

    const open = entry.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));

    if (open) {
      liquidOpen(body, inner);
    } else {
      liquidClose(body, inner);
    }
  }

  _refreshList() {
    const terms = this._getTerms();
    const list = this.querySelector("[data-gl-list]");
    if (!list) return;
    list.innerHTML = this._renderEntries(terms);
    this.querySelectorAll("[data-gl-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => this._toggleEntry(toggle));
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this._toggleEntry(toggle);
        }
      });
    });
  }
}

customElements.define("uveg-glosario", UvegGlosario);
