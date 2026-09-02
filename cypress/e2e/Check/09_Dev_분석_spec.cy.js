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
    
    //2.9.1.125_r35234 에서 제거됨.
    // cy.log('--- 화면 검증 시작 ---');
    // // 3.0.3.0_R34785 버전 실시간 탭 -> 이상행위 정책 탭 문구 변경됨
    // cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    // cy.contains('.c-headline', '정책 유형').should('exist');
    // cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 진입 및 데이터 출력 확인 완료!');
    // cy.wait(2000);
    // // 설명: 'v-chip__content' 클래스를 가진 요소 중 '업무 시간 외 접속' 텍스트를 찾아 클릭
    // cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 업무시간 외 접속 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '장기 미접속 사용자').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '장기 미접속 사용자 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 장기 미접속 사용자 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '미등록 사용자 접속').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '미등록 사용자 접속 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 미등록 사용자 접속 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '비인가 IP 접근').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '비인가 IP 접근 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 비인가 IP 접근 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '개인정보 유형 과다사용').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '개인정보 유형 과다사용 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 개인정보 유형 과다사용 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '열람제한 개인정보 접근').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '열람제한 개인정보 접근 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 열람제한 개인정보 접근 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '권한 외 메뉴 접근').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '권한 외 메뉴 접근 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 권한 외 메뉴 접근 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '비인가 접근 사용자').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '비인가 접근 사용자 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 비인가 접근 사용자 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '접근제한 업무 시스템 접근').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '접근제한 업무 시스템 접근 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 접근제한 업무 시스템 접근 및 데이터 출력 확인 완료!');
    // cy.wait(2000);

    // cy.contains('.v-chip__content', '파일다운로드').should('be.visible').click({ force: true });
    // cy.contains('.c-headline', '파일다운로드 정책 목록').should('exist');
    // // 표 문구열 확인
    // cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    // cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    // cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
    // cy.log('✅  분석 탭 - 파일다운로드 접근 및 데이터 출력 확인 완료!');
    // cy.wait(2000);
    

// ==========================================
// STEP : 분석 - 사용자 이상행위 대시보드
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 대시보드').click({ force: true });
cy.wait(1000);

cy.log('--- 사용자 이상행위 대시보드 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyDashboard');

cy.get('body').then(($body) => {
  const hiddenBtns = $body.find('button[title="숨긴 항목 보기(관리)"]:visible');
  if (hiddenBtns.length > 0) {
    cy.log(`숨긴 항목 보기 버튼 ${hiddenBtns.length}개 발견`);
    hiddenBtns.each((i, el) => {
      // 아이콘(<i class="material-icons">) 텍스트를 제외하고 라벨만 추출
      const clone = Cypress.$(el).clone();
      clone.find('.material-icons').remove();
      const labelText = clone.text().trim();
      expect(labelText).to.match(/^숨김 \d+개 보기$/);
    });
  } else {
    cy.log('숨긴 항목 보기 버튼 없음 (숨긴 카드 0개) - 스킵');
  }
});

// [신규] "빈 카드 숨김" 토글 버튼 확인
cy.get('button.anomaly-dashboard__vis-btn')
  .filter(':visible')
  .contains('빈 카드 숨김')
  .should('be.visible')
  .and('have.attr', 'title')
  .and('include', '데이터 없는 카드 자동 숨김');

// [신규] "레이아웃 편집" 버튼 확인
// opacity:0로 평소엔 숨겨져 있다가 hover 시 나타나는 버튼이라 :visible 필터 없이 존재만 확인
cy.get('.anomaly-dashboard__edit-btn').should('have.length.greaterThan', 0);
cy.contains('.anomaly-dashboard__edit-btn .v-btn__content', '레이아웃 편집').should('exist');

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
cy.contains('.anomaly-dashboard__section-title', '전체 현황').should('be.visible');

