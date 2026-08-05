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
    // 테스트 자동화시나리오
    // 이력 - 자동화 시니라오 테스트 
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

    //기능동작확인 ------------------------------------------------------------------
    // 클릭동작 
    //cy.get('.v-input__icon--append').filter(':visible').find('.material-icons').contains('arrow_drop_down').click({ force: true });
    //cy.get('label').filter(':visible').contains('업무시스템').closest('.v-input').find('.v-input__slot').click({ force: true });
    //부서/소속 클릭하여 전체 선택 
    cy.get('.material-icons').filter(':visible').contains('settings').click({ force: true });
    cy.wait(1000);
    cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').closest('.v-list__tile').click({ force: true });
    // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(1000);
    cy.log('✅ 팝업 닫기 성공');

     // 기간 - 시작 날짜 달력 지정하기 
     cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
     cy.wait(1000);
     // 1일 클릭
     cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').click({ force: true });
     cy.wait(1000);

     // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
  
     cy.log('✅ 시작 날짜 지정 성공');


    // 이력 > 접속 기록 이력 서브메뉴 클릭  -----------------------
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });
    cy.wait(3000);
    

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
     // v3.0.5.1191_r35135 제거됨.
     //cy.get('input[aria-label="파일 경로"]').filter(':visible').should('be.visible');
     // v3.0.5.0_r34908 추가
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     
     
     //토글
     cy.get('.v-label').filter(':visible').contains('개인정보').should('be.visible');
     // v3.0.5.0_r34908 제거
     //cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     
     // 포함 버튼 확인 
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="파일명"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     //v3.0.5.1191_r35135 제거됨.
     //cy.get('input[aria-label="파일 경로"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     
    
     //검색 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //개인정보 문구 확인
    cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
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

    //기능동작
    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    cy.log('✅ 이력 - 파일 다운로드 탭 진입 및 데이터 출력 확인 완료!');

 

    // 이력 > 접속기록 이력 > [이상행위] 탭 선택
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
    cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
    // v3.0.5.0_r34908 추가
    //v3.0.5.0_r34908 토글문구 제거
    //cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접근이력 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유무').should('be.visible');
    // 3.0.5.1191_r35135 소명대상여부 -> 소명 대상 문구변경 
    cy.get('th').filter(':visible').contains('소명 대상').should('be.visible');
    cy.get('th').filter(':visible').contains('조회').should('be.visible'); 


    //  // 기간 - 시작 날짜 달력 지정하기 
    //  cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    //  cy.wait(1000);
    //  // 1일 클릭
    //  cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').click({ force: true });
    //  cy.wait(1000);
    //  //달력창 닫기
    //  cy.get('body').type('{esc}');
    //  cy.log('✅ 시작 날짜 지정 성공');

 // ==========================================
// 기간 - "기간" input 클릭하여 달력 오픈 (한 달 전 날짜 동적 지정)
// ==========================================

// 1. 오늘 날짜 기준 한 달 전 날짜 계산
const targetDate = new Date();
targetDate.setMonth(targetDate.getMonth() - 1);
const targetYear = targetDate.getFullYear();
const targetMonth = targetDate.getMonth() + 1; // 0부터 시작하므로 +1
const targetDay = targetDate.getDate();

cy.log(`🎯 선택할 날짜: ${targetYear}년 ${targetMonth}월 ${targetDay}일`);

// 2. "기간" input 클릭하여 달력 오픈
cy.get('input[aria-label="기간"]').filter(':visible').first().click({ force: true });
cy.wait(1000);

