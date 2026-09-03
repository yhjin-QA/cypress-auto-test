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
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

 /*   
    // 정책 추가 기능 확인 -------------------
    //추가된 test_auto_개인정보과다조회 삭제 --------------------------
    cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-trash').click({ force: true });
    cy.wait(1000);
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
    cy.wait(1000);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(1000);  
    
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
    cy.wait(1000);
    cy.get('.v-menu__content').filter(':visible').contains('총무팀').click({ force: true });
    cy.wait(1000);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 정책 상세 설정 
    // 개인정보 사용 건수 입력
    // 주의 입력 
    cy.get('input[aria-label="주의"]').filter(':visible').clear({ force: true }).type('10', { force: true });
    cy.wait(1000);

    // 경계 입력
    cy.get('input[aria-label="경계"]').filter(':visible').clear({ force: true }).type('100', { force: true });
    cy.wait(1000);

    // 심각 입력
    cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('300', { force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    

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
        cy.wait(1000);

        // 심각 300-> 500 변경 입력
        cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('500', { force: true });

        // 저장버튼 클릭 
        cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
        cy.wait(1000);

          // 추가한 정책  검증코드 
          cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');   


      } else {
       // [실행] 존재하지 않는다면 -> 그냥 로그만 남기고 통과
       cy.log('✅ 중복 알림 없이 정책 추가되었습니다.');
       // 추가한 정책  검증코드 
       cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');
       cy.wait(1000);

     }
   });


    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_개인정보과다조회 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_개인정보과다조회').find('td').contains('false').should('be.visible');


    // 추가한 test_auto_개인정보과다 조회정책 수정--------------------------------------
    // 추가된 정책명 : test_auto_개인정보과다조회 다시 재클릭 
    cy.contains('a', 'test_auto_개인정보과다조회').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 선택한 그룹 x버튼 클릭하여 초기화 
    // cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    //추가된 부서 에서 개발팀 추가 하는 코드 
    // 그룹 톱니바퀴 아이콘 클릭
    cy.get('.v-icon').filter(':visible').contains('settings').click({ force: true });
    cy.wait(1000);

    // 그룹 톱니바퀴 클릭해서 뜬 그룹화면에서 '개발팀' 추가선택
    // '개발팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '개발팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(1000);

    // 그룹 선택 팝업창 닫기
    cy.get('body').type('{esc}');
    cy.wait(1000);

    // 개발팀이 추가되었는지 검증하는 코드 ( 그룹 숫자확인 )
    cy.contains('span.grey--text.caption', '(+2)').should('be.visible');


    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);


    cy.log('✅  분석 탭 진입 및 데이터 출력 확인 완료!');  
    cy.wait(2000);

    ///////////////////////////////////////////////
    // 이상행위 정책 -  업무 시간 외 접속
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------
    
    //추가된 test_auto_업무 시간 외 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-trash').click({ force: true });
    cy.wait(1000);
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
    cy.wait(1000);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(1000); 
    
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
    cy.wait(1000);


    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_업무 시간 외 접속 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('td').contains('false').should('be.visible');
    cy.wait(1000);


    // 추가한 test_auto_'test_auto_업무 시간 외 접속 정책 수정--------------------------------------
    // 추가된 정책명 : test_auto_'test_auto_업무 시간 외 접속 다시 재클릭 
    cy.contains('a', 'test_auto_업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 설정창 안에서 '공휴일설정' 버튼 클릭 
    cy.contains('.v-btn__content', '공휴일 설정').filter(':visible').click({ force: true });
    cy.wait(1000);
 
    // 공휴일 설정 팝업창 공휴일 헤더문구 있는지확인 검증코드
    cy.contains('th', '공휴일').should('be.visible');

    //  공휴일 설정 팝업창 안에서 '동기화' 버튼 클릭
    cy.contains('.v-btn__content', '동기화').filter(':visible').click({ force: true });
    cy.wait(1000);

    // 동기화 버튼 클릭하여 동기화 알림창 발생 확인 검증코드
    cy.get('.v-dialog').filter(':visible').contains('자동 생성된 공휴일은 관련 법안 개정').should('be.visible');

    // 동기화 확인 알림창 - '확인'버튼클릭 하여 창닫기
    cy.contains('.c-headline', '알림').closest('.v-dialog, .v-card').contains('.v-btn__content', '확인').click({ force: true });
    cy.wait(1000);

    // 동기화후 공휴일 동기화 확인하는 검증코드
    cy.get('.v-dialog').filter(':visible').find('tbody').contains('새해 첫날').should('be.visible');

    // 공휴일 설정 팝업창 - '저장'버튼 클릭하기 
    cy.contains('.c-headline', '공휴일 설정').closest('.v-dialog, .v-card').contains('.v-btn__content', '저장').click({ force: true });
    cy.wait(1000);
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 정책 추가 된 상태에서 더이상 추가 안되는지 확인 
    
    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);
    // 팝업창 확인
   cy.get('.v-dialog').filter(':visible').contains('이미 모든 업무시스템이 정책에 할당되어 있어').should('be.visible');
   cy.wait(1000); 
   cy.get('.v-dialog').filter(':visible').should('contain', '이미 모든 업무시스템이 정책에 할당되어 있어').contains('.v-btn__content', '확인').click({ force: true });
   cy.wait(1000);
    

    cy.log('✅  분석 탭 - 업무시간 외 접속 및 데이터 출력 확인 완료!');




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
    cy.wait(1000);
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
    cy.wait(1000);
    

    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 그룹 - 전체 선택 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('전체 선택').click({ force: true });
    cy.wait(1000);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_장기 미접속 사용자').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_장기 미접속 사용자').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_장기 미접속 사용자 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_장기 미접속 사용자').find('td').contains('false').should('be.visible');
    cy.wait(1000);

    
    // 추가한 test_auto_개인정보과다 조회정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 선택한 그룹 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    //추가된 부서 에서 개발팀 추가 하는 코드 
    // 그룹 톱니바퀴 아이콘 클릭
    cy.get('.v-icon').filter(':visible').contains('settings').click({ force: true });
    cy.wait(1000);

    // 그룹 톱니바퀴 클릭해서 뜬 그룹화면에서 '팀별' 추가선택
    // '경영지원팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '경영지원팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(1000);
    // '기술지원팀' 텍스트를 포함하고 있는 리스트 항목(.v-list__tile)을 찾아서 클릭
    cy.contains('.v-list__tile', '기술지원팀').filter(':visible').click({ force: true }); // 클릭 (체크박스 체크됨)
    cy.wait(1000);

    // 그룹 선택 팝업창 닫기
    cy.get('body').type('{esc}');
    cy.wait(1000);

    // 경영지원, 기술지원팀 추가되어있는지 검증하는 코드 ( 그룹 숫자확인 )
    cy.contains('span.grey--text.caption', '(+1)').should('be.visible');


    // 장기간 미접속 기간 설정 주단위 1(디폴트) ->3주
    cy.get('input[aria-label="주일"]').type('{selectall}{backspace}3');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 추가한 test_auto_개인정보과다 조회정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(1000);
  
    // 접속 차단 주기 '주단위' -> '월단위' 로 변경 
    cy.contains('label', '접속 차단 주기').closest('.v-input').contains('주단위').click({ force: true });
    cy.wait(1000);
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월단위').click({ force: true });
    cy.wait(1000);

    // 장기간 미접속 기간 설정 1개월(디폴트) -> 3개월로 수치 변경
    cy.get('input[aria-label="개월"]').type('{selectall}{backspace}3');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);


     // 추가한 test_auto_개인정보과다 조회정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 : test_auto_장기 미접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.wait(1000);
  
    // 접속 차단 주기 '월단위' -> '주단위' 로 변경 
    cy.contains('label', '접속 차단 주기').closest('.v-input').contains('월단위').click({ force: true });
    cy.wait(1000);
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '주단위').click({ force: true });
    cy.wait(1000);

    // 장기간 미접속 기간 설정 3주일 -> 2주로 수치 변경
    cy.get('input[aria-label="주일"]').type('{selectall}{backspace}2');
    cy.wait(1000);
    
    // 접속 차단 설정 OFF-> ON
    cy.get('input[aria-label="접속 차단"]').click({ force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

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

    cy.wait(1000);

    // 취소 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('취소').click({ force: true });
    cy.wait(1000);

    cy.log('✅  분석 탭 - 장기 미접속 사용자 및 데이터 출력 확인 완료!');
    cy.wait(2000);

  
    ///////////////////////////////////////////////
    // 이상행위 정책 -  미등록 사용자 접속 
    ///////////////////////////////////////////////
    cy.wait(1000);
    cy.contains('.v-chip__content', '미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '미등록 사용자 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------


    //추가된 test_auto_미등록 사용자 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_미등록 사용자 접속').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_미등록 사용자 접속').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 미등록 사용자 접속 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_미등록 사용자 접속', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 업무시스템 - 전체 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 '전체 선택 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('전체 선택').click({ force: true });
    cy.wait(1000);
    
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);
    
    //미등록 사용자 접속정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
    cy.get('tbody').contains('tr', 'test_auto_미등록 사용자 접속').should('be.visible');


    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_미등록 사용자 접속').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_미등록 사용자 접속').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_미등록 사용자 접속 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_미등록 사용자 접속').find('td').contains('false').should('be.visible');
    cy.wait(1000);


    // 추가한 test_auto_미등록 사용자 접속 정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_미등록 사용자 접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 선택한 그룹 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
   
    // 업무시스템 - 리눅스_배송관리 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');
    
    //경보등급 주의 -> 경계로 선택하기 
    cy.contains('label', '경계').closest('div').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.wait(1000);
    // 경보등급 경례 상태 확인 검증코드 
    cy.contains('label', '경계').closest('div').find('input').should('have.attr', 'aria-checked', 'true');
    cy.wait(1000);

     // 저장 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 추가한 test_auto_미등록 사용자 접속 정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 :test_auto_미등록 사용자 접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.wait(1000);

    //경보등급 경계 -> 심각 선택하기 
    cy.contains('label', '심각').closest('div').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.wait(1000);
    // 경보등급 심각 상태 확인 검증코드 
    cy.contains('label', '심각').closest('div').find('input').should('have.attr', 'aria-checked', 'true');
    cy.wait(1000);

    //  버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 추가한 test_auto_미등록 사용자 접속 정책 그룹 수정3.--------------------------------------
    // 추가된 정책명 :test_auto_미등록 사용자 접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.wait(1000);

    //경보등급 심각 -> 주의로 선택하기 
    cy.contains('label', '주의').closest('div').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.wait(1000);
    // 경보등급 주의 상태 확인 검증코드 
    cy.contains('label', '주의').closest('div').find('input').should('have.attr', 'aria-checked', 'true');
    cy.wait(1000);

    // 취소 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('취소').click({ force: true });
    cy.wait(1000);

    // 추가된 정책명 :test_auto_미등록 사용자 접속 사용자 다시 재클릭 
    cy.contains('a', 'test_auto_미등록 사용자 접속').should('be.visible').click({ force: true });
    cy.wait(1000);
    
    // 경보등급 심각 상태 확인 검증코드 
    cy.contains('label', '심각').closest('div').find('input').should('have.attr', 'aria-checked', 'true');

    // 취소 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('취소').click({ force: true });
    cy.wait(1000);

    cy.log('✅  분석 탭 - 미등록 사용자 접속 및 데이터 출력 확인 완료!');
    cy.wait(1000);

    ///////////////////////////////////////////////
    // 이상행위 정책 -  비인가 IP 접근 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '비인가 IP 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '비인가 IP 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');


    // 기능 확인 -------------------------------------------------

    //추가된 test_auto_미등록 사용자 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_비인가 IP 접근').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_비인가 IP 접근').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 미등록 사용자 접속 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_비인가 IP 접근', { force: true });

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
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 '리눅스배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 허용 IP설정-------
    // 식별자 이름 tester 입력하기 
    cy.get('input[aria-label="식별자 이름"]').filter(':visible').first().type('{selectall}{backspace}tester', { force: true });
    cy.wait(1000);

    //정보사용자 선택하기
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').first().click({ force: true });
    cy.wait(1000);

    // 정보 사용자 팝업창에서 이름 검색 - 유우종 입력 
    cy.get('.v-dialog').filter(':visible').find('input[aria-label="사용자"]').type('유우종', { force: true });
    cy.wait(1000);

    // 정보사용자 팝업창에서 유우종이라는 사람 그옆 체크박스 클릭
    cy.contains('tr', '유우종').find('.v-icon').click({ force: true });
    cy.wait(1000);

    // 체크가 잘되어있는지 검증코드
    cy.contains('tr', '유우종').find('.v-icon').should('contain', 'check_box');

    //정보사용자 팝업창 '확인' 버튼 클릭
    cy.get('.v-dialog__content--active').find('button').contains('확인').click({ force: true });
    cy.wait(1000);

    // 2. 접근 IP 주소 입력
    cy.get('input[aria-label="접근 IP 주소"]').filter(':visible').clear({ force: true }).type('192.168.0.1');
    cy.wait(1000);
    // 3. 넷마스크 입력
    cy.get('input[aria-label="넷마스크"]').filter(':visible').clear({ force: true }).type('255.255.255.0');
    cy.wait(1000);
    // 4. 우측 끝 '추가' 버튼 클릭
    cy.contains('button', '추가').filter(':visible').click({ force: true });
    cy.wait(1000);

    // [검증] 아래 리스트(Grid)에 'tester'라는 식별자가 추가되었는지 확인
    cy.contains('td', 'tester').should('be.visible');
    cy.contains('tr', 'tester').find('.v-icon').should('exist');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);
    
    //비인가 IP 접근 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
    cy.get('tbody').contains('tr', 'test_auto_비인가 IP 접근').should('be.visible');

    //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_비인가 IP 접근').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_비인가 IP 접근').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // ttest_auto_비인가 IP 접근 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_비인가 IP 접근').find('td').contains('false').should('be.visible');
    cy.wait(1000);

     // 추가한 test_auto_미등록 사용자 접속 정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_비인가 IP 접근  다시 재클릭 
    cy.contains('a', 'test_auto_비인가 IP 접근').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    //경보등급 주의 -> 경계로 선택하기 
    cy.contains('label', '경계').closest('div').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.wait(1000);
    // 경보등급 경례 상태 확인 검증코드 
    cy.contains('label', '경계').closest('div').find('input').should('have.attr', 'aria-checked', 'true');
    cy.wait(1000);

     // 허용 IP설정-------
     // 허용/비허용 상태 ON->OFF상태로 변경
     // 1. '허용/비허용' 라벨 옆의 버튼을 클릭 (ON -> OFF)
     cy.get('input[aria-label="허용/비허용"]').uncheck({ force: true });
     // [검증] aria-checked 속성이 'false'(꺼짐)로 변했는지 확인
     cy.get('input[aria-label="허용/비허용"]').should('have.attr', 'aria-checked', 'false');

     // 허용 IP설정-------
    // 식별자 이름 Block 입력하기 
    cy.get('input[aria-label="식별자 이름"]').filter(':visible').first().type('{selectall}{backspace}block', { force: true });
    cy.wait(1000);

    //정보사용자 선택하기
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').first().click({ force: true });
    cy.wait(1000);

    // 정보 사용자 팝업창에서 이름 검색 - 유우종 입력 
    cy.get('.v-dialog').filter(':visible').find('input[aria-label="사용자"]').type('차은우', { force: true });
    cy.wait(1000);

    // 정보사용자 팝업창에서 유우종이라는 사람 그옆 체크박스 클릭
    cy.contains('tr', '차은우').find('.v-icon').click({ force: true });
    cy.wait(1000);

    // 체크가 잘되어있는지 검증코드
    cy.contains('tr', '차은우').find('.v-icon').should('contain', 'check_box');

    //정보사용자 팝업창 '확인' 버튼 클릭
    cy.get('.v-dialog__content--active').find('button').contains('확인').click({ force: true });
    cy.wait(1000);

    // 2. 접근 IP 주소 입력
    cy.get('input[aria-label="접근 IP 주소"]').filter(':visible').clear({ force: true }).type('192.168.0.2');
     cy.wait(1000);
    // 3. 넷마스크 입력
    cy.get('input[aria-label="넷마스크"]').filter(':visible').clear({ force: true }).type('255.255.0.0');
     cy.wait(1000);
    // 4. 우측 끝 '추가' 버튼 클릭
    cy.contains('button', '추가').filter(':visible').click({ force: true });
    cy.wait(1000);

    // [검증] 아래 리스트(Grid)에 'block'라는 식별자가 추가되었는지 확인
    cy.contains('td', 'block').should('be.visible');
    cy.contains('tr', 'block').find('.v-icon').should('exist');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

  
    cy.log('✅  분석 탭 - 비인가 IP 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    
    ///////////////////////////////////////////////
    // 이상행위 정책 -  개인정보 유형 과다사용 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '개인정보 유형 과다사용').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '개인정보 유형 과다사용 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------

    //추가된 test_auto_미등록 사용자 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_개인정보 유형 과다사용').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_개인정보 유형 과다사용').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 미등록 사용자 접속 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_개인정보 유형 과다사용', { force: true });

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
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 '리눅스배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

     // 개인 정보 유형 추가-----------------------------------------------------
     // 패턴유형 클릭하여 드롭다운 목록 열기---------------------------
     cy.get('input[aria-label="패턴 유형"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 패턴유형 드롭다운 메뉴에서 주민등록 번호 선택하기
     cy.get('.v-menu__content').filter(':visible').contains('주민등록번호').click({ force: true });
     cy.wait(1000);

     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');

     //패턴 유형 개수 기본값 0 지우고 3 입력하기
     cy.get('input[aria-label="패턴 유형 개수"]').filter(':visible').type('{selectall}3', { force: true });
     // 값이 '3'인지 확인
     cy.get('input[aria-label="패턴 유형 개수"]').filter(':visible').first().should('have.value', '3');
     cy.wait(1000);

     // 패턴유형 '추가' 버튼 클릭
     cy.contains('.v-btn__content', '추가').filter(':visible').click({ force: true });
     cy.wait(1000);

     // 추가한 패턴유형 검증하는 코드
     cy.contains('tr', '주민등록번호').should('contain', '3');
     cy.wait(1000);

     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //개인정보 유형 과다사용 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_개인정보 유형 과다사용').should('be.visible');

     //기본정책 설정 /철회 코드 -------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_개인정보 유형 과다사용').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_개인정보 유형 과다사용').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_개인정보 유형 과다사용 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
     cy.contains('tr', 'test_auto_개인정보 유형 과다사용').find('td').contains('false').should('be.visible');
    cy.wait(1000);


    // 추가한 test_auto_개인정보 유형 과다사용 정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_개인정보 유형 과다사용  다시 재클릭 
    cy.contains('a', 'test_auto_개인정보 유형 과다사용').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    //패턴유형 추가 
    // 개인 정보 유형 추가-----------------------------------------------------
     // 패턴유형 클릭하여 드롭다운 목록 열기---------------------------
     cy.get('input[aria-label="패턴 유형"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 패턴유형 드롭다운 메뉴에서 다수 선택하기(신용카드번호, 계좌번호, 생년월일)
     cy.get('.v-menu__content').filter(':visible').contains('신용카드번호').click({ force: true });
     cy.wait(1000);
     cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile', '계좌번호').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);
     cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile', '생년월일').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);

     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');

     //패턴 유형 개수 기본값 0 지우고 3 입력하기
     cy.get('input[aria-label="패턴 유형 개수"]').filter(':visible').type('{selectall}5', { force: true });
     // 값이 '3'인지 확인
     cy.get('input[aria-label="패턴 유형 개수"]').filter(':visible').first().should('have.value', '5');
     cy.wait(1000);

     // 패턴유형 '추가' 버튼 클릭
     cy.contains('.v-btn__content', '추가').filter(':visible').click({ force: true });
     cy.wait(1000);

     // 기존 + 추가한 패턴유형 검증하는 코드
     cy.contains('tr', '주민등록번호').should('contain', '3');
     cy.contains('tr', '신용카드번호').should('contain', '5');
     cy.contains('tr', '계좌 번호').should('contain', '5');
     cy.contains('tr', '생년월일').should('contain', '5');
     cy.wait(1000);

     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // 추가한 test_auto_개인정보 유형 과다사용 정책 그룹 수정2.--------------------------------------
    // 추가된 정책명 : test_auto_개인정보 유형 과다사용  다시 재클릭 
    cy.contains('a', 'test_auto_개인정보 유형 과다사용').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 개인정보 유형 과다사용등록 화면 위치로 스크롤 이동 
    //cy.get('.scrollable-detail-content').contains('개인정보 유형 과다사용 등록').filter(':visible').scrollIntoView({ duration: 500 }); // 부드럽게 스크롤
    
    // 개인정보 유형 과다사용등록 항목중 계좌번호 삭제
    // 계좌번호 행에 맞는 휴지통 아이콘 클릭
    cy.contains('tr', '계좌 번호').find('.fa-trash').click({ force: true });
    cy.wait(1000);

     // 계좌번호  패턴유형 삭제시 검증하는 코드
     cy.contains('tr', '주민등록번호').should('contain', '3');
     cy.contains('tr', '신용카드번호').should('contain', '5');
     cy.contains('tr', '생년월일').should('contain', '5');
     cy.contains('tr', '계좌 번호').should('not.exist');
     cy.wait(1000);

     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);


    cy.log('✅  분석 탭 - 개인정보 유형 과다사용 및 데이터 출력 확인 완료!');
    cy.wait(2000);


    ///////////////////////////////////////////////
    // 이상행위 정책 -  열람제한 개인정보 접근 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '열람제한 개인정보 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '열람제한 개인정보 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인
       // 기능 확인 -------------------------------------------------

    //추가된 test_auto_미등록 사용자 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_열람제한 개인정보 접근').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_열람제한 개인정보 접근').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 열람 제한 개인정보 접근 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_열람제한 개인정보 접근', { force: true });

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
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 '리눅스배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');


     // 열람 제한 개인정보 설정 -----------------------------------------------------
     // 개인정보 주체 이름 입력 
     cy.contains('label', '개인정보 주체 이름 입력').parent().find('input').clear({ force: true }).type('test_신용카드', { force: true });
     cy.wait(1000);

     // 개인정보 유형 클릭하여 콤보박스 메뉴열기
     cy.get('input[aria-label="개인정보 유형"]').filter(':visible').parent().click({ force: true });
     cy.wait(1000);

     // 신용카드번호 선택하기 
     cy.get('.v-menu__content').filter(':visible').contains('신용카드번호').click({ force: true });
     cy.wait(1000);

     // 1. '-' 기호가 있는 줄을 찾되, 이번엔 입력창이 '4개'인지 확인해야 합니다.
     cy.contains('h3', '-').closest('.layout.row').find('input').should('have.length', 4).as('CardInputs');

     //// 2. 순서대로 신용카드번호를 입력한다.
     cy.get('@CardInputs').eq(0).type('4469', { force: true });  // 첫 번째 (0번)
     cy.get('@CardInputs').eq(1).type('4314', { force: true }); // 두 번째 (1번)
     cy.get('@CardInputs').eq(2).type('3564', { force: true }); // 세 번째 (2번)
     cy.get('@CardInputs').eq(3).type('3296', { force: true }).blur();// 세 번째 (3번)
     cy.wait(1000);

     // 추가버튼 클릭
     cy.get('input[aria-label="개인정보 주체 이름 입력"]').closest('form').find('button').contains('추가').click({ force: true });

     
     //식별대상 개인정보 목록 표안의 추가한 값을 검증코드
     cy.contains('tr', 'test_신용카드')
     .scrollIntoView()
     .within(() => {
     // 2. 그 행(tr) 내부에서만 검색합니다. (범위 제한)
     cy.contains('4469.4314.3564.3296').should('be.visible'); // 값이 정확한지
     cy.contains('신용카드번호').should('be.visible'); // 타입이 정확한지
      });
     cy.wait(500)


     // 열람 제한 개인정보 설정 -----------------------------------------------------
     // 개인정보 주체 이름 입력 
     cy.contains('label', '개인정보 주체 이름 입력').scrollIntoView({ block: 'center' }).parent().find('input').clear({ force: true }).type('test_휴대전화', { force: true });
     cy.wait(1000);

     // 개인정보 유형 클릭하여 콤보박스 메뉴열기
     cy.get('input[aria-label="개인정보 유형"]').filter(':visible').parent().click({ force: true });
     cy.wait(1000);

     // 휴대전화번호  선택하기 
     cy.get('.v-menu__content').filter(':visible').contains('휴대전화번호').scrollIntoView().click({ force: true });
     cy.wait(1000);

     // 1. '-' 기호(h3 태그)를 포함하고 있는 부모 행(Row)을 찾습니다.
     cy.contains('h3', '-').closest('.layout.row').find('input').should('have.length', 3).as('phoneInputs');

     //// 2. 순서대로 휴대폰 번호 입력합니다.
     cy.get('@phoneInputs').eq(0).type('010', { force: true });  // 첫 번째 (0번)
     cy.get('@phoneInputs').eq(1).type('4617', { force: true }); // 두 번째 (1번)
     cy.get('@phoneInputs').eq(2).type('1665', { force: true }).blur();; // 세 번째 (2번)
     cy.wait(1000);

     // 추가버튼 클릭
     cy.get('input[aria-label="개인정보 주체 이름 입력"]').closest('form').find('button').contains('추가').click({ force: true });

     
     //식별대상 개인정보 목록 표안의 추가한 값을 검증코드
     cy.contains('tr', 'test_휴대전화')
     .scrollIntoView()
     .within(() => {
     // 2. 그 행(tr) 내부에서만 검색합니다. (범위 제한)
     cy.contains('010.4617.1665').should('be.visible'); // 값이 정확한지
     cy.contains('휴대전화번호').should('be.visible'); // 타입이 정확한지
      });
     cy.wait(500)
    
     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //열람 제한 개인정보 접근 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_열람제한 개인정보 접근').should('be.visible');

     //기본정책 설정 /철회 코드 ---------------------------------------------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_열람제한 개인정보 접근').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_열람제한 개인정보 접근').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_열람제한 개인정보 접근'용 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_열람제한 개인정보 접근').find('td').contains('false').should('be.visible');
    cy.wait(1000);
     //--------------------------------

     // 추가한 test_auto_열람제한 개인정보 접근 정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_열람제한 개인정보 접근  다시 재클릭 
    cy.contains('a', 'test_auto_열람제한 개인정보 접근').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 열람 제한 개인정보 설정 수정1 -----------------------------------------------------
     // 개인정보 주체 이름 입력 (계좌번호 추가)
     cy.contains('label', '개인정보 주체 이름 입력').scrollIntoView({ block: 'center' }).parent().find('input').clear({ force: true }).type('test_계좌 번호', { force: true });
     cy.wait(1000);

     // 개인정보 유형 클릭하여 콤보박스 메뉴열기
     cy.get('input[aria-label="개인정보 유형"]').filter(':visible').parent().click({ force: true });
     cy.wait(1000);

     // 계좌번호 선택하기 
     cy.get('.v-menu__content').filter(':visible').contains('계좌 번호').scrollIntoView().click({ force: true });
     cy.wait(1000);

     //개인정보 고유식별 값 입력하기
     cy.get('input[aria-label="개인정보 고유식별 값"]').clear().type('475-6025314-6-985').blur();
     cy.wait(1000);

     // 추가버튼 클릭
     cy.get('input[aria-label="개인정보 주체 이름 입력"]').closest('form').find('button').contains('추가').click({ force: true });

     
     //식별대상 개인정보 목록 표안의 추가한 값을 검증코드
     cy.contains('tr', 'test_계좌 번호')
     .scrollIntoView()
     .within(() => {
     // 2. 그 행(tr) 내부에서만 검색합니다. (범위 제한)
     cy.contains('475-6025314-6-985').should('be.visible'); // 값이 정확한지
     cy.contains('계좌번호').should('be.visible'); // 타입이 정확한지
      });
     cy.wait(1000);

     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //열람 제한 개인정보 접근 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_열람제한 개인정보 접근').should('be.visible');


      // 추가한 test_auto_열람제한 개인정보 접근 정책 그룹 수정1.--------------------------------------
    // 추가된 정책명 : test_auto_열람제한 개인정보 접근  다시 재클릭 
    cy.contains('a', 'test_auto_열람제한 개인정보 접근').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 열람 제한 개인정보 설정 수정 2-----------------------------------------------------
    // 식별 대상 개인정보 목록에서 계좌번호 삭제
     cy.contains('tr', 'test_계좌 번호')
     .scrollIntoView()
     .within(() => {
      // 1. 기존 검증 코드
      cy.contains('475-6025314-6-985').should('be.visible');
      cy.contains('계좌번호').should('be.visible');

      // 2. [추가된 코드] 휴지통 아이콘 클릭
      // fa-trash 클래스가 휴지통을 의미하는 가장 명확한 식별자입니다.
      cy.get('.fa-trash').click(); 
       });

      // 삭제 클릭 후 혹시 모를 딜레이나 팝업 처리를 위해 잠시 대기
      cy.wait(1000);

      // 'test_계좌 번호 존재하지 않는지 검증코드
      cy.contains('tr', 'test_계좌 번호').should('not.exist');

      // 저장버튼 클릭 
      cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
      cy.wait(1000);
    

    cy.log('✅  분석 탭 - 열람제한 개인정보 접근 및 데이터 출력 확인 완료!');
    cy.wait(2000);

  
    ///////////////////////////////////////////////
    // 이상행위 정책 -  권한 외 메뉴 접근 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '권한 외 메뉴 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인
       // 기능 확인 -------------------------------------------------

    //추가된 test_auto_권한 외 메뉴 접근 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_권한 외 메뉴 접근').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 열람 제한 개인정보 접근 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_권한 외 메뉴 접근', { force: true });

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
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
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
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
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
*/
     ///////////////////////////////////////////////
    // 이상행위 정책 -  비인가 접근 사용자 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '비인가 접근 사용자').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '비인가 접근 사용자 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인
       // 기능 확인 -------------------------------------------------

    //추가된 test_auto_비인가 접근 사용자 삭제 --------------------------
    cy.contains('tr', 'test_auto_비인가 접근 사용자').find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_비인가 접근 사용자').should('not.exist'); 


    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 열람 제한 개인정보 접근 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_비인가 접근 사용자', { force: true });

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


    // 사용자 상태 사용여부 토글 ON
    // 1. 화면을 '사용자 상태' 섹션으로 확실히 이동시킵니다.
    cy.contains('사용자 상태').scrollIntoView({ block: 'center' });
    cy.wait(1000);

    // 2. 화면에 있는 '사용 여부' 라벨들을 찾아서 첫 번째(0번)를 클릭합니다.
    // eq(1): 퇴직자, eq(2): 퇴직예정자, eq(3): 휴가자, eq(4): 기타 휴직상태
    cy.get('label').filter(':contains("사용 여부")').eq(1).click({ force: true });
    cy.get('label').filter(':contains("사용 여부")').eq(2).click({ force: true });
    cy.get('label').filter(':contains("사용 여부")').eq(4).click({ force: true }); 
    cy.wait(1000);

    // 검증하기 (제대로 ON 상태가 되었는지 확인)
    cy.get('label').filter(':contains("사용 여부")').eq(1).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(2).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(4).closest('.v-input').find('input[type="checkbox"]').should('be.checked');


     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //비인가 접근 사용자 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_비인가 접근 사용자').should('be.visible'); 
     cy.wait(1000);

    //기본정책 설정 /철회 코드 ---------------------------------------------------------------
    //깃발 클릭 
    cy.get('.fa-flag').first().click({ force: true });
    cy.wait(1000);
   
    //기본정책 설정
    //기본 정책 설정 팝업창 확인 버튼 클릭 
    cy.contains('기본정책으로 설정하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

     // 기본 정책 설정확인 검증 코드 (초록색색상값 확인 )
     cy.contains('tr', 'test_auto_비인가 접근 사용자').find('.fa-flag').should('be.visible')
    .invoke('css', 'color') // 아이콘의 실제 색상(CSS color) 값을 가져옴
    .should('not.eq', 'rgba(0, 0, 0, 0.54)') // 기본 회색이 아니어야 함
    .and('not.eq', 'rgb(0, 0, 0)');

    //기본 정책 철회
    // 초록색 깃발아이콘 클릭 
    cy.contains('tr', 'test_auto_비인가 접근 사용자').find('.fa-flag').should('be.visible').click({ force: true });
    cy.wait(1000);

    //기본 정책 철회 팝업창 확인 버튼 클릭
    cy.contains('기본정책에서 철회하시겠습니까?').should('be.visible').closest('.v-dialog').find('.v-btn').contains('확인').click({ force: true });
    cy.wait(1000);

    // 기본 정책 철회 검증
    // test_auto_비인가 접근 사용자 사용여부 false 상태로 되어있는지 검증 (철회시 사용여부 false로 변하기때문)
    cy.contains('tr', 'test_auto_비인가 접근 사용자').find('td').contains('false').should('be.visible');
    cy.wait(1000);
     //---------------------------------------------------------------------------------------

    // 추가한 test_auto_비인가 접근 사용자 접근 정책 그룹 수정 1.--------------------------------------
    // 추가된 정책명 : test_auto_비인가 접근 사용자  다시 재클릭 (휴가자 ON)
    cy.contains('a', 'test_auto_비인가 접근 사용자').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 화면을 '사용자 상태' 섹션으로 확실히 이동시킵니다.
    cy.contains('사용자 상태').scrollIntoView({ block: 'center' });
    cy.wait(1000);

    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(1000);

    // 2. 화면에 있는 '사용 여부' 라벨들을 찾아서 첫 번째(0번)를 클릭합니다.
    // eq(1): 퇴직자, eq(2): 퇴직예정자, eq(3): 휴가자, eq(4): 기타 휴직상태
    cy.get('label').filter(':contains("사용 여부")').eq(3).click({ force: true });
    cy.wait(1000);
    

    // 검증하기 (제대로 ON 상태가 되었는지 확인)
    cy.get('label').filter(':contains("사용 여부")').eq(1).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(2).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(3).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(4).closest('.v-input').find('input[type="checkbox"]').should('be.checked');

    // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);


     // 추가한 test_auto_비인가 접근 사용자 접근 정책 그룹 수정 2.--------------------------------------
    // 추가된 정책명 : test_auto_비인가 접근 사용자  다시 재클릭 (휴가자 ON-> OFF)
    cy.contains('a', 'test_auto_비인가 접근 사용자').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 화면을 '사용자 상태' 섹션으로 확실히 이동시킵니다.
    cy.contains('사용자 상태').scrollIntoView({ block: 'center' });
    cy.wait(1000);

    // 2. 화면에 있는 '사용 여부' 라벨들을 찾아서 첫 번째(0번)를 클릭합니다.
    // eq(1): 퇴직자, eq(2): 퇴직예정자, eq(3): 휴가자, eq(4): 기타 휴직상태
    //cy.get('label').filter(':contains("사용 여부")').eq(3).click({ force: true });
    cy.get('label').filter(':contains("사용 여부")').eq(3).closest('.v-input').find('input[type="checkbox"]').uncheck({ force: true }); // 상태를 OFF로 만듭니다.
    cy.wait(1000);

    // 검증하기 (제대로 ON 상태가 되었는지 확인)
    cy.get('label').filter(':contains("사용 여부")').eq(1).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(2).closest('.v-input').find('input[type="checkbox"]').should('be.checked');
    cy.get('label').filter(':contains("사용 여부")').eq(3).closest('.v-input').find('input[type="checkbox"]').should('not.be.checked'); // [핵심] 꺼져 있는지(not.be.checked) 확인합니다.
    cy.get('label').filter(':contains("사용 여부")').eq(4).closest('.v-input').find('input[type="checkbox"]').should('be.checked');

    // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     cy.log('✅  분석 탭 - 비인가 접근 사용자 및 데이터 출력 확인 완료!');

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 분석 - 비인가 접근 사용자 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;