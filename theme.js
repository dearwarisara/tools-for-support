(() => {
  const themeKey = "support-toolkit-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let selectedTheme = null;

  const readSelectedTheme = () => {
    try {
      const saved = localStorage.getItem(themeKey);
      return saved === "dark" || saved === "light" ? saved : null;
    } catch {
      return null;
    }
  };

  const applyTheme = () => {
    const theme = selectedTheme || (systemTheme.matches ? "dark" : "light");
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content", isDark ? "#0f1726" : "#fbfcfe",
    );
    const toggle = document.querySelector("#theme-toggle");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.title = isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด";
      document.querySelector("#theme-label").textContent = isDark ? "โหมดมืด" : "โหมดสว่าง";
    }
  };

  selectedTheme = readSelectedTheme();
  applyTheme();

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    document.querySelector("#theme-toggle")?.addEventListener("click", () => {
      selectedTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(themeKey, selectedTheme);
      } catch {
        // Keep the selection for this session when storage is unavailable.
      }
      applyTheme();
    });
  });

  systemTheme.addEventListener("change", () => {
    if (!selectedTheme) applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === themeKey || event.key === null) {
      selectedTheme = readSelectedTheme();
      applyTheme();
    }
  });
})();
