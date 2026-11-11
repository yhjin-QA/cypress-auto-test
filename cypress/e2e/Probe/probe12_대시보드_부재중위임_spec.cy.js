// [임시 탐색용 5] 대시보드 화면 구조 · 부재중 위임 창 — 조회만 함 (위임 저장 안 함)
const A = require('../../support/anomaly');
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter(':visible').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.slice(0, 120000) : '(없음)');
});
describe('PROBE12', () => {
  A.ignoreErrors();
  it('관리자 — 이상행위 대시보드', { retries: 0 }, () => {
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 대시보드');
    cy.wait(4000);
    A.dumpScreen('Q8_2_대시보드');
    html('Q8_2_대시보드', 'main .v-content__wrap, main');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/Q8_2_대시보드_버튼.json',
      $b.find('button:visible').toArray().map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean)));
  });
  it('결재자 user001 — 부재중 위임 창 (저장 안 함)', { retries: 0 }, () => {
    A.login('user001', Cypress.env('LC_HEAD001_PW'));
    cy.visit('/logcatch/approval/document/my-pending-approvals'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '부재중 위임').click({ force: true });
    cy.wait(2500);
    A.dumpScreen('Q9_1_부재중위임');
    html('Q9_1_부재중위임', '.v-dialog--active');
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-dialog--active:visible button:visible').filter((i, e) => /^(취소|닫기)$/.test(e.innerText.trim()));
      if ($c.length) cy.wrap($c.last()).click({ force: true });
      else cy.get('body').type('{esc}', { force: true });
    });
    cy.wait(1000);
    A.dumpScreen('Q9_2_닫은후');
  });
});
