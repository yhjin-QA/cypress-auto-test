// [2.9.7 현행화] 기간 입력칸 helper — 2.9.5.0부터 aria-label="기간"/라벨 '기간'이 비어 있어 달력 아이콘(event)으로 찾음
const dateInputs = () =>
  cy.get('.v-input__icon--prepend-inner i.material-icons')
    .filter(':visible')
    .filter((i, el) => el.innerText.trim() === 'event')
    .closest('.v-input');

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
describe('로그캐치 Depth 배포점검목록 동작 테스트', () => {
  
  it('13_Depth_점검_대시보드 자동화 시나리오', () => {

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
    // 점검(대시보드) 서브메뉴 
    // ==========================================
    cy.log('🚀 점검 탭 클릭');
    // [2.9.9.0] '점검'을 누르면 하위 메뉴(점검 대시보드 / 이상행위 대시보드)가 열림
    cy.contains('button', '점검').click({ force: true });
    cy.contains('.side-sub-menu-title', '점검 대시보드').should('be.visible').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/inspection/inspectionDashboard');
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');

    // 설명: 'v-btn__content' 안에 '검색'이라는 글자가 있고, 눈에 보이는지 확인
    cy.contains('.v-btn__content', '검색').should('exist');
    //검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 달력 아이콘 확인
    cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
    //자동갱신안함 문구확인
    cy.contains('자동 갱신 안함').filter(':visible').should('be.visible');
    // 데이터량 확인
    cy.contains('p', '개인정보 사용량').should('be.visible');
    cy.contains('p', '발생 이력 수').should('be.visible');
    cy.contains('p', '이상행위 발생 건수').should('be.visible');
    cy.contains('p', '접근 IP 주소').should('be.visible');
    cy.contains('p', '정보 사용자').should('be.visible');
    cy.contains('p', '접근 부서').should('be.visible');

    // 설명: 카드 제목(.v-card__title) 중에서 '개인정보 유형별 현황' 글자가 눈에 보이는지 확인
    cy.contains('.v-card__title', '개인정보 유형별 현황').should('be.visible');
    cy.contains('.v-card__title', '부서별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', 'IP주소별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황').should('be.visible');
    cy.contains('.v-card__title', '개인정보 사용자 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '이상행위 유형별 현황').should('be.visible');


    // 기간 - 시작 날짜 달력 지정하기 -------------------------------------------------
    // 1. 날짜 선택 (2월 1일로 선택)
    dateInputs().find('input[readonly]').first().click({ force: true });
    cy.wait(500)

    // 2. 두 개의 달력 테이블 중 첫 번째(왼쪽/시작일) 달력을 선택합니다.
    // 1. 상단 제목('2026년 3월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // 주의: 테이블 밖의 전체 영역에서 첫 번째 헤더 버튼을 찾습니다.
    cy.get('.v-date-picker-header__value button').filter(':visible').first().click({ force: true });
    cy.wait(500); // 월 선택 모드로 애니메이션이 전환될 시간 대기

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').first().contains('button', '2월').click({ force: true });
    cy.wait(500); // 다시 '일' 선택 달력으로 돌아올 시간 대기

    // 3. '1일'을 클릭합니다.
    cy.get('.v-date-picker-table').filter(':visible').first().contains('.v-btn__content', /^1일$/).closest('button').click({ force: true });
    cy.wait(500); 
    cy.get('body').type('{esc}');
    cy.log('✅ 시작 날짜(2/1) 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '오늘').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 오늘 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '어제').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 어제 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 이번 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '이번 주').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 이번 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 지난 주 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '지난 주').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 지난 주 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 7일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 7일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 7일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------

    // 기간 - 최근 14일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 14일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 14일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------


    // 기간 - 최근 30일 -------------------------------------------------
    // 1. 날짜 선택 인풋 클릭 (속성 기준)
     dateInputs().find('input[readonly]').first().click({ force: true });
     cy.wait(500)

    // 2. 팝업 내에서 '최근 30일' 텍스트를 가진 요소를 찾아 클릭합니다.
     cy.contains('.v-list-item__title, b', '최근 30일').should('be.visible').click({ force: true });

     cy.wait(500); // 클릭 후 달력이 닫히는 시간 확보
     cy.get('body').type('{esc}');
     cy.log('✅ 최근 30일 지정 성공');

     // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
    //-------------------------------------------------------------------------------------


   //자동갱신간격 조절하기 
   //자동갱신 5초------------------------------------------------------------------------------------
   // 1. Home 키를 눌러 슬라이더를 확실히 0(자동 갱신 안함)으로 보냅니다.
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });

   // 2. 원하는 값(10)이 될 때까지 화살표를 누릅니다. 
   // 만약 1번 입력에 5씩 움직인다면 .repeat(2)를, 1씩 움직인다면 .repeat(10)을 하세요.
   // 현재 30이 되었으므로, 안전하게 숫자를 확인하며 입력하는 루프를 씁니다.
   for(let i = 0; i < 5; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 5) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }

   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '5');
   cy.contains(/갱신 간격\s*5\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------


   //자동갱신 10초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 10; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 10) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '10');
   cy.contains(/갱신 간격\s*10\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 15초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 15; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 15) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '15');
   cy.contains(/갱신 간격\s*15\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 20초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 20; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 20) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '20');
   cy.contains(/갱신 간격\s*20\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 25초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
   for(let i = 0; i < 25; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 25) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '25');
   cy.contains(/갱신 간격\s*25\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

   //자동갱신 30초---------------------------------------------------------------------------------
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });
     for(let i = 0; i < 30; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 30) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }
   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '30');
   cy.contains(/갱신 간격\s*30\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------
   

    //자동갱신간격 조절하기 
   // ==========================================
   // 자동갱신간격 조절하기  5초 갱신확인
   // ==========================================
   //자동갱신 5초------------------------------------------------------------------------------------
   // 1. Home 키를 눌러 슬라이더를 확실히 0(자동 갱신 안함)으로 보냅니다.
   cy.get('input[role="slider"]').first().focus().type('{home}', { force: true });

   // 2. 원하는 값(10)이 될 때까지 화살표를 누릅니다. 
   // 만약 1번 입력에 5씩 움직인다면 .repeat(2)를, 1씩 움직인다면 .repeat(10)을 하세요.
   // 현재 30이 되었으므로, 안전하게 숫자를 확인하며 입력하는 루프를 씁니다.
   for(let i = 0; i < 5; i++) {
       cy.get('input[role="slider"]').first().then(($el) => {
           const val = parseInt($el.attr('aria-valuenow'));
           if (val < 5) {
               cy.wrap($el).type('{rightarrow}', { force: true });
           }
       });
   }

   // 3. 검증코드
   cy.get('input[role="slider"]').first().should('have.attr', 'aria-valuenow', '5');
   cy.contains(/갱신 간격\s*5\s*초/, { timeout: 5000 }).should('be.visible');
   cy.wait(1000);
   //----------------------------------------------------------------------------------

    // 자동갱신 5초후 새로고침 감지 --
    // 1. 감시 설정
    cy.intercept('GET', '**/logcatch/api/v1/chart-data/5**').as('chart5');

    // 2. [단계 1] 시스템 예열 및 첫 번째 신호 뭉치 흘려보내기
    cy.wait('@chart5', { timeout: 40000 }).then(() => {
    cy.log('🚀 첫 번째 신호 확인. 뭉치 요청 방지를 위해 10초 대기...');
    cy.wait(10000); 
    });

    // 3. [단계 2] 측정의 시작점(기준점) 잡기
    cy.wait('@chart5', { timeout: 35000 }).then(() => {
      const startTime = Date.now();
      cy.log('⏱️ 실제 주기 측정 시작...');
      cy.wait(5000); 

    
    // 4. [단계 3] 다음 주기 검증 및 UI 확인
    cy.wait('@chart5', { timeout: 35000 }).then((interception) => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        cy.log(`⏱️ 최종 측정된 순수 간격: ${duration.toFixed(2)}초`);

        // --- [A] 네트워크 데이터 검증 ---
        expect(duration).to.be.within(4, 40); 
        expect(interception.response.statusCode).to.equal(200);

        // --- [B] UI 상태 검증 ---
        // 슬라이더 옆 숫자가 '5 초'로 표시되는지 확인
        cy.contains('5 초').should('be.visible');

        // --- [C] 차트 렌더링 검증 (ApexCharts 전용) ---
        // 1. ApexCharts의 기본 컨테이너 클래스가 존재하는지 확인
        cy.get('.apexcharts-canvas').should('exist');

        // 2. 실제 차트 조각(path)이 화면에 그려졌고 눈에 보이는지 확인
        // 보내주신 태그의 클래스인 .apexcharts-pie-area를 사용합니다.
        cy.get('.apexcharts-pie-area').should('be.visible').and('have.attr', 'data:value'); // 데이터 값이 들어있는지도 체크

        cy.log('✅ 네트워크 갱신과 차트 렌더링 확인 완료');
      });
    });

   cy.log('✅ 5초 간격 실제 데이터 통신 검증 완료');


