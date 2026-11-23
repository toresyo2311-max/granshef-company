#!/usr/bin/env python3
"""취급상품 화면 검증 — assets/catalog.js 와 실제 사진 파일, 공개 금지 정보.

사용: python3 tools/verify_products.py
- 카탈로그 품목 수·대표 카드 수(사이즈·규격 묶음) 요약
- img 로 연결된 실제 제품 사진이 모두 저장소에 있는지 확인
- 가격·원가·마진·수수료·최소발주 등 비공개 정보가 들어 있지 않은지 확인
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(ROOT, 'assets', 'catalog.js')

# 공개 금지 필드·표현
FORBIDDEN_FIELDS = ('price', 'cost', 'margin', 'fee', 'moq', 'supply', 'buy')
FORBIDDEN_TEXT = ('원가', '매입가', '판매가', '공급가', '마진', '수수료', '최소발주')
# '재단가위' 같은 품목명은 '단가'가 아니다
FORBIDDEN_RE = (r'(?<!재)단가',)


def main():
    src = open(CATALOG, encoding='utf-8').read()
    data = json.loads(src[src.index('{', src.index('window.GC_CATALOG')):src.rindex('}') + 1])
    products = data['products']
    ok = True

    # 1) 사진 파일
    missing = []
    photos = 0
    for p in products:
        img = p.get('img')
        if not img:
            continue
        photos += 1
        if not os.path.isfile(os.path.join(ROOT, img)):
            missing.append(img)
    if missing:
        ok = False
        print('사진 파일 없음 %d건: %s' % (len(missing), missing[:5]))

    # 2) 비공개 정보
    for p in products:
        for k in p:
            if k.lower() in FORBIDDEN_FIELDS:
                ok = False
                print('비공개 필드 발견: %r (%s)' % (k, p.get('n')))

    # 카탈로그 주석을 뺀 데이터 부분만 검사
    body = src[src.index('window.GC_CATALOG'):]
    for word in FORBIDDEN_TEXT:
        if word in body:
            ok = False
            print('비공개 표현 발견: %s' % word)
    for pat in FORBIDDEN_RE:
        hit = re.search(pat, body)
        if hit:
            ok = False
            print('비공개 표현 발견: %s (%s)' % (pat, body[max(0, hit.start() - 12):hit.end() + 8]))
    if re.search(r'\d[\d,]*\s*원', body):
        ok = False
        print('금액 표기 발견: %s' % re.findall(r'\d[\d,]*\s*원', body)[:3])

    # 3) 요약
    print('품목 %d개 · 브랜드 %d곳 · 분류 %d개 · 실제 제품 사진 %d건' % (
        len(products), len({p['b'] for p in products}), len(data['categories']), photos))
    brands = {}
    for p in products:
        brands[p['b']] = brands.get(p['b'], 0) + 1
    print('품목 수 상위 5개 브랜드:', sorted(brands.items(), key=lambda x: -x[1])[:5])
    print('검증 결과:', 'OK' if ok else '확인 필요')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
