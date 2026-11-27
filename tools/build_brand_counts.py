#!/usr/bin/env python3
"""카탈로그 마스터(assets/catalog.js)에서 브랜드·거래처별 품목 수를 뽑아 assets/brand-counts.js를 만든다.

홈페이지(index.html)는 447KB 카탈로그를 통째로 받지 않고 이 1KB 파일만 받아
브랜드별 품목 수를 보여 준다. 카탈로그를 고친 뒤에는 반드시 한 번 실행한다.

    python3 tools/build_brand_counts.py          # 생성
    python3 tools/build_brand_counts.py --check  # 현재 파일이 카탈로그와 같은지 확인만
"""
import json
import os
import sys
from collections import OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, 'assets', 'catalog.js')
OUT = os.path.join(ROOT, 'assets', 'brand-counts.js')
HEAD = 'window.GC_CATALOG = '


def load():
    raw = open(CATALOG, encoding='utf-8').read()
    body = raw[raw.index(HEAD) + len(HEAD):].rstrip()
    if body.endswith(';'):
        body = body[:-1]
    return json.loads(body)


def build(data):
    counts = OrderedDict()
    for p in data['products']:
        counts[p['b']] = counts.get(p['b'], 0) + 1
    counts = OrderedDict(sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])))
    payload = OrderedDict([('items', len(data['products'])), ('brands', len(counts)), ('counts', counts)])
    return payload


def render(payload):
    return ('/* 자동 생성 파일 — 직접 고치지 말고 `python3 tools/build_brand_counts.py`로 다시 만든다.\n'
            '   원본: assets/catalog.js (카탈로그 마스터) → 브랜드·거래처별 품목 수 */\n'
            'window.GC_BRAND_COUNTS = ' +
            json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n')


def main():
    payload = build(load())
    text = render(payload)
    if '--check' in sys.argv:
        cur = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        ok = cur == text
        print('일치' if ok else '불일치 — 다시 생성 필요')
        return 0 if ok else 2
    open(OUT, 'w', encoding='utf-8').write(text)
    print('브랜드 %d곳 · 품목 %d개 → %s' % (payload['brands'], payload['items'], os.path.relpath(OUT, ROOT)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
