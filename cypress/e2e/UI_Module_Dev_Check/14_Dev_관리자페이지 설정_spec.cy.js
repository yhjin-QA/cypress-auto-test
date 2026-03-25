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

/*
    // ==========================================
    // STEP 2: 왼쪽 사이드 메뉴뉴탭 클릭
    // ==========================================
    // button 태그 중에서 '이력'이라는 글자를 가진 녀석을 클릭
    cy.contains('button', '이력').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    // 컨텍스트 메뉴 제거거
    cy.get('body').type('{esc}');
    cy.wait(500);
    
    // button 태그이면서 '현황'이라는 글자를 포함한 요소를 클릭
    cy.contains('button', '현황').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '소명').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.get('body').type('{esc}');
    cy.wait(500);
    
    cy.contains('button', '자산').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '보고').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '보관').click({ force: true });
    cy.wait(3000);
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '분석').click({ force: true });
    cy.wait(3000); 
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '검출').click({ force: true });
    cy.wait(3000); 
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '운영').click({ force: true });
    cy.wait(3000); 
    cy.get('body').type('{esc}');
    cy.wait(500);

    cy.contains('button', '점검').click({ force: true });
    cy.wait(3000); 
    cy.get('body').type('{esc}');
    cy.wait(500);
  
  
  
    // ==========================================
    // STEP 3: 이력 서브메뉴 
    // ==========================================
    cy.contains('button', '이력').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기

    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 이력 > 사용자 추적 클릭 ---');
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
  
     // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 전체선택 확인
     cy.get('span[title="전체 선택"]').should('be.visible');
     // like버튼 확인 
     //cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
    
    //검색 버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 값').should('be.visible');
    cy.get('th').filter(':visible').contains('조회').should('be.visible');
    cy.log('✅ 이력 - 사용자 추적 화면 출력 확인 완료!');



    // 이력 > 접속 기록 이력 서브메뉴 클릭
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });
    cy.wait(3000);
    // 'tab-btn' 클래스를 가진 요소 안에서 '  ' 글자를 찾아 클릭
    

    // 이력 > 접속기록 이력 > [파일 다운로드] 탭 선택
    cy.get('.tab-btn').contains('파일 다운로드').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('파일 다운로드').closest('button').should('not.have.class', 'inactive');
    // 'c-headline' 클래스를 가진 요소 중에 '파일 다운로드' 글자가 존재하는지 확인
    cy.contains('.c-headline', '파일 다운로드').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="시작 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="종료 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="파일명"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="파일 경로"]').filter(':visible').should('be.visible');
     //토글
     cy.get('.v-label').filter(':visible').contains('개인정보').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     // like버튼 확인 
     //cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     cy.get('input[aria-label="파일명"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     cy.get('input[aria-label="파일 경로"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     
    
     //검색 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //개인정보 문구 확인
    cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
    cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자 IP').should('be.visible');
    cy.get('th').filter(':visible').contains('URL').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('파일명').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 상세').should('be.visible');
    cy.get('th').filter(':visible').contains('확인').should('be.visible');
    cy.get('th').filter(':visible').contains('받기').should('be.visible');
    cy.log('✅ 이력 - 파일 다운로드 탭 진입 및 데이터 출력 확인 완료!');

    
    cy.get('.tab-btn').contains('이상행위').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('이상행위').closest('button').should('not.have.class', 'inactive');
    // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '이상행위').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 조건 이름 입력란 확인
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="경보 등급"]').filter(':visible').should('be.visible');
    //토글문구확인 
    cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //검색버튼 존재확인인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 문구확인 
    cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접근이력 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유무').should('be.visible'); 
    cy.get('th').filter(':visible').contains('소명 대상 여부').should('be.visible');
    cy.get('th').filter(':visible').contains('조회').should('be.visible'); 
    cy.log('✅ 이력 - 이상행위 탭 진입 및 데이터 출력 확인 완료!');

    cy.get('.tab-btn').contains('검출').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('검출').closest('button').should('not.have.class', 'inactive');
   // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="시작 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="종료 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
     //토글문구 확인
     cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     // like버튼 확인 
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('like').should('be.visible');
     cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 문구확인 
    cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 건수').should('be.visible'); 
    cy.log('✅ 이력 - 검출 탭 진입 및 데이터 출력 확인 완료!');


    cy.get('.tab-btn').contains('통합').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('통합').closest('button').should('not.have.class', 'inactive');
   // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     //왜 2개 정보사용자??
     cy.get('input[aria-label="정보 사용자"][role="combobox"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]:not([role="combobox"])').filter(':visible').should('be.visible');
     //cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="접속 메뉴"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');

    //검색 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //토글 문구 확인
    cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
    cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('건수').should('be.visible');
    cy.get('th').filter(':visible').contains('상세 접속기록 정보').should('be.visible');
    cy.get('th').filter(':visible').contains('처리').should('be.visible');
    cy.log('✅ 이력 - 통합 탭 진입 및 데이터 출력 확인 완료!');



    // ==========================================
    // STEP 4: 현황서브메뉴 
    // ==========================================
    cy.wait(3000);
    cy.contains('button', '현황').click({ force: true });
    cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 현황 > 정보사용자별 탭 클릭  ---');
    cy.get('.tab-btn').contains('정보사용자 별').should('be.visible').click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //검색 조건 입력문구 확인
    cy.get('label').filter(':visible').contains('기간').should('be.visible');
    cy.get('label').filter(':visible').contains('추적 타입').should('be.visible');
    cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.log('✅ 현황 - 정보사용자 별 탭 진입 및 데이터 출력 확인 완료!');
    
    cy.log('--- 현황 > 부서서 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('부서 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('부서 별').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('label', '기간') .closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
    cy.log('✅ 부서 별 탭 진입 및 데이터 출력 확인 완료!');

    cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
    // 'c-headline' 클래스를 가진 요소 중에 '파일 다운로드' 글자가 존재하는지 확인
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('label', '기간') .closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.log('✅ 업무 시스템 별 탭 진입 및 데이터 출력 확인 완료!');
   

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
    cy.log('✅ 현황 - 종합현황 - [부서 별]탭 진입 및 데이터 출력 확인 완료!');

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
    cy.log('✅ 현황 - 종합현황 - [업무 시스템 별]탭 진입 및 데이터 출력 확인 완료!');
    cy.wait(3000);

    // ==========================================
    // STEP 5: 소명 서브메뉴 
    // ==========================================
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 관리 서브메뉴 클릭 ---');
    //서브메뉴 관리 클릭 (정교하게)
    cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('관리').click({ force: true });
    cy.wait(3000);
    // 소명 > 관리 > 종합현황 탭 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('종합 현황').click();
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 업무시스템 검색문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
    // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
      cy.get('th').filter(':visible').contains('부서').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.get('th').filter(':visible').contains('건수').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
    cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
    cy.log('✅ 소명 - 관리 - [종합 현황] 탭 진입 및 데이터 출력 확인 완료!');

    
    // 소명  > 나의 소명 서브메뉴 클릭
    cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기
    cy.log('--- 소명 > 나의 소명 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("나의 소명")').filter(':visible').click({ force: true });
    cy.wait(3000);
    
     // 소명 > 나의소명 > 나의 소명 내역
     cy.get('.tab-btn').contains('나의 소명 내역').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     // 시작날짜 달력 아이콘확인
     cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
     cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
       cy.get('th').filter(':visible').contains('건수').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
     cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [나의 소명 내역]탭 진입 및 데이터 출력 확인 완료!');

     // 소명 > 나의소명 > 소명하기 
     cy.get('.tab-btn').contains('소명하기').should('be.visible').click({ force: true });
     cy.wait(3000); 
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 업무시스템 검색문구 확인
     cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="경보 등급"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="소명 대상 일자"]').filter(':visible').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
     cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
     cy.log('✅ 소명 - 나의 소명 - [소명하기]탭 진입 및 데이터 출력 확인 완료!');

      // 소명 > 나의소명 > 승인하기
      cy.get('.tab-btn').contains('승인하기').should('be.visible').click({ force: true });
      cy.wait(3000); 
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '검색 조건').should('exist');
      // 검색버튼 존재 확인
      cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
      // 업무시스템 검색문구 확인
      cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소속"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명 상태"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="소명 유형"]').filter(':visible').should('be.visible');
      cy.get('input[aria-label="이상행위 유형"]').filter(':visible').should('be.visible');
      // 시작날짜 달력 아이콘확인
      cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
      // 종료날짜 달력 아이콘확인
      cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('승인이 필요한 내역만 보기').should('be.visible');
      // 표 문구열 확인
      cy.get('th').filter(':visible').contains('일시').should('be.visible');
      cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
      cy.get('th').filter(':visible').contains('부서').should('be.visible');
      cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
      cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
      cy.get('th').filter(':visible').contains('건수').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 상태').should('be.visible');
      cy.get('th').filter(':visible').contains('소명 유형').should('be.visible');
      cy.log('✅ 소명 - 나의 소명 - [승인하기]탭 진입 및 데이터 출력 확인 완료!');


      // 소명 > 결재 서브메뉴 클릭
      cy.contains('.side-menu', '소명').should('be.visible').click({ force: true });
      cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
      cy.log('--- 소명 > 결재 서브메뉴 클릭 ---');
      cy.get('.v-list__tile__title').filter(':contains("결재")').filter(':visible').click({ force: true });
      cy.wait(3000);
      // 소명 > 결재 > 결재라인 탭 클릭
      cy.get('.v-btn__content').filter(':visible').contains('결재 라인').click();
      cy.log('--- 화면 검증 시작 ---');
      cy.contains('.c-headline', '결재 정책 목록').should('exist');
      //토글 문구 확인인
      cy.get('label').filter(':visible').contains('지난 정책 보기').should('be.visible');
       // 표 문구열 확인
       cy.get('th').filter(':visible').contains('유형').should('be.visible');
       cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
       cy.get('th').filter(':visible').contains('설명').should('be.visible');
       cy.get('th').filter(':visible').contains('등록').should('be.visible');
       cy.get('th').filter(':visible').contains('수정').should('be.visible');
       cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');
       cy.get('th').filter(':visible').contains('..').should('be.visible');
       // 정책 추가 + 버튼
       cy.get('.material-icons').filter(':visible').contains('add').should('be.visible');
       cy.log('✅ 소명 - 결재 - [결재라인] 탭 진입 및 데이터 출력 확인 완료!');
  
    

    // ==========================================
    // STEP 6: 자산 서브메뉴 
    // ==========================================
    cy.contains('button', '자산').click({ force: true });
    cy.wait(3000);
    cy.log('---자산-데이터베이스 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스")').filter(':visible').eq(0).click({ force: true });
    cy.wait(3000); 
    // 자산 > 데이터베이스 > [개인정보 탐색 정책] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('개인정보 탐색 정책').click();
    cy.wait(3000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [개인정보 탐색 정책]탭 출력 확인 완료!');

    // 자산 > 데이터베이스 > [샤크라 아이템 정책] 탭 클릭
    //클릭하면 관리자페이지모드로 변해버려서 순서 변경해둠 
    cy.get('.v-btn__content').filter(':visible').contains('샤크라 아이템 정책').click();
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [샤크라 아이템 정책]탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 > [개인정보 동기화] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('개인정보 동기화').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [개인정보 동기화]탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 > [샤크라 마스킹 정책] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('샤크라 마스킹 정책').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 > [샤크라 마스킹 정책]탭 출력 확인 완료!'); 



    cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---자산 - 개인정보 파일 / 문서 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("개인정보 파일 / 문서")').filter(':visible').eq(0).click({ force: true });
    cy.wait(2000); 
    // 자산 > 개인정보 파일 / 문서 > [자산 보유 현황 / 전체] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 전체').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 개인정보 파일 / 문서 > [자산 보유 현황 / 전체] 탭 출력 확인 완료!'); 


    // 자산 > 개인정보 파일 / 문서 > [외부 로그 연동 정책/플랜] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('외부 로그 연동 정책/플랜').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 개인정보 파일 / 문서 > [외부 로그 연동 정책/플랜] 탭 출력 확인 완료!'); 


    // 자산 > 개인정보 파일 / 문서 > [외부 파일 저장소 연동] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('외부 파일 저장소 연동').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 개인정보 파일 / 문서 > [외부 파일 저장소 연동] 탭 출력 확인 완료!'); 



    cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---자산 - 데이터베이스 자산정보 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스 자산정보")').filter(':visible').eq(0).click({ force: true });
    cy.wait(2000); 
    // 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 전체] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 전체').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 전체]  탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 개별] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 보유 현황 / 개별').click();
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅  자산 > 데이터베이스 자산정보 > [자산 보유 현황 / 개별]  탭 출력 확인 완료!'); 
 

    // 자산 > 데이터베이스 자산정보 > [자산 상세 조회] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 상세 조회').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [자산 상세 조회] 탭 출력 확인 완료!'); 


     // 자산 > 데이터베이스 자산정보 > [확정된 개인정보 조회] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('확정된 개인정보 조회').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 자산정보 > [확정된 개인정보 조회] 탭 출력 확인 완료!'); 



    cy.contains('.side-menu', '자산').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---자산 - 데이터베이스 확정처리 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스 확정처리")').filter(':visible').eq(0).click({ force: true });
    cy.wait(2000); 
    
    // 자산 > 데이터베이스 확정처리 > [자산 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [자산 개인정보 확정처리] 탭 출력 확인 완료!'); 

    // 자산 > 데이터베이스 확정처리 > [자산 분리된 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('자산 분리된 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [자산 분리된 개인정보 확정처리] 탭 출력 확인 완료!'); 


    // 자산 > 데이터베이스 확정처리 > [사용자 정의 개인정보 확정처리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('사용자 정의 개인정보 확정처리').click();
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.log('✅ 자산 > 데이터베이스 확정처리 > [사용자 정의 개인정보 확정처리] 탭 출력 확인 완료!'); 



 

    // ==========================================
    // STEP 7: 보고 서브메뉴 
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('접속기록 종합 보고서').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '보고서 목록').should('exist');
    // v 아이콘 확인하는 코드
    cy.get('.v-icon').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('보고서 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('생성자').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('삭제').should('be.visible');
    cy.log('✅  보고 탭 진입 및 데이터 출력 확인 완료!');


     
    // ==========================================
    // STEP 8: 보관 서브메뉴 
    // ==========================================
    cy.contains('.side-menu', '보관').click({ force: true });
    cy.wait(2000);
    cy.log('---보관-접속기록 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 보관")').filter(':visible').click({ force: true });
    cy.wait(2000); 
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.tab-title', '백업/복원').should('exist');
    // 보관 > 접속기록 보관 >  백업/복원  활성/비활성화 토글
    cy.get('label').filter(':visible').contains('활성/비활성').eq(0).should('be.visible');
    cy.contains('.c-headline', '증적 자료').should('exist');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (왼쪽)
    cy.contains('데이터들이 백업됩니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 > 증적자료에 포함된 활성/비활성 토글 (오른쪽)
    cy.contains('개인정보가 없는 데이터를 정리합니다').closest('.flex').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  시스템에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '시스템').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    // 보관 > 접속기록 보관 >  전송방식식에 포함된 활성/비활성화 토글
    cy.contains('.c-headline', '전송 방식').closest('.v-card').find('label').contains('활성/비활성').should('be.visible');
    cy.log('✅  보관 탭 진입 및 데이터 출력 확인 완료!');

 
    cy.contains('.side-menu', '보관').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---보관-접속기록 무결성 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 무결성")').filter(':visible').click({ force: true });
    cy.wait(2000); 
    
  
     // 보관 > 접속기록 무결성 > 위변조 검사 정책/플랜랜 탭 클릭 
     cy.get('.tab-btn').contains('위변조 검사 정책 / 플랜').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.get('.tab-btn').contains('위변조 검사 정책 / 플랜').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // v 아이콘 확인하는 코드
     cy.get('.v-icon').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     cy.log('✅ 위변조 검사 정책/플랜 진입 및 데이터 출력 확인 완료!');
 
 
     // 보관 > 접속기록 무결성 > 위변조 검사이력조회 탭 클릭 
     cy.get('.tab-btn').contains('위변조 검사 이력 조회').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.get('.tab-btn').contains('위변조 검사 이력 조회').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '검색 조건').should('exist');
     //[DB 무결성 점검 상태] 검색조건 문구 확인
     cy.get('input[aria-label="DB 무결성 점검 상태"]').filter(':visible').should('be.visible');
     //엑셀다운로드 버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
     //검색 버튼 존재확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('접속기록 날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('점검 횟수').should('be.visible');
     cy.get('th').filter(':visible').contains('최초 점검 일').should('be.visible');
     cy.get('th').filter(':visible').contains('최종 점검 일').should('be.visible');
     cy.get('th').filter(':visible').contains('DB 무결성 점검 상태').should('be.visible');
     cy.log('✅ 접속기록 무결성-위변조 검사 이력조회 탭 진입 및 데이터 출력 확인 완료!');


  
     // 보관 > 접속기록 무결성 > 파일 위변조 검사 이력 조회 탭 클릭 
     cy.get('.tab-btn').contains('파일 위변조 검사 이력 조회').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.get('.tab-btn').contains('파일 위변조 검사 이력 조회').closest('button').should('not.have.class', 'inactive');
     cy.contains('.c-headline', '검색 조건').should('exist');
     //검색조건 문구 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="파일명"]').filter(':visible').should('be.visible');
     cy.get('span').filter(':visible').contains(/^전체$/).should('be.visible');
     //엑셀다운로드 버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
     //검색 버튼 존재확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 문구열 확인
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('파일명').should('be.visible');
     cy.get('th').filter(':visible').contains('무결성 생성일시').should('be.visible');
     cy.get('th').filter(':visible').contains('검증일시').should('be.visible');
     cy.get('th').filter(':visible').contains('CheckSum').should('be.visible');
     cy.get('th').filter(':visible').contains('위 변조 여부').should('be.visible');
    cy.log('✅ 접속기록 무결성-파일 위변조 검사 이력조회 탭 진입 및 데이터 출력 확인 완료!');

    


    // ==========================================
    // STEP 9: 분석 서브메뉴 
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.v-btn__content').contains('실시간').closest('button').should('not.have.class', 'inactive');
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
    // STEP 10: 검출 서브메뉴 
    // ==========================================
    cy.log('🚀 검출 탭 클릭 및 알림창 처리');
    cy.contains('button', '검출').click({ force: true });
    cy.wait(2000);
    cy.log('---검출 - 개인정보 의심 확정처리 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("개인정보 의심 확정 처리")').filter(':visible').click({ force: true });
    cy.wait(5000); 

   // 2. [핵심] 알림창이 떴는지 확인하고 처리 (If문)
    cy.get('body').then(($body) => {
        
        // 설명: 화면 전체($body)에서 '확인'이라는 글자를 가진 버튼 내용(.v-btn__content)이
        //      현재 눈에 보이는지(:visible) 확인합니다.
        if ($body.find('.v-btn__content:contains("확인")').filter(':visible').length > 0) {
            
            cy.log('⚠️ 알림창(한 개의 업무시스템...) 감지됨 -> 확인 버튼 클릭');
            
            // 확인 버튼을 찾아서 클릭
            cy.wrap($body).find('.v-btn__content:contains("확인")').filter(':visible').click({ force: true });
            
            // 팝업이 닫힐 때까지 잠시 대기
            cy.wait(1000);

        } else {
            // 알림창이 없으면 아무것도 안 하고 넘어갑니다.
            cy.log('ℹ️ 알림창 없음 -> 바로 검증 진행');
        }
       });

       // 검출 - 개인정보 의심확정처리 화면 >  [개인정보 의심 식별 처리] 탭을 클릭
       cy.contains('.v-btn__content', '개인정보 의심 식별 처리').should('be.visible').click({ force: true });
       cy.log('--- 화면 검증 시작 ---');
       //검색조건 문구 확인
       cy.get('input[aria-label="날짜 선택"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
       // 버튼 확인 
       cy.get('.v-btn__content').filter(':visible').contains('정책 재 적용').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('선택된 날짜 정책 재 처리').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('전체 날짜 정책 재 처리').should('be.visible');
       // URI목록 문구확인 
       cy.get('.subheading').filter(':visible').contains('URI 목록').should('be.visible');
       // URI목록 문구 옆 새로고침 확인코드
       cy.contains('.subheading', 'URI 목록').parent().find('.material-icons').contains('autorenew').should('be.visible');
       
       cy.contains('.c-headline', '접속 이력 목록').should('exist');
       // URI 재처리 버튼확인
       cy.get('.v-btn__content').filter(':visible').contains('URI 재 처리').should('be.visible');
       // 표 열 문구확인
       cy.get('th').filter(':visible').contains('시간').should('be.visible');
       cy.get('th').filter(':visible').contains('접속 아이디').should('be.visible');
       cy.get('th').filter(':visible').contains('사용자 IP').should('be.visible');
       cy.get('th').filter(':visible').contains('메뉴 등록').should('be.visible');
       
       cy.contains('.c-headline', '개인정보 의심 데이터').should('exist');
       // 개인정보 유형 문구확인 
       cy.get('.subheading').filter(':visible').contains('개인정보 유형').should('be.visible');
       // 개인정보 유형 문구 옆 새로고침 확인코드 
       cy.contains('.subheading', '개인정보 유형').parent().find('.material-icons').contains('autorenew').should('be.visible');
       cy.log('✅ 검출 - 개인정보 의심확정처리 - [개인정보 의심 식별 처리] 출력 확인 완료!');


    
       //검출 - 개인정보 의심확정처리 화면 >  [개인정보 식별 예외 정책] 탭을 클릭
       cy.log('--- 개인정보 식별 예외 정책 탭 클릭 ---');
       cy.contains('.v-btn__content', '개인정보 식별 예외 정책').should('be.visible').click({ force: true });
       cy.wait(2000);
       cy.log('--- 화면 검증 시작 ---');
       cy.get('input[aria-label="uri 주소"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="Client IP"]').filter(':visible').should('be.visible');
        // 탭 클릭 후, 문구 존재확인
       cy.contains('.c-headline', '개인정보 고유식별 값').should('exist');
       //검색조건 문구 확인
       cy.get('input[aria-label="개인정보 고유식별 값"]').filter(':visible').should('be.visible');
       cy.contains('.c-headline', '예외 정책 항목').should('exist');
       // 표 열 문구확인
       cy.get('th').filter(':visible').contains('exceptionId').should('be.visible');
       cy.get('th').filter(':visible').contains('uri 주소').should('be.visible');
       cy.get('th').filter(':visible').contains('정보사용자 IP').should('be.visible');
       cy.get('th').filter(':visible').contains('정보사용자').should('be.visible');
       cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
       cy.get('th').filter(':visible').contains('고유식별값').should('be.visible');
       cy.log('✅ 검출 - 개인정보 의심확정처리 - [개인정보 식별 예외 정책] 출력 확인 완료!');


       //검출 - 개인정보 의심확정처리 화면 >  [개인정보 식별 의심 키워드]  탭을 클릭
       cy.log('--- 개인정보 식별 의심 키워드 탭 클릭 ---');
       cy.contains('.v-btn__content', '개인정보 식별 의심 키워드').should('be.visible').click({ force: true });
       cy.wait(2000);
       cy.log('--- 화면 검증 시작 ---');
        // 탭 클릭 문구 존재확인
       cy.contains('.c-headline', '개인정보 의심 키워드 관리').should('exist');
       // 키워드 관리 문구확인 
       cy.get('.subheading').filter(':visible').contains('반정형 키워드').should('be.visible');
       cy.get('.subheading').filter(':visible').contains('자연어 키워드').should('be.visible');
       cy.get('.subheading').filter(':visible').contains('유사 컬럼명').should('be.visible');
       cy.contains('.c-headline', '의심 키워드 출력').should('exist');
       // 표 열 문구확인
       cy.get('th').filter(':visible').contains('privacyDoubtId').should('be.visible');
       cy.get('th').filter(':visible').contains('개인정보 의심 키워드').should('be.visible');
       cy.get('th').filter(':visible').contains('개인정보 의심 키워드 유형 상세').should('be.visible');
       cy.get('th').filter(':visible').contains('키워드 명').should('be.visible');
       cy.get('th').filter(':visible').contains('개인정보 유형 상세').should('be.visible');
       cy.get('th').filter(':visible').contains('crtDate').should('be.visible');
       cy.get('th').filter(':visible').contains('uptDate').should('be.visible');
       cy.get('th').filter(':visible').contains('삭제').should('be.visible');
       cy.log('✅ 검출 - 개인정보 의심확정처리 - [개인정보 식별 의심 키워드] 출력 확인 완료! ');

       
       //검출 > 개인정보 의심 확정 처리 >  [개인정보 의심 데이터 설정] 탭을 클릭
       cy.log('--- 개인정보 의심 데이터 설정 탭 클릭 ---');
       cy.contains('.v-btn__content', '개인정보 의심 데이터 설정').should('be.visible').click({ force: true });
       cy.wait(2000);
       cy.log('--- 화면 검증 시작 ---');
       //탭 타이틀(Menu) 확인
       cy.contains('.tab-title', 'Menu').should('be.visible');
       cy.contains('.c-headline', '검색 조건').should('exist');
       // 검색조건 문구 확인인 
       cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="메뉴 명"]').filter(':visible').should('be.visible');
       // 파일선택 확인
       cy.get('input[type="file"][accept=".xls, .xlsx"]').filter(':visible').should('be.visible');
       // 버튼 확인 
       cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
       // menu 탭 표 컬럼 확인
       cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
       cy.get('th').filter(':visible').contains('메뉴 명').should('be.visible');
       cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
       cy.get('th').filter(':visible').contains('삭제').should('be.visible');
       cy.log('✅ 검출 - 개인정보 의심확정처리 - [개인정보 의심 데이터 설정] 출력 확인 완료! ');




        // 검출탭 > 필터  서브메뉴 선택 
        cy.log('🚀 검출탭 > 필터  서브메뉴 선택 ');
        cy.contains('button', '검출').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('---검출 - 필터 서브메뉴 클릭 ---');
        cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });
        cy.wait(3000); 
        
        // 검출탭 > 필터 > 탐색/분석 필터 그룹 관리 탭 클릭 
        cy.contains('.v-btn__content', '탐색/분석 필터 그룹 관리').should('be.visible').click({ force: true });
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        //트리영역 검색 버튼 아이콘
        cy.get('.v-icon.fa-search').filter(':visible').should('be.visible');
        // 트리영역 안 IP그룹 폴더명 
        cy.get('.text-label').filter(':visible').contains('IP 그룹').should('be.visible');
        // 왼쪽 화면영역 
        cy.contains('.c-headline', 'IP 그룹 (0)').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('그룹 이름').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('필터 개수').should('be.visible');
        cy.get('th').filter(':visible').contains('사용 중인 정책 개수').should('be.visible');
        cy.log('✅ 검출 - 필터 - [탐색/분석 필터 그룹 관리] 출력 확인 완료!');



        // 검출탭 > 필터 > 전처리 파일 구분 설정 탭 클릭 
        cy.log('--- 전처리 파일 구분 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 파일 구분 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 파일 구분 설정').should('exist');
        //전처리 파일 구분 설정정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="기본 확장자"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="ContentType Value"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="ContentDisposition Key"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 파일 구분 설정] 출력 확인 완료! ');


        
        // 검출탭 > 필터 > 전처리 필터링 정책 탭 클릭 
        cy.log('--- 전처리 필터링 정책 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 필터링 정책').should('be.visible').click({ force: true });
        cy.wait(2000);
        
        // 검출 > 필터 > 전처리 필터링 정책 >[사용자 IP 제외] 탭선택 
        cy.contains('.v-tabs__item', '사용자 IP 제외').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('IP not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', 'IP').should('exist');
        // IP입력 IP란 확인
        cy.get('label[for="ipv4-address"]').should('contain', 'IP').and('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        // IP문구 중복으로 구분처리 
        cy.get('th').filter(':visible').filter(':contains("IP")').eq(1).should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [사용자 IP 제외] 탭 클릭 및 출력 확인 완료');


        // 검출탭 > 필터 > 전처리 필터링 정책 > 화면URI제외 탭선택
        cy.contains('.v-tabs__item', '화면 (URI) 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', '화면 (URI) 제외').should('exist');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('URI not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', '화면 URI').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="화면 URI"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('화면 URI').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [화면 (URI) 제외] 탭 클릭 및 출력 확인 완료');



        // 검출탭 > 필터 > 전처리 필터링 정책 > 특정SQL 제외 탭선택
        cy.contains('.v-tabs__item', '특정 SQL 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', '특정 SQL 제외').should('exist');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('SQL not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', '특정 SQL').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="특정 SQL"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('특정 SQL').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [특정 SQL 제외] 탭 클릭 및 출력 확인 완료');
        

       
        // 검출탭 > 필터 > 전처리 필터링 정책 > CONTENT-TYPE 제외 탭선택
        cy.contains('.v-tabs__item', 'Content-Type 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', 'Content-Type 제외').should('exist');
        cy.contains('.c-headline', 'Excluded Content-Type').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('Content-Type not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', 'Content-Type 제외').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="Content-Type"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        //표 열첫번쨰 문구없음.
        //cy.get('th').filter(':visible').contains('').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [Content-Type 제외] 탭 클릭 및 출력 확인 완료');
        cy.log('✅ 검출 - 필터 - [전처리 필터링 정책] 출력 확인 완료! ');


        // 검출탭 > 필터 > 전처리 사용자 계정 탐색 설정 탭 클릭 
        cy.log('--- 전처리 사용자 계정 탐색 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 사용자 계정 탐색 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 사용자 계정 탐색 설정').should('exist');
        //전처리 사용자 계정 탐색 설정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('span[title="Request Header Cookie"]').should('be.visible');
        cy.get('input[aria-label="key"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 사용자 계정 탐색 설정] 화면 출력 확인 완료 ');


   
        // 검출탭 > 필터 > 전처리 디코더 설정 탭 클릭 
        cy.log('--- 전처리 디코더 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 디코더 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 디코더 설정').should('exist');
        //전처리 사용자 계정 탐색 설정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('span[title="URL Decoder"]').should('be.visible');
        cy.get('span[title="Response Body(UTF-8)"]').should('be.visible');
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 디코더 설정] 화면 출력 확인 완료 ');



       // 검출탭 > 검출 메뉴 관리  서브메뉴 선택 
       cy.log('🚀 검출 탭 > 검출 메뉴 관리 서브메뉴 선택 ');
       cy.contains('button', '검출').should('be.visible').should('be.visible').click({ force: true });
       cy.wait(2000);
       cy.get('.v-list__tile__title').filter(':contains("검출 메뉴 관리")').filter(':visible').click({ force: true });
       cy.wait(3000); 
      
      //검출탭 > 검출 메뉴 관리 > 메뉴관리 선택 
       cy.contains('.v-btn__content', '메뉴 관리').click({ force: true });
       cy.log('--- 화면 검증 시작 ---');
       // 검색조건 확인
       cy.contains('.c-headline', '검색 조건').should('exist');
       cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="HTTP Method"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
       cy.get('.v-label').filter(':visible').contains('메뉴 등록 필요').should('be.visible');
       cy.get('.v-label').filter(':visible').contains('오탐/확정').should('be.visible');
       // 파일선택 확인
       cy.get('input[type="file"][accept=".xls, .xlsx"]').filter(':visible').should('be.visible');
       // 버튼 확인 
       cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
       cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
       // 표 컬럼 확인
       cy.get('th').filter(':visible').contains('발견 일시').should('be.visible');
       cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
       cy.get('th').filter(':visible').contains('URI 주소').should('be.visible');
       cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
       cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
       cy.get('th').filter(':visible').contains('HTTP Method').should('be.visible');
       cy.get('th').filter(':visible').contains('처리').should('be.visible');
       cy.log('✅ 검출 - 검출메뉴관리 - [메뉴 관리] 출력 확인 완료 ');

      
       // 검출탭 > 검출 메뉴 관리 > URI 관리 선택 
       cy.contains('.v-btn__content', 'URI 관리').should('be.visible').click({ force: true });
       cy.wait(3000);
       cy.log('--- 화면 검증 시작 ---');
       // 검색조건 확인
       cy.contains('.c-headline', '검색 조건').should('exist');
       cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="HTTP Method"]').filter(':visible').should('be.visible');
       cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
       cy.get('.v-label').filter(':visible').contains('등록된 URI').should('be.visible');
       // 버튼 확인 
       cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
       // 표 컬럼 확인
       cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
       cy.get('th').filter(':visible').contains('HTTP Method').should('be.visible');
       cy.get('th').filter(':visible').contains('수집된 URI').should('be.visible');
       cy.get('th').filter(':visible').contains('등록된 URI').should('be.visible');
       cy.get('th').filter(':visible').contains('처리').should('be.visible');
       cy.get('th').filter(':visible').contains('수집 제외').should('be.visible');
       cy.log('✅ 검출 - 검출메뉴관리 - [URI 관리] 출력 확인 완료 ');



    // ==========================================
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 태스크 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("태스크")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 실행관리 탭 클릭 ---');
    cy.contains('.v-btn__content', '실행 관리').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '태스크 목록(MASTER)').should('exist');
    //버튼 확인
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 시작').should('be.visible');
    cy.contains('.v-btn__content', 'MASTER 태스크 전체 정지').should('be.visible');
    
    //프로세스 실행확인(프로세스 정지상태라면 시작문구로 버튼 변경되어있는상태 ) 
    cy.contains('p', 'Log Collector').should('be.visible');
    cy.contains('p', 'Log Collector').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Discriminator').should('be.visible');
    cy.contains('p', 'Discriminator').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Rule Analyzer').should('be.visible');
    cy.contains('p', 'Rule Analyzer').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.contains('p', 'Data File Cleaner').should('be.visible');
    cy.contains('p', 'Data File Cleaner').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');
    
    cy.contains('p', 'Statistics').should('be.visible');
    cy.contains('p', 'Statistics').closest('.v-card').contains('.v-btn__content', '정지').should('be.visible');

    cy.log('✅ 운영 - 태스크 - [실행관리] 출력 확인 완료 ');


    // 운영 > 태스크  > "리소스 모니터링" 탭을 클릭
    cy.log('--- 리소스 모니터링 탭 클릭 ---');
    cy.contains('.v-btn__content', '리소스 모니터링').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    //문구 아래 v버튼 확인  
    cy.contains('.c-headline', '3rd Party').should('exist');
    cy.contains('.c-headline', '3rd Party').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Background Process').should('exist');
    cy.contains('.c-headline', 'Background Process').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Foreground Process').should('exist');
    cy.contains('.c-headline', 'Foreground Process').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.contains('.c-headline', 'Log Tracer').should('exist');
    cy.contains('.c-headline', 'Log Tracer').closest('.v-card').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    cy.log('✅ 운영 - 태스크 - [리소스 모니터링 ] 출력 확인 완료 ');


 
     // 운영 > 태스크  > "로그 뷰" 탭을 클릭
     cy.log('--- 로그 뷰 탭 클릭 ---');
     cy.contains('.v-btn__content', '로그 뷰').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---'); 
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색기간 문구 확인
     cy.get('input[aria-label="기간"]').filter(':visible').should('be.visible').and('have.attr', 'readonly');
     //검색조건 달력 아이콘확인인
     cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
     //검색조건 입력란 확인인
     cy.get('input[aria-label="업무 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="로그 파일"]').filter(':visible').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('tail').should('be.visible');
     // 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     cy.log('✅ 운영 - 태스크 - [로그 뷰] 출력 확인 완료 ');


     // 운영 > 태스크  > "로그 다운로드" 탭을 클릭
     cy.log('--- 로그 다운로드 탭 클릭 ---');
     cy.contains('.v-btn__content', '로그 다운로드').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---'); 
     cy.contains('.c-headline', '검색 조건').should('exist');
     // 검색기간 문구 확인
     cy.get('input[aria-label="기간"]').filter(':visible').should('be.visible').and('have.attr', 'readonly');
     //검색조건 달력 아이콘확인인
     cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
     //검색조건 입력란 확인인
     cy.get('input[aria-label="태스크 그룹"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('태스크 그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('태스크 유형').should('be.visible');
     cy.get('th').filter(':visible').contains('파일 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('파일 크기').should('be.visible');
     cy.log('✅ 운영 - 태스크 - [로그 다운로드] 탭 화면 출력 확인 완료 ');

    
      // 운영 > 태스크  > "패키지 관리" 탭을 클릭
      cy.log('--- 패키지 관리 탭 클릭 ---');
      cy.contains('.v-btn__content', '패키지 관리').should('be.visible').click({ force: true });
      cy.wait(3000);
      cy.log('--- 화면 검증 시작 ---'); 
       //트리영역 새로고침 아이콘
       cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
       //트리영역 검색 버튼 아이콘
       cy.get('.v-icon.fa-search').filter(':visible').should('be.visible');
       //돋보기 버튼 클릭
       cy.log('--- 검색(돋보기) 버튼 클릭 ---');
       cy.get('.v-icon.fa-search').click({ force: true });
       cy.wait(1000); 
       cy.log('✅ 운영 - 태스크 - [패키지 관리] 출력 확인 완료 ');




    // 운영 > 실행플랜 서브메뉴 
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 실행 플랜 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("실행 플랜")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 스케줄러 탭 클릭 ---');
    cy.contains('.v-btn__content', '스케줄러').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
    // 정책목록  추가 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('추가').should('be.visible');
    // 정책목록 입력란 확인
    cy.get('span[title="정책 유형 선택 (ALL)"]').should('be.visible');
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     //체크박스
     cy.contains('label', '삭제/완료된 플랜 보기').parent().find('.v-input--selection-controls__input').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('삭제/완료된 플랜 보기').should('be.visible');

     // 표 컬럼 확인
    // 헤더(th) 안에 있는 체크박스 아이콘(check_box_outline_blank) 확인
    cy.get('th').find('.v-icon:contains("check_box_outline_blank")').should('exist');
    cy.get('th').filter(':visible').contains('플랜 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('작업 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');

    cy.contains('.c-headline', '정책 플랜 일정').should('exist');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_left').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_right').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('refresh').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('TODAY').should('be.visible');

    cy.contains('.c-headline', '일정 상세').should('exist');
    cy.contains('.c-headline', '일정 상세').closest('.v-card').find('th').as('detailHeader');
    //저장한 영역(@detailHeader) 안에서 컬럼명 확인
    cy.get('@detailHeader').contains('날짜').should('be.visible');
    cy.get('@detailHeader').contains('이름').should('be.visible'); 
    cy.get('@detailHeader').contains('상태').should('be.visible');
    cy.get('@detailHeader').contains('플랜 삭제 여부').should('be.visible');

    cy.log('✅ 운영 - 실행플랜 - [스케줄러] 출력 확인 완료 ');

 
 
    // 운영 > 태스크  > "실시간 모니터링" 탭을 클릭
    cy.log('--- 실시간 모니터링 탭 클릭 ---');
    cy.contains('.v-btn__content', '실시간 모니터링').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '탐색 실시간 모니터').should('exist');
    // > 아이콘확인
    cy.get('.sub-title-icon.fa-angle-right').should('be.visible')
     // 설명: 'sub-title-title' 클래스를 가진 요소 중 '진행 중인 탐색'이라는 글자가 포함된 요소 확인
    cy.contains('.sub-title-title', '진행 중인 탐색').should('be.visible');
    cy.log('✅ 운영 - 실행플랜 - [실시간 모니터링] 출력 확인 완료 ');
    
 

    // 운영 > 인사정보 서브메뉴 
    cy.contains('button', '운영').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 인사정보 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("인사정보")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 인사정보보  > "DB 연동" 탭을 클릭
    cy.log('--- DB 연동 탭 클릭 ---');
    cy.contains('.v-btn__content', 'DB 연동').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('생성자').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('삭제').should('be.visible');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 정책 추가 + 버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    cy.log('✅ 운영 - 인사정보 - [DB 연동] 출력 확인 완료 ');


    // 운영 > 인사정보보  > "외부 연동" 탭을 클릭
    cy.log('--- 외부 연동 탭 클릭 ---');
    cy.contains('button.tab-btn', '외부 연동').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 인사정보 - [외부 연동] 출력 확인 완료 ');


  
     // 운영 > 인사정보  > "AD 연동" 탭을 클릭
     cy.log('--- AD 연동 탭 클릭 ---');
     // 방법 2: button 태그이면서 tab-btn 클래스를 가진 요소 찾기
     cy.contains('button.tab-btn', 'AD 연동').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 인사정보 - [AD 연동] 출력 확인 완료 ');



     // 운영 > 외부 연동 서브메뉴 
    cy.contains('button', '운영').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 외부 연동 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("외부 연동")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 외부 연동  > "샤크라맥스 SQL 분석" 탭을 클릭
    cy.log('--- 샤크라맥스 SQL 분석 탭 클릭 ---');
    cy.contains('.v-btn__content', '샤크라맥스 SQL 분석').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 외부연동 - [샤크라맥스 SQL 분석] 출력 확인 완료 ');

     
    // 운영 > 외부 연동  > "원격 파일 다운로드" 탭을 클릭
     cy.log('--- 원격 파일 다운로드 탭 클릭 ---');
     cy.contains('.v-btn__content', '원격 파일 다운로드').should('be.visible').click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // 표 컬럼 확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible');
     // v버튼 아이콘 존재확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     // 정책 추가버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 운영 - 외부연동 - [원격 파일 다운로드] 출력 확인 완료 ');

  
 


    // ==========================================
    // STEP 12: 점검(대시보드) 서브메뉴 
    // ==========================================
    cy.log('🚀 점검 탭 클릭');
    cy.contains('button', '점검').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    // 설명: 'v-btn__content' 안에 '검색'이라는 글자가 있고, 눈에 보이는지 확인
    cy.contains('.v-btn__content', '검색').should('exist');
    //검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 달력 아이콘 확인
    cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
    //자동갱신안함 문구확인
    cy.contains('.item-margin', '자동 갱신 안함').should('be.visible');
    // 데이터량 확인
    cy.contains('p', '개인정보 사용량').should('be.visible');
    cy.contains('p', '개인정보 대량 접근').should('be.visible');
    cy.contains('p', '업무시간 외 접근').should('be.visible');
    cy.contains('p', '접근 IP 주소').should('be.visible');
    cy.contains('p', '정보 사용자').should('be.visible');
    cy.contains('p', '접근 부서').should('be.visible');

    // 설명: 카드 제목(.v-card__title) 중에서 '개인정보 유형별 현황' 글자가 눈에 보이는지 확인
    cy.contains('.v-card__title', '개인정보 유형별 현황').should('be.visible');
    cy.contains('.v-card__title', '부서별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', 'IP주소별 개인정보 사용 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황').should('be.visible');
    cy.contains('.v-card__title', '개인정보 사용자 TOP 10').should('be.visible');
    cy.contains('.v-card__title', '이상행위 유형별 현황').should('be.visible');
    cy.log('✅ 점검 대시보드 출력 및 차트 타이틀 확인 완료 ');



    */
    

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

