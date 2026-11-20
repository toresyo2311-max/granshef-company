#!/usr/bin/env python3
"""(주)그랑쉐프 회사소개서 PDF 생성기.

    python3 tools/build_profile_pdf.py

- 출력: assets/grandchef-company-profile.pdf (A4 3페이지)
- 폰트: Noto Sans KR (Regular/Bold) — tools/fonts/ 아래에 두거나 NOTO_DIR 환경변수로 지정
- 홈페이지에 공개된 확정 정보만 사용한다. 원가·마진·거래 단가는 넣지 않는다.
"""
import os
import sys

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "grandchef-company-profile.pdf")
IMGS = os.path.join(ROOT, "assets", "products")
LOGO = os.path.join(ROOT, "assets", "logo-lockup.png")

FONT_DIRS = [os.environ.get("NOTO_DIR", ""), os.path.join(ROOT, "tools", "fonts"),
             "/workspace/tmp/krfont", "/usr/share/fonts/pickle-hwp"]


def find_font(name):
    for d in FONT_DIRS:
        if d and os.path.exists(os.path.join(d, name)):
            return os.path.join(d, name)
    raise SystemExit("font not found: " + name)


pdfmetrics.registerFont(TTFont("KR", find_font("NotoSansKR-Regular.ttf")))
pdfmetrics.registerFont(TTFont("KR-B", find_font("NotoSansKR-Bold.ttf")))
SERIF_CANDIDATES = [
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
]


def find_serif():
    for path in SERIF_CANDIDATES:
        if os.path.exists(path):
            return path
    raise SystemExit("serif font not found")


pdfmetrics.registerFont(TTFont("SER", find_serif()))

W, H = A4
M = 48.0                      # 좌우 여백

INK = HexColor("#191714")
INK_SOFT = HexColor("#4E483F")
MUTE = HexColor("#8B8377")
BRONZE = HexColor("#A9824F")
BRONZE_LT = HexColor("#C9A578")
BRONZE_DP = HexColor("#8A6739")
PAPER = HexColor("#F8F5F0")
PAPER_2 = HexColor("#F1ECE3")
PAPER_3 = HexColor("#E7DFD2")
CHAR = HexColor("#171614")
CHAR_2 = HexColor("#211F1C")
LINE = HexColor("#D8D0C3")
WHITE = HexColor("#FFFFFF")


# ── helpers ────────────────────────────────────────────────────────────
def wrap(text, font, size, max_w):
    """공백 기준 줄바꿈 + 긴 한글 어절은 글자 단위로 쪼갠다."""
    out, cur = [], ""
    for word in text.split(" "):
        trial = (cur + " " + word).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_w:
            cur = trial
            continue
        if cur:
            out.append(cur)
        cur = word
        while cur and pdfmetrics.stringWidth(cur, font, size) > max_w:
            i = len(cur)
            while i > 1 and pdfmetrics.stringWidth(cur[:i], font, size) > max_w:
                i -= 1
            out.append(cur[:i])
            cur = cur[i:]
    if cur:
        out.append(cur)
    return out


def para(c, text, x, y, w, font="KR", size=9, leading=None, color=INK_SOFT,
         max_lines=None, space_after=0):
    leading = leading or size * 1.62
    lines = wrap(text, font, size, w)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * leading, ln)
    return y - (len(lines) - 1) * leading - (space_after if space_after else 0)


def tracked(c, text, x, y, font="KR-B", size=8, color=BRONZE, tracking=2.0):
    """자간을 준 라벨."""
    c.setFont(font, size)
    c.setFillColor(color)
    for ch in text:
        c.drawString(x, y, ch)
        x += pdfmetrics.stringWidth(ch, font, size) + tracking
    return x


def hair(c, x1, y, x2, color=LINE, width=0.6):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y, x2, y)


def draw_img(c, path, x, y, w, h):
    if not os.path.exists(path):
        c.setFillColor(PAPER_3)
        c.rect(x, y, w, h, fill=1, stroke=0)
        return
    c.drawImage(path, x, y, w, h, preserveAspectRatio=True, anchor="c",
                mask=None, showBoundary=0)


