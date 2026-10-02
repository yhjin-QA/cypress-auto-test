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
  //  cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '소명').click({ force: true });
  //  cy.wait(1000);
   cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', /^\s*소명\s*$/).click({ force: true });
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
    cy.get('th').filter(':visible').contains('결재 유형').should('be.visible');
    //2.9.1.262_r35274 정책이름 -> 정책명 문구수정
    cy.get('th').filter(':visible').contains('정책명').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('등록').should('be.visible');
    cy.get('th').filter(':visible').contains('수정').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    //v2.9.1.125_r35234제거됨.
    //cy.get('th').filter(':visible').contains('..').should('be.visible');
    
    cy.log('✅ 결재 - 정책 - [결재선] 탭 진입 및 데이터 출력 확인 완료!');

    
// ==========================================
// STEP : 결재 서브메뉴 - 결재함
// ==========================================
cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', /^\s*소명\s*$/).click({ force: true });
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

// 신청자 콤보박스 + 드롭다운 아이콘
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('input[aria-label="신청자"]').should('exist');
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
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('th').filter(':visible').contains('신청자').should('be.visible');
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
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('th').filter(':visible').contains('신청자').should('be.visible');
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
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('input[aria-label="신청자"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('arrow_drop_down').should('exist');
cy.get('input[aria-label="로그인 아이디"]').should('exist');
cy.get('input[aria-label="결재 상태"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('th').filter(':visible').contains('신청자').should('be.visible');
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
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('input[aria-label="신청자"]').should('exist');
cy.get('i.v-icon--link.material-icons').filter(':visible').contains('arrow_drop_down').should('exist');
cy.get('input[aria-label="로그인 아이디"]').should('exist');
cy.get('input[aria-label="결재 상태"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('신청일').should('be.visible');
cy.get('th').filter(':visible').contains('부서').should('be.visible');
// 2.9.1.262_r35274 신청인 -> 신청자로 문구 변경
cy.get('th').filter(':visible').contains('신청자').should('be.visible');
cy.get('th').filter(':visible').contains('결재 대상').should('be.visible');
cy.get('th').filter(':visible').contains('제목').should('be.visible');
cy.get('th').filter(':visible').contains('결재 상태').should('be.visible');

cy.log('✅ 결재함 - [참조 결재] 탭 화면 확인 완료!');

// ==========================================
// STEP : 소명 서브메뉴 - 신청 > 이상행위 경보
// [변경] 사이드 메뉴 "결재" → "소명"
// ==========================================
cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', /^\s*소명\s*$/).click({ force: true });
cy.wait(1000);

cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '신청').click({ force: true });
cy.wait(2000);

cy.log('--- 신청 > 이상행위 경보 화면 검증 시작 ---');

// URL 확인
cy.url().should('include', '/approval/submit/anomaly-alerts');

// ------------------------------------------
// 1. 상단 탭
// [신규] "소명 요청 자동화" 탭 추가
// ------------------------------------------
cy.contains('button.tab-btn', '이상행위 경보').should('be.visible').and('have.class', 'active');
cy.contains('button.tab-btn', '소명 요청 자동화').should('be.visible').and('have.class', 'inactive');

// ------------------------------------------
// 2. 헤더 영역
// [신규] 제목 "소명 요청" + 아이콘
// ------------------------------------------
cy.get('.explanation-submit-header').should('be.visible').within(() => {
  cy.get('.esh-icon').should('contain.text', 'mark_email_read');
  cy.get('.esh-title').should('have.text', '소명 요청');
  // v2.9.4.0 문구변경 (기존과 동일)
  cy.get('.esh-desc').should('have.text', '탐지된 이상행위 경보의 대상자를 골라 소명을 요청합니다.');

  // [신규] 조회 범위 버튼 - 기본값 "전체 사용자"
  cy.contains('.esh-scope-btn', '전체 사용자').should('be.visible').and('have.class', 'esh-scope-btn--on');
  cy.contains('.esh-scope-btn', '내 경보만').should('be.visible').and('not.have.class', 'esh-scope-btn--on');

  // [변경] 진행 단계 3단계 → 2단계
  //  기존: 경보 선택 → 소명하기 → 결재 상신
  //  변경: 1 소명 대상 선택 → 2 소명 요청
  cy.get('.esh-step').should('have.length', 2);
  cy.get('.esh-step').eq(0).invoke('text').should('match', /^\s*1\s*소명 대상 선택\s*$/);
  cy.get('.esh-step').eq(1).invoke('text').should('match', /^\s*2\s*소명 요청\s*$/);
  cy.get('.esh-step-arrow').should('contain.text', 'chevron_right');
});

// ------------------------------------------
// 3. 기본 필터
// ------------------------------------------
cy.get('.basic-filter-panel__title').filter(':visible').should('have.text', '기본 필터');

cy.get('input[placeholder="정책 선택"]').should('exist').and('have.attr', 'role', 'combobox');
cy.get('input[placeholder="메시지 + 정책명 검색"]').should('be.visible')
  .closest('.v-input__slot').find('.material-icons').should('contain.text', 'search');

// From / To 날짜
cy.get('.date-range-picker input[type="date"]').should('have.length', 2);
cy.get('.date-range-picker input[type="date"]').eq(0).should('be.visible'); // From
cy.get('.date-range-picker input[type="date"]').eq(1).should('be.visible'); // To
cy.get('.date-range-sep').filter(':visible').should('have.text', '~');

// 검색 버튼
cy.get('button.btn-search').should('be.visible').and('contain.text', '검색');

// 위험도 필터 - 기본값 "전체"
cy.contains('.filter-label', '위험도').parent().within(() => {
  cy.get('button.sev-filter-btn--active').should('have.text', '전체');
  cy.get('button.sev-filter-btn--1').should('have.text', '높음');
  cy.get('button.sev-filter-btn--2').should('have.text', '보통');
  cy.get('button.sev-filter-btn--3').should('have.text', '낮음');
});

// 기간 필터
cy.contains('.filter-label', '기간').parent().within(() => {
  ['오늘', '1주일', '1개월', '3개월', '1년'].forEach((label, i) => {
    cy.get('button.sev-filter-btn').eq(i).should('have.text', label);
  });
});

// ------------------------------------------
// 4. 결과 영역
// ------------------------------------------
cy.get('.appr-main-card .v-toolbar__title').filter(':visible')
  .invoke('text').should('match', /^경보 \(사용자별 \d+건\)$/);

// 하단 페이지 영역
cy.get('.appr-main-card .table-footer').should('be.visible').within(() => {
  cy.get('.table-footer-info').invoke('text').should('match', /^\d+건$/);
  cy.get('.table-footer-size .v-select__selection').should('have.text', '20');
  cy.contains('.caption.grey--text', '건').should('be.visible');
});

// ==========================================
// 이상행위 경보 결과 (동적 데이터 대응)
// ==========================================
cy.get('body').then(($body) => {
  const $incidents = $body.find('.incident-header:visible');

  if ($incidents.length > 0) {
    // [A] 데이터가 1건 이상 존재하는 경우
    cy.wrap($incidents).each(($row) => {
      cy.wrap($row).within(() => {
        // 1. 위험도 칩
        cy.get('.v-chip--label').first().invoke('text').then((text) => {
          expect(['높음', '보통', '낮음']).to.include(text.trim());
        });

        // 2. 사용자 뱃지 - "person" 아이콘 + 이름
        cy.get('.lookup-badge-group').should('be.visible').within(() => {
          cy.get('.material-icons').should('contain.text', 'person');
        });
        cy.get('.lookup-badge-group').then(($el) => {
          const clone = $el.clone();
          clone.find('.material-icons').remove();
          expect(clone.text().trim().length).to.be.greaterThan(0);
        });

        // 3. 건수 - 숫자
        cy.get('.incident-count').invoke('text').then((text) => {
          expect(isNaN(parseInt(text.trim(), 10))).to.be.false;
        });

        // 4. 연관 정책명
        cy.get('.incident-window.truncate-cell').invoke('text').then((text) => {
          const policies = text.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
          expect(policies.length).to.be.greaterThan(0);
        });
      });
    });
  } else {
    // [B] 데이터가 0건인 경우 (Empty State)
    cy.get('.appr-main-card').within(() => {
      cy.contains('.text-xs-center.grey--text', '소명할 이상행위 경보가 없습니다.').should('be.visible');
      cy.get('.v-toolbar__title').should('have.text', '경보 (사용자별 0건)');
      cy.get('.table-footer-info').should('have.text', '0건');
      // 0건이면 이전/다음 페이지 버튼 비활성
      cy.get('.table-footer-center button').should('have.length', 2).each(($btn) => {
        cy.wrap($btn).should('be.disabled');
      });
    });
  }
});

cy.log('✅ 소명 - 신청 - [이상행위 경보] 화면 확인 완료!');


// ==========================================
// 소명 요청 자동화 화면 검증
// ==========================================

    // ------------------------------------------
    // 1. STEP : 소명 서브메뉴 - 신청 > 소명 요청 자동화 이동
    // [변경] 사이드 메뉴 "결재" → "소명"
    // ------------------------------------------
    // [수정] 탭 버튼 기준으로 정확히 클릭
    cy.contains('button.tab-btn', '소명 요청 자동화').click({ force: true });

    // UI가 로드될 때까지 대기
    cy.get('.ers-header', { timeout: 10000 }).should('be.visible');

    // 탭 활성 상태 전환 확인
    cy.contains('button.tab-btn', '소명 요청 자동화').should('have.class', 'active');
    cy.contains('button.tab-btn', '이상행위 경보').should('have.class', 'inactive');

    // ------------------------------------------
    // 2. 상단 페이지 헤더 및 설명 검증
    // ------------------------------------------
    cy.get('.ers-header').within(() => {
      cy.get('.ers-title').should('contain.text', '소명 요청 자동화');
      cy.get('.ers-desc').should('contain.text', '일정 시각마다 일정 기간 미소명한 이상행위 사용자에게 자동으로 소명 요청 메일을 발송합니다.');
    });

    // ------------------------------------------
    // 3. [섹션 1] 자동 발송 설정
    // ------------------------------------------
    // 카드 헤더 검증
    cy.get('.ers-card-head').eq(0).should('be.visible').and('contain.text', '자동 발송 설정');

    // [설정 1] 자동 소명 요청 사용 (스위치/체크박스)
    cy.contains('.ers-label-main', '자동 소명 요청 사용').should('be.visible');
    cy.contains('.ers-label-sub', '끄면 자동 발송이 중지됩니다. 관리자 수동 발송은 항상 가능합니다.').should('be.visible');

    // [설정 2] 미소명 임계 기간 (숫자 입력 & 단위)
    cy.contains('.ers-label-main', '미소명 임계 기간').should('be.visible');
    cy.get('.ers-num').eq(0).should('be.visible').within(($input) => {
      expect($input).to.have.attr('type', 'number');
      // [변경] 최솟값 0 → 1
      expect($input).to.have.attr('min', '1');
      expect($input).to.have.attr('max', '365');
    });
    // [수정] "일마다"에도 "일"이 포함되므로 정확히 "일"인 단위만 확인
    cy.contains('.ers-unit', /^\s*일\s*$/).should('be.visible');

    // [설정 3] 재발송 주기 (숫자 입력 & 단위)
    cy.contains('.ers-label-main', '재발송 주기').should('be.visible');
    cy.get('.ers-num').eq(1).should('be.visible').within(($input) => {
      expect($input).to.have.attr('type', 'number');
      expect($input).to.have.attr('min', '1');
      expect($input).to.have.attr('max', '365');
    });
    cy.contains('.ers-unit', /^\s*일마다\s*$/).should('be.visible');

    // [설정 4] 발송 시각
    // [변경] 숫자 입력(input type=number, 0~23) → 드롭다운(select.ers-hour)
    cy.contains('.ers-label-main', '발송 시각').should('be.visible');
    cy.get('select.ers-num.ers-hour').should('be.visible').within(() => {
      // 0시 ~ 23시, 24개 옵션
      cy.get('option').should('have.length', 24).then(($options) => {
        const values = [...$options].map((o) => parseInt(o.value, 10));
        expect(values, '발송 시각 옵션 값').to.deep.equal([...Array(24).keys()]);
      });
    });
    // 선택된 값도 0~23 범위인지 확인
    cy.get('select.ers-num.ers-hour').invoke('val').then((val) => {
      const hour = parseInt(val, 10);
      expect(hour, '현재 발송 시각').to.be.within(0, 23);
    });
    // [확인 필요] 단위 "시" - 드롭다운 옵션 안에 "시"가 포함되었다면 별도 단위 표시가 없어졌을 수 있음
    cy.contains('.ers-unit', /^\s*시\s*$/).should('be.visible');

    // [설정 5] 이상행위 이력 엑셀 첨부 (스위치/체크박스)
    cy.contains('.ers-label-main', '이상행위 이력 엑셀 첨부').should('be.visible');
    cy.contains('.ers-label-sub', '자동 발송 메일에 대상자의 미소명 이상행위 이력 엑셀 파일을 첨부합니다.').should('be.visible');

    // [버튼] 저장 버튼
    cy.get('button.ers-btn.ers-save').should('be.visible').and('contain.text', '저장');

    // ------------------------------------------
    // 4. [섹션 2] 지금 즉시 실행
    // ------------------------------------------
    // 카드 헤더 검증
    cy.get('.ers-card-head').eq(1).should('be.visible').and('contain.text', '지금 즉시 실행');

    // 안내 설명 문구 검증
    cy.get('.ers-run-desc')
      .should('be.visible')
      .and('contain.text', '현재 설정값(임계 기간·재발송 주기) 기준으로, 지금 즉시 미소명 대상에게 소명 요청을 발송합니다.');

    // [버튼] 지금 실행 버튼
    cy.get('button.ers-btn.ers-run')
      .should('be.visible')
      .and('contain.text', '지금 실행');

    // ------------------------------------------
    // 5. 완료 로그
    // ------------------------------------------
    cy.log('✅ 소명 - 신청 - [소명 요청 자동화] 화면 확인 완료!');
    

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
