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

  /* ── image per item: 품목별 세부 이미지(catalog.js의 i 키) ───────── */
  var ITEM_DIR = 'assets/img/items/';
  function imageFor(p) {
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

  function searchKey(p) {
    return (p.n + ' ' + p.b + ' ' + specText(p) + ' ' + CAT_LABEL[p.c]).toLowerCase();
  }

  var state = { q: '', cat: 'all', brand: '', size: '', sort: 'cat' };

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), countEl = $('count'), emptyEl = $('empty');

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

  function filtered() {
    var list = PRODUCTS.filter(function (p) {
      if (state.cat !== 'all' && p.c !== state.cat) return false;
      if (state.brand && p.b !== state.brand) return false;
      if (state.size && !p.g[state.size]) return false;
      if (state.q && searchKey(p).indexOf(state.q) < 0) return false;
      return true;
    });
    if (state.sort === 'name') list.sort(function (a, b) { return a.n.localeCompare(b.n, 'ko'); });
    else if (state.sort === 'brand') {
      list.sort(function (a, b) { return a.b.localeCompare(b.b, 'ko') || a.n.localeCompare(b.n, 'ko'); });
    } else {
      var order = {};
      CATS.forEach(function (c, i) { order[c.k] = i; });
      list.sort(function (a, b) { return (order[a.c] - order[b.c]) || a.n.localeCompare(b.n, 'ko'); });
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
    render();
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
    basket = []; saveBasket(); paintBasket(); render();
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

  /* ── product detail dialog ───────────────────────────────────── */
  var dlg = $('pdetail');
  var pdName = $('pdName'), pdBrand = $('pdBrand'), pdCat = $('pdCat'),
      pdSpec = $('pdSpec'), pdBarcode = $('pdBarcode'), pdImg = $('pdImg'),
      pdNote = $('pdNote'), pdAdd = $('pdAdd'), pdAsk = $('pdAsk');
  var current = null;

  function openDetail(p) {
    current = p;
    if (!dlg || !dlg.showModal) return;
    pdName.textContent = p.n;
    pdBrand.textContent = p.b;
    pdCat.textContent = CAT_LABEL[p.c];
    pdSpec.textContent = specText(p) || '규격 미표기 — 상담 확인';
    pdBarcode.textContent = '상담 확인 (표기 전 검증 필요)';
    pdImg.src = imageFor(p);
    pdImg.alt = p.n + ' — ' + CAT_LABEL[p.c] + ' 분류 예시 이미지 (AI 생성)';
    pdNote.textContent = p.u
      ? '브랜드 공식 홈페이지에 게시된 취급 품목입니다. 실제 재고·규격·납기는 상담으로 확인합니다.'
      : '취급 품목으로 정리된 상품입니다. 실제 재고·규격·납기는 상담으로 확인합니다.';
    pdAdd.textContent = inBasket(p) ? '담김 ✓' : '견적 담기';
    pdAsk.onclick = null;
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
    if (!current) return;
    var added = addToBasket(current);
    pdAdd.textContent = added ? '담김 ✓' : '이미 담김';
    render();
    if (dlg && dlg.open) dlg.close();
    setBasketOpen(true);
  });
  if (pdAsk) pdAsk.addEventListener('click', function (e) {
    if (!current) return;
    e.preventDefault();
    toInquiry([{ n: current.n, b: current.b, c: current.c, s: specText(current) }]);
  });

  /* ── render list ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    if (!grid) return;
    var list = filtered();
    grid.innerHTML = '';
    if (countEl) {
      countEl.innerHTML = '<strong>' + list.length + '</strong>개 상품' +
        (state.cat !== 'all' ? ' · ' + esc(CAT_LABEL[state.cat]) : '') +
        ' <span class="cat-count-all">/ 전체 ' + PRODUCTS.length + '개</span>';
    }
    if (emptyEl) emptyEl.hidden = list.length > 0;

    var frag = document.createDocumentFragment();
    list.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'pcard';

      var media = document.createElement('button');
      media.type = 'button';
      media.className = 'pcard-media';
      media.setAttribute('aria-label', p.n + ' 상세 보기');
      var img = document.createElement('img');
      img.src = imageFor(p);
      img.alt = p.n + ' — ' + CAT_LABEL[p.c] + ' 예시 이미지 (AI 생성)';
      img.width = 1100; img.height = 1100;
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
      media.addEventListener('click', function () { openDetail(p); });

      var body = document.createElement('div');
      body.className = 'pcard-body';

      var meta = document.createElement('p');
      meta.className = 'pcard-meta';
      meta.innerHTML = '<span>' + esc(p.b) + '</span><span>' + esc(CAT_LABEL[p.c]) + '</span>';

      var h = document.createElement('h3');
      h.className = 'pcard-name';
      var nameBtn = document.createElement('button');
      nameBtn.type = 'button';
      nameBtn.textContent = p.n;
      nameBtn.addEventListener('click', function () { openDetail(p); });
      h.appendChild(nameBtn);

      var spec = document.createElement('p');
      spec.className = 'pcard-spec';
      spec.textContent = specText(p) ? '규격 ' + specText(p) : '규격 상담 확인';

      var foot = document.createElement('div');
      foot.className = 'pcard-foot';
      var price = document.createElement('span');
      price.className = 'pcard-price';
      price.textContent = '가격 상담';
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'pcard-add' + (inBasket(p) ? ' is-in' : '');
      add.textContent = inBasket(p) ? '담김 ✓' : '+ 견적 담기';
      add.addEventListener('click', function () {
        if (addToBasket(p)) {
          add.textContent = '담김 ✓';
          add.classList.add('is-in');
        }
        setBasketOpen(true);
      });
      foot.appendChild(price);
      foot.appendChild(add);

      body.appendChild(meta);
      body.appendChild(h);
      body.appendChild(spec);
      body.appendChild(foot);
      card.appendChild(media);
      card.appendChild(body);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
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
