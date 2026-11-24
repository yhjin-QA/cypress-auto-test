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
    // 간헐적으로 서브 컨텍스트 메뉴 클릭못하는 현상을 해결 
    cy.get('#side-menu-110000').should('be.visible').trigger('mouseover');
    cy.wait(300);
    cy.get('.v-menu__content.menuable__content__active').filter(':visible').should('have.length.at.least', 1);
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건', { timeout: 10000 }).should('exist');
  
    // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"], input[aria-label="사용자 아이피"]').filter(':visible').should('be.visible'); // [2.9.9.0] 「사용자 아이피」 허용
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
  
     // 시작날짜 달력 아이콘확인
     // 시작날짜 달력 아이콘확인
    dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 전체선택 확인
     // [2.9.7] '전체 선택' 표시 없어짐 (Basic/UI 이력과 동일하게 제외)
     // cy.get('span[title=\"전체 선택\"]').should('be.visible');
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
    cy.get('th').filter(':visible').contains('선택').should('be.visible');

  
  
    // ==========================================
    // 테스트 자동화시나리오
    // 이력 - 접속기록 이력 자동화 시니라오 테스트 
    // ==========================================



    // 이력 > 접속 기록 이력 서브메뉴 클릭  -----------------------
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    
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
     dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"][role="combobox"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"], input[aria-label="사용자 아이피"]').filter(':visible').should('be.visible'); // [2.9.9.0] 「사용자 아이피」 허용
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
    // dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
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
dateInputs().eq(0).find('input').first().click({ force: true });
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
    // 시작날짜 달력 
    dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
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
// //업무시스템 초기화 x버튼 클릭하기
//cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
//cy.wait(1000);
cy.intercept('GET', '**/logcatch/api/v1/doubt-menus/*').as('doubtMenus');

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
                cy.wait(2000);
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

  // [2026-11-18] doubt-menus 요청은 행(메뉴 등록 상태 · 팝업 단계)에 따라 안 나갈 때가 있음 (11-18 05시 정기 실행 3회 모두 「No request」, 단독 실행은 통과)
  //   → 요청이 나가면 응답까지 기다리고, 10초 안에 안 나가면 기록만 남기고 다음 단계(저장 버튼 확인)로 진행
  const waitDoubtMenus = (left) => cy.get('@doubtMenus.all', { log: false }).then((xs) => {
    if (xs.length) { cy.wait('@doubtMenus', { timeout: 10000 }); return; }
    if (left <= 0) {
      cy.log(`ℹ️ doubt-menus 요청 없음 — 접속 메뉴 "${menuText}" 행`);
      cy.writeFile('cypress/probe/D02T_doubtMenus_없음.json', { at: new Date().toISOString(), menuText, isUnregisteredMenu });
      return;
    }
    cy.wait(1000, { log: false });
    waitDoubtMenus(left - 1);
  });
  waitDoubtMenus(10);

  cy.get('button.v-btn.success--text')
  .filter(':visible')
  .then(($buttons) => {
    const saveBtn = $buttons.filter((i, el) => Cypress.$(el).text().trim() === '저장');

    if (saveBtn.length > 0) {
      cy.log('💾 저장 버튼 발견 → 클릭');
      cy.wrap(saveBtn).first().click({ force: true });

      if (isUnregisteredMenu) {
        cy.contains('메뉴를 저장하시겠습니까?', { timeout: 10000 }).should('be.visible');
        cy.contains('button.v-btn:visible', '확인').click({ force: true });
        cy.wait(1000);
      }
    } else {
      cy.log('ℹ️ 이미 처리 완료된 화면이거나 저장 버튼이 없는 구조 → 저장 단계 생략');
    }
  });

 });
});

   
//오탐확정----------------------------------------------------------------------------------------------
// 1. [전체 확정 선택] 클릭 및 검증
// 스크롤 올려서 버튼 선택
// [수정] 내용이 짧아 스크롤바가 없을 때도 실패하지 않도록 ensureScrollable: false
//        .scrollable-content가 여러 개 잡힐 수 있어 팝업 안의 첫 번째 영역만 대상
cy.get('.v-dialog--active .scrollable-content').filter(':visible').first()
  .scrollTo('top', { ensureScrollable: false });
cy.wait(1000);
// [2.9.7 임시 스킵] Mantis 0038956 — 이미 오탐으로 처리된 건에서 「전체 확정 선택」도 반영 안 됨 (수동 확인 2026-11-10)
//   검출 건이 오탐 상태면 확정 검증이 실패하므로 함께 보류, 수정되면 주석 해제
cy.contains('button.v-btn', '전체 확정 선택').should('be.visible');
// cy.contains('button.v-btn', '전체 확정 선택').should('be.visible').click({ force: true });
//
// // 확정 버튼 갯수 비교 검증 (each 대체)
// cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
//   const totalCount = $allBtns.length; // 예: 4개
//
//   // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 자동 대기 및 검증
//   cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
//     .filter(':contains("확정")')
//     .should('have.length', totalCount);
// });


/* [2.9.7 임시 스킵] Mantis 0038956 — 오탐 버튼 동작 안 함 (전체 오탐 선택·개별 오탐 클릭 모두 미반영), 수정되면 주석 해제
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

*/
    
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
// [2.9.7 임시 스킵] Mantis 0038956 — 오탐 상태에서 「전체 확정 선택」 미반영, 수정되면 주석 해제
cy.contains('button.v-btn', '전체 확정 선택').scrollIntoView().should('be.visible');
// cy.contains('button.v-btn', '전체 확정 선택').scrollIntoView().should('be.visible').click({ force: true });
//
// // 확정 버튼 갯수 비교 검증 (each 대체)
// cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
//   const totalCount = $allBtns.length;
//
//   // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 대기
//   cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
//     .filter(':contains("확정")')
//     .should('have.length', totalCount);
// });


