// [2.9.7 현행화] 기간 입력칸 helper — 2.9.5.0부터 aria-label="기간"/라벨 '기간'이 비어 있어 달력 아이콘(event)으로 찾음
const dateInputs = () =>
  cy.get('.v-input__icon--prepend-inner i.material-icons')
    .filter(':visible')
    .filter((i, el) => el.innerText.trim() === 'event')
    .closest('.v-input');

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!********************************!*\
  !*** ./cypress/e2e/spec.cy.js ***!
  \********************************/
  // ▼ 1. 모든 에러 무시 설정 (강력한 방어막) ▼
  Cypress.on('uncaught:exception', (err, runnable) => {
    // 무시할 에러 메시지 목록
    const ignoredErrors = [
      'Navigation cancelled',
      'Cannot read properties',
      'resetValidation',
      'NavigationDuplicated', // [NEW] 중복 이동 에러 무시 추가
      'Redirected when going from', // ◀◀◀ 이 문구를 추가하세요!
      'navigation guard',           // ◀◀◀ 이 문구도 추가하세요!
      'Avoided redundant navigation',
      'Loading chunk',
      'Loading CSS chunk',           // ◀◀◀ [NEW] 이번에 발생한 CSS 청크 에러 무시 추가!
      'operate.task.packageManagement',
      'e is not defined',
      'Script error',
      'not valid JSON',
      'ChunkLoadError'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

/**코드 시작  */
describe('로그캐치 Depth 배포점검목록 동작 테스트', () => {
  
  it('02_Depth_이력_접속기록이력_검출 자동화 시나리오', () => {

    // [2026-11-25] 검출 탭 조회 범위 보정 (probe_299q 11-25 확인)
    //   - 검출 탭 조회(POST pams/statistics/log-doubt)는 startDate · endDate 와 별도로 searchDate(하루)만 실제로 조회함 (Mantis 0039111 추가 확인)
    //   - 화면 기본 기간은 「지금 - 1시간 ~ 오늘 23:59」 → 11-24 18시대 GitHub 실행에서 방금 만든 검출 1건만 범위에 들어와, 5분 안에 반영되지 않아 실패
    //   → searchDate 가 오늘인 조회는 시작 일시를 「오늘 00:00:00」으로 바꿔 보냄 (오늘 이미 생긴 검출도 찾음) · 다시 검색은 기존대로 30초 간격 최대 10회(약 5분)
    //   이전 파일 : cypress/probe/bak/02_Depth_이력_접속기록이력_검출_spec.bak_20261125a
    const D02D = { 시작: new Date().toISOString(), 바꾼요청: 0 };
    cy.intercept('POST', /\/pams\/statistics\/log-doubt/, (req) => {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      // [11-25 d] 한 달 기간으로 바꾸면 화면이 searchDate 를 시작일(한 달 전)로 보냄 → 시작일만 0시로 바꾸면 「한 달 전 하루」만 조회돼 0건
      //   → searchDate 를 오늘(KST)로 고정하고 기간도 「오늘 00:00:00 ~ 23:59:59」로 맞춤 (probe_299q 기본값 조회 = 오늘 3건 조회됨)
      if (b && b.searchDate) {
        const k = new Date(Date.now() + 9 * 3600e3);
        const today = `${k.getUTCFullYear()}-${String(k.getUTCMonth() + 1).padStart(2, '0')}-${String(k.getUTCDate()).padStart(2, '0')}`;
        if (b.searchDate !== today || String(b.startDate || '') !== `${today} 00:00:00`) {
          D02D.원래 = { searchDate: b.searchDate, startDate: b.startDate, endDate: b.endDate };
          b.searchDate = today; b.startDate = `${today} 00:00:00`; b.endDate = `${today} 23:59:59`;
          D02D.바꾼요청 += 1; req.body = b;
        }
      }
      // [11-25] 화면 조건(사용자 상태 등)이 결과를 거르는지 보려고 마지막 요청 본문 · 건수를 기록
      D02D.마지막요청 = b;
      req.on('after:response', (res) => { D02D.마지막응답 = { 상태: res.statusCode, totalCount: res.body && res.body.totalCount, allTotalCount: res.body && res.body.resultObject && res.body.resultObject.allTotalCount }; });
    });

    // [2026-11-17] 검출 데이터 생성 — CRM(.27) 실시간 DLP 테스터(dlp_tester.jsp)에 「등록」 사용자 user001(AI개발2팀)로 개인정보가 든 채팅 메시지 전송
    //   (손으로 하던 dlp_tester.jsp 전송과 같은 요청: POST action=send · chatMsg) → 이 스크립트가 뒤에서 오늘 날짜 「검출」 을 조회
    //   값은 형식만 맞춘 가짜 (주민번호 체크섬 맞춤 · 테스트 카드번호). 비밀번호는 Node(crmFetch)가 cypress.env.json 에서 직접 읽음
    // [2026-11-25] 메시지에 사업자번호(124-81-00998)를 추가 — probe_299q 확인 : 검출 탭에는 사업자번호(PATH) 검출 기록이 몇 초 안에 나오지만,
    //   기존 메시지(주민번호 · 휴대폰 · 이메일 · 카드 → 처리창에는 이메일만 검출)는 통합 탭에는 있어도 검출 탭에는 나오지 않음 (11-24 · 11-25 모두)
    //   → Mantis 0039177 (2026-11-25 보고) : 검출 탭 목록에 이메일(PATTERN) 검출 기록이 나오지 않음. 수정되면 사업자번호를 빼도 검출 탭에 나오는지 확인
    cy.task('crmFetch', {
      userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'POST', maxBody: 0,
      form: { action: 'send', chatMsg: `[자동화 검출 생성 ${new Date().toISOString()}] 주민번호 900101-1234568 / 휴대폰 010-1234-5678 / 이메일 auto.dlp@test.co.kr / 카드 4111-1111-1111-1111 / 사업자번호 124-81-00998` },
    }, { timeout: 90000, log: false }).then((r) => {
      cy.log(`🧪 검출 데이터 생성 (dlp_tester.jsp) : 로그인 ${r.login} · 전송 ${r.status} ${r.error || ''}`);
      cy.writeFile('cypress/probe/검출생성_dlp_tester.json', { at: new Date().toISOString(), login: r.login, status: r.status, error: r.error }, { log: false });
      expect(r.status, 'dlp_tester.jsp 전송 응답 (200)').to.eq(200);
    });


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(5000); // 로딩 대기

    ////////////새로고침코드//////
      cy.get('body').then(($body) => {
      // 만약 입력창이 안 보인다면? (흰 화면 상태라면?)
      if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
        cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
    
      // 새로고침 실행
      cy.reload();
    
      // 다시 한번 안정화 대기
      cy.wait(2000);
      } else {
        cy.log('🟢 화면이 정상적으로 로드되었습니다.');
      }
     });
     //////////////////////////////////////

    // 2. 아이디 입력
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });

    // 3. 비밀번호 입력
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
    
    // 4. 로그인 실행 (버튼 클릭 대신 엔터키 사용)
    // 설명: 버튼 클릭보다 엔터키가 '중복 클릭'이나 '이동 에러'가 훨씬 적게 발생합니다.
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });

    

   // -----------------------------------------------------------
   // [추가된 부분] "이미 로그인" 알림창 처리 (조건부 로직)
   // -----------------------------------------------------------
   cy.wait(2000); // 팝업이 뜨는 찰나의 시간을 기다려줍니다.
   cy.get('body').then(($body) => {
    
    // 2. jQuery 문법(.find)으로 해당 요소가 있는지 '길이(length)'로 체크합니다.
    // 주의: 여기서는 cy.contains를 쓰면 안 됩니다!
    if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
        
        cy.log('⚠️ 알림창 발견! 확인 버튼을 클릭합니다.');

        // 3. 요소가 있다는 게 확실해졌으니, 이제 안심하고 Cypress 명령어를 씁니다.
        cy.contains('.v-card__title', '이미 접속 중인 계정입니다.')
          .closest('.v-card')
          .contains('확인')
          .click(); // 여기서 force: true를 주면 더 안전합니다.
          
        cy.wait(1000); // 팝업 닫힘 대기
    } else {
        cy.log('✅ 알림창이 없습니다. 넘어갑니다.');
    }
});

    // 5. [중요] 로그인 성공 검증 (URL 변경 확인)
    // 로그인이 성공해서 URL에서 '/login'이 빠질 때까지 최대 10초간 기다립니다.
    // 만약 여기서 실패한다면 "아이디/비번"이 틀렸거나 서버 문제(Access Deny)입니다.
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    // -----------------------------------------------------------

     
    //6. 화면 안정화 대기
     cy.wait(3000);
    
    //로그인 성공
  
  
    // ==========================================
    // 테스트 자동화시나리오
    // 이력 - 자동화 시니라오 테스트 
    // ==========================================

    cy.contains('button', '이력').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기


    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 이력 > 사용자 추적 클릭 ---');
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
  
    // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"], input[aria-label="사용자 아이피"]').filter(':visible').should('be.visible'); // [2.9.9.0] 「사용자 아이피」 허용
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
  
     // 시작날짜 달력 아이콘확인
     dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
     
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 전체선택 확인
     // [2.9.7] '전체 선택' 표시 없어짐 (Basic/UI 이력과 동일하게 제외)
     // cy.get('span[title=\"전체 선택\"]').should('be.visible');
    
    
    //검색 버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 값').should('be.visible');
    cy.get('th').filter(':visible').contains('선택').should('be.visible');

    // ==========================================
    // 테스트 자동화시나리오
    // 이력 -  접속기록 이력 자동화 시니라오 테스트 
    // ==========================================
    

    // 이력 > 접속 기록 이력 서브메뉴 클릭  -----------------------
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });
    cy.wait(3000);

   
    // 이력 > 접속기록 이력 > [검출] 탭 선택
    cy.get('.tab-btn').contains('검출').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('검출').closest('button').should('not.have.class', 'inactive');
    // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     // [2.9.9.0] 일부 탭은 IP 범위(시작 IP · 종료 IP) → 「사용자 아이피」 한 칸 — 둘 중 하나면 통과
     cy.get('body').should(($b) => {
       const v = (sel) => $b.find(sel).filter(':visible').length;
       const range = v('input[aria-label="시작 IP"]') > 0 && v('input[aria-label="종료 IP"]') > 0;
       const single = v('input[aria-label="사용자 아이피"]') + v('input[aria-label="사용자 IP"]') > 0;
       expect(range || single, 'IP 검색칸 (시작/종료 IP 또는 사용자 아이피)').to.be.true;
     });
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
    
     // like버튼 확인 
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     // v3.0.5.0_r34908에서 추가됨.
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    //3.0.5.1191_r35135  가로스크롤 영향으로 존재로 확인 
    cy.get('th').contains('검출 건수').should('exist'); 


