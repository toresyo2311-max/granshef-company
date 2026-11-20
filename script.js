/* 주식회사 그랑쉐프 — corporate site interactions */
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

  /* ?reveal=all — show every reveal block at once (captures, printing) */
  try {
    if (new URLSearchParams(window.location.search).get('reveal') === 'all') {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  } catch (e) {}

  /* stagger children of grids */
  document.querySelectorAll('.cards, .grid-8, .values, .certs, .client-grid').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  /* ── shared helpers: smooth scroll, quote prefill, clipboard ───────── */
  var scrollToEl = function (el) {
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 860 ? 76 : 64);
    window.scrollTo({ top: top, behavior: 'smooth' });
  };

  var requestQuote = function (opts) {
    var form = document.getElementById('inquiryForm');
    var contact = document.getElementById('contact');
    if (!form || !contact) return;

    var brandInput = form.querySelector('[name="brand"]');
    var msg = form.querySelector('[name="message"]');
    var company = form.querySelector('[name="company"]');

    if (brandInput) brandInput.value = opts.brand || '';
    if (msg) {
      msg.value = opts.message;
      msg.classList.add('is-prefilled');
      window.setTimeout(function () { msg.classList.remove('is-prefilled'); }, 1800);
    }

    var result = document.getElementById('formResult');
    if (result) result.hidden = true;

    scrollToEl(contact);
    window.setTimeout(function () {
      if (company && window.innerWidth > 860) company.focus({ preventScroll: true });
    }, 520);
  };

  var copyText = function (text, onDone, onFail) {
    var fallback = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok && onDone) onDone(); else if (!ok && onFail) onFail();
      } catch (e) {
        if (onFail) onFail();
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (onDone) onDone();
      }).catch(fallback);
    } else {
      fallback();
    }
  };

  /* address copy */
  var copyAddrBtn = document.getElementById('copyAddr');
  var copyNote = document.getElementById('copyNote');
  if (copyAddrBtn) {
    var addr = copyAddrBtn.getAttribute('data-addr') || '';
    copyAddrBtn.addEventListener('click', function () {
      var say = function (msg) {
        if (!copyNote) return;
        copyNote.textContent = msg;
        copyNote.classList.add('is-on');
        window.setTimeout(function () { copyNote.classList.remove('is-on'); }, 2600);
      };
      copyText(addr, function () {
        say('사업장 주소가 복사되었습니다 — ' + addr);
      }, function () {
        say('복사가 차단되었습니다. 주소를 직접 선택해 주세요 — ' + addr);
      });
    });
  }

  /* package cards → quote prefill */
  document.addEventListener('click', function (e) {
    var pack = e.target.closest('a[data-quote]');
    if (!pack) return;
    var name = pack.getAttribute('data-quote');
    requestQuote({
      message: '[' + name + '] 구성으로 납품 견적을 문의합니다.\n\n' +
        '· 업체 / 매장 : \n' +
        '· 필요 품목 : \n' +
        '· 수량 : \n' +
        '· 납품 장소 : \n' +
        '· 희망 납기 : '
    });
  });

  /* mobile floating bar hides over the contact section */
  var floatBar = document.getElementById('floatBar');
  var contactSection = document.getElementById('contact');
  if (floatBar && contactSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        floatBar.classList.toggle('is-hidden', entry.isIntersecting);
      });
    }, { threshold: 0.14 }).observe(contactSection);
  }

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
      items: ['브리오 인덕션 멀티팟 4P 세트', '쿠킨 꼬꼬 경량 뚝배기 IH냄비', '쿠킨 IH 인덕션 스테인리스 주전자', '쿠킨 전기 보온 밥솥 (KCJ-380CP)', '원터치 스테인리스 304 밀폐용기 4종'],
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
      desc: '압력솥·냄비·쌀통까지 아우르는 국내 주방용품 제조사. 통3중·통오중 스테인리스과 IH 라인을 갖추고 있습니다.',
      items: ['포르트플러스 통3중 압력솥', 'Easy 압력솥 1.2L', '갤럭시 5 스테인리스 POT', '금상첨화 인덕션 궁중전골 냄비 24cm', '헥사 통오중 엠보 냄비', 'Easy 진공쌀통 10kg'],
      url: 'https://www.kitchenart.co.kr/', urlLabel: 'kitchenart.co.kr'
    },
    {
      no: '06', name: '선학', en: 'SUNHAK CO., LTD. · PAJU', cat: 'cook', catLabel: '냄비·팬',
      desc: '경기 파주 자체 공장에서 IH 냄비·찜솥·오븐글라스·밀폐용기를 직접 만드는 주방용품 제조사입니다.',
      items: ['IH 스테인리스 라면냄비', 'IH 스테인리스 전골냄비', '스테인리스 IH 2단 찜솥', '스위칠랜드 아미 저압냄비 5L·7L', 'SH 오븐글라스 세트', '스위칠랜드아미 스테인리스 밀폐용기'],
      url: 'https://sunhakco.kr/', urlLabel: 'sunhakco.kr'
    },
    {
      no: '07', name: '퀸센스', en: 'QUEENSENSE · SESHIN', cat: 'cook', catLabel: '냄비·팬',
      desc: '세신퀸센스(주)의 쿡웨어 브랜드. 통3중·통5중 스테인리스과 IH 세라믹, 밀폐용기까지 폭넓게 갖췄습니다.',
      items: ['아띠 스테인리스 통3중 양수냄비 18·20·24cm', '모던304 인덕션 양수냄비 18cm', '올보르 스테인리스304 IH 양수냄비 16·20cm', '쿠치니 던켈 IH 세라믹 양수냄비 20·24cm', 'CESSIN 7PLY 316 양수20·곰솥30'],
      url: 'https://seshinmall.com/', urlLabel: 'seshinmall.com'
    },
    {
      no: '08', name: '리빙코리아', en: 'LIVING KOREA · LIVINGWELL', cat: 'appliance', catLabel: '주방가전',
      desc: '(주)리빙앤코리아의 생활가전 브랜드. 에어프라이어·전기오븐 등 주방가전을 자체 기획·유통합니다.',
      items: ['올스테인리스 대용량 에어프라이어 AF300', '40L 대용량 컨벤션 전기오븐 AF400', '영업용 75L 초대형 전기오븐 OV750', '컨벡션 전기오븐 48L', '2in1 무선청소기 VC310'],
      url: 'https://livingkorea.kr/', urlLabel: 'livingkorea.kr'
    },
    {
      no: '09', name: '제니얼', en: 'ZENIAL · HWASEONG', cat: 'tool', catLabel: '조리도구·수저',
      desc: '경기 화성의 주방조리기구 제조사. 쿠치나 IH 세라믹웍과 조리도구·칼류를 생산합니다.',
      items: ['쿠치나 IH 인덕션 세라믹 웍 26cm', '돌핀 식도 칼블럭 세트 622', '돌핀 과도(톱니)', '다용도 스테인리스 주방 1004가위', 'GC시리즈 바움 3P'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미운영'
    },
    {
      no: '10', name: '이라이프', en: 'ELIFE · LOTTE PACKAGING SOLUTIONS', cat: 'living', catLabel: '식기·생활',
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
      no: '13', name: '영진알루미늄', en: 'YEONGJIN ALUMINIUM · DAEGU', cat: 'cook', catLabel: '냄비·팬',
      desc: '대구 달서구의 알루미늄 주방기물 제조사. 양은냄비·들통·곰솥처럼 업소에서 많이 쓰는 알루미늄 제품을 만듭니다.',
      items: ['영진 양은냄비(황냄비) 16~40cm', '알루미늄 들통', '알루미늄 곰솥', '양은 주전자', '알루미늄 프라이팬'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '14', name: '대원경금속', en: 'DAEWON KYUNG METAL · DAEGU', cat: 'cook', catLabel: '냄비·팬',
      desc: '대구 달서구 대천동의 알루미늄 주방용품 제조사. 양은냄비(황냄비)와 업소용 알루미늄 기물을 생산합니다.',
      items: ['대원 황냄비(양은) 편수 16~24cm', '양은 양수냄비 16~30cm', '업소용 대형 황냄비', '알루미늄 들통'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '15', name: '한국도자기', en: 'HANKOOK PORCELAIN · CHEONGJU', cat: 'living', catLabel: '식기·생활',
      desc: '1943년부터 청주 공장에서 만드는 국내 대표 도자기 그릇 브랜드. 본차이나 식기와 프라우나 컬렉션을 전개합니다.',
      items: ['므아레 블랑 공기·대접·접시', '연(姸) 컬렉션 식기', '프라우나 티보에렘 오브제', '화이트블룸', '연리지 2인조 식기세트 16p'],
      url: 'https://www.hankook.com/', urlLabel: 'hankook.com'
    },
    {
      no: '16', name: '영수인터내셔널', en: 'YOUNGSOO INTERNATIONAL · SIHEUNG', cat: 'tool', catLabel: '조리도구·수저',
      desc: '경기 시흥의 목제품·주방용품·일회용품 수입유통 업체. 수저·젓가락과 목주방용품, 일회용품을 갖췄습니다.',
      items: ['띄움 수저세트 2P', '옻칠 수저세트', '황옻칠 숫가락 5P', '일회용 대나무젓가락 100p', '논스틱 라면 냄비 17cm'],
      url: 'https://youngsoo.co.kr/', urlLabel: 'youngsoo.co.kr'
    },
    {
      no: '17', name: '홈즈', en: 'HOMZ KOREA · MS JANE', cat: 'living', catLabel: '식기·생활',
      desc: '1996년부터 생활용품 공간 솔루션을 만들어 온 (주)홈즈코리아. 수납·정리용품을 자체 브랜드로 전개합니다.',
      items: ['Ms JANE 수납·정리용품', '욕실·세탁실 정리용품', '벽장·서랍 정리 솔루션'],
      url: 'http://www.homzstore.com/', urlLabel: 'homzstore.com'
    },
    {
      no: '18', name: '네오플램', en: 'NEOFLAM · WONJU', cat: 'cook', catLabel: '냄비·팬',
      desc: '강원 원주에 본사·공장을 둔 주방용품 브랜드. PFAS-free 코팅 쿡웨어와 밀폐용기, 테이블웨어를 전개합니다.',
      items: ['피카 IH 인덕션 냄비·프라이팬', '대니쉬 IH 인덕션 프라이팬 24cm', '소이 인덕션 편수냄비 18cm', '엣지 통3중 IH 스테인리스 프라이팬 28cm', '까사 오브제 TPU 도마'],
      url: 'https://neoflamshop.co.kr/', urlLabel: 'neoflamshop.co.kr'
    },
    {
      no: '19', name: '화영', en: 'HWA YOUNG · INCHEON', cat: 'living', catLabel: '식기·생활',
      desc: '인천 남동공단의 업소용 스테인리스·티타늄 그릇류 제조·유통 업체. 화영·태림·태조 브랜드를 전개합니다.',
      items: ['업소용 스테인리스 그릇·기물', '티타늄 그릇류', '스테인리스 수저', '업소용 조리기구'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 접속 불가'
    },
    {
      no: '20', name: '그라첸', en: 'GRACHEN · HWASEONG', cat: 'cook', catLabel: '냄비·팬',
      desc: '경기 화성의 주방용품 수입·유통사. 데이세븐·셰프라인 등 인덕션 쿡웨어와 업소용 주방기물을 들여옵니다.',
      items: ['데이세븐 비타 IH 3중 올스테인리스 편수냄비 16cm', '조선 티타늄 IH 편수냄비 18cm', '셰프쿡 4단 찜전골 스테인리스 냄비', '셰프라인 스테인리스 스틸 주전자', '그라첸 타워 미니들통 22cm'],
      url: '', urlLabel: '수입사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '21', name: '로이첸', en: 'ROICHEN · SEOUL', cat: 'cook', catLabel: '냄비·팬',
      desc: '서울 송파의 주방·생활용품 브랜드. 손잡이에 조리도구가 붙는 아이마그넷과 스핀웹 쿡웨어로 알려져 있습니다.',
      items: ['아이마그넷 인덕션 프라이팬·멀티팬', 'IH 스핀웹 사각 멀티 프라이팬 5종세트', 'IH 그레이트팬·바리에팬 28cm', '아이마그넷 실리콘 조리도구', '플로락 밀폐용기'],
      url: 'https://roichen.com/', urlLabel: 'roichen.com'
    },
    {
      no: '22', name: '세신유앤씨', en: 'SESHIN U&C · BUSAN', cat: 'supply', catLabel: '유통·도매',
      desc: '부산 강서구의 업소용 주방용품 유통사. 퀸센스 제품과 자체 스테인리스 식기·냄비를 공급합니다.',
      items: ['세신유앤씨 4찬 식판', '인덕션겸용 스테인리스 라면냄비', '퀸센스 인덕션 라면냄비', '업소용 스테인리스 식기'],
      url: 'https://minishop.gmarket.co.kr/seshinunc', urlLabel: 'gmarket 세신유앤씨'
    },
    {
      no: '23', name: '동복무역', en: 'DONGBOK TRADING · INCHEON', cat: 'living', catLabel: '식기·생활',
      desc: '인천 남동구에서 30여 년간 주방용품을 수입·유통해 온 업체. 스테인리스 양푼·믹싱볼 같은 업소용 기물이 주력입니다.',
      items: ['스테인리스 양푼', '스테인리스 믹싱볼', '스테인리스 반찬통', '스테인리스 국자', '절구'],
      url: 'https://dongbok.kr/', urlLabel: 'dongbok.kr'
    },
    {
      no: '24', name: 'TOSCO', en: 'TOSCO · EUGENE TOSCO', cat: 'cook', catLabel: '냄비·팬',
      desc: '인천 남동공단의 업소용 주방용품 제조사 (주)유진토스코의 브랜드. 경질·코팅 프라이팬과 냄비 400여 종을 만듭니다.',
      items: ['토스코 경질 프라이팬 18~36', 'IH 사각 에그팬 22cm', '하이본 경질 편수냄비 18cm', '경질 중화웍(중국팬)', '업소용 2·3단 대형 찜솥'],
      url: 'http://www.eugenetosco.com', urlLabel: 'eugenetosco.com'
    },
    {
      no: '25', name: '플랜비스', en: 'PLANVIS · BUSAN', cat: 'supply', catLabel: '유통·도매',
      desc: '부산 해운대구의 주방·생활용품 유통사. 주방용품과 가정용 유리·도자기 제품을 도소매로 공급합니다.',
      items: ['주방용품', '가정용 유리·도자기', '생활용품'],
      url: '', urlLabel: '취급처 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '26', name: '화성연료', en: 'HWASEONG FUEL · CHILGOK', cat: 'supply', catLabel: '유통·도매',
      desc: '경북 칠곡의 착화탄·숯 제조사 (주)화성연료. 1975년부터 번개탄과 바로타숯을 만들어 업소·마트 채널에 공급하고, 그릴·캠핑용품도 함께 다룹니다.',
      items: ['화성연료 번개탄 220g', '착화탄(바로타숯)', '바베큐용 참숯·백탄', '그릴·캠핑용품'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '27', name: '대명멜라민', en: 'DAEMYUNG MELAMINE · KOREA', cat: 'living', catLabel: '식기·생활',
      desc: '업소·식당용 멜라민 식기를 만드는 국산 브랜드. 그레인·뉴잎 라인의 접시·찬기·공기·우동기를 업소용으로 공급합니다.',
      items: ['그레인 멜라민 신 원형접시 6~18인치', '그레인 멜라민 웰빙 사각3절접시', '뉴잎 멜라민 웰빙 1칸 사각찬기', '그레인 멜라민 민공기', '그레인 멜라민 우동기', '그레인 멜라민 덴다시'],
      url: '', urlLabel: '제조사 직거래', offNote: '공식 홈페이지 미확인'
    },
    {
      no: '28', name: '오성세라믹', en: 'OSUNG CERAMICS · SANCHEONG', cat: 'living', catLabel: '식기·생활',
      desc: '경남 산청에서 점토와 황토로 그릇을 굽는 도자기 제조사 (주)오성세라믹. 도자기 솥과 약탕기를 주력으로 만듭니다.',
      items: ['도자기 솥', '약탕기', '황토 도자기 용기'],
      url: 'http://osungceramic.co.kr', urlLabel: 'osungceramic.co.kr'
    },
    {
      no: '29', name: '월드종합주방', en: 'WORLD KITCHEN · BUSAN', cat: 'supply', catLabel: '유통·도매',
      desc: '업소용 주방용품 전문 스토어. 대형 코팅 프라이팬·볶음솥(36~60cm)과 코팅웍, 주방가위, 스테인리스·PC 밧드와 튀김 바스켓까지 업소에서 쓰는 기물을 모아 공급합니다.',
      items: ['업소용 대형 코팅 프라이팬 36~60cm', '유진토스코 업소용 코팅웍', '업소용 PC·스테인리스 밧드(바트)', '튀김 바스켓', '오복 업소용 주방가위'],
      url: 'https://smartstore.naver.com/world_-', urlLabel: 'smartstore.world_-'
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

      var quote = document.createElement('button');
      quote.type = 'button';
      quote.className = 'bd-quote';
      quote.setAttribute('data-brand', b.name);
      var quoteTxt = document.createElement('span');
      quoteTxt.textContent = '이 브랜드 납품 견적 문의';
      var quoteArrow = document.createElement('span');
      quoteArrow.className = 'bd-quote-arrow';
      quoteArrow.setAttribute('aria-hidden', 'true');
      quoteArrow.textContent = '→';
      quote.appendChild(quoteTxt);
      quote.appendChild(quoteArrow);
      quote.addEventListener('click', function () {
        requestQuote({
          brand: b.name,
          message: '[' + b.name + '] 제품 납품 견적을 문의합니다.\n\n' +
            '· 희망 품목 : \n' +
            '· 수량 : \n' +
            '· 납품 장소 : \n' +
            '· 희망 납기 : '
        });
      });
      detail.appendChild(quote);
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

    /* deep link: ?brand=11 or ?brand=동진쉐프 opens that brand */
    var wanted = null;
    try {
      wanted = new URLSearchParams(window.location.search).get('brand');
    } catch (e) {
      wanted = null;
    }
    if (wanted) {
      wanted = wanted.trim();
      var kids = picker.children;
      for (var wi = 0; wi < kids.length; wi += 1) {
        var bd = BRANDS[wi];
        if (bd.no === wanted || bd.name === wanted) {
          kids[wi].click();
          break;
        }
      }
    }

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

  /* inquiry form — build the message, hand it to the visitor's mail app */
  var form = document.getElementById('inquiryForm');
  var note = document.getElementById('formNote');
  var result = document.getElementById('formResult');
  var resultText = document.getElementById('resultText');
  var mailtoBtn = document.getElementById('mailtoBtn');
  var copyMsgBtn = document.getElementById('copyMsgBtn');
  var copyState = document.getElementById('copyState');

  var MAIL_TO = 'grandchef@naver.com';
  var MAIL_CC = 'grandcook.com@gmail.com';

  var say = function (msg, isError) {
    if (!note) return;
    note.textContent = msg;
    note.classList.toggle('error', !!isError);
  };

  var buildSummary = function (data) {
    var now = new Date();
    var ts = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2) +
      ' ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
    return [
      '[그랑쉐프 홈페이지 납품 문의]',
      '',
      '회사명 : ' + (data.company || ''),
      '담당자 : ' + (data.name || ''),
      '연락처 : ' + (data.phone || ''),
      '이메일 : ' + (data.email || '-'),
      '문의 유형 : ' + (data.type || '-'),
      '관심 브랜드 : ' + (data.brand || '-'),
      '',
      '문의 내용',
      (data.message || ''),
      '',
      '— 개인정보 수집·이용 동의 : 필수 항목 동의함 (작성 시각 ' + ts + ' 기준)',
      '— 신상품·행사 정보 수신 동의 : ' + (data.agreeMarketing ? '동의함' : '동의하지 않음'),
      '',
      '— 주식회사 그랑쉐프 홈페이지 문의 폼에서 작성되었습니다.'
    ].join('\n');
  };

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var firstBad = null;

      required.forEach(function (el) {
        var field = el.closest('.field');
        var val = String(el.value).trim();
        var ok = el.type === 'checkbox' ? el.checked : val.length > 1;
        if (el.name === 'phone') {
          ok = val.replace(/[^0-9]/g, '').length >= 9;
        }
        if (el.name === 'message') {
          ok = val.length >= 10;
        }
        if (el.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          ok = false;
        }
        if (field) field.classList.toggle('invalid', !ok);
        if (!ok && !firstBad) firstBad = el;
      });

      if (firstBad) {
        if (result) result.hidden = true;
        say(firstBad.name === 'message'
          ? '문의 내용을 10자 이상 적어 주세요.'
          : firstBad.name === 'phone'
            ? '연락처를 정확히 적어 주세요. (숫자 9자리 이상)'
            : '필수 항목을 확인해 주세요.', true);
        firstBad.focus();
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      /* 허니팟: 자동 입력 도구가 채우는 필드 — 채워져 있으면 조용히 중단 */
      if (String(data.website || '').trim()) {
        return;
      }

      var text = buildSummary(data);
      var subject = '[그랑쉐프 홈페이지 문의] ' +
        (data.company || '').trim() + ' ' + (data.name || '').trim();
      var href = 'mailto:' + MAIL_TO +
        '?cc=' + encodeURIComponent(MAIL_CC) +
        '&subject=' + encodeURIComponent(subject.trim()) +
        '&body=' + encodeURIComponent(text);

      if (mailtoBtn) mailtoBtn.setAttribute('href', href);
      if (resultText) resultText.textContent = text;
      if (copyState) copyState.textContent = '보내주신 뒤 전화로 한 번 더 확인해 주시면 가장 빠릅니다.';

      say((data.name || '') + ' 님, 문의 내용이 준비되었습니다. 아래에서 메일로 보내시거나 전화로 연락 주세요.', false);

      if (result) {
        result.hidden = false;
        result.classList.add('is-on');
        window.setTimeout(function () {
          var top = result.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 860 ? 90 : 76);
          window.scrollTo({ top: top, behavior: 'smooth' });
        }, 80);
      }
    });

    if (copyMsgBtn && resultText) {
      copyMsgBtn.addEventListener('click', function () {
        copyText(resultText.textContent, function () {
          if (copyState) copyState.textContent = '문의 내용이 복사되었습니다. 두 주소(grandchef@naver.com · grandcook.com@gmail.com)로 보내주세요.';
          copyMsgBtn.textContent = '복사됨';
          window.setTimeout(function () { copyMsgBtn.textContent = '내용 복사'; }, 2400);
        }, function () {
          if (copyState) copyState.textContent = '복사가 차단되었습니다. 아래 내용을 직접 선택해 복사해 주세요.';
        });
      });
    }
  }

  /* 견적 바구니(products.html)에서 넘어온 상품 목록을 문의 내용에 채운다 */
  try {
    var rawQuote = window.sessionStorage.getItem('gc_quote_items');
    if (rawQuote && form) {
      var items = JSON.parse(rawQuote);
      if (Array.isArray(items) && items.length) {
        var msgEl = form.querySelector('[name="message"]');
        var brandEl = form.querySelector('[name="brand"]');
        var lines = ['[' + (items.length > 1 ? '상품 묶음 견적 문의' : '상품 견적 문의') + '] ' + items.length + '건', ''];
        items.forEach(function (it, i) {
          lines.push('· 상품 ' + (i + 1) + ' : ' + it.n +
            (it.b ? ' (' + it.b + (it.s ? ' · ' + it.s : '') + ')' : ''));
        });
        lines.push('', '· 업체 / 매장 : ', '· 수량 : ', '· 납품 장소 : ', '· 희망 납기 : ');
        if (msgEl) {
          msgEl.value = lines.join('\n');
          msgEl.classList.add('is-prefilled');
          window.setTimeout(function () { msgEl.classList.remove('is-prefilled'); }, 1800);
        }
        if (brandEl && items.length === 1 && items[0].b) brandEl.value = items[0].b;
        window.sessionStorage.removeItem('gc_quote_items');
      }
    }
  } catch (e) {}

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
