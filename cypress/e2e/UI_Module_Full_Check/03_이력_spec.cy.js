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

  
  it('로그캐치 UI 기본체크', () => {

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
          .contains('확정')
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
    // 2.9.1.262_r35274 조회-> 선택 
    cy.get('th').filter(':visible').contains('선택').should('be.visible');
    cy.log('✅ 이력 - 사용자 추적 화면 출력 확인 완료!');



    // 이력 > 접속 기록 이력 서브메뉴 클릭
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '접속기록 이력'' 글자를 찾아 클릭
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
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="파일 명"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="파일 명"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     
     //2.9.1.262_r35274 추가사항
     // [UI 확인] 개인정보 유형 (선택한 유형을 모두 포함) 콤보박스
     cy.get('input[aria-label="개인정보 유형 (선택한 유형을 모두 포함)"]').filter(':visible').should('be.visible').and('have.attr', 'role', 'combobox');
     // [UI 확인] 사용자 상태 콤보박스
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible').and('have.attr', 'role', 'combobox');
    // [UI 확인] 엑셀 다운로드 버튼
    cy.get('.v-btn__content:visible').contains('엑셀 다운로드').should('be.visible').find('.material-icons').should('contain.text', 'get_app');
     
     
     //토글
     cy.get('.v-label').filter(':visible').contains('개인정보').should('be.visible');

     //v3.0.5.1191_R35135 like ->  파일 경로 제거됨. 
     //cy.get('input[aria-label="파일 경로"]').filter(':visible').should('be.visible');

     // v3.0.5.0_r34908 -> 제외됨.
     //cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     
     // v3.0.4.0_R34865 like ->  포함 문구로 버튼문구 변경됨.
     //cy.get('.v-chip__content').filter(':visible').contains('like').should('be.visible');
   
   
     //v3.0.5.1191_R35135 like ->  파일 경로 제거됨. 
     //cy.get('input[aria-label="파일 경로"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     
    
     //검색 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //개인정보 문구 확인
    cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
    // (v3.0.5.0_r34908) 제외됨.
    //cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    
    //표열 문구확인
    //2.9.1.262_r35274 표 문구 변경됨. (URL/메뉴 명, 파일크기, 건수, 확정, 파일다운로드)
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자 IP').should('be.visible');
    cy.get('th').filter(':visible').contains('URL/메뉴 명').should('be.visible');
    cy.get('th').filter(':visible').contains('업무 시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('파일 명').should('be.visible');
    cy.get('th').filter(':visible').contains('파일 크기').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('건수').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 상세').should('be.visible');
    cy.get('th').filter(':visible').contains('확정').should('be.visible');
    cy.get('th').filter(':visible').contains('파일 다운로드').should('be.visible');
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
    //토글문구확인
    //v3.0.5.0_r34908 -> 제외됨. 
    //cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 문구확인
    //v3.0.5.0_r34908 -> 제외됨.
    //cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접근이력 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('이상행위 정책').should('be.visible');
    cy.get('th').filter(':visible').contains('경보 등급').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유무').should('be.visible'); 
    //v3.0.5.1191_R35135 문구변경됨 소명 대상 여부 -> 소명대상  
    cy.get('th').filter(':visible').contains('소명 대상').should('be.visible');
    // 2.9.1.262_r35274 조회 -> 선택으로 문구 변경됨. 
    cy.get('th').filter(':visible').contains('선택').should('be.visible'); 
    
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
     //v3.0.5.0_r34908 -> 제외됨. 
     //cy.get('.v-label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
     // like버튼 확인
     // v3.0.4.0_R34865 like ->  포함 문구로 버튼문구 변경됨.
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 문구확인
    //v3.0.5.0_r34908 -> 제외됨. 
    //cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    //cy.get('th').filter(':visible').contains('검출 건수').should('be.visible'); 
    //3.0.5.1191_r35135  가로스크롤 영향으로 존재로 확인 
    cy.get('th').contains('검출 건수').should('exist'); 
    
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
     //v3.0.5_r34908  버전에서 정보 사용자 중복 없어짐 
     cy.get('input[aria-label="정보 사용자"][role="combobox"]').filter(':visible').should('be.visible');
     //cy.get('input[aria-label="정보 사용자"]:not([role="combobox"])').filter(':visible').should('be.visible');
     //cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="접속 메뉴"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당목 추가됨 
     cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
     // v3.0.4.0_R34865d에서 ≥  -> 이상 한글문구로 표기확인  
     cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('이상').should('be.visible');
     //3.0.3.0_R34785에서 해당목 추가됨 
     //엑셀다운로드 버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').should('be.visible');
     // 검색버튼 존재 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // 전체 건수 버튼 존재확인 
     cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
     //토글 문구 확인
     cy.get('label').filter(':visible').contains('개인정보').should('be.visible');
     //v3.0.5.0_r34908 -> 제외됨.
     //cy.get('label').filter(':visible').contains('미등록 사용자 제외').should('be.visible');
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
      //3.0.5.1191_r35135  가로스크롤 영향으로 존재로 확인 
     cy.get('th').contains('처리').should('exist'); 
     cy.log('✅ 이력 - 통합 탭 진입 및 데이터 출력 확인 완료!');



    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 UI 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
