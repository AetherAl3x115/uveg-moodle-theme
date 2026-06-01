/**
 * components/uveg-scorm-drawer/uveg-scorm-drawer.js
 * ─────────────────────────────────────────────────────────────
 * Web Component <uveg-scorm-drawer>
 *
 * Bottom sheet que contiene el contenido SCORM embebido.
 * Se abre/cierra programáticamente desde main.js al escuchar
 * el evento uveg:openscorm emitido por uveg-card.
 *
 * ── Arquitectura de comunicación ────────────────────────────
 *
 *   uveg-card  →[uveg:openscorm]→  main.js  →  drawer.open()
 *   iframe     →[postMessage]→     drawer   →  drawer.close()
 *
 * El iframe se comunica con el drawer via window.postMessage
 * porque el iframe tiene su propio contexto de window.
 * El mensaje 'uveg:close' desde el iframe dispara el cierre.
 *
 * ── Modos de operación ──────────────────────────────────────
 *
 *   Demo/Netlify:   srcdoc con HTML generado por getScormHTML()
 *   Producción:     src apuntando al paquete SCORM en Moodle
 *                   (cambiar setContent() para usar src en lugar de srcdoc)
 *
 * ── Uso ─────────────────────────────────────────────────────
 *
 *   HTML:
 *     <uveg-scorm-drawer></uveg-scorm-drawer>
 *
 *   JS (desde main.js):
 *     const drawer = document.querySelector('uveg-scorm-drawer');
 *     drawer.open({ title: 'Reto 1', tag: 'UNIDAD 1' });
 *     drawer.close();
 *
 * ── Eventos escuchados ───────────────────────────────────────
 *   uveg:openscorm  → abre el drawer con el contenido indicado
 *
 * ── Eventos emitidos ─────────────────────────────────────────
 *   uveg:scormclose → drawer fue cerrado
 * ─────────────────────────────────────────────────────────────
 */

import { springScale } from "../../js/utils/spring.js";

class UvegScormDrawer extends HTMLElement {
  constructor() {
    super();

    /**
     * Referencia al handler de postMessage para poder
     * removerlo correctamente en disconnectedCallback.
     * @type {Function}
     */
    this._messageHandler = this._onIframeMessage.bind(this);

    /**
     * Referencia al handler de uveg:openscorm.
     * @type {Function}
     */
    this._openHandler = this._onOpenScorm.bind(this);
  }

  /* ── Lifecycle ──────────────────────────────────────────── */

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  disconnectedCallback() {
    // Limpiar listeners globales para evitar memory leaks
    window.removeEventListener("message", this._messageHandler);
    window.removeEventListener("uveg:openscorm", this._openHandler);
  }

  /* ── Render ─────────────────────────────────────────────── */

  _render() {
    this.innerHTML = `
      <!-- Overlay oscuro — click cierra el drawer -->
      <div
        class="scorm-overlay"
        id="scorm-overlay"
        role="presentation"
        aria-hidden="true">
      </div>

      <!-- Drawer principal -->
      <div
        class="scorm-drawer"
        id="scorm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Contenido de actividad"
        aria-hidden="true">

        <!-- Handle táctil (decorativo, sin función drag por ahora) -->
        <div class="scorm-handle" aria-hidden="true"></div>

        <!-- Topbar con gradiente UVEG -->
        <div class="scorm-topbar">
          <div class="scorm-topbar-left">
            <div class="scorm-topbar-icon" aria-hidden="true">
              <i class="ti ti-trophy"></i>
            </div>
            <div>
              <div class="scorm-topbar-tag" id="scorm-tag">ACTIVIDAD</div>
              <div class="scorm-topbar-title" id="scorm-title">Cargando...</div>
            </div>
          </div>

          <!-- Botón cerrar -->
          <button
            class="scorm-close"
            id="scorm-close-btn"
            aria-label="Cerrar actividad">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <!-- iframe SCORM -->
        <iframe
          class="scorm-frame"
          id="scorm-frame"
          src="about:blank"
          title="Contenido de la actividad"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups">
        </iframe>

      </div>
    `;
  }

