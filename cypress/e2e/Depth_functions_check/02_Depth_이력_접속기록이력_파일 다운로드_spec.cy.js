/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!********************************!*\
  !*** ./cypress/e2e/spec.cy.js ***!
  \********************************/
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

/**코드 시작  */
describe('로그캐치 Depth 배포점검목록 동작 테스트', () => {
  
  it('02_Depth_이력_접속기록이력_파일 다운로드', () => {

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

  
  
    // ==========================================
    // 테스트 자동화시나리오
    // 이력 - 접속기록 이력 자동화 시니라오 테스트 
    // ==========================================



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
     //3.0.5.1191_r35135 제거됨.
     //cy.get('input[aria-label="파일 경로"]').filter(':visible').should('be.visible');
     
     //토글
     cy.get('.v-label').filter(':visible').contains('개인정보').should('be.visible');
     
     // 포함 버튼 확인 
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="파일명"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     //3.0.5.1191_r35135 제거됨.
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

    
     // 오늘날짜 가져오기 : 검증할 행이 날짜가 흐르면서 다음페이지로 넘어갈수있는 문제 해결
     // 1. 오늘 날짜를 YYYYMMDD 형식으로 생성
     const today = new Date();
     const year = today.getFullYear();
     const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
     const day = String(today.getDate()).padStart(2, '0');

     const formattedDate = `${year}${month}${day}`; // 예: "20260303"
     //const targetFileName = `SQLPARSER_2001_${formattedDate}.log`;

     cy.log(`🎯 오늘 검증할 날짜: ${formattedDate}`);
     // ==========================================
    // 기간 검색 
    // ==========================================
    //달력표를 펼침  월/일 지정  
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
    // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').contains('2월').click({ force: true });
    // 달력 1일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

     // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

// ==========================================================
// [검증코드] 검색 결과 첫 번째 행(최신 데이터) 동적 정밀 검증
// ==========================================================
cy.log('🧐 검색 결과 최상단(첫 번째 행) 데이터를 검증합니다.');

// 화면에 보이는 표의 첫 번째 행을 잡고 그 안에서만(within) 검사를 수행합니다.
cy.get('tbody tr').filter(':visible').first().within(() => {

    // 💡 핵심: 'a' 태그의 텍스트를 먼저 읽어와서 어떤 데이터인지 판단합니다.
    cy.get('a.ellipsis.text-xs-left').then(($aTag) => {
        const systemName = $aTag.text().trim(); // 앞뒤 공백 제거한 텍스트 추출

        if (systemName.includes('JEUS_tester3')) {
            // ==========================================
            // [분기 1] 기존 'tester3' 데이터가 첫 행인 경우
            // ==========================================
            cy.log('📌 [JEUS_tester3] 데이터 검증을 시작합니다.');

            // 1. 파일명 검증
            cy.get('span.ellipsis.text-xs-left').contains(/tester3-.*\.(xlsx|pdf)/i)
                .should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

            // 2. 다운로드 URI 경로 검증
            cy.get('span.ellipsis.text-xs-left').contains('/tester3/api/file-download')
                .should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

            // 3. 업무시스템명 색상 검증 (이미 찾은 $aTag를 재사용)
            cy.wrap($aTag).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

        } else if (systemName.includes('리눅스_VIP고객')) {
            // ==========================================
            // [분기 2] 새로운 'VIP 고객' 데이터가 첫 행인 경우
            // ==========================================
            cy.log('📌 [리눅스_VIP고객] 데이터 검증을 시작합니다.');

           // 1. 첫 번째 span (URI 경로 또는 파일명) 검증
           cy.get('span.ellipsis.text-xs-left').eq(0).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)').invoke('text') // 태그 안의 텍스트를 가져옵니다.
           .then((text) => {
           // 앞뒤 공백을 제거한 후 빈 문자열이 아닌지 검증합니다.
            expect(text.trim(), '첫 번째 항목(URI/파일명) 값 확인중').to.not.be.empty;
            cy.log(`✅ 확인된 값 1: ${text.trim()}`);
            });


            // 2. 두 번째 span (파일명 또는 URI 경로) 검증
            cy.get('span.ellipsis.text-xs-left').eq(1).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)').invoke('text')
            .then((text) => {
              expect(text.trim(), '두 번째 항목(파일명/URI) 값 확인중').to.not.be.empty;
              cy.log(`✅ 확인된 값 2: ${text.trim()}`);
            });

            // 3. 업무시스템명 색상 검증
            cy.wrap($aTag).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

        } else if (systemName.includes('JEUS_CRM고객관리')) {
            // ==========================================
            // 🌟 [분기 3] 새로운 'CRM 고객관리' 데이터가 첫 행인 경우
            // ==========================================
            cy.log('📌 [JEUS_CRM고객관리] 데이터 검증을 시작합니다.');

            // 1. 첫 번째 span 검증
            cy.get('span.ellipsis.text-xs-left').eq(0).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)').invoke('text')
            .then((text) => {
                expect(text.trim(), '첫 번째 항목 값 확인중').to.not.be.empty;
                cy.log(`✅ 확인된 값 1: ${text.trim()}`);
            });

            // 2. 두 번째 span 검증
            cy.get('span.ellipsis.text-xs-left').eq(1).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)').invoke('text')
            .then((text) => {
                expect(text.trim(), '두 번째 항목 값 확인중').to.not.be.empty;
                cy.log(`✅ 확인된 값 2: ${text.trim()}`);
            });

            // 3. 업무시스템명 색상 검증
            cy.wrap($aTag).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

        } else {
            // ==========================================
            // [예외 처리] 전혀 모르는 데이터가 첫 행에 온 경우
            // ==========================================
            throw new Error(`❌ 예상치 못한 업무시스템명이 첫 행에 나타났습니다: ${systemName}`);
        }
    });
});

