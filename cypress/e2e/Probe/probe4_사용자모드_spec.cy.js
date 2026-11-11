// [임시 탐색용] 「접속량 과다」 사용자 모드 편집창의 토글·임계값·사용자 선택 칸 HTML 구조 수집 (저장하지 않음)
const A = require('../../support/anomaly');
describe('PROBE4 사용자 모드 HTML', () => {
  A.ignoreErrors();
  it('사용자 모드 HTML 수집', { retries: 0 }, () => {
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy('접속량 과다');
    A.policyName('접속량 과다').click({ force: true });
    cy.wait(2000);
    A.activeDialog().then(($d) => {
      const d = $d[0];
      const up = (el, n) => { let e = el; for (let i = 0; i < n && e.parentElement; i++) e = e.parentElement; return e; };
      const clip = (h) => h.replace(/\s+/g, ' ').slice(0, 1500);
      const out = {
        checkboxes: [...d.querySelectorAll('input[type="checkbox"]')].map((e) => ({ aria: e.getAttribute('aria-label'), checked: e.getAttribute('aria-checked'), html3: clip(up(e, 3).outerHTML) })),
        numbers: [...d.querySelectorAll('input[type="number"]')].map((e) => ({ val: e.value, html4: clip(up(e, 4).outerHTML) })),
        texts: [...d.querySelectorAll('input[type="text"]')].map((e) => ({ ph: e.getAttribute('placeholder'), aria: e.getAttribute('aria-label'), html5: clip(up(e, 5).outerHTML) })),
        severity: clip((d.querySelector('[class*="severity"]') || d).outerHTML).slice(0, 800)
      };
      cy.writeFile('cypress/probe/P8_사용자모드_HTML.json', out);
    });
    A.activeDialog().contains('button', '취소').click({ force: true });
  });
});
