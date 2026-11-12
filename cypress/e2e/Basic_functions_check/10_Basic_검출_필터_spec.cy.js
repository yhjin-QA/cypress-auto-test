// ==========================================================================
// [2.9.7 신규] 10_Basic_검출_필터
//   검출 > 필터 > 전처리 필터링 정책 · 전처리 설정 화면
//   1. 특정 SQL 제외 : 빈 값 저장 막힘 · 설명 200자 제한 · 임시 SQL 등록 → 필터 목록 · 변경 이력(Add)
//                      → 같은 값 다시 등록(관찰) → 삭제 → 변경 이력(Delete)
//   2. 사용자 IP · 화면(URI) · CONTENT-TYPE 제외 탭 조회 : 입력칸 · 필터 목록 (N) = 목록 전체 수 · 표 머리
//   3. 전처리 파일 구분 · 사용자 계정 탐색 · 디코더 · 인코더 설정 조회 : 트리 묶음 (N) = 펼친 항목 수 · 항목 선택 → 정책명
//   반복 실행 설계
//     - 등록 값은 'auto_임시_검출_' 이 들어간 SQL (실제 SQL 에 걸리지 않는 값) · 시작 전과 after() 에서 남은 값 삭제
//     - 다른 탭 · 화면은 조회만 (저장 · 삭제 안 누름)
//     - 변경 이력은 실행마다 Add · Delete 가 쌓임 → 실행 전 전체 수와 비교
//   2.9.7 확인 사항 (probe18, 2026-11-12)
//     - 탭 : 사용자 IP 제외 · 화면 (URI) 제외 · 특정 SQL 제외 · CONTENT-TYPE 제외 (보이는 .v-window-item 하나)
//     - 탭마다 : 입력(값 · 설명 200자 · 업무시스템 할당 · Log Tracer · 저장) · 등록 필터 상세 보기(필터 목록 (N) · 삭제 fa-trash)
//                · 변경 이력(발생 일시 · 관리자 · IP · 조건 Add/Delete, 최신이 위)
//     - 삭제 : 아이콘 → 확인창 「삭제하시겠습니까?」 → 확인 → 안내 「삭제했습니다.」 / 변경 이력 상세 : 조건(Add · Delete) 글자 클릭 → 「변경 이력 상세 보기」
//     - 전처리 설정 트리 : vue-treeselect · 항목 글자 = label.text-label
//   2026-11-12 첫 실행 관찰 (기록만 — 실패시키지 않음 · Mantis 등록 대상)
//     - 등록(저장) 뒤 안내가 「삭제했습니다.」
//     - 같은 값 다시 저장 → 목록은 1건 그대로 · 중복 안내 없음 · 변경 이력에는 Add 가 1건 더 남음
//     - 변경 이력 상세 「Filter Group Type : Optional.empty」 (Java Optional 문자열 그대로)
//     - CONTENT-TYPE 제외 목록 첫 칸 머리 글자가 비어 있음 (다른 탭은 IP · 화면 URI · 특정 SQL)
//   관찰 기록 : cypress/probe/B10F_관찰.json · 서버 요청 : cypress/probe/B10F_*_net.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const PREFIX = 'auto_임시_검출_';
const SYS = '리눅스_배송관리';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const p2 = (n) => String(n).padStart(2, '0');
const hms = () => { const d = new Date(); return `${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`; };

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  cy.writeFile('cypress/probe/B10F_관찰.json', obs, { log: false });
};

// ---------- 화면 이동 ----------
const goFilterMenu = () => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(2500);
  cy.contains('button', '검출').click({ force: true });
  cy.wait(1500);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '필터').first().click({ force: true });
  cy.wait(3500);
};
const topTab = (label) => {
  cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === label).first().click({ force: true });
  cy.wait(3000);
};