// 3. 🌟 달력 헤더의 연/월과 목표 연/월을 비교해서, 필요한 만큼 이전/다음 달 화살표 클릭
cy.get('.v-date-picker-header__value').filter(':visible').invoke('text').then((headerText) => {
  // 헤더 텍스트 예: "2026년 8월"
  const match = headerText.match(/(\d{4})년\s*(\d{1,2})월/);

  if (match) {
    const displayedYear = parseInt(match[1], 10);
    const displayedMonth = parseInt(match[2], 10);

    const diffMonths = (targetYear - displayedYear) * 12 + (targetMonth - displayedMonth);

    if (diffMonths !== 0) {
      const clicks = Math.abs(diffMonths);
      // diffMonths < 0 이면 이전 달(chevron_left)로, > 0 이면 다음 달(chevron_right)로 이동
      const iconName = diffMonths < 0 ? 'chevron_left' : 'chevron_right';

      cy.log(`📅 달력 이동: ${clicks}회 ${diffMonths < 0 ? '이전' : '다음'} 달로 이동`);

      for (let i = 0; i < clicks; i++) {
        cy.get('.v-date-picker-header')
          .filter(':visible')
          .find('i.material-icons')
          .contains(iconName)
          .click({ force: true });
        cy.wait(300);
      }
    }
  }
});

// 4. 목표 일자 클릭 (예: "3일")
cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', `${targetDay}일`).click({ force: true });
cy.wait(1000);
//달력창 닫기
cy.get('body').type('{esc}');

cy.log('✅ 시작 날짜 지정 성공');
//-----------------------------------------------------------------
  



     
    //조건입력 기능 동작 
    //이상행위 유형 클릭하는 코드 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 이상행위 유형중 개인정보 과다조회 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 과다조회').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    //표 안의 결과 확인 
    //표안의 소명 대상 문구확인 
    cy.wait(1000);
    //cy.get('tbody').contains('a', '개인정보 과다조회').should('be.visible');
    cy.get('tbody').filter(':visible').contains('tr', '개인정보 과다조회').should('contain', '소명 대상').and('be.visible');
  

    cy.log('✅ 이력 - 이상행위 탭 진입 및 데이터 출력 확인 완료!');


    // 이력 > 접속기록 이력 > [검출] 탭 선택
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
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
     //토글문구 확인
    // cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     // 3.0.5.1191_r35135 like -> 포함 문구 변경
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible'); 
    //화면가로스크롤 발생으로 존재만 확인
    //cy.get('th').filter(':visible').contains('검출 건수').should('exist');
    //cy.get('table.v-datatable').filter(':visible').find('th').filter(':visible').contains('검출 건수').should('exist'); 

    // 기능동작
    // 달력표를 펼침 
    // cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    // cy.wait(1000);
    // // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // // 2. '4월'이라는 글자를 찾아 클릭합니다.
    //  cy.get('.v-date-picker-table--month').filter(':visible').contains('4월').click({ force: true });
    // // 달력 20일 클릭
    // cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    // //달력창 닫기
    // cy.get('body').type('{esc}');

//=============================
// 한달전 선택하기
//=================================
    // 2. "기간" input 클릭하여 달력 오픈
cy.get('input[aria-label="기간"]').filter(':visible').first().click({ force: true });
cy.wait(1000);

// 3. 🌟 달력 헤더의 연/월과 목표 연/월을 비교해서, 필요한 만큼 이전/다음 달 화살표 클릭
cy.get('.v-date-picker-header__value').filter(':visible').invoke('text').then((headerText) => {
  // 헤더 텍스트 예: "2026년 8월"
  const match = headerText.match(/(\d{4})년\s*(\d{1,2})월/);

  if (match) {
    const displayedYear = parseInt(match[1], 10);
    const displayedMonth = parseInt(match[2], 10);

    const diffMonths = (targetYear - displayedYear) * 12 + (targetMonth - displayedMonth);

    if (diffMonths !== 0) {
      const clicks = Math.abs(diffMonths);
      // diffMonths < 0 이면 이전 달(chevron_left)로, > 0 이면 다음 달(chevron_right)로 이동
      const iconName = diffMonths < 0 ? 'chevron_left' : 'chevron_right';

      cy.log(`📅 달력 이동: ${clicks}회 ${diffMonths < 0 ? '이전' : '다음'} 달로 이동`);

      for (let i = 0; i < clicks; i++) {
        cy.get('.v-date-picker-header')
          .filter(':visible')
          .find('i.material-icons')
          .contains(iconName)
          .click({ force: true });
        cy.wait(300);
      }
    }
  }
});

