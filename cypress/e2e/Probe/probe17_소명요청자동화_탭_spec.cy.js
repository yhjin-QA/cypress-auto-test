// [임시 탐색용 17] 소명 요청 자동화 탭 — 탭 전환 · 주소 · 설정 카드 · 권한 없는 계정이 주소로 들어갈 때 (2026-11-12)
//   저장 · 지금 실행은 누르지 않음 / 권한 없는 계정은 「저장」 을 눌러 이유 문구만 확인 (권한 없으면 저장되지 않는 설계)
//   결과 : cypress/probe/P17_*.json / *.html
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter((i, e) => shown(e)).last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 150000) : '(없음)');
});
const values = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const inputs = [...root.querySelectorAll('input, select, textarea')].map((e) => ({
    tag: e.tagName, type: e.type, aria: e.getAttribute('aria-label'), val: e.value, checked: e.getAttribute('aria-checked'),
    disabled: e.disabled, shown: shown(e), cls: String(e.className).slice(0, 60)
  }));
  const blurred = [...root.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return shown(e) && s.filter && s.filter !== 'none'; })
    .map((e) => ({ cls: String(e.className).slice(0, 80), filter: getComputedStyle(e).filter, text: t(e).slice(0, 80) })).slice(0, 10);
  const buttons = [...root.querySelectorAll('button, .v-btn')].filter(shown).map((e) => ({ text: t(e), disabled: e.disabled || e.classList.contains('v-btn--disabled'), cls: String(e.className).slice(0, 60) }));
  cy.writeFile(`cypress/probe/${name}.json`, { url: root.ownerDocument.location.href, text: t(root).slice(0, 4000), inputs, buttons, blurred });
});

describe('PROBE17', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/api\/.*(approval|explanation)/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 3000); } catch (e) { body = String(res.body).slice(0, 300); }
        api.push({ who: Cypress.currentTest.title.slice(0, 20), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, body });
      });
    });
  });
  after(() => cy.writeFile('cypress/probe/P17_api.json', api));

  it('관리자 — 탭 전환 · 설정 카드 (저장·지금 실행 안 함)', { retries: 0 }, () => {
    A.loginAdmin();
    cy.visit('/logcatch/approval/submit/anomaly-alerts');
    cy.wait(4000);
    cy.get('.v-btn__content').filter(':visible').contains(/^\s*소명 요청 자동화\s*$/).click({ force: true });
    cy.wait(3000);
    cy.get('body').then(($b) => {
      // 안 넘어갔으면 실제 마우스 클릭으로 한 번 더
      if (!/자동 발송 설정|자동 소명 요청/.test(t($b[0]))) cy.get('button.tab-btn').filter((i, e) => t(e) === '소명 요청 자동화').first().realClick();
    });
    cy.wait(3000);
    cy.url().then((u) => cy.writeFile('cypress/probe/P17_1_주소.json', { url: u }));
    A.dumpScreen('P17_1_관리자_자동화');
    html('P17_1_관리자_자동화', '.v-content__wrap');
    values('P17_1_관리자_자동화_값');
    // 발송 시각 선택지 (열어 보기만)
    cy.get('body').then(($b) => {
      const $s = $b.find('.v-select').filter((i, e) => shown(e) && /시/.test(t(e)));
      if ($s.length) cy.wrap($s.first()).find('.v-input__slot').first().click({ force: true });
    });
    cy.wait(1200);
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P17_2_발송시각_선택지.json',
      $b.find('.v-menu__content, .menuable__content__active').filter((i, e) => shown(e)).toArray().map(t)));
    cy.get('body').type('{esc}', { force: true });
  });

  it('user014 — 자동화 탭 주소로 직접 접근 (권한 없음 화면)', { retries: 0 }, () => {
    cy.readFile('cypress/probe/P17_1_주소.json').then(({ url }) => {
      A.login('user014', Cypress.env('LC_USER014_PW'));
      cy.visit(url.replace(/^https?:\/\/[^/]+/, ''));
      cy.wait(5000);
      A.dumpScreen('P17_3_user014_자동화');
      html('P17_3_user014_자동화', '.v-content__wrap');
      values('P17_3_user014_자동화_값');
      cy.get('body').then(($b) => {
        const $save = $b.find('button, .v-btn').filter((i, e) => shown(e) && /저장$/.test(t(e)));
        const canSee = /자동 발송 설정|자동 소명 요청/.test(t($b[0]));
        cy.writeFile('cypress/probe/P17_3_user014_상태.json', { canSee, saveButtons: $save.length });
        if (canSee && $save.length) {
          cy.wrap($save.first()).click({ force: true });
          cy.wait(1500);
          A.dumpScreen('P17_4_user014_저장클릭');
          cy.get('body').type('{esc}', { force: true });
        }
      });
    });
  });
});
