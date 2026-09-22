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

  
  it('로그캐치 v2.8 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.81:18443/logcatch/login');
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
    
    //2.9.1.125_r35234 에서 제거됨.
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
// STEP : 분석 - 사용자 이상행위 대시보드 (v2.8)
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 대시보드').click({ force: true });
cy.wait(1000);

cy.log('--- 사용자 이상행위 대시보드 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyDashboard'); // [확인 필요] v2.8 URL
cy.get('.cabp-dashboard').should('be.visible');

// 탭 확인
['이상행위 정책', '사용자 이상행위 대시보드', '사용자 이상행위 정책', '사용자 이상행위 결과'].forEach((tab) => {
  cy.get('.v-btn__content').filter(':visible').contains(tab).should('be.visible');
});

// 기간 버튼
cy.get('.pcpf__btn').filter(':visible').within(() => {
  cy.get('.pcpf__btn-icon').should('contain.text', 'event');
  cy.get('.pcpf__btn-label').should('contain.text', '기간');
  cy.get('.pcpf__btn-value').should('contain.text', '오늘');
});

// 섹션 타이틀 + 섹션별 레이아웃 편집 버튼 (v2.8은 빈 카드 숨김/중지된 정책/지난 버전 없음)
['전체 현황', '정책별 분석'].forEach((section) => {
  cy.contains('.anomaly-dashboard__section-bar', section).within(() => {
    cy.get('.anomaly-dashboard__section-title').should('be.visible');
    cy.contains('.anomaly-dashboard__edit-btn', '레이아웃 편집')
      .should('exist')
      .find('.material-icons').should('contain.text', 'edit');
  });
});

// 전체 현황 - 고정 카드 2종
cy.contains('.anomaly-widget-card__title', '클러스터 토폴로지').should('be.visible');
cy.contains('.anomaly-widget-card__title', '개인정보 유형별 사용자')
  .should('be.visible')
  .closest('.anomaly-widget-card')
  .within(() => {
    cy.get('select.anomaly-widget-card__lp-select[title="Top"]').should('exist');
    cy.get('select.anomaly-widget-card__lp-select[title="개인정보 유형"]').should('exist');
  });

// ==========================================
// 기간 드롭다운 - "오늘" → "30일" 변경
// ==========================================
cy.get('.pcpf__btn').filter(':visible').click({ force: true });
cy.wait(500);
cy.get('.v-list__tile__title').filter(':visible').contains('30일').click({ force: true }); // [확인 필요] v2.8 메뉴 항목
cy.wait(1000);
cy.get('.pcpf__btn-value').filter(':visible').should('contain.text', '30일');
cy.wait(1000);

// ======================================================
// 위젯 카드 전체 - 동적 데이터 대응 검증
// ======================================================
const emptyMsg = /조회 결과가 존재하지 않습니다/;

cy.get('.anomaly-widget-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  const title = ($card.find('.anomaly-widget-card__title').attr('title') || '').trim();
  expect(title, '카드 제목').to.have.length.greaterThan(0);

  // 1) 클러스터 토폴로지 - 시작 전(idle) 상태
  if ($card.find('.topology-idle').length > 0) {
    cy.log(`ℹ️ [${title}] 토폴로지 idle 상태`);
    cy.wrap($card).find('.topology-idle').should('be.visible');
    cy.wrap($card).find('.topology-toggle').should('be.visible').and('contain.text', '시작');
    return;
  }

  // 2) 차트 카드 - 차트가 그려졌거나(값 0 막대 포함) 데이터 없음 문구가 떴으면 정상
  cy.wrap($card)
    .should(($c) => {
      expect($c.find('svg.apexcharts-svg').length, `${title}: 차트 렌더링`).to.be.greaterThan(0);
      const hasChart = $c.find('.apexcharts-series path, .apexcharts-pie-series path').length > 0;
      const hasEmpty = emptyMsg.test($c.find('svg.apexcharts-svg').text());
      expect(hasChart || hasEmpty, `${title}: 차트 또는 '데이터 없음' 표시`).to.be.true;
    })
    .then(($c) => {
      const state = $c.find('.apexcharts-series path, .apexcharts-pie-series path').length > 0
        ? '📊 차트' : '⬜ 데이터 없음';
      cy.log(`[${title}] ${state}`);
    });

  // 3) 정책 카드 - 관점(perspective) 버튼 확인
  if ($card.find('.perspective-btn').length > 0) {
    cy.wrap($card).find('.perspective-btn').within(() => {
      cy.get('.material-icons').first().should('contain.text', 'tune');
      cy.get('.perspective-btn__label').invoke('text').should('match', /\S+/);
    });
  }
});

