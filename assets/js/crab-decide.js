(function () {
  // 5 seconds of crab deliberation. This is a sacred amount of time.
  var DELIBERATION_MS = 5000;

  function reducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function navigate(target) {
    if (typeof target !== 'string' || !window.location || !window.location.origin || typeof window.URL !== 'function') return;

    var url;
    try {
      url = new window.URL(target, window.location.origin);
    } catch (error) {
      return;
    }

    // Only navigate to same-origin published posts, and do it via the
    // canonicalized path rather than the raw DOM-fed string.
    if (url.origin !== window.location.origin || url.pathname.indexOf('/posts/') !== 0) return;
    window.location.assign(url.pathname + url.search + url.hash);
  }

  function choose(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function createDeliberation(target) {
    var overlay = document.createElement('div');
    overlay.className = 'crab-deliberation';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Crab deliberation');

    var crab = document.createElement('span');
    crab.className = 'crab-deliberation__crab';
    crab.setAttribute('aria-hidden', 'true');
    crab.textContent = '🦀';

    var message = document.createElement('p');
    message.className = 'crab-deliberation__message';
    message.setAttribute('aria-live', 'polite');
    message.textContent = 'The crab is deliberating…';

    var skip = document.createElement('button');
    skip.className = 'crab-deliberation__skip';
    skip.type = 'button';
    skip.setAttribute('data-crab-skip', '');
    skip.textContent = 'Skip crab deliberation';

    overlay.appendChild(crab);
    overlay.appendChild(message);
    overlay.appendChild(skip);
    document.body.appendChild(overlay);

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () {
        overlay.classList.add('crab-deliberation--active');
      });
    } else {
      overlay.classList.add('crab-deliberation--active');
    }

    return { overlay: overlay, message: message, skip: skip };
  }

  var trigger = document.querySelector('[data-crab-decide]');
  var choicesNode = document.querySelector('[data-crab-decide-posts]');
  if (!trigger || !choicesNode) return;

  var choices;
  var deciding = false;
  try {
    choices = JSON.parse(choicesNode.textContent);
  } catch (error) {
    return;
  }
  if (!Array.isArray(choices) || choices.length === 0) return;

  trigger.addEventListener('click', function (event) {
    if (deciding) return;
    if (event.button && event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();

    var target = choose(choices);
    deciding = true;
    if (reducedMotion()) {
      navigate(target);
      return;
    }

    trigger.setAttribute('aria-disabled', 'true');
    trigger.classList.add('crab-decide__button--deciding');

    var ui = createDeliberation(target);
    var complete = false;
    var timers = [];

    function schedule(callback, delay) {
      timers.push(window.setTimeout(callback, delay));
    }

    function finish() {
      if (complete) return;
      complete = true;
      for (var i = 0; i < timers.length; i += 1) window.clearTimeout(timers[i]);
      ui.overlay.classList.add('crab-deliberation--departing');
      navigate(target);
    }

    ui.skip.addEventListener('click', finish);
    if (typeof ui.skip.focus === 'function') ui.skip.focus();

    schedule(function () {
      ui.message.textContent = 'Reviewing available shells…';
    }, 1100);
    schedule(function () {
      ui.message.textContent = 'Ignoring your obvious choices…';
    }, 2300);
    schedule(function () {
      ui.message.textContent = 'Consulting no one…';
    }, 3500);
    schedule(function () {
      ui.message.textContent = 'Decision finalized.';
    }, 4550);
    schedule(finish, DELIBERATION_MS);
  });
})();
