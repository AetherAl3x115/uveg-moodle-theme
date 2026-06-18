# uveg-moodle-theme

Rediseño de la interfaz de la plataforma de aprendizaje UVEG Moodle. Experiencia moderna con branding institucional propio, construida en vanilla HTML/CSS/JS sin bundler.

---

## Stack

| Capa | Tecnología |
|---|---|
| Markup | HTML5 semántico, Light DOM |
| Estilos | CSS custom properties, Bootstrap 5.3 (utilidades y grid) |
| Componentes | Web Components nativos (`customElements.define`) |
| Íconos | `icons.js` — registro centralizado, sin SVG inline |
| Módulos | ES Modules (`type="module"`), sin bundler |
| Deploy | Netlify (`uveg-moodle-theme.netlify.app`) |
| Instancia real | `avalicmod19d.uveg.edu.mx` |

---

## Estructura del proyecto

```
uveg-moodle-theme/
├── index.html                  # Entrada única
├── assets/
│   └── css/
│       ├── variables.css       # Fuente única de verdad — tokens de diseño
│       ├── main.css            # Solo @imports en orden correcto
│       ├── layout.css          # Shell, topbar, sidebar, center, rpanel
│       ├── content.css         # Secciones, cards grid, banner, header
│       ├── dark-mode.css       # Re-mapeo de tokens + excepciones Bootstrap
│       └── responsive.css      # Media queries — breakpoints Bootstrap 5
├── js/
│   └── page.js                 # Orquestador: registra componentes, inyecta tokens de sección
├── components/
│   ├── uveg-sidebar/
│   ├── uveg-topbar/
│   ├── uveg-card/
│   ├── uveg-tabs/
│   ├── uveg-notes/
│   ├── uveg-mail/
│   ├── uveg-glosario/
│   ├── uveg-progress/
│   ├── uveg-sesiones-view/
│   ├── uveg-reto-view/
│   ├── uveg-scorm-view/
│   ├── uveg-scorm-drawer/
│   ├── uveg-lesson-view/
│   └── uveg-presentacion/
│       ├── uveg-pres-alcances/
│       ├── uveg-pres-esquema/
│       ├── uveg-pres-metodologia/
│       ├── uveg-pres-evaluacion/
│       └── uveg-pres-cronograma/
└── icons.js                    # Registro único de íconos
```

---

## Sistema de tokens — 3 niveles

Todos los colores viven en `variables.css`. Cero hardcodes en ningún otro archivo.

### Nivel 1 — Primitivos
Valores raw. Solo referenciados desde Nivel 2 y 3. Nunca usados directamente en componentes.

### Nivel 2 — Semánticos globales
Reutilizables en cualquier componente. Incluye tokens de rol (`--color-surface`, `--color-accent`) y estilísticos compartidos (`--color-tint-bg`, `--color-tint-border`).

### Nivel 3 — Feature scoped
Dueño único: un componente o contexto específico. No reutilizar fuera de su dueño.

**Regla de promoción:** si un token Nivel 3 se reutiliza en ≥2 componentes distintos → migrar a Nivel 2.  
**Regla de degradación:** si un token Nivel 2 deja de ser reutilizado → puede degradarse a Nivel 3 (solo con revisión manual).  
Nivel 2 nunca duplica un Nivel 3 existente. Nivel 3 puede copiar valor de Nivel 2, nunca al revés.

---

## Reglas de arquitectura — NO negociables

| # | Regla |
|---|---|
| ARCH 1 | Cero hardcodes de color en cualquier CSS — todos van a `variables.css` |
| ARCH 2 | Spacing y sizing se permiten sin tokenizar |
| ARCH 3 | Si un componente usa tokens dinámicos por instancia, es dueño de todos sus estados incluyendo dark — `dark-mode.css` no toca esas clases |
| ARCH 4 | Si un componente usa exclusivamente tokens estáticos de `variables.css`, NO necesita overrides en `dark-mode.css` — el re-mapeo de tokens en `:root` es suficiente |
| ARCH 5 | `dark-mode.css` objetivo final = solo bloque de tokens + excepciones Bootstrap reales + icon swap |
| ARCH 6 | No documentar deuda técnica — resolverla ahora. Código y soluciones escalables senior, sin parches |
| ARCH 7 | `str_replace` puntuales siempre. Nunca reescribir archivo completo salvo que se pida explícitamente |
| ARCH 8 | Íconos SOLO de `icons.js` — nunca SVG inline para iconografía |
| ARCH 10 | Cuando hay cambios en múltiples archivos y HTML complejos, reescribir bloque completo — no `str_replace` parciales encadenados |

