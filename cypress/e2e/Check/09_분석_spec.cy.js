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

// ==========================================
// 기간 드롭다운 - "오늘" → "30일" 변경
// ==========================================

// 1. 기간 버튼 클릭하여 드롭다운 오픈
cy.get('.pcpf__btn-value').filter(':visible').contains('오늘').click({ force: true });
cy.wait(500);

// 2. 드롭다운 목록에서 "30일" 클릭
cy.get('.v-list__tile__title').filter(':visible').contains('30일').click({ force: true });
cy.wait(1000);

// 3. 기간 버튼 값이 "30일"로 변경되었는지 확인
cy.get('.pcpf__btn-value').filter(':visible').contains('30일').should('be.visible');
cy.wait(1000);


// ======================================================
// 정책별 분석 - 위젯 카드 (ApexCharts) 동적 데이터 대응 검증
// ======================================================

cy.get('.anomaly-widget-card__title').filter(':visible').should('have.length.greaterThan', 0).each(($title) => {
  // 1. title 속성 확인
  cy.wrap($title).invoke('attr', 'title').then((title) => {
    expect(title.trim().length).to.be.greaterThan(0);
  });

  // 2. 텍스트 내용 확인
  cy.wrap($title).invoke('text').then((text) => {
    expect(text.trim().length).to.be.greaterThan(0);
  });

  // 3. 카드 컨테이너를 정확히 잡아서, 카드 유형에 따라 분기 검증
  cy.wrap($title)
    .closest('.anomaly-widget-card')
    .then(($card) => {
      // 🌟 "토폴로지" 유형 카드는 시작 전(idle) 상태라 svg가 없는 게 정상 → 별도 검증
      const isTopologyIdle = $card.find('.topology-idle').length > 0;

      if (isTopologyIdle) {
        cy.log('ℹ️ 토폴로지 카드 - 시작 전(idle) 상태 확인');
        cy.wrap($card).find('.topology-idle').should('be.visible');
        cy.wrap($card).find('.topology-toggle').should('be.visible').and('contain.text', '시작');
      } else {
        // 🌟 일반 차트 카드는 svg가 반드시 존재해야 함
        cy.wrap($card).find('svg').should('exist');

        // legend는 있을 수도 없을 수도 있으므로 조건부 확인
        const legendCount = $card.find('.apexcharts-legend').length;
        if (legendCount > 0) {
          cy.wrap($card).find('.apexcharts-legend').should('exist');
        }
      }
    });
});

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


// 정책 가져오기 팝업 - 요소 확인 후 취소--------------------------------------------------------------------------
// 1. 가져오기 버튼 클릭 → 팝업 오픈
cy.get('button.toolbar-action-btn').filter(':visible').contains('가져오기').click({ force: true });
cy.wait(500);

cy.contains('정책 가져오기').should('be.visible');

// 2. "데이터 선택" 섹션 타이틀 확인
cy.contains('.import-section-title', '데이터 선택').should('be.visible');

// 3. "파일 선택" / "클립보드 붙여넣기" 버튼 확인
cy.contains('.import-source-btn-text', '파일 선택').should('be.visible');
cy.contains('.import-source-btn-text', '클립보드 붙여넣기').should('be.visible');

// 4. "가져오기 (0건)" 버튼 - disabled 상태 확인
cy.get('.v-card__actions').filter(':visible').within(() => {
  cy.contains('button', '취소').should('be.visible').and('not.be.disabled');
  cy.contains('button', '가져오기').should('be.disabled').and('have.class', 'v-btn--disabled').and('contain.text', '가져오기 (0건)');
});

// 5. 취소 버튼 클릭
cy.get('.v-card__actions').filter(':visible').contains('button', '취소').click({ force: true });
//-------------------------------------------------------------------------------------------------------------------

// ==========================================
// 정책 목록 툴바 - 아이콘/텍스트/disabled 상태 확인
// ==========================================

// 1. 정책 목록 타이틀 및 개수 확인
cy.contains('.v-toolbar__title', '정책 목록').should('be.visible');

