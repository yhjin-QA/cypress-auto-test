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
      'e is not defined',
      'Script error'
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
    // STEP 5: 소명 서브메뉴 
    // ==========================================
    
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 관리 서브메뉴 클릭 ---');
    //서브메뉴 관리 클릭 (정교하게)
    cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('관리').click({ force: true });
    cy.wait(3000);
    // 소명 > 관리 > 종합현황 탭 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('종합 현황').click();
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 업무시스템 검색문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
    // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
      cy.get('th').filter(':visible').contains('부서').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.get('th').filter(':visible').contains('건수').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
    //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
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
    cy.wait(500);
    cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').closest('.v-list__tile').click({ force: true });
    // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 사용자 계정 클릭하여 hojun 아이디 입력
    //cy.get('input[aria-label="사용자 계정"]').filter(':visible').click({ force: true });
    cy.contains('.v-label', '사용자 계정').closest('.v-input').find('input').type('hojun', { force: true });

    
    // 기간 - 시작 날짜 달력 지정하기 
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
     cy.wait(500);
     // 1일 클릭
     cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').click({ force: true });
     cy.wait(500);
     //달력창 닫기
     cy.get('body').type('{esc}');
    

    // 소명상태 별로 검증 /////////////
    // 소명상태  클릭하는 코드 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 소명상태중 '취소' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('취소').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '취소' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('취소').should('be.visible');
    cy.wait(1000);
    
    
    // 소명 상태 클릭 (팝업창 다시띄우기) (소명상태 다중선택 취소 + 대기 )
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-select__selections').click({ force: true });
    // 소명상태중 '대기' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('대기').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '취소+대기' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('취소').should('be.visible');
    cy.get('tbody').find('a').contains('대기').should('be.visible');
    cy.wait(1000);

    // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    
    // 소명 상태 클릭 (팝업창 다시띄우기)
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-select__selections').click({ force: true });
    // 소명상태중 '대기' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('대기').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '대기' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('대기').should('be.visible');
    cy.wait(1000);

    // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    // 소명 상태 클릭 (팝업창 다시띄우기)
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-select__selections').click({ force: true });
    // 소명상태중 '신청' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('신청').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '신청' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('신청').should('be.visible');
    cy.wait(1000);

    // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    // 소명 상태 클릭 (팝업창 다시띄우기)
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-select__selections').click({ force: true });
    // 소명상태중 '승인' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('승인').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '승인' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('승인').should('be.visible');
    cy.wait(1000);


    // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });

    // 소명 상태 클릭 (팝업창 다시띄우기)
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-select__selections').click({ force: true });
    // 소명상태중 '반려' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('반려').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '반려' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('반려').should('be.visible');
    cy.wait(1000);

     // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    
     cy.log('✅ 소명싱태 확인완료');

    /// 소명유형 확인하기 /////////////////////////////////////
    // 소명유형 클릭 (팝업창 띄우기)
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
     // 소명유형중  '사전소명' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('사전 소명').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '사전 소명' 선택한 검색결과 검증코드
    // 사전소명 검색안되는 이슈 (맨티스  : 37115)
    //cy.get('tbody').find('a').contains('사전 소명').should('be.visible');
    cy.wait(1000);

     // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    // 소명유형 클릭 (팝업창 다시 띄우기)
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
     // 소명유형중  '사후 소명' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '사후 소명' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('사후 소명').should('be.visible');
    cy.wait(1000);

     // 선택한 소명 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    // 소명유형 클릭 (팝업창 다시 띄우기)
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
     // 소명유형중  '소명 필요' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('소명 필요').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // '사후 소명' 선택한 검색결과 검증코드
    cy.get('tbody').find('a').contains('소명 필요').should('be.visible');
    cy.wait(1000);

    cy.log('✅ 소명 - 관리 - [종합 현황] 탭 진입 및 데이터 출력 확인 완료!');


    
    // 소명  > 나의 소명 서브메뉴 클릭
    cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 나의 소명 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("나의 소명")').filter(':visible').click({ force: true });
    cy.wait(3000);
    
     // 소명 > 나의소명 > 나의 소명 내역
     cy.get('.tab-btn').contains('나의 소명 내역').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
     cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
       cy.get('th').filter(':visible').contains('건수').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [나의 소명 내역]탭 진입 및 데이터 출력 확인 완료!');


    
     // 소명 > 나의소명 > 소명하기 
     cy.get('.tab-btn').contains('소명하기').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="경보 등급"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="소명 대상 일자"]').filter(':visible').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
     cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [소명하기]탭 진입 및 데이터 출력 확인 완료!');

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
      cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
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
      cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
      cy.log('✅ 소명 - 나의 소명 - [승인하기]탭 진입 및 데이터 출력 확인 완료!');

      
      // 소명 > 결재 서브메뉴 클릭
      cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
      cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
      cy.log('--- 소명 > 결재 서브메뉴 클릭 ---');
      cy.get('.v-list__tile__title').filter(':contains("결재")').filter(':visible').click({ force: true });
      cy.wait(3000);
      // 소명 > 결재 > 결재라인 탭 클릭
      cy.get('.v-btn__content').filter(':visible').contains('결재 라인').click();
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '결재 정책 목록').should('exist');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('지난 정책 보기').should('be.visible');
       // 표 문구열 확인
       cy.get('th').filter(':visible').contains('유형').should('be.visible');
       cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
       cy.get('th').filter(':visible').contains('설명').should('be.visible');
       cy.get('th').filter(':visible').contains('등록').should('be.visible');
       cy.get('th').filter(':visible').contains('수정').should('be.visible');
       cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
       cy.get('th').filter(':visible').contains('..').should('be.visible');
       // 정책 추가 + 버튼
       cy.get('.material-icons').filter(':visible').contains('add').should('be.visible');
        

       /////// 결재 정책  기능확인//////
       // 결재 추가 기능 (Cypress 껍데기를 벗기고, 순수 HTML 요소($btn[0])에 직접 명령)
       // + 동그란 플러스 버튼 클릭 
       cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });

       // 결재 정책등록창이 떴는지 확인
       cy.wait(500);
       cy.get('.v-dialog').should('be.visible').find('.c-headline').contains('결재 정책 등록');
       // 정책이름 입력하기
       cy.get('input[aria-label="정책 이름"]').filter(':visible').clear().type('auto_add_test 결재정책');
       
       // 정책 설명 입력하기
       cy.get('textarea[aria-label="정책 설명"]').filter(':visible').clear().type('테스트로 추가하는 결재라인입니다');
       // 사용여부 OFF -> ON 상태로 바꾸기 
       cy.get('input[aria-label="사용 여부"]').check({ force: true }).should('be.checked');
       
       // 권한 유형 클릭하여 콤보박스 열기 
       cy.get('input[aria-label="권한 유형"]').filter(':visible').click({ force: true });
       // 권한유형중 [일반] 선택
       cy.get('.v-list__tile__title').filter(':visible').contains('일반').click();
       
       // 결재 적용대상 클릭하여 콤보박스 열기 
       cy.get('input[aria-label="결재 적용 대상"]').filter(':visible').click({ force: true });
       // 결재 적용대상 클릭하여 소명 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('소명').click();

       // 결재 적용대상 클릭하여 콤보박스 열기 
       cy.get('input[aria-label="결재 적용 대상"]').filter(':visible').click({ force: true });
       // 결재 적용대상 클릭하여 소명 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('소명').click();

       // 결재자 유형 클릭하여 콤보박스 열기 
       cy.get('input[aria-label="결재자 유형"]').filter(':visible').click({ force: true });
       // 결재자 유형 클릭하여 소명 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('부서장').click();

       // 결재자 콤보박스 열기 
       cy.get('input[aria-label="결재자"]').filter(':visible').click({ force: true });
       // 결재자 클릭하여 각 부서장 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('각 사용자의 부서장이 결재 라인으로 지정됩니다.').click();

       //결재정책 추가 버튼 클릭
       cy.get('.v-dialog').contains('button', '추가') .click({ force: true });

       //결재정책 저장 버튼 클릭
       cy.get('.v-dialog').contains('button', '저장') .click({ force: true }); 

       // -----------------------------------------------------------
       // "기본 결재정채추가된경우"  중복 알림창 처리 (조건부 로직)
       // -----------------------------------------------------------
       cy.wait(1000);
       cy.get('body').then(($body) => {
         // '중복 알림'이라는 글자가 포함된 헤드라인이 존재하는지 확인 (length > 0 이면 존재)
         if ($body.find('.c-headline:contains("중복 알림")').length > 0) {
    
           cy.log('🚨 중복 알림 팝업 발견! 확인 버튼을 클릭합니다.');
           // '확인' 버튼을 찾아서 클릭 (버튼 텍스트가 '확인'이라고 가정)
           cy.get('button.success--text').filter(':visible').contains('확인').click({ force: true });
          } else {
            cy.log('✅ 중복 알림 없음. 다음 단계로 진행합니다.');
           }
        });
       //----------------------------------------------------------------


       // 결재라인 정책 추가한 검색결과 검증코드
       cy.get('tbody').find('a').contains('auto_add_test 결재정책').should('be.visible');
       cy.get('tbody').find('a').contains(/^O$/).should('be.visible');

       // 추가된 결재 정책  수정하는 기능 (권한 유형 : 참조 추가 )
       cy.wait(1000);
       // 추가된 결재 정책창 팝업창 띄우기
       cy.contains('a', 'auto_add_test 결재정책').should('be.visible').click({ force: true });
       // 권한유형 콤보박스 열기
       cy.get('input[aria-label="권한 유형"]').filter(':visible').click({ force: true });
       // 권한유형중 [참조] 선택
       cy.get('.v-list__tile__title').filter(':visible').contains('참조').click();
       // 결재자 유형 클릭하여 콤보박스 열기 
       cy.get('input[aria-label="결재자 유형"]').filter(':visible').click({ force: true });
       // 결재자 유형 클릭하여 소명 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('부서').click();
       // 결재자 콤보박스 열기 
       cy.get('input[aria-label="결재자"]').filter(':visible').click({ force: true });
       // 결재자 클릭하여 각 부서장 선택 
       cy.get('.v-list__tile__title').filter(':visible').contains('인사팀').click();
       //결재정책 추가 버튼 클릭
       cy.get('.v-dialog').contains('button', '추가') .click({ force: true });
       //결재정책 저장 버튼 클릭
       cy.get('.v-dialog').contains('button', '저장') .click({ force: true });
       cy.wait(1000); 
       
       // 참조 추가확인 검증코드 
       // 추가된 결재 정책창 팝업창 띄우기
       cy.contains('a', 'auto_add_test 결재정책').should('be.visible').click({ force: true });
       cy.get('tr').find('a').contains(/^인사팀$/).should('be.visible');
       cy.get('tr').find('a.ellipsis').contains('참조').should('be.visible');

       // 결재 정책 팝업창 취소 버튼 클릭하기 
        cy.get('.v-dialog').contains('button', '취소') .click({ force: true });


       // 결재라인 추가한 정책 삭제하는 시나리오
       cy.contains('tr', 'auto_add_test 결재정책').find('.fa-trash').click({ force: true });
       cy.wait(500); 
       cy.get('.v-dialog').should('be.visible').find('.c-headline').contains('결재 정책 삭제');
       cy.wait(500); 
       cy.get('.v-dialog').find('button.success--text').contains('확인').click({ force: true });
       // 결재 정책 모두 다 삭제된 상태
       // 결제정책모두 삭제되었을때 문구 확인
       //cy.contains('td', 'No data available').should('be.visible');
       cy.contains('tr', 'auto_add_test 결재정책').should('not.exist');


       //지난 정책보기 확인하는 코드
       //지난 정책 보기 OFF -> ON상태로 바꾸기
       cy.contains('.v-input', '지난 정책 보기').find('.v-input--selection-controls__ripple').click({ force: true });
       cy.wait(500);
       cy.get('tbody').find('a.font-weight-bold').contains('auto_add_test 결재정책').should('be.visible');
       cy.get('tbody').find('a').contains(/^X$/).should('be.visible');
       cy.wait(1000);
       //지난 정책보기 ON -> OFF로 상태 바꾸기
       cy.contains('.v-input', '지난 정책 보기').find('.v-input--selection-controls__ripple').click({ force: true });
       cy.wait(500);
       //결제정책모두 삭제되었을때 문구 확인
       //cy.contains('td', 'No data available').should('be.visible');
       // [핵심] 'auto_add_test 결재정책'을 포함한 행(tr)이 아예 사라졌는지 확인
       cy.contains('tr', 'auto_add_test 결재정책').should('not.exist');


       cy.log('✅ 소명 - 결재 - [결재라인] 탭 진입 및 데이터 출력 확인 완료!');
  
  

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 소명 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5jeS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUFBLFFBQVEsQ0FBQyxlQUFlLEVBQUUsTUFBTTtFQUM5QkMsRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNO0lBQ2pCQyxFQUFFLENBQUNDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQztFQUN4QyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL2N5cHJlc3MvZTJlL3NwZWMuY3kuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUoJ3RlbXBsYXRlIHNwZWMnLCAoKSA9PiB7XHJcbiAgaXQoJ3Bhc3NlcycsICgpID0+IHtcclxuICAgIGN5LnZpc2l0KCdodHRwczovL2V4YW1wbGUuY3lwcmVzcy5pbycpXHJcbiAgfSlcclxufSkiXSwibmFtZXMiOlsiZGVzY3JpYmUiLCJpdCIsImN5IiwidmlzaXQiXSwic291cmNlUm9vdCI6IiJ9