// v2.9.1.125_r35234
// 맨티스 이슈 : 
// ==========================================
// 점검 대시보드 차트 → 팝업 검증 (신규 버전) 팝업창 뜨는 호출사항만 확인
// ==========================================
// stub을 한 번만 설정
cy.window().then((win) => {
  cy.stub(win, 'open').as('windowOpen');
});

const clickChartAndVerifyPopup = (logLabel, clickAction) => {
  cy.log(`🔍 ${logLabel} 차트 클릭 검증`);

  clickAction();
  cy.wait(500);
  
  // 🌟 수정: p.mb-0 -> p.cc-msg 로 변경
  // [2.9.7] '상세 화면을 새 창에서 열기' 토글 ON 이면 문구가 '상세 화면을 새 창에서 여시겠습니까?' 로 바뀜
  cy.contains('p.cc-msg:visible', /상세 페이지로 이동하시겠습니까\?|상세 화면을 새 창에서 여시겠습니까\?/).should('be.visible');
  cy.wait(500);
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
  cy.wait(1000);

  cy.get('@windowOpen').should('have.been.called');
  cy.get('@windowOpen').then((stub) => {
    const popupUrl = stub.args[stub.args.length - 1][0];
    cy.log(`📎 팝업 URL: ${popupUrl}`);
    stub.resetHistory();
  });

  cy.log(`✅ ${logLabel} 팝업 검증 완료`);
  cy.wait(500);
};

