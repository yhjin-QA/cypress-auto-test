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
  
  it('02_Depth_이력_접속기록이력_통합 자동화 시나리오', () => {


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
    //cy.get('th').filter(':visible').contains('처리').should('be.visible');
    // 3.0.5.1191_r35135 가로 스크롤 문제로 DOM 존재 확인으로 처리 
    cy.get('th').contains('처리').should('exist');


    // //달력표를 펼침 
    // cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    // cy.wait(1000);
    // // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // // 2. '1월'이라는 글자를 찾아 클릭합니다.
    //  cy.get('.v-date-picker-table--month').filter(':visible').contains('7월').click({ force: true });
    // // 달력 20일 클릭
    // cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    // //달력창 닫기
    // cy.get('body').type('{esc}');

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


    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 업무시스템 종류 클릭하는 코드
    cy.get('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

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
    


    // 1. ✨ 클릭 전 미리 API 낚아채기 준비 (메서드가 POST인 점에 주의!)
    cy.intercept('POST', '**/statistics/log/excel*').as('downloadExcel');

    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });

    // 3. ✨ 서버에서 엑셀 파일 생성을 완료하고 응답을 줄 때까지 기다립니다.
    // 넉넉하게 2분(120초)을 설정했지만, 서버가 10초 만에 응답하면 딱 10초만 기다리고 바로 다음 줄로 넘어갑니다!
    cy.wait('@downloadExcel', { timeout: 120000 });
     

    // 3. 사라지는 것 확인
    cy.get('.v-snack__content', { timeout: 30000 }).should('not.exist');
    
    // 서버에서 zip 파일을 생성하고 다운로드가 100% 완료될 때까지 충분히 기다립니다. (7초 -> 10초로 연장)
    cy.wait(20000);
    
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
            // 엑셀 로그가 정상적으로 포함되었다면 최소 수백 바이트 이상이어야 하므로 100바이트를 최소 기준으로 잡습니다.
            expect(stats.size, 'ZIP 파일 최소 용량(100 bytes) 이상 무결성 확인').to.be.at.least(100);
            
            cy.log(`✅ ZIP 파일 유효성(용량) 검증 완벽 통과!`);
        });
    }
});

cy.log('✅ 이력 - 통합 탭 진입 및 데이터 출력 확인 완료!');
      

    // ==========================================
    // 이력 > 통합 > 검출 팝업 (처리영역)
    // ==========================================

    //기능확인
     // 오늘날짜 가져오기 : 검증할 행이 날짜가 흐르면서 다음페이지로 넘어갈수있는 문제 해결
     // 1. 오늘 날짜를 YYYYMMDD 형식으로 생성
     const today = new Date();
     const year = today.getFullYear();
     const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
     const day = String(today.getDate()).padStart(2, '0');

     const formattedDate = `${year}${month}${day}`; // 예: "20260303"
     //const targetFileName = `SQLPARSER_2001_${formattedDate}.log`;

     cy.log(`🎯 오늘 검증할 날짜: ${formattedDate}`);

     //기능확인
    //달력표를 펼침  월/일 지정  
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(1000);
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

   
  
////////////////////////////////////////
// [이력 > 통합 > 검출 팝업 > 오탐/확정 탭]
////////////////////////////////////////

