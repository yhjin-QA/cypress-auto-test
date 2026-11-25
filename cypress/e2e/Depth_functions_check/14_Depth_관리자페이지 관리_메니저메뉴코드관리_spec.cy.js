// ==========================================================================
// [2.9.9.0 신규] 14_Depth_관리자페이지 관리_메니저메뉴코드관리 — 조회가능 그룹 지정 (편집 → 저장 → 확인 → 원래 값으로 되돌림)
//   관리자 페이지 > 관리 > 메니저 메뉴 코드 관리 (/logcatch/management/statisticsAccountRule)
//   대상 : 사원_160 (user160) — 다른 자동화 스펙이 쓰지 않는 .27 CRM 계정 (2026-11-25 사용자 결정)
//   1. 이름 「사원_160」 검색 → user160 행 · 현재 조회가능 업무시스템 · 그룹 · 개인정보 열람 권한 기록
//   2. 편집(연필) → 「조회가능 그룹 지정」 창 : 이름 칸 사원_160(읽기 전용) · 업무시스템 · 그룹 · 개인정보 열람 권한, 지금 고른 값 기록
//   3. 업무시스템 「리눅스_VIP고객」 · 그룹 「자동화QA팀」 · 개인정보 열람 권한(지금 값과 다른 값 : 마스킹 해제 허용 ↔ 마스킹 고정) → 저장 → 저장 요청 성공
//      저장 API : POST /common/com42/saveStatisticsAccountRule {userLoginId, ruleBsn:[업무시스템 ID], ruleGroup:[그룹 ID], ruleMasking:1~3(0 = 빈 값)}
//      개인정보 열람 권한은 화면에서 빈 값으로 되돌릴 수 없음(11-25 확인) → user160 기준값 「마스킹 고정」
//   4. 다시 검색 → 목록에 세 값 · 편집 창을 다시 열면 세 값이 골라져 있음
//   5. 처음 값으로 되돌림 → 저장 → 다시 열어 처음 값과 같은지 확인
//   after() : 중간에 실패해 바뀐 채로 남으면 되돌리기 한 번 더 시도
//   관찰(기록만 · Mantis 0039239) : 편집 창 읽기 전용 칸 이름이 userName · employeeNumber · userGroupName 영문 키 그대로 · 목록 「조회가능 그룹」 [ "notFound" ] 표시
//   probe_298d (11-25) : 창 제목 「조회가능 그룹 지정」, 업무시스템 선택지 12 + 전체 선택 · 그룹 19 + 전체 선택 · 권한 「마스킹 고정 / 마스킹 해제 허용 / 마스킹 없음」, 버튼 「저장 · 취소」
//   결과 : cypress/probe/D14M_관찰.json
// ==========================================================================
const A = require('../../support/anomaly');

const NAME = '사원_160';
const ID = 'user160';
const SET = { 업무시스템: '리눅스_VIP고객', 그룹: '자동화QA팀', '개인정보 열람 권한': '마스킹 고정' };
const LABELS = Object.keys(SET);

const t = (e) => (e ? (e.innerText || e.textContent || '') : '').replace(/\s+/g, ' ').trim();
const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = { 시작: new Date().toISOString() };
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/D14M_관찰.json', obs, { log: false }); };
const state = { 처음: null, 바꿈: false, 되돌림: false };

const goScreen = () => {
  A.loginAdmin();
  cy.get('.g-IConfig').filter(':visible').first().click({ force: true });
  cy.wait(2500);
  cy.contains('button.side-menu', '관리').click({ force: true });
  cy.wait(1000);
  cy.contains('.v-list__tile__title', '메니저 메뉴 코드 관리').click({ force: true });
  cy.wait(4500);
  cy.contains('.c-headline', '소속', { timeout: 15000 }).should('exist');
};
const search = () => {
  cy.get('input[aria-label="이름"]').filter(':visible').first().clear({ force: true }).type(NAME, { force: true });
  cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
  cy.wait(3000);
};
const myRows = ($b) => $b.find('table tbody tr').filter((i, e) => vis(e) && !e.closest('.v-dialog'))
  .toArray().filter((r) => t(Cypress.$(r).find('td')[1]) === ID);
