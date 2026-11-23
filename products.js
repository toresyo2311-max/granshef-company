/* 주식회사 그랑쉐프 — 취급 상품 카탈로그 (검색·11개 분류·브랜드·규격 필터·견적 바구니) */
(function () {
  'use strict';

  var DATA = window.GC_CATALOG;
  if (!DATA || !DATA.products) return;

  var CATS = DATA.categories;
  var PRODUCTS = DATA.products.map(function (p, i) {
    p.id = (p.bn || '') + '-' + i;
    return p;
  });

  var CAT_LABEL = {};
  CATS.forEach(function (c) { CAT_LABEL[c.k] = c.label; });

  /* ── image per item ─────────────────────────────────────────
     우선순위: p.img(실제 제품 사진 — 외부 공식물 이미지 URL 또는 로컬 경로)
             → p.i(로컬 세부 예시 이미지) → 분류 대표 이미지 */
  var ITEM_DIR = 'assets/img/items/';
  function fallbackImage(p) {
    if (p.i) return ITEM_DIR + p.i + '.jpg';
    if (p.c === 'pro') {
      if (/뚝배기/.test(p.n)) return 'assets/products/pro-04-ttukbaegi.jpg';
      if (/볶음솥|전판/.test(p.n)) return 'assets/products/pro-01-wok-griddle.jpg';
      if (/밧드|바트|튀김|바스켓/.test(p.n)) return 'assets/products/pro-03-bat-fryer.jpg';
      return 'assets/products/pro-02-coated-pan.jpg';
    }
    var map = {
      pot: 'cat-01-pot', pan: 'cat-02-pan', kettle: 'cat-03-kettle', mug: 'cat-04-mug',
      plate: 'cat-05-plate', cutlery: 'cat-06-tool', tool: 'cat-06-tool',
      storage: 'cat-07-storage', living: 'cat-08-living', appliance: 'cat-09-appliance'
    };
    return 'assets/products/' + (map[p.c] || 'cat-01-pot') + '.jpg';
  }
  function imageFor(p) {
    return p.img ? p.img : fallbackImage(p);
  }
  /* 매칭된 제품 사진이 없거나 로드되지 않으면 예시 이미지로 한 번만 대체 */
  function bindImageFallback(imgEl, p) {
    var swapped = false;
    imgEl.addEventListener('error', function () {
      if (swapped) return;
      swapped = true;
      imgEl.src = fallbackImage(p);
    });
  }

  /* ── spec text ───────────────────────────────────────────────── */
  function specText(p) {
    if (!p.s || !p.s.length) return '';
    return p.s.map(function (s) { return s.v + s.u.replace('리터', 'L'); }).join(' · ');
  }

  function sizeGroups(p) {
    var g = {};
    if (!p.s || !p.s.length) { g.none = true; return g; }
    p.s.forEach(function (s) {
      if (s.u === 'cm') {
        if (s.v <= 20) g.s1 = true;
        else if (s.v <= 24) g.s2 = true;
        else if (s.v <= 28) g.s3 = true;
        else g.s4 = true;
      } else if (s.u === 'mm') {
        var cm = s.v / 10;
        if (cm <= 20) g.s1 = true; else if (cm <= 24) g.s2 = true; else if (cm <= 28) g.s3 = true; else g.s4 = true;
      } else if (s.u === 'L' || s.u === 'ml' || s.u === '리터' || s.u === 'kg' || s.u === 'g') {
        g.vol = true;
      } else if (s.u === 'P' || s.u === '인치' || s.u === '호') {
        g.set = true;
      }
    });
    return g;
  }
  PRODUCTS.forEach(function (p) { p.g = sizeGroups(p); });

  /* ── 사이즈·규격만 다른 품목 묶기 ───────────────────────────────
     같은 브랜드에서 품명의 규격 표기(30cm·1.2L·2호·30P·26*20·-1/3 등)만
     다른 품목은 대표 카드 하나로 묶고, 카드에서 규격을 골라 담는다. */
  var SIZE_UNIT = '(?:cm|CM|mm|MM|ml|mL|ML|리터|kg|KG|Kg|g|G|L|P|p|호|인치|인용|개입|매)';

  function splitName(name) {
    var s = String(name);
    var tags = [];
    function cut(re) {
      s = s.replace(re, function (m) { tags.push(m); return ' '; });
    }
    /* 145*80*490 같은 치수 */
    cut(/\(?\d+(?:\.\d+)?\s*[*xX×]\s*\d+(?:\.\d+)?(?:\s*[*xX×]\s*\d+(?:\.\d+)?)?\)?/g);
    /* 1/3 같은 분수 규격 */
    cut(/-?\d+\s*\/\s*\d+/g);
    /* 숫자+단위 (30cm · 1.2L · 2호 · 30P · 4인용) */
    cut(new RegExp('[-_ ]?\\d+(?:\\.\\d+)?\\s*' + SIZE_UNIT, 'g'));
    /* (18) 같은 괄호 숫자 */
    cut(/\(\s*\d+(?:\.\d+)?\s*\)/g);
    /* -26 · -14양수 처럼 하이픈 뒤 숫자 */
    cut(/[-_ ]\d+(?:\.\d+)?(?=\s*(?:$|[\-)\s]|A|B|중|대|소|양수|편수|전골))/g);
    var base = s.replace(/[\s_\-]+/g, ' ')
      .replace(/^[\s\-_]+/, '')
      .replace(/\(\s*\)/g, ' ')
      .replace(/[\s\-_]+$/, '')
      .replace(/\s*\($/, '')
      .replace(/[\s\-_]+$/, '')
      .trim();
    return { base: base, tags: tags };
  }

  function cleanTag(t) {
    return String(t)
      .replace(/^[\s\-_()]+/, '').replace(/[\s\-_()]+$/, '')
      .replace(/\s*[*xX×]\s*/g, '×')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function unitGroup(p) {
    var s = p.s && p.s[0];
    if (!s) return 'none';
    if (s.u === 'cm' || s.u === 'mm') return 'len';
    if (s.u === 'L' || s.u === 'ml' || s.u === '리터') return 'vol';
    if (s.u === 'kg' || s.u === 'g') return 'mass';
    return 'count';
  }

  function variantLabel(p) {
    var sp = specText(p);
    if (sp) return sp;
    var tags = (META[p.id].tags || []).map(cleanTag).filter(Boolean);
    return tags.length ? tags.join(' ') : '규격 미표기';
  }

  var META = {};   /* 품목별 기본명·규격표기 — 원본 데이터는 건드리지 않는다 */
  function metaOf(p) { return META[p.id]; }

  var GROUPS = [];
  (function buildGroups() {
    var byKey = {};
    PRODUCTS.forEach(function (p) {
      var sp = splitName(p.n);
      var m = META[p.id] = { base: sp.base || p.n, tags: sp.tags, vlabel: '' };
      var key = p.b + '|' + m.base + '|' + unitGroup(p);
      var g = byKey[key];
      if (!g) {
        g = { b: p.b, base: m.base, c: p.c, variants: [], labels: {}, gk: null };
        byKey[key] = g;
        GROUPS.push(g);
      }
      var lab = variantLabel(p);
      if (g.labels[lab]) return; /* 같은 규격이 중복 기재된 행은 한 번만 */
      g.labels[lab] = 1;
      m.vlabel = lab;
      g.variants.push(p);
    });
    /* 규격이 작은 순서로 — 카드 기본 선택과 칩 순서가 자연스럽게 */
    GROUPS.forEach(function (g) {
      if (g.variants.length < 2) return;
      g.variants.sort(function (a, b) {
        var x = sizeValue(a), y = sizeValue(b);
        if (x !== null && y !== null && x !== y) return x - y;
        return String(metaOf(a).vlabel).localeCompare(String(metaOf(b).vlabel), 'ko');
      });
    });
  })();

  function sizeValue(p) {
    var s = p.s && p.s[0];
    if (!s) return null;
    var v = parseFloat(s.v);
    if (isNaN(v)) return null;
    return s.u === 'mm' ? v / 10 : v;
  }

  function groupText(g) {
    if (g.gk === null) {
      var parts = [g.base, g.b, CAT_LABEL[g.c]];
      g.variants.forEach(function (p) { parts.push(p.n, p.code || '', specText(p)); });
      g.gk = parts.join(' ').toLowerCase();
    }
    return g.gk;
  }

  var state = { q: '', cat: 'all', brand: '', size: '', sort: 'cat' };

  /* 한 번에 그리는 카드 수 — 1,698개를 한꺼번에 만들지 않고 60개씩 붙인다 */
  var PAGE_SIZE = 60;
  var shown = PAGE_SIZE;
  var lastList = null;

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), countEl = $('count'), emptyEl = $('empty');
  var moreWrap = $('catMore'), moreBtn = $('moreBtn');

  /* ── chips (11 categories) ───────────────────────────────────── */
  var chipWrap = $('catChips');
  function catCount(k) {
    return PRODUCTS.filter(function (p) { return k === 'all' || p.c === k; }).length;
  }
  if (chipWrap) {
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'chip is-on';
    allBtn.setAttribute('data-cat', 'all');
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.innerHTML = '전체 <b>' + PRODUCTS.length + '</b>';
    chipWrap.appendChild(allBtn);
    CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('data-cat', c.k);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = c.label + ' <b>' + catCount(c.k) + '</b>';
      chipWrap.appendChild(b);
    });
    chipWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      state.cat = btn.getAttribute('data-cat');
      Array.prototype.forEach.call(chipWrap.children, function (c) {
        var on = c === btn;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
    });
  }

  /* ── brand select ────────────────────────────────────────────── */
  var brandSel = $('brandSel');
  if (brandSel) {
    var brands = [];
    PRODUCTS.forEach(function (p) { if (brands.indexOf(p.b) < 0) brands.push(p.b); });
    brands.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
    brands.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b; o.textContent = b;
      brandSel.appendChild(o);
    });
    brandSel.addEventListener('change', function () { state.brand = brandSel.value; render(); });
  }

  /* ── search / size / sort ────────────────────────────────────── */
  var q = $('q'), qClear = $('qClear');
  if (q) {
    q.addEventListener('input', function () {
      state.q = q.value.trim().toLowerCase();
      if (qClear) qClear.hidden = !q.value;
      render();
    });
  }
  if (qClear) {
    qClear.addEventListener('click', function () {
      q.value = ''; state.q = ''; qClear.hidden = true; q.focus(); render();
    });
  }
  var sizeSel = $('sizeSel');
  if (sizeSel) sizeSel.addEventListener('change', function () { state.size = sizeSel.value; render(); });
  var sortSel = $('sortSel');
  if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

  /* 필터 결과는 "대표 카드" 목록 — variants 안에 선택 가능한 규격이 들어 있다 */
  function cardTitle(v) {
    return v.variants.length > 1 ? v.base : v.variants[0].n;
  }

  function filtered() {
    var list = [];
    GROUPS.forEach(function (g) {
      if (state.cat !== 'all' && g.c !== state.cat) return;
      if (state.brand && g.b !== state.brand) return;
      if (state.q && groupText(g).indexOf(state.q) < 0) return;
      var vs = g.variants;
      if (state.size) {
        vs = vs.filter(function (p) { return p.g[state.size]; });
        if (!vs.length) return;
      }
      list.push({ b: g.b, base: g.base, c: g.c, variants: vs });
    });
    if (state.sort === 'name') {
      list.sort(function (a, b) { return cardTitle(a).localeCompare(cardTitle(b), 'ko'); });
    } else if (state.sort === 'brand') {
      list.sort(function (a, b) {
        return a.b.localeCompare(b.b, 'ko') || cardTitle(a).localeCompare(cardTitle(b), 'ko');
      });
    } else {
      var order = {};
      CATS.forEach(function (c, i) { order[c.k] = i; });
      list.sort(function (a, b) {
        return (order[a.c] - order[b.c]) || cardTitle(a).localeCompare(cardTitle(b), 'ko');
      });
    }
    return list;
  }

  /* ── basket (localStorage) ───────────────────────────────────── */
  var KEY = 'gc_quote_v1';
  var basket = [];
  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) basket = saved.filter(function (x) { return x && x.n; });
  } catch (e) { basket = []; }

  function saveBasket() {
    try { window.localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {}
    paintCount();
  }
  function inBasket(p) {
    return basket.some(function (x) { return x.n === p.n && x.b === p.b; });
  }
  function addToBasket(p) {
    if (inBasket(p)) return false;
    basket.push({ n: p.n, b: p.b, c: p.c, s: specText(p) });
    saveBasket();
    paintBasket();
    return true;
  }
  function removeFromBasket(i) {
    basket.splice(i, 1);
    saveBasket();
    paintBasket();
    render(true);
  }
  function paintCount() {
    [$('basketCount'), $('basketCount2')].forEach(function (el) { if (el) el.textContent = String(basket.length); });
    var b = $('basketOpen');
    if (b) b.classList.toggle('has-items', basket.length > 0);
  }

  var basketEl = $('basket'), basketList = $('basketList'), basketEmpty = $('basketEmpty');
  function paintBasket() {
    if (!basketList) return;
    basketList.innerHTML = '';
    basket.forEach(function (it, i) {
      var li = document.createElement('li');
      var txt = document.createElement('span');
      txt.className = 'bl-txt';
      var strong = document.createElement('strong');
      strong.textContent = it.n;
      var meta = document.createElement('em');
      meta.textContent = it.b + (it.s ? ' · ' + it.s : '');
      txt.appendChild(strong);
      txt.appendChild(meta);
      var by = document.createElement('button');
      by.type = 'button';
      by.className = 'bl-del';
      by.setAttribute('aria-label', it.n + ' 삭제');
      by.textContent = '✕';
      by.addEventListener('click', function () { removeFromBasket(i); });
      li.appendChild(txt);
      li.appendChild(by);
      basketList.appendChild(li);
    });
    if (basketEmpty) basketEmpty.hidden = basket.length > 0;
    paintCount();
  }

  function setBasketOpen(open) {
    if (!basketEl) return;
    basketEl.hidden = !open;
    basketEl.classList.toggle('is-open', open);
    document.body.classList.toggle('basket-lock', open);
    var b = $('basketOpen');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  var bo = $('basketOpen'); if (bo) bo.addEventListener('click', function () { setBasketOpen(basketEl.hidden); });
  var bc = $('basketClose'); if (bc) bc.addEventListener('click', function () { setBasketOpen(false); });
  var bclear = $('basketClear');
  if (bclear) bclear.addEventListener('click', function () {
    basket = []; saveBasket(); paintBasket(); render(true);
  });

  /* ── hand a quote list to the inquiry form ───────────────────── */
  function toInquiry(items) {
    try {
      window.sessionStorage.setItem('gc_quote_items', JSON.stringify(items));
    } catch (e) {}
    window.location.href = 'index.html#contact';
  }

  var quoteGo = $('quoteGo');
  if (quoteGo) quoteGo.addEventListener('click', function () {
    if (!basket.length) { setBasketOpen(true); return; }
    toInquiry(basket);
  });

  /* ── product detail dialog (규격 선택 포함) ─────────────────── */
  var dlg = $('pdetail');
  var pdName = $('pdName'), pdBrand = $('pdBrand'), pdCat = $('pdCat'),
      pdSpec = $('pdSpec'), pdBarcode = $('pdBarcode'), pdImg = $('pdImg'),
      pdNote = $('pdNote'), pdAdd = $('pdAdd'), pdAsk = $('pdAsk');
  var pdSizesBox = $('pdSizes'), pdSizeChips = $('pdSizeChips'), pdSizeCount = $('pdSizeCount'),
      pdVariant = $('pdVariant');
  var current = null;      /* 열려 있는 카드(대표 카드) */
  var currentItem = null;  /* 그 카드에서 선택된 규격의 품목 */

  function paintVariant(p) {
    var multi = current && current.variants.length > 1;
    pdName.textContent = multi ? current.base : p.n;
    pdBrand.textContent = p.b;
    pdCat.textContent = CAT_LABEL[p.c];
    pdSpec.textContent = specText(p) || '규격 미표기 — 상담 확인';
    pdBarcode.textContent = '상담 확인 (표기 전 검증 필요)';
    if (pdVariant) {
      pdVariant.hidden = !multi;
      pdVariant.textContent = multi ? p.n : '';
    }
    pdImg.src = imageFor(p);
    bindImageFallback(pdImg, p);
    pdImg.alt = p.n + ' — ' + CAT_LABEL[p.c] + (p.img ? ' 제품 이미지' : ' 품목 예시 이미지');
    pdNote.textContent = p.u
      ? '브랜드 공식 홈페이지에 게시된 취급 품목입니다. 실제 재고·규격·납기는 상담으로 확인합니다.'
      : '취급 품목으로 정리된 상품입니다. 실제 재고·규격·납기는 상담으로 확인합니다.';
    pdAdd.textContent = inBasket(p) ? '담김 ✓' : (multi ? '이 규격 견적 담기' : '견적 담기');
    if (pdSizeChips) {
      Array.prototype.forEach.call(pdSizeChips.children, function (chip) {
        var on = chip.getAttribute('data-id') === p.id;
        chip.classList.toggle('is-on', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  function selectVariant(p) {
    if (!p) return;
    currentItem = p;
    paintVariant(p);
  }

  function openDetail(view) {
    if (!dlg || !dlg.showModal) return;
    current = view;
    var vs = view.variants;
    if (pdSizeChips) pdSizeChips.innerHTML = '';
    if (pdSizesBox) pdSizesBox.hidden = vs.length < 2;
    if (pdSizeCount) pdSizeCount.textContent = vs.length > 1 ? '· ' + vs.length + '종' : '';
    if (vs.length > 1 && pdSizeChips) {
      vs.forEach(function (p) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'size-chip';
        chip.setAttribute('data-id', p.id);
        chip.setAttribute('aria-pressed', 'false');
        chip.textContent = metaOf(p).vlabel;
        chip.title = p.n;
        chip.addEventListener('click', function () { selectVariant(p); });
        pdSizeChips.appendChild(chip);
      });
    }
    selectVariant(vs[0]);
    dlg.showModal();
  }

  var pdClose = $('pdClose');
  if (pdClose) pdClose.addEventListener('click', function () { if (dlg) dlg.close(); });
  if (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  }
  if (pdAdd) pdAdd.addEventListener('click', function () {
    if (!currentItem) return;
    var added = addToBasket(currentItem);
    pdAdd.textContent = added ? '담김 ✓' : '이미 담김';
    render(true);
    if (dlg && dlg.open) dlg.close();
    setBasketOpen(true);
  });
  if (pdAsk) pdAsk.addEventListener('click', function (e) {
    if (!currentItem) return;
    e.preventDefault();
    toInquiry([{ n: currentItem.n, b: currentItem.b, c: currentItem.c, s: specText(currentItem) }]);
  });

  /* ── render list ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(keepShown) {
    if (!grid) return;
    var list = filtered();
    lastList = list;
    var total = list.length;
    shown = keepShown ? Math.max(PAGE_SIZE, Math.min(shown, total)) : Math.min(PAGE_SIZE, total);
    grid.innerHTML = '';
    if (countEl) {
      countEl.innerHTML = '<strong>' + num(total) + '</strong>개 상품' +
        (state.cat !== 'all' ? ' · ' + esc(CAT_LABEL[state.cat]) : '') +
        ' <span class="cat-count-all">/ 전체 ' + num(PRODUCTS.length) + '개 품목</span>';
    }
    if (emptyEl) emptyEl.hidden = total > 0;
    appendCards(list, 0, shown);
    paintMore(total);
  }

  function num(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* "더 보기 (남은 N개)" — 남은 카드가 있을 때만 보인다 */
  function paintMore(total) {
    if (!moreBtn) return;
    var rest = total - shown;
    if (moreWrap) moreWrap.hidden = rest <= 0;
    moreBtn.hidden = rest <= 0;
    if (rest > 0) moreBtn.textContent = '더 보기 (남은 ' + num(rest) + '개)';
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      var list = lastList || filtered();
      var to = Math.min(shown + PAGE_SIZE, list.length);
      appendCards(list, shown, to);
      shown = to;
      paintMore(list.length);
    });
  }

  function appendCards(list, from, to) {
    if (!grid || to <= from) return;
    var frag = document.createDocumentFragment();
    for (var idx = from; idx < to; idx += 1) {
      frag.appendChild(buildCard(list[idx]));
    }
    grid.appendChild(frag);
  }

  /* 대표 카드가 품고 있는 규격 설명 — "8종 · 20cm~34cm" */
  function sizeSummary(vs) {
    var nums = [], unit = null, ok = true;
    vs.forEach(function (p) {
      var s = p.s && p.s[0];
      if (!s || typeof s.v !== 'number' || (s.u !== 'cm' && s.u !== 'mm' && s.u !== 'L' && s.u !== 'ml')) ok = false;
      else {
        if (unit && unit !== s.u) ok = false;
        unit = s.u;
        nums.push(s.v);
      }
    });
    if (ok && nums.length) {
      var mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
      var u = unit === 'mm' ? 'mm' : unit;
      return mn === mx ? mn + u : mn + u + '~' + mx + u;
    }
    var labels = vs.map(function (p) { return metaOf(p).vlabel; });
    return labels.slice(0, 3).join(' · ') + (labels.length > 3 ? ' 외' : '');
  }

  function buildCard(view) {
    var vs = view.variants;
    var multi = vs.length > 1;
    var p = vs[0];
    var title = multi ? view.base : p.n;
    var card = document.createElement('article');
    card.className = 'pcard' + (multi ? ' pcard-group' : '');
    card.setAttribute('data-group', multi ? '1' : '0');

    var media = document.createElement('button');
    media.type = 'button';
    media.className = 'pcard-media';
    media.setAttribute('aria-label', title + ' 상세 보기');
    var img = document.createElement('img');
    img.src = imageFor(p);
    bindImageFallback(img, p);
    img.alt = p.n + ' — ' + CAT_LABEL[p.c] + (p.img ? ' 제품 이미지' : ' 품목 예시 이미지');
    img.width = 1100; img.height = 1100;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
    media.addEventListener('click', function () { openDetail(view); });

    var body = document.createElement('div');
    body.className = 'pcard-body';

    var meta = document.createElement('p');
    meta.className = 'pcard-meta';
    meta.innerHTML = '<span>' + esc(p.b) + '</span><span>' + esc(CAT_LABEL[p.c]) + '</span>';

    var h = document.createElement('h3');
    h.className = 'pcard-name';
    var nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.textContent = title;
    nameBtn.addEventListener('click', function () { openDetail(view); });
    h.appendChild(nameBtn);

    var spec = document.createElement('p');
    spec.className = 'pcard-spec';
    if (multi) {
      spec.innerHTML = '<span class="pcard-size-badge">규격 ' + vs.length + '종</span> ' + esc(sizeSummary(vs));
    } else {
      spec.textContent = specText(p) ? '규격 ' + specText(p) : '규격 상담 확인';
    }

    var foot = document.createElement('div');
    foot.className = 'pcard-foot';
    var price = document.createElement('span');
    price.className = 'pcard-price';
    price.textContent = '가격 상담';
    var add = document.createElement('button');
    add.type = 'button';
    if (multi) {
      add.className = 'pcard-add is-pick';
      add.textContent = '규격 선택';
      add.addEventListener('click', function () { openDetail(view); });
    } else {
      add.className = 'pcard-add' + (inBasket(p) ? ' is-in' : '');
      add.textContent = inBasket(p) ? '담김 ✓' : '+ 견적 담기';
      add.addEventListener('click', function () {
        if (addToBasket(p)) {
          add.textContent = '담김 ✓';
          add.classList.add('is-in');
        }
        setBasketOpen(true);
      });
    }
    foot.appendChild(price);
    foot.appendChild(add);

    body.appendChild(meta);
    body.appendChild(h);
    body.appendChild(spec);
    body.appendChild(foot);
    card.appendChild(media);
    card.appendChild(body);
    return card;
  }

  paintBasket();
  render();

  /* deep link: products.html?cat=pot or ?q=프라이팬 */
  try {
    var sp = new URLSearchParams(window.location.search);
    var cat = sp.get('cat');
    if (cat && CAT_LABEL[cat] && chipWrap) {
      var btn = chipWrap.querySelector('button[data-cat="' + cat + '"]');
      if (btn) btn.click();
    }
    var kw = sp.get('q');
    if (kw && q) { q.value = kw; q.dispatchEvent(new Event('input')); }
  } catch (e) {}
})();