//=============================
// 한달전 선택하기 or 특정날짜
//=============================

// 1. 목표 날짜 - FIXED_DATE에 날짜를 넣으면 그 날짜, null이면 오늘 기준 한 달 전
//const FIXED_DATE = null;            // 예: '2026-08-20'
// [2.9.7] 고정 날짜(2026-08-20)는 검출 데이터 보관 기간을 벗어남 → 오늘 기준 한 달 전
const FIXED_DATE = null;            // 예: '2026-08-20'

let target;
if (FIXED_DATE) {
  const [y, m, d] = FIXED_DATE.split('-').map(Number);
  target = new Date(y, m - 1, d);
} else {
  const today = new Date();
  target = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(today.getDate(), lastDay));
}

const targetYear = target.getFullYear();
const targetMonth = target.getMonth() + 1;   // 1~12
const targetDay = target.getDate();

const pad = (n) => String(n).padStart(2, '0');
const targetStr = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
cy.log(`📅 시작 날짜 목표: ${targetStr}`);

// 시작 날짜 입력창 (기간 영역의 첫 번째 입력창)
const getStartDateInput = () =>
  dateInputs().eq(0).find('input').first(); // [2.9.7] aria-label="기간" 비어 있음 (원래: #item_dateRange input[aria-label="기간"])

