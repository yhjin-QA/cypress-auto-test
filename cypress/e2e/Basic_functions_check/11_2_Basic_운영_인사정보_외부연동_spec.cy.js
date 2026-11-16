// ==========================================================================
// [2.9.7 신규] 11_2_Basic_운영_인사정보_외부연동
//   운영 > 인사정보 (DB 연동 · 외부 연동 · AD 연동) · 운영 > 외부 연동 (샤크라맥스 SQL 분석 · 원격 파일 다운로드 · 외부 연동 DB 데이터 · 주체정보 동기화 정책)
//   조회만 — 저장 · 삭제 · 실행 · 동기화 버튼은 누르지 않음
//   [안전장치] 「인사연동정책」은 .21 에서 운영 중(삭제 · 변경 금지) → 저장 · 삭제 성격 요청은 intercept 로 막고 0건인지 확인
//   탭마다
//     1. 「정책 목록」 표 머리 (정책명 · 생성일 · 생성자 · 조건 · 설명 · 삭제) · 행 수 · 추가(+) 버튼
//     2. 추가(+) → 열린 창 · 입력 화면 구조 기록 → 취소/닫기 → 목록 그대로
//     3. 정책이 있으면 첫 정책 열기 → 상세 구조 기록 → 닫기 → 목록 그대로
//     4. 화면을 여는 동안 /logcatch/ 요청이 5xx · 응답 code 9999 가 아님
//   DB 연동만 : 첫 정책 상세에 「미리보기」가 있으면 눌러 결과 행 수 기록 (인사 원본 Oracle 172.16.200.16 조회 — 읽기만)
//   .21 메뉴 설정 : 인사정보 「외부 연동」 · 「AD 연동」 탭 숨김(UI 스크립트 11_운영 주석) → 탭이 없으면 기록하고 넘어감
//   운영가이드 10.3.1 DB 연동 : 상세 = 정책 이름 · 정책 상세 · 관리자 계정 생성 · API 연동 목록 · 연동 DB 목록 · 미리보기 결과
//   외부 연동 4개 탭은 운영가이드 설명 없음 → 첫 실행 기록(2026-11-16, B11H_관찰.json)으로 추가 영역 입력칸 · 제목 · 버튼 기준선(FORM)
//   2026-11-16 .21 : DB 연동 정책 1건(인사연동정책) · 외부 연동 4개 탭 정책 0건 → 상세 점검은 DB 연동만
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');

const HEAD = ['정책명', '생성일', '생성자', '조건', '설명', '삭제'];
// 추가 영역 기준선 (2026-11-16 .21 첫 실행 기록 B11H_관찰.json)
const FORM = {
  'DB 연동': { inputs: ['정책명', '정책 상세', '정책 분할 수행', '관리자 계정 생성'], titles: ['API 연동 목록', '연동 DB 목록', '미리보기 결과'], buttons: ['미리보기'] },
  '샤크라맥스 SQL 분석': { inputs: ['정책명', '정책 상세', 'Log Tracer', '쿼리 유형', '가져오는 크기', '저장 크기', '날짜 선택', 'Client IP 제외'] },
  '원격 파일 다운로드': { inputs: ['정책명', '정책 상세'], buttons: ['매개변수 설정'] },
  '외부 연동 DB 데이터': { inputs: ['정책명', '정책 상세', 'Log Tracer', '컬럼 구분자', '파일 명', '메뉴 명', '조회 건수', '이력일', '사용자 계정', '소명 상세', '데이터베이스 유형', 'PORT', '접속 계정', '패스워드', '접속 유형', 'SID', '인증 방식'], titles: ['컬럼 정보', 'From', 'Database'] },
  '주체정보 동기화 정책': { inputs: ['정책명', '정책 상세'], titles: ['연동 DB 목록', '미리보기 결과'], buttons: ['미리보기'] }
};
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/B11H_관찰.json', obs, { log: false });
};
const key = (s) => s.replace(/[\s/]+/g, '');