// ==========================================
// 1. 개인정보 유형별 현황 → [휴대전화번호] 클릭
// ==========================================
clickChartAndVerifyPopup('개인정보 유형별 현황', () => {
  cy.contains('span.apexcharts-legend-text', '휴대전화번호')
    .should('be.visible').click({ force: true });
});

// ==========================================
// 2. 부서별 개인정보 사용 TOP 10
// ==========================================
clickChartAndVerifyPopup('부서별 개인정보 사용 TOP 10', () => {
  cy.contains('.v-card__title', '부서별 개인정보 사용 TOP 10')
    .closest('.v-card')
    .within(() => {
      cy.get('path.apexcharts-bar-area').first().click({ force: true });
    });
}, 'department');

// ==========================================
// 3. IP 주소별 개인정보 사용 TOP 10
// ==========================================
clickChartAndVerifyPopup('IP 주소별 개인정보 사용 TOP 10', () => {
  cy.get('canvas[data-zr-dom-id="zr_0"]')
    .filter(':visible').click('center', { force: true });
}, 'privacy');

// ==========================================
// 4. 업무시스템별 개인정보 사용 현황
// ==========================================
clickChartAndVerifyPopup('업무시스템별 개인정보 사용 현황', () => {
  cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황')
    .closest('.v-card')
    .within(() => {
      cy.get('.apexcharts-legend-text').first().click({ force: true });
    });
}, 'status');

// ==========================================
// 5. 개인정보 사용자 TOP 10
// ==========================================
clickChartAndVerifyPopup('개인정보 사용자 TOP 10', () => {
  cy.get('.apexcharts-canvas').eq(3)
    .find('path.apexcharts-bar-area').eq(0).click({ force: true });
}, 'privacy');

// ==========================================
// 6. 이상행위 유형별 현황
// ==========================================
// [2.9.7] 이상행위 발생 건수가 0이면 차트 대신 '조회 결과가 존재하지 않습니다' 표시 → 범례가 없어 건너뜀
cy.contains('.v-card__title', '이상행위 유형별 현황').closest('.v-card').then(($card) => {
  if ($card.find('span.apexcharts-legend-text').length === 0) {
    cy.log('⚠️ 이상행위 유형별 현황 데이터 없음(조회 결과 없음) - 차트 팝업 검증 건너뜀');
    return;
  }
  clickChartAndVerifyPopup('이상행위 유형별 현황', () => {
    cy.wrap($card).find('span.apexcharts-legend-text').first().click({ force: true });
  }, 'anomaly');
});