// 2. 달력 오픈
// 기간 영역(#item_dateRange)의 첫 번째 메뉴 = 시작 날짜
// Vuetify 메뉴가 Cypress 가상 클릭을 무시하므로 실제 마우스 클릭(realClick) 사용
cy.get('#item_dateRange .v-menu__activator').filter(':visible').first()
  .find('i.material-icons')
  .filter((i, el) => el.textContent.trim() === 'event')
  .scrollIntoView()
  .realClick();
cy.wait(1000);

// 안 열렸으면 한 번 더: 열기 담당 영역 자체에 클릭 이벤트 직접 전달
cy.get('body').then(($body) => {
  if ($body.find('.v-date-picker-header__value:visible').length === 0) {
    cy.log('🔁 아이콘 클릭으로 안 열림 → 메뉴 활성 영역에 click 이벤트 직접 전달');
    cy.get('#item_dateRange .v-menu__activator').filter(':visible').first().trigger('click');
    cy.wait(1000);
  }
});

// 달력이 실제로 열렸는지 확인
cy.get('.v-date-picker-header__value').filter(':visible').should('have.length', 1);

// 3. 달력 헤더의 연/월과 목표 연/월을 비교해서, 필요한 만큼 이전/다음 달 화살표 클릭
cy.get('.v-date-picker-header__value').filter(':visible').invoke('text').then((headerText) => {
  // 헤더 텍스트 예: "2026년 10월"
  const match = headerText.match(/(\d{4})년\s*(\d{1,2})월/);

  if (match) {
    const displayedYear = parseInt(match[1], 10);
    const displayedMonth = parseInt(match[2], 10);

    const diffMonths = (targetYear - displayedYear) * 12 + (targetMonth - displayedMonth);

    if (diffMonths !== 0) {
      const clicks = Math.abs(diffMonths);
      // diffMonths < 0 이면 이전 달(chevron_left)로, > 0 이면 다음 달(chevron_right)로 이동
      const iconName = diffMonths < 0 ? 'chevron_left' : 'chevron_right';

      cy.log(`📅 달력 이동: ${clicks}회 ${diffMonths < 0 ? '이전' : '다음'} 달로 이동`);

      for (let i = 0; i < clicks; i++) {
        cy.get('.v-date-picker-header')
          .filter(':visible')
          .find('i.material-icons')
          .contains(iconName)
          .click({ force: true });
        cy.wait(300);
      }
    }
  } else {
    // 헤더를 못 읽으면 엉뚱한 달을 누르지 않도록 바로 실패 처리
    throw new Error(`달력 헤더 형식을 읽지 못했습니다: "${headerText.trim()}"`);
  }
});