const TABS = {
  IP: { label: '사용자 IP 제외', key: '#ipv4-address1', head: 'IP', col: 'IP' },
  URI: { label: '화면 (URI) 제외', key: 'input[aria-label="화면 URI"]', head: '화면 URI', col: '화면 URI' },
  SQL: { label: '특정 SQL 제외', key: 'input[aria-label="특정 SQL"]', head: '특정 SQL', col: '특정 SQL' },
  CT: { label: 'CONTENT-TYPE 제외', key: 'input[aria-label="Content Type"]', head: 'Content-Type 제외', col: null }
};
// 보이는 탭 내용 (그 탭의 입력칸이 들어 있는 .v-window-item)
const pane = (tab) => cy.get('.v-window-item', { timeout: 20000 }).filter((i, e) => shown(e) && !!e.querySelector(tab.key)).first({ timeout: 20000 });
const switchTab = (tab) => {
  cy.get('.v-tabs__item').filter(':visible').filter((i, e) => t(e).toUpperCase() === tab.label.toUpperCase()).first().click({ force: true });
  cy.wait(2500);
  pane(tab).should('have.length', 1);
};
const goTab = (tab) => {
  goFilterMenu();
  topTab('전처리 필터링 정책');
  switchTab(tab);
};

// ---------- 탭 내용 읽기 (필터 수 · 목록 · 변경 이력) ----------
const listTrs = (p) => {
  const tb = p.querySelectorAll('table.v-datatable')[0];
  return tb ? [...tb.querySelectorAll('tbody tr')].filter((tr) => tr.querySelectorAll('td').length > 1) : [];
};
const readState = ($p) => {
  const p = $p[0];
  const lab = [...p.querySelectorAll('label')].map(t).find((s) => /^필터 목록/.test(s)) || '';
  const tbs = [...p.querySelectorAll('table.v-datatable')];
  const head = (tb) => {
    const tr = tb && tb.querySelector('thead tr');
    return tr ? [...tr.querySelectorAll('th')].map((th) => t(th).replace(/arrow_(upward|downward)/g, '').trim()) : [];
  };
  const rows = (tb) => (tb ? [...tb.querySelectorAll('tbody tr')].filter((tr) => tr.querySelectorAll('td').length > 1).map((tr) => [...tr.querySelectorAll('td')].map(t)) : []);
  const pg = [...t(p).matchAll(/(\d+)\s*-\s*(\d+)\s*of\s*(\d+)/g)].map((m) => Number(m[3]));
  return {
    label: Number((lab.match(/\((\d+)\)/) || [])[1]),
    listTotal: pg[0],
    histTotal: pg[1],
    listHead: head(tbs[0]),
    histHead: head(tbs[1]),
    list: rows(tbs[0]),
    hist: rows(tbs[1])
  };
};
// check 가 통과할 때까지 다시 읽음 → 읽은 값을 넘김
const state = (tab, check) => pane(tab).should(($p) => {
  expect($p.length, '보이는 탭 내용').to.eq(1);
  if (check) check(readState($p));
}).then(($p) => readState($p));