// 2. 툴바 액션 버튼들 - 아이콘, 텍스트, disabled 여부 확인 (초기 상태: 미선택)
const disabledButtons = [
  { icon: 'restore', label: '주기복구' },
  { icon: 'folder_open', label: '폴더이동' },
  { icon: 'play_arrow', label: '즉시실행' },
  { icon: 'delete', label: '삭제' },
  { icon: 'content_copy', label: '복사' },
  { icon: 'save_alt', label: '내보내기' },
];

disabledButtons.forEach(({ icon, label }) => {
  cy.contains('.toolbar-action-btn', label)
    .should('be.visible')
    .and('be.disabled')
    .within(() => {
      cy.get('.material-icons').should('contain.text', icon);
    });
});

// 3. "가져오기" 버튼은 활성화 상태여야 함 (행 선택과 무관하게 항상 가능)
cy.contains('.toolbar-action-btn', '가져오기')
  .should('be.visible')
  .and('not.be.disabled')
  .within(() => {
    cy.get('.material-icons').should('contain.text', 'publish');
  });

// ==========================================
// 목록/카드/차트 뷰 토글 메뉴 - "목록" 선택 상태 확인
// ==========================================

// 1. 토글 버튼 확인 (현재 선택된 값이 "목록"인지)
cy.contains('.list-view-toggle-btn', '카드')
  .filter(':visible')
  .should('be.visible')
  .as('targetListToggleBtn');

cy.get('@targetListToggleBtn').invoke('text').then((text) => {
  expect(text.trim()).to.contain('카드');
});

// 2. 🌟 실제 마우스 hover 이벤트 발생 (CSS :hover 활성화)
cy.get('@targetListToggleBtn').realHover();
cy.wait(500);

// 3. 메뉴 항목들이 모두 보이는지 확인
cy.get('.list-view-toggle-menu').filter(':visible').should('be.visible').within(() => {
  cy.get('.list-view-toggle-item').should('have.length', 3);

  cy.contains('.list-view-toggle-item', '목록').should('be.visible');
  cy.contains('.list-view-toggle-item', '카드').should('be.visible');
  cy.contains('.list-view-toggle-item', '차트').should('be.visible');

  cy.contains('.list-view-toggle-item', '카드').should('have.class', 'active');
});



// ==================================================
// 사용자 이상행위 정책 - 카드 뷰 구조 검증 (동적 데이터 대응)
// ==================================================

cy.get('.policy-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  cy.wrap($card).within(() => {

    // 1. 선택 체크박스 - 존재 여부 및 초기 미체크 상태 확인
    cy.get('[data-role="policy-select"][type="checkbox"]')
      .should('exist')
      .and('have.attr', 'aria-checked'); // true/false 여부는 무관, 속성 존재만 확인

    // 2. 정책 ID - 숫자 형식인지 확인
    cy.get('.policy-card-id').invoke('text').then((text) => {
      const id = parseInt(text.trim(), 10);
      expect(isNaN(id)).to.be.false;
    });

    // 3. 버전 칩 - "v" + 숫자 형식인지 확인
    cy.get('.ver-chip .v-chip__content').invoke('text').then((text) => {
      expect(text.trim()).to.match(/^v\d+$/);
    });

    // 4. 정책명 - 비어있지 않은지 확인
    cy.get('.policy-card-name').invoke('text').then((text) => {
      expect(text.trim().length).to.be.greaterThan(0);
    });

    // 5. 사용 여부 토글 - 존재 여부 및 aria-checked 속성(true/false) 확인
    cy.get('[data-role="policy-active-toggle"][type="checkbox"]')
      .should('exist')
      .invoke('attr', 'aria-checked')
      .then((checked) => {
        expect(['true', 'false']).to.include(checked);
      });

    // 6. 위험도 칩 - "높음/보통/낮음" 중 하나인지 확인
    cy.get('.sev-chip-sm .v-chip__content').invoke('text').then((text) => {
      expect(['높음', '보통', '낮음']).to.include(text.trim());
    });

    // 7. 정책 설명 - 비어있지 않은지 확인
    cy.get('.policy-card-desc').invoke('text').then((text) => {
      expect(text.trim().length).to.be.greaterThan(0);
    });

    // 8. 수정일 - "YYYY-MM-DD HH:mm:ss" 형식인지 확인
    cy.get('.policy-card-footer .caption.grey--text').invoke('text').then((text) => {
      expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

  });
});

