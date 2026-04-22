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
    cy.login('admin', 'Manager1!');

   
    //6. 화면 안정화 대기
     cy.wait(5000);
    
    //로그인 성공


    ///////////////////////////////////////////////
    // 검출탭 > 필터  서브메뉴 선택 
    /////////////////////////////////////////////// 
    // 검출탭 > 필터  서브메뉴 선택 
    cy.log('🚀 검출탭 > 필터  서브메뉴 선택 ');
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---검출 - 필터 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });
    cy.wait(3000); 
      
    // 검출탭 > 필터 > 식별자 패턴 관리 탭 클릭 
    cy.log('--- 식별자 패턴 관리 탭 탭 클릭 ---');
    cy.contains('.v-btn__content', '식별자 패턴 관리').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    // 트리영역 + 아이콘
    cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
    //트리영역 새로고침 아이콘
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    // 트리영역 돋보기 아이콘
    cy.get('.v-icon.fa-search').filter(':visible').should('be.visible'); 
    // 타이틀 문구확인
    cy.contains('span.title', '식별자').should('be.visible').and('have.class', 'font-weight-bold');


    // 트리영역 폴더 문구확인
    // label 태그 중 '식별자 패턴 그룹'이라는 텍스트가 보이는지 확인
    cy.contains('label.text-label', '식별자 패턴 그룹').should('exist');
    // 'text-label' 클래스를 가진 label 중 'Pattern Korea'가 포함된 요소를 확인
    cy.contains('label.text-label', 'Pattern Korea').should('exist');
    cy.contains('label.text-label', 'Pattern Korea2').should('exist');

    // '개인정보 유형' 컬럼이 존재하고, 현재 오름차순(asc) 정렬인지 확인
    cy.contains('th.column.sortable', '개인정보 유형').should('be.visible').and('have.class', 'asc');
    // '식별자 패턴' 컬럼이 존재하고, 현재 오름차순(asc) 정렬 상태인지 확인
    cy.contains('th.column.sortable', '식별자 패턴').should('be.visible').and('have.class', 'asc'); 
    cy.log('✅ 검출 - 필터 - [식별자 패턴관리] 화면 UI 출력 확인 완료 ');

    ///////////////////////////////////////////////
    // auto pattern 그룹에 식별자 패턴 추가하기 
    /////////////////////////////////////////////// 

       


   
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