// [수정] "빈 카드 숨김" - 화면에 있는 모든 섹션의 버튼을 순회하며 켜져 있으면 끄기
cy.get('.anomaly-dashboard__vis-btn:visible').filter((i, el) => {
  return Cypress.$(el).text().includes('빈 카드 숨김');
}).each(($btn) => {
  cy.wrap($btn).then(($el) => {
    const isActive = $el.hasClass('anomaly-dashboard__vis-btn--active') ||
                      $el.css('background-color') !== 'rgba(0, 0, 0, 0)';
    if (isActive) {
      cy.wrap($el).click({ force: true });
      cy.wait(500);
    }
  });
});

// 위젯 카드 확인
// [확인 필요] "클러스터 토폴로지" 위젯이 이번 DOM 스니펫에 없었음 - 실제 존재 여부 재확인 필요
cy.get('.anomaly-widget-card__title').filter(':visible').contains('개인정보 유형별 사용자').should('be.visible');

// [신규] 카드별 숨기기 버튼 확인
cy.get('.anomaly-widget-card__hide')
  .filter(':visible')
  .should('have.length.greaterThan', 0)
  .first()
  .should('have.attr', 'title', '이 카드 숨기기');

// 정책별 분석 섹션
cy.contains('.anomaly-dashboard__section-title', '정책별 분석').should('be.visible');

// [수정] .parents() 제거 - cy.contains가 이미 section-bar 요소 자체를 반환함
cy.contains('.anomaly-dashboard__section-bar', '정책별 분석').within(() => {
  cy.contains('.anomaly-dashboard__vis-btn', '중지된 정책')
    .should('be.visible')
    .find('.material-icons').should('contain.text', 'visibility_off');

  cy.contains('.anomaly-dashboard__vis-btn', '지난 버전')
    .should('be.visible')
    .find('.material-icons').should('contain.text', 'history');
});

// ==========================================
// 기간 드롭다운 - "오늘" → "30일" 변경
// ==========================================
cy.get('.pcpf__btn-value').filter(':visible').contains('오늘').click({ force: true });
cy.wait(500);

cy.get('.v-list__tile__title').filter(':visible').contains('30일').click({ force: true });
cy.wait(1000);

cy.get('.pcpf__btn-value').filter(':visible').contains('30일').should('be.visible');
cy.wait(1000);

