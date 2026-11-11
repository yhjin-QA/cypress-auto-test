// ==========================================================================
// [2.9.7 신규] 04_Basic_소명  (조회 전용 — 데이터를 만들거나 바꾸지 않음 → 하루에 몇 번을 돌려도 결과가 같음)
//   2.9.x 소명 메뉴 : 소명 > 신청(이상행위 경보) · 결재함(모든/신청/담당/참조 결재) · 정책 > 결재선
//   ※ 2.8 이하의 「소명하기」 메뉴 스크립트(폐기)를 대체
//   설계 원칙
//     - 경보·결재 문서가 0건이어도 통과 (건수에 의존하지 않고, 있을 때만 행 내용을 확인)
//     - 신청/승인/반려/저장 버튼은 누르지 않음 (창을 열어 구성만 확인하고 닫음)
//     - it 마다 스스로 로그인 → 앞 테스트 결과·실행 순서에 의존하지 않음
//   계정 : 관리자(LC_USER) · 신청자 user014 · 결재자(부서장) user001   비밀번호 : cypress.env.json
// ==========================================================================
const A = require('../../support/anomaly');
const USER_ID = 'user014';
const HEAD_ID = 'user001';
const URLS = {
  line: '/logcatch/approval/policy/approval-line',
  submit: '/logcatch/approval/submit/anomaly-alerts',
  overview: '/logcatch/approval/document/overview',
  mySubmissions: '/logcatch/approval/document/my-submissions',
  pending: '/logcatch/approval/document/my-pending-approvals'
};
const DOC_HEADERS = ['신청일', '부서', '신청자', '결재 대상', '제목', '결재 상태'];

const go = (key) => { cy.visit(URLS[key]); cy.wait(3500); };
const search = () => { cy.contains('.v-btn__content, button', '검색').click({ force: true }); cy.wait(2500); };
// 「경보 (… N건)」 제목에서 건수
const alertCount = () => cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('경보').invoke('text')
  .then((t) => parseInt((t.match(/(\d+)\s*건/) || [])[1] || '0', 10));
const period = (name) => { cy.contains('button.sev-filter-btn', new RegExp(`^\\s*${name}\\s*$`)).click({ force: true }); cy.wait(3000); };
// 결재함 목록의 보이는 행 (0건이어도 실패하지 않도록 body 에서 직접 찾음)
// Cypress 는 .then 에서 돌려준 DOM 요소 배열을 jQuery 로 바꿔 버림(forEach 없음) → 객체로 감싸서 돌려줌
const docRows = () => cy.get('body').then(($b) => ({ rows: $b.find('tr.ag-row:visible').toArray() }));
// 결재함은 첫 진입 때 목록을 불러오는 데 시간이 걸릴 때가 있어 머리글이 나타날 때까지 기다림
const checkDocHeaders = () => cy.get('th:visible', { timeout: 20000 }).should('have.length.greaterThan', 3).then(($th) => {
  const heads = [...$th].map((e) => e.innerText.trim());
  DOC_HEADERS.forEach((h) => expect(heads, `목록 머리글 「${h}」`).to.include(h));
});
// 결재함 탭 이동 (버튼 클릭) — 주소가 바뀌는지 확인
const openTab = (name, urlPart) => {
  cy.get('.v-btn__content').filter(':visible').contains(new RegExp(`^\\s*${name}\\s*$`)).click({ force: true });
  cy.wait(3000);
  if (urlPart) cy.url().should('include', urlPart);
  checkDocHeaders();
};
// 창 닫기 (오른쪽 위 X)
const closeDialog = () => {
  A.activeDialog().find('i.material-icons, i.v-icon').filter((i, e) => e.textContent.trim() === 'close').first().click({ force: true });
  cy.wait(1200);
};