def page_foot(c, n):
    hair(c, M, 54, W - M, LINE, 0.5)
    c.setFont("KR", 7.2)
    c.setFillColor(MUTE)
    c.drawString(M, 40, "(주)그랑쉐프 · 부산광역시 강서구 평강로345번길 45 (대저1동) 46700 · TEL 051-892-8930 · grandchef.co.kr")
    c.setFont("SER", 8)
    c.drawRightString(W - M, 40, "GRANDCHEF CO., LTD.   %02d / 03" % n)


# ── page 1 : cover ─────────────────────────────────────────────────────
def page_cover(c):
    c.setFillColor(CHAR)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # 은은한 대각 광
    for i in range(58):
        alpha = 0.012 + (i / 58.0) * 0.02
        c.setFillColor(Color(0.66, 0.51, 0.31, alpha=alpha))
        c.circle(W - 40 - i * 8, H - 40 - i * 3.2, 250 - i * 3, fill=1, stroke=0)

    c.setStrokeColor(Color(0.79, 0.65, 0.47, alpha=0.28))
    c.setLineWidth(0.7)
    c.rect(24, 24, W - 48, H - 48, fill=0, stroke=1)

    tracked(c, "COMPANY PROFILE", M, H - 62, "KR-B", 8, BRONZE_LT, 2.6)
    c.setFont("SER", 10)
    c.setFillColor(HexColor("#9C9284"))
    c.drawRightString(W - M, H - 62, "2026")

    # logo card
    c.setFillColor(WHITE)
    c.roundRect(M, H - 268, 214, 136, 6, fill=1, stroke=0)
    draw_img(c, LOGO, M + 20, H - 257, 174, 114)

    y = H - 330
    c.setFont("SER", 11)
    c.setFillColor(BRONZE_LT)
    c.drawString(M, y, "PROFESSIONAL COOK  ·  SINCE 2001")

    y -= 46
    c.setFont("KR-B", 34)
    c.setFillColor(HexColor("#F7F3EB"))
    c.drawString(M, y, "(주)그랑쉐프")

    y -= 26
    c.setFont("KR", 12.5)
    c.setFillColor(HexColor("#C9C0B2"))
    c.drawString(M, y, "주방 · 생활용품 제조 및 유통  |  부산광역시 강서구")

    y -= 22
    c.setFont("SER", 12)
    c.setFillColor(BRONZE_LT)
    c.drawString(M, y, "GRANDCHEF CO., LTD.")

    # bronze rule
    c.setStrokeColor(BRONZE)
    c.setLineWidth(2)
    c.line(M, y - 26, M + 56, y - 26)

    para(c,
         "2001년 부산에서 문을 연 이래 냄비와 프라이팬, 식탁 위의 그릇부터 조리도구까지 "
         "주방에 필요한 것을 기획하고 만들고 보내 왔습니다. 업소·급식용 대용량 기물과 "
         "가정용 주방용품을 함께 다루며, 부울경 직배송과 정기 납품으로 거래처의 주방을 지킵니다.",
         M, y - 58, W - M * 2 - 90, "KR", 10.2, 17.5, HexColor("#B8AF9F"), max_lines=4)

    # fact strip
    fy = 250
    facts = [("25", "YEAR", "2001년 설립 · 올해로 25년"),
             ("08", "FIELDS", "취급 주방 카테고리"),
             ("29", "BRANDS", "함께하는 국내 주방 브랜드"),
             ("B2B", "SUPPLY", "부울경 직배송 · 정기 납품")]
    cw = (W - M * 2) / len(facts)
    for i, (num, en, ko) in enumerate(facts):
        x = M + i * cw
        c.setFont("SER", 30)
        c.setFillColor(HexColor("#EFE8DC"))
        c.drawString(x, fy, num)
        tracked(c, en, x, fy - 15, "KR-B", 6.4, BRONZE_LT, 1.6)
        c.setFont("KR", 8)
        c.setFillColor(HexColor("#8F8678"))
        for j, ln in enumerate(wrap(ko, "KR", 8, cw - 22)):
            c.drawString(x, fy - 30 - j * 11, ln)
        if i:
            c.setStrokeColor(Color(1, 1, 1, alpha=0.1))
            c.setLineWidth(0.6)
            c.line(x - 14, fy - 34, x - 14, fy + 34)

    # contact block
    cy = 138
    hair(c, M, cy + 18, W - M, Color(0.79, 0.65, 0.47, alpha=0.3), 0.6)
    c.setFont("KR-B", 8)
    c.setFillColor(BRONZE_LT)
    c.drawString(M, cy, "CONTACT")
    c.setFont("KR", 9.4)
    c.setFillColor(HexColor("#DDD5C6"))
    c.drawString(M + 62, cy, "051-892-8930   ·   FAX 051-892-8937")
    c.drawString(M + 62, cy - 15, "grandchef@naver.com   ·   grandcook.com@gmail.com")
    c.drawString(M + 62, cy - 30, "부산광역시 강서구 평강로345번길 45 (대저1동) 46700   ·   grandchef.co.kr")

    c.setFont("KR", 7)
    c.setFillColor(HexColor("#6F675B"))
    c.drawString(M, 52, "본 자료는 거래처 상담·영업 목적의 회사 소개서이며, 거래 조건·단가·원가 등 내부 정보는 포함하지 않습니다.")


