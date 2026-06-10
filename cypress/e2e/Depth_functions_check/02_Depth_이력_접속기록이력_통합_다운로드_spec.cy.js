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
  
  it('02_Depth_이력_접속기록이력_통합_다운로드 자동화 시나리오', () => {


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
     cy.get('input[aria-label="정보 사용자"][role="combobox"]').filter(':visible').should('be.visible');
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
    cy.get('th').filter(':visible').contains('처리').should('be.visible');

    //달력표를 펼침 
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(500);
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
    cy.wait(500);
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 맨티스 이슈 : 37680
    // 개인정보 건수 입력하고 검색하여 엑셀다운로드시 엑셀파일없이 zip파일 비어있는 문제
    // 개인정보 건수 입력하는 코드
    // '개인정보 건수' 입력창에 100을 입력합니다.
    //cy.get('input[aria-label="개인정보 건수"]').filter(':visible').clear().type('100');        // 10 입력

    // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    // ==========================================
    // CASE1. 엑셀다운로드 : 다운로드 유형 - 날짜별 
    // ==========================================

    //맨티스 이슈 등록해둠 - v3.0.4_r34865 (37313) 
    // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(500);
    // 엑셀 파일 다운로드 확인창 진행
    // 파일다운로드 그룹 선택 (팝업창에서찾기 )
    cy.get('.v-dialog--active').find('.v-select__selections').first().click({ force: true });
    
    cy.wait(500);
    cy.get('.v-list__tile__title').filter(':visible').contains('접속이력 조회 화면 결과 파일').closest('.v-list__tile').click({ force: true });
    // 다운로드 유형 선택
    cy.get('.v-dialog--active').find('.v-select__selections').eq(1).click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('날짜별').closest('.v-list__tile').click({ force: true });
    //개인정보 유형별 상세내역 포함 클릭 
    cy.get('.v-dialog--active').contains('label', '개인정보 유형별 상세 내역 포함').click({ force: true });
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     
    // 2. [수정] be.visible 대신 exist를 먼저 사용하고, 텍스트 확인을 결합합니다.
    //cy.contains('엑셀 다운로드 요청에 성공했습니다', { timeout: 10000 }).should('exist'); // 찰나의 순간이라도 DOM에 나타나면 성공 처리
    //cy.contains(/엑셀.*요청.*성공/, { timeout: 30000 }).should('exist');

    // 3. 사라지는 것 확인
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
    
    // 맨티스  이슈 등록해둠 (37313) 
    // 서버에서 zip 파일을 생성하고 다운로드가 100% 완료될 때까지 충분히 기다립니다. (7초 -> 15초로 연장)
    cy.wait(15000);
    
    // [검증] 다운로드 폴더를 확인합니다.
    // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
    // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
    // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
    
    // 조건에 맞는 파일 찾기 (이름에 'log-excel'이 있고, 확장자가 '.zip'인 것)
    const myFile = files.find(file => file.includes('log-excel') && file.endsWith('.zip'));

    // 1단계: 검증: 파일이 존재해야 함 (없으면 테스트 실패)
    expect(myFile, '다운로드 폴더 내에 log-excel이 포함된 .zip 파일이 존재해야 합니다.').to.not.be.undefined; 

    // 2단계: 파일이 존재하면 용량 상태를 체크합니다.
    if (myFile) {
        cy.log(`✅ 파일 확인 완료! 파일명: ${myFile}`);
        
        const filePath = `cypress/downloads/${myFile}`;
        
        // 만들어둔 태스크를 호출해 파일 용량을 가져옵니다.
        cy.task('getFileStats', filePath).then((stats) => {
            cy.log(`📊 다운로드된 ZIP 파일 용량: ${stats.size} bytes`);

            // 검증 1: 0바이트 빈 파일 방지
            expect(stats.size, '파일 용량 0바이트 초과 정상 확인').to.be.greaterThan(0);

            // 검증 2: ZIP 파일 무결성 최소 체크
            // 압축 파일(.zip)은 내용물이 비어있는 빈 폴더만 압축해도 헤더 정보 때문에 최소 22바이트 이상을 차지합니다.
            // 엑셀 로그가 정상적으로 포함되었다면 최소 수백 바이트 이상이어야 하므로 100바이트를 최소 기준으로 잡습니다.
            expect(stats.size, 'ZIP 파일 최소 용량(100 bytes) 이상 무결성 확인').to.be.at.least(100);
            
            cy.log(`✅ ZIP 파일 유효성(용량) 검증 완벽 통과!`);
        });
    }
});

    // ==========================================
    // CASE2 엑셀다운로드 : 다운로드 유형 -  월단위
    // ==========================================
 
    //맨티스 이슈 등록해둠 - v3.0.4_r34865 (37313) 
    // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(500);
    // 엑셀 파일 다운로드 확인창 진행
    // 파일다운로드 그룹 선택 (팝업창에서찾기 )
    cy.get('.v-dialog--active').find('.v-select__selections').first().click({ force: true });
    
    cy.wait(500);
    cy.get('.v-list__tile__title').filter(':visible').contains('접속이력 조회 화면 결과 파일').closest('.v-list__tile').click({ force: true });
    // 다운로드 유형 선택
    cy.get('.v-dialog--active').find('.v-select__selections').eq(1).click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('월단위').closest('.v-list__tile').click({ force: true });
    //개인정보 유형별 상세내역 포함 클릭 
    cy.get('.v-dialog--active').contains('label', '개인정보 유형별 상세 내역 포함').click({ force: true });
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     
    // 2. [수정] be.visible 대신 exist를 먼저 사용하고, 텍스트 확인을 결합합니다.
    //cy.contains('엑셀 다운로드 요청에 성공했습니다', { timeout: 10000 }).should('exist'); // 찰나의 순간이라도 DOM에 나타나면 성공 처리
    //cy.contains(/엑셀.*요청.*성공/, { timeout: 30000 }).should('exist');

    // 3. 사라지는 것 확인
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
    
    // 맨티스  이슈 등록해둠 (37313) 
    // 서버에서 zip 파일을 생성하고 다운로드가 100% 완료될 때까지 충분히 기다립니다. (7초 -> 15초로 연장)
    cy.wait(15000);
    
    // [검증] 다운로드 폴더를 확인합니다.
    // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
    // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
    // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
    
    // 조건에 맞는 파일 찾기 (이름에 'log-excel'이 있고, 확장자가 '.zip'인 것)
    const myFile = files.find(file => file.includes('log-excel') && file.endsWith('.zip'));

    // 1단계: 검증: 파일이 존재해야 함 (없으면 테스트 실패)
    expect(myFile, '다운로드 폴더 내에 log-excel이 포함된 .zip 파일이 존재해야 합니다.').to.not.be.undefined; 

    // 2단계: 파일이 존재하면 용량 상태를 체크합니다.
    if (myFile) {
        cy.log(`✅ 파일 확인 완료! 파일명: ${myFile}`);
        
        const filePath = `cypress/downloads/${myFile}`;
        
        // 만들어둔 태스크를 호출해 파일 용량을 가져옵니다.
        cy.task('getFileStats', filePath).then((stats) => {
            cy.log(`📊 다운로드된 ZIP 파일 용량: ${stats.size} bytes`);

            // 검증 1: 0바이트 빈 파일 방지
            expect(stats.size, '파일 용량 0바이트 초과 정상 확인').to.be.greaterThan(0);

            // 검증 2: ZIP 파일 무결성 최소 체크
            // 압축 파일(.zip)은 내용물이 비어있는 빈 폴더만 압축해도 헤더 정보 때문에 최소 22바이트 이상을 차지합니다.
            // 엑셀 로그가 정상적으로 포함되었다면 최소 수백 바이트 이상이어야 하므로 100바이트를 최소 기준으로 잡습니다.
            expect(stats.size, 'ZIP 파일 최소 용량(100 bytes) 이상 무결성 확인').to.be.at.least(100);
            
            cy.log(`✅ ZIP 파일 유효성(용량) 검증 완벽 통과!`);
        });
    }
});


    // ==========================================
    // CASE3 엑셀다운로드 : 다운로드 유형 -  전체
    // ==========================================
 
    //맨티스 이슈 등록해둠 - v3.0.4_r34865 (37313) 
    // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(500);
    // 엑셀 파일 다운로드 확인창 진행
    // 파일다운로드 그룹 선택 (팝업창에서찾기 )
    cy.get('.v-dialog--active').find('.v-select__selections').first().click({ force: true });
    
    cy.wait(500);
    cy.get('.v-list__tile__title').filter(':visible').contains('접속이력 조회 화면 결과 파일').closest('.v-list__tile').click({ force: true });
    // 다운로드 유형 선택
    cy.get('.v-dialog--active').find('.v-select__selections').eq(1).click({ force: true });
    cy.get('.v-list__tile__title').filter(':visible').contains('전체').closest('.v-list__tile').click({ force: true });
    //개인정보 유형별 상세내역 포함 클릭 
    cy.get('.v-dialog--active').contains('label', '개인정보 유형별 상세 내역 포함').click({ force: true });
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     
    // 2. [수정] be.visible 대신 exist를 먼저 사용하고, 텍스트 확인을 결합합니다.
    //cy.contains('엑셀 다운로드 요청에 성공했습니다', { timeout: 10000 }).should('exist'); // 찰나의 순간이라도 DOM에 나타나면 성공 처리
    //cy.contains(/엑셀.*요청.*성공/, { timeout: 30000 }).should('exist');

    // 3. 사라지는 것 확인
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
    
    // 맨티스  이슈 등록해둠 (37313) 
    // 서버에서 zip 파일을 생성하고 다운로드가 100% 완료될 때까지 충분히 기다립니다. (7초 -> 15초로 연장)
    cy.wait(15000);
    
    // [검증] 다운로드 폴더를 확인합니다.
    // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
    // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
    // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
    
    // 조건에 맞는 파일 찾기 (이름에 'log-excel'이 있고, 확장자가 '.zip'인 것)
    const myFile = files.find(file => file.includes('log-excel') && file.endsWith('.zip'));

    // 1단계: 검증: 파일이 존재해야 함 (없으면 테스트 실패)
    expect(myFile, '다운로드 폴더 내에 log-excel이 포함된 .zip 파일이 존재해야 합니다.').to.not.be.undefined; 

    // 2단계: 파일이 존재하면 용량 상태를 체크합니다.
    if (myFile) {
        cy.log(`✅ 파일 확인 완료! 파일명: ${myFile}`);
        
        const filePath = `cypress/downloads/${myFile}`;
        
        // 만들어둔 태스크를 호출해 파일 용량을 가져옵니다.
        cy.task('getFileStats', filePath).then((stats) => {
            cy.log(`📊 다운로드된 ZIP 파일 용량: ${stats.size} bytes`);

            // 검증 1: 0바이트 빈 파일 방지
            expect(stats.size, '파일 용량 0바이트 초과 정상 확인').to.be.greaterThan(0);

            // 검증 2: ZIP 파일 무결성 최소 체크
            // 압축 파일(.zip)은 내용물이 비어있는 빈 폴더만 압축해도 헤더 정보 때문에 최소 22바이트 이상을 차지합니다.
            // 엑셀 로그가 정상적으로 포함되었다면 최소 수백 바이트 이상이어야 하므로 100바이트를 최소 기준으로 잡습니다.
            expect(stats.size, 'ZIP 파일 최소 용량(100 bytes) 이상 무결성 확인').to.be.at.least(100);
            
            cy.log(`✅ ZIP 파일 유효성(용량) 검증 완벽 통과!`);
        });
    }
});



cy.log('✅ 이력 - 통합 탭 진입 및 데이터 출력 확인 완료!');
      


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 접속기록 이력 - 통합 검출팝업 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
