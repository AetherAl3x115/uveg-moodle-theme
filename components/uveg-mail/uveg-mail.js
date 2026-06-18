// =============================================================================
// uveg-mail.js — Web Component: Panel de correo institucional
// =============================================================================

import { hi } from "../../js/utils/icons.js";

const GOOGLE_CLIENT_ID =
  "1020124270325-k6rbvt9j6d4p8crm4h3m3emcn2g07uhg.apps.googleusercontent.com";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const SCOPES =
  "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send";
const TOKEN_KEY = "uveg_gmail_token";

// ─── OAuth2 token ─────────────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  sessionStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
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
      // prompt:"" → no fuerza consentimiento en cada login; solo pide si no hay sesión activa
      client.requestAccessToken({ prompt: "" });
    });
  });
}

async function gmailFetch(path, options = {}, _retry = 0) {
  let token = getToken();
  if (!token) token = await requestToken();

  const res = await fetch(`${GMAIL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    token = await requestToken();
    return gmailFetch(path, options, _retry);
  }

  if (res.status === 429 && _retry < 3) {
    const wait = 2 ** _retry * 500;
    await new Promise((r) => setTimeout(r, wait));
    return gmailFetch(path, options, _retry + 1);
  }

  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

// ─── XSS helper ──────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Helpers de parseo ────────────────────────────────────────────────────────
function b64Decode(str) {
  try {
    return decodeURIComponent(
      atob(str.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
  } catch {
    return "";
  }
}

function getHeader(headers, name) {
  return (
    headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    ""
  );
}

function extractBody(payload) {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return b64Decode(payload.body.data);
  }
  if (payload.parts) {
    const plain = payload.parts.find((p) => p.mimeType === "text/plain");
    if (plain?.body?.data) return b64Decode(plain.body.data);
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  return "";
}

function parseMessage(msg) {
  const headers = msg.payload?.headers || [];
  return {
    id: msg.id,
    threadId: msg.threadId, // ← FIX: threadId preservado
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject") || "(sin asunto)",
    date: getHeader(headers, "Date"),
    snippet: msg.snippet || "",
    body: extractBody(msg.payload),
    unread: (msg.labelIds || []).includes("UNREAD"),
  };
}

// Codificación UTF-8 sin unescape() (obsoleto)
function makeEmail({ to, subject, body, threadId }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const bytes = new TextEncoder().encode(lines);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const raw = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { raw, ...(threadId ? { threadId } : {}) };
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function formatDateFull(dateStr) {
  try {
    return new Date(dateStr).toLocaleString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function extractName(from = "") {
  const m = from.match(/^"?([^"<]+)"?\s*</);
  return m ? m[1].trim() : from.replace(/<.*>/, "").trim() || from;
}

const DOMAIN_MAP = {
  "santander.com.mx": "santander.com",
  "banorte.com": "banorte.com",
  "bbva.com": "bbva.com",
  "bbvabancomer.com": "bbva.com",
  "notificaciones.bbva.com": "bbva.com",
  "lyft.com": "lyft.com",
  "uber.com": "uber.com",
  "blablacar.com": "blablacar.com",
  "google.com": "google.com",
  "accounts.google.com": "google.com",
};

function extractDomain(from = "") {
  const m = from.match(/<[^@]+@([^>]+)>/);
  if (!m) return null;
  const raw = m[1].toLowerCase();
  for (const [key, val] of Object.entries(DOMAIN_MAP)) {
    if (raw === key || raw.endsWith("." + key)) return val;
  }
  return raw;
}

const AVATAR_COLORS = [
  ["#ede9fe", "#6d28d9"],
  ["#dbeafe", "#1d4ed8"],
  ["#dcfce7", "#15803d"],
  ["#fce7f3", "#be185d"],
  ["#ffedd5", "#c2410c"],
  ["#e0f2fe", "#0369a1"],
  ["#fef9c3", "#a16207"],
  ["#f3e8ff", "#7e22ce"],
];

function avatarColor(name = "") {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

function renderAvatar(from = "") {
  const name = extractName(from);
  const domain = extractDomain(from);
  const initial = escapeHtml((name.charAt(0) || "?").toUpperCase());
  const [bg, color] = avatarColor(name);

  if (domain) {
    const favicon = `https://www.google.com/s2/favicons?domain=${escapeHtml(DOMAIN_MAP[domain] || domain)}&sz=64`;
    return `
      <div class="um-inbox-avatar" style="background:${bg};color:${color}"
           data-initial="${initial}">
        <img src="${favicon}" alt="${initial}"
             width="22" height="22"
             onerror="this.style.display='none';this.parentElement.textContent='${initial}'">
      </div>`;
  }

  return `<div class="um-inbox-avatar" style="background:${bg};color:${color}">${initial}</div>`;
}

