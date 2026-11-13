// [임시 탐색용 24] 자산 깊은 시나리오 설계 — 탐색 정책 추가 화면에서 대상 DB 를 골랐을 때 (2026-11-13)
//   probe23 : 「Database (N)」 은 고른 DB 수(처음 0). Database 톱니 → 체크 트리 창(전체 선택 > 자동탐색 > MariaDB_26_logcatch_demo), 버튼 없음 · esc 로 안 닫힘
//   이번 : 창에서 MariaDB_26_logcatch_demo 체크 → 창 닫기(esc · 바깥 · 제목 클릭 순으로 시도) → 스키마 · 테이블 · 컬럼 건수 · 트리 · 오른쪽 표
//          → 트리 펼침(체크는 안 함) → 패턴 톱니 창 기록 → 추가 화면 「취소」 (저장 · 실행 안 함)
//   결과 : cypress/probe/P24_*.json / *.html · 스크린샷 P24_*.png · API 기록 P24_api.json
const A = require('../../support/anomaly');
const DB_NAME = 'MariaDB_26_logcatch_demo';
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const html = (name, sel) => cy.get('body').then(($b) => {
  const el = (sel && $b.find(sel).filter((i, e) => shown(e)).last()[0]) || $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 250000) : '(없음)');
});
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const dlg = [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown);
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  cy.writeFile(`cypress/probe/${name}.json`, {
    dialog: dlg.map((d) => t(d).slice(0, 3000)),
    headlines: q('.c-headline, .title, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 20),
    counts: (t(root).match(/(Database\s*\(\d+\)|스키마\s*\d+건|테이블\s*\d+건|컬럼\s*\d+건)/g) || []),
    tables: q('table').map((tb) => ({ th: [...tb.querySelectorAll('th')].map(t).filter(Boolean), rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length, first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 15).map((r) => t(r).slice(0, 200)) })),
    tree: q('.vue-treeselect__option').map((o) => ({ label: t(o.querySelector('.vue-treeselect__label')), level: ((o.closest('[class*="indent-level-"]') || {}).className || '').replace(/.*indent-level-(\d+).*/, '$1') })).slice(0, 120),
    inputs: q('input').map((e) => ({ aria: e.getAttribute('aria-label'), type: e.type, val: (e.value || '').slice(0, 60), checked: e.getAttribute('aria-checked') })),
    text: t(root).slice(0, 4000)
  });
});
const dlgOpen = ($b) => $b.find('.v-dialog--active').filter((i, e) => shown(e)).length > 0;
// 버튼 없는 창 닫기 : esc → 바깥(overlay) → 추가 제목 클릭
const closeDialog = (log) => {
  cy.get('body').type('{esc}', { force: true });
  cy.wait(800);
  cy.get('body').then(($b) => {
    if (!dlgOpen($b)) { log.push('esc'); return; }
    const ov = $b.find('.v-overlay--active, .v-overlay').filter((i, e) => shown(e)).last();
    if (ov.length) cy.wrap(ov).click('topLeft', { force: true }); else cy.get('body').click(5, 5, { force: true });
    cy.wait(800);
    cy.get('body').then(($b2) => {
      if (!dlgOpen($b2)) { log.push('바깥 클릭'); return; }
      cy.contains('.v-content__wrap .c-headline, .v-content__wrap .v-card__title, .v-content__wrap h2', '추가').click({ force: true });
      cy.wait(800);
      cy.get('body').then(($b3) => log.push(dlgOpen($b3) ? '못 닫음' : '제목 클릭'));
    });
  });
};
const gear = (aria) => cy.get(`input[aria-label="${aria}"]`).filter(':visible').first().closest('.v-input').find('i').filter((i, e) => /settings|fa-cog/.test(e.className + t(e))).first();

describe('PROBE24 자산 탐색 대상 선택', () => {
  A.ignoreErrors();
  const api = [];
  const out = { 닫기: [] };
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 3000); } catch (e) { body = ''; }
        api.push({ m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 240), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 800) : null, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => { cy.writeFile('cypress/probe/P24_api.json', api, { log: false }); cy.writeFile('cypress/probe/P24_요약.json', out, { log: false }); });

  it('탐색 정책 추가 — 대상 DB 고르기 → 스키마 · 테이블 · 컬럼 · 패턴 (저장 안 함)', { retries: 0 }, () => {
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === 'add').first().click({ force: true });
    cy.wait(3500);
    // 1. Database 톱니 → 그룹 펼침 → DB 체크
    gear('Database').click({ force: true });
    cy.wait(2000);
    // probe23 HTML : 그룹(v-list__group) 머리의 keyboard_arrow_down 로 펼침, DB 줄(a.v-list__tile) 안에 체크박스(input role=checkbox)
    cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__group__header__append-icon').each(($a) => cy.wrap($a).click({ force: true }));
    cy.wait(1000);
    snap('P24_1_DB창'); html('P24_1_DB창');
    cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === DB_NAME).first()
      .closest('.v-list__tile').find('.v-input--selection-controls__input').first().click({ force: true });
    cy.wait(2500);
    cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === DB_NAME).first()
      .closest('.v-list__tile').find('input[role="checkbox"]').invoke('attr', 'aria-checked').then((v) => { out.DB체크 = v; });
    snap('P24_2_DB체크'); html('P24_2_DB체크');
    cy.screenshot('P24_2_DB체크', { capture: 'viewport', overwrite: true });
    closeDialog(out.닫기);
    cy.wait(4000);
    // 2. 고른 뒤 화면 : Database (1) · 스키마 · 테이블 · 컬럼 건수 · 트리 · 오른쪽 표
    snap('P24_3_고른뒤'); html('P24_3_고른뒤');
    cy.screenshot('P24_3_고른뒤', { capture: 'fullPage', overwrite: true });
    // 3. 트리 펼침 (체크는 안 함) — 세 번
    const expand = (step) => cy.get('body').then(($b) => {
      const $arrow = $b.find('.v-content__wrap .vue-treeselect__option-arrow-container').filter((i, e) => shown(e) && !e.querySelector('.vue-treeselect__option-arrow--rotated'));
      if (!$arrow.length) return;
      cy.wrap($arrow.first()).click({ force: true });
      cy.wait(3000);
      snap(`P24_4_트리펼침${step}`);
    });
    expand(1); expand(2); expand(3);
    html('P24_4_트리');
    cy.screenshot('P24_4_트리', { capture: 'fullPage', overwrite: true });
    // 4. 패턴 톱니 창
    gear('패턴').click({ force: true });
    cy.wait(2500);
    snap('P24_5_패턴창'); html('P24_5_패턴창');
    cy.screenshot('P24_5_패턴창', { capture: 'viewport', overwrite: true });
    cy.get('body').then(($b) => {
      const $x = $b.find('.v-dialog--active button, .v-dialog--active .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
      if ($x.length) cy.wrap($x.last()).click({ force: true }); else closeDialog(out.닫기);
    });
    cy.wait(1500);
    // 5. 추가 화면 취소 (저장 안 함)
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-content__wrap button, .v-content__wrap .v-btn').filter((i, e) => shown(e) && t(e) === '취소');
      if ($c.length) cy.wrap($c.first()).click({ force: true });
    });
    cy.wait(2000);
    snap('P24_6_취소뒤');
  });
});
