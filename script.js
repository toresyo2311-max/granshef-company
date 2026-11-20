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
  document.querySelectorAll('.cards, .grid-8, .values, .certs, .client-grid').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  /* brand picker + detail */
  var BRANDS = [
    {
      no: '01', name: 'PN풍년', en: 'PN PUNGNYUN · SINCE 1954', cat: 'cook', catLabel: '냄비·팬',
      desc: '1954년 국내 최초 압력솥을 만든 압력솥·쿡웨어 대표 브랜드. 압력솥부터 IH 냄비, 주방소품까지 전개합니다.',
      items: ['풍년1954 뉴 손주물 압력솥', '몽꽁떼 스튜팟 IH', '위더스 티앤쿡 케틀팟 IH', '꾸노 폴딩 실리콘 채반', '위더스 프레시 밧드'],
      url: 'https://www.pn.co.kr/home', urlLabel: 'pn.co.kr'
    },
    {
      no: '02', name: '키친플라워', en: 'NAMYANG KITCHEN FLOWER · 쿠킨', cat: 'cook', catLabel: '냄비·팬',
      desc: '(주)남양키친플라워의 주방·생활용품 브랜드. 쿠킨 라인의 냄비·전기포트·밥솥·믹서를 자사몰에서 만납니다.',
      items: ['브리오 인덕션 멀티팟 4P 세트', '쿠킨 꼬꼬 경량 뚝배기 IH냄비', '쿠킨 IH 인덕션 스텐 주전자', '쿠킨 전기 보온 밥솥 (KCJ-380CP)', '원터치 스텐304 밀폐용기 4종'],
      url: 'https://kitchenflower.co.kr/', urlLabel: 'kitchenflower.co.kr'
    },
    {
      no: '03', name: '테팔', en: 'TEFAL · FRANCE', cat: 'cook', catLabel: '냄비·팬',
      desc: '프라이팬·쿡웨어 세계 판매 1위 브랜드. 티타늄 코팅과 열센서, 풀와이드 인덕션 기술로 알려져 있습니다.',
      items: ['인덕션 티타늄 3X 프라이팬 28cm', '스타트앤쿡 프라이팬', '델리시오 프라이팬', '인덕션 스테인리스 스틸 냄비', '에브리데이 곰솥 10L'],
      url: 'https://www.tefal.co.kr/', urlLabel: 'tefal.co.kr'
    },
    {
      no: '04', name: '해피콜', en: 'HAPPYCALL · HC COMPANY', cat: 'cook', catLabel: '냄비·팬',
      desc: 'HC컴퍼니의 생활 주방 브랜드. 프라이팬·궁중팬·양면팬·냄비와 블렌더 등 주방가전을 함께 전개합니다.',
      items: ['다이아몬드 포셀 인덕션 프라이팬 28cm', '다이아몬드 포셀 인덕션 궁중팬 28cm', '모던 티타늄 인덕션 프라이팬·궁중팬 세트 2P', '컴플리트 티타늄 계란말이팬', '다이아몬드 인덕션 냄비세트 4종'],
      url: 'https://www.happycall.kr/', urlLabel: 'happycall.kr'
    },
    {
      no: '05', name: '키친아트', en: 'KITCHEN ART · INCHEON', cat: 'cook', catLabel: '냄비·팬',
      desc: '압력솥·냄비·쌀통까지 아우르는 국내 주방용품 제조사. 통3중·통오중 스텐과 IH 라인을 갖추고 있습니다.',
      items: ['포르트플러스 통3중 압력솥', 'Easy 압력솥 1.2L', '갤럭시 5 스테인레스 POT', '금상첨화 인덕션 궁중전골 냄비 24cm', '헥사 통오중 엠보 냄비', 'Easy 진공쌀통 10kg'],
      url: 'https://www.kitchenart.co.kr/', urlLabel: 'kitchenart.co.kr'
    },
    {
      no: '06', name: '선학', en: 'SUNHAK CO., LTD. · PAJU', cat: 'cook', catLabel: '냄비·팬',
      desc: '경기 파주 자체 공장에서 IH 냄비·찜솥·오븐글라스·밀폐용기를 직접 만드는 주방용품 제조사입니다.',
      items: ['IH 스텐 라면냄비', 'IH 스텐 전골냄비', '스테인레스 IH 2단 찜솥', '스위칠랜드 아미 저압냄비 5L·7L', 'SH 오븐글라스 세트', '스위칠랜드아미 스텐 밀폐용기'],
      url: 'https://sunhakco.kr/', urlLabel: 'sunhakco.kr'
    },
    {
      no: '07', name: '퀸센스', en: 'QUEENSENSE · SESHIN', cat: 'cook', catLabel: '냄비·팬',
      desc: '세신퀸센스(주)의 쿡웨어 브랜드. 통3중·통5중 스텐과 IH 세라믹, 밀폐용기까지 폭넓게 갖췄습니다.',
      items: ['아띠 스테인레스 통3중 양수냄비 18·20·24cm', '모던304 인덕션 양수냄비 18cm', '올보르 스테인리스304 IH 양수냄비 16·20cm', '쿠치니 던켈 IH 세라믹 양수냄비 20·24cm', 'CESSIN 7PLY 316 양수20·곰솥30'],
      url: 'https://seshinmall.com/', urlLabel: 'seshinmall.com'
    },
    {
      no: '08', name: '리빙코리아', en: 'LIVING KOREA · LIVINGWELL', cat: 'appliance', catLabel: '주방가전',
      desc: '(주)리빙앤코리아의 생활가전 브랜드. 에어프라이어·전기오븐 등 주방가전을 자체 기획·유통합니다.',
      items: ['올스텐 대용량 에어프라이어 AF300', '40L 대용량 컨벡션 전기오븐 AF400', '영업용 75L 초대형 전기오븐 OV750', '컨벡션 전기오븐 48L', '2in1 무선청소기 VC310'],
      url: 'https://livingkorea.kr/', urlLabel: 'livingkorea.kr'
    },
    {
      no: '09', name: '제니얼', en: 'ZENIAL · HWASEONG', cat: 'tool', catLabel: '조리도구·칼',
      desc: '경기 화성의 주방조리기구 제조사. 쿠치나 IH 세라믹웍과 조리도구·칼류를 생산합니다.',
      items: ['쿠치나 IH 인덕션 세라믹 웍 26cm', '돌핀 식도 칼블럭 세트 622', '돌핀 과도(톱니)', '다용도 스테인레스 주방 1004가위', 'GC시리즈 바움 3P'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미운영'
    },
    {
      no: '10', name: '이라이프', en: 'ELIFE · LOTTE PACKAGING SOLUTIONS', cat: 'living', catLabel: '밀폐·생활',
      desc: '롯데패키징솔루션즈(주)의 생활용품 브랜드. 밀폐용기·호일·위생백·일회용품 등 2,000여 품목을 전개합니다.',
      items: ['유리 밀폐용기 원형 640ml', '종이호일 알뜰형 30cm×20m', '이중 지퍼백 특대형', '1+1 위생롤백 대형 30×40', '이라이프 리빙박스 XXL 58.5L', '다회용 접시·컵'],
      url: 'https://lotteelife.co.kr/', urlLabel: 'lotteelife.co.kr'
    },
    {
      no: '11', name: '동진쉐프', en: 'DONGJIN CHEF · KITCHENWELL · GIMPO', cat: 'cook', catLabel: '냄비·팬',
      desc: '경기도 김포의 주방용품 제조사 (주)동진셰프. 자체 브랜드 키친웰로 IH 냄비·프라이팬·웍을 생산하고, 국내 유통과 수출을 함께 합니다.',
      items: ['루나쿠체 IH 프라이팬·웍', '미다스 IH 프라이팬·웍', '블랙에지 IH 프라이팬·웍', '오르세 세라믹 냄비세트', '2단 샤브샤브 냄비'],
      url: 'https://kitchenwell.co.kr/', urlLabel: 'kitchenwell.co.kr'
    },
    {
      no: '12', name: '매직쉐프', en: 'MAGIC CHEF KOREA', cat: 'appliance', catLabel: '주방가전',
      desc: '(주)매직쉐프코리아의 주방·생활가전 브랜드. 전자레인지·오븐·에어프라이어부터 냉장고·제빙기까지 폭넓게 전개합니다.',
      items: ['5L 전기주전자 MEK-L500SKP', '23L 전자레인지 MWM-M23FW', '에어프라이어 4.5L MAF-Y550IV', '20L 복합오븐 MAO-G200W', '전기압력밥솥 3L MRC-L30B'],
      url: 'https://magicchefkorea.co.kr/', urlLabel: 'magicchefkorea.co.kr'
    },
    {
      no: '13', name: '영진', en: 'YEONGJIN ALUMINIUM · DAEGU', cat: 'cook', catLabel: '냄비·팬',
      desc: '대구 달서구의 알루미늄 주방기물 제조사 영진알루미늄(주). 양은냄비·들통·곰솥처럼 업소에서 많이 쓰는 알루미늄 제품을 만듭니다.',
      items: ['영진 양은냄비(황냄비) 12~40cm', '알루미늄 들통', '알루미늄 곰솥', '양은 주전자', '알루미늄 프라이팬'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '14', name: '대원코리아', en: 'DAEWON KOREA · BUSAN', cat: 'supply', catLabel: '유통·연료',
      desc: '그랑쉐프가 거래하는 주방·생활용품 유통처입니다. 업소·도매 채널에 필요한 주방 소도구와 소모품을 상담으로 공급합니다.',
      items: ['업소용 주방 소도구', '주방 소모품·비품', '시즌·행사 기획 상품'],
      url: '', urlLabel: '취급처 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '15', name: '화석연료', en: 'FUEL & CONSUMABLES', cat: 'supply', catLabel: '유통·연료',
      desc: '업소·마트 채널에 공급하는 연료·소모품 취급처입니다. 부탄가스 등 휴대용 연료와 점화용 소모품을 상담으로 공급합니다.',
      items: ['부탄가스·휴대용 연료', '숯·점화용 소모품', '업소용 연료류'],
      url: '', urlLabel: '취급처 직거래', offNote: '공식 홈페이지 미확인'
    }
  ];

  var picker = document.getElementById('brandPicker');
  var detail = document.getElementById('brandDetail');

  if (picker && detail) {
    var current = -1;

    var hintHTML = function () {
      var p = document.createElement('p');
      p.className = 'bd-hint';
      p.textContent = '브랜드를 선택하면 업체 소개와 공식 사이트 링크가 표시됩니다.';
      return p;
    };

    var renderDetail = function (b) {
      detail.innerHTML = '';

      var cat = document.createElement('span');
      cat.className = 'bd-cat';
      cat.textContent = b.catLabel;

      var h = document.createElement('h3');
      h.className = 'bd-name';
      h.textContent = b.name;

      var en = document.createElement('p');
      en.className = 'bd-en';
      en.textContent = b.en;

      var desc = document.createElement('p');
      desc.className = 'bd-desc';
      desc.textContent = b.desc;

      var sub = document.createElement('h4');
      sub.className = 'bd-sub';
      sub.textContent = '대표 취급 제품';

      var ul = document.createElement('ul');
      ul.className = 'bd-items';
      b.items.forEach(function (it) {
        var li = document.createElement('li');
        li.textContent = it;
        ul.appendChild(li);
      });

      detail.appendChild(cat);
      detail.appendChild(h);
      detail.appendChild(en);
      detail.appendChild(desc);
      detail.appendChild(sub);
      detail.appendChild(ul);

      if (b.url) {
        var a = document.createElement('a');
        a.className = 'bd-link';
        a.href = b.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        var lab = document.createElement('span');
        lab.textContent = '공식 홈페이지 열기 ↗';
        var u = document.createElement('span');
        u.className = 'bd-url';
        u.textContent = b.urlLabel;
        a.appendChild(lab);
        a.appendChild(u);
        detail.appendChild(a);
      } else {
        var off = document.createElement('span');
        off.className = 'bd-link off';
        off.textContent = (b.offNote || '공식 홈페이지 미운영') + ' · ' + b.urlLabel;
        detail.appendChild(off);
      }
    };

    BRANDS.forEach(function (b, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bpick';
      btn.setAttribute('data-cat', b.cat);
      btn.setAttribute('data-index', String(i));

      var no = document.createElement('span');
      no.className = 'bpick-no';
      no.textContent = b.no;
      var nm = document.createElement('span');
      nm.className = 'bpick-name';
      nm.textContent = b.name;
      var ct = document.createElement('span');
      ct.className = 'bpick-cat';
      ct.textContent = b.catLabel;

      btn.appendChild(no);
      btn.appendChild(nm);
      btn.appendChild(ct);
      btn.setAttribute('aria-pressed', 'false');

      btn.addEventListener('click', function () {
        current = i;
        Array.prototype.forEach.call(picker.children, function (c) {
          var on = c === btn;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderDetail(b);
        if (window.innerWidth <= 1024) {
          var top = detail.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });

      picker.appendChild(btn);
    });

    /* category filter */
    var chips = Array.prototype.slice.call(document.querySelectorAll('.brand-filter .chip'));
    var bpicks = Array.prototype.slice.call(picker.children);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        bpicks.forEach(function (btn) {
          var show = key === 'all' || btn.getAttribute('data-cat') === key;
          btn.classList.toggle('hide', !show);
          if (show) btn.classList.add('in');
        });
        if (current > -1) {
          var sel = BRANDS[current];
          if (key !== 'all' && sel.cat !== key) {
            current = -1;
            Array.prototype.forEach.call(picker.children, function (c) {
              c.classList.remove('is-on');
              c.setAttribute('aria-pressed', 'false');
            });
            detail.innerHTML = '';
            detail.appendChild(hintHTML());
          }
        }
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
