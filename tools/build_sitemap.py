#!/usr/bin/env python3
"""Generate sitemap.xml from the page set on disk.

Run from repo root: python3 tools/build_sitemap.py
"""
import json
import pathlib
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://seanwelding.com'
TODAY = date.today().isoformat()

CORE = [
    ('/', 'weekly', '1.0'),
    ('/projects.html', 'weekly', '0.9'),
    ('/hire.html', 'monthly', '0.9'),
    ('/writings.html', 'weekly', '0.8'),
    ('/library.html', 'monthly', '0.8'),
    ('/philosophy.html', 'monthly', '0.7'),
    ('/resume.html', 'monthly', '0.7'),
    ('/now.html', 'monthly', '0.6'),
    ('/privacy.html', 'yearly', '0.2'),
]


def url(loc, lastmod, changefreq, priority):
    return ('  <url>\n'
            '    <loc>%s%s</loc>\n'
            '    <lastmod>%s</lastmod>\n'
            '    <changefreq>%s</changefreq>\n'
            '    <priority>%s</priority>\n'
            '  </url>' % (BASE, loc, lastmod, changefreq, priority))


def main():
    rows = [url(loc, TODAY, cf, pr) for loc, cf, pr in CORE]

    reg = json.loads((ROOT / 'projects' / 'index.json').read_text(encoding='utf-8'))
    for p in sorted(reg['projects'], key=lambda x: x.get('date', ''), reverse=True):
        rows.append(url('/projects/%s.html' % p['slug'], TODAY, 'monthly', '0.6'))

    essays = json.loads((ROOT / 'essays' / 'index.json').read_text(encoding='utf-8'))
    for e in essays:
        rows.append(url('/essays/%s' % e['file'], e.get('published') or TODAY, 'monthly', '0.7'))

    out = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + '\n'.join(rows) + '\n</urlset>\n')
    (ROOT / 'sitemap.xml').write_text(out, encoding='utf-8')
    print('wrote sitemap.xml (%d urls)' % len(rows))


if __name__ == '__main__':
    main()
