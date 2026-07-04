#!/usr/bin/env python3
"""Generate the work pages from the JSON registry.

Outputs:
  projects/{slug}.html   — one case study per entry in projects/entries/
  projects.html          — the work index page
  js/site-index.json     — command-palette search index (pages + work + essays)

Run from repo root: python3 projects/_build.py
Re-run any time entries change. Output is deterministic.
"""
import html
import json
import pathlib
import re
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG = ROOT / 'projects' / 'index.json'
ENTR = ROOT / 'projects' / 'entries'
ESSAYS = ROOT / 'essays'
OUT = ROOT / 'projects'


def esc(s):
    return html.escape(str(s), quote=True) if s is not None else ''


def fmt_date(iso):
    try:
        return datetime.strptime(iso, '%Y-%m-%d').strftime('%B %Y')
    except (ValueError, TypeError):
        return iso or ''


def year(iso):
    return (iso or '')[:4]


THEME_SCRIPT = ("<script>(function(){try{var t=localStorage.getItem('theme');"
                "if(!t)t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';"
                "document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>")

FAVICON = ('<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 '
           'viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 rx=%2218%22 '
           'fill=%22%238e2030%22/%3E%3Ctext x=%2250%22 y=%2269%22 font-family=%22Georgia,serif%22 '
           'font-size=%2252%22 font-weight=%22600%22 text-anchor=%22middle%22 '
           'fill=%22%23f6f3ed%22%3ESW%3C/text%3E%3C/svg%3E"/>')

HEADER = '''<header class="site-header">
  <div class="wrap site-header__in">
    <a class="brand" href="/">Sean Welding <span class="brand__role">Healthcare CISO</span></a>
    <nav class="site-nav" aria-label="Main">
      <ul class="site-nav__links">
        <li><a href="/projects.html"{cur_work}>Work</a></li>
        <li><a href="/writings.html">Writing</a></li>
        <li><a href="/library.html">Library</a></li>
        <li><a href="/philosophy.html">Philosophy</a></li>
        <li><a href="/hire.html">Work With Me</a></li>
      </ul>
      <button class="icon-btn palette-btn" type="button" data-palette-open aria-label="Search the site">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
        <span class="kbd-hint" aria-hidden="true">⌘K</span>
      </button>
      <button class="icon-btn theme-btn" type="button" data-theme-toggle aria-label="Toggle color theme">
        <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
        <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>
      </button>
      <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-label="Open menu">
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      </button>
    </nav>
  </div>
</header>'''

PALETTE = '''<div class="palette" id="palette" hidden role="dialog" aria-modal="true" aria-label="Site search">
  <div class="palette__panel">
    <input class="palette__input" type="text" placeholder="Search work, essays, pages…" aria-label="Search" autocomplete="off" spellcheck="false"/>
    <ul class="palette__list" role="listbox"></ul>
    <div class="palette__hint"><span>↑↓ navigate</span><span>↵ open</span><span>esc close</span></div>
  </div>
</div>'''

FOOTER = '''<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <h2>Sean Welding</h2>
        <p class="site-footer__tag">Healthcare CISO &amp; IT Director. Available for full-time, fractional,
          project, advisory, interim, and one-time assessment engagements across healthcare and regulated industries.</p>
      </div>
      <nav aria-label="Explore">
        <h3>Explore</h3>
        <ul>
          <li><a href="/projects.html">Work</a></li>
          <li><a href="/writings.html">Writing</a></li>
          <li><a href="/library.html">Library</a></li>
          <li><a href="/philosophy.html">Philosophy</a></li>
        </ul>
      </nav>
      <nav aria-label="Engage">
        <h3>Engage</h3>
        <ul>
          <li><a href="/hire.html">Work With Me</a></li>
          <li><a href="/resume.html">Resume / CV</a></li>
          <li><a href="/now.html">Now</a></li>
          <li><a href="mailto:sean.welding@email.com">Email</a></li>
        </ul>
      </nav>
      <nav aria-label="Elsewhere">
        <h3>Elsewhere</h3>
        <ul>
          <li><a href="https://linkedin.com/in/seanwelding" rel="me noopener">LinkedIn</a></li>
          <li><a href="/feed.xml">RSS</a></li>
          <li><a href="/privacy.html">Privacy</a></li>
          <li><a href="/.well-known/security.txt">security.txt</a></li>
        </ul>
      </nav>
    </div>
    <div class="site-footer__meta">
      <span>© <span data-year>2026</span> Sean Welding</span>
      <span>Built by hand. No frameworks, no trackers, boring on purpose.</span>
    </div>
  </div>
</footer>'''