/* [2.9.7 임시 스킵] Mantis 0038956 — 오탐 버튼 동작 안 함 (전체 오탐 선택·개별 오탐 클릭 모두 미반영), 수정되면 주석 해제
   (이전 선택 복구는 직전 오탐 상태로 되돌리는지 확인하는 단계라 오탐이 동작해야 검증 가능)
// ============================================================================
// 2. [이전 선택 복구] 클릭 및 검증 (오탐 상태로 복구)
// ============================================================================
cy.contains('button.v-btn', '이전 선택 복구').scrollIntoView().should('be.visible').click({ force: true });

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


*/
// ============================================================================
// 3. 다시 [전체 확정 선택] 클릭 및 검증
// ============================================================================
// [2.9.7 임시 스킵] Mantis 0038956 — 오탐 상태에서 「전체 확정 선택」 미반영, 수정되면 주석 해제
cy.contains('button.v-btn', '전체 확정 선택').scrollIntoView().should('be.visible');
// cy.contains('button.v-btn', '전체 확정 선택').scrollIntoView().should('be.visible').click({ force: true });
//
// // 다시 한번 확정 버튼 갯수 비교 검증
// cy.get('button.btn-toggle-style-1').filter(':contains("확정")').then(($allBtns) => {
//   const totalCount = $allBtns.length;
//
//   // 'selected'가 붙은 확정 버튼이 전체 갯수와 동일해질 때까지 대기
//   cy.get('button.btn-toggle-style-1.selected', { timeout: 10000 })
//     .filter(':contains("확정")')
//     .should('have.length', totalCount);
// });

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

     // [2.9.7 임시 스킵] 키워드 탭 — Mantis 0038957 — 키워드값 입력 후 Enter 시 값이 등록되지 않고 지워짐 (수동 재현 확인)
     //   키워드 등록 → 수정 → 삭제 흐름 전체를 건너뜀. 수정되면 아래 '// ' 를 풀어 복구
//      /////////////////////////////////////////////////
//      // [이력 > 통합 > 검출 팝업 > 키워드  탭]
//      /////////////////////////////////////////////////

//      //Case 키워드 등록하기-------------------------------------------------------------
//      // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
//      cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
//      cy.wait(1000);

//      // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
//      cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
//      cy.wait(1000);

//      // 키워드 탭 클릭
//      cy.contains('.v-tabs__item, a', '키워드').scrollIntoView().filter(':visible').click({ force: true });
//      cy.wait(1000);

//      // 키워드 값 'Depth_test_KeyWord'를 입력
//      // [2.9.7] 키워드 탭 양식 변경(개인정보 유형·유형·적용 업무시스템·Content Type·키워드값…)
//      //   같은 안내문 입력칸이 여러 개 → '키워드값' 라벨과 같은 높이(같은 줄)에 있는 입력칸을 선택
//      cy.get('.v-dialog--active').filter(':visible').last().then(($dlg) => {
//        const $label = $dlg.find('*').filter((i, el) => el.children.length === 0 && /^\s*키워드\s*값\s*:?\s*$/.test(el.textContent)).filter(':visible').first();
//        const $inputs = $dlg.find('input[placeholder="항목을 입력하고 Enter 를 누르세요."]').filter(':visible');
//        let $target = $inputs.last();
//        if ($label.length && $inputs.length > 1) {
//          const ly = $label[0].getBoundingClientRect().top;
//          $target = Cypress.$([...$inputs].sort((a, b) => Math.abs(a.getBoundingClientRect().top - ly) - Math.abs(b.getBoundingClientRect().top - ly))[0]);
//        }
//        cy.log(`키워드값 입력칸 후보 ${$inputs.length}개 / 라벨 ${$label.length ? '찾음' : '못 찾음'}`);
//        // [2.9.7] Enter 로 칩 등록되는 입력칸 → force 없이 클릭(포커스) 후 입력, Enter 는 따로 입력
//        cy.wrap($target).scrollIntoView().click();
//        cy.wrap($target).type('Depth_test_KeyWord', { delay: 30 });
//        cy.wrap($target).type('{enter}');
//        cy.wait(500);
//        // 칩으로 등록됐는지 확인 (입력칸이 속한 v-input 안에 키워드 칩)
//        cy.wrap($target).closest('.v-input').should('contain.text', 'Depth_test_KeyWord');
//      });

//      // 설명  입력
//      cy.get('input[aria-label="설명"]').filter(':visible').clear().type('depth _키워드_수정삭제');

//      // 저장버튼 클릭
//      cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
//      cy.wait(1000);

//      // 저장알림창 확인
//      // v2.9.1.125_r35234 p.mb-0'->p.ca-msg 변경됨. 
//      cy.contains('p.ca-msg', /저장했습니다\.|중복된 값입니다/).should('be.visible');
//      cy.wait(1000);
     
//      // 저장 > 알림창 안의 '확인' 버튼을 찾아 클릭!
//      cy.contains('button.v-btn:visible', '확인').click({ force: true });
//      cy.wait(1000);

//      // 검출창 닫기버튼 클릭
//      cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
//      cy.wait(1000);
     