cy.log('🎉 점검 대시보드 모든 차트 팝업 검증 완료!');


  
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 점검 Depth 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });

  // ==========================================
  // [2.9.9.0 Depth] !1453 점검 > 이상행위 대시보드 — 접속기록 보기 카드 · 접속 내용 · 평소 사용 현황
  //   .21 은 활성 이상행위 정책이 없어 「접속기록 모니터링 대시보드」(정책이 켜져 있으면 「접속기록」 보기로 바꿈)
  //   1. 대시보드를 열어 둔 채 CRM user001(사원_1) dlp_tester.jsp 요청 2건 → 「사원_1 … 접속기록 N건 · 리눅스_VIP · 신규 기록」 카드가 흐름
  //   2. 일시정지 → 카드 클릭 → 열린 창 기록 → 닫기 → 재개
  //   3. 카드가 원판을 지나면 「접속 내용」 패널 : /crm/dlp_tester.jsp · 사원_1 · AI개발2팀 · 리눅스_VIP고객 · VIP_실시간DLP테스트 · [평소 사용 보기]
  //   4. [평소 사용 보기] → 「사원_1 · AI개발2팀 · 평소 사용 현황」 창 (최근 90일 · 오늘 제외 · 합계 4칸 · 표 9종)
  //   5. 판정(마지막) : 카드 클릭 창 = 그 사용자의 그날 접속기록 (릴리즈노트 !1453)
  //      ※ Mantis 0039151 (2026-11-24) : 카드를 누르면 접속기록이 아닌 「평소 사용 현황」 창이 열림
  //        → 사용자 결정 : 해결 전까지 이 판정은 주석(경고 로그 · D13B_0039151_관찰.json 기록만). 해결 빌드에서 주석 해제
  //   관찰 기록 : cypress/probe/D13B_관찰.json
  // ==========================================
  {
    const A = require('../../support/anomaly');
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const tx = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
    const uniq = (a) => [...new Set(a.filter(Boolean))];
    const p2 = (n) => String(n).padStart(2, '0');
    const kst = (ms) => { const d = new Date(ms + 9 * 3600e3); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
    const obs = {};
    const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/D13B_관찰.json', obs, { log: false }); };
    const ME = /사원_1(?!\d)/;
    const dlgs = ($b) => $b.find('.v-dialog--active, [role=dialog]').filter((i, e) => vis(e));
    const dlgInfo = ($b) => {
      const d = dlgs($b).last()[0];
      if (!d) return null;
      const lines = uniq((d.innerText || '').split('\n').map((x) => x.trim()));
      // 첫 줄이 닫기 아이콘 글자(close)라 아이콘 글자를 건너뛴 첫 줄을 제목으로 (11-24 3차 실행)
      const title = lines.find((x) => !/^(close|fullscreen|bookmark|notifications\w*|search)$/.test(x)) || '';
      return { 제목: title, 문구: lines.slice(0, 300), th: uniq([...d.querySelectorAll('th')].filter(vis).map(tx)), 행: [...d.querySelectorAll('tbody tr')].filter(vis).slice(0, 10).map((r) => tx(r).slice(0, 200)) };
    };
    const closeDlg = () => cy.get('body').then(($b) => {
      const d = dlgs($b).last();
      if (!d.length) return;
      const x = d.find('button, .v-btn, i.v-icon').filter((i, e) => vis(e) && (/^(close|닫기)$/.test(tx(e)) || /닫기|close/i.test(e.getAttribute('aria-label') || '')))[0];
      if (x) cy.wrap(x).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
      cy.wait(1200);
    });
    const btn = (re) => cy.get('button').filter((i, e) => vis(e) && re.test(tx(e)));
    // 흐르는 카드 = .flow-card-name(사원_1) 을 품은 카드 (probe_299k 11-24 : B.flow-card-name · 카드 글자 「사원_1 AI개발2팀 15:23:25 접속기록 2건 · 리눅스_VIP고객 신규 기록」)
    //   ※ 접속기록이 조회 API 에 잡히기까지 요청 후 10~50초 걸림 · 카드는 약 8초 동안 보인 뒤 원판으로 들어감
    const findCards = ($b) => $b.find('.flow-card-name').filter((i, e) => vis(e) && ME.test(tx(e))).toArray()
      .map((e) => { let c = e; for (let i = 0; i < 6 && c && !/접속기록\s*\d+\s*건/.test(tx(c)); i += 1) c = c.parentElement; return c; })
      .filter((c) => c && /접속기록\s*\d+\s*건/.test(tx(c)) && tx(c).length < 200);
    // 접속 내용 패널 = .insight (probe_299k : SPAN.insight-subject 「사원_1 · AI개발2팀」 의 상위 DIV.insight)
    const panel = ($b) => $b.find('.insight').filter((i, e) => vis(e)).first();
    const SEEN = [];

    it('[2.9.9.0] !1453 이상행위 대시보드 — 신규 기록 카드 · 접속 내용 · 평소 사용 현황 · 카드 클릭 접속기록 (0039151)', { retries: 0 }, () => {
      A.ignoreErrors();
      A.loginAdmin();
      cy.visit('/logcatch/inspection/anomalyMonitoringDashboard');
      cy.contains(/모니터링 대시보드/, { timeout: 30000 }).should('be.visible');
      cy.wait(3000);
      // 정책이 켜져 「이상행위」 보기라면 「접속기록」 보기로 바꿈
      cy.get('body').then(($b) => {
        const title = uniq($b.find('*').filter((i, e) => vis(e) && e.children.length === 0 && /모니터링 대시보드/.test(tx(e))).toArray().map(tx));
        note('0_제목', title);
        const sw = $b.find('button').filter((i, e) => vis(e) && tx(e) === '접속기록')[0];
        if (!title.includes('접속기록 모니터링 대시보드') && sw) { cy.wrap(sw).click({ force: true }); cy.wait(3000); }
      });
      cy.contains('실시간 접속기록').should('be.visible');

      // ---------- 1. 요청 2건 → 신규 기록 카드 ----------
      let SENT = '';
      cy.then(() => { SENT = kst(Date.now() - 5000).slice(11, 19); });
      [1, 2].forEach(() => cy.task('crmFetch', { userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'GET', maxBody: 0 }, { timeout: 90000, log: false }));
      const CARD = { 글자: null, 창: null };
      const hunt = (left) => cy.get('body').then(($b) => {
        $b.find('.flow-card-name').filter((i, e) => vis(e)).each((i, e) => { const k = tx(e); if (!SEEN.includes(k)) SEEN.push(k); });
        const cs = findCards($b).filter((c) => /신규 기록/.test(tx(c)));
        if (cs.length) {
          CARD.글자 = tx(cs[0]);
          note('1_카드', CARD.글자);
          // 2. 일시정지 → 카드 클릭
          btn(/일시정지$/).first().click({ force: true });
          cy.wait(800);
          cy.get('body').then(($b2) => {
            const c2 = findCards($b2).find((c) => tx(c) === CARD.글자) || findCards($b2)[0];
            if (c2) cy.wrap(c2).click({ force: true });
          });
          cy.wait(3000);
          cy.get('body').then(($b3) => { CARD.창 = dlgInfo($b3); note('2_카드클릭_창', CARD.창); });
          cy.screenshot('D13B_2_카드클릭', { capture: 'viewport', overwrite: true });
          closeDlg();
          cy.get('body').then(($b4) => { const r = $b4.find('button').filter((i, e) => vis(e) && /재개$/.test(tx(e)))[0]; if (r) cy.wrap(r).click({ force: true }); });
          return;
        }
        if (left <= 0) { note('1_카드', { 결과: '150초 안에 사원_1 신규 기록 카드 없음', 본카드이름: SEEN }); return; }
        cy.wait(1000, { log: false });
        hunt(left - 1);
      });
      hunt(150);

      // ---------- 3. 접속 내용 패널 (카드가 원판을 지난 뒤) ----------
      const PANEL = { 글자: null };
      const waitPanel = (left) => cy.get('body').then(($b) => {
        const p = panel($b);
        const s = p.length ? tx(p[0]) : '';
        // 이번 카드의 시각(예 15:36:42)이 패널에 나올 때까지 (이전 실행의 기록이 남아 있을 수 있음 · 11-24 4차)
        const at = ((CARD.글자 || '').match(/\d{2}:\d{2}:\d{2}/) || [''])[0];
        if ((/dlp_tester\.jsp/.test(s) && ME.test(s) && (!at || s.includes(at))) || left <= 0) { PANEL.글자 = s; note('3_접속내용', { 카드시각: at, 패널: s }); return; }
        cy.wait(1000, { log: false });
        waitPanel(left - 1);
      });
      waitPanel(60);

      // ---------- 4. 평소 사용 보기 ----------
      const PROF = { 창: null };
      cy.get('body').then(($b) => {
        const b = panel($b).find('button, .v-btn, a').filter((i, e) => vis(e) && /평소 사용 보기/.test(tx(e)))[0];
        if (b) cy.wrap(b).click({ force: true });
      });
      cy.wait(4000);
      cy.get('body').then(($b) => { PROF.창 = dlgInfo($b); note('4_평소사용_창', PROF.창); });
      cy.screenshot('D13B_4_평소사용', { capture: 'viewport', overwrite: true });
      closeDlg();

      // ---------- 판정 ----------
      cy.then(() => {
        expect(CARD.글자, '!1453 화면을 연 뒤 보낸 요청이 「사원_1 … 신규 기록」 카드로 흐름').to.be.a('string');
        expect(CARD.글자, '카드 내용 (사용자 · 부서 · 건수 · 업무시스템)').to.match(/사원_1\s*AI개발2팀.*접속기록\s*\d+\s*건.*리눅스_VIP/);
        const at = ((CARD.글자 || '').match(/\d{2}:\d{2}:\d{2}/) || [''])[0];
        expect(PANEL.글자, `「접속 내용」 패널 = 방금 카드의 기록 (${at})`).to.include(at);
        expect(PANEL.글자, '「접속 내용」 패널 = 방금 기록 (URI · 사용자 · 메뉴 · 접속 IP)').to.match(/\/crm\/dlp_tester\.jsp\s*사원_1\s*·\s*AI개발2팀/);
        expect(PANEL.글자, '「접속 내용」 패널 업무시스템 · 메뉴').to.include('리눅스_VIP고객 · VIP_실시간DLP테스트');
        expect(PANEL.글자, '「접속 내용」 패널 접속 IP · 평소 사용 보기').to.match(/접속 IP\s*10\.10\.0\.72.*평소 사용 보기/);
        expect(PROF.창, '[평소 사용 보기] 창 열림').to.not.eq(null);
        expect(PROF.창.제목, '[평소 사용 보기] 창 제목').to.match(/사원_1\s*·\s*AI개발2팀\s*·\s*평소 사용 현황/);
        const all = PROF.창.문구.join(' ');
        expect(all, '평소 사용 현황 기간 안내').to.include('최근 90일 동안의 합계입니다. 오늘은 빼고 셉니다.');
        ['사용자 계정 합계', '접속 기록', '개인정보 건수', '정보주체 수', '파일 다운로드', '시간대', '접속 요일', '사용자 IP', '등록된 메뉴', '정규화 URI', '업무시스템', '개인정보 유형', '행위 유형']
          .forEach((s) => expect(all, `평소 사용 현황 「${s}」`).to.include(s));
        // 마지막 : 카드 클릭 → 그날 접속기록
        //   [2026-11-24 사용자 결정] Mantis 0039151 이 고쳐질 때까지 판정은 주석 처리(전체 실행 빨간불 방지) — 열린 창 제목만 기록 · 경고 로그
        //   0039151 해결 빌드에서 아래 /* … */ 주석을 풀어 판정
        expect(CARD.창, '카드 클릭 후 창 열림').to.not.eq(null);
        cy.writeFile('cypress/probe/D13B_0039151_관찰.json', { 시각: new Date().toISOString(), 카드: CARD.글자, 카드클릭창제목: CARD.창.제목, 재현: /평소 사용 현황/.test(CARD.창.제목) }, { log: false });
        if (/평소 사용 현황/.test(CARD.창.제목)) cy.log(`⚠️ Mantis 0039151 재현 — 카드 클릭 창 「${CARD.창.제목}」 (기대: 그날 접속기록)`);
        /* [0039151 해결 후 주석 해제]
        expect(CARD.창.제목, '!1453 카드 클릭 창 — 「평소 사용 현황」이 아닌 그 사용자의 그날 접속기록이어야 함 (Mantis 0039151)').to.not.match(/평소 사용 현황/);
        const today = kst(Date.now()).slice(0, 10);
        expect(CARD.창.문구.join(' ') + CARD.창.행.join(' '), `카드 클릭 창에 오늘(${today}) 사원_1 dlp_tester 접속기록`).to.match(new RegExp(`${today}[\\s\\S]*dlp_tester|dlp_tester[\\s\\S]*${today}`));
        */
      });
      cy.log(`요청 기준 시각 ${SENT}`);
    });
  }
});  

//코드마지막


 })()
;