### Regla JS
Hardcodes de color en JS se leen con:
```js
getComputedStyle(document.documentElement).getPropertyValue('--token')
```
Nunca literales de color en JavaScript.

---

## Dark mode

Activado con `data-bs-theme="dark"` en `<html>`. Estrategia dual:

- **Tokens estáticos:** el bloque `:root[data-bs-theme="dark"]` en `dark-mode.css` re-mapea los tokens Nivel 2. Los componentes que solo usan tokens estáticos se adaptan automáticamente sin overrides propios.
- **Tokens dinámicos por instancia** (`--pres-color`, `--pres-bg`, etc.): el componente es dueño de su dark mode inline. `dark-mode.css` no toca esas clases.

`dark-mode.css` contiene exclusivamente:
1. Bloque de re-mapeo de tokens `:root`
2. Excepciones Bootstrap reales
3. Icon swap (sol/luna)

---

## Tokens de sección — inyección dinámica

`page.js` inyecta tokens CSS por sección en `#pres-content`:

```js
// Ejemplo — sección Alcances
presContent.style.setProperty('--pres-color', '#2662eb');
presContent.style.setProperty('--pres-bg', '#eef2ff');
```

Cada componente de presentación consume `--pres-color` y `--pres-bg` como fallback de sus tokens de acento. Esto permite reutilizar los mismos componentes con diferente identidad visual por sección.

---

## Componentes — referencia rápida

| Componente | CSS dueño | Dark mode |
|---|---|---|
| `uveg-sidebar` | `uveg-sidebar.css` | tokens estáticos — automático |
| `uveg-topbar` | `uveg-topbar.css` | overrides en `dark-mode.css` |
| `uveg-card` | `uveg-card.css` | inline en archivo |
| `uveg-tabs` | `uveg-tabs.css` | tokens estáticos — automático |
| `uveg-notes` | `uveg-notes.css` | inline en archivo |
| `uveg-mail` | `uveg-mail.css` | inline en archivo |
| `uveg-glosario` | `uveg-glosario.css` | inline en archivo |
| `uveg-progress` | `uveg-progress.css` | overrides en `dark-mode.css` |
| `uveg-sesiones-view` | `uveg-sesiones-view.css` | inline en archivo |
| `uveg-reto-view` | `uveg-reto-view.css` | inline en archivo |
| `uveg-scorm-view` | `uveg-scorm-view.css` | inline en archivo |
| `uveg-scorm-drawer` | `uveg-scorm-drawer.css` | inline en archivo |
| `uveg-lesson-view` | `uveg-lesson-view.css` | inline en archivo |
| `uveg-pres-*` | `uveg-pres-*.css` | inline en archivo |

---

## Bugs conocidos

| ID | Descripción | Archivo |
|---|---|---|
| Bug B | Pill score reto muestra `-- PTS` | `uveg-card.js` |
| Bug C | `.sec-title` requiere `!important` (colisión Bootstrap) | `content.css` |
| Bug D | `card-id` duplicado en Lección 6 | `index.html` |
| — | `TYPE_CONFIG` cronograma sin tipo `ejercicio` — chips sin color | `page.js` / `uveg-pres-cronograma.css` |

---

## Pendientes técnicos post-entrega

- Plugin PHP Moodle para integración real
- SCORM real (reemplazar `srcdoc` por `src` apuntando al paquete)
- BigBlueButton real
- URLs reales en instrucciones de actividades
- Extraer clases `sub-act-*` a `uveg-subact.css`
- Extraer clases `reto-*` a `uveg-reto.css`

---

## Deploy

```bash
# No hay build step — deploy directo en Netlify
# Cualquier push a main despliega automáticamente
```

El proyecto no usa bundler, transpilador ni preprocesador. Lo que ves en el repo es exactamente lo que corre en producción.