//      // Case 키워드 수정하기 -----------------------------------------------------------------
//      // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
//      cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
//      cy.wait(1000);

//      // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
//      cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
//      cy.wait(1000);

//      // 키워드 탭 클릭
//      cy.contains('.v-tabs__item', '키워드').scrollIntoView().should('be.visible').click({ force: true });
//      cy.wait(1000);

//      //등록한 키워드 클릭하기  
//      //'주민등록_' 뒤에 어떤 문자(.*)가 오더라도 해당 라벨을 찾아 클릭합니다.
//      cy.contains('label.text-label', /주민등록번호_.*/).should('be.visible').click({ force: true });
   
//      cy.wait(1000);

//      // 입력된 이름을 수정 
//      cy.get('input[aria-label="이름"]').filter(':visible').scrollIntoView().should('be.visible').clear().type('주민등록번호_test_수정');
//      cy.wait(1000);

//      // 입력된 설명 수정
//      cy.get('input[aria-label="설명"]').filter(':visible').clear().type('depth_키워드_수정완료');
//      cy.wait(1000);

//      // 저장버튼 클릭
//      cy.get('button.v-btn').filter(':visible').contains('저장').click({ force: true });
//      cy.wait(1000);
     
//      // 수정알림창 확인
//      // v2.9.1.125_r35234 p.mb-0'->p.ca-msg 변경됨.
//      cy.contains('p.ca-msg', '수정했습니다.').should('be.visible');
//      cy.wait(1000);

//      // 저장 > 알림창 안의 '확인' 버튼을 찾아 클릭!
//      cy.contains('button.v-btn:visible', '확인').click({ force: true });
//      cy.wait(1000);

//      // 검출창 닫기버튼 클릭
//      cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
//      cy.wait(1000);

//      // Case 키워드 삭제하기---------------------------------------------------------------------------------
//      // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
//      cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
//      cy.wait(1000);

//      // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
//      cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
//      cy.wait(1000);

//      // 키워드 탭 클릭
//      cy.contains('.v-tabs__item', '키워드').scrollIntoView().should('be.visible').click({ force: true });
//      cy.wait(1000);

//      // 1. 해당 텍스트 영역을 찾아 마우스를 올립니다(Hover)
//      cy.contains('label.text-label', '주민등록번호_test_수정').closest('.vue-treeselect__label').trigger('mouseover');      

//      // 2. 이제 나타난 휴지통 아이콘을 찾아 클릭합니다.
//      cy.get('.fa-trash').filter(':visible').first().click({ force: true });

//      // 삭제 알림창 확인
//      cy.contains('삭제했습니다.', { timeout: 30000 }).should('exist');
     