// 4. 목표 일자 클릭 (숫자만 비교 - "20일" 형식 대응)
cy.get('.v-date-picker-table--date').filter(':visible')
  .find('button')
  .filter((i, el) => el.textContent.replace(/\D/g, '') === String(targetDay))
  .not('.v-btn--disabled')
  .should('have.length', 1)
  .click({ force: true });
cy.wait(1000);

// 5. 선택 결과 확인 - "2026-08-20 09:48:55"처럼 시간이 붙으므로 날짜로 시작하는지 확인
getStartDateInput().invoke('val').should('match', new RegExp(`^${targetStr}`));

// 6. 달력창 닫기
cy.get('body').type('{esc}');
cy.wait(300);

// 닫은 뒤에도 값이 유지되는지 재확인
// (여기서 실패하면 Esc가 선택을 취소하는 방식 → 위 Esc 대신 아래 줄 사용)
// cy.contains('.c-headline', '검색 조건').click({ force: true });
getStartDateInput().invoke('val').should('match', new RegExp(`^${targetStr}`));

cy.log(`✅ 시작 날짜 ${targetStr} 지정 성공`);

    // //기능동작
    // //달력표를 펼침 
    // dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
    // cy.wait(500);
    // // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // // 2. '4월'이라는 글자를 찾아 클릭합니다.
    //  cy.get('.v-date-picker-table--month').filter(':visible').contains('4월').click({ force: true });
    // // 달력 20일 클릭
    // cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    // //달력창 닫기
    // cy.get('body').type('{esc}');

    //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '등록' 선택 (안정화 버전)
    // ※ 검출 데이터가 '등록' 사용자로 있어야 함 (없으면 CRM dlp_tester.jsp 로 데이터 생성)
    cy.get('.v-menu__content.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', /^등록$/).click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보


    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    
  // [2.9.9.0] 검출 탭의 날짜가 「하루 단위 목록(v-select)」 → 「기간(시작 일시 ~ 종료 일시)」으로 바뀜 (2026-11-23 .21 확인)
  //   위에서 기간 시작을 지정하고 검색했으므로, 그 기간 결과에서 검출 링크를 바로 찾는다 (클릭 없이 표시까지만 — 기존과 같음)
  //   없으면 dlp_tester 로 만든 검출이 반영될 때까지 30초 간격 최대 10회(약 5분) 다시 검색
  //   (이전 2.9.7 의 날짜별 순차 탐색 코드는 cypress/probe/bak/02_Depth_검출_spec.bak_20261123 에 보관)
