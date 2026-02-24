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
      'Script error',
      'not valid JSON'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.11:18443/logcatch/login');
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
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 태스크 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("태스크")').filter(':visible').click({ force: true });
    cy.wait(3000); 



    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 실행관리 탭 클릭 ---');
    cy.contains('.v-btn__content', '실행 관리').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '태스크 목록(MASTER)').should('exist');
    //버튼 확인
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 시작').should('be.visible');
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 정지').should('be.visible');
    
    // 기능확인 
    /*
    // ==========================================
    // 실행관리 : 전체 프로세스 정지 및 시작 확인 
    // ==========================================

    // 'MASTER 태스크 전체 정지' 버튼 클릭
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 정지').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 'MASTER 태스크 전체 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');

    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 대기
    cy.wait(90000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');
    
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


    // 'MASTER 태스크 전체 시작' 버튼 클릭
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 시작').should('be.visible').click({ force: true });
    cy.wait(2000);

    // 'MASTER 태스크 전체 실행 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');

    cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
    // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 대기
    cy.wait(60000);
    
    
    //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    */
    // =============================================
    // 실행관리 : 개별적으로 프로세스 시작 및 정지 기능확인
    // =============================================

    // Log Collector ----------------------------------------------------------------------------------------
    // Log Collector TASK 정지 버튼 클릭
    cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'MASTER 태스크 전체 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Log Collector TASK 시작 버튼 클릭
     cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // 'MASTER 태스크 전체 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    








    cy.log('✅ 운영 - 태스크 - [실행관리] 출력 확인 완료 ');

