// [임시 탐색용 2] 결과 탭 펼침 구조 · 가져오기 메뉴 · 결재 대기(신청) 문서의 신청자 화면(회수 버튼 여부)
//   3번은 실제로 신청 → 반려까지 하고 끝냄 : auto_소명_반려 의 가장 오래된 경보를 쓰고, 반려로 다시 되돌려 놓음 (경보 소모 없음)
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_반려';
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter(':visible').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.slice(0, 80000) : '(없음)');
});
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const resultUrl = (kw, mode) => {
  const to = new Date(); const from = new Date(); from.setFullYear(to.getFullYear() - 1);
  return `/logcatch/analyze/customAnomalyBehaviorPolicyResult?keyword=${encodeURIComponent(kw)}&dateFrom=${ymd(from)}&dateTo=${ymd(to)}&includeInactivePolicy=true&dataMode=${mode}`;
};

describe('PROBE9', () => {
  A.ignoreErrors();

  it('관리자 — 결과 탭(사용 OFF 정책 포함) 펼침 · 가져오기 메뉴', { retries: 0 }, () => {
    A.loginAdmin();
    cy.visit(resultUrl('auto_소명', 'policy')); cy.wait(4000);
    A.dumpScreen('Q6_5_결과_정책별');
    cy.get('body').then(($b) => {
      const $h = $b.find('.incident-header:visible');
      if (!$h.length) return;
      cy.wrap($h.first()).click({ force: true }); cy.wait(2500);
      A.dumpScreen('Q6_6_결과_정책별_펼침');
      html('Q6_6_결과_정책별_펼침', 'main .v-content__wrap, main');
    });
    cy.visit(resultUrl(POLICY, 'user')); cy.wait(4000);
    A.dumpScreen('Q6_7_결과_사용자별');
    cy.get('body').then(($b) => {
      const $h = $b.find('.incident-header:visible');
      if (!$h.length) return;
      cy.wrap($h.first()).click({ force: true }); cy.wait(2500);
      A.dumpScreen('Q6_8_결과_사용자별_펼침');
      html('Q6_8_결과_사용자별_펼침', 'main .v-content__wrap, main');
    });
    // 가져오기 메뉴 (실제 마우스 클릭)
    A.goAnomaly('사용자 이상행위 정책');
    cy.contains('.toolbar-action-btn, button', '가져오기').realClick();
    cy.wait(1500);
    A.dumpScreen('Q4_4_가져오기_메뉴');
    html('Q4_4_가져오기_메뉴', '.v-menu__content--active, .menuable__content__active, .v-dialog--active');
    cy.get('body').type('{esc}', { force: true });
  });

  it('신청자 — 결재 대기 문서 화면(회수 버튼?) → 결재자 반려로 원상 복구', { retries: 0 }, () => {
    A.login('user014', Cypress.env('LC_USER014_PW'));
    cy.visit('/logcatch/approval/submit/anomaly-alerts'); cy.wait(3500);
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true }); cy.wait(3000);
    cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(POLICY)).last().as('row');
    cy.get('@row').find('td').eq(4).invoke('text').then((t) => cy.wrap(t.trim()).as('start'));
    cy.get('@row').find('button.alert-inline-explain').click({ force: true }); cy.wait(2000);
    A.activeDialog().find('textarea[placeholder*="소명 사유"]').type('[자동화][탐색] 회수 버튼 확인용 — 결재자가 바로 반려함', { force: true });
    A.activeDialog().find('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').first().click({ force: true });
    cy.wait(1500); A.confirmIfAny(); cy.wait(2500);
    cy.visit('/logcatch/approval/document/my-submissions'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500);
    cy.get('@start').then((start) => {
      cy.get('tr.ag-row').filter(':visible').filter((i, e) => e.innerText.includes(POLICY) && e.innerText.includes(`발생 ${start}`)).first().as('doc');
    });
    cy.get('@doc').then(($r) => cy.writeFile('cypress/probe/Q7_6_대기문서_목록줄.html', $r[0].outerHTML));
    cy.get('@doc').find('td.ag-title').click({ force: true }); cy.wait(2500);
    A.dumpScreen('Q7_7_대기문서_신청자상세');
    html('Q7_7_대기문서_신청자상세', '.v-dialog--active');
    cy.get('body').type('{esc}', { force: true }); cy.wait(1000);

    // 원상 복구 : 결재자 반려
    A.login('user001', Cypress.env('LC_HEAD001_PW'));
    cy.visit('/logcatch/approval/document/my-pending-approvals'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500);
    cy.get('@start').then((start) => {
      cy.get('tr.ag-row').filter(':visible').filter((i, e) => e.innerText.includes(POLICY) && e.innerText.includes(`발생 ${start}`)).first().find('td.ag-title').click({ force: true });
    });
    cy.wait(2500);
    A.activeDialog().contains('button', /^\s*반려\s*$/).click({ force: true }); cy.wait(1500);
    A.activeDialog().find('input[placeholder*="반려 사유"]').type('[자동화][탐색] 회수 버튼 확인 후 원상 복구', { force: true });
    A.activeDialog().contains('button', /^\s*확인\s*$/).click({ force: true }); cy.wait(3000);
    A.dumpScreen('Q7_8_복구_반려후');
  });
});
