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
      'Avoided redundant navigation',
      'Loading chunk',
      'operate.task.packageManagement',
      'e is not defined',
      'Script error',
      'not valid JSON'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 배포점검목록 동작 체크', () => {

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
    // 점검(대시보드) 서브메뉴 
    // ==========================================
    cy.log('🚀 점검 탭 클릭');
    cy.contains('button', '점검').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');

    // 설명: 'v-btn__content' 안에 '검색'이라는 글자가 있고, 눈에 보이는지 확인
    cy.contains('.v-btn__content', '검색').should('exist');
    //검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 달력 아이콘 확인
    cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
    //자동갱신안함 문구확인
    cy.contains('.item-margin', '자동 갱신 안함').should('be.visible');
    // 데이터량 확인
    cy.contains('p', '개인정보 사용량').should('be.visible');
    cy.contains('p', '개인정보 대량 접근').should('be.visible');
    cy.contains('p', '업무시간 외 접근').should('be.visible');
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


    // 기간 - 시작 날짜 달력 지정하기 -------------------------------------------------
    // 1. 날짜 선택 (2월 1일로 선택)
    cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
    cy.wait(500)

    // 2. 두 개의 달력 테이블 중 첫 번째(왼쪽/시작일) 달력을 선택합니다.
    // 1. 상단 제목('2026년 3월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // 주의: 테이블 밖의 전체 영역에서 첫 번째 헤더 버튼을 찾습니다.
    cy.get('.v-date-picker-header__value button').filter(':visible').first().click({ force: true });
    cy.wait(500); // 월 선택 모드로 애니메이션이 전환될 시간 대기

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').first().contains('button', '2월').click({ force: true });
    cy.wait(500); // 다시 '일' 선택 달력으로 돌아올 시간 대기

    // 3. '1일'을 클릭합니다.
    cy.get('.v-date-picker-table').filter(':visible').first().contains('.v-btn__content', /^1일$/).closest('button').click({ force: true });
    cy.wait(500); 
    cy.get('body').type('{esc}');
    cy.log('✅ 시작 날짜(2/1) 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '오늘').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 오늘 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '어제').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 어제 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '이번 주').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 이번 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 지난 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '지난 주').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 지난 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 7일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 7일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 7일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 14일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 14일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 14일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------


    // 기간 - 최근 30일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     cy.get('input[aria-label*="날짜 선택"]').click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 30일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
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
   cy.contains('.item-margin', '5', { timeout: 5000 }).should('be.visible');
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
   cy.contains('.item-margin', '10', { timeout: 5000 }).should('be.visible');
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
   cy.contains('.item-margin', '15', { timeout: 5000 }).should('be.visible');
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
   cy.contains('.item-margin', '20', { timeout: 5000 }).should('be.visible');
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
   cy.contains('.item-margin', '25', { timeout: 5000 }).should('be.visible');
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
   cy.contains('.item-margin', '30', { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   // ==========================================
   // 점검 대시보트 차트 상세페이지 이동  
   // ==========================================


   // 맨티스 이슈 : 37330
   // 개인정보 유형별 현황 → [이력 > 접속기록 이력 > 통합] 으로 이동되어야하지만 이상행위로 이동되는 문제
   // 개인정보 유형별 현황 영역의 [휴대전화번호] 클릭하여 상세페이지로 이동-------------------------------------------
   // 'apexcharts-legend-text' 클래스를 가진 span 태그 중 '휴대전화번호'를 찾아 클릭합니다.
   cy.contains('span.apexcharts-legend-text', '휴대전화번호').should('be.visible').click({ force: true });
   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 이력 - 접속기록 이력 - 이상행위 화면 상세 페이지 이동검증
   cy.get('.tab-btn').contains('이상행위').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '이상행위').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 이력 - 접속기록 이력 - 이상행위 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------

   // 부서별 개인정보 사용 Top 10영역의 인사팀의 그래프 클릭하여 상세페이지로 이동-------------------------------------------
   // 'apexcharts-legend-text' 클래스를 가진 span 태그 중 '휴대전화번호'를 찾아 클릭합니다.
   cy.get('path.apexcharts-bar-area').first().click({ force: true });
   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 화면 현황- 부서별 상세 페이지 이동검증
   cy.get('.tab-btn').contains('부서 별').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '검색 조건').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 현황- 부서별 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------
   
   // IP 주소별 개인정보 사용 TOP 10 클릭하여 상세페이지로 이동-------------------------------------------
   // 10.10.54.5 영역 클릭하기
   // (가운데 있는 가장 큰 파란색 글씨가 클릭됩니다!)
   cy.get('canvas[data-zr-dom-id="zr_0"]').filter(':visible').click('center', { force: true });
   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 화면 현황- 정보사용자 별 상세 페이지 이동검증
   cy.get('.tab-btn').contains('정보사용자 별').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '검색 조건').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 현황- 정보사용자 별 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------

   // 업무 시스템 별 개인정보 사용현황 클릭하여 상세페이지로 이동-------------------------------------------
   // 리눅스_배송관리 클릭하기
   // 'apexcharts-legend-text' 클래스를 가진 span 중 첫번쨰 '리눅스_배송관리'를 클릭합니다.
   // 1. 차트 제목을 먼저 찾고, 그 차트를 감싸고 있는 전체 카드(.v-card) 영역으로 올라갑니다.
    cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황').closest('.v-card') // 🌟 [핵심] 해당 차트의 전체 박스로 시야를 넓힘
     .within(() => {
    
     // 2. 이제 이 블록 안에서는 '해당 차트 내부'만 검색합니다! (다른 차트 간섭 X)
     cy.get('.apexcharts-legend-text').should('be.visible').first().click({ force: true });
   });

   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 화면 현황- 업무시스템 별 상세 페이지 이동검증
   cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '검색 조건').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 현황- 업무 시스템 별 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------

   // 개인정보 사용자 TOP 10 클릭하여 상세페이지로 이동-------------------------------------------
   // 1. 화면에 존재하는 모든 차트(ApexCharts 도화지)를 찾은 뒤,
   // '두 번째(아래쪽)' 차트를 선택합니다. (0=위쪽 부서별 차트, 1=아래쪽 사용자 차트)
   // 그중 두 번째 막대(0부터 시작하므로 인덱스 1 = '이노희' 님)를 강제 클릭합니다.
   cy.get('.apexcharts-canvas').eq(3).find('path.apexcharts-bar-area').eq(0).click({ force: true });
   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 화면 현황- 업무시스템 별 상세 페이지 이동검증
   cy.get('.tab-btn').contains('정보사용자 별').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '검색 조건').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 현황- 정보사용자 별 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------

   // 맨티스 이슈 : 37330
   /* 이상행위 유형별 현황 클릭하여 상세페이지로 이동안되는 문제 
   // 이상행위 유형별 현황 클릭하여 상세페이지로 이동-------------------------------------------
   // 'apexcharts-legend-text' 클래스를 가진 span 태그 중 해당 텍스트를 찾아 강제 클릭합니다.
   cy.contains('span.apexcharts-legend-text', '접근제한 업무 시스템 접근').should('be.visible').click({ force: true });
   cy.wait(500);
   //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
   cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
   cy.wait(500); 
   // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
   cy.wait(2000);
   // 화면 현황- 업무시스템 별 상세 페이지 이동검증
   cy.get('.tab-btn').contains('정보사용자 별').closest('button').should('not.have.class', 'inactive');
   // 제목 검증 후 뒤로 가기 실행
   cy.contains('.c-headline:visible', '검색 조건').should('be.visible')
   .then(() => {
    // 이 블록은 위 검증이 완벽하게 성공했을 때만 실행됩니다!
    cy.log('✅ 현황- 정보사용자 별 상세 페이지 로딩 확인 완료! 목록으로 돌아갑니다.');
    cy.wait(2000);
    // 브라우저 뒤로가기 이동(Back 버튼)
    cy.go('back');
    cy.wait(2000);
     });
   //------------------------------------------------------------------------------------------------------
   */


   cy.log('✅ 점검 대시보드 출력 및 차트 타이틀 확인 완료 ');

    //자동갱신간격 조절하기 
   // ==========================================
   // 자동갱신간격 조절하기  5초 갱신확인
   // ==========================================
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
   cy.contains('.item-margin', '5', { timeout: 5000 }).should('be.visible');
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

  
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 점검 Depth 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
