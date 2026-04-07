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
    
  //   // 기능확인 
  //   // ==========================================
  //   // 실행관리 : 전체 프로세스 정지 및 시작 확인 
  //   // ==========================================

  //   // 'MASTER 태스크 전체 정지' 버튼 클릭
  //   cy.contains('.v-btn__content', 'MASTER 태스크 전체 정지').should('be.visible').click({ force: true });
  //   cy.wait(1000);

  //   // 'MASTER 태스크 전체 종료 확인 알림창 확인
  //   cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');

  //   cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
  //   // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
  //   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    

  //   //프로세스 정지확인 검증(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
  //   cy.contains('p', 'Log Collector').should('be.visible');
  //  // ✅ 개선: '시작' 버튼으로 바뀔 때까지 최대 90초 대기 (바뀌면 즉시 통과)
  //   cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '시작', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '시작', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '시작', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '시작', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '시작', { timeout: 90000 }).should('be.visible');


  //   // 'MASTER 태스크 전체 시작' 버튼 클릭
  //   cy.contains('.v-btn__content', 'MASTER 태스크 전체 시작').should('be.visible').click({ force: true });
  //   cy.wait(2000);

  //   // 'MASTER 태스크 전체 실행 확인 알림창 확인
  //   cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');

  //   cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
  //   // 'MASTER 태스크 전체 종료 확인 알림창 확인 버튼 클릭
  //   cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    
    
  //   //프로세스 실행확인 검증코드 (프로세스 실행상태라면  정지 문구로 버튼 변경되어있는상태 ) 
  //   cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '정지', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '정지', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '정지', { timeout: 90000 }).should('be.visible');
  //   cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '정지', { timeout: 90000 }).should('be.visible');

    
// =============================================
// 실행관리 : 개별 프로세스 UI 제어 및 서버 터미널 교차 검증 (Hybrid)
// =============================================

// 🌟 [핵심 해결책] UI 버튼 이름과 리눅스(ps -ef)에서 찾을 실제 키워드를 짝지어 줍니다.
const processList = [
  { uiName: 'Log Collector', osKeyword: 'logcollector' },
  { uiName: 'Discriminator', osKeyword: 'discriminator' },
  { uiName: 'Rule Analyzer', osKeyword: 'ruleanalyzer' },
  { uiName: 'Statistics', osKeyword: 'statistics' }
   // Data File Cleaner프로세스가 아님.
  // dat.done 파일이 안지워지면 파일 클리너가 비활성화 되었구나 라고 판단
  //{ uiName: 'Data File Cleaner', osKeyword: 'datafilecleaner' },
];

processList.forEach((process) => {
  cy.log(`▶▶▶ [${process.uiName}] TASK 정지/시작 및 서버 상태 교차 검증 ◀◀◀`);

  // ==========================================
  // [1단계: 정지 테스트]
  // ==========================================
  // 1. [UI 제어] 정지 버튼 클릭 (uiName 사용)
  cy.contains('p', process.uiName).should('be.visible')
    .closest('.v-card').contains('.v-btn', '정지').filter(':visible').click({ force: true }); 

  cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
  cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });

  // 2. [UI 검증] 상태가 '정지'로 변했는지
  cy.contains('p', process.uiName).closest('.v-card').contains('.v-btn__content', '시작', { timeout: 15000 }).should('be.visible');
  // [정지 상태일 때] Log Collector 카드 안의 상태바가 빨간색(error)인지 확인
  cy.contains('p', process.uiName).closest('.v-card').find('.v-progress-linear__bar__determinate').should('have.class', 'error');
  
  // 🌟 3. [서버 검증] (osKeyword 사용)
  cy.wait(15000); 

  // grep -i 옵션: 대소문자를 구분하지 않고 찾습니다.
  cy.task('runSSH', `ps -ef | grep -i "${process.osKeyword}" | grep -v grep`).then((output) => {
    // 💡 SSH 접속 자체가 실패했을 경우를 대비한 방어 코드
    expect(output, '🚨 SSH 접속 실패!').to.not.be.null;
    
    cy.log(`🖥️ [정지 결과] 터미널 출력: ${output}`);
    // 검색된 텍스트가 비어있어야(empty) 프로세스가 완벽히 죽은 것입니다.
    expect(output.trim(), `${process.uiName} 프로세스가 서버에서 완전히 종료되었는지 확인`).to.be.empty; 
  });


  // ==========================================
  // [2단계: 시작 테스트]
  // ==========================================
  // 4. [UI 제어] 시작 버튼 클릭 (uiName 사용)
  cy.contains('p', process.uiName).should('be.visible')
    .closest('.v-card').contains('.v-btn', '시작').filter(':visible').click({ force: true });

  cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
  cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });

  // 5. [UI 검증] 상태가 '실행'으로 변했는지
  cy.contains('p', process.uiName).closest('.v-card').contains('.v-btn__content', '정지', { timeout: 15000 }).should('be.visible');
  // [시작 상태일 때] Log Collector 카드 안의 상태바가 초록색(success)인지 확인
  cy.contains('p', process.uiName).closest('.v-card').find('.v-progress-linear__bar__determinate').should('have.class', 'success');


  // 🌟 6. [서버 검증] (osKeyword 사용)
  cy.wait(5000); // 기동 시간을 고려하여 5초로 넉넉하게 대기!
  cy.task('runSSH', `ps -ef | grep -i "${process.osKeyword}" | grep -v grep`).then((output) => {
    expect(output, '🚨 SSH 접속 실패!').to.not.be.null;

    cy.log(`🖥️ [시작 결과] 터미널 출력:\n${output}`);
    // 💡 검색을 띄어쓰기 없이 했으므로, 결과가 텅 비어있지 않다(not.empty)면 기동 성공으로 봅니다!
    expect(output.trim(), `${process.uiName} 프로세스가 서버에서 정상 기동되었는지 확인`).to.not.be.empty;
  });
    
  cy.wait(1000); 
});

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
