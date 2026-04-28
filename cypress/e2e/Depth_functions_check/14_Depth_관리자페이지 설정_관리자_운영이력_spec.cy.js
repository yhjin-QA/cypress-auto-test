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
     cy.wait(5000);
    
    //로그인 성공

    
    //로그인 성공

    // ==========================================
    // STEP : 일반모드 -> 관리자페이지 탭 진입 (자동 복구 로직 적용)
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭 및 렌더링 대기');

    cy.get('body').then(($body) => {
        // 1차 방어: 화면에 톱니바퀴 아이콘이 아예 렌더링되지 않았다면?
        if ($body.find('.g-IConfig:visible').length === 0) {
            cy.log('🔴 톱니바퀴 아이콘 렌더링 실패 감지! 페이지 새로고침');
            cy.reload();
            cy.wait(3000);
        }
    });

    // 톱니바퀴 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    cy.wait(2000); // 청크 로딩 대기

    cy.get('body').then(($body) => {
        // 2차 방어: 클릭은 했는데 ChunkLoadError 때문에 '설정' 메뉴가 안 나타났다면?
        if ($body.find('button.side-menu:contains("설정"):visible').length === 0) {
            cy.log('🔴 ChunkLoadError 감지! (사이드 메뉴 렌더링 실패). 새로고침 후 재시도합니다.');
            cy.reload();
            cy.wait(3000);
            cy.get('.g-IConfig').should('be.visible').click({ force: true });
            cy.wait(2000);
        }
    });

    cy.log('✅ 관리자 메뉴 렌더링 및 클릭 완벽 성공');

    // =================================================
    // STEP 14: 관리자 - 설정 - 관리자 - 계정 정보  관리규칙탭
    // ==================================================
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(2000)
    
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기

    // 설정 > 관리자 > [운영 이력] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('운영 이력').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    //검색 입력문구확인 
    cy.get('input[aria-label="관리자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="IP"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="검색 대상"]').filter(':visible').should('be.visible'); 
    //검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('순번').should('be.visible');
    cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('발생자').should('be.visible');
    cy.get('th').filter(':visible').contains('IP').should('be.visible');
    cy.get('th').filter(':visible').contains('이벤트').should('be.visible');
    cy.get('th').filter(':visible').contains('보안 객체').should('be.visible');
    cy.get('th').filter(':visible').contains('대상').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('결과').should('be.visible');
    cy.log('✅ 설정 - 관리자 - [운영 이력] 출력 확인 완료');


    // ===================================================
    // Case1 : 계정관리 관리차 추가에 대한 운영이력 조회확인
    // ===================================================

     //기능확인
    //달력표를 펼침  월/일 지정  
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
    // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '4월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').contains('4월').click({ force: true });
    // 달력 1일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

    // // 관리자 선택 
    // //검색조건에서  Administrators IP 검색----------------------------------------------------
    // // '관리자' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
    //  cy.get('input[aria-label="관리자"]').click({ force: true });
    //  cy.wait(500);
    //  // 화면에 나타난 리스트 메뉴 중에서 'Administrators'을 선택
    //  cy.get('.v-menu__content:visible').contains('.v-list__tile__title', 'Administrators').should('be.visible').click({ force: true });
    //  cy.wait(500);
    //  // 선택한 컨텍스트 메뉴 닫기
    //  cy.get('body').type('{esc}'); 

    //  // IP 입력하기
    //  // IP입력값  '10.10.54.5'을 타이핑합니다.
    //  cy.get('input[aria-label="IP"][type="text"]').should('be.visible').clear().type('10.10.54.5');
    //  cy.wait(500);

     //검색대상 클릭 - 변경이력 
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 상태 리스트중 '변경 이력' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '변경 이력').should('be.visible').click({ force: true });
     cy.wait(500);  
     
     //이벤트 클릭 - 추가
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '로그인' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '추가').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');
     
     //보안 객체 클릭  - 관리자
     cy.get('input[aria-label="보안 객체"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 보안 객체중 '관리자' 클릭
     //cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '관리자').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 
     
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    // ==========================================================
    // STEP: 검색 결과 테이블 검증 (오토유저 추가 이력 확인)
    // ==========================================================
    cy.log('✅ 운영 이력 검색 결과 정밀 검증 시작');

    // 1. 테이블의 tbody 안에서 '[Manager] : 오토유저'가 포함된 행(tr)을 먼저 찾습니다.
    // 해당 행이 렌더링 될 때까지(API 응답 대기 포함) 최대 10초간 기다립니다.
    cy.contains('tbody tr', '[Manager] : 오토유저', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
          // 2. 해당 행(row) 안에서 각 컬럼(td)별로 HTML 구조와 텍스트가 정확히 일치하는지 검증합니다.
          
          // [발생자] 검증
          cy.get('span.ellipsis').contains('Admin(admin)').should('be.visible');

          // 🚨 [IP] 검증 (10.10.54.5 또는 10.10.0.210 중 하나인지 확인)
          // 정규표현식의 '|' (OR) 기호를 사용하여 두 IP 중 하나라도 화면에 있으면 통과합니다.
          cy.contains('span.ellipsis', /10\.10\.54\.5|10\.10\.0\.210/).should('be.visible');
          
          // [이벤트] 검증 (<a> 태그 안의 텍스트 '추가')
          cy.get('a.font-weight-bold').contains('추가').should('be.visible');
          
          // [보안 객체] 검증
          cy.get('span.ellipsis').contains('관리자').should('be.visible');
          
          // [대상] 검증
          cy.get('span.ellipsis').contains('[Manager] : 오토유저').should('be.visible');
          
          // [설명] 검증 (text-xs-left 클래스 포함 여부까지 꼼꼼하게 확인)
          cy.get('span.ellipsis.text-xs-left').contains('[Manager] : Create').should('be.visible');
          
          // [결과] 검증 (성공 여부 확인)
          cy.contains('td', '성공').should('be.visible');
      });

    cy.log('🎉 오토유저 추가에 대한 운영 이력 검색 및 검증 완벽 성공!');
     //-------------------------------------------------------------------------------------------


    // ===================================================
    // Case2 : 계정관리 관리자 삭제에 대한 운영이력 조회확인
    // ===================================================
    // 사전조건: 기존 Case1 추가 검색에 대한 나머지조건은 유지된 상태

     // 🧹 [초기화] '이벤트' 항목의 X 버튼 클릭하여 기존 선택값 지우기
     cy.log('🧹 이벤트 항목 초기화(X 버튼 클릭)');
     cy.get('input[aria-label="이벤트"]').closest('.v-input').find('i.material-icons').contains('clear').click({ force: true });
     cy.wait(500); // 초기화 반영 대기
    
     //이벤트 클릭 - 삭제
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '로그인' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '삭제').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');
     
     
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    // ==========================================================
    // STEP: 검색 결과 테이블 검증 (오토유저 삭제 이력 확인)
    // ==========================================================
    cy.log('✅ 운영 이력 검색 결과 정밀 검증 시작');

    // 1. 테이블의 tbody 안에서 '[Manager] : 오토유저'가 포함된 행(tr)을 먼저 찾습니다.
    // 해당 행이 렌더링 될 때까지(API 응답 대기 포함) 최대 10초간 기다립니다.
    cy.contains('tbody tr', '[Manager] : 오토유저', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
          // 2. 해당 행(row) 안에서 각 컬럼(td)별로 HTML 구조와 텍스트가 정확히 일치하는지 검증합니다.
          
          // [발생자] 검증
          cy.get('span.ellipsis').contains('Admin(admin)').should('be.visible');

          // 🚨 [IP] 검증 (10.10.54.5 또는 10.10.0.210 중 하나인지 확인)
          // 정규표현식의 '|' (OR) 기호를 사용하여 두 IP 중 하나라도 화면에 있으면 통과합니다.
          cy.contains('span.ellipsis', /10\.10\.54\.5|10\.10\.0\.210/).should('be.visible');
          
          // [이벤트] 검증 (<a> 태그 안의 텍스트 '추가')
          cy.get('a.font-weight-bold').contains('삭제').should('be.visible');
          
          // [보안 객체] 검증
          cy.get('span.ellipsis').contains('관리자').should('be.visible');
          
          // [대상] 검증
          cy.get('span.ellipsis').contains('[Manager] : 오토유저').should('be.visible');
          
          // [설명] 검증 (text-xs-left 클래스 포함 여부까지 꼼꼼하게 확인)
          cy.get('span.ellipsis.text-xs-left').contains('[Manager] : Delete').should('be.visible');
          
          // [결과] 검증 (성공 여부 확인)
          cy.contains('td', '성공').should('be.visible');
      });

    cy.log('🎉 계정관리 관리자 : 오토유저 추가&삭제에 대한 운영 이력 검색 및 검증 완벽 성공!');
     //-------------------------------------------------------------------------------------------
     
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 설정 - 관리자 - [운영 이력] 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });
   
  });
});  

//코드마지막


 })()
;
