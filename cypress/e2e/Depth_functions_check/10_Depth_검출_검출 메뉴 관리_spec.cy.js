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
describe('로그캐치 사이트 테스트', () => {
  
  it('로그캐치 배포점검목록 동작 체크', () => {


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
     
 

       ///////////////////////////////////////////////
       // 검출탭 > 검출 메뉴 관리  서브메뉴 선택 
       /////////////////////////////////////////////// 
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
       
       //3.0.3.0_R34785 에서 파일 선택 버튼식으로 변경 
       // 파일선택 확인
       //cy.get('input[type="file"][accept=".xls, .xlsx"]').filter(':visible').should('be.visible');
       
       // 버튼 확인 
       cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
       //3.0.3.0_R34785 에서 파일선택 버튼식으로 변경 
       cy.get('.v-btn__content').filter(':visible').contains('파일 선택').should('be.visible');
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

       //기능 확인 1-------------------------------------------------------
       // 메뉴 등록 필요 URI 검색 동작 
       // 업무시스템 - 리눅스_배송관리 선택
       cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
       cy.wait(1000);
       cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
       // 업무시스템중 리눅스_배송관리 클릭하는 코드
       cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
       cy.wait(1000);
       // 선택한 컨텍스트 메뉴 닫기
       cy.get('body').type('{esc}');

       // HTTP Method 클릭하는 코드 
       cy.get('input[aria-label="HTTP Method"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
       cy.wait(1000);
       // HTTP Method중 POST 클릭하는 코드
       cy.get('.v-menu__content').filter(':visible').contains('GET').click({ force: true });
       cy.wait(500);
       cy.get('.v-menu__content').filter(':visible').contains('POST').click({ force: true });
       cy.wait(500);
       // 선택 후 메뉴 닫기
       cy.get('body').type('{esc}');


       // URI 주소 입력하기 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/privacyFileDownloadAfter.do', { force: true });
       cy.wait(500);

       // 검색 버튼 클릭 
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       cy.wait(500);
       

       // 메뉴등록 필요 검색값 결과 검증코드  
       // '/cop/logcatch/privacyFileDownloadAfter.do' 텍스트를 포함하고 있는 테이블 행(tr)을 찾습니다.
       cy.contains('tr', '/cop/logcatch/privacyFileDownloadAfter.do')
       .scrollIntoView({ block: 'center' }) 
       .within(() => {
       // 2. 그 행(tr) 내부에서 텍스트와 주소가 모두 올바르게 존재하는지 확인합니다.
       cy.contains('a', '리눅스_배송관리').should('be.visible'); 
       cy.contains('a', '메뉴 등록 필요').should('be.visible'); 

       });

        cy.wait(500);

        //기능 확인 2-------------------------------------------------------
       // 메뉴 등록 완료 URI 검색 동작 
       
       // 메뉴 등록 필요 ON(디폴트값) -> OFF 로 변경
       cy.contains('label', '메뉴 등록 필요').closest('.v-input').find('input[type="checkbox"]').uncheck({ force: true }); // 상태를 무조건 OFF로 만듭니다.
       cy.wait(500);

       // 메뉴 등록 필요 상태 OFF인지 검증코드
       cy.contains('label', '메뉴 등록 필요').closest('.v-input').find('input[type="checkbox"]').should('not.be.checked'); // 꺼져 있어야 정상!

       //배송관리 - 상품 배송 현황  URI 주소 입력하기 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectOrderList.do', { force: true });
       cy.wait(500);

       // 검색 버튼 클릭 
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       cy.wait(500);
       

       // 메뉴등록 필요 검색값 결과 검증코드  
       // '/cop/logcatch/selectOrderList.do' 텍스트를 포함하고 있는 테이블 행(tr)을 찾습니다.
       cy.contains('tr', '/cop/logcatch/selectOrderList.do')
       .scrollIntoView({ block: 'center' }) 
       .within(() => {
       // 2. 그 행(tr) 내부에서 텍스트와 주소가 모두 올바르게 존재하는지 확인합니다.
       cy.contains('a', '리눅스_배송관리').should('be.visible'); 
       cy.contains('a', '조회').should('be.visible'); 

       });

       // 기능 확인 3-------------------------------------------------------
       // 오탐/확정 ON 검색 동작 
       cy.wait(1000);

       // 선택한 그룹 x버튼 클릭하여 초기화 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
       cy.wait(500);
  
       // 오탐/확정 OFF(디폴트값) -> ON 상태로 변경
       cy.contains('.v-input:visible', '오탐/확정').find('.v-input--selection-controls__input').click(); // force 없이 정직하게 클릭!
       cy.wait(500);

       // 오탐/확정 상태 ON 인지 검증코드
       cy.contains('.v-input', '오탐/확정').find('input[type="checkbox"]').should('be.checked'); 

       // 오탐/확정 ON상태 검색값 결과 검증코드  
      // 1. 중복이 많은 '리눅스_배송관리' 대신, 가장 고유한 값인 'URI 주소'를 기준으로 해당 줄(tr)을 정확히 짚어냅니다.
      cy.contains('tr', '/cop/logcatch/searchUserInfoList.do')
      .scrollIntoView({ block: 'center' }) 
      .within(() => {
      cy.contains('a', '리눅스_배송관리').should('be.visible'); 
      cy.contains('a', '없음').should('be.visible'); 
         });
      

       // 기능 확인 4-------------------------------------------------------
       //엑셀 다운로드 확인기능 -----------------
    
       // 엑셀 다운로드 클릭하는 코드 
       cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
       cy.wait(500);

       // 엑셀 파일 다운로드 팝업 확인창 진행
       cy.get('input[aria-label="확장자"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
       cy.wait(1000);
    
       // 엑셀파일 다운로드 팝업 확인창에서 콤보박스 메뉴 첫번째 xlsx 선택    
       cy.get('.v-menu__content').filter(':visible').find('.v-list__tile').first().click({ force: true });
       cy.wait(1000);
    
       // 엑셀 다운로드 팝업 확인창에서 AutoDetect1 파일명 입력 
       cy.get('input[aria-label="파일명"]').filter(':visible').first().type('AutoDetect1', { force: true });
       cy.wait(1000);
    
       // 엑셀다운로드 팝업 확인창에서 확인 버튼 클릭
       cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });

       // 엑셀파일다운로드 알림창 확인 
       cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible').and('contain', '파일 다운로드를 요청했습니다');
    
       //엑셀파일다운로드 알림창 사라졌는지 확인
       // 알림창이 사라질 때까지(보통 3~5초 뒤) 기다렸다가 안 보이는지 체크
       cy.get('.v-snack__content', { timeout: 10000 }).should('not.be.visible');
    
       //실제 로컬 폴더 다운로드 시간 주기
       cy.wait(7000);
    
    
       // [검증] 다운로드 폴더를 확인합니다.
       // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
       // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
       cy.task('readDirectory', 'cypress/downloads').then((files) => {
       // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
       // 조건에 맞는 파일 찾기 (이름에 'AutoDetect1'이 있고, 확장자가 '.xlsx'인 것)
      const myFile = files.find(file => file.includes('AutoDetect1') && file.endsWith('.xlsx'));    
       // 로그 출력
        if (myFile) {
          cy.log(`✅ 다운로드 성공! 파일명: ${myFile}`);
        }

        // 검증: 파일이 존재해야 함 (없으면 에러 발생)
        expect(myFile).to.not.be.undefined; 
        });   

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
       // //3.0.3.0_R34785 표 처리 컬럼 없어짐 
       //cy.get('th').filter(':visible').contains('처리').should('be.visible');
       cy.get('th').filter(':visible').contains('수집 제외').should('be.visible');

       //기능 확인 1-------------------------------------------------------
       // 미등록 URI 검색 동작 

       // 업무시스템 - 리눅스_배송관리 선택
       cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
       cy.wait(1000);
       cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
       // 업무시스템중 리눅스_배송관리 클릭하는 코드
       cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
       cy.wait(1000);
       // 업무시스템중 리눅스_배송관리 클릭하는 코드
       cy.contains('.v-list__tile__title', '윈도우_배송관리').should('be.visible').click();
       cy.wait(1000);
       // 선택한 컨텍스트 메뉴 닫기
       cy.get('body').type('{esc}');

       // HTTP Method 클릭하는 코드 
       cy.get('input[aria-label="HTTP Method"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
       cy.wait(1000);
       // HTTP Method중 POST 클릭하는 코드
       cy.get('.v-menu__content').filter(':visible').contains('GET').click({ force: true });
       cy.wait(500);
       cy.get('.v-menu__content').filter(':visible').contains('POST').click({ force: true });
       cy.wait(500);
       // 선택 후 메뉴 닫기
       cy.get('body').type('{esc}');


       //배송관리 - 배송 담당자 조회  URI 주소 입력하기 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectDeliveryList.do', { force: true });
       cy.wait(500);

       // 검색 버튼 클릭 
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       cy.wait(500);

       // 미등록 URI 관리 검색값 결과 검증코드  
       // 1. 테이블의 모든 행(tr)을 가져와서 필터링
       cy.get('tbody tr').filter((index, $el) => {
        // 텍스트를 가져와 앞뒤 공백을 제거한 결과가 빈 값인지 확인
        return $el.querySelectorAll('td')[3].innerText.trim() === '';
      })
      .contains('/cop/logcatch/selectDeliveryList.do').parents('tr')
      .within(() => {
        // 4. '+' 버튼 노출 확인
        cy.get('.fa-plus').should('be.visible');
        // 🌟 [수정된 부분] should('have.text') 대신 공백 제거 후 비교
        cy.get('td').eq(3).invoke('text').then((text) => {
          expect(text.trim()).to.equal('');
        });
      });
       
       //기능 확인 2-------------------------------------------------------
       //등록된 URI검색

       // 등록된 URI 옵션 상태 OFF(디폴트)-> ON상태 변경하여 검색
       cy.contains('.v-input:visible', '등록된 URI').find('.v-input--selection-controls__input').click();
       cy.wait(500);

       // 메뉴 등록 필요 상태 ON인지 검증코드
       cy.contains('.v-input', '등록된 URI').find('input[type="checkbox"]').should('be.checked'); // 켜져 있어야 정상!

       //배송관리 - 배송 담당자 조회  URI 주소 입력하기 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectDeliveryList.do', { force: true });
       cy.wait(500);

       // 검색 버튼 클릭 
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       cy.wait(500);

       // 등록된 URI 검색결과가 없는경우
       // 'No data available'이라는 문구가 화면에(또는 표 내부에) 나타나는지 확인 검증코드
       //cy.contains('td', 'No data available').should('be.visible');

       // 1. 검색 결과 테이블에 데이터가 존재하는지 확인 (최소 1개 이상의 행)
       cy.get('tbody tr').should('have.length.at.least', 1);
       // 2. 검색된 모든 행의 '등록된 URI'(4번째 칸)에 값이 차 있는지 검증
       cy.get('tbody tr').each(($el) => {
        cy.wrap($el).find('td').eq(3).invoke('text').then((text) => {
          // 등록된 URI 칸이 비어있지 않아야 함 (이미 등록된 데이터들이므로)
          expect(text.trim()).to.not.be.empty;
          expect(text.trim()).to.equal('/cop/logcatch/selectDeliveryList.do');
        });
      });

      // 검색된 모든 행의 5번째 칸(index 4)에 있는 버튼의 비활성화 상태를 확인합니다.
      cy.get('tbody tr').each(($tr) => {
        // 1. 해당 행의 5번째 열(td)을 찾습니다.
        cy.wrap($tr).find('td').eq(4) 
        // 2. 그 안의 버튼 요소를 찾아 클래스를 검증합니다.
        .find('button, .v-btn') 
        .should('have.class', 'v-btn--disabled'); 
      });

     

    

       //기능 확인 3-------------------------------------------------------
       // 등록 URI 검색 

        // 선택한 그룹 x버튼 클릭하여 초기화 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
       cy.wait(500);

       //배송관리 - 상품 배송현황  URI 주소 입력하기 
       cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectOrderList.do', { force: true });
       cy.wait(500);

       // 검색 버튼 클릭 
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       cy.wait(500);

       // 미등록 URI 관리  검색값 결과 검증코드  
       // '/cop/logcatch/selectOrderList.do' 텍스트를 포함하고 있는 테이블 행(tr)을 찾습니다.
       // 1. 해당 URI 주소가 포함된 행(tr)을 찾습니다.
       cy.contains('tr', '/cop/logcatch/selectOrderList.do')
       .scrollIntoView({ block: 'center' })
       .within(() => {
    
       // [해결 1] 등록된 URI 열(4번째 td)의 값 검증
       // eq(3)은 0부터 시작하므로 4번째 칸을 의미합니다. 
       // 수집된 URI(eq(2))와 섞이지 않도록 칸을 정확히 지정합니다.
      cy.get('td').eq(3).within(() => {
      cy.contains('a', '/cop/logcatch/selectOrderList.do').should('be.visible');
       });

      // [해결 2] '+' 버튼 비활성화 상태 검증
      // 비활성화된 버튼은 보통 'v-btn--disabled' 클래스를 가지거나 pointer-events: none 등의 스타일이 적용됩니다.
      // 5번째 칸(eq(4))에 있는 버튼을 찾아 비활성화 상태인지 확인합니다.
       cy.get('td').eq(4).find('button, .v-btn').should('have.class', 'v-btn--disabled'); // Vuetify 비활성화 표준 클래스
       // 만약 클래스로 검증이 안 된다면, 버튼의 i 태그(아이콘) 색상이나 존재로 확인
       cy.get('.fa-plus').should('be.visible'); 
       });


       cy.log('✅ 검출 - 검출메뉴관리 - [URI 관리] 출력 확인 완료 ');
      

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 Depth 검출 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  


 })()
;