// ---------- 동작 ----------
const saveBtn = (tab) => pane(tab).find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '저장').first();
const typeIn = (tab, label, v) => {
  pane(tab).find(`input[aria-label="${label}"]`).first().clear({ force: true });
  if (v) pane(tab).find(`input[aria-label="${label}"]`).first().type(v, { force: true, delay: 0, parseSpecialCharSequences: false });
};
// 확인창이 뜨면 확인 · 예 · 삭제 · 저장 (문구는 관찰 기록)
const confirmAny = (name) => {
  cy.wait(1200);
  cy.get('body').then(($b) => {
    const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
    if (!$d.length) return;
    note(`${name}_확인창`, t($d[0]).slice(0, 300));
    const $ok = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(확인|예|삭제|저장|OK)$/i.test(t(e)));
    if ($ok.length) cy.wrap($ok.last()).click({ force: true });
  });
  cy.wait(1500);
};
// 안내(snack) : 동작 전에 떠 있는 안내를 닫고(clearSnack) → 동작 뒤 새로 뜬 안내를 최대 5초 기다려 기록(waitSnack)
const clearSnack = () => cy.get('body', { log: false }).then(($b) => {
  const $x = $b.find('.v-snack button, .v-snack .v-btn').filter((i, e) => shown(e));
  if ($x.length) { cy.wrap($x).click({ force: true, multiple: true }); cy.wait(600); }
});
const waitSnack = (name, left = 16) => cy.get('body', { log: false }).then(($b) => {
  const s = $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean).join(' | ').replace(/\s*close$/, '');
  if (s || left <= 0) { note(`${name}_안내`, s || '(없음)'); return cy.wrap(s, { log: false }); }
  cy.wait(300, { log: false });
  return waitSnack(name, left - 1);
});
// 네트워크 기록 (화면 → 서버 요청 확인용) : beforeEach 의 @net
const NET_RE = /\/logcatch\/(?!.*\.(js|css|png|svg|ico|gif|woff2?|ttf|map)(\?|$))(?!.*(theme-data|module\/versions|api\/v1\/version|chart-data|widgets))/i;
const dumpNet = (name) => cy.get('@net.all', { log: false }).then((xs) => cy.writeFile(`cypress/probe/${name}_net.json`, xs.map((x) => ({
  m: x.request.method,
  url: x.request.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 250),
  st: x.response && x.response.statusCode,
  req: x.request.body ? (typeof x.request.body === 'string' ? x.request.body : JSON.stringify(x.request.body)).slice(0, 400) : null,
  body: x.response ? (typeof x.response.body === 'string' ? x.response.body : JSON.stringify(x.response.body || '')).slice(0, 500) : null
})).filter((x) => !/^<!DOCTYPE|^<html/i.test(x.body || '')), { log: false }));
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn, i').filter((i, e) => shown(e) && /^(취소|닫기|close|확인)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true });
  else cy.get('body').type('{esc}', { force: true });
  cy.wait(1000);
});
// 업무시스템 할당 : SYS 선택 (없으면 첫 항목) → @sys
const pickSys = (tab) => {
  pane(tab).find('input[aria-label="업무시스템 할당"]').first().click({ force: true });
  cy.wait(1000);
  cy.get('.v-menu__content').filter((i, e) => shown(e) && e.querySelectorAll('.v-list__tile__title').length > 0).last().then(($m) => {
    const $tiles = $m.find('.v-list__tile__title').filter((i, e) => shown(e) && t(e));
    const $hit = $tiles.filter((i, e) => t(e) === SYS);
    const $use = $hit.length ? $hit.first() : $tiles.first();
    note('B10F_업무시스템_목록', $tiles.toArray().map(t).slice(0, 15));
    cy.wrap(t($use[0])).as('sys');
    cy.wrap($use).click({ force: true });
  });
  cy.wait(800);
  cy.get('body').type('{esc}', { force: true });
  cy.wait(500);
  cy.get('@sys').then((sys) => pane(tab).find('.v-chip').filter((i, e) => t(e).includes(sys)).should('have.length.at.least', 1));
};
const ensureSys = (tab) => cy.get('@sys').then((sys) => pane(tab).then(($p) => {
  if (!$p.find('.v-chip').toArray().some((e) => t(e).includes(sys))) pickSys(tab);
}));
// match 에 맞는 행을 하나씩 삭제 (삭제 아이콘 → 확인)
const deleteRows = (tab, match, name, left = 8) => pane(tab).then(($p) => {
  const tr = listTrs($p[0]).find((r) => match(t(r)));
  if (!tr || left <= 0) return;
  const icon = tr.querySelector('i.fa-trash');
  const b = icon && icon.closest('button');
  if (!b) { note(`${name}_삭제버튼`, '없음'); return; }
  cy.wrap(b).click({ force: true });
  confirmAny(name);
  cy.wait(1500);
  deleteRows(tab, match, name, left - 1);
});
const cleanup = () => {
  goTab(TABS.SQL);
  deleteRows(TABS.SQL, (s) => s.includes(PREFIX), 'B10F_정리');
};

// ---------- 전처리 설정 트리 ----------
const groupItems = () => cy.get('.vue-treeselect__list-item.vue-treeselect__indent-level-0').filter((i, e) => shown(e));
const groupLabel = (e) => t(e.querySelector('.vue-treeselect__label'));
const countOf = (s) => Number((s.match(/\((\d+)\)\s*$/) || [])[1]);
const kidsOf = (re) => groupItems().filter((i, e) => re.test(groupLabel(e))).first()
  .find('.vue-treeselect__list-item.vue-treeselect__indent-level-1').filter((i, e) => shown(e));
