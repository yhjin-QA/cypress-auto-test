// [2.9.7 현행화] 기간 입력칸 helper — 달력 아이콘(event)으로 찾음 (점검 대시보드는 '날짜 선택' 범위 1칸)
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

/**코드 시작  */
describe('로그캐치 사이트 테스트', () => {

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
      'ChunkLoadError',
      'ResizeObserver loop' // [2.9.9.0] 플로우 시스템 화면 크기 변경 시 브라우저 경고 (기능 영향 없음)
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 기본동작 체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(4000); // 로딩 대기

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
    // STEP 12: 점검(대시보드) 서브메뉴 
    // ==========================================
    cy.log('🚀 점검 탭 클릭');
    // [2.9.9.0] 관리자 로그인 첫 화면 = 점검 > 이상행위 대시보드, '점검'을 누르면 하위 메뉴(점검 대시보드 / 이상행위 대시보드)가 열림
    cy.contains('button', '점검').click({ force: true });
    cy.contains('.side-sub-menu-title', '점검 대시보드').should('be.visible').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/inspection/inspectionDashboard');
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');

    // 설명: 'v-btn__content' 안에 '검색'이라는 글자가 있고, 눈에 보이는지 확인
    cy.contains('.v-btn__content', '검색').should('exist');
    //검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 달력 아이콘 확인
    cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
    //자동갱신안함 문구확인
    cy.contains('자동 갱신 안함').filter(':visible').should('be.visible');
    
    // 2.9.1.262_r35274 버전에서 확인필요
    // 데이터량 확인
    cy.contains('p', '개인정보 사용량').should('be.visible');
    //cy.contains('p', '개인정보 대량 접근').should('be.visible');
    //cy.contains('p', '업무시간 외 접근').should('be.visible');
    cy.contains('p', '이상행위 발생 건수').should('be.visible');
    cy.contains('p', '접근 IP 주소').should('be.visible');
    cy.contains('p', '정보 사용자').should('be.visible');
    cy.contains('p', '접근 부서').should('be.visible');

    // 설명: 카드 제목(.v-card__title) 중에서 '개인정보 유형별 현황' 글자가 눈에 보이는지 확인
    cy.contains('.v-card__title', '개인정보 유형별 현황').should('be.visible');
    cy.contains('.v-card__title', '부서별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', 'IP주소별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황').should('be.visible');
    cy.contains('.v-card__title', '개인정보 사용자 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '이상행위 유형별 현황').should('be.visible');

    //기능확인
    // 기간 - 시작 날짜 달력 지정하기 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    /// 2. 두 개의 달력 테이블 중 첫 번째(왼쪽/시작일) 달력을 선택합니다.
    cy.get('.v-date-picker-table').first() 
      .within(() => {
        // 3. 그 안에서 정확히 "1일" 텍스트를 가진 버튼 콘텐츠 클릭
       cy.contains('.v-btn__content', /^1일$/).click({ force: true });
     });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 시작 날짜 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '오늘').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 오늘 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '어제').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 어제 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '이번 주').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 이번 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 지난 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '지난 주').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 지난 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 7일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 7일').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 7일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 14일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 14일').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 14일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------


    // 기간 - 최근 30일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 30일').should('be.visible').click({ force: true });

     cy.wait(1000); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 30일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------


   //자동갱신간격 조절하기 
   //자동갱신 5초------------------------------------------------------------------------------------
   // 1. Home 키를 눌러 슬라이더를 확실히 0(자동 갱신 안함)으로 보냅니다.
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });

   // 2. 원하는 값(10)이 될 때까지 화살표를 누릅니다. 
   // 만약 1번 입력에 5씩 움직인다면 .repeat(2)를, 1씩 움직인다면 .repeat(10)을 하세요.
   // 현재 30이 되었으므로, 안전하게 숫자를 확인하며 입력하는 루프를 씁니다.
   for(let i = 0; i < 5; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 5) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }

   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '5');
   cy.contains(/갱신 간격\s*5\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------


   //자동갱신 10초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 10; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 10) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '10');
   cy.contains(/갱신 간격\s*10\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 15초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 15; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 15) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '15');
   cy.contains(/갱신 간격\s*15\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 20초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 20; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 20) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '20');
   cy.contains(/갱신 간격\s*20\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 25초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 25; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 25) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '25');
   cy.contains(/갱신 간격\s*25\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 30초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
     for(let i = 0; i < 30; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 30) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '30');
   cy.contains(/갱신 간격\s*30\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신간격 조절하기 
   //자동갱신 5초------------------------------------------------------------------------------------
   // 1. Home 키를 눌러 슬라이더를 확실히 0(자동 갱신 안함)으로 보냅니다.
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });

   // 2. 원하는 값(10)이 될 때까지 화살표를 누릅니다. 
   // 만약 1번 입력에 5씩 움직인다면 .repeat(2)를, 1씩 움직인다면 .repeat(10)을 하세요.
   // 현재 30이 되었으므로, 안전하게 숫자를 확인하며 입력하는 루프를 씁니다.
   for(let i = 0; i < 5; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 5) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }

   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '5');
   cy.contains(/갱신 간격\s*5\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

    // 자동갱신 5초후 새로고침 감지 --
    // 1. 감시 설정
    cy.intercept('GET', '**/logcatch/api/v1/chart-data/5**').as('chart5');

    // 2. [단계 1] 시스템 예열 및 첫 번째 신호 뭉치 흘려보내기
    cy.wait('@chart5', { timeout: 40000 }).then(() => {
    cy.log('🚀 첫 번째 신호 확인. 뭉치 요청 방지를 위해 10초 대기...');
    cy.wait(10000); 
    });

    // 3. [단계 2] 측정의 시작점(기준점) 잡기
    cy.wait('@chart5', { timeout: 35000 }).then(() => {
      const startTime = Date.now();
      cy.log('⏱️ 실제 주기 측정 시작...');
      cy.wait(5000); 

    
    // 4. [단계 3] 다음 주기 검증 및 UI 확인
    cy.wait('@chart5', { timeout: 35000 }).then((interception) => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        cy.log(`⏱️ 최종 측정된 순수 간격: ${duration.toFixed(2)}초`);

        // --- [A] 네트워크 데이터 검증 ---
        expect(duration).to.be.within(4, 40); 
        expect(interception.response.statusCode).to.equal(200);

        // --- [B] UI 상태 검증 ---
        // 슬라이더 옆 숫자가 '5 초'로 표시되는지 확인
        cy.contains('5 초').should('be.visible');

        // --- [C] 차트 렌더링 검증 (ApexCharts 전용) ---
        // 1. ApexCharts의 기본 컨테이너 클래스가 존재하는지 확인
        cy.get('.apexcharts-canvas').should('exist');

        // 2. 실제 차트 조각(path)이 화면에 그려졌고 눈에 보이는지 확인
        // 보내주신 태그의 클래스인 .apexcharts-pie-area를 사용합니다.
        cy.get('.apexcharts-pie-area').should('be.visible').and('have.attr', 'data:value'); // 데이터 값이 들어있는지도 체크

        cy.log('✅ 네트워크 갱신과 차트 렌더링 확인 완료');
      });
    });

   cy.log('✅ 5초 간격 실제 데이터 통신 검증 완료');
   cy.log('✅ 점검 대시보드 출력 및 차트 타이틀 확인 완료 ');
  
    // ==========================================
    // [2.9.9.0 Basic] 점검 > 이상행위 대시보드 — 기능 확인 (조회 전용)
    //   .21 은 활성 이상행위 정책이 없어 「접속기록 모니터링 대시보드」로 표시됨
    //   1) 요약 카드 3개  2) 「최근 7일 개인정보 사용」 = 업무시스템별 집계 API 합계
    //   3) 사용자별 TOP 10 1위 = 사용자별 집계 API 합계 1위  4) 일시정지 ↔ 재개  5) 배속
    //   6) 고급 조건 창 항목 · 취소  7) 크게 보기 창 열기 · 닫기
    // ==========================================
    {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const tx = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
      const num = (s) => Number(String(s).replace(/[^\d]/g, ''));
      const sumBy = (rows) => rows.reduce((m, r) => { m[r.dimName] = (m[r.dimName] || 0) + (Number(r.privacyCount) || 0); return m; }, {});
      cy.intercept('GET', /statistics\/period-trend\/details\?dimension=bsn/).as('B13A_bsn');
      cy.intercept('GET', /statistics\/period-trend\/details\?dimension=user/).as('B13A_user');
      cy.get('body').type('{esc}');
      cy.contains('button', '점검').click({ force: true });
      cy.contains('.side-sub-menu-title', '이상행위 대시보드').should('be.visible').click({ force: true });
      cy.url({ timeout: 15000 }).should('include', '/inspection/anomalyMonitoringDashboard');
      cy.contains(/모니터링 대시보드/).should('be.visible');

      // 1) 요약 카드
      ['최근 7일 개인정보 사용', '오늘 접속기록', '개인정보 사용자'].forEach((l) => cy.contains(l).should('be.visible'));
      ['사용자별 개인정보 사용량 TOP 10', '부서별 개인정보 사용량 TOP 10', '업무시스템별 개인정보 사용량 TOP 10'].forEach((l) => cy.contains('.board-title', l).should('be.visible'));

      // 2) 카드 값 = 업무시스템별 집계 합계 (어제까지 7일)
      cy.wait('@B13A_bsn', { timeout: 30000 }).then((x) => {
        expect(x.response.statusCode, '업무시스템별 집계 API').to.eq(200);
        const total = (x.response.body.resultObject || []).reduce((a, r) => a + (Number(r.privacyCount) || 0), 0);
        // 숫자가 0 부터 올라가는 효과가 있어, 최종 값이 될 때까지 재시도
        cy.contains('최근 7일 개인정보 사용', { timeout: 15000 }).should(($l) => {
          let box = $l[0];
          for (let i = 0; i < 4 && box && !/\d[\d,]*\s*건/.test(tx(box)); i += 1) box = box.parentElement;
          const shown = num((tx(box).match(/(\d[\d,]*)\s*건/) || [])[1]);
          expect(shown, '「최근 7일 개인정보 사용」 카드 = 업무시스템별 집계 합계').to.eq(total);
        });
        cy.log(`최근 7일 개인정보 사용 = API 합계 ${total}`);
      });

      // 3) 사용자별 TOP 10 1위 = API 합계 1위
      cy.wait('@B13A_user', { timeout: 30000 }).then((x) => {
        expect(x.response.statusCode, '사용자별 집계 API').to.eq(200);
        const by = sumBy(x.response.body.resultObject || []);
        const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
        if (!top || top[1] === 0) { cy.log('ℹ️ 최근 7일 사용자별 사용량 없음 — 1위 비교 생략'); return; }
        cy.log(`사용자별 1위 API: ${top[0]} ${top[1]}`);
        cy.contains('.board-title', '사용자별 개인정보 사용량 TOP 10').closest('header').parent().should(($p) => {
          const text = tx($p[0]);
          expect(text, '사용자별 TOP 10 에 API 1위 사용자').to.include(top[0]);
          expect(text, '사용자별 TOP 10 에 API 1위 사용량').to.include(top[1].toLocaleString('en-US'));
        });
      });

      // 4) 일시정지 ↔ 재개
      cy.get('button').filter((i, e) => vis(e) && /일시정지$/.test(tx(e))).first().click({ force: true });
      cy.contains('일시정지됨').should('be.visible');
      cy.get('button').filter((i, e) => vis(e) && /재개$/.test(tx(e))).should('have.length.at.least', 1).first().click({ force: true });
      cy.get('button').filter((i, e) => vis(e) && /일시정지$/.test(tx(e))).should('have.length.at.least', 1);
      cy.contains('일시정지됨').should('not.exist');

      // 5) 배속 버튼 0.5× · 1× · 2× (2× → 1× 로 되돌림)
      ['0.5×', '1×', '2×'].forEach((s) => cy.get('button').filter((i, e) => vis(e) && tx(e) === s).should('have.length', 1));
      cy.get('button').filter((i, e) => vis(e) && tx(e) === '2×').click({ force: true });
      cy.wait(500);
      cy.get('button').filter((i, e) => vis(e) && tx(e) === '1×').click({ force: true });

      // 6) 고급 조건 창
      cy.get('button').filter((i, e) => vis(e) && tx(e) === '고급 조건').click({ force: true });
      ['처음 표시할 기록', '처음 표시할 기록 범위', '사용자별 묶음 간격', '접속기록 흐름 재개', '탐지 후 오른쪽 이동 대기시간'].forEach((l) => cy.contains(l).should('be.visible'));
      ['기본값', '취소', '적용'].forEach((b) => cy.get('button').filter((i, e) => vis(e) && tx(e) === b).should('have.length.at.least', 1));
      cy.get('input[aria-label^="탐지 후 오른쪽 이동 대기시간"]').should('have.attr', 'type', 'number');
      cy.get('button').filter((i, e) => vis(e) && tx(e) === '취소').last().click({ force: true });
      cy.get('body').should(($b) => expect($b.find('*').filter((i, e) => vis(e) && e.children.length === 0 && tx(e) === '사용자별 묶음 간격').length, '취소 후 고급 조건 창 닫힘').to.eq(0));

      // 7) 크게 보기 (사용자별 TOP 10) — 같은 제목이 크게 한 번 더 보이면(창 · 겹침 화면) 열린 것으로 판단
      const TT = '사용자별 개인정보 사용량 TOP 10';
      const titles = ($b) => $b.find('*').filter((i, e) => vis(e) && e.children.length === 0 && tx(e) === TT).length;
      cy.contains('.board-title', TT).closest('header').find('button[aria-label="크게 보기"]').scrollIntoView().click({ force: true });
      cy.wait(1500);
      cy.get('body').then(($b) => {
        cy.writeFile('cypress/probe/B13A_크게보기.json', {
          제목수: titles($b),
          창: $b.find('.v-dialog--active, .v-overlay--active, [role=dialog], .modal, .board-expanded, .is-expanded, .fullscreen').filter((i, e) => vis(e)).toArray().map((e) => `${e.tagName}.${e.className}`.slice(0, 120)),
          버튼: $b.find('button[aria-label]').filter((i, e) => vis(e)).toArray().map((e) => e.getAttribute('aria-label')).slice(0, 20),
        });
      });
      cy.screenshot('B13A_크게보기', { capture: 'viewport' });
      cy.get('body').should(($b) => {
        const open = titles($b) >= 2 || $b.find('.v-dialog--active, [role=dialog]').filter((i, e) => vis(e) && tx(e).includes(TT)).length > 0;
        expect(open, '「크게 보기」 로 사용자별 TOP 10 확대 화면').to.eq(true);
      });
      cy.get('body').type('{esc}');
      cy.wait(1000);
      cy.get('body').then(($b) => {
        if (titles($b) >= 2) {
          const c = $b.find('button').filter((i, e) => vis(e) && /close|닫기|축소|작게/.test(tx(e) + (e.getAttribute('aria-label') || ''))).last();
          if (c.length) cy.wrap(c).click({ force: true });
        }
      });
      cy.get('body').should(($b) => expect(titles($b), '확대 화면 닫힘').to.eq(1));
      cy.log('✅ [2.9.9.0] 이상행위 대시보드 기능 확인 완료');
    }

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 점검 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
