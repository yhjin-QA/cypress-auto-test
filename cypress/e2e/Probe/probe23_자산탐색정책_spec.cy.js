// [임시 탐색용 23] 자산 깊은 시나리오 설계 — 탐색 대상 DB 등록 뒤 탐색 정책 추가 화면 구조 (2026-11-13)
//   전제 : 관리 > 시스템 > 데이터베이스 에 MariaDB_26_logcatch_demo (Server_26 · 10.10.54.26:3306 · lc_scan) 를 손으로 등록해 둠
//   1. 관리 > 시스템 > 데이터베이스 : 목록 · 등록한 DB 상세(탐색 결과 칸)
//   2. 자산 > 개인정보 탐색 정책 > add : Database (N) 트리 · 스키마/테이블/컬럼 건수 · 트리 펼침 · Database · 패턴 톱니 창
//   조회만 함 : 트리 펼침 · 체크는 하지 않음, 창은 닫기 · 취소. 저장 · 실행 · 접속 테스트는 누르지 않음
//   결과 : cypress/probe/P23_*.json / *.html · 스크린샷 P23_*.png · API 기록 P23_api.json
const A = require('../../support/anomaly');
const DB_NAME = 'MariaDB_26_logcatch_demo';
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const html = (name) => cy.get('body').then(($b) => {
  const el = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 200000) : '(없음)');
});
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const dlg = [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown);
  const scope = dlg.length ? dlg[dlg.length - 1] : root;
  const q = (s) => [...scope.querySelectorAll(s)].filter(shown);
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    dialog: dlg.length ? t(dlg[dlg.length - 1]).slice(0, 3000) : null,
    headlines: q('.c-headline, .title, .v-toolbar__title, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 20),
    tables: q('table').map((tb) => ({ th: [...tb.querySelectorAll('th')].map(t).filter(Boolean), rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length, first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 12).map((r) => t(r).slice(0, 200)) })),
    tree: q('.vue-treeselect__option').map((o) => ({ label: t(o.querySelector('.vue-treeselect__label')), level: (o.closest('[class*="indent-level-"]') || { className: '' }).className.replace(/.*indent-level-(\d+).*/, '$1'), checked: o.classList.contains('vue-treeselect__option--selected') || !!o.querySelector('.vue-treeselect__checkbox--checked') })).slice(0, 80),
    inputs: q('input, textarea').map((e) => ({ aria: e.getAttribute('aria-label'), type: e.type, val: e.type === 'password' ? '(비밀번호칸)' : (e.value || '').slice(0, 60) })),
    buttons: [...new Set(q('button, .v-btn').map(t).filter(Boolean))].slice(0, 60),
    text: t(scope).slice(0, 3000)
  });
});
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|clear)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
});
// 입력칸 오른쪽 톱니(settings) 를 눌러 뜨는 창을 기록 → 닫기
const peekGear = (aria, name) => cy.get('body').then(($b) => {
  const inp = $b.find(`input[aria-label="${aria}"]`).filter((i, e) => shown(e)).first();
  if (!inp.length) return;
  const $g = inp.closest('.v-input').find('i').filter((i, e) => /settings|fa-cog/.test(e.className + t(e)));
  if (!$g.length) return;
  cy.wrap($g.first()).click({ force: true });
  cy.wait(2500);
  snap(name); html(name);
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
  closeTop();
});

describe('PROBE23 자산 탐색 정책', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 2000); } catch (e) { body = ''; }
        api.push({ step: Cypress.currentTest.title.slice(0, 20), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 240), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 500) : null, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => cy.writeFile('cypress/probe/P23_api.json', api, { log: false }));

  it('1. 관리 > 시스템 > 데이터베이스 — 등록한 DB 상세', { retries: 0 }, () => {
    cy.visit('/logcatch/management/system/database');
    cy.wait(5000);
    snap('P23_1_DB목록');
    cy.get('body').then(($b) => {
      const $row = $b.find('tbody tr').filter((i, e) => shown(e) && t(e).includes(DB_NAME));
      if (!$row.length) return;
      cy.wrap($row.first().find('td').first()).click({ force: true });
      cy.wait(3500);
      snap('P23_1_DB상세'); html('P23_1_DB상세');
      cy.screenshot('P23_1_DB상세', { capture: 'fullPage', overwrite: true });
    });
  });

  it('2. 자산 > 개인정보 탐색 정책 — 추가 화면 (DB · 스키마 · 테이블 · 컬럼 트리, 패턴 창)', { retries: 0 }, () => {
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === 'add').first().click({ force: true });
    cy.wait(3500);
    snap('P23_2_추가'); html('P23_2_추가');
    cy.screenshot('P23_2_추가', { capture: 'fullPage', overwrite: true });
    // 트리를 두 단계까지 펼쳐 봄 (체크는 하지 않음)
    const expand = (step) => cy.get('body').then(($b) => {
      const $arrow = $b.find('.v-content__wrap .vue-treeselect__option-arrow-container').filter((i, e) => shown(e) && !e.closest('.vue-treeselect__option').querySelector('.vue-treeselect__option-arrow--rotated'));
      if (!$arrow.length) return;
      cy.wrap($arrow.first()).click({ force: true });
      cy.wait(3000);
      snap(`P23_2_트리펼침${step}`);
    });
    expand(1); expand(2); expand(3);
    html('P23_2_트리');
    cy.screenshot('P23_2_트리', { capture: 'fullPage', overwrite: true });
    peekGear('Database', 'P23_2_Database창');
    peekGear('패턴', 'P23_2_패턴창');
    // 추가 화면 취소 (저장 안 함)
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-content__wrap button, .v-content__wrap .v-btn').filter((i, e) => shown(e) && t(e) === '취소');
      if ($c.length) cy.wrap($c.first()).click({ force: true });
    });
    cy.wait(1500);
  });
});