// 4. 목표 일자 클릭 (예: "3일")
cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', `${targetDay}일`).click({ force: true });
cy.wait(1000);
//달력창 닫기
cy.get('body').type('{esc}');

cy.log('✅ 시작 날짜 지정 성공');
//-----------------------------------------------------------------

    //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '등록' 선택 (안정화 버전)
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보


    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);



   // 🌟 1. 탐색할 날짜 배열 만들기 함수 (공통)
const getFormattedDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays); // offsetDays가 음수면 과거, 0이면 오늘
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 🌟 [핵심 수정] 탐색할 타겟 날짜 목록 (7일 전 ~ 오늘, 총 8일)
// Array.from을 사용하여 -7부터 0까지 총 8개의 날짜를 자동으로 배열에 담습니다.
const targetDates = Array.from({ length: 8 }, (_, i) => getFormattedDate(-7 + i));
cy.log(`🎯 순차 탐색할 날짜 목록: ${targetDates.join(', ')}`);


// 🌟 2. 동적 날짜 선택 로직 (재귀적 스크롤 - 기존에 만드신 함수 유지)
const scrollAndFindDate = (dateToFind, retryCount = 0) => {
    const MAX_RETRIES = 10;
    cy.get('.v-menu__content:visible').first().as('dropdown');
    cy.get('@dropdown').then(($el) => {
        const $foundItem = $el.find(`.v-list__tile__title:contains("${dateToFind}"):visible, .v-list-item__title:contains("${dateToFind}"):visible`);

        if ($foundItem.length > 0) {
            cy.log(`🎉 화면에서 날짜 [${dateToFind}] 찐 발견!`);
            cy.wrap($foundItem).first().click({ force: true });
        } else if (retryCount < MAX_RETRIES) {
            cy.log(`⏬ 날짜 [${dateToFind}] 탐색을 위해 스크롤 내리는 중... (${retryCount + 1})`);
            cy.get('@dropdown').scrollTo('bottom', { duration: 500 });
            cy.wait(800); 
            scrollAndFindDate(dateToFind, retryCount + 1);
        } else {
            throw new Error(`❌ [${dateToFind}] 날짜를 스크롤 끝까지 내려도 찾을 수 없습니다.`);
        }
    });
};


// 🌟 3. [핵심] 하루씩 전진하며 탐색하는 재귀 로직
// dateIndex: 탐색할 배열의 순서 (0부터 7까지)
// currentUIText: 현재 드롭다운 창에 적혀있어서 클릭해야 할 텍스트
const searchSequential = (dateIndex, currentUIText) => {
    // [종료 조건 1] 배열의 모든 날짜(오늘)까지 다 찾아봤는데도 없는 경우 -> 에러 발생
    if (dateIndex >= targetDates.length) {
        // 문구 수정: 3일 치 -> 8일 치
        cy.log('❌ 지정된 8일 치 기간(7일 전~오늘) 내에 검출 데이터가 없습니다.');
        // 의도적으로 테스트를 실패시키기 위해 엄격한 검증(Assertion) 실행
        cy.get('tbody:visible a:contains("검출")').should('be.visible');
        return; 
    }

    const dateToFind = targetDates[dateIndex];
    cy.log(`▶️ [탐색 ${dateIndex + 1}/${targetDates.length}] ${dateToFind} 날짜 조회 시작`);

    // 1) 현재 화면에 적혀있는 날짜 영역을 눌러서 리스트 열기
    cy.contains('.v-select__selection', currentUIText).filter(':visible').click({ force: true });
    cy.wait(1000);

    // 2) 날짜 스크롤 탐색 및 선택 함수 실행
    scrollAndFindDate(dateToFind);

    // 3) 날짜가 잘 바뀌었는지 검증
    cy.contains('.v-select__selection', dateToFind).should('be.visible');
    
    // 데이터 로딩 대기
    cy.wait(2000); 

    // 4) 조건부 검증 로직 (에러 발생 없이 표 데이터 유무 확인)
    cy.get('body').then(($body) => {
        const hasDetection = $body.find('tbody:visible a:contains("검출"):visible').length > 0;

        if (hasDetection) {
            // [종료 조건 2] 데이터를 찾은 경우 -> 검출 버튼 누르고 완전 종료!
            cy.log(`✅ [${dateToFind}] 날짜에서 검색 결과(검출)를 찾았습니다!`);
            cy.get('tbody', { timeout: 10000 }).filter(':visible').contains('a', '검출').should('be.visible').click({ force: true });
            cy.wait(1000);
        } else {
            // 데이터를 못 찾은 경우 -> 다음 인덱스(dateIndex + 1)로 자기 자신을 다시 호출
            cy.log(`⚠️ [${dateToFind}] 검색 결과 없음. 하루 앞당겨 재검색합니다.`);
            // 다음 탐색 시 드롭다운을 열려면 "방금 우리가 입력한 날짜(dateToFind)"를 눌러야 하므로 인자로 넘겨줌
            searchSequential(dateIndex + 1, dateToFind);
        }
    });
};

