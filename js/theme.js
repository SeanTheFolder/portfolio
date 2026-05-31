'use strict';
// js/theme.js — Shared theme toggle. Loaded on every page.
//
// The INITIAL theme is applied by a small inline <script> in each HTML <head>
// (so there's no flash of incorrect theme on first paint). This file owns the
// runtime toggle, persistence, and live-response to OS theme changes.

function toggleTheme() {
  const h = document.documentElement;
  const dark = h.getAttribute('data-theme') === 'dark';
  const next = dark ? 'light' : 'dark';
  h.setAttribute('data-theme', next);
  // Persist explicit user choice. After this point, OS prefers-color-scheme
  // is ignored — the user has spoken.
  try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }

  const icon = document.getElementById('tog-icon');
  if (icon) icon.textContent = next === 'dark' ? '🌙' : '☀️';
  const toggle = document.querySelector('.toggle');
  if (toggle) toggle.setAttribute('aria-checked', String(next === 'dark'));

  if (typeof window.rdrChart !== 'undefined' && window.rdrChart && typeof updateRadarTheme === 'function') {
    updateRadarTheme();
  }
}

// Sync the toggle icon + aria-checked once the DOM is ready, in case the
// inline init script picked a different starting theme than the HTML default.
(function syncToggleUI() {
  function apply() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const icon = document.getElementById('tog-icon');
    if (icon) icon.textContent = dark ? '🌙' : '☀️';
    const toggle = document.querySelector('.toggle');
    if (toggle) toggle.setAttribute('aria-checked', String(dark));
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
})();

// Live-respond to OS theme changes IF the user has not made an explicit choice.
(function watchOsTheme() {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e) => {
    let userChose = null;
    try { userChose = localStorage.getItem('theme'); } catch (err) { /* private mode */ }
    if (userChose) return; // explicit choice wins
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    const icon = document.getElementById('tog-icon');
    if (icon) icon.textContent = e.matches ? '🌙' : '☀️';
    const toggle = document.querySelector('.toggle');
    if (toggle) toggle.setAttribute('aria-checked', String(e.matches));
  };
  if (mq.addEventListener) mq.addEventListener('change', handler);
  else if (mq.addListener) mq.addListener(handler); // older browsers
})();
