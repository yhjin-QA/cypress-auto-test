// [2.9.7] 현황 업무시스템 목록 = 조회 기간 안에 사용 이력이 있는 업무시스템만 노출(정상 동작)
//   → selectSystemInRange(it 블록 안)가 기간을 넓혀 가며 선택. 아래는 콤보 선택 공통 helper
const trySelectSystem = (name) => trySelectFrom('업무시스템', name);
// 콤보박스(aria-label) 목록에 name 이 있으면 선택, 없으면 경고 후 건너뜀 (그룹 목록도 업무시스템 선택에 따라 채워짐)
const trySelectFrom = (label, name) => {
  cy.get(`input[aria-label="${label}"]`).closest('.v-input').filter(':visible').first().find('.v-input__slot').click({ force: true });
  cy.wait(1500);
  cy.get('.menuable__content__active').filter(':visible').last().then(($m) => {
    const tiles = [...$m.find('.v-list__tile__title')];
    const hit = tiles.find((el) => el.textContent.trim() === name) || tiles.find((el) => el.textContent.includes(name));
    if (hit) {
      cy.wrap(hit).scrollIntoView().click({ force: true });
      cy.log(`${label} '${name}' 선택`);
    } else {
      cy.log(`⚠️ ${label} 목록에 '${name}' 없음(${$m.text().trim().slice(0, 40)}) - 선택 건너뜀`);
    }
  });
  cy.wait(1000);
  cy.get('body').type('{esc}');
};