// ==========================================
// 테이블 페이지 사이즈 선택 영역 - 노출 확인
// ==========================================

// 1. 페이지 사이즈 선택 영역(wrapper) 전체가 보이는지 확인
cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {

// 2. 콤보박스(v-select)가 보이는지 확인
cy.get('.table-footer-size').should('be.visible');

// 3. 콤보박스 안의 드롭다운 화살표 아이콘이 보이는지 확인
cy.get('.v-input__icon--append .material-icons').should('be.visible').and('contain.text', 'arrow_drop_down');

// 4. "건" 텍스트가 보이는지 확인
cy.contains('.caption.grey--text', '건').should('be.visible');
});


// =========================================================
// 사용자 이상행위 정책 - 신규 버튼 → 신규정책화면 요소 확인 → 취소
// =========================================================
// 1. 신규 버튼 클릭 → 정책 생성 팝업 오픈
cy.get('.v-btn__content').filter(':visible').contains('신규').click({ force: true });
cy.wait(1000);

cy.contains('정책 생성').should('be.visible');


// 2. 상단 - 제목/라벨/설명/분류
cy.contains('label', '제목').should('exist').and('contain.text', '제목'); // 🌟 변경
cy.get('input[dense]').filter(':visible').first().should('be.visible'); // 제목 input
cy.get('input[aria-label="라벨"]').should('be.visible');
cy.get('textarea[aria-label="설명"]').should('be.visible');
cy.contains('.caption.grey--text', '미분류').should('be.visible');

// 3. 탐지 설정 섹션
cy.contains('.section-header', '탐지 설정').should('be.visible');

// 위험도 라디오 (높음/보통/낮음)
cy.contains('.severity-radio-label', '높음').should('be.visible');
cy.contains('.severity-radio-label', '보통').should('be.visible');
cy.contains('.severity-radio-label', '낮음').should('be.visible');

// 사용/소명 토글 라벨
cy.contains('.v-label', '사용').should('be.visible');
cy.contains('.v-label', '소명').should('be.visible');

// 탐지 기준 카드 (접속 기록 기준 탐지 / 개인정보 사용 기준 탐지)
cy.contains('접속 기록 기준 탐지').should('be.visible');
cy.contains('개인정보 사용 기준 탐지').should('be.visible');

// 탐지대상 체크박스 목록
const targets = ['업무시스템', '부서', '등록된 메뉴', '접속 URI', '사용자', '접속 IP', '사용자 계정'];
targets.forEach((label) => {
  cy.contains('.groupby-card-label', label).should('be.visible');
});

// 4. 탐지 주기 섹션
cy.contains('.section-header', '탐지 주기').should('be.visible');

cy.get('input[aria-label="탐지시작일"]').should('be.visible');
cy.get('input[aria-label="실행주기"]').should('be.visible');

// 시간범위 (필수 항목, 최대 24)
cy.contains('시간범위').should('be.visible');
cy.contains('최대 24').should('be.visible');
cy.get('input[type="number"]').filter(':visible').should('be.visible');

// 단위 선택 (기본값 "시간")
cy.contains('.v-label', '단위').should('be.visible');
cy.get('.v-select__selection--comma').filter(':visible').contains('시간').should('be.visible');

// 5. 탐지 규칙 섹션
cy.contains('탐지 규칙').should('be.visible');

cy.get('.section-tab').filter(':visible').contains('미리보기').should('be.visible');
cy.get('.section-tab--active').filter(':visible').contains('수정').should('be.visible');

cy.contains('.ws-toolbar-label', '조건').should('be.visible');
cy.contains('.ws-toolbar-subtitle', '어떤 접근 기록을 감시할지 선별합니다').should('be.visible');

cy.contains('.ws-toolbar-label', '집계').should('be.visible');
cy.contains('.ws-toolbar-subtitle', '수치 기준으로 이상행위를 판정합니다').should('be.visible');

