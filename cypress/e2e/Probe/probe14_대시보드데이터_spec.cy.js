// [임시 탐색용 14] 대시보드 경보 위젯 — 데이터가 있을 때 차트 API 응답 구조 · 결과 탭 건수 (2026-11-12)
//   대시보드 전용으로 쓸 정책 「auto_소명_접속량 과다」(#36, 현재 미사용)를 잠시 사용 ON → 끝나면 OFF (사용여부는 버전 영향 없음)
//   결과 : cypress/probe/P14_*.json
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_접속량 과다';
const t = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
const setActive = (on) => {
  A.goAnomaly('사용자 이상행위 정책');
  A.searchPolicy(POLICY);
  A.policyActive(POLICY).invoke('attr', 'aria-checked').then((c) => {
    if ((c === 'true') === on) return;
    A.policyActive(POLICY).parents('.v-input--selection-controls').first().find('.v-input--selection-controls__input').click({ force: true });
    A.confirmIfAny();
  });
  A.policyActive(POLICY).should('have.attr', 'aria-checked', on ? 'true' : 'false');
};
const pickPeriod = (label) => {
  cy.get('.pcpf__btn').filter(':visible').first().click({ force: true });
  cy.wait(1000);
  cy.get('.v-menu__content:visible, .menuable__content__active:visible').contains(label).click({ force: true });
  cy.wait(4000);
};
const cards = (name) => cy.get('body').then(($b) => cy.writeFile(`cypress/probe/${name}.json`,
  $b.find('.anomaly-widget-card:visible').toArray().map((c) => ({
    title: t(c.querySelector('.anomaly-widget-card__title') || c).slice(0, 80),
    body: t(c.querySelector('.anomaly-widget-card__body') || c).slice(0, 800)
  }))));

describe('PROBE14', () => {
  A.ignoreErrors();
  after(() => { A.loginAdmin(); setActive(false); });

  it('관리자 — 경보 위젯 데이터 · 결과 탭 건수', { retries: 0 }, () => {
    const api = [];
    cy.intercept({ url: /\/logcatch\/api\/v1\/anomaly\/(chart-data|detection\/alerts|detection\/incidents|results?|alerts)/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 20000); } catch (e) { body = String(res.body).slice(0, 500); }
        api.push({ at: new Date().toISOString(), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, body });
      });
    });
    A.loginAdmin();
    setActive(true);

    // ---- 대시보드 : 최근 30일 · 숨김 보기
    A.goAnomaly('사용자 이상행위 대시보드');
    cy.wait(4000);
    pickPeriod('최근 30일');
    cy.get('button:visible, .v-btn:visible').filter((i, e) => /숨김\s*\d+\s*개\s*보기/.test(t(e))).first().click({ force: true });
    cy.wait(5000);
    A.dumpScreen('P14_1_대시보드_30일');
    cards('P14_1_위젯_30일');
    // 정책별 경보 카드 HTML (막대 이름·값이 DOM 에 있는지)
    cy.get('body').then(($b) => {
      const c = $b.find('.anomaly-widget-card:visible').filter((i, e) => /정책별 경보/.test(t(e))).first()[0];
      cy.writeFile('cypress/probe/P14_1_정책별경보.html', c ? c.outerHTML.slice(0, 60000) : '(없음)');
    });
    // 숨김 원래대로
    cy.get('button:visible, .v-btn:visible').filter((i, e) => /숨김\s*\d+\s*표시중/.test(t(e))).first().click({ force: true });
    cy.wait(1500);
    // 기간이 저장되는지 : 다시 들어와서 기간 글자 확인
    A.goAnomaly('사용자 이상행위 대시보드');
    cy.wait(4000);
    cy.get('.pcpf__btn').filter(':visible').first().then(($p) => cy.writeFile('cypress/probe/P14_2_재진입_기간.json', { period: t($p[0]) }));
    pickPeriod('오늘');

    // ---- 결과 탭 : 최근 30일 · 이 정책
    A.goAnomaly('사용자 이상행위 결과');
    cy.contains('button', /^\s*최근 30일\s*$/).click({ force: true });
    cy.wait(3000);
    A.dumpScreen('P14_3_결과_30일_전체');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P14_3_결과_30일_묶음.json', $b.find('.incident-header:visible').toArray().map(t)));
    cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type(POLICY, { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('P14_3_결과_30일_정책');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P14_3_결과_30일_정책묶음.json', $b.find('.incident-header:visible').toArray().map(t)));
    cy.then(() => cy.writeFile('cypress/probe/P14_api.json', api));
  });
});