// 🌟 클릭할 첫번쨰 행의 "접속 메뉴" 텍스트를 미리 확인해서, 메뉴 설정 펼침 여부를 사전에 판단
cy.get('tbody tr').filter(':visible').first().then(($row) => {
    // 접속 메뉴 컬럼 텍스트 추출 (테이블 컬럼 순서 기준: 접속일시, 업무시스템, 정보사용자, 부서/소속, 접속IP주소, 접속메뉴...)
    const menuText = $row.find('td').eq(5).text().trim(); // "접속 메뉴" 컬럼 인덱스는 실제 구조에 맞게 조정 필요
    const isUnregisteredMenu = menuText.startsWith('/');  // / 로 시작할경우 미등록메뉴, / 로 시작하지않을경우 등록된 메뉴로 판단기준 

    cy.log(`🔍 클릭할 행의 접속 메뉴: "${menuText}" → ${isUnregisteredMenu ? '미등록(펼쳐짐 예상)' : '등록됨(닫힘 예상)'}`);

    // 검출 팝업 오픈
    cy.wrap($row).find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
    cy.wait(1500);

    cy.get('.v-dialog--active', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // 🌟 사전 판단값을 기준으로 상태를 검증/보정
    const ensureMenuState = (shouldBeOpen) => {
        cy.get('.v-dialog--active').then(($dialog) => {
            const contentVisible = $dialog.find('*:contains("기본 행위 유형")').filter((i, el) => {
                const $el = Cypress.$(el);
                return $el.children().length === 0 && $el.is(':visible');
            }).length > 0;

            if (shouldBeOpen && !contentVisible) {
                cy.log('📁 [예상: 펼침] 실제로 닫혀있음 → 클릭하여 엽니다.');
                cy.get('.v-dialog--active').contains('span.sub-title-title', '메뉴 설정').click({ force: true });
                cy.wait(2000);
            } else if (!shouldBeOpen && contentVisible) {
                cy.log('📁 [예상: 닫힘] 실제로 열려있음 → 클릭하여 닫습니다.');
                cy.get('.v-dialog--active').contains('span.sub-title-title', '메뉴 설정').click({ force: true });
                cy.wait(2000);
            } else {
                cy.log(`🟢 예상대로 ${shouldBeOpen ? '펼쳐짐' : '닫힘'} 상태입니다.`);
            }
        });
    };

    ensureMenuState(isUnregisteredMenu);

    // ==========================================
    // 이후 Case 1~3 로직 (기존과 동일)
    // ==========================================
    cy.get('.v-dialog--active').then(($innerBody) => {
        const autoRegLabel = $innerBody.find('label:contains("메뉴명 자동 등록")');
        const menuNameInput = $innerBody.find('input[aria-label="메뉴명"]');

        const autoRegCheckboxWrapper = $innerBody.find('.v-input')
            .filter((i, el) => Cypress.$(el).text().includes('메뉴명 자동 등록'));
        const isAutoRegChecked = autoRegCheckboxWrapper.length > 0 &&
            autoRegCheckboxWrapper.find('input[type="checkbox"]').prop('checked') === true;

        if ((autoRegLabel.length > 0 && autoRegLabel.is(':visible')) || isAutoRegChecked) {
            cy.log('📝 [Case 1] 자동 등록 체크됨(라벨 노출 여부 무관) -> 체크 해제 후 신규 입력');

            cy.wrap(autoRegCheckboxWrapper.length > 0 ? autoRegCheckboxWrapper : autoRegLabel.closest('.v-input'))
              .find('input[type="checkbox"]')
              .uncheck({ force: true });

            cy.wait(500);
            // 🌟 체크 해제 후에도 항상 "펼침" 상태여야 하므로, ensureMenuState(true)로 보정
            ensureMenuState(true);

            cy.get('input[aria-label="메뉴명"]', { timeout: 10000 })
              .should('be.visible')
              .clear({ force: true })
              .type(`Depth_Test_${formattedDate}`, { force: true });
            cy.wait(1000);

            const regBtn = Cypress.$('button.v-btn:visible').filter((i, el) => Cypress.$(el).text().trim() === '등록');
            if (regBtn.length > 0) {
                cy.wrap(regBtn).click({ force: true });
                cy.wait(1500);
            }

        } else if (menuNameInput.length > 0 && menuNameInput.is(':visible')) {
            cy.log('📝 [Case 3] 이미 메뉴명 저장됨(라벨 없음) -> 기존 텍스트 덮어쓰기');

            cy.get('input[aria-label="메뉴명"]')
              .should('be.visible')
              .clear({ force: true })
              .type(`Depth_Test_${formattedDate}`, { force: true });
            cy.wait(1000);

            const regBtn = Cypress.$('button.v-btn:visible').filter((i, el) => Cypress.$(el).text().trim() === '등록');
            if (regBtn.length > 0) {
                cy.wrap(regBtn).click({ force: true });
                cy.wait(1500);
            }

        } else {
            cy.log('✅ [Case 2] 메뉴명 제어 불가/불필요. 등록 버튼 유무만 체크...');
            const regBtn = $innerBody.find('button.v-btn').filter(':visible').filter((i, el) => Cypress.$(el).text().trim() === '등록');
            if (regBtn.length > 0) {
                cy.log('🔄 등록 버튼 클릭');
                cy.wrap(regBtn).click({ force: true });
                cy.wait(1500);
            }
        }

        cy.contains('button.v-btn:visible', '저장').should('be.visible').click({ force: true });
        cy.wait(1000);
       

        // 🌟 [분기 처리] 미등록 메뉴(메뉴 설정 펼쳐짐)일 때만 "저장하시겠습니까?" 확인 팝업이 뜸
        if (isUnregisteredMenu) {
          cy.log('📋 [미등록 메뉴] 저장 확인 팝업이 뜰 것으로 예상 → 확인 처리');
          cy.contains('메뉴를 저장하시겠습니까?', { timeout: 10000 }).should('be.visible');
          cy.contains('button.v-btn:visible', '확인').click({ force: true });
          cy.wait(1000);
        } else {
          cy.log('📋 [등록된 메뉴] 저장 확인 팝업 없이 즉시 처리됨 → 별도 확인 생략');
        }
    });
});

   
//오탐확정----------------------------------------------------------------------------------------------
// 1. [전체 확정 선택] 클릭 및 검증
cy.contains('button.v-btn', '전체 확정 선택')
  .should('be.visible')
  .click({ force: true });

// 확정 버튼 갯수 비교 검증 (each 대체)
cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
  const totalCount = $allBtns.length; // 예: 4개
  
  // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 자동 대기 및 검증
  cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
    .filter(':contains("확정")')
    .should('have.length', totalCount);
});