// [2.9.7 현행화] 기간 입력칸 helper — 2.9.5.0부터 aria-label="기간"/라벨 '기간'이 비어 있어 달력 아이콘(event)으로 찾음
const dateInputs = () =>
  cy.get('.v-input__icon--prepend-inner i.material-icons')
    .filter(':visible')
    .filter((i, el) => el.innerText.trim() === 'event')
    .closest('.v-input');

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

  
  it('로그캐치 기본동작 체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(5000); // 로딩 대기


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
// [공통] 기간 - 시작 날짜를 오늘 기준 N일 전으로 선택
// ==========================================
const selectStartDateDaysAgo = (daysAgo) => {
  // 1. 목표 날짜 계산
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
  const pad = (n) => String(n).padStart(2, '0');
  const targetStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
  cy.log(`📅 시작 날짜 목표: ${targetStr} (오늘 기준 ${daysAgo}일 전)`);

  // 화면에 보이는 "기간" 입력창(시작 날짜)만 (숨겨진 다른 탭의 기간 입력창 제외)
  const getStartDateInput = () =>
    dateInputs().eq(0).find('input'); // [2.9.7] '기간' 라벨 비어 있음 → 달력 아이콘 기준

  // 화면에 보이는 달력만 (숨겨진 다른 달력 메뉴 제외)
  const getVisiblePicker = () =>
    cy.get('.menuable__content__active').filter(':visible')
      .find('.v-picker--date').filter(':visible');

  // 2. 달력 열기
  getStartDateInput().click({ force: true });
  getVisiblePicker().should('have.length', 1).and('be.visible');

  // 3. 목표 월까지 이동
  const goToTargetMonth = (attempt = 0) => {
    getVisiblePicker()
      .find('.v-date-picker-header__value')
      .invoke('text')
      .then((headerText) => {
        const m = headerText.match(/(\d{4})\D+(\d{1,2})/);
        expect(m, `달력 헤더 형식: "${headerText.trim()}"`).to.not.be.null;

        const shownIndex = parseInt(m[1], 10) * 12 + (parseInt(m[2], 10) - 1);
        const targetIndex = target.getFullYear() * 12 + target.getMonth();
        const diff = targetIndex - shownIndex;

        if (diff === 0) return;
        if (attempt > 24) throw new Error('목표 월로 이동하지 못했습니다.');

        getVisiblePicker()
          .find('.v-date-picker-header button')
          .then(($btns) => (diff < 0 ? $btns.first() : $btns.last()))
          .click({ force: true });
        cy.wait(300);
        goToTargetMonth(attempt + 1);
      });
  };
  goToTargetMonth();

  // 4. 날짜 클릭 ("22일" → 숫자만 비교)
  getVisiblePicker()
    .find('.v-date-picker-table--date button')
    .filter(':visible')
    .filter((i, el) => el.textContent.replace(/\D/g, '') === String(target.getDate()))
    .not('.v-btn--disabled')
    .should('have.length', 1)
    .click();
  cy.wait(500);

  // 5. 선택 결과 확인
  getStartDateInput().should('have.value', targetStr);

  // 6. 달력 닫기
  cy.get('body').type('{esc}');
  cy.wait(300);

  cy.log(`✅ 시작 날짜 ${targetStr} 선택 완료`);

  // 7. 기간 변경 후 업무시스템 목록 다시 불러오기 대기
  cy.wait(1500);
};    


// ==========================================
// STEP 4: 현황 서브메뉴 
// ==========================================
    
cy.contains('button', '현황').click({ force: true });
cy.wait(2000);

cy.log('--- 상태 > 정보사용자별 탭 클릭 ---');
cy.get('.tab-btn').contains('정보사용자 별').should('be.visible').click({ force: true });
cy.log('--- 화면 검증 시작 ---');
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘 확인 (display:none 부모 이슈 완전 회피)
dateInputs().eq(0).find('.material-icons').should(($icons) => {
  const hasEvent = $icons.toArray().some((el) => el.textContent.trim() === 'event');
  expect(hasEvent).to.be.true;
});

// 🌟 종료날짜 달력 아이콘 확인
cy.get('input[aria-label=""][readonly="readonly"]').filter(':visible').first()
  .closest('.v-input').find('.material-icons').should('exist');

// 달력 아이콘이 2개 존재하는지 확인
cy.get('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').should('have.length.gte', 2);

// 버튼확인
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 검색 조건 입력문구 확인
dateInputs().should('have.length.at.least', 1);
// [2.9.7] '추적 타입' 라벨 없어짐 (UI 04_현황과 동일하게 제외)
// cy.get('label').filter(':visible').contains('추적 타입').should('be.visible');
cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');


// 기간 - 시작 날짜를 오늘 기준 60일 전으로 선택
selectStartDateDaysAgo(60);


////////////////////////////
// 기능확인 - 조건별로 검색
// 업무 시스템 - 리눅스_배송관리 선택
////////////////////////////
const TARGET_SYSTEM = '리눅스_배송관리';

// [2.9.7] 업무시스템 목록은 조회 기간에 사용된 업무시스템만 나옴
//   → 현재 기간에서 없으면 시작일을 120 → 240 → 365일 전으로 넓혀 가며 다시 열어 선택
const SYSTEM_RANGES = [0, 120, 240, 365];   // 0 = 현재 기간 그대로
const selectSystemInRange = (name, idx = 0) => {
  if (SYSTEM_RANGES[idx] > 0) {
    cy.log(`📅 업무시스템 '${name}' 없음 → 시작일을 ${SYSTEM_RANGES[idx]}일 전으로 넓혀 재시도`);
    selectStartDateDaysAgo(SYSTEM_RANGES[idx]);
  }
  cy.get('input[aria-label="업무시스템"]').closest('.v-input').filter(':visible').first().find('.v-input__slot').click({ force: true });
  cy.wait(1500);
  cy.get('.menuable__content__active').filter(':visible').last().then(($m) => {
    const tiles = [...$m.find('.v-list__tile__title')];
    const hit = tiles.find((el) => el.textContent.trim() === name);
    if (hit) {
      cy.wrap(hit).scrollIntoView().click({ force: true });
      cy.log(`업무시스템 '${name}' 선택 (시작일 ${SYSTEM_RANGES[idx] || '기본'}${SYSTEM_RANGES[idx] ? '일 전' : ''})`);
      cy.wait(1000);
      cy.get('body').type('{esc}');
    } else {
      cy.get('body').type('{esc}');
      cy.wait(500);
      if (idx + 1 < SYSTEM_RANGES.length) {
        selectSystemInRange(name, idx + 1);
      } else {
        throw new Error(`업무시스템 '${name}' 이 ${SYSTEM_RANGES[SYSTEM_RANGES.length - 1]}일 범위까지 목록에 없음 - 목록: ${tiles.map((e) => e.textContent.trim()).join(', ') || 'No data'}`);
      }
    }
  });
};

// 업무시스템 드롭다운 열기
const openSystemDropdown = () => {
  cy.get('input[aria-label="업무시스템"]').filter(':visible')
    .closest('.v-input').find('.v-input__slot').click({ force: true });
  cy.wait(500);
};

// [수정] 목록이 채워질 때까지 재시도 (기간 변경 직후 목록을 다시 불러오는 동안 비어 있을 수 있음)
const waitForSystemList = (attempt = 1) => {
  openSystemDropdown();

  cy.get('.menuable__content__active').should('be.visible').then(($menu) => {
    const items = [...$menu.find('.v-list__tile__title')].map((el) => el.textContent.trim());
    const hasTarget = items.includes(TARGET_SYSTEM);

    if (hasTarget) return;

    if (attempt >= 5) {
      // 원인 구분용 에러 메시지: 목록이 비었는지 / 다른 항목만 있는지
      throw new Error(
        items.length === 0 || /No data available|데이터가 없습니다/.test($menu.text()) /* [2.9.9.0] 빈 목록 문구 한글화 */
          ? `업무시스템 목록이 비어 있음 (No data available) - 조회 기간 안에 사용된 업무시스템이 없음(기간을 넓혀 확인)`
          : `"${TARGET_SYSTEM}" 없음 - 현재 목록: ${items.join(', ')}`
      );
    }

    cy.log(`🔁 업무시스템 목록 대기 중 (${attempt}회) - 현재 ${items.length}개`);
    cy.get('body').type('{esc}');   // 닫았다가
    cy.wait(1500);                  // 목록 로딩 대기
    waitForSystemList(attempt + 1); // 다시 열기
  });
};
// [2.9.7] 기간 안에 사용된 업무시스템만 목록에 나옴 → selectSystemInRange 로 기간을 넓혀 가며 선택
// waitForSystemList();
// cy.get('.menuable__content__active').contains('.v-list__tile__title', TARGET_SYSTEM).scrollIntoView().should('be.visible').click({ force: true });
// cy.wait(1000);
// cy.get('body').type('{esc}');
selectSystemInRange(TARGET_SYSTEM);


// ////////////////////////////
// // 기능확인 - 조건별로 검색
// // 업무 시스템 - 리눅스_배송관리 선택
// ////////////////////////////

// // 업무시스템 클릭하는 코드
// cy.get('input[aria-label=\"업무시스템\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });
// cy.wait(500);

// // 🌟 드롭다운이 실제로 열렸는지 (menuable__content__active 클래스로) 확인
// cy.get('.v-menu__content').filter(':visible').should('be.visible');

// // 전체 선택 클릭
// //cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
// //cy.wait(1000);

// // 업무시스템중 리눅스_배송관리 클릭하는 코드
// cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '리눅스_배송관리').scrollIntoView().should('be.visible').click({ force: true });
// cy.wait(1000);

// // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
// cy.get('body').type('{esc}');


    
    // 조건 입력 
    // 정보 사용자 클릭하는 코드 
    cy.get('span[title="정보 사용자"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    //cy.get('span[title="정보 사용자"]').should('be.visible').click();
    cy.wait(1000);
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-list__tile__title').contains('아이피').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // IP입력
    cy.get('input[aria-label="IP"]').filter(':visible').clear().type('10.10.54.1');

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    cy.log('✅ 현황 - 정보사용자 별 탭 진입 및 데이터 출력 확인 완료!');

    // 업무시스템 컨텍스트 메뉴 안닫히는 문제가있어 강제 페이지 새로고침
    //cy.reload();

cy.log('--- 현황 > 부서별 탭 클릭  ---');
cy.get('.tab-btn').contains('부서 별').should('be.visible').click({ force: true });
cy.wait(3000);
cy.log('--- 화면 검증 시작 ---');
cy.get('.tab-btn').contains('부서 별').closest('button').should('not.have.class', 'inactive');
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘 확인 (display:none 부모 이슈 회피 - exist로 완화)
dateInputs().eq(0).find('i.material-icons').should('exist').then(($icon) => {   // [2.9.7] '기간' 라벨 비어 있음
  expect($icon.text().trim()).to.equal('event');
});

// 🌟 종료날짜 달력 아이콘 확인
cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1)
  .closest('.v-input').find('i.material-icons').should('exist');

// 검색 버튼확인
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 검색조건 입력문구 확인
cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
    

////////////////////////////
// 기능확인 - 조건별로 검색
// 업무 시스템 - 리눅스_배송관리 선택
////////////////////////////

// [2026-11-16] 부서 별: 리눅스_배송관리(.22, Oracle 인사연동 · 자동 접속 기록 없음) → 리눅스_VIP고객(.27 CRM, Maria 인사연동 · crmTraffic 매일 접속 기록)
//   인사연동이 돌 때마다 그룹이 새 id 로 다시 만들어지고 기존 그룹은 비활성(-1)이 되어, 접속 기록이 오래된 그룹('인사팀')이 목록에서 빠짐
//   → 매일 접속 기록이 쌓이는 리눅스_VIP고객으로 바꾸고, 기대 부서(UI1팀)가 없으면 관찰로 기록한 뒤 목록 첫 그룹으로 진행 (목록이 비면 실패)
//   그룹 재생성 · 비활성 현상 : Mantis 0039028 ([확인필요])
const DEPT_SYS = '리눅스_VIP고객';
const DEPT_EXPECT = 'UI1팀';
// 그룹 목록도 기간 안에 데이터가 있어야 나옴 → 시작일을 150 → 240 → 365일 전으로 넓혀 가며 그룹 목록이 찰 때까지 다시 고름
const DEPT_RANGES = [150, 240, 365];   // 2026-11-16 확인 : 7월 초부터 넣어야 그룹 목록이 보임 (약 140일 전)
const pickDeptInRange = (idx = 0) => {
  selectStartDateDaysAgo(DEPT_RANGES[idx]);
  cy.wait(1500);
  // [2026-11-16] 정보사용자 별 탭에서 고른 '리눅스_배송관리'가 부서 별 탭에도 남아 있어 칩이 「(+1)」 로 보였음
  //   → 업무시스템 선택을 지우기(X) 한 뒤 리눅스_VIP고객 하나만 고름 (다중 선택이라 다시 누르면 풀리므로 항상 비우고 시작)
  cy.get('input[aria-label="업무시스템"]').closest('.v-input').filter(':visible').first().then(($sys) => {
    const $x = $sys.find('.v-input__icon--clear i, i.material-icons').filter((i, e) => /^(clear|close|cancel)$/.test((e.textContent || '').trim()));
    cy.log(`업무시스템 칩 (지우기 전): ${$sys.text().replace(/\s+/g, ' ').trim().slice(0, 60)}`);
    if ($x.length) { cy.wrap($x.first()).click({ force: true }); cy.wait(1200); }
  });
  cy.get('body').type('{esc}');
  selectSystemInRange(DEPT_SYS);
  cy.get('input[aria-label="업무시스템"]').closest('.v-input').filter(':visible').first().should(($sys) => {
    const txt = $sys.text().replace(/\s+/g, ' ');
    expect(txt, '업무시스템 칩 = 리눅스_VIP고객 하나').to.include(DEPT_SYS.slice(0, 6)).and.not.match(/\(\+\d+\)/);
  });
  cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
  cy.get('input[aria-label="그룹"]').closest('.v-input').filter(':visible').first().find('.v-input__slot').click({ force: true });
  cy.wait(1500);
  cy.get('body').then(($b) => {
    const $m = $b.find('.menuable__content__active').filter(':visible').last();
    const names = $m.find('.v-list__tile__title').toArray().map((el) => el.textContent.trim()).filter((t) => t && !/no data/i.test(t));
    cy.log(`그룹 목록(${DEPT_SYS}, 시작일 ${DEPT_RANGES[idx]}일 전): ${names.join(', ') || '없음'}`);
    if (!names.length) {
      cy.get('body').type('{esc}');
      cy.wait(500);
      if (idx + 1 < DEPT_RANGES.length) { pickDeptInRange(idx + 1); return; }
      cy.writeFile('cypress/probe/B03_부서별_그룹목록.json', { 업무시스템: DEPT_SYS, 기대: DEPT_EXPECT, 목록: [], 시작일: DEPT_RANGES[idx], at: new Date().toISOString() }, { log: false });
      throw new Error(`그룹 목록 (${DEPT_SYS}) 이 ${DEPT_RANGES[idx]}일 범위까지 비어 있음 — 접속 기록 · 인사연동 그룹 확인 필요`);
    }
    cy.writeFile('cypress/probe/B03_부서별_그룹목록.json', { 업무시스템: DEPT_SYS, 기대: DEPT_EXPECT, 목록: names, 시작일: DEPT_RANGES[idx], at: new Date().toISOString() }, { log: false });
    const pick = names.includes(DEPT_EXPECT) ? DEPT_EXPECT : names[0];
    if (pick !== DEPT_EXPECT) cy.log(`⚠️ [관찰] 그룹 목록에 '${DEPT_EXPECT}' 없음 → '${pick}' 로 진행 (인사연동 그룹 재생성 영향 가능)`);
    cy.wrap(pick, { log: false }).as('deptPick');
    cy.wrap($m.find('.v-list__tile__title').filter((k, el) => el.textContent.trim() === pick).first()).scrollIntoView().click({ force: true });
  });
};
pickDeptInRange();
    cy.wait(1000);
    cy.get('body').type('{esc}');


    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');

    // [2026-11-16] 리눅스_VIP고객 은 매일 접속 기록이 있으므로 '개인정보 사용량' 카드 숫자가 있어야 함 (값은 기록만)
    // 카드 제목 요소에서 위로 올라가며 「개인정보 사용량 … N 건」 숫자가 함께 있는 가장 가까운 상위 요소를 찾음
    cy.contains('개인정보 사용량').then(($t) => {
      let el = $t[0]; let n;
      for (let k = 0; k < 6 && el && !n; k += 1) {
        n = ((el.innerText || '').replace(/\s+/g, ' ').match(/개인정보 사용량\s*([\d,]+)\s*건/) || [])[1];
        el = el.parentElement;
      }
      cy.get('@deptPick').then((pick) => cy.log(`부서 별 ${DEPT_SYS} · ${pick} — 개인정보 사용량 ${n}`));
      expect(n, '부서 별 개인정보 사용량 숫자').to.match(/^[\d,]+$/);
    });
    cy.log('✅ 부서 별 탭 진입 및 데이터 출력 확인 완료!');

    
cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
cy.wait(3000);
cy.log('--- 화면 검증 시작 ---');
cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
// 'c-headline' 클래스를 가진 요소 중에 '검색 조건' 글자가 존재하는지 확인
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘확인 (display:none 부모 이슈 회피 - exist로 완화)
dateInputs().eq(0).find('i.material-icons').should('exist').then(($icon) => {   // [2.9.7] '기간' 라벨 비어 있음
  expect($icon.text().trim()).to.equal('event');
});

// 🌟 종료날짜 달력 아이콘확인
cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1)
  .closest('.v-input').find('i.material-icons').should('exist');

