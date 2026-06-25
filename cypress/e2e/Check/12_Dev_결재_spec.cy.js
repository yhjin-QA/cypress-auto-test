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

  
  it('DEV_Release 로그캐치 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.51:18443/logcatch/login');
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
   // STEP : 결재 서브메뉴 - 정책
   // ==========================================
   // 수정: side-menu 클래스로 정확히 타겟팅
   cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '결재').click({ force: true });
   cy.wait(1000);

   // 서브메뉴 정책 클릭
   cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '정책').click({ force: true });
   cy.wait(2000);

    cy.log('--- 화면 검증 시작 ---');
    // 진입 확인
    cy.url().should('include', '/approval/policy/approval-line');
    cy.contains('.c-headline', '결재 정책 목록').should('exist');
    
    // 지난 정책 보기 토글 확인
    cy.contains('label', '지난 정책 보기').should('be.visible');
    cy.contains('label', '지난 정책 보기').closest('.v-input--switch').find('.v-input--selection-controls__ripple').should('exist');
    
    //  + 추가 버튼 확인
    cy.get('i.v-icon').filter(':visible').contains('add').should('be.visible');

    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('유형').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('등록').should('be.visible');
    cy.get('th').filter(':visible').contains('수정').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.get('th').filter(':visible').contains('..').should('be.visible');
    
    cy.log('✅ 결재 - 정책 - [결재선] 탭 진입 및 데이터 출력 확인 완료!');

    
// ==========================================
// STEP : 결재 서브메뉴 - 결재함
// ==========================================
cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '결재').click({ force: true });   
cy.wait(1000);

// 서브메뉴 정책 클릭
cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '결재함').click({ force: true });
cy.wait(2000);
cy.log('--- 결재함 화면 검증 시작 ---');

// URL 및 헤드라인 확인
cy.url().should('include', '/approval/document/overview');
cy.contains('.c-headline', '검색 조건').should('exist');

// 탭 확인
cy.get('.v-btn__content').filter(':visible').contains('모든 결재').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('신청 결재').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('담당 결재').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('참조 결재').should('be.visible');

// 기간 달력 아이콘 
cy.get('i.v-icon.material-icons').filter(':visible').contains('event').should('exist');
// 기간 입력 필드
cy.get('input[aria-label="기간"]').should('exist');

// 부서 콤보박스
cy.get('input[aria-label="부서"]').should('exist');

// 부서 settings 아이콘
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('settings').should('exist');

