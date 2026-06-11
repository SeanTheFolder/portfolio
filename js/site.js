/* seanwelding.com — site behavior. No frameworks, no dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */
  var THEME_COLORS = { light: '#f6f3ed', dark: '#161310' };

  function applyTheme(theme) {
    doc.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.light);
  }

  function currentTheme() {
    return doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (err) {}
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    try { if (localStorage.getItem('theme')) return; } catch (err) {}
    applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  var nav = document.querySelector('.site-nav');
  var navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window && !prefersReduced.matches) {
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      var i = groups.get(parent) || 0;
      el.style.setProperty('--reveal-i', String(Math.min(i, 6)));
      groups.set(parent, i + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ----------------------------------------------------------------------
     Reading progress (essay pages)
     ---------------------------------------------------------------------- */
  var progress = document.querySelector('.progress-bar');
  if (progress) {
    var ticking = false;
    var updateProgress = function () {
      var h = doc.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    updateProgress();
  }

  /* ----------------------------------------------------------------------
     Table of contents scroll-spy (essay pages)
     ---------------------------------------------------------------------- */
  var toc = document.querySelector('.essay-toc');
  if (toc && 'IntersectionObserver' in window) {
    var tocLinks = toc.querySelectorAll('a[href^="#"]');
    var headings = [];
    tocLinks.forEach(function (a) {
      var target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (target) headings.push({ a: a, el: target });
    });
    if (headings.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (a) { a.classList.remove('is-active'); });
          var hit = headings.find(function (h) { return h.el === entry.target; });
          if (hit) hit.a.classList.add('is-active');
        });
      }, { rootMargin: '-10% 0px -75% 0px' });
      headings.forEach(function (h) { spy.observe(h.el); });
    }
  }

  /* ----------------------------------------------------------------------
     Command palette
     ---------------------------------------------------------------------- */
  var palette = document.getElementById('palette');
  if (palette) {
    var input = palette.querySelector('.palette__input');
    var list = palette.querySelector('.palette__list');
    var index = null;
    var results = [];
    var active = 0;
    var lastFocus = null;

    function loadIndex() {
      if (index) return Promise.resolve(index);
      return fetch('/js/site-index.json')
        .then(function (r) { return r.json(); })
        .then(function (data) { index = data; return index; })
        .catch(function () { index = []; return index; });
    }

    function score(item, q) {
      var t = item.title.toLowerCase();
      var k = (item.kind + ' ' + (item.tags || '')).toLowerCase();
      if (t.indexOf(q) === 0) return 3;
      if (t.indexOf(q) !== -1) return 2;
      if (k.indexOf(q) !== -1) return 1;
      // every word matches somewhere
      var words = q.split(/\s+/).filter(Boolean);
      if (words.length > 1 && words.every(function (w) { return (t + ' ' + k).indexOf(w) !== -1; })) return 1;
      return 0;
    }

    function render(q) {
      q = q.trim().toLowerCase();
      var items = index || [];
      results = !q ? items.slice(0, 9) : items
        .map(function (it) { return { it: it, s: score(it, q) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 12)
        .map(function (r) { return r.it; });
      active = 0;
      if (!results.length) {
        list.innerHTML = '<li class="palette__empty">Nothing matches. Try “sentinel”, “board”, or “hipaa”.</li>';
        return;
      }
      list.innerHTML = results.map(function (it, i) {
        return '<li class="palette__item' + (i === active ? ' is-active' : '') + '" role="option" aria-selected="' + (i === active) + '">' +
          '<a href="' + it.url + '"><span class="t">' + it.title + '</span><span class="k">' + it.kind + '</span></a></li>';
      }).join('');
    }

    function setActive(i) {
      if (!results.length) return;
      active = (i + results.length) % results.length;
      var items = list.querySelectorAll('.palette__item');
      items.forEach(function (li, j) {
        li.classList.toggle('is-active', j === active);
        li.setAttribute('aria-selected', String(j === active));
      });
      var el = items[active];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }

    function openPalette() {
      lastFocus = document.activeElement;
      palette.hidden = false;
      document.body.style.overflow = 'hidden';
      input.value = '';
      loadIndex().then(function () { render(''); });
      input.focus();
    }

    function closePalette() {
      palette.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('keydown', function (e) {
      var inField = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette.hidden ? openPalette() : closePalette();
      } else if (e.key === '/' && palette.hidden && !inField) {
        e.preventDefault();
        openPalette();
      } else if (e.key === 'Escape' && !palette.hidden) {
        closePalette();
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-palette-open]')) { e.preventDefault(); openPalette(); }
    });

    palette.addEventListener('click', function (e) {
      if (e.target === palette) closePalette();
    });

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') {
        var sel = list.querySelectorAll('.palette__item a')[active];
        if (sel) { window.location.href = sel.getAttribute('href'); }
      }
    });
  }

  /* ----------------------------------------------------------------------
     Work index filters (projects.html)
     ---------------------------------------------------------------------- */
  var filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    var rows = document.querySelectorAll('[data-category]');
    var count = document.querySelector('[data-count]');
    filterBar.addEventListener('click', function (e) {
      var chip = e.target.closest('button[data-filter]');
      if (!chip) return;
      filterBar.querySelectorAll('button[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === chip));
      });
      var f = chip.getAttribute('data-filter');
      var visible = 0;
      rows.forEach(function (row) {
        var show = f === 'all' || row.getAttribute('data-category') === f;
        row.hidden = !show;
        if (show) visible++;
      });
      if (count) count.textContent = visible + ' of ' + rows.length + ' engagements';
    });
  }

  /* ----------------------------------------------------------------------
     Hero canvas — drifting contour field, quiet by design
     ---------------------------------------------------------------------- */
  var canvas = document.getElementById('hero-canvas');
  if (canvas && canvas.getContext && !prefersReduced.matches) {
    var ctx = canvas.getContext('2d');
    var w, h, dpr, t = 0;
    var running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function lineColor() {
      return currentTheme() === 'dark' ? 'rgba(236,230,220,0.07)' : 'rgba(33,28,23,0.07)';
    }
    function dotColor() {
      return currentTheme() === 'dark' ? 'rgba(224,130,141,0.35)' : 'rgba(142,32,48,0.28)';
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var gap = 56;
      var cols = Math.ceil(w / gap) + 2;
      var rowsN = Math.ceil(h / gap) + 2;
      ctx.strokeStyle = lineColor();
      ctx.lineWidth = 1;
      for (var j = 0; j < rowsN; j++) {
        ctx.beginPath();
        for (var i = 0; i <= cols; i++) {
          var x = i * gap;
          var y = j * gap +
            Math.sin(i * 0.55 + t * 0.012 + j * 0.8) * 9 +
            Math.cos(i * 0.22 + t * 0.007) * 6;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = dotColor();
      for (var k = 0; k < 5; k++) {
        var px = (Math.sin(t * 0.004 + k * 2.1) * 0.5 + 0.5) * w;
        var py = (Math.cos(t * 0.0032 + k * 1.7) * 0.5 + 0.5) * h;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      t++;
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var wasRunning = running;
        running = entries[0].isIntersecting;
        if (running && !wasRunning) requestAnimationFrame(draw);
      }).observe(canvas);
    }
    requestAnimationFrame(draw);
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
