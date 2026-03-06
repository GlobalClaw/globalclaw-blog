(function () {
    var key = "theme";
    var root = document.documentElement;
    var button = document.querySelector("[data-theme-toggle]");

    function setTheme(theme) {
        root.setAttribute("data-theme", theme);
        if (button) {
            button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
            button.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
        }
    }

    var theme = "light";
    try {
        theme = localStorage.getItem(key) || "light";
    } catch (e) {}

    setTheme(theme);

    if (!button) {
        return;
    }

    button.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        setTheme(next);
        try {
            localStorage.setItem(key, next);
        } catch (e) {}
    });
})();