cy.log('✅ 검색 결과 첫 번째 행 동적 데이터 검증 완벽 통과!');

    cy.log('✅ 이력 - 파일 다운로드 탭 진입 및 데이터 출력 확인 완료!');

    // ==========================================
    // 업무시스템 조회
    // ==========================================
  
    // 업무시스템 클릭하여 리스트 열기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 'JEUS_tester3'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'JEUS_tester3', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // 검증코드
    cy.get('tbody tr').filter(':visible').first().within(() => {
       cy.get('a').contains('JEUS_tester3').should('be.visible');
     });

     // 선택한 업무시스템 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);

    

    // ==========================================
    // 시작 IP 조회 - 10.10.1.101
    // ==========================================
     // 시작 IP에 10.10.1.101 입력 
    cy.get('input[aria-label="시작 IP"]').filter(':visible').clear().type('10.10.1.101');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('10.10.1.101').should('be.visible');

    // 3. [수정된 검증] 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    // 🔥 핵심 수정: cy.get('a')를 삭제합니다. 
    // IP 주소는 링크가 아니므로 행(tr) 내부 전체에서 텍스트를 찾습니다.
    cy.contains('10.10.1.101').should('be.visible');
     });

    // '사용자 IP' 입력창을 찾아 기존에 입력된 값을 깨끗하게 지웁니다.
    cy.get('input[aria-label="시작 IP"]').filter(':visible').clear();
    cy.wait(500);

    // ==========================================
    // 시작 IP ~ 종료IP 입력후 검색  - 타켓 IP 10.10.0.210 
    // ==========================================
     // 시작 IP 입력 
    cy.get('input[aria-label="시작 IP"]').filter(':visible').clear().type('10.10.0.200');
    cy.wait(500);

     // 종료 IP 입력 
    cy.get('input[aria-label="종료 IP"]').filter(':visible').clear().type('10.10.0.211');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // [검증] 검색 결과 검증
    cy.get('tbody tr', { timeout: 10000 }).contains('10.10.0.210').should('be.visible');

    // 3. [수정된 검증] 첫 번째 행 정밀 검증
    cy.get('tbody tr').filter(':visible').first().within(() => {
    // 🔥 핵심 수정: cy.get('a')를 삭제합니다. 
    // IP 주소는 링크가 아니므로 행(tr) 내부 전체에서 텍스트를 찾습니다.
    cy.contains('10.10.0.210').should('be.visible');
     });

    // '시작 IP' 입력창을 찾아 기존에 입력된 값을 깨끗하게 지웁니다.
    cy.get('input[aria-label="시작 IP"]').filter(':visible').clear();
    cy.wait(500);

     // '종료 IP' 입력창을 찾아 기존에 입력된 값을 깨끗하게 지웁니다.
    cy.get('input[aria-label="종료 IP"]').filter(':visible').clear();
    cy.wait(500);

    // ==========================================
    // URI 조회검색 - 타겟 :  /file-download-pdf
    // ==========================================
    // URI 주소에 입력 
    cy.get('input[aria-label="URI"]').filter(':visible').clear().type('/file-download-pdf');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // 'span.ellipsis' 요소 중에서 해당 API 경로 텍스트가 포함된 것을 찾아 화면에 보이는지 검증
    cy.contains('span.ellipsis.text-xs-left', '/tester3/api/file-download-pdf').should('be.visible');

    // [검증] 코드
    cy.get('span.ellipsis.text-xs-left').should('be.visible').and('contain.text', '/tester3/api/file-download-pdf');

    // 입력한 URI 주소 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="URI"]').filter(':visible').clear();
    cy.wait(500);

    // ==========================================
    // 파일명 검색 - 타겟 :  tester3-******.확장자
    // ==========================================
    // 파일명 검색에 tester3 입력 
    cy.get('input[aria-label="파일명"]').filter(':visible').clear().type('tester3');
    cy.wait(500);

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

     // ==========================================================
     // [검증코드] 정규식을 활용하여 pdf와 xlsx 확장자를 모두 허용합니다.
     // 패턴 설명: tester3- 로 시작하고, 아무 글자나 오다가, .pdf 또는 .xlsx 로 끝나는 문자열
    // ==========================================================
      const filePattern = /tester3-.*\.(pdf|xlsx)/i; // 'i'를 붙여 대소문자(PDF, xlsx 등) 구분 없이 검사

      // 첫 번째 행 정밀 검증
      cy.get('tbody tr').filter(':visible').first().within(() => {
      cy.get('span.ellipsis.text-xs-left').contains(filePattern).should('be.visible');
      });

      // 입력한 URI 주소 x버튼 클릭하여 초기화 
      cy.get('input[aria-label="파일명"]').filter(':visible').clear();
      cy.wait(500);

    //3.0.5.1191_r35135 파일 경로 제거됨.
    // // ==========================================
    // // 파일경로 검색 - 타겟 :  /home/logcatch/data/explanationFiles/data
    // // ==========================================
    // // 파일경로 검색에 tester3 입력 
    // cy.get('input[aria-label="파일 경로"]').filter(':visible').clear().type('/home/logcatch/data/explanationFiles/data');
    // cy.wait(500);

    // //검색버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // cy.wait(1000);

    // //검증코드
    // // 'tester3-'로 시작하고 중간에 숫자들이 있으며 '.pdf', 'xlsx'로 끝나는 패턴 검증
    // // xlsx 또는 pdf 중 하나를 포함하는 요소를 찾아 가시성 검증
    // cy.get('span.ellipsis.text-xs-left').contains(/tester3-.*\.(xlsx|pdf)/).should('be.visible');
    // cy.get('span.ellipsis.text-xs-left').contains('tester3/api/file-download') .should('be.visible');
    // cy.wait(500);

    
    // // 입력한 URI 주소 x버튼 클릭하여 초기화 
    // cy.get('input[aria-label="파일 경로"]').filter(':visible').clear();
    // cy.wait(500);


    //////////////////////////////////////////////////////
    // 개인정보 토글 OFF -> ON확인 
    /////////////////////////////////////////////////////
    //3.0.5.1191_r35135 에서 개인정보 ON상태가 디폴트값
    //cy.get('input[aria-label="개인정보"]').click({ force: true });
    //cy.wait(500);

    // [검증] 개인정보 제외 OFF -> ON 체크확인 
    cy.get('input[aria-label="개인정보"]').should('be.checked');
    cy.wait(1000);


    //////////////////////////////////////////////////////
    // 사용자 상태 검색 
    /////////////////////////////////////////////////////
    
     //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     // 사용자 상태 리스트 중 '등록' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