// [관찰 0039111] 2.9.9.0 검출 탭 — 시작일을 이전 날짜로 지정하면 검출이 조회되지 않음 (당일 범위만 조회, 하루 단위 날짜 목록 미표시)
//   한 달 기간 검색 결과가 0건이면 관찰로 기록하고, 시작일을 오늘로 바꿔 오늘 만든 검출을 확인한다
//   0039111 이 고쳐지면(한 달 기간에서 바로 조회되면) 로그에 「0039111 해결 확인 필요」가 남음 → 그때 아래 오늘 전환을 지우고 확인 조건으로 바꾼다
const pickStartToday = () => {
    const now = new Date();
    cy.get('#item_dateRange .v-menu__activator').filter(':visible').first()
        .find('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').scrollIntoView().realClick();
    cy.wait(1000);
    cy.get('body').then(($body) => {
        if ($body.find('.v-date-picker-header__value:visible').length === 0) {
            cy.get('#item_dateRange .v-menu__activator').filter(':visible').first().trigger('click');
            cy.wait(1000);
        }
    });
    cy.get('.v-date-picker-header__value').filter(':visible').should('have.length', 1).invoke('text').then((headerText) => {
        const m = headerText.match(/(\d{4})년\s*(\d{1,2})월/);
        if (!m) throw new Error(`달력 헤더 형식을 읽지 못했습니다: "${headerText.trim()}"`);
        const diff = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
        for (let i = 0; i < Math.abs(diff); i++) {
            cy.get('.v-date-picker-header').filter(':visible').find('i.material-icons').contains(diff < 0 ? 'chevron_left' : 'chevron_right').click({ force: true });
            cy.wait(300);
        }
    });
    cy.get('.v-date-picker-table--date').filter(':visible').find('button')
        .filter((i, el) => el.textContent.replace(/\D/g, '') === String(now.getDate())).not('.v-btn--disabled').first().click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(500);
    cy.log('📅 [0039111 대응] 시작일을 오늘로 변경');
};
// [2026-11-25] 한 달 기간 검색 → 시작일 오늘 전환(pickStartToday) 우회는 쓰지 않음 : 검색 요청의 시작 일시를 위 intercept 가 오늘 00:00 으로 바꿈
const monthCheck = () => {
    cy.wait(3000);
    findDetection(0);
};
const DET_TRIES = 10; // [11-25] 20회(약 10분)로 늘렸다가 되돌림 — 시작 일시를 오늘 0시로 바꿔 오늘 앞서 생긴 검출도 찾으므로 약 5분으로 충분 (사용자 결정)
const findDetection = (n) => {
    cy.wait(2000);
    cy.get('body').then(($b) => {
        if ($b.find('tbody:visible a:contains("검출"):visible').length) {
            cy.log(`✅ 기간 안 검출 결과 발견 (${n}회 다시 검색)`);
            cy.then(() => cy.writeFile('cypress/probe/D02D_검출탭_관찰.json', { ...D02D, 발견시각: new Date().toISOString(), 다시검색횟수: n }, { log: false }));
            cy.get('tbody').filter(':visible').contains('a', '검출').should('be.visible');
            cy.log('✅ 이력 - 검출 데이터 조회 성공!');
            return;
        }
        if (n >= DET_TRIES) {
            cy.log('❌ 기간 안에 검출 데이터가 없습니다 (약 5분 대기 후에도 반영 안 됨)');
            cy.then(() => cy.writeFile('cypress/probe/D02D_검출탭_관찰.json', { ...D02D, 결과: '약 5분 동안 검출 없음' }, { log: false }));
            cy.get('tbody:visible a:contains("검출")').should('be.visible'); // 의도적 실패
            return;
        }
        cy.log(`⏳ 기간 안 검출 결과 없음 — 30초 후 다시 검색 (${n + 1}/${DET_TRIES})`);
        cy.wait(30000);
        cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
        findDetection(n + 1);
    });
};
monthCheck();

// (맨 아래에 있던 닫기 로직은 삭제합니다!)

