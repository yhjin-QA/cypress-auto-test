// [임시 탐색용] 「접속량 과다」 경보가 버전별로 어떻게 남는지, 실행 이력이 어떻게 보이는지 확인 (조회만)
const A = require('../../support/anomaly');
describe('PROBE6 경보·실행 이력', () => {
  A.ignoreErrors();
  it('경보·실행 이력 수집', { retries: 0 }, () => {
    cy.intercept('GET', '**/anomaly/**').as('anomalyGet');
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 결과');
    cy.get('button.sev-filter-btn').filter(':visible').contains('1년').click({ force: true });
    cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type('접속량 과다', { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('P10_결과_기본');
    cy.contains('.filter-label', '중지된 정책').parent().find('button').first().click({ force: true });
    cy.wait(2500);
    A.dumpScreen('P10_결과_중지포함');
    cy.contains('.filter-label', '지난 버전').parent().find('button').first().click({ force: true });
    cy.wait(2500);
    A.dumpScreen('P10_결과_중지+지난버전포함');
    cy.get('body').then(($b) => {
      const $h = $b.find('.incident-header:visible');
      if ($h.length) { cy.wrap($h.first()).click({ force: true }); cy.wait(2500); A.dumpScreen('P10_결과_펼침'); }
    });
    // 정책 전문가 모드 — 탐지시작일, 이력 버튼
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
    cy.wait(2500);
    A.searchPolicy('접속량 과다');
    A.policyName('접속량 과다').click({ force: true });
    cy.wait(1500);
    A.activeDialog().contains('button', '전문가 모드로 열기').click({ force: true });
    cy.wait(2000);
    A.dumpScreen('P10_전문가모드');
    cy.get('body').then(($b) => {
      const $x = $b.find('.v-dialog--active button:visible').filter((i, e) => /^이력/.test(e.innerText.trim()));
      if ($x.length) { cy.wrap($x.first()).click({ force: true }); cy.wait(2500); A.dumpScreen('P10_이력'); }
    });
    cy.get('@anomalyGet.all').then((calls) => cy.writeFile('cypress/probe/P10_api.json',
      calls.map((c) => ({ url: c.request.url, res: JSON.stringify(c.response && c.response.body).slice(0, 1500) })).slice(-25)));
  });
});
