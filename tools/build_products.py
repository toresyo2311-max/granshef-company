#!/usr/bin/env python3
"""취급상품 요약 페이지(products.html) 생성 스크립트.

2026-11-23 사내 상품목록(1,660품목)을 전부 나열하지 않고, 브랜드별 주력 품목과
분류별 대표 품목만 골라 정적 페이지로 만든다. 거래처명·판매가는 쓰지 않는다.

입력:  이전 버전 assets/catalog.js (전체 품목) — git 이력에서 읽는다.
       `python3 tools/build_products.py --source <catalog.js 경로>`
출력:  products.html
"""
import argparse
import html
import json
import subprocess
import sys

FULL_CATALOG_COMMIT = 'aae4ad4'   # 전체 1,660품목이 들어 있던 마지막 커밋

CATS = [
    ('pot', '냄비·솥', 'cat-01-pot.jpg', '식당용 전골·국솥부터 가정용 양수·편수, 압력솥과 뚝배기까지.'),
    ('pan', '프라이팬·웍', 'cat-02-pan.jpg', '업소용 중국팬·전판·튀김팬과 가정용 IH 프라이팬·궁중팬.'),
    ('kettle', '주전자·보온', 'cat-03-kettle.jpg', '업소용 대용량 주전자와 가정용 휘슬·IH 주전자, 보온병.'),
    ('mug', '머그·컵', 'cat-04-mug.jpg', '머그·텀블러·유리컵·와인잔 등 음료 잔류.'),
    ('plate', '공기·접시', 'cat-05-plate.jpg', '공기·대접·면기·찬기·접시, 멜라민·스텐 식기.'),
    ('cutlery', '수저·젓가락', 'cat-10-cutlery.jpg', '영업용 수저·젓가락과 선물용 수저세트.'),
    ('tool', '조리도구·칼', 'cat-06-tool.jpg', '도마·국자·집게·채칼·식도 등 조리도구와 칼.'),
    ('storage', '밀폐·보관', 'cat-07-storage.jpg', '소스통·양념통·케찹병 등 업소 보관용기와 밀폐용기.'),
    ('living', '생활·주방잡화', 'cat-08-living.jpg', '석쇠·아이스몰드·보온도시락 등 주방 생활용품.'),
    ('pro', '업소용 주방기물', 'pro-01-wok-griddle.jpg', '밧드·계량컵·쟁반·식판·샤쿠시·건지기 등 업소 기물.'),
    ('appliance', '주방가전', 'cat-09-appliance.jpg', '가스렌지·가스점화기·전기주전자 등 주방 소형가전.'),
]

