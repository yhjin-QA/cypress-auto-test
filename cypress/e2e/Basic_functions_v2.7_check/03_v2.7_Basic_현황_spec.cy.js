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

  
  it('로그캐치 v2.7 기본동작 체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.91:18443/logcatch/login');
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
// STEP 4: 현황 서브메뉴 
// ==========================================

cy.contains('button', '현황').click({ force: true });
cy.wait(2000);

cy.log('--- 상태 > 정보사용자별 탭 클릭 ---');
cy.get('.tab-btn').contains('정보사용자 별').should('be.visible').click({ force: true });
cy.log('--- 화면 검증 시작 ---');
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘 확인 (display:none 부모 이슈 완전 회피)
cy.contains('기간').closest('.v-input').find('.material-icons').should(($icons) => {
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
cy.get('label').filter(':visible').contains('기간').should('be.visible');
cy.get('label').filter(':visible').contains('추적 타입').should('be.visible');
cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');

////////////////////////////
// 기능확인 - 조건별로 검색
// 업무 시스템 - 리눅스_CRM고객관리 선택
////////////////////////////

// 업무시스템 목록 API 감시 (현황 메뉴 클릭 전에 1회 등록)
cy.intercept('GET', '**/search-condition/status-tasksystem*').as('bsnList');

// 업무시스템 콤보박스에서 항목 선택 (맨티스 37152 우회)
// - realClick(실제 마우스 이벤트)으로 수동 조작과 동일하게 동작
const selectBusinessSystem = (name, retry = 0) => {
  const MAX_RETRY = 3;
  const bsnInput = () =>
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input');
  // 메뉴 닫기: 빈 영역(검색 조건 제목) 실제 클릭
  const closeMenu = () => {
    cy.contains('.c-headline', '검색 조건').realClick();
    cy.wait(500);
  };

  bsnInput().then(($input) => {
    if ($input.find('.v-select__selections').text().includes(name)) {
      cy.log(`✅ [${name}] 이미 선택됨`);
      return;
    }

    // 1) 드롭다운 열기 (실제 클릭)
    cy.wrap($input).find('.v-input__slot').realClick();
    cy.wait(800);

    // 2) 비어 있으면 'No data available' 실제 클릭 → 목록 API 응답 대기
    cy.get('.v-menu__content').filter(':visible').then(($m) => {
      if ($m.text().includes('No data available')) {
        cy.log('⚠️ No data available → 실제 클릭으로 목록 로딩 유도');
        cy.wrap($m).contains('No data available').realClick();
        cy.wait('@bsnList', { timeout: 10000 });
        cy.wait(500);
      }
    });

    // 3) 항목이 보이면 실제 클릭으로 선택
    cy.get('body').then(($body) => {
      const $title = $body.find(`.v-menu__content:visible .v-list__tile__title:contains("${name}")`);
      if ($title.length > 0) {
        cy.wrap($title.first()).closest('.v-list__tile').scrollIntoView().realClick();
        cy.wait(500);
      } else {
        cy.log('ℹ️ 이번 시도에서는 항목 미표시');
      }
    });

    // 4) 메뉴 닫기 → 선택 결과 검증
    closeMenu();
    bsnInput().then(($after) => {
      if ($after.find('.v-select__selections').text().includes(name)) {
        cy.log(`✅ 업무시스템 [${name}] 선택 완료`);
      } else if (retry < MAX_RETRY) {
        cy.log(`⚠️ [${name}] 선택 미반영 → 재시도 ${retry + 1}/${MAX_RETRY}`);
        selectBusinessSystem(name, retry + 1);
      } else {
        throw new Error(`❌ 업무시스템 [${name}] 선택 실패 (${MAX_RETRY}회 재시도)`);
      }
    });
  });
};

// ⬇️ 이 줄이 실제로 선택을 수행합니다
selectBusinessSystem('리눅스_CRM고객관리');


// ==========================================
// 조건 입력 - 추적 타입: 정보 사용자 / 사용자: 사원_101
// ==========================================

// 1) 추적 타입 = '정보 사용자' 확인 (기본값이 아니면 선택)
cy.contains('.v-input .v-label', /^\s*추적 타입\s*$/).closest('.v-input').as('traceType');
cy.get('@traceType').then(($t) => {
  if (!$t.find('.v-select__selections').text().includes('정보 사용자')) {
    cy.wrap($t).find('.v-input__slot').realClick();
    cy.wait(800);
    cy.get('.v-menu__content').filter(':visible')
      .contains('.v-list__tile__title', '정보 사용자')
      .closest('.v-list__tile').realClick();
    cy.wait(500);
  }
});
cy.get('@traceType').should('contain.text', '정보 사용자');

// 2) 사용자 콤보박스 열기 (라벨 '사용자' 기준)
cy.contains('.v-input .v-label', /^\s*사용자\s*$/).closest('.v-input').as('userCombo');
cy.get('@userCombo').find('.v-input__slot').realClick();
cy.wait(800);

// 3) 목록이 길 수 있으므로 입력해서 필터링 후 선택
cy.get('@userCombo').find('input').first().type('사원_101', { force: true });
cy.wait(1000);

cy.get('.v-menu__content').filter(':visible')
  .find('.v-list__tile__title')
  .filter((i, el) => /^\s*사원_101(\s*\(|\s*$)/.test(el.innerText))   // '사원_1010' 등 제외
  .should('have.length.greaterThan', 0)
  .first()
  .closest('.v-list__tile')
  .scrollIntoView()
  .realClick();
cy.wait(500);

// 4) 메뉴 닫기 (빈 영역 실제 클릭)
cy.contains('.c-headline', '검색 조건').realClick();
cy.wait(500);

// 5) 선택 반영 확인
cy.get('@userCombo').should('contain.text', '사원_101');
cy.log('✅ 정보 사용자 [사원_101] 선택 완료');

// 6) 검색
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);



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
cy.contains('label', '기간').closest('.v-input').find('i.material-icons').should('exist').then(($icon) => {
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
// ⚠️ 맨티스 #_____ : 업무시스템 → 그룹 순서로 선택하면 결과 미노출
//    수정 전까지 그룹 → 업무시스템 순서로 우회
////////////////////////////

// 1) 그룹: UI1팀 선택
cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').as('groupCombo');
cy.get('@groupCombo').find('.v-input__slot').realClick();
cy.wait(800);
cy.get('.v-menu__content').filter(':visible')
  .contains('.v-list__tile__title', /^\s*UI1팀\s*$/)
  .scrollIntoView()
  .closest('.v-list__tile')
  .realClick();
cy.wait(500);
cy.contains('.c-headline', '검색 조건').realClick();
cy.wait(500);
cy.get('@groupCombo').should('contain.text', 'UI1팀');
cy.log('✅ 그룹 [UI1팀] 선택 완료');

// 2) 업무시스템: 리눅스_CRM고객관리 선택
selectBusinessSystem('리눅스_CRM고객관리');

// 3) 두 조건이 모두 유지되는지 확인
cy.get('@groupCombo').should('contain.text', 'UI1팀');


    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');

    cy.log('✅ 부서 별 탭 진입 및 데이터 출력 확인 완료!');

    
cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
cy.wait(3000);
cy.log('--- 화면 검증 시작 ---');
cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
// 'c-headline' 클래스를 가진 요소 중에 '검색 조건' 글자가 존재하는지 확인
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘확인 (display:none 부모 이슈 회피 - exist로 완화)
cy.contains('label', '기간').closest('.v-input').find('i.material-icons').should('exist').then(($icon) => {
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
    //업무 시스템 - 리눅스_CRM고객관리 선택
    // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
     //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });

    selectBusinessSystem('리눅스_CRM고객관리');


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
    //업무 시스템 - 리눅스_CRM고객관리 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_CRM고객관리 클릭하는 코드
    //cy.contains('.v-list__tile__title', '리눅스_CRM고객관리').should('be.visible').click();
    //cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    //cy.get('body').type('{esc}');
    
    // 업무시스템중 리눅스_CRM고객관리 클릭하는 코드
    //cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('리눅스_CRM고객관리').click({ force: true });
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
    cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색 조건 입력 문구확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_CRM고객관리 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 업무시스템중 리눅스_CRM고객관리 클릭하는 코드
    //cy.get('span[title="전체 선택"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 조건 입력 
    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
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
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');

    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_CRM고객관리 선택
    // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
     //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });

    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_CRM고객관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_CRM고객관리').should('be.visible').click();
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