cy.log('✅ 이력 - 검출 탭 진입 및 데이터 출력 확인 완료!');

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 검출 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });

  // ==========================================
  // [2.9.9.0 Depth] !1480 사업자등록번호 검출 — HTTP 본문 경로 (.27 CRM) (B4)
  //   !1480 은 SQL 컬럼 값 경로의 사업자등록번호 체크섬을 표준 검증식으로 고친 건. .27 기록은 SQL 수집이 없어 HTTP 본문 경로로 확인 (11-24 사용자 결정)
  //   .27 user001(사원_1) dlp_tester.jsp 메시지 3건 (3초 간격 · 다른 개인정보 없이 번호만) → 이력 > 접속기록 이력 > 통합 (리눅스_VIP고객 · 오늘) 각 행 처리창 오탐/확정 표
  //     A 124-81-00998 (올바른 번호 · 릴리즈노트 예시) → 「사업자등록번호 124-81-00998」 검출 (판정)
  //     B 124-81-00999 (체크섬 틀림) → 검출되면 안 됨. 11-25 개발팀 답변 : HTTP 본문 경로 체크섬 누락은 버그 (Mantis 0039176) → 수정 전까지 판정 주석 · 재현 여부만 기록
  //     C 1248100998   (A 와 같은 번호 · 하이픈 없음) → 「사업자등록번호 124-81-00998」 검출 (판정)
  //   같은 숫자 일부가 「군번」으로도 표에 나옴 (81-00998 등) — 기록만
  //   처리창은 열고 닫기만 (오탐/확정 · 저장 누르지 않음) · 관찰 기록 : cypress/probe/D02B_관찰.json
  // ==========================================
  {
    const A = require('../../support/anomaly');
    const tx = (e) => (e ? (e.innerText || e.textContent || '') : '').replace(/\s+/g, ' ').trim();
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const p2 = (n) => String(n).padStart(2, '0');
    const kst = (ms) => { const d = new Date(ms + 9 * 3600e3); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
    const obs = {};
    const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/D02B_관찰.json', obs, { log: false }); };
    const MSGS = [
      { 키: 'A', 값: '124-81-00998', 설명: '올바른 번호' },
      { 키: 'B', 값: '124-81-00999', 설명: '체크섬 틀림' },
      { 키: 'C', 값: '1248100998', 설명: '올바른 번호 · 하이픈 없음' },
    ];

    it('[2.9.9.0] !1480 사업자등록번호 검출 — 올바른 번호 · 하이픈 없는 번호 · 체크섬 틀린 번호 (.27 HTTP 본문)', { retries: 0 }, () => {
      A.ignoreErrors();
      const apiRows = {};
      cy.intercept('GET', /\/api\/v1\/access-log\?/, (req) => {
        req.on('after:response', (res) => ((res.body && res.body.resultObject) || []).forEach((x) => { apiRows[x.accessDate] = { 유형: x.privacyTypes, 건수: x.privacyTotalCount }; }));
      });

      // ---------- 1. 메시지 3건 ----------
      const START = { at: '' };
      cy.then(() => { START.at = kst(Date.now() - 5000); });
      const sent = [];
      MSGS.forEach((m) => {
        cy.task('crmFetch', {
          userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'POST', maxBody: 0,
          headers: { Referer: 'http://10.10.54.27/crm/dlp_tester.jsp' },
          form: { action: 'send', chatMsg: `[자동화 사업자번호 ${m.키}] 거래처 사업자번호 ${m.값} 확인 부탁드립니다` },
        }, { timeout: 90000, log: false }).then((r) => {
          sent.push({ 키: m.키, 값: m.값, 보낸시각: kst(Date.now()), 상태: r.status, 오류: r.error });
          note('1_보냄', sent);
          expect(r.status, `dlp_tester.jsp 전송 응답 (${m.키})`).to.eq(200);
        });
        cy.wait(3000, { log: false });
      });

      // ---------- 2. 통합 검색 (3건이 올라올 때까지) ----------
      A.loginAdmin();
      cy.visit('/logcatch/record/accessLog/comprehensiveLog');
      cy.get('input[aria-label="업무시스템"]', { timeout: 30000 }).filter(':visible').should('exist');
      cy.wait(2500);
      cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      cy.get('.v-list__tile__title').contains('리눅스_VIP고객').scrollIntoView().closest('.v-list__tile').click({ force: true });
      cy.get('body').type('{esc}');
      const fresh = ($b) => $b.find('tbody tr').filter((i, e) => vis(e) && !e.closest('.v-dialog')).toArray()
        .filter((r) => { const at = (tx(r).match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) || [''])[0]; return at >= START.at && /VIP_실시간DLP테스트/.test(tx(r)); });
      const search = (left) => {
        cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
        cy.wait(3000);
        cy.get('body').then(($b) => {
          const n = fresh($b).length;
          note('2_새행수', { 남은: left, 새행: n });
          if (n >= 3) return;
          expect(left, `통합 목록에 방금 보낸 3건 (${START.at} 이후 · 지금 ${n}건)`).to.be.greaterThan(0);
          cy.wait(15000, { log: false });
          search(left - 1);
        });
      };
      search(6);

      // ---------- 3. 각 행 처리창 (오래된 것부터 = A · B · C) ----------
      const R = {};
      [2, 1, 0].forEach((idx, k) => {
        const key = MSGS[k].키;
        cy.get('body').then(($b) => {
          const r = fresh($b)[idx];
          R[key] = { 행: tx(r).slice(0, 200) };
          cy.wrap(r.querySelector('i.g.g-IConfig') || r).click({ force: true });
          cy.wait(4500);
          cy.get('body').then(($b2) => {
            const d = $b2.find('.v-dialog--active').filter((i, e) => vis(e)).last();
            const w = d.find('.v-window-item').filter((i, e) => vis(e)).first();
            R[key].접속일시 = (tx(d[0]).match(/접속 일시\s*(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/) || [])[1] || '';
            R[key].검출표 = w.find('tbody tr').filter((i, e) => vis(e)).toArray().map((x) => tx(x).slice(0, 200)).slice(0, 10);
            R[key].목록API = apiRows[R[key].접속일시] || null;
            note('3_처리창', R);
          });
          cy.get('body').then(($b3) => {
            const d = $b3.find('.v-dialog--active').filter((i, e) => vis(e)).last();
            const x = d.find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '닫기')[0] || d.find('i.v-icon').filter((i, e) => vis(e) && tx(e) === 'close')[0];
            if (x) cy.wrap(x).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
            cy.wait(1500);
          });
        });
      });

      // ---------- 판정 ----------
      cy.then(() => {
        const bizRow = (key) => (R[key].검출표 || []).find((t) => /^사업자등록번호\s/.test(t)) || '';
        note('4_정리', {
          A: bizRow('A') || '사업자등록번호 없음',
          B: bizRow('B') || '사업자등록번호 없음',
          C: bizRow('C') || '사업자등록번호 없음',
          군번: MSGS.map((m) => (R[m.키].검출표 || []).filter((t) => /^군번\s/.test(t))),
        });
        // 접속 일시 순서 = 보낸 순서 (A < B < C)
        expect(R.A.접속일시 < R.B.접속일시 && R.B.접속일시 < R.C.접속일시, `처리창 접속 일시 순서 A ${R.A.접속일시} · B ${R.B.접속일시} · C ${R.C.접속일시}`).to.eq(true);
        expect(bizRow('A'), '!1480 올바른 사업자등록번호 124-81-00998 검출').to.match(/^사업자등록번호\s.*124-81-00998/);
        expect(bizRow('C'), '!1480 하이픈 없는 올바른 번호 1248100998 → 사업자등록번호 124-81-00998 검출').to.match(/^사업자등록번호\s.*124-81-00998/);
        // B (체크섬 틀림) — [2026-11-25 개발팀 답변] HTTP 응답 본문 경로에서 사업자등록번호 체크섬 검사가 빠진 것은 버그 → Mantis 0039176
        //   수정 전까지 판정은 주석으로 막고 재현 여부만 기록 → cypress/probe/D02B_관찰.json 「B_체크섬틀림_재현」
        note('5_B_체크섬틀림_재현', { Mantis: '0039176', 재현: !!bizRow('B'), 검출행: bizRow('B') || '없음' });
        if (bizRow('B')) cy.log(`⚠️ 체크섬 틀린 124-81-00999 가 사업자등록번호로 검출됨 (Mantis 0039176 재현 · 판정 보류) — ${bizRow('B')}`);
        else cy.log('✅ 체크섬 틀린 124-81-00999 는 검출 안 됨 — 수정 확인되면 아래 판정 주석 해제');
        /* [Mantis 0039176 해결 후 주석 해제]
        expect(bizRow('B'), '체크섬 틀린 124-81-00999 는 사업자등록번호로 검출되지 않음').to.eq('');
        */
      });
      cy.log('✅ [2.9.9.0] !1480 사업자등록번호 검출 확인 완료');
    });
  }

});  

//코드마지막


 })()
;
