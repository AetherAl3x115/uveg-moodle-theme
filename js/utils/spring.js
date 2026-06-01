/**
 * utils/spring.js
 * ─────────────────────────────────────────────────────────────
 * Física de resorte para animaciones fluidas.
 *
 * Todas las animaciones usan requestAnimationFrame manual —
 * sin librerías externas, sin CSS transitions para estos casos.
 *
 * Por qué resorte en lugar de CSS ease/cubic-bezier:
 *   - El resorte responde al estado actual del elemento,
 *     no interrumpe bruscamente si el usuario hace click rápido.
 *   - Las constantes stiffness/damping son físicamente intuitivas
 *     y fáciles de ajustar visualmente.
 *
 * Constantes recomendadas:
 *   - Rápido y firme:  stiffness=0.30, damping=0.60
 *   - Suave y elástico: stiffness=0.18, damping=0.68
 *   - Muy suave:       stiffness=0.12, damping=0.72
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Anima el scale de un elemento con física de resorte.
 * Cancela cualquier animación previa en el mismo elemento.
 *
 * @param {HTMLElement} el        - Elemento a animar
 * @param {number}      from      - Scale inicial (ej. 0.94)
 * @param {number}      to        - Scale destino (ej. 1)
 * @param {number}      stiffness - Rigidez del resorte (default: 0.26)
 * @param {number}      damping   - Amortiguación (default: 0.63)
 */
function springScale(el, from, to, stiffness = 0.26, damping = 0.63) {
  if (!el) return;

  // Cancelar animación previa en este elemento
  if (el._springScaleRaf) cancelAnimationFrame(el._springScaleRaf);

  let velocity = 0;
  let current = from;

  function tick() {
    velocity = (velocity + (to - current) * stiffness) * damping;
    current += velocity;
    el.style.transform = `scale(${current})`;

    if (Math.abs(current - to) > 0.001 || Math.abs(velocity) > 0.001) {
      el._springScaleRaf = requestAnimationFrame(tick);
    } else {
      // Snap al valor final para evitar sub-pixel drift
      el.style.transform = `scale(${to})`;
      el._springScaleRaf = null;
    }
  }

  tick();
}

/**
 * Anima el width de un elemento con física de resorte.
 * Usado para el colapso/expansión del sidebar.
 *
 * @param {HTMLElement} el        - Elemento a animar
 * @param {number}      target    - Width destino en px
 * @param {number}      stiffness - Rigidez del resorte (default: 0.18)
 * @param {number}      damping   - Amortiguación (default: 0.68)
 */
function springWidth(
  el,
  target,
  stiffness = 0.18,
  damping = 0.68,
  onComplete = null,
) {
  if (!el) return;

  if (el._springWidthRaf) cancelAnimationFrame(el._springWidthRaf);

  let velocity = 0;
  let current = parseFloat(el.style.width) || el.offsetWidth;

  function tick() {
    velocity = (velocity + (target - current) * stiffness) * damping;
    current += velocity;
    el.style.width = `${current}px`;

    if (Math.abs(current - target) > 0.2 || Math.abs(velocity) > 0.2) {
      el._springWidthRaf = requestAnimationFrame(tick);
    } else {
      el.style.width = `${target}px`;
      el._springWidthRaf = null;
      if (onComplete) onComplete();
    }
  }

  tick();
}

/**
 * Anima la apertura de un contenedor colapsable (liquid expand).
 * Combina height, scaleY y opacity para efecto orgánico.
 *
 * @param {HTMLElement} wrapper - Contenedor externo (controla height)
 * @param {HTMLElement} inner   - Contenido interno (controla scaleY + opacity)
 */