// 2. [전체 오탐 선택] 변경 클릭 및 검증
cy.contains('button.v-btn', '전체 오탐 선택')
  .should('be.visible')
  .click({ force: true });

// 오탐 버튼 갯수 비교 검증 (each 대체 및 올바른 timeout 적용)
cy.get('button.btn-toggle-style-1').filter(':contains("오탐")').then(($allBtns) => {
  const totalCount = $allBtns.length;
  
  // 'selected'가 붙은 오탐 버튼이 전체 갯수와 동일해질 때까지 최대 15초 자동 대기
  cy.get('button.btn-toggle-style-1.selected', { timeout: 15000 })
    .filter(':contains("오탐")')
    .should('have.length', totalCount);
});

    
     // 1. 다이얼로그 내부 스크롤 컨테이너를 끝까지 내림
     cy.get('.scrollable-content').filter(':visible').scrollTo('bottom', { ensureScrollable: false, duration: 500 });
     cy.wait(1000);
     // 오탐/확정 저장버튼 클릭
     cy.get('.v-window-item.tab-item-wrapper').filter(':visible').find('button.v-btn').filter(':visible').contains('저장').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);

     // 검출창 닫기버튼 클릭
    cy.get('button.v-btn').filter(':visible').contains('닫기').last().click({ force: true });
    cy.wait(1000);

  
  //----------------------------------------------------------------------------------------------
  // 전체 오탐 선택 - > 이전 선택 복구 -> 전체 확정 선택으로 변경하기
  // 표의 첫번째 행 처리 아이콘 다시 재 클릭 
  // 검색된 결과 첫번쨰 행 클릭하여 검출 팝업 오픈
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

// ============================================================================
// 1. [전체 확정 선택] 클릭 및 검증
// ============================================================================
cy.contains('button.v-btn', '전체 확정 선택')
  .should('be.visible')
  .click({ force: true });

// 확정 버튼 갯수 비교 검증 (each 대체)
cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
  const totalCount = $allBtns.length;
  
  // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 대기
  cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
    .filter(':contains("확정")')
    .should('have.length', totalCount);
});


// ============================================================================
// 2. [이전 선택 복구] 클릭 및 검증 (오탐 상태로 복구)
// ============================================================================
cy.contains('button.v-btn', '이전 선택 복구').should('be.visible').click({ force: true });

// 🌟 디버깅: 복구 후 실제로 어떤 버튼이 selected 상태인지 확인
cy.get('button.btn-toggle-style-1.selected').then(($selected) => {
  cy.log(`selected 버튼 개수: ${$selected.length}`);
  $selected.each((i, el) => {
    cy.log(`[${i}] 텍스트: "${Cypress.$(el).text().trim()}"`);
  });
});

// 오탐 버튼 갯수 비교 검증 (복구 완료 대기)
cy.get('button.btn-toggle-style-1').filter(':contains("오탐")').then(($allBtns) => {
  const totalCount = $allBtns.length;
  
  // 'selected'가 붙은 오탐 버튼이 전체 갯수와 동일해질 때까지 대기
  cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
    .filter(':contains("오탐")')
    .should('have.length', totalCount);
});


// ============================================================================
// 3. 다시 [전체 확정 선택] 클릭 및 검증
// ============================================================================
cy.contains('button.v-btn', '전체 확정 선택')
  .should('be.visible')
  .click({ force: true });

