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
      'operate.task.packageManagement'
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
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(2000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');


    // ==========================================
    // STEP 13: 관리자 -관리 탭 서브메뉴 
    // ==========================================
    cy.log('--- [관리] 메뉴 클릭 ---');
    // 설명: button 태그이면서 'side-menu' 클래스를 가진 요소 중 '관리' 텍스트를 찾음
    cy.contains('button.side-menu', '관리').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [시스템] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("시스템")').filter(':visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기


    // 관리 > 시스템 > 서버탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('서버').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    //플러스 아이콘  확인 
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 새로고침 아이콘 확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    // 돋보기 검색 아이콘 확인
    cy.get('.v-icon.fa-search').should('be.visible');
    cy.contains('.c-headline', '서버 목록 (전체)').should('exist');
    // 검색입련 이름 확인
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    // 검색버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 표열의 이름 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('운영 체제 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('IP').should('be.visible');
     // 서버 목록 추가 버튼
     //cy.get('.material-icons').filter(':visible').contains('add').should('be.visible').and('have.class', 'theme--dark');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 관리 - 시스템 - [서버]탭 출력 확인 완료 ');


    
    // 관리 > 시스템 > 데이터베이스탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('데이터베이스').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    //데이터베이스 아이콘 확인
    cy.get('.v-icon.fa-database').should('be.visible');
    // 폴더 아이콘 확인 
    cy.get('.v-icon.fa-folder').should('be.visible');
    // 새로고침 아이콘 확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    // 돋보기 아이콘이 확인
    cy.get('.v-icon.fa-search').should('be.visible');
    cy.contains('.c-headline', '데이터베이스 목록 (전체)').should('exist');
    // 검색입련 이름 확인
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 표열의 이름 확인 
    cy.get('th').filter(':visible').contains('이름').should('be.visible');
    cy.get('th').filter(':visible').contains('그룹').should('be.visible');
    cy.get('th').filter(':visible').contains('유형').should('be.visible');
    cy.get('th').filter(':visible').contains('IP').should('be.visible');
    cy.log('✅ 관리 - 시스템 - [데이터베이스]탭 출력 확인 완료 ');


    // 관리 > 시스템 > 업무시스템 탭  클릭
    cy.get('.v-btn__content').filter(':visible').contains('업무시스템').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '필수 사전 설정사항').should('exist');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 타이틀 확인
    //cy.contains('span', '인사정보(ON)').filter(':visible').should('be.visible');
    cy.get('span').filter(':visible').contains('인사정보(ON)').should('be.visible');
    cy.get('span').filter(':visible').contains('데이터베이스').should('be.visible');
    cy.get('span').filter(':visible').contains('Log Tracer').should('be.visible');
    cy.get('span').filter(':visible').contains('이상행위정책').should('be.visible');
    // 업무시스템 그룹 타이틀확인
    cy.contains('.subheading', '업무 시스템 그룹').filter(':visible').should('be.visible');
    // 업무시스템 그룹 + 버튼확인
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 업무시스템 그룹 - 버튼확인
    cy.get('.v-icon.fa-minus').should('be.visible');
    // 업무시스템 그룹 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    cy.log('✅ 관리 - 시스템 - [업무시스템]탭 출력 확인 완료 ');



    // 관리 > 시스템 > 접속기록수집기탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('접속기록 수집기').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-title').filter(':visible').contains('접속기록 수집기 관리').should('be.visible');
    cy.get('.subheading').filter(':visible').contains('Log Tracer 그룹').should('be.visible');
    // 그룹 + 버튼확인
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 그룹 - 버튼확인
    cy.get('.v-icon.fa-minus').should('be.visible');
    // 그룹 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    cy.get('.v-icon').filter(':visible').contains('autorenew').should('be.visible');
    cy.get('.text-label').filter(':visible').contains('WEB Tracer').should('be.visible');
    cy.log('✅ 관리 - 시스템 - [접속기록 수집기]탭 출력 확인 완료 ');

     // 관리 > 시스템 > 접속기록수집기탭 > 접속 기록 수집기 통합 조회 탭 화면 
     cy.get('.tab-title').filter(':visible').contains('접속기록 수집기 통합 조회').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="접속기록 수집기"]').filter(':visible').should('be.visible');
     // cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="조건"]').should('exist').and('be.visible');
     // 토글 문구 확인
     cy.get('label').filter(':visible').contains('라이선스 사용 여부').should('be.visible');
     // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('조건').should('be.visible');
     cy.get('th').filter(':visible').contains('사용건수').should('be.visible');
     cy.get('th').filter(':visible').contains('라이선스 사용 여부').should('be.visible');
     cy.log('✅ 관리 - 시스템 - [접속기록 수집기- 통합조회]탭 출력 확인 완료 ');

    // 2.9.1.262_r35274 에서 제거됨. 
    //  // 관리 > 시스템 > 차단 관리 탭  클릭
    // cy.get('.v-btn__content').filter(':visible').contains('차단 관리').last().click({ force: true });
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '검색 조건').should('exist');
    //  //달력 아이콘 확인
    //  //cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
    //  // 시작날짜 달력 아이콘확인
    //  cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    //  // 종료날짜 달력 아이콘확인
    //  cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    //  // 검색 조건 이름 입력란 확인
    //  cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    //  cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
    //  cy.get('input[aria-label="계정"]').filter(':visible').should('be.visible');
    //  // like버튼 확인 
    //  cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
    //  // IP입력란 확인인
    //  cy.get('input[aria-label="시작 IP"]').filter(':visible').should('be.visible');
    //  cy.get('input[aria-label="종료 IP"]').filter(':visible').should('be.visible');
    //  // 검색 버튼 확인
    //  cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //  // 표 열 문구 확인 
    //  cy.get('th').filter(':visible').contains('차단 날짜').should('be.visible');
    //  cy.get('th').filter(':visible').contains('마지막 접속 날짜').should('be.visible');
    //  cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    //  cy.get('th').filter(':visible').contains('로그 수집기').should('be.visible');
    //  cy.get('th').filter(':visible').contains('사용자 아이피').should('be.visible');
    //  cy.get('th').filter(':visible').contains('계정').should('be.visible');
    //  cy.get('th').filter(':visible').contains('차단 해제').should('be.visible');
    //  cy.log('✅ 관리 - 시스템 - [차단 관리]탭 출력 확인 완료 ');

  

    // 관리 > 시스템 > 워커 노드 관리 탭  클릭
    cy.get('.v-btn__content').filter(':visible').contains('워커 노드 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '워커 노드 상세').should('exist');
    // 검색 문구확인
    cy.get('.vue-treeselect__input').should('be.visible');
    // 기본그룹 폴더 문구 확인
    cy.get('.text-label').filter(':visible').contains('기본 그룹').should('be.visible');
    cy.log('✅ 관리 - 시스템 - [워커 노드 관리]탭 출력 확인 완료 ');



    // 관리 > 시스템 > Proxy 관리 탭  클릭
    cy.get('.v-btn__content').filter(':visible').contains('Proxy 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색 조건 이름 입력란 확인
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label*="Address"]').should('be.visible');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('proxy').should('be.visible');
    cy.get('th').filter(':visible').contains('Proxy Address').should('be.visible');
    cy.get('th').filter(':visible').contains('Logtracer').should('be.visible');
    cy.log('✅ 관리 - 시스템 - [Proxy 관리] 탭 출력 확인 완료 ');



    // 관리 > 정보사용자 / 그룹 관리  서브메뉴 선택 
    cy.contains('button.side-menu', '관리').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [정보사용자 / 그룹 관리] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("정보 사용자 / 그룹 관리")').filter(':visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 정보사용자 / 그룹 관리  > 관리 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('관리').last().click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '소속 (전체)').should('exist');
    // 플러스 + 아이콘 확인
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
     // 돋보기 아이콘이 확인
     cy.get('.v-icon.fa-search').should('be.visible');
     // 검색 조건 입력란 
     cy.get('input[aria-label="검색 조건"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="값"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="조건"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 정책 추가버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('아이디').should('be.visible');
     cy.get('th').filter(':visible').contains('그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('이메일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.log('✅ 관리 - 정보사용자/그룹 관리 - [관리]탭 출력 확인 완료 ');

    cy.wait(2000);
    // v3.0.5.1191_r35135 에서 제거됨.
    // // 관리 > 클러스터링 서버 관리 서브메뉴 선택 
    // cy.contains('button.side-menu', '관리').click({ force: true });
    // cy.wait(2000);
    // cy.log('--- 서브메뉴 [클러스터링 서버 관리] 클릭 ---');
    
    // cy.get('.v-list__tile__title').filter(':visible').contains('클러스터링 서버 관리').click({ force: true });
    // //cy.contains('.v-list__tile__title', '클러스터링 서버 관리').filter(':visible').click({ force: true });
    // cy.wait(4000); // 화면 전환 대기
    // // 관리 > 클러스터링 서버 관리 > [개인정보 탐색 서버(포그라운드 전용)] 탭 클릭 
    // cy.get('.v-btn__content').filter(':visible').contains('개인정보 탐색 서버(포그라운드 전용)').last().click({ force: true });
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '검색 조건').should('exist');
    // // 검색 버튼 확인
    // cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // cy.contains('.c-headline', '개인정보 탐색 서버').should('exist');
    // // 정책 추가 + 버튼 확인
    // cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    // // 표 열 문구 확인 
    // cy.get('th').filter(':visible').contains('아이디').should('be.visible');
    // cy.get('th').filter(':visible').contains('서버 타입').should('be.visible');
    // cy.get('th').filter(':visible').contains('서버 프로토콜').should('be.visible');
    // cy.get('th').filter(':visible').contains('서버 ip').should('be.visible');
    // cy.get('th').filter(':visible').contains('PORT').should('be.visible');
    // cy.get('th').filter(':visible').contains('상세 설명').should('be.visible');
    // cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('관리').should('be.visible');
    // cy.log('✅ 관리 - 클러스터링 서버 관리 - [개인정보 탐색 서버(포그라운드 전용)]탭 출력 확인 완료 ');


    // 관리 > 내부 파일 다운로드 서브메뉴 선택
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [내부 파일 다운로드] 클릭 ---');
    cy.contains('.v-list__tile__title', '내부 파일 다운로드').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 내부 파일 다운로드 > [생성된 파일 목록 조회 / 다운로드] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('생성된 파일 목록 조회 / 다운로드').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 조건 입력란 
    cy.get('input[aria-label="파일 다운로드 그룹"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="조건"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('파일 다운로드 그룹').should('be.visible');
    cy.get('th').filter(':visible').contains('제목').should('be.visible');
    cy.get('th').filter(':visible').contains('파일 명').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('조건').should('be.visible');
    cy.log('✅ 관리 - 내부 파일 다운로드 - [생성된 파일 목록 조회 / 다운로드]탭 출력 확인 완료 ');


    // 관리 > 메뉴 관리 서브메뉴 선택
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [메뉴 관리] 클릭 ---');
    cy.contains('.v-list__tile__title', '메뉴 관리').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    // 좌 상단 폴더 아이콘 확인
    cy.get('.v-icon').filter(':visible').contains('fd folder').should('be.visible');
    //검색문구 확인
    cy.contains('.vue-treeselect__placeholder', '검색').should('be.visible');
    // root문구 라벨 확인
    cy.get('.text-label').filter(':visible').contains('root').should('be.visible');
    cy.log('✅ 관리 - 메뉴 관리 출력 확인 완료 ');

    // 관리 > 메니저 메뉴 코드 관리 서브메뉴 선택
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [메니저 메뉴 코드 관리] 클릭 ---');
    cy.contains('.v-list__tile__title', '메니저 메뉴 코드 관리').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    // 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    // 돋보기 아이콘이 확인
    cy.get('.v-icon.fa-search').should('be.visible');
    cy.contains('.c-headline', '소속 (전체)').should('exist');
    // 검색 조건 입력란 
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="조건"]').filter(':visible').should('be.visible');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 동기화 버튼 확인 
    cy.get('input[aria-label="동기화 그룹 선택"]').filter(':visible').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('동기화').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('아이디').should('be.visible');
     cy.get('th').filter(':visible').contains('그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('조회가능 업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('조회가능 그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('개인정보 열람 권한').should('be.visible');
     cy.get('th').filter(':visible').contains('저장').should('be.visible');
     cy.log('✅ 관리 > 메니저 메뉴 코드 관리 출력 확인 완료');
   
    // 관리 > 데이터 시각화 관리 서브메뉴 선택
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [데이터 시각화 관리] 클릭 ---');
    cy.contains('.v-list__tile__title', '데이터 시각화 관리').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기

    // 관리 > 데이터 시각화 관리  > [대시보드 관리] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('대시보드 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '대시보드 목록').should('exist');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('이름').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('변경 일자').should('be.visible');
    cy.get('th').filter(':visible').contains('...').should('be.visible');
    cy.log('✅ 관리 - 데이터 시각화 관리 - [대시보드 관리] 출력 확인 완료');

    
    // 관리 > 데이터 시각화 관리  > [위젯 관리] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('위젯 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '위젯 목록').should('exist');
    // 표 열 문구 확인
    cy.get('th').filter(':visible').contains('이름').should('be.visible');
    cy.get('th').filter(':visible').contains('위젯 타입').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('변경 일자').should('be.visible');
    cy.get('th').filter(':visible').contains('...').should('be.visible');
    // 정책 추가 + 버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    cy.log('✅ 관리 - 데이터 시각화 관리 - [위젯 관리] 출력 확인 완료');


    // 관리 > 데이터 시각화 관리  > [차트 관리] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('차트 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '차트 목록').should('exist');
    cy.get('.v-btn__content').filter(':visible').contains('모든 쿼리 실행').should('be.visible');
    // 표 열 문구 확인
    cy.get('th').filter(':visible').contains('이름').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('..').should('be.visible');
    // 정책 추가 + 버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    cy.contains('.c-headline', '통계 데이터 조회').should('exist');
    //STATS_% 문구 확인
    cy.get('.subheading').filter(':visible').contains('STATS_%').should('be.visible');
    //돋보기 버튼 확인
    cy.get('.v-icon.fa-search').filter(':visible').should('be.visible');
    cy.log('✅ 관리 - 데이터 시각화 관리 - [차트 관리] 출력 확인 완료');

  
    // 관리 > 데이터 시각화 관리  > [통계 모듈 관리] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('통계 모듈 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    // 설명: 'v-icon'이면서 동시에 'fa-plus' 클래스를 가진 요소를 찾고, 현재 눈에 보이는(:visible) 상태인지 확인
    cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
    // 설명: 'fa-search' 클래스를 가진 돋보기 아이콘이 눈에 보이는지 확인
    cy.get('.v-icon.fa-search').filter(':visible').should('be.visible');
    //열린 폴더 아이콘 확인
    cy.get('.v-icon.fa-folder-open').should('be.visible');
    cy.log('✅ 관리 - 데이터 시각화 관리 - [통계 모듈 관리] 출력 확인 완료');



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
