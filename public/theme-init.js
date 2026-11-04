// DermaLens Zero-FOWT Theme Initialization Script
// Executes synchronously before initial DOM paint to prevent flash of wrong theme
// Strictly offline and client-side - Zero image data or telemetry handling
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = false;
    if (stored === 'dark') {
      isDark = true;
    } else if (stored === 'light') {
      isDark = false;
    } else {
      // Default: respect system color scheme
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch (e) {
    // Graceful fallback for strict storage restrictions
  }
})();
