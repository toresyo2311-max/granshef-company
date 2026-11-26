/* 주식회사 그랑쉐프 — 취급 상품 카탈로그
   전체 1,871품목(assets/catalog.js)을 같은 시리즈의 사이즈·규격·형태(편수·양수·전골·곰솥 · 프라이팬·웍·궁중팬)만 다른 품목끼리
   한 세트로 묶어 1,239개 카드로 보여 준다.
   검색·분류·브랜드·규격 필터, 60개씩 점진 렌더링(더 보기), 품목 상세(규격 선택),
   실제 제품 사진 463컷 모아보기, 취급문의(공장 재고 확인 후 발주 가능) 표시, 견적 바구니(브라우저 저장) → 문의 폼 전달까지 이 스크립트가 맡는다. */
(function () {
  'use strict';

  var DATA = window.GC_CATALOG;
  if (!DATA || !DATA.products) return;

  var CATS = DATA.categories;
  var PRODUCTS = DATA.products;
  var CAT_LABEL = {};
  var CAT_ORDER = {};
  CATS.forEach(function (c, i) { CAT_LABEL[c.k] = c.label; CAT_ORDER[c.k] = i; });

  /* 분류 소개 문구 — 2026-11-23 개편안 문구를 그대로 쓴다 */
  var CAT_DESC = {
    pot: '식당용 전골·국솥부터 가정용 양수·편수, 압력솥과 뚝배기까지.',
    pan: '업소용 중국팬·전판·튀김팬과 가정용 IH 프라이팬·궁중팬.',
    kettle: '업소용 대용량 주전자와 가정용 휘슬·IH 주전자, 보온병.',
    mug: '머그·텀블러·유리컵·와인잔 등 음료 잔류.',
    plate: '공기·대접·면기·찬기·접시, 멜라민·스텐 식기.',
    cutlery: '영업용 수저·젓가락과 선물용 수저세트.',
    tool: '도마·국자·집게·채칼·식도 등 조리도구와 칼.',
    storage: '소스통·양념통·케찹병 등 업소 보관용기와 밀폐용기.',
    living: '석쇠·아이스몰드·보온도시락 등 주방 생활용품.',
    pro: '밧드·계량컵·쟁반·식판·샤쿠시·건지기 등 업소 기물.',
    appliance: '가스렌지·가스점화기·전기주전자 등 주방 소형가전.'
  };
  var CAT_IMG = {
    pot: 'cat-01-pot', pan: 'cat-02-pan', kettle: 'cat-03-kettle', mug: 'cat-04-mug',
    plate: 'cat-05-plate', cutlery: 'cat-10-cutlery', tool: 'cat-06-tool',
    storage: 'cat-07-storage', living: 'cat-08-living', appliance: 'cat-09-appliance'
  };

  /* ── 이미지 ─────────────────────────────────────────────────────
     우선순위: p.img(제조사·유통 카탈로그 실제 제품 사진) → p.i(품목 예시) → 분류 대표 이미지 */
  var ITEM_DIR = 'assets/img/items/';
  function exampleImage(p) {
    if (p.i) return ITEM_DIR + p.i + '.jpg';
    if (p.c === 'pro') {
      if (/뚝배기/.test(p.n)) return 'assets/products/pro-04-ttukbaegi.jpg';
      if (/볶음솥|전판/.test(p.n)) return 'assets/products/pro-01-wok-griddle.jpg';
      if (/밧드|바트|튀김|바스켓/.test(p.n)) return 'assets/products/pro-03-bat-fryer.jpg';
      return 'assets/products/pro-02-coated-pan.jpg';
    }
    return 'assets/products/' + (CAT_IMG[p.c] || 'cat-01-pot') + '.jpg';
  }
  /* 사진 파일은 경로를 그대로 두고 내용만 교체하므로, 브라우저 캐시를 비키도록 판올림 값을 붙인다 */
  var IMG_V = '?v=20261126j';
  function imageFor(p) { return p.img ? p.img + IMG_V : exampleImage(p); }
  /* 사진이 깨졌을 때 예시 이미지로 한 번만 대체 */
  function bindImageFallback(imgEl, p) {
    var swapped = false;
    imgEl.addEventListener('error', function () {
      if (swapped) return;
      swapped = true;
      imgEl.src = exampleImage(p);
    });
  }

  /* ── 규격 표기 ───────────────────────────────────────────────── */
  function specText(p) {
    if (!p.s || !p.s.length) return '';
    return p.s.map(function (s) { return s.v + String(s.u).replace('리터', 'L'); }).join(' · ');
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
      } else {
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
    cut(/\(?\d+(?:\.\d+)?\s*[*xX×]\s*\d+(?:\.\d+)?(?:\s*[*xX×]\s*\d+(?:\.\d+)?)?\)?/g);
    cut(/-?\d+\s*\/\s*\d+/g);
    cut(new RegExp('[-_ ]?\\d+(?:\\.\\d+)?\\s*' + SIZE_UNIT, 'g'));
    cut(/\(\s*\d+(?:\.\d+)?\s*\)/g);
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

  var META = {};   /* 품목별 기본명·규격표기 — 원본 데이터는 건드리지 않는다 */
  function metaOf(p) { return META[p.id] || { base: p.n, tags: [], forms: [], vlabel: specText(p) || '규격 미표기' }; }

  /* ── 시리즈 세트 묶기 ─────────────────────────────────────────
     같은 시리즈명 뒤에 붙는 형태(냄비류: 편수·양수·전골·곰솥·곰국·들통·냄비 /
     팬류: 후라이팬·프라이팬·궁중팬·웍·계란말이팬·구이팬)는 규격처럼 보고
     대표 카드 하나로 묶는다(모달에서 형태·사이즈를 고른다).
     브랜드명만 남거나 재질어만 남으면 묶지 않고, 분류(c)가 다르면 묶지 않는다. */
  var FORM_TAIL = /[\s\-]?(편수|양수|전골|곰솥|곰국|들통|냄비|후라이팬|프라이팬|궁중팬|웍|계란말이팬|구이팬)$/;
  /* 재질 이름만 남는 경우(양은·스텐 등)는 시리즈명이 아니므로 형태어를 떼지 않는다 */
  var MATERIAL_HEAD = /^(양은|경질|스텐|스테인리스|알루미늄|법랑|무쇠|주물|놋|도자기|세라믹|유리|멜라민|실리콘)$/;
  function splitForm(base, brand) {
    var forms = [], head = base, guard = 0;
    while (guard < 2) {
      var m = FORM_TAIL.exec(head);
      if (!m) break;
      var cut = head.slice(0, m.index).replace(/[\s\-]+$/, '');
      if (cut.length < 2 || cut === brand || MATERIAL_HEAD.test(cut)) break;
      forms.unshift(m[1]);
      head = cut;
      guard += 1;
    }
    return { base: head, forms: forms };
  }

  function variantLabel(p) {
    var m = metaOf(p);
    var sp = specText(p);
    var core = sp || (m.tags || []).map(cleanTag).filter(Boolean).join(' ');
    var lab = [core, (m.forms || []).join(' ')].filter(Boolean).join(' ').trim();
    return lab || '규격 미표기';
  }

  var GROUPS = [];
  (function buildGroups() {
    var byKey = {};
    PRODUCTS.forEach(function (p, i) {
      p.id = (p.bn || '') + '-' + i;
      var sp = splitName(p.n);
      var m = META[p.id] = { base: sp.base || p.n, tags: sp.tags, forms: [], vlabel: '' };
      /* ser(시리즈 이름)가 있으면 그것을, 없으면 품명 끝의 형태어를 떼어 시리즈명으로 쓴다 */
      var base = m.base;
      if (!p.ser) {
        var sf = splitForm(m.base, p.b);
        base = sf.base;
        m.forms = sf.forms;
      }
      base = p.ser || base;
      var key = p.b + '|' + base + '|' + p.c;
      var g = byKey[key];
      if (!g) {
        g = { b: p.b, base: base, c: p.c, variants: [], labels: {}, gk: null };
        byKey[key] = g;
        GROUPS.push(g);
      }
      var lab = p.vl || variantLabel(p);
      if (g.labels[lab]) return; /* 같은 규격이 중복 기재된 행은 한 번만 */
      g.labels[lab] = 1;
      m.vlabel = lab;
      g.variants.push(p);
    });
    GROUPS.forEach(function (g) {
      if (g.variants.length < 2) return;
      /* 규격이 모두 같은 형태뿐이면 카드 이름에 그 형태를 그대로 남긴다 (다용도곰솥·매운탕냄비) */
      var sig = {};
      g.variants.forEach(function (p) {
        var f = (META[p.id].forms || []).join(' ');
        sig[f] = (sig[f] || 0) + 1;
      });
      var keys = Object.keys(sig);
      if (keys.length === 1 && keys[0]) {
        g.base = META[g.variants[0].id].base;
        return;
      }
      /* 여러 형태가 섞이면 시리즈 이름만 쓰되, 모든 규격이 냄비류면 '냄비'를 붙인다 */
      var allPot = g.variants.every(function (p) {
        return (META[p.id].forms || []).indexOf('냄비') >= 0;
      });
      if (allPot && !/냄비$/.test(g.base)) g.base += '냄비';
    });
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
      g.variants.forEach(function (p) {
        parts.push(p.n, p.code || '', specText(p), metaOf(p).vlabel);
      });
      g.gk = parts.join(' ').toLowerCase();
    }
    return g.gk;
  }

  /* 카드 대표 이미지 — 대표로 지정된 사진(rep) → 묶인 규격 가운데 실제 제품 사진 → 첫 규격 */
  function cardPhoto(vs) {
    var i;
    for (i = 0; i < vs.length; i += 1) if (vs[i].rep && vs[i].img) return vs[i];
    for (i = 0; i < vs.length; i += 1) if (vs[i].img) return vs[i];
    return vs[0];
  }

  /* 사진 컷 수 — 같은 시리즈 규격(예: 6·8·10인용)에 같은 사진을 함께 쓰므로 파일 기준으로 센다 */
  var SHOT_IMG = {};
  PRODUCTS.forEach(function (p) { if (p.img) SHOT_IMG[p.img] = 1; });
  var SHOT_COUNT = Object.keys(SHOT_IMG).length;

  var state = { q: '', cat: 'all', brand: '', size: '', sort: 'photo' }; /* 기본: 실사진 우선 */

  /* 한 번에 그리는 카드 수 — 1,239개를 한꺼번에 만들지 않고 60개씩 붙인다 */
  var PAGE_SIZE = 60;
  var shown = PAGE_SIZE;
  var lastList = null;

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), countEl = $('count'), emptyEl = $('empty');
  var moreWrap = $('catMore'), moreBtn = $('moreBtn');

  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ── 분류 칩 ────────────────────────────────────────────────── */
  var chipWrap = $('catChips');
  function cardCountOf(k) {
    var n = 0;
    GROUPS.forEach(function (g) { if (k === 'all' || g.c === k) n += 1; });
    return n;
  }
  if (chipWrap) {
    var allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'chip is-on';
    allBtn.setAttribute('data-cat', 'all');
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.innerHTML = '전체 <b>' + num(GROUPS.length) + '</b>';
    chipWrap.appendChild(allBtn);
    CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('data-cat', c.k);
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = c.label + ' <b>' + num(cardCountOf(c.k)) + '</b>';
      chipWrap.appendChild(b);
    });
    chipWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      setCat(btn.getAttribute('data-cat'));
    });
  }

  function setCat(key) {
    state.cat = key;
    if (chipWrap) {
      Array.prototype.forEach.call(chipWrap.children, function (c) {
        var on = c.getAttribute('data-cat') === key;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    paintCatHead();
    render();
  }

  /* 선택한 분류의 머리글(이미지·소개·개수) — 2026-11-23 개편안의 분류 머리 디자인 */
  var catHead = $('catHead');
  function paintCatHead() {
    if (!catHead) return;
    if (state.cat === 'all' || !CAT_LABEL[state.cat]) { catHead.hidden = true; return; }
    var k = state.cat;
    var items = PRODUCTS.filter(function (p) { return p.c === k; }).length;
    var img = $('chHeadImg'), name = $('chHeadName'), desc = $('chHeadDesc'), cnt = $('chHeadCount');
    if (img) { img.src = 'assets/products/' + (CAT_IMG[k] || 'cat-01-pot') + '.jpg'; img.alt = CAT_LABEL[k] + ' 예시'; }
    if (name) name.textContent = CAT_LABEL[k];
    if (desc) desc.textContent = CAT_DESC[k] || '';
    if (cnt) cnt.textContent = num(cardCountOf(k)) + '개 카드 · ' + num(items) + '개 품목';
    catHead.hidden = false;
  }

  /* ── 브랜드·규격·정렬 ───────────────────────────────────────── */
  var brandSel = $('brandSel');
  if (brandSel) {
    var brands = [];
    var brandCards = {};
    GROUPS.forEach(function (g) {
      if (brands.indexOf(g.b) < 0) brands.push(g.b);
      brandCards[g.b] = (brandCards[g.b] || 0) + 1;
    });
    brands.sort(function (a, b) { return a.localeCompare(b, 'ko'); });
    brands.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b;
      o.textContent = b + ' (' + num(brandCards[b]) + ')';
      brandSel.appendChild(o);
    });
    brandSel.addEventListener('change', function () { state.brand = brandSel.value; render(); });
  }

  var sizeSel = $('sizeSel');
  if (sizeSel) sizeSel.addEventListener('change', function () { state.size = sizeSel.value; render(); });
  var sortSel = $('sortSel');
  if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

  /* ── 검색 ───────────────────────────────────────────────────── */
  var q = $('q'), qClear = $('qClear');
  if (q) {
    q.addEventListener('input', function () {
      state.q = q.value.trim().toLowerCase();
      if (qClear) qClear.hidden = !q.value;
      /* 검색은 전체 분류에서 찾는다 — 분류 칩이 눌려 있으면 함께 풀어 준다 */
      if (state.q && state.cat !== 'all') { setCat('all'); return; }
      render();
    });
  }
  if (qClear) {
    qClear.addEventListener('click', function () {
      q.value = ''; state.q = ''; qClear.hidden = true; q.focus(); render();
    });
  }

  /* ── 필터 결과 (대표 카드 목록) ──────────────────────────────── */
  function cardTitle(v) { return v.variants.length > 1 ? v.base : v.variants[0].n; }

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
    if (state.sort === 'photo') {
      /* 실제 제품 사진이 있는 카드를 먼저 — 사진을 앞에서 바로 보실 수 있게 */
      list.sort(function (a, b) {
        var pa = cardPhoto(a.variants).img ? 0 : 1;
        var pb = cardPhoto(b.variants).img ? 0 : 1;
        return (pa - pb) || (CAT_ORDER[a.c] - CAT_ORDER[b.c]) || cardTitle(a).localeCompare(cardTitle(b), 'ko');
      });
    } else if (state.sort === 'name') {
      list.sort(function (a, b) { return cardTitle(a).localeCompare(cardTitle(b), 'ko'); });
    } else if (state.sort === 'brand') {
      list.sort(function (a, b) {
        return a.b.localeCompare(b.b, 'ko') || cardTitle(a).localeCompare(cardTitle(b), 'ko');
      });
    } else {
      list.sort(function (a, b) {
        return (CAT_ORDER[a.c] - CAT_ORDER[b.c]) || cardTitle(a).localeCompare(cardTitle(b), 'ko');
      });
    }
    return list;
  }

  /* ── 견적 바구니 (localStorage) ──────────────────────────────── */
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
  /* 취급문의 품목인지 — 담을 때 표시(q)를 저장하되, 그 전에 담아 둔 바구니도
     현재 카탈로그에서 다시 확인해 표시가 빠지지 않게 한다 */
  var INQ_LOOKUP = {};
  PRODUCTS.forEach(function (p) { if (p.inq) INQ_LOOKUP[p.b + '|' + p.n] = 1; });
  function isInqItem(it) {
    return it.q === 1 || INQ_LOOKUP[it.b + '|' + it.n] === 1;
  }
  function inBasket(p) {
    return basket.some(function (x) { return x.n === p.n && x.b === p.b; });
  }
  function addToBasket(p) {
    if (inBasket(p)) return false;
    basket.push({ n: p.n, b: p.b, c: p.c, s: specText(p), q: p.inq ? 1 : 0 });
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

  var basketEl = $('basket'), basketList = $('basketList'), basketEmpty = $('basketEmpty'),
      basketInq = $('basketInq');
  function paintBasket() {
    if (!basketList) return;
    basketList.innerHTML = '';
    var inqCount = 0;
    basket.forEach(function (it, i) {
      var inq = isInqItem(it);
      if (inq) inqCount += 1;
      var li = document.createElement('li');
      li.className = inq ? 'is-inq' : '';
      var txt = document.createElement('span');
      txt.className = 'bl-txt';
      var nameLine = document.createElement('span');
      nameLine.className = 'bl-name';
      var strong = document.createElement('strong');
      strong.textContent = it.n;
      nameLine.appendChild(strong);
      if (inq) {
        var tag = document.createElement('span');
        tag.className = 'bl-inq';
        tag.textContent = '취급문의';
        tag.title = '공장 재고 확인 후 발주 가능한 품목입니다.';
        nameLine.appendChild(tag);
      }
      var meta = document.createElement('em');
      meta.textContent = it.b + (it.s ? ' · ' + it.s : '');
      txt.appendChild(nameLine);
      txt.appendChild(meta);
      var by = document.createElement('button');
      by.type = 'button';
      by.className = 'bl-del';
      by.setAttribute('aria-label', it.n + (inq ? ' (취급문의)' : '') + ' 삭제');
      by.textContent = '✕';
      by.addEventListener('click', function () { removeFromBasket(i); });
      li.appendChild(txt);
      li.appendChild(by);
      basketList.appendChild(li);
    });
    if (basketEmpty) basketEmpty.hidden = basket.length > 0;
    if (basketInq) {
      basketInq.hidden = inqCount === 0;
      basketInq.textContent = '취급문의 ' + inqCount + '건이 담겨 있습니다. 취급문의 품목은 공장 재고 확인 후 발주 가능하며, 규격·납기는 상담으로 확인해 드립니다.';
    }
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

  /* ── 견적 목록을 문의 폼으로 넘긴다 ─────────────────────────── */
  function toInquiry(items) {
    var payload = items.map(function (it) {
      return {
        n: it.n, b: it.b, c: CAT_LABEL[it.c] || it.c || '', s: it.s || '',
        q: isInqItem(it) ? 1 : 0
      };
    });
    try { window.sessionStorage.setItem('gc_quote_items', JSON.stringify(payload)); } catch (e) {}
    window.location.href = 'index.html#contact';
  }

  var quoteGo = $('quoteGo');
  if (quoteGo) quoteGo.addEventListener('click', function () {
    if (!basket.length) { setBasketOpen(true); return; }
    toInquiry(basket);
  });

  /* ── 품목 상세 (규격 선택) ──────────────────────────────────── */
  var dlg = $('pdetail');
  var pdName = $('pdName'), pdBrand = $('pdBrand'), pdCat = $('pdCat'),
      pdSpec = $('pdSpec'), pdImg = $('pdImg'), pdImgCap = $('pdImgCap'),
      pdNote = $('pdNote'), pdAdd = $('pdAdd'), pdAsk = $('pdAsk'), pdInq = $('pdInq'),
      pdSizesBox = $('pdSizes'), pdSizeChips = $('pdSizeChips'),
      pdSizeCount = $('pdSizeCount'), pdVariant = $('pdVariant');
  var current = null;      /* 열려 있는 카드 */
  var currentItem = null;  /* 카드에서 선택된 규격의 품목 */

  function paintVariant(p) {
    var multi = current && current.variants.length > 1;
    pdName.textContent = multi ? current.base : p.n;
    pdBrand.textContent = p.b;
    pdCat.textContent = CAT_LABEL[p.c] || '';
    pdSpec.textContent = specText(p) || '규격 미표기 — 상담 확인';
    if (pdVariant) {
      pdVariant.hidden = !multi;
      pdVariant.textContent = multi ? p.n : '';
    }
    var real = !!p.img;
    if (pdInq) {
      pdInq.hidden = !p.inq;
      pdInq.textContent = '취급문의 품목은 공장 재고 확인 후 발주 가능합니다. 규격·납기는 상담으로 확인해 드립니다.';
    }
    pdImg.src = imageFor(p);
    pdImg.alt = p.n + ' — ' + (CAT_LABEL[p.c] || '') + (real ? ' 제품 이미지' : ' 품목 예시 이미지');
    if (pdImgCap) pdImgCap.textContent = real ? '제조사·유통 카탈로그 실제 제품 사진 · 실제 제품과 다를 수 있음' : '품목 예시 이미지 · 실제 제품과 다를 수 있음';
    pdNote.textContent = p.inq
      ? '표기된 규격은 상품명 기준입니다. 실제 규격·포장 단위는 상담으로 확인해 드립니다.'
      : (p.u
        ? '브랜드 공식 홈페이지에 게시된 취급 품목입니다. 실제 재고·규격·납기는 상담으로 확인합니다.'
        : '취급 품목으로 정리한 상품입니다. 실제 재고·규격·납기는 상담으로 확인합니다.');
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

  function openDetail(view, pick) {
    if (!dlg || !dlg.showModal) return;
    current = view;
    var vs = view.variants;
    if (pdSizeChips) pdSizeChips.innerHTML = '';
    if (pdSizesBox) pdSizesBox.hidden = vs.length < 2;
    if (pdSizeCount) pdSizeCount.textContent = vs.length > 1 ? '· ' + vs.length + '종' : '';
    if (vs.length > 1 && pdSizeChips) {
      var inqN = 0;
      vs.forEach(function (p) { if (p.inq) inqN += 1; });
      var mixed = inqN > 0 && inqN < vs.length;
      vs.forEach(function (p) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'size-chip';
        chip.setAttribute('data-id', p.id);
        chip.setAttribute('aria-pressed', 'false');
        chip.textContent = metaOf(p).vlabel + (mixed && p.inq ? ' · 취급문의' : '');
        chip.title = p.n;
        chip.addEventListener('click', function () { selectVariant(p); });
        pdSizeChips.appendChild(chip);
      });
    }
    selectVariant(pick || vs[0]);
    dlg.showModal();
  }

  var pdClose = $('pdClose');
  if (pdClose) pdClose.addEventListener('click', function () { if (dlg) dlg.close(); });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
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
    toInquiry([{
      n: currentItem.n, b: currentItem.b, c: currentItem.c, s: specText(currentItem),
      q: currentItem.inq ? 1 : 0
    }]);
  });

  /* ── 실제 제품 사진 모아보기 (463컷) ─────────────────────────── */
  var shotDlg = $('shotGallery'), shotGrid = $('shotGrid');
  var shotBuilt = false;
  function openGallery() {
    if (!shotDlg || !shotDlg.showModal) return;
    if (!shotBuilt && shotGrid) {
      var frag = document.createDocumentFragment();
      var seenImg = {};
      PRODUCTS.forEach(function (p) {
        if (!p.img || seenImg[p.img]) return; /* 한 규격 그룹이 함께 쓰는 사진은 한 번만 */
        seenImg[p.img] = 1;
        var same = PRODUCTS.filter(function (x) { return x.img === p.img; }).sort(function (a, b) {
          var x = sizeValue(a), y = sizeValue(b);
          if (x !== null && y !== null && x !== y) return x - y;
          return 0;
        });
        var shotName = same.length > 1 ? metaOf(p).base : p.n;
        var fig = document.createElement('button');
        fig.type = 'button';
        fig.className = 'shot';
        var im = document.createElement('img');
        im.src = p.img + IMG_V;
        im.alt = shotName + ' — ' + (CAT_LABEL[p.c] || '') + ' 실제 제품 사진';
        im.width = 1100; im.height = 1100;
        im.loading = 'lazy';
        im.decoding = 'async';
        var cap = document.createElement('span');
        cap.className = 'shot-cap';
        var strong = document.createElement('strong');
        strong.textContent = shotName;
        var em = document.createElement('em');
        em.textContent = p.b + ' · ' + (CAT_LABEL[p.c] || '') + (same.length > 1 ? ' · ' + sizeSummary(same) : '');
        cap.appendChild(strong);
        cap.appendChild(em);
        fig.appendChild(im);
        fig.appendChild(cap);
        fig.addEventListener('click', function () { openFromProduct(p); });
        frag.appendChild(fig);
      });
      shotGrid.appendChild(frag);
      shotBuilt = true;
    }
    shotDlg.showModal();
  }
  function openFromProduct(p) {
    var view = null;
    GROUPS.some(function (g) {
      if (g.variants.indexOf(p) >= 0) { view = g; return true; }
      return false;
    });
    if (shotDlg && shotDlg.open) shotDlg.close();
    if (view) openDetail(view, p);
  }
  var shotOpen = $('shotOpen');
  if (shotOpen) shotOpen.addEventListener('click', openGallery);
  var shotClose = $('shotClose');
  if (shotClose) shotClose.addEventListener('click', function () { shotDlg.close(); });
  if (shotDlg) shotDlg.addEventListener('click', function (e) { if (e.target === shotDlg) shotDlg.close(); });

  /* ── 목록 그리기 ────────────────────────────────────────────── */
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
    /* 보던 개수를 유지하되, 걸러진 목록보다 많이 그리지 않는다(빈 카드 참조 오류 방지) */
    shown = keepShown ? Math.min(Math.max(PAGE_SIZE, shown), total) : Math.min(PAGE_SIZE, total);
    grid.innerHTML = '';
    if (countEl) {
      var filteredNow = state.cat !== 'all' || state.brand || state.q || state.size;
      countEl.innerHTML = filteredNow
        ? '<strong>' + num(total) + '</strong>개 카드' +
          (state.cat !== 'all' ? ' · ' + esc(CAT_LABEL[state.cat]) : '') +
          ' <span class="cat-count-all">/ 전체 ' + num(GROUPS.length) + '개 카드 · ' + num(PRODUCTS.length) + '개 품목</span>'
        : '대표 카드 <strong>' + num(total) + '</strong>개 <span class="cat-count-all">/ 취급 품목 ' + num(PRODUCTS.length) + '개 · 실제 제품 사진 ' + num(SHOT_COUNT) + '컷</span>';
    }
    if (emptyEl) emptyEl.hidden = total > 0;
    appendCards(list, 0, shown);
    paintMore(total);
  }

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
    for (var idx = from; idx < to; idx += 1) frag.appendChild(buildCard(list[idx]));
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
    var photo = cardPhoto(vs);
    var title = multi ? view.base : vs[0].n;
    var card = document.createElement('article');
    card.className = 'pcard' + (multi ? ' pcard-group' : '');

    var media = document.createElement('button');
    media.type = 'button';
    media.className = 'pcard-media';
    media.setAttribute('aria-label', title + ' 상세 보기');
    var img = document.createElement('img');
    img.src = imageFor(photo);
    bindImageFallback(img, photo);
    img.alt = photo.n + ' — ' + (CAT_LABEL[view.c] || '') + (photo.img ? ' 실제 제품 사진' : ' 품목 예시 이미지');
    img.width = 1100; img.height = 1100;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.appendChild(img);
    if (photo.img) {
      var tag = document.createElement('span');
      tag.className = 'pcard-shot';
      tag.textContent = '실사진';
      media.appendChild(tag);
    }
    /* 취급문의 — 공장 재고 확인 후 발주 가능한 품목 */
    var inqN = 0;
    vs.forEach(function (p) { if (p.inq) inqN += 1; });
    if (inqN) {
      var inqTag = document.createElement('span');
      inqTag.className = 'pcard-inq' + (inqN === vs.length ? '' : ' is-part');
      inqTag.textContent = inqN === vs.length ? '취급문의' : '일부 취급문의';
      inqTag.title = inqN === vs.length
        ? '취급문의 품목은 공장 재고 확인 후 발주 가능합니다. 상담으로 확인해 드립니다.'
        : '이 카드의 일부 규격은 공장 재고 확인 후 발주 가능합니다. 상담으로 확인해 드립니다.';
      media.appendChild(inqTag);
    }
    /* 카드에 보이는 사진의 규격을 기본 선택해 연다 */
    media.addEventListener('click', function () { openDetail(view, photo); });

    var body = document.createElement('div');
    body.className = 'pcard-body';

    var meta = document.createElement('p');
    meta.className = 'pcard-meta';
    meta.innerHTML = '<span>' + esc(view.b) + '</span><span>' + esc(CAT_LABEL[view.c] || '') + '</span>';

    var h = document.createElement('h3');
    h.className = 'pcard-name';
    var nameBtn = document.createElement('button');
    nameBtn.type = 'button';
    nameBtn.textContent = title;
    nameBtn.addEventListener('click', function () { openDetail(view, photo); });
    h.appendChild(nameBtn);

    var spec = document.createElement('p');
    spec.className = 'pcard-spec';
    if (multi) {
      spec.innerHTML = '<span class="pcard-size-badge">규격 ' + vs.length + '종</span> ' + esc(sizeSummary(vs));
    } else {
      spec.textContent = specText(vs[0]) ? '규격 ' + specText(vs[0]) : '규격 상담 확인';
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
      /* 카드에 보이는 사진의 규격을 기본 선택해 연다(사진 클릭과 같은 동작) */
      add.addEventListener('click', function () { openDetail(view, photo); });
    } else {
      var p = vs[0];
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
  paintCatHead();
  render();

  /* deep link: products.html?cat=pot · ?q=프라이팬 · ?brand=TOSCO */
  try {
    var sp = new URLSearchParams(window.location.search);
    var cat = sp.get('cat');
    if (cat && CAT_LABEL[cat] && chipWrap) {
      var btn = chipWrap.querySelector('button[data-cat="' + cat + '"]');
      if (btn) btn.click();
    }
    var brand = sp.get('brand');
    if (brand && brandSel) {
      Array.prototype.forEach.call(brandSel.options, function (o) {
        if (o.value === brand) { brandSel.value = brand; state.brand = brand; render(); }
      });
    }
    var kw = sp.get('q');
    if (kw && q) { q.value = kw; q.dispatchEvent(new Event('input')); }
  } catch (e) {}
})();