cy.log('✅ 분석 - [사용자 이상행위 대시보드] 화면 확인 완료!');



// ==========================================
// STEP : 분석 - 사용자 이상행위 정책 탭 (v2.8)
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 정책 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicy'); // [확인 필요] v2.8 URL

// 헤더 / 신규 버튼
cy.contains('.policy-page-header .headline', '정책 관리').should('be.visible');
cy.contains('.policy-page-actions .v-btn__content', '신규')
  .should('be.visible')
  .find('.material-icons').should('contain.text', 'add');

// 버전 안내 문구
cy.get('.version-notice').filter(':visible')
  .should('contain.text', '규칙·위험도·메시지 등 핵심 사항을 수정하면 버전이 자동 증가');

// 폴더 필터
cy.get('.folder-toggle[title="폴더 필터"]').should('be.visible')
  .find('.material-icons').should('contain.text', 'folder');

// 검색 영역 (v2.8: aria-label 기반)
cy.get('input[aria-label="정책명 / 설명 / 라벨 검색"]').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('search').should('exist');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
cy.get('input[aria-label="탐지대상"]').filter(':visible').should('be.visible');
cy.get('input[aria-label="라벨"]').filter(':visible').should('be.visible');

// 사용여부 필터
cy.contains('.filter-label', '사용여부').parent().within(() => {
  cy.get('.active-toggle-btn--active').should('contain.text', '전체');
  cy.get('.active-toggle-btn--on').should('contain.text', 'ON');
  cy.get('.active-toggle-btn--off').should('contain.text', 'OFF');
});

// 위험도 필터
cy.contains('.filter-label', '위험도').parent().within(() => {
  cy.get('.sev-filter-btn--active').should('contain.text', '전체');
  cy.get('.sev-filter-btn--1').should('contain.text', '높음');
  cy.get('.sev-filter-btn--2').should('contain.text', '보통');
  cy.get('.sev-filter-btn--3').should('contain.text', '낮음');
});

// 데이터셋 필터 (v2.8: 버튼 텍스트가 잘려서 표시됨 → 앞부분만 비교)
cy.contains('.filter-label', '데이터셋').parent().within(() => {
  cy.get('.active-toggle-btn').should('have.length', 3);
  cy.get('.active-toggle-btn--active').should('contain.text', '전체');
  cy.get('.active-toggle-btn').eq(1).should('contain.text', '접속 기록 기준');
  cy.get('.active-toggle-btn').eq(2).should('contain.text', '개인정보 사용 기준');
});

// ==========================================
// 정책 목록 툴바
// ==========================================
cy.get('.v-toolbar__title').filter(':visible')
  .invoke('text')
  .should('match', /정책 목록\s*\(\d+\)/);

// 액션 버튼 - 선택 전 disabled (v2.8: 주기복구 있음, 사용 ON/OFF 없음)
const disabledButtons = [
  { icon: 'restore',      label: '주기복구' },
  { icon: 'folder_open',  label: '폴더이동' },
  { icon: 'play_arrow',   label: '즉시실행' },
  { icon: 'delete',       label: '삭제' },
  { icon: 'content_copy', label: '복사' },
  { icon: 'save_alt',     label: '내보내기' },
];
disabledButtons.forEach(({ icon, label }) => {
  cy.contains('.toolbar-action-btn', label)
    .should('be.visible')
    .and('be.disabled')
    .find('.material-icons').should('contain.text', icon);
});

cy.contains('.toolbar-action-btn', '가져오기')
  .should('be.visible')
  .and('not.be.disabled')
  .find('.material-icons').should('contain.text', 'publish');

