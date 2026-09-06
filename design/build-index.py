#!/usr/bin/env python3
"""Genera docs/index.html a partir de design/Main.dc.html (el tablero del lienzo de diseño).

Uso: python3 design/build-index.py
Convierte el tablero en una página estática: quita la lógica del editor, añade las
metaetiquetas SEO, el selector EN/ES real (localStorage + idioma del navegador) y
los efectos de scroll como script normal.
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / 'design' / 'Main.dc.html').read_text(encoding='utf-8')
PLAY_URL = 'https://play.google.com/store/apps/details?id=com.chronos.smartalarm'
# La ficha pública de Play devuelve 404 mientras la app esté en prueba cerrada (roadmap del repo
# de la app, ítem sobre «Prueba cerrada»). Hasta el paso a producción no se enlaza: los botones se
# convierten en la píldora «Muy pronto en Google Play». Cambiar a True al publicar.
PLAY_LIVE = False

css = re.search(r'<helmet>.*?<style>(.*?)</style>', src, re.S).group(1)
css = css.replace('.page[data-lang="es"] [data-l="en"], .page[data-lang="en"] [data-l="es"]',
                  'html[data-lang="es"] [data-l="en"], html[data-lang="en"] [data-l="es"]')
css += '    section[id] { scroll-margin-top: 68px; }\n'

body = src.split('</helmet>')[1].split('</x-dc>')[0]
body = body.replace(' data-lang="{{lang}}"', '')
body = body.replace('style="--accent: {{accent}}; ', 'style="')
body = body.replace('<button type="button" class="{{enClass}}" onClick="{{setEn}}">EN</button>',
                    '<button type="button" id="btn-en" onclick="setLang(\'en\')">EN</button>')
body = body.replace('<button type="button" class="{{esClass}}" onClick="{{setEs}}">ES</button>',
                    '<button type="button" id="btn-es" onclick="setLang(\'es\')">ES</button>')
body = body.replace('src="logo.png"', 'src="assets/logo.png"')
if PLAY_LIVE:
    body = body.replace('href="[ENLACE DE GOOGLE PLAY]"', 'href="%s"' % PLAY_URL)
else:
    SOON = ('<span class="pulse" aria-hidden="true"></span><span data-l="es">Muy pronto en Google Play</span>'
            '<span data-l="en">Coming soon to Google Play</span>')
    def soon(m):
        cls = m.group(1)
        small = ' btn-sm' if 'btn-sm' in cls else ''
        return '<span class="btn btn-soon%s"%s>%s</span>' % (small, m.group(2), SOON)
    body, n = re.subn(r'<a class="btn ([^"]*)" href="\[ENLACE DE GOOGLE PLAY\]"((?: style="[^"]*")?)>.*?</a>', soon, body, flags=re.S)
    assert n == 6, n
    css += '    .btn-soon { background: var(--card); color: var(--text); cursor: default; gap: 9px; }\n    .btn-soon:hover { transform: none; }\n'
body = body.replace('<a class="btn btn-primary" href="#"><span data-l="es">Abrir en Chronos</span><span data-l="en">Open in Chronos</span></a>',
                    '<span class="btn btn-primary" aria-hidden="true"><span data-l="es">Abrir en Chronos</span><span data-l="en">Open in Chronos</span></span>')
assert '{{' not in body and '[PRECIO]' not in body and 'ENLACE' not in body, 'quedan marcadores'

head = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chronos — Smart Alarm Clock</title>
<meta name="description" content="Alarms that skip holidays, ring at sunrise, and make sure you actually wake up. No account needed, no ads, no tracking by default.">
<meta name="theme-color" content="#0b0912">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="canonical" href="https://chronosintelligentalarm.com/">
<meta property="og:site_name" content="Chronos">
<meta property="og:type" content="website">
<meta property="og:url" content="https://chronosintelligentalarm.com/">
<meta property="og:title" content="Chronos — Smart Alarm Clock">
<meta property="og:description" content="Alarms that skip holidays, ring at sunrise, and make sure you actually wake up. No account needed, no ads, no tracking by default.">
<meta property="og:image" content="https://chronosintelligentalarm.com/assets/social-preview.png">
<meta property="og:image:secure_url" content="https://chronosintelligentalarm.com/assets/social-preview.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="500">
<meta property="og:image:alt" content="Chronos — Smart Alarm Clock">
<meta property="og:locale" content="en_US">
<meta property="og:locale:alternate" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Chronos — Smart Alarm Clock">
<meta name="twitter:description" content="Alarms that skip holidays, ring at sunrise, and make sure you actually wake up. No account needed, no ads, no tracking by default.">
<meta name="twitter:image" content="https://chronosintelligentalarm.com/assets/social-preview.png">
<meta name="twitter:image:alt" content="Chronos — Smart Alarm Clock">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<script>
  /* Idioma antes de pintar, para no mostrar los dos textos un instante. */
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('chronos-lang'); } catch (e) {}
    var lang = saved || (((navigator.language || 'en').toLowerCase().indexOf('es') === 0) ? 'es' : 'en');
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.classList.add('js');
  })();
</script>
<style>''' + css + '''</style>
</head>
<body>
'''

script = '''
<script>
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-es').classList.toggle('active', lang === 'es');
    try { localStorage.setItem('chronos-lang', lang); } catch (e) {}
  }
  setLang(document.documentElement.getAttribute('data-lang') || 'en');

  (function () {
    var doc = document.documentElement;
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var mx = 0, my = 0, raf = 0;

    /* Aparición al entrar en pantalla */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
      /* Red de seguridad: si el observador no llegara a disparar, nada queda oculto. */
      setTimeout(function () { document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); }); }, 2500);
    } else {
      document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
    }

    /* Parallax con scroll y ratón, sol que sale en «Cómo funciona», cabecera al hacer scroll */
    function frame() {
      var scrollable = doc.scrollHeight > window.innerHeight + 4;
      var motion = !reduce && scrollable;
      var y = window.scrollY || doc.scrollTop || 0;
      var vh = window.innerHeight || 1;
      document.querySelectorAll('[data-depth], [data-mouse]').forEach(function (el) {
        if (!motion) { el.style.transform = ''; return; }
        var d = parseFloat(el.getAttribute('data-depth')) || 0;
        var m = parseFloat(el.getAttribute('data-mouse')) || 0;
        var sec = el.closest('section');
        var rel = 0;
        if (sec) { var r = sec.getBoundingClientRect(); rel = (r.top + r.height / 2) - vh / 2; }
        var ty = Math.max(-260, Math.min(260, -rel * d)) + my * m;
        var tx = mx * m;
        el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      });
      var story = document.getElementById('story');
      if (story) {
        var sr = story.getBoundingClientRect();
        var p = (vh * 0.9 - sr.top) / (sr.height * 0.7);
        p = Math.max(0, Math.min(1, p));
        story.style.setProperty('--p', motion ? p.toFixed(3) : '1');
      }
      var top = document.getElementById('top');
      if (top) top.classList.toggle('scrolled', y > 24);
    }
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; frame(); });
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('mousemove', function (ev) {
      mx = ev.clientX / Math.max(1, window.innerWidth) - 0.5;
      my = ev.clientY / Math.max(1, window.innerHeight) - 0.5;
      schedule();
    }, { passive: true });
    document.addEventListener('mousemove', function (ev) {
      var card = ev.target.closest && ev.target.closest('.card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100) + '%');
    }, { passive: true });
    frame();
  })();
</script>
</body>
</html>
'''

out = head + body.strip('\n') + '\n' + script
(ROOT / 'docs' / 'index.html').write_text(out, encoding='utf-8')
print('docs/index.html:', len(out), 'bytes')