  /* ── Events ─────────────────────────────────────────────── */

  _bindEvents() {
    // Click en overlay → cerrar
    this.querySelector("#scorm-overlay").addEventListener("click", () =>
      this.close(),
    );

    // Click en botón X → cerrar
    this.querySelector("#scorm-close-btn").addEventListener("click", () => {
      springScale(this.querySelector("#scorm-close-btn"), 0.85, 1);
      this.close();
    });

    // Escape → cerrar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this._isOpen()) this.close();
    });

    // postMessage desde iframe (botón "Iniciar actividad" dentro del SCORM)
    window.addEventListener("message", this._messageHandler);

    // Evento global desde uveg-card
    window.addEventListener("uveg:openscorm", this._openHandler);
  }

  /**
   * Maneja mensajes desde el iframe SCORM.
   * El iframe puede enviar:
   *   'uveg:close'     → cerrar el drawer
   *   'uveg:complete'  → actividad completada (para futuro)
   *
   * @param {MessageEvent} e
   */
  _onIframeMessage(e) {
    // En producción verificar e.origin contra el dominio de Moodle
    if (e.data === "uveg:close" || e.data === "closeScorm") {
      this.close();
    }
  }

  /**
   * Handler del evento global uveg:openscorm.
   * Emitido por uveg-card cuando el alumno hace click en
   * "Ver instrucciones" o "Continuar lección".
   *
   * @param {CustomEvent} e
   * @param {string} e.detail.title    - Título de la actividad
   * @param {string} e.detail.tag      - Tag superior (ej: "UNIDAD 1")
   * @param {string} [e.detail.cardId] - ID de la card origen
   */
  _onOpenScorm(e) {
    const { title = "Actividad", tag = "SCORM" } = e.detail || {};
    this.open({ title, tag });
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Abre el drawer con el contenido indicado.
   *
   * @param {Object} options
   * @param {string} options.title - Título mostrado en el topbar
   * @param {string} options.tag   - Etiqueta superior del topbar
   * @param {string} [options.src] - URL del paquete SCORM (producción)
   *                                 Si no se provee, usa srcdoc demo.
   */
  open({ title = "Actividad", tag = "ACTIVIDAD", src = null } = {}) {
    const overlay = this.querySelector("#scorm-overlay");
    const drawer = this.querySelector("#scorm-drawer");
    const frame = this.querySelector("#scorm-frame");

    // Actualizar topbar
    this.querySelector("#scorm-title").textContent = title;
    this.querySelector("#scorm-tag").textContent = tag.toUpperCase();

    // Cargar contenido en iframe
    if (src) {
      // Producción: URL del paquete SCORM en Moodle
      frame.src = src;
    } else {
      // Demo: HTML generado inline via srcdoc
      frame.srcdoc = this._getScormHTML({ title });
    }

    // Mostrar overlay
    overlay.classList.add("open");

    // Mostrar drawer en siguiente frame para que la transición CSS funcione
    requestAnimationFrame(() => {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
    });

    // Bloquear scroll del body mientras el drawer está abierto
    document.body.style.overflow = "hidden";
  }

  /**
   * Cierra el drawer y limpia el iframe.
   * Espera a que termine la transición CSS antes de limpiar srcdoc
   * para evitar un flash de contenido vacío durante el cierre.
   */
  close() {
    const overlay = this.querySelector("#scorm-overlay");
    const drawer = this.querySelector("#scorm-drawer");

    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");

    // Restaurar scroll del body
    document.body.style.overflow = "";

    // Limpiar iframe tras la transición (400ms = duración del CSS)
    setTimeout(() => {
      const frame = this.querySelector("#scorm-frame");
      if (frame) {
        frame.src = "about:blank";
        frame.srcdoc = "";
      }
    }, 400);

    // Notificar al resto de la app
    this.dispatchEvent(
      new CustomEvent("uveg:scormclose", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Retorna true si el drawer está actualmente abierto.
   * @returns {boolean}
   */
  _isOpen() {
    return (
      this.querySelector("#scorm-drawer")?.classList.contains("open") ?? false
    );
  }

  /* ── SCORM HTML Template ─────────────────────────────────── */

  /**
   * Genera el HTML completo que se inyecta en el iframe via srcdoc.
   *
   * NOTA PARA PRODUCCIÓN:
   *   Este método es solo para el demo en Netlify.
   *   En Moodle, el drawer recibirá una URL real del paquete SCORM
   *   y usará frame.src en lugar de frame.srcdoc.
   *
   * El HTML generado incluye:
   *   - Avisos de la actividad (importante / advertencia)
   *   - Instrucciones paso a paso con línea conectora
   *   - Video embebido de YouTube
   *   - Botón "Iniciar actividad" que cierra el drawer via postMessage
   *
   * @param {Object} options
   * @param {string} options.title - Título de la actividad
   * @returns {string} HTML completo para el srcdoc
   */
  _getScormHTML({ title = "Actividad" } = {}) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f4f6fb;
      min-height: 100vh;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }

    /* ── Avisos ── */
    .aviso {
      border-radius: 14px;
      margin-bottom: 16px;
      overflow: hidden;
      display: flex;
      animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both;
    }
    .aviso:nth-child(2) { animation-delay: .08s; }

    .aviso-left {
      width: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .aviso-body    { flex: 1; padding: 16px; }
    .aviso-tag     { font-size: 10px; font-weight: 700; letter-spacing: .5px; margin-bottom: 6px; text-transform: uppercase; }
    .aviso-text    { font-size: 13px; line-height: 1.65; display: flex; align-items: flex-start; gap: 8px; }
    .aviso-text i  { font-size: 14px; margin-top: 2px; flex-shrink: 0; }
    .aviso-pts     { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 11px; font-weight: 600; }

    /* Variante info (azul) */
    .aviso-info               { background: #EEF2FF; }
    .aviso-info .aviso-left   { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
    .aviso-info .aviso-tag    { color: #4338ca; }
    .aviso-info .aviso-text   { color: #374151; }
    .aviso-info .aviso-pts    { color: #4338ca; }

    /* Variante importante (rojo) */
    .aviso-imp               { background: #FFF1F2; }
    .aviso-imp .aviso-left   { background: linear-gradient(135deg, #e11d48, #f43f5e); }
    .aviso-imp .aviso-tag    { color: #be123c; }
    .aviso-imp .aviso-text   { color: #374151; }

    /* ── Instrucciones ── */
    .instrucciones {
      background: #fff;
      border: .5px solid #e5e7eb;
      border-radius: 14px;
      margin-bottom: 16px;
      overflow: hidden;
      animation: fadeUp .4s .16s cubic-bezier(.4,0,.2,1) both;
    }

    .instr-header {
      background: linear-gradient(to right, #0d55de, #1a2744);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .instr-header i    { font-size: 20px; color: #fff; }
    .instr-header span { font-size: 14px; font-weight: 700; color: #fff; }

    .instr-body { padding: 20px; }

    /* Steps con línea conectora */
    .step {
      display: flex;
      gap: 14px;
      position: relative;
    }

    .step-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(to right, #0d55de, #1a2744);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-line {
      width: 2px;
      flex: 1;
      background: linear-gradient(to bottom, #0d55de22, transparent);
      min-height: 20px;
      margin: 4px 0;
    }

    .step:last-child .step-line { display: none; }

    .step-text {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
      padding-top: 4px;
      padding-bottom: 20px;
    }

    .step:last-child .step-text { padding-bottom: 0; }

    /* ── Video YouTube ── */
    .video-wrap {
      background: #fff;
      border: .5px solid #e5e7eb;
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 16px;
      animation: fadeUp .4s .24s cubic-bezier(.4,0,.2,1) both;
    }

    .video-header {
      background: linear-gradient(to right, #0d55de, #1a2744);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .yt-badge {
      background: #FF0000;
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
    }

    .video-header span { font-size: 12px; color: rgba(255,255,255,.8); }

    /* Aspect ratio 16:9 responsive */
    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
    }

    .video-container iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }

    /* ── Botón iniciar ── */
    .btn-wrap {
      animation: fadeUp .4s .32s cubic-bezier(.4,0,.2,1) both;
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    .btn-iniciar {
      background: linear-gradient(to right, #0d55de, #1a2744);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 12px 28px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity .15s, transform .1s;
    }

    .btn-iniciar:hover  { opacity: .9; transform: scale(1.03); }
    .btn-iniciar:active { transform: scale(.97); }

    /* ── Animación entrada ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Aviso informativo -->
    <div class="aviso aviso-info">
      <div class="aviso-left">
        <i class="ti ti-info-circle" style="font-size:28px;color:#fff"></i>
      </div>
      <div class="aviso-body">
        <div class="aviso-tag">Importante</div>
        <div class="aviso-text">
          <i class="ti ti-check" style="color:#4338ca"></i>
          Diseña un plan estratégico viable para una institución educativa ficticia.
        </div>
        <div class="aviso-pts">
          <i class="ti ti-star" style="color:#4338ca"></i>
          Hasta 15 puntos
        </div>
      </div>
    </div>

    <!-- Aviso importante -->
    <div class="aviso aviso-imp">
      <div class="aviso-left">
        <i class="ti ti-alert-circle" style="font-size:28px;color:#fff"></i>
      </div>
      <div class="aviso-body">
        <div class="aviso-tag">Importante</div>
        <div class="aviso-text">
          <i class="ti ti-check" style="color:#be123c"></i>
          Aplica los marcos de gestión revisados en la Unidad 1.
        </div>
      </div>
    </div>

    <!-- Instrucciones paso a paso -->
    <div class="instrucciones">
      <div class="instr-header">
        <i class="ti ti-file-description"></i>
        <span>Instrucciones</span>
      </div>
      <div class="instr-body">
        <div class="step">
          <div class="step-left">
            <div class="step-num">1</div>
            <div class="step-line"></div>
          </div>
          <div class="step-text">Analiza el contexto institucional usando la metodología FODA.</div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="step-num">2</div>
            <div class="step-line"></div>
          </div>
          <div class="step-text">Define objetivos estratégicos y KPIs medibles.</div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="step-num">3</div>
            <div class="step-line"></div>
          </div>
          <div class="step-text">Elabora el mapa estratégico con herramientas vistas en clase.</div>
        </div>
        <div class="step">
          <div class="step-left">
            <div class="step-num">4</div>
            <div class="step-line"></div>
          </div>
          <div class="step-text">Exporta tu plan en PDF y entrégalo por la plataforma.</div>
        </div>
      </div>
    </div>

    <!-- Video YouTube -->
    <div class="video-wrap">
      <div class="video-header">
        <span class="yt-badge">YouTube</span>
        <span>Contenido embebido</span>
      </div>
      <div class="video-container">
        <iframe
          src="https://www.youtube.com/embed/q5kh1KI9Y2U"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          title="Video de la actividad">
        </iframe>
      </div>
    </div>

    <!-- Botón iniciar actividad -->
    <div class="btn-wrap">
      <button
        class="btn-iniciar"
        onclick="window.parent.postMessage('uveg:close', '*')">
        <i class="ti ti-player-play"></i>
        Iniciar actividad
      </button>
    </div>

  </div>
</body>
</html>
    `.trim();
  }
}

customElements.define("uveg-scorm-drawer", UvegScormDrawer);
