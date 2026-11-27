#!/usr/bin/env python3
"""그랑쉐프 취급상품 이미지 경량화 — 800×800 JPEG에서 카드용 400px WebP·갤러리용 320px WebP를 만든다.

원본 JPEG(800×800)은 상세 모달과 원본 보존용으로 그대로 둔다.
생성 파일은 원본과 같은 폴더에 `<이름>-400.webp`, `<이름>-320.webp`로 저장한다.

    python3 tools/optimize_images.py            # 없는 것만 생성
    python3 tools/optimize_images.py --force    # 전부 다시 생성
    python3 tools/optimize_images.py --check    # 빠진 파일만 확인(생성 안 함)
    python3 tools/optimize_images.py --prune    # 참조되지 않는 JPEG 목록만 출력

WebP는 화질 손실을 눈에 띄지 않는 선(카드 78 / 썸네일 75)에서 품질을 잡고,
메타데이터는 넣지 않는다(용량 절감).
"""
import argparse
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, 'assets', 'img', 'products')
CATALOG = os.path.join(ROOT, 'assets', 'catalog.js')

# (접미폭, 품질, 지정 크기) — 카드 400 / 갤러리 썸네일 320
VARIANTS = [(400, 78), (320, 75)]


def jpeg_files():
    out = []
    for base, _dirs, files in os.walk(IMG_DIR):
        for name in files:
            if name.lower().endswith('.jpg'):
                out.append(os.path.join(base, name))
    return sorted(out)


def variant_path(jpg, width):
    return '%s-%d.webp' % (os.path.splitext(jpg)[0], width)


def make_variant(jpg, width, quality, force=False):
    dst = variant_path(jpg, width)
    if not force and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(jpg):
        return 'skip', os.path.getsize(dst)
    with Image.open(jpg) as im:
        im = im.convert('RGB')
        w, h = im.size
        if w > width:
            im = im.resize((width, round(h * width / w)), Image.LANCZOS)
        im.save(dst, 'WEBP', quality=quality, method=6)
    return 'made', os.path.getsize(dst)


def referenced_images():
    """카탈로그·HTML·CSS·JS가 참조하는 이미지 경로를 모은다."""
    refs = set()
    pat = re.compile(r'assets/img/products/[A-Za-z0-9_\-/]+\.jpg')
    for path in [CATALOG] + [os.path.join(ROOT, f) for f in os.listdir(ROOT) if f.endswith(('.html', '.js', '.css'))]:
        if not os.path.isfile(path):
            continue
        try:
            with open(path, encoding='utf-8') as fh:
                refs.update(pat.findall(fh.read()))
        except UnicodeDecodeError:
            continue
    return refs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--prune', action='store_true')
    args = ap.parse_args()

    files = jpeg_files()
    if not files:
        print('이미지가 없습니다: %s' % IMG_DIR)
        return 1

    if args.prune:
        refs = referenced_images()
        orphans = [f for f in files if os.path.relpath(f, ROOT).replace(os.sep, '/') not in refs]
        print('참조되지 않는 JPEG %d개 / 전체 %d개' % (len(orphans), len(files)))
        for f in orphans:
            print('  ' + os.path.relpath(f, ROOT))
        return 0

    made = skipped = 0
    bytes_in = bytes_out = 0
    missing = []
    for jpg in files:
        for width, quality in VARIANTS:
            dst = variant_path(jpg, width)
            if args.check:
                if not os.path.exists(dst):
                    missing.append(os.path.relpath(dst, ROOT))
                continue
            state, size = make_variant(jpg, width, quality, args.force)
            if state == 'made':
                made += 1
                bytes_in += os.path.getsize(jpg)
                bytes_out += size
            else:
                skipped += 1

    if args.check:
        print('빠진 WebP %d개 / 원본 %d개' % (len(missing), len(files)))
        for m in missing[:20]:
            print('  ' + m)
        return 0 if not missing else 2

    print('원본 JPEG %d개 · 생성 %d개 · 그대로 %d개' % (len(files), made, skipped))
    if made:
        print('생성분 원본 %.1fMB → WebP %.1fMB' % (bytes_in / 1e6, bytes_out / 1e6))
    return 0


if __name__ == '__main__':
    sys.exit(main())
