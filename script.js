/* (주)그랑쉐프 — corporate site interactions */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  /* header state */
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      nav.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* reveal on scroll */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* stagger children of grids */
  document.querySelectorAll('.cards, .grid-8, .values, .certs, .brand-grid, .client-grid').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  /* brand filter */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.brand-filter .chip'));
  var bcards = Array.prototype.slice.call(document.querySelectorAll('#brandGrid .bcard'));

  if (chips.length && bcards.length) {
    var applyFilter = function (key) {
      bcards.forEach(function (card) {
        var show = key === 'all' || card.getAttribute('data-cat') === key;
        card.classList.toggle('hide', !show);
        if (show) card.classList.add('in');
      });
    };

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        applyFilter(chip.getAttribute('data-filter'));
      });
    });
  }

  /* active nav link */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && targets.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + entry.target.id;
          a.style.color = on ? 'var(--ink)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* inquiry form — no backend yet: validation + honest hand-off */
  var form = document.getElementById('inquiryForm');
  var note = document.getElementById('formNote');

  var say = function (msg, isError) {
    if (!note) return;
    note.textContent = msg;
    note.classList.toggle('error', !!isError);
  };

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var firstBad = null;

      required.forEach(function (el) {
        var field = el.closest('.field');
        var ok = el.type === 'checkbox' ? el.checked : String(el.value).trim().length > 1;
        if (el.type === 'email' && el.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) {
          ok = false;
        }
        if (field) field.classList.toggle('invalid', !ok);
        if (!ok && !firstBad) firstBad = el;
      });

      if (firstBad) {
        say('필수 항목을 확인해 주세요.', true);
        firstBad.focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      /* 1차 시안: 실제 접수 채널 연결 전 — 전화 안내로 대신합니다 */
      say(
        (data.name || '') + ' 님, 문의 내용이 확인되었습니다. ' +
        '현재 시안 단계로 온라인 접수는 연결 전이며, ' +
        '051-892-8930으로 연락 주시면 담당자가 바로 응대해 드립니다.',
        false
      );
      form.querySelector('button[type="submit"]').textContent = '문의 내용 확인됨';
      form.querySelectorAll('input, textarea, select').forEach(function (el) {
        if (el.type !== 'checkbox') el.value = '';
      });
    });
  }

  /* smooth anchor offset for older Safari */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    var top = t.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 860 ? 76 : 64);
    window.scrollTo({ top: top, behavior: 'smooth' });
    history.replaceState(null, '', id);
  });
})();
