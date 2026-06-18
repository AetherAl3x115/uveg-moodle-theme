/**
 * components/uveg-fab/uveg-fab.js
 * ─────────────────────────────────────────────────────────────
 * FAB flotante de accesibilidad con hijos (Notas + Chatbot).
 *
 * Comportamientos:
 *   1. Default  — botón de accesibilidad fijo en esquina
 *   2. Draggable — arrastrable libremente; posición persiste en localStorage
 *   3. Hover    — expande hijos: fab-notes y fab-chatbot
 *
 * Los eventos uveg:togglenotes y uveg:chatbot siguen funcionando
 * igual — este componente solo orquesta visibilidad y posición.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

const STORE_KEY = "uveg-fab-pos";

class UvegFab extends HTMLElement {
  connectedCallback() {
    this._pos = this._loadPos();
    this._dragging = false;
    this._expanded = false;
    this._render();
    this._bindDrag();
    this._bindHover();
    this._applyPos();
  }

  disconnectedCallback() {
    this._cleanDrag();
  }

  /* ── Persistencia ──────────────────────────────────────────── */
  _loadPos() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return null; // null = posición CSS default (esquina)
  }

  _savePos(x, y) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ x, y }));
    } catch {
      /* ignore */
    }
  }

  /* ── Render ────────────────────────────────────────────────── */
  _render() {
    this.innerHTML = `
      <div class="ufab-wrap">
        <!-- Hijos — visibles en hover -->
        <div class="ufab-children">
          <button class="ufab-child ufab-child--notes"
            aria-label="Mis notas" title="Mis notas"
            data-child="notes">
            ${hi("notebook", 20)}
          </button>
          <button class="ufab-child ufab-child--chat"
            aria-label="Asistente virtual" title="Asistente UVEG"
            data-child="chat">
            <img src="assets/img/icons/robot.png" alt="" width="22" height="22">
          </button>
        </div>
        <!-- Botón principal -->
        <button class="ufab-main" aria-label="Accesibilidad y herramientas" title="Herramientas">
          <span class="ufab-main-icon ufab-main-icon--default">
            ${hi("accessibility", 22)}
          </span>
          <span class="ufab-main-icon ufab-main-icon--close" aria-hidden="true">
            ${hi("x", 20)}
          </span>
        </button>
      </div>`;
  }

  /* ── Posición ──────────────────────────────────────────────── */
  _applyPos() {
    if (!this._pos) return;
    const { x, y } = this._pos;
    const w = this.offsetWidth || 52;
    const h = this.offsetHeight || 52;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    // Si la posición guardada está fuera del viewport actual, descartarla
    if (x > maxX || y > maxY || x < 8 || y < 8) {
      this._pos = null;
      localStorage.removeItem("uveg-fab-pos");
      return;
    }
    this.style.right = "auto";
    this.style.bottom = "auto";
    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
  }

  /* ── Drag ──────────────────────────────────────────────────── */
  _bindDrag() {
    const btn = this.querySelector(".ufab-main");
    if (!btn) return;

    let startX, startY, origLeft, origTop;
    let moved = false;

    const onMove = (e) => {
      if (!this._dragging) return;
      e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = cx - startX;
      const dy = cy - startY;

      if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      moved = true;

      // Clampar al viewport
      const w = this.offsetWidth;
      const h = this.offsetHeight;
      const maxX = window.innerWidth - w - 8;
      const maxY = window.innerHeight - h - 8;

      const newLeft = Math.max(8, Math.min(maxX, origLeft + dx));
      const newTop = Math.max(8, Math.min(maxY, origTop + dy));

      this.style.right = "auto";
      this.style.bottom = "auto";
      this.style.left = `${newLeft}px`;
      this.style.top = `${newTop}px`;
      this.classList.add("ufab--dragging");
    };

    const onUp = (e) => {
      if (!this._dragging) return;
      this._dragging = false;
      this.classList.remove("ufab--dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);

      if (moved) {
        const rect = this.getBoundingClientRect();
        this._pos = { x: rect.left, y: rect.top };
        this._savePos(rect.left, rect.top);
      }
    };

    const onDown = (e) => {
      // Solo botón principal inicia drag
      if (!e.target.closest(".ufab-main")) return;
      moved = false;
      this._dragging = true;
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startY = e.touches ? e.touches[0].clientY : e.clientY;

      const rect = this.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    };

    btn.addEventListener("mousedown", onDown);
    btn.addEventListener("touchstart", onDown, { passive: false });

    // Click solo si no hubo drag
    btn.addEventListener("click", () => {
      if (moved) {
        moved = false;
        return;
      }
      this._toggle();
    });

    this._cleanDrag = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
  }

  /* ── Hover expand ──────────────────────────────────────────── */
  _bindHover() {
    const wrap = this.querySelector(".ufab-wrap");
    if (!wrap) return;

    wrap.addEventListener("mouseenter", () => this._expand(true));
    wrap.addEventListener("mouseleave", () => {
      // Solo colapsar si no está "pinned" (toggle click)
      if (!this._pinned) this._expand(false);
    });

    // Hijos: despachar eventos correspondientes
    this.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-child]");
      if (!btn) return;
      const child = btn.dataset.child;
      if (child === "notes") {
        document.dispatchEvent(new CustomEvent("uveg:togglenotes"));
      } else if (child === "chat") {
        // Chatbot: solo visual por ahora
        btn.classList.toggle("ufab-child--active");
      }
    });
  }

  _expand(open) {
    this._expanded = open;
    this.querySelector(".ufab-wrap")?.classList.toggle(
      "ufab-wrap--expanded",
      open,
    );
  }

  _toggle() {
    this._pinned = !this._pinned;
    this._expand(this._pinned);
    this.querySelector(".ufab-main")?.classList.toggle(
      "ufab-main--open",
      this._pinned,
    );
  }
}

customElements.define("uveg-fab", UvegFab);