// ==========================================
// 목록/카드/차트 보기 토글 메뉴 (v2.8: 3개)
// ==========================================
cy.contains('.list-view-toggle-btn', '카드')
  .filter(':visible')
  .as('targetListToggleBtn');

cy.get('@targetListToggleBtn')
  .scrollIntoView({ offset: { top: -100 } })
  .should('be.visible')
  .realHover();
cy.wait(500);

cy.get('body').then(($body) => {
  if ($body.find('.list-view-toggle-menu:visible').length === 0) {
    cy.get('@targetListToggleBtn').trigger('mouseenter').trigger('mouseover');
    cy.wait(500);
  }
});

cy.get('.list-view-toggle-menu').filter(':visible').should('be.visible').within(() => {
  cy.get('.list-view-toggle-item').should('have.length', 3);
  cy.contains('.list-view-toggle-item', '목록').should('be.visible');
  cy.contains('.list-view-toggle-item', '카드').should('be.visible').and('have.class', 'active');
  cy.contains('.list-view-toggle-item', '차트').should('be.visible');
});

// ==================================================
// 정책 카드 구조 검증 (동적 데이터 대응)
// ==================================================
cy.get('.policy-card').filter(':visible').should('have.length.greaterThan', 0).each(($card) => {
  cy.wrap($card).within(() => {
    // 1. 선택 체크박스
    cy.get('input[data-role="policy-select"][type="checkbox"]')
      .should('exist')
      .and('have.attr', 'aria-checked');

    // 2. 정책 ID - v2.8은 "#" 없이 숫자만
    cy.get('.policy-card-id').invoke('text').should('match', /^\s*\d+\s*$/);

    // 3. 버전 칩 - v2.8: .ver-chip
    cy.get('.ver-chip .v-chip__content').invoke('text').should('match', /^\s*v\d+\s*$/);

    // 4. 정책명
    cy.get('.policy-card-name').invoke('text').should('match', /\S+/);

    // 5. 사용 여부 토글
    cy.get('input[data-role="policy-active-toggle"][type="checkbox"]')
      .invoke('attr', 'aria-checked')
      .should('be.oneOf', ['true', 'false']);

    // 6. 위험도 칩
    cy.get('.sev-chip-sm .v-chip__content').invoke('text').then((text) => {
      expect(['높음', '보통', '낮음']).to.include(text.trim());
    });

    // 7. 정책 설명 - v2.8: 앞면 .policy-card-desc
    cy.get('.policy-card-desc').invoke('text').should('match', /\S+/);

    // 8. 수정일 - v2.8: footer 안의 caption
    cy.get('.policy-card-footer .caption.grey--text')
      .invoke('text')
      .should('match', /^\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*$/);
  });
});

// ==========================================
// 테이블 하단 - 페이지 정보 / 페이지 사이즈
// ==========================================
cy.get('.table-footer-info').filter(':visible')
  .invoke('text')
  .should('match', /\d+-\d+ of \d+/);

cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {
  cy.get('.table-footer-size').should('be.visible');
  cy.get('.v-input__icon--append .material-icons').should('be.visible').and('contain.text', 'arrow_drop_down');
  cy.contains('.caption.grey--text', '건').should('be.visible');
});

cy.log('✅ 분석 - [사용자 이상행위 정책] 목록 화면 확인 완료!');



// ==========================================
// STEP : 분석 - 사용자 이상행위 결과 탭 (v2.8)
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 결과 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyResult'); // [확인 필요] v2.8 URL

// 헤더 / 안내 문구
cy.contains('.anomaly__title', '이상행위 결과').should('be.visible');
cy.get('.version-notice').filter(':visible')
  .should('contain.text', '각 정책의 최신 버전에서 생성된 경보만 표시됩니다');

// ==========================================
// 기본 필터
// ==========================================
cy.get('.basic-filter-panel__title').filter(':visible').contains('기본 필터').should('be.visible');

// v2.8: aria-label 기반
cy.get('input[aria-label="정책 선택"]').should('exist');
cy.get('input[aria-label="메시지 + 정책명 검색"]').should('exist');

