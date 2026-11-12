// ==========================================================================
// [2.9.7 신규] 08_Depth_분석_이상행위_경보건수갱신
//   같은 날 접속이 더 쌓이면 그날의 경보가 새로 생기지 않고, 경보 문구의 접속 건수가 늘어나는지 확인
//     (user014) 소명 > 신청 : 오늘 「auto_소명_반려」 경보의 「… N건 접속했습니다」 → N1
//     → (CRM .27) user014 접속 1회 → (관리자) 전용 정책 즉시실행
//     → (user014) 같은 경보 줄의 건수 N2 > N1, 오늘 경보 줄은 여전히 1개
//   [실행이력] 즉시실행 전후로 정책 카드 메뉴 「실행이력」 창을 열어 새 실행 기록이 생겼는지 비교
//   반복 실행 설계
//     - 경보를 소명 신청하지 않음 → 경보를 소모하지 않음, 같은 날 몇 번 돌려도 건수 비교로 검증됨
//     - 정책 규칙은 바꾸지 않음. 즉시실행으로 켠 사용 여부는 after() 에서 OFF
//     - 오늘 경보가 결재 대기(신청) 중이라 목록에 없으면 건너뜀 (반려 스크립트가 처리 중인 상태)
//   [적용 대상] 정책 적용 대상이 사원_14 뿐이므로, 대상이 아닌 user013(AI개발1팀)도 같은 시스템에 접속시킨 뒤
//              결과 탭에서 이 정책 경보가 모두 사원_14 것이고 사원_13 경보는 없는지 확인
//   비밀번호 : cypress.env.json (LC_PW, LC_USER014_PW, CRM27_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_반려';
const USER_ID = 'user014';
const OTHER_ID = 'user013';       // 적용 대상이 아닌 사용자 (AI개발1팀)