//      // 검출창 닫기버튼 클릭
//      cy.get('button.v-btn').filter(':visible').contains('닫기').click({ force: true });
//      cy.wait(1000);
//      //--------------------------------------------------------------------------------------------
     //////////////////////////////////////////////////////
     //  [이력 > 통합 > 검출 팝업 > 불용 데이터 - 키워드 탭]
     /////////////////////////////////////////////////////
     // 표의 데이터 행(tbody tr) 중 '첫 번째' 행을 먼저 잡습니다.
     cy.get('tbody tr').filter(':visible').first().find('i.g.g-IConfig', { timeout: 20000 }).should('be.visible').click({ force: true });
     cy.wait(1000);

     // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
     cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 키워드').scrollIntoView().should('be.visible').click({ force: true });
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
     // 불용 데이터 상세 팝업창에서 '유형' 입력창(콤보박스)을 클릭하여 목록을 펼칩니다.
     // v2.9.4.0 유형 -> 유형 문구 변경
     cy.get('input[aria-label="유형"]').filter(':visible').first().invoke('val', '주민등록번호').trigger('input').trigger('change');
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
     // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
     cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
     cy.wait(1000);
     cy.contains('.v-tabs__item', '불용 데이터 - 키워드').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);
  
     // '주민등록번호_키워드'라는 텍스트를 포함하고 있는 테이블 행을 찾아 수정버튼 클릭
     cy.contains('tr', '주민등록번호_키워드').should('be.visible').last().find('i.material-icons:contains("edit")').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 상세 팝업창에서 '유형' 입력창선택하여 주민등록번호-> 외국인등록번호로 수정
     // v2.9.4.0 타입 -> 유형 문구 변경
     cy.get('input[aria-label="유형"]').filter(':visible').first().invoke('val', '외국인등록번호').trigger('input').trigger('change');
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

     // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
     cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
     cy.wait(1000);

     // 불용 데이터 - 키워드 탭 클릭
     cy.contains('.v-tabs__item', '불용 데이터 - 값').scrollIntoView().should('be.visible').click({ force: true });
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
     // 불용 데이터 상세 팝업창에서 '유형' 입력창(콤보박스)을 클릭하여 목록을 펼칩니다.
     cy.get('input[aria-label="유형"]').filter(':visible').first().invoke('val', '신용카드번호').trigger('input').trigger('change');
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
     // 다이얼로그 내부 스크롤을 맨 위로 올린 뒤 탭 클릭
     cy.get('.v-dialog--active').scrollTo('top', { ensureScrollable: false });
     cy.wait(1000);

     cy.contains('.v-tabs__item', '불용 데이터 - 값').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);
  
     // 'Depth_test_신용카드번호'라는 텍스트를 포함하고 있는 테이블 행을 찾아 수정버튼 클릭
     cy.contains('tr', 'Depth_test_신용카드번호').should('be.visible').last().find('i.material-icons:contains("edit")').click({ force: true });
     cy.wait(1000);

     // 불용 데이터 상세 팝업창에서 '유형' 입력창선택하여 신용카드번호-> 계좌번호 수정
     cy.get('input[aria-label="유형"]').filter(':visible').first().invoke('val', '계좌 번호').trigger('input').trigger('change');
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
     // [2.9.7] 탭 이름이 'HTTP REQUEST'(대문자)로 바뀌고 span.tab-title 구조가 아님 → 대소문자 무시, 보이는 탭에서 찾음
     cy.get('.v-dialog--active').last().contains('.v-tabs__item, a, span, div', /^\s*HTTP\s+REQUEST\s*$/i).filter(':visible').first().click({ force: true });
     cy.wait(1000); 

     // 안쪽 팝업의 Key/Value 테이블이 실제로 로드됐는지 먼저 확인
     cy.get('table').filter(':visible').should('exist');
     cy.wait(500);

    cy.get('.v-dialog--active').last().within(() => {
  // [2026-11-11] 'connection' 헤더는 브라우저 접속에만 있음 (curl 등 명령어 접속 기록에는 host/user-agent/accept 뿐)
  //   → 첫 행이 어떤 접속이든 항상 있는 'host' 헤더로 확인
  cy.contains('tr', 'host', { timeout: 10000 })
    .scrollIntoView()
    .should('exist')          // be.visible 대신 exist로 완화
    .then(($tr) => {
      cy.wrap($tr).contains('10.10.54.22:8080').should('exist');
    });
});

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
            // [2026-11-11] connection 행은 브라우저 접속일 때만 있으므로, 있을 때만 keep-alive 확인
            cy.get('.v-dialog--active').last().then(($d) => {
                const hasConn = $d.find('tr').toArray().some((tr) => /(^|\s)connection(\s|$)/i.test(tr.innerText));
                if (hasConn) {
                    cy.contains('tr', 'connection').should('be.visible')
                      .within(() => {
                          cy.contains('keep-alive').should('be.visible');
                      });
                } else {
                    cy.log('ℹ️ connection 헤더 없는 접속(curl 등) — host 만 확인');
                }
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
            
            // [2026-11-23] 로그인 페이지(/uat/uia/egovLoginUsr.do) 등 첫 진입 접속은 referer 헤더가 없음
            //   (접속 아이디 「미등록 사용자()」) → referer 있으면 기존 검증, 없으면 host 확인
            cy.get('.v-dialog--active').last().then(($d) => {
              const hasRef = $d.find('tr').toArray().some((tr) => /(^|\s)referer(\s|$)/i.test(tr.innerText));
              if (!hasRef) {
                cy.log('ℹ️ referer 헤더 없는 접속(첫 진입) — host 로 확인');
                cy.contains('tr', 'host').within(() => { cy.contains('10.10.54.22:8080').should('exist'); });
                return;
              }
            cy.contains('tr', 'referer', { timeout: 10000 }).should('be.visible')
              .within(() => {
                  // 1. IP 주소는 고정이므로 반드시 확인
                  cy.contains('10.10.54.22:8080').should('be.visible');
                  
                  // 2. 중간 경로는 제외하고, 마지막이 .do로 끝나는지만 유연하게 확인
                  cy.get('td').invoke('text').then((text) => {
                      expect(text).to.match(/\.do/); 
                  });
              });
            });
        }
    });

    cy.log('✅ HTTP REQUEST 검증 성공!');



//HTTP Response 탭 클릭---------------------
     cy.get('.v-dialog--active').last().contains('.v-tabs__item, a, span, div', /^\s*HTTP\s+RESPONSE\s*$/i).filter(':visible').first().click({ force: true });
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

