// [임시 탐색용 22] 자산 깊은 시나리오 준비 — 탐색 대상 DB 등록 화면 · 탐색 서버 화면 구조 (2026-11-13)
//   대상 : 관리자 페이지 > 관리 > 시스템 > 데이터베이스 (등록 창 입력칸 · 선택 목록)
//          관리자 페이지 > 관리 > 개인정보 탐색 서버(포그라운드 전용)
//          자산 > 개인정보 탐색 정책 초기화 API (탐색 에이전트 · 모듈 유형)
//   조회만 함 : 화면 열기, 「add」(추가) 창 열어 입력칸 · 선택 목록 보기 → 취소. 저장 · 연결 테스트 · 삭제는 누르지 않음
//   결과 : cypress/probe/P22_*.json / *.html · 스크린샷 P22_*.png · API 기록 P22_api.json
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const html = (name) => cy.get('body').then(($b) => {
  const el = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 150000) : '(없음)');
});
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  const dlg = [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown);
  const scope = dlg.length ? dlg[dlg.length - 1] : root;
  const labelOf = (e) => {
    const box = e.closest('.v-input');
    const lab = box && box.querySelector('label');
    return e.getAttribute('aria-label') || (lab ? t(lab) : '') || e.getAttribute('placeholder') || '';
  };
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    headlines: q('.c-headline, .title, .v-toolbar__title, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 15),
    tables: q('table').map((tb) => ({ th: [...tb.querySelectorAll('th')].map(t).filter(Boolean), rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length, first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 5).map((r) => t(r).slice(0, 200)) })),
    tree: q('.vue-treeselect__label, .v-treeview-node__label, .tree-item').map(t).filter(Boolean).slice(0, 40),
    buttons: [...new Set(q('button, .v-btn').map(t).filter(Boolean))],
    tabs: q('.v-tabs__item').map(t),
    dialog: dlg.map((d) => t(d).slice(0, 3000)),
    fields: [...scope.querySelectorAll('input, textarea')].filter(shown).map((e) => ({ label: labelOf(e), type: e.type, val: e.type === 'password' ? '(비밀번호칸)' : (e.value || '').slice(0, 60), readonly: e.readOnly, required: !!(e.closest('.v-input') && /\*/.test(t(e.closest('.v-input').querySelector('label')))) })),
    text: t(scope).slice(0, 3000)
  });
});

const out = { urls: {}, missing: [], selects: {} };
const save = () => cy.writeFile('cypress/probe/P22_요약.json', out, { log: false });

const go = (anchor, label) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(3000);
  return cy.get('body').then(($b) => {
    const all = $b.find('.v-list__tile__title').filter((i, e) => shown(e)).toArray();
    let ai = -1;
    all.forEach((e, i) => { if (t(e) === anchor) ai = i; });
    const el = all.find((e, i) => i >= Math.max(ai, 0) && t(e) === label);
    if (!el) { out.missing.push(`사이트맵에 「${label}」 없음 (기준 「${anchor}」 ${ai})`); save(); return cy.wrap(false, { log: false }); }
    cy.wrap(el).click({ force: true });
    cy.wait(4500);
    cy.location('pathname').then((p) => { out.urls[label] = p; save(); });
    return cy.wrap(true, { log: false });
  });
};
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) {
    const $c = $b.find('.v-content__wrap button, .v-content__wrap .v-btn').filter((i, e) => shown(e) && t(e) === '취소');
    if ($c.length) cy.wrap($c.last()).click({ force: true });
    return;
  }
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|clear)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
});
// 열린 창(또는 본문 추가 화면)의 선택칸(v-select)을 하나씩 열어 목록 항목을 기록 → esc
const readSelects = (key) => cy.get('body').then(($b) => {
  const dlg = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || $b.find('.v-content__wrap').last()[0];
  const sels = [...dlg.querySelectorAll('.v-select')].filter(shown).slice(0, 8);
  out.selects[key] = [];
  sels.forEach((s, i) => {
    const lab = t(s.querySelector('label')) || (s.querySelector('input') && s.querySelector('input').getAttribute('aria-label')) || `선택칸${i + 1}`;
    cy.wrap(s).find('.v-select__slot, .v-input__slot').first().click({ force: true });
    cy.wait(800);
    cy.get('body').then(($b2) => {
      const menu = $b2.find('.menuable__content__active, .v-menu__content--active').filter((j, e) => shown(e)).last();
      out.selects[key].push({ 칸: lab, 항목: menu.find('.v-list__tile__title').toArray().map(t).slice(0, 40) });
      save();
    });
    cy.get('body').type('{esc}', { force: true });
    cy.wait(500);
  });
});
const peekAdd = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0];
  const $add = Cypress.$(root ? root.querySelectorAll('button, .v-btn') : []).filter((i, e) => shown(e) && /^(add|추가|등록)$/.test(t(e)));
  if (!$add.length) { out.missing.push(`${name} : 추가 버튼 없음`); save(); return; }
  cy.wrap($add.first()).click({ force: true });
  cy.wait(2500);
  snap(`${name}_추가창`); html(`${name}_추가창`);
  cy.screenshot(`${name}_추가창`, { capture: 'viewport', overwrite: true });
  readSelects(name);
  closeTop();
  closeTop();
});

describe('PROBE22 자산 준비', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 1500); } catch (e) { body = ''; }
        api.push({ step: Cypress.currentTest.title.slice(0, 20), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 220), st: res.statusCode, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => cy.writeFile('cypress/probe/P22_api.json', api, { log: false }));

  it('1. 관리 > 시스템 > 데이터베이스 (등록 창)', { retries: 0 }, () => {
    go('서버', '데이터베이스').then((ok) => {
      if (!ok) return;
      snap('P22_1_데이터베이스'); html('P22_1_데이터베이스');
      cy.screenshot('P22_1_데이터베이스', { capture: 'viewport', overwrite: true });
      peekAdd('P22_1_데이터베이스');
    });
  });

  it('2. 관리 > 개인정보 탐색 서버(포그라운드 전용)', { retries: 0 }, () => {
    go('개인정보 탐색 서버(포그라운드 전용)', '개인정보 탐색 서버(포그라운드 전용)').then((ok) => {
      if (!ok) return;
      snap('P22_2_탐색서버'); html('P22_2_탐색서버');
      cy.screenshot('P22_2_탐색서버', { capture: 'viewport', overwrite: true });
      peekAdd('P22_2_탐색서버');
    });
  });

  it('3. 자산 > 개인정보 탐색 정책 초기화 (탐색 에이전트 · 모듈 유형)', { retries: 0 }, () => {
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    snap('P22_3_탐색정책');
  });
});