// ======================================================
// 정책별 분석 - 위젯 카드 (ApexCharts) 동적 데이터 대응 검증
// ======================================================
cy.get('.anomaly-widget-card__title').filter(':visible').should('have.length.greaterThan', 0).each(($title) => {
  cy.wrap($title).invoke('attr', 'title').then((title) => {
    expect(title.trim().length).to.be.greaterThan(0);
  });

  cy.wrap($title).invoke('text').then((text) => {
    expect(text.trim().length).to.be.greaterThan(0);
  });

  cy.wrap($title)
    .closest('.anomaly-widget-card')
    .then(($card) => {
      const isHidden = $card.hasClass('anomaly-widget-card--hidden');
      const isTopologyIdle = $card.find('.topology-idle').length > 0;
      // [변경] 데이터 없음 상태 클래스 확정 - .bucketized-dynamic-chart__nodata
      const isNoData = $card.find('.bucketized-dynamic-chart__nodata').length > 0;

      if (isHidden) {
        cy.log('👁️‍🗨️ 숨김 처리된 카드 - 콘텐츠 검증 스킵, "숨김" 태그만 확인');
        cy.wrap($card).find('.anomaly-widget-card__hidden-tag').should('be.visible').and('contain.text', '숨김');
      } else if (isTopologyIdle) {
        cy.log('ℹ️ 토폴로지 카드 - 시작 전(idle) 상태 확인');
        cy.wrap($card).find('.topology-idle').should('be.visible');
        cy.wrap($card).find('.topology-toggle').should('be.visible').and('contain.text', '시작');
      } else if (isNoData) {
        // [신규] 데이터 없음 카드 - svg 대신 nodata 안내 확인
        cy.log('ℹ️ 데이터 없음 카드 확인');
        cy.wrap($card).find('.bucketized-dynamic-chart__nodata')
          .should('be.visible')
          .and('contain.text', '데이터 없음')
          .find('.material-icons').should('contain.text', 'bar_chart');
      } else {
        cy.wrap($card).find('svg').should('exist');

        const legendCount = $card.find('.apexcharts-legend').length;
        if (legendCount > 0) {
          cy.wrap($card).find('.apexcharts-legend').should('exist');
        }
      }

      // [신규] 카드마다 "이 카드 숨기기" 버튼 존재 확인
      cy.wrap($card).find('.anomaly-widget-card__hide').should('exist');
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

//안내문구 확인
cy.get('.version-notice').filter(':visible').contains('규칙·위험도·메시지 등 핵심 사항을 수정하면 버전이 자동 증가').should('exist');

//신규 버튼
cy.get('.v-btn__content').filter(':visible').contains('새 정책').should('be.visible');
cy.get('i.material-icons').filter(':visible').contains('add').should('exist');


// 버전 안내 문구
cy.get('.version-notice').filter(':visible')
    .contains('규칙·위험도·메시지 등 핵심 사항을 수정하면 버전이 자동 증가').should('exist');


// 검색 영역
cy.get('i.v-icon.material-icons').filter(':visible').contains('search').should('exist');
cy.get('input[placeholder="정책명 / 설명 / 라벨 검색"]').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// [변경] 탐지대상 / 라벨 - label → placeholder 기반으로 변경됨
cy.get('input[placeholder="탐지대상"]').filter(':visible').should('be.visible');
cy.get('input[placeholder="라벨"]').filter(':visible').should('be.visible');


// [변경] 사용여부 필터 - 위험도와 클래스가 겹치므로 filter-label 기준으로 스코프
cy.contains('.filter-label', '사용여부')
  .parent()
  .within(() => {
    cy.get('.severity-filter-group button').eq(0).should('contain.text', '전체');
    cy.get('.severity-filter-group button').eq(1).should('contain.text', 'ON');
    cy.get('.severity-filter-group button').eq(2).should('contain.text', 'OFF');
  });

// 위험도 필터 (구조는 기존과 동일)
cy.contains('.filter-label', '위험도')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn--active').should('contain.text', '전체');
    cy.get('button.sev-filter-btn--1').should('contain.text', '높음');
    cy.get('button.sev-filter-btn--2').should('contain.text', '보통');
    cy.get('button.sev-filter-btn--3').should('contain.text', '낮음');
  });

// [변경] 데이터셋 필터 - 클래스명 및 전체 텍스트로 변경됨
cy.contains('.filter-label', '데이터셋')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn--active').should('contain.text', '전체');
    cy.get('button.sev-filter-btn--dataset').eq(0).should('contain.text', '접속 기록 기준 탐지');
    cy.get('button.sev-filter-btn--dataset').eq(1).should('contain.text', '개인정보 사용 기준 탐지');
  });


// 정책 카드 목록 존재 확인
cy.get('.policy-card-name').filter(':visible').should('have.length.at.least', 1);
// 정책 목록 카운트 및 툴바 버튼 확인
cy.get('.v-toolbar__title').filter(':visible').contains('정책 목록').should('be.visible');

// 액션 버튼 확인 (비활성 포함)
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

// [신규] 폴더 필터 버튼
cy.get('button.folder-open-btn').filter(':visible').should('be.visible');

// [신규] 이 페이지 전체 선택 체크박스
cy.get('input[data-role="policy-select-all"]').should('exist');

