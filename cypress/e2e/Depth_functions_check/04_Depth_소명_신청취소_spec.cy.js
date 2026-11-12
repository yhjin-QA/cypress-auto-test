// ==========================================================================
// [2.9.7 신규] 04_Depth_소명_신청취소
//   신청자가 결재 대기(신청) 중인 소명을 스스로 「신청 취소」 하는 흐름
//     (user014) 소명 > 신청 → 경보 「소명」 → 신청 → 신청 결재 > 문서 상세 「신청 취소」
//     → 문서가 결재 대기에서 빠지고, 경보는 다시 소명 대상 목록으로 돌아옴
//     → (user001) 담당 결재에 그 문서가 없음
//   반복 실행 설계
//     - 전용 정책 「auto_소명_반려」 의 경보 중 가장 오래된 것을 씀 (반려 스크립트는 가장 최근 것을 씀 → 겹치지 않음)
//     - 신청 취소로 경보가 되돌아오므로 경보를 소모하지 않음 → 하루에 몇 번 돌려도 됨
//     - 정책을 실행하거나 바꾸지 않음 (관리자 단계 없음)
//     - 이전 실행이 중간에 멈춰 이 정책의 결재 대기 문서가 남아 있으면, 먼저 그 문서부터 신청 취소해서 정리
//   비밀번호 : cypress.env.json (LC_USER014_PW, LC_HEAD001_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_반려';
const USER_ID = 'user014';
const HEAD_ID = 'user001';
const URLS = {
  submit: '/logcatch/approval/submit/anomaly-alerts',
  mySubmissions: '/logcatch/approval/document/my-submissions',
  pending: '/logcatch/approval/document/my-pending-approvals'
};
const stamp = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const go = (key) => { cy.visit(URLS[key]); cy.wait(3500); };
const search = () => { cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500); };
const yearAlerts = () => { go('submit'); cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true }); cy.wait(3000); };
const alertCount = () => cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('경보').invoke('text')
  .then((t) => parseInt((t.match(/(\d+)\s*건/) || [])[1] || '0', 10));
// 결재함 문서 줄의 신청일 (줄 맨 앞 「YYYY-MM-DD HH:mm」)
const submittedAt = (e) => (e.innerText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/) || [])[0];
// 소명 대상(신청) 목록에서 이 정책·이 탐지 시작의 경보 줄 (탐지 시작 칸으로 비교 — 다른 경보의 탐지 종료와 겹치지 않게)
const alertRowsOf = ($b, start) => $b.find('table tbody tr:visible').filter((i, e) =>
  e.innerText.includes(POLICY) && Cypress.$(e).find('td').eq(4).text().trim() === start);
// 결재함의 이 정책 문서 줄 (start 를 주면 그 경보의 문서만)
const docRowsOf = ($b, start, status) => $b.find('tr.ag-row:visible').filter((i, e) =>
  e.innerText.includes(POLICY) && (!start || e.innerText.includes(`발생 ${start}`))
  && (!status || Cypress.$(e).find('.ag-status').text().trim() === status));

// 결재 대기 문서 상세를 열어 「신청 취소」 (확인창·사유 입력이 있으면 처리)
const cancelDoc = ($row, name) => {
  cy.wrap($row).find('td.ag-title').click({ force: true });
  cy.wait(2500);
  A.activeDialog().within(() => {
    cy.contains('결재 상세').should('exist');
    cy.contains(`(${USER_ID})`).should('exist');
    cy.contains('요청됨').should('exist');                                  // 아직 결재자 차례
    cy.contains('button', /^\s*신청 취소\s*$/).should('be.visible');
  });
  A.activeDialog().then(($d) => {                                         // 신청자 화면에는 승인/반려가 없어야 함
    expect($d.find('button:visible').filter((i, e) => /^(승인|반려)$/.test(e.innerText.trim())).length, '신청자 화면의 승인/반려 버튼').to.eq(0);
  });
  A.dumpScreen(`${name}_a_상세`);
  A.activeDialog().contains('button', /^\s*신청 취소\s*$/).click({ force: true });
  cy.wait(1500);
  A.dumpScreen(`${name}_b_취소클릭후`);
  cy.get('.v-dialog--active').filter(':visible').last().should('contain', '결재를 취소');   // 확인창
  // 취소 사유 입력칸이 있으면 채움
  cy.get('body').then(($b) => {
    const $top = $b.find('.v-dialog--active:visible').last();
    const $in = $top.find('input[type="text"]:visible, textarea:visible').filter((i, e) => !e.value);
    if ($in.length && !$top.text().includes('결재 상세')) cy.wrap($in.first()).type(`[자동화] ${stamp()} 신청 취소`, { force: true });
  });
  A.confirmIfAny();
  cy.wait(2500);
  A.dumpScreen(`${name}_c_취소후`);
  cy.get('body').type('{esc}', { force: true });
  cy.wait(800);
};

