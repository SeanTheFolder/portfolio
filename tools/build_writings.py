#!/usr/bin/env python3
"""Generate writings.html from essays/index.json.

Run from repo root: python3 tools/build_writings.py
"""
import html
import json
import pathlib
import sys
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent

sys.path.insert(0, str(ROOT / 'projects'))
from _build import THEME_SCRIPT, FAVICON, HEADER, PALETTE, FOOTER  # noqa: E402

FEATURED = 'cis-controls-v8-six-month-build.html'

PAGE = '''<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
{theme_script}

<title>Writing: Field Essays | Sean Welding</title>
<meta name="description" content="Fourteen field essays from active healthcare CISO practice: board reporting, CIS Controls v8, AI governance, OCR audits, 42 CFR Part 2, hiring, retention, and multi-LLM strategy."/>
<meta name="author" content="Sean Welding"/>
<meta name="robots" content="index, follow"/>
<meta name="theme-color" content="#f6f3ed"/>
{favicon}

<meta property="og:title" content="Writing: Field Essays | Sean Welding"/>
<meta property="og:description" content="Fourteen field essays from active healthcare CISO practice. Every essay backed by a working template, requestable by reply."/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://seanwelding.com/writings.html"/>
<meta property="og:site_name" content="Sean Welding"/>
<meta property="og:image" content="https://seanwelding.com/og-image.png"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:image" content="https://seanwelding.com/og-image.png"/>

<link rel="canonical" href="https://seanwelding.com/writings.html"/>
<link rel="alternate" type="application/rss+xml" title="Sean Welding: Essays" href="/feed.xml"/>
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
      <p class="label label-accent">Writing</p>
      <h1>Field essays from active practice.</h1>
      <p class="page-hero__deck">Fourteen essays written from inside the work, not about it: board reporting,
        compliance program builds, AI governance, hiring, and the regulatory stack of US healthcare.
        Every essay is backed by a working template, and <a href="/library.html">the Working Library</a>
        indexes all of them, requestable by a one-line email. Updated when there is something worth
        adding, not on a schedule.</p>
    </header>

    <section aria-labelledby="featured-title">
      <div class="section__head">
        <div>
          <p class="section__index">The long form</p>
          <h2 class="section__title" id="featured-title" style="font-size:var(--text-xl)">Start here</h2>
        </div>
      </div>
{featured}
    </section>

    <section class="section" aria-labelledby="all-title" style="border-top:0;padding-top:var(--space-5);margin-top:var(--space-3)">
      <div class="section__head">
        <div>
          <p class="section__index">All essays</p>
          <h2 class="section__title" id="all-title" style="font-size:var(--text-xl)">Newest first</h2>
        </div>
        <a class="section__link" href="/feed.xml">RSS feed</a>
      </div>
      <ol class="ledger">
{rows}
      </ol>
    </section>

    <section class="section" aria-labelledby="dev-title">
      <div class="section__head">
        <div>
          <p class="section__index">In development</p>
          <h2 class="section__title" id="dev-title" style="font-size:var(--text-xl)">What’s coming</h2>
        </div>
      </div>
      <div class="card" style="max-width:46rem">
        <span class="card__meta"><span class="tag label-accent">Field Notes · HITRUST</span><span class="tag">Idea stage</span></span>
        <h3>HITRUST After CIS v8: When the Certification Is Worth It</h3>
        <p>A CIS Controls v8 program with a HIPAA crosswalk gets an organization most of the way to a
          defensible posture. The question is whether to spend the next year, and the budget, on a
          HITRUST CSF certification on top of it. Field notes on what HITRUST actually adds, and how to
          architect the CIS program from day one so certification becomes an evidence-collection
          exercise rather than a second program build.</p>
      </div>
    </section>

    <section class="contact-band" aria-labelledby="cta-title" style="margin-top:var(--space-6)">
      <h2 id="cta-title" style="font-size:var(--text-xl)">Every essay ships with its artifact.</h2>
      <p>Crosswalks, dashboards, interview rubrics, governance packs. Used in real engagements,
        sent by reply, free, no signup.</p>
      <div class="hero__cta">
        <a class="btn" href="/library.html">Browse the Working Library</a>
      </div>
    </section>
  </div>
</main>

{palette}

{footer}

</body>
</html>
'''


def fmt_date(iso):
    try:
        return datetime.strptime(iso, '%Y-%m-%d').strftime('%b %Y')
    except (ValueError, TypeError):
        return iso or ''


def main():
    essays = json.loads((ROOT / 'essays' / 'index.json').read_text(encoding='utf-8'))

    feat = next(e for e in essays if e['file'] == FEATURED)
    featured = (
        '      <a class="card" href="/essays/{f}" data-reveal style="padding:var(--space-5)">\n'
        '        <span class="card__meta"><span class="tag label-accent">{sec}</span>'
        '<span class="tag">{read}</span><span class="tag">{date}</span></span>\n'
        '        <h3 style="font-size:var(--text-lg);max-width:30ch">{title}</h3>\n'
        '        <p style="max-width:60ch">{deck}</p>\n'
        '      </a>').format(
        f=feat['file'], sec=feat['section'], read=feat['read'], date=fmt_date(feat['published']),
        title=html.escape(feat['title'], quote=False), deck=html.escape(feat['deck'], quote=False))

    rows = []
    for i, e in enumerate(essays, 1):
        rows.append(
            ('        <li data-reveal><a class="ledger__row" href="/essays/{f}">\n'
             '          <span class="ledger__num">{num:02d}</span>\n'
             '          <span><span class="ledger__title">{title}</span>\n'
             '          <span class="ledger__sub">{deck}</span></span>\n'
             '          <span class="ledger__meta">{date} · {read}</span></a></li>').format(
                f=e['file'], num=i,
                title=html.escape(e['title'], quote=False),
                deck=html.escape(' '.join(e['deck'].split('. ')[:2]).rstrip('.') + '.', quote=False),
                date=fmt_date(e['published']),
                read=e['read'].replace('~', '').replace(' read', '')))

    out = PAGE.format(
        theme_script=THEME_SCRIPT, favicon=FAVICON,
        header=HEADER.format(cur_work=''), palette=PALETTE, footer=FOOTER,
        featured=featured, rows='\n'.join(rows))
    out = out.replace('<a href="/writings.html">Writing</a>', '<a href="/writings.html" aria-current="page">Writing</a>', 1)
    (ROOT / 'writings.html').write_text(out, encoding='utf-8')
    print('wrote writings.html')


if __name__ == '__main__':
    main()
