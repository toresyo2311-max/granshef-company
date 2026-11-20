# 주식회사 그랑쉐프 회사 소개 홈페이지

주식회사 그랑쉐프의 회사 소개 홈페이지입니다. 정적 사이트(HTML/CSS/JS)로, 의존성 없이 GitHub Pages에서 바로 열립니다.

- 라이브: http://grandchef.co.kr/ (GitHub Pages `toresyo2311-max/granshef-company`, 커스텀 도메인 연결)
- 구성: 히어로 · 회사소개 · 사업분야 4개(마트 납품·주방용품 유통·특판상품·신상품 제안) · 주요 거래처·납품 · 납품 구성 예시 3종 + B2B 실무 FAQ · 취급품목 11개 분류 · 취급 브랜드 29곳(업체 선택형 패널) · 품질·유통(인증/설비) · 오시는 길(지도·네이버 플레이스·주소 복사) · B2B 문의 · 푸터(사업자 정보·약관 링크)
- 상품 화면: `products.html` — 11개 분류 · 상품명/브랜드/규격 검색 · 브랜드·규격 필터 · 상품 상세(모달) · 견적 바구니(브라우저 저장) · 묶음 견적 문의(문의 폼으로 전달)
- 모바일: 하단 플로팅 상담 바(전화 걸기 / 납품·견적 문의), 본문 하단 여백 확보
- 문의 접수: 폼 제출 → 문의 내용 정리(필수/선택 동의 기록 포함) → 메일 앱(`grandchef@naver.com`, 참조 `grandcook.com@gmail.com`) 또는 내용 복사·전화. 서버 전송·저장 없음
- 회사소개서: `assets/grandchef-company-profile.pdf` (A4 3페이지, `tools/build_profile_pdf.py`로 재생성)
- 검토 메모: [REVIEW-NOTES.md](REVIEW-NOTES.md)

## 파일

| 파일 | 설명 |
| --- | --- |
| `index.html` | 페이지 마크업 |
| `styles.css` | 디자인 시스템·레이아웃 (말미에 2026-11-20 정식 고도화 블록) |
| `script.js` | 헤더·모바일 메뉴·스크롤 리빌·브랜드 필터·브랜드 견적 문의·주소 복사·문의 폼·플로팅 바 |
| `terms.html` | 이용약관 |
| `guide.html` | 이용안내 |
| `privacy.html` | 개인정보처리방침 (법적 근거·동의 구분·국외 이전·로컬 저장소 포함) |
| `products.html` | 취급 상품 카탈로그 (검색·11개 분류·브랜드·규격 필터·견적 바구니) |
| `products.js` | 카탈로그 렌더링·필터·상품 상세·견적 바구니 로직 |
| `assets/catalog.js` | 상품 데이터 136건 (브랜드 공식 홈페이지 게시 품목 기준, 가격·재고·바코드 미표기) |
| `404.html` | 페이지 없음 안내 |
| `robots.txt` / `sitemap.xml` | 검색엔진 수집 설정·사이트맵 |
| `assets/grandchef-company-profile.pdf` | 회사소개서 PDF (A4 3p) |
| `assets/logo.png` | 공식 로고 원본 512×512 (파비콘·애플 터치 아이콘) |
| `assets/logo-lockup.png` | 같은 로고에서 흰 여백만 잘라낸 락업 (헤더·히어로·푸터 표시용) |
| `assets/products/*.jpg` | 품목·사업분야 예시 이미지 |
| `assets/img/items/*.jpg` | 상품별 세부 예시 이미지 96종(1100×1100, AI 생성) — products.html에서 상품마다 다른 사진 |
| `tools/build_profile_pdf.py` | 회사소개서 PDF 생성 스크립트 |

## 로컬 확인

```sh
python3 -m http.server 8080
# http://localhost:8080
```

## 회사소개서 PDF 다시 만들기

```sh
# Noto Sans KR 정적 폰트가 필요합니다 (Regular/Bold TTF).
#   https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf
#   → fontTools의 instantiateVariableFont로 wght 400/700 인스턴스를 만들어 tools/fonts/에 두거나,
#     NOTO_DIR 환경변수로 폴더를 지정합니다.
python3 tools/build_profile_pdf.py   # → assets/grandchef-company-profile.pdf
```

## 남은 작업

- 제품 실사진(브랜드별 촬영본) 교체 — 현재는 AI 생성 분류 예시 이미지(화면에 표기)
- 바코드·정확한 규격 표기 — 상품마스터(ERP 상품코드)와 브랜드 공식 품목을 대조한 뒤 기재
- 전체 상품마스터(1,600 SKU) 게시 여부 결정 — 원가·공급가·마진·거래처 제거 후 게시 가능
- 연혁 타임라인 추가 (연도별 사건 확인 필요)
- 문의 폼 서버 접수(폼 백엔드) 도입 시 `privacy.html` 위탁·국외 이전 조항 갱신
- GitHub Pages 인증서 발급 완료 후 "Enforce HTTPS" 설정