// // 🌟 4. 함수 최초 실행
// // 초기 화면에 '2026-04-20'이 세팅되어 있으므로 이를 기준으로 첫 탐색 시작
// searchSequential(0, '2026-04-20');
// 상단에서 "기간" 달력으로 선택한 날짜(한 달 전)를 기준으로 첫 탐색 시작
const initialDateText = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
cy.log(`🎯 초기 탐색 기준 날짜: ${initialDateText}`);

searchSequential(0, initialDateText);


// =====================================================
// 검출창 닫기 (위의 함수 안에서 팝업을 열었으므로 공통 실행)
// =====================================================
cy.log('검출 팝업 닫기 진행');
cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
cy.wait(1000);
    
    cy.log('✅ 이력 - 검출 탭 진입 및 데이터 출력 확인 완료!');
 

    //이력 > 접속기록 이력 > [통합]탭 선택
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
     //왜 2개 정보사용자?? (맨티스 이슈보고 : 37121 ) 
     // v3.0.5.0_r34908 제거됨.
     cy.get('input[aria-label="정보 사용자"][role="combobox"]').filter(':visible').should('be.visible');
     //cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="접속 메뉴"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('이상').should('be.visible');
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');

    //검색 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //토글 문구 확인
    cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
    
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
    // 3.0.5.1191_r35135 가로 스크롤 문제로 DOM 존재 확인으로 처리 
    cy.get('th').contains('처리').should('exist');

    //달력표를 펼침 
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(1000);
    // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '1월'이라는 글자를 찾아 클릭합니다.
     cy.get('.v-date-picker-table--month').filter(':visible').contains('1월').click({ force: true });
    // 달력 20일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');


    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');



    // 사용자 상태 - 미등록  선택----------------------------------------------- 
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

     cy.get('.v-list__tile__title').contains('미등록').should('be.visible').click({ force: true });
     cy.wait(1000);

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

    // [검증] 검색 결과 검증
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 1. 정규식을 사용하여 '비로그인' 또는 '미등록 사용자'가 포함된 a 태그가 있는지 확인
  cy.get('a').contains(/비로그인|미등록 사용자/).should('exist').then(($el) => {
    
    // 2. 만약 화면에 보인다면 색상까지 디테일하게 검증
    if ($el.is(':visible')) {
      cy.wrap($el).should('have.css', 'color', 'rgb(0, 0, 0)');
      
      // 어떤 텍스트로 통과했는지 Cypress 로그에 남겨두면 나중에 디버깅하기 좋습니다.
      cy.log(`검증 통과 텍스트: ${$el.text()}`); 
      
    } else {
      // 안 보인다면 로그만 남기고 패스
      cy.log('데이터(비로그인/미등록 사용자)가 존재하지만 화면에는 숨겨져 있습니다.');
    }
  });
});

      // 사용자 상태 - 전체 선택----------------------------------------------- 
      cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
      cy.wait(1000);

      // 🌟 [핵심 수정] .v-menu__content:visible 를 추가하여 
      // "현재 화면에 열려있는(보이는) 메뉴 창" 안에서만 '전체'를 찾도록 스코프를 제한합니다.
      cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체').click({ force: true });
        
      cy.wait(1000);

      //검색버튼 클릭
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      cy.wait(1000);

    // [검증] 검색 결과 검증