function liquidOpen(wrapper, inner) {
  if (!wrapper || !inner) return;

  if (wrapper._liquidRaf) cancelAnimationFrame(wrapper._liquidRaf);

  const target = inner.scrollHeight;

  // Estado inicial
  wrapper.style.height = "0px";
  inner.style.transform = "scaleY(0.92)";
  inner.style.opacity = "0";
  inner.style.transformOrigin = "top center";

  let heightVel = 0,
    heightCur = 0;
  let scaleVel = 0,
    scaleCur = 0.92;
  let opacVel = 0,
    opacCur = 0;

  function tick() {
    // Height spring
    heightVel = (heightVel + (target - heightCur) * 0.04) * 0.86;
    heightCur += heightVel;

    // Scale spring
    scaleVel = (scaleVel + (1 - scaleCur) * 0.05) * 0.86;
    scaleCur += scaleVel;

    // Opacity spring
    opacVel = (opacVel + (1 - opacCur) * 0.05) * 0.86;
    opacCur += opacVel;

    wrapper.style.height = `${Math.min(heightCur, target * 1.04)}px`;
    inner.style.transform = `scaleY(${scaleCur})`;
    inner.style.opacity = opacCur;

    const stillMoving =
      Math.abs(heightCur - target) > 0.4 || Math.abs(heightVel) > 0.4;

    if (stillMoving) {
      wrapper._liquidRaf = requestAnimationFrame(tick);
    } else {
      // Snap al estado final
      wrapper.style.height = `${target}px`;
      inner.style.transform = "scaleY(1)";
      inner.style.opacity = "1";
      wrapper._liquidRaf = null;
    }
  }

  tick();
}

/**
 * Anima el cierre de un contenedor colapsable (liquid close).
 *
 * @param {HTMLElement} wrapper - Contenedor externo
 * @param {HTMLElement} inner   - Contenido interno
 */
function liquidClose(wrapper, inner) {
  if (!wrapper || !inner) return;

  if (wrapper._liquidRaf) cancelAnimationFrame(wrapper._liquidRaf);

  let heightVel = 0,
    heightCur = parseFloat(wrapper.style.height) || 0;
  let scaleVel = 0,
    scaleCur = 1;
  let opacVel = 0,
    opacCur = 1;

  function tick() {
    heightVel = (heightVel + (0 - heightCur) * 0.16) * 0.74;
    heightCur += heightVel;

    scaleVel = (scaleVel + (0.7 - scaleCur) * 0.16) * 0.74;
    scaleCur += scaleVel;

    opacVel = (opacVel + (0 - opacCur) * 0.18) * 0.72;
    opacCur += opacVel;

    wrapper.style.height = `${Math.max(heightCur, 0)}px`;
    inner.style.transform = `scaleY(${Math.max(scaleCur, 0.7)})`;
    inner.style.opacity = `${Math.max(opacCur, 0)}`;

    const stillMoving = heightCur > 0.4 || Math.abs(heightVel) > 0.4;

    if (stillMoving) {
      wrapper._liquidRaf = requestAnimationFrame(tick);
    } else {
      wrapper.style.height = "0px";
      inner.style.transform = "scaleY(0.7)";
      inner.style.opacity = "0";
      wrapper._liquidRaf = null;
    }
  }

  tick();
}

/**
 * Crea un efecto ripple en un elemento al hacer click.
 * Usado en tabs y cards de presentación.
 *
 * @param {HTMLElement}   el        - Elemento que recibe el ripple
 * @param {MouseEvent}    event     - Evento del click (para posición)
 * @param {string}        className - Clase CSS del ripple (default: 'ripple')
 * @param {number}        duration  - Duración en ms (default: 500)
 */
function createRipple(el, event, className = "ripple", duration = 500) {
  if (!el || !event) return;

  const ripple = document.createElement("span");
  ripple.className = className;

  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);

  ripple.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    left: ${event.clientX - rect.left - size / 2}px;
    top: ${event.clientY - rect.top - size / 2}px;
  `;

  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), duration);
}

export { springScale, springWidth, liquidOpen, liquidClose, createRipple };
