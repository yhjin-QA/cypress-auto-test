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
      'operate.task.packageManagement'
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
    cy.login('admin', 'Manager1!');

   
    //6. 화면 안정화 대기
     cy.wait(5000);
    
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

     //기능확인
    //달력표를 펼침  월/일 지정  
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
    // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').contains('2월').click({ force: true });
    // 달력 1일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

    //검색조건에서  Administrators IP 검색----------------------------------------------------
     // '관리자' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
     cy.get('input[aria-label="관리자"]').click({ force: true });
     cy.wait(500);
     // 화면에 나타난 리스트 메뉴 중에서 'Administrators'을 선택
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', 'Administrators').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     // IP입력값  '10.10.54.5'을 타이핑합니다.
     cy.get('input[aria-label="IP"][type="text"]').should('be.visible').clear().type('10.10.54.5');
     cy.wait(500);

     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 상태 리스트중 '전체' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체').should('be.visible').click({ force: true });
     cy.wait(500);    
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP('10.10.54.5')가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.contains('tbody tr', '10.10.54.5').should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('span.ellipsis').contains('Admin(admin)').should('be.visible');
      cy.get('span.ellipsis').contains('10.10.54.5').should('be.visible');
     });
     //-------------------------------------------------------------------------------------------


    //검색조건에서  Administrators IP 검색고정하고 검색대상 시스템 이벤트 검색 조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 상태 리스트중 '전체' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '시스템 이벤트').should('be.visible').click({ force: true });
     cy.wait(500); 
     
     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '로그인' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '로그인').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 
         
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP('10.10.54.5')가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.contains('tbody tr', '10.10.54.5').should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('span.ellipsis').contains('로그인').should('be.visible');
      cy.get('span.ellipsis').contains('10.10.54.5').should('be.visible');
     });

     // 이벤트  로그인 -> 조회로 변경하여 검색 클릭
     // 이벤트  x버튼 클릭하여 초기화 
     cy.get('input[aria-label="이벤트"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
     cy.wait(500);
     // 이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     // 이벤트 리스트중 '조회' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '조회').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP('10.10.54.5')가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.contains('tbody tr', '10.10.54.5').should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('a.font-weight-bold').should('contain', '조회').and('be.visible');
      cy.get('span.ellipsis').contains('10.10.54.5').should('be.visible');
     });

     //-------------------------------------------------------------------------------------------

     // IP입력값  '10.10.54.5'을 타이핑합니다.
     cy.get('input[aria-label="IP"][type="text"]').should('be.visible').clear().type('10.10.0.210');
     cy.wait(500);

     //검색조건에서  Administrators IP 검색고정하고 검색대상 시스템 이벤트 검색 조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 검색대상 리스트중 '변경 이력' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '변경 이력').should('be.visible').click({ force: true });
     cy.wait(500); 
     
     //맨티스 이슈 : 37325 설정 - 관리자 - 운영이력 검색대상 변경시 이벤트 리스트목록 변경되지 않는 문제
     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '변경' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '변경').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     //보안 객체 클릭
     cy.get('input[aria-label="보안 객체"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 보안 객체중 '사용자' 클릭
     //cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '사용자').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 
         
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP('10.10.54.5')가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.contains('tbody tr', '10.10.0.210').should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('a.font-weight-bold').should('contain', '변경').and('be.visible');
      cy.get('span.ellipsis').contains('사용자').should('be.visible');
     });

     //------------------------------------------------------------------------------------------------

     //검색조건에서  Administrators IP 검색고정하고 검색대상: 시스템 경보 검색조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 검색대상 리스트중 '시스템 경보' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '시스템 경보').should('be.visible').click({ force: true });
     cy.wait(500); 

     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '전체 선택' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증코드 
     // 시스템 경보가 없는 가정하에 검증코드
     // 수많은 td 중에서 '현재 화면에 보이는(visible)' td만 걸러낸 뒤 텍스트를 찾습니다.
     cy.get('td').filter(':visible').contains('No data available').should('be.visible');


     //검색조건에서  Administrators IP 검색고정하고 검색대상: 파일 내려받기 검색조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 검색대상 리스트중 '파일 내려받기' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '파일 내려받기').should('be.visible').click({ force: true });
     cy.wait(500); 

     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 이벤트 리스트중 '전체 선택' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증코드 
     // 시스템 경보가 없는 가정하에 검증코드
     // 수많은 td 중에서 '현재 화면에 보이는(visible)' td만 걸러낸 뒤 텍스트를 찾습니다.
     cy.get('td').filter(':visible').contains('No data available').should('be.visible');

     cy.log('✅ 설정 - 관리자 - [운영 이력] 출력 확인 완료');

     
   

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 설정 - 관리자 - [계정 관리] 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });
   
  });
});  

//코드마지막


 })()
;