CASE_PAGE = '''<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
{theme_script}

<title>{title} | Sean Welding</title>
<meta name="description" content="{description}"/>
<meta name="author" content="Sean Welding"/>
<meta name="robots" content="index, follow"/>
<meta name="theme-color" content="#f6f3ed"/>
{favicon}

<meta property="og:title" content="{title}"/>
<meta property="og:description" content="{description}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="https://seanwelding.com/projects/{slug}.html"/>
<meta property="og:site_name" content="Sean Welding"/>
<meta property="og:image" content="https://seanwelding.com/og-image.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{description}"/>
<meta name="twitter:image" content="https://seanwelding.com/og-image.png"/>

<link rel="canonical" href="https://seanwelding.com/projects/{slug}.html"/>
<link rel="sitemap" type="application/xml" href="/sitemap.xml"/>

<script type="application/ld+json">{jsonld}</script>

<link rel="stylesheet" href="/css/site.css"/>
<script src="/js/site.js" defer></script>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>

{header}

<main id="main">

  <article class="wrap">
    <header class="case-hero">
      <p class="crumbs"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/projects.html">Work</a> <span aria-hidden="true">/</span> <span>{category}</span></p>
      <h1>{title}</h1>
      <p class="case-hero__summary">{summary}</p>
      <dl class="case-meta" data-reveal>
        <div><dt class="k">Date</dt><dd class="v" style="margin:0">{date_h}</dd></div>
        <div><dt class="k">Duration</dt><dd class="v" style="margin:0">{duration}</dd></div>
        <div><dt class="k">Scope</dt><dd class="v" style="margin:0">{scope}</dd></div>
        <div><dt class="k">Status</dt><dd class="v" style="margin:0"><span class="status{status_cls}">{status}</span></dd></div>
      </dl>
    </header>

    <section class="case-section" aria-labelledby="h-problem">
      <h2 id="h-problem"><span class="n" aria-hidden="true">01 /</span> The problem</h2>
      <div class="prose"><p>{problem}</p></div>
    </section>

    <section class="case-section" aria-labelledby="h-approach">
      <h2 id="h-approach"><span class="n" aria-hidden="true">02 /</span> The approach</h2>
      <ol class="steps">
{approach}
      </ol>
    </section>

    <section class="case-section" aria-labelledby="h-outcomes">
      <h2 id="h-outcomes"><span class="n" aria-hidden="true">03 /</span> Outcomes</h2>
      <div class="stats" data-reveal>
{outcomes}
      </div>
    </section>

{lessons}

    <section class="case-section" aria-labelledby="h-stack">
      <h2 id="h-stack"><span class="n" aria-hidden="true">{stack_n} /</span> Stack &amp; standards</h2>
      <div class="chip-row" style="margin-bottom:var(--space-3)">
{stack}
      </div>
{compliance}
    </section>

    <nav class="case-nav" aria-label="More work">
{prevnext}
    </nav>

    <section class="case-section" aria-labelledby="h-related">
      <h2 id="h-related"><span class="n" aria-hidden="true">＋</span> Related work</h2>
      <div class="card-grid">
{related}
      </div>
    </section>
  </article>

</main>

{palette}

{footer}

</body>
</html>
'''