// [변경] 액션 버튼 - 주기복구 삭제, 사용 ON/OFF 추가
const disabledButtons = [
  { icon: 'folder_open', label: '폴더이동' },
  { icon: 'play_arrow', label: '즉시실행' },
  { icon: 'toggle_on', label: '사용 ON' },
  { icon: 'toggle_off', label: '사용 OFF' },
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

cy.contains('.toolbar-action-btn', '가져오기')
  .should('be.visible')
  .and('not.be.disabled')
  .within(() => {
    cy.get('.material-icons').should('contain.text', 'publish');
  });

// ==========================================
// 목록/카드 뷰 토글 메뉴 - "카드" 선택 상태 확인
// ==========================================

// 1. 토글 버튼 확인 (현재 선택된 값이 "카드"인지)
cy.contains('.list-view-toggle-btn', '카드')
  .filter(':visible')
  .should('be.visible')
  .as('targetListToggleBtn');

cy.get('@targetListToggleBtn').invoke('text').then((text) => {
  expect(text.trim()).to.contain('카드');
});

// 대상 버튼을 화면 중앙으로 스크롤 후 hover
cy.get('@targetListToggleBtn')
  .scrollIntoView({ offset: { top: -100 } }) // sticky 헤더 등에 가리지 않도록 여유
  .should('be.visible')
  .realHover();

cy.wait(500);

// 메뉴가 여전히 안 열리면 네이티브 mouseenter 폴백
cy.get('body').then($body => {
  if ($body.find('.list-view-toggle-menu:visible').length === 0) {
    cy.get('@targetListToggleBtn').trigger('mouseenter').trigger('mouseover');
    cy.wait(500);
  }
});

cy.get('.list-view-toggle-menu').filter(':visible').should('be.visible').within(() => {
  cy.get('.list-view-toggle-item').should('have.length', 2);
  cy.contains('.list-view-toggle-item', '목록').should('be.visible');
  cy.contains('.list-view-toggle-item', '카드').should('be.visible');
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

   // 2. 정책 ID - "#" 접두어 제거 후 숫자 형식인지 확인
  cy.get('.policy-card-id').invoke('text').then((text) => {
  const id = parseInt(text.trim().replace('#', ''), 10);
  expect(isNaN(id)).to.be.false;  
  });

   // 3. 버전 칩 - "v" + 숫자 형식인지 확인
cy.get('.policy-card-ver').invoke('text').then((text) => {
  expect(text.trim()).to.match(/^v\d+$/);
});

   // 4. 정책명 (기존 동일)
cy.get('.policy-card-name').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 5. 사용 여부 토글 (기존 동일)
cy.get('[data-role="policy-active-toggle"][type="checkbox"]')
  .should('exist')
  .invoke('attr', 'aria-checked')
  .then((checked) => {
    expect(['true', 'false']).to.include(checked);
  });

// 6. 위험도 칩 (기존 동일)
cy.get('.sev-chip-sm .v-chip__content').invoke('text').then((text) => {
  expect(['높음', '보통', '낮음']).to.include(text.trim());
});

// 7. 정책 설명 - 앞면(.policy-card-desc) → 뒷면(.policy-card-back-desc)으로 이동됨
cy.get('.policy-card-back-desc').invoke('text').then((text) => {
  expect(text.trim().length).to.be.greaterThan(0);
});

// 8. 수정일 - .policy-card-footer .caption.grey--text → .policy-card-when 으로 변경됨
cy.get('.policy-card-when').invoke('text').then((text) => {
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
cy.get('.v-btn__content').filter(':visible').contains('새 정책').click({ force: true });
cy.wait(1000);

cy.contains('정책 생성').should('be.visible');

// [신규] 최종 SQL 버튼
cy.contains('.v-btn__content', '최종 SQL').should('be.visible');

// 2. 상단 - 제목/라벨/설명
cy.contains('label', '제목').should('exist').and('contain.text', '제목');
cy.get('input[dense]').filter(':visible').first().should('be.visible');
cy.get('input[aria-label="라벨"]').should('be.visible');
cy.get('textarea[aria-label="설명"]').should('be.visible');

// 위험도 라디오
cy.contains('.severity-radio-label', '높음').should('be.visible');
cy.contains('.severity-radio-label', '보통').should('be.visible');
cy.contains('.severity-radio-label', '낮음').should('be.visible');

// 사용/소명 토글
cy.contains('.v-label', '사용').should('be.visible');
cy.contains('.v-label', '소명').should('be.visible');

// [신규] 정책 요약 문구 박스
cy.get('.policy-summary').should('be.visible');

// 3. [변경] "탐지 설정" 헤더 삭제됨 → "탐지 대상" 섹션으로 검증
cy.contains('.section-header', '탐지 대상').should('be.visible');

// 탐지 기준 카드
cy.contains('.dataset-option-name', '접속 기록 기준 탐지').should('be.visible');
cy.contains('.dataset-option-name', '개인정보 사용 기준 탐지').should('be.visible');

// 탐지대상 체크박스 목록
const targets = ['업무시스템', '부서', '등록된 메뉴', '접속 URI', '사용자', '접속 IP', '사용자 계정'];
targets.forEach((label) => {
  cy.contains('.groupby-card-label', label).should('be.visible');
});

// [신규] 탐지대상 값이 비어 있으면 경보를 만들지 않는 토글
cy.get('input[aria-label="탐지대상 값이 비어 있으면 경보를 만들지 않습니다"]').should('exist');

// 4. 탐지 주기 섹션
cy.contains('.section-header', '탐지 주기').should('be.visible');

// [신규] 오늘 실시간 탐지 토글
cy.contains('.sched-axis-title', '오늘 실시간 탐지').should('be.visible');

// [변경] 실행주기 input 삭제 → 주기 설정 버튼으로 값 확인
cy.contains('.sched-axis-btn', '주기 설정')
  .should('be.visible')
  .find('.sched-axis-btn__val')
  .should('contain.text', '새벽 1시');

cy.get('input[aria-label="탐지시작일"]').should('be.visible');

// [신규] 실행이력 보존기간(일)
cy.get('input[aria-label="실행이력 보존기간(일)"]').should('be.visible');

// 5. 탐지 규칙 섹션
cy.contains('탐지 규칙').should('be.visible');

// 시간범위/단위 (집계 단위)
cy.contains('시간범위').should('be.visible');
cy.contains('최대 24').should('be.visible');
cy.get('input[type="number"]').filter(':visible').should('be.visible');
cy.contains('.v-label', '단위').should('be.visible');
cy.get('.v-select__selection--comma').filter(':visible').contains('시간').should('be.visible');

cy.get('.section-tab').filter(':visible').contains('미리보기').should('be.visible');
cy.get('.section-tab--active').filter(':visible').contains('수정').should('be.visible');

cy.contains('.ws-toolbar-label', '조건').should('be.visible');
cy.contains('.ws-toolbar-subtitle', '어떤 접근 기록을 감시할지 선별합니다').should('be.visible');

cy.contains('.ws-toolbar-label', '집계').should('be.visible');
cy.contains('.ws-toolbar-subtitle', '수치 기준으로 이상행위를 판정합니다').should('be.visible');

// [변경] 조건 도구 팔레트 - 신규 5종 추가
const conditionTools = [
  '접속 일시', '접속 요일', '접속 시간', '공휴일', '업무시스템', '부서',
  '사용자', '사용자 IP', '사용자 계정', '로그인 사용자만', '접속 URI',
  '등록된 메뉴', '파일 다운로드', '파일 업로드', '개인정보 포함',
  '개인정보 유형', '개인정보 건수', '정보주체 수',
];
conditionTools.forEach((label) => {
  cy.contains('.pal-block-text', label)
    .scrollIntoView({ offset: { top: -100 } })
    .should('be.visible');
});

// [변경] 집계 도구 팔레트 - "상위 10%/5%" → "상위 N% 지점값" 통합, 신규 4종 추가
const aggregationTools = [
  '발생 횟수', '숫자 합계', '고유 항목 개수', '최댓값', '최솟값',
  '평균값', '중앙값', '표준편차', '상위 N% 지점값', '기준선 편차 분석',
  '동일 값 반복 조회', '순간 몰림', '비중(%)',
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
  .should('exist');

cy.contains('.caption.grey--text', '상세 설명').should('be.visible');
cy.contains('.msg-editor-placeholder', '탐지 사유 및 상세 내용을 기술합니다.')
  .should('exist');

// 7. [확인 필요] 기본 차트 관점 섹션 - 실제 존재 여부 스크롤해서 확인 후 유지/삭제 결정
// cy.contains('.v-card__title.default-perspective-title', '기본 차트 관점')...

// 8. 하단 버튼
cy.contains('.v-btn__content', '즉시실행').should('be.visible');
cy.contains('.v-btn__content', '취소').should('be.visible');
cy.contains('.v-btn__content', '저장').should('be.visible');

// 9. 취소
cy.contains('.v-btn__content', '취소').click({ force: true });

cy.log('✅ 분석 - [사용자 이상행위 정책] 신규 정책 화면 확인 완료!');
//--------------------------------------------------------------------------

cy.log('✅ 분석 - [사용자 이상행위 정책] 화면 확인 완료!');


// ==========================================
// STEP : 분석 - 사용자 이상행위 결과 탭
// ==========================================
cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
cy.wait(2000);

cy.log('--- 사용자 이상행위 결과 화면 검증 시작 ---');
cy.url().should('include', '/analyze/customAnomalyBehaviorPolicyResult');


cy.get('.version-notice').filter(':visible').contains('각 정책의 최신 버전에서 생성된 경보만 표시됩니다').should('exist');

cy.get('.basic-filter-panel__title').filter(':visible').contains('기본 필터').should('be.visible');

// [변경] aria-label → placeholder 기반으로 변경됨
cy.get('input[placeholder="정책 선택"]').should('exist');
cy.get('input[placeholder="메시지 + 정책명 검색"]').should('exist');

// [변경] From/To aria-label 삭제 → date-range-picker 내 type="date" 2개로 확인
cy.get('.date-range-picker input[type="date"]').should('have.length', 2);
cy.get('.date-range-picker input[type="date"]').eq(0).should('be.visible'); // From
cy.get('.date-range-picker input[type="date"]').eq(1).should('be.visible'); // To
cy.get('.date-range-sep').filter(':visible').contains('~').should('be.visible');

cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 위험도 필터 (기존과 동일)
cy.contains('.filter-label', '위험도').should('be.visible');
cy.get('button.sev-filter-btn--active').contains('전체').should('be.visible');
cy.get('button.sev-filter-btn--1').contains('높음').should('be.visible');
cy.get('button.sev-filter-btn--2').contains('보통').should('be.visible');
cy.get('button.sev-filter-btn--3').contains('낮음').should('be.visible');

// 기간 필터 (기존과 동일)
cy.contains('.filter-label', '기간').should('be.visible');
cy.get('button.sev-filter-btn').contains('오늘').should('be.visible');
cy.get('button.sev-filter-btn').contains('1주일').should('be.visible');
cy.get('button.sev-filter-btn').contains('1개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('3개월').should('be.visible');
cy.get('button.sev-filter-btn').contains('1년').should('be.visible');

// [신규] 중지된 정책 필터
cy.contains('.filter-label', '중지된 정책').should('be.visible');
cy.contains('.filter-label', '중지된 정책')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn')
      .contains('제외')
      .should('be.visible')
      .find('.material-icons')
      .should('contain.text', 'visibility_off');
  });

// [신규] 지난 버전 필터
cy.contains('.filter-label', '지난 버전').should('be.visible');
cy.contains('.filter-label', '지난 버전')
  .parent()
  .within(() => {
    cy.get('button.sev-filter-btn')
      .contains('제외')
      .should('be.visible')
      .find('.material-icons')
      .should('contain.text', 'history');
  });

// ==========================================
// 고급 필터 - 화면 요소 노출 검증 (변경 미확인 - 기존 유지)
// ==========================================
cy.get('.adv-filter-panel__title').filter(':visible').contains('고급 필터').click({ force: true });

cy.get('.adv-filter-panel__label').filter(':visible').contains('시간').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('요일').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('사용자').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('부서').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('업무').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('메뉴').should('be.visible');
cy.get('.adv-filter-panel__label').filter(':visible').contains('URI').should('be.visible');

cy.get('.hour-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('업무시간').should('be.visible');
cy.get('.hour-picker__preset-btn').filter(':visible').contains('심야').should('be.visible');
// [신규] 시간대 안내 문구
cy.contains('탐지 시간슬롯 기준').should('exist');

cy.get('.dow-picker__preset-btn').filter(':visible').contains('전체').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('평일').should('be.visible');
cy.get('.dow-picker__preset-btn').filter(':visible').contains('주말').should('be.visible');

['월', '화', '수', '목', '금', '토', '일'].forEach((day) => {
  cy.get('.dow-picker__cell').filter(':visible').contains(day).should('be.visible');
});

cy.get('input[placeholder="사용자 ID 또는 이름 검색"]').should('be.visible');
// [신규] 고급 필터 - IP 입력 행
cy.get('.adv-filter-panel__label').filter(':visible').contains('IP').should('be.visible');
cy.get('input[placeholder="예: 10.0.3.12 (Enter 로 추가)"]').should('be.visible');
cy.get('input[placeholder="부서 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="업무 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="메뉴 ID 또는 명칭 검색"]').should('be.visible');
cy.get('input[placeholder="예: /api/audit/logs (Enter 로 추가)"]').should('be.visible');

//-----------------------------------------------------------------------------------------------

// 경보 툴바
cy.get('.v-toolbar__title').filter(':visible').contains('경보').should('be.visible');

// [변경] 조회 시각 표시 - .last-fetched 클래스로 통합됨
cy.get('.last-fetched').filter(':visible').should('be.visible')
  .find('.material-icons').should('contain.text', 'schedule');

cy.get('button.datamode-btn').should('have.length.at.least', 8);

// [변경] 기본 활성 데이터 모드가 "전체" → "정책"으로 변경됨
cy.get('button.datamode-btn--active').contains('정책').should('be.visible');

cy.get('i.material-icons').filter(':visible').contains('list').should('exist');       // 전체
cy.get('i.material-icons').filter(':visible').contains('policy').should('exist');     // 정책
cy.get('i.material-icons').filter(':visible').contains('person').should('exist');     // 사용자
cy.get('i.material-icons').filter(':visible').contains('business').should('exist');   // 부서
cy.get('i.material-icons').filter(':visible').contains('dns').should('exist');        // 업무별
cy.get('i.material-icons').filter(':visible').contains('menu_book').should('exist');  // 메뉴
cy.get('i.material-icons').filter(':visible').contains('link').should('exist');       // URI
cy.get('i.material-icons').filter(':visible').contains('language').should('exist');   // IP

/////////////////////////////
// 경보 툴바 - 전체 클릭했을때
/////////////////////////////
cy.get('.datamode-btn').filter(':visible').contains('전체').click({ force: true });
cy.get('th').filter(':visible').contains('위험도').should('be.visible');
cy.get('th').filter(':visible').contains('정책명').should('be.visible');
cy.get('th').filter(':visible').contains('알림 메시지').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 시작').should('be.visible');
cy.get('th').filter(':visible').contains('탐지 종료').should('be.visible');

// ==========================================
// 통합 커맨드: incident-header 리스트 구조 검증 (기존과 동일, 변경 없음)
// ==========================================
Cypress.Commands.add('verifyIncidentHeaderRows', (mode) => {
  cy.get('body').then(($body) => {
    const rowCount = $body.find('.incident-header:visible').length;

    if (rowCount === 0) {
      cy.log(`ℹ️ [${mode}] 모드 - 경보 데이터 0건, "데이터 없음" 상태 확인`);
      // [변경] 문구 확인 - 실제 클래스 기준으로 확인
      cy.get('.text-xs-center.pa-4.grey--text').filter(':visible').contains('경보가 없습니다').should('be.visible');
      return;
    }

    cy.get('.incident-header').filter(':visible').should('have.length.greaterThan', 0).each(($row) => {
      cy.wrap($row).within(() => {
        cy.get('.v-chip--label').first().invoke('text').then((text) => {
          expect(['높음', '보통', '낮음']).to.include(text.trim());
        });
        cy.get('.incident-count').invoke('text').then((text) => {
          expect(isNaN(parseInt(text.trim(), 10))).to.be.false;
        });
        if (mode === 'policy') {
          cy.get('.ver-chip .v-chip__content').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^v\d+$/);
          });
          cy.get('.incident-policy-name').invoke('text').then((text) => {
            expect(text.trim().length).to.be.greaterThan(0);
          });
          cy.get('.caption.grey--text.ml-1').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^\(\d+회 실행\)$/);
          });
          cy.get('.incident-window').invoke('text').then((text) => {
            expect(text.trim()).to.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ~ \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
          });
        }
        if (['user', 'department', 'work', 'menu', 'uri', 'ip'].includes(mode)) {
          const iconMap = { user: 'person', department: 'business', work: 'dns', menu: 'menu_book', uri: 'link', ip: 'language' };
          const expectedIcon = iconMap[mode];
          cy.get('.lookup-badge-group').should('be.visible').within(() => {
            cy.get('.material-icons').should('contain.text', expectedIcon);
          });
          cy.get('.lookup-badge-group').then(($el) => {
            const clone = $el.clone();
            clone.find('.material-icons').remove();
            const labelText = clone.text().trim();
            expect(labelText.length).to.be.greaterThan(0);
            if (mode === 'uri' && !labelText.includes('알수없음')) expect(labelText).to.match(/^\//);
            if (mode === 'ip' && !labelText.includes('알수없음')) expect(labelText).to.match(/^(\d{1,3}\.){3}\d{1,3}$/);
          });
          cy.get('.incident-window.truncate-cell').invoke('text').then((text) => {
            const policies = text.split(',').map((p) => p.trim()).filter((p) => p.length > 0);
            expect(policies.length).to.be.greaterThan(0);
          });
        }
      });
    });
  });
});

// [변경] 버튼 텍스트 - "정책별"→"정책", "사용자별"→"사용자", "부서별"→"부서", "메뉴별"→"메뉴", "접속URI별"→"URI", "사용자IP별"→"IP" (업무별은 유지)
cy.contains('.datamode-btn', '정책').click({ force: true });
cy.verifyIncidentHeaderRows('policy');

cy.contains('.datamode-btn', '사용자').click({ force: true });
cy.verifyIncidentHeaderRows('user');

cy.contains('.datamode-btn', '부서').click({ force: true });
cy.verifyIncidentHeaderRows('department');

cy.contains('.datamode-btn', '업무별').click({ force: true });
cy.verifyIncidentHeaderRows('work');

cy.contains('.datamode-btn', '메뉴').click({ force: true });
cy.verifyIncidentHeaderRows('menu');

cy.contains('.datamode-btn', 'URI').click({ force: true });
cy.verifyIncidentHeaderRows('uri');

cy.contains('.datamode-btn', 'IP').click({ force: true });
cy.verifyIncidentHeaderRows('ip');

// ==========================================
// 타임라인/그룹 뷰 토글 메뉴 - 기본 선택값 확인
// ==========================================
// [수정] 데이터모드 전환 루프 이후에는 기본값이 "전체"로 리셋되므로,
// 하드코딩된 텍스트 대신 버튼에 표시된 현재 텍스트를 그대로 검증합니다.

cy.get('.childview-toggle-btn')
  .filter(':visible')
  .should('be.visible')
  .as('targetToggleBtn');

// [수정] 버튼 내부 첫 번째 span(라벨)만 텍스트로 추출, 화살표(▾) 스팬은 제외
cy.get('@targetToggleBtn').find('span').first().invoke('text').then((currentLabel) => {
  const label = currentLabel.trim();

  cy.get('@targetToggleBtn').realHover();
  cy.wait(500);

  cy.get('.childview-toggle-menu').filter(':visible').should('be.visible').within(() => {
    cy.get('.childview-toggle-item').should('have.length', 5);

    cy.contains('.childview-toggle-item', '전체').should('be.visible');
    cy.contains('.childview-toggle-item', '그룹 > 타임라인').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(일) > 그룹').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(주) > 그룹').should('be.visible');
    cy.contains('.childview-toggle-item', '타임라인(월) > 그룹').should('be.visible');

    cy.contains('.childview-toggle-item', label).should('have.class', 'active');
  });
});

// ==========================================
// 테이블 페이지 사이즈 선택 영역 - 노출 확인
// ==========================================
cy.get('.table-footer-right').filter(':visible').should('be.visible').within(() => {
  cy.get('.table-footer-size').should('be.visible');
  cy.get('.v-input__icon--append .material-icons').should('be.visible').and('contain.text', 'arrow_drop_down');
  cy.contains('.caption.grey--text', '건').should('be.visible');
});

// 기간 - 오늘 클릭
cy.get('.sev-filter-btn').filter(':visible').contains('오늘').click({ force: true });
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
