#!/usr/bin/env python3
"""홈페이지에 적힌 품목·브랜드·사진 수가 카탈로그 마스터와 같은지 확인한다.

    python3 tools/check_counts.py [--cards 1433]

- assets/brand-counts.js 가 카탈로그와 같은지(다르면 `tools/build_brand_counts.py` 재생성)
- products.html 의 data-ssot 기본값(items·brands·photos)과 브랜드 카드 품목 수
- products.html·index.html 의 메타·구조화 데이터에 남은 숫자
- index.html 의 '협력 브랜드·거래처 41곳' 자리와 script.js BRANDS 개수
종료 코드 0이면 모두 일치.
"""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, 'assets', 'catalog.js')
PRODUCTS = os.path.join(ROOT, 'products.html')
INDEX = os.path.join(ROOT, 'index.html')
SCRIPT = os.path.join(ROOT, 'script.js')
BRANDCOUNTS = os.path.join(ROOT, 'assets', 'brand-counts.js')


def read(path):
    return open(path, encoding='utf-8').read()


def catalog_counts():
    raw = read(CATALOG)
    body = raw[raw.index('window.GC_CATALOG = ') + len('window.GC_CATALOG = '):].rstrip()
    data = json.loads(body.rstrip(';'))
    items = data['products']
    brands = Counter(p['b'] for p in items)
    photos = len({p['img'] for p in items if p.get('img')})
    return len(items), len(brands), photos, brands


def main():
    problems = []
    items, brands, photos, per_brand = catalog_counts()

    want = {'items': items, 'brands': brands, 'photos': photos}
    for k, v in want.items():
        for m in re.finditer(r'data-ssot="%s"[^>]*>([\d,]+)<' % k, read(PRODUCTS)):
            if int(m.group(1).replace(',', '')) != v:
                problems.append('products.html data-ssot=%s 기본값 %s ≠ %d' % (k, m.group(1), v))

    for m in re.finditer(r'data-bcount="([^"]+)">([\d,]+)품목<', read(PRODUCTS)):
        name, n = m.group(1), int(m.group(2).replace(',', ''))
        if per_brand.get(name, 0) != n:
            problems.append('brand card %s: %s품목 ≠ %d' % (name, n, per_brand.get(name, 0)))

    bc = read(BRANDCOUNTS)
    data = json.loads(bc[bc.index('{'):].rstrip().rstrip(';'))
    if data['items'] != items or data['brands'] != brands or dict(data['counts']) != dict(per_brand):
        problems.append('assets/brand-counts.js 가 카탈로그와 다름 — tools/build_brand_counts.py 재실행')

    jsonld = re.search(r'"numberOfItems":\s*(\d+)', read(PRODUCTS))
    if jsonld and int(jsonld.group(1)) != items:
        problems.append('products.html 구조화 데이터 numberOfItems %s ≠ %d' % (jsonld.group(1), items))

    script = read(SCRIPT)
    brands_block = script[script.index('var BRANDS = ['):script.index('/* 분류별 브랜드 수')]
    entries = re.findall(r"name: '([^']+)'", brands_block)
    partner = len([n for n in entries if n not in ('그랑쉐프', '그랜드쿡')])
    for m in re.finditer(r'data-brand-dir="partner">(\d+)<', read(INDEX)):
        if int(m.group(1)) != partner:
            problems.append('index.html 협력 브랜드 %s ≠ %d (script.js BRANDS)' % (m.group(1), partner))
    for m in re.finditer(r"data-filter=\"all\" aria-pressed=\"true\">전체 <b>(\d+)</b>", read(INDEX)):
        if int(m.group(1)) != len(entries):
            problems.append('index.html 전체 브랜드 %s ≠ %d' % (m.group(1), len(entries)))

    cards = None
    if '--cards' in sys.argv:
        cards = int(sys.argv[sys.argv.index('--cards') + 1])
    print('카탈로그: 품목 %d · 브랜드/공급사 %d · 실사진 %d컷 · 브랜드 안내 %d곳(자체 2 + 협력 %d)'
          % (items, brands, photos, len(entries), partner))
    if cards:
        print('대표 카드: %d (실행 화면 기준)' % cards)
    if problems:
        print('\n불일치 %d건:' % len(problems))
        for p in problems:
            print('  - ' + p)
        return 1
    print('표기 수치 모두 일치')
    return 0


if __name__ == '__main__':
    sys.exit(main())