def render_related(curr, projects, max_n=3):
    same_cat = [p for p in projects if p['slug'] != curr['slug'] and p['category'] == curr['category']]
    featured = [p for p in projects if p['slug'] != curr['slug'] and p.get('featured') and p not in same_cat]
    pool = same_cat[:max_n]
    if len(pool) < max_n:
        pool += featured[:max_n - len(pool)]
    if len(pool) < max_n:
        rest = [p for p in projects if p['slug'] != curr['slug'] and p not in pool]
        pool += rest[:max_n - len(pool)]
    return pool[:max_n]


def build_case(entry, reg_projects, prev_p, next_p):
    summary = entry.get('summary', '')
    approach = '\n'.join(
        '        <li data-reveal>{}</li>'.format(esc(step))
        for step in entry.get('approach', []))
    outcomes = '\n'.join(
        '        <div class="stat"><div class="stat__value">{m}</div><div class="stat__label">{l}</div><div class="stat__ctx">{c}</div></div>'.format(
            m=esc(o.get('metric', '')), l=esc(o.get('label', '')), c=esc(o.get('context', '')))
        for o in entry.get('outcomes', []))
    stack = '\n'.join(
        '        <span class="chip">{}</span>'.format(esc(s))
        for s in entry.get('stack', []))

    lessons_html = ''
    stack_n = '04'
    if entry.get('lessons'):
        lessons_html = ('    <section class="case-section" aria-labelledby="h-lessons">\n'
                        '      <h2 id="h-lessons"><span class="n" aria-hidden="true">04 /</span> What I learned</h2>\n'
                        '      <div class="lessons" data-reveal><p>{}</p></div>\n'
                        '    </section>\n').format(esc(entry['lessons']))
        stack_n = '05'

    compliance_html = ''
    if entry.get('compliance'):
        rows = '\n'.join(
            '        <div><dt>Mapped to</dt><dd>{}</dd></div>'.format(esc(c))
            for c in entry['compliance'])
        compliance_html = '      <dl class="facts">\n{}\n      </dl>\n'.format(rows)

    related = '\n'.join(
        ('        <a class="card" href="/projects/{slug}.html" data-reveal>\n'
         '          <span class="card__meta"><span class="tag label-accent">{cat}</span><span class="tag">{yr}</span></span>\n'
         '          <h3>{title}</h3>\n'
         '          <p>{summary}</p>\n'
         '        </a>').format(
            slug=esc(p['slug']), cat=esc(p['category']), yr=year(p.get('date')),
            title=esc(p['title']),
            summary=esc(p.get('summary', '').split('. ')[0].rstrip('.') + '.'))
        for p in render_related(entry, reg_projects))

    pn = []
    if prev_p:
        pn.append('      <a href="/projects/{s}.html" rel="prev"><span class="k">← Previous</span><span class="t">{t}</span></a>'.format(
            s=esc(prev_p['slug']), t=esc(prev_p['title'])))
    else:
        pn.append('      <a href="/projects.html"><span class="k">← Index</span><span class="t">All work</span></a>')
    if next_p:
        pn.append('      <a class="next" href="/projects/{s}.html" rel="next"><span class="k">Next →</span><span class="t">{t}</span></a>'.format(
            s=esc(next_p['slug']), t=esc(next_p['title'])))
    else:
        pn.append('      <a class="next" href="/projects.html"><span class="k">Index →</span><span class="t">All work</span></a>')

    jsonld = json.dumps({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': entry['title'],
        'description': summary,
        'datePublished': entry.get('date'),
        'author': {'@type': 'Person', 'name': 'Sean Welding', 'url': 'https://seanwelding.com'},
        'mainEntityOfPage': 'https://seanwelding.com/projects/%s.html' % entry['slug'],
    }, ensure_ascii=False)

    status = entry.get('status', 'completed')
    return CASE_PAGE.format(
        theme_script=THEME_SCRIPT,
        favicon=FAVICON,
        header=HEADER.format(cur_work=' aria-current="page"'),
        palette=PALETTE,
        footer=FOOTER,
        title=esc(entry['title']),
        description=esc(summary[:300]),
        slug=esc(entry['slug']),
        jsonld=jsonld,
        category=esc(entry.get('category', '')),
        summary=esc(summary),
        date_h=esc(fmt_date(entry.get('date'))),
        duration=esc(entry.get('duration', '')),
        scope=esc(entry.get('scope', '')),
        status=esc(status.capitalize()),
        status_cls=' status--ongoing' if status == 'ongoing' else '',
        problem=esc(entry.get('problem', '')),
        approach=approach,
        outcomes=outcomes,
        lessons=lessons_html,
        stack_n=stack_n,
        stack=stack,
        compliance=compliance_html,
        prevnext='\n'.join(pn),
        related=related,
    )


