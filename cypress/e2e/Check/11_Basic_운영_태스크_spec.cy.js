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
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    cy.contains('button', '운영').click({ force: true });
    cy.wait(1000);
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
    cy.wait(90000);
    
    
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

    
    // =============================================
    // 실행관리 : 개별적으로 프로세스 시작 및 정지 기능확인
    // =============================================

    // Log Collector ----------------------------------------------------------------------------------------
    // Log Collector TASK 정지 버튼 클릭
    cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Log Collector 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Log Collector 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Log Collector TASK 시작 버튼 클릭
     cy.contains('p', 'Log Collector').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Log Collector 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Log Collector 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

    //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Discriminator ----------------------------------------------------------------------------------------
    // Discriminator TASK 정지 버튼 클릭
    cy.contains('p', 'Discriminator').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Discriminator 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Discriminator 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Discriminator TASK 시작 버튼 클릭
     cy.contains('p', 'Discriminator').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // 'Discriminator 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // 'Discriminator 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Rule Analyzer ----------------------------------------------------------------------------------------
    // Rule Analyzer TASK 정지 버튼 클릭
    cy.contains('p', 'Rule Analyzer').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // 'Rule Analyzer 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // 'Rule Analyzer 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');


     // Rule Analyzer TASK 시작 버튼 클릭
     cy.contains('p', 'Rule Analyzer').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // 'Rule Analyzer 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // 'Rule Analyzer 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Data File Cleaner ----------------------------------------------------------------------------------------
    // Data File Cleaner TASK 정지 버튼 클릭
    cy.contains('p', 'Data File Cleaner').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // Data File Cleaner 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // Data File Cleaner 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

     // Data File Cleaner TASK 시작 버튼 클릭
     cy.contains('p', 'Data File Cleaner').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Data File Cleaner 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Data File Cleaner 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------

    // Statistics ----------------------------------------------------------------------------------------
    // Statistics TASK 정지 버튼 클릭
    cy.contains('p', 'Statistics').should('be.visible').closest('.v-card').contains('.v-btn', '정지') .filter(':visible').click({ force: true }); 

    // Statistics 종료 확인 알림창 확인
    cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
    cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
    // Statistics 종료 확인 알림창 확인 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 10초 대기
    cy.wait(10000);

    //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '시작').should('be.visible');

     // Statistics TASK 시작 버튼 클릭
     cy.contains('p', 'Statistics').should('be.visible').closest('.v-card').contains('.v-btn', '시작') .filter(':visible').click({ force: true });
     // Statistics 실행 확인 알림창 확인
     cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
     cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
     // Statistics 종료 확인 알림창 확인 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
     // 대기
     cy.wait(10000); 

     //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    //--------------------------------------------------------------------------------------------------------------
    cy.log('✅ 운영 - 태스크 - [실행관리] 출력 확인 완료 ');
  

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

    
   

    // =============================================
    // 운영 > 태스크  > "로그 뷰"
    // =============================================
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
     //cy.log(`🎯 오늘 검증할 파일명: ${targetFileName}`);


     //기능동작
    //달력표를 펼침 2월 1일 선택하기
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
    // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
     cy.get('.v-date-picker-table--month').filter(':visible').contains('2월').click({ force: true });
    // 달력 20일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

     cy.log('✅ 시작 날짜 지정 성공');

    // 업무유형 - 로그 수집기
     // '업무 유형' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="업무 유형"]').click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 '로그 수집기'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', '로그 수집기').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="업무 유형"]').closest('.v-input').should('contain', '로그 수집기');

     // '로그 파일' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="로그 파일"]').click({ force: true });
     cy.wait(500);
     
     // 콤보박스 리스트안에서 'task_iid_2001.std'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', 'task_iid_2001.std').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="로그 파일"]').closest('.v-input').should('contain', 'task_iid_2001.std');

     // tail 토글 OFF-> ON
     // tail 토글이 활성화되어 있는 경우 
     //- 선택한 업무 유형의 로그 파일 중 최신 로그 파일 (task_iid_%.std) 을 가져와서 실시간 갱신되는 것을 보여줍니다.
     //- 로그 파일을 선택하셨어도 최신 로그 파일만 보여줍니다. 
     //tail 토글이 비활성화되어 있는 경우
     //- 선택한 로그 파일의 전체 내용을 보여줍니다.
     cy.get('input[aria-label="tail"]').check({ force: true })
     .should('be.checked'); // 실제로 체크가 되었는지 확실히 확인하고 넘어감
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);

     // 로그 출력 검증코드
     // 로그 경로(LOGCATCH_TASK_LOGPATH)가 포함된 첫줄 텍스트 확인
     cy.contains('.mtk1', /target.*\/home\/logcatch\/data\/logcollector\/data/).should('be.visible');
     //cy.get('.mtk1').filter(':contains("/home/logcatch/data/logcollector/data")').should('have.length.at.least', 1); // 최소 1개 이상 존재하는지 확인
     //--------------------------------------------------
     
     // 업무유형 - 접속 로그 분석기 
     //'업무 유형' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="업무 유형"]').click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 '접속로그 분석기'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', '접속 로그 분석기').click({ force: true });
     cy.wait(500);

     // '로그 파일' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="로그 파일"]').click({ force: true });
     cy.wait(500);
     
     // 콤보박스 리스트안에서 'DISCRIMINATOR_2002_api_20260204.log'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', 'DISCRIMINATOR_2002_api_20260204.log').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="로그 파일"]').closest('.v-input').should('contain', 'DISCRIMINATOR_2002_api_20260204.log');

     // tail 토글 OFF-> ON
     cy.get('input[aria-label="tail"]').check({ force: true })
     .should('be.checked'); // 실제로 체크가 되었는지 확실히 확인하고 넘어감
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     
     // 로그 출력 검증코드
     // 로그 경로(LOGCATCH_TASK_LOGPATH)가 포함된 첫줄 텍스트 확인
     cy.contains('.mtk1', /target.*\/home\/logcatch\/data\/discriminator\/data/).should('be.visible');
     //--------------------------------------------------

     // 업무유형 - 통계 처리기 
     //'업무 유형' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="업무 유형"]').click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 '통계 처리기'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', '통계 처리기').click({ force: true });
     cy.wait(500);

     // '로그 파일' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="로그 파일"]').click({ force: true });
     cy.wait(500);
     
     // 콤보박스 리스트안에서 'STATISTICS_2501_20260207.log'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', 'STATISTICS_2501_20260207.log').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="로그 파일"]').closest('.v-input').should('contain', 'STATISTICS_2501_20260207.log');

     // tail 토글 OFF-> ON
     cy.get('input[aria-label="tail"]').check({ force: true })
     .should('be.checked'); // 실제로 체크가 되었는지 확실히 확인하고 넘어감
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     
     // 로그 출력 검증코드
     // 로그 경로(LOGCATCH_TASK_LOGPATH)가 포함된 첫줄 텍스트 확인
     cy.get('.view-line').contains('Today statistics no data. skip').should('be.visible');
     //--------------------------------------------------

     // 업무유형 - 규칙 분석기 
     //'업무 유형' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="업무 유형"]').click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 '규칙 분석기'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', '규칙 분석기').click({ force: true });
     cy.wait(500);

     // '로그 파일' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="로그 파일"]').click({ force: true });
     cy.wait(500);
     
     // 콤보박스 리스트안에서 'RULEANALYZER_200320260209.log'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', 'RULEANALYZER_200320260209.log').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="로그 파일"]').closest('.v-input').should('contain', 'RULEANALYZER_200320260209.log');

     // tail 토글 OFF-> ON
     cy.get('input[aria-label="tail"]').check({ force: true })
     .should('be.checked'); // 실제로 체크가 되었는지 확실히 확인하고 넘어감
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     
     // 로그 출력 검증코드
     // 로그 경로(LOGCATCH_TASK_LOGPATH)가 포함된 첫줄 텍스트 확인
     cy.contains('.mtk1', /target.*\/home\/logcatch\/data\/ruleanalyzer\/data/).should('be.visible');

      //--------------------------------------------------

     // 업무유형 - 로그 수집기 & tail OFF
     //'업무 유형' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="업무 유형"]').click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 '로그 수집기'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', '로그 수집기').click({ force: true });
     cy.wait(500);

     // '로그 파일' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="로그 파일"]').click({ force: true });
     cy.wait(500);
     
     // 콤보박스 리스트안에서 'SQLPARSER_2001_20260308.log'를 찾아 클릭합니다.
     cy.get('.v-select-list').filter(':visible').contains('.v-list__tile__title', 'SQLPARSER_2001_20260308.log').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="로그 파일"]').closest('.v-input').should('contain', 'SQLPARSER_2001_20260308.log');

     // tail 토글 ON -> OFF
     cy.get('input[aria-label="tail"]').uncheck({ force: true }) // 체크 해제 실행
     .should('not.be.checked'); // 실제로 체크가 해제되었는지(OFF) 확인
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     
     // 로그 출력 검증코드
     // 로그내용중  Currently in standby mode 텍스트 확인
     cy.contains('.mtk1', 'Currently in standby mode').should('be.visible');

      // tail 토글 OFF-> ON
     cy.get('input[aria-label="tail"]').check({ force: true })
     .should('be.checked'); // 실제로 체크가 되었는지 확실히 확인하고 넘어감
     cy.wait(500);

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     
     // 로그 출력 검증코드
     // 로그 경로(LOGCATCH_TASK_LOGPATH)가 포함된 첫줄 텍스트 확인
     // 'target'과 'logcollector' 경로가 모두 포함된 요소를 직접 찾습니다.
     cy.contains('.mtk1', /target.*\/home\/logcatch\/data\/logcollector\/data/).should('be.visible');

    //--------------------------------------------------
     cy.log('✅ 운영 - 태스크 - [로그 뷰] 출력 확인 완료 ');
     
  
    // =============================================
    // 운영 > 태스크  > "로그 다운로드" 탭을 클릭
    // =============================================
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


     //기능확인
     // 기간 - 시작 날짜 달력 지정하기 
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
     cy.wait(500);
     // 5일 클릭
     cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').click({ force: true });
     cy.wait(500);
     //달력창 닫기
     cy.get('body').type('{esc}');
     cy.log('✅ 시작 날짜 지정 성공');

    // 태스크 그룹 - 태스크 유형 : 로그 수집기
     // '태스크 그룹' 클릭하여 콤보박스 열기 -----------------
     cy.get('input[aria-label="태스크 그룹"]').last().click({ force: true });
     cy.wait(500);

     // 콤보박스 리스트안에서 'Background Service'를 찾아 클릭합니다.
     cy.contains('.v-list__tile__title', 'Background Service').filter(':visible').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="태스크 그룹"]').closest('.v-input').should('contain', 'Background Service');

     // '태스크 유형' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="태스크 유형"]').last().click({ force: true });
     cy.wait(500);
     
     // 태스크 유형 콤보박스 리스트안에서 '로그 수집기'를 찾아 클릭합니다.
     cy.get('.v-list__tile__title').filter(':visible').contains('.v-list__tile__title', '로그 수집기').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="태스크 유형"]').closest('.v-input').should('contain', '로그 수집기');

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(500);

     
     //검색결과 검증코드
     // 파일명이 있는 행을 타겟팅
     cy.contains('tr', `SQLPARSER_2001_${formattedDate}.log`) 
     .within(() => {
      // 해당 행 내부에서만 다음 항목들이 존재하는지 확인 
      cy.contains('.ellipsis', 'Background Service').should('be.visible');
      cy.contains('a.ellipsis', '로그 수집기').should('be.visible');
    
      });
      // ------------------------------------------------------------

      // '태스크 유형' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="태스크 유형"]').last().click({ force: true });
     cy.wait(500);
     
     // 태스크유형 콤보박스 리스트안에서 '접속 로그 분석기'를 찾아 클릭합니다.
     cy.get('.v-list__tile__title').filter(':visible').contains('.v-list__tile__title', '접속 로그 분석기').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="태스크 유형"]').closest('.v-input').should('contain', '접속 로그 분석기');

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(500);

     //검색결과 검증코드
     // 파일명이 있는 행을 타겟팅
     cy.contains('tr', `DISCRIMINATOR_2002${formattedDate}.log`) 
     .within(() => {
      // 해당 행 내부에서만 다음 항목들이 존재하는지 확인 
      cy.contains('.ellipsis', 'Background Service').should('be.visible');
      cy.contains('.ellipsis', '접속 로그 분석기').should('be.visible');
    
      });
      // ------------------------------------------------------------

      // '태스크 유형' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="태스크 유형"]').last().click({ force: true });
     cy.wait(500);
     
     // 태스크유형 콤보박스 리스트안에서 '통계 처리기'를 찾아 클릭합니다.
     cy.get('.v-list__tile__title').filter(':visible').contains('.v-list__tile__title', '통계 처리기').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="태스크 유형"]').closest('.v-input').should('contain', '통계 처리기');

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(500);

     //검색결과 검증코드
     // 파일명이 있는 행을 타겟팅
     cy.contains('tr', `STATISTICS_2501_${formattedDate}.log`) 
     .within(() => {
      // 해당 행 내부에서만 다음 항목들이 존재하는지 확인 
      cy.contains('.ellipsis', 'Background Service').should('be.visible');
      cy.contains('a.ellipsis', '통계 처리기').should('be.visible');
    
      });
      // ------------------------------------------------------------

       // '태스크 유형' 콤보박스을 찾아 클릭합니다.--------
     cy.get('input[aria-label="태스크 유형"]').last().click({ force: true });
     cy.wait(500);
     
     // 태스크유형 콤보박스 리스트안에서 '규칙 분석기'를 찾아 클릭합니다.
     cy.get('.v-list__tile__title').filter(':visible').contains('.v-list__tile__title', '규칙 분석기').click({ force: true });
     cy.wait(500);

     // 선택이 잘 되었는지 검증코드
     cy.get('input[aria-label="태스크 유형"]').closest('.v-input').should('contain', '규칙 분석기');

     // 검색 버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(500);

     //검색결과 검증코드
     // 파일명이 있는 행을 타겟팅
     cy.contains('tr', `RULEANALYZER_2003${formattedDate}.log`) 
     .within(() => {
      // 해당 행 내부에서만 다음 항목들이 존재하는지 확인 
      cy.contains('.ellipsis', 'Background Service').should('be.visible');
      cy.contains('a.ellipsis', '규칙 분석기').should('be.visible');
    
      });
      // ------------------------------------------------------------
   
   
     cy.log('✅ 운영 - 태스크 - [로그 다운로드] 탭 화면 출력 확인 완료 ');

  /*
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

    */


   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 운영 - 태스크 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
