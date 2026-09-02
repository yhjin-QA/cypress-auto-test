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
    // STEP 5: 소명 서브메뉴 
    // ==========================================
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 관리 서브메뉴 클릭 ---');
    //서브메뉴 관리 클릭 (정교하게)
    cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('관리').click({ force: true });
    cy.wait(3000);
    // 소명 > 관리 > 종합현황 탭 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('종합 현황').click();
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 업무시스템 검색문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
    //2.9.1.262_r35274  소명상태 -> 소명하기 조건
    cy.get('input[aria-label="소명하기 조건"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
    // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('부서').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
    cy.get('th').filter(':visible').contains('건수').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 내용').should('be.visible');
    cy.get('th').filter(':visible').contains('소명하기 조건').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
    cy.log('✅ 소명 - 관리 - [종합 현황] 탭 진입 및 데이터 출력 확인 완료!');

    
    // 소명  > 나의 소명 서브메뉴 클릭
    cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 나의 소명 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("나의 소명")').filter(':visible').click({ force: true });
    cy.wait(3000);
    
     // 소명 > 나의소명 > 나의 소명 내역
     cy.get('.tab-btn').contains('나의 소명 내역').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="소명하기 조건"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
     cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
     cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.get('th').filter(':visible').contains('건수').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 내용').should('be.visible');
     cy.get('th').filter(':visible').contains('소명하기 조건').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [나의 소명 내역]탭 진입 및 데이터 출력 확인 완료!');

     // 소명 > 나의소명 > 소명하기 
     cy.get('.tab-btn').contains('소명하기').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="경보 등급"]').filter(':visible').should('be.visible');
     
     //v3.0.5.1191_R35135 제거됨.
     //cy.get('input[aria-label="소명 대상 일자"]').filter(':visible').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
     cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [소명하기]탭 진입 및 데이터 출력 확인 완료!');

      // 소명 > 나의소명 > 승인하기
      cy.get('.tab-btn').contains('승인하기').should('be.visible').click({ force: true });
      cy.wait(3000); 
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '검색 조건').should('exist');
      // 검색버튼 존재 확인
      cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
      // 업무시스템 검색문구 확인
      cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
      // 시작날짜 달력 아이콘확인
      cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
      // 종료날짜 달력 아이콘확인
      cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('승인이 필요한 내역만 보기').should('be.visible');
      // 표 문구열 확인
      cy.get('th').filter(':visible').contains('일시').should('be.visible');
      cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
      cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
      cy.get('th').filter(':visible').contains('건수').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 내용').should('be.visible');
      cy.get('th').filter(':visible').contains('소명하기 조건').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
      cy.log('✅ 소명 - 나의 소명 - [승인하기]탭 진입 및 데이터 출력 확인 완료!');


      // // 소명 > 결재 서브메뉴 클릭
      // cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
      // cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
      // cy.log('--- 소명 > 결재 서브메뉴 클릭 ---');
      // cy.get('.v-list__tile__title').filter(':contains("결재")').filter(':visible').click({ force: true });
      // cy.wait(3000);
      // // 소명 > 결재 > 결재라인 탭 클릭
      // cy.get('.v-btn__content').filter(':visible').contains('결재 라인').click();
      
      
      // 3.0.5.1191_r35135 버전에서 변경
      // ==========================================
      // STEP : 결재 서브메뉴 - 정책
      // ==========================================
      cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '결재').click({ force: true });
      cy.wait(1000);

      // 서브메뉴 정책 클릭
      cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '정책').click({ force: true });
      cy.wait(2000);
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '결재 정책 목록').should('exist');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('지난 정책 보기').should('be.visible');
       // 표 문구열 확인
       cy.get('th').filter(':visible').contains('유형').should('be.visible');
       cy.get('th').filter(':visible').contains('정책명').should('be.visible');
       cy.get('th').filter(':visible').contains('설명').should('be.visible');
       cy.get('th').filter(':visible').contains('등록').should('be.visible');
       cy.get('th').filter(':visible').contains('수정').should('be.visible');
       cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
       
       // 정책 추가 + 버튼
       cy.get('.material-icons').filter(':visible').contains('add').should('be.visible');
       cy.log('✅ 소명 - 결재 - [결재라인] 탭 진입 및 데이터 출력 확인 완료!');
  
    


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
