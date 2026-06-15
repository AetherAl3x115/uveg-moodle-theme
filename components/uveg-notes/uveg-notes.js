/**
 * components/uveg-notes/uveg-notes.js
 * ─────────────────────────────────────────────────────────────
 * Panel flotante de notas personales.
 * Almacena en localStorage bajo la clave "uveg-notes-data".
 *
 * Estructura del store:
 *   { sections: [{ id, name, color, notes: [{ id, text, cardRef, date }] }] }
 *
 * Eventos emitidos:
 *   Ninguno público — todo es autocontenido.
 *
 * Uso en HTML:
 *   <uveg-notes></uveg-notes>
 *   <button class="fab-notes" aria-label="Mis notas">…</button>
 *   El FAB despacha el evento uveg:togglenotes que este componente escucha.
 * ─────────────────────────────────────────────────────────────
 */

import { hi } from "../../js/utils/icons.js";

/* ── Constantes ──────────────────────────────────────────────── */
const STORE_KEY = "uveg-notes-data";

/* Color por sección — mapeado por índice para mantener consistencia visual */
const SECTION_COLORS = ["#7c3aed", "#a21caf", "#1445c4", "#0e7490", "#b45309"];

/* Secciones por defecto al inicializar por primera vez */
const DEFAULT_SECTIONS = [
  { id: "s-u1", name: "Unidad 1", color: "#7c3aed" },
  { id: "s-u2", name: "Unidad 2", color: "#a21caf" },
  { id: "s-gen", name: "General", color: "#1445c4" },
];

/* ── Helpers ─────────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmtDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return "Ahora";
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)
    return `Hoy ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  if (diff < 172_800_000) return "Ayer";
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Clase principal ─────────────────────────────────────────── */
class UvegNotes extends HTMLElement {
  /* ── Lifecycle ─────────────────────────────────────────────── */
  connectedCallback() {
    this._open = false;
    this._view = "list";
    this._editId = null;
    this._search = "";
    this._store = this._loadStore();

    /* fileInput oculto permanente — se crea una sola vez */
    this._fileInput = document.createElement("input");
    this._fileInput.type = "file";
    this._fileInput.accept = ".txt";
    this._fileInput.style.display = "none";
    this._fileInput.addEventListener("change", (e) => {
      if (e.target.files[0]) this._importJson(e.target.files[0]);
      this._fileInput.value = "";
    });
    document.body.appendChild(this._fileInput);

    this._render();
    this._bindGlobal();
  }

  disconnectedCallback() {
    document.removeEventListener("uveg:togglenotes", this._onToggle);
    document.removeEventListener("keydown", this._onKeydown);
    this._fileInput?.remove();
  }

