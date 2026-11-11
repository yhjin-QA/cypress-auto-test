// [임시 탐색용 4] 정책 카드 메뉴 「복제」 동작 · 결과 탭 필터 버튼
//   복제가 바로 정책을 만들면 만든 정책을 즉시 삭제해서 원상 복구 (경보·결재 문서가 없는 새 정책만 삭제)
const A = require('../../support/anomaly');
const SRC = 'auto_소명_접속량 과다';
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter(':visible').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.slice(0, 60000) : '(없음)');
});
const visMenus = (name) => cy.get('body').then(($b) => cy.writeFile(`cypress/probe/${name}.json`,
  $b.find('.v-menu__content').toArray().filter((e) => e.offsetWidth || e.offsetHeight).map((e) => e.innerText.replace(/\s+/g, ' '))));

describe('PROBE11', () => {
  A.ignoreErrors();
  it('카드 메뉴 · 복제 · 결과 필터', { retries: 0 }, () => {
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy(SRC);
    cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('정책 목록').invoke('text').then((t) => cy.wrap(t).as('before'));
    // 카드의 메뉴 열기 : 오른쪽 클릭 → 안 열리면 카드 안 아이콘 버튼들
    A.policyName(SRC).closest('.policy-card').as('card');
    cy.get('@card').then(($c) => cy.writeFile('cypress/probe/Q4_6_카드.html', $c[0].outerHTML.slice(0, 20000)));
    cy.get('@card').rightclick({ force: true });
    cy.wait(1200);
    visMenus('Q4_6_우클릭_메뉴');
    cy.screenshot('Q4_6_우클릭', { capture: 'viewport', overwrite: true });
    cy.get('body').then(($b) => {
      const $item = $b.find('.v-menu__content:visible .v-list__tile, .v-menu__content:visible [role="menuitem"]').filter((i, e) => /복제/.test(e.innerText));
      if (!$item.length) { cy.log('우클릭 메뉴에 복제 없음'); return; }
      cy.wrap($item.first()).click({ force: true });
      cy.wait(2500);
      A.dumpScreen('Q4_7_복제클릭후');
      html('Q4_7_복제클릭후', '.v-dialog--active, [role="dialog"]');
      // 창이 열렸으면 저장하지 않고 취소
      cy.get('body').then(($bb) => {
        const $c = $bb.find('button:visible').filter((i, e) => e.innerText.trim() === '취소');
        if ($c.length) { cy.wrap($c.last()).click({ force: true }); cy.wait(1000); A.confirmIfAny(); }
      });
      A.dumpScreen('Q4_8_복제_닫은후');
    });
    // 복제로 정책이 바로 생겼으면 삭제해서 원상 복구 (이름에 SRC 가 들어가고 SRC 와 다른 정책)
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy(SRC);
    cy.get('body').then(($b) => {
      const names = $b.find('.policy-card-name:visible').toArray().map((e) => e.innerText.trim());
      cy.writeFile('cypress/probe/Q4_9_복제후_이름.json', names);
      const extra = names.filter((n) => n !== SRC && n.includes(SRC));
      extra.forEach((n) => {
        cy.log(`🧹 복제로 생긴 정책 삭제 : ${n}`);
        A.policySelect(n).check({ force: true });
        cy.contains('.toolbar-action-btn', '삭제').click({ force: true });
        cy.wait(1200);
        A.dumpScreen('Q4_10_복제본_삭제확인');
        A.activeDialog().should('contain', '정책 삭제').contains('button', '확인').click({ force: true });
        cy.wait(2000);
      });
    });

    // 결과 탭 필터 버튼 이름
    A.goAnomaly('사용자 이상행위 결과');
    cy.wait(2000);
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/Q6_11_결과_버튼.json',
      $b.find('button:visible').toArray().map((e) => ({ t: e.innerText.replace(/\s+/g, ' ').trim(), cls: e.className.slice(0, 80) }))));
    A.dumpScreen('Q6_11_결과_기본');
  });
});
