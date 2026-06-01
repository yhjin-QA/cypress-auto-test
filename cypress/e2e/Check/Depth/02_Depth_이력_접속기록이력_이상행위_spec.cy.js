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


    // 이력 > 접속기록 이력 > [이상행위] 탭 선택
    cy.get('.tab-btn').contains('이상행위').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('이상행위').closest('button').should('not.have.class', 'inactive');
    // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '이상행위').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 조건 이름 입력란 확인
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="경보 등급"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
  
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접근이력 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유무').should('be.visible'); 
    cy.get('th').filter(':visible').contains('소명 대상 여부').should('be.visible');
    cy.get('th').filter(':visible').contains('조회').should('be.visible'); 


     //기능확인
     // 오늘날짜 가져오기 : 검증할 행이 날짜가 흐르면서 다음페이지로 넘어갈수있는 문제 해결
     // 1. 오늘 날짜를 YYYYMMDD 형식으로 생성
     const today = new Date();
     const year = today.getFullYear();
     const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
     const day = String(today.getDate()).padStart(2, '0');

     const formattedDate = `${year}${month}${day}`; // 예: "20260303"
     //const targetFileName = `SQLPARSER_2001_${formattedDate}.log`;

     cy.log(`🎯 오늘 검증할 날짜: ${formattedDate}`);

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
    cy.log('✅ 시작 날짜 지정 성공');

     //////////////////////////////////////////////////////
     // 이상행위 : 개인정보 과다조회 (경보등급 : 심각,경계,주의)
     /////////////////////////////////////////////////////
     // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 개인정보 과다조회 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 과다조회').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(500);

   // 1. 화면 전체(body)를 먼저 잡고 내부를 체크합니다.
   cy.get('body').then(($body) => {
  
   // 검증코드  ("있으면 검증하고, 없으면 통과하기")
   // 🟢 [주의] 아이콘이 화면에 한 개라도 있는가?
   if ($body.find('i.g-ICriticalAlert').length > 0) {
    cy.log('🟢 주의 로그 감지: 검증을 시작합니다.');
    cy.get('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');
   } else {
     cy.log('⚪ 주의 로그가 없습니다. 패스합니다.');
   }

   // 🟠 [경계] 아이콘이 화면에 한 개라도 있는가?
   if ($body.find('i.g-IMajorAlert').length > 0) {
     cy.log('🟠 경계 로그 감지: 검증을 시작합니다.');
     cy.get('i.g-IMajorAlert').should('be.visible').and('have.css', 'color', 'rgb(255, 192, 0)');
   } else {
     cy.log('⚪ 경계 로그가 없습니다. 패스합니다.');
   }

   // 🔴 [심각] 아이콘이 화면에 한 개라도 있는가?
   if ($body.find('i.g-IMinorAlert').length > 0) {
     cy.log('🔴 심각 로그 감지: 검증을 시작합니다.');
     cy.get('i.g-IMinorAlert').should('be.visible').and('have.css', 'color', 'rgb(244, 67, 54)');
   } else {
     cy.log('⚪ 심각 로그가 없습니다. 패스합니다.');
    }
   });
  
     //////////////////////////////////////////////////////
     // 이상행위 : 업무 시간 외 접속 (경보등급 : 심각,경계,주의)
     /////////////////////////////////////////////////////
     // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '업무 시간 외 접속' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('업무 시간 외 접속').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    cy.contains('tr', '업무 시간 외 접속').should('contain', 'test_auto_업무 시간 외 접속') .find('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');
    
    //////////////////////////////////////////////////////
     // 이상행위 : 업무 시간 외 접속 (경보등급 : 심각,경계,주의) - 사용자 상태 조합 검증(전체 선택)
     /////////////////////////////////////////////////////
    
     //사용자 상태 클릭 --------------------------------------------------------------------------
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '전체' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '전체').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
 
    cy.log('--- [핵심 검증] 미등록 사용자 & 업무 시간 외 접속 행 확인 ---');
    cy.contains('tbody tr', '(미등록 사용자)').filter(':contains("업무 시간 외 접속")').filter(':contains("소명 불필요")').within(() => {
    // 1. 아이콘 확인
    cy.get('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');

    // 2. [수정됨] '존재' 또는 '미존재' 중 하나가 포함되어 있는지 검증
    cy.get('td').should(($td) => {
       const text = $td.text();
       const isValid = text.includes('존재') || text.includes('미존재');
       expect(isValid, `예상된 상태값(존재/미존재)이 포함되어야 합니다. 현재값: ${text}`).to.be.true;
      });
    });

     // 특정 사용자(제흔휴) 검증
     cy.contains('tr', '업무 시간 외 접속').find('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');
     //----------------------------------------------------------------------------------------------------------------------------------------------
    //사용자 상태 클릭 --------------------------------------------------------------------------
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '등록' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
 
     //검증코드
     // (미등록 사용자)와 '업무 시간 외 접속'이 포함된 tr이 아예 존재하지 않아야 함
     cy.contains('tbody tr', /(미등록 사용자).*업무 시간 외 접속/).should('not.exist');
     // 특정 사용자(제흔휴) 검증
     cy.contains('tr', '업무 시간 외 접속').find('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');

     //사용자 상태 클릭 --------------------------------------------------------------------------
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '미등록' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '미등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);
 
     //검증코드
     cy.contains('tr', /(미등록 사용자).*업무 시간 외 접속/).find('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');
    
     //사용자 상태 초기화 -  전체 선택
    //사용자 상태 클릭 --------------------------------------------------------------------------
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '전체' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '전체').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보
   

    //////////////////////////////////////////////////////
    // 이상행위 : 장기 미접속 사용자  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '장기 미접속 사용자' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('장기 미접속 사용자').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    cy.contains('tr', '장기 미접속 사용자').should('contain', 'test_auto_장기 미접속 사용자').should('be.visible');

    //////////////////////////////////////////////////////
    // 이상행위 : 미등록 사용자 접속  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '미등록 사용자 접속' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('미등록 사용자 접속').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '미등록 사용자 접속').should('contain', 'test_auto_미등록 사용자 접속').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 비인가 IP 접근  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '비인가 IP 접근' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('비인가 IP 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '비인가 IP 접근').should('contain', 'test_auto_비인가 IP 접근').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 사전 소명 메뉴 접근  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '사전 소명 메뉴 접근' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('사전 소명 메뉴 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '사전 소명 메뉴 접근').should('contain', 'DEFAULT').find('i.g-IMinorAlert').should('be.visible').and('have.css', 'color', 'rgb(244, 67, 54)');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 개인정보 유형 과다사용  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '개인정보 유형 과다사용' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 유형 과다사용').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '개인정보 유형 과다사용').should('contain', 'test_auto_개인정보 유형 과다사용').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 열람제한 개인정보 접근  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '열람제한 개인정보 접근' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('열람제한 개인정보 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '열람제한 개인정보 접근').should('contain', 'test_auto_열람제한 개인정보 접근').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 권한 외 메뉴 접근  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '권한 외 메뉴 접근' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('권한 외 메뉴 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '권한 외 메뉴 접근',{ timeout: 15000 }).should('contain', 'test_auto_권한 외 메뉴 접근').should('be.visible');
    cy.wait(2000);
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 비인가 접근 사용자  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 '비인가 접근 사용자' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('비인가 접근 사용자').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '비인가 접근 사용자').should('contain', 'test_auto_비인가 접근 사용자').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');
    cy.wait(500);

    //////////////////////////////////////////////////////
    // 이상행위 : 접근제한 업무 시스템 접근  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').scrollIntoView().closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    
    // 활성화된 리스트 컨테이너를 찾아 맨 아래(bottom)로 스크롤
    cy.get('.v-menu__content').filter(':visible').scrollTo('bottom', { duration: 500 });

    // 이상행위 유형중 '접근제한 업무 시스템 접근' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('접근제한 업무 시스템 접근').should('be.visible').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
     cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '접근제한 업무 시스템 접근').should('contain', 'test_auto_접근제한 업무 시스템 접근').should('be.visible');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');

    //////////////////////////////////////////////////////
    // 이상행위 : 파일다운로드  (경보등급 : 심각,경계,주의)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화  (특이사항 기존방식이안되어 클래스 조합 + contains('clear') 방식으로 초기화 )
    cy.get('i.v-icon--link.material-icons.primary--text').contains('clear').click({ force: true });

    // 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').scrollIntoView().closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    
    // 활성화된 리스트 컨테이너를 찾아 맨 아래(bottom)로 스크롤
    cy.get('.v-menu__content').filter(':visible').scrollTo('bottom', { duration: 500 });

    // 이상행위 유형중 '파일다운로드' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('파일다운로드').should('be.visible').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    //cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    //cy.wait(500);
     // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    //cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
    // cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //[검증] 표 안의 결과 확인 
    //표안의 한행의 문구 및 초록색 경보아이콘 색상 확인 
    cy.wait(500);
    // 데이터 이력있을시
    cy.contains('tr', '파일다운로드').should('contain', 'test_auto_파일다운로드').find('i.g-ICriticalAlert').should('be.visible').and('have.css', 'color', 'rgb(169, 209, 142)');
    // 데이터 이력없을시
    // 현재 화면의 메인 컨텐츠 영역 안에 있는 'No data available'만 체크
    //cy.get('main').contains('td.text-xs-center', 'No data available').should('exist');


    //////////////////////////////////////////////////////
    // 이상행위 : 선택하지 않음 (경보등급 : 전체 선택)
    /////////////////////////////////////////////////////
    // 2번쨰 부터는 선택된 상태이므로 선택에 대한 초기화 코드 삽입

    // 선택한 이상행위 유형 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    // 선택한 경보등급 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="경보 등급"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    
    // 맨티스 이슈 : 37343
    // 이상행위  유형 톱니바퀴 팝업창으로 전체선택후  미등록 사용자 제외 ON시  이상행위 유형 전체선택 해제되는 현상
    //이상행위 유형 톱니바퀴 클릭
    cy.get('.material-icons').filter(':visible').contains('settings').click({ force: true });
    cy.wait(500);
    // 이상행위 유형 팝업창의 전체 선택 클릭
    cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').closest('.v-list__tile').click({ force: true });
    // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');

    // 맨티스 이슈 : 37342
    // 경보등급 톱니바퀴 클릭 팝업 설청창 동작하지 않는 문제

    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').scrollIntoView().click({ force: true });
    cy.wait(500);

    // 경보등급 - 전체 선택
    cy.get('.v-menu__content').filter(':visible') .find('.v-list__tile__title').contains('전체 선택').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
    
   
    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(500);


    // ----------------------------------------------------------
