(function () {
    const playerSelector = '#gb-player';
    const player = document.querySelector(playerSelector);
    if (!player) return;

    const status = document.querySelector('#gb-player-status');
    const setStatus = function (message) {
        if (status) status.textContent = message;
    };

    window.EJS_player = playerSelector;
    window.EJS_core = 'gb';
    window.EJS_gameUrl = '/assets/roms/globalclaw-blog.gb';
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;

    const loader = document.createElement('script');
    loader.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    loader.async = true;
    loader.onerror = function () {
        setStatus('Emulator runtime could not load. Check network access in this browser.');
    };
    document.body.appendChild(loader);

    window.setTimeout(function () {
        const hasRuntime = player.querySelector('iframe, canvas, #game') !== null;
        if (hasRuntime) {
            if (status) status.remove();
            return;
        }
        setStatus('Emulator did not initialize. Open in a regular browser or verify ROM availability.');
    }, 7000);
})();
