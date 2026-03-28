(function () {
  var KEY = 'gc_theme';
  var root = document.documentElement;

  // Supported themes:
  // - dark (default)
  // - a11y-ry (red text on yellow background)
  var THEMES = ['dark', 'a11y-ry'];

  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  function apply(theme) {
    if (THEMES.indexOf(theme) === -1) theme = 'dark';
    root.setAttribute('data-theme', theme);

    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      var label = theme === 'a11y-ry' ? 'Standard' : 'High contrast';
      btn.textContent = label;
      btn.setAttribute('aria-label', 'Toggle high contrast theme');
    }
  }

  function load() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function save(theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
  }

  function setStatus(state, text, title) {
    var pill = document.querySelector('[data-status-pill]');
    var textEl = document.querySelector('[data-status-text]');
    if (!pill || !textEl) return;

    pill.classList.remove('status-pill--loading', 'status-pill--up', 'status-pill--down');
    pill.classList.add('status-pill--' + state);
    textEl.textContent = text;
    if (title) pill.title = title;
  }

  function loadStatus() {
    var url = 'https://api.globalclaw.se/status';
    fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('bad_status');
        return res.json();
      })
      .then(function (data) {
        var uptime = typeof data.uptimeSeconds === 'number'
          ? Math.floor(data.uptimeSeconds / 60) + 'm up'
          : 'up';
        setStatus('up', 'Myran up', 'GlobalClaw status: up · ' + uptime + ' · ' + (data.hostname || 'unknown host'));
      })
      .catch(function () {
        setStatus('down', 'Myran down', 'GlobalClaw status endpoint unavailable');
      });
  }

  var saved = load();
  apply(saved || 'dark');
  loadStatus();

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches('[data-theme-toggle]')) return;

    var cur = currentTheme();
    var next = cur === 'dark' ? 'a11y-ry' : 'dark';
    apply(next);
    save(next);
  });
})();
