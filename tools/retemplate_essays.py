#!/usr/bin/env python3
"""One-time migration: re-wrap the 14 essays in the new site chrome.

Extracts the head metadata, essay header, body, end-note, and related cards
from each existing essays/*.html, then rewrites the file with the new
template. Body content is preserved verbatim apart from link path fixes and
heading IDs for the table of contents.

Also writes essays/index.json (metadata registry used by writings.html).

Run from repo root: python3 tools/retemplate_essays.py
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ESSAYS = ROOT / 'essays'

sys.path.insert(0, str(ROOT / 'projects'))
from _build import THEME_SCRIPT, FAVICON, HEADER, PALETTE, FOOTER  # noqa: E402


def balanced_div(text, start_pat):
    """Return inner HTML of the first div matching start_pat (balanced)."""
    m = re.search(start_pat, text)
    if not m:
        return None
    i = m.end()
    depth = 1
    for tag in re.finditer(r'<div\b|</div>', text[i:]):
        depth += 1 if tag.group(0).startswith('<div') else -1
        if depth == 0:
            return text[i:i + tag.start()]
    return None


def slugify(s):
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'section'


def fix_links(body):
    body = body.replace('href="../index.html#engagement"', 'href="/hire.html"')
    body = body.replace('href="../index.html"', 'href="/"')
    body = re.sub(r'href="\.\./([a-z0-9./-]+)"', r'href="/\1"', body)
    # bare essay-to-essay links
    body = re.sub(r'href="(?!https?:|/|#|mailto:)([a-z0-9-]+\.html)', r'href="/essays/\1', body)
    return body


PAGE = '''<!DOCTYPE html>
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
<meta property="og:url" content="https://seanwelding.com/essays/{fname}"/>
<meta property="og:site_name" content="Sean Welding"/>
<meta property="og:image" content="https://seanwelding.com/og-image.png"/>
<meta property="article:author" content="Sean Welding"/>
<meta property="article:published_time" content="{published}"/>
<meta property="article:section" content="{section}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title}"/>
<meta name="twitter:description" content="{description}"/>
<meta name="twitter:image" content="https://seanwelding.com/og-image.png"/>

<link rel="canonical" href="https://seanwelding.com/essays/{fname}"/>
<link rel="sitemap" type="application/xml" href="/sitemap.xml"/>

<script type="application/ld+json">{jsonld}</script>

<link rel="stylesheet" href="/css/site.css"/>
<script src="/js/site.js" defer></script>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>
<div class="progress-bar" aria-hidden="true"></div>

{header}

<main id="main">
  <article class="wrap">
    <header class="essay-header">
      <p class="crumbs"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/writings.html">Writing</a> <span aria-hidden="true">/</span> <span>{section}</span></p>
      <h1>{title}</h1>
      <p class="deck">{deck}</p>
      <p class="meta-row">{meta_row}</p>
    </header>

    <div class="essay-layout">
      <div>
        <div class="essay-body">
{body}
        </div>

        <footer class="essay-foot">
{endnote}
          <div class="hero__cta" style="margin-top:var(--space-4)">
{cta}
          </div>
        </footer>
      </div>

      <nav class="essay-toc" aria-label="Table of contents">
        <h2>On this page</h2>
        <ul>
{toc}
        </ul>
      </nav>
    </div>

    <section class="section" aria-labelledby="related-title" style="margin-top:var(--space-6)">
      <div class="section__head">
        <div>
          <p class="section__index">Keep reading</p>
          <h2 class="section__title" id="related-title" style="font-size:var(--text-xl)">Related essays</h2>
        </div>
        <a class="section__link" href="/writings.html">All essays</a>
      </div>
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


def get(pattern, text, default=''):
    m = re.search(pattern, text, re.S)
    return m.group(1).strip() if m else default


def migrate(path):
    src = path.read_text(encoding='utf-8')

    title = get(r'<h1 class="essay-title">(.*?)</h1>', src) or get(r'<title>(.*?)(?: \| Sean Welding)?</title>', src)
    deck = get(r'<p class="essay-deck">(.*?)</p>', src)
    description = html.unescape(get(r'<meta name="description" content="(.*?)"', src))
    published = get(r'article:published_time" content="(.*?)"', src)
    section = get(r'article:section" content="(.*?)"', src, 'Field Notes')
    eyebrow = get(r'<p class="essay-eyebrow">(.*?)</p>', src)
    audience = get(r'<span class="essay-meta-aud">(.*?)</span>', src)
    meta_items = re.findall(r'<span class="essay-meta-item">(.*?)</span>', src, re.S)
    meta_texts = [re.sub(r'<[^>]+>', '', m).strip() for m in meta_items]
    jsonld = get(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', src)

    body = balanced_div(src, r'<div class="essay-body">')
    if body is None:
        raise SystemExit('no essay-body in %s' % path.name)
    body = fix_links(body.strip())

    # heading ids + toc
    toc = []

    def add_id(m):
        text = m.group(1)
        hid = slugify(text)
        n = 2
        base = hid
        while any(t[0] == hid for t in toc):
            hid = '%s-%d' % (base, n)
            n += 1
        toc.append((hid, re.sub(r'<[^>]+>', '', text)))
        return '<h2 id="%s">%s</h2>' % (hid, text)

    body = re.sub(r'<h2>(.*?)</h2>', add_id, body, flags=re.S)
    toc_html = '\n'.join('          <li><a href="#%s">%s</a></li>' % (hid, t) for hid, t in toc)

    # end note + ctas
    end = balanced_div(src, r'<div class="essay-end">')
    endnote = ''
    ctas = []
    if end:
        note = get(r'^\s*<p>(.*?)</p>', end)
        if note:
            endnote = '          <p class="sig">%s</p>' % note
        for cls, href, label in re.findall(r'<a class="(btn[^"]*)" href="([^"]+)">(.*?)</a>', end, re.S):
            href = fix_links('href="%s"' % href)[6:-1]
            new_cls = 'btn' if cls == 'btn' else 'btn btn--ghost'
            ctas.append('            <a class="%s" href="%s">%s</a>' % (new_cls, href, label.strip()))
    cta_html = '\n'.join(ctas) if ctas else '            <a class="btn" href="mailto:sean.welding@email.com">Email Sean</a>'

    # related cards
    related = []
    for card in re.finditer(
            r'<a class="essay-related-card" href="([^"]+)">\s*'
            r'<span class="essay-related-aud">(.*?)</span>\s*'
            r'<h3 class="essay-related-h">(.*?)</h3>\s*'
            r'<p class="essay-related-d">(.*?)</p>', src, re.S):
        href, aud, h, d = card.groups()
        href = fix_links('href="%s"' % href)[6:-1]
        related.append(
            '        <a class="card" href="%s" data-reveal>\n'
            '          <span class="card__meta"><span class="tag label-accent">%s</span></span>\n'
            '          <h3>%s</h3>\n          <p>%s</p>\n        </a>' % (href, aud.strip(), h.strip(), d.strip()))

    meta_bits = []
    if audience:
        meta_bits.append('<span class="aud">%s</span>' % audience)
    meta_bits += ['<span>%s</span>' % html.escape(t, quote=False) for t in meta_texts]

    out = PAGE.format(
        theme_script=THEME_SCRIPT,
        favicon=FAVICON,
        header=HEADER.format(cur_work=''),
        palette=PALETTE,
        footer=FOOTER,
        title=title,
        description=html.escape(description, quote=True),
        fname=path.name,
        published=published,
        section=section,
        jsonld=jsonld or '{}',
        deck=deck,
        meta_row=' <span aria-hidden="true">·</span> '.join(meta_bits),
        body=body,
        endnote=endnote,
        cta=cta_html,
        toc=toc_html,
        related='\n'.join(related),
    )
    path.write_text(out, encoding='utf-8')

    read_time = next((t for t in meta_texts if 'min' in t), '')
    return {
        'file': path.name,
        'title': html.unescape(title),
        'deck': html.unescape(re.sub(r'<[^>]+>', '', deck)),
        'section': section,
        'audience': audience,
        'published': published,
        'read': read_time,
    }


def main():
    registry = []
    for path in sorted(ESSAYS.glob('*.html')):
        meta = migrate(path)
        registry.append(meta)
        print('rewrote essays/%s' % path.name)
    registry.sort(key=lambda e: e['published'], reverse=True)
    (ESSAYS / 'index.json').write_text(
        json.dumps(registry, ensure_ascii=False, indent=1), encoding='utf-8')
    print('wrote essays/index.json (%d essays)' % len(registry))


if __name__ == '__main__':
    main()
