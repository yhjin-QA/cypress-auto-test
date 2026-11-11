// ==========================================================================
// [2.9.7 신규] 04_Depth_소명_이상행위경보_반려
//   전용 정책 「auto_소명_접속량 과다」(.21 에 1회 수동 생성) 사용
//     - 「접속량 과다」를 복사(클립보드) → 가져오기 한 뒤 : 임계값 1 · 소명 ON · 적용 대상 사용자 = 신청자(user014)
//     - 이 스크립트는 정책 규칙을 바꾸지 않음 (규칙을 바꾸면 버전이 올라가고, 결과·소명 화면은 현재 버전 경보만 보여 줌)
//   계정 (CRM .27 리눅스_VIP고객 / 인사정보 .26, AI개발2팀) : 신청자 user014 · 부서장(결재자) user001
//   흐름: (CRM .27) user014 로그인으로 접속 기록 발생
//      → (관리자) 전용 정책 즉시실행(사용 ON) → 결과 탭에서 경보 확인 → 소명 결재선 정책 확인
//      → (user014) 소명 > 신청 > 경보의 「소명」 → 소명 사유 입력 → 신청
//      → (user001) 소명 > 결재함 > 담당 결재 → 반려
//   ※ 경보를 아끼기 위해, user014 의 결재 대기(신청 상태) 문서가 이미 있으면 새로 신청하지 않고 그 문서를 반려함
//      → (관리자) 전용 정책 사용 OFF   ※ after() 에서 수행 (사용 여부는 버전에 영향 없음)
//   비밀번호: cypress.env.json (LC_PW, LC_USER014_PW, LC_HEAD001_PW, CRM27_PW)
//   단계마다 cypress/probe/D04_*.json 으로 화면 구조를 남김
// ==========================================================================
const A = require('../../support/anomaly');
// [2026-11-11] 시나리오별 전용 정책 — 승인·반려가 서로의 경보를 쓰지 않도록 분리 (정책마다 하루 1건씩 경보 생성)
//   「auto_소명_접속량 과다」를 복사(클립보드) → 가져오기 후 이름만 변경 : 임계값 1 · 소명 ON · 적용 대상 사원_14 · 집계 1일
const POLICY = 'auto_소명_반려';
const USER_ID = 'user014';
const USER_DEPT = 'AI개발2팀';
const HEAD_ID = 'user001';