const formHas = (labels) => labels.forEach((l) => cy.get(`input[aria-label="${l}"]`).filter((i, e) => shown(e)).should('have.length.at.least', 1));
const policyName = () => cy.get('input[aria-label="정책명"]').filter((i, e) => shown(e)).first();
const filled = ($i) => String($i.val() || '').trim() !== '';
const kidLabel = (re) => kidsOf(re).first().find('label.text-label').filter((i, e) => shown(e)).first();
// 묶음 펼침 → 항목 수 = (N) → 첫 항목 선택 → 정책명 칸에 그 이름
//   [2026-11-12 실행] 항목의 .vue-treeselect__label 에 click(force) → 강조만 되고 오른쪽 폼은 빈 채로 남음
//   → 글자(label.text-label)를 실제 마우스로 클릭(realClick) · 안 되면 mousedown · 두 번 클릭 순서로 시도하고 된 방법을 기록
const treeCheck = (name, re) => groupItems().filter((i, e) => re.test(groupLabel(e))).should('have.length', 1).then(($g) => {
  const n = countOf(groupLabel($g[0]));
  note(`${name}_묶음`, groupLabel($g[0]));
  expect(n, `${name} 묶음 수`).to.be.at.least(0);
  if (!n) return;
  if (![...$g[0].querySelectorAll('.vue-treeselect__indent-level-1')].some(shown)) {
    cy.wrap($g.find('.vue-treeselect__option-arrow-container').first()).click({ force: true });
    cy.wait(1000);
  }
  kidsOf(re).should('have.length', n);
  kidLabel(re).then(($l) => {
    const kid = t($l[0]);
    cy.wrap($l).scrollIntoView().realClick();
    cy.wait(2000);
    policyName().then(($i) => {
      if (filled($i)) { note(`${name}_선택방법`, 'realClick'); return; }
      kidsOf(re).first().find('.vue-treeselect__option').first().trigger('mousedown', { button: 0, which: 1, force: true });
      cy.wait(2000);
      policyName().then(($j) => {
        if (filled($j)) { note(`${name}_선택방법`, 'mousedown'); return; }
        kidLabel(re).dblclick({ force: true });
        cy.wait(2000);
        policyName().then(($k) => note(`${name}_선택방법`, filled($k) ? 'dblclick' : '모두 안 됨'));
      });
    });
    dumpNet(name);
    A.dumpScreen(`${name}_선택`);
    policyName().should(($i) => {
      const v = String($i.val() || '').trim();
      expect(v, `${name} 항목 「${kid}」 선택 → 정책명`).to.not.eq('');
      expect(kid.includes(v) || v.includes(kid), `정책명 「${v}」 ↔ 트리 「${kid}」`).to.eq(true);
    });
  });
});

