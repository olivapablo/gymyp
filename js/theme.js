window.FITTRACK = window.FITTRACK || {};

const THEME_KEY = 'fittrack_theme';

window.FITTRACK.initTheme = function() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  window.FITTRACK.applyTheme(savedTheme);
};

window.FITTRACK.applyTheme = function(theme) {
  const root = document.documentElement;
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0B0D0F' : '#F5F6F4');
  }
};

window.FITTRACK.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  window.FITTRACK.applyTheme(newTheme);
  return newTheme;
};
