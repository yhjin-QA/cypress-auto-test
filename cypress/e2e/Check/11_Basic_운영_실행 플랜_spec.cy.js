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
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    
    // 운영 > 실행플랜 서브메뉴 
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 실행 플랜 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("실행 플랜")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 실행플랜  > 스케줄러 탭을 클릭
    cy.log('--- 스케줄러 탭 클릭 ---');
    cy.contains('.v-btn__content', '스케줄러').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
    // 정책목록  추가 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('추가').should('be.visible');
    // 정책목록 입력란 확인
    cy.get('span[title="정책 유형 선택 (ALL)"]').should('be.visible');
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     //체크박스
     cy.contains('label', '삭제/완료된 플랜 보기').parent().find('.v-input--selection-controls__input').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('삭제/완료된 플랜 보기').should('be.visible');

    // 표 컬럼 확인
    // 헤더(th) 안에 있는 체크박스 아이콘(check_box_outline_blank) 확인
    cy.get('th').find('.v-icon:contains("check_box_outline_blank")').should('exist');
    cy.get('th').filter(':visible').contains('플랜 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('작업 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');

    cy.contains('.c-headline', '정책 플랜 일정').should('exist');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_left').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_right').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('refresh').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('TODAY').should('be.visible');

    cy.contains('.c-headline', '일정 상세').should('exist');
    cy.contains('.c-headline', '일정 상세').closest('.v-card').find('th').as('detailHeader');
    //저장한 영역(@detailHeader) 안에서 컬럼명 확인
    cy.get('@detailHeader').contains('날짜').should('be.visible');
    cy.get('@detailHeader').contains('이름').should('be.visible'); 
    cy.get('@detailHeader').contains('상태').should('be.visible');
    cy.get('@detailHeader').contains('플랜 삭제 여부').should('be.visible');


    //기능확인

    cy.log('✅ 운영 - 실행플랜 - [스케줄러] 출력 확인 완료 ');

 
 
    // 운영 > 실행 플랜  > "실시간 모니터링" 탭을 클릭
    cy.log('--- 실시간 모니터링 탭 클릭 ---');
    cy.contains('.v-btn__content', '실시간 모니터링').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '탐색 실시간 모니터').should('exist');
    // > 아이콘확인
    cy.get('.sub-title-icon.fa-angle-right').should('be.visible')
     // 설명: 'sub-title-title' 클래스를 가진 요소 중 '진행 중인 탐색'이라는 글자가 포함된 요소 확인
    cy.contains('.sub-title-title', '진행 중인 탐색').should('be.visible');
    cy.log('✅ 운영 - 실행플랜 - [실시간 모니터링] 출력 확인 완료 ');

   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 운영 - 태스크 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
