// [임시 탐색용] 「접속량 과다」 사용자 모드에서 소명 스위치가 안 켜지는 원인 확인 (저장하지 않음)
const A = require('../../support/anomaly');
describe('PROBE5 소명 스위치', () => {
  A.ignoreErrors();
  it('소명 스위치 상태·서버 응답 수집', { retries: 0 }, () => {
    cy.intercept('POST', '**/anomaly/policies/explanation-shape').as('shape');
    cy.intercept('GET', '**/anomaly/policies/**').as('policyGet');
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy('접속량 과다');
    A.policyName('접속량 과다').click({ force: true });
    cy.wait(3000);
    const snap = (name) => A.activeDialog().then(($d) => {
      const sw = [...$d[0].querySelectorAll('input[type="checkbox"]')].filter((e) => !e.getAttribute('aria-label')).map((e) => {
        let v = e; while (v && !(v.classList && v.classList.contains('v-input'))) v = v.parentElement;
        return { checked: e.getAttribute('aria-checked'), disabled: e.disabled, vinput: v ? v.className : null, title: v ? (v.getAttribute('title') || (v.parentElement && v.parentElement.getAttribute('title'))) : null, around: v && v.parentElement ? v.parentElement.innerText.replace(/\s+/g, ' ').slice(0, 200) : null };
      });
      cy.writeFile(`cypress/probe/P9_${name}.json`, sw);
    });
    snap('열림');
    cy.get('@shape.all').then((calls) => cy.writeFile('cypress/probe/P9_shape_열림.json', calls.map((c) => ({ req: c.request.body, res: c.response && c.response.body }))));
    // 1) 기존 방식 클릭
    A.activeDialog().find('input[type="checkbox"]').filter((i, e) => !e.getAttribute('aria-label')).eq(1).parent().click({ force: true });
    cy.wait(3000);
    snap('force클릭후');
    // 2) 실제 마우스 클릭
    A.activeDialog().find('input[type="checkbox"]').filter((i, e) => !e.getAttribute('aria-label')).eq(1).parents('.v-input').first().find('.v-input--switch__thumb, .v-input--selection-controls__ripple').first().realClick();
    cy.wait(3000);
    snap('realClick후');
    cy.get('@shape.all').then((calls) => cy.writeFile('cypress/probe/P9_shape_전체.json', calls.map((c) => ({ req: c.request.body, res: c.response && c.response.body }))));
    A.dumpScreen('P9_마지막');
    A.activeDialog().contains('button', '취소').click({ force: true });
    A.confirmIfAny();
  });
});