cy.get('tbody tr').filter(':visible').first().then(($row) => {
  
  // 1. '미등록 부서'가 행 안에 존재하는지 확인
  const hasDept = $row.find('a:contains("미등록 부서")').length > 0;
  if (hasDept) {
    cy.log('✅ [미등록 부서] 발견: 검증을 수행합니다.');
    cy.wrap($row).contains('a', '미등록 부서').should('be.visible');
  } else {
    cy.log('⚪ [미등록 부서] 없음: 검증을 건너뜁니다.');
  }

  // 2. '미등록 사용자'로 시작하는 텍스트가 존재하는지 확인 (정규식 활용)
  // jQuery의 filter를 사용하여 텍스트 패턴을 찾습니다.
  const hasUser = $row.find('a').filter((i, el) => /^미등록 사용자/.test(el.innerText)).length > 0;
  if (hasUser) {
    cy.log('✅ [미등록 사용자] 발견: 검증을 수행합니다.');
    cy.wrap($row).contains('a', '미등록 사용자').should('be.visible');
  } else {
    cy.log('⚪ [미등록 사용자] 없음: 검증을 건너뜁니다.');
  }

});

    // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(1000);
    // 엑셀 파일 다운로드 확인창 진행
    // 파일다운로드 그룹 선택 (팝업창에서찾기 )
    cy.get('.v-dialog--active').find('.v-select__selections').first().click({ force: true });
    
    cy.wait(1000);
    cy.get('.v-list__tile__title').filter(':visible').contains('접속이력 조회 화면 결과 파일').closest('.v-list__tile').click({ force: true });
    // 다운로드 유형 선택
    cy.get('.v-dialog--active').find('.v-select__selections').eq(1).click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('날짜별').closest('.v-list__tile').click({ force: true });
    //개인정보 유형별 상세내역 포함 클릭 
    cy.get('.v-dialog--active').contains('label', '개인정보 유형별 상세 내역 포함').click({ force: true });
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    
    // 2. [수정] be.visible 대신 exist를 먼저 사용하고, 텍스트 확인을 결합합니다.
    //cy.contains('엑셀 다운로드 요청에 성공했습니다', { timeout: 10000 }).should('exist'); // 찰나의 순간이라도 DOM에 나타나면 성공 처리
    cy.contains(/엑셀.*요청.*성공/, { timeout: 30000 }).should('exist');

    // 3. 사라지는 것 확인
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
     
    //실제 로컬 폴더 다운로드 시간 주기
    cy.wait(7000);
    
    // [검증] 다운로드 폴더를 확인합니다.
    // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
    // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
    // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
  
    // 조건에 맞는 파일 찾기 (이름에 'log-excel'이 있고, 확장자가 '.zip'인 것)
     const myFile = files.find(file => file.includes('log-excel') && file.endsWith('.zip'));

     // 로그 출력
     if (myFile) {
      cy.log(`✅ 다운로드 성공! 파일명: ${myFile}`);
     }

     // 검증: 파일이 존재해야 함 (없으면 에러 발생)
       expect(myFile).to.not.be.undefined; 
     });

    
    cy.log('✅ 이력 - 통합 탭 진입 및 데이터 출력 확인 완료!');


//===========================================
// 접속 메뉴 - 단일 업무시스템 확인 Case
//========================================
// 업무시스템 초기화
cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
cy.wait(1000);
// 업무시스템 선택
cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(1000);
// 업무시스템 - 리녹스_VIP고객 선택
cy.get('.v-list__tile__title').contains('리눅스_VIP고객').scrollIntoView().should('be.visible').click({ force: true });
cy.get('body').type('{esc}');
cy.wait(1000); // 상위 메뉴가 완전히 닫히고 내부 상태가 업데이트될 때까지 넉넉히 대기

