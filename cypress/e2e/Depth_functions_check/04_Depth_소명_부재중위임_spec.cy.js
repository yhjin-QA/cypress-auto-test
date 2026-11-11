// ==========================================================================
// [2.9.7 신규] 04_Depth_소명_부재중위임
//   결재자(부서장)가 부재중 위임을 걸면, 위임 기간 동안 내 결재가 수임자의 「담당 결재」에도 나타나 수임자가 처리할 수 있는지 확인
//     (user001) 담당 결재 > 부재중 위임 : 수임자 user105 · 오늘 하루 → 위임 추가
//     → (user014) auto_소명_반려 경보로 소명 신청
//     → (user105) 담당 결재에 그 문서가 보임 → 반려
//     → (user014) 문서 상태 「반려」 · 경보는 소명 대상 목록으로 돌아옴
//     → (user001) 위임 삭제
//   반복 실행 설계
//     - 반려로 끝나므로 경보를 소모하지 않음 (가장 오래된 경보 사용 — 신청 취소 스크립트와 같은 경보지만 둘 다 원복)
//     - 위임은 오늘 하루로만 걸고, 시작할 때와 after() 에서 user001 의 위임을 모두 지움
//       (위임이 남으면 다른 스크립트의 담당 결재 확인에 영향 → 반드시 정리)
//     - 시작할 때 이 정책의 결재 대기 문서가 남아 있으면 신청 취소로 정리
//   계정 : 결재자 user001(사원_1, AI개발2팀 부서장) · 수임자 user105(사원_105, 위임 전용) · 신청자 user014
//   비밀번호 : cypress.env.json (LC_HEAD001_PW, LC_USER105_PW, LC_USER014_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_반려';
const USER_ID = 'user014';
const HEAD_ID = 'user001';
const DELEGATE_ID = 'user105';
const DELEGATE_NAME = '사원_105';
const URLS = {
  submit: '/logcatch/approval/submit/anomaly-alerts',
  mySubmissions: '/logcatch/approval/document/my-submissions',
  pending: '/logcatch/approval/document/my-pending-approvals'
};
const p2 = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };
const stamp = () => { const d = new Date(); return `${today()} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; };
const go = (key) => { cy.visit(URLS[key]); cy.wait(3500); };
const search = () => { cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500); };
const yearAlerts = () => { go('submit'); cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true }); cy.wait(3000); };
const alertCount = () => cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('경보').invoke('text')
  .then((t) => parseInt((t.match(/(\d+)\s*건/) || [])[1] || '0', 10));
const docRowsOf = ($b, start, status) => $b.find('tr.ag-row:visible').filter((i, e) =>
  e.innerText.includes(POLICY) && (!start || e.innerText.includes(`발생 ${start}`))
  && (!status || Cypress.$(e).find('.ag-status').text().trim() === status));
const deleg = () => cy.get('.appr-deleg-dialog').filter(':visible').last();

// 부재중 위임 창 열기 (결재자로 로그인한 상태)
const openDeleg = () => {
  go('pending');
  cy.contains('.v-btn__content, button', '부재중 위임').click({ force: true });
  cy.wait(2000);
  deleg().should('contain', '부재중 위임 설정');
};
const closeDeleg = () => {
  cy.get('body').type('{esc}', { force: true });
  cy.wait(800);
};
// 등록된 위임 모두 삭제 (목록 줄의 삭제 아이콘/버튼 → 확인)
const clearDelegations = (name) => {
  const once = (left) => deleg().then(($d) => {
    if ($d.find('.deleg-empty:visible').length || left <= 0) return;
    cy.writeFile(`cypress/probe/${name}_위임목록.html`, $d[0].outerHTML.slice(0, 40000));
    // 2.9.7 : 등록된 위임 줄(.deleg-item) 마다 「해제」 버튼(.deleg-del-btn)
    const $del = $d.find('.deleg-item .deleg-del-btn:visible');
    cy.log(`🧹 등록된 위임 정리 (삭제 버튼 ${$del.length}개)`);
    if (!$del.length) return;
    cy.wrap($del.first()).click({ force: true });
    cy.wait(1200);
    A.confirmIfAny();
    cy.wait(1500);
    once(left - 1);
  });
  once(5);
  deleg().find('.deleg-empty').should('be.visible');
};
// 결재 대기 문서 신청 취소 (신청자로 로그인한 상태)
const cancelPendingDocs = () => {
  go('mySubmissions'); search();
  cy.get('body').then(($b) => {
    const n = docRowsOf($b, null, '신청').length;
    for (let k = 0; k < n; k += 1) {
      go('mySubmissions'); search();
      cy.get('body').then(($bb) => cy.wrap(docRowsOf($bb, null, '신청').first()).find('td.ag-title').click({ force: true }));
      cy.wait(2500);
      A.activeDialog().contains('button', /^\s*신청 취소\s*$/).click({ force: true });
      cy.wait(1200); A.confirmIfAny(); cy.wait(2000);
      cy.get('body').type('{esc}', { force: true });
    }
  });
};

describe('04_Depth_소명_부재중위임', () => {
  A.ignoreErrors();

  after(() => {
    cy.log('🧹 user001 부재중 위임 정리');
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    openDeleg();
    clearDelegations('D04D_after');
  });

  it('부재중 위임 → 수임자가 담당 결재에서 처리 → 위임 삭제', { retries: 0 }, function () {
    const test = this;

    // ---------- 0. 정리 : 남은 위임 · 결재 대기 문서 ----------
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    openDeleg();
    clearDelegations('D04D_0');
    closeDeleg();
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    cancelPendingDocs();

    // ---------- 1. 위임 추가 (user001 → user105, 오늘 하루) ----------
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    openDeleg();
    // 자동완성 목록이 열려 있는 동안에는 위임 창이 「보이지 않음」으로 잡혀 창 기준으로 다시 찾을 수 없고,
    //   별칭(as)도 다시 찾기를 하므로 실패함 → 목록을 열기 전에 입력칸·버튼 요소를 직접 잡아 두고 그 요소에 입력
    deleg().then(($d) => {
      const q = (a) => $d.find(`input[aria-label="${a}"]`)[0];
      const who = q('수임자'); const from = q('시작일'); const to = q('종료일'); const why = q('사유 (선택)');
      const add = $d.find('.deleg-add-btn')[0];
      cy.wrap(who).realClick({ scrollBehavior: false });
      cy.wait(800);
      cy.wrap(who).type(DELEGATE_ID, { force: true });
      cy.wait(2000);
      A.dumpScreen('D04D_1_수임자검색');
      // 목록 항목을 마우스로 누르면 위임 창 바깥 클릭으로 처리되어 창이 닫힘(2026-11-11 확인)
      //   → 검색 결과가 「사원_105 (user105)」 하나로 좁혀진 것을 확인하고 키보드(↓ + Enter)로 선택
      cy.get('.v-menu__content').filter(':visible').find('.v-list__tile, [role="option"]')
        .filter((k, e) => e.innerText.trim().length > 0).should('have.length', 1).first()
        .should('contain', DELEGATE_ID);
      cy.wrap(who).type('{downarrow}{enter}', { force: true });
      cy.wait(1000);
      cy.wrap(who).should((w) => {
        const sel = Cypress.$(w).closest('.v-select').find('.v-select__selections').text();
        expect(sel, '선택된 수임자').to.include(DELEGATE_NAME);
      });
      cy.get('.appr-deleg-dialog').filter(':visible').should('have.length', 1);   // 위임 창이 그대로 열려 있음
      cy.wrap(from).type(today(), { force: true });
      cy.wrap(to).type(today(), { force: true });
      cy.wrap(why).type(`[자동화] 부재중 위임 시나리오 ${stamp()}`, { force: true });
      A.dumpScreen('D04D_1_위임입력');
      cy.wrap(add).click({ force: true });
    });
    cy.wait(2000);
    A.confirmIfAny();
    deleg().find('.deleg-empty').should('not.exist');
    deleg().find('.deleg-item').should('have.length', 1).first().within(() => {
      cy.get('.deleg-badge').should('have.text', '위임중');
      cy.get('.deleg-name').should('have.text', DELEGATE_NAME);
      cy.get('.deleg-period').should('have.text', `${today()} 00:00 ~ ${today()} 23:59`);   // 오늘 하루
      cy.get('.deleg-del-btn').should('have.text', '해제');
    });
    A.dumpScreen('D04D_1_위임등록후');
    deleg().then(($d) => cy.writeFile('cypress/probe/D04D_1_위임등록후.html', $d[0].outerHTML.slice(0, 40000)));
    closeDeleg();

    // ---------- 2. 소명 신청 (user014, 가장 오래된 경보) ----------
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    yearAlerts();
    cy.get('body').then(($b) => {
      if (!$b.find('table tbody tr:visible').filter((i, e) => e.innerText.includes(POLICY)).length) {
        cy.log(`⏭️ ${POLICY} 경보 없음 — 건너뜀`); cy.then(() => test.skip());
      }
    });
    alertCount().as('alertsBefore');
    cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(POLICY)).last().as('alertRow');
    cy.get('@alertRow').find('td').eq(4).invoke('text').then((t) => cy.wrap(t.trim()).as('alertStart'));
    cy.get('@alertRow').find('button.alert-inline-explain').click({ force: true });
    cy.wait(2000);
    A.activeDialog().find('textarea[placeholder*="소명 사유"]').type(`[자동화] 부재중 위임 시나리오 — ${stamp()} (${USER_ID})`, { force: true });
    A.activeDialog().find('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').first().click({ force: true });
    cy.wait(1500); A.confirmIfAny(); cy.wait(2500);

    // ---------- 3. 수임자(user105) 담당 결재 → 반려 ----------
    A.login(DELEGATE_ID, Cypress.env('LC_USER105_PW'));
    go('pending'); search();
    A.dumpScreen('D04D_3_수임자_담당결재');
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => {
        const $r = docRowsOf($b, start, '신청');
        expect($r.length, '수임자 담당 결재에 보이는 위임자의 결재 문서').to.eq(1);
        expect($r.first().text().replace(/\s+/g, ' '), '위임 받은 결재 표시').to.match(/사원_1\s*위임/);
        cy.wrap($r.first()).find('td.ag-title').click({ force: true });
      });
    });
    cy.wait(2500);
    A.activeDialog().should('contain', '결재 상세').and('contain', `(${USER_ID})`);
    A.dumpScreen('D04D_3_수임자_결재상세');
    A.activeDialog().contains('button', /^\s*반려\s*$/).click({ force: true });
    cy.wait(1500);
    A.activeDialog().should('contain', '소명 반려').find('input[placeholder*="반려 사유"]')
      .type(`[자동화] ${stamp()} 수임자(${DELEGATE_ID}) 반려 — 부재중 위임 확인`, { force: true });
    A.activeDialog().contains('button', /^\s*확인\s*$/).click({ force: true });
    cy.wait(3000);
    A.dumpScreen('D04D_3_수임자_반려후');

    // ---------- 4. 신청자 : 문서 「반려」 · 경보 원복 ----------
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    go('mySubmissions'); search();
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => {
        const sts = docRowsOf($b, start).toArray().map((e) => Cypress.$(e).find('.ag-status').text().trim());
        cy.log(`문서 상태 : ${sts.join(', ')}`);
        expect(sts[0], '가장 최근 문서 상태').to.eq('반려');
      });
    });
    cy.get('@alertsBefore').then((n) => { yearAlerts(); alertCount().should('eq', n); });

    // ---------- 5. 위임 삭제 (user001) ----------
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    openDeleg();
    clearDelegations('D04D_5');
    A.dumpScreen('D04D_5_위임삭제후');
  });
});
