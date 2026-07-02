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
    // STEP 9: 분석 서브메뉴 - 이상행위 정책 탭
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    // 3.0.3.0_R34785 버전 실시간 탭 -> 이상행위 정책 탭 문구 변경됨
    cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '정책 유형').should('exist');
    cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 진입 및 데이터 출력 확인 완료!');
    cy.wait(2000);
    // 설명: 'v-chip__content' 클래스를 가진 요소 중 '업무 시간 외 접속' 텍스트를 찾아 클릭
    cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 업무시간 외 접속 및 데이터 출력 확인 완료!');
    cy.wait(2000);

    cy.contains('.v-chip__content', '장기 미접속 사용자').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '장기 미접속 사용자 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    cy.log('✅  분석 탭 - 장기 미접속 사용자 및 데이터 출력 확인 완료!');
    cy.wait(2000);

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
// STEP : 분석 - 사용자 이상행위 대시보드
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 대시보드').click({ force: true });
cy.wait(1000);

cy.log('--- 사용자 이상행위 대시보드 화면 검증 시작 ---');

// URL 확인
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyDashboard');

// 탭 확인
cy.get('.v-btn__content').filter(':visible').contains('이상행위 정책').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 대시보드').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').should('be.visible');

// 기간 버튼 확인
cy.get('i.material-icons').filter(':visible').contains('event').should('exist');
cy.get('.pcpf__btn-label').filter(':visible').contains('기간').should('be.visible');
cy.get('.pcpf__btn-value').filter(':visible').contains('오늘').should('be.visible');

// 전체 현황 섹션
cy.get('.anomaly-dashboard__section-title').filter(':visible').contains('전체 현황').should('be.visible');

// 위젯 카드 확인
cy.get('.anomaly-widget-card__title').filter(':visible').contains('클러스터 토폴로지').should('be.visible');
cy.get('.anomaly-widget-card__title').filter(':visible').contains('개인정보 유형별 사용자').should('be.visible');

// 정책별 분석 섹션
cy.get('.anomaly-dashboard__section-title').filter(':visible').contains('정책별 분석').should('be.visible');

cy.log('✅ 분석 - [사용자 이상행위 대시보드] 화면 확인 완료!');

// ==========================================
// STEP : 분석 - 사용자 이상행위 정책 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 정책 화면 검증 시작 ---');

// URL 확인
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicy');

// 헤드라인 및 신규 버튼
cy.get('h1.headline').filter(':visible').contains('정책 관리').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('신규').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('add').should('exist');

// 버전 안내 문구
cy.get('.version-notice').filter(':visible')
    .contains('규칙·위험도·메시지 등 핵심 사항을 수정하면 버전이 자동 증가').should('exist');