INDEX_PAGE = '''<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
{theme_script}

<title>Work: 35 Engagements | Sean Welding</title>
<meta name="description" content="The full index of Sean Welding's work: 35 engagements across security, compliance, AI &amp; automation, infrastructure, and operations in healthcare and regulated industries."/>
<meta name="author" content="Sean Welding"/>
<meta name="robots" content="index, follow"/>
<meta name="theme-color" content="#f6f3ed"/>
{favicon}

<meta property="og:title" content="Work: 35 Engagements | Sean Welding"/>
<meta property="og:description" content="Security programs, compliance builds, AI governance, and infrastructure overhauls. Every engagement documented as a case study."/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://seanwelding.com/projects.html"/>
<meta property="og:site_name" content="Sean Welding"/>
<meta property="og:image" content="https://seanwelding.com/og-image.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="https://seanwelding.com/og-image.png"/>

<link rel="canonical" href="https://seanwelding.com/projects.html"/>
<link rel="sitemap" type="application/xml" href="/sitemap.xml"/>

<link rel="stylesheet" href="/css/site.css"/>
<script src="/js/site.js" defer></script>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>

{header}

<main id="main">
  <div class="wrap">
    <header class="page-hero">
      <p class="label label-accent">Index of Work</p>
      <h1>Every engagement, documented.</h1>
      <p class="page-hero__deck">{count} engagements across a decade: security programs built from zero,
        compliance under live deadlines, AI governance in a HIPAA boundary, and the infrastructure
        underneath all of it. Each one written up as a case study: problem, approach, outcomes, lessons.</p>
    </header>

    <div class="filters" data-filters role="group" aria-label="Filter by category">
      <button class="chip" type="button" data-filter="all" aria-pressed="true">All</button>
{filter_chips}
    </div>
    <p class="work-count" data-count aria-live="polite">{count} of {count} engagements</p>

    <ol class="ledger">
{rows}
    </ol>
  </div>
</main>

{palette}

{footer}

</body>
</html>
'''


def build_index(projects):
    cats = []
    for p in projects:
        if p['category'] not in cats:
            cats.append(p['category'])
    chips = '\n'.join(
        '      <button class="chip" type="button" data-filter="{c}" aria-pressed="false">{c}</button>'.format(c=esc(c))
        for c in sorted(cats))
    rows = []
    for i, p in enumerate(projects, 1):
        status = p.get('status', 'completed')
        meta = '{} · {}'.format(year(p.get('date')), esc(p['category']))
        if status == 'ongoing':
            meta += ' · ongoing'
        rows.append(
            ('      <li data-category="{cat}" data-reveal><a class="ledger__row" href="/projects/{slug}.html">\n'
             '        <span class="ledger__num">{num:02d}</span>\n'
             '        <span><span class="ledger__title">{title}</span>\n'
             '        <span class="ledger__sub">{summary}</span></span>\n'
             '        <span class="ledger__meta">{meta}</span></a></li>').format(
                cat=esc(p['category']), slug=esc(p['slug']), num=i,
                title=esc(p['title']),
                summary=esc(first_sentences(p.get('summary', ''), 2)),
                meta=meta))
    return INDEX_PAGE.format(
        theme_script=THEME_SCRIPT,
        favicon=FAVICON,
        header=HEADER.format(cur_work=' aria-current="page"'),
        palette=PALETTE,
        footer=FOOTER,
        count=len(projects),
        filter_chips=chips,
        rows='\n'.join(rows),
    )


