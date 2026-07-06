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

    // ==========================================
    // STEP 7: 보고 서브메뉴 
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(2000);

    // ==========================================
    // 페이지수 5-> 25 개 옵션 변경 
    // ==========================================
    // 1. 엉뚱한 화살표 대신, 화면 하단에 '5'라고 적혀있는 페이지 선택 박스를 콕 집어 클릭합니다.
    cy.contains('.v-select__selection', '5').click({ force: true });
    cy.wait(1000); // 콤보박스 메뉴가 스르륵 열릴 때까지 대기
    // 2. 열린 메뉴(.v-menu__content) 안에서 '25'을 찾아서 클릭합니다.
    // (클래스명에 얽매이지 않고 텍스트 '25'을 포함한 요소를 강제 클릭하도록 유연하게 작성)
    cy.get('.v-menu__content').filter(':visible').contains('25') .click({ force: true });
    // 3. 목록이 25개로 갱신될 시간을 넉넉히 줍니다.
    cy.wait(3000);
    
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

    
    // 보고 기능 확인 //------------------------------
    // 월 정기점검 보고서 클릭
    cy.contains('a', '월 정기점검 보고서').click({ force: true });
    cy.wait(1000);
    // 보고서이름 월 정기점검 보고서 -> 자동화 Test 보고서 이름 고치기
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').closest('.v-input').find('.v-input__slot').first().click({ force: true });
    cy.wait(1000);
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type('자동화 Test 보고서', { force: true });
    cy.wait(1000);
    // 설명 월 정기점검 보고서 -> 자동화 Test 기록입니다. 내용 고치기
    cy.get('input[aria-label="설명"]').filter(':visible').closest('.v-input').find('.v-input__slot').first().click({ force: true });
    cy.wait(1000);
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('자동화 Test 기록입니다.', { force: true });
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 월 정기점검 보고서 (행위) 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서 (행위)').should('be.visible').click({ force: true });
    cy.wait(1000);
     //확장자 종류 콤보박스 열기 
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 확장자 종류중 docx 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'docx').should('be.visible').click({ force: true });
    cy.wait(1000);
    
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });

    // 등록한 보고서 행위, 확장자 수정 & 등록한 보고서 검증 ///
    //자동화 Test 보고서 이름 클릭
    cy.contains('a', ' 자동화 Test 보고서').click({ force: true });
    cy.wait(1000); 
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 '개인정보접속 종합 보고서' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '개인정보접속 종합 보고서').should('be.visible').click({ force: true });
    cy.wait(1000);
     //확장자 종류 콤보박스 열기 
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 확장자 종류중 xlsx 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'xlsx').should('be.visible').click({ force: true });
    cy.wait(1000); 
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

  

    //자동화 Test 보고서 이름 클릭
    cy.contains('a', '자동화 Test 보고서').click({ force: true }); 
    cy.wait(1000);
    // 다시 보고서 이름 초기화 시키기
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').closest('.v-input').find('.v-input__slot').first().click({ force: true });
    cy.wait(1000);
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type('월 정기점검 보고서', { force: true });
    cy.wait(1000);
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 '개인정보접속 종합 보고서' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서').should('be.visible').click({ force: true });
    cy.wait(1000);
     //확장자 종류 콤보박스 열기 
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 확장자 종류중 pdf 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'pdf').should('be.visible').click({ force: true });
    cy.wait(1000);
    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    // 보고서 이름 변경확인 
    cy.contains('a', '월 정기점검 보고서').should('be.visible');

    

    // 보고서 목록에 추가 
    // 동그란 플러스 버튼 클릭 
    cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    
    cy.wait(1000);

    // 보고서 추가화면에서 보고서이름 입력
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type('추가보고서_auto', { force: true });
    cy.wait(1000);
    // 보고서 추가화면에서 보고서설명 작성 
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('추가 보고서입니다.', { force: true });
    cy.wait(1000);
    
    // 보고서 추가화면에서 보고서 종류 선택 - 월 정기점검 보고서(행위_Mongo)
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류 콤보박스에서  '월 정기점검 보고서 (행위_Mongo)' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서 (행위_Mongo)').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(1000);

    // 보고서 추가화면에서 업무시스템 - 리눅스_배송관리 선택
    //cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    //cy.wait(1000);
    //cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.get('input[aria-label="업무시스템"]').closest('.v-input__slot').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    //cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().click({ force: true });          
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    //확장자 종류 콤보박스 열기 
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 확장자 종류중 ppt 선택하는 코드
    //cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', 'ppt').should('be.visible').click({ force: true });
    // 1. 드롭다운 컨테이너를 먼저 찾고, 내부를 맨 아래로 스크롤합니다.
    cy.get('.v-menu__content:visible').should('be.visible').scrollTo('bottom', { duration: 500 }); // 부드럽게 끝까지 내림

    // 2. 이제 나타난 'ppt' 항목을 클릭합니다.
    cy.contains('.v-list__tile__title', 'ppt').click({ force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);
 
    
    // 이전 추가 보고서 잘추가되어있다면 진행가능
    // 종합보고서 목록에 추가한 추가보고서_auto가 있는지 확인 
    cy.contains('a', '추가보고서_auto').should('be.visible');
    cy.contains('a', '추가보고서_auto').click({ force: true }); 
    cy.wait(1000);

    //반복설정 OFF-ON으로 변경
    cy.get('input[aria-label="반복설정"]').click({ force: true });
    cy.wait(1000);
    //클릭 후, 해당 요소의 aria-checked 속성이 'true'로 on상태로 바뀌었는지 확인합니다.
    cy.get('input[aria-label="반복설정"]').should('have.attr', 'aria-checked', 'true');
    cy.wait(1000);
    

    //반복설정 ON으로 변경시 대상기간 종료일자 -> 기간 설정으로 변경됨. 
    //기간 콤보박스 열기
    cy.get('input[aria-label="기간"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    // 기간 : 1년 선택
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '1년').should('be.visible').click({ force: true });

    // 저장 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    cy.contains('a', '추가보고서_auto').click({ force: true });
    cy.wait(1000);
     // 기간 1년 변경 확인 검증
    cy.get('span[title="1년"]').should('be.visible').and('have.text', '1년'); 

     // 취소버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true }); 


    // 추가보고서_auto 가 여러개 존재한다면 다 삭제하도록 코드-----------------------------------
    // 1. 반복 삭제를 수행할 함수를 정의합니다.
     const deleteAllReports = () => {
       // body 전체를 가져와서 동기적으로 검사합니다.
       cy.get('body').then(($body) => {
         // 만약 화면(행)에 '추가보고서_auto'라는 글자가 1개라도 남아있다면?
         if ($body.find('tr:contains("추가보고서_auto")').length > 0) {
      
           // --- [삭제 로직 시작] ---
           // 가장 위에 있는 '추가보고서_auto' 행을 찾아서 휴지통 클릭
           cy.contains('tr', '추가보고서_auto').find('.fa-trash').closest('button').then(($btn) => {
                 $btn[0].click(); // [필살기] 강제 클릭
             });

           // 삭제 확인 팝업 처리
           cy.contains('삭제하시겠습니까?').should('be.visible');
           cy.wait(1000); // 팝업 애니메이션 안정화 대기
      
           cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
           // 삭제 후 목록이 갱신될 시간을 잠깐 줍니다.
           cy.wait(1000);

           // --- [삭제 로직 끝] --
           // 중요! 다 지웠는지 확인하기 위해 자기 자신을 다시 호출합니다. (재귀)
           deleteAllReports();
      
          } else {
           // 더 이상 '추가보고서_auto'가 없다면 로그를 남기고 종료합니다.
            cy.log('모든 중복 보고서 삭제 완료!');
         }
       });
     };

      // 2. 정의한 함수를 실행합니다.
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', '추가보고서_auto').should('not.exist');
      cy.wait(1000);
     //--------------------------------------------------------------------------------------

      
    
 
    // 내보내기 & 다운로드 확인--------------------------------
    // 월 정기점검 보고서 클릭
    cy.contains('a', '월 정기점검 보고서').click({ force: true });
    cy.wait(1000);
    // 내보내기 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('내보내기').click({ force: true }); 
    cy.wait(1000);


    // 파일다운로드 알림창 확인 
    cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible').and('contain', '파일 다운로드를 요청했습니다');
    //파일다운로드 알림창 사라졌는지 확인
    // 알림창이 사라질 때까지(보통 3~5초 뒤) 기다렸다가 안 보이는지 체크
    cy.get('.v-snack__content', { timeout: 10000 }).should('not.be.visible');
    
    //실제 로컬 폴더 다운로드 시간 주기
    cy.wait(3000);

    
    // [검증] 다운로드 폴더를 확인합니다.
    // 수행시 기존에 다운로드 받아두었던 파일은 자동으로 지움(사전초기화)
    // 폴더경로 : C:\Users\user\Desktop\CypressWork\cypress\downloads
    cy.task('readDirectory', 'cypress/downloads').then((files) => {
    // files: 다운로드 폴더에 있는 모든 파일 이름들의 리스트
  
    // 조건에 맞는 파일 찾기 (이름에 '월+정기점검+보고서'이 있고, 확장자가 '.pdf'인 것)
     const myFile = files.find(file => file.includes('월+정기점검+보고서') && file.endsWith('.pdf'));

     // 로그 출력
     if (myFile) {
      cy.log(`✅ 다운로드 성공! 파일명: ${myFile}`);
     }

     // 검증: 파일이 존재해야 함 (없으면 에러 발생)
       expect(myFile).to.not.be.undefined; 
     });


    cy.log('✅  내보내기 - 파일 다운로드  확인 완료!');


    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 보고 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