describe('04_Basic_소명', () => {
  A.ignoreErrors();

  it('관리자 — 결재선 정책 · 신청(이상행위 경보) 화면', () => {
    A.loginAdmin();

    // 소명 > 정책 > 결재선
    go('line');
    cy.contains('.c-headline', '결재 정책 목록').should('exist');
    cy.get('table tbody tr').filter(':visible').then(($rows) => {
      const ok = [...$rows].some((tr) => {
        const tds = [...tr.querySelectorAll('td')].map((td) => td.innerText.trim());
        return tds[0] === '소명' && tds.includes('사용');
      });
      expect(ok, '결재 유형 「소명」·「사용」 인 결재 정책').to.be.true;
    });
    A.dumpScreen('B04_1_결재선');

    // 소명 > 신청 > 이상행위 경보
    go('submit');
    ['이상행위 경보', '소명 요청 자동화'].forEach((t) => cy.contains('.v-btn__content, button', t).should('exist'));
    ['전체', '심각', '경계', '주의', '오늘', '1주일', '1개월', '3개월', '1년'].forEach((t) =>
      cy.contains('button.sev-filter-btn', new RegExp(`^\\s*${t}\\s*$`)).should('exist'));
    // 기간 필터 : 기간이 길수록 건수가 같거나 많아야 함 (건수 자체에는 의존하지 않음)
    period('오늘');
    alertCount().then((today) => {
      period('1개월');
      alertCount().then((month) => {
        period('1년');
        alertCount().then((year) => {
          cy.log(`경보 건수 — 오늘 ${today} / 1개월 ${month} / 1년 ${year}`);
          expect(month, '1개월 건수 ≥ 오늘 건수').to.be.at.least(today);
          expect(year, '1년 건수 ≥ 1개월 건수').to.be.at.least(month);
        });
      });
    });
    cy.url().should('include', 'dateFrom=');
    A.dumpScreen('B04_1_신청_관리자');
  });

  it(`신청자(${USER_ID}) — 신청 화면 · 결재함`, () => {
    A.login(USER_ID, Cypress.env('LC_USER014_PW'));

    // 소명 > 신청 : 본인 경보 목록 (0건이면 안내 문구)
    go('submit');
    period('1년');
    alertCount().then((n) => {
      cy.log(`소명 대상 경보 ${n}건`);
      if (n === 0) {
        cy.contains('소명할 이상행위 경보가 없습니다').should('exist');
        return;
      }
      // 경보가 있으면 : 「소명」 버튼 → 신청 창 구성 확인 → 신청하지 않고 닫음
      cy.get('table tbody tr').filter(':visible').find('button.alert-inline-explain').first().click({ force: true });
      cy.wait(2000);
      A.activeDialog().within(() => {
        cy.contains('이상행위 소명 신청').should('exist');
        cy.contains('.ad-meta-val', `(${USER_ID})`).should('exist');
        cy.contains('.ad-tl-name', `(${USER_ID})`).should('contain', '신청자');
        cy.get('textarea[placeholder*="소명 사유"]').should('exist');
        cy.get('.approval-action-bar button').filter((i, e) => e.innerText.trim() === '신청').should('exist');
      });
      closeDialog();
      cy.get('.v-dialog--active:visible').should('not.exist');
      // 닫기만 했으므로 건수는 그대로
      period('1년');
      alertCount().should('eq', n);
    });
    A.dumpScreen('B04_2_신청_신청자');

    // 결재함 : 탭 4개
    go('overview');
    checkDocHeaders();
    openTab('신청 결재', '/my-submissions');
    search();
    docRows().then(({ rows }) => {
      cy.log(`신청 결재 ${rows.length}건`);
      rows.forEach((tr) => expect(tr.innerText, '신청 결재에는 본인 문서만').to.include(`(${USER_ID})`));
      if (!rows.length) return;
      // 문서가 있으면 : 제목 클릭 → 결재 상세 (신청자에게는 승인/반려 버튼이 없어야 함)
      cy.wrap(rows[0]).find('td.ag-title').click({ force: true });
      cy.wait(2500);
      A.activeDialog().within(() => {
        cy.contains('결재 상세').should('exist');
        cy.contains('신청 내용').should('exist');
        cy.contains('진행 인원').should('exist');
        cy.contains(`(${USER_ID})`).should('exist');
      });
      A.activeDialog().then(($d) => {
        const act = $d.find('button:visible').filter((i, e) => /^(승인|반려)$/.test(e.innerText.trim())).length;
        expect(act, '신청자 화면의 승인/반려 버튼 수').to.eq(0);
      });
      closeDialog();
    });
    openTab('담당 결재', '/my-pending-approvals');
    openTab('참조 결재');
    search();
    // 참조 결재는 결재자 쪽 화면 — 신청자 본인이 신청한 소명 문서는 신청자의 참조 결재에 나오지 않음 (2.9.7)
    docRows().then(({ rows }) => {
      const own = rows.filter((tr) => tr.innerText.includes(`(${USER_ID})`) && tr.innerText.includes('소명')).length;
      cy.log(`신청자 참조 결재 ${rows.length}건 / 본인 소명 문서 ${own}건`);
      expect(own, '신청자 참조 결재에 보이는 본인 소명 문서 수').to.eq(0);
    });
    openTab('모든 결재', '/overview');
    A.dumpScreen('B04_2_결재함_신청자');
  });

  it(`결재자(${HEAD_ID}) — 결재함`, () => {
    A.login(HEAD_ID, Cypress.env('LC_HEAD001_PW'));

    go('pending');
    checkDocHeaders();
    cy.contains('.v-btn__content, button', '부재중 위임').should('exist'); // 누르지 않음
    ['부서', '신청자', '로그인 아이디', '결재 대상', '결재 상태'].forEach((l) => cy.get(`input[aria-label="${l}"]`).should('exist'));
    search();
    docRows().then(({ rows }) => {
      cy.log(`담당 결재(대기) ${rows.length}건`);
      // 담당 결재 = 내 결재 차례인 문서 → 있으면 모두 「신청」 상태
      rows.forEach((tr) => expect(Cypress.$(tr).find('.ag-status').text().trim(), '담당 결재 문서 상태').to.eq('신청'));
    });

    // 검색 조건 : 로그인 아이디로 좁히면 그 신청자 문서만 (0건이어도 통과)
    openTab('모든 결재', '/overview');
    cy.get('input[aria-label="현행 결재만 보기"]').should('exist');
    // 로그인 아이디 검색 : 입력값이 실제 조회 요청(userAccount)에 실려 가는지까지 확인
    //   [2026-11-11] 입력 후 바로 「검색」을 누르면 값이 요청에 빠지는 경우가 있어(userAccount= 빈 값) Enter 로 입력을 확정한 뒤 검색
    const searchByLoginId = (id) => {
      cy.intercept('GET', '**/approval/documents?*').as('docSearch');
      cy.get('input[aria-label="로그인 아이디"]').clear({ force: true }).type(`${id}{enter}`, { force: true });
      cy.wait(800);
      cy.contains('.v-btn__content, button', '검색').click({ force: true });
      cy.wait('@docSearch', { timeout: 15000 }).its('request.url').should('include', `userAccount=${encodeURIComponent(id)}`);
      cy.wait(2000);
    };
    searchByLoginId(USER_ID);
    docRows().then(({ rows }) => {
      cy.log(`모든 결재 (로그인 아이디 ${USER_ID}) ${rows.length}건`);
      rows.forEach((tr) => expect(tr.innerText, `로그인 아이디 ${USER_ID} 검색 결과`).to.include(`(${USER_ID})`));
    });
    // 없는 아이디로 검색 → 0건
    searchByLoginId('zz_no_such_user_zz');
    docRows().then(({ rows }) => expect(rows.length, '없는 아이디 검색 결과').to.eq(0));
    A.dumpScreen('B04_3_결재함_결재자');

    openTab('신청 결재', '/my-submissions');
    openTab('참조 결재');
  });
});