function sanitize(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// =============================================================================
// Web Component
// =============================================================================
class UvegMail extends HTMLElement {
  constructor() {
    super();
    this._open = false;
    this._view = "inbox";
    this._inbox = [];
    this._current = null;
    this._composeMode = "new";
    this._replyTo = null;
    this._loadingInbox = false;
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

  _onKeyDown(e) {
    if (e.key === "Escape" && this._open) this.close();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  _render() {
    this.innerHTML = `
      <div class="um-panel" id="um-panel" role="dialog"
           aria-label="Correo institucional" aria-hidden="true">

        <div class="um-header">
          <div class="um-header-left">
            <span class="um-header-icon">${hi("mail", 16)}</span>
            <span class="mail-inst-badge">✦ UVEG Mail</span>
          </div>
          <div class="um-header-actions">
            <button class="um-btn-icon" id="um-btn-compose" title="Redactar">
              ${hi("pencil-square", 14)}
            </button>
            <button class="um-btn-icon" id="um-btn-refresh" title="Actualizar">
              ${hi("arrow-right", 14)}
            </button>
            <button class="um-btn-icon" id="um-btn-close" title="Cerrar">
              ${hi("chevron-down", 14)}
            </button>
          </div>
        </div>

        <div class="um-body" id="um-body">
          <div class="um-empty">
            ${hi("mail", 36)}
            <p>Abre el panel para cargar tu correo</p>
          </div>
        </div>

        <div class="um-toast" id="um-toast" role="alert" aria-live="polite"></div>
      </div>`;
  }

  // ─── Eventos ──────────────────────────────────────────────────────────────
  _bindEvents() {
    this.querySelector("#um-btn-close")?.addEventListener("click", () =>
      this.close(),
    );
    this.querySelector("#um-btn-refresh")?.addEventListener("click", () =>
      this._loadInbox(),
    );
    this.querySelector("#um-btn-compose")?.addEventListener("click", () => {
      this._composeMode = "new";
      this._replyTo = null;
      this._showCompose();
    });
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  open() {
    this._open = true;
    const p = this.querySelector("#um-panel");
    p.classList.add("um-panel--open");
    p.setAttribute("aria-hidden", "false");
    if (this._inbox.length === 0) this._loadInbox();
  }

  close() {
    this._open = false;
    const p = this.querySelector("#um-panel");
    p.classList.remove("um-panel--open");
    p.setAttribute("aria-hidden", "true");
  }

  toggle() {
    this._open ? this.close() : this.open();
  }

  // ─── Inbox ────────────────────────────────────────────────────────────────
  async _loadInbox() {
    if (this._loadingInbox) return;
    this._loadingInbox = true;
    this._setLoading();
    try {
      const list = await gmailFetch("/messages?labelIds=INBOX&maxResults=30");
      const ids = (list.messages || []).map((m) => m.id);

      if (!ids.length) {
        this._inbox = [];
        this._showInbox();
        return;
      }

      const msgs = [];
      const BATCH = 5;
      for (let i = 0; i < ids.length; i += BATCH) {
        const chunk = ids.slice(i, i + BATCH);
        const results = await Promise.all(
          chunk.map((id) =>
            gmailFetch(
              `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To`,
            ),
          ),
        );
        msgs.push(...results);
        if (i + BATCH < ids.length)
          await new Promise((r) => setTimeout(r, 200));
      }

      this._inbox = msgs.map(parseMessage);
      this._showInbox();
      this._updateBadge();
    } catch (err) {
      if (err.message?.includes("popup")) {
        this._setEmpty("Autenticación cancelada");
      } else {
        this._showToast("Error al cargar inbox: " + err.message, "error");
        this._setEmpty("No se pudo cargar el inbox");
      }
    } finally {
      this._loadingInbox = false;
    }
  }

  _showInbox() {
    this._view = "inbox";
    const body = this.querySelector("#um-body");

    if (!this._inbox.length) {
      body.innerHTML = `<div class="um-empty">${hi("mail", 36)}<p>Tu inbox está vacío</p></div>`;
      return;
    }

    body.innerHTML = `
      <ul class="um-inbox-list" role="list">
        ${this._inbox
          .map(
            (m) => `
          <li class="um-inbox-item ${m.unread ? "um-inbox-item--unread" : ""}"
              data-id="${escapeHtml(m.id)}" role="button" tabindex="0">
            ${renderAvatar(m.from)}
            <div class="um-inbox-meta">
              <div class="um-inbox-from">${escapeHtml(extractName(m.from))}</div>
              <div class="um-inbox-subject">${escapeHtml(m.subject)}</div>
              <div class="um-inbox-snippet">${escapeHtml(m.snippet)}</div>
            </div>
            <div class="um-inbox-date">${escapeHtml(formatDate(m.date))}</div>
            ${m.unread ? '<span class="um-unread-dot"></span>' : ""}
          </li>`,
          )
          .join("")}
      </ul>`;

    body.querySelectorAll(".um-inbox-item").forEach((el) => {
      el.addEventListener("click", () => this._loadMessage(el.dataset.id));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ")
          this._loadMessage(el.dataset.id);
      });
    });
  }

  // ─── Leer mensaje ─────────────────────────────────────────────────────────
  async _loadMessage(id) {
    this._setLoading();
    try {
      const msg = await gmailFetch(`/messages/${id}?format=full`);
      this._current = parseMessage(msg);

      if (this._current.unread) {
        await gmailFetch(`/messages/${id}/modify`, {
          method: "POST",
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });
        const m = this._inbox.find((x) => x.id === id);
        if (m) m.unread = false;
        this._updateBadge();
      }

      this._showRead();
    } catch (err) {
      this._showToast("Error al cargar correo: " + err.message, "error");
      this._showInbox();
    }
  }

  _showRead() {
    this._view = "read";
    const m = this._current;
    const body = this.querySelector("#um-body");

    body.innerHTML = `
      <div class="um-read">
        <button class="um-back-btn" id="um-btn-back">
          ${hi("chevron-left", 14)} Volver
        </button>
        <div class="um-read-header">
          <div class="um-read-subject">${escapeHtml(m.subject)}</div>
          <div class="um-read-meta">
            <span class="um-read-from">${escapeHtml(m.from)}</span>
            <span class="um-read-date">${escapeHtml(formatDateFull(m.date))}</span>
          </div>
          <div class="um-read-to">Para: ${escapeHtml(m.to)}</div>
        </div>
        <div class="um-read-body">${sanitize(m.body || m.snippet)}</div>
        <div class="um-read-actions">
          <button class="um-btn-reply" id="um-btn-reply">
            ${hi("arrow-right", 14)} Responder
          </button>
        </div>
      </div>`;

    this.querySelector("#um-btn-back")?.addEventListener("click", () =>
      this._showInbox(),
    );
    this.querySelector("#um-btn-reply")?.addEventListener("click", () => {
      this._composeMode = "reply";
      this._replyTo = {
        id: m.id,
        threadId: m.threadId, // ← garantizado por parseMessage
        subject: m.subject,
        from: m.from,
      };
      this._showCompose();
    });
  }

  // ─── Compose ──────────────────────────────────────────────────────────────
  _showCompose() {
    this._view = "compose";
    const isReply = this._composeMode === "reply";
    const body = this.querySelector("#um-body");

    body.innerHTML = `
      <div class="um-compose">
        <button class="um-back-btn" id="um-btn-back-compose">
          ${hi("chevron-left", 14)} ${isReply ? "Cancelar" : "Volver"}
        </button>
        <div class="um-compose-title">
          ${
            isReply
              ? `Responder a <em>${escapeHtml(extractName(this._replyTo?.from))}</em>`
              : "Nuevo correo"
          }
        </div>

        ${
          !isReply
            ? `
          <div class="um-field-group">
            <label class="um-label" for="um-to">Para</label>
            <input class="um-input" id="um-to" type="email" placeholder="correo@ejemplo.com">
          </div>
          <div class="um-field-group">
            <label class="um-label" for="um-subject">Asunto</label>
            <input class="um-input" id="um-subject" type="text" placeholder="Asunto...">
          </div>
        `
            : `
          <div class="um-reply-info">
            <strong>Asunto:</strong> Re: ${escapeHtml(this._replyTo?.subject || "")}
          </div>
        `
        }

        <div class="um-field-group um-field-group--grow">
          <label class="um-label" for="um-body-text">Mensaje</label>
          <textarea class="um-textarea" id="um-body-text"
                    placeholder="Escribe tu mensaje..."></textarea>
        </div>

        <div class="um-compose-actions">
          <button class="um-btn-send" id="um-btn-send">
            ${hi("arrow-right", 14)} Enviar
          </button>
        </div>
      </div>`;

    this.querySelector("#um-btn-back-compose")?.addEventListener(
      "click",
      () => {
        isReply && this._current ? this._showRead() : this._showInbox();
      },
    );
    this.querySelector("#um-btn-send")?.addEventListener("click", () => {
      isReply ? this._sendReply() : this._sendNew();
    });
  }

  // ─── Enviar ───────────────────────────────────────────────────────────────
  async _sendReply() {
    const bodyText = this.querySelector("#um-body-text")?.value?.trim();
    if (!bodyText) {
      this._showToast("Escribe un mensaje", "error");
      return;
    }

    this._setSendLoading(true);
    try {
      const email = makeEmail({
        to: this._replyTo.from,
        subject: `Re: ${this._replyTo.subject}`,
        body: bodyText,
        threadId: this._replyTo.threadId,
      });
      await gmailFetch("/messages/send", {
        method: "POST",
        body: JSON.stringify(email),
      });
      this._showToast("Respuesta enviada ✓", "success");
      this._showInbox();
    } catch (err) {
      this._showToast("Error al enviar: " + err.message, "error");
      this._setSendLoading(false);
    }
  }

  async _sendNew() {
    const to = this.querySelector("#um-to")?.value?.trim();
    const subject = this.querySelector("#um-subject")?.value?.trim();
    const bodyText = this.querySelector("#um-body-text")?.value?.trim();

    if (!to || !subject || !bodyText) {
      this._showToast("Completa todos los campos", "error");
      return;
    }

    this._setSendLoading(true);
    try {
      const email = makeEmail({ to, subject, body: bodyText });
      await gmailFetch("/messages/send", {
        method: "POST",
        body: JSON.stringify(email),
      });
      this._showToast("Correo enviado ✓", "success");
      this._showInbox();
    } catch (err) {
      this._showToast("Error al enviar: " + err.message, "error");
      this._setSendLoading(false);
    }
  }

  // ─── UI helpers ───────────────────────────────────────────────────────────
  _setLoading() {
    this.querySelector("#um-body").innerHTML = `
      <div class="um-loading">
        <div class="um-spinner"></div>
        <p>Cargando...</p>
      </div>`;
  }

  _setEmpty(msg = "Sin correos") {
    this.querySelector("#um-body").innerHTML = `
      <div class="um-empty">${hi("mail", 36)}<p>${escapeHtml(msg)}</p></div>`;
  }

  _setSendLoading(state) {
    const btn = this.querySelector("#um-btn-send");
    if (!btn) return;
    btn.disabled = state;
    btn.textContent = state ? "Enviando..." : "Enviar";
  }

  _showToast(msg, type = "success") {
    const t = this.querySelector("#um-toast");
    if (!t) return;
    t.textContent = msg;
    t.className = `um-toast um-toast--${type} um-toast--visible`;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(
      () => t.classList.remove("um-toast--visible"),
      3000,
    );
  }

  _updateBadge() {
    const unread = this._inbox.filter((m) => m.unread).length;
    const count = unread > 9 ? "9+" : String(unread);

    const badge = document.getElementById("mail-badge");
    if (badge) {
      badge.hidden = unread === 0;
      badge.textContent = count;
    }

    const mbnBadge = document.getElementById("mbn-mail-badge");
    if (mbnBadge) {
      mbnBadge.style.display = unread === 0 ? "none" : "flex";
      mbnBadge.textContent = count;
    }
  }
}

customElements.define("uveg-mail", UvegMail);