describe('10_Basic_검출_필터', () => {
  A.ignoreErrors();

  beforeEach(() => {
    cy.intercept({ url: NET_RE }).as('net');
    A.loginAdmin();
  });

  after(() => {
    cy.log('🧹 임시 특정 SQL 제외 정리');
    A.loginAdmin();
    cleanup();
  });

  it('특정 SQL 제외 — 빈 값 · 설명 200자 · 등록 → 목록 · 변경 이력 → 같은 값 다시 등록 → 삭제', { retries: 0 }, () => {
    const T = TABS.SQL;
    const SQL = `SELECT 1 FROM ${PREFIX}${hms()}`;
    const DESC = `${PREFIX}설명 (Basic 자동화)`;
    cleanup();
    A.dumpScreen('B10F_1_시작');

    // ---------- 0. 화면 구성 · 실행 전 값 ----------
    state(T, (s) => {
      expect(s.listHead.slice(0, 5), '필터 목록 머리').to.deep.eq(['특정 SQL', '설명', '업무시스템', 'Log Tracer', '삭제']);
      expect(s.histHead.slice(0, 4), '변경 이력 머리').to.deep.eq(['발생 일시', '관리자', 'IP', '조건']);
      expect(s.label, '필터 목록 (N) = 목록 전체 수').to.eq(s.listTotal);
      expect(s.list.filter((r) => r.join(' ').includes(PREFIX)).length, '남은 임시 값').to.eq(0);
    }).then((s) => {
      note('B10F_시작', { label: s.label, histTotal: s.histTotal, histTop: s.hist[0] || null });
      cy.wrap(s).as('base');
    });
    pane(T).within(() => {
      ['설명', '업무시스템 할당', 'Log Tracer'].forEach((l) => cy.get(`input[aria-label="${l}"]`).should('exist'));
      cy.get('input[aria-label="설명"]').should('have.attr', 'maxlength', '200');
      cy.get('.c-headline').then(($h) => {
        const hs = $h.toArray().map(t);
        ['Excluded SQL', '특정 SQL', '등록 필터 상세 보기', '변경 이력'].forEach((h) => expect(hs, '구역 제목').to.include(h));
      });
    });
    saveBtn(T).should('have.length', 1);

    // ---------- 1. 값 없이 저장 → 등록 안 됨 ----------
    typeIn(T, '특정 SQL', '');
    typeIn(T, '설명', `${PREFIX}빈값 확인`);
    saveBtn(T).then(($b) => note('B10F_빈값_저장버튼', A.isDisabled($b) ? '비활성' : '활성'));
    clearSnack();
    saveBtn(T).click({ force: true });
    confirmAny('B10F_빈값');
    waitSnack('B10F_빈값');
    A.dumpScreen('B10F_2_빈값저장');
    cy.wait(2000);
    cy.get('@base').then((b) => state(T, (s) => expect(s.label, '빈 값 저장 뒤 필터 수 (그대로)').to.eq(b.label)));

    // ---------- 2. 설명 200자 제한 ----------
    pane(T).find('input[aria-label="설명"]').first().clear({ force: true }).type('x'.repeat(201), { force: true, delay: 0 });
    pane(T).find('input[aria-label="설명"]').first().should(($i) => expect(String($i.val()).length, '설명 201자 입력 → 길이').to.eq(200));
    pane(T).should(($p) => expect(t($p[0]), '설명 글자 수 표시').to.include('200 / 200'));

    // ---------- 3. 등록 → 필터 목록 · 변경 이력 Add ----------
    typeIn(T, '특정 SQL', SQL);
    typeIn(T, '설명', DESC);
    pickSys(T);
    A.dumpScreen('B10F_3_입력');
    clearSnack();
    saveBtn(T).click({ force: true });
    confirmAny('B10F_등록');
    // [관찰 2026-11-12] 등록(저장) 뒤 안내가 「삭제했습니다.」로 뜸 → 기록만 (Mantis 등록 대상)
    waitSnack('B10F_등록').then((m) => note('B10F_관찰_등록안내', /삭제/.test(m) ? `저장인데 「${m}」` : (m || '(없음)')));
    cy.get('@base').then((b) => cy.get('@sys').then((sys) => {
      state(T, (s) => {
        expect(s.label, '등록 뒤 필터 수').to.eq(b.label + 1);
        expect(s.listTotal, '등록 뒤 목록 전체 수').to.eq(b.listTotal + 1);
        const row = s.list.find((r) => r[0] === SQL);
        expect(row, `필터 목록에 「${SQL}」`).to.not.eq(undefined);
        expect(row[1], '설명').to.eq(DESC);
        expect(row[2], '업무시스템').to.include(sys);
      });
      pane(T).find('input[aria-label="특정 SQL"]').first().then(($i) => note('B10F_등록뒤_입력칸', String($i.val() || '') || '(비움)'));
      // 변경 이력이 바로 안 바뀌면 화면을 다시 열어 확인 (관찰 기록)
      cy.wait(1500);
      pane(T).then(($p) => {
        const s = readState($p);
        if (s.histTotal !== b.histTotal + 1) { note('B10F_등록_변경이력_바로갱신', `안 됨 (${s.histTotal})`); goTab(T); }
      });
      state(T, (s) => {
        expect(s.histTotal, '등록 뒤 변경 이력 수').to.eq(b.histTotal + 1);
        const h = s.hist[0] || [];
        expect(h[3], '변경 이력 맨 위 조건').to.eq('Add');
        expect(h[1], '변경 이력 관리자').to.include(`(${A.ADMIN_ID()})`);
        if (b.hist[0]) expect(h[0] >= b.hist[0][0], `변경 이력 시각 ${h[0]} ≥ 이전 맨 위 ${b.hist[0][0]}`).to.eq(true);
      }).then((s) => note('B10F_등록_변경이력', s.hist[0]));
    }));
    A.dumpScreen('B10F_4_등록');
    dumpNet('B10F_등록');

    // ---------- 4. 변경 이력 Add 상세 (관찰) ----------
    pane(T).find('table.v-datatable').eq(1).find('tbody tr').first().find('a').filter((i, e) => t(e) === 'Add').first().click({ force: true });
    cy.wait(1500);
    cy.get('body').then(($b) => {
      const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
      note('B10F_변경이력_상세', $d.length ? t($d[0]).slice(0, 500) : '(창 없음)');
      if ($d.length) {
        A.dumpScreen('B10F_5_변경이력상세');
        note('B10F_변경이력_상세에_값', t($d[0]).includes(SQL));
        // [관찰 2026-11-12] 상세에 「Filter Group Type : Optional.empty」 (Java Optional 문자열이 그대로 보임) → 기록만 (Mantis 등록 대상)
        note('B10F_관찰_변경이력상세_Optional', /Optional\.(empty|\[)/.test(t($d[0])) ? '「Optional.empty」 보임' : '안 보임');
      }
    });
    closeTop();

    // ---------- 5. 같은 값 다시 등록 (관찰 — 허용 여부만 기록) ----------
    typeIn(T, '특정 SQL', SQL);
    typeIn(T, '설명', DESC);
    ensureSys(T);
    pane(T).then(($p) => cy.wrap(readState($p).histTotal).as('histBeforeDup'));
    clearSnack();
    saveBtn(T).click({ force: true });
    confirmAny('B10F_중복');
    waitSnack('B10F_중복');
    cy.wait(2500);
    // [관찰 2026-11-12] 같은 값 다시 저장 → 목록은 1건 그대로(중복 안내 없음)인데 변경 이력에 Add 가 1건 더 남음 → 기록만 (Mantis 등록 대상)
    cy.get('@histBeforeDup').then((hb) => pane(T).then(($p) => {
      const s = readState($p);
      const n = s.list.filter((r) => r[0] === SQL).length;
      note('B10F_같은값_다시등록', n > 1 ? `허용됨 (${n}건)` : `막힘 (${n}건)`);
      note('B10F_관찰_같은값_변경이력', `${hb} → ${s.histTotal} (맨 위 ${s.hist[0] ? s.hist[0].join(' ') : '-'})`);
    }));
    A.dumpScreen('B10F_6_같은값');

    // ---------- 6. 삭제 → 목록에서 빠짐 · 변경 이력 Delete ----------
    clearSnack();
    deleteRows(T, (s) => s.includes(SQL), 'B10F_삭제');
    waitSnack('B10F_삭제');
    cy.get('@base').then((b) => {
      state(T, (s) => {
        expect(s.list.some((r) => r.join(' ').includes(PREFIX)), '삭제 뒤 임시 값').to.eq(false);
        expect(s.label, '삭제 뒤 필터 수 (실행 전과 같음)').to.eq(b.label);
      });
      cy.wait(1500);
      pane(T).then(($p) => {
        const s = readState($p);
        if (!s.hist[0] || s.hist[0][3] !== 'Delete') { note('B10F_삭제_변경이력_바로갱신', '안 됨'); goTab(T); }
      });
      state(T, (s) => {
        const h = s.hist[0] || [];
        expect(h[3], '변경 이력 맨 위 조건').to.eq('Delete');
        expect(h[1], '변경 이력 관리자').to.include(`(${A.ADMIN_ID()})`);
        expect(s.histTotal, '변경 이력 수 (Add · Delete 가 더해짐)').to.be.at.least(b.histTotal + 2);
      }).then((s) => note('B10F_삭제_변경이력', { top: s.hist[0], histTotal: s.histTotal }));
    });
    A.dumpScreen('B10F_7_삭제');
    dumpNet('B10F_삭제');
  });

  it('사용자 IP · 화면(URI) · CONTENT-TYPE 제외 탭 — 입력칸 · 필터 목록 (N) = 목록 전체 수 (조회만)', { retries: 0 }, () => {
    goTab(TABS.IP);
    [TABS.IP, TABS.URI, TABS.CT].forEach((T, k) => {
      if (k) switchTab(T);
      pane(T).within(() => {
        if (T === TABS.IP) ['#ipv4-address1', '#ipv4-address2', '#ipv4-address3', '#ipv4-address4'].forEach((s) => cy.get(s).should('have.attr', 'maxlength', '3'));
        ['설명', '업무시스템 할당', 'Log Tracer'].forEach((l) => cy.get(`input[aria-label="${l}"]`).should('exist'));
        cy.get('.c-headline').then(($h) => {
          const hs = $h.toArray().map(t);
          [T.head, '등록 필터 상세 보기', '변경 이력'].forEach((h) => expect(hs, `${T.label} 구역 제목`).to.include(h));
        });
      });
      saveBtn(T).should('have.length', 1);
      state(T, (s) => {
        expect(s.label, `${T.label} 필터 목록 (N) = 목록 전체 수`).to.eq(s.listTotal);
        expect(s.list.length, `${T.label} 첫 쪽 행 수`).to.eq(Math.min(5, s.listTotal));
        expect(s.listHead.slice(1, 5), `${T.label} 목록 머리`).to.deep.eq(['설명', '업무시스템', 'Log Tracer', '삭제']);
        if (T.col) expect(s.listHead[0], `${T.label} 목록 첫 칸 머리`).to.eq(T.col);
        // [관찰] CONTENT-TYPE 제외 첫 칸 머리 : 아래 then 에서 기록만
        expect(s.histHead.slice(0, 4), `${T.label} 변경 이력 머리`).to.deep.eq(['발생 일시', '관리자', 'IP', '조건']);
        expect(s.list.filter((r) => r.join(' ').includes(PREFIX)).length, `${T.label} 임시 값 없음`).to.eq(0);
      }).then((s) => {
        note(`B10F_탭_${T.label}`, { label: s.label, histTotal: s.histTotal, firstHead: s.listHead[0], histKinds: [...new Set(s.hist.map((r) => r[3]))] });
        if (!T.col) note('B10F_관찰_CONTENT-TYPE_첫칸머리', s.listHead[0] ? `「${s.listHead[0]}」` : '비어 있음');
      });
      A.dumpScreen(`B10F_8_탭${k + 1}`);
    });
  });

  it('전처리 파일 구분 · 사용자 계정 탐색 · 디코더 · 인코더 설정 — 트리 묶음 (N) = 항목 수 · 항목 선택 → 정책명 (조회만)', { retries: 0 }, () => {
    goFilterMenu();

    // 파일 구분 : 설정 (N) · 예외 (M)
    topTab('전처리 파일 구분 설정');
    formHas(['정책명', '기본 확장자', '파일 다운로드 대상 구분 유형', 'ContentType Value', '파일 다운로드 파일 명 구분 유형', 'ContentDisposition Key']);
    groupItems().should(($g) => {
      const ls = $g.toArray().map(groupLabel);
      expect(ls.some((s) => /^전처리 파일 구분 설정 \(\d+\)$/.test(s)), `파일 구분 묶음 ${ls}`).to.eq(true);
      expect(ls.some((s) => /^전처리 예외 파일 구분 설정 \(\d+\)$/.test(s)), '예외 파일 구분 묶음').to.eq(true);
    });
    treeCheck('B10F_파일구분', /^전처리 파일 구분 설정 \(/);
    A.dumpScreen('B10F_9_파일구분');

    // 사용자 계정 탐색
    topTab('전처리 사용자 계정 탐색 설정');
    formHas(['정책명', '유형', 'key', 'Log Tracer', '업무시스템 할당']);
    groupItems().should(($g) => expect($g.toArray().map(groupLabel).some((s) => /^전처리 사용자 계정 탐색 설정 \(\d+\)$/.test(s)), '계정 탐색 묶음').to.eq(true));
    treeCheck('B10F_계정탐색', /^전처리 사용자 계정 탐색 설정 \(/);
    A.dumpScreen('B10F_10_계정탐색');

    // 디코더
    topTab('전처리 디코더 설정');
    formHas(['정책명', '유형', '대상 (Target)', 'Log Tracer', '업무시스템 할당', 'URI']);
    treeCheck('B10F_디코더', /^전처리 디코더 설정 \(/);
    A.dumpScreen('B10F_11_디코더');

    // 인코더 : Request/Response Header/Body 4묶음
    topTab('전처리 인코더 설정');
    formHas(['정책명', 'Log Tracer', 'URI']);
    groupItems().should(($g) => {
      const ls = $g.toArray().map(groupLabel);
      ['Request Header', 'Response Header', 'Request Body', 'Response Body'].forEach((k) => expect(ls.some((s) => new RegExp(`^${k} \\(\\d+\\)$`).test(s)), `인코더 묶음 ${k}`).to.eq(true));
    });
    treeCheck('B10F_인코더', /^Request Header \(/);
    A.dumpScreen('B10F_12_인코더');
  });
});
