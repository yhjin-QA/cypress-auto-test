// [임시 탐색용 25] 자산 깊은 시나리오 — DB 오브젝트(스키마 · 테이블 · 컬럼) 탐색을 어디서 실행하는지 · DB 선택 창 닫는 법 (2026-11-13)
//   probe24 : 탐색 정책에서 MariaDB_26_logcatch_demo 를 골라도 스키마 · 테이블 · 컬럼 0건 (db-object 통계 hasSchema N)
//             → LogCatch 가 아직 이 DB 의 오브젝트를 수집하지 않음. 수집(「데이터베이스 오브젝트 탐색」) 을 실행하는 곳을 찾음
//   1. 관리 > 시스템 > 데이터베이스 : DB 이름 · 트리 항목을 눌러 상세 열기 → 버튼 · 「탐색 결과」 칸 기록 (버튼은 누르지 않음)
//   2. 자산 > 개인정보 탐색 정책 > add : DB 고른 뒤 ⋮(more_vert) 메뉴 항목 기록 (항목은 누르지 않음)
//                                       DB 선택 창 닫기 시도 : 톱니 다시 누르기 · Tab · 정책명 칸 클릭 · overlay 클릭 → 어떤 방법이 닫는지 기록
//   조회만 함 : 저장 · 실행 · 탐색 · 메뉴 항목은 누르지 않음, 마지막에 추가 화면 「취소」
//   결과 : cypress/probe/P25_*.json / *.html · 스크린샷 P25_*.png · P25_요약.json · P25_api.json
const A = require('../../support/anomaly');
const DB_NAME = 'MariaDB_26_logcatch_demo';
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const html = (name) => cy.get('body').then(($b) => {
  const el = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0] || $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 250000) : '(없음)');
});
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    dialogs: [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown).map((d) => t(d).slice(0, 2000)),
    menus: [...$b[0].querySelectorAll('.menuable__content__active, .v-menu__content--active')].filter(shown).map((m) => [...m.querySelectorAll('.v-list__tile__title, .v-list__tile')].map(t).filter(Boolean)),
    headlines: q('.c-headline, .title, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 25),
    buttons: [...new Set(q('button, .v-btn').map(t).filter(Boolean))].slice(0, 80),
    icons: [...new Set(q('i.v-icon--link, button i').map((e) => (t(e) || e.className.replace(/.*\b(fa-[a-z-]+)\b.*/, '$1'))))].slice(0, 60),
    tables: q('table').map((tb) => ({ th: [...tb.querySelectorAll('th')].map(t).filter(Boolean), rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length, first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 8).map((r) => t(r).slice(0, 200)) })),
    text: t(root).slice(0, 4000)
  });
});
const dlgCount = ($b) => $b.find('.v-dialog--active').filter((i, e) => shown(e)).length;