// 날짜 From ~ To
cy.get('.date-range-picker').filter(':visible').within(() => {
  cy.get('input[aria-label="From"][type="date"]').should('be.visible');
  cy.get('input[aria-label="To"][type="date"]').should('be.visible');
  cy.get('.date-range-sep').should('contain.text', '~');
});
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 위험도 필터
cy.contains('.filter-label', '위험도').parent().within(() => {
  cy.get('.sev-filter-btn--active').should('contain.text', '전체');
  cy.get('.sev-filter-btn--1').should('contain.text', '높음');
  cy.get('.sev-filter-btn--2').should('contain.text', '보통');
  cy.get('.sev-filter-btn--3').should('contain.text', '낮음');
});

// 기간 필터 (v2.8: 중지된 정책 / 지난 버전 필터 없음)
cy.contains('.filter-label', '기간').parent().find('.quick-date-group').within(() => {
  ['오늘', '1주일', '1개월', '3개월', '1년'].forEach((p) => {
    cy.contains('.sev-filter-btn', p).should('be.visible');
  });
});

// ==========================================
// 고급 필터
// ==========================================
cy.get('.adv-filter-panel__title').filter(':visible').contains('고급 필터').click({ force: true });
cy.get('.adv-filter-panel__body').should('be.visible');

['시간', '요일', '사용자', 'IP', '부서', '업무', '메뉴', 'URI'].forEach((label) => {
  cy.contains('.adv-filter-panel__label', new RegExp(`^\\s*${label}\\s*$`)).should('be.visible');
});

// 시간 프리셋 + 00~23 셀
['전체', '업무시간', '심야'].forEach((p) => {
  cy.contains('.hour-picker__preset-btn', p).should('be.visible');
});
cy.get('.hour-picker__cell').filter(':visible').should('have.length', 24);

// 요일 프리셋 + 셀
['전체', '평일', '주말'].forEach((p) => {
  cy.contains('.dow-picker__preset-btn', p).should('be.visible');
});
['월', '화', '수', '목', '금', '토', '일'].forEach((day) => {
  cy.contains('.dow-picker__cell', day).should('be.visible');
});

// 입력란
[
  '사용자 ID 또는 이름 검색',
  '예: 10.0.3.12 (Enter 로 추가)',
  '부서 ID 또는 명칭 검색',
  '업무 ID 또는 명칭 검색',
  '메뉴 ID 또는 명칭 검색',
  '예: /api/audit/logs (Enter 로 추가)',
].forEach((ph) => {
  cy.get(`input[placeholder="${ph}"]`).should('be.visible');
});

// ==========================================
// 경보 툴바
// ==========================================
cy.get('.v-toolbar__title').filter(':visible')
  .invoke('text')
  .should('match', /경보\s*\(\d+건\)/);

cy.get('.last-fetched').filter(':visible').should('be.visible')
  .find('.material-icons').should('contain.text', 'schedule');

// 데이터모드 버튼 9개 (v2.8: 실행 단위 포함, 기본 활성 = 전체)
const dataModes = [
  { label: '전체',       icon: 'list' },
  { label: '실행 단위',  icon: 'playlist_play' },
  { label: '정책별',     icon: 'policy' },
  { label: '사용자별',   icon: 'person' },
  { label: '부서별',     icon: 'business' },
  { label: '업무별',     icon: 'dns' },
  { label: '메뉴별',     icon: 'menu_book' },
  { label: '접속URI별',  icon: 'link' },
  { label: '사용자IP별', icon: 'language' },
];

cy.get('button.datamode-btn').filter(':visible').should('have.length', dataModes.length);
cy.get('button.datamode-btn--active .datamode-btn-label').should('have.text', '전체');

dataModes.forEach(({ label, icon }) => {
  cy.contains('.datamode-btn-label', new RegExp(`^\\s*${label}\\s*$`))
    .closest('button.datamode-btn')
    .find('.material-icons').should('contain.text', icon);
});

// 전체 모드 테이블 헤더
['위험도', '정책명', '알림 메시지', '탐지 시작', '탐지 종료'].forEach((th) => {
  cy.get('th').filter(':visible').contains(th).should('be.visible');
});