const cells = (r) => Cypress.$(r).find('td').toArray().map(t);
const openEdit = () => {
  cy.get('body').then(($b) => {
    const r = myRows($b)[0];
    expect(!!r, `「${NAME}」(${ID}) 행`).to.eq(true);
    cy.wrap(Cypress.$(r).find('i.fa-edit')[0]).click({ force: true });
  });
  cy.wait(2500);
  A.activeDialog().should('contain', '조회가능 그룹 지정');
};
const dlgSel = (label) => A.activeDialog().find(`input[aria-label="${label}"]`).first().closest('.v-select');
const chosenAll = () => A.activeDialog().then(($d) => {
  const o = {};
  LABELS.forEach((lb) => {
    const s = $d.find(`input[aria-label="${lb}"]`).first().closest('.v-select');
    o[lb] = s.find('.v-chip__content, .v-select__selection').toArray().map((e) => t(e).replace(/,\s*$/, '')).filter((x) => x && x !== lb);
    // 하나만 고르는 칸은 선택값이 칩 · selection 이 아닌 곳에 그려질 수 있어 칸 글자에서 라벨 · 아이콘 글자를 뺀 값도 봄
    if (!o[lb].length) { const rest = t(s.find('.v-select__selections')[0]).replace(lb, '').replace(/arrow_drop_down|clear/g, '').trim(); if (rest) o[lb] = [rest]; }
  });
  return o;
});
const closeMenu = () => { A.activeDialog().contains('조회가능 그룹 지정').click({ force: true }); cy.wait(500); };
const clickItem = (label, item) => {
  dlgSel(label).find('.v-select__slot').first().click({ force: true });
  cy.wait(900);
  cy.get('body').then(($b) => {
    const menus = $b.find('.v-menu__content').filter((i, e) => vis(e));
    const tiles = menus.last().find('.v-list__tile__title').filter((i, e) => t(e) === item);
    obs.선택클릭 = [...(obs.선택클릭 || []), { 칸: label, 항목: item, 열린메뉴: menus.length, 찾은항목: tiles.length, 메뉴글자: t(menus.last()[0]).slice(0, 120) }];
    note('선택클릭', obs.선택클릭);
    expect(tiles.length, `${label} 메뉴에 「${item}」`).to.be.greaterThan(0);
    cy.wrap(tiles.first().closest('.v-list__tile, a')[0] || tiles[0]).click({ force: true });
  });
  cy.wait(800);
  dlgSel(label).then(($s) => { obs.선택후칸 = [...(obs.선택후칸 || []), { 칸: label, 글자: t($s[0]).slice(0, 120) }]; note('선택후칸', obs.선택후칸); });
  closeMenu();
};
// 선택칸을 want 목록과 같게 맞춤 (여러 개 고르는 칸은 항목을 눌러 켜고 끔 · 하나만 고르는 칸은 지우기 아이콘 또는 다시 고름)
const setTo = (label, want) => {
  chosenAll().then((now) => {
    const cur = now[label] || [];
    const multi = label !== '개인정보 열람 권한';
    if (multi) {
      cur.filter((x) => !want.includes(x)).forEach((x) => clickItem(label, x));
      want.filter((x) => !cur.includes(x)).forEach((x) => clickItem(label, x));
      return;
    }
    if (want.length) { if (cur[0] !== want[0]) clickItem(label, want[0]); return; }
    if (!cur.length) return;
    // 하나만 고르는 칸 비우기 : 지우기 아이콘이 있으면 누르고, 없으면 같은 항목을 다시 눌러 봄
    dlgSel(label).then(($s) => {
      const clr = $s.find('.v-input__icon--clear button, .v-input__icon--clear i').filter((i, e) => vis(e))[0];
      if (clr) { cy.wrap(clr).click({ force: true }); cy.wait(500); } else clickItem(label, cur[0]);
    });
  });
};
const saveReqs = [];
const save = (tag) => {
  const n = saveReqs.length;
  A.activeDialog().find('button, .v-btn').filter((i, e) => t(e) === '저장').first().click({ force: true });
  cy.wait(1500);
  A.confirmIfAny();
  cy.wait(2500);
  cy.then(() => {
    const got = saveReqs.slice(n);
    note(`저장_${tag}`, got);
    expect(got.length, `${tag} 저장 요청`).to.be.greaterThan(0);
    got.forEach((r) => {
      expect(r.status, `${tag} 저장 응답 ${r.url}`).to.be.within(200, 299);
      if (r.code !== undefined && r.code !== null) expect(Number(r.code), `${tag} 저장 응답 code`).to.be.oneOf([0, 200]);
    });
  });
};
const restore = (tag) => {
  openEdit();
  cy.then(() => LABELS.forEach((lb) => setTo(lb, state.처음[lb])));
  chosenAll().then((o) => note(`되돌림전_${tag}`, o));
  save(`되돌림_${tag}`);
  search();
  openEdit();
  chosenAll().then((o) => {
    note(`되돌림후_${tag}`, o);
    const same = LABELS.every((lb) => JSON.stringify([...o[lb]].sort()) === JSON.stringify([...state.처음[lb]].sort()));
    if (same) state.되돌림 = true;
    LABELS.filter((lb) => lb !== '개인정보 열람 권한').forEach((lb) => expect([...o[lb]].sort(), `되돌린 뒤 ${lb} = 처음 값`).to.deep.eq([...state.처음[lb]].sort()));
    if (JSON.stringify(o['개인정보 열람 권한']) !== JSON.stringify(state.처음['개인정보 열람 권한'])) {
      note('관찰_권한되돌림', { 처음: state.처음['개인정보 열람 권한'], 지금: o['개인정보 열람 권한'] });
      cy.log(`⚠️ [Mantis 0039239] 개인정보 열람 권한을 처음 값(${state.처음['개인정보 열람 권한'].join(',') || '빈 값'})으로 되돌리지 못함 — 지금 ${o['개인정보 열람 권한'].join(',')}`);
    }
  });
  A.activeDialog().find('button, .v-btn').filter((i, e) => t(e) === '취소').first().click({ force: true });
  cy.wait(1000);
};