/*
    // 운영 > 태스크  > "리소스 모니터링" 탭을 클릭
    cy.log('--- 리소스 모니터링 탭 클릭 ---');
    cy.contains('.v-btn__content', '리소스 모니터링').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    //문구 아래 v버튼 확인  
    cy.contains('.c-headline', '3rd Party').should('exist');
    cy.contains('.c-headline', '3rd Party').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Background Process').should('exist');
    cy.contains('.c-headline', 'Background Process').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Foreground Process').should('exist');
    cy.contains('.c-headline', 'Foreground Process').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Log Tracer').should('exist');
    cy.contains('.c-headline', 'Log Tracer').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.log('✅ 운영 - 태스크 - [리소스 모니터링 ] 출력 확인 완료 ');


 
     // 운영 > 태스크  > "로그 뷰" 탭을 클릭
     cy.log('--- 로그 뷰 탭 클릭 ---');
     cy.contains('.v-btn__content', '로그 뷰').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---'); 
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색기간 문구 확인
     cy.get('input[aria-label="기간"]').filter(':visible').should('be.visible').and('have.attr', 'readonly');
     //검색조건 달력 아이콘확인인
     cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
     //검색조건 입력란 확인인
     cy.get('input[aria-label="업무 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="로그 파일"]').filter(':visible').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('tail').should('be.visible');
     // 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     cy.log('✅ 운영 - 태스크 - [로그 뷰] 출력 확인 완료 ');


     // 운영 > 태스크  > "로그 다운로드" 탭을 클릭
     cy.log('--- 로그 다운로드 탭 클릭 ---');
     cy.contains('.v-btn__content', '로그 다운로드').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---'); 
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색기간 문구 확인
     cy.get('input[aria-label="기간"]').filter(':visible').should('be.visible').and('have.attr', 'readonly');
     //검색조건 달력 아이콘확인인
     cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
     //검색조건 입력란 확인인
     cy.get('input[aria-label="태스크 그룹"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('태스크 그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('태스크 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('파일 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('파일 크기').should('be.visible');
     cy.log('✅ 운영 - 태스크 - [로그 다운로드] 탭 화면 출력 확인 완료 ');

    
      // 운영 > 태스크  > "패키지 관리" 탭을 클릭
      cy.log('--- 패키지 관리 탭 클릭 ---');
      cy.contains('.v-btn__content', '패키지 관리').should('be.visible').click({ force: true });
      cy.wait(3000);
      cy.log('--- 화면 검증 시작 ---'); 
       //트리영역 새로고침 아이콘
       cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
       //트리영역 검색 버튼 아이콘
       cy.get('.v-icon.fa-search').filter(':visible').should('be.visible');
       //돋보기 버튼 클릭
       cy.log('--- 검색(돋보기) 버튼 클릭 ---');
       cy.get('.v-icon.fa-search').click({ force: true });
       cy.wait(1000); 
       cy.log('✅ 운영 - 태스크 - [패키지 관리] 출력 확인 완료 ');




    // 운영 > 실행플랜 서브메뉴 
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 실행 플랜 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("실행 플랜")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 스케줄러 탭 클릭 ---');
    cy.contains('.v-btn__content', '스케줄러').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
    // 정책목록  추가 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('추가').should('be.visible');
    // 정책목록 입력란 확인
    cy.get('span[title="정책 유형 선택 (ALL)"]').should('be.visible');
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     //체크박스
     cy.contains('label', '삭제/완료된 플랜 보기').parent().find('.v-input--selection-controls__input').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('삭제/완료된 플랜 보기').should('be.visible');

     // 표 컬럼 확인
    // 헤더(th) 안에 있는 체크박스 아이콘(check_box_outline_blank) 확인
    cy.get('th').find('.v-icon:contains("check_box_outline_blank")').should('exist');
    cy.get('th').filter(':visible').contains('플랜 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('작업 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');

    cy.contains('.c-headline', '정책 플랜 일정').should('exist');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_left').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_right').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('refresh').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('TODAY').should('be.visible');

    cy.contains('.c-headline', '일정 상세').should('exist');
    cy.contains('.c-headline', '일정 상세').closest('.v-card').find('th').as('detailHeader');
    //저장한 영역(@detailHeader) 안에서 컬럼명 확인
    cy.get('@detailHeader').contains('날짜').should('be.visible');
    cy.get('@detailHeader').contains('이름').should('be.visible'); 
    cy.get('@detailHeader').contains('상태').should('be.visible');
    cy.get('@detailHeader').contains('플랜 삭제 여부').should('be.visible');

    cy.log('✅ 운영 - 실행플랜 - [스케줄러] 출력 확인 완료 ');

 
 
    // 운영 > 태스크  > "실시간 모니터링" 탭을 클릭
    cy.log('--- 실시간 모니터링 탭 클릭 ---');
    cy.contains('.v-btn__content', '실시간 모니터링').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '탐색 실시간 모니터').should('exist');
    // > 아이콘확인
    cy.get('.sub-title-icon.fa-angle-right').should('be.visible')
     // 설명: 'sub-title-title' 클래스를 가진 요소 중 '진행 중인 탐색'이라는 글자가 포함된 요소 확인
    cy.contains('.sub-title-title', '진행 중인 탐색').should('be.visible');
    cy.log('✅ 운영 - 실행플랜 - [실시간 모니터링] 출력 확인 완료 ');
    
 

    // 운영 > 인사정보 서브메뉴 
    cy.contains('button', '운영').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 인사정보 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("인사정보")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 인사정보보  > "DB 연동" 탭을 클릭
    cy.log('--- DB 연동 탭 클릭 ---');
    cy.contains('.v-btn__content', 'DB 연동').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('생성자').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('삭제').should('be.visible');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 정책 추가 + 버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    cy.log('✅ 운영 - 인사정보 - [DB 연동] 출력 확인 완료 ');


    // 운영 > 인사정보보  > "외부 연동" 탭을 클릭
    cy.log('--- 외부 연동 탭 클릭 ---');
    cy.contains('button.tab-btn', '외부 연동').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 인사정보 - [외부 연동] 출력 확인 완료 ');


  
     // 운영 > 인사정보  > "AD 연동" 탭을 클릭
     cy.log('--- AD 연동 탭 클릭 ---');
     // 방법 2: button 태그이면서 tab-btn 클래스를 가진 요소 찾기
     cy.contains('button.tab-btn', 'AD 연동').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 인사정보 - [AD 연동] 출력 확인 완료 ');



     // 운영 > 외부 연동 서브메뉴 
    cy.contains('button', '운영').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 외부 연동 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("외부 연동")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 외부 연동  > "샤크라맥스 SQL 분석" 탭을 클릭
    cy.log('--- 샤크라맥스 SQL 분석 탭 클릭 ---');
    cy.contains('.v-btn__content', '샤크라맥스 SQL 분석').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 외부연동 - [샤크라맥스 SQL 분석] 출력 확인 완료 ');

     
    // 운영 > 외부 연동  > "원격 파일 다운로드" 탭을 클릭
     cy.log('--- 원격 파일 다운로드 탭 클릭 ---');
     cy.contains('.v-btn__content', '원격 파일 다운로드').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 외부연동 - [원격 파일 다운로드] 출력 확인 완료 ');

  */
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 운영 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