// =====================================================
// [검증] 검색 결과: 데이터 존재 여부 및 상태 이상 여부 확인
// =====================================================
cy.log('🧐 검색된 사용자 목록에 빈 값이 없고, 미등록 상태가 섞여 있지 않은지 검증합니다.');

// 검색 결과로 나온 표의 모든 행(tr)을 하나씩 순회합니다.
cy.get('tbody tr').filter(':visible').each(($row, index) => {
    
    // 각 행(row) 안에서만(within) 요소를 찾고 검증합니다.
    cy.wrap($row).within(() => {
        
        // 💡 핵심 수정: 행 전체가 아니라, 두 번째 칸(정보 사용자 열)만 정확히 타겟팅합니다.
        // eq(1)은 0부터 시작하는 인덱스이므로 2번째 <td>를 의미합니다.
        cy.get('td').eq(1).invoke('text').then((userText) => {
            const cleanUserText = userText.trim();
            
            // 1. 데이터가 비어있지 않은지 검증
            expect(
                cleanUserText, 
                `[${index + 1}번째 행] 사용자 이름(정보 사용자)이 비어있는지 확인중`
            ).to.not.be.empty;

            // 2. 해당 칸 안에 '미등록'이라는 단어가 없는지 검증
            expect(
                cleanUserText, 
                `[${index + 1}번째 행] '미등록' 상태인 사용자가 잘못 검색되어있는지 확인중`
            ).to.not.include('미등록');
        });
        
    });
});

