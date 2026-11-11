// [임시 탐색용] 전문가 모드 「복사」 버튼 동작 확인 (저장하지 않고 취소)
const A = require('../../support/anomaly');
describe('PROBE7 정책 복사', () => {
  A.ignoreErrors();
  it('전문가 모드 복사 화면 수집', { retries: 0 }, () => {
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy('접속량 과다');
    A.policyName('접속량 과다').click({ force: true });
    cy.wait(1500);
    A.activeDialog().contains('button', '전문가 모드로 열기').click({ force: true });
    cy.wait(2000);
    A.activeDialog().find('button').filter((i, e) => /복사/.test(e.innerText)).first().then(($b) => {
      cy.writeFile('cypress/probe/P11_복사버튼.html', $b[0].outerHTML);
      cy.wrap($b).realClick();
    });
    cy.wait(2500);
    A.dumpScreen('P11_복사클릭후');
    cy.get('.v-dialog--active').filter(':visible').last().then(($d) => {
      const d = $d[0];
      cy.writeFile('cypress/probe/P11_복사후_입력.json', {
        title: (d.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
        inputs: [...d.querySelectorAll('input,textarea')].map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), role: e.getAttribute('data-role'), val: (e.value || '').slice(0, 60), checked: e.getAttribute('aria-checked'), max: e.getAttribute('max') })),
        selects: [...d.querySelectorAll('.v-select__selection')].map((e) => e.innerText.trim()),
        footer: [...d.querySelectorAll('.dialog-footer button, .v-card__actions button')].map((e) => ({ t: e.innerText.trim(), disabled: e.disabled }))
      });
    });
    // 닫기 (저장 안 함)
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-dialog--active:visible button:visible').filter((i, e) => e.innerText.trim() === '취소');
      $c.each((i, e) => e.click());
    });
    cy.wait(1000);
    A.confirmIfAny();
    A.dumpScreen('P11_닫은후');
  });
});