// ==========================================
// 데이터모드별 경보 목록 검증 (데이터 0건 / 있음 모두 대응)
// ==========================================
Cypress.Commands.add('verifyIncidentHeaderRows', (mode) => {
  // 앱 헤더가 아닌 '경보 (...)' 툴바 제목만 잡고, 건수가 표시될 때까지 재시도
  cy.contains('.v-toolbar__title', /경보\s*\(/)
    .should(($t) => {
      expect($t.text(), `[${mode}] 툴바 건수 표시`).to.match(/\d+\s*건/);
    })
    .invoke('text')
    .then((rawTitle) => {
      const title = rawTitle.replace(/\s+/g, ' ').trim();   // 예: "경보 (실행 단위 0건)"
      const count = parseInt(title.match(/(\d+)\s*건/)[1], 10);
      cy.log(`[${mode}] ${title}`);

            if (count === 0) {
        cy.get('.incident-header:visible').should('not.exist');
        return;
      }

      // ── 전체(flat) 모드: 일반 테이블 행 ──
      if (mode === 'all') {
        cy.get('.alert-table tbody tr').filter(':visible')
          .filter((i, tr) => Cypress.$(tr).children('td').length >= 5)   // 안내/확장 행 제외
          .should('have.length.greaterThan', 0)
          .each(($tr) => {
            const tds = $tr.children('td');
            // 1. 위험도
            expect(['높음', '보통', '낮음']).to.include(tds.eq(0).text().trim());
            // 2. 정책명 - 버전 칩(v1) + 정책명
            const policy = tds.eq(1).text().replace(/\s+/g, ' ').trim();
            expect(policy, '정책명').to.match(/v\d+\s*\S+/);
            // 3. 알림 메시지
            expect(tds.eq(2).text().trim().length, '알림 메시지').to.be.greaterThan(0);
            // 4~5. 탐지 시작 / 종료
            const dt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
            expect(tds.eq(3).text().trim(), '탐지 시작').to.match(dt);
            expect(tds.eq(4).text().trim(), '탐지 종료').to.match(dt);
          });
        return;
      }

      // ── 그룹 모드: incident-header 행 ──
      cy.get('.incident-header').filter(':visible').should('have.length.greaterThan', 0).each(($row) => {
        cy.wrap($row).within(() => {
          cy.get('.v-chip--label').first().invoke('text').then((text) => {
            expect(['높음', '보통', '낮음']).to.include(text.trim());
          });
          cy.get('.incident-count').invoke('text').should('match', /\d+/);
        });
      });
    });
});

// v2.8 라벨은 정확히 일치로 클릭 ('사용자별'이 '사용자IP별'과 겹치지 않도록)
const clickMode = (label) =>
  cy.contains('.datamode-btn-label', new RegExp(`^\\s*${label}\\s*$`)).click({ force: true });

[
  ['실행 단위', 'run'],
  ['정책별', 'policy'],
  ['사용자별', 'user'],
  ['부서별', 'department'],
  ['업무별', 'work'],
  ['메뉴별', 'menu'],
  ['접속URI별', 'uri'],
  ['사용자IP별', 'ip'],
  ['전체', 'all'],
].forEach(([label, mode]) => {
  clickMode(label);
  cy.wait(500);
  cy.verifyIncidentHeaderRows(mode);
});

// ==========================================
// 테이블 하단
// ==========================================
cy.get('.table-footer-info').filter(':visible').invoke('text').should('match', /\d+/);

cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {
  cy.get('.table-footer-size').should('be.visible');
  cy.get('.v-input__icon--append .material-icons').should('contain.text', 'arrow_drop_down');
  cy.contains('.caption.grey--text', '건').should('be.visible');
  cy.get('button[title="컬럼 표시 설정"]').should('be.visible')
    .find('.material-icons').should('contain.text', 'settings');
});

// 기간 - 오늘 클릭
cy.contains('.quick-date-group .sev-filter-btn', '오늘').click({ force: true });
// [확인 필요] v2.8에 '전체 비우기' 버튼이 필터 적용 후 나타나는지
cy.get('body').then(($body) => {
  if ($body.find('.basic-filter-panel__clear-all:visible').length > 0) {
    cy.get('.basic-filter-panel__clear-all').filter(':visible').should('contain.text', '전체 비우기');
  } else {
    cy.log('ℹ️ 전체 비우기 버튼 없음 (v2.8) - 스킵');
  }
});

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