// 다시 한번 확정 버튼 갯수 비교 검증
cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
  const totalCount = $allBtns.length;
  
  // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 대기
  cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
    .filter(':contains("확정")')
    .should('have.length', totalCount);
});

     // 1. 다이얼로그 내부 스크롤 컨테이너를 끝까지 내림
     cy.get('.scrollable-content').filter(':visible').scrollTo('bottom', { ensureScrollable: false, duration: 500 });
     cy.wait(1000);

     // 오탐/확정 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').last().click({ force: true });
     cy.wait(1000);
  
     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').last().click({ force: true });
     cy.wait(1000);
     //-------------------------------------------------------------------------------------------  

     /////////////////////////////////////////////////
     // [이력 > 통합 > 검출 팝업 > 키워드  탭]
     /////////////////////////////////////////////////
     
     
     //Case 키워드 등록하기-------------------------------------------------------------
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 키워드 탭 클릭
     cy.contains('.v-tabs__item, a', '키워드').filter(':visible').click({ force: true });
     cy.wait(1000);

     // 키워드 값 'Depth_test_KeyWord'를 입력
     cy.get('input[placeholder="항목을 입력하고 Enter 를 누르세요."]').filter(':visible').last().clear().type('Depth_test_KeyWord{enter}');

     // 설명  입력
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('depth _키워드_수정삭제');

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // 저장알림창 확인
     // v2.9.1.125_r35234 p.mb-0'->p.ca-msg 변경됨. 
     cy.contains('p.ca-msg', '저장했습니다.').should('be.visible');
     cy.wait(1000);
     
     // 저장 > 알림창 안의 '확인' 버튼을 찾아 클릭!
     cy.contains('button.v-btn:visible', '확인').click({ force: true });
     cy.wait(1000);

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     

     // Case 키워드 수정하기 -----------------------------------------------------------------
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 키워드 탭 클릭
     cy.contains('.v-tabs__item', '키워드').should('be.visible').click({ force: true });
     cy.wait(1000);

     //등록한 키워드 클릭하기  
     //'주민등록_' 뒤에 어떤 문자(.*)가 오더라도 해당 라벨을 찾아 클릭합니다.
     cy.contains('label.text-label', /주민등록번호_.*/).should('be.visible').click({ force: true });
   
     cy.wait(1000);

     // 입력된 이름을 수정 
     cy.get('input[aria-label="이름"]').filter(':visible').scrollIntoView().should('be.visible').clear().type('주민등록번호_test_수정');
     cy.wait(1000);

     // 입력된 설명 수정
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('depth_키워드_수정완료');
     cy.wait(1000);

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
     
     // 수정알림창 확인
     // v2.9.1.125_r35234 p.mb-0'->p.ca-msg 변경됨.
     cy.contains('p.ca-msg', '수정했습니다.').should('be.visible');
     cy.wait(1000);

     // 저장 > 알림창 안의 '확인' 버튼을 찾아 클릭!
     cy.contains('button.v-btn:visible', '확인').click({ force: true });
     cy.wait(1000);

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);

     // Case 키워드 삭제하기---------------------------------------------------------------------------------
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 키워드 탭 클릭
     cy.contains('.v-tabs__item', '키워드').should('be.visible').click({ force: true });
     cy.wait(1000);

     // 1. 해당 텍스트 영역을 찾아 마우스를 올립니다(Hover)
     cy.contains('label.text-label', '주민등록번호_test_수정').closest('.vue-treeselect__label').trigger('mouseover');      

     // 2. 이제 나타난 휴지통 아이콘을 찾아 클릭합니다.
     cy.get('.fa-trash').filter(':visible').first().click({ force: true });

     // 삭제 알림창 확인
     cy.contains('삭제했습니다.', { timeout: 30000 }).should('exist');
     
     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     //--------------------------------------------------------------------------------------------

     //////////////////////////////////////////////////////
     //  [이력 > 통합 > 검출 팝업 > 불용 데이터 - 키워드 탭]
     /////////////////////////////////////////////////////
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 키워드').should('be.visible').click({ force: true });
     cy.wait(1000);

     // 표가 화면에 나타날 때까지 대기 (데이터 로딩 기다림)
     cy.get('tbody').filter(':visible').last().as('activeTable');
     cy.get('@activeTable', { timeout: 10000 }).should('not.contain', 'No data');
     cy.wait(1000); // 렌더링 안정화를 위한 짧은 대기

     // 기존 남은 행 삭제 예외처리-------------------------------
     cy.wait(1000); // 화면 안정화 대기
     function deleteKeywordData() {
       // 🌟 [핵심] body 대신 현재 눈에 보이는 탭(.v-window-item:visible)만 잡습니다.
       cy.get('.v-window-item').filter(':visible').then(($activeTab) => {
         // 활성화된 탭 안에서만 '주민등록번호'를 찾습니다.
         const $targetRows = $activeTab.find('tr:contains("주민등록번호")');
         if ($targetRows.length > 0) {
           cy.log(`⚠️ 삭제할 데이터 발견! (현재 탭에 ${$targetRows.length}개 존재)`);
            // 🌟 [핵심] 삭제할 때도 활성화된 탭 안(.wrap)에서만 찾도록 가둡니다.
           cy.wrap($activeTab).contains('tr', '주민등록번호').last().find('i.fa-trash').click({ force: true });
           cy.wait(1500); 
           deleteKeywordData(); // 다시 자신을 호출
         } else {
           cy.log('✅ "주민등록번호" 관련 모든 불용 데이터 삭제 완료!');
         }
       });
      }
      deleteKeywordData(); // 함수 실행!
     //-------------------------------------------------------


     //case 불용 데이터 키워드 추가하기 -----------------------------------------------------------------
     
     // 추가 + 동그란 플러스 버튼 클릭 
     cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });

     // 불용 데이터 상세 팝업창
     // 불용 데이터 상세 팝업창에서 '타입' 입력창(콤보박스)을 클릭하여 목록을 펼칩니다.
     cy.get('input[aria-label="타입"]').filter(':visible').first().invoke('val', '주민등록번호').trigger('input').trigger('change');
     cy.wait(1000); 

     // 2. [추가] 이제 시스템에게 "이 글자에 해당하는 목록을 선택했어"라고 알려줘야 합니다.
     // '주민등록번호'라는 글자를 가진 실제 리스트 아이템을 강제로 클릭!
     cy.get('.v-list__tile__title').contains('주민등록번호').click({ force: true });
     cy.wait(1000);

     // 그 후 다른 칸(키워드)을 클릭하면 보통 값이 확정됩니다.
     cy.get('input').filter(':visible').eq(1).click({ force: true });

     // 키워드 입력
     cy.get('input[aria-label="키워드"]').filter(':visible').clear().type('주민등록번호_키워드');
     cy.wait(1000);

     // 설명 입력
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('Depth_test입니다.');
     cy.wait(1000);

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // [검증] 리스트에 수정된 키워드명이 존재하는지 확인
     cy.contains('tr', '주민등록번호_키워드').should('be.visible');

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     
     //--------------------------------------------------------------------------------------------------

     //case 불용 데이터 키워드 수정하기 -----------------------------------------------------------------
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 키워드').should('be.visible').click({ force: true });
     cy.wait(1000);
  
     // '주민등록번호_키워드'라는 텍스트를 포함하고 있는 테이블 행을 찾아 수정버튼 클릭
     cy.contains('tr', '주민등록번호_키워드').should('be.visible').last().find('i.material-icons:contains("edit")').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 상세 팝업창에서 '타입' 입력창선택하여 주민등록번호-> 외국인등록번호로 수정
     cy.get('input[aria-label="타입"]').filter(':visible').first().invoke('val', '외국인등록번호').trigger('input').trigger('change');
     cy.wait(1000); 

     // 2. [추가] 이제 시스템에게 "이 글자에 해당하는 목록을 선택했어"라고 알려줘야 합니다.
     // '주민등록번호'라는 글자를 가진 실제 리스트 아이템을 강제로 클릭!
     cy.get('.v-list__tile__title').contains('외국인등록번호').click({ force: true });
     cy.wait(1000);

     // 그 후 다른 칸(키워드)을 클릭하면 보통 값이 확정됩니다.
     cy.get('input').filter(':visible').eq(1).click({ force: true });

     // 키워드 수정
     cy.get('input[aria-label="키워드"]').filter(':visible').clear().type('주민등록번호_키워드_수정');
     cy.wait(1000);
     // [검증] 입력한 텍스트가 value로 잘 들어가 있는지 확인
     cy.get('input[aria-label="키워드"]').should('have.value', '주민등록번호_키워드_수정');

     // 설명 수정
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('Depth_test입니다._수정');
     cy.wait(1000);

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // [검증] 리스트에 수정된 키워드명이 존재하는지 확인
     cy.contains('tr', '주민등록번호_키워드_수정').should('be.visible');
     cy.wait(1000);

     //case 불용 데이터 키워드 수정한 행 삭제하기 -----------------------------------------------------------------

     // 수정된 이름('주민등록번호_키워드_수정')이 포함된 테이블행 휴지통 아이콘 클릭
     cy.contains('tr', '주민등록번호_키워드_수정').should('be.visible').last().find('i.fa-trash') .click({ force: true });
     cy.wait(1000);

     // [검증] 표에서 해당 텍스트가 더 이상 존재하지 않는지 확인
     cy.contains('주민등록번호_키워드_수정').should('not.exist');

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     //-------------------------------------------------------------------------------------------------------------

     //////////////////////////////////////////////////////
     //  [이력 > 통합 > 검출 팝업 > 불용 데이터 - 값 탭]
     /////////////////////////////////////////////////////
     
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 값').should('be.visible').click({ force: true });
     cy.wait(1000);

     // 표가 화면에 나타날 때까지 대기 (데이터 로딩 기다림)
     cy.get('tbody').filter(':visible').last().as('activeTable');
     cy.get('@activeTable', { timeout: 10000 }).should('not.contain', 'No data');
     cy.wait(1000); // 렌더링 안정화를 위한 짧은 대기

     // 기존 남은 행 삭제 예외처리-------------------------------
     cy.wait(1000); // 화면 안정화 대기
     function deleteValueData() {
     // 🌟 [핵심] 마찬가지로 현재 눈에 보이는 탭만 잡습니다.
       cy.get('.v-window-item').filter(':visible').then(($activeTab) => {
         const $targetRows = $activeTab.find('tr:contains("신용카드번호")');
         if ($targetRows.length > 0) {
           cy.log(`⚠️ 삭제할 데이터 발견! (현재 탭에 ${$targetRows.length}개 존재)`);
      
           cy.wrap($activeTab).contains('tr', '신용카드번호').last().find('i.fa-trash').click({ force: true });
           cy.wait(1500); 
           deleteValueData(); // 다시 자신을 호출
         } else {
           cy.log('✅ "신용카드번호" 관련 모든 불용 데이터 삭제 완료!');
         }
       });
      }
      deleteValueData(); // 함수 실행!
    //-------------------------------------------------------
  

     // 추가하기  + 동그란 플러스 버튼 클릭 
     // 불용 데이터 - 키워드 + 클릭 중복방지 코드
     cy.contains('.v-window-item', '불용 데이터 - 값').filter(':visible').find('.grid-add-button').should('be.visible').click({ force: true });

     // 불용 데이터 상세 팝업창
     // 불용 데이터 상세 팝업창에서 '타입' 입력창(콤보박스)을 클릭하여 목록을 펼칩니다.
     cy.get('input[aria-label="타입"]').filter(':visible').first().invoke('val', '신용카드번호').trigger('input').trigger('change');
     cy.wait(1000); 

     // 2. [추가] 이제 시스템에게 "이 글자에 해당하는 목록을 선택했어"라고 알려줘야 합니다.
     // '신용카드번호'라는 글자를 가진 실제 리스트 아이템을 강제로 클릭!
     cy.get('.v-list__tile__title').contains('신용카드번호').click({ force: true });
     cy.wait(1000);

     // 그 후 다른 칸(키워드)을 클릭하면 보통 값이 확정됩니다.
     cy.get('input').filter(':visible').eq(1).click({ force: true });

     // 값 입력
     cy.get('input[aria-label="값"]').filter(':visible').clear().type('4469-4314-3564-3296');
     cy.wait(1000);

     // 설명 입력
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('Depth_test_신용카드번호');
     cy.wait(1000);

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // [검증] 리스트에 수정된 개인정보유형 값 존재하는지 확인
     cy.contains('tr', 'Depth_test_신용카드번호').should('be.visible');
     cy.wait(1000);

     // 검출창 닫기버튼 클릭
     //cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.get('button.v-btn').filter(':contains("닫기")').filter(':visible').last().click({ force: true });
     cy.wait(1000);

     //case 불용 데이터 값 수정하기 -----------------------------------------------------------------
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 값').should('be.visible').click({ force: true });
     cy.wait(1000);
  
     // 'Depth_test_신용카드번호'라는 텍스트를 포함하고 있는 테이블 행을 찾아 수정버튼 클릭
     cy.contains('tr', 'Depth_test_신용카드번호').should('be.visible').last().find('i.material-icons:contains("edit")').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 상세 팝업창에서 '타입' 입력창선택하여 신용카드번호-> 계좌번호 수정
     cy.get('input[aria-label="타입"]').filter(':visible').first().invoke('val', '계좌 번호').trigger('input').trigger('change');
     cy.wait(1000); 

     // 2. [추가] 이제 시스템에게 "이 글자에 해당하는 목록을 선택했어"라고 알려줘야 합니다.
     // '주민등록번호'라는 글자를 가진 실제 리스트 아이템을 강제로 클릭!
     cy.get('.v-list__tile__title').contains('계좌 번호').click({ force: true });
     cy.wait(1000);

     // 그 후 다른 칸(키워드)을 클릭하면 보통 값이 확정됩니다.
     cy.get('input').filter(':visible').eq(1).click({ force: true });

     // 값 수정
     cy.get('input[aria-label="값"]').filter(':visible').clear().type('475-6025314-6-985');
     cy.wait(1000);
     // [검증] 입력한 텍스트가 value로 잘 들어가 있는지 확인
     cy.get('input[aria-label="값"]').should('have.value', '475-6025314-6-985');

     // 설명 수정
     cy.get('input[aria-label="설명"]').filter(':visible').clear().type('Depth_test_계좌번호_수정');
     cy.wait(1000);

     // 저장버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

     // [검증] 리스트에 수정된 키워드명이 존재하는지 확인
     cy.contains('tr', 'Depth_test_계좌번호_수정').should('be.visible');
     cy.wait(1000);

     //case 불용 데이터 값 수정한 행 삭제하기 -----------------------------------------------------------------
    

     // 수정된 이름('Depth_test_계좌번호_수정')이 포함된 테이블행 휴지통 아이콘 클릭
     cy.contains('tr', 'Depth_test_계좌번호_수정').should('be.visible').last().find('i.fa-trash').click({ force: true });
     cy.wait(1000);

     // [검증] 표에서 해당 텍스트가 더 이상 존재하지 않는지 확인
     cy.contains('Depth_test_계좌번호_수정').should('not.exist');

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     //-------------------------------------------------------------------------------------------------------------

     //////////////////////////////////////////////////////
     // 검출 팝업 경고아이콘 (HTTP상세 팝업 )
     /////////////////////////////////////////////////////
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);
     // 경고창 아이콘 클릭 (HTTP상세 팝업)
     cy.get('i.g.g-IMajorAlert').filter(':visible').should('exist').click({ force: true }); // 다른 요소에 겹쳐있을 경우를 대비해 force 옵션 사용
     cy.wait(1000); 
     
     //HTTP Request 탭 클릭---------------------
     cy.contains('span.tab-title', 'HTTP Request').should('be.visible').click({ force: true });
     cy.wait(1000); 

    // ==========================================================
    // STEP: HTTP REQUEST 정보 검증 (조건부 분기)
    // ==========================================================
    cy.log('🔍 HTTP REQUEST 데이터 검증');

    // 팝업 화면이 완전히 열릴 때까지 고정 요소(접속 아이디 라벨)를 기다립니다.
    cy.contains('span', '접속 아이디', { timeout: 10000 }).should('be.visible');
    cy.wait(1000); // 데이터 렌더링 안정화 대기

    cy.get('body').then(($body) => {
        // 제이쿼리(jQuery)를 이용해 화면 어딘가에 '(undefined)' 텍스트가 있는지 찾습니다.
        if ($body.find('span:contains("(undefined)")').length > 0) {
            
            // --------------------------------------------------
            // [CASE A] 접속 아이디가 (undefined)인 경우
            // --------------------------------------------------
            cy.log('⚠️ [Case A] 비정상(undefined) 사용자: connection 정보 검증');
            
            // referer가 없으므로 대신 'connection' 행을 찾아 'keep-alive'를 검증합니다.
            cy.contains('tr', 'connection', { timeout: 10000 }).should('be.visible')
              .within(() => {
                  cy.contains('keep-alive').should('be.visible');
              });

            // 추가로 'host' 정보도 함께 검증해주면 더욱 안전합니다.
            cy.contains('tr', 'host').within(() => {
                  cy.contains('10.10.54.22:8080').should('be.visible');
            });

        } else {
            
            // --------------------------------------------------
            // [CASE B] 정상적인 사용자인 경우 (기존 작성하신 코드)
            // --------------------------------------------------
            cy.log('✅ [Case B] 정상 사용자: referer 정보 검증');
            
            cy.contains('tr', 'referer', { timeout: 10000 }).should('be.visible')
              .within(() => {
                  // 1. IP 주소는 고정이므로 반드시 확인
                  cy.contains('10.10.54.22:8080').should('be.visible');
                  
                  // 2. 중간 경로는 제외하고, 마지막이 .do로 끝나는지만 유연하게 확인
                  cy.get('td').invoke('text').then((text) => {
                      expect(text).to.match(/\.do/); 
                  });
              });
        }
    });

    cy.log('✅ HTTP REQUEST 검증 성공!');