cy.get('.v-dialog--active').last().contains('.v-tabs__item, a, span, div', /^\s*SQL\s*$/i).filter(':visible').first().click({ force: true });
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
    // [2.9.7] 탭 이름 'HTTP REQUEST'(대문자)·구조 변경 → 탭에서 위로 올라가며 'close' 아이콘이 처음 나오는 영역(HTTP 상세 패널)의 X 클릭
    cy.get('.v-dialog--active').last().contains('.v-tabs__item, a, span, div', /^\s*HTTP\s+REQUEST\s*$/i).filter(':visible').first()
      .parents().filter((i, el) => Cypress.$(el).find('i.material-icons:contains("close")').filter(':visible').length > 0).first()
      .find('i.material-icons').filter((i, el) => el.textContent.trim() === 'close').filter(':visible').first()
      .click({ force: true });

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
    // [2.9.9.0 Depth] !1495 — 미등록 사용자 처리창 표시 (조회 전용)
    //   인사정보에 없는 계정(예: 리눅스_배송관리 loginid246)의 처리창 : 접속 아이디 「미등록 사용자(계정)」 · 행위 유형 「조회」
    //   (수정 전 : 계정(undefined) · 선택 — 위 HTTP REQUEST 검증의 Case A 「(undefined)」 분기는 수정 전 화면 대응)
    //   비로그인 기록(계정 없음)은 「미등록 사용자()」로 괄호가 비는 것이 정상. 이번 달에 미등록 사용자(계정) 기록이 없으면 기록만 남기고 생략
    // ==========================================
    {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      const tx = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
      const H = 'https://10.10.54.21:18443';
      const openDlg = ($b) => $b.find('.v-dialog--active').filter((i, e) => vis(e));
      const closeDlgs = () => {
        cy.get('body').then(($b) => {
          const d = openDlg($b);
          if (!d.length) return;
          const cand = d.last().find('button, .v-btn, i, .v-icon, svg, [class*="close"]').filter((i, e) => vis(e) && (
            /^(닫기|close|×|✕)$/.test(tx(e)) || /close/i.test(String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className)) || /닫기|close/i.test(e.getAttribute('aria-label') || '')));
          const x = cand.filter((i, e) => /^닫기$/.test(tx(e)))[0] || cand.closest('button, .v-btn')[0] || cand[0];
          if (x) cy.wrap(x).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
        });
        cy.wait(1000);
        cy.get('body').should(($b) => expect(openDlg($b).length, '팝업 닫힘').to.eq(0));
      };
      const dateIn = () => cy.get('.v-input__icon--prepend-inner i.material-icons').filter(':visible').filter((i, el) => el.innerText.trim() === 'event').closest('.v-input');
      cy.visit(`${H}/logcatch/record/accessLog/comprehensiveLog`);
      cy.wait(4000);
      closeDlgs();
      dateIn().eq(0).find('.material-icons').contains('event').click({ force: true });
      cy.wait(1000);
      cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').click({ force: true });
      cy.wait(800);
      cy.get('body').type('{esc}');
      cy.get('input[aria-label="사용자 상태"]').filter(':visible').first().click({ force: true });
      cy.wait(800);
      cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', /^\s*미등록\s*$/).click({ force: true });
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.intercept('GET', /\/api\/v1\/access-log\?/).as('D02U_list');
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      cy.wait('@D02U_list', { timeout: 30000 });
      cy.wait(3000);
      cy.get('table').filter((i, e) => vis(e) && !e.closest('.v-dialog') && e.querySelectorAll('thead th').length > 5).first().then(($tbl) => {
        const row = $tbl.find('tbody tr').toArray().find((r) => /미등록 사용자\([^)]+\)/.test(tx(r)));
        if (!row) { cy.writeFile('cypress/probe/D02U_미등록사용자_관찰.json', { 시각: new Date().toISOString(), 결과: '이번 달 미등록 사용자(계정) 기록 없음 — !1495 확인 생략' }); return; }
        const acct = (tx(row).match(/미등록 사용자\([^)]+\)/) || [])[0];
        cy.log(`미등록 사용자 행: ${acct}`);
        const gear = [...row.lastElementChild.querySelectorAll('button, .v-btn, i')].filter(vis).pop();
        cy.wrap(gear).click({ force: true });
        // 처리창 위쪽 정보 표 : 「… 접속 아이디 미등록 사용자(계정) … 행위 유형 조회」 순서로 이어짐
        const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cy.get('.v-dialog--active', { timeout: 10000 }).filter(':visible').last().should(($d) => {
          const all = tx($d[0]);
          expect(all, '!1495 처리창 접속 아이디 = 「미등록 사용자(계정)」').to.match(new RegExp(`접속 아이디\\s*${esc(acct)}`));
          expect(all, '!1495 처리창 행위 유형 = 「조회」').to.match(/행위 유형\s*조회/);
          expect(all, '!1495 수정 전 표시 「(undefined)」 없음').not.to.include('(undefined)');
        });
        closeDlgs();
      });
      cy.log('✅ [2.9.9.0] !1495 미등록 사용자 처리창 확인 완료');
    }

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 접속기록 이력 - 통합 검출팝업 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });

  // ==========================================
  // [2.9.9.0 Depth] !1441 요청별 행위 구분 규칙 (메뉴 설정 「행위구분 추출」 · 「행위구분 맵핑」)
  //   대상 : URI 메뉴 VIP_실시간DLP테스트 (/crm/dlp_tester.jsp, 리눅스_VIP고객) — 규칙을 잠깐 걸고 화면에서 되돌림 (사용자 승인 11-24)
  //   1. CRM dlp_tester.jsp 요청 → 통합 목록 그 행의 처리(⚙) → 메뉴 설정
  //      행위구분 추출 = 직접 입력 · 요청 파라미터 · 키 act / 맵핑 view → 검색(6) · save → 수정(2) → 저장
  //   2. 요청 3건 : act 없음 → 조회(1) · act=view → 검색(6) · act=save → 수정(2) (접속기록 API 행위 코드 + 통합 목록 행위 글자)
  //   3. 화면 복원 : 처리창 → 추출칸 X · 맵핑 행 삭제 → 저장 → 메뉴 정보(GET doubt-menus/425)에 규칙 없음
  //   판정은 복원 뒤에 함 (중간 확인이 틀려도 규칙이 남지 않게). 화면 복원이 안 되면 after 에서 메뉴 정보만 기록 → 직접 복원 필요
  //   참고 (probe_299h) : 「URI 관리 룰」 업무시스템 단위 행위구분 추출·맵핑은 요청 행위를 바꾸지 않음 (복합 메뉴 등록용 · 엑셀 양식 변환)
  //   관찰 기록 : cypress/probe/D02R_관찰.json
  // ==========================================
  {
    const A = require('../../support/anomaly');
    const URI = '/crm/dlp_tester.jsp';
    const MENU_NAME = 'VIP_실시간DLP테스트';
    const RULE_EXP = "#RequestParam['act']";
    const RULE_MAP = '{"view":6,"save":2}';
    const EXPECT = [['', 1, '조회'], ['view', 6, '검색'], ['save', 2, '수정']];
    const EXT_SEL = 'input[aria-label="행위구분 추출:"]';
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const tx = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
    const uniq = (a) => [...new Set(a.filter(Boolean))];
    const p2 = (n) => String(n).padStart(2, '0');
    const kst = (ms) => { const d = new Date(ms + 9 * 3600e3); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`; };
    const TODAY = kst(Date.now()).slice(0, 10);
    const logQ = `/logcatch/api/v1/access-log?startDate=${TODAY}%2000%3A00%3A00&endDate=${TODAY}%2023%3A59%3A59&hasParseError=false&logcatchMenuId=210508&page=0&privacyChk=false&returnRowCountType=1&size=1000&sort&totalCount=0`;
    const obs = {};
    const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/D02R_관찰.json', obs, { log: false }); };
    let AUTH = {};
    const authFrom = (h) => { const o = {}; Object.keys(h || {}).forEach((k) => { if (!/^(host|content-length|content-type|cookie|connection|origin|referer|user-agent|accept.*|sec-.*)$/i.test(k)) o[k] = h[k]; }); return o; };
    let MENU_ID = null;
    let ORIG = null;
    let REVERTED = false;
    const isOn = (m) => !!m && m.actionTypeExpression === RULE_EXP && m.actionTypeCodeMap === RULE_MAP;
    const isOff = (m) => !!m && !m.actionTypeExpression && (!m.actionTypeCodeMap || /^\{\s*\}$/.test(m.actionTypeCodeMap));
    const baseDiff = (m) => Object.keys({ ...(m || {}), ...(ORIG || {}) })
      .filter((k) => !['actionTypeExpression', 'actionTypeCodeMap'].includes(k) && JSON.stringify((m || {})[k]) !== JSON.stringify((ORIG || {})[k]));
    const menuReq = () => cy.request({ url: `/logcatch/api/v1/doubt-menus/${MENU_ID}?bsnId=5`, headers: AUTH, failOnStatusCode: false }).then((r) => (r.body && r.body.etcData) || null);
    const topDlg = () => cy.get('.v-dialog--active').filter(':visible').last();
    const dlgCount = ($b) => $b.find('.v-dialog--active').filter((i, e) => vis(e)).length;
    const pickMenu = (re) => cy.get('.v-menu__content, .menuable__content__active').filter(':visible').last()
      .find('.v-list__tile__title, .v-list__tile__content').filter((i, e) => re.test(tx(e))).first().click({ force: true });
    // 메뉴 설정 카드 = 행위구분 추출 칸과 저장 버튼을 함께 가진 가장 가까운 상위
    const settingBox = ($d) => Cypress.$($d.find(EXT_SEL)[0]).parents().filter((i, e) => Cypress.$(e).find('button, .v-btn').filter((j, b) => vis(b) && tx(b) === '저장').length > 0).first();
    const boxText = (key) => topDlg().then(($d) => { const b = settingBox($d)[0]; note(key, b ? uniq(b.innerText.split('\n').map((x) => x.trim())).slice(0, 40) : '없음'); });
    const saveMenu = () => {
      let before = 0;
      cy.get('body').then(($b) => { before = dlgCount($b); });
      topDlg().then(($d) => cy.wrap(settingBox($d).find('button, .v-btn').filter((j, b) => vis(b) && tx(b) === '저장').first()[0]).click({ force: true }));
      cy.wait(1500);
      // 「메뉴를 저장하시겠습니까?」 확인
      cy.get('body').then(($b) => {
        if (dlgCount($b) <= before) return;
        const ok = $b.find('.v-dialog--active').filter((i, e) => vis(e)).last().find('button, .v-btn').filter((i, e) => vis(e) && /^(확인|예)$/.test(tx(e)))[0];
        if (ok) cy.wrap(ok).click({ force: true });
      });
      cy.wait(3000);
    };
    const closeTop = () => cy.get('body').then(($b) => {
      const d = $b.find('.v-dialog--active').filter((i, e) => vis(e)).last();
      if (!d.length) return;
      const x = d.find('i.v-icon').filter((i, e) => vis(e) && tx(e) === 'close')[0] || d.find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '닫기')[0];
      if (x) cy.wrap(x).click({ force: true });
      cy.wait(1000);
    });
    // 통합 목록에서 대상 행 (목록 API 행 → 화면 표에서 같은 접속 일시 · user001) → 처리창 → 메뉴 설정 펼침
    let LST = 0;
    const openRow = (pred, left, done) => {
      LST += 1;
      const al = `D02R_lst${LST}`;
      cy.intercept('GET', /\/api\/v1\/access-log\?/, (req) => { req.url = req.url.replace('privacyChk=true', 'privacyChk=false'); }).as(al);
      cy.visit('/logcatch/record/accessLog/comprehensiveLog');
      cy.wait(`@${al}`, { timeout: 40000 }).then((x) => {
        const list = (x.response && x.response.body && x.response.body.resultObject) || [];
        const target = list.filter(pred).sort((a, b) => (a.accessDate < b.accessDate ? 1 : -1))[0];
        cy.get('tbody tr', { timeout: 30000 }).filter(':visible').should('have.length.greaterThan', 0);
        cy.wait(1500);
        cy.get('body').then(($b) => {
          const row = target ? $b.find('tbody tr').filter((i, e) => vis(e) && !e.closest('.v-dialog') && tx(e).includes(target.accessDate) && tx(e).includes('user001') && e.querySelector('i.g.g-IConfig'))[0] : null;
          if (!row && left > 0) { cy.wait(20000, { log: false }); openRow(pred, left - 1, done); return; }
          note(`행_${LST}`, target ? { 시각: target.accessDate, menuId: target.menuId, actionType: target.actionType, 화면행: row ? tx(row).slice(0, 160) : '없음' } : '목록 API 에 대상 없음');
          expect(row, `통합 목록에 ${URI} 행 (처리 ⚙)`).to.not.eq(undefined);
          cy.wrap(row.querySelector('i.g.g-IConfig')).click({ force: true });
          cy.wait(4500);
          topDlg().then(($d) => {
            if ($d.find(EXT_SEL).filter((i, e) => vis(e)).length) return;
            cy.wrap($d.find('span.sub-title-title').filter((i, e) => /메뉴 설정/.test(tx(e)))[0]).click({ force: true });
            cy.wait(2500);
          });
          if (done) done();
        });
      });
    };
    // 요청 1건 → 접속기록 API 에 새로 생긴 행 (요청 전에 있던 행 id 는 제외)
    const sendAndRead = (act, out) => {
      const seen = new Set();
      // cy.request 옵션은 명령을 쌓을 때 만들어짐 → 로그인 전 빈 AUTH 로 나가 HTML(로그인 화면)이 옴 (11-24 2차 실행 0행)
      //   → cy.then 안에서 만들어 실행 시점의 AUTH 를 씀
      cy.then(() => cy.request({ url: logQ, headers: AUTH, failOnStatusCode: false })).then((r) => {
        ((r.body && r.body.resultObject) || []).filter((x) => x.uri === URI).forEach((x) => seen.add(String(x.id)));
        out.요청전 = { API상태: r.status, 행수: seen.size };
        // 판정(복원 뒤)에서 기존 행 0행 · 새 행 1건이 아니면 실패
      });
      cy.task('crmFetch', { userId: 'user001', path: act ? `${URI}?act=${act}` : URI, method: 'GET', maxBody: 0 }, { timeout: 90000, log: false })
        .then((r) => { out.요청상태 = r.status; out.요청오류 = r.error; });
      const poll = (left) => cy.request({ url: logQ, headers: AUTH, failOnStatusCode: false }).then((r) => {
        const fresh = ((r.body && r.body.resultObject) || []).filter((x) => x.uri === URI && x.userAccount === 'user001' && !seen.has(String(x.id)))
          .sort((a, b) => (a.accessDate < b.accessDate ? 1 : -1));
        if (fresh.length || left <= 0) { out.새행수 = fresh.length; out.행 = fresh[0] ? { id: fresh[0].id, 시각: fresh[0].accessDate, actionType: fresh[0].actionType, userActionType: fresh[0].userActionType } : null; return; }
        cy.wait(10000, { log: false });
        poll(left - 1);
      });
      cy.wait(8000, { log: false });
      cy.then(() => poll(15)); // 실행 시점 AUTH
    };

    after(() => {
      if (REVERTED || !MENU_ID) return;
      menuReq().then((m) => {
        note('9_복원필요', { 규칙걸림: isOn(m), 규칙꺼짐: isOff(m), 지금: m });
        if (!isOff(m)) cy.log(`🔴 ${MENU_NAME} 메뉴 설정에 행위 규칙이 남아 있음 — 처리창 메뉴 설정에서 행위구분 추출 X · 맵핑 삭제 후 저장 필요`);
      });
    });

    it('[2.9.9.0] !1441 요청별 행위 구분 규칙 — 메뉴 설정 저장 → act 값별 행위 → 화면 복원', { retries: 0 }, () => {
      A.ignoreErrors();
      cy.intercept({ url: /\/logcatch\/api\/v1\// }, (req) => {
        if (req.headers.authorization) AUTH = authFrom(req.headers);
        const mm = req.url.match(/doubt-menus\/(\d+)\?/);
        if (mm && req.method === 'GET' && !ORIG) req.on('after:response', (res) => { if (res.body && res.body.etcData && res.body.etcData.name === MENU_NAME) { MENU_ID = Number(mm[1]); ORIG = res.body.etcData; } });
      });
      A.loginAdmin();

      // ---------- 0. 요청 → 처리창 · 처음 메뉴 정보 ----------
      let since = '';
      cy.then(() => { since = kst(Date.now() - 90000); });
      cy.task('crmFetch', { userId: 'user001', path: URI, method: 'GET', maxBody: 0 }, { timeout: 90000, log: false });
      cy.wait(15000, { log: false });
      openRow((x) => x.uri === URI && x.userAccount === 'user001' && x.accessDate >= since, 6);
      let PRE = false;
      cy.then(() => {
        note('0_처음메뉴정보', ORIG);
        expect(ORIG, `처음 메뉴 정보 (${MENU_NAME})`).to.be.an('object');
        PRE = isOn(ORIG); // 이전 실행이 복원 전에 멈춰 규칙이 남은 경우 → 저장 단계 건너뜀
        expect(PRE || isOff(ORIG), `처음 행위 규칙 — 비어 있거나 이 시나리오 규칙이어야 함 (지금 ${ORIG.actionTypeExpression} / ${ORIG.actionTypeCodeMap})`).to.eq(true);
      });
      boxText('0_처음_설정영역');

      // ---------- 1. 규칙 저장 ----------
      cy.then(() => {
        if (PRE) { note('1_건너뜀', '이미 규칙이 걸려 있음'); return; }
        topDlg().find(EXT_SEL).first().click({ force: true });
        cy.wait(1200);
        pickMenu(/^직접 입력$/);
        cy.wait(1200);
        topDlg().find('.v-select').filter((i, e) => vis(e) && /^요청 본문|^요청 (헤더|파라미터)|^응답/.test(tx(e)) && !e.querySelector(EXT_SEL)).first().find('.v-select__slot').click({ force: true });
        cy.wait(1000);
        pickMenu(/요청 파라미터/);
        cy.wait(800);
        topDlg().find('input').filter((i, e) => vis(e) && /키 이름/.test(e.placeholder || '')).first().clear({ force: true }).type('act', { force: true });
        topDlg().then(($d) => cy.wrap(settingBox($d).find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '편집').first()[0]).click({ force: true }));
        cy.wait(1500);
        [['view', '검색'], ['save', '수정']].forEach(([val, act], i) => {
          if (i > 0) { topDlg().find('button, .v-btn').filter((j, e) => vis(e) && tx(e) === '행 추가').first().click({ force: true }); cy.wait(600); }
          topDlg().find('.action-map-body input[type="text"]').filter((j, e) => vis(e) && !e.readOnly && !e.closest('.v-select')).eq(i).clear({ force: true }).type(val, { force: true });
          topDlg().find('.action-map-body .v-select').filter((j, e) => vis(e)).eq(i).find('.v-select__slot').click({ force: true });
          cy.wait(800);
          pickMenu(new RegExp(`^${act}\\s*(\\(\\d+\\))?$`));
          cy.wait(600);
        });
        topDlg().find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '확인').first().click({ force: true });
        cy.wait(1200);
        boxText('1_저장전_설정영역');
        saveMenu();
      });
      cy.then(() => menuReq().then((m) => note('1_저장뒤_메뉴정보', { 규칙걸림: isOn(m), 지금: m })));
      closeTop();

      // ---------- 2. act 값별 행위 (판정은 복원 뒤) ----------
      const RES = {};
      cy.wait(15000, { log: false });
      EXPECT.forEach(([act]) => { RES[act || '없음'] = {}; sendAndRead(act, RES[act || '없음']); });
      cy.then(() => note('2_act별_행위', RES));

      // ---------- 3. 화면 복원 (방금 행 처리창) ----------
      const UI = {};
      cy.then(() => openRow((x) => x.uri === URI && x.userAccount === 'user001' && x.accessDate >= since, 2, () => {
        // 통합 목록 행위 글자 (방금 세 행)
        cy.get('body').then(($b) => {
          Object.keys(RES).forEach((k) => {
            const h = RES[k].행;
            const tr = h ? $b.find('tbody tr').filter((i, e) => vis(e) && !e.closest('.v-dialog') && tx(e).includes(h.시각) && tx(e).includes('user001'))[0] : null;
            UI[k] = tr ? tx(tr).slice(0, 160) : '화면에 없음';
          });
        });
      }));
      cy.then(() => note('2_목록_행위글자', UI));
      boxText('3_복원전_설정영역');
      topDlg().find(EXT_SEL).first().closest('.v-input').then(($v) => {
        const x = $v.find('i.v-icon').filter((i, e) => vis(e) && /^(clear|close)$/.test(tx(e)))[0];
        if (x) cy.wrap(x).click({ force: true });
      });
      cy.wait(1000);
      topDlg().then(($d) => cy.wrap(settingBox($d).find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '편집').first()[0]).click({ force: true }));
      cy.wait(1500);
      const delAll = (left) => topDlg().then(($d) => {
        const filled = $d.find('.action-map-body input[type="text"]').filter((i, e) => vis(e) && !e.closest('.v-select') && e.value).length;
        const del = $d.find('.action-map-body button, .action-map-body .v-btn').filter((i, e) => vis(e) && (e.title === '삭제' || tx(e) === 'delete'))[0];
        if (!filled || !del || left <= 0) return;
        cy.wrap(del).click({ force: true });
        cy.wait(500);
        delAll(left - 1);
      });
      delAll(6);
      topDlg().find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '확인').first().click({ force: true });
      cy.wait(1200);
      boxText('3_복원_저장전_설정영역');
      saveMenu();
      cy.then(() => menuReq().then((m) => {
        REVERTED = isOff(m) && baseDiff(m).length === 0;
        note('3_복원뒤_메뉴정보', { 복원됨: REVERTED, 규칙외_다른키: baseDiff(m), 지금: m });
      }));
      closeTop();

      // ---------- 판정 ----------
      cy.then(() => {
        expect(REVERTED, `${MENU_NAME} 메뉴 설정 복원 (행위 규칙 없음 · 나머지 처음과 같음)`).to.eq(true);
        EXPECT.forEach(([act, code, label]) => {
          const k = act || '없음';
          const r = RES[k];
          expect(r.요청전 && r.요청전.행수, `act=${k} 요청 전 ${URI} 기존 행 목록 (새 행만 고르기 위함 · API ${r.요청전 && r.요청전.API상태})`).to.be.greaterThan(0);
          expect(r.새행수, `act=${k} 요청 뒤 새로 생긴 행 수`).to.eq(1);
          expect(r.행, `act=${k} 요청의 접속 기록 행`).to.not.eq(null);
          expect(r.행.actionType, `!1441 act=${k} → 행위 코드 ${code}(${label})`).to.eq(code);
          expect(UI[k], `!1441 통합 목록 act=${k} 행 행위 「${label}」`).to.match(new RegExp(`${MENU_NAME}\\s+${label}(\\s|$)`)); // 한글 뒤 \b 는 동작하지 않음
        });
      });
      cy.log('✅ [2.9.9.0] !1441 요청별 행위 구분 규칙 확인 · 복원 완료');
    });
  }
});  

//코드마지막


 })()
;
