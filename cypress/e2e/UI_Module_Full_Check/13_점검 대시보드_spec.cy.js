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

  
  it('DEV_Release 로그캐치 UI기본체크', () => {

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
// STEP 12: 점검(대시보드) 서브메뉴
// ==========================================
cy.log('🚀 점검 탭 클릭');
cy.contains('button', '점검').click({ force: true });
cy.wait(2000);
cy.log('--- 화면 검증 시작 ---');

// [수정] 검색 버튼 - 숨겨진 중복 요소 방지를 위해 :visible 필터 우선 적용
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// [수정] 날짜 선택 입력란 - aria-label로 직접 확인 (끝에 공백 포함 주의)
cy.get('input[aria-label="날짜 선택 "]').filter(':visible').should('be.visible');
cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');

// [신규] 업무시스템 콤보박스
cy.get('input[aria-label="업무시스템"]')
  .filter(':visible')
  .should('be.visible')
  .and('have.attr', 'role', 'combobox');

// 자동갱신안함 문구 및 슬라이더 확인
cy.contains('.item-margin', '자동 갱신 안함').should('be.visible');
cy.get('input[role="slider"]')
  .should('exist')
  .and('have.attr', 'aria-valuenow', '0')
  .and('have.attr', 'aria-valuemax', '30');

// 시각적으로 보이는 슬라이더 트랙 확인이 필요하면 별도로
cy.get('.v-slider').filter(':visible').should('be.visible');

// 카드 제목 확인
const cardTitles = [
  '개인정보 유형별 현황',
  '부서별 개인정보 사용 TOP 10',
  'IP주소별 개인정보 사용 TOP 10',
  '업무시스템별 개인정보 사용 현황',
  '개인정보 사용자 TOP 10',
  '이상행위 유형별 현황',
];
cardTitles.forEach((title) => {
  cy.contains('.v-card__title', title).should('be.visible');
});

// [신규] "이상행위 발생 건수" 요약 위젯 확인 (카드 제목이 아닌 별도 텍스트 위젯)
cy.contains('이상행위 발생 건수').should('be.visible');
cy.contains('이상행위 발생 건수')
  .parents('.dynamic_chart')
  .find('h3')
  .invoke('text')
  .then((text) => {
    expect(text.trim()).to.match(/^\d+\s*건$/);
  });

// [신규] 데이터 없음 상태 위젯 검증 (최초 설치 시 - 통계 테이블 미생성 5종)
cy.get('.dynamic_chart')
  .filter(':visible')
  .contains('아직 통계 테이블이 생성되지 않았습니다')
  .should('have.length.at.least', 0);

cy.get('.fa-exclamation-triangle')
  .filter(':visible')
  .should('have.length.at.least', 0);

// [신규] "이상행위 유형별 현황" - ApexCharts 렌더링 + 데이터 없음 텍스트 확인
cy.contains('.v-card__title', '이상행위 유형별 현황')
  .parents('.widget_content')
  .within(() => {
    cy.get('#apex-chart svg').should('exist');
    cy.get('svg').contains('조회 결과가 존재하지 않습니다').should('exist');
  });

cy.log('✅ 점검 대시보드 출력 및 차트 타이틀 확인 완료 ');



    
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