# ── page 2 : company & business ────────────────────────────────────────
def page_company(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 62
    tracked(c, "01  ·  COMPANY", M, y, "KR-B", 7.6, BRONZE, 2.2)
    y -= 30
    c.setFont("KR-B", 23)
    c.setFillColor(INK)
    c.drawString(M, y, "회사 개요")
    c.setFont("SER", 12)
    c.setFillColor(BRONZE_DP)
    c.drawRightString(W - M, y, "Since 2001, Busan")

    y -= 16
    hair(c, M, y, W - M, LINE, 0.8)

    y -= 26
    y = para(c,
             "(주)그랑쉐프는 2001년 부산에서 문을 연 주방·생활용품 제조·유통 기업입니다. "
             "냄비·프라이팬 같은 조리기물부터 식탁 위의 그릇, 조리도구와 밀폐용기까지 주방에 필요한 것을 "
             "기획하고 직접 만들고 유통해 왔습니다. 부산 강서구 대저1동에 본사와 사무실을 두고 "
             "부울경 유통망과 기업·공공 채널에 공급하며, 식당·급식소에 필요한 대용량 기물과 "
             "식자재 부자재·소모품까지 한 창구에서 보냅니다.",
             M, y, W - M * 2, "KR", 9.6, 16.4, INK_SOFT)

    # ── 개요 표 (좌) + 인증/브랜드 (우)
    top = y - 26
    rows = [
        ("상호", "(주)그랑쉐프  |  GRANDCHEF CO., LTD."),
        ("대표이사", "정희숙"),
        ("설립", "2001년 8월 (올해로 25년)"),
        ("사업자등록번호", "605-81-47231"),
        ("업종", "주방·생활용품 제조 및 일반유통 (플라스틱 성형용기 제조)"),
        ("소재지", "부산광역시 강서구 평강로345번길 45 (대저1동) 46700"),
        ("대표전화 / 팩스", "051-892-8930 / 051-892-8937"),
        ("이메일", "grandchef@naver.com · grandcook.com@gmail.com"),
        ("업무시간", "평일 08:30 – 17:30 (주말·공휴일 휴무)"),
    ]
    lw = 78
    yy = top
    for k, v in rows:
        c.setFont("KR-B", 8.2)
        c.setFillColor(BRONZE_DP)
        c.drawString(M, yy, k)
        lines = wrap(v, "KR", 8.8, 246 - lw)
        c.setFont("KR", 8.8)
        c.setFillColor(INK)
        for i, ln in enumerate(lines):
            c.drawString(M + lw, yy - i * 11.6, ln)
        yy -= max(1, len(lines)) * 11.6 + 8.6
        hair(c, M, yy + 4.4, M + 246, HexColor("#E3DBCE"), 0.5)

    # right column cards
    rx = M + 274
    rw = W - M - rx
    cy = top
    c.setFillColor(WHITE)
    c.roundRect(rx, cy - 96, rw, 96, 4, fill=1, stroke=0)
    tracked(c, "CERTIFICATE & FACILITY", rx + 14, cy - 20, "KR-B", 6.4, BRONZE, 1.4)
    c.setFont("KR-B", 9.4)
    c.setFillColor(INK)
    c.drawString(rx + 14, cy - 37, "고효율에너지인증")
    c.setFont("KR", 8.2)
    c.setFillColor(INK_SOFT)
    c.drawString(rx + 14, cy - 50, "인증 유효 2028. 07")
    c.setFont("KR-B", 9.4)
    c.setFillColor(INK)
    c.drawString(rx + 14, cy - 66, "녹색제품인증")
    c.setFont("KR", 8.2)
    c.setFillColor(INK_SOFT)
    c.drawString(rx + 14, cy - 79, "친환경 제품 인증 보유")

    cy -= 108
    c.setFillColor(WHITE)
    c.roundRect(rx, cy - 74, rw, 74, 4, fill=1, stroke=0)
    tracked(c, "SOLAR", rx + 14, cy - 20, "KR-B", 6.4, BRONZE, 1.4)
    c.setFont("KR-B", 9.4)
    c.setFillColor(INK)
    c.drawString(rx + 14, cy - 37, "본사 태양광 57.12kW")
    c.setFont("KR", 8.2)
    c.setFillColor(INK_SOFT)
    c.drawString(rx + 14, cy - 51, "2018년 설치 · 자가발전 운영")

    cy -= 86
    c.setFillColor(WHITE)
    c.roundRect(rx, cy - 74, rw, 74, 4, fill=1, stroke=0)
    tracked(c, "BRAND LINE", rx + 14, cy - 20, "KR-B", 6.4, BRONZE, 1.4)
    c.setFont("KR-B", 9)
    c.setFillColor(INK)
    c.drawString(rx + 14, cy - 37, "그랜드쿡  GRAND COOK")
    c.setFont("KR", 8.2)
    c.setFillColor(INK_SOFT)
    c.drawString(rx + 14, cy - 51, "그랑쉐프몰 · 종합주방몰 운영")

    # ── 사업분야
    by = cy - 116
    tracked(c, "02  ·  BUSINESS AREAS", M, by, "KR-B", 7.6, BRONZE, 2.2)
    c.setFont("KR-B", 17)
    c.setFillColor(INK)
    c.drawString(M, by - 24, "만들고, 갖추고, 보냅니다.")
    c.setFont("SER", 10)
    c.setFillColor(MUTE)
    c.drawRightString(W - M, by - 24, "4 business areas")

    biz = [
        ("01", "조리기물", "업소용 대형 볶음솥·전판, 코팅팬·웍부터 가정용 냄비·프라이팬, 뚝배기까지 규격별로 갖춥니다."),
        ("02", "식탁·테이블웨어", "머그와 컵, 공기·접시, 잔과 수저류까지 매일 쓰는 그릇을 세트와 단품으로 공급합니다."),
        ("03", "조리도구·주방잡화", "채칼·식도·가위 같은 조리도구와 유리 밀폐용기, 물병, 수저통 등 주방의 잔손질을 줄이는 물건을 다룹니다."),
        ("04", "B2B 유통·납품", "마트·지역 유통센터, 식당·급식소, 기업·관공서 채널에 대용량 기물과 소모품까지 공급합니다."),
    ]
    gy = by - 48
    cwid = (W - M * 2 - 16) / 2
    for i, (no, title, desc) in enumerate(biz):
        col, row = i % 2, i // 2
        x = M + col * (cwid + 16)
        ytop = gy - row * 92
        c.setFillColor(WHITE)
        c.roundRect(x, ytop - 78, cwid, 78, 4, fill=1, stroke=0)
        c.setFont("SER", 9)
        c.setFillColor(BRONZE)
        c.drawString(x + 14, ytop - 20, no)
        c.setFont("KR-B", 10.6)
        c.setFillColor(INK)
        c.drawString(x + 34, ytop - 20, title)
        para(c, desc, x + 14, ytop - 38, cwid - 28, "KR", 8.2, 12.6, INK_SOFT, max_lines=3)

    page_foot(c, 2)


# ── page 3 : products, brands, supply, contact ─────────────────────────
def page_products(c):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    y = H - 62
    tracked(c, "03  ·  PRODUCTS", M, y, "KR-B", 7.6, BRONZE, 2.2)
    c.setFont("KR-B", 21)
    c.setFillColor(INK)
    c.drawString(M, y - 28, "취급 품목")
    c.setFont("KR", 9)
    c.setFillColor(INK_SOFT)
    c.drawString(M + 100, y - 28, "업소·급식용 대용량 기물부터 가정용 주방용품까지, 8개 분야")

    tiles = [
        ("pro-01-wok-griddle.jpg", "대형 볶음솥·전판", "업소용"),
        ("pro-02-coated-pan.jpg", "업소용 코팅팬·웍", "업소용"),
        ("pro-03-bat-fryer.jpg", "밧드·튀김 바스켓", "업소용"),
        ("pro-04-ttukbaegi.jpg", "뚝배기", "업소용"),
        ("cat-01-pot.jpg", "냄비·솥", "가정용"),
        ("cat-02-pan.jpg", "프라이팬", "가정용"),
        ("cat-03-kettle.jpg", "주전자·보온", "가정용"),
        ("cat-04-mug.jpg", "머그·컵", "가정용"),
        ("cat-05-plate.jpg", "공기·접시", "가정용"),
        ("cat-06-tool.jpg", "조리도구·칼", "가정용"),
        ("cat-07-storage.jpg", "밀폐·보관", "가정용"),
        ("cat-08-living.jpg", "생활·주방잡화", "가정용"),
    ]
    top = y - 50
    cols, gap = 4, 8
    tw = (W - M * 2 - gap * (cols - 1)) / cols
    th = 92
    for i, (f, name, kind) in enumerate(tiles):
        col, row = i % cols, i // cols
        x = M + col * (tw + gap)
        ytop = top - row * (th + 9)
        c.setFillColor(WHITE)
        c.roundRect(x, ytop - th, tw, th, 3, fill=1, stroke=0)
        draw_img(c, os.path.join(IMGS, f), x + 7, ytop - 58, tw - 14, 50)
        c.setFont("KR-B", 8.3)
        c.setFillColor(INK)
        c.drawString(x + 8, ytop - 70, name)
        c.setFont("KR", 6.5)
        c.setFillColor(BRONZE_DP if kind == "업소용" else MUTE)
        c.drawString(x + 8, ytop - 81, kind)

    # ── 브랜드
    by = top - 3 * th - 2 * 9 - 16
    tracked(c, "04  ·  BRAND PARTNERS 29", M, by, "KR-B", 7.6, BRONZE, 2.0)
    brands = [
        ("01", "PN풍년", "냄비·팬"), ("02", "키친플라워", "냄비·팬"), ("03", "테팔", "냄비·팬"),
        ("04", "해피콜", "냄비·팬"), ("05", "키친아트", "냄비·팬"), ("06", "선학", "냄비·팬"),
        ("07", "퀸센스", "냄비·팬"), ("08", "리빙코리아", "주방가전"), ("09", "제니얼", "조리도구"),
        ("10", "이라이프", "식기·생활"), ("11", "동진쉐프", "냄비·팬"), ("12", "매직쉐프", "주방가전"),
        ("13", "영진알루미늄", "냄비·팬"), ("14", "대원경금속", "냄비·팬"), ("15", "한국도자기", "식기·생활"),
        ("16", "영수인터내셔널", "조리도구"), ("17", "홈즈", "식기·생활"), ("18", "네오플램", "냄비·팬"),
        ("19", "화영", "식기·생활"), ("20", "그라첸", "냄비·팬"), ("21", "로이첸", "냄비·팬"),
        ("22", "세신유앤씨", "유통·도매"), ("23", "동복무역", "식기·생활"), ("24", "TOSCO", "냄비·팬"),
        ("25", "플랜비스", "유통·도매"), ("26", "화성연료", "유통·도매"), ("27", "대명멜라민", "식기·생활"),
        ("28", "오성세라믹", "식기·생활"), ("29", "월드종합주방", "유통·도매"),
    ]
    bcols = 3
    bcw = (W - M * 2 - 16) / bcols
    for i, (no, name, cat) in enumerate(brands):
        col, row = i // 10, i % 10
        x = M + col * (bcw + 8)
        yy = by - 19 - row * 11.9
        c.setFont("SER", 6.3)
        c.setFillColor(MUTE)
        c.drawString(x, yy, no)
        c.setFont("KR-B", 7.9)
        c.setFillColor(INK)
        c.drawString(x + 13, yy, name)
        c.setFont("KR", 6.9)
        c.setFillColor(MUTE)
        c.drawRightString(x + bcw - 8, yy, cat)

    # ── 납품·유통 / 거래처 / 오시는 길·문의
    sy = by - 19 - 9 * 11.9 - 20
    box_h = 170
    c.setFillColor(PAPER_2)
    c.roundRect(M, sy - box_h, W - M * 2, box_h, 4, fill=1, stroke=0)

    tracked(c, "05  ·  SUPPLY & CONTACT", M + 16, sy - 21, "KR-B", 7.0, BRONZE_DP, 1.8)

    lx, lw2 = M + 16, 190
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(lx, sy - 42, "부울경 직배송")
    para(c, "부산·울산·경남은 직접 배송으로 빠르게 보냅니다.",
         lx, sy - 55, lw2, "KR", 7.4, 10.6, INK_SOFT, max_lines=2)
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(lx, sy - 80, "정기 납품")
    para(c, "주 단위·월 단위 정기 발주를 상담으로 맞춥니다.",
         lx, sy - 93, lw2, "KR", 7.4, 10.6, INK_SOFT, max_lines=1)
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(lx, sy - 116, "납품 실무")
    para(c, "발주 단위·혼합 발주 협의, 세금계산서·법인카드 정산, 불량·파손 교환 절차를 상담으로 안내합니다.",
         lx, sy - 129, lw2 + 10, "KR", 7.4, 10.6, INK_SOFT, max_lines=3)

    mx = M + 236
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(mx, sy - 42, "주요 거래처")
    clients = [("서원유통 (탑마트)", 1), ("농협하나로마트", 1), ("우리마트", 1), ("홀마트", 1),
               ("대기업·관공서 B2B 납품", 1)]
    cy2 = sy - 56
    for name, ln in clients:
        lines = wrap(name, "KR", 7.4, 116)
        for k, t in enumerate(lines):
            c.setFont("KR", 7.4)
            c.setFillColor(INK_SOFT)
            c.drawString(mx, cy2 - k * 10.4, t)
        cy2 -= len(lines) * 10.4 + 3.4

    rx = M + 372
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(rx, sy - 42, "오시는 길")
    para(c, "부산김해경전철 평강역 2번 출구 도보 5분 · 주차 가능 (방문 전 연락)",
         rx, sy - 55, W - M - 16 - rx, "KR", 7.4, 10.6, INK_SOFT, max_lines=2)
    c.setFont("KR-B", 8.6)
    c.setFillColor(INK)
    c.drawString(rx, sy - 84, "문의")
    c.setFont("KR", 7.4)
    c.setFillColor(INK_SOFT)
    c.drawString(rx, sy - 97, "TEL 051-892-8930   FAX 051-892-8937")
    c.drawString(rx, sy - 109, "grandchef@naver.com")
    c.drawString(rx, sy - 121, "grandcook.com@gmail.com")
    c.drawString(rx, sy - 133, "grandchef.co.kr")

    para(c, "※ 대표 제품은 각 브랜드 공식 홈페이지 게시 품목 기준이며, 실제 취급 여부·규격·발주 단위는 시즌과 거래처에 따라 달라지므로 문의로 확인해 주십시오.",
         M, sy - box_h - 18, W - M * 2, "KR", 6.6, 9.6, MUTE, max_lines=2)

    page_foot(c, 3)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("(주)그랑쉐프 회사소개서 | GRANDCHEF CO., LTD. Company Profile")
    c.setAuthor("(주)그랑쉐프")
    c.setSubject("회사 개요·사업분야·취급품목·취급 브랜드·납품 안내")
    c.setCreator("grandchef.co.kr")

    page_cover(c)
    c.showPage()
    page_company(c)
    c.showPage()
    page_products(c)
    c.showPage()
    c.save()
    print("wrote", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