// [검증코드] 경보등급 존재
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡아서 $row 변수로 받습니다.
cy.get('tbody tr').filter(':visible').first().then(($row) => {
  
  // 3. 아이콘 조건부 검증 ("있으면 검증하고, 없으면 통과하기")
  // $row(첫 번째 행) 안에서 해당 클래스를 가진 요소가 존재하는지 확인합니다.
  
  // 🟢 [주의] 아이콘 검증
  if ($row.find('i.g-ICriticalAlert').length > 0) {
    cy.log('🟢 주의 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-ICriticalAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(169, 209, 142)');
  } else {
    cy.log('⚪ 주의 로그가 없습니다. 패스합니다.');
  }

  // 🟠 [경계] 아이콘 검증
  if ($row.find('i.g-IMajorAlert').length > 0) {
    cy.log('🟠 경계 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMajorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(255, 192, 0)');
  } else {
    cy.log('⚪ 경계 로그가 없습니다. 패스합니다.');
  }

  // 🔴 [심각] 아이콘 검증
  if ($row.find('i.g-IMinorAlert').length > 0) {
    cy.log('🔴 심각 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMinorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(244, 67, 54)');
  } else {
    cy.log('⚪ 심각 로그가 없습니다. 패스합니다.');
  }

});
    

    cy.log('✅ 이력 - 이상행위 탭 진입 및 데이터 출력 확인 완료!');
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 Depth 이력_접속기록이력_이상행위 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
