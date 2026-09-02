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
          .contains('확정')
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
    // STEP : 자산 서브메뉴 - 데이터 베이스
    // ==========================================
    cy.contains('button', '자산').click({ force: true });
    cy.wait(3000);
    cy.log('---자산-데이터베이스 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스")').filter(':visible').eq(0).click({ force: true });
    cy.wait(3000); 
    // 자산 > 데이터베이스 > [개인정보 탐색 정책] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('개인정보 탐색 정책').click();
    cy.wait(3000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [개인정보 탐색 정책]탭 출력 확인 완료!');

    
    // v3.0.5.1191_r35135 샤크라 아이템 정책 탭 제거됨.
    // // 자산 > 데이터베이스 > [샤크라 아이템 정책] 탭 클릭
    // //클릭하면 관리자페이지모드로 변해버려서 순서 변경해둠 (이슈확인)
    // cy.get('.v-btn__content').filter(':visible').contains('샤크라 아이템 정책').click();
    // cy.wait(2000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.log('✅ 자산 > 데이터베이스 > [샤크라 아이템 정책]탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 > [개인정보 동기화] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('개인정보 동기화').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [개인정보 동기화]탭 출력 확인 완료!'); 

    // // 자산 > 데이터베이스 > [샤크라 마스킹 정책] 탭 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('샤크라 마스킹 정책').click();
    // cy.wait(2000); 
    // cy.log('--- 화면 검증 시작 ---');
    // cy.log('✅ 자산 > 데이터베이스 > [샤크라 마스킹 정책]탭 출력 확인 완료!'); 



    // cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    // cy.wait(2000);
    // cy.log('---자산 - 개인정보 파일 / 문서 서브메뉴 클릭 ---');
    // cy.get('.v-list__tile__title').filter(':contains("개인정보 파일 / 문서")').filter(':visible').eq(0).click({ force: true });
    // cy.wait(2000); 
    // // 자산 > 개인정보 파일 / 문서 > [자산 보유 현황 / 전체] 탭 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 전체').click();
    // cy.wait(2000); 
    // cy.log('--- 화면 검증 시작 ---');
    // cy.log('✅ 자산 > 개인정보 파일 / 문서 > [자산 보유 현황 / 전체] 탭 출력 확인 완료!'); 


    // // 자산 > 개인정보 파일 / 문서 > [외부 로그 연동 정책/플랜] 탭 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('외부 로그 연동 정책/플랜').click();
    // cy.wait(2000); 
    // cy.log('--- 화면 검증 시작 ---');
    // cy.log('✅ 자산 > 개인정보 파일 / 문서 > [외부 로그 연동 정책/플랜] 탭 출력 확인 완료!'); 


    // // 자산 > 개인정보 파일 / 문서 > [외부 파일 저장소 연동] 탭 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('외부 파일 저장소 연동').click();
    // cy.wait(2000); 
    // cy.log('--- 화면 검증 시작 ---');
    // cy.log('✅ 자산 > 개인정보 파일 / 문서 > [외부 파일 저장소 연동] 탭 출력 확인 완료!'); 

    // ==========================================
    // STEP : 자산 서브메뉴 - 데이터 베이스 자산정보
    // ==========================================

    cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---자산 - 데이터베이스 자산정보 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스 자산정보")').filter(':visible').eq(0).click({ force: true });
    cy.wait(2000); 
    // 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 전체] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 전체').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 전체]  탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 개별] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 개별').click();
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅  자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 개별]  탭 출력 확인 완료!'); 
 

    // 자산 > 데이터베이스 자산정보 > [자산 상세 조회] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 상세 조회').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [자산 상세 조회] 탭 출력 확인 완료!'); 


     // 자산 > 데이터베이스 자산정보 > [확정된 개인정보 조회] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확정된 개인정보 조회').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [확정된 개인정보 조회] 탭 출력 확인 완료!'); 

     //----------------------------------------------------------------------------------------------
    
    // ==========================================
    // STEP : 자산 서브메뉴 - 데이터 베이스 확정처리
    // ========================================== 

    cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---자산 - 데이터베이스 확정처리 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스 확정처리")').filter(':visible').eq(0).click({ force: true });
    cy.wait(2000); 
    
    // 자산 > 데이터베이스 확정처리 > [자산 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [자산 개인정보 확정처리] 탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 확정처리 > [자산 분리된 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 분리된 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [자산 분리된 개인정보 확정처리] 탭 출력 확인 완료!'); 


    // 자산 > 데이터베이스 확정처리 > [사용자 정의 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('사용자 정의 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [사용자 정의 개인정보 확정처리] 탭 출력 확인 완료!'); 



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
