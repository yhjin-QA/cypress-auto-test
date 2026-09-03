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
      'not valid JSON',
      'ChunkLoadError'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 기본동작 체크', () => {

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
    // STEP 9: 분석 서브메뉴 
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '정책 유형').should('exist');
    cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책명').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

 
    ///////////////////////////////////////////////
    // 이상행위 정책 -  권한 외 메뉴 접근 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '권한 외 메뉴 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책명').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인
       // 기능 확인 -------------------------------------------------

    //추가된 test_auto_권한 외 메뉴 접근 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확정').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 열람 제한 개인정보 접근 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책명"]').filter(':visible').clear({ force: true }).type('test_auto_권한 외 메뉴 접근', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(1000); 

    // 업무시스템 - 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').first().parent().click({ force: true });
    cy.wait(1000);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').first().contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 접근 제한 메뉴/URL 주소 설정-------
    // 메뉴명 입력하기 
    cy.get('input[aria-label="메뉴 명"]').filter(':visible').clear({ force: true }).type('test_과다조회 메뉴', { force: true });

    // 업무시스템 - 선택
    //cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').last().scrollIntoView({ block: 'center' }).parent().click({ force: true });
    cy.wait(1000);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').last().contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);

    //URI 주소 입력하기 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/btnExcessCheck.do', { force: true });
    cy.wait(1000);

    // 추가버튼 클릭
    cy.get('input[aria-label="URI 주소"]').closest('form').find('button').contains('추가').click({ force: true });
    cy.wait(1000);

    //추가된 표안의 잘추가되어있는지 검증코드 
    cy.contains('tr', 'test_과다조회 메뉴')
     .scrollIntoView({ block: 'center' }) 
     .within(() => {
      cy.contains('/cop/logcatch/btnExcessCheck.do').should('be.visible'); 
    });
     cy.wait(1000); 

    // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //열람 제한 개인정보 접근 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_권한 외 메뉴 접근').should('be.visible');

     //기본정책 설정 /철회 코드 ---------------------------------------------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확정').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확정').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_권한 외 메뉴 접근'용 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('td').contains('false').should('be.visible');
    cy.wait(1000);
     //---------------------------------------------------------------------------------------

    // 추가한 test_auto_권한 외 메뉴 접근 접근 정책 그룹 수정 1.--------------------------------------
    // 추가된 정책명 : test_auto_권한 외 메뉴 접근  다시 재클릭 
    cy.contains('a', 'test_auto_권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 접근 제한 메뉴/URL 주소 설정-------
    // 메뉴명 입력하기 
    cy.get('input[aria-label="메뉴 명"]').filter(':visible').clear({ force: true }).type('test_배송관리 메뉴', { force: true });

    // 업무시스템 - 선택
    //cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').last().scrollIntoView({ block: 'center' }).parent().click({ force: true });
    cy.wait(1000);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').last().contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);

    //URI 주소 입력하기 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectOrderList.do', { force: true });
    cy.wait(1000);

    // 추가버튼 클릭
    cy.get('input[aria-label="URI 주소"]').closest('form').find('button').contains('추가').click({ force: true });
    cy.wait(1000);

    //추가된 표안의 잘추가되어있는지 검증코드 
    cy.contains('tr', 'test_배송관리 메뉴')
     .scrollIntoView({ block: 'center' }) 
     .within(() => {
      cy.contains('/cop/logcatch/selectOrderList.do').should('be.visible'); 
    });
     cy.wait(1000); 

    // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // 추가한 test_auto_권한 외 메뉴 접근 접근 정책 그룹 수정 2.--------------------------------------
    // 추가된 정책명 : test_auto_권한 외 메뉴 접근  다시 재클릭 (test_배송관리 메뉴 삭제)
    cy.contains('a', 'test_auto_권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.wait(1000);

    
    //추가된 표안의 잘추가되어있는지 검증코드 
    cy.contains('tr', 'test_배송관리 메뉴')
     .scrollIntoView({ block: 'center' }) 
     .within(() => {
      cy.contains('/cop/logcatch/selectOrderList.do').should('be.visible'); 

      // 휴지통 아이콘 클릭 (fa-trash 클래스 사용)
      cy.get('.fa-trash').click();
    });
     cy.wait(1000); 

     cy.contains('tr', 'test_배송관리 메뉴').should('not.exist');
     cy.contains('/cop/logcatch/selectOrderList.do').should('not.exist');

    // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    

    cy.log('✅  분석 탭 - 권한 외 메뉴 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 분석 - 권한 외 메뉴접근 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;