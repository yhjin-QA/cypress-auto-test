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
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('loginid194', { force: true });

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
    // STEP 5: 소명 서브메뉴 
    // ==========================================

   const navigateToSomyungManagement_1 = () => {
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000);

    // 소명 버튼 클릭 후 로딩 감지
    cy.get('body').then(($body) => {
        if ($body.find('.v-progress-circular:visible').length > 0) {
            cy.log('🔄 소명 클릭 후 로딩 감지! 새로고침합니다.');
            cy.reload();
            cy.wait(3000);
            cy.contains('button', '소명').click({ force: true });
            cy.wait(1000);
        }
    });

    cy.log('--- 소명 > 소명하기 서브메뉴 클릭 ---');
    cy.contains('.v-list__tile__title', '나의 소명').should('be.visible').click({ force: true });
    cy.wait(3000);

    // 소명하기 클릭 후 로딩 감지
    cy.get('body').then(($body) => {
        if ($body.find('.v-progress-circular:visible').length > 0) {
            cy.log('🔄 나의 소명 클릭 후 로딩 감지! 새로고침합니다.');
            cy.reload();
            cy.wait(3000);

            cy.get('body').then(($reloadedBody) => {
                if ($reloadedBody.find('.v-list__tile__title:contains("소명하기")').length > 0) {
                    cy.log('✅ 나의 소명 탭 확인! 재진입 생략합니다.');
                } else {
                    navigateToSomyungManagement_1();
                }
            });
        }
    });
};