describe('PROBE25 자산 오브젝트 탐색', () => {
  A.ignoreErrors();
  const api = [];
  const out = { 상세열기: [], 창닫기: [] };
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 2500); } catch (e) { body = ''; }
        api.push({ step: Cypress.currentTest.title.slice(0, 12), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 240), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 600) : null, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => { cy.writeFile('cypress/probe/P25_api.json', api, { log: false }); cy.writeFile('cypress/probe/P25_요약.json', out, { log: false }); });

  it('1. 관리 > 시스템 > 데이터베이스 — DB 상세', { retries: 0 }, () => {
    cy.visit('/logcatch/management/system/database');
    cy.wait(5000);
    // 트리 머리 아이콘 설명(툴팁) 기록 — 마우스만 올림
    cy.get('.v-content__wrap .tree-header i').each(($i, k) => {
      cy.wrap($i).trigger('mouseenter', { force: true });
      cy.wait(600);
      cy.get('body').then(($b) => out[`트리머리아이콘${k + 1}`] = { 아이콘: ($i.attr('class') || '').replace(/.*\b(fa-[a-z-]+)\b.*/, '$1') + t($i[0]), 툴팁: $b.find('.v-tooltip__content.menuable__content__active').toArray().map(t) });
      cy.wrap($i).trigger('mouseleave', { force: true });
    });
    // ① 목록의 DB 이름 글자 클릭
    cy.contains('.v-content__wrap tbody td', DB_NAME).click({ force: true });
    cy.wait(3500);
    cy.get('body').then(($b) => out.상세열기.push(`목록 클릭 → ${t($b.find('.v-content__wrap').last()[0]).includes('데이터베이스 상세') ? '상세 열림' : '안 열림'}`));
    // ② 안 열렸으면 트리 「자동탐색」 펼침 → DB 항목 클릭
    cy.get('body').then(($b) => {
      if (t($b.find('.v-content__wrap').last()[0]).includes('데이터베이스 상세')) return;
      cy.get('.v-content__wrap .vue-treeselect__label').filter((i, e) => shown(e) && t(e).includes('자동탐색')).first().closest('.vue-treeselect__option').find('.vue-treeselect__option-arrow-container').click({ force: true });
      cy.wait(1500);
      cy.get('body').then(($b2) => {
        const $n = $b2.find('.v-content__wrap .vue-treeselect__label').filter((i, e) => shown(e) && t(e).includes(DB_NAME));
        if ($n.length) { cy.wrap($n.first()).click({ force: true }); cy.wait(3500); }
        cy.get('body').then(($b3) => out.상세열기.push(`트리 클릭 → ${t($b3.find('.v-content__wrap').last()[0]).includes('데이터베이스 상세') ? '상세 열림' : '안 열림'}`));
      });
    });
    snap('P25_1_DB상세'); html('P25_1_DB상세');
    cy.screenshot('P25_1_DB상세', { capture: 'fullPage', overwrite: true });
    // 탐색 결과 칸 펼침 아이콘이 있으면 펼쳐 봄
    cy.get('body').then(($b) => {
      const head = $b.find('.v-content__wrap .c-headline, .v-content__wrap .v-card__actions').filter((i, e) => shown(e) && t(e).includes('탐색 결과')).first();
      if (head.length) { cy.wrap(head).click({ force: true }); cy.wait(1500); snap('P25_1b_탐색결과'); cy.screenshot('P25_1b_탐색결과', { capture: 'fullPage', overwrite: true }); }
    });
  });

  it('2. 탐색 정책 추가 — DB 고른 뒤 ⋮ 메뉴 · DB 선택 창 닫기', { retries: 0 }, () => {
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && t(e) === 'add').first().click({ force: true });
    cy.wait(3500);
    const gearDb = () => cy.get('input[aria-label="Database"]').filter(':visible').first().closest('.v-input').find('i').filter((i, e) => /settings|fa-cog/.test(e.className + t(e))).first();
    gearDb().click({ force: true });
    cy.wait(2000);
    cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__group__header__append-icon').each(($a) => cy.wrap($a).click({ force: true }));
    cy.wait(800);
    cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === DB_NAME).first()
      .closest('.v-list__tile').find('.v-input--selection-controls__input').first().click({ force: true });
    cy.wait(2500);
    // 닫기 시도 : ① 톱니 다시 ② Tab ③ 정책명 칸 ④ overlay
    const tryClose = (how, act) => cy.get('body').then(($b) => {
      if (!dlgCount($b)) return;
      act();
      cy.wait(1200);
      cy.get('body').then(($b2) => out.창닫기.push(`${how} → ${dlgCount($b2) ? '안 닫힘' : '닫힘'}`));
    });
    tryClose('톱니 다시', () => gearDb().click({ force: true }));
    tryClose('Tab', () => cy.get('body').trigger('keydown', { key: 'Tab', keyCode: 9, which: 9, force: true }));
    tryClose('정책명 칸', () => cy.get('input[aria-label="정책명"]').filter(':visible').first().click({ force: true }));
    tryClose('overlay', () => cy.get('body').then(($b) => { const ov = $b.find('.v-overlay').filter((i, e) => shown(e)).last(); if (ov.length) cy.wrap(ov).click({ force: true }); else cy.get('.v-content__wrap').last().click('bottomRight', { force: true }); }));
    snap('P25_2_고른뒤'); html('P25_2_고른뒤');
    cy.screenshot('P25_2_고른뒤', { capture: 'fullPage', overwrite: true });
    // ⋮(more_vert) 메뉴 — Database (1) 옆
    cy.get('body').then(($b) => {
      const $mv = $b.find('.v-content__wrap i').filter((i, e) => shown(e) && t(e) === 'more_vert');
      out.more_vert수 = $mv.length;
      if (!$mv.length) return;
      cy.wrap($mv.first()).click({ force: true });
      cy.wait(1500);
      snap('P25_3_더보기메뉴');
      cy.screenshot('P25_3_더보기메뉴', { capture: 'viewport', overwrite: true });
      cy.get('body').type('{esc}', { force: true });
      cy.wait(800);
    });
    // 추가 화면 취소 (저장 안 함)
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-content__wrap button, .v-content__wrap .v-btn').filter((i, e) => shown(e) && t(e) === '취소');
      if ($c.length) cy.wrap($c.first()).click({ force: true });
    });
    cy.wait(2000);
  });
});
