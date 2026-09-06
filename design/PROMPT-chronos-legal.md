# Rediseño de legal.chronosintelligentalarm.com (repo `luismartin/chronos-legal`)

Quiero que rediseñes las dos páginas de este repo (`index.html`, la política de privacidad, y `delete-account.html`, la página para eliminar la cuenta) para que sean visualmente coherentes con la web principal de Chronos, que acaba de rediseñarse: https://chronosintelligentalarm.com/ (fuente: repo público `luismartin/chronos-web`, archivo `docs/index.html`).

## Referencias que debes leer antes de tocar nada

1. `luismartin/chronos-web` → `docs/index.html`: la web principal en producción. De ahí salen los tokens, tipografías, cabecera, pie y componentes.
2. `luismartin/chronos-web` → `design/Legal.dc.html`: maqueta ya aprobada de la política de privacidad con este mismo diseño (cabecera, portada con fecha y píldoras de idioma, índice fijo a la izquierda, resumen destacado, tablas como tarjetas, pie). Reprodúcela con fidelidad; el bloque `<style>` y el marcado son la especificación. Ignora el envoltorio `<x-dc>`, `<helmet>` y el `<script data-dc-script>`: son del editor de diseño.
3. `luismartin/chronos-web` → `docs/assets/logo.png`: cópialo a `assets/logo.png` en este repo.

## Sistema visual (valores exactos, no los redondees)

- Colores: fondo `#0b0912`, fondo secundario `#150f24`, tarjeta `#191426`, tarjeta hover `#201933`, borde `#2b2340`, texto `#f4f1fb`, texto secundario `#a89ec3`, acento `#8b6cf0`, acento claro `color-mix(in srgb, #8b6cf0 58%, #fff)`, acento tenue `color-mix(in srgb, #8b6cf0 16%, transparent)`, cálido `#ffb457`.
- Tipografías (Google Fonts, es el único host externo permitido): `Outfit` 600/700/800 para titulares, `Inter` 400–800 para el cuerpo. Fallbacks: `-apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`. IMPORTANTE: la política tiene versiones en chino, japonés y coreano; mantén en el stack `"Hiragino Sans", "Noto Sans CJK SC"` (o equivalentes) para que esos idiomas no caigan en una fuente pobre.
- Radios: tarjetas 14–20 px, píldoras 999 px, botones 14 px. Cabecera fija (sticky) de 68 px con `backdrop-filter: blur(16px)` y fondo `rgba(11,9,18,.66)`, con borde inferior `#2b2340` al hacer scroll.
- Enlaces: `a { color: acento claro }`, `a:hover { color: #fff }`; dentro del texto legal, subrayado con `text-underline-offset: 3px`.
- Sin emojis como iconos: SVG en línea de trazo, 16–24 px. Sin degradados agresivos; el brillo radial morado/ámbar de la portada, sutil, como en `Legal.dc.html`.

## Reglas que no puedes romper

- **El texto legal no se toca.** Ni una palabra, ni el orden de secciones, ni los enlaces externos. La fuente de verdad vive en otro repo (ver README: «copy changes here to republish»); por eso el diseño tiene que aplicarse por CSS y por un envoltorio mínimo, de modo que la próxima vez que se pegue aquí el contenido actualizado no haya que rehacer nada. Concretamente: mantén intactos los bloques por idioma (`<h1 id="en">…`, `<h1 id="es">…`, etc.), sus `<h2>`, listas y tablas. Puedes envolverlos y añadir clases, pero no reescribirlos a mano.
- **Los anclas `#en`, `#es`, `#fr`, `#de`, `#pt`, `#it`, `#zh`, `#ja`, `#ko` deben seguir funcionando** (hay enlaces externos que apuntan a ellos). Si muestras un idioma cada vez, el hash de la URL debe seleccionarlo y el selector de idioma debe actualizar el hash.
- **Los nombres de archivo no cambian:** `index.html` y `delete-account.html` están declarados en Play Console. Tampoco toques `CNAME`.
- Los 9 idiomas se conservan en ambas páginas, con la fila de píldoras de idioma de la maqueta.
- Nada de analítica, trackers ni recursos externos salvo Google Fonts. Todo el CSS y JS en el propio repo (un `legal.css` y un `legal.js` compartidos por las dos páginas está bien).
- Accesible: contraste AA sobre fondo oscuro, foco visible, `prefers-reduced-motion` respetado, funciona sin JavaScript (con JS desactivado se deben ver todos los idiomas apilados, como ahora).

## Lo que quiero ver en la página

- Cabecera igual que la web principal: logo + «Chronos.» (punto en `#ffb457`) enlazando a https://chronosintelligentalarm.com/, enlace «Volver a la web», selector de idioma.
- Portada: kicker «Legal», título grande («Política de privacidad» / «Privacy Policy» según idioma, tomado del `<h1>` existente), fecha de entrada en vigor (el `<p class="muted">` existente) y las píldoras de los 9 idiomas.
- Cuerpo en dos columnas en escritorio: índice fijo a la izquierda generado a partir de los `<h2>` del idioma visible (con numeración en acento y resaltado de la sección activa al hacer scroll) y artículo a la derecha con ancho máximo de 760 px. El primer párrafo del artículo (el resumen) en tarjeta destacada. Tablas como tarjetas con cabecera en mayúsculas pequeñas. En móvil, una sola columna e índice al principio.
- Pie igual que la web principal: logo, enlaces a «Eliminar tu cuenta» (desde la política) o a la política (desde `delete-account.html`), correo `chronosintelligentalarm@gmail.com`, y «© 2026 Luis Martín. Chronos es una app para Android.» / versión inglesa.
- `delete-account.html` con exactamente la misma plantilla.

## Entrega

- Trabaja en una rama, haz commits claros y abre un pull request contra `main` con capturas de escritorio y móvil de ambas páginas (en español e inglés, y una en japonés o chino para comprobar la tipografía).
- Antes de abrir el PR comprueba: que los 9 anclas funcionan, que con JS desactivado se ve todo el texto, que ningún texto legal ha cambiado (haz un diff del texto plano extraído antes y después) y que `delete-account.html` sigue existiendo en la raíz.
