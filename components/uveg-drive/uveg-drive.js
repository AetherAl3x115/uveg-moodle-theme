// components/uveg-drive/uveg-drive.js
import { hi } from "../../js/utils/icons.js";

// ─── CONFIGURACIÓN ─────────────────────────────────────────────
const GOOGLE_CLIENT_ID =
  "1020124270325-k6rbvt9j6d4p8crm4h3m3emcn2g07uhg.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive";
const TOKEN_KEY = "uveg_drive_token";

// ─── Tokens ─────────────────────────────────────────────────────
function getToken() {
  return (
    sessionStorage.getItem("uveg_gmail_token") ||
    sessionStorage.getItem(TOKEN_KEY)
  );
}
function setToken(t) {
  sessionStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem("uveg_gmail_token");
}

function loadGSI() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function requestToken() {
  return new Promise((resolve, reject) => {
    loadGSI().then(() => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            reject(new Error(resp.error));
            return;
          }
          setToken(resp.access_token);
          resolve(resp.access_token);
        },
      });
      client.requestAccessToken({ prompt: "" });
    });
  });
}

// ─── API Drive ──────────────────────────────────────────────────
async function driveFetch(path, options = {}, retry = 0) {
  let token = getToken();
  if (!token) token = await requestToken();

  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    token = await requestToken();
    return driveFetch(path, options, retry);
  }

  if (res.status === 429 && retry < 3) {
    const wait = 2 ** retry * 500;
    await new Promise((r) => setTimeout(r, wait));
    return driveFetch(path, options, retry + 1);
  }

  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  if (res.status === 204 || res.headers.get("content-length") === "0")
    return {};
  return res.json();
}