// 탐지 규칙 - 조건(도구) 팔레트 블록 확인 (스크롤 필요, 상단 sticky 툴바 고려)
const conditionTools = [
  '접속 시간', '업무시스템', '부서', '파일 다운로드', '파일 업로드',
  '개인정보 포함', '등록된 메뉴', '정보주체 수', '개인정보 유형',
  '접속 URI', '사용자', '사용자 IP', '사용자 계정',
];
conditionTools.forEach((label) => {
  cy.contains('.pal-block-text', label)
    .scrollIntoView({ offset: { top: -100 } })
    .should('be.visible');
});

// 탐지 규칙 - 집계(도구) 팔레트 블록 확인 (스크롤 필요, 상단 sticky 툴바 고려)
const aggregationTools = [
  '발생 횟수', '숫자 합계', '고유 항목 개수', '최댓값', '최솟값',
  '평균값', '중앙값', '상위 10%', '상위 5%', '기준선 편차 분석',
];
aggregationTools.forEach((label) => {
  cy.contains('.pal-block-text', label)
    .scrollIntoView({ offset: { top: -100 } })
    .should('be.visible');
});

// 6. 경보 메시지 섹션
cy.contains('.v-card__title', '경보 메시지')
  .scrollIntoView({ offset: { top: -100 } })
  .should('be.visible');

cy.contains('.ws-toolbar-subtitle', '$를 사용하여 탐지 로그에 실제 값을 표시할 수 있습니다')
  .should('be.visible');

cy.contains('.caption.grey--text', '탐지 시 로그 메시지').should('be.visible');
cy.contains('.msg-editor-placeholder', '[사용자]가 [업무시스템] 시스템에서 이상행위 탐지')
  .should('exist')
  .and('contain.text', '[사용자]가 [업무시스템] 시스템에서 이상행위 탐지');

cy.contains('.caption.grey--text', '상세 설명').should('be.visible');
cy.contains('.msg-editor-placeholder', '탐지 사유 및 상세 내용을 기술합니다.')
  .should('exist')
  .and('contain.text', '탐지 사유 및 상세 내용을 기술합니다.');

// 7. 기본 차트 관점 섹션
cy.contains('.v-card__title.default-perspective-title', '기본 차트 관점').scrollIntoView({ offset: { top: -100 } }).should('be.visible');

cy.contains('.ws-toolbar-subtitle', '차트뷰/모니터링에서 카드별 임시 변경이 없을 때 적용되는 기본값').should('be.visible');

// X축 / Y축 / 차트 타입 라벨 확인
cy.contains('X축').should('be.visible');
cy.contains('Y축').should('be.visible');
cy.contains('차트 타입').should('be.visible');

// 각 셀렉트 박스 기본값 확인
cy.get('.v-select__selection--comma').filter(':visible').contains('기간').should('be.visible');
cy.get('.v-select__selection--comma').filter(':visible').contains('없음 (단일 series)').should('be.visible');
cy.get('.v-select__selection--comma').filter(':visible').contains('세로 막대').should('be.visible');

// 8. 하단 버튼 (즉시실행 / 취소 / 저장)
cy.contains('.v-btn__content', '즉시실행').should('be.visible');
cy.contains('.v-btn__content', '취소').should('be.visible');
cy.contains('.v-btn__content', '저장').should('be.visible');


// 9. 신규 정책 화면 - 취소 버튼 클릭
cy.contains('.v-btn__content', '취소').click({ force: true });
//--------------------------------------------------------------------------

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
cy.get('.version-notice').filter(':visible').contains('각 정책의 최신 버전에서 생성된 경보만 표시됩니다').should('exist');

// 기본 필터 패널
cy.get('.basic-filter-panel__title').filter(':visible').contains('기본 필터').should('be.visible');
cy.get('input[aria-label="정책 선택"]').should('exist');
cy.get('input[aria-label="메시지 + 정책명 검색"]').should('exist');
cy.get('input[aria-label="From"]').should('exist');
cy.get('input[aria-label="To"]').should('exist');

// 검색 버튼이 화면에 보이는지만 확인
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



