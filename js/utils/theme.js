/**
 * utils/theme.js
 * ─────────────────────────────────────────────────────────────
 * Maneja el toggle de dark/light mode.
 *
 * - Usa data-bs-theme en <html> para sincronizar Bootstrap
 *   y nuestros estilos custom con un solo atributo.
 * - Persiste la preferencia en localStorage.
 * - Respeta prefers-color-scheme del sistema operativo
 *   como valor inicial si el usuario no ha elegido aún.
 * ─────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = "uveg-theme";
const DARK = "dark";
const LIGHT = "light";

/**
 * Lee la preferencia guardada o detecta la del sistema.
 * @returns {'dark' | 'light'}
 */
function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === DARK || saved === LIGHT) return saved;

  // Sin preferencia guardada → respetar el sistema operativo
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK
    : LIGHT;
}

/**
 * Aplica el tema al documento.
 * Un solo atributo data-bs-theme controla Bootstrap + estilos custom.
 * @param {'dark' | 'light'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

/**
 * Guarda la preferencia del usuario en localStorage.
 * @param {'dark' | 'light'} theme
 */
function persistTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Devuelve el tema activo actual.
 * @returns {'dark' | 'light'}
 */
function getCurrentTheme() {
  return document.documentElement.getAttribute("data-bs-theme") || LIGHT;
}

/**
 * Alterna entre dark y light mode.
 * Llama a este función desde el botón del topbar.
 */
function toggleTheme() {
  const next = getCurrentTheme() === DARK ? LIGHT : DARK;
  applyTheme(next);
  persistTheme(next);

  // Dispara evento custom para que los componentes puedan reaccionar
  window.dispatchEvent(
    new CustomEvent("uveg:themechange", {
      detail: { theme: next },
    }),
  );
}

/**
 * Inicializa el tema al cargar la página.
 * Debe llamarse lo antes posible para evitar flash de tema incorrecto.
 */
function initTheme() {
  applyTheme(getInitialTheme());
}

export { initTheme, toggleTheme, getCurrentTheme };
