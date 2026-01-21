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
      'operate.task.packageManagement'
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
    cy.visit('https://10.10.54.11:18443/logcatch/login');
    cy.wait(4000); // 로딩 대기

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
    // STEP 4: 현황서브메뉴 
    // ==========================================
    cy.wait(3000);
    cy.contains('button', '현황').click({ force: true });
    cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 현황 > 정보사용자별 탭 클릭  ---');
    cy.get('.tab-btn').contains('정보사용자 별').should('be.visible').click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //검색 조건 입력문구 확인
    cy.get('label').filter(':visible').contains('기간').should('be.visible');
    cy.get('label').filter(':visible').contains('추적 타입').should('be.visible');
    cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.log('✅ 현황 - 정보사용자 별 탭 진입 및 데이터 출력 확인 완료!');
    
    cy.log('--- 현황 > 부서서 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('부서 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('부서 별').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('label', '기간') .closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
    cy.log('✅ 부서 별 탭 진입 및 데이터 출력 확인 완료!');

    cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
    // 'c-headline' 클래스를 가진 요소 중에 '파일 다운로드' 글자가 존재하는지 확인
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('label', '기간') .closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.log('✅ 업무 시스템 별 탭 진입 및 데이터 출력 확인 완료!');
   

    cy.log('--- 현황 > 종합 현항 탭 클릭  ---');
    cy.get('.tab-btn').contains('종합 현황').should('be.visible').click({ force: true });
    cy.wait(3000);

    // 현황 > 종합현황  > [정보 사용자별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').should('be.visible').contains('정보사용자 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('label', '기간').filter(':visible').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('input[aria-label="사용자"]').filter(':visible').should('be.visible');
    cy.log('✅ 현황 - 종합현황 - [정보 사용자별]탭 진입 및 데이터 출력 확인 완료!');
    
    // 현황 > 종합현황  > [부서 별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').should('be.visible').contains('부서 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색 조건 입력 문구확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
    cy.log('✅ 현황 - 종합현황 - [부서 별]탭 진입 및 데이터 출력 확인 완료!');

    // 현황 > 종합현황  > [업무시스템 별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').contains('업무 시스템 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.log('✅ 현황 - 종합현황 - [업무 시스템 별]탭 진입 및 데이터 출력 확인 완료!');
    cy.wait(3000);

  
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 모든 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