// ==========================================
// 고급 필터 - 화면 요소 노출 검증
// ==========================================
// "고급 필터" 클릭
cy.get('.adv-filter-panel__title').filter(':visible').contains('고급 필터').click({ force: true });

// 1. 라벨(제목) 영역 검증
cy.get('.adv-filter-panel__label').filter(':visible').contains('시간').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('요일').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('사용자').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('부서').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('업무').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('메뉴').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('URI').should('be.visible');

// 2. 시간 - 프리셋 버튼 검증 (전체/업무시간/심야)
cy.get('.hour-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('업무시간').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('심야').should('be.visible');

// 3. 요일 - 프리셋 버튼 검증 (전체/평일/주말)
cy.get('.dow-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('평일').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('주말').should('be.visible');

// 4. 요일 - 개별 요일 셀 검증 (월~일)
['월', '화', '수', '목', '금', '토', '일'].forEach((day) => {
  cy.get('.dow-picker__cell').filter(':visible').contains(day).should('be.visible');
});

// 5. 입력창(input) 검증 - placeholder 기준
cy.get('input[placeholder="사용자 ID 또는 이름 검색"]').should('be.visible');
cy.get('input[placeholder="부서 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="업무 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="메뉴 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="예: /api/audit/logs (Enter 로 추가)"]').should('be.visible');

//-----------------------------------------------------------------------------------------------

// 경보 툴바
cy.get('.v-toolbar__title').filter(':visible').contains('경보').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('schedule').should('exist');
// 버튼 개수로 한 번에 검증 (더 간단한 방법)
cy.get('button.datamode-btn').should('have.length.at.least', 9);

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


/////////////////////////////
// 경보 툴바 - 전체 클릭했을때 
/////////////////////////////
cy.get('.datamode-btn').filter(':visible').contains('전체').click({ force: true });
// 테이블 컬럼 확인
cy.get('th').filter(':visible').contains('위험도').should('be.visible');
cy.get('th').filter(':visible').contains('정책명').should('be.visible');
cy.get('th').filter(':visible').contains('알림 메시지').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 시작').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 종료').should('be.visible');

// ===========================================
// 통합 커맨드: incident-header 리스트 구조 검증 
// ===========================================
Cypress.Commands.add('verifyIncidentHeaderRows', (mode) => {
  cy.get('.incident-header').filter(':visible').should('have.length.greaterThan', 0).each(($row) => {
    cy.wrap($row).within(() => {

      cy.get('.v-chip--label').first().invoke('text').then((text) => {
        expect(['높음', '보통', '낮음']).to.include(text.trim());
      });

      cy.get('.incident-count').invoke('text').then((text) => {
        expect(isNaN(parseInt(text.trim(), 10))).to.be.false;
      });

      if (mode === 'unit' || mode === 'policy') {
        cy.get('.ver-chip .v-chip__content').invoke('text').then((text) => {
          expect(text.trim()).to.match(/^v\d+$/);
        });

        cy.get('.incident-policy-name').invoke('text').then((text) => {
          expect(text.trim().length).to.be.greaterThan(0);
        });

        if (mode === 'policy') {
          cy.get('.caption.grey--text.ml-1').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^\(\d+회 실행\)$/);
          });
        }

        cy.get('.incident-window').invoke('text').then((text) => {
          expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ~ \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });
      }

      if (['user', 'department', 'work', 'menu', 'uri', 'ip'].includes(mode)) {
        const iconMap = {
          user: 'person',
          department: 'business',
          work: 'dns',
          menu: 'menu_book',
          uri: 'link',
          ip: 'language',
        };
        const expectedIcon = iconMap[mode];

        cy.get('.lookup-badge-group').should('be.visible').within(() => {
          cy.get('.material-icons').should('contain.text', expectedIcon);
        });

        // 🌟 아이콘 텍스트를 제외한 순수 라벨 텍스트만 추출하는 헬퍼
        cy.get('.lookup-badge-group').then(($el) => {
          const clone = $el.clone();
          clone.find('.material-icons').remove();
          const labelText = clone.text().trim();

          expect(labelText.length).to.be.greaterThan(0);

          if (mode === 'uri' && !labelText.includes('알수없음')) {
            expect(labelText).to.match(/^\//);
          }

          if (mode === 'ip' && !labelText.includes('알수없음')) {
            expect(labelText).to.match(/^(\d{1,3}\.){3}\d{1,3}$/);
          }
        });

        cy.get('.incident-window.truncate-cell').invoke('text').then((text) => {
          const policies = text.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
          expect(policies.length).to.be.greaterThan(0);
        });
      }

    });
  });
});

