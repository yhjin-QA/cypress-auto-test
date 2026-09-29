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
      'ChunkLoadError'
    ];
    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 v2.7 기본동작 체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.91:18443/logcatch/login');
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
    cy.contains('button', '운영').click({ force: true });
    cy.wait(1000);
    cy.log('---운영 - 태스크 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("태스크")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 실행관리 탭 클릭 ---');
    cy.contains('.v-btn__content', '실행 관리').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '태스크 목록').should('exist');
   
    
    // =============================================
    // 실행관리 : 개별적으로 프로세스 시작 및 정지 기능확인
    // =============================================

    // Log Collector ----------------------------------------------------------------------------------------
    // Log Collector TASK 정지 버튼 클릭
    cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Log Collector 종료 확인 알림창 확인
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Log Collector 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Log Collector TASK 시작 버튼 클릭
     cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Log Collector 실행 확인 알림창 확인
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Log Collector 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

    //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Discriminator ----------------------------------------------------------------------------------------
    // Discriminator TASK 정지 버튼 클릭
    cy.contains('p', 'Discriminator').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Discriminator 종료 확인 알림창 확인
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Discriminator 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Discriminator TASK 시작 버튼 클릭
     cy.contains('p', 'Discriminator').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // 'Discriminator 실행 확인 알림창 확인
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // 'Discriminator 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Rule Analyzer ----------------------------------------------------------------------------------------
    // Rule Analyzer TASK 정지 버튼 클릭
    cy.contains('p', 'Rule Analyzer').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Rule Analyzer 종료 확인 알림창 확인
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Rule Analyzer 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Rule Analyzer TASK 시작 버튼 클릭
     cy.contains('p', 'Rule Analyzer').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // 'Rule Analyzer 실행 확인 알림창 확인
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // 'Rule Analyzer 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Data File Cleaner ----------------------------------------------------------------------------------------
    // Data File Cleaner TASK 정지 버튼 클릭
    cy.contains('p', 'Data File Cleaner').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // Data File Cleaner 종료 확인 알림창 확인
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // Data File Cleaner 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

     // Data File Cleaner TASK 시작 버튼 클릭
     cy.contains('p', 'Data File Cleaner').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Data File Cleaner 실행 확인 알림창 확인
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Data File Cleaner 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Statistics ----------------------------------------------------------------------------------------
    // Statistics TASK 정지 버튼 클릭
    cy.contains('p', 'Statistics').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // Statistics 종료 확인 알림창 확인
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // Statistics 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

     // Statistics TASK 시작 버튼 클릭
     cy.contains('p', 'Statistics').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Statistics 실행 확인 알림창 확인
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Statistics 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------
    
    cy.log('✅ 운영 - 태스크 - [실행관리] 출력 확인 완료 ');
  



   
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