# 주요 브랜드 — (표시 이름, 품목 수, 주력 품목 3줄, 비고)
BRANDS = [
    ('직영 공급', 561,
     ['그릇·머그·유리컵', '수저·젓가락', '조리도구·칼'],
     '브랜드 표기 없이 그랑쉐프가 직접 공급하는 품목입니다. 자체 브랜드 그랑쉐프·그랜드쿡과 함께 취급합니다.'),
    ('TOSCO', 178,
     ['업소용 전골·국솥·매운탕냄비', '중국팬·전판·튀김솥', '경질 라면냄비·뚝배기'],
     '유진토스코의 업소용 경질·코팅 조리기물입니다. 부울경 식당·급식소 납품이 많은 라인입니다.'),
    ('키친플라워', 102,
     ['업소용 압력솥(15·20인용)', 'IH 세라믹·프리미엄 스텐 냄비', '주전자·찜냄비·뚝배기'],
     '남양키친플라워의 냄비·주전자 라인입니다. 업소용 압력솥과 대용량 주전자가 주력입니다.'),
    ('동복무역', 74,
     ['업소용 스텐 트레이·건지기', '볶음스푼·소스볼·이중볼', '로즈 냄비·우동조리'],
     '업소용 스테인리스 식기와 조리도구를 공급하는 거래처입니다.'),
    ('키친아트', 55,
     ['IH 루나·쿠킹파파 프라이팬', '주물팬·쥬노블랙 냄비', '보온도시락·보온병'],
     '키친아트 냄비·프라이팬과 보온용품을 취급합니다.'),
    ('페나테스', 52,
     ['수저·티스푼·티포크 세트', '국자·집게·찜기', '채칼·가위·오프너'],
     '수저와 주방 소도구를 공급하는 거래처입니다.'),
    ('대원경금속', 51,
     ['양은냄비·양은편수·들통', '새마을냄비·찜솥', '황주전자'],
     '대구 대원경금속의 알루미늄·양은 조리기물입니다. 업소용 대형 규격이 많습니다.'),
    ('키친프리', 49,
     ['스텐 이중찬기·이중공기·이중탕기', '멜라민 접시·볼·앞접시', '인덕션 소테팬'],
     '업소·가정용 스테인리스·멜라민 식기를 공급하는 거래처입니다.'),
    ('퀸센스', 45,
     ['벨라·데이세븐 IH 냄비', '멀티팬·그리들·스팀쿠커', '하모니·데이 주전자'],
     '퀸센스(세신) IH 냄비와 멀티팬, 주전자 라인입니다.'),
    ('진성울트라', 40,
     ['PC 계량컵', '건지기·뜰채·채망', '양념식판·쟁반·간식판'],
     '업소용 주방기물을 만드는 거래처입니다. 급식·분식 조리기물이 주력입니다.'),
    ('리빙코리아', 38,
     ['식도·과도·채칼', '국자·뒤지게·거품기', '주방가위·칼갈이·오프너'],
     '칼·가위·조리 소도구를 공급하는 거래처입니다.'),
    ('이라이프', 37,
     ['채반·채망·타공 바구니', '야채·양수·원형 바구니', '씽크대 배수구망'],
     '업소용 채반과 바구니를 공급하는 거래처입니다.'),
    ('화영', 35,
     ['업소용 멀티볼', '샤쿠시·잔디발', '목판·범랑 식기'],
     '인천 화영의 업소용 식기·목판 라인입니다.'),
    ('대명멜라민', 34,
     ['멜라민 신타원접시·민타원접시', '팝콘초록 공기·찬기·굽볼', '사각 종지·나눔 접시'],
     '멜라민 식기를 만드는 거래처입니다. 급식·식당 배식용이 주력입니다.'),
    ('세호', 34,
     ['PC 밧드(1/2~1/9)·밧드커버', '스텐 풀밧드', '밧드카바'],
     'PC·스텐 밧드를 공급하는 거래처입니다.'),
    ('해피콜', 33,
     ['IH 루시드·포셀 프라이팬', '통3중 인덕션 냄비·곰솥', '실리콘 조리도구·가위'],
     '해피콜 프라이팬·냄비와 실리콘 조리도구를 취급합니다.'),
]