// ---------- 이동 ----------
const go = (sub, tab) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(2500);
  cy.contains('button', /^운영$/).should('be.visible').click({ force: true });   // 「운영이력」과 겹치지 않게 정확히
  cy.wait(2000);
  cy.get('.v-list__tile__title').filter((i, e) => shown(e) && t(e) === sub).first().click({ force: true });
  cy.wait(3000);
  if (tab) {
    cy.get('.v-btn__content, button.tab-btn').filter((i, e) => shown(e) && t(e) === tab).last().click({ force: true });
    cy.wait(3000);
  }
};
const tabsOf = () => cy.get('body').then(($b) => $b.find('button.tab-btn, .v-btn__content').filter((i, e) => shown(e) && !e.closest('.v-navigation-drawer, .side-menu, header, .v-toolbar')).toArray().map(t).filter(Boolean));

// ---------- 목록 ----------
const main = ($b) => $b.find('.v-content__wrap').filter((i, e) => shown(e)).last()[0] || $b[0];
const readList = ($b) => {
  const root = main($b);
  const tb = [...root.querySelectorAll('table')].filter(shown).find((x) => x.querySelector('th'));
  const pg = t(root).match(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/);
  const rows = tb ? [...tb.querySelectorAll('tbody tr')].filter((r) => r.querySelectorAll('td').length > 1).map((r) => [...r.querySelectorAll('td')].map(t)) : [];
  return {
    head: tb ? [...tb.querySelectorAll('th')].map(t).map((x) => x.replace(/arrow_(upward|downward)/g, '').trim()).filter(Boolean) : [],
    rows,
    total: pg ? Number(pg[3]) : rows.length,
    titles: [...root.querySelectorAll('.c-headline')].filter(shown).map(t)
  };
};
const list = (check) => cy.get('body', { timeout: 20000 }).should(($b) => { if (check) check(readList($b)); }).then(($b) => readList($b));

// 열린 창(또는 바뀐 화면)의 구조 기록
const structure = (k) => cy.get('body').then(($b) => {
  const d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0];
  const root = d || main($b);
  const v = {
    창: !!d,
    url: $b[0].ownerDocument.location.pathname,
    제목: [...root.querySelectorAll('.c-headline, .v-card__title, .v-toolbar__title, .headline')].filter(shown).map(t).slice(0, 15),
    입력칸: [...root.querySelectorAll('input, textarea')].filter(shown).map((e) => e.getAttribute('aria-label') || e.getAttribute('placeholder') || '').slice(0, 40),
    표머리: [...root.querySelectorAll('th')].filter(shown).map(t).slice(0, 30),
    버튼: [...new Set([...root.querySelectorAll('button, .v-btn')].filter(shown).map(t).filter(Boolean))].slice(0, 40)
  };
  note(k, v);
  return cy.wrap(v, { log: false });
});
// 창이면 취소/닫기, 아니면(화면 전환) 다시 이동 — 저장 버튼은 누르지 않음
const close = (sub, tab) => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if ($d.length) {
    const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|clear)$/.test(t(e)));
    if ($x.length) cy.wrap($x.last()).click({ force: true });
    else cy.get('body').type('{esc}', { force: true });
    cy.wait(1200);
    // 「저장하지 않고 닫을까요?」류 확인창이 뜨면 「확인/예」 (저장 아님)
    cy.get('body').then(($b2) => {
      const $c = $b2.find('.v-dialog--active').filter((i, e) => shown(e) && /닫|취소|나가|저장하지/.test(t(e))).last();
      const $ok = $c.find('button, .v-btn').filter((i, e) => shown(e) && /^(확인|예)$/.test(t(e)));
      if ($ok.length) { cy.wrap($ok.last()).click({ force: true }); cy.wait(800); }
    });
  }
  go(sub, tab);
});