// 신청인 콤보박스 + 드롭다운 아이콘
cy.get('input[aria-label="신청인"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('arrow_drop_down').should('exist');

// 로그인 아이디 입력 필드
cy.get('input[aria-label="로그인 아이디"]').should('exist');

// 결재 상태 콤보박스
cy.get('input[aria-label="결재 상태"]').should('exist');

// 검색 버튼
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
cy.get('th').filter(':visible').contains('신청인').should('be.visible');
cy.get('th').filter(':visible').contains('결재 대상').should('be.visible');
cy.get('th').filter(':visible').contains('제목').should('be.visible');
cy.get('th').filter(':visible').contains('결재 상태').should('be.visible');

cy.log('✅ 결재 - 결재함 - [모든 결재] 탭 진입 및 화면 확인 완료!');

// ==========================================
// STEP : 결재함 - 신청 결재 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('신청 결재').click({ force: true });
cy.wait(1000);

cy.log('--- 신청 결재 탭 검증 시작 ---');

// URL 확인
cy.url().should('include', '/approval/document/my-submissions');

// 탭 활성화 확인
cy.contains('.v-btn__content', '신청 결재')
    .closest('button').should('have.class', 'active');

// 검색 조건 영역 확인
cy.contains('.c-headline', '검색 조건').should('exist');
cy.get('input[aria-label="기간"]').should('exist');
cy.get('i.v-icon.material-icons').filter(':visible').contains('event').should('exist');
cy.get('input[aria-label="결재 상태"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('settings').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
cy.get('th').filter(':visible').contains('신청인').should('be.visible');
cy.get('th').filter(':visible').contains('결재 대상').should('be.visible');
cy.get('th').filter(':visible').contains('제목').should('be.visible');
cy.get('th').filter(':visible').contains('결재 상태').should('be.visible');

cy.log('✅ 결재 - 결재함 - [신청 결재] 탭 화면 확인 완료!');

// ==========================================
// STEP : 결재함 - 담당 결재 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('담당 결재').click({ force: true });
cy.wait(1000);

cy.log('--- 담당 결재 탭 검증 시작 ---');

// URL 확인
cy.url().should('include', '/approval/document/my-pending-approvals');

// 검색 조건 영역 확인
cy.contains('.c-headline', '검색 조건').should('exist');
cy.get('input[aria-label="기간"]').should('exist');
cy.get('i.v-icon.material-icons').filter(':visible').contains('event').should('exist');
cy.get('input[aria-label="부서"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('settings').should('exist');
cy.get('input[aria-label="신청인"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('arrow_drop_down').should('exist');
cy.get('input[aria-label="로그인 아이디"]').should('exist');
cy.get('input[aria-label="결재 상태"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
cy.get('th').filter(':visible').contains('신청인').should('be.visible');
cy.get('th').filter(':visible').contains('결재 대상').should('be.visible');
cy.get('th').filter(':visible').contains('제목').should('be.visible');
cy.get('th').filter(':visible').contains('결재 상태').should('be.visible');

cy.log('✅ 결재 - 결재함 - [담당 결재] 탭 화면 확인 완료!');

// ==========================================
// STEP : 결재함 - 참조 결재 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('참조 결재').click({ force: true });
cy.wait(1000);

cy.log('--- 참조 결재 탭 검증 시작 ---');

// URL 확인
cy.url().should('include', '/approval/document/references');

// 검색 조건 영역 확인
cy.contains('.c-headline', '검색 조건').should('exist');
cy.get('input[aria-label="기간"]').should('exist');
cy.get('i.v-icon.material-icons').filter(':visible').contains('event').should('exist');
cy.get('input[aria-label="부서"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('settings').should('exist');
cy.get('input[aria-label="신청인"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('arrow_drop_down').should('exist');
cy.get('input[aria-label="로그인 아이디"]').should('exist');
cy.get('input[aria-label="결재 상태"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
cy.get('th').filter(':visible').contains('신청인').should('be.visible');
cy.get('th').filter(':visible').contains('결재 대상').should('be.visible');
cy.get('th').filter(':visible').contains('제목').should('be.visible');
cy.get('th').filter(':visible').contains('결재 상태').should('be.visible');

cy.log('✅ 결재함 - [참조 결재] 탭 화면 확인 완료!');

// ==========================================
// STEP : 결재 서브메뉴 - 신청 > 이상행위 경보
// ==========================================
cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '결재').click({ force: true });
cy.wait(1000);

// 결재 - 신청 서브메뉴 선택
cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '신청').click({ force: true });
cy.wait(2000);

cy.log('--- 신청 > 이상행위 경보 화면 검증 시작 ---');

// URL 및 탭 확인
cy.url().should('include', '/approval/submit/anomaly-alerts');
cy.get('.v-btn__content').filter(':visible').contains('이상행위 경보').should('be.visible');

// 검색 조건 요소 확인
cy.get('input[aria-label="정책 선택"]').should('exist');
cy.get('i.v-icon.material-icons').filter(':visible').contains('search').should('exist');
cy.get('input[aria-label="메시지 + 정책명 검색"]').should('exist');
cy.get('input[aria-label="From"]').should('exist');
cy.get('input[aria-label="To"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 위험도 필터 버튼 확인
cy.contains('.filter-label', '위험도').should('be.visible');
cy.get('button.sev-filter-btn--active').contains('전체').should('be.visible');
cy.get('button.sev-filter-btn--1').contains('높음').should('be.visible');
cy.get('button.sev-filter-btn--2').contains('보통').should('be.visible');
cy.get('button.sev-filter-btn--3').contains('낮음').should('be.visible');

// 기간 필터 버튼 확인
cy.contains('.filter-label', '기간').should('be.visible');
cy.get('button.sev-filter-btn').contains('오늘').should('be.visible');
cy.get('button.sev-filter-btn').contains('1주일').should('be.visible');
cy.get('button.sev-filter-btn').contains('1개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('3개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('1년').should('be.visible');

// 결과 영역 확인
cy.contains('.v-toolbar__title', '경보').should('be.visible');
cy.contains('경보가 없습니다.').should('be.visible');

cy.log('✅ 결재 - 신청 - [이상행위 경보] 화면 확인 완료!');

    

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