describe('04_Depth_소명_신청취소', () => {
  A.ignoreErrors();

  it('결재 대기 중인 소명을 신청자가 취소한다', { retries: 0 }, function () {
    const test = this;
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));

    // ---------- 0. 이전 실행이 남긴 결재 대기 문서 정리 ----------
    go('mySubmissions'); search();
    cy.get('body').then(($b) => {
      const $left = docRowsOf($b, null, '신청');
      if (!$left.length) return;
      cy.log(`🧹 남아 있던 ${POLICY} 결재 대기 문서 ${$left.length}건 → 먼저 신청 취소`);
      $left.toArray().forEach(() => {
        go('mySubmissions'); search();
        cy.get('body').then(($bb) => cancelDoc(docRowsOf($bb, null, '신청').first(), 'D04C_0_정리'));
      });
    });

    // ---------- 1. 가장 오래된 경보로 소명 신청 ----------
    yearAlerts();
    cy.get('body').then(($b) => {
      const mine = $b.find('table tbody tr:visible').filter((i, e) => e.innerText.includes(POLICY)).length;
      cy.log(`${POLICY} 경보 ${mine}건`);
      if (mine === 0) {
        cy.log(`⏭️ ${POLICY} 경보가 없습니다 (정책 즉시실행 전) — 건너뜀`);
        cy.then(() => test.skip());
      }
    });
    alertCount().as('alertsBefore');
    cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(POLICY)).last().as('alertRow');
    cy.get('@alertRow').find('td').eq(4).invoke('text').then((t) => cy.wrap(t.trim()).as('alertStart'));
    cy.get('@alertRow').find('button.alert-inline-explain').click({ force: true });
    cy.wait(2000);
    A.activeDialog().should('contain', '이상행위 소명 신청')
      .find('textarea[placeholder*="소명 사유"]').type(`[자동화] ${POLICY} 신청 취소 시나리오 — ${stamp()} (${USER_ID})`, { force: true });
    A.activeDialog().find('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').first().click({ force: true });
    cy.wait(1500); A.confirmIfAny(); cy.wait(2500);
    cy.get('@alertsBefore').then((n) => {
      yearAlerts();
      // 신청한 경보는 목록에서 빠짐 — [2026-11-12] 건수는 그사이 다른 경보가 생기면 어긋나므로 기록만, 그 경보 줄로 확인
      alertCount().then((n2) => cy.log(`소명 대상 경보 ${n} → ${n2}건`));
      cy.get('@alertStart').then((start) => cy.get('body').then(($b) => {
        expect(alertRowsOf($b, start).length, `신청한 경보(탐지 시작 ${start})가 소명 대상 목록에 남은 수`).to.eq(0);
      }));
    });

    // ---------- 2. 신청 결재 > 문서 상세 > 신청 취소 ----------
    go('mySubmissions'); search();
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => {
        const $doc = docRowsOf($b, start, '신청');
        expect($doc.length, `방금 신청한 문서 (발생 ${start})`).to.eq(1);
        // [2026-11-12] 같은 경보에 이전 문서(반려·취소)가 여러 개 있을 수 있어, 이번 문서는 신청일로 구분
        cy.wrap(submittedAt($doc[0])).as('docAt');
        cancelDoc($doc.first(), 'D04C_2');
      });
    });

    // ---------- 3. 결과 확인 ----------
    go('mySubmissions'); search();
    A.dumpScreen('D04C_3_신청결재_취소후');
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => {
        const $r = docRowsOf($b, start);
        const sts = $r.toArray().map((e) => Cypress.$(e).find('.ag-status').text().trim());
        cy.log(`이 경보(발생 ${start})의 문서 상태 : ${sts.join(', ') || '(없음)'}`);
        // 2.9.7 : 「신청 취소」 → 확인창 「결재 취소 — 결재를 취소 하시겠습니까?」 → 문서 상태 「취소」
        cy.get('@docAt').then((at) => {
          const mine = $r.toArray().filter((e) => submittedAt(e) === at).map((e) => Cypress.$(e).find('.ag-status').text().trim());
          expect(mine, `취소한 문서(신청 ${at})의 결재 상태`).to.deep.eq(['취소']);
        });
        expect(sts.filter((s) => s === '신청').length, '이 경보의 결재 대기(신청) 문서 수').to.eq(0);
      });
    });
    // 경보가 소명 대상 목록으로 되돌아옴
    cy.get('@alertsBefore').then((n) => {
      yearAlerts();
      alertCount().then((n2) => cy.log(`소명 대상 경보 ${n2}건 (신청 전 ${n}건)`));
      cy.get('@alertStart').then((start) => cy.get('body').then(($b) => {
        const $a = alertRowsOf($b, start);
        expect($a.length, `취소한 경보(탐지 시작 ${start})가 소명 대상 목록에 다시 있음`).to.eq(1);
        expect($a.find('button.alert-inline-explain').length, '그 경보의 「소명」 버튼').to.be.greaterThan(0);
      }));
    });
    A.dumpScreen('D04C_3_경보목록_취소후');

    // ---------- 4. 결재자 담당 결재에서 사라짐 ----------
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    go('pending'); search();
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => expect(docRowsOf($b, start).length, '결재자의 담당 결재에 남은 취소 문서').to.eq(0));
    });
    A.dumpScreen('D04C_4_결재자_담당결재');
  });
});
