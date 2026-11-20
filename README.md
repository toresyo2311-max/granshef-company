# 그랑쉐프 회사 소개 홈페이지 (1차 시안)

(주)그랑쉐프의 회사 소개 홈페이지입니다. 정적 사이트(HTML/CSS/JS)로, 의존성 없이 GitHub Pages에서 바로 열립니다.

- 라이브: https://toresyo2311-max.github.io/granshef-company/
- 구성: 히어로 · 회사소개 · 사업분야 · 취급품목 · 품질·유통(인증/설비) · 오시는 길(지도) · B2B 문의 · 푸터(사업자 정보)
- 반응형: 모바일(≤560px) / 태블릿(≤1024px) / 데스크톱
- 검토 메모: [REVIEW-NOTES.md](REVIEW-NOTES.md)

## 파일

| 파일 | 설명 |
| --- | --- |
| `index.html` | 페이지 마크업 |
| `styles.css` | 디자인 시스템·레이아웃 |
| `script.js` | 헤더·모바일 메뉴·스크롤 리빌·문의 폼 |
| `assets/logo.png` | 공식 로고 원본 512×512 (파비콘·애플 터치 아이콘) |
| `assets/logo-lockup.png` | 같은 로고에서 흰 여백만 잘라낸 락업 (헤더·히어로·푸터 표시용) |

## 로컬 확인

```sh
python3 -m http.server 8080
# http://localhost:8080
```

## 남은 작업

- 제품 사진 삽입 (현재는 자리 표시 영역)
- 문의 폼 실제 접수 연결 (현재는 전화 안내)
- 연혁 타임라인 · 제품 상세 페이지
