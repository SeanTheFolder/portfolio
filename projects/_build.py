#!/usr/bin/env python3
"""Generate static HTML files at projects/{slug}.html from the JSON registry.

Run from repo root: python3 projects/_build.py
Re-run any time entries change. Output is deterministic.
"""
import html
import json
import pathlib
import re
import sys
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
REG  = ROOT / 'projects' / 'index.json'
ENTR = ROOT / 'projects' / 'entries'
OUT  = ROOT / 'projects'

def esc(s):
    return html.escape(str(s), quote=True) if s is not None else ''

def fmt_date(iso):
    try: return datetime.strptime(iso, '%Y-%m-%d').strftime('%B %Y')
    except: return iso or ''

def slug_to_title_case(s):
    return ' '.join(w.capitalize() for w in s.replace('-', ' ').split())

def render_related(curr, projects, max_n=3):
    """Pick up to N related entries: same category, then featured fallbacks."""
    same_cat = [p for p in projects if p['slug'] != curr['slug'] and p['category'] == curr['category']]
    featured = [p for p in projects if p['slug'] != curr['slug'] and p.get('featured') and p not in same_cat]
    pool = same_cat[:max_n]
    if len(pool) < max_n:
        pool += featured[:max_n - len(pool)]
    if len(pool) < max_n:
        rest = [p for p in projects if p['slug'] != curr['slug'] and p not in pool]
        pool += rest[:max_n - len(pool)]
    return pool[:max_n]

