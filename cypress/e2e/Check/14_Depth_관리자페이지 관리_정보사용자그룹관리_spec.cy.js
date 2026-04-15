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
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(2000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');


    // 관리 > 정보사용자 / 그룹 관리  서브메뉴 선택 
    cy.contains('button.side-menu', '관리').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [정보사용자 / 그룹 관리] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("정보 사용자 / 그룹 관리")').filter(':visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 정보사용자 / 그룹 관리  > 관리 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('관리').last().click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '소속 (전체)').should('exist');
    // 플러스 + 아이콘 확인
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
     // 돋보기 아이콘이 확인
     cy.get('.v-icon.fa-search').should('be.visible');
     // 검색 조건 입력란 
     cy.get('input[aria-label="검색 조건"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="값"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 정책 추가버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('아이디').should('be.visible');
     cy.get('th').filter(':visible').contains('그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('이메일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');

     //기능확인 - 소속조회
     // 소속(전체 )검색조건에서 이름 검색----------------------------------------------------
     // '검색 조건' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
     cy.get('input[aria-label="검색 조건"]').click({ force: true });
     cy.wait(500);
     // 화면에 나타난 리스트 메뉴 중에서 '이름'을 선택
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '이름').should('be.visible').click({ force: true });
     // '값' 입력창을 찾아 비운 뒤 '호준'을 타이핑합니다.
     cy.get('input[aria-label="값"]').should('be.visible').clear().type('호준');
     cy.wait(500);
     //상태 클릭
     cy.get('input[aria-label="상태"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 상태 리스트중 '사용자' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '사용자').should('be.visible').click({ force: true });
     cy.wait(500);    
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     cy.get('td', { timeout: 10000 }).contains('호준').should('be.visible');
     //----------------------------------------------------------------------------------------------

     // 소속(전체 )검색조건에서 이름 -> 아이디 검색으로----------------------------------------------------
     // '검색 조건' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
     cy.get('span[title="이름"]').should('be.visible').click({ force: true });
     cy.wait(500);
     // 화면에 나타난 리스트 메뉴 중에서 '아이디'을 선택
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '아이디').should('be.visible').click({ force: true });
     // '값' 입력창을 찾아 비운 뒤 '호준'을 타이핑합니다.
     cy.get('input[aria-label="값"]').should('be.visible').clear().type('loginid2');
     cy.wait(500);

     cy.wait(500);    
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     cy.get('td', { timeout: 10000 }).contains('loginid2').should('be.visible');
     //----------------------------------------------------------------------------------------------


     // 소속(전체 )검색조건에서 아이디 -> 이메일 검색으로----------------------------------------------------
     // '검색 조건' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
     cy.get('span[title="아이디"]').should('be.visible').click({ force: true });
     cy.wait(500);
     // 화면에 나타난 리스트 메뉴 중에서 '아이디'을 선택
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '이메일').should('be.visible').click({ force: true });
     // '값' 입력창을 찾아 비운 뒤 '호준'을 타이핑합니다.
     cy.get('input[aria-label="값"]').should('be.visible').clear().type('hojun@naver.com');
     cy.wait(500);

     cy.wait(500);    
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     cy.get('td', { timeout: 10000 }).contains('hojun@naver.com').should('be.visible');
     //----------------------------------------------------------------------------------------------

    // ==========================================
    // STEP [추가]: 인사 연동 DB 데이터 교차 검증 
    // ==========================================
    // 캡처 화면에 존재하는 실제 데이터 '호준'으로 테스트 진행
    const targetUserName = '호준'; 

    cy.log(`--- [1단계] ${targetUserName} 사용자 검색 ---`);
    // 이름으로 검색 조건 세팅
    cy.get('input[aria-label="검색 조건"]').click({ force: true });
    cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '이름').should('be.visible').click({ force: true });
    cy.get('input[aria-label="값"]').should('be.visible').clear().type(targetUserName);
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1500); // 검색 결과 로딩 대기

    cy.log(`--- [2단계] UI 정보 추출 및 DB 교차 검증 ---`);
    // 해당 사용자가 있는 행(tr)을 찾아서 '아이디' 텍스트를 추출합니다.
    // 표 순서: 이름(0), 아이디(1), 그룹(2), 이메일(3), 생성일(4) 이므로 eq(1)을 사용합니다.
    cy.contains('td', targetUserName).parent('tr').within(() => {
        cy.get('td').eq(1).invoke('text').as('uiUserId'); // 아이디 추출
    });

    cy.get('@uiUserId').then((uiUserId) => {
        // 🎯 제공해주신 실제 테이블(LETTNEMPLYRINFO)과 컬럼(EMPLYR_ID, USER_NM) 적용!
        const sql = `SELECT EMPLYR_ID FROM LETTNEMPLYRINFO WHERE USER_NM = '${targetUserName}'`;
        
        cy.task('queryDB', sql).then((dbResult) => {
            // DB 통신 결과 확인
            expect(dbResult, 'DB 결과가 반환되어야 합니다').to.not.be.null;
            expect(dbResult.length, 'DB에 해당 사용자가 존재해야 합니다').to.be.greaterThan(0);

            // 대문자로 반환되는 오라클 컬럼 특성
            const dbUserId = dbResult[0].EMPLYR_ID; 
            
            cy.log(`🖥️ UI 아이디: ${uiUserId.trim()} / 🛢️ DB 아이디: ${dbUserId}`);

            // 교차 검증 실행
            expect(uiUserId.trim()).to.equal(dbUserId);
            cy.log('✅ UI 화면과 Oracle DB 데이터가 완벽하게 일치합니다!');
        });
    });

     

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('✅ 관리 - 정보사용자/그룹 관리 - [관리]탭 출력 확인 완료 ');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
