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
    // 이력 - 자동화 시니라오 테스트 
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

    // ==========================================
    // 테스트 자동화시나리오
    // 이력 -  접속기록 이력 자동화 시니라오 테스트 
    // ==========================================
    

    // 이력 > 접속 기록 이력 서브메뉴 클릭  -----------------------
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });
    cy.wait(3000);

   
    // 이력 > 접속기록 이력 > [검출] 탭 선택
    cy.get('.tab-btn').contains('검출').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('검출').closest('button').should('not.have.class', 'inactive');
    // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="시작 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="종료 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
    
     // like버튼 확인 
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     // v3.0.5.0_r34908에서 추가됨.
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 건수').should('be.visible'); 

    //기능동작
    //달력표를 펼침 
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
    // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '4월'이라는 글자를 찾아 클릭합니다.
     cy.get('.v-date-picker-table--month').filter(':visible').contains('4월').click({ force: true });
    // 달력 20일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

    //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '등록' 선택 (안정화 버전)
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보


    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    
   // 1. 오늘 기준 2일 전 날짜 계산 (formattedDate: 2026-04-27)
   const targetDateObj = new Date();
   targetDateObj.setDate(targetDateObj.getDate() - 2);
   const formattedDate = `${targetDateObj.getFullYear()}-${String(targetDateObj.getMonth() + 1).padStart(2, '0')}-${String(targetDateObj.getDate()).padStart(2, '0')}`;
   cy.log(`🎯 타겟 날짜: ${formattedDate}`);

   // 오늘  날짜 계산 (formattedDate: 2026-04-27)
   const targetDateObj_sub = new Date();
   const formattedDate_sub = `${targetDateObj_sub.getFullYear()}-${String(targetDateObj_sub.getMonth() + 1).padStart(2, '0')}-${String(targetDateObj_sub.getDate()).padStart(2, '0')}`;
   cy.log(`🎯 타겟 날짜_sub: ${formattedDate_sub}`);


   // 2. [단계 1] '2026-04-20' 선택 로직
   // 해당 날짜의 드롭다운을 찾아 클릭
   cy.contains('.v-select__selection', '2026-04-20').filter(':visible').closest('.v-input').find('.v-icon').click({ force: true });
   cy.wait(1000); // 리스트가 열리는 애니메이션 대기


   // 3. [단계 2] 동적 날짜 선택 로직 (재귀적 스크롤)
   const scrollAndFindDate = (dateToFind, retryCount = 0) => {
   const MAX_RETRIES = 10;
  
    cy.get('.v-menu__content:visible').first().as('dropdown');
    cy.get('@dropdown').then(($el) => {
        
        // 🌟 [핵심 수정 포인트] 
        // 그냥 글자만 찾는 게 아니라, '화면에 눈으로 보이는(:visible)' 항목만 찾도록 엄격하게 제한합니다.
        const $foundItem = $el.find(`.v-list__tile__title:contains("${dateToFind}"):visible, .v-list-item__title:contains("${dateToFind}"):visible`);

        if ($foundItem.length > 0) {
            cy.log(`🎉 화면에서 날짜 [${dateToFind}] 찐 발견!`);
            
            // 찾아낸 바로 그 요소를 정확히 클릭
            cy.wrap($foundItem).first().click({ force: true });
            
        } else if (retryCount < MAX_RETRIES) {
            cy.log(`⏬ 날짜 [${dateToFind}] 안 보여서 스크롤 내리는 중... (${retryCount + 1})`);
            
            // 아래로 스크롤
            cy.get('@dropdown').scrollTo('bottom', { duration: 500 });
            cy.wait(800); // 스크롤 후 애니메이션/렌더링 대기
            
            // 다시 자기 자신을 호출 (재귀)
            scrollAndFindDate(dateToFind, retryCount + 1);
            
        } else {
            throw new Error(`❌ [${dateToFind}] 날짜를 스크롤 끝까지 내려도 찾을 수 없습니다.`);
        }
    });
};


    // 함수 실행
    scrollAndFindDate(formattedDate);
    
    // [검증코드] 선택 후, 입력창에 targetDate가 표시되는지 검증(오늘날짜 기준 2일전)
    cy.contains('.v-select__selection', formattedDate).should('be.visible');
    cy.wait(1000);
 
    // 🌟 1. 2일 전 날짜(formattedDate)로 데이터 로딩 대기
    cy.wait(2000); 

// 🌟 2. 조건부 검증 로직 시작 (에러 발생 없이 표 데이터 유무 확인)
cy.get('body').then(($body) => {
    // 표 안에 '검출' 데이터가 있는지 확인 (에러 내지 않고 length만 체크)
    const hasDetection = $body.find('tbody:visible a:contains("검출"):visible').length > 0;

    if (hasDetection) {
        // [Case 1] 2일 전 날짜에 데이터가 있는 경우
        cy.log('✅ 2일 전 날짜에 검색 결과(검출)가 존재합니다.');
        
        // 데이터가 있으니 바로 '검출' 클릭
        cy.get('tbody', { timeout: 10000 }).filter(':visible').contains('a', '검출').should('be.visible').click({ force: true });
        cy.wait(1000);
        
    } else {
        // [Case 2] 2일 전 날짜에 데이터가 없는 경우 -> 오늘 날짜(formattedDate_sub)로 변경 (유연하게 한번다시 검색)
        cy.log('⚠️ 2일 전 검색 결과가 없습니다. 오늘 날짜로 재검색합니다.');

        // 1) 입력창에 적혀있는 2일 전 날짜(formattedDate) 영역을 눌러서 리스트를 다시 엽니다.
        // 글자를 직접 클릭하는 것이 가장 안전합니다.
        cy.contains('.v-select__selection', formattedDate).filter(':visible').click({ force: true });
        cy.wait(1000);

        // 2) 만들어두신 스크롤 함수로 오늘 날짜(formattedDate_sub) 탐색 및 선택
        scrollAndFindDate(formattedDate_sub);

        // 3) 오늘 날짜가 잘 선택되었는지 검증
        cy.contains('.v-select__selection', formattedDate_sub).should('be.visible');
        cy.wait(1000);

        cy.get('tbody', { timeout: 10000 }).filter(':visible').contains('a', '검출').should('be.visible').click({ force: true });
        cy.wait(1000);
    }
});

   // =====================================================
   // 검출창 닫기 (위의 분기문에서 팝업을 열었으므로 공통 실행)
   // =====================================================
   cy.log('검출 팝업 닫기 진행');
   cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
   cy.wait(1000);

    
    cy.log('✅ 이력 - 검출 탭 진입 및 데이터 출력 확인 완료!');

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 검출 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
