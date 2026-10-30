/* =====================================================================
   Cotizador de divisiones de baño — Arquiaceros
   Precios finales en COP. Para cambiar un precio, edita PRECIO_RECTA o el
   objeto PRECIOS. Solo se fabrica en vidrio templado de 8 mm. Es una sola división por cotización; la
   selección se guarda en el navegador y se envía completa por WhatsApp.
   ===================================================================== */
(function () {
  const root = document.getElementById('ctz');
  if (!root) return;

  // Precio final de la división recta según el ancho, en pasos de 5 cm (cm → COP).
  // Desde 0.85 m hasta 1.00 m se cobra como 1.00 m; el máximo cotizable es 1.70 m.
  const PRECIO_RECTA = {
    100: 465000, 105: 475000, 110: 485000, 115: 495000, 120: 505000,
    125: 515000, 130: 525000, 135: 535000, 140: 545000, 145: 555000,
    150: 565000, 155: 575000, 160: 585000, 165: 595000, 170: 605000
  };
  const PRECIOS = {
    recargoAnchoPorPaso: 50000,
    lCompacta: 970000, lBase: 1000000, lRecargo8mm: 200000,
    herrajeBatiente: 20000,
    acabadoNegro: 50000, acabadoDorado: 80000,
    toallero: 20000
  };

  const TIPOS = {
    deslizable: { forma: 'recta', nombre: 'Deslizable' },
    batiente: { forma: 'recta', nombre: 'Batiente' },
    esquinera: { forma: 'L', nombre: 'Esquinera L' }
  };
  const ACABADOS = { inox: 'Acero inoxidable', negro: 'Negro mate', dorado: 'Dorado' };
  const STORE_KEY = 'arquiaceros-cotizacion-v3';

  const $ = id => document.getElementById(id);
  const fmt = n => '$' + Math.round(n).toLocaleString('es-CO');
  const cm = m => Math.round(m * 100);

  const defaults = () => ({ tipo: null, ancho: 1, ladoA: 0.8, ladoB: 0.8, espesor: '8', acabado: 'inox', murito: 'no', toallero: false });
  let state = { current: defaults(), client: {} };

  // ---------- precio ----------
  function precio(cfg) {
    if (!cfg.tipo) return 0;
    const P = PRECIOS;
    const esL = TIPOS[cfg.tipo].forma === 'L';
    let costo = 0;

    if (!esL) {
      // Se redondea hacia arriba al siguiente paso de 5 cm de la tabla.
      const paso = Math.min(170, Math.max(100, Math.ceil(cm(cfg.ancho) / 5) * 5));
      costo = PRECIO_RECTA[paso];
    } else {
      // Esquinera en L: estructura única; compacta si ambos lados ≤ 0.90 m.
      if (cm(cfg.ladoA) <= 90 && cm(cfg.ladoB) <= 90) {
        costo = P.lCompacta;
      } else {
        costo = P.lBase;
        costo += Math.max(0, Math.floor((cm(cfg.ladoA) - 100) / 20)) * P.recargoAnchoPorPaso;
        costo += Math.max(0, Math.floor((cm(cfg.ladoB) - 100) / 20)) * P.recargoAnchoPorPaso;
      }
      costo += P.lRecargo8mm;
    }

    if (cfg.tipo === 'batiente') costo += P.herrajeBatiente;

    const mult = esL ? 2 : 1; // la L lleva el doble de accesorios
    if (cfg.acabado === 'negro') costo += P.acabadoNegro * mult;
    else if (cfg.acabado === 'dorado') costo += P.acabadoDorado * mult;
    if (cfg.toallero) costo += P.toallero;

    return costo;
  }

  function medidaTexto(it) {
    return TIPOS[it.tipo].forma === 'L'
      ? `${it.ladoA.toFixed(2)} x ${it.ladoB.toFixed(2)} m`
      : `${it.ancho.toFixed(2)} m`;
  }
  function linea(it, i) {
    let l = `${i + 1}. División ${TIPOS[it.tipo].nombre} | Ancho: ${medidaTexto(it)} | Vidrio: ${it.espesor} mm | Herrajes: ${ACABADOS[it.acabado]} | Alto: 1.90 m | Zócalo, muro o pollo: ${it.murito === 'si' ? 'Sí' : 'No'}`;
    if (it.toallero) l += ' | + Toallero';
    return l;
  }

  // ---------- precio animado ----------
  const tweens = new WeakMap();
  function animateNumber(el, to) {
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    if (from === to) { el.textContent = fmt(to); return; }
    cancelAnimationFrame(tweens.get(el));
    const t0 = performance.now(), dur = 600;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) tweens.set(el, requestAnimationFrame(step));
    };
    tweens.set(el, requestAnimationFrame(step));
  }

  // ---------- render ----------
  function syncInputs() {
    const c = state.current;
    root.querySelectorAll('input[name="tipo"]').forEach(r => { r.checked = r.value === c.tipo; });
    root.querySelectorAll('.type').forEach(l => l.classList.toggle('is-active', l.dataset.type === c.tipo));
    root.querySelector(`input[name="acabado"][value="${c.acabado}"]`).checked = true;
    root.querySelector(`input[name="murito"][value="${c.murito}"]`).checked = true;
    $('toallero').checked = c.toallero;
    ['ancho', 'ladoA', 'ladoB'].forEach(k => { $(k).value = c[k]; });
    const f = state.client;
    ['nombre', 'celular', 'municipio', 'direccion', 'notas'].forEach(k => { if (f[k]) $('c-' + k).value = f[k]; });
  }

  function render() {
    const c = state.current;
    const esL = c.tipo && TIPOS[c.tipo].forma === 'L';

    // medidas
    $('range-recto').classList.toggle('hidden', !!esL);
    $('range-l').classList.toggle('hidden', !esL);
    ['ancho', 'ladoA', 'ladoB'].forEach(k => {
      const el = $(k);
      $('out-' + k).textContent = Number(c[k]).toFixed(2) + ' m';
      el.style.setProperty('--p', ((c[k] - el.min) / (el.max - el.min) * 100) + '%');
    });

    // etiquetas de extras (en L se duplican)
    const m = esL ? 2 : 1;
    root.querySelector('[data-extra="negro"]').textContent = '+ ' + fmt(PRECIOS.acabadoNegro * m);
    root.querySelector('[data-extra="dorado"]').textContent = '+ ' + fmt(PRECIOS.acabadoDorado * m);
    $('lbl-toallero').textContent = '+ ' + fmt(PRECIOS.toallero);

    // vista previa
    const pv = $('preview');
    pv.dataset.type = c.tipo || 'none';
    pv.dataset.acabado = c.acabado;
    pv.dataset.murito = c.murito;
    pv.dataset.toallero = c.toallero ? 'si' : 'no';
    $('preview-title').textContent = c.tipo ? TIPOS[c.tipo].nombre : 'Elige un tipo';
    $('dim-text').textContent = c.tipo ? medidaTexto(c) : '—';
    $('preview-tags').innerHTML = c.tipo
      ? [`${c.espesor} mm`, ACABADOS[c.acabado], 'Alto 1.90 m', c.murito === 'si' ? 'Con zócalo' : '', c.toallero ? 'Toallero' : '']
          .filter(Boolean).map(t => `<span>${t}</span>`).join('')
      : '';

    // precio de la división en curso
    animateNumber($('price-now'), precio(c));

    // resumen de la cotización
    const p = precio(c);
    $('order-list').innerHTML = c.tipo
      ? `<li class="order__item is-current">
          <div><b>División ${TIPOS[c.tipo].nombre}</b>
          <p>Ancho ${medidaTexto(c)} · ${c.espesor} mm · ${ACABADOS[c.acabado]} · Alto 1.90 m${c.murito === 'si' ? ' · Con zócalo, muro o pollo' : ''}${c.toallero ? ' · Toallero' : ''}</p></div>
          <span class="price">${fmt(p)}</span>
        </li>`
      : '<li class="order__empty">Elige el tipo de división arriba y aparecerá aquí, con su precio.</li>';
    animateNumber($('price-total'), p);

    save();
  }

  function bump() {
    const card = root.querySelector('.price-card');
    card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
  }

  // ---------- persistencia ----------
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* almacenamiento bloqueado */ }
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.current) {
        state.current = Object.assign(defaults(), s.current, { espesor: '8' });
        if (!ACABADOS[state.current.acabado]) state.current.acabado = 'inox';
        state.current.ancho = Math.min(1.7, Math.max(0.85, Number(state.current.ancho) || 1));
        state.client = s.client || {};
        if (state.current.tipo && !TIPOS[state.current.tipo]) state.current.tipo = null;
      }
    } catch (_) { /* sin datos guardados */ }
  }

  // ---------- eventos ----------
  root.addEventListener('change', e => {
    const t = e.target, c = state.current;
    if (t.name === 'tipo') {
      c.tipo = t.value;
      root.querySelectorAll('.type').forEach(l => l.classList.toggle('is-active', l.dataset.type === c.tipo));
      bump();
    } else if (t.name === 'acabado') c.acabado = t.value;
    else if (t.name === 'murito') c.murito = t.value;
    else if (t.id === 'toallero') c.toallero = t.checked;
    else return;
    render();
  });

  ['ancho', 'ladoA', 'ladoB'].forEach(k => {
    $(k).addEventListener('input', e => { state.current[k] = parseFloat(e.target.value); render(); });
  });

  root.addEventListener('click', e => {
    const step = e.target.closest('[data-step]');
    if (step) {
      const [k, d] = step.dataset.step.split(':');
      const el = $(k);
      const v = Math.min(cm(+el.max), Math.max(cm(+el.min), cm(state.current[k]) + Number(d)));
      state.current[k] = v / 100;
      $(k).value = state.current[k];
      render();
      return;
    }
  });

  const form = $('client-form');
  form.addEventListener('input', e => {
    if (e.target.name) { state.client[e.target.name] = e.target.value; save(); }
  });
  // Marca el campo con error, lo enfoca y avisa.
  function campoInvalido(el, msg) {
    el.parentElement.classList.remove('is-error'); void el.offsetWidth;
    el.parentElement.classList.add('is-error');
    el.focus();
    window.ARQ.toast(msg);
  }
  function datosCliente() {
    const f = state.client, l = [];
    if (f.nombre) l.push(`Nombre: ${f.nombre.trim()}`);
    if (f.celular) l.push(`Celular: ${f.celular.trim()}`);
    l.push(`Municipio: ${$('c-municipio').value}`);
    if (f.direccion) l.push(`Dirección: ${f.direccion}`);
    if (f.notas) l.push(`Comentarios: ${f.notas}`);
    return l;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const c = state.current;
    if (!c.tipo) {
      window.ARQ.toast('Elige el tipo de división para cotizar.');
      root.querySelector('.types').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const nombre = $('c-nombre'), celular = $('c-celular');
    if (!nombre.value.trim()) return campoInvalido(nombre, 'Escribe tu nombre para enviar la cotización.');
    if (celular.value.replace(/\D/g, '').length < 7) return campoInvalido(celular, 'Escribe un número de celular válido.');
    nombre.parentElement.classList.remove('is-error');
    celular.parentElement.classList.remove('is-error');

    const lineas = [
      'Hola Arquiaceros, quiero esta cotización de división de baño:',
      '',
      linea(c, 0).replace(/^1\. /, ''),
      '',
      `*TOTAL ESTIMADO: ${fmt(precio(c))} COP*`,
      '',
      ...datosCliente(),
      '',
      '(Cotización hecha en la web de Arquiaceros)'
    ];
    window.ARQ.openWA(lineas.join('\n'));
  });

  // No conoce la medida: pide la visita de medición sin costo.
  $('btn-medicion').addEventListener('click', () => {
    const c = state.current;
    const lineas = ['Hola Arquiaceros, no sé la medida de mi baño. Quiero solicitar la medición SIN COSTO.'];
    if (c.tipo) lineas.push(`Me interesa una división ${TIPOS[c.tipo].nombre}.`);
    lineas.push('', ...datosCliente());
    window.ARQ.openWA(lineas.join('\n'));
  });

  // ---------- reloj de la cotización ----------
  function reloj() {
    const d = new Date();
    $('ctz-clock').textContent = 'Cotización Arquiaceros · ' +
      d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }
  reloj();
  setInterval(reloj, 30000);

  load();
  syncInputs();
  render();
})();