# 대표 품목 — (브랜드, 원본 상품명, 표시 이름, 규격 표기)
PICKS = {
    'pot': [
        ('키친플라워', '업소용압력솥20인용', '업소용 압력솥', '20인용'),
        ('TOSCO', '경질전골30cm', '경질 전골냄비', '30cm'),
        ('TOSCO', '경질국솥36cm', '경질 국솥', '36cm'),
        ('TOSCO', '깨지지않는뚝배기16cm', '깨지지 않는 뚝배기', '16cm'),
        ('키친아트', 'IH키친아트몬트24양수', 'IH 몬트 양수냄비', '24cm'),
        ('퀸센스', '퀸센스 벨라IH양수(24)', '벨라 IH 양수냄비', '24cm'),
        ('대원경금속', '대원새마을냄비-30cm', '새마을냄비', '30cm'),
        ('해피콜', '통3중 인덕션 양손냄비 20cm', '통3중 인덕션 양손냄비', '20cm'),
        ('직영 공급', 'IH모노포트양수-24cm', 'IH 모노포트 양수냄비', '24cm'),
    ],
    'pan': [
        ('TOSCO', '토스코 코팅중국팬36cm', '코팅 중국팬', '36cm'),
        ('TOSCO', '경질사각전판대', '경질 사각전판', '대'),
        ('TOSCO', '토스코 베이직웍32cm', '베이직 웍', '32cm'),
        ('해피콜', '해피콜IH루시드후라이팬28cm', 'IH 루시드 프라이팬', '28cm'),
        ('키친아트', '키친아트다이아몬드후라이팬-32', '다이아몬드 프라이팬', '32cm'),
        ('키친플라워', '그리들팬-36cm', '그리들팬', '36cm'),
        ('대원경금속', '대원궁중팬-30cm', '궁중팬', '30cm'),
        ('직영 공급', '마블후라이팬-28cm', '마블 프라이팬', '28cm'),
        ('키친프리', '인덕션소테팬24cm', '인덕션 소테팬', '24cm'),
    ],
    'kettle': [
        ('키친플라워', '남양 뉴하모니카 주전자 5.0L', '뉴하모니카 주전자', '5.0L'),
        ('키친플라워', '스텐휘슬주전자1.7L', '스텐 휘슬 주전자', '1.7L'),
        ('대원경금속', '황주전자6L', '황주전자', '6L'),
        ('퀸센스', '퀸센스)데이들통형주전자-5L', '데이 들통형 주전자', '5L'),
        ('직영 공급', '데이세븐IH하모니주전자-3.0L', '데이세븐 IH 하모니 주전자', '3.0L'),
        ('키친아트', '뉴옵티마보온병 500', '뉴옵티마 보온병', '500ml'),
    ],
    'mug': [
        ('직영 공급', '골드링머그(화이트)', '골드링 머그', '화이트'),
        ('직영 공급', '두바이골드머그(크리스탈)', '두바이골드 머그', '크리스탈'),
        ('직영 공급', '라떼텀블러-600(블랙)', '라떼 텀블러', '600ml'),
        ('직영 공급', '키아라와인잔2P-350ml', '키아라 와인잔 2P', '350ml'),
        ('직영 공급', 'PC컵5232(투명)350ml', 'PC컵 5232', '350ml'),
        ('직영 공급', '몬트이중유리컵350cm', '몬트 이중유리컵', '350ml'),
        ('직영 공급', '하이볼맥주잔-570', '하이볼 맥주잔', '570ml'),
    ],
    'plate': [
        ('직영 공급', '블랑노아공기', '블랑노아 공기', ''),
        ('직영 공급', '블랑노아면기', '블랑노아 면기', ''),
        ('직영 공급', '모던화이트대접', '모던화이트 대접', ''),
        ('직영 공급', '신굽찬기(3호) A-213', '신굽찬기', '3호'),
        ('대명멜라민', '신타원접시(10) B-610', '신타원접시', '10호'),
        ('키친프리', '스텐이중찬기-3호', '스텐 이중찬기', '3호'),
        ('화영', '멀티볼-중(205*110*460)', '업소용 멀티볼', '중 205×110×460'),
        ('선학', '엔틱공기', '엔틱 공기', ''),
    ],
    'cutlery': [
        ('직영 공급', '영업용수저10P', '영업용 수저', '10P'),
        ('직영 공급', '진공수저(10p)', '진공 수저', '10P'),
        ('직영 공급', '상감티타늄수저', '상감 티타늄 수저', ''),
        ('페나테스', '버들수저', '버들 수저', ''),
        ('직영 공급', '우드(옻칠)수저세트', '우드(옻칠) 수저세트', ''),
        ('직영 공급', '젓가락5P', '젓가락', '5P'),
    ],
    'tool': [
        ('동복무역', '스텐볶음스픈-대', '스텐 볶음스푼', '대'),
        ('페나테스', '부페집게-대', '뷔페 집게', '대'),
        ('리빙코리아', '세프중식도', '세프 중식도', ''),
        ('리빙코리아', '센스국자-대', '센스 국자', '대'),
        ('한성', 'Y감자칼-대', 'Y 감자칼', '대'),
        ('제니얼', '실리콘 깔끔이주걱', '실리콘 주걱', ''),
        ('직영 공급', '나무도마-대37.5*28.5', '나무 도마', '대 37.5×28.5'),
        ('이라이프', '채반3호', '채반', '3호'),
    ],
    'storage': [
        ('직영 공급', '소스통-3호', '소스통', '3호'),
        ('직영 공급', '3구케찹병-대(18oz/400ml)', '3구 케찹병', '대 400ml'),
        ('직영 공급', '양념통-2호', '양념통', '2호'),
        ('직영 공급', '플뢰르밀폐용기-소', '플뢰르 밀폐용기', '소'),
        ('동복무역', '스텐항아리다용도(중)', '스텐 다용도 항아리', '중'),
    ],
    'living': [
        ('직영 공급', '석쇠 대', '석쇠', '대'),
        ('직영 공급', '아이스몰드-24홀', '아이스몰드', '24홀'),
        ('직영 공급', '루앙보온도시락-대', '루앙 보온도시락', '대'),
        ('직영 공급', '뚝배기받침대-중', '뚝배기 받침대', '중'),
        ('직영 공급', '모던 주부저울(2kg)', '주부저울', '2kg'),
        ('동복무역', '스텐설거지통-사각형', '스텐 설거지통', '사각형'),
    ],
    'pro': [
        ('세호', 'PC밧드4인치-1/2', 'PC 밧드', '4인치 1/2'),
        ('세호', 'PC밧드커버-1/2', 'PC 밧드커버', '1/2'),
        ('세호', '풀밧드4.1/2(270*330*100)', '스텐 풀밧드', '270×330×100'),
        ('진성울트라', 'PC계량컵1000ml', 'PC 계량컵', '1,000ml'),
        ('진성울트라', '논슬립페스트푸드쟁반-중', '논슬립 패스트푸드 쟁반', '중'),
        ('진성울트라', '양념식판-4구', '양념식판', '4구'),
        ('화영', '골드샥구-대(145*80*490)', '업소용 샤쿠시', '대 145×80×490'),
        ('동복무역', '양은찜소쿠리-24CM', '양은 찜소쿠리', '24cm'),
        ('TOSCO', '직각민쟁반대(4호)', '직각 민쟁반', '4호'),
    ],
    'appliance': [
        ('직영 공급', '오로라가스점화기', '오로라 가스점화기', ''),
        ('키친플라워', '뉴안심골드가스렌지', '뉴안심골드 가스렌지', ''),
        ('키친플라워', '알파스텐전기주전자-1.5', '알파 스텐 전기주전자', '1.5L'),
    ],
}

