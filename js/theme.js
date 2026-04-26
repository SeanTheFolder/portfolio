'use strict';
// js/theme.js — Shared theme toggle. Loaded on every page.

function toggleTheme() {
  const h = document.documentElement;
  const dark = h.getAttribute('data-theme') === 'dark';
  h.setAttribute('data-theme', dark ? 'light' : 'dark');
  const icon = document.getElementById('tog-icon');
  if (icon) icon.textContent = dark ? '☀️' : '🌙';
  const toggle = document.querySelector('.toggle');
  if (toggle) toggle.setAttribute('aria-checked', String(!dark));
  if (typeof window.rdrChart !== 'undefined' && window.rdrChart && typeof updateRadarTheme === 'function') {
    updateRadarTheme();
  }
}
