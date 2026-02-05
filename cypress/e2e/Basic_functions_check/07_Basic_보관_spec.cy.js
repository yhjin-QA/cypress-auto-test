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
      'Loading chunk',    //네트워크 로딩에러 
      'operate.task.packageManagement',
      'e is not defined',
      'Script error',
      'not valid JSON'
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
    // STEP 8: 보관 서브메뉴 
    // ==========================================
    
    /*
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
    */

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

     // 정책 추가 기능 확인 -------------------

    // 우측 동그란 + 플러스 버튼 클릭
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 정책추가 화면
    // 정책 이름 입력 
    // 정책 추가화면에서 정책 이름 입력
    cy.get('input[aria-label="정책 이름"]').filter(':visible').first().clear({ force: true }).type('Test_위변조정책_auto', { force: true });
    cy.wait(1000);
    // 정책 상세에서 정책상세설명 입력
    cy.get('input[aria-label="정책 상세"]').filter(':visible').first().clear({ force: true }).type('Test_위변조정책_auto 추가설명입니다.', { force: true });
    cy.wait(1000);
    
    //정책추가화면에서 날짜 선택 - 시작 기간선택
    //날짜 선택 콤보박스 열기 
    cy.get('input[aria-label="날짜 선택"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 날짜선택  콤보박스에서  '시작 기간선택' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '시작 기간선택').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 금일로부터 0일 이전 데이터에 대해 검사할지 입력
    // 텍스트를 먼저 찾고 그 텍스트를 감싸는 컴포넌트(입력창 영역)를 찾아서 진짜 input 태그 선택
    cy.contains('일 이전').closest('div[data-v-173fa03b]').find('input').clear({ force: true }).type('7', { force: true });
    
    // 저장 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 저장 확인 창에서 문구를 확인하고 확인버튼 클릭
    cy.contains('선택된 기간에대해 무결성 검사를 진행합니다.').should('be.visible').closest('.v-card').find('button').contains('확인').click({ force: true });
    cy.wait(1000);
    
    // 날짜 수정 - 시작기간 -> 특정기간으로 수정 -------------------------------------------------
    //추가한 정책 재클릭 
    cy.contains('a', 'Test_위변조정책_auto').click({ force: true }); 
    cy.wait(1000);

    //정책추가화면에서 날짜 선택 - 특정 기간선택
    //날짜 선택 콤보박스 열기 
    cy.get('input[aria-label="날짜 선택"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 날짜선택  콤보박스에서  '시작 기간선택' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '특정 기간선택').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 금일로부터 0일 이전 데이터에 대해 검사할지 입력  (7->3으로 변경)
    // 텍스트를 먼저 찾고 그 텍스트를 감싸는 컴포넌트(입력창 영역)를 찾아서 진짜 input 태그 선택
    cy.contains('일 이전').closest('div[data-v-173fa03b]').find('input').clear({ force: true }).type('3', { force: true });

    // 저장 버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 저장 확인 창에서 문구를 확인하고 확인버튼 클릭
    cy.contains('선택된 기간에대해 무결성 검사를 진행합니다.').should('be.visible').closest('.v-card').find('button').contains('확인').click({ force: true });
    cy.wait(1000);

    // 변경사항 검증확인
    //추가한 정책 재클릭 
    cy.contains('a', 'Test_위변조정책_auto').click({ force: true }); 
    cy.wait(1000);
    cy.get('span[title="특정 기간선택"]').filter(':visible').should('exist');
    cy.contains('일 이전').closest('div[data-v-173fa03b]').find('input').should('have.value', '3');
    cy.log('✅ 위변조 검사 정책/플랜 변경사항 확인완료!');


    // 정책이름  삭제기능 
    // 정책이름  Test_위변조정책_auto 가 여러개 존재한다면 다 삭제하도록 코드-----------------------------------
    // 1. 반복 삭제를 수행할 함수를 정의합니다.
     const deleteAllReports = () => {
       // body 전체를 가져와서 동기적으로 검사합니다.
       cy.get('body').then(($body) => {
         // 만약 화면(행)에 'Test_위변조정책_auto'라는 글자가 1개라도 남아있다면?
         if ($body.find('tr:contains("Test_위변조정책_auto")').length > 0) {
      
           // --- [삭제 로직 시작] ---
           // 가장 위에 있는 'Test_위변조정책_auto' 행을 찾아서 휴지통 클릭
           cy.contains('tr', 'Test_위변조정책_auto').find('.fa-trash').closest('button').then(($btn) => {
                 $btn[0].click(); // [필살기] 강제 클릭
             });

           // 삭제 확인 팝업 처리
           cy.contains('삭제하시겠습니까?').should('be.visible');
           cy.wait(500); // 팝업 애니메이션 안정화 대기
      
           cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
           // 삭제 후 목록이 갱신될 시간을 잠깐 줍니다.
           cy.wait(1000);

           // --- [삭제 로직 끝] --
           // 중요! 다 지웠는지 확인하기 위해 자기 자신을 다시 호출합니다. (재귀)
           deleteAllReports();
      
          } else {
           // 더 이상 'Test_위변조정책_auto'가 없다면 로그를 남기고 종료합니다.
            cy.log('모든 Test_위변조정책_auto 정책 삭제 완료!');
         }
       });
     };

      // 2. 정의한 함수를 실행합니다.
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', '추가보고서_auto').should('not.exist');
      cy.wait(1000);
     //--------------------------------------------------------------------------------------
    
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

     // 검색 기능 확인 -------------------
     //DB 무결성 점검상태 - 정상 확인 
     // DB 무결성 점검상태  팝업창 띄우기
     cy.get('input[aria-label="DB 무결성 점검 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);
   
     // DB 무결성 점검상태에서 '정상' 선택 
     cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '정상').click({ force: true });
     cy.wait(1000);
     // DB 무결성 점검상태 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');
     cy.wait(1000);

     //검색 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);
    
     // 검색결과로 DB 무결성 점검상태 '정상' 값이 적어도  1개이상 존재하는지확인
     // cy.contains('a.ellipsis', '정상').should('be.visible'); 
     cy.get('a.ellipsis').filter(':contains("정상")').should('have.length.at.least', 1);

     // DB 무결성 점검상태 - 오류 확인
     // DB 무결성 점검상태 x버튼 클릭하여 초기화 
     cy.get('input[aria-label="DB 무결성 점검 상태"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true }); 

     // DB 무결성 점검상태  팝업창 다시 띄우기
     cy.get('input[aria-label="DB 무결성 점검 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // DB 무결성 점검상태에서 '오류' 선택 
     cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '오류').click({ force: true });
     cy.wait(1000);
     // DB 무결성 점검상태 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');
     cy.wait(1000);

     //검색 버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(1000);
    
     // 오류상태 없는것으로 오류검색이 되었다는것으로 검증확인
     // 검색 결과 리스트(a.ellipsis) 중에 '오류'라는 글자가 '없어야' 합니다.
     cy.contains('a.ellipsis', '오류').should('not.exist');

     //엑셀 다운로드 확인기능 -----------------
     // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(500);

    // 엑셀 파일 다운로드 팝업 확인창 진행
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 엑셀파일 다운로드 팝업 확인창에서 콤보박스 메뉴 첫번째 xlsx 선택
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile').first().click({ force: true });
    cy.wait(1000);
    
    // 엑셀 다운로드 팝업 확인창에서 파일명 입력 
    cy.get('input[aria-label="파일명"]').filter(':visible').type('Testauto', { force: true });
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
  
    // 조건에 맞는 파일 찾기 (이름에 'Testauto'이 있고, 확장자가 '.xlsx'인 것)
     const myFile = files.find(file => file.includes('Testauto') && file.endsWith('.xlsx'));

     // 로그 출력
     if (myFile) {
      cy.log(`✅ 다운로드 성공! 파일명: ${myFile}`);
     }

     // 검증: 파일이 존재해야 함 (없으면 에러 발생)
       expect(myFile).to.not.be.undefined; 
     });

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

     // 검색 기능 확인--------------------------------------
    ////////////////////////////
    // 기능확인 - 조건별로 검색 
    //업무 시스템 - 리눅스_배송관리 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 위 변조 여부 값중 - 일치 클릭 
    // 위변조 여부 전체(디폴트)값을 클릭하여 콤보박스 열기 
    cy.get('span[title="전체"]').filter(':visible').click({ force: true });
    cy.wait(500); // 메뉴가 펼쳐지는 애니메이션을 위해 잠시 대기

    // 위변주 여부 열린 메뉴(.v-menu__content) 중에서 '일치'를 찾아 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '일치').should('be.visible').click({ force: true });
    // 선택한 컨텍스트메뉴닫기 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     
    //조건 검색결과 검증
    //위변조 여부 일치값
    //검색결과로 DB 무결성 점검상태 '정상' 값이 적어도  1개이상 존재하는지확인
    cy.get('a.ellipsis').filter(':contains("리눅스_배송관리")').should('have.length.at.least', 1);
    //cy.get('.ellipsis').filter(':contains("일치")').should('have.length.at.least', 1);
    cy.get('.ellipsis').contains('a', '일치').should('be.visible');

    //-------------------
    // 업무시스템 초기화
    // 업무시스템 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(1000); 
    //// 기능확인 - 조건별로 검색 
    //업무 시스템 - 콤보박스 띄우기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(1000); 
     // 업무시스템중 윈도우_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '윈도우_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 위 변조 여부 값중 - 일치 클릭 
    // 위변조 여부 [일치]값을 클릭하여 콤보박스 열기 
    cy.get('input[aria-label="위 변조 여부"]').closest('.v-input').find('.v-input__slot').filter(':visible').click({ force: true });
    //cy.get('span[title="일치"]').filter(':visible').click({ force: true });
    cy.wait(500); // 메뉴가 펼쳐지는 애니메이션을 위해 잠시 대기

    // 위변주 여부 열린 메뉴(.v-menu__content) 중에서 '일치'를 찾아 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '불일치').should('be.visible').click({ force: true });
    // 선택한 컨텍스트메뉴닫기 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     
    //조건 검색결과 검증
    //위변조 여부 일치값
    //검색 결과 리스트(a.ellipsis) 중에 '불일치'라는 글자가 '없어야' 합니다.
    cy.contains('a.ellipsis', '불일치').should('not.exist');


    //-------------------
    // 업무시스템 초기화
    // 업무시스템 x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(1000); 
    //// 기능확인 - 조건별로 검색 
    //업무 시스템 - 콤보박스 띄우기
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    cy.wait(1000); 
     // 업무시스템중 윈도우_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '전체 선택').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    // 입력창 옆에 있는 '화살표 아이콘(▼)'을 찾아서 클릭하여 컨텍스트 메뉴 창 닫기
    cy.get('input[aria-label="업무시스템"]').closest('.v-input').find('.v-input__icon--append').click({ force: true });
    

    // 20260127_0_res_0000.gz 파일명 입력하기 
    cy.get('input[aria-label="파일명"]').filter(':visible').clear({ force: true }).type('20260127_0_res_0000.gz', { force: true }); // 원하는 파일명 입력
    cy.wait(1000);

    // 위 변조 여부 값중 - 일치 클릭 
    // 위변조 여부 [일치]값을 클릭하여 콤보박스 열기 
    cy.get('input[aria-label="위 변조 여부"]').closest('.v-input').find('.v-input__slot').filter(':visible').click({ force: true });
    //cy.get('span[title="일치"]').filter(':visible').click({ force: true });
    cy.wait(500); // 메뉴가 펼쳐지는 애니메이션을 위해 잠시 대기

    // 위변주 여부 열린 메뉴(.v-menu__content) 중에서 '일치'를 찾아 클릭
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '전체').should('be.visible').click({ force: true });
    // 선택한 컨텍스트메뉴닫기 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     
    //조건 검색결과 검증
    cy.contains('a', '20260127_0_res_0000.gz').should('be.visible');
    cy.get('.ellipsis').contains('a', '일치').should('be.visible');

    //엑셀 다운로드 확인기능 -----------------
     // 엑셀 다운로드 클릭하는 코드 
    cy.get('.v-btn__content').filter(':visible').contains('엑셀 다운로드').click({ force: true });
    cy.wait(500);

    // 엑셀 파일 다운로드 팝업 확인창 진행
    cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 엑셀파일 다운로드 팝업 확인창에서 콤보박스 메뉴 첫번째 xlsx 선택
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile').first().click({ force: true });
    cy.wait(1000);
    
    // 엑셀 다운로드 팝업 확인창에서 AutoTest1 파일명 입력 
    cy.get('input[aria-label="파일명"]').filter(':visible').first().type('AutoTest1', { force: true });
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
  
    // 조건에 맞는 파일 찾기 (이름에 'AutoTest1'이 있고, 확장자가 '.xlsx'인 것)
     const myFile = files.find(file => file.includes('AutoTest1') && file.endsWith('.xlsx'));

     // 로그 출력
     if (myFile) {
      cy.log(`✅ 다운로드 성공! 파일명: ${myFile}`);
     }

     // 검증: 파일이 존재해야 함 (없으면 에러 발생)
       expect(myFile).to.not.be.undefined; 
     });


     cy.log('✅ 접속기록 무결성-파일 위변조 검사 이력조회 탭 진입 및 데이터 출력 확인 완료!');
     

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 보관 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
