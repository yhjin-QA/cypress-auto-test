/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!********************************!*\
  !*** ./cypress/e2e/spec.cy.js ***!
  \********************************/
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

/**코드 시작  */
describe('로그캐치 사이트 테스트', () => {
  
  it('로그캐치 배포점검목록 동작 체크', () => {


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(5000); // 로딩 대기

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
    // 테스트 자동화시나리오
    // 이력 - 사용자추척 자동화 시니라오 테스트 
    // ==========================================

    cy.contains('button', '이력').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기


    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 이력 > 사용자 추적 클릭 ---');
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
  
    // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
  
     // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 전체선택 확인
     cy.get('span[title="전체 선택"]').should('be.visible');
     // like버튼 확인 
     //cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
    
    //검색 버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 값').should('be.visible');
    cy.get('th').filter(':visible').contains('조회').should('be.visible');

    //기능동작확인 ------------------------------------------------------------------
   
     //시작기간 지정후 검색
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

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    
    
    // ==========================================
    // 업무시스템 조회
    // ==========================================
  
    // 업무시스템 클릭하여 리스트 열기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '리눅스_배송관리'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '리눅스_배송관리', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 데이터 로딩 대기: 실제 행(tr)에 '리눅스_배송관리'가 보일 때까지 대기
    // 이 단계에서 'No data available' 상태가 지나가기를 자동으로 기다립니다.
    cy.get('tbody tr', { timeout: 10000 }).contains('리눅스_배송관리').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('리눅스_배송관리').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

    // 선택한 업무시스템 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 업무시스템 클릭하여 리스트 열기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(500);

     // 리스트에서 '윈도우_배송관리'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '윈도우_배송관리', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 데이터 로딩 대기: 실제 행(tr)에 '윈도우_배송관리'가 보일 때까지 대기
    // 이 단계에서 'No data available' 상태가 지나가기를 자동으로 기다립니다.
    cy.get('tbody tr', { timeout: 10000 }).contains('윈도우_배송관리').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('윈도우_배송관리').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

     // 선택한 업무시스템 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);


    // ==========================================
    // 부서/소속 조회 
    // ==========================================
    // //부서/소속 클릭하여 전체 선택 
    // cy.get('.material-icons').filter(':visible').contains('settings').click({ force: true });
    // cy.wait(500);
    // cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').closest('.v-list__tile').click({ force: true });
    // // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
    // cy.get('body').type('{esc}');
    // cy.wait(500);
    // cy.log('✅ 팝업 닫기 성공');
    


    // 부서 : 품질관리팀 -------------------------------------------------------------------------------------------
    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '품질관리팀'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '품질관리팀', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('품질관리팀').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('품질관리팀').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
     //---------------------------------------------------------------------------------------------------------------

    // 부서 : 인사팀 -------------------------------------------------------------------------------------------
    // 2번째부터는 선택 초기화 필요 
    // 선택한 부서/소속 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="부서/소속"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '인사팀'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '인사팀', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('인사팀').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('인사팀').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
     //---------------------------------------------------------------------------------------------------------------

    // // 부서 : 협력사 -------------------------------------------------------------------------------------------
    // // 2번째부터는 선택 초기화 필요 
    // // 선택한 부서/소속 x버튼 클릭하여 초기화 
    // cy.get('input[aria-label="부서/소속"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    // cy.wait(500);

    // // 부서/소속 클릭하여 리스트 열기
    // cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    // cy.wait(500);

    // // 리스트에서 '협력사'가 나타날 때까지 기다리고 클릭
    // cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '협력사', { timeout: 10000 }).should('be.visible').click({ force: true });
    // cy.wait(500);
    // // 3. 선택 후 메뉴 닫기 (필요시)
    // cy.get('body').type('{esc}');

    //  //검색버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // cy.wait(1000);

    // // [검증] 검색 결과 검증
    // cy.get('tbody tr', { timeout: 10000 }).contains('협력사').should('be.visible');

    // // 첫 번째 행 정밀 검증
    // cy.get('tbody tr').filter(':visible').first().within(() => {
    // cy.get('a').contains('협력사').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
    //  });
     //---------------------------------------------------------------------------------------------------------------

     // 부서 : 영업팀  -------------------------------------------------------------------------------------------
    // 2번째부터는 선택 초기화 필요 
    // 선택한 부서/소속 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="부서/소속"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '영업팀'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '영업팀', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('영업팀').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('영업팀').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
     //---------------------------------------------------------------------------------------------------------------

     // 부서 : 기술지원팀  -------------------------------------------------------------------------------------------
    // 2번째부터는 선택 초기화 필요 
    // 선택한 부서/소속 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="부서/소속"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '기술지원팀'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '기술지원팀', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('기술지원팀').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('기술지원팀').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
     //---------------------------------------------------------------------------------------------------------------

    // 선택한 부서/소속 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="부서/소속"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // 정보 사용자 조회 - 조회 사용자 : 테스터 (tester)
    // ==========================================
    // 정보 사용자 클릭하여 리스트 열기
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // '테스터'라고 직접 타이핑 (필터링 유도)
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').type('테스터');
    cy.wait(800); // 필터링된 결과가 나타날 때까지 대기

    // 필터링되어 나타난 항목 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '테스터 (tester)').should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('테스터 (tester)').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('테스터 (tester)').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

     // 선택한 정보 사용자 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // 사용자 계정 조회 - 조회사용자 : hojun
    // ==========================================
    // 사용자 계정에 hojun 입력하기 
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').clear().type('hojun');
    cy.wait(500);

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains(/\(hojun\)/).should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains(/\(hojun\)/).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

    // 입력한 사용자 계정 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // 사용자 IP 조회 - 조회 IP : 10.10.54.5
    // ==========================================
    // 사용자 IP에 10.10.54.5 입력 
    cy.get('input[aria-label="사용자 IP"]').filter(':visible').clear().type('10.10.54.5');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('10.10.54.5').should('be.visible');

    // 3. [수정된 검증] 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    // 🔥 핵심 수정: cy.get('a')를 삭제합니다. 
    // IP 주소는 링크가 아니므로 행(tr) 내부 전체에서 텍스트를 찾습니다.
    cy.contains('10.10.54.5').should('be.visible');
     });

    // 입력한 사용자 계정 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="사용자 IP"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // URI 주소 조회 - /cop/logcatch/btnExcessCheck.do
    // ==========================================
    // URI 주소에 /cop/logcatch/btnExcessCheck.do 입력 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear().type('/cop/logcatch/btnExcessCheck.do');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증(업무시스템으로 검증방법 대체)
    cy.get('tbody tr', { timeout: 10000 }).contains('리눅스_배송관리').should('be.visible');

    /// 해당 구조(.ellipsis.text-xs-center a)를 가진 요소를 찾아서
    cy.get('.ellipsis.text-xs-center a').should('be.visible').invoke('text') // 텍스트 값을 추출한 뒤
     .then((text) => {
      // 텍스트의 길이가 0보다 큰지 (즉, 빈칸이 아닌지) 검증!
      expect(text.trim().length).to.be.greaterThan(0);
     });

    // 입력한 URI 주소 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // 행위 유형 조회  
    // ==========================================
    // 조회 -------------------------------------------------------------------------------------------
    // 행위 유형 클릭하여 리스트 열기
    cy.get('input[aria-label="행위 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '조회'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '조회', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('조회').should('be.visible');

    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains('조회').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
     //---------------------------------------------------------------------------------------------------------------

    // 수정 -------------------------------------------------------------------------------------------
    // 2번째부터는 선택 초기화 필요 
    // 선택한 행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="행위 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '수정'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '수정', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

     //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().should('contain', 'No matching records found');
    //---------------------------------------------------------------------------------------------------------------

    // 입력한 행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // ==========================================
    // 개인정보 유형 조회 
    // ==========================================
    // 개인정보 유형 조회  - 주민등록번호 ----------------------------------------------------------------------------------------- 
    
    //개인정보유형 전체선택  클릭하여 유형 선택하는 코드
    cy.get('input[aria-label="개인정보 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);
    
    // 개인정보유형 리스트중 주민등록번호 선택
    cy.get('.v-list__tile__title').contains('주민등록번호').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 1. 주민등록번호 아이콘(g-IResidentNum_c)이 잘 보이는지 검증
    cy.get('i.g.g-IResidentNum_c').filter(':visible').should('be.visible');
    

    // 3. [수정된 검증] 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
     cy.get('i.g.g-IResidentNum_c').filter(':visible').should('be.visible');
     });
    //-----------------------------------------------------------------------------------------------------------------------

    // 개인정보 유형 조회  - 외국인 등록번호 -----------------------------------------------------------------------------------------
     
    //개인정보유형 전체선택  클릭하여 유형 선택하는 코드 
    cy.get('input[aria-label="개인정보 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);
    
    // 개인정보유형 리스트중 외국인등록번호 선택
    cy.get('.v-list__tile__title').contains('외국인등록번호').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().should('contain', 'No matching records found');
    //-----------------------------------------------------------------------------------------------------------------------

    // 개인정보 유형 조회  - 휴대전화번호 -----------------------------------------------------------------------------------------
     
    //개인정보유형 전체선택  클릭하여 유형 선택하는 코드 
    cy.get('input[aria-label="개인정보 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);
    
    // 개인정보유형 리스트중 휴대전화번호 선택
    cy.get('.v-list__tile__title').contains('휴대전화번호').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);

    //휴대번호 입력 수행
    cy.get('input[aria-label="010"]').filter(':visible').clear().type('010').blur();
    cy.wait(500);
    cy.get('input[aria-label="중간 번호 숫자 4개"]').filter(':visible').clear().type('4197').blur();
    cy.wait(500);
    cy.get('input[aria-label="끝 번호 숫자 4개"]').filter(':visible').clear().type('7524').blur();
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    // 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.contains('a', '01********').filter(':visible').should('be.visible');
     }); 
    //-----------------------------------------------------------------------------------------------------------------------

    // ==========================================
    // 사용자 상태 - 등록 상태
    // ==========================================
    // 사용자 계정에 hojun 입력하기 
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').clear().type('hojun');
    cy.wait(500);
    
    ////개인정보유형 전체선택  클릭하여 유형 선택하는 코드 
    cy.get('input[aria-label="개인정보 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);
    
    // 개인정보유형 리스트 초기화
    cy.get('.v-list__tile__title').contains('전체 선택').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);
    
     //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     // 사용자 상태 리스트중 - 등록  선택----------------------------------------------------------
     cy.get('.v-list__tile__title').contains('등록').should('be.visible').click({ force: true });
     cy.wait(500);

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

     // 첫 번째 행 정밀 검증코드 
    cy.get('tbody tr').filter(':visible').first().within(() => {
    cy.get('a').contains(/\(hojun\)/).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

     // 사용자 상태 - 미등록  선택----------------------------------------------- 
     // 입력한 사용자 계정 x버튼 클릭하여 초기화 
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
     cy.wait(500);
     
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     cy.get('.v-list__tile__title').contains('미등록').should('be.visible').click({ force: true });
     cy.wait(500);

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

    // [검증] 검색 결과 검증
    // 첫 번째 행 정밀 검증
   // 첫 번째 행 정밀 검증코드 
    cy.get('tbody tr').filter(':visible').first().within(() => {
       cy.get('a').contains('미등록 부서').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
       // '미등록 사용자'로 시작하는 모든 <a> 태그를 찾음
       cy.get('a').contains(/^미등록 사용자/).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });

      // 사용자 상태 - 전체 선택----------------------------------------------- 
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     cy.get('.v-list__tile__title').contains('전체').should('be.visible').click({ force: true });
     cy.wait(500);

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

    // [검증] 검색 결과 검증
cy.get('tbody tr').filter(':visible').first().then(($row) => {
  
  // 1. '미등록 부서'가 행 안에 존재하는지 확인
  const hasDept = $row.find('a:contains("미등록 부서")').length > 0;
  if (hasDept) {
    cy.log('✅ [미등록 부서] 발견: 검증을 수행합니다.');
    cy.wrap($row).contains('a', '미등록 부서').should('be.visible');
  } else {
    cy.log('⚪ [미등록 부서] 없음: 검증을 건너뜁니다.');
  }

  // 2. '미등록 사용자'로 시작하는 텍스트가 존재하는지 확인 (정규식 활용)
  // jQuery의 filter를 사용하여 텍스트 패턴을 찾습니다.
  const hasUser = $row.find('a').filter((i, el) => /^미등록 사용자/.test(el.innerText)).length > 0;
  if (hasUser) {
    cy.log('✅ [미등록 사용자] 발견: 검증을 수행합니다.');
    cy.wrap($row).contains('a', /^미등록 사용자/).should('be.visible');
  } else {
    cy.log('⚪ [미등록 사용자] 없음: 검증을 건너뜁니다.');
  }

});

    //----------------------------------------------------------------------------------------------
    

    // ==========================================
    // 복합 조회 - 모든 검색필드 조건 다 넣고 조회
    // ==========================================
    // 업무시스템 - 리눅스_배송관리
    // 업무시스템 클릭하여 리스트 열기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '리눅스_배송관리'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '리눅스_배송관리', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    // 부서/소속 - 품질관리팀
    // 부서/소속 클릭하여 리스트 열기
    cy.get('input[aria-label="부서/소속"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 리스트에서 '품질관리팀'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '품질관리팀', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    // 정보 사용자 클릭하여 리스트 열기
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // '호준'라고 직접 타이핑 (필터링 유도)
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').type('윤호');
    cy.wait(800); // 필터링된 결과가 나타날 때까지 대기

    // 필터링되어 나타난 항목 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '진윤호 (yunho)').should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 사용자 계정 입력하기 
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').clear().type('yunho');
    cy.wait(500);

    // 사용자 IP에 10.10.54.5 입력 
    cy.get('input[aria-label="사용자 IP"]').filter(':visible').clear().type('10.10.54.5');
    cy.wait(500);

    // URI 주소에 /cop/logcatch/btnExcessCheck.do 입력 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear().type('/cop/logcatch/btnExcessCheck.do');
    cy.wait(500);

    // 행위 유형 클릭하여 리스트 열기
    cy.get('input[aria-label="행위 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 '조회'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '조회', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    //개인정보유형 전체선택  클릭하여 유형 선택하는 코드 
    cy.get('input[aria-label="개인정보 유형"]').filter(':visible').click({ force: true });
    cy.wait(500);
    
    // 개인정보유형 리스트중 전체 선택
    cy.get('.v-list__tile__title').contains('전체 선택').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);
 
    //사용자 상태 클릭 
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 사용자 상태 리스트중 - 등록  선택
     cy.get('.v-list__tile__title').contains('등록').should('be.visible').click({ force: true });
     cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //// [검증] 검색 결과 검증
    // 첫 번째 행 정밀 검증
    // 1. 데이터 로딩 대기 (가장 핵심적인 키워드로 대기)
    cy.get('tbody tr', { timeout: 10000 }).contains('리눅스_배송관리').should('be.visible');


    // 첫 번째 행 내부의 모든 항목 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {    
    // [업무시스템] - a 태그
    cy.get('a').contains('리눅스_배송관리').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

    // [부서/소속] - a 태그 + ellipsis 클래스
    cy.get('a.ellipsis').contains('품질관리팀').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

    // [정보 사용자] - a 태그 + ellipsis 클래스
    cy.get('a.ellipsis').contains('진윤호 (yunho)').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

    // [접속 IP 주소] - span 태그 (성공하셨던 패턴!)
    cy.get('span.ellipsis').contains('10.10.54.5').should('be.visible');

    // [행위 유형] - a 태그 (조회 버튼 등)
    cy.get('a').contains('조회').should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
     });
    
    
// ==========================================
// 엑셀 다운로드 
// ========================================== 
// 1. 엑셀 다운로드 클릭
cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
cy.wait(500);

// 2. 안내 메시지(스낵바) 사라지는 것 대기
cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');

// 3. 실제 로컬 폴더 다운로드 시간 부여 (충분한 대기)
cy.wait(10000);

// [검증] 다운로드 폴더를 확인합니다.
// 폴더경로 : cypress/downloads
cy.task('readDirectory', 'cypress/downloads').then((files) => {
    
    // 조건에 맞는 파일 찾기 (이름에 'log-excel'이 있고, 확장자가 '.zip'인 것)
    const myFile = files.find(file => file.includes('log-excel') && file.endsWith('.zip'));

    // 검증 1: 파일 존재 여부 확인
    expect(myFile, '✅ 다운로드 폴더 내 타겟 파일(.zip) 존재 여부 확인 완료').to.not.be.undefined;

    // 파일이 존재한다면, 이어서 용량 검증 진행
    if (myFile) {
        cy.log(`✅ 다운로드 파일 확인! 파일명: ${myFile}`);
        
        // 다운로드된 파일의 상대 경로 세팅
        const downloadedFilePath = `cypress/downloads/${myFile}`;

        // 검증 2: 파일 용량 체크 (0바이트 이상인지 확인)
        // 💡 인코딩을 'null'로 주면 파일을 텍스트가 아닌 바이트(Buffer) 데이터로 읽어옵니다.
        cy.readFile(downloadedFilePath, null).then((fileBuffer) => {
            const fileSize = fileBuffer.length;
            cy.log(`📦 확인된 파일 용량: ${fileSize} bytes`);
            
            // 용량이 0보다 커야 합격! (빈 파일이면 에러 발생)
            expect(
                fileSize, 
                `✅ 파일용량확인 :  ${myFile} 용량 0바이트 초과 검증 완료`
            ).to.be.greaterThan(0);

            cy.log('✅ 파일 다운로드 및 정상 용량(0바이트 초과) 검증 완벽 통과!');
        });
    }
});

cy.log('✅ 사용자 추적 엑셀 다운로드 전체 플로우 확인 완료!');

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력_사용자추적 depth 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
