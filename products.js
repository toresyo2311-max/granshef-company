/* 주식회사 그랑쉐프 — 취급상품 요약 (분류·브랜드 검색 · 견적 바구니)
   대표 품목 목록은 products.html에 정적으로 들어 있고, 이 스크립트는
   검색·분류 필터, 상세 보기, 견적 바구니(브라우저 저장), 문의 폼 전달만 맡는다. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var rows = Array.prototype.slice.call(document.querySelectorAll('.prow'));
  if (!rows.length) return;

  var blocks = Array.prototype.slice.call(document.querySelectorAll('.cat-block'));
  var grid = $('blocks'), countEl = $('count'), emptyEl = $('empty');
  var chipWrap = $('catChips'), qEl = $('q'), qClear = $('qClear');
  var state = { q: '', cat: 'all' };

  /* 카테고리 한글 이름 — 행의 meta에서 그대로 읽어 쓴다 */
  var catLabelOf = {};
  rows.forEach(function (r) {
    var span = r.querySelector('.prow-meta span');
    if (span) catLabelOf[r.getAttribute('data-cat')] = span.textContent.trim();
  });

  function info(r) {
    return {
      n: r.getAttribute('data-name'),
      b: r.getAttribute('data-brand'),
      c: r.getAttribute('data-cat'),
      s: r.getAttribute('data-spec') || ''
    };
  }

  /* ── 검색·분류 필터 ───────────────────────────────────────── */
  function matches(r) {
    if (state.cat !== 'all' && r.getAttribute('data-cat') !== state.cat) return false;
    if (!state.q) return true;
    var hay = (r.getAttribute('data-name') + ' ' + r.getAttribute('data-brand') + ' ' +
      r.getAttribute('data-cat') + ' ' + (catLabelOf[r.getAttribute('data-cat')] || '') + ' ' +
      (r.getAttribute('data-spec') || '')).toLowerCase();
    return hay.indexOf(state.q) >= 0;
  }

  function render() {
    var shown = 0;
    rows.forEach(function (r) {
      var ok = matches(r);
      r.hidden = !ok;
      if (ok) shown += 1;
    });
    blocks.forEach(function (b) {
      var any = b.querySelector('.prow:not([hidden])');
      b.hidden = !any;
    });
    if (countEl) {
      countEl.innerHTML = '<strong>' + shown + '</strong>개 품목' +
        (state.cat !== 'all' ? ' · ' + (catLabelOf[state.cat] || '') : '') +
        ' <span class="cat-count-all">/ 대표 품목 ' + rows.length + '개</span>';
    }
    if (emptyEl) emptyEl.hidden = shown > 0;
    if (grid) grid.classList.toggle('is-empty', shown === 0);
  }

  if (chipWrap) {
    chipWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      setCat(btn.getAttribute('data-cat'));
    });
  }

  /* 검색은 전체 분류에서 찾는다 — 분류 칩이 눌려 있으면 함께 풀어 준다 */
  function setCat(key) {
    state.cat = key;
    if (chipWrap) {
      Array.prototype.forEach.call(chipWrap.children, function (c) {
        var on = c.getAttribute('data-cat') === key;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    render();
  }

  if (qEl) {
    qEl.addEventListener('input', function () {
      state.q = qEl.value.trim().toLowerCase();
      if (qClear) qClear.hidden = !qEl.value;
      if (state.q && state.cat !== 'all') { setCat('all'); return; }
      render();
    });
  }
  if (qClear) {
    qClear.addEventListener('click', function () {
      qEl.value = ''; state.q = ''; qClear.hidden = true; qEl.focus(); render();
    });
  }

  /* ── 견적 바구니 (localStorage) ───────────────────────────── */
  var KEY = 'gc_quote_v1';
  var basket = [];
  try {
    var saved = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) basket = saved.filter(function (x) { return x && x.n; });
  } catch (e) { basket = []; }

  var basketEl = $('basket'), basketList = $('basketList'), basketEmpty = $('basketEmpty');

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(basket)); } catch (e) {}
    paintCount();
  }
  function has(it) {
    return basket.some(function (x) { return x.n === it.n && x.b === it.b; });
  }
  function add(it) {
    if (has(it)) return false;
    basket.push(it);
    save();
    paintBasket();
    return true;
  }
  function removeAt(i) {
    basket.splice(i, 1);
    save();
    paintBasket();
  }
  function paintCount() {
    [$('basketCount'), $('basketCount2')].forEach(function (el) {
      if (el) el.textContent = String(basket.length);
    });
    var b = $('basketOpen');
    if (b) b.classList.toggle('has-items', basket.length > 0);
  }

  function paintBasket() {
    if (basketList) {
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
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'bl-del';
        del.setAttribute('aria-label', it.n + ' 빼기');
        del.textContent = '✕';
        del.addEventListener('click', function () { removeAt(i); paintRows(); });
        li.appendChild(txt);
        li.appendChild(del);
        basketList.appendChild(li);
      });
    }
    if (basketEmpty) basketEmpty.hidden = basket.length > 0;
    paintCount();
  }

  function setOpen(open) {
    if (!basketEl) return;
    basketEl.hidden = !open;
    basketEl.classList.toggle('is-open', open);
    document.body.classList.toggle('basket-lock', open);
    var b = $('basketOpen');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  var bo = $('basketOpen'); if (bo) bo.addEventListener('click', function () { setOpen(basketEl.hidden); });
  var bc = $('basketClose'); if (bc) bc.addEventListener('click', function () { setOpen(false); });
  var bclear = $('basketClear');
  if (bclear) bclear.addEventListener('click', function () {
    basket = []; save(); paintBasket(); paintRows();
  });
  var quoteGo = $('quoteGo');
  if (quoteGo) quoteGo.addEventListener('click', function () {
    if (!basket.length) { setOpen(true); return; }
    toInquiry(basket);
  });

  function toInquiry(items) {
    var payload = items.map(function (it) {
      return { n: it.n, b: it.b, c: catLabelOf[it.c] || '', s: it.s };
    });
    try { window.sessionStorage.setItem('gc_quote_items', JSON.stringify(payload)); } catch (e) {}
    window.location.href = 'index.html#contact';
  }

  /* 담김 상태를 행 버튼에 반영 */
  function paintRows() {
    rows.forEach(function (r) {
      var btn = r.querySelector('.prow-add');
      if (!btn) return;
      var on = has(info(r));
      btn.classList.toggle('is-in', on);
      btn.textContent = on ? '담김 ✓' : '+ 견적 담기';
    });
  }

  rows.forEach(function (r) {
    var it = info(r);
    var btn = r.querySelector('.prow-add');
    if (btn) btn.addEventListener('click', function () {
      if (add(it)) { paintRows(); setOpen(true); }
    });
  });

  /* ── 상세 보기 ────────────────────────────────────────────── */
  var dlg = $('pdetail');
  var pdImg = $('pdImg'), pdImgCap = $('pdImgCap'), pdCat = $('pdCat'),
      pdName = $('pdName'), pdBrand = $('pdBrand'), pdSpec = $('pdSpec'),
      pdAdd = $('pdAdd'), pdAsk = $('pdAsk');
  var current = null;

  function openDetail(r) {
    if (!dlg || !dlg.showModal) return;
    current = info(r);
    var img = r.getAttribute('data-img');
    var real = r.getAttribute('data-kind') === 'real';
    pdImg.src = img;
    pdImg.alt = current.n + ' — ' + (catLabelOf[current.c] || '') + (real ? ' 제품 이미지' : ' 품목 예시 이미지');
    pdImgCap.textContent = real ? '실제 제품 이미지 · 실제 제품과 다를 수 있음' : '품목 예시 이미지 · 실제 제품과 다를 수 있음';
    pdCat.textContent = catLabelOf[current.c] || '';
    pdName.textContent = current.n;
    pdBrand.textContent = current.b;
    pdSpec.textContent = current.s || '규격 미표기 — 상담 확인';
    pdAdd.textContent = has(current) ? '담김 ✓' : '견적 담기';
    dlg.showModal();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.prow-media, .prow-name button'), function (el) {
    el.addEventListener('click', function () { openDetail(el.closest('.prow')); });
  });

  var pdClose = $('pdClose');
  if (pdClose) pdClose.addEventListener('click', function () { dlg.close(); });
  if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  if (pdAdd) pdAdd.addEventListener('click', function () {
    if (!current) return;
    var added = add(current);
    pdAdd.textContent = added ? '담김 ✓' : '이미 담김';
    paintRows();
    if (dlg && dlg.open) dlg.close();
    setOpen(true);
  });
  if (pdAsk) pdAsk.addEventListener('click', function (e) {
    if (!current) return;
    e.preventDefault();
    toInquiry([current]);
  });

  /* ── deep link: products.html?cat=pro · ?q=밧드 ─────────────── */
  try {
    var sp = new URLSearchParams(window.location.search);
    var cat = sp.get('cat');
    if (cat && chipWrap) {
      var cb = chipWrap.querySelector('button[data-cat="' + cat + '"]');
      if (cb) cb.click();
    }
    var kw = sp.get('q');
    if (kw && qEl) { qEl.value = kw; qEl.dispatchEvent(new Event('input')); }
  } catch (e) {}

  paintBasket();
  paintRows();
  render();
})();