describe('14_Depth_관리자페이지 관리_메니저메뉴코드관리', () => {
  A.ignoreErrors();
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/common\/com42\// }, (req) => {
      if (req.method === 'GET' || /search|getWorkspace|getManager/i.test(req.url)) return;
      const item = { m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 160), body: JSON.stringify(req.body || '').slice(0, 400) };
      req.on('after:response', (res) => { item.status = res.statusCode; item.code = res.body && res.body.code; saveReqs.push(item); });
    });
  });

  after(() => {
    if (!state.바꿈 || state.되돌림 || !state.처음) return;
    cy.log('↩️ 바뀐 채로 남아 있어 되돌리기 한 번 더');
    goScreen();
    search();
    restore('after');
  });

  it(`조회가능 그룹 지정 — ${NAME} 업무시스템 · 그룹 · 개인정보 열람 권한 저장 → 확인 → 되돌림`, { retries: 0 }, () => {
    goScreen();

    // 1. 검색 · 처음 목록 값
    search();
    cy.get('body').then(($b) => {
      const rs = myRows($b);
      note('1_처음목록', rs.map(cells));
      expect(rs.length, `「${NAME}」 검색 결과에 ${ID}`).to.be.greaterThan(0);
    });

    // 2. 편집 창 · 처음 값
    openEdit();
    A.activeDialog().find('input[aria-label="userName"], input[aria-label="이름"]').first().should('have.value', NAME).and('have.attr', 'readonly');
    LABELS.forEach((lb) => A.activeDialog().find(`input[aria-label="${lb}"]`).should('exist'));
    A.activeDialog().then(($d) => {
      const raw = $d.find('input').toArray().map((e) => e.getAttribute('aria-label')).filter((x) => /^[a-z][A-Za-z]+$/.test(x || ''));
      if (raw.length) { note('관찰_영문키칸이름', raw); cy.log(`⚠️ [관찰 Mantis 0039239] 편집 창 칸 이름이 영문 키 그대로 : ${raw.join(', ')}`); }
    });
    chosenAll().then((o) => { state.처음 = o; note('2_처음값', o); });

    // 3. 세 값 고르고 저장
    // [11-25] 개인정보 열람 권한은 하나만 고르는 칸이라 한 번 고르면 빈 값으로 되돌릴 수 없음(지우기 없음) → 11-25 첫 실행 뒤 user160 기준값은 「마스킹 고정」
    //   지금 값과 다른 값으로 바꿔 저장을 확인하고, 되돌릴 때 지금 값으로 맞춤
    cy.then(() => {
      const cur = (state.처음['개인정보 열람 권한'] || [])[0];
      SET['개인정보 열람 권한'] = cur === '마스킹 해제 허용' ? '마스킹 고정' : '마스킹 해제 허용';
      note('2_권한바꿀값', { 지금: cur || '빈 값', 바꿀값: SET['개인정보 열람 권한'] });
      state.바꿈 = true;
    });
    cy.then(() => LABELS.forEach((lb) => setTo(lb, lb === '개인정보 열람 권한' ? [SET[lb]] : [...new Set([...(state.처음[lb] || []), SET[lb]])])));
    chosenAll().then((o) => {
      note('3_저장전', o);
      LABELS.forEach((lb) => expect(o[lb], `저장 전 ${lb}`).to.include(SET[lb]));
    });
    save('변경');

    // 4. 목록 · 편집 창에서 확인
    search();
    cy.get('body').then(($b) => {
      const rs = myRows($b);
      const txt = rs.map((r) => cells(r).join(' | '));
      note('4_변경후목록', txt);
      expect(rs.length, `저장 뒤 ${ID} 행`).to.be.greaterThan(0);
      const all = txt.join(' / ');
      LABELS.forEach((lb) => expect(all, `저장 뒤 목록에 ${lb} 「${SET[lb]}」`).to.include(SET[lb]));
      if (/notFound/.test(all)) cy.log('⚠️ [관찰 Mantis 0039239] 목록 조회가능 그룹에 notFound 표시');
      if (/\[\s*"/.test(all)) { note('관찰_목록배열표시', all); cy.log('⚠️ [관찰 Mantis 0039239] 목록 조회가능 업무시스템 · 그룹이 [ "…" ] 배열 글자 그대로 표시'); }
    });
    openEdit();
    chosenAll().then((o) => {
      note('4_변경후편집창', o);
      LABELS.forEach((lb) => expect(o[lb], `다시 연 편집 창 ${lb}`).to.include(SET[lb]));
    });
    A.activeDialog().find('button, .v-btn').filter((i, e) => t(e) === '취소').first().click({ force: true });
    cy.wait(1000);

    // 5. 처음 값으로 되돌림
    restore('본문');
    cy.log(`✅ 메니저 메뉴 코드 관리 — ${NAME} 조회가능 그룹 지정 저장 · 확인 · 되돌림 완료`);
  });
});