//HTTP Response 탭 클릭---------------------
     cy.contains('span.tab-title', 'HTTP Response').should('be.visible').click({ force: true });
     cy.wait(1000);

     // 'Connection'라는 텍스트를 가진 행(tr)을 찾아서 검증합니다.
     cy.contains('tr', 'Connection').should('be.visible')
     .within(() => {
       // 그 행 안에서 URL 값이 포함되어 있는지 확인
       cy.contains('keep-alive').should('exist');
       
      });
      cy.log('✅ HTTP Response 검증 성공!');



// ====================================================================
// 3. SQL 탭 검증
// ====================================================================
// 변수명을 sqlTargets로 변경
const sqlTargets = ['menuNo', 'id', 'name', 'NAME', 'password', 'Url'];

cy.contains('span.tab-title', 'SQL').should('be.visible').click({ force: true });
cy.wait(1500); 

cy.get('.v-dialog--active').within(() => {
    let editorText = '';
    
    cy.get('.monaco-editor .view-line').each(($line) => {
        editorText += $line.text() + ' ';
    }).then(() => {
        const cleanEditorText = editorText.replace(/[\u00a0\t\n\r]/g, ' ');
        cy.log(`📝 [SQL] 추출된 순수 SQL: ${cleanEditorText}`); 

        sqlTargets.forEach((colName) => {
            const regex = new RegExp(`"?\\b${colName}\\b"?`, 'i');
            
            if (regex.test(cleanEditorText)) {
                cy.log(`🔍 [${colName}] 감지됨 -> 하단 테이블 확인 시작`);
                
                // SQL 탭은 ColumnNm이 맞으므로 그대로 유지
                cy.contains('th', 'ColumnNm').closest('table').within(() => {
                    cy.get('td, span').filter((index, el) => {
                        const text = Cypress.$(el).text().trim();
                        return text.toLowerCase() === colName.toLowerCase();
                    }).should('be.visible');
                });
                
                cy.log(`✅ [${colName}] 매칭 성공!`);
            } else {
                cy.log(`⏭️ [${colName}] 항목은 현재 쿼리에 포함되어 있지 않아 검증을 패스합니다.`);
            }
        });
    });
});

    // 검출팝업 왼쪽 HTTP 상세 팝업 닫기 -----------------------------------------------------------------
    cy.contains('.tab-title', 'HTTP Request').parents('.flex.xs12.sm12.md12.lg12').first()
    .within(() => {
      cy.get('i.material-icons').contains('close').filter(':visible').first().click({ force: true });
    });

     cy.wait(1000);
     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);
     //-------------------------------------------------------------------------------------------------------------------

      //////////////////////////////////////////////////////
     // 전체 화면 아이콘 클릭 (전체화면 - 다시 크기 줄이기 )
     /////////////////////////////////////////////////////
     // 화면에 보이는 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 'fullscreen' 텍스트를 가진 material-icons 아이콘을 찾아 클릭합니다.
     cy.contains('i.material-icons', 'fullscreen').filter(':visible').should('be.visible').click({ force: true });

     // [검증] 창이 실제로 커졌는지 검증
     cy.get('.v-dialog').should('have.class', 'v-dialog--fullscreen');
     cy.wait(1000);

     // 'fullscreen_exit' 텍스트를 가진 아이콘을 찾아 클릭하여 전체 화면을 해제합니다.
     cy.contains('i.material-icons', 'fullscreen_exit').filter(':visible').should('be.visible').click({ force: true });

     // [검증] 창이 실제로 작아졌는지 검증
     cy.get('.v-dialog').should('not.have.class', 'v-dialog--fullscreen');
     cy.wait(1000);

     // 검출창 닫기버튼 클릭
     cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
     cy.wait(1000);


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