navigateToSomyungManagement_1();
 


      //부서장 권한이있는 사람으로 로그인시 확인하는 부분 
      // 소명 > 나의소명 > 승인하기
      cy.get('.tab-btn').contains('승인하기').should('be.visible').click({ force: true });
      cy.wait(3000); 
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '검색 조건').should('exist');
      // 검색버튼 존재 확인
      cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
      // 업무시스템 검색문구 확인
      cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
      // 시작날짜 달력 아이콘확인
      cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
      // 종료날짜 달력 아이콘확인
      cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('승인이 필요한 내역만 보기').should('be.visible');
      // 표 문구열 확인
      cy.get('th').filter(':visible').contains('일시').should('be.visible');
      cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
      cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
      cy.get('th').filter(':visible').contains('건수').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 내용').should('be.visible');
      cy.get('th').filter(':visible').contains('소명하기 조건').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');

      // 기능확인 //
      // 날짜부터 선택안하면 업무시스템 초기화되는 문제

      //기능동작
      //달력표를 펼침  월/일 지정  
      cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
      cy.wait(1000);
      // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
      cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

      // 2. '2월'이라는 글자를 찾아 클릭합니다.
      cy.get('.v-date-picker-table--month').filter(':visible').contains('2월').click({ force: true });
      // 달력 1일 클릭
      cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
      //달력창 닫기
      cy.get('body').type('{esc}');

      // 업무시스템 클릭  : 리눅스 배송관리 선택 
      cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
      cy.wait(1000);
      cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
      // 업무시스템중 리눅스_배송관리 클릭하는 코드
      cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
      cy.wait(1000);
      // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
      cy.get('body').type('{esc}');

      
      // 소속 클릭하여 전체 선택 
      cy.get('.material-icons').filter(':visible').contains('settings').click({ force: true });
      cy.wait(1000);
      cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').closest('.v-list__tile').click({ force: true });
      // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
      cy.get('body').type('{esc}');
      cy.wait(1000);

      //// 사용자 계정 클릭하여 hojun 아이디 입력
      cy.contains('.v-label', '사용자 계정').closest('.v-input').find('input').type('loginid445', { force: true });


      // 소명상태 점검 시작 
      // 소명상태 - 요청을  클릭하는 코드 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      // 소명상태중 '요청' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('요청').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      // 소명유형 클릭 (팝업창 띄우기)
      cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
      // 소명유형중  '사후 소명' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');

      // 검색 버튼 클릭
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

      // '요청', '사후소명' 선택한 검색결과 검증코드
      cy.get('tbody').find('a').contains('인사팀').should('be.visible');
      cy.get('tbody').find('a').contains('loginid445').should('be.visible');
      cy.get('tbody').find('a').contains('요청').should('be.visible');
      cy.get('tbody').find('a').contains('사후 소명').should('be.visible');
      cy.wait(1000);

      //-------------------------
      // 소명상태 - 요청 + 반려 다중선택 클릭하는 코드 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      // 소명상태중 '취소' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('반려').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      // 소명유형 클릭 (팝업창 띄우기)
      cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
      // 소명유형중  '사후 소명' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      
      // 검색 버튼 클릭
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      // '요청', '사후소명' 선택한 검색결과 검증코드
      cy.get('tbody').find('a').contains('인사팀').should('be.visible');
      cy.get('tbody').find('a').contains('loginid445').should('be.visible');
      cy.get('tbody').find('a').contains('반려').should('be.visible');
      cy.get('tbody').find('a').contains('사후 소명').should('be.visible');
      cy.wait(1000);

      // 선택한 소명 x버튼 클릭하여 초기화 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

     //-------------------------
      // 소명상태 - 반려 클릭하는 코드 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      // 소명상태중 '취소' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('반려').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      // 소명유형 클릭 (팝업창 띄우기)
      cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
      // 소명유형중  '사후 소명' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      
      // 검색 버튼 클릭
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      // '반려', '사후소명' 선택한 검색결과 검증코드
      cy.get('tbody').find('a').contains('인사팀').should('be.visible');
      cy.get('tbody').find('a').contains('loginid445').should('be.visible');
      cy.get('tbody').find('a').contains('반려').should('be.visible');
      cy.get('tbody').find('a').contains('사후 소명').should('be.visible');
      cy.wait(1000);
      
      // 선택한 소명 x버튼 클릭하여 초기화 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

      //-------------------------
      // 소명상태 - 승인 클릭하는 코드 
      cy.get('input[aria-label="소명하기 조건"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      // 소명상태중 '취소' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('승인').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      // 소명유형 클릭 (팝업창 띄우기)
      cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
      // 소명유형중  '사후 소명' 클릭하는 코드
      cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
      cy.wait(1000);
      // 선택 후 메뉴 닫기
      cy.get('body').type('{esc}');


      
      // 검색 버튼 클릭
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      // '승인', '사후소명' 선택한 검색결과 검증코드
      cy.get('tbody').find('a').contains('인사팀').should('be.visible');
      cy.get('tbody').find('a').contains('loginid445').should('be.visible');
      cy.get('tbody').find('a').contains('승인').should('be.visible');
      cy.get('tbody').find('a').contains('사후 소명').should('be.visible');
      cy.wait(1000)

      // 승인필요한 내역만 보기 토글버튼 클릭 
      cy.get('input[aria-label="승인이 필요한 내역만 보기"]').click({ force: true });
      cy.wait(1000)
      // 클릭 후, 체크된 상태(checked)인지 검증
      cy.get('input[aria-label="승인이 필요한 내역만 보기"]').should('be.checked');
      
      //맨티스 이슈 : 0037197 수정필요
      // [소명] 소명 - 승인하기 탭 ' 승인이필요한 내역만 보기 클릭시' 초기화되어 검색결과 보여지지 않는 문제
      // 승인필요한 내역만 보기 표 검증
      //cy.get('tbody').find('a').contains('요청').should('be.visible');
      //cy.get('tbody').find('a').contains('반려').should('not.exist');
      //cy.get('tbody').find('a').contains('승인').should('not.exist');
     
  

      cy.log('✅ 소명 - 나의 소명 - [승인하기]탭 진입 및 데이터 출력 확인 완료!');

    
  

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 소명_유저(부서장) 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