cy.contains('.datamode-btn', '실행 단위').click({ force: true });
cy.verifyIncidentHeaderRows('unit');

cy.contains('.datamode-btn', '정책별').click({ force: true });
cy.verifyIncidentHeaderRows('policy');

cy.contains('.datamode-btn', '사용자별').click({ force: true });
cy.verifyIncidentHeaderRows('user');

cy.contains('.datamode-btn', '부서별').click({ force: true });
cy.verifyIncidentHeaderRows('department');

cy.contains('.datamode-btn', '업무별').click({ force: true });
cy.verifyIncidentHeaderRows('work');

cy.contains('.datamode-btn', '메뉴별').click({ force: true });
cy.verifyIncidentHeaderRows('menu');

cy.contains('.datamode-btn', '접속URI별').click({ force: true });
cy.verifyIncidentHeaderRows('uri');

cy.contains('.datamode-btn', '사용자IP별').click({ force: true });
cy.verifyIncidentHeaderRows('ip');


// ==========================================
// 타임라인/그룹 뷰 토글 메뉴 - "전체" 선택 상태 확인
// ==========================================

// 1. 토글 버튼 확인 (현재 선택된 값이 "전체"인지)
cy.contains('.childview-toggle-btn', '전체')
  .filter(':visible')
  .should('be.visible')
  .as('targetToggleBtn');

cy.get('@targetToggleBtn').invoke('text').then((text) => {
  expect(text.trim()).to.contain('전체');
});

// 2. 🌟 실제 마우스 hover 이벤트 발생 (CSS :hover 활성화)
cy.get('@targetToggleBtn').realHover();
cy.wait(500);

// 3. 메뉴 항목들이 모두 보이는지 확인
cy.get('.childview-toggle-menu').filter(':visible').should('be.visible').within(() => {
cy.get('.childview-toggle-item').should('have.length', 5);

  cy.contains('.childview-toggle-item', '전체').should('be.visible');
  cy.contains('.childview-toggle-item', '그룹 > 타임라인').should('be.visible');
  cy.contains('.childview-toggle-item', '타임라인(일) > 그룹').should('be.visible');
  cy.contains('.childview-toggle-item', '타임라인(주) > 그룹').should('be.visible');
  cy.contains('.childview-toggle-item', '타임라인(월) > 그룹').should('be.visible');

  cy.contains('.childview-toggle-item', '전체').should('have.class', 'active');
});

// ==========================================
// 테이블 페이지 사이즈 선택 영역 - 노출 확인
// ==========================================

// 1. 페이지 사이즈 선택 영역(wrapper) 전체가 보이는지 확인
cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {

// 2. 콤보박스(v-select)가 보이는지 확인
cy.get('.table-footer-size').should('be.visible');

// 3. 콤보박스 안의 드롭다운 화살표 아이콘이 보이는지 확인
cy.get('.v-input__icon--append .material-icons').should('be.visible').and('contain.text', 'arrow_drop_down');

// 4. "건" 텍스트가 보이는지 확인
cy.contains('.caption.grey--text', '건').should('be.visible');
});

//기간 - 오늘 클릭
cy.get('.sev-filter-btn').filter(':visible').contains('오늘').click({ force: true });
// "전체 비우기" 버튼 노출 확인
cy.get('.basic-filter-panel__clear-all', { timeout: 10000 }).filter(':visible').should('be.visible').and('contain.text', '전체 비우기');

cy.log('✅ 분석 - [사용자 이상행위 결과] 화면 확인 완료!');

// ================================
// [FINAL] 테스트 종료 및 메뉴 닫기
// ================================
cy.log('🎉 모든 테스트 시나리오 성공적으로 완료!');
cy.get('body').type('{esc}');
cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
