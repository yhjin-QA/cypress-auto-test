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
      'not valid JSON'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 UI기본체크', () => {

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
    // STEP 8: 보관 서브메뉴 
    // ==========================================
    cy.contains('.side-menu', '보관').click({ force: true });
    cy.wait(2000);
    cy.log('---보관-접속기록 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 보관")').filter(':visible').click({ force: true });
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.tab-title', '백업/복원').should('exist');
    // 보관 > 접속기록 보관 >  백업/복원  활성/비활성화 토글
    cy.get('label').filter(':visible').contains('활성/비활성').eq(0).should('be.visible');
    cy.contains('.c-headline', '증적 자료').should('exist');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (왼쪽)
    cy.contains('데이터들이 백업됩니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (오른쪽)
    cy.contains('개인정보가 없는 데이터를 정리합니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  시스템에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '시스템').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  전송방식식에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '전송 방식').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    cy.log('✅  보관 탭 진입 및 데이터 출력 확인 완료!');

 
    cy.contains('.side-menu', '보관').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---보관-접속기록 무결성 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 무결성")').filter(':visible').click({ force: true });
    cy.wait(2000); 
    
  
     // 보관 > 접속기록 무결성 > 위변조 검사 정책/플랜랜 탭 클릭 
     cy.get('.tab-btn').contains('위변조 검사 정책 / 플랜').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.get('.tab-btn').contains('위변조 검사 정책 / 플랜').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // v 아이콘 확인하는 코드
     cy.get('.v-icon').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('정책명').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('조건').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     cy.log('✅ 위변조 검사 정책/플랜 진입 및 데이터 출력 확인 완료!');
 
 
     // 보관 > 접속기록 무결성 > 위변조 검사이력조회 탭 클릭 
     cy.get('.tab-btn').contains('위변조 검사 이력 조회').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.get('.tab-btn').contains('위변조 검사 이력 조회').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '검색 조건').should('exist');
     //[DB 무결성 점검 상태] 검색조건 문구 확인
     cy.get('input[aria-label="DB 무결성 점검 상태"]').filter(':visible').should('be.visible');
     //엑셀다운로드 버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
     //검색 버튼 존재확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('접속기록 날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('점검 횟수').should('be.visible');
     cy.get('th').filter(':visible').contains('최초 점검 일').should('be.visible');
     cy.get('th').filter(':visible').contains('최종 점검 일').should('be.visible');
     cy.get('th').filter(':visible').contains('DB 무결성 점검 상태').should('be.visible');
     cy.log('✅ 접속기록 무결성-위변조 검사 이력조회 탭 진입 및 데이터 출력 확인 완료!');


  
     // 보관 > 접속기록 무결성 > 파일 위변조 검사 이력 조회 탭 클릭 
     cy.get('.tab-btn').contains('파일 위변조 검사 이력 조회').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.get('.tab-btn').contains('파일 위변조 검사 이력 조회').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '검색 조건').should('exist');
     //검색조건 문구 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="파일 명"]').filter(':visible').should('be.visible');
     cy.get('span').filter(':visible').contains(/^전체$/).should('be.visible');
     //엑셀다운로드 버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
     //검색 버튼 존재확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('파일 명').should('be.visible');
     cy.get('th').filter(':visible').contains('무결성 생성일시').should('be.visible');
     cy.get('th').filter(':visible').contains('검증일시').should('be.visible');
     cy.get('th').filter(':visible').contains('CheckSum').should('be.visible');
     cy.get('th').filter(':visible').contains('위 변조 여부').should('be.visible');
    cy.log('✅ 접속기록 무결성-파일 위변조 검사 이력조회 탭 진입 및 데이터 출력 확인 완료!');



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