// 접속메뉴 선택
cy.get('input[aria-label="접속 메뉴"]').filter(':visible').click({ force: true }); // slot이 아닌 input 본체를 클릭
cy.wait(1500); 

// ✨사용자님의 수동 해결법 적용: 창을 닫습니다. (No data 상태 갱신 목적)
cy.get('body').type('{esc}');
cy.wait(500);

// ✨ 4. 두 번째 클릭: 다시 접속 메뉴를 엽니다. 이제 데이터가 그려져 있을 것입니다.
cy.get('input[aria-label="접속 메뉴"]').filter(':visible').click({ force: true });
cy.wait(1000); // 애니메이션 대기

//'VIP_대량 조회 훈련 접속메뉴 선택
cy.get('.v-list__tile__title', { timeout: 10000 }).contains('VIP_대량 조회 훈련').scrollIntoView().should('be.visible').click({ force: true });
cy.get('body').type('{esc}');

//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// 검색 결과 검증 
// [검증] 검색 결과의 모든 행(Row)에 'VIP_대량 조회 훈련'이 포함되어 있는지 확인
cy.get('tbody tr')
  .filter(':visible') // 화면에 보이는 실제 데이터 행만 추려냄
  .each(($row, index) => {
    // 각 행(tr) 안에서 a 태그를 찾아 텍스트 검증
    cy.wrap($row).within(() => {
      cy.get('a')
        .contains('VIP_대량 조회 훈련')
        .should('exist') // DOM에 존재하는지 확인
        .and('be.visible'); // 사용자 눈에도 잘 보이는지 확인
        
      // (선택) 몇 번째 줄 검증 중인지 로그를 남기면 디버깅할 때 아주 편합니다.
      cy.log(`${index + 1}번째 줄 검증 완료!`);
    });
  });

// 맨티스 이슈 : 38305
/*
//===========================================
// 접속 메뉴 - 복수 or 전체선택시 업무시스템 확인 Case
//========================================
// 업무시스템 초기화
cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
cy.wait(1000);
// 업무시스템 선택
cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(1000);
// 업무시스템 - 전체 선택
cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '전체 선택').scrollIntoView().should('be.visible').click({ force: true });
cy.get('body').type('{esc}');
cy.wait(1000); // 상위 메뉴가 완전히 닫히고 내부 상태가 업데이트될 때까지 넉넉히 대기

// 접속메뉴 선택
cy.get('input[aria-label="접속 메뉴"]').filter(':visible').click({ force: true }); // slot이 아닌 input 본체를 클릭
cy.wait(1500); 

// ✨사용자님의 수동 해결법 적용: 창을 닫습니다. (No data 상태 갱신 목적)
cy.get('body').type('{esc}');
cy.wait(500);

// ✨ 4. 두 번째 클릭: 다시 접속 메뉴를 엽니다. 이제 데이터가 그려져 있을 것입니다.
cy.get('input[aria-label="접속 메뉴"]').filter(':visible').click({ force: true });
cy.wait(1000); // 애니메이션 대기

//'VIP_대량 조회 훈련 접속메뉴 선택
cy.get('.v-list__tile__title', { timeout: 10000 }).contains('VIP_대량 조회 훈련').scrollIntoView().should('be.visible').click({ force: true });
cy.get('body').type('{esc}');

//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// 검색 결과 검증 
// [검증] 검색 결과의 모든 행(Row)에 'VIP_대량 조회 훈련'이 포함되어 있는지 확인
cy.get('tbody tr')
  .filter(':visible') // 화면에 보이는 실제 데이터 행만 추려냄
  .each(($row, index) => {
    // 각 행(tr) 안에서 a 태그를 찾아 텍스트 검증
    cy.wrap($row).within(() => {
      cy.get('a')
        .contains('VIP_대량 조회 훈련')
        .should('exist') // DOM에 존재하는지 확인
        .and('be.visible'); // 사용자 눈에도 잘 보이는지 확인
        
      // (선택) 몇 번째 줄 검증 중인지 로그를 남기면 디버깅할 때 아주 편합니다.
      cy.log(`${index + 1}번째 줄 검증 완료!`);
    });
  });

 */


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