const stamp = () => {
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const openPolicyUserMode = () => {
  A.goAnomaly('사용자 이상행위 정책');
  A.searchPolicy(POLICY);
  A.policyName(POLICY).click({ force: true });
  cy.wait(1500);
  A.activeDialog().should('contain', POLICY);
};
const thresholdInput = () => A.thresholdInput();
const userTargetInput = () => A.activeDialog().find('input[placeholder="전체"]').eq(2);
const saveDialog = () => {
  A.activeDialog().contains('button', '저장').click({ force: true });
  A.confirmIfAny();
  cy.get('.v-dialog--active').should('not.exist');
};

// 전용 정책 사용 OFF (after 에서 호출) — 규칙은 건드리지 않음
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

describe('04_Depth_소명_이상행위경보_반려', () => {
  A.ignoreErrors();

  after(() => {
    cy.log('🧹 전용 정책 사용 OFF');
    restorePolicy();
  });

  it('이상행위 경보 → 소명 신청 → 부서장 반려', { retries: 0 }, function () {
    const test = this;
    // ---------- 1. 전용 정책 설정 확인 (관리자, 조회만) ----------
    A.loginAdmin();
    openPolicyUserMode();
    thresholdInput().should('have.value', '1');
    A.dialogSwitch('소명').should('have.attr', 'aria-checked', 'true');
    userTargetInput().parents('.v-input').first().find('.v-chip').should('have.length', 1); // 적용 대상 사용자 1명(신청자)
    A.activeDialog().contains('button', '취소').click({ force: true });
    A.confirmIfAny();
    cy.get('.v-dialog--active').should('not.exist');

    // ---------- 2. 접속 기록 발생 (CRM .27 리눅스_VIP고객, user014) ----------
    //   브라우저 이동 없이 요청으로 로그인 → 화면 조회 (세션 쿠키는 cy.request 가 이어 줌)
    cy.request({ method: 'POST', url: 'http://10.10.54.27/crm/login.jsp', form: true,
      body: { empId: USER_ID, empPw: Cypress.env('CRM27_PW') }, followRedirect: false, failOnStatusCode: false, log: false })
      .then((res) => {
        cy.log(`CRM 로그인 응답: ${res.status}`);
        cy.writeFile('cypress/probe/D04_2_CRM27_상태.json', { login: res.status, location: res.headers.location || null, at: stamp() });
        expect(res.status, 'CRM(.27) 로그인 응답').to.be.oneOf([200, 302]);
      });
    cy.request({ method: 'GET', url: 'http://10.10.54.27/crm/soc_matrix.jsp', qs: { action: 'massive_inquiry', _ts: Date.now() }, failOnStatusCode: false })
      .its('status').should('eq', 200);
    cy.wait(60000); // 수집 → 적재 대기

    // ---------- 3. 즉시실행 → 경보 생성 확인 (관리자) ----------
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy(POLICY);
    A.policySelect(POLICY).check({ force: true });
    cy.contains('.toolbar-action-btn', '즉시실행').click({ force: true });
    A.activeDialog().contains('button', '확인').click({ force: true });
    cy.wait(2000);
    A.policyActive(POLICY).should('have.attr', 'aria-checked', 'true');

    A.dumpScreen('D04_3_0_즉시실행후');
    // 즉시실행 직후에는 탭 전환이 한 번에 안 될 때가 있어, 결과 화면 주소가 될 때까지 다시 누름
    const goResult = (left) => {
      cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
      cy.wait(2500);
      cy.url().then((u) => { if (!u.includes('PolicyResult') && left > 0) goResult(left - 1); });
    };
    goResult(3);
    cy.url().should('include', 'customAnomalyBehaviorPolicyResult');
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
    const waitAlert = (left) => {
      cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type(POLICY, { force: true });
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      cy.wait(3000);
      cy.get('.v-toolbar__title').filter(':visible').contains('경보').invoke('text').then((t) => {
        const n = parseInt((t.match(/(\d+)건/) || [])[1] || '0', 10);
        cy.log(`🔔 ${t.trim()}`);
        if (n === 0 && left > 0) { cy.wait(20000); waitAlert(left - 1); }
        else expect(n, '경보 건수').to.be.greaterThan(0);
      });
    };
    waitAlert(12); // 최대 약 5분
    A.dumpScreen('D04_3_결과_경보');

    // 2.9.x 소명 흐름 : 사이드바 「소명」 > 신청 / 결재함  (「소명하기」 메뉴는 2.7·2.8 용, 업데이트 설치 서버에만 남아 있음)
    //   일반 사용자는 로그인 후 사이트맵 화면이 떠서 메뉴 글자가 겹치므로 주소로 직접 이동
    const URLS = {
      line: '/logcatch/approval/policy/approval-line',
      submit: '/logcatch/approval/submit/anomaly-alerts',
      mySubmissions: '/logcatch/approval/document/my-submissions',
      pending: '/logcatch/approval/document/my-pending-approvals'
    };
    const go = (key) => { cy.visit(URLS[key]); cy.wait(3500); };
    const dialogHtml = (name) => cy.get('body').then(($b) => {
      const $d = $b.find('.v-dialog--active:visible');
      cy.writeFile(`cypress/probe/${name}.html`, $d.length ? $d.last()[0].outerHTML.replace(/\s+/g, ' ').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 20000) : 'NO DIALOG');
    });

    // 결재함 표에서 방금 신청한 문서 줄 : 신청자 (user014) + 제목 「… 소명 (발생 <탐지 시작>)」
    const docRow = () => cy.get('@alertStart').then((start) =>
      cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(`(${USER_ID})`) && e.innerText.includes(POLICY) && e.innerText.includes(`발생 ${start}`)).first());

    // Mailpit(.26) : 소명 신청·결재 때 새로 온 메일 수집 (공용 메일함이라 삭제하지 않고, 실행 전 ID 와 비교)
    const MAILPIT = 'http://10.10.54.26:8025/api/v1/messages';
    const mailSnapshot = (alias) => cy.request({ url: MAILPIT, failOnStatusCode: false })
      .then((res) => cy.wrap(((res.body && res.body.messages) || []).map((m) => m.ID)).as(alias));
    const newMails = (alias, name, tries = 6) => cy.get(`@${alias}`).then((before) => {
      const poll = (left) => cy.request({ url: MAILPIT, failOnStatusCode: false }).then((res) => {
        const fresh = ((res.body && res.body.messages) || []).filter((m) => !before.includes(m.ID))
          .map((m) => ({ subject: m.Subject, to: (m.To || []).map((t) => t.Address), from: m.From && m.From.Address, created: m.Created }));
        if (!fresh.length && left > 0) { cy.wait(5000); return poll(left - 1); }
        cy.writeFile(`cypress/probe/${name}.json`, fresh);
        cy.log(`📧 새 메일 ${fresh.length}건 ${fresh.map((f) => `[${f.to.join(',')}] ${f.subject}`).join(' / ')}`);
        return cy.wrap(fresh);
      });
      return poll(tries);
    });

    // ---------- 4. 사전 조건 : 소명 결재선 정책 (관리자, 조회만) ----------
    go('line');
    cy.contains('.c-headline', '결재 정책 목록').should('exist');
    cy.get('table tbody tr').filter(':visible').then(($rows) => {
      const ok = [...$rows].some((tr) => {
        const tds = [...tr.querySelectorAll('td')].map((td) => td.innerText.trim());
        return tds[0] === '소명' && tds.includes('사용');
      });
      expect(ok, '소명 > 정책 > 결재선 에 결재 유형 「소명」·「사용」 인 결재 정책이 필요합니다').to.be.true;
    });

    // ---------- 5. 소명 신청 (신청자 user014 본인) — 결재 대기 문서가 있으면 재사용 ----------
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    const submitNew = () => {
      go('submit');
      cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
      cy.wait(3000);
      cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('경보').invoke('text').then((t) => {
        const n = parseInt((t.match(/(\d+)건/) || [])[1] || '0', 10);
        cy.log(`소명 대상 경보 ${n}건`);
        cy.wrap(n).as('alertsBefore');
        // 이 정책의 경보만 셈 (다른 전용 정책의 경보는 다른 시나리오 몫)
        const mine = Cypress.$('table tbody tr:visible').filter((i, e) => e.innerText.includes(POLICY)).length;
        cy.log(`그중 ${POLICY} 경보 ${mine}건`);
        if (mine === 0) {
          // 제품 문제가 아니라 테스트 데이터 소진 → 건너뜀(Pending)
          cy.log(`⏭️ ${POLICY} 소명 대상 경보 0건 — 오늘 몫을 이미 사용했습니다. 이번 실행은 건너뜁니다.`);
          cy.writeFile('cypress/probe/D04_경보소진.json', { at: stamp(), spec: Cypress.spec.name });
          cy.then(() => test.skip());
        }
      });
      cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(POLICY)).first().as('alertRow');
      cy.get('@alertRow').find('td').eq(4).invoke('text').then((t) => cy.wrap(t.trim()).as('alertStart'));
      cy.get('@alertRow').find('button.alert-inline-explain').click({ force: true });
      cy.wait(2000);
      A.activeDialog().within(() => {
        cy.contains('이상행위 소명 신청').should('exist');
        cy.contains(POLICY).should('exist');
        cy.contains('.ad-meta-val', USER_DEPT).should('exist');
        cy.contains('.ad-meta-val', `(${USER_ID})`).should('exist');
        // 결재선 : 신청자 → 부서장
        cy.contains('.ad-tl-name', `(${USER_ID})`).should('contain', '신청자');
        cy.contains('.ad-tl-name', `(${HEAD_ID})`).should('exist');
      });
      // [필수 입력 검증] 소명 사유를 비운 채 「신청」 → 신청되지 않고 창이 그대로 있어야 함 (경보를 쓰지 않는 확인)
      A.activeDialog().find('textarea[placeholder*="소명 사유"]').clear({ force: true });
      A.activeDialog().find('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').first().then(($b) => {
        if (A.isDisabled($b)) { cy.log('✅ 소명 사유 미입력 → 「신청」 버튼 비활성'); return; }
        cy.wrap($b).click({ force: true });
        cy.wait(1500);
        A.dumpScreen('D04_5a0_사유없이_신청');
        A.dismissInputNotice('textarea[placeholder*="소명 사유"]');
      });
      A.activeDialog().should('contain', '이상행위 소명 신청').find('textarea[placeholder*="소명 사유"]').should('exist');
      cy.log('✅ 소명 사유 없이는 신청되지 않음');
      const reason = `[자동화] ${POLICY} 경보 소명 — ${stamp()} 신청 (${USER_ID})`;
      cy.wrap(reason).as('reason');
      A.activeDialog().find('textarea[placeholder*="소명 사유"]').clear({ force: true }).type(reason, { force: true });
      A.dumpScreen('D04_5a_소명신청_작성');
      mailSnapshot('mailsBeforeSubmit');
      A.activeDialog().find('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').first().click({ force: true });
      cy.wait(1500);
      A.dumpScreen('D04_5b_신청클릭후');
      dialogHtml('D04_5b_신청클릭후');
      A.confirmIfAny();
      cy.wait(2500);
      A.dumpScreen('D04_5c_신청완료후');
      newMails('mailsBeforeSubmit', 'D04R_5_메일_신청후'); // [1차] 기록만 — 발송 형태 확인 후 검증으로 전환

      // 신청 결재함에 방금 신청한 문서가 있는지
      go('mySubmissions');
      cy.contains('.v-btn__content, button', '검색').click({ force: true });
      cy.wait(2500);
      A.dumpScreen('D04_5d_신청결재함');
      docRow().should('contain', POLICY).find('.ag-status').should('have.text', '신청');
      cy.get('@alertsBefore').then((n) => {
        // 신청한 경보는 소명 대상 목록에서 빠짐
        go('submit');
        cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
        cy.wait(3000);
        cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('경보').invoke('text')
          .then((t) => expect(parseInt((t.match(/(\d+)건/) || [])[1] || '0', 10), '신청 후 소명 대상 경보 건수').to.eq(n - 1));
      });
    };
    go('mySubmissions');
    cy.contains('.v-btn__content, button', '검색').click({ force: true });
    cy.wait(2500);
    cy.get('body').then(($b) => {
      const $wait = $b.find('table tbody tr:visible').filter((i, e) => e.innerText.includes(POLICY) && Cypress.$(e).find('.ag-status').text().trim() === '신청');
      const m = $wait.length ? $wait.first().find('td.ag-title').text().match(/발생 (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/) : null;
      if (m) {
        cy.log(`♻️ 결재 대기 문서 재사용 (발생 ${m[1]})`);
        cy.wrap(m[1]).as('alertStart');
        cy.wrap('[자동화]').as('reason'); // 앞선 실행에서 쓴 사유(앞머리)만 확인
      } else {
        cy.log('🆕 결재 대기 문서 없음 → 새로 소명 신청');
        submitNew();
      }
    });

    // ---------- 6. 반려 (부서장 user001) ----------
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));
    go('pending');
    cy.contains('.v-btn__content, button', '검색').click({ force: true });
    cy.wait(2500);
    A.dumpScreen('D04_6a_담당결재');
    docRow().find('.ag-status').should('have.text', '신청');
    // 제목을 눌러 결재 상세 열기
    docRow().find('td.ag-title').click({ force: true });
    cy.wait(2500);
    A.activeDialog().within(() => {
      cy.contains('결재 상세').should('exist');
      cy.contains(POLICY).should('exist');
      cy.contains(`(${USER_ID})`).should('exist');
      cy.contains(USER_DEPT).should('exist');
      cy.get('@reason').then((r) => cy.contains(r).should('exist')); // 신청자가 쓴 소명 사유
      cy.contains('요청됨').should('exist');                          // 결재자(user001) 차례
      cy.contains('button', /^\s*승인\s*$/).should('be.visible');
      cy.contains('button', /^\s*반려\s*$/).should('be.visible');
    });
    mailSnapshot('mailsBeforeDecision');
    A.activeDialog().contains('button', /^\s*반려\s*$/).click({ force: true });
    cy.wait(1500);
    // [필수 입력 검증] 반려 사유를 비운 채 「확인」 → 반려되지 않고 확인창이 그대로 있어야 함
    A.activeDialog().should('contain', '소명 반려').contains('button', /^\s*확인\s*$/).then(($b) => {
      if (A.isDisabled($b)) { cy.log('✅ 반려 사유 미입력 → 「확인」 버튼 비활성'); return; }
      cy.wrap($b).click({ force: true });
      cy.wait(1500);
      A.dumpScreen('D04R_6c0_사유없이_확인');
      A.dismissInputNotice('input[placeholder*="반려 사유"]');
    });
    A.activeDialog().should('contain', '소명 반려').find('input[placeholder*="반려 사유"]').should('exist');
    cy.log('✅ 반려 사유 없이는 반려되지 않음');
    // [취소 검증] 「취소」 → 확인창만 닫히고 결재 상세(결재 대기)는 그대로
    A.activeDialog().contains('button', /^\s*취소\s*$/).click({ force: true });
    cy.wait(1200);
    A.activeDialog().should('contain', '결재 상세');
    A.activeDialog().find('input[placeholder*="반려 사유"]').should('not.exist');
    A.activeDialog().contains('button', /^\s*승인\s*$/).should('be.visible');
    cy.log('✅ 반려 취소 → 결재 대기 유지');
    // 다시 「반려」
    A.activeDialog().contains('button', /^\s*반려\s*$/).click({ force: true });
    cy.wait(1500);
    // 「소명 반려」 확인창 : 반려 사유(필수) 입력 후 확인
    A.activeDialog().should('contain', '소명 반려').within(() => {
      cy.contains('반려 사유').should('exist');
      cy.contains('반려 시 사유 입력은 필수이며, 신청자에게 반려 사유로 전달됩니다').should('exist');
      // [Mantis 0038972] 다크 모드에서 이 확인창의 사유 입력칸·취소 버튼이 흰 바탕으로 표시됨 (기능 동작은 정상 → 검증은 그대로 유지)
      cy.get('input[placeholder*="반려 사유"]').type(`[자동화] ${stamp()} 반려합니다. 소명 사유 보완 필요`, { force: true });
      cy.contains('button', /^\s*확인\s*$/).click({ force: true });
    });
    cy.wait(3000);
    A.dumpScreen('D04R_6d_반려후');
    newMails('mailsBeforeDecision', 'D04R_6_메일_반려후'); // [1차] 기록만
    // 반려한 문서는 담당 결재(대기) 목록에서 빠짐
    cy.get('@alertStart').then((start) => {
      cy.get('body').then(($b) => {
        const left = $b.find('table tbody tr:visible').filter((i, e) => e.innerText.includes(`발생 ${start}`)).length;
        expect(left, '반려 후 담당 결재 대기 목록에 남은 해당 문서 수').to.eq(0);
      });
    });

    // 결재 완료 확인 : 모든 결재에서 방금 신청한 문서의 결재 상태
    cy.visit('/logcatch/approval/document/overview'); cy.wait(3500);
    cy.contains('.v-btn__content, button', '검색').click({ force: true });
    cy.wait(2500);
    A.dumpScreen('D04R_6e_모든결재');
    docRow().find('.ag-status').should('have.text', '반려');
    // 결재 완료 문서는 결재자의 「참조 결재」에서도 조회됨 (2.9.7 — 담당 결재 처리 후 참조 결재·모든 결재로 이동)
    cy.get('.v-btn__content').filter(':visible').contains(/^\s*참조 결재\s*$/).click({ force: true });
    cy.wait(3000);
    cy.contains('.v-btn__content, button', '검색').click({ force: true });
    cy.wait(2500);
    A.dumpScreen('D04R_6f_참조결재');
    docRow().find('.ag-status').should('have.text', '반려');

    // 반려 후 신청자 화면
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));
    go('submit');
    cy.contains('button.sev-filter-btn', /^\s*1년\s*$/).click({ force: true });
    cy.wait(3000);
    A.dumpScreen('D04R_7_반려후_신청자_경보목록');
    // 반려된 경보는 신청자의 소명 대상 목록으로 되돌아옴 (2.9.7 확인) → 다시 소명 신청 가능
    cy.get('@alertStart').then((start) => {
      cy.get('table tbody tr').filter(':visible').filter((i, e) => e.innerText.includes(POLICY) && e.innerText.includes(start))
        .should('have.length', 1).find('button.alert-inline-explain').should('exist');
    });
  });
});