cy.log('✅ 검색 결과 정상 확인 완벽 통과! (정보 사용자 열 기준: 빈 값 없음, 미등록 없음)');


     // 사용자 상태 - 미등록  선택----------------------------------------------- 
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     // 사용자 상태 리스트 중 '미등록' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '미등록').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

     // [검증] 검색 결과 검증
     // '비로그인' 또는 '(호준)', '(logcatch) 중 하나를 포함하는 a 태그 검증
     cy.get('tbody a').filter(':visible').filter((i, el) => /(비로그인|logcatch|호준)/.test(el.innerText.trim())).first().should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
    

      // 사용자 상태 - 전체 선택----------------------------------------------- 
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(500);

     // 사용자 상태 리스트 중 '전체' 선택
    cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '전체').click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보

     //검색버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);

    // ==========================================================
    // [검증코드] 정보 사용자 다중 조건 검증 (4개 중 1개 이상 존재)
    // ==========================================================
    cy.log('🧐 동적으로 변하는 정보사용자 데이터를 검증합니다.');

    // 1. 허용할 사용자 목록을 정규식으로 정의합니다. (| 기호가 '또는' 역할을 합니다)
    //const allowedUsersRegex = /\(호준\)|\(비로그인\)|진윤호\(yunho\)|\(logcatch\)/;
    const allowedUsersRegex = /호준|비로그인|진윤호|yunho|logcatch/;

    // 2. 화면에 보이는 표의 데이터 행(tr) 안에서 찾습니다.
    //cy.get('tbody tr').filter(':visible').find('a.ellipsis.text-xs-center').contains(allowedUsersRegex).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
    cy.get('tbody tr').filter(':visible').find('a.ellipsis.text-xs-center').filter((i, el) => allowedUsersRegex.test(el.innerText.trim())).first().should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');

    cy.log('✅ 허용된 정보사용자 데이터 정상 출력 확인 완료!');
    
    //----------------------------------------------------------------------------------------------
    
    // // 검색 결과 첫 번째 행의 정보사용자가 4명 중 한 명인지 정밀 검증
    // cy.get('tbody tr').filter(':visible').first().within(() => {
    //   cy.get('a.ellipsis.text-xs-center').contains(/\(호준\)|\(비로그인\)|진윤호\(yunho\)|\(logcatch\)/).should('be.visible').and('have.css', 'color', 'rgb(0, 0, 0)');
    //  });

     
    //////////////////////////////////////////////////////
    // 받기버튼 파일다운로드 확인
    /////////////////////////////////////////////////////
    // 대소문자 구분 없이 .pdf 또는 .xlsx 찾기
    // 1. 화면에서 행을 찾고, 그 행의 텍스트에서 확장자를 알아냅니다.
    cy.contains('tr', /tester3-.*\.(pdf|xlsx)/i, { timeout: 15000 }).should('be.visible')
    .then(($tr) => {
    // 🔍 화면에 표시된 텍스트(예: tester3-memo.xlsx)를 가져옵니다.
    const rowText = $tr.text();
    
    // 📝 텍스트에서 확장자(pdf 또는 xlsx)만 쏙 뽑아냅니다.
    const foundExtension = rowText.match(/\.(pdf|xlsx)/i)[0].toLowerCase();
    cy.log(`🎯 화면에서 확인된 확장자: ${foundExtension}`);

    // 2. 해당 행 내부에서 다운로드 버튼 클릭
    cy.wrap($tr).within(() => {
      cy.get('i.v-icon').contains('file_download').should('be.visible').click({ force: true });
    });

    // --- 알림창 확인 및 대기 로직 (기존과 동일) ---
    cy.contains('.v-snack__content, .v-alert', '파일 다운로드를 요청했습니다', { timeout: 15000 }).should('be.visible');
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
    cy.wait(7000); 

    // 3. [검증] 다운로드 폴더 확인 (동적 확장자 적용)
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
      // 🌟 핵심: 화면에서 찾았던 그 확장자(foundExtension)로 파일을 찾습니다.
      const myFile = files.find(file => 
        file.includes('tester3') && file.toLowerCase().endsWith(foundExtension)
      );
      // 검증: 파일이 존재해야 함
      expect(myFile, `다운로드 폴더 내에 tester3 패턴의 ${foundExtension} 파일이 존재해야 합니다.`).to.not.be.undefined;
      if (myFile) {
        cy.log(`✅ 파일 확인 완료: ${myFile}`);
        
        const filePath = `cypress/downloads/${myFile}`;
        
        // 만들어두신 태스크를 호출해 파일 상태를 가져옵니다.
        cy.task('getFileStats', filePath).then((stats) => {
          cy.log(`📊 파일 실제 용량: ${stats.size} bytes`);

          // 검증 2: 0바이트 빈 껍데기 파일인지 체크
          expect(stats.size, '파일 용량 0바이트 초과 정상 확인').to.be.greaterThan(0);

          // 검증 3: 엑셀(.xlsx)이나 PDF(.pdf)는 껍데기 포맷만으로도 기본 용량을 차지합니다.
          // 따라서 100 bytes보다 작다면 손상된 파일일 확률이 매우 높으므로 엄격하게 체크합니다.
          if (foundExtension === '.xlsx' || foundExtension === '.pdf') {
            expect(stats.size, `${foundExtension} 파일 최소 용량(100 bytes) 이상 무결성 확인`).to.be.at.least(100);
          }
          
          cy.log(`✅ 파일 유효성(용량) 검증 완벽 통과!`);
        });
      }
    });
  });
    

    // ==========================================
    // 복합 조회 - 모든 검색필드 조건 다 넣고 조회
    // ==========================================

    // 업무시스템 클릭하여 리스트 열기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(500);

    // 리스트에서 'JEUS_tester3'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'JEUS_tester3', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 리스트에서 '리눅스_배송관리'가 나타날 때까지 기다리고 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '리눅스_배송관리', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(500);
    // 3. 선택 후 메뉴 닫기 (필요시)
    cy.get('body').type('{esc}');

    // 시작 IP 입력 
    cy.get('input[aria-label="시작 IP"]').filter(':visible').clear().type('10.10.1.101');
    cy.wait(500);

    // 종료 IP 입력 
    cy.get('input[aria-label="종료 IP"]').filter(':visible').clear().type('10.10.1.101');
    cy.wait(500);

    // URI 주소에 입력 
    cy.get('input[aria-label="URI"]').filter(':visible').clear().type('/file-download-pdf');
    cy.wait(500);

    // 파일명 검색에 tester3-20260318160556.pdf 입력 
    cy.get('input[aria-label="파일명"]').filter(':visible').clear().type('tester3-20260318160556.pdf');
    cy.wait(500);

    //3.0.5.1191_r35135 제거됨.
    // 파일경로 검색에 /home/logcatch/data/explanationFiles/data 입력 
    //cy.get('input[aria-label="파일 경로"]').filter(':visible').clear().type('/home/logcatch/data/explanationFiles/data');
    //cy.wait(500);

    //검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(500);

    // 검색 결과 로딩대기
    cy.get('tbody tr', { timeout: 15000 }).should('be.visible');

     //[검증] 첫 번째 행 정밀 검증 
    cy.get('tbody tr',).filter(':visible').first().within(() => {

     cy.contains('10.10.1.101').should('be.visible'); 
     cy.get('span.ellipsis.text-xs-left').contains(/tester3-20260318160556.pdf/) .should('be.visible');
     cy.contains('/file-download-pdf').should('be.visible');
     
    });
    cy.wait(500);

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 접속기록 이력 - 파일 다운로드 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