PAGE = """<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>

<title>{title} | Sean Welding, Healthcare CISO</title>

<meta name="description" content="{description}"/>
<meta name="author" content="Sean Welding"/>
<meta name="robots" content="index, follow"/>
<meta name="theme-color" content="#8b1a2f"/>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 rx=%2218%22 fill=%22%238b1a2f%22/%3E%3Ctext x=%2250%22 y=%2268%22 font-family=%22DM Serif Display, Georgia, serif%22 font-size=%2254%22 font-weight=%22700%22 text-anchor=%22middle%22 fill=%22%23ffffff%22%3ESW%3C/text%3E%3C/svg%3E"/>

<meta property="og:title" content="{og_title}"/>
<meta property="og:description" content="{description}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="https://seanwelding.com/projects/{slug}.html"/>
<meta property="og:site_name" content="Sean Welding | Healthcare CISO &amp; IT Director"/>
<meta property="og:image" content="https://seanwelding.com/og-image.png"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="article:author" content="Sean Welding"/>
<meta property="article:published_time" content="{date}"/>
<meta property="article:section" content="{category}"/>
{article_tags}

<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="https://seanwelding.com/og-image.png"/>
<meta name="twitter:title" content="{og_title}"/>
<meta name="twitter:description" content="{description}"/>

<link rel="canonical" href="https://seanwelding.com/projects/{slug}.html"/>
<link rel="sitemap" type="application/xml" href="/sitemap.xml"/>

<script type="application/ld+json">
{ld_json}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Serif+Display&display=swap" rel="stylesheet"/>

<link rel="stylesheet" href="../css/themes.css"/>
<link rel="stylesheet" href="../css/main.css"/>
<link rel="stylesheet" href="../css/projects.css"/>
</head>
<body>
<a href="#proj-top" class="skip-link">Skip to main content</a>

<nav aria-label="Main navigation"><div class="nav-inner">
<a href="../index.html" class="nav-logo" style="text-decoration:none">Sean Welding</a>
<div class="nav-right">
<ul class="nav-links" role="list">
<li><a href="../index.html" class="nav-links-a">Home</a></li>
<li><a href="../index.html" onclick="sessionStorage.setItem('navTo','impl')" class="nav-links-a">Implementations</a></li>
<li><a href="../projects.html" class="nav-links-a" aria-current="page">Projects</a></li>
<li><a href="../writings.html" class="nav-links-a">Writings</a></li>
<li><a href="../philosophy.html" class="nav-links-a">Philosophy</a></li>
<li><a href="../index.html" onclick="sessionStorage.setItem('scrollTo','contact')" class="nav-links-a">Contact</a></li>
</ul>
<div class="toggle" role="switch" aria-checked="false" aria-label="Toggle dark mode" tabindex="0"
     onclick="toggleTheme()" onkeydown="if(event.key==='Enter'||event.key===' '){{event.preventDefault();toggleTheme();}}">
<span id="tog-icon" aria-hidden="true">☀️</span><div class="toggle-track"><div class="toggle-thumb"></div></div>
</div></div></div></nav>

<main id="proj-top" tabindex="-1">
<article class="project-detail project-detail--standalone">
  <div class="project-detail-container">

    <a class="blog-back-btn" href="../projects.html">← Back to Projects</a>

    <header class="proj-detail-header">
      <div class="proj-detail-badges">
        <span class="proj-status proj-status--{status}">{status_label}</span>
        <span class="proj-category">{category}</span>
        <span class="proj-scope">{scope}</span>
        <span class="proj-duration">{duration}</span>
        {featured_badge}
      </div>
      <h1 class="proj-detail-title">{title}</h1>
      <p class="proj-detail-summary">{summary}</p>
      <p class="proj-detail-date"><time datetime="{date}">{date_long}</time></p>
    </header>

    <div class="proj-detail-body">

      <div class="proj-detail-main">
        <section class="proj-section">
          <h2 class="proj-section-title">The Problem</h2>
          <p class="proj-section-body">{problem}</p>
        </section>

        <section class="proj-section">
          <h2 class="proj-section-title">Approach</h2>
          <ol class="proj-approach-list">{approach_items}</ol>
        </section>

        {lessons_section}
      </div>

      <aside class="proj-detail-sidebar">
        <div class="proj-sidebar-block">
          <h3 class="proj-sidebar-title">Outcomes</h3>
          <div class="proj-outcomes-stack">{outcomes}</div>
        </div>

        <div class="proj-sidebar-block">
          <h3 class="proj-sidebar-title">Stack</h3>
          <div class="proj-stack-chips">{stack_chips}</div>
        </div>

        {compliance_block}

        <div class="proj-sidebar-block">
          <h3 class="proj-sidebar-title">Tags</h3>
          <div class="proj-stack-chips">{tag_chips}</div>
        </div>
      </aside>

    </div>

    <section class="proj-related-section">
      <h2 class="proj-related-h">Related Case Studies</h2>
      <div class="proj-related-grid">{related_cards}</div>
    </section>

    <footer class="blog-post-footer">
      <div class="blog-post-cta">
        <p>Interested in this kind of work for your organization?</p>
        <a href="../index.html" class="btn btn-outline btn-sm"
           onclick="sessionStorage.setItem('scrollTo','contact')">
          Get in Touch
        </a>
      </div>
    </footer>

  </div>
</article>
</main>

<footer class="site-footer">
  <div class="footer-grid">
    <div class="footer-col footer-col--brand">
      <span class="footer-logo">Sean Welding</span>
      <span class="footer-tag">CISO &amp; IT Director · Home Health &amp; Hospice Healthcare</span>
      <p class="footer-blurb">Healthcare CISO and IT Director. Available for full-time, fractional, project, advisory, interim, and one-time assessment engagements.</p>
    </div>
    <div class="footer-col">
      <p class="footer-col-title">Explore</p>
      <a href="../index.html">Home</a>
      <a href="../index.html" onclick="sessionStorage.setItem('navTo','impl')">Implementations</a>
      <a href="../projects.html">Project Portfolio</a>
      <a href="../philosophy.html">Philosophy</a>
      <a href="../writings.html">Writings &amp; Resources</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-title">Engage</p>
      <a href="../index.html#engagement">Engagement Models</a>
      <a href="../now.html">Now (Current Focus)</a>
      <a href="../resume.html">Resume (Print/PDF)</a>
      <a href="../index.html" onclick="sessionStorage.setItem('scrollTo','contact')">Get in Touch</a>
    </div>
    <div class="footer-col">
      <p class="footer-col-title">Direct</p>
      <a href="mailto:sean.welding@email.com">sean.welding@email.com</a>
      <a href="#">LinkedIn</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© <span id="footer-year"></span> Sean Welding. All rights reserved.</span>
    <span><a href="../privacy.html" style="color:inherit">Privacy</a> · <a href="/.well-known/security.txt" style="color:inherit">Security</a> · Healthcare CISO &amp; IT Director · United States</span>
  </div>
</footer>
<script>document.getElementById('footer-year').textContent=new Date().getFullYear();</script>
<script src="../js/theme.js"></script>
</body>
</html>
"""


