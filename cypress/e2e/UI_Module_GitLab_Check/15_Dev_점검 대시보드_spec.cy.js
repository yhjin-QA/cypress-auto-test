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

  
  it('DEV_Release 로그캐치 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.71:18443/logcatch/login');
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
// STEP 12: 점검(대시보드) 서브메뉴
// ==========================================
cy.log('🚀 점검 탭 클릭');
cy.contains('button', '점검').click({ force: true });
cy.wait(2000);
cy.log('--- 화면 검증 시작 ---');

// 검색 조건 헤더 + 검색 버튼 (숨겨진 중복 요소 방지 → :visible)
cy.get('.c-headline').filter(':visible').contains('검색 조건').should('be.visible');
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 기간 입력칸: 달력 아이콘(event)이 있는 v-input만 수집
// ※ 2.9.5.0부터 aria-label="기간" 이 빈 값으로 바뀌어 아이콘 기준으로 찾음
// 기간 입력칸: 달력 아이콘(event)이 있는 v-input만 수집
const dateInputs = () =>
  cy.get('.v-input__icon--prepend-inner i.material-icons')
    .filter(':visible')
    .filter((i, el) => el.innerText.trim() === 'event')
    .closest('.v-input');

// 기간 범위 1칸 확인 (예: 점검 대시보드 - '2026-10-21 - 2026-10-28')
const checkDateRange = () => {
  dateInputs().should('have.length', 1);
  dateInputs().find('i.material-icons').should('be.visible').and('contain', 'event');

  // placeholder 끝에 공백이 있음('날짜 선택 ') → 공백 무시하고 비교
  dateInputs().find('input[readonly]')
    .should('have.attr', 'placeholder')
    .and('match', /^날짜 선택\s*$/);

  // 기본값 형식: YYYY-MM-DD - YYYY-MM-DD
  dateInputs().find('input[readonly]').invoke('val')
    .should('match', /^\d{4}-\d{2}-\d{2} - \d{4}-\d{2}-\d{2}$/);
};

checkDateRange();


// 업무시스템 콤보박스
cy.get('input[aria-label="업무시스템"]')
  .filter(':visible')
  .should('be.visible')
  .and('have.attr', 'role', 'combobox');

// 자동 갱신 문구 + 슬라이더 (기본값 0 = 갱신 안함, 최대 30)
cy.get('.c-interval-progress-bar').filter(':visible').within(() => {
  cy.get('.c-interval-icon').should('contain.text', 'autorenew');
  cy.contains('.c-interval-label span', '자동 갱신 안함').should('be.visible');
  cy.get('input[role="slider"]')
    .should('have.attr', 'aria-valuenow', '0')
    .and('have.attr', 'aria-valuemin', '0')
    .and('have.attr', 'aria-valuemax', '30');
  cy.get('.v-slider').should('be.visible');
});

// ------------------------------------------
// 요약 위젯 (상단 작은 카드 6개)
// ------------------------------------------
// 이상행위 발생 건수 KPI 카드
cy.contains('.kpi-card-caption', '이상행위 발생 건수').should('be.visible')
  .closest('.box-basic-chart-container').within(() => {
    cy.get('.kpi-icon-wrapper .fa-bell').should('exist');
    cy.get('.kpi-card-value b').invoke('text').should('match', /^\d+$/);
    cy.get('.kpi-card-unit').should('have.text', '건');
  });

// ------------------------------------------
// 차트 카드 제목 (6종)
// ------------------------------------------
const cardTitles = [
  '개인정보 유형별 현황',
  '부서별 개인정보 사용 TOP 10',
  'IP주소별 개인정보 사용 TOP 10',
  '업무시스템별 개인정보 사용 현황',
  '개인정보 사용자 TOP 10',
  '이상행위 유형별 현황',
];
cardTitles.forEach((title) => {
  cy.contains('.v-card__title', title)
    .should('be.visible')
    .and('have.attr', 'title', title);
});

// ------------------------------------------
// 위젯 본문 상태 검증 (환경별 데이터 차이 대응)
// - 통계 테이블 미생성: 경고 아이콘 + '아직 통계 테이블이 생성되지 않았습니다.'
// - 생성됨: ApexCharts 차트 (데이터 없으면 '조회 결과가 존재하지 않습니다')
// - KPI 카드: 건수 표시
// ------------------------------------------
cy.get('#customDashboard .eslee-widget-card').filter(':visible').each(($card) => {
  // 검색 조건 위젯(INDEX 1)은 건너뜀
  if ($card.find('.c-daterange-period-field').length) return;

  const name = $card.find('.v-card__title').text().trim()
    || $card.find('.kpi-card-caption').text().trim()
    || '(제목 없는 요약 카드)';

  const notCreated = $card.find('p:contains("아직 통계 테이블이 생성되지 않았습니다")').length > 0;
  const hasChart = $card.find('svg.apexcharts-svg').length > 0;
  const isKpi = $card.find('.kpi-card-value').length > 0;

  if (notCreated) {
    cy.log(`⚠️ [${name}] 통계 테이블 미생성`);
    expect($card.find('.fa-exclamation-triangle').length, `[${name}] 경고 아이콘`).to.eq(1);
  } else if (hasChart) {
    cy.log(`📊 [${name}] 차트`);
  } else if (isKpi) {
    cy.log(`🔔 [${name}] KPI`);
  } else {
    throw new Error(`[${name}] 위젯 본문이 비어 있음 (미생성 안내 / 차트 / KPI 모두 아님)`);
  }
});

// 이상행위 유형별 현황 - 차트가 그려졌는지 + 데이터 없을 때 안내 문구
cy.contains('.v-card__title', '이상행위 유형별 현황')
  .parents('.widget_content')
  .within(() => {
    cy.get('#apex-chart svg.apexcharts-svg').should('exist');
    cy.get('svg').then(($svg) => {
      // 데이터가 있으면 문구가 없으므로 조건부 확인
      if ($svg.text().includes('조회 결과가 존재하지 않습니다')) {
        cy.log('ℹ️ [이상행위 유형별 현황] 조회 결과 없음');
      }
    });
  });

cy.log('✅ 점검 대시보드 출력 및 차트 타이틀 확인 완료');



    
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