// 검색 영역
cy.get('i.v-icon.material-icons').filter(':visible').contains('search').should('exist');
cy.get('input[aria-label="정책명 / 설명 / 라벨 검색"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 사용여부 필터
cy.contains('.filter-label', '사용여부').should('be.visible');
cy.get('button.active-toggle-btn--active').contains('전체').should('be.visible');
cy.get('button.active-toggle-btn--on').contains('ON').should('be.visible');
cy.get('button.active-toggle-btn--off').contains('OFF').should('be.visible');

// 위험도 필터
cy.contains('.filter-label', '위험도').should('be.visible');
cy.get('button.sev-filter-btn--active').contains('전체').should('be.visible');
cy.get('button.sev-filter-btn--1').contains('높음').should('be.visible');
cy.get('button.sev-filter-btn--2').contains('보통').should('be.visible');
cy.get('button.sev-filter-btn--3').contains('낮음').should('be.visible');

// 데이터셋 필터
cy.contains('.filter-label', '데이터셋').should('be.visible');
cy.get('button.active-toggle-btn').contains('접속 기록 기준 탐').should('be.visible');
cy.get('button.active-toggle-btn').contains('개인정보 사용 기준').should('be.visible');

// 탐지대상 / 라벨 콤보박스
cy.contains('label', '탐지대상').should('exist');
cy.contains('label', '라벨').should('exist');

// 정책 카드 목록 존재 확인
cy.get('.policy-card-name').filter(':visible').should('have.length.at.least', 1);
// 정책 목록 카운트 및 툴바 버튼 확인
cy.get('.v-toolbar__title').filter(':visible').contains('정책 목록').should('be.visible');

// 액션 버튼 확인 (비활성 포함)
cy.get('button.toolbar-action-btn').filter(':visible').contains('주기복구').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('폴더이동').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('즉시실행').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('삭제').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('복사').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('내보내기').should('exist');
cy.get('button.toolbar-action-btn').filter(':visible').contains('가져오기').should('exist');

// 아이콘 확인
cy.get('i.material-icons').filter(':visible').contains('restore').should('exist');
cy.get('i.material-icons').filter(':visible').contains('folder_open').should('exist');
cy.get('i.material-icons').filter(':visible').contains('play_arrow').should('exist');
cy.get('i.material-icons').filter(':visible').contains('delete').should('exist');
cy.get('i.material-icons').filter(':visible').contains('content_copy').should('exist');
cy.get('i.material-icons').filter(':visible').contains('save_alt').should('exist');
cy.get('i.material-icons').filter(':visible').contains('publish').should('exist');

// 뷰 토글 버튼 (카드/목록/차트)
cy.get('.list-view-toggle-btn').filter(':visible').should('be.visible');
cy.get('.list-view-toggle-menu').find('.list-view-toggle-item').contains('☰ 목록').should('exist');
cy.get('.list-view-toggle-menu').find('.list-view-toggle-item').contains('▦ 카드').should('exist');
cy.get('.list-view-toggle-menu').find('.list-view-toggle-item').contains('📊 차트').should('exist');


// 카드 토글 스위치 및 기본 칩 확인
cy.get('[data-role="policy-active-toggle"]').filter(':visible').should('exist');
cy.get('.v-chip__content').filter(':visible').contains('기본').should('be.visible');

cy.log('✅ 분석 - [사용자 이상행위 정책] 화면 확인 완료!');

// ==========================================
// STEP : 분석 - 사용자 이상행위 결과 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 결과 화면 검증 시작 ---');

// URL 확인
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyResult');

// 헤드라인 및 안내 문구
cy.get('h1.headline.anomaly__title').filter(':visible').contains('이상행위 결과').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('expand_less').should('exist');
cy.get('.version-notice').filter(':visible')
    .contains('각 정책의 최신 버전에서 생성된 경보만 표시됩니다').should('exist');

// 기본 필터 패널
cy.get('.basic-filter-panel__title').filter(':visible').contains('기본 필터').should('be.visible');
cy.get('input[aria-label="정책 선택"]').should('exist');
cy.get('input[aria-label="메시지 + 정책명 검색"]').should('exist');
cy.get('input[aria-label="From"]').should('exist');
cy.get('input[aria-label="To"]').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 위험도 필터
cy.contains('.filter-label', '위험도').should('be.visible');
cy.get('button.sev-filter-btn--active').contains('전체').should('be.visible');
cy.get('button.sev-filter-btn--1').contains('높음').should('be.visible');
cy.get('button.sev-filter-btn--2').contains('보통').should('be.visible');
cy.get('button.sev-filter-btn--3').contains('낮음').should('be.visible');

// 기간 필터
cy.contains('.filter-label', '기간').should('be.visible');
cy.get('button.sev-filter-btn').contains('오늘').should('be.visible');
cy.get('button.sev-filter-btn').contains('1주일').should('be.visible');
cy.get('button.sev-filter-btn').contains('1개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('3개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('1년').should('be.visible');

// 경보 툴바
cy.get('.v-toolbar__title').filter(':visible').contains('경보').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('schedule').should('exist');

// 데이터 모드 버튼
cy.get('button.datamode-btn--active').contains('전체').should('be.visible');
// 데이터 모드 버튼 - 아이콘으로 검증 (라벨은 display:none)
cy.get('button.datamode-btn--active').should('exist'); // 전체 (활성)
cy.get('i.material-icons').filter(':visible').contains('list').should('exist');          // 전체
cy.get('i.material-icons').filter(':visible').contains('playlist_play').should('exist'); // 실행 단위
cy.get('i.material-icons').filter(':visible').contains('policy').should('exist');        // 정책별
cy.get('i.material-icons').filter(':visible').contains('person').should('exist');        // 사용자별
cy.get('i.material-icons').filter(':visible').contains('business').should('exist');      // 부서별
cy.get('i.material-icons').filter(':visible').contains('dns').should('exist');           // 업무별
cy.get('i.material-icons').filter(':visible').contains('menu_book').should('exist');     // 메뉴별
cy.get('i.material-icons').filter(':visible').contains('link').should('exist');          // 접속URI별
cy.get('i.material-icons').filter(':visible').contains('language').should('exist');      // 사용자IP별

// 버튼 개수로 한 번에 검증 (더 간단한 방법)
cy.get('button.datamode-btn').should('have.length.at.least', 9);

// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('위험도').should('be.visible');
cy.get('th').filter(':visible').contains('정책명').should('be.visible');
cy.get('th').filter(':visible').contains('알림 메시지').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 시작').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 종료').should('be.visible');

cy.log('✅ 분석 - [사용자 이상행위 결과] 화면 확인 완료!');

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
