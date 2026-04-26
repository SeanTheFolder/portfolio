'use strict';
// js/projects.js — Projects & Case Studies page logic.
// Requires: js/theme.js, js/utils.js loaded first.

const PROJ_REGISTRY = 'projects/index.json';
const PROJ_BASE     = 'projects/entries/';

/* ── Fetch ──────────────────────────────────────────────── */

async function fetchProjectRegistry() {
  const res = await fetch(PROJ_REGISTRY + '?v=' + Date.now());
  if (!res.ok) throw new Error('Failed to load project registry');
  return res.json();
}

async function fetchProject(slug) {
  const res = await fetch(PROJ_BASE + slug + '.json?v=' + Date.now());
  if (!res.ok) throw new Error('Project not found: ' + slug);
  return res.json();
}

/* ── Stats ──────────────────────────────────────────────── */

function computeStats(projects) {
  const total      = projects.length;
  const completed  = projects.filter(p => p.status === 'completed').length;
  const categories = new Set(projects.map(p => p.category)).size;
  const recent     = projects.filter(p => p.date >= '2025-01-01').length;
  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-completed').textContent  = completed;
  document.getElementById('stat-categories').textContent = categories;
  document.getElementById('stat-recent').textContent     = recent + '+';
}

/* ── Filter bar ─────────────────────────────────────────── */

let activeCategory = 'all';
let activeScope    = 'all';

function buildFilterBar(projects) {
  const cats   = ['All', ...new Set(projects.map(p => p.category))];
  const scopes = ['All', ...new Set(projects.map(p => p.scope))];

  const catRow   = document.getElementById('cat-filter-row');
  const scopeRow = document.getElementById('scope-filter-row');

  catRow.innerHTML = cats.map(c => {
    const val = c === 'All' ? 'all' : c;
    return `<button class="fbtn" aria-pressed="${val === 'all' ? 'true' : 'false'}"
              data-filter-cat="${val}"
              onclick="setCategory('${escapeHtml(val)}')">${escapeHtml(c)}</button>`;
  }).join('');

  scopeRow.innerHTML = scopes.map(s => {
    const val = s === 'All' ? 'all' : s;
    return `<button class="fbtn pfilter-row--secondary-btn" aria-pressed="${val === 'all' ? 'true' : 'false'}"
              data-filter-scope="${val}"
              onclick="setScope('${escapeHtml(val)}')">${escapeHtml(s)}</button>`;
  }).join('');
}

