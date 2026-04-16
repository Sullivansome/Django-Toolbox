(function () {
  const KEY = "toolcenter-theme";

  function apply(theme) {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else if (theme === "light") root.classList.remove("dark");
    else {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefers);
    }
  }

  function initTheme() {
    const stored = localStorage.getItem(KEY);
    apply(stored || "system");
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dark = document.documentElement.classList.contains("dark");
        const next = dark ? "light" : "dark";
        localStorage.setItem(KEY, next);
        apply(next);
      });
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (localStorage.getItem(KEY) === "system" || !localStorage.getItem(KEY)) apply("system");
    });
  }

  function initSearch() {
    const raw = document.getElementById("search-tools-data");
    if (!raw) return;
    let tools = [];
    try {
      tools = JSON.parse(raw.textContent || "[]");
    } catch {
      return;
    }
    const input = document.getElementById("tool-search-input");
    const panel = document.getElementById("tool-search-results");
    const locale = raw.dataset.locale || "en";
    if (!input || !panel) return;

    function hrefFor(slug) {
      return `/${locale}/tools/${slug}/`;
    }

    function render(q) {
      const query = (q || "").trim().toLowerCase();
      const filtered = !query
        ? tools.slice(0, 12)
        : tools.filter((t) => {
            const hay = `${t.name} ${t.description} ${t.slug}`.toLowerCase();
            return hay.includes(query);
          });
      if (!filtered.length) {
        panel.innerHTML =
          '<p class="px-3 py-2 text-sm text-muted-foreground">' +
          (raw.dataset.empty || "No results") +
          "</p>";
        panel.classList.remove("hidden");
        return;
      }
      panel.innerHTML = filtered
        .slice(0, 20)
        .map(
          (t) =>
            `<a href="${hrefFor(t.slug)}" class="block px-3 py-2 text-sm hover:bg-muted rounded-md"><div class="font-medium">${escapeHtml(t.name)}</div><div class="text-xs text-muted-foreground">${escapeHtml(t.description)}</div></a>`,
        )
        .join("");
      panel.classList.remove("hidden");
    }

    function escapeHtml(s) {
      const d = document.createElement("div");
      d.textContent = s;
      return d.innerHTML;
    }

    input.addEventListener("input", () => render(input.value));
    input.addEventListener("focus", () => render(input.value));
    document.addEventListener("click", (e) => {
      if (!panel.contains(e.target) && e.target !== input) panel.classList.add("hidden");
    });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.focus();
        render(input.value);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initSearch();
  });
})();