const p2 = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} 00:00:00`; };
const yearAlerts = () => {
  cy.visit('/logcatch/approval/submit/anomaly-alerts'); cy.wait(3500);
  cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true }); cy.wait(3000);
};
// 오늘 이 정책 경보 줄들의 접속 건수 목록
const todayCounts = () => cy.get('body').then(($b) => {
  // [2026-11-12] 탐지 시작 칸(5번째)으로 비교 — 글 전체로 찾으면 전날 경보의 「탐지 종료」(오늘 00:00:00)까지 잡힘
  const rows = $b.find('table tbody tr:visible').toArray().filter((e) => e.innerText.includes(POLICY) && Cypress.$(e).find('td').eq(4).text().trim() === today());
  return rows.map((e) => parseInt((e.innerText.replace(/\s+/g, ' ').match(/(\d+)\s*건\s*접속/) || [])[1] || '-1', 10));
});
const restorePolicy = () => {
  A.loginAdmin();
  A.goAnomaly('사용자 이상행위 정책');
  A.searchPolicy(POLICY);
  A.policyActive(POLICY).invoke('attr', 'aria-checked').then((c) => {
    if (c === 'true') {
      A.policyActive(POLICY).parents('.v-input--selection-controls').first().find('.v-input--selection-controls__input').click({ force: true });
      A.confirmIfAny();
    }
  });
  A.policyActive(POLICY).should('have.attr', 'aria-checked', 'false');
};

describe('08_Depth_분석_이상행위_경보건수갱신', () => {
  A.ignoreErrors();
  after(() => restorePolicy());

  it('같은 날 접속이 늘면 경보 건수가 갱신된다', { retries: 0 }, function () {
    const test = this;
    // ---------- 1. 현재 건수 (user014) ----------
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    cy.visit('/logcatch/approval/document/my-submissions'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500);
    cy.get('body').then(($b) => {
      const pending = $b.find('tr.ag-row:visible').filter((i, e) => e.innerText.includes(POLICY) && e.innerText.includes(`발생 ${today()}`)
        && Cypress.$(e).find('.ag-status').text().trim() === '신청').length;
      if (pending) { cy.log('⏭️ 오늘 경보가 결재 대기 중 — 건너뜀'); cy.then(() => test.skip()); }
    });
    yearAlerts();
    todayCounts().then((c) => {
      cy.log(`오늘 ${POLICY} 경보 건수(실행 전) : ${c.length ? c.join(', ') : '(아직 없음)'}`);
      expect(c.length, '오늘 경보 줄 수 (0 또는 1)').to.be.at.most(1);
      cy.wrap(c.length ? c[0] : 0).as('n1');
      cy.writeFile('cypress/probe/D08C_1_시작건수.json', { at: new Date().toISOString(), rows: c.length, counts: c });
    });

    // ---------- 2. 접속 (CRM .27) : 적용 대상 아닌 user013 → 대상 user014 순서 ----------
    //   [2026-11-11] 두 계정을 같은 쿠키로 이어 로그인하면 앞 계정(user013) 세션이 남아 user014 접속이 안 생김
    //               → 계정마다 쿠키를 비우고 로그인
    cy.clearAllCookies();
    cy.request({ method: 'POST', url: 'http://10.10.54.27/crm/login.jsp', form: true,
      body: { empId: OTHER_ID, empPw: Cypress.env('CRM27_PW') }, followRedirect: false, failOnStatusCode: false, log: false })
      .then((res) => cy.log(`CRM 로그인(${OTHER_ID}) 응답 ${res.status} ${res.headers.location || ''}`));
    cy.request({ method: 'GET', url: 'http://10.10.54.27/crm/soc_matrix.jsp', qs: { action: 'massive_inquiry', _ts: Date.now() }, failOnStatusCode: false })
      .then((res) => cy.log(`CRM 조회(${OTHER_ID}) 응답 ${res.status}`));
    cy.clearAllCookies();
    cy.request({ method: 'POST', url: 'http://10.10.54.27/crm/login.jsp', form: true,
      body: { empId: USER_ID, empPw: Cypress.env('CRM27_PW') }, followRedirect: false, failOnStatusCode: false, log: false })
      .its('status').should('be.oneOf', [200, 302]);
    cy.request({ method: 'GET', url: 'http://10.10.54.27/crm/soc_matrix.jsp', qs: { action: 'massive_inquiry', _ts: Date.now() }, failOnStatusCode: false })
      .its('status').should('eq', 200);
    cy.wait(60000); // 수집 → 적재 대기

    // ---------- 3. 즉시실행 (관리자) — 전후로 실행이력 비교 ----------
    A.loginAdmin();
    // [2026-11-12] 즉시실행 뒤 60초 고정 대기로는 실행이 아직 안 된 때가 있어(10:57 실패), 실행이력에 새 기록(성공)이 생길 때까지 반복 확인
    //   공통 helper A.runNowAndWait : 실행이력 전 → 즉시실행 → 15초마다 실행이력 확인 (최대 약 5분)
    A.runNowAndWait(POLICY, 'D08C_3');
    // [실행이력] 새 기록은 이번 실행 중(최근 15분 안)에 생긴 것
    A.runHistory(POLICY).then((runs) => {
      const last = runs.length ? runs[runs.length - 1].at : '';
      const p = (n) => String(n).padStart(2, '0');
      const d = new Date(Date.now() - 15 * 60000);
      const since = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
      expect(last >= since, `최근 실행 기록 시각(${last}) ≥ ${since}`).to.be.true;
    });
    // (설계용 덤프) 결과 탭 : 정책이 켜져 있어 기본 화면에 보임
    A.goAnomaly('사용자 이상행위 결과');
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
    cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type(POLICY, { force: true });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('D08C_3_결과');
    // [적용 대상] 이 정책 경보 묶음을 펼쳐 경보 줄의 사용자 확인
    cy.get('.incident-header').filter(':visible').filter((i, e) => e.innerText.includes(POLICY)).first().click({ force: true });
    cy.wait(3000);
    cy.get('.incident-child-row').filter(':visible').should('have.length.greaterThan', 0).then(($rows) => {
      const texts = $rows.toArray().map((e) => e.innerText.replace(/\s+/g, ' '));
      cy.log(`결과 탭 ${POLICY} 경보 줄 ${texts.length}개`);
      texts.forEach((t) => expect(t, '적용 대상(사원_14) 경보만').to.include(`(${USER_ID})`));
      expect(texts.filter((t) => t.includes(`(${OTHER_ID})`)).length, `적용 대상이 아닌 ${OTHER_ID} 경보 수`).to.eq(0);
    });
    A.dumpScreen('D08C_3_결과_펼침');

    // ---------- 4. 건수 증가 확인 (user014) ----------
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    // [2026-11-11] 즉시실행 직후 몇 분 동안 오늘 경보 줄이 신청 목록에서 안 보인 적이 있어(같은 날 1회),
    //   줄이 다시 보이고 건수가 늘 때까지 기다리며 매 확인 시각·결과를 기록 (cypress/probe/D08C_4_poll.json)
    const trace = [];
    const poll = (left) => {
      yearAlerts();
      todayCounts().then((c) => {
        cy.get('@n1').then((n1) => {
          const n2 = c.length ? c[0] : null;
          trace.push({ at: new Date().toISOString(), rows: c.length, count: n2 });
          cy.writeFile('cypress/probe/D08C_4_poll.json', { n1, trace });
          cy.log(`오늘 ${POLICY} 경보 : 줄 ${c.length}개 / 건수 ${n1} → ${n2 === null ? '(줄 없음)' : n2}`);
          if ((c.length !== 1 || n2 <= n1) && left > 0) { cy.wait(30000); poll(left - 1); return; }
          expect(c.length, '오늘 경보 줄 수 (새로 생기지 않고 1개)').to.eq(1);
          expect(n2, '접속 후 오늘 경보 건수').to.be.greaterThan(n1);
        });
      });
    };
    poll(12); // 최대 약 6분 더 기다림
    A.dumpScreen('D08C_4_건수갱신후');
  });
});
