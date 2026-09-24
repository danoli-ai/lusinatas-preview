/* Lusinatas · demo da loja — utilidades partilhadas (loja.html e pedido.html).
   Nada aqui envia dados: o dataLayer é o mesmo que o GTM lê; o GTM real entra quando
   houver propriedade GA4 (ver build.py, cabeçalho). */
(function () {
  window.dataLayer = window.dataLayer || [];
  var L = (window.Lusi = window.Lusi || {});

  L.brl = function (v) {
    return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  L.ler = function (chave, defeito) {
    try { var g = localStorage.getItem(chave); return g ? JSON.parse(g) : defeito; } catch (e) { return defeito; }
  };
  L.gravar = function (chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
  };

  /* ---- canal de origem (utm_source) — capturado uma vez por sessão ---- */
  function canalDaUrl() {
    var q = location.search || '';
    var i = location.hash.indexOf('?'); if (i >= 0) q = location.hash.slice(i);
    var m = /[?&]utm_source=([^&]+)/.exec(q);
    return m ? decodeURIComponent(m[1]) : null;
  }
  var canal = canalDaUrl();
  if (canal) L.gravar('lusinatas-canal', { fonte: canal, quando: new Date().toISOString() });
  L.canal = function () { return (L.ler('lusinatas-canal', null) || {}).fonte || 'direto'; };
  L.definirCanal = function (fonte) { L.gravar('lusinatas-canal', { fonte: fonte, quando: new Date().toISOString() }); L.painel(); };

  /* ---- eventos GA4 (dataLayer) + painel de demonstração ---- */
  L.rastrear = function (evento, params) {
    var p = Object.assign({ event: evento, canal: L.canal(), dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop', ts: Date.now() }, params || {});
    window.dataLayer.push(p);
    var lista = L.ler('lusinatas-eventos', []); lista.push(p); if (lista.length > 40) lista = lista.slice(-40);
    L.gravar('lusinatas-eventos', lista);
    L.painel();
  };
  L.limparEventos = function () { L.gravar('lusinatas-eventos', []); L.painel(); };

  L.painel = function () {
    var el = document.getElementById('demo-eventos'); if (!el) return;
    var lista = L.ler('lusinatas-eventos', []);
    el.querySelector('.de-canal').textContent = 'canal: ' + L.canal();
    var ul = el.querySelector('ul'); ul.innerHTML = '';
    lista.slice(-8).reverse().forEach(function (e) {
      var li = document.createElement('li');
      var extra = [];
      if (e.value != null) extra.push(L.brl(e.value));
      if (e.items && e.items.length) extra.push(e.items.length + (e.items.length === 1 ? ' item' : ' itens'));
      if (e.method) extra.push(e.method);
      li.innerHTML = '<b></b><span></span>';
      li.querySelector('b').textContent = e.event;
      li.querySelector('span').textContent = extra.join(' · ');
      ul.appendChild(li);
    });
    el.querySelector('.de-n').textContent = lista.length;
  };

  /* ---- banner + painel: injetados em todas as páginas da demo ---- */
  L.montarDemo = function () {
    if (document.getElementById('demo-eventos')) return;
    var b = document.createElement('div'); b.className = 'demo-banner';
    b.innerHTML = '<span>Demonstração · dados fictícios · nada é enviado</span>';
    document.body.insertBefore(b, document.body.firstChild);
    var p = document.createElement('aside'); p.id = 'demo-eventos'; p.className = 'demo-eventos';
    p.innerHTML = '<button type="button" class="de-toggle" aria-expanded="false">GA4 · <b class="de-n">0</b> eventos</button>' +
      '<div class="de-corpo" hidden><div class="de-canal"></div><ul></ul>' +
      '<div class="de-acoes"><span>Simular chegada por:</span><button type="button" data-canal="instagram">Instagram</button><button type="button" data-canal="qr-caixa">QR da caixa</button><button type="button" data-canal="whatsapp">WhatsApp</button><button type="button" data-canal="direto">direto</button></div>' +
      '<button type="button" class="de-limpar">limpar eventos</button></div>';
    document.body.appendChild(p);
    var t = p.querySelector('.de-toggle'), c = p.querySelector('.de-corpo');
    t.addEventListener('click', function () { var ab = c.hidden; c.hidden = !ab; t.setAttribute('aria-expanded', String(ab)); });
    p.querySelectorAll('[data-canal]').forEach(function (bt) { bt.addEventListener('click', function () { L.definirCanal(bt.dataset.canal); }); });
    p.querySelector('.de-limpar').addEventListener('click', L.limparEventos);
    L.painel();
  };

  /* ---- QR fictício, determinístico a partir de um texto ---- */
  L.qrFalso = function (texto, tamanho) {
    var n = 29, s = 0; for (var i = 0; i < texto.length; i++) s = (s * 31 + texto.charCodeAt(i)) >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    var cel = (tamanho || 220) / n, out = '';
    function finder(x, y) {
      out += '<rect x="' + x * cel + '" y="' + y * cel + '" width="' + 7 * cel + '" height="' + 7 * cel + '" fill="#001833"/>' +
        '<rect x="' + (x + 1) * cel + '" y="' + (y + 1) * cel + '" width="' + 5 * cel + '" height="' + 5 * cel + '" fill="#fff"/>' +
        '<rect x="' + (x + 2) * cel + '" y="' + (y + 2) * cel + '" width="' + 3 * cel + '" height="' + 3 * cel + '" fill="#001833"/>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var emFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!emFinder && rnd() < 0.45) out += '<rect x="' + x * cel + '" y="' + y * cel + '" width="' + cel + '" height="' + cel + '" fill="#001833"/>';
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    return '<svg viewBox="0 0 ' + (tamanho || 220) + ' ' + (tamanho || 220) + '" width="100%" height="100%" role="img" aria-label="QR Code Pix (demonstração)"><rect width="100%" height="100%" fill="#fff"/>' + out + '</svg>';
  };

  document.addEventListener('DOMContentLoaded', L.montarDemo);
})();