# 표시 이름 → 전체 카탈로그의 브랜드 표기
SOURCE_BRAND = {'직영 공급': '직영거래처'}

CAT_LABEL = dict((k, label) for k, label, _, _ in CATS)
CAT_IMG = dict((k, img) for k, _, img, _ in CATS)
# 품목 분류는 전체 카탈로그의 값을 그대로 쓰되, 직영/브랜드 표기가 다른 품목은 여기서 보정한다.
CAT_FIX = {'냄비·솥': 'pot', '프라이팬·웍': 'pan', '주전자·보온': 'kettle'}

TOTAL_ITEMS = 1660          # 실제 취급 목록(사내 상품목록 2026-11-23)
BRAND_TOTAL = 41            # 실품목이 정리된 브랜드·거래처 수

E = html.escape


def load_full(path=None):
    if path:
        src = open(path, encoding='utf-8').read()
    else:
        src = subprocess.check_output(
            ['git', 'show', '%s:assets/catalog.js' % FULL_CATALOG_COMMIT],
            text=True, encoding='utf-8')
    start = src.index('{', src.index('window.GC_CATALOG'))
    end = src.rindex('}')
    return json.loads(src[start:end + 1])


def index_items(data):
    idx = {}
    for p in data['products']:
        idx[(p['b'], p['n'])] = p
    return idx


def image_for(p, cat):
    if p.get('img'):
        return p['img'], 'real'
    if p.get('i'):
        return 'assets/img/items/%s.jpg' % p['i'], 'example'
    return 'assets/products/%s' % CAT_IMG[cat], 'example'


def build_rows(index):
    rows = []
    missing = []
    for cat, _, _, _ in CATS:
        for brand, raw, label, spec in PICKS[cat]:
            p = index.get((SOURCE_BRAND.get(brand, brand), raw))
            if not p:
                missing.append((cat, brand, raw))
                continue
            img, kind = image_for(p, cat)
            rows.append({
                'cat': cat, 'brand': brand, 'name': label, 'spec': spec or '',
                'img': img, 'kind': kind, 'id': p.get('code') or '',
            })
    return rows, missing


def brand_cards():
    out = []
    for name, cnt, lines, note in BRANDS:
        lis = ''.join('<li>%s</li>' % E(x) for x in lines)
        out.append(
            '        <article class="bsum reveal">\n'
            '          <div class="bsum-top">\n'
            '            <h3 class="bsum-name">%s</h3>\n'
            '            <span class="bsum-n">%s품목</span>\n'
            '          </div>\n'
            '          <ul class="bsum-lines">%s</ul>\n'
            '          <p class="bsum-note">%s</p>\n'
            '          <a class="bsum-link text-link" href="index.html#brands">브랜드 안내 보기 <span aria-hidden="true">→</span></a>\n'
            '        </article>' % (E(name), '{:,}'.format(cnt), lis, E(note)))
    return '\n'.join(out)


