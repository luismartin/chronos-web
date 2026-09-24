# Lienzo de diseño (histórico, sólo EN/ES)

> **`docs/index.html` es la fuente de verdad de la portada**, no este directorio. Desde los
> commits c9db544 y 99b0471 se edita a mano y está en los 34 idiomas de la app; el lienzo de
> aquí se quedó en inglés y español. **No implementes nada en `docs/index.html` a partir de
> estos tableros** ni regeneres la página desde ellos: borrarías 32 idiomas de la web pública.
> Por eso `build-index.py` se niega a ejecutarse (su lógica se conserva por si algún día el
> lienzo se reconstruye en los 34 idiomas; sólo entonces se quita el bloqueo).

Fuentes del lienzo «Rediseño web Chronos» publicado como Artifact de Claude:

- `Main.dc.html` — portada de escritorio (1440 px) con parallax, sol que sale con el scroll, tarjetas que aparecen al entrar en pantalla, marquesina y sección nueva de alarmas compartidas.
- `Mobile.dc.html` — la misma portada a 390 px (mismo código; sólo cambia el tamaño de vista previa).
- `DireccionA.dc.html`, `DireccionB.dc.html` — bocetos de dos direcciones alternativas.
- `Legal.dc.html` — política de privacidad (texto real de `chronos-legal`, EN y ES) en el mismo sistema visual; la implementación va en ese repo.
- `canvas.json` — disposición de los tableros; `logo.png` — logo a 128 px.
- `build-index.py` — el generador que convertía `Main.dc.html` en `docs/index.html`. **Desactivado** (ver arriba).

No forman parte del sitio publicado (`docs/`). Sirven como referencia visual; cualquier
cambio de la portada se hace directamente en `docs/index.html`, en los 34 idiomas.
