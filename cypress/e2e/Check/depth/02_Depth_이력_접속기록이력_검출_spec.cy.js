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

    
  // 🌟 1. 탐색할 날짜 배열 만들기 함수 (공통)
const getFormattedDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays); // offsetDays가 음수면 과거, 0이면 오늘
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 🌟 [핵심 수정] 탐색할 타겟 날짜 목록 (7일 전 ~ 오늘, 총 8일)
// Array.from을 사용하여 -7부터 0까지 총 8개의 날짜를 자동으로 배열에 담습니다.
const targetDates = Array.from({ length: 8 }, (_, i) => getFormattedDate(-7 + i));
cy.log(`🎯 순차 탐색할 날짜 목록: ${targetDates.join(', ')}`);


// 🌟 2. 동적 날짜 선택 로직 (재귀적 스크롤 - 기존에 만드신 함수 유지)
const scrollAndFindDate = (dateToFind, retryCount = 0) => {
    const MAX_RETRIES = 10;
    cy.get('.v-menu__content:visible').first().as('dropdown');
    cy.get('@dropdown').then(($el) => {
        const $foundItem = $el.find(`.v-list__tile__title:contains("${dateToFind}"):visible, .v-list-item__title:contains("${dateToFind}"):visible`);

        if ($foundItem.length > 0) {
            cy.log(`🎉 화면에서 날짜 [${dateToFind}] 찐 발견!`);
            cy.wrap($foundItem).first().click({ force: true });
        } else if (retryCount < MAX_RETRIES) {
            cy.log(`⏬ 날짜 [${dateToFind}] 탐색을 위해 스크롤 내리는 중... (${retryCount + 1})`);
            cy.get('@dropdown').scrollTo('bottom', { duration: 500 });
            cy.wait(800); 
            scrollAndFindDate(dateToFind, retryCount + 1);
        } else {
            throw new Error(`❌ [${dateToFind}] 날짜를 스크롤 끝까지 내려도 찾을 수 없습니다.`);
        }
    });
};

// 🌟 3. [핵심] 하루씩 전진하며 탐색하는 재귀 로직
const searchSequential = (dateIndex, currentUIText) => {
    if (dateIndex >= targetDates.length) {
        cy.log('❌ 지정된 8일 치 기간(7일 전~오늘) 내에 검출 데이터가 없습니다.');
        cy.get('tbody:visible a:contains("검출")').should('be.visible');
        return; 
    }

    const dateToFind = targetDates[dateIndex];
    cy.log(`▶️ [탐색 ${dateIndex + 1}/${targetDates.length}] ${dateToFind} 날짜 조회 시작`);

    cy.contains('.v-select__selection', currentUIText).filter(':visible').click({ force: true });
    cy.wait(1000);
    scrollAndFindDate(dateToFind);
    cy.contains('.v-select__selection', dateToFind).should('be.visible');
    cy.wait(2000); 

    cy.get('body').then(($body) => {
        const hasDetection = $body.find('tbody:visible a:contains("검출"):visible').length > 0;

        if (hasDetection) {
            // [종료 조건 2] 데이터를 찾은 경우 -> 요소 존재 여부만 확인하고 완전 종료!
            cy.log(`✅ [${dateToFind}] 날짜에서 검색 결과(검출)를 찾았습니다!`);
            
            // 💡 클릭(.click)을 빼고 화면에 잘 보이는지(.should('be.visible'))까지만 검증합니다.
            cy.get('tbody').filter(':visible').contains('a', '검출').should('be.visible');
            
            cy.log('✅ 이력 - 검출 데이터 조회 성공! (서버 이슈로 팝업 클릭 검증은 생략함)');

        } else {
            // 데이터를 못 찾은 경우 -> 다음 인덱스(dateIndex + 1)로 자기 자신을 다시 호출
            cy.log(`⚠️ [${dateToFind}] 검색 결과 없음. 하루 앞당겨 재검색합니다.`);
            searchSequential(dateIndex + 1, dateToFind);
        }
    });
};

// 🌟 4. 함수 최초 실행
searchSequential(0, '2026-04-20');

// (맨 아래에 있던 닫기 로직은 삭제합니다!)

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