// ─── XSS helper ─────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Paginación Drive ───────────────────────────────────────────
async function driveListAll(baseQuery, fields) {
  const results = [];
  let pageToken = null;
  do {
    const url =
      `/files?q=${encodeURIComponent(baseQuery)}` +
      `&fields=nextPageToken,${fields}` +
      `&orderBy=name&pageSize=200` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const data = await driveFetch(url);
    results.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return results;
}

// ─── Web Component ─────────────────────────────────────────────
class UvegDrive extends HTMLElement {
  constructor() {
    super();
    this._open = false;
    this._files = [];
    this._currentFolderId = "root";
    this._currentFolderName = "Mi unidad";
    this._path = [];
    this._loadingDrive = false;
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._render();
  }

  connectedCallback() {
    this._bindEvents();
    document.addEventListener("keydown", this._boundKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._boundKeyDown);
  }

  _render() {
    this.innerHTML = `
      <div class="ud-panel" id="ud-panel" role="dialog"
           aria-label="Mi Drive" aria-hidden="true">
        <div class="ud-header">
          <div class="ud-header-left">
            <span class="ud-header-icon">${hi("drive", 16)}</span>
            <span class="ud-header-title">Mi Drive</span>
          </div>
          <div class="ud-header-actions">
            <button class="ud-btn-icon" id="ud-btn-refresh" title="Actualizar">
              ${hi("arrow-right", 14)}
            </button>
            <button class="ud-btn-icon" id="ud-btn-close" title="Cerrar">
              ${hi("chevron-down", 14)}
            </button>
          </div>
        </div>

        <div class="ud-body" id="ud-body">
          <div class="ud-empty">
            ${hi("drive", 36)}
            <p>Conéctate para gestionar tus archivos</p>
            <button class="ud-btn-connect" id="ud-btn-connect">
              Conectar con Google Drive
            </button>
          </div>
        </div>

        <div class="ud-footer">
          <span class="ud-storage" id="ud-storage">Cargando almacenamiento...</span>
        </div>

        <div class="ud-toast" id="ud-toast" role="alert" aria-live="polite"></div>
      </div>
    `;
  }

  _bindEvents() {
    this.querySelector("#ud-btn-close")?.addEventListener("click", () =>
      this.close(),
    );
    this.querySelector("#ud-btn-refresh")?.addEventListener("click", () =>
      this._loadDrive(),
    );
    this.querySelector("#ud-btn-connect")?.addEventListener("click", () =>
      this._loadDrive(),
    );
  }

  _onKeyDown(e) {
    if (e.key === "Escape" && this._open) this.close();
  }

  open() {
    this._open = true;
    const p = this.querySelector("#ud-panel");
    p.classList.add("ud-panel--open");
    p.setAttribute("aria-hidden", "false");
    if (!getToken()) {
      this._setConnect();
    } else {
      this._loadDrive();
    }
  }

  close() {
    this._open = false;
    const p = this.querySelector("#ud-panel");
    p.classList.remove("ud-panel--open");
    p.setAttribute("aria-hidden", "true");
  }

  toggle() {
    this._open ? this.close() : this.open();
  }

  // ─── Cargar Drive ─────────────────────────────────────────────
  async _loadDrive() {
    if (this._loadingDrive) return;
    this._loadingDrive = true;
    this._setLoading();
    try {
      const query =
        this._currentFolderId === "root"
          ? `'root' in parents and trashed=false`
          : `'${this._currentFolderId}' in parents and trashed=false`;

      this._files = await driveListAll(
        query,
        "files(id,name,mimeType,size,createdTime,webViewLink,iconLink,parents,shared)",
      );
      this._showFiles();
      this._updateStorage();
    } catch (err) {
      if (err.message.includes("403") || err.message.includes("401")) {
        clearToken();
        this._setConnect();
        this._showToast("Sesión expirada. Vuelve a conectar.", "error");
      } else {
        this._showToast("Error al cargar: " + err.message, "error");
        this._setConnect();
      }
    } finally {
      this._loadingDrive = false;
    }
  }

  async _navigateTo(folderId, folderName) {
    this._path.push({
      id: this._currentFolderId,
      name: this._currentFolderName,
    });
    this._currentFolderId = folderId;
    this._currentFolderName = folderName;
    this._loadDrive();
  }

  _goBack() {
    if (this._path.length === 0) return;
    const last = this._path.pop();
    this._currentFolderId = last.id;
    this._currentFolderName = last.name;
    this._loadDrive();
  }

  // ─── Subir archivo ────────────────────────────────────────────
  async _uploadFile(file, retry = 0) {
    const parents =
      this._currentFolderId === "root" ? [] : [this._currentFolderId];
    const metadata = {
      name: file.name,
      ...(parents.length ? { parents } : {}),
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    form.append("file", file);

    try {
      let token = getToken();
      if (!token) token = await requestToken();
      const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      if (res.status === 401 && retry < 1) {
        clearToken();
        return this._uploadFile(file, retry + 1);
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      this._showToast(
        `✅ "${escapeHtml(data.name)}" subido correctamente`,
        "success",
      );
      this._loadDrive();
    } catch (err) {
      this._showToast("Error al subir: " + err.message, "error");
    }
  }

  // ─── Crear carpeta ────────────────────────────────────────────
  async _createFolder(name) {
    if (!name.trim()) {
      this._showToast("Escribe un nombre para la carpeta", "error");
      return;
    }
    const parents =
      this._currentFolderId === "root" ? [] : [this._currentFolderId];
    try {
      const folder = await driveFetch("/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mimeType: "application/vnd.google-apps.folder",
          ...(parents.length ? { parents } : {}),
        }),
      });
      this._showToast(
        `📂 Carpeta "${escapeHtml(folder.name)}" creada`,
        "success",
      );
      this._loadDrive();
    } catch (err) {
      this._showToast("Error al crear carpeta: " + err.message, "error");
    }
  }

  // ─── Eliminar archivo ─────────────────────────────────────────
  async _deleteFile(id, name) {
    const item = this.querySelector(`[data-id="${id}"]`);
    if (!item) return;
    this._showInlineConfirm(
      item,
      `¿Eliminar "${escapeHtml(name)}"?`,
      async () => {
        try {
          await driveFetch(`/files/${id}`, { method: "DELETE" });
          this._showToast(`"${escapeHtml(name)}" eliminado`, "success");
          this._loadDrive();
        } catch (err) {
          this._showToast("Error al eliminar: " + err.message, "error");
        }
      },
    );
  }

  _showInlineConfirm(targetEl, msg, onConfirm) {
    this.querySelector(".ud-confirm")?.remove();
    const box = document.createElement("div");
    box.className = "ud-confirm";
    box.innerHTML = `
      <span class="ud-confirm-msg">${msg}</span>
      <div class="ud-confirm-btns">
        <button class="ud-confirm-btn ud-confirm-btn--cancel">Cancelar</button>
        <button class="ud-confirm-btn ud-confirm-btn--ok">Eliminar</button>
      </div>`;
    targetEl.after(box);
    box.querySelector(".ud-confirm-btn--ok").addEventListener("click", () => {
      box.remove();
      onConfirm();
    });
    box
      .querySelector(".ud-confirm-btn--cancel")
      .addEventListener("click", () => box.remove());
    const onOutside = (e) => {
      if (!box.contains(e.target)) {
        box.remove();
        document.removeEventListener("click", onOutside, true);
      }
    };
    setTimeout(() => document.addEventListener("click", onOutside, true), 50);
  }

  _showInlinePrompt(msg, onConfirm) {
    this.querySelector(".ud-prompt")?.remove();
    const body = this.querySelector("#ud-body");
    const box = document.createElement("div");
    box.className = "ud-prompt";
    box.innerHTML = `
      <span class="ud-prompt-msg">${msg}</span>
      <input class="ud-prompt-input" type="text" placeholder="Nombre..." autocomplete="off">
      <div class="ud-confirm-btns">
        <button class="ud-confirm-btn ud-confirm-btn--cancel">Cancelar</button>
        <button class="ud-confirm-btn ud-confirm-btn--ok">Crear</button>
      </div>`;
    body.prepend(box);
    const input = box.querySelector(".ud-prompt-input");
    input.focus();
    box.querySelector(".ud-confirm-btn--ok").addEventListener("click", () => {
      const val = input.value.trim();
      box.remove();
      if (val) onConfirm(val);
    });
    box
      .querySelector(".ud-confirm-btn--cancel")
      .addEventListener("click", () => box.remove());
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const val = input.value.trim();
        box.remove();
        if (val) onConfirm(val);
      }
      if (e.key === "Escape") box.remove();
    });
  }

  // ─── UI ──────────────────────────────────────────────────────
  _setConnect() {
    const body = this.querySelector("#ud-body");
    body.innerHTML = `
      <div class="ud-empty">
        ${hi("drive", 36)}
        <p>Conéctate para gestionar tus archivos</p>
        <button class="ud-btn-connect" id="ud-btn-connect">
          Conectar con Google Drive
        </button>
      </div>
    `;
    this.querySelector("#ud-btn-connect")?.addEventListener("click", () =>
      this._loadDrive(),
    );
  }

  _setLoading() {
    const body = this.querySelector("#ud-body");
    body.innerHTML = `
      <div class="ud-loading">
        <div class="ud-spinner"></div>
        <p>Cargando archivos...</p>
      </div>
    `;
  }

  _showFiles() {
    const body = this.querySelector("#ud-body");

    const folders = this._files.filter(
      (f) => f.mimeType === "application/vnd.google-apps.folder",
    );
    const files = this._files.filter(
      (f) => f.mimeType !== "application/vnd.google-apps.folder",
    );

    const hasFiles = this._files.length > 0;
    const breadcrumbParts = this._path.length
      ? [
          ...this._path.map((p) => escapeHtml(p.name)),
          escapeHtml(this._currentFolderName),
        ]
      : ["Mi unidad"];
    const breadcrumbLabel = breadcrumbParts.join(" › ");

    body.innerHTML = `
      <div class="ud-breadcrumb">
        <button class="ud-breadcrumb-btn" id="ud-back-btn" ${this._path.length === 0 ? "disabled" : ""}>
          ${hi("arrow-left", 14)} Volver
        </button>
        <span class="ud-breadcrumb-path">${breadcrumbLabel}</span>
      </div>

      <div class="ud-actions">
        <label class="ud-action-btn" for="ud-file-input">
          ${hi("plus", 14)} Subir archivo
        </label>
        <input type="file" id="ud-file-input" style="display:none" multiple>
        <button class="ud-action-btn" id="ud-folder-btn">
          ${hi("plus", 14)} Crear carpeta
        </button>
      </div>

      ${
        hasFiles
          ? `
        <div class="ud-file-grid">
          ${folders
            .map(
              (f) => `
            <div class="ud-file-item ud-folder-item" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}">
              <span class="ud-file-icon">${f.shared ? "📁🔗" : "📁"}</span>
              <span class="ud-file-name">${escapeHtml(f.name)}${f.shared ? " (compartida)" : ""}</span>
              <span class="ud-file-meta">carpeta</span>
              <button class="ud-file-delete" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}" title="Eliminar">
                ${hi("trash", 14)}
              </button>
            </div>
          `,
            )
            .join("")}
          ${files
            .map(
              (f) => `
            <div class="ud-file-item">
              <span class="ud-file-icon">
                ${
                  f.iconLink
                    ? `<img src="${escapeHtml(f.iconLink)}" width="18" height="18" alt="" style="vertical-align:middle">`
                    : "📄"
                }
              </span>
              <span class="ud-file-name">${escapeHtml(f.name)}</span>
              <span class="ud-file-meta">${f.size ? (f.size / 1024).toFixed(1) + " KB" : ""}</span>
              <div class="ud-file-actions">
                ${
                  f.webViewLink
                    ? `
                  <a href="${escapeHtml(f.webViewLink)}" target="_blank" class="ud-file-link" title="Ver/Descargar">
                    ${hi("eye", 14)}
                  </a>
                `
                    : ""
                }
                <button class="ud-file-delete" data-id="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}" title="Eliminar">
                  ${hi("trash", 14)}
                </button>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : `
        <div class="ud-empty-files">
          <p>Esta carpeta está vacía</p>
        </div>
      `
      }
    `;

    // ── Eventos ──────────────────────────────────────────────────
    body
      .querySelector("#ud-back-btn")
      ?.addEventListener("click", () => this._goBack());

    const input = body.querySelector("#ud-file-input");
    input?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => this._uploadFile(file));
      input.value = "";
    });

    body.querySelector("#ud-folder-btn")?.addEventListener("click", () => {
      this._showInlinePrompt("Nombre de la nueva carpeta:", (name) =>
        this._createFolder(name),
      );
    });

    body.querySelectorAll(".ud-folder-item").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".ud-file-delete")) return;
        this._navigateTo(el.dataset.id, el.dataset.name);
      });
    });

    body.querySelectorAll(".ud-file-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._deleteFile(btn.dataset.id, btn.dataset.name);
      });
    });
  }

  async _updateStorage() {
    try {
      const about = await driveFetch("/about?fields=storageQuota");
      const quota = about.storageQuota;
      const used = parseInt(quota.usage) || 0;
      const limit = parseInt(quota.limit) || 0;
      const pct = limit > 0 ? (used / limit) * 100 : 0;
      const usedGB = (used / 1024 ** 3).toFixed(1);
      const limitGB = (limit / 1024 ** 3).toFixed(1);
      const pctDisplay = pct.toFixed(0);
      this.querySelector("#ud-storage").textContent =
        `💾 ${usedGB} GB de ${limitGB} GB usado (${pctDisplay}%)`;
    } catch {
      this.querySelector("#ud-storage").textContent = "💾 Almacenamiento";
    }
  }

  _showToast(msg, type = "success") {
    const t = this.querySelector("#ud-toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `ud-toast ud-toast--${type} ud-toast--visible`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(
      () => t.classList.remove("ud-toast--visible"),
      3000,
    );
  }
}

customElements.define("uveg-drive", UvegDrive);
