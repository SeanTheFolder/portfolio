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

/* ════════════════════════════════════════════════════════════════════════
 * AWARD LAYER — global UX enhancements. Loads on every page (after theme).
 * Progressive, dependency-free, reduced-motion aware, idempotent.
 * ════════════════════════════════════════════════════════════════════════ */
(function enhanceUX() {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  ready(function () {
    var nav = document.querySelector('nav');

    /* Scroll progress bar */
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    /* Back-to-top */
    var top = document.createElement('button');
    top.className = 'to-top';
    top.type = 'button';
    top.setAttribute('aria-label', 'Back to top');
    top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    document.body.appendChild(top);

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var st = window.scrollY || document.documentElement.scrollTop;
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
        if (nav) nav.classList.toggle('nav-scrolled', st > 8);
        top.classList.toggle('show', st > 600);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Cross-page active nav: mark the link matching the current page */
    try {
      var path = location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-links button, .mob-nav button').forEach(function (b) {
        var oc = b.getAttribute('onclick') || '';
        var m = oc.match(/['"]([\w-]+\.html)['"]/);
        if (m && m[1] === path) b.setAttribute('aria-current', 'page');
      });
    } catch (e) {}

    /* Universal reveal-on-scroll (idempotent; complements main.js on home) */
    if ('IntersectionObserver' in window) {
      var els = document.querySelectorAll('.reveal:not(.visible)');
      if (els.length) {
        if (reduce) {
          els.forEach(function (el) { el.classList.add('visible'); });
        } else {
          var obs = new IntersectionObserver(function (ents) {
            ents.forEach(function (e) {
              if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
          }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
          els.forEach(function (el) { obs.observe(el); });
        }
      }
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
    }

    /* Inject a bottom mobile nav on standalone pages that lack one
       (essays, project case studies, legal) so phone navigation is complete. */
    if (!document.querySelector('.mob-nav')) {
      var logo = document.querySelector('.nav-logo');
      var prefix = '';
      if (logo && logo.tagName === 'A') {
        var href = logo.getAttribute('href') || '';
        prefix = href.replace(/index\.html$/, '');
      }
      var file = (location.pathname.split('/').pop() || 'index.html');
      var I = {
        home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        work: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
        proj: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
        write: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'
      };
      var items = [
        { label: 'Home', href: prefix + 'index.html', icon: I.home, match: ['index.html', ''] },
        { label: 'Projects', href: prefix + 'projects.html', icon: I.proj, match: ['projects.html'] },
        { label: 'Writings', href: prefix + 'writings.html', icon: I.write, match: ['writings.html'] },
        { label: 'Library', href: prefix + 'library.html', icon: I.work, match: ['library.html'] },
        { label: 'Hire', href: prefix + 'hire.html', icon: I.mail, match: ['hire.html'] }
      ];
      var inSub = prefix.indexOf('..') !== -1;
      var html = items.map(function (it) {
        var active = it.match.indexOf(file) !== -1 ||
          (inSub && it.label === 'Writings' && /essays?/.test(location.pathname)) ||
          (inSub && it.label === 'Projects' && /\/projects\//.test(location.pathname));
        return '<a class="mob-nav-a" href="' + it.href + '"' + (active ? ' aria-current="page"' : '') +
          '><svg viewBox="0 0 24 24" aria-hidden="true">' + it.icon + '</svg>' + it.label + '</a>';
      }).join('');
      var mn = document.createElement('div');
      mn.className = 'mob-nav';
      mn.setAttribute('role', 'navigation');
      mn.setAttribute('aria-label', 'Mobile navigation');
      mn.innerHTML = '<div class="mob-nav-inner">' + html + '</div>';
      document.body.appendChild(mn);
    }

    /* Responsive nav drawer — complete navigation at tablet/phone widths.
       Injected on every page; uses the SPA on home, full nav elsewhere. */
    (function buildDrawer() {
      var navRight = document.querySelector('.nav-right');
      if (!navRight || document.querySelector('.nav-menu-btn')) return;
      var logo = document.querySelector('.nav-logo');
      var prefix = '';
      if (logo && logo.tagName === 'A') prefix = (logo.getAttribute('href') || '').replace(/index\.html$/, '');
      var file = (location.pathname.split('/').pop() || 'index.html');
      var inSub = prefix.indexOf('..') !== -1;

      var links = [
        { t: 'Home', href: prefix + 'index.html', spa: 'home', match: ['index.html', ''] },
        { t: 'Expertise', href: prefix + 'index.html', spa: 'expertise', navTo: 'expertise' },
        { t: 'Implementations', href: prefix + 'index.html', spa: 'impl', navTo: 'impl' },
        { t: 'Projects', href: prefix + 'projects.html', match: ['projects.html'], sub: /\/projects\// },
        { t: 'Writings', href: prefix + 'writings.html', match: ['writings.html'], sub: /essays?/ },
        { t: 'Library', href: prefix + 'library.html', match: ['library.html'] },
        { t: 'Philosophy', href: prefix + 'philosophy.html', match: ['philosophy.html'] },
        { t: 'Now', href: prefix + 'now.html', match: ['now.html'] },
        { t: 'Résumé', href: prefix + 'resume.html', match: ['resume.html'] },
        { t: 'Contact', href: prefix + 'index.html', contact: true }
      ];

      var linksHtml = links.map(function (l) {
        var active = (l.match && l.match.indexOf(file) !== -1) || (inSub && l.sub && l.sub.test(location.pathname));
        return '<a href="' + l.href + '" data-spa="' + (l.spa || '') + '" data-navto="' + (l.navTo || '') +
          '" data-contact="' + (l.contact ? '1' : '') + '"' + (active ? ' aria-current="page"' : '') + '>' + l.t + '</a>';
      }).join('');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-menu-btn';
      btn.setAttribute('aria-label', 'Open menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'nav-drawer');
      btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
      navRight.appendChild(btn);

      var drawer = document.createElement('div');
      drawer.className = 'nav-drawer';
      drawer.id = 'nav-drawer';
      drawer.innerHTML =
        '<div class="nav-drawer-scrim" data-close></div>' +
        '<nav class="nav-drawer-panel" aria-label="Site menu">' +
          '<div class="nav-drawer-head">' +
            '<span class="nav-drawer-brand">Sean Welding</span>' +
            '<button type="button" class="nav-drawer-close" aria-label="Close menu" data-close>' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="nav-drawer-links">' + linksHtml + '</div>' +
          '<div class="nav-drawer-cta"><a class="btn" href="' + prefix + 'hire.html">Work With Me</a></div>' +
        '</nav>';
      document.body.appendChild(drawer);

      var panel = drawer.querySelector('.nav-drawer-panel');
      var lastFocus = null;
      function open() {
        lastFocus = document.activeElement;
        drawer.classList.add('open');
        document.body.classList.add('drawer-open');
        btn.setAttribute('aria-expanded', 'true');
        var first = drawer.querySelector('.nav-drawer-links a');
        if (first) setTimeout(function () { first.focus(); }, 60);
        document.addEventListener('keydown', onKey);
      }
      function close() {
        drawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      function onKey(e) {
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'Tab') {
          var f = panel.querySelectorAll('a[href],button');
          if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      btn.addEventListener('click', open);
      drawer.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });

      drawer.querySelectorAll('.nav-drawer-links a').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var spa = a.getAttribute('data-spa'), navto = a.getAttribute('data-navto'), contact = a.getAttribute('data-contact');
          // On the home page, prefer the in-place SPA transitions.
          if (spa && typeof window.go === 'function' && !inSub) {
            e.preventDefault(); close(); window.go(spa); return;
          }
          if (contact && typeof window.goContact === 'function' && !inSub) {
            e.preventDefault(); close(); window.goContact(); return;
          }
          // Cross-page: stash intent for index.html to act on after load.
          try {
            if (navto) sessionStorage.setItem('navTo', navto);
            if (contact) sessionStorage.setItem('scrollTo', 'contact');
          } catch (err) {}
          close();
        });
      });

      // Auto-close if resized up to desktop while open.
      window.addEventListener('resize', function () {
        if (window.innerWidth > 940 && drawer.classList.contains('open')) close();
      });
    })();

    /* Subtle magnetic pull on primary buttons (pointer-fine, motion-ok) */
    if (!reduce && window.matchMedia('(pointer:fine)').matches) {
      document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('pointermove', function (e) {
          var r = btn.getBoundingClientRect();
          var mx = (e.clientX - (r.left + r.width / 2)) / r.width;
          var my = (e.clientY - (r.top + r.height / 2)) / r.height;
          btn.style.transform = 'translate(' + (mx * 5).toFixed(2) + 'px,' + (my * 4 - 1).toFixed(2) + 'px)';
        });
        btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
      });
    }
  });
})();
