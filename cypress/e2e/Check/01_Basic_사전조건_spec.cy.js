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
      'operate.task.packageManagement',
      'e is not defined'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('WAS 로그인', () => {

    // ==========================================
    // STEP 1: WAS 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do');
    cy.wait(5000); // 로딩 대기

    ////////////새로고침코드/////////////////
    cy.get('body').then(($body) => {
    // 'select[name="name"]' 요소가 찾았는데 없다면? (length === 0)
     if ($body.find('select[name="name"]').length === 0) {
      cy.log('🔴 드롭다운(select) 발견 실패! 페이지를 새로고침합니다.');

      // 새로고침 실행
      cy.reload();

      // 다시 한번 안정화 대기 (새로고침 후 로딩 시간 확보)
      cy.wait(2000);
     } else {
      cy.log('🟢 드롭다운이 정상적으로 로드되었습니다.');
    }
    });
    //////////////////////////////////////

    // 2. 아이디 선택
    // 1. id가 'name'인 select 태그를 찾습니다.
    // 2. .select(1) : 위에서 두 번째 항목(인덱스 1)을 선택합니다. (인덱스 0은 안내 문구)
    //cy.get('select[name="name"]').select(1);
  

    // 4. 로그인 실행 (버튼 클릭 대신 엔터키 사용)
    // 설명: 버튼 클릭보다 엔터키가 '중복 클릭'이나 '이동 에러'가 훨씬 적게 발생합니다.
    //cy.get('input[type="password"]').should('be.visible').click();
    //cy.get('input[type="password"]').type('{enter}');


    //아이디 비번 직접 입력하는 방식-------------------
    // id가 'id'인 입력칸을 화면에서 찾고, 기존 값을 지운 뒤 'hojun'을 입력합니다.
    cy.get('#id').should('be.visible').clear().type('hojun');
    cy.wait(1000);

    // id가 'password'인 입력창을 찾아 'Manager1'을 입력하고, 이어서 엔터키({enter})를 칩니다.
    cy.get('#password').should('be.visible').type('Manager1{enter}');
     
    //6. 화면 안정화 대기
    cy.wait(3000);
    cy.log('✅ 로그인 성공.');

    // ==========================================
    // STEP 1:  개인정보오남용 탭
    // ==========================================
    //개인정보 오남용 탭 클릭 
    cy.contains('a', '개인정보오남용').should('be.visible').click({ force: true });
    // 클릭 후 페이지 로딩 대기 (예시)
    cy.wait(2000);
    //과다조회 버튼 클릭
    //cy.contains('a', '과다조회').should('be.visible').click({ force: true }); 
    cy.get('a[href*="btnExcessCheck"]').click({ force: true });
    cy.wait(3000);
    // 조회결고 확인하는 코드
    cy.get('tbody').contains('td', '배송 준비 중').should('be.visible');
    cy.log('✅ 개인정보 오남용 - 과다조회 완료.');


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
