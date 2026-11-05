/* Runs in the head so a saved choice is applied before the page is painted. */
(() => {
  'use strict';
  const key = 'cyl-light-mode';
  const root = document.documentElement;
  const colors = { dark: '#25303b', light: '#e1dbdb' };
  let button;
  function readMode() {
    try { return localStorage.getItem(key) === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  }
  function updateButton() {
    if (!button) return;
    const light = root.dataset.tone === 'light';
    const label = light ? 'Lights off' : 'Lights on';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (light ? '<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>' :
        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>') + '</svg>';
  }
  function apply(mode, save = false) {
    root.dataset.tone = mode === 'light' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = colors[root.dataset.tone];
    if (save) { try { localStorage.setItem(key, root.dataset.tone); } catch {} }
    updateButton();
    window.dispatchEvent(new CustomEvent('cyl:themechange', { detail: { mode: root.dataset.tone } }));
  }
  apply(readMode());
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header, .masthead__inner-wrap');
    if (!header) return;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'light-switch';
    button.addEventListener('click', () => apply(root.dataset.tone === 'light' ? 'dark' : 'light', true));
    header.appendChild(button);
    updateButton();
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) apply(readMode()); });
  window.addEventListener('pageshow', () => apply(readMode()));
})();