/*
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
    cy.get('th').filter(':visible').contains('타입').should('be.visible');
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
    cy.contains('span', '인사정보(ON)').filter(':visible').should('be.visible');
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
     cy.get('input[aria-label="상태"]').should('exist').and('be.visible');
     // 토글 문구 확인
     cy.get('label').filter(':visible').contains('라이선스 사용 여부').should('be.visible');
     // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('상태').should('be.visible');
     cy.get('th').filter(':visible').contains('사용건수').should('be.visible');
     cy.get('th').filter(':visible').contains('라이선스 사용 여부').should('be.visible');
     cy.log('✅ 관리 - 시스템 - [접속기록 수집기- 통합조회]탭 출력 확인 완료 ');

 
     // 관리 > 시스템 > 차단 관리 탭  클릭
    cy.get('.v-btn__content').filter(':visible').contains('차단 관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
     //달력 아이콘 확인
     //cy.get('.material-icons').filter(':visible').contains('event').should('be.visible');
     // 시작날짜 달력 아이콘확인
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="계정"]').filter(':visible').should('be.visible');
     // like버튼 확인 
     cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
     // IP입력란 확인인
     cy.get('input[aria-label="시작 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="종료 IP"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('차단 날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('마지막 접속 날짜').should('be.visible');
     cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
     cy.get('th').filter(':visible').contains('로그 수집기').should('be.visible');
     cy.get('th').filter(':visible').contains('사용자 아이피').should('be.visible');
     cy.get('th').filter(':visible').contains('계정').should('be.visible');
     cy.get('th').filter(':visible').contains('차단 해제').should('be.visible');
     cy.log('✅ 관리 - 시스템 - [차단 관리]탭 출력 확인 완료 ');

  

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
    cy.get('.v-btn__content').filter(':visible').contains('관리').last().click({ force: true });
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
     cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
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
    // 관리 > 클러스터링 서버 관리 서브메뉴 선택 
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(3000);
    cy.log('--- 서브메뉴 [클러스터링 서버 관리] 클릭 ---');
    //  cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('관리').click({ force: true });
    cy.contains('.v-list__tile__title', '클러스터링 서버 관리').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 클러스터링 서버 관리 > [개인정보 탐색 서버(포그라운드 전용)] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('개인정보 탐색 서버(포그라운드 전용)').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    cy.contains('.c-headline', '개인정보 탐색 서버').should('exist');
    // 정책 추가 + 버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('아이디').should('be.visible');
    cy.get('th').filter(':visible').contains('서버 타입').should('be.visible');
    cy.get('th').filter(':visible').contains('서버 프로토콜').should('be.visible');
    cy.get('th').filter(':visible').contains('서버 ip').should('be.visible');
    cy.get('th').filter(':visible').contains('PORT').should('be.visible');
    cy.get('th').filter(':visible').contains('상세 설명').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('관리').should('be.visible');
    cy.log('✅ 관리 - 클러스터링 서버 관리 - [개인정보 탐색 서버(포그라운드 전용)]탭 출력 확인 완료 ');


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
    cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('파일 다운로드 그룹').should('be.visible');
    cy.get('th').filter(':visible').contains('제목').should('be.visible');
    cy.get('th').filter(':visible').contains('파일명').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
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
    cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
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

*/
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
    // STEP 14: 관리자 -설정 탭 서브메뉴 
    // ==========================================
    // 1. 관리자 페이지 사이드 메뉴 중 '설정' 버튼 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    //cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    cy.contains('span', '설정').closest('button.side-menu').click({ force: true });
    // 설정 > 패스워드 규칙 서브메뉴 클릭 
    cy.wait(2000)
    cy.log('--- 서브메뉴 [패스워드 규칙] 클릭 ---');
    //cy.get('.v-list__tile__title').filter(':contains("패스워드 규칙")').filter(':visible').click({ force: true });
    cy.contains('.v-list__tile__title', '패스워드 규칙').should('be.visible').closest('a, .v-list__tile').click({ force: true });
    //cy.contains('패스워드 규칙', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
  
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '패스워드 규칙').should('exist');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 패스워드 규칙 확인
    cy.get('input[aria-label="최소 패스워드 길이"]').should('be.visible');
    cy.get('input[aria-label="최대 패스워드 길이"]').should('be.visible');
    cy.get('input[aria-label="연속된 문자 연속 사용 금지"]').should('be.visible');
    cy.get('input[aria-label="동일한 문자 연속 사용 금지"]').should('be.visible');
    cy.get('input[aria-label="숫자, 특수문자 사용"]').should('be.visible');
    // 숫자 특수문자 선택 v 아이콘 확인 
    cy.get('.material-icons').filter(':visible').contains('arrow_drop_down').should('be.visible');
    cy.get('input[aria-label="최근 변경 이력 내에서 동일 패스워드 사용 금지"]').should('be.visible');
    // 토글 확인
    cy.contains('label', '대문자 포함').filter(':visible').should('be.visible');
    cy.contains('label', '소문자 포함').filter(':visible').should('be.visible');
    cy.contains('label', '계정의 전화번호 사용 금지').filter(':visible').should('be.visible');
    cy.contains('label', '계정의 이메일 주소 사용 금지').filter(':visible').should('be.visible');
    cy.contains('label', '첫 글자 문자만 허용').filter(':visible').should('be.visible');
    
    cy.contains('.c-headline', '패스워드 사용 불가 목록').should('exist');
    //패스워드 사용 불가 목록" 글자를 먼저 찾고 -> 부모 영역으로 올라가서 -> 그 안에 있는 화살표
    cy.contains('패스워드 사용 불가 목록').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 패스워드 사용불가목록  콤보박스 아이콘 
    cy.get('input[role="combobox"]').filter(':visible').should('be.visible');
    cy.get('.v-select--chips').find('.v-input__icon--append .material-icons').should('be.visible');
    // 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('내보내기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    //v3.0.3.0_R34785 취소 버튼 없어짐 
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    cy.log('✅ 설정 - [패스워드 규칙] 출력 확인 완료');

 
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기

    // 설정 > 관리자 > [계정관리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('계정관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    // =================================================
    // 1. [권한 그룹] 섹션 검증 (첫 번째 테이블)
    // =================================================
    cy.contains('.c-headline', '권한 그룹').should('exist');
    // v버튼 확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 1번 테이블 헤더 확인 (첫 번째 테이블은 eq(0) 생략 가능하지만 명시하면 더 안전함)
    cy.get('table').first().within(() => {
    cy.contains('th', '이름').should('be.visible');
    cy.contains('th', '설명').should('be.visible');
    cy.contains('th', '소속된 관리자').should('be.visible');
    cy.contains('th', '읽기 전용').should('be.visible');
    });
    // 1번 추가 버튼 확인
    cy.get('.grid-add-button').first().should('be.visible');
    // =================================================
    // 2. [관리자 계정] 섹션 검증 (두 번째 테이블)
    // =================================================
    cy.contains('.c-headline', '관리자 계정').should('exist');
    // v버튼 확인 (부모 찾기 방식 유지 - 아주 좋습니다)
    cy.contains('관리자 계정').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 2번 테이블 헤더 확인 (핵심 수정 부분 ⭐)
    // 작성하신 eq(1) 로직을 '모든 컬럼'에 적용합니다.
    cy.get('table').eq(1).within(() => {
    // 이 안에서는 오직 '두 번째 테이블' 내부만 검사합니다.
    cy.contains('th', '아이디').should('be.visible');
    cy.contains('th', '이름').should('be.visible');      // 중복 문제 완벽 해결!
    cy.contains('th', '상태').should('be.visible');      // 혹시 1번 테이블에 상태가 생겨도 안전함
    cy.contains('th', '권한 그룹').should('be.visible');
    cy.contains('th', '이메일').should('be.visible');
    cy.contains('th', '접속 가능 IP').should('be.visible');
   });
   // 2번 추가 버튼 확인 (작성하신 코드)
   cy.get('.grid-add-button').eq(1).should('be.visible');
   cy.log('✅ 설정 - 관리자 - [계정관리] 출력 확인 완료');

     
    // 설정 > 관리자 > [라이선스] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('라이선스').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '발급 라이선스 정보').should('exist');
     // v버튼 확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 라이선스키 가져오기 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('라이선스 키 가져오기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('라이선스 변경').should('be.visible');
    //발급 아이디 문구확인
    cy.get('input[aria-label="발급 아이디"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="국가"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="발급 일시"]').filter(':visible').should('be.visible');
    cy.contains('.c-headline', 'LOG CATCH').should('exist');
    // v버튼 확인 (부모 찾기 방식 유지 - 아주 좋습니다)
    cy.contains('LOG CATCH').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 라이선스 유형 문구확인
    cy.contains('th', '라이선스 유형').filter(':visible').should('be.visible');
    cy.contains('th', 'Log Tracer 가용 대수').filter(':visible').should('be.visible');
    cy.log('✅ 설정 - 관리자 - [라이선스] 출력 확인 완료');


    // 설정 > 관리자 > [계정 정보 관리 규칙] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('계정 정보 관리 규칙').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '계정 정보 관리 규칙').should('exist');
    cy.get('input[aria-label="기본 인증 방식"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 변경 주기"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 오류 시 잠금 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 오류 시 잠금 시간 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="장기 미사용 기간 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="자리 비움"]').filter(':visible').should('be.visible');
    cy.contains('label', '대소문자 구분없는 접속계정 허용').filter(':visible').should('be.visible');
    //저장 버튼확인 
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    cy.log('✅ 설정 - 관리자 - [계정 정보 관리 규칙] 출력 확인 완료');

 

    // 설정 > 관리자 > [운영 이력] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('운영 이력').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    //검색 입력문구확인 
    cy.get('input[aria-label="관리자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="IP"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="검색 대상"]').filter(':visible').should('be.visible'); 
    //검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('순번').should('be.visible');
    cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('발생자').should('be.visible');
    cy.get('th').filter(':visible').contains('IP').should('be.visible');
    cy.get('th').filter(':visible').contains('이벤트').should('be.visible');
    cy.get('th').filter(':visible').contains('보안 객체').should('be.visible');
    cy.get('th').filter(':visible').contains('대상').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('결과').should('be.visible');
    cy.log('✅ 설정 - 관리자 - [운영 이력] 출력 확인 완료');

   
     // 설정 > 관리자 > [관리자 알림] 탭 클릭
     cy.get('.v-btn__content').filter(':visible').contains('관리자 알림').last().click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // v버튼 확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     //표열 문구확인
     cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('타입').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible')
     // 정책 추가 + 버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 설정 - 관리자 - [관리자 알림] 출력 확인 완료');


    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    
    // 설정 > SMTP 설정 서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [SMTP 설정] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("SMTP 설정")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', 'SMTP 설정').should('exist');
    //설정 확인
    cy.get('input[aria-label="SMTP 호스트"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 포트"]').filter(':visible').should('be.visible');
    cy.contains('label', '인증 여부').filter(':visible').should('be.visible');
    cy.contains('label', 'SMTPS 사용 여부').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 계정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 비밀번호"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="전송자 E-Mail"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="전송자 이름"]').filter(':visible').should('be.visible');
    
    //버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    // 3.0.3.0_R34785 버전에서 취소버튼 사라짐 
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('접속 테스트').should('be.visible');
    cy.log('✅ 설정 - SMTP 설정 출력 확인 완료');

    
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 재시작 설정 서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [재시작 설정] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("재시작 설정")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '재 시작').should('exist');
    //토글 버튼 문구 확인
    cy.contains('label', '재시작 수행').filter(':visible').should('be.visible');
    // 비활성화된 입력창 확인코드 
    cy.contains('label', '재시작 수행').closest('.v-card').find('input[disabled]').should('be.visible');
    //시간 문구확인 
    cy.get('.font-weight-bold').filter(':visible').contains('시간').should('be.visible');
    cy.get('input[aria-label="시"]').should('be.visible')
    cy.get('input[aria-label="분"]').should('be.visible')
    //cy.get('input[aria-label="초"]').should('be.visible')
    // v 아이콘 확인하는 코드
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 저장 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    cy.log('✅ 설정 - 재시작 설정 화면 출력 확인 완료');


    // ==========================================
    // STEP : 관리자페이지-> 일반 모드 점검페이지로로(대시보드)로 복귀
    // ==========================================
    cy.log('🏠 대시보드 아이콘 클릭 (일반 모드로 복귀)');
    // 1. [검증] 대시보드(구름 모양) 아이콘이 보이는지 확인
    // 설명: 'g-IDashboard' 클래스가 대시보드 아이콘의 고유 식별자입니다.
    cy.get('.g-IDashboard').should('be.visible');
    // 2. [클릭] 아이콘 클릭
    cy.get('.g-IDashboard').should('be.visible').click({ force: true });
    // 3. [대기] 화면 전환 기다림
    cy.wait(2000);
    // 4. [확인] 일반 모드로 잘 돌아왔는지 URL이나 요소로 확인 (선택사항)
    // 예: 다시 '점검' 버튼이 보이는지 확인
    cy.contains('button', '점검').should('exist');

    cy.log('✅ 일반 점검페이지지 모드 복귀 완료');



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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BlYy5jeS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUFBLFFBQVEsQ0FBQyxlQUFlLEVBQUUsTUFBTTtFQUM5QkMsRUFBRSxDQUFDLFFBQVEsRUFBRSxNQUFNO0lBQ2pCQyxFQUFFLENBQUNDLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQztFQUN4QyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL2N5cHJlc3MvZTJlL3NwZWMuY3kuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUoJ3RlbXBsYXRlIHNwZWMnLCAoKSA9PiB7XHJcbiAgaXQoJ3Bhc3NlcycsICgpID0+IHtcclxuICAgIGN5LnZpc2l0KCdodHRwczovL2V4YW1wbGUuY3lwcmVzcy5pbycpXHJcbiAgfSlcclxufSkiXSwibmFtZXMiOlsiZGVzY3JpYmUiLCJpdCIsImN5IiwidmlzaXQiXSwic291cmNlUm9vdCI6IiJ9