def first_sentences(text, n=2):
    parts = re.split(r'(?<=[.!?]) +', text or '')
    return ' '.join(parts[:n])


def essay_meta(path):
    """Pull title, description, and section from an essay HTML file."""
    text = path.read_text(encoding='utf-8')
    title = re.search(r'<title>(.*?)(?: \| Sean Welding)?</title>', text, re.S)
    section = re.search(r'article:section" content="(.*?)"', text)
    return {
        'title': html.unescape(title.group(1).strip()) if title else path.stem,
        'kind': 'Essay · ' + (section.group(1) if section else 'Field Notes'),
        'url': '/essays/' + path.name,
    }


def build_search_index(projects):
    items = [
        {'title': 'Home', 'kind': 'Page', 'url': '/', 'tags': 'index start about sean welding'},
        {'title': 'Work: all 35 engagements', 'kind': 'Page', 'url': '/projects.html', 'tags': 'projects portfolio case studies'},
        {'title': 'Writing: field essays', 'kind': 'Page', 'url': '/writings.html', 'tags': 'essays articles blog'},
        {'title': 'Working Library: template packs', 'kind': 'Page', 'url': '/library.html', 'tags': 'templates frameworks packs resources'},
        {'title': 'Philosophy', 'kind': 'Page', 'url': '/philosophy.html', 'tags': 'principles beliefs leadership'},
        {'title': 'Work With Me', 'kind': 'Page', 'url': '/hire.html', 'tags': 'hire consulting fractional vciso engagement services'},
        {'title': 'Resume / CV', 'kind': 'Page', 'url': '/resume.html', 'tags': 'cv experience history print'},
        {'title': 'Now: current focus', 'kind': 'Page', 'url': '/now.html', 'tags': 'availability reading current'},
        {'title': 'Privacy', 'kind': 'Page', 'url': '/privacy.html', 'tags': 'privacy policy'},
    ]
    for p in projects:
        items.append({
            'title': p['title'],
            'kind': 'Work · ' + p['category'],
            'url': '/projects/%s.html' % p['slug'],
            'tags': ' '.join(p.get('tags', [])),
        })
    for f in sorted(ESSAYS.glob('*.html')):
        items.append(essay_meta(f))
    return items


def main():
    reg = json.loads(REG.read_text(encoding='utf-8'))
    projects = sorted(reg['projects'], key=lambda p: p.get('date', ''), reverse=True)

    entries = {}
    for p in projects:
        path = ENTR / (p['slug'] + '.json')
        entries[p['slug']] = json.loads(path.read_text(encoding='utf-8'))

    for i, p in enumerate(projects):
        prev_p = projects[i - 1] if i > 0 else None
        next_p = projects[i + 1] if i < len(projects) - 1 else None
        entry = entries[p['slug']]
        # registry is the source of truth for shared fields
        for key in ('title', 'date', 'status', 'duration', 'scope', 'category', 'tags', 'summary', 'outcomes', 'featured'):
            if key in p:
                entry.setdefault(key, p[key])
        out = OUT / (p['slug'] + '.html')
        out.write_text(build_case(entry, projects, prev_p, next_p), encoding='utf-8')
        print('wrote', out.relative_to(ROOT))

    (ROOT / 'projects.html').write_text(build_index(projects), encoding='utf-8')
    print('wrote projects.html')

    idx = build_search_index(projects)
    (ROOT / 'js' / 'site-index.json').write_text(
        json.dumps(idx, ensure_ascii=False, indent=1), encoding='utf-8')
    print('wrote js/site-index.json (%d items)' % len(idx))


if __name__ == '__main__':
    main()
