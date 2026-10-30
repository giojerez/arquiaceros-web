/* =====================================================================
   Arquiaceros — interacciones generales
   ===================================================================== */
(function () {
  const WA_NUMBER = '573183696948';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- utilidades compartidas (las usa también cotizador.js) ----------
  const toastEl = document.getElementById('toast');
  let toastTimer;
  window.ARQ = {
    openWA(text) {
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
    }
  };

  // ---------- preloader ----------
  const loader = document.getElementById('loader');
  document.body.classList.add('is-loading');
  const started = performance.now();
  let closed = false;
  function closeLoader() {
    if (closed) return;
    closed = true;
    // Deja ver la animación del logo al menos 1.8 s, sin bloquear más de lo necesario.
    const wait = reduced ? 0 : Math.max(0, 1800 - (performance.now() - started));
    setTimeout(() => {
      loader.classList.add('is-out');
      document.body.classList.remove('is-loading');
      startReveals();
      setTimeout(() => loader.classList.add('is-done'), 1300);
    }, wait);
  }
  if (document.readyState === 'complete') closeLoader();
  else window.addEventListener('load', closeLoader);
  setTimeout(closeLoader, 3200); // tope por si alguna imagen tarda

  // ---------- header + menú ----------
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 30);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
  });

  // ---------- aparición al hacer scroll ----------
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      // pequeño escalonado entre hermanos
      const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 80 + 'ms';
      el.classList.add('is-in');
      revealIO.unobserve(el);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  // Arranca cuando sale el preloader, para que el hero entre animado.
  function startReveals() { document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el)); }

  // ---------- servicios → WhatsApp ----------
  // Enlace real (no depende de ventanas emergentes): abre WhatsApp con el servicio.
  document.querySelectorAll('[data-wa-service]').forEach(a => {
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hola Arquiaceros, quiero cotizar ${a.dataset.waService}. ¿Me pueden asesorar?`)}`;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // ---------- formulario de constructores ----------
  const obra = document.getElementById('obra-form');
  obra.addEventListener('submit', e => {
    e.preventDefault();
    const empresa = document.getElementById('o-empresa');
    if (!empresa.value.trim()) {
      empresa.parentElement.classList.add('is-error');
      empresa.focus();
      window.ARQ.toast('Escribe el nombre de la constructora o el tuyo.');
      return;
    }
    empresa.parentElement.classList.remove('is-error');
    const v = id => document.getElementById(id).value.trim();
    const lineas = ['Hola Arquiaceros, soy constructor y tengo una obra:', '', `Constructora / nombre: ${v('o-empresa')}`];
    if (v('o-obra')) lineas.push(`Obra: ${v('o-obra')}`);
    lineas.push(`Productos: ${v('o-tipo')}`);
    if (v('o-cant')) lineas.push(`Cantidad aproximada: ${v('o-cant')}`);
    lineas.push('', 'Quisiera una cotización al por mayor.');
    window.ARQ.openWA(lineas.join('\n'));
  });

  // ---------- carrusel de reels de Instagram (movimiento infinito) ----------
  const REELS = [
    'DdX6VSkB04r', 'DdX6Cf3tw9Y', 'DdX5vhmNEeH', 'C_oHo0apKIL', 'C_cLieJNV3R', 'C-hCxsbNb_7',
    'C7kF_GKAJsB', 'C7RwkgRIamz', 'Cwq16pbNF3l', 'Ct6jVt_gmwK', 'CEUHL22AZ9n'
  ];
  const SPEED = window.innerWidth < 600 ? 55 : 75; // px por segundo
  const track = document.getElementById('reels-track');
  const dots = document.getElementById('reels-dots');
  // Dos copias seguidas: al terminar la primera se salta al inicio sin que se note.
  const card = (id, i) => `
    <article class="reel" data-id="${id}" data-i="${i}">
      <div class="reel__inner">
        <div class="reel__ph"><img src="img/logo-mark.webp" alt="" width="90" height="68" loading="lazy"><span>Cargando proyecto ${i + 1}…</span></div>
      </div>
    </article>`;
  track.innerHTML = REELS.map(card).join('') + REELS.map(card).join('');
  dots.innerHTML = REELS.map((_, i) => `<button type="button" aria-label="Ir al proyecto ${i + 1}"></button>`).join('');
  const cards = [...track.children];
  const n = REELS.length;
  const setWidth = () => cards[n].offsetLeft - cards[0].offsetLeft;

  // Los iframes solo se crean cuando la tarjeta se acerca a la vista (carga rápida).
  function mountReel(c) {
    if (c.dataset.mounted) return;
    c.dataset.mounted = '1';
    const f = document.createElement('iframe');
    f.src = `https://www.instagram.com/p/${c.dataset.id}/embed/`;
    f.title = 'Proyecto de Arquiaceros en Instagram';
    f.loading = 'lazy';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.setAttribute('scrolling', 'no');
    f.addEventListener('load', () => { const ph = c.querySelector('.reel__ph'); if (ph) ph.remove(); });
    c.querySelector('.reel__inner').appendChild(f);
  }
  const reelIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { mountReel(en.target); reelIO.unobserve(en.target); } });
  }, { root: track, rootMargin: '0px 500px' });

  // efecto coverflow: escala y giro según la distancia al centro
  let current = 0;
  function coverflow() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestD = Infinity;
    cards.forEach((c, i) => {
      const d = (c.offsetLeft + c.offsetWidth / 2 - mid) / c.offsetWidth;
      const ad = Math.min(Math.abs(d), 2);
      c.style.setProperty('--s', (1 - ad * .12).toFixed(3));
      c.style.setProperty('--o', (1 - ad * .4).toFixed(3));
      c.style.setProperty('--ry', (Math.max(-1, Math.min(1, d)) * -14).toFixed(1) + 'deg');
      if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
    });
    current = best;
    cards.forEach((c, i) => c.classList.toggle('is-center', i === best));
    [...dots.children].forEach((b, i) => b.classList.toggle('is-active', i === best % n));
  }

  // Mantiene la posición dentro de la primera copia (bucle sin fin en ambos sentidos).
  let pos = 0;
  function wrap() {
    const w = setWidth();
    if (track.scrollLeft >= w) track.scrollLeft -= w;
    else if (track.scrollLeft <= 0) track.scrollLeft += w;
  }
  track.addEventListener('scroll', () => { wrap(); coverflow(); }, { passive: true });
  window.addEventListener('resize', coverflow);

  // Movimiento continuo; se detiene mientras el usuario interactúa.
  let holdUntil = 0, hovering = false, visible = false, last = 0;
  const hold = ms => { holdUntil = performance.now() + ms; };
  function tick(now) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    if (visible && !hovering && !document.hidden && now > holdUntil) {
      // si el usuario lo movió (o hubo salto de bucle), continúa desde ahí
      if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;
      pos += SPEED * dt / 1000;
      if (pos >= setWidth()) pos -= setWidth();
      track.scrollLeft = pos;
    } else {
      pos = track.scrollLeft;
    }
    requestAnimationFrame(tick);
  }

  const wrapEl = document.getElementById('reels');
  wrapEl.addEventListener('mouseenter', () => { hovering = true; });
  wrapEl.addEventListener('mouseleave', () => { hovering = false; });
  ['pointerdown', 'wheel', 'touchstart'].forEach(ev => track.addEventListener(ev, () => hold(3500), { passive: true }));
  // Si el usuario reproduce un reel (el foco entra al iframe), se pausa.
  window.addEventListener('blur', () => { if (track.contains(document.activeElement)) hold(20000); });

  function goTo(i) {
    const c = cards[i];
    hold(2500);
    track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }
  document.querySelector('.reels__nav--prev').addEventListener('click', () => goTo(Math.max(0, current - 1 + (current === 0 ? n : 0))));
  document.querySelector('.reels__nav--next').addEventListener('click', () => goTo(Math.min(cards.length - 1, current + 1)));
  dots.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) goTo(Math.floor(current / n) * n + [...dots.children].indexOf(b));
  });

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !track.dataset.ready) {
      track.dataset.ready = '1';
      cards.forEach(c => reelIO.observe(c));
    }
  }, { rootMargin: '300px 0px' }).observe(track);

  track.scrollLeft = 1;
  coverflow();
  if (!reduced) requestAnimationFrame(tick);

  // ---------- galerías de fotos: movimiento automático + scroll horizontal ----------
  // Duplica las fotos para un bucle sin fin; el usuario puede desplazarlas con
  // el dedo o el trackpad y el movimiento automático sigue desde donde quedó.
  function galeriaInfinita(track, speed) {
    const originales = [...track.children];
    originales.forEach(fig => {
      const copy = fig.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelector('button').tabIndex = -1;
      track.appendChild(copy);
    });
    const ancho = () => track.children[originales.length].offsetLeft - track.children[0].offsetLeft;
    track.addEventListener('scroll', () => {
      const w = ancho();
      if (track.scrollLeft >= w) track.scrollLeft -= w;
      else if (track.scrollLeft <= 0) track.scrollLeft += w;
    }, { passive: true });

    let pos = 1, last = 0, visible = false, hovering = false, holdUntil = 0;
    track.scrollLeft = 1;
    track.addEventListener('mouseenter', () => { hovering = true; });
    track.addEventListener('mouseleave', () => { hovering = false; });
    ['pointerdown', 'wheel', 'touchstart'].forEach(ev => track.addEventListener(ev, () => { holdUntil = performance.now() + 3000; }, { passive: true }));
    new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(track);

    // Arrastrar con el mouse para desplazar (en táctil y trackpad ya es nativo).
    let dragX = null, dragStart = 0, dragged = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragX = e.clientX; dragStart = track.scrollLeft; dragged = false;
    });
    window.addEventListener('pointermove', e => {
      if (dragX === null) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 5) { dragged = true; track.classList.add('is-dragging'); }
      if (dragged) { track.scrollLeft = dragStart - dx; holdUntil = performance.now() + 3000; }
    });
    window.addEventListener('pointerup', () => { dragX = null; track.classList.remove('is-dragging'); });
    // Si fue un arrastre, no abre la foto.
    track.addEventListener('click', e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    track.addEventListener('dragstart', e => e.preventDefault());
    if (reduced) return;
    (function tick(now) {
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (visible && !hovering && !document.hidden && now > holdUntil) {
        if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;
        pos += speed * dt / 1000;
        if (pos >= ancho()) pos -= ancho();
        track.scrollLeft = pos;
      } else {
        pos = track.scrollLeft;
      }
      requestAnimationFrame(tick);
    })(performance.now());
  }
  galeriaInfinita(document.getElementById('mirrors-track'), 45);
  galeriaInfinita(document.getElementById('obras-track'), 55);

  // Ampliar cualquier foto de las galerías.
  const lb = document.getElementById('lightbox');
  const lbImg = lb.querySelector('img');
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-full]');
    if (!b) return;
    lbImg.src = b.dataset.full;
    lbImg.alt = b.querySelector('img').alt;
    lb.showModal();
  });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox__close')) lb.close(); });

  // ---------- mapa (se carga al pedirlo o al acercarse) ----------
  const map = document.getElementById('map');
  function loadMap() {
    if (map.querySelector('iframe')) return;
    const f = document.createElement('iframe');
    f.src = map.dataset.src;
    f.title = 'Ubicación de Arquiaceros en Bucaramanga';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    map.appendChild(f);
    map.querySelector('.map__load').remove();
  }
  map.querySelector('.map__load').addEventListener('click', loadMap);
  new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { loadMap(); io.disconnect(); } }, { rootMargin: '200px' }).observe(map);

  // ---------- WhatsApp flotante: aviso a los pocos segundos ----------
  const wa = document.querySelector('.wa-float');
  setTimeout(() => { wa.classList.add('is-tip'); setTimeout(() => wa.classList.remove('is-tip'), 5000); }, 6000);

  document.getElementById('year').textContent = new Date().getFullYear();
})();
