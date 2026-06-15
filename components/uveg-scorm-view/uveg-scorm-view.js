/**
 * components/uveg-scorm-view/uveg-scorm-view.js
 * ─────────────────────────────────────────────────────────────
 * Vista de detalle para actividades de contenido:
 * video, lectura, podcast, presentación, infografía.
 *
 * Muestra hero + tabs + iframe con contenido embebido.
 * El botón "Continuar actividad" dispara uveg:activitycomplete
 * con { actId, cardId } para que page.js actualice el
 * cronograma y el estado de la card.
 *
 * Si ya se presionó el botón en esta sesión, cambia a
 * "Ver actividad" y no vuelve a disparar el evento.
 * ─────────────────────────────────────────────────────────────
 */

class UvegScormView extends HTMLElement {
  connectedCallback() {
    this.style.display = "none";
  }

  _wasCompleted(actId, cardId) {
    if (!actId || !cardId) return false;
    try {
      const saved = localStorage.getItem(`uveg-card-${cardId}`);
      if (!saved) return false;
      const { completedActs = [] } = JSON.parse(saved);
      return completedActs.includes(actId);
    } catch (_) {
      return false;
    }
  }

  show(detail = {}) {
    this._detail = detail;
    this._activeTab = 0;
    this._completed = this._wasCompleted(detail.actId, detail.cardId);
    this.style.display = "block";
    this._render();
    this._bindEvents();
  }

  hide() {
    this.style.display = "none";
    this.innerHTML = "";
    this._detail = null;
    this._completed = false;
  }

  _render() {
    const d = this._detail || {};
    const title = d.title || "Actividad";
    const type = d.type || "lectura";
    const state = d.state || "progress";
    const src = d.src || ""; // URL del iframe (YouTube, Genially, etc.)

    const TYPE_LABELS = {
      video: "VIDEO",
      lectura: "LECTURA",
      podcast: "PODCAST",
      presentacion: "PRESENTACIÓN",
      infografia: "INFOGRAFÍA",
    };

    const stateLabel =
      {
        pending: "Pendiente",
        progress: "En progreso",
        done: "Completada",
      }[state] || "En progreso";

    const alreadyDone = this._completed || state === "done";
    const btnLabel = alreadyDone
      ? "Ver actividad"
      : state === "pending"
        ? "Actividad bloqueada"
        : "Continuar actividad";

    const btnDisabled = state === "pending" ? "disabled" : "";
    const typeLabel = TYPE_LABELS[type] || "ACTIVIDAD";

    // Fallback al Genially del módulo cuando no hay src definido
    const GENIALLY_DEMO = "https://view.genially.com/69a750fc4e341d6b6532a978";
    const iframeSrc = src || GENIALLY_DEMO;
    const iframeContent = `<iframe
      src="${iframeSrc}"
      frameborder="0"
      allowfullscreen
      allowscriptaccess="always"
      scrolling="yes"
      allownetworking="all"
      style="width:100%;height:100%;border:none;border-radius:var(--radius-lg)">
    </iframe>`;

    this.innerHTML = `
      <div class="lv-root">

        <button class="lv-back" data-sv-back>
          <span class="lv-back-icon">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </span>
          Regresar al módulo
        </button>

        <div class="lv-hero">
          <div class="lv-hero-icon">
            ${this._typeIcon(type)}
          </div>
          <div class="lv-hero-info">
            <div class="lv-hero-tag">Paquete SCORM · ${typeLabel}</div>
            <div class="lv-hero-title">${title}</div>
            <div class="lv-hero-chips">
              <span class="lv-chip lv-chip-progress">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${stateLabel}
              </span>
              <span class="lv-chip">
                <svg viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                Lectura + actividad
              </span>
              <span class="lv-chip">
                <svg viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Sin límite de intentos
              </span>
            </div>
          </div>
        </div>

        <div class="lv-tabs" role="tablist">
          ${this._renderTabs()}
        </div>

        <!-- Contenido principal: iframe -->
        <div class="sv-content-card">
          <div class="sv-iframe-wrap">
            ${iframeContent}
          </div>
          <div class="sv-footer">
            <button class="lv-btn-entrar" data-sv-entrar ${btnDisabled}
              ${alreadyDone ? "data-already-done" : ""}>
              <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
              ${btnLabel}
            </button>
          </div>
        </div>

      </div>
    `;
  }

  _typeIcon(type) {
    const icons = {
      video: `<svg viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      lectura: `<svg viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
      podcast: `<svg viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z"/></svg>`,
      presentacion: `<svg viewBox="0 0 24 24"><path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>`,
      infografia: `<svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
    };
    const svg = icons[type] || icons.lectura;
    return svg.replace(
      "<svg",
      `<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`,
    );
  }

  _renderTabs() {
    const tabs = [
      {
        label: "Paquete SCORM",
        icon: `<svg viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>`,
      },
      {
        label: "Configuración",
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
      },
      {
        label: "Reportes",
        icon: `<svg viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>`,
      },
      {
        label: "Más",
        icon: `<svg viewBox="0 0 24 24"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>`,
      },
    ];
    return tabs
      .map(
        (t, i) => `
      <button class="lv-tab${i === this._activeTab ? " active fill-from-left" : ""}"
              data-sv-tab="${i}" role="tab" aria-selected="${i === this._activeTab}">
        ${t.icon.replace("<svg", `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`)}<span>${t.label}</span>
      </button>`,
      )
      .join("");
  }

  _bindEvents() {
    this.querySelector("[data-sv-back]")?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("uveg:scormback", {
          bubbles: true,
          composed: true,
        }),
      );
    });

    // Botón "Continuar actividad"
    this.querySelector("[data-sv-entrar]")?.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      if (btn.disabled || btn.dataset.alreadyDone !== undefined) return;

      this._completed = true;
      btn.dataset.alreadyDone = "";
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Ver actividad`;

      this.dispatchEvent(
        new CustomEvent("uveg:activitycomplete", {
          bubbles: true,
          composed: true,
          detail: {
            actId: this._detail?.actId || null,
            cardId: this._detail?.cardId || null,
          },
        }),
      );
    });

    // Tabs
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sv-tab]");
      if (!btn) return;
      const newIdx = parseInt(btn.dataset.svTab);
      if (newIdx === this._activeTab) return;
      const dir = newIdx > this._activeTab ? "right" : "left";
      const prev = this.querySelector(".lv-tab.active");
      if (prev) {
        prev.classList.remove(
          "active",
          "fill-from-left",
          "fill-from-right",
          "drain-to-left",
          "drain-to-right",
        );
        prev.classList.add(
          dir === "right" ? "drain-to-left" : "drain-to-right",
        );
        prev.setAttribute("aria-selected", "false");
        setTimeout(
          () => prev.classList.remove("drain-to-left", "drain-to-right"),
          380,
        );
      }
      btn.classList.remove(
        "drain-to-left",
        "drain-to-right",
        "fill-from-left",
        "fill-from-right",
      );
      btn.classList.add(
        "active",
        dir === "right" ? "fill-from-left" : "fill-from-right",
      );
      btn.setAttribute("aria-selected", "true");
      this._activeTab = newIdx;
    });
  }

  close() {
    this.hide();
  }
}

customElements.define("uveg-scorm-view", UvegScormView);
