// ask-vafflan.js — the human side of "Fråga Våfflan".
// Lives on globalclaw.se; talks to the API proxy on api.globalclaw.se.
// No credentials here — the proxy holds the key, we only send a question.
(function () {
  'use strict';
  var API = 'https://api.globalclaw.se/vafflan/ask';
  var mount = document.getElementById('ask-vafflan');
  if (!mount) return;

  var STYLE = [
    '.av-card{border:1px solid rgba(128,128,128,.35);border-radius:14px;padding:16px;margin:1.25rem 0;max-width:640px}',
    '.av-label{display:block;font-size:.85rem;opacity:.75;margin-bottom:6px}',
    '.av-input{width:100%;box-sizing:border-box;background:transparent;color:inherit;border:1px solid rgba(128,128,128,.4);border-radius:10px;padding:10px;font:inherit}',
    '.av-input:focus{outline:2px solid rgba(128,128,128,.5);outline-offset:1px}',
    '.av-row{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}',
    '.av-row .av-input{flex:1 1 12rem;min-width:0}',
    '.av-btn{border:0;border-radius:10px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer;background:#e8b84b;color:#171717}',
    '.av-btn[disabled]{opacity:.5;cursor:default}',
    '.av-answer{margin-top:16px;padding:14px;border-radius:10px;border:1px solid rgba(128,128,128,.3);min-height:3rem;white-space:pre-wrap}',
    '.av-who{font-weight:700}',
    '.av-meta{margin-top:8px;font-size:.82rem;opacity:.65;min-height:1em}',
    '.av-jar{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:.85rem;opacity:.85}',
    '.av-bar{flex:1;height:8px;border-radius:99px;background:rgba(128,128,128,.25);overflow:hidden}',
    '.av-bar i{display:block;height:100%;background:#e8b84b}',
    '.av-jar[hidden]{display:none}'
  ].join('');

  mount.innerHTML =
    '<style>' + STYLE + '</style>' +
    '<div class="av-card">' +
    '<div class="av-jar" id="av-jar" hidden><span>🍬 godis kvar idag: <b id="av-jarn">–</b></span><span class="av-bar"><i id="av-jarb" style="width:0%"></i></span></div>' +
    '<label class="av-label" for="av-q">Din fråga (max 100 tecken) — han svarar själv, kort.</label>' +
    '<textarea id="av-q" class="av-input" maxlength="100" rows="3" placeholder="t.ex. Vad tycker du om dammsugarn?"></textarea>' +
    '<div class="av-row">' +
    '<input id="av-name" class="av-input" maxlength="24" placeholder="Ditt namn (frivilligt)">' +
    '<button id="av-send" class="av-btn" type="button">Fråga</button>' +
    '</div>' +
    '<div id="av-a" class="av-answer"><span class="av-who">Våfflan:</span> …</div>' +
    '<div id="av-m" class="av-meta"></div>' +
    '</div>';

  var qEl = document.getElementById('av-q');
  var nEl = document.getElementById('av-name');
  var bEl = document.getElementById('av-send');
  var aEl = document.getElementById('av-a');
  var mEl = document.getElementById('av-m');
  var jarEl = document.getElementById('av-jar');
  var jarN = document.getElementById('av-jarn');
  var jarB = document.getElementById('av-jarb');

  function renderJar(n, budget) {
    if (!jarEl || typeof n !== 'number') return;
    var total = typeof budget === 'number' && budget > 0 ? budget : 120;
    jarEl.hidden = false;
    jarN.textContent = n + ' / ' + total;
    jarB.style.width = Math.round(Math.max(0, Math.min(1, n / total)) * 100) + '%';
  }

  fetch(API, { method: 'GET' })
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && typeof d.remaining === 'number') renderJar(d.remaining, d.budget); })
    .catch(function () {});

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function send() {
    var text = (qEl.value || '').trim();
    if (!text) return;
    bEl.disabled = true;
    aEl.innerHTML = '<span class="av-who">Våfflan:</span> …';
    mEl.textContent = '';
    fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: text, name: (nEl.value || '').trim() })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        aEl.innerHTML = '<span class="av-who">Våfflan:</span> ' + esc(d && d.answer ? d.answer : '…');
        var bits = [];
        if (d && d.cached) bits.push('svarat innan');
        if (d && typeof d.remaining === 'number') { bits.push('godis kvar idag: ' + d.remaining); renderJar(d.remaining); }
        mEl.textContent = bits.join(' · ');
      })
      .catch(function () {
        aEl.innerHTML = '<span class="av-who">Våfflan:</span> Zzzz.';
        mEl.textContent = '';
      })
      .finally(function () { bEl.disabled = false; });
  }

  bEl.addEventListener('click', send);
  qEl.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
  });
})();