def row_html(r):
    spec = ('<span class="prow-dot">·</span>' + E(r['spec'])) if r['spec'] else ''
    cap = '실제 제품 사진' if r['kind'] == 'real' else '품목 예시 이미지'
    return (
        '              <article class="prow" data-cat="%(cat)s" data-brand="%(brand)s" data-name="%(name)s"'
        ' data-spec="%(spec)s" data-img="%(img)s" data-kind="%(kind)s">\n'
        '                <button class="prow-media" type="button" aria-label="%(name)s 사진 크게 보기">\n'
        '                  <img src="%(img)s" alt="%(name)s — %(catlabel)s %(cap)s" width="1100" height="1100" loading="lazy" decoding="async">\n'
        '                </button>\n'
        '                <div class="prow-body">\n'
        '                  <p class="prow-meta"><b>%(brand)s</b></p>\n'
        '                  <h4 class="prow-name"><button type="button">%(name)s</button></h4>\n'
        '                  <p class="prow-spec">%(specblock)s</p>\n'
        '                </div>\n'
        '                <button class="prow-add" type="button">+ 견적 담기</button>\n'
        '              </article>' % {
            'cat': r['cat'], 'brand': E(r['brand']), 'name': E(r['name']),
            'spec': E(r['spec']), 'img': r['img'], 'kind': r['kind'],
            'catlabel': E(CAT_LABEL[r['cat']]), 'cap': cap, 'specblock': spec,
        })


def cat_blocks(rows):
    out = []
    for cat, label, img, desc in CATS:
        mine = [r for r in rows if r['cat'] == cat]
        if not mine:
            continue
        body = '\n'.join(row_html(r) for r in mine)
        out.append(
            '          <article class="cat-block reveal" data-block="%s">\n'
            '            <div class="cat-block-head">\n'
            '              <figure class="cat-block-media"><img src="assets/products/%s" alt="%s 예시" width="1100" height="1100" loading="lazy" decoding="async"></figure>\n'
            '              <div class="cat-block-txt">\n'
            '                <h3>%s <span>%d개 품목</span></h3>\n'
            '                <p>%s</p>\n'
            '              </div>\n'
            '            </div>\n'
            '            <div class="prows">\n%s\n            </div>\n'
            '          </article>' % (cat, img, E(label), E(label), len(mine), E(desc), body))
    return '\n'.join(out)


def chips(rows):
    out = ['        <button class="chip is-on" type="button" data-cat="all" aria-pressed="true">전체 <b>%d</b></button>' % len(rows)]
    for cat, label, _, _ in CATS:
        n = len([r for r in rows if r['cat'] == cat])
        if not n:
            continue
        out.append('        <button class="chip" type="button" data-cat="%s" aria-pressed="false">%s <b>%d</b></button>'
                   % (cat, E(label), n))
    return '\n'.join(out)