def render_one(proj, registry):
    slug = proj['slug']
    title = proj['title']
    description = proj['summary']
    if len(description) > 300:
        description = description[:297] + '...'

    approach_items = ''.join(
        f'<li class="proj-approach-item">{esc(step)}</li>'
        for step in proj['approach']
    )

    outcomes = ''.join(
        f'''<div class="proj-outcome-block">
          <div class="proj-outcome-num">{esc(o["metric"])}</div>
          <div class="proj-outcome-lbl">{esc(o["label"])}</div>
          <div class="proj-outcome-ctx">{esc(o["context"])}</div>
        </div>'''
        for o in proj['outcomes']
    )

    stack_chips = ''.join(
        f'<span class="proj-stack-chip">{esc(s)}</span>'
        for s in proj['stack']
    )

    tag_chips = ''.join(
        f'<span class="proj-stack-chip">{esc(t)}</span>'
        for t in proj['tags']
    )

    compliance_block = ''
    if proj.get('compliance'):
        chips = ''.join(
            f'<span class="proj-compliance-chip">{esc(c)}</span>'
            for c in proj['compliance']
        )
        compliance_block = (
            '<div class="proj-sidebar-block">'
            '<h3 class="proj-sidebar-title">Compliance</h3>'
            f'<div class="proj-compliance-chips">{chips}</div>'
            '</div>'
        )

    lessons_section = ''
    if proj.get('lessons'):
        lessons_section = (
            '<section class="proj-section proj-section--lessons">'
            '<h2 class="proj-section-title">Lessons Learned</h2>'
            f'<p class="proj-section-body">{esc(proj["lessons"])}</p>'
            '</section>'
        )

    featured_badge = '<span class="proj-featured">Featured</span>' if proj.get('featured') else ''

    article_tags = '\n'.join(
        f'<meta property="article:tag" content="{esc(t)}"/>' for t in proj['tags'][:6]
    )

    status_labels = {
        'completed': 'Completed',
        'ongoing': 'Ongoing',
        'in-progress': 'In Progress',
    }
    status_label = status_labels.get(proj['status'], proj['status'].capitalize())

    # Related cards
    related = render_related(proj, registry['projects'])
    related_cards = ''.join(
        f'''<a class="proj-related-card" href="{esc(r["slug"])}.html">
          <span class="proj-related-cat">{esc(r["category"])}</span>
          <h3 class="proj-related-t">{esc(r["title"])}</h3>
          <p class="proj-related-s">{esc(r["summary"][:140] + ("..." if len(r["summary"]) > 140 else ""))}</p>
        </a>'''
        for r in related
    )

    # JSON-LD
    ld = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": title,
        "description": proj['summary'],
        "datePublished": proj['date'],
        "dateModified": proj.get('updated') or proj['date'],
        "author": {"@type": "Person", "name": "Sean Welding", "url": "https://seanwelding.com"},
        "publisher": {"@type": "Person", "name": "Sean Welding"},
        "mainEntityOfPage": f"https://seanwelding.com/projects/{slug}.html",
        "url": f"https://seanwelding.com/projects/{slug}.html",
        "image": "https://seanwelding.com/og-image.png",
        "keywords": ", ".join(proj['tags']),
        "articleSection": proj['category'],
        "about": [{"@type": "SoftwareApplication", "name": s} for s in proj['stack']],
    }

    return PAGE.format(
        slug=esc(slug),
        title=esc(title),
        og_title=esc(title) + ' | Sean Welding',
        description=esc(description),
        date=esc(proj['date']),
        date_long=esc(fmt_date(proj['date'])),
        category=esc(proj['category']),
        scope=esc(proj['scope']),
        duration=esc(proj['duration']),
        status=esc(proj['status']),
        status_label=esc(status_label),
        summary=esc(proj['summary']),
        problem=esc(proj['problem']),
        approach_items=approach_items,
        outcomes=outcomes,
        stack_chips=stack_chips,
        tag_chips=tag_chips,
        compliance_block=compliance_block,
        lessons_section=lessons_section,
        featured_badge=featured_badge,
        article_tags=article_tags,
        ld_json=json.dumps(ld, indent=2),
        related_cards=related_cards,
    )


def main():
    registry = json.load(open(REG))
    written = 0
    for project_summary in registry['projects']:
        slug = project_summary['slug']
        full = json.load(open(ENTR / f'{slug}.json'))
        page = render_one(full, registry)
        out_path = OUT / f'{slug}.html'
        out_path.write_text(page, encoding='utf-8')
        written += 1
    print(f'Generated {written} project pages in {OUT}')


if __name__ == '__main__':
    main()
