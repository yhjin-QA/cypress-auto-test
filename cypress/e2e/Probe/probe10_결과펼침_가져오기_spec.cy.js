// [임시 탐색용 3] 결과 탭 펼침(사용 OFF 정책 포함 버튼) · 가져오기 메뉴 — 조회만 함
const A = require('../../support/anomaly');
const dumpAll = (name, sel) => cy.get('body').then(($b) => {
  const els = $b.find(sel).toArray();
  cy.writeFile(`cypress/probe/${name}.json`, els.map((e) => ({ cls: e.className, vis: !!(e.offsetWidth || e.offsetHeight), text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 300) })));
});
describe('PROBE10', () => {
  A.ignoreErrors();
  it('결과 펼침 · 가져오기 메뉴', { retries: 0 }, () => {
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    cy.contains('.toolbar-action-btn, button', '가져오기').click({ force: true });
    cy.wait(2500);
    dumpAll('Q4_5_가져오기_메뉴후보', '.v-menu__content, [role="menu"], .v-list, .menuable__content__active, input[type="file"]');
    cy.screenshot('Q4_5_가져오기_클릭후', { capture: 'viewport', overwrite: true });
    cy.get('body').type('{esc}', { force: true });

    A.goAnomaly('사용자 이상행위 결과');
    cy.wait(2000);
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
    cy.get('button').filter(':visible').filter((i, e) => /visibility\s*포함|visibility포함/.test(e.innerText.replace(/\s+/g, ''))).first().click({ force: true });
    cy.wait(1500);
    cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type('auto_소명_반려', { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3500);
    A.dumpScreen('Q6_9_결과_중지포함');
    cy.get('body').then(($b) => {
      const $h = $b.find('.incident-header:visible');
      if (!$h.length) return;
      cy.wrap($h.first()).click({ force: true }); cy.wait(3000);
      A.dumpScreen('Q6_10_결과_펼침');
      cy.get('.incident-header').filter(':visible').first().parent().then(($p) => cy.writeFile('cypress/probe/Q6_10_결과_펼침.html', $p[0].outerHTML.slice(0, 80000)));
    });
  });
});