function setCategory(val) {
  activeCategory = val;
  document.querySelectorAll('[data-filter-cat]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.filterCat === val)));
  applyFilters();
}

function setScope(val) {
  activeScope = val;
  document.querySelectorAll('[data-filter-scope]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.filterScope === val)));
  applyFilters();
}

function applyFilters() {
  let anyVisible = false;
  document.querySelectorAll('.project-card').forEach(card => {
    const catMatch   = activeCategory === 'all' || card.dataset.category === activeCategory;
    const scopeMatch = activeScope    === 'all' || card.dataset.scope    === activeScope;
    const visible    = catMatch && scopeMatch;
    card.style.display = visible ? '' : 'none';
    if (visible) {
      anyVisible = true;
      card.classList.remove('visible');
      requestAnimationFrame(() => card.classList.add('visible'));
    }
  });
  const empty = document.getElementById('projects-empty');
  if (empty) empty.hidden = anyVisible;
}

/* ── Card renderer ──────────────────────────────────────── */

function renderProjectCard(project) {
  const card = document.createElement('article');
  card.className = 'project-card reveal';
  card.setAttribute('data-category', project.category);
  card.setAttribute('data-scope',    project.scope);
  card.setAttribute('data-status',   project.status);

  const outcomePills = project.outcomes.slice(0, 2).map(o =>
    `<div class="proj-outcome-pill">
      <span class="proj-outcome-metric">${escapeHtml(o.metric)}</span>
      <span class="proj-outcome-label">${escapeHtml(o.label)}</span>
    </div>`
  ).join('');

  const tagChips = project.tags.slice(0, 4).map(t =>
    `<span class="proj-tag">${escapeHtml(t)}</span>`
  ).join('');

  card.innerHTML = `
    <div class="project-card-inner">
      <div class="proj-header">
        <div class="proj-badges">
          <span class="proj-status proj-status--${escapeHtml(project.status)}">${escapeHtml(project.status)}</span>
          <span class="proj-category">${escapeHtml(project.category)}</span>
          <span class="proj-scope">${escapeHtml(project.scope)}</span>
          <span class="proj-duration">${escapeHtml(project.duration)}</span>
          ${project.featured ? '<span class="proj-featured">Featured</span>' : ''}
        </div>
        <time class="proj-date" datetime="${escapeHtml(project.date)}">${formatDate(project.date)}</time>
      </div>
      <h2 class="proj-title">
        <a href="#${escapeHtml(project.slug)}" class="proj-link" data-slug="${escapeHtml(project.slug)}">
          ${escapeHtml(project.title)}
        </a>
      </h2>
      <p class="proj-summary">${escapeHtml(project.summary)}</p>
      <div class="proj-outcomes-row">${outcomePills}</div>
      <div class="proj-tags">${tagChips}</div>
    </div>
  `;

  card.querySelector('.proj-link').addEventListener('click', e => {
    e.preventDefault();
    openProject(project.slug);
  });

  return card;
}

/* ── Detail view ────────────────────────────────────────── */

async function openProject(slug) {
  const listView   = document.getElementById('projects-list-sec');
  const detailView = document.getElementById('project-detail');

  try {
    const proj = await fetchProject(slug);

    document.getElementById('proj-detail-title').textContent   = proj.title;
    document.getElementById('proj-detail-summary').textContent = proj.summary;
    document.getElementById('proj-detail-badges').innerHTML = `
      <span class="proj-status proj-status--${escapeHtml(proj.status)}">${escapeHtml(proj.status)}</span>
      <span class="proj-category">${escapeHtml(proj.category)}</span>
      <span class="proj-scope">${escapeHtml(proj.scope)}</span>
      <span class="proj-duration">${escapeHtml(proj.duration)}</span>
    `;

    document.getElementById('proj-problem').textContent = proj.problem;

    document.getElementById('proj-approach').innerHTML = proj.approach
      .map(step => `<li class="proj-approach-item">${escapeHtml(step)}</li>`)
      .join('');

    const lessonsSection = document.getElementById('proj-section-lessons');
    if (proj.lessons) {
      document.getElementById('proj-lessons').textContent = proj.lessons;
      lessonsSection.hidden = false;
    } else {
      lessonsSection.hidden = true;
    }

    document.getElementById('proj-outcomes').innerHTML = proj.outcomes
      .map(o => `
        <div class="proj-outcome-block">
          <div class="proj-outcome-num">${escapeHtml(o.metric)}</div>
          <div class="proj-outcome-lbl">${escapeHtml(o.label)}</div>
          <div class="proj-outcome-ctx">${escapeHtml(o.context)}</div>
        </div>
      `).join('');

    document.getElementById('proj-stack').innerHTML = proj.stack
      .map(s => `<span class="proj-stack-chip">${escapeHtml(s)}</span>`)
      .join('');

    const compBlock = document.getElementById('proj-sidebar-compliance');
    if (proj.compliance && proj.compliance.length) {
      document.getElementById('proj-compliance').innerHTML = proj.compliance
        .map(c => `<span class="proj-compliance-chip">${escapeHtml(c)}</span>`)
        .join('');
      compBlock.hidden = false;
    } else {
      compBlock.hidden = true;
    }

    const relatedBlock = document.getElementById('proj-sidebar-related');
    if (proj.relatedImpl) {
      relatedBlock.hidden = false;
    } else {
      relatedBlock.hidden = true;
    }

    document.title = proj.title + ' | Projects — Sean Welding';
    history.replaceState(null, '', '#' + slug);

    injectProjectSchema(proj);

    listView.hidden   = true;
    detailView.hidden = false;
    detailView.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    showProjError(err.message);
  }
}

function closeProject() {
  const listView   = document.getElementById('projects-list-sec');
  const detailView = document.getElementById('project-detail');
  detailView.hidden = true;
  listView.hidden   = false;
  document.title    = 'Projects | Sean Welding — Healthcare IT Case Studies';
  history.replaceState(null, '', location.pathname);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const existing = document.getElementById('proj-schema');
  if (existing) existing.remove();
}

function showProjError(msg) {
  const list = document.getElementById('projects-list-sec');
  list.insertAdjacentHTML('afterbegin',
    `<div class="blog-error" role="alert">Unable to load project: ${escapeHtml(msg)}</div>`);
}

/* ── JSON-LD injection ──────────────────────────────────── */

function injectProjectSchema(proj) {
  const existing = document.getElementById('proj-schema');
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id   = 'proj-schema';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context':     'https://schema.org',
    '@type':        'TechArticle',
    'headline':     proj.title,
    'description':  proj.summary,
    'datePublished': proj.date,
    'dateModified':  proj.updated || proj.date,
    'author': { '@type': 'Person', 'name': 'Sean Welding', 'url': 'https://seanwelding.com' },
    'url':     'https://seanwelding.com/projects.html#' + proj.slug,
    'keywords': proj.tags.join(', '),
    'about': proj.stack.map(s => ({ '@type': 'SoftwareApplication', 'name': s }))
  });
  document.head.appendChild(script);
}

/* ── Reveal observer ────────────────────────────────────── */

function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

/* ── Init ───────────────────────────────────────────────── */

async function initProjects() {
  try {
    const data     = await fetchProjectRegistry();
    const projects = data.projects || [];

    computeStats(projects);
    buildFilterBar(projects);

    const list = document.getElementById('projects-list');
    projects.forEach(p => list.appendChild(renderProjectCard(p)));

    const emptyEl = document.getElementById('projects-empty');
    if (emptyEl) emptyEl.hidden = projects.length > 0;

    setupReveal();

    // Handle direct hash navigation (e.g. projects.html#sentinel-from-zero)
    const hash = location.hash.replace('#', '');
    if (hash) openProject(hash);

  } catch (err) {
    showProjError(err.message);
  }
}

document.addEventListener('DOMContentLoaded', initProjects);

// Back-button hash change
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '');
  if (hash) {
    openProject(hash);
  } else {
    closeProject();
  }
});
