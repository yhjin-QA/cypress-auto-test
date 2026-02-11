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
      'Loading chunk',    //네트워크 로딩에러 
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
    // STEP 9: 분석 서브메뉴 
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '정책 유형').should('exist');
    cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

 /*   
    // 정책 추가 기능 확인 -------------------
    //추가된 test_auto_개인정보과다조회 삭제 --------------------------
    cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-trash').click({ force: true });
    cy.wait(500);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_개인정보과다조회').should('not.exist'); 
   

    // 우측 동그란 + 플러스 버튼 클릭
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 개인정보 과다조회  정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_개인정보과다조회', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500);  
    
    // 업무시스템 - 리눅스_배송관리 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    
    cy.wait(1000);
    // 그룹별중 총무,인사팀 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('인사팀').click({ force: true });
    cy.wait(500);
    cy.get('.v-menu__content').filter(':visible').contains('총무팀').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 정책 상세 설정 
    // 개인정보 사용 건수 입력
    // 주의 입력 
    cy.get('input[aria-label="주의"]').filter(':visible').clear({ force: true }).type('10', { force: true });
    cy.wait(500);

    // 경계 입력
    cy.get('input[aria-label="경계"]').filter(':visible').clear({ force: true }).type('100', { force: true });
    cy.wait(500);

    // 심각 입력
    cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('300', { force: true });
    cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    

    // -----------------------------------------------------------
    // 기존 정책이 추가되어 있는상태라면 확인 알림창 조건부 처리 
    // ------------------------------------------------ -----------
    cy.get('body').then(($body) => {
     // [조건] body 안에 '이미 포함되어 있습니다'라는 텍스트가 존재하는가?
     if ($body.text().includes('이미 포함되어 있습니다')) {
    
       // [실행] 존재한다면 -> 팝업의 '확인' 버튼 클릭
       cy.log('⚠️ 정책 알림 팝업이 감지되어 확인 버튼을 클릭합니다.');
    
       // 팝업(.v-dialog) 안에 있는 '확인' 버튼을 찾아서 클릭
       cy.get('.v-dialog').filter(':visible').contains('.v-btn', '확인').click({ force: true });
       cy.wait(1000);

        // 추가된 정책 화면으로 이동 -----
        // 정책이름 입력 
        cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_개인정보과다조회', { force: true });
        cy.wait(500);

        // 심각 300-> 500 변경 입력
        cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('500', { force: true });

        // 저장버튼 클릭 
        cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
        cy.wait(500);

          // 추가한 정책  검증코드 
          cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');   


      } else {
       // [실행] 존재하지 않는다면 -> 그냥 로그만 남기고 통과
       cy.log('✅ 중복 알림 없이 정책 추가되었습니다.');
       // 추가한 정책  검증코드 
       cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');
       cy.wait(500);

     }
   });


    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(500);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(500);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

    // 기본 정책 철회 검증
    // test_auto_개인정보과다조회 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_개인정보과다조회').find('td').contains('false').should('be.visible');


    // 추가한 test_auto_개인정보과다 조회정책 수정--------------------------------------
    // 추가된 정책명 : test_auto_개인정보과다조회 다시 재클릭 
    cy.contains('a', 'test_auto_개인정보과다조회').should('be.visible').click({ force: true });
    cy.wait(500);

    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);

    // 선택한 그룹 x버튼 클릭하여 초기화 
    // cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    //추가된 부서 에서 개발팀 추가 하는 코드 
    // 그룹 톱니바퀴 아이콘 클릭
    cy.get('.v-icon').filter(':visible').contains('settings').click({ force: true });
    cy.wait(500);

    // 그룹 톱니바퀴 클릭해서 뜬 그룹화면에서 '개발팀' 추가선택
    // '개발팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '개발팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(500);

    // 그룹 선택 팝업창 닫기
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 개발팀이 추가되었는지 검증하는 코드 ( 그룹 숫자확인 )
    cy.contains('span.grey--text.caption', '(+2)').should('be.visible');


    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);


    cy.log('✅  분석 탭 진입 및 데이터 출력 확인 완료!');  
    cy.wait(2000);

    ///////////////////////////////////////////////
    // 이상행위 정책 -  업무 시간 외 접속
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------
    
    //추가된 test_auto_업무 시간 외 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-trash').click({ force: true });
    cy.wait(500);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_업무 시간 외 접속').should('not.exist'); 
   

    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 업무 시간 외 접속  정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_업무 시간 외 접속', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500); 
    
    // 업무시스템 - 전체 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 '전체 선택 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('전체 선택').click({ force: true });

    //업무시간 설정 월~금요일옆 토글버튼 활성화
    cy.contains('label', '월요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '화요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '수요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '목요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '금요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });

    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);


    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(500);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(500);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

    // 기본 정책 철회 검증
    // test_auto_업무 시간 외 접속 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('td').contains('false').should('be.visible');
    cy.wait(1000);


    // 추가한 test_auto_'test_auto_업무 시간 외 접속 정책 수정--------------------------------------
    // 추가된 정책명 : test_auto_'test_auto_업무 시간 외 접속 다시 재클릭 
    cy.contains('a', 'test_auto_업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(500);

    // 정책 설정창 안에서 '공휴일설정' 버튼 클릭 
    cy.contains('.v-btn__content', '공휴일 설정').filter(':visible').click({ force: true });
    cy.wait(500);
 
    // 공휴일 설정 팝업창 공휴일 헤더문구 있는지확인 검증코드
    cy.contains('th', '공휴일').should('be.visible');

    //  공휴일 설정 팝업창 안에서 '동기화' 버튼 클릭
    cy.contains('.v-btn__content', '동기화').filter(':visible').click({ force: true });
    cy.wait(500);

    // 동기화 버튼 클릭하여 동기화 알림창 발생 확인 검증코드
    cy.get('.v-dialog').filter(':visible').contains('자동 생성된 공휴일은 관련 법안 개정').should('be.visible');

    // 동기화 확인 알림창 - '확인'버튼클릭 하여 창닫기
    cy.contains('.c-headline', '알림').closest('.v-dialog, .v-card').contains('.v-btn__content', '확인').click({ force: true });
    cy.wait(500);

    // 동기화후 공휴일 동기화 확인하는 검증코드
    cy.get('.v-dialog').filter(':visible').find('tbody').contains('새해 첫날').should('be.visible');

    // 공휴일 설정 팝업창 - '저장'버튼 클릭하기 
    cy.contains('.c-headline', '공휴일 설정').closest('.v-dialog, .v-card').contains('.v-btn__content', '저장').click({ force: true });
    cy.wait(500);
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    // 정책 추가 된 상태에서 더이상 추가 안되는지 확인 
    
    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);
    // 팝업창 확인
   cy.get('.v-dialog').filter(':visible').contains('이미 모든 업무시스템이 정책에 할당되어 있어').should('be.visible');
   cy.wait(500); 
   cy.get('.v-dialog').filter(':visible').should('contain', '이미 모든 업무시스템이 정책에 할당되어 있어').contains('.v-btn__content', '확인').click({ force: true });
   cy.wait(500);
    

    cy.log('✅  분석 탭 - 업무시간 외 접속 및 데이터 출력 확인 완료!');


*/

    ///////////////////////////////////////////////
    // 이상행위 정책 -  업무 시간 외 접속
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '장기 미접속 사용자 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');


    // 기능 확인 -------------------------------------------------


    //추가된 test_auto_장기 미접속 사용자 삭제 --------------------------
    cy.contains('tr', 'test_auto_장기 미접속 사용자').find('.fa-trash').click({ force: true });
    cy.wait(500);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_장기 미접속 사용자').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 장기 미접속 사용자 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_장기 미접속 사용자', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    

    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 그룹 - 전체 선택 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('전체 선택').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(500);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_장기 미접속 사용자').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_장기 미접속 사용자').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(500);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(500);

    // 기본 정책 철회 검증
    // test_auto_장기 미접속 사용자 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_장기 미접속 사용자').find('td').contains('false').should('be.visible');
    cy.wait(1000);

    
    // 추가한 test_auto_개인정보과다 조회정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(500);

    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);

    // 선택한 그룹 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    //추가된 부서 에서 개발팀 추가 하는 코드 
    // 그룹 톱니바퀴 아이콘 클릭
    cy.get('.v-icon').filter(':visible').contains('settings').click({ force: true });
    cy.wait(500);

    // 그룹 톱니바퀴 클릭해서 뜬 그룹화면에서 '팀별' 추가선택
    // '경영지원팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '경영지원팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(500);
    // '기술지원팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '기술지원팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(500);

    // 그룹 선택 팝업창 닫기
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 경영지원, 기술지원팀 추가되어있는지 검증하는 코드 ( 그룹 숫자확인 )
    cy.contains('span.grey--text.caption', '(+1)').should('be.visible');


    // 장기간 미접속 기간 설정 주단위 1(디폴트) ->3주
    cy.get('input[aria-label="주일"]').type('{selectall}{backspace}3');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    // 추가한 test_auto_개인정보과다 조회정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(500);
  
    // 접속 차단 주기 '주단위' -> '월단위' 로 변경 
    cy.contains('label', '접속 차단 주기').closest('.v-input').contains('주단위').click({ force: true });
    cy.wait(500);
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월단위').click({ force: true });
    cy.wait(500);

    // 장기간 미접속 기간 설정 1개월(디폴트) -> 3개월로 수치 변경
    cy.get('input[aria-label="개월"]').type('{selectall}{backspace}3');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);


     // 추가한 test_auto_개인정보과다 조회정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(500);
  
    // 접속 차단 주기 '월단위' -> '주단위' 로 변경 
    cy.contains('label', '접속 차단 주기').closest('.v-input').contains('월단위').click({ force: true });
    cy.wait(500);
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '주단위').click({ force: true });
    cy.wait(500);

    // 장기간 미접속 기간 설정 3주일 -> 2주로 수치 변경
    cy.get('input[aria-label="주일"]').type('{selectall}{backspace}2');
    cy.wait(500);
    
    // 접속 차단 설정 OFF-> ON
    cy.get('input[aria-label="접속 차단"]').click({ force: true });
    cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    // 추가한 test_auto_개인정보과다 조회정책 그룹 수정한 부분 검증확인.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    
    // 주단위로 다시 잘 바뀌었는지 검증
    // 1. '접속 차단 주기' 선택창에 '주단위' 텍스트가 표시되는지 확인
    cy.contains('label', '접속 차단 주기').closest('.v-input').should('contain', '주단위');

    // 2. '주일' 입력창의 실제 값(value)이 '2'인지 확인
    cy.get('input[aria-label="주일"]').should('have.value', '2');

    // 접속차단상태가 ON상태인지 확인
    cy.get('input[aria-label="접속 차단"]').siblings('.v-input--selection-controls__ripple').should('have.css', 'color', 'rgb(169, 209, 142)');
    cy.get('input[aria-label="접속 차단"]').should('have.attr', 'aria-checked', 'true');

    cy.wait(500);

    // 취소 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('취소').click({ force: true });
    cy.wait(500);

    cy.log('✅  분석 탭 - 장기 미접속 사용자 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    
    /*
    cy.contains('.v-chip__content', '미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '미등록 사용자 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 미등록 사용자 접속 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '비인가 IP 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '비인가 IP 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 비인가 IP 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '개인정보 유형 과다사용').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '개인정보 유형 과다사용 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 개인정보 유형 과다사용 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '열람제한 개인정보 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '열람제한 개인정보 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 열람제한 개인정보 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '권한 외 메뉴 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 권한 외 메뉴 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '비인가 접근 사용자').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '비인가 접근 사용자 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 비인가 접근 사용자 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '접근제한 업무 시스템 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '접근제한 업무 시스템 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 접근제한 업무 시스템 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '파일다운로드').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '파일다운로드 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 파일다운로드 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 분석 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

*/
  });
});  

//코드마지막


 })()
;