TEMPLATE = '''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>취급 상품 | 주식회사 그랑쉐프</title>
<meta name="description" content="주식회사 그랑쉐프 취급 상품 요약 — 직영 공급과 토스코·키친플라워·동복무역·키친아트·퀸센스·해피콜 등 주요 브랜드의 주력 품목, 냄비·솥·프라이팬·주전자·식기·조리도구·업소용 기물 11개 분류 대표 품목. 묶음 견적 문의.">
<meta name="theme-color" content="#171614">
<meta property="og:type" content="website">
<meta property="og:site_name" content="주식회사 그랑쉐프">
<meta property="og:title" content="취급 상품 | 주식회사 그랑쉐프">
<meta property="og:description" content="주요 브랜드 {brands}곳 · 대표 품목 {n}개 · 11개 분류 — 부울경 주방용품 유통.">
<meta property="og:url" content="https://grandchef.co.kr/products.html">
<meta property="og:image" content="https://grandchef.co.kr/assets/og-grandchef-cookware.jpg">
<meta property="og:image:secure_url" content="https://grandchef.co.kr/assets/og-grandchef-cookware.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="스테인리스 냄비와 프라이팬 — 그랑쉐프 대표 주방용품">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="취급 상품 | 주식회사 그랑쉐프">
<meta name="twitter:description" content="주요 브랜드와 대표 품목 · 묶음 견적 문의.">
<meta name="twitter:image" content="https://grandchef.co.kr/assets/og-grandchef-cookware.jpg">
<link rel="icon" type="image/png" href="assets/logo.png">
<link rel="apple-touch-icon" href="assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Noto+Serif+KR:wght@300;400;500&display=swap">
<link rel="stylesheet" href="styles.css?v=__CSSV__">
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>

<header class="site-header" id="siteHeader">
  <div class="wrap header-inner">
    <a class="brand" href="index.html#top" aria-label="그랑쉐프 홈으로">
      <span class="brand-mark">
        <img src="assets/logo-lockup.png" alt="그랑쉐프 GRAND CHEF 로고" width="461" height="302" decoding="async">
      </span>
      <span class="brand-txt">
        <strong>주식회사 그랑쉐프</strong>
        <em>GRANDCHEF CO., LTD.</em>
      </span>
    </a>

    <nav class="nav" id="nav" aria-label="주요 메뉴">
      <a href="index.html#about">회사소개</a>
      <a href="index.html#business">사업분야</a>
      <a href="products.html" aria-current="page">취급상품</a>
      <a href="index.html#brands">취급 브랜드</a>
      <a href="index.html#clients">주요 납품처</a>
      <a href="index.html#quality">품질·유통</a>
      <a href="index.html#location">오시는 길</a>
      <a class="nav-cta" href="index.html#contact">B2B 문의</a>
    </nav>

    <button class="burger" id="burger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="nav">
      <span></span><span></span>
    </button>
  </div>
</header>

<main id="main">

  <section class="cat-hero">
    <div class="wrap">
      <p class="kicker">취급상품</p>
      <h1 class="section-title">주요 브랜드 <span class="accent">대표 품목</span></h1>
      <p class="cat-lead">
        그랑쉐프가 실제로 납품하는 주방용품 <strong>{total:,}개</strong> 가운데 브랜드별 주력 품목을 골라 정리했습니다.
        냄비·프라이팬부터 업소용 기물, 그릇·수저까지 열한 개 분류로 나눴고,
        필요한 품목은 담아서 한 번에 견적을 문의하실 수 있습니다.
      </p>

      <div class="sum-stats">
        <div class="sum-stat"><b>{brands}</b><span>주요 브랜드</span></div>
        <div class="sum-stat"><b>{n}</b><span>대표 품목</span></div>
        <div class="sum-stat"><b>11</b><span>분류</span></div>
        <div class="sum-stat"><b>{total:,}</b><span>전체 취급 품목</span></div>
      </div>

      <p class="cat-scope">
        ※ 전체 품목 가운데 대표 품목만 실었습니다. 목록에 없는 품목·규격·모델명은 상담으로 확인해 드리며,
        가격·재고·거래 조건은 표시하지 않습니다.
      </p>
    </div>
  </section>

  <section class="sum-sec" id="brands">
    <div class="wrap">
      <div class="sum-head reveal">
        <p class="kicker"><b>01</b>브랜드</p>
        <h2 class="section-title">취급 품목이 많은 <span class="accent">{brands}개 브랜드</span></h2>
        <p class="sec-lead">
          품목 수는 실제 취급 목록 기준입니다. 브랜드 소개와 공식 홈페이지는
          <a class="text-link" href="index.html#brands">취급 브랜드</a>에서 보실 수 있습니다.
        </p>
      </div>
      <div class="bsum-grid">
{brand_cards}
      </div>
      <p class="grid-note">
        ※ 이 밖에 PN풍년·테팔·로이첸·한성·제니얼·선학·한국도자기 등 {brand_rest}개 브랜드의 품목도 함께 취급합니다.
        자체 브랜드 그랑쉐프·그랜드쿡은 <a class="text-link" href="index.html#brands">취급 브랜드</a>에서 확인하실 수 있습니다.
      </p>
    </div>
  </section>

  <section class="sum-sec" id="items">
    <div class="wrap">
      <div class="sum-head reveal">
        <p class="kicker"><b>02</b>대표 품목</p>
        <h2 class="section-title">분류별 <span class="accent">대표 품목 {n}개</span></h2>
        <p class="sec-lead">
          분류마다 자주 나가는 품목을 골랐습니다. 검색하거나 분류를 눌러 좁혀 보세요.
          담은 품목은 아래 견적 바구니에서 한 번에 문의할 수 있습니다.
        </p>
      </div>

      <div class="cat-tools">
        <div class="cat-search">
          <label class="sr-only" for="q">상품 검색</label>
          <input id="q" type="search" inputmode="search" autocomplete="off"
                 placeholder="품목명 · 브랜드 · 규격 검색 (예: 전골, 밧드, 28cm)"
                 maxlength="40">
          <button class="cat-search-clear" id="qClear" type="button" aria-label="검색어 지우기" hidden>✕</button>
        </div>
        <button class="cat-basket-btn" id="basketOpen" type="button" aria-expanded="false" aria-controls="basket">
          견적 바구니 <span class="cb-n" id="basketCount">0</span>
        </button>
      </div>

      <div class="cat-chips" id="catChips" role="group" aria-label="11개 대분류">
{chips}
      </div>

      <p class="cat-count" id="count" role="status" aria-live="polite"></p>

      <div class="cat-blocks" id="blocks">
{blocks}
      </div>

      <p class="cat-empty" id="empty" hidden>
        조건에 맞는 대표 품목이 없습니다. 검색어를 줄이거나 <a href="index.html#contact">상담으로 문의</a>해 주세요.
      </p>

      <p class="grid-note cat-note">
        ※ 규격·색상·모델에 따라 품목이 더 있습니다. 표기된 규격은 상품명 기준이며, 규격이 없는 품목은 상담으로 확인해 주세요.<br>
        ※ 상품 이미지는 <strong>제조사·유통 카탈로그의 실제 제품 사진</strong> 또는 <strong>품목 예시 이미지</strong>이며 실제 제품과 다를 수 있습니다.
        원가·공급가·거래처 정보는 게시하지 않습니다.
      </p>
    </div>
  </section>

  <section class="cat-help">
    <div class="wrap cat-help-inner">
      <div>
        <h2>찾는 품목이 없으신가요?</h2>
        <p>자체 브랜드 2종(그랑쉐프·그랜드쿡)과 취급 브랜드·거래처 42곳 외에도 수십여 개 협력 제조·유통사와 거래합니다.
           품목·규격·모델명을 알려주시면 취급 가능 여부와 납기를 확인해 드립니다.</p>
      </div>
      <div class="cat-help-actions">
        <a class="btn btn-primary" href="tel:+82518928930">전화 051-892-8930</a>
        <a class="btn btn-ghost" href="index.html#contact">납품·견적 문의</a>
      </div>
    </div>
  </section>

</main>

<aside class="basket" id="basket" aria-label="견적 바구니" hidden>
  <div class="basket-head">
    <h2>견적 바구니 <span class="cb-n" id="basketCount2">0</span></h2>
    <button class="basket-close" id="basketClose" type="button" aria-label="견적 바구니 닫기">✕</button>
  </div>
  <p class="basket-lead">담은 품목을 한 번에 묶어 견적을 문의합니다. 가격은 상담으로 안내됩니다.</p>
  <ul class="basket-list" id="basketList"></ul>
  <p class="basket-empty" id="basketEmpty">담긴 품목이 없습니다. 품목 오른쪽의 <strong>견적 담기</strong>를 눌러 주세요.</p>
  <div class="basket-actions">
    <button class="btn btn-primary btn-block" id="quoteGo" type="button">이 품목들로 묶음 견적 문의</button>
    <button class="btn btn-ghost btn-block" id="basketClear" type="button">바구니 비우기</button>
  </div>
  <p class="basket-note">견적 바구니는 이 브라우저에만 저장되며 회사 서버로 전송되지 않습니다.</p>
</aside>

<dialog class="pdetail" id="pdetail" aria-labelledby="pdName">
  <div class="pdetail-inner">
    <button class="pdetail-close" id="pdClose" type="button" aria-label="상세 닫기">✕</button>
    <div class="pdetail-media">
      <img id="pdImg" src="assets/products/cat-01-pot.jpg" alt="" width="1100" height="1100">
      <p class="pdetail-imgcap" id="pdImgCap">품목 예시 이미지 · 실제 제품과 다를 수 있음</p>
    </div>
    <div class="pdetail-body">
      <p class="pdetail-cat" id="pdCat"></p>
      <h2 class="pdetail-name" id="pdName"></h2>
      <dl class="pdetail-facts">
        <div><dt>브랜드</dt><dd id="pdBrand"></dd></div>
        <div><dt>규격</dt><dd id="pdSpec"></dd></div>
        <div><dt>취급 여부</dt><dd>상담 확인 (재고·납기 별도)</dd></div>
      </dl>
      <p class="pdetail-note">대표 품목으로 정리한 상품입니다. 실제 재고·규격·납기는 상담으로 확인합니다.</p>
      <div class="pdetail-actions">
        <button class="btn btn-primary" id="pdAdd" type="button">견적 담기</button>
        <a class="btn btn-ghost" id="pdAsk" href="index.html#contact">이 품목 문의</a>
      </div>
    </div>
  </div>
</dialog>

<footer class="site-footer" id="siteFooter">
  <div class="wrap footer-top">
    <div class="f-brand">
      <span class="f-logo">
        <img src="assets/logo-lockup.png" alt="그랑쉐프 GRAND CHEF 로고" width="461" height="302" decoding="async">
      </span>
      <div>
        <strong>주식회사 그랑쉐프</strong>
        <em>GRANDCHEF CO., LTD.</em>
      </div>
    </div>
    <nav class="f-nav" aria-label="푸터 메뉴">
      <a href="index.html#about">회사소개</a>
      <a href="index.html#business">사업분야</a>
      <a href="products.html">취급상품</a>
      <a href="index.html#brands">취급 브랜드</a>
      <a href="index.html#clients">주요 납품처</a>
      <a href="index.html#quality">품질·유통</a>
      <a href="index.html#location">오시는 길</a>
      <a href="index.html#contact">납품 문의</a>
    </nav>
  </div>

  <div class="wrap footer-info">
    <div><span class="lab">대표이사</span> 정희숙</div>
    <div><span class="lab">사업자등록번호</span> 605-81-47231</div>
    <div><span class="lab">주소</span> 부산광역시 강서구 평강로345번길 45 (대저1동) 46700</div>
    <div><span class="lab">대표전화</span> 051-892-8930</div>
    <div><span class="lab">팩스</span> 051-892-8937</div>
    <div><span class="lab">이메일</span> <a href="mailto:grandchef@naver.com">grandchef@naver.com</a> · <a href="mailto:grandcook.com@gmail.com">grandcook.com@gmail.com</a></div>
  </div>

  <div class="wrap footer-bottom">
    <span>© 2026 GRANDCHEF CO., LTD. All rights reserved.</span>
    <nav class="f-legal" aria-label="약관 및 정책">
      <a href="guide.html">이용안내</a>
      <a href="terms.html">이용약관</a>
      <a href="privacy.html" class="is-strong">개인정보처리방침</a>
    </nav>
  </div>
</footer>

<script src="script.js?v=__JSV__" defer></script>
<script src="products.js?v=__PJSV__" defer></script>
</body>
</html>
'''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', help='전체 품목 catalog.js 경로 (없으면 git 이력에서 읽음)')
    ap.add_argument('--css', default='20261123k')
    ap.add_argument('--js', default='20261123k')
    ap.add_argument('--pjs', default='20261123l')
    args = ap.parse_args()

    data = load_full(args.source)
    rows, missing = build_rows(index_items(data))
    if missing:
        print('대표 품목을 찾지 못했습니다:', file=sys.stderr)
        for m in missing:
            print('  ', m, file=sys.stderr)
        sys.exit(1)

    out = TEMPLATE.format(
        total=TOTAL_ITEMS, n=len(rows), brands=len(BRANDS),
        brand_rest=BRAND_TOTAL - len(BRANDS),
        brand_cards=brand_cards(), chips=chips(rows), blocks=cat_blocks(rows))
    out = (out.replace('__CSSV__', args.css).replace('__JSV__', args.js)
              .replace('__PJSV__', args.pjs))
    with open('products.html', 'w', encoding='utf-8') as f:
        f.write(out)
    print('products.html 생성 완료 — 대표 품목 %d개 / 브랜드 %d곳' % (len(rows), len(BRANDS)))
    for cat, label, _, _ in CATS:
        n = len([r for r in rows if r['cat'] == cat])
        print('   %-12s %s %d' % (label, cat, n))


if __name__ == '__main__':
    main()
