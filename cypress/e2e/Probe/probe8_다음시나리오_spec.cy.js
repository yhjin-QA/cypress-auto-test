// [임시 탐색용] 4~8번 시나리오 설계를 위한 화면 수집 — 저장·삭제·신청·결재는 하지 않음 (창을 열어 보고 닫기만)
//   결과 : cypress/probe/Q*.json · Q*.html · 스크린샷
const A = require('../../support/anomaly');
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter(':visible').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.slice(0, 60000) : '(없음)');
});
const esc = () => { cy.get('body').type('{esc}', { force: true }); cy.wait(800); };
const closeDialogs = () => cy.get('body').then(($b) => {
  const $c = $b.find('.v-dialog--active:visible button:visible').filter((i, e) => /^(취소|닫기)$/.test(e.innerText.trim()));
  if ($c.length) cy.wrap($c.last()).click({ force: true });
  cy.wait(1000);
  const $x = Cypress.$('.v-dialog--active:visible i').filter((i, e) => e.textContent.trim() === 'close');
  if ($x.length) cy.wrap($x.last()).click({ force: true });
  cy.wait(800);
});

describe('PROBE8 다음 시나리오 화면 수집', () => {
  A.ignoreErrors();

  it('관리자 — 정책 가져오기/새 정책/삭제 창 · 결과 펼침 · 대시보드', { retries: 0 }, () => {
    A.loginAdmin();
    // [4] 가져오기 메뉴 (선택하지 않음)
    A.goAnomaly('사용자 이상행위 정책');
    cy.contains('.toolbar-action-btn, button', '가져오기').click({ force: true });
    cy.wait(1500);
    A.dumpScreen('Q4_1_가져오기_메뉴');
    html('Q4_1_가져오기_메뉴', '.v-menu__content--active, .v-dialog--active');
    esc(); closeDialogs();
    // [4] 새 정책 창 (저장하지 않음)
    cy.contains('button', '새 정책').click({ force: true });
    cy.wait(2000);
    A.dumpScreen('Q4_2_새정책');
    closeDialogs(); A.confirmIfAny();
    // [4] 삭제 확인창 문구 (취소) — 원본 「auto_소명_접속량 과다」 를 선택해 삭제 버튼만 눌러 봄
    A.searchPolicy('auto_소명_접속량 과다');
    A.policySelect('auto_소명_접속량 과다').check({ force: true });
    cy.contains('.toolbar-action-btn', '삭제').click({ force: true });
    cy.wait(1500);
    A.dumpScreen('Q4_3_삭제확인창');
    cy.get('body').then(($b) => {
      const $c = $b.find('.v-dialog--active:visible button:visible').filter((i, e) => e.innerText.trim() === '취소');
      if ($c.length) cy.wrap($c.last()).click({ force: true });
    });
    cy.wait(1000);
    A.policyName('auto_소명_접속량 과다').should('exist'); // 지워지지 않았는지

    // [5][6][8] 결과 탭 : 전용 정책 경보 펼침
    A.goAnomaly('사용자 이상행위 결과');
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
    cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type('auto_소명', { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('Q6_1_결과_목록');
    cy.get('.incident-header').filter(':visible').first().click({ force: true });
    cy.wait(2500);
    A.dumpScreen('Q6_2_결과_펼침');
    html('Q6_2_결과_펼침', '.incident-card, .v-expansion-panel__container--active, .incident-body, main');
    // 펼친 줄 안의 첫 항목 클릭 (상세 창이 있으면 수집)
    cy.get('body').then(($b) => {
      const $row = $b.find('.incident-body tr:visible, .incident-row:visible, .timeline-item:visible').first();
      if ($row.length) { cy.wrap($row).click({ force: true }); cy.wait(2000); A.dumpScreen('Q6_3_경보상세'); html('Q6_3_경보상세', '.v-dialog--active'); closeDialogs(); }
    });
    // 보기 방식(사용자별) 전환
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => e.textContent.trim() === 'person').first().click({ force: true });
    cy.wait(2500);
    A.dumpScreen('Q6_4_결과_사용자별');

    // [8] 대시보드
    A.goAnomaly('사용자 이상행위 대시보드');
    cy.wait(3000);
    A.dumpScreen('Q8_1_대시보드');
  });

  it('신청자 user014 — 신청 결재 문서 상세(반려·승인) · 경보 줄', { retries: 0 }, () => {
    A.login('user014', Cypress.env('LC_USER014_PW'));
    // [7] 신청 결재 : 반려 문서와 승인 문서의 상세 버튼 (재신청·회수 등)
    cy.visit('/logcatch/approval/document/my-submissions'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500);
    A.dumpScreen('Q7_1_신청결재_목록');
    ['반려', '승인', '신청'].forEach((st, i) => {
      cy.get('body').then(($b) => {
        const $r = $b.find('tr.ag-row:visible').filter((k, e) => Cypress.$(e).find('.ag-status').text().trim() === st).first();
        if (!$r.length) { cy.log(`(${st} 문서 없음)`); return; }
        cy.wrap($r).find('td.ag-title').click({ force: true });
        cy.wait(2500);
        A.dumpScreen(`Q7_${i + 2}_상세_${st}`);
        html(`Q7_${i + 2}_상세_${st}`, '.v-dialog--active');
        closeDialogs();
      });
    });
    // [7] 신청 > 이상행위 경보 : 반려로 되돌아온 경보 줄 표시 (재신청 표시 등)
    cy.visit('/logcatch/approval/submit/anomaly-alerts'); cy.wait(3500);
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true }); cy.wait(3000);
    A.dumpScreen('Q7_5_신청_경보목록');
    html('Q7_5_신청_경보목록', 'table');
  });
});