// ---------- 요청 점검 ----------
const bodyOf = (x) => (x.response && x.response.body && typeof x.response.body === 'object' ? x.response.body : null);
const netFrom = () => cy.get('@net.all', { log: false }).then((xs) => xs.length);
const netOk = (k, from) => cy.get('@net.all', { log: false }).then((xs) => {
  const mine = xs.slice(from).filter((x) => x.response);
  const bad = mine.filter((x) => x.response.statusCode >= 500 || (bodyOf(x) && String(bodyOf(x).code) === '9999'))
    .map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 120)} → ${x.response.statusCode} ${bodyOf(x) ? `code ${bodyOf(x).code} ${String(bodyOf(x).message || '').slice(0, 80)}` : ''}`);
  note(`${k}_요청`, { 수: mine.length, 오류: bad });
  expect(bad, `${k} 요청 오류 (5xx · code 9999)`).to.deep.eq([]);
});

// ---------- 탭 하나 점검 ----------
const checkTab = (sub, tab, opt = {}) => {
  const k = `B11H_${key(sub)}_${key(tab)}`;
  netFrom().then((n0) => {
    go(sub, tab);
    // 1. 정책 목록
    list((s) => {
      expect(s.titles.join(' | '), `${tab} 제목`).to.include('정책 목록');
      HEAD.forEach((h) => expect(s.head, `${tab} 표 머리 「${h}」`).to.include(h));
    }).then((s) => {
      note(`${k}_목록`, { 머리: s.head, 전체: s.total, 첫행: s.rows[0] || null });
      cy.wrap(s).as('base');
    });
    cy.get('.material-icons').filter((i, e) => shown(e) && t(e) === 'add').should('have.length.at.least', 1);
    A.dumpScreen(`${k}_1_목록`);

    // 2. 추가(+) → 구조 기록 → 닫기
    cy.get('.material-icons').filter((i, e) => shown(e) && t(e) === 'add').last().closest('button, .v-btn').click({ force: true });
    cy.wait(2500);
    structure(`${k}_추가`).then((v) => {
      expect(v.창 || v.입력칸.length > 0, `${tab} 추가(+) → 입력 화면`).to.eq(true);
      // [2026-11-16 기준선] 추가는 창이 아니라 목록 아래 펼쳐지는 입력 영역(「추가」 제목 · 취소 / 저장)
      const f = opt.form || {};
      (f.inputs || []).forEach((x) => expect(v.입력칸, `${tab} 추가 입력칸 「${x}」`).to.include(x));
      ['추가', ...(f.titles || [])].forEach((x) => expect(v.제목, `${tab} 추가 영역 제목 「${x}」`).to.include(x));
      ['취소', '저장', ...(f.buttons || [])].forEach((x) => expect(v.버튼, `${tab} 추가 영역 버튼 「${x}」`).to.include(x));
    });
    A.dumpScreen(`${k}_2_추가`);
    close(sub, tab);
    cy.get('@base').then((b) => list((s) => expect(s.total, `${tab} 추가 화면 닫은 뒤 전체 수`).to.eq(b.total)));

    // 3. 첫 정책 열기 → 구조 기록 → (DB 연동) 미리보기 → 닫기
    cy.get('@base').then((b) => {
      if (!b.rows.length) { note(`${k}_상세`, '정책 없음 — 상세 생략'); return; }
      const name = b.rows[0][b.head.indexOf('정책명')] || b.rows[0][0];
      // [2026-11-16 확정] 정책명 칸 가운데(빈 곳) 클릭 · 행 클릭 · 기본 click 이벤트로는 열리지 않음
      //   글자 링크(<a class="font-weight-bold"> 인사연동정책</a>)를 실제 마우스로 눌러야 「수정」 영역이 펼쳐짐 (손으로 여는 방법과 같음)
      const opened = ($b) => $b.find('.c-headline').filter((i, e) => shown(e) && t(e) === '수정').length > 0
        || $b.find('input').filter((i, e) => shown(e) && String(e.value).trim() === name).length > 0;
      const row = () => cy.get('table').filter(':visible').find('tbody tr').filter((i, e) => t(e).includes(name)).first();
      const cell = () => row().find('td').first().should(($td) => expect(t($td[0]), '정책명 칸(첫 칸)').to.eq(name));
      // [2026-11-16 3차 진단] 실제 클릭 · 더블클릭 · 글자 클릭 모두 화면 변화 없음(「수정」 영역 안 생김)
      //   → 새로 연 화면에서(추가 영역을 열기 전 상태) 브라우저 기본 click 이벤트 · 일반 클릭도 시도
      // 정책명 칸 = 행의 첫 칸 (설명 칸도 같은 「인사연동정책」이라 칸 순서로 고정 — 설명 칸은 누르지 않음)
      //   글자는 칸 왼쪽에 붙어 있어 칸 가운데를 누르면 빈 곳일 수 있음 → 글자 요소(없으면 칸 왼쪽 끝)를 실제 클릭
      const nameText = () => cell().then(($td) => {
        const inner = [...$td[0].querySelectorAll('*')].filter((e) => shown(e) && t(e) === name).pop();
        return cy.wrap(inner || $td[0], { log: false });
      });
      const ways = [
        ['정책명 글자 실제 클릭 (새 화면)', () => { go(sub, tab); nameText().realClick({ position: 'left' }); }]
      ];
      const tryOpen = (idx) => cy.get('body').then(($b) => {
        if (opened($b)) { note(`${k}_상세_여는방법`, idx === 0 ? '(처음부터 열림)' : ways[idx - 1][0]); return cy.wrap(true, { log: false }); }
        if (idx >= ways.length) { note(`${k}_상세_여는방법`, `못 찾음 — ${ways.length}가지 모두 상세가 열리지 않음`); return cy.wrap(false, { log: false }); }
        cy.get('body').then(($b2) => { if ($b2.find('table:visible tbody tr').filter((i, e) => t(e).includes(name)).length) ways[idx][1](); });
        cy.wait(3000);
        // 시도 뒤 화면 상태 기록 (열리지 않을 때 원인 확인용)
        cy.get('body').then(($b3) => {
          const root = main($b3);
          note(`${k}_상세_시도${idx + 1}`, {
            방법: ways[idx][0],
            url: $b3[0].ownerDocument.location.pathname,
            제목: [...root.querySelectorAll('.c-headline')].filter(shown).map(t),
            입력칸: [...root.querySelectorAll('input, textarea')].filter(shown).map((e) => `${e.getAttribute('aria-label') || e.getAttribute('placeholder') || '?'}=${String(e.value).slice(0, 30)}`).slice(0, 12),
            창: $b3.find('.v-dialog--active').filter((i, e) => shown(e)).toArray().map(t).map((x) => x.slice(0, 200))
          });
        });
        A.dumpScreen(`${k}_3_상세시도${idx + 1}`);
        return tryOpen(idx + 1);
      });
      tryOpen(0).then((ok) => {
        expect(ok, `${tab} 첫 정책 「${name}」 상세(수정 영역) 열림 — 정책명 글자 클릭`).to.eq(true);
        structure(`${k}_상세`).then((v) => {
          expect(v.제목, `${tab} 상세 영역 제목 「수정」`).to.include('수정');
          (opt.form && opt.form.inputs || []).forEach((x) => expect(v.입력칸, `${tab} 상세 입력칸 「${x}」`).to.include(x));
          ['저장', '취소', ...(opt.form && opt.form.buttons || [])].forEach((x) => expect(v.버튼, `${tab} 상세 버튼 「${x}」`).to.include(x));
        });
        if (opt.detail) opt.detail();
      });
      A.dumpScreen(`${k}_3_상세`);
      if (opt.preview) {
        cy.get('body').then(($b) => {
          const $p = $b.find('button, .v-btn').filter((i, e) => shown(e) && /(^|\s)미리보기$/.test(t(e)));
          if (!$p.length) { note(`${k}_미리보기`, '버튼 없음'); return; }
          netFrom().then((p0) => {
            cy.wrap($p.first()).click({ force: true });
            cy.wait(6000);
            cy.get('body').then(($b2) => {
              const root = $b2.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || main($b2);
              const tables = [...root.querySelectorAll('table')].filter(shown);
              const last = tables[tables.length - 1];
              note(`${k}_미리보기`, {
                표머리: last ? [...last.querySelectorAll('th')].map(t).slice(0, 20) : [],
                행수: last ? [...last.querySelectorAll('tbody tr')].filter((r) => r.querySelectorAll('td').length > 1).length : 0,
                안내: $b2.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).join(' | ') || '(없음)'
              });
            });
            netOk(`${k}_미리보기`, p0);
            A.dumpScreen(`${k}_4_미리보기`);
          });
        });
      }
      close(sub, tab);
      list((s) => {
        expect(s.total, `${tab} 상세 닫은 뒤 전체 수`).to.eq(b.total);
        expect(s.rows[0], `${tab} 첫 정책 그대로`).to.deep.eq(b.rows[0]);
      });
    });
    netOk(k, n0);
  });
};

describe('11_2_Basic_운영_인사정보_외부연동', () => {
  A.ignoreErrors();

  beforeEach(() => {
    // [안전장치] 운영 중인 「인사연동정책」 등 기존 정책 보호 — 저장 · 삭제 성격의 요청은 서버로 보내지 않고 막은 뒤 실패 처리
    //   (스크립트는 저장 · 삭제를 누르지 않지만, 잘못 눌렸을 때도 서버 데이터가 바뀌지 않게)
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: /\/logcatch\/.*(delete|remove|save|insert|modify|regist|update)/i }, (req) => {
      req.reply({ statusCode: 418, body: { code: 418, message: 'blocked by 11_2_Basic (조회 전용)' } });
    }).as('blocked');
    cy.intercept({ url: /\/logcatch\/(?!.*\.(js|css|png|svg|ico|gif|woff2?|ttf|map)(\?|$))/ }).as('net');
    A.loginAdmin();
  });

  afterEach(() => {
    cy.get('@blocked.all', { log: false }).then((xs) => {
      const v = xs.map((x) => `${x.request.method} ${x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 150)}`);
      if (v.length) note('B11H_막은요청', v);
      expect(v, '저장 · 삭제 성격 요청 (조회 전용 스크립트라 0건이어야 함)').to.deep.eq([]);
    });
  });

  it('인사정보 — DB 연동 (목록 · 추가 창 · 첫 정책 상세 · 미리보기) / 외부 · AD 연동은 탭이 있으면 같은 점검', { retries: 0 }, () => {
    go('인사정보');
    tabsOf().then((tabs) => {
      note('B11H_인사정보_탭', tabs);
      checkTab('인사정보', 'DB 연동', {
        preview: true,
        form: FORM['DB 연동'],
        // 인사연동정책 상세 (손으로 연 화면 2026-11-16) : 연동 DB 목록 ORACLE 172.16.200.16:1522 · Maria 10.10.54.26:3306
        detail: () => cy.get('body').then(($b) => {
          const sec = $b.find('.c-headline').filter((i, e) => shown(e) && t(e) === '연동 DB 목록').first().closest('.v-card, section, .c-card, div.layout, div');
          const rows = $b.find('table').filter((i, e) => shown(e) && [...e.querySelectorAll('th')].map(t).some((h) => /Database/.test(h)))
            .first().find('tbody tr').toArray().map((r) => [...r.querySelectorAll('td')].map(t)).filter((r) => r.length > 2);
          note('B11H_인사정보_DB연동_연동DB', rows);
          expect(rows.map((r) => r.join(' ')).join(' | '), '연동 DB 목록 — 인사 원본 ORACLE 172.16.200.16 1522').to.match(/ORACLE\s+172\.16\.200\.16\s+1522/);
          cy.wrap(sec, { log: false });
        })
      });
      ['외부 연동', 'AD 연동'].forEach((tb) => {
        if (tabs.includes(tb)) checkTab('인사정보', tb);
        else note(`B11H_인사정보_${key(tb)}`, '.21 메뉴 설정에서 숨김 — 탭 없음 (점검 생략)');
      });
    });
  });

  it('외부 연동 — 샤크라맥스 SQL 분석 · 원격 파일 다운로드 · 외부 연동 DB 데이터 · 주체정보 동기화 정책', { retries: 0 }, () => {
    go('외부 연동');
    tabsOf().then((tabs) => {
      note('B11H_외부연동_탭', tabs);
      ['샤크라맥스 SQL 분석', '원격 파일 다운로드', '외부 연동 DB 데이터', '주체정보 동기화 정책'].forEach((tb) => {
        expect(tabs, `외부 연동 탭 「${tb}」`).to.include(tb);
        checkTab('외부 연동', tb, { form: FORM[tb] });
      });
    });
  });
});