  /* ── Store ─────────────────────────────────────────────────── */
  _loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignorar */
    }
    return { sections: DEFAULT_SECTIONS.map((s) => ({ ...s, notes: [] })) };
  }

  _saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this._store));
    } catch {
      /* ignorar */
    }
  }

  _allNotes() {
    return this._store.sections.flatMap((s) =>
      s.notes.map((n) => ({ ...n, sectionId: s.id })),
    );
  }

  _findNote(noteId) {
    for (const s of this._store.sections) {
      const n = s.notes.find((n) => n.id === noteId);
      if (n) return { section: s, note: n };
    }
    return null;
  }

  _addNote(sectionId, text, cardRef = "") {
    const s = this._store.sections.find((s) => s.id === sectionId);
    if (!s) return;
    s.notes.unshift({
      id: uid(),
      text: text.trim(),
      cardRef: cardRef.trim(),
      date: new Date().toISOString(),
    });
    this._saveStore();
  }

  _updateNote(noteId, text, cardRef) {
    const found = this._findNote(noteId);
    if (!found) return;
    found.note.text = text.trim();
    found.note.cardRef = cardRef.trim();
    found.note.date = new Date().toISOString();
    this._saveStore();
  }

  _deleteNote(noteId) {
    for (const s of this._store.sections) {
      const idx = s.notes.findIndex((n) => n.id === noteId);
      if (idx !== -1) {
        s.notes.splice(idx, 1);
        break;
      }
    }
    this._saveStore();
  }

  _deleteSection(sectionId) {
    const idx = this._store.sections.findIndex((s) => s.id === sectionId);
    if (idx !== -1) this._store.sections.splice(idx, 1);
    this._saveStore();
  }

  /* Muestra confirmación inline sobre el elemento objetivo */
  _showConfirm(targetEl, msg, onConfirm) {
    /* Si ya hay un confirm activo, quitarlo */
    this.querySelector(".np-confirm")?.remove();

    const box = document.createElement("div");
    box.className = "np-confirm";
    box.innerHTML = `
      <span class="np-confirm-msg">${escHtml(msg)}</span>
      <div class="np-confirm-btns">
        <button class="np-cbtn np-cbtn--cancel" data-confirm="cancel">Cancelar</button>
        <button class="np-cbtn np-cbtn--ok" data-confirm="ok">Eliminar</button>
      </div>`;

    targetEl.after(box);

    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-confirm]");
      if (!btn) return;
      box.remove();
      if (btn.dataset.confirm === "ok") onConfirm();
    });

    /* Auto-cierre si el usuario hace click fuera */
    const onOutside = (e) => {
      if (!box.contains(e.target)) {
        box.remove();
        document.removeEventListener("click", onOutside, true);
      }
    };
    setTimeout(() => document.addEventListener("click", onOutside, true), 50);
  }

  _addSection(name) {
    const color =
      SECTION_COLORS[this._store.sections.length % SECTION_COLORS.length];
    this._store.sections.push({
      id: uid(),
      name: name.trim(),
      color,
      notes: [],
    });
    this._saveStore();
  }

  /* ── Export / Import ────────────────────────────────────────── */
  _exportTxt() {
    const lines = [
      "╔══════════════════════════════════════╗",
      "║        MIS NOTAS — UVEG              ║",
      "╚══════════════════════════════════════╝",
      `Exportado: ${new Date().toLocaleString("es-MX")}`,
      "",
    ];
    for (const s of this._store.sections) {
      if (!s.notes.length) continue;
      lines.push(`▌ ${s.name.toUpperCase()}`, "─".repeat(38), "");
      for (const n of s.notes) {
        lines.push(`• ${n.text}`);
        if (n.cardRef) lines.push(`  📎 ${n.cardRef}`);
        lines.push(`  🕐 ${new Date(n.date).toLocaleString("es-MX")}`, "");
      }
    }
    lines.push(
      "─".repeat(38),
      "⚠ Estas notas se eliminan al terminar el curso.",
      "  Guarda este archivo para conservarlas.",
    );
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `notas-uveg-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _exportJson() {
    const blob = new Blob([JSON.stringify(this._store, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `notas-uveg-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  _importJson(file) {
    /* Parsea el .txt generado por _exportTxt y reconstruye las notas */
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split("\n");
        let currentSection = null;
        let currentText = null;
        let currentRef = null;
        let imported = 0;

        const flush = () => {
          if (!currentSection || !currentText) return;
          let section = this._store.sections.find(
            (s) => s.name.toUpperCase() === currentSection,
          );
          if (!section) {
            const color =
              SECTION_COLORS[
                this._store.sections.length % SECTION_COLORS.length
              ];
            section = {
              id: uid(),
              name:
                currentSection.charAt(0) +
                currentSection.slice(1).toLowerCase(),
              color,
              notes: [],
            };
            this._store.sections.push(section);
          }
          section.notes.push({
            id: uid(),
            text: currentText,
            cardRef: currentRef || "",
            date: new Date().toISOString(),
          });
          imported++;
          currentText = null;
          currentRef = null;
        };

        for (const raw of lines) {
          const line = raw.trimEnd();

          /* Encabezado de sección: "▌ UNIDAD 1" */
          if (line.startsWith("▌ ")) {
            flush();
            currentSection = line.slice(2).trim();
            continue;
          }

          /* Nota: "• texto..." */
          if (line.startsWith("• ")) {
            flush();
            currentText = line.slice(2).trim();
            continue;
          }

          /* Referencia: "  📎 lección 1" */
          if (line.includes("📎 ") && currentText) {
            currentRef = line.split("📎 ")[1]?.trim() || "";
            continue;
          }
        }
        flush(); /* última nota */

        if (imported === 0) {
          this._showToast("No se encontraron notas en el archivo.", "error");
          return;
        }

        this._saveStore();
        this._render();
        this._showToast(
          `${imported} nota${imported !== 1 ? "s" : ""} importada${imported !== 1 ? "s" : ""} correctamente.`,
        );
      } catch {
        this._showToast("No se pudo leer el archivo.", "error");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  _showToast(msg, type = "ok") {
    const existing = this.querySelector(".np-toast");
    if (existing) existing.remove();
    const t = document.createElement("div");
    t.className = `np-toast np-toast--${type}`;
    t.textContent = msg;
    this.querySelector(".np-panel")?.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ── Render principal ───────────────────────────────────────── */
  _render() {
    this.innerHTML = this._open ? this._tplPanel() : "";
    if (this._open) this._bindPanel();
  }

  /* ── Template: panel completo ───────────────────────────────── */
  _tplPanel() {
    return `
<div class="np-panel" role="dialog" aria-modal="true" aria-label="Mis notas">
  ${this._tplHeader()}
  ${this._tplSearch()}
  <div class="np-body" id="np-body">
    ${this._view === "list" ? this._tplList() : ""}
    ${this._view === "new-note" ? this._tplFormNote() : ""}
    ${this._view === "edit-note" ? this._tplFormNote(true) : ""}
    ${this._view === "new-section" ? this._tplFormSection() : ""}
  </div>
  ${this._view === "list" ? this._tplFooter() : ""}
</div>`;
  }

  /* ── Template: header ───────────────────────────────────────── */
  _tplHeader() {
    const titleMap = {
      list: "Mis notas",
      "new-note": "Nueva nota",
      "edit-note": "Editar nota",
      "new-section": "Nueva sección",
    };
    return `
<div class="np-header">
  <div class="np-header-left">
    ${hi("bookmark", 17)}
    <span class="np-title">${titleMap[this._view] || "Mis notas"}</span>
  </div>
  <div class="np-header-right">
    ${
      this._view === "list"
        ? `<button class="np-hbtn" data-action="export" title="Descargar mis notas como .txt">${hi("arrow-right", 13)} Exportar</button>
         <button class="np-hbtn" data-action="import-trigger" title="Restaurar desde archivo">
           ${hi("chevron-up", 13)} Importar
         </button>`
        : ""
    }
    <button class="np-hbtn np-hbtn--icon" data-action="close" aria-label="Cerrar panel">
      ${hi("chevron-down", 14)}
    </button>
  </div>
</div>`;
  }

  /* ── Template: buscador ─────────────────────────────────────── */
  _tplSearch() {
    if (this._view !== "list") return "";
    return `
<div class="np-search-wrap">
  <div class="np-search-inner">
    ${hi("magnifying-glass", 13, "np-search-icon")}
    <input
      class="np-search-input"
      id="np-search"
      type="search"
      placeholder="Buscar en mis notas…"
      value="${escHtml(this._search)}"
      autocomplete="off"
    >
  </div>
</div>`;
  }

  /* ── Template: lista de secciones + notas ───────────────────── */
  _tplList() {
    const q = this._search.toLowerCase().trim();
    const totalNotes = this._store.sections.reduce(
      (acc, s) => acc + s.notes.length,
      0,
    );
    let html = "";

    /* Badge advertencia — siempre visible cuando hay notas */
    if (totalNotes > 0) {
      html += `
<div class="np-warning-badge">
  ${hi("exclamation-triangle", 12)}
  Tus notas se eliminan al finalizar el curso. Expórtalas para conservarlas.
</div>`;
    }

    let totalVisible = 0;

    for (const s of this._store.sections) {
      /* Filtrar notas por búsqueda */
      const notes = q
        ? s.notes.filter(
            (n) =>
              n.text.toLowerCase().includes(q) ||
              (n.cardRef || "").toLowerCase().includes(q),
          )
        : s.notes;

      totalVisible += notes.length;

      html += `
<div class="np-section" data-section-id="${s.id}">
  <div class="np-section-hdr">
    <span class="np-section-label">
      <span class="np-dot" style="background:${s.color}"></span>
      ${escHtml(s.name)}
      <span class="np-count">${notes.length}</span>
    </span>
    <div class="np-section-controls">
      <button class="np-section-add" data-action="add-note" data-section="${s.id}" title="Agregar nota">
        ${hi("plus", 13)}
      </button>
      <button class="np-section-del" data-action="delete-section" data-section="${s.id}" data-section-name="${escHtml(s.name)}" data-section-count="${s.notes.length}" title="Eliminar sección">
        ${hi("trash", 12)}
      </button>
    </div>
  </div>
  ${
    notes.length
      ? notes.map((n) => this._tplNoteItem(n, s)).join("")
      : `<div class="np-empty-section">Sin notas${q ? " para esta búsqueda" : ""}</div>`
  }
</div>`;
    }

    if (q && totalVisible === 0) {
      return `<div class="np-empty">No se encontraron notas para <strong>${escHtml(q)}</strong></div>`;
    }

    return html;
  }

  /* ── Template: item de nota ─────────────────────────────────── */
  _tplNoteItem(note, section) {
    return `
<div class="np-note" data-note-id="${note.id}">
  <div class="np-note-bar" style="background:${section.color}"></div>
  <div class="np-note-body">
    <div class="np-note-text">${escHtml(note.text)}</div>
    <div class="np-note-meta">
      <span class="np-note-date">${fmtDate(note.date)}</span>
      ${note.cardRef ? `<span class="np-note-ref">${escHtml(note.cardRef)}</span>` : ""}
    </div>
  </div>
  <div class="np-note-actions">
    <button class="np-action-btn" data-action="edit-note" data-note="${note.id}" title="Editar nota">
      ${hi("pencil-square", 12)}
    </button>
    <button class="np-action-btn np-action-btn--del" data-action="delete-note" data-note="${note.id}" title="Eliminar nota">
      ${hi("trash", 12)}
    </button>
  </div>
</div>`;
  }

  /* ── Template: formulario nota (nueva o edición) ────────────── */
  _tplFormNote(isEdit = false) {
    let prefillText = "",
      prefillRef = "",
      prefillSection = "";

    if (isEdit && this._editId) {
      const found = this._findNote(this._editId);
      if (found) {
        prefillText = found.note.text;
        prefillRef = found.note.cardRef || "";
        prefillSection = found.section.id;
      }
    }

    /* Pre-seleccionar sección activa si viene de botón "add-note" */
    if (!isEdit && this._pendingSection) {
      prefillSection = this._pendingSection;
    }

    const sectionsOptions = this._store.sections
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === prefillSection ? "selected" : ""}>${escHtml(s.name)}</option>`,
      )
      .join("");

    return `
<div class="np-form">
  <div class="np-field">
    <label class="np-label" for="np-note-text">Nota</label>
    <textarea
      class="np-textarea"
      id="np-note-text"
      rows="5"
      maxlength="500"
      placeholder="Escribe tu nota aquí…"
      autocomplete="off"
    >${escHtml(prefillText)}</textarea>
    <div class="np-char-count"><span id="np-char-num">${prefillText.length}</span>/500</div>
  </div>
  <div class="np-field">
    <label class="np-label" for="np-note-section">Sección</label>
    <select class="np-select" id="np-note-section">
      ${sectionsOptions}
    </select>
  </div>
  <div class="np-field">
    <label class="np-label" for="np-note-ref">Referencia <span class="np-optional">(opcional)</span></label>
    <input
      class="np-input"
      id="np-note-ref"
      type="text"
      maxlength="60"
      placeholder="Ej: Lección 3, Reto 1…"
      value="${escHtml(prefillRef)}"
      autocomplete="off"
    >
  </div>
  <div class="np-form-actions">
    <button class="np-btn np-btn--ghost" data-action="cancel-form">Cancelar</button>
    <button class="np-btn np-btn--primary" data-action="save-note" data-edit="${isEdit ? this._editId : ""}">
      ${isEdit ? "Guardar cambios" : "Guardar nota"}
    </button>
  </div>
</div>`;
  }

  /* ── Template: formulario sección ───────────────────────────── */
  _tplFormSection() {
    return `
<div class="np-form">
  <div class="np-field">
    <label class="np-label" for="np-sec-name">Nombre de la sección</label>
    <input
      class="np-input"
      id="np-sec-name"
      type="text"
      maxlength="40"
      placeholder="Ej: Exámenes, Personal…"
      autocomplete="off"
    >
  </div>
  <div class="np-form-actions">
    <button class="np-btn np-btn--ghost" data-action="cancel-form">Cancelar</button>
    <button class="np-btn np-btn--primary" data-action="save-section">Crear sección</button>
  </div>
</div>`;
  }

  /* ── Template: footer ───────────────────────────────────────── */
  _tplFooter() {
    return `
<div class="np-footer">
  <button class="np-btn np-btn--ghost" data-action="go-new-section">
    ${hi("plus", 13)} Nueva sección
  </button>
  <button class="np-btn np-btn--primary" data-action="go-new-note">
    ${hi("plus", 13)} Nueva nota
  </button>
</div>`;
  }

  /* ── Bind eventos del panel ─────────────────────────────────── */
  _bindPanel() {
    const panel = this.querySelector(".np-panel");
    if (!panel) return;

    /* Búsqueda en tiempo real */
    const searchEl = this.querySelector("#np-search");
    if (searchEl) {
      searchEl.addEventListener("input", (e) => {
        this._search = e.target.value;
        this._reRenderBody();
      });
      /* Focus automático al abrir */
      requestAnimationFrame(() => searchEl.focus());
    }

    /* Contador de caracteres en textarea */
    const ta = this.querySelector("#np-note-text");
    if (ta) {
      ta.addEventListener("input", () => {
        const counter = this.querySelector("#np-char-num");
        if (counter) counter.textContent = ta.value.length;
      });
      requestAnimationFrame(() => ta.focus());
    }

    /* Delegación de clicks */
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      this._handleAction(btn.dataset.action, btn.dataset);
    });
  }

  /* ── Despacho de acciones ───────────────────────────────────── */
  _handleAction(action, dataset = {}) {
    switch (action) {
      case "close":
        this._open = false;
        this._view = "list";
        this._render();
        this._syncFab(false);
        break;

      case "export":
        this._exportTxt();
        break;

      case "export-json":
        this._exportJson();
        break;

      case "import-trigger":
        this._fileInput.click();
        break;

      /* ── Navegar a formulario de nota nueva ─────────────────── */
      case "go-new-note":
        this._view = "new-note";
        this._pendingSection = this._store.sections[0]?.id || "";
        this._render();
        break;

      /* ── Agregar nota desde botón de sección ────────────────── */
      case "add-note":
        this._view = "new-note";
        this._pendingSection = dataset.section || "";
        this._render();
        break;

      /* ── Editar nota ────────────────────────────────────────── */
      case "edit-note":
        this._view = "edit-note";
        this._editId = dataset.note;
        this._render();
        break;

      /* ── Eliminar nota — pedir confirmación ─────────────────── */
      case "delete-note": {
        const noteEl = this.querySelector(`[data-note-id="${dataset.note}"]`);
        if (!noteEl) break;
        this._showConfirm(
          noteEl,
          "¿Eliminar esta nota? No se puede deshacer.",
          () => {
            noteEl.classList.add("np-note--removing");
            setTimeout(() => {
              this._deleteNote(dataset.note);
              this._reRenderBody();
            }, 220);
          },
        );
        break;
      }

      /* ── Eliminar sección — pedir confirmación ──────────────── */
      case "delete-section": {
        const sectionEl = this.querySelector(
          `[data-section-id="${dataset.section}"]`,
        );
        if (!sectionEl) break;
        const count = parseInt(dataset.sectionCount, 10) || 0;
        const msg =
          count > 0
            ? `¿Eliminar "${dataset.sectionName}" y sus ${count} nota${count !== 1 ? "s" : ""}?`
            : `¿Eliminar la sección "${dataset.sectionName}"?`;
        this._showConfirm(
          sectionEl.querySelector(".np-section-hdr"),
          msg,
          () => {
            sectionEl.style.opacity = "0";
            sectionEl.style.transition = "opacity .2s";
            setTimeout(() => {
              this._deleteSection(dataset.section);
              this._reRenderBody();
            }, 200);
          },
        );
        break;
      }

      /* ── Guardar nota (nueva o edición) ─────────────────────── */
      case "save-note": {
        const text = this.querySelector("#np-note-text")?.value?.trim();
        if (!text) {
          this._shakeTextarea();
          return;
        }
        const sectionId = this.querySelector("#np-note-section")?.value;
        const cardRef = this.querySelector("#np-note-ref")?.value || "";
        const editId = dataset.edit;

        if (editId) {
          this._updateNote(editId, text, cardRef);
        } else {
          this._addNote(sectionId, text, cardRef);
        }

        this._view = "list";
        this._pendingSection = null;
        this._editId = null;
        this._render();
        break;
      }

      /* ── Navegar a nueva sección ────────────────────────────── */
      case "go-new-section":
        this._view = "new-section";
        this._render();
        break;

      /* ── Guardar sección ────────────────────────────────────── */
      case "save-section": {
        const name = this.querySelector("#np-sec-name")?.value?.trim();
        if (!name) {
          this.querySelector("#np-sec-name")?.classList.add("np-input--error");
          return;
        }
        this._addSection(name);
        this._view = "list";
        this._render();
        break;
      }

      /* ── Cancelar formulario ────────────────────────────────── */
      case "cancel-form":
        this._view = "list";
        this._pendingSection = null;
        this._editId = null;
        this._render();
        break;
    }
  }

  /* ── Re-render solo el body (búsqueda) ──────────────────────── */
  _reRenderBody() {
    const body = this.querySelector("#np-body");
    if (!body) return;
    body.innerHTML = this._view === "list" ? this._tplList() : "";
    this._bindPanel();
  }

  /* ── Shake textarea si está vacío ───────────────────────────── */
  _shakeTextarea() {
    const ta = this.querySelector("#np-note-text");
    if (!ta) return;
    ta.classList.add("np-textarea--error");
    setTimeout(() => ta.classList.remove("np-textarea--error"), 600);
    ta.focus();
  }

  /* ── Sincroniza estado visual del FAB ───────────────────────── */
  _syncFab(active) {
    document.querySelector(".fab-notes")?.classList.toggle("active", active);
  }

  /* ── Eventos globales ───────────────────────────────────────── */
  _bindGlobal() {
    this._onToggle = () => {
      this._open = !this._open;
      if (!this._open) {
        this._view = "list";
        this._search = "";
      }
      this._render();
      this._syncFab(this._open);
    };

    this._onKeydown = (e) => {
      if (e.key === "Escape" && this._open) {
        this._open = false;
        this._view = "list";
        this._render();
        this._syncFab(false);
      }
    };

    document.addEventListener("uveg:togglenotes", this._onToggle);
    document.addEventListener("keydown", this._onKeydown);
  }
}

customElements.define("uveg-notes", UvegNotes);