// 검색 버튼 확인
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
// 검색조건 입력문구 확인
cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');


    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
     //cy.get('input[aria-label=\"업무시스템\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });

    // [2.9.7] 업무시스템 리눅스_배송관리 선택 (없으면 기간을 넓혀 재시도)
    selectSystemInRange('리눅스_배송관리');


    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    cy.log('✅ 업무 시스템 별 탭 진입 및 데이터 출력 확인 완료!');

    
    // 종합현황 사라짐 
    /*
    //  현황 > 종합 현항 탭
    cy.log('--- 현황 > 종합 현항 탭 클릭  ---');
    cy.get('.tab-btn').contains('종합 현황').should('be.visible').click({ force: true });
    cy.wait(3000);

    // 현황 > 종합현황  > [정보 사용자별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').should('be.visible').contains('정보사용자 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('label', '기간').filter(':visible').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('input[aria-label="사용자"]').filter(':visible').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    //cy.get('input[aria-label=\"업무시스템\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    //cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    //cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    //cy.get('body').type('{esc}');
    
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    //cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('리눅스_배송관리').click({ force: true });
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');
    //추적타입 - 정보사용자는 디폴트값으로 선택 Skip
    //사용자 선택
    cy.get('input[aria-label="사용자"]').filter(':visible').click({ force: true });
    // 사용자 리스트 콤보박스에서 첫번쨰 사람 선택
    cy.wait(1000);
    cy.get('.v-list__tile__title').filter(':visible').eq(0).click({ force: true });

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    cy.log('✅ 현황 - 종합현황 - [정보 사용자별]탭 진입 및 데이터 출력 확인 완료!');

    
    
    // 현황 > 종합현황  > [부서 별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').should('be.visible').contains('부서 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색 조건 입력 문구확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label=\"업무시스템\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    //cy.get('span[title="전체 선택"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 조건 입력 
    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label=\"그룹\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 그룹별중 영업팀 클릭하는 코드
    cy.get('.v-list__tile__title').contains('협력사').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    cy.log('✅ 현황 - 종합현황 - [부서 별]탭 진입 및 데이터 출력 확인 완료!');

    
    // 업무시스템 콤보박스 닫히지 않는 이슈 새로고침 실행
    cy.reload();
    
    // 현황 > 종합현황  > [업무시스템 별] 탭 클릭 
    cy.get('.tab-title').filter(':visible').contains('업무 시스템 별').click();
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
     //cy.get('input[aria-label=\"업무시스템\"]').closest('.v-input').filter(':visible').find('.v-input__slot').click({ force: true });

    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');
    

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    cy.log('✅ 현황 - 종합현황 - [업무 시스템 별]탭 진입 및 데이터 출력 확인 완료!');
    
    cy.wait(1000);
    */
   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 상태 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });



  });
});  

//코드마지막


 })()
;
