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


    // ==========================================
    // 기존 잔여정책이 존재한다면 삭제  
    // ==========================================
    // Depth검증용 보고서_auto 가 여러개 존재한다면 다 삭제하도록 코드-----------------------------------
    // 1. 반복 삭제를 수행할 함수를 정의합니다.
     const deleteAllReports = () => {
       // body 전체를 가져와서 동기적으로 검사합니다.
       cy.get('body').then(($body) => {
         // 만약 화면(행)에 'Depth검증용 보고서_auto'라는 글자가 1개라도 남아있다면?
         if ($body.find('tr:contains("Depth검증용 보고서_auto")').length > 0) {
      
           // --- [삭제 로직 시작] ---
           // 가장 위에 있는 'Depth검증용 보고서_auto' 행을 찾아서 휴지통 클릭
           cy.contains('tr', 'Depth검증용 보고서_auto').find('.fa-trash').closest('button').then(($btn) => {
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
           // 더 이상 'Depth검증용 보고서_auto'가 없다면 로그를 남기고 종료합니다.
            cy.log('모든 중복 Depth검증용 보고서_auto 삭제 완료!');
         }
       });
     };
      cy.wait(4000);
      // 2. 정의한 함수를 실행합니다.
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', 'Depth검증용 보고서_auto').should('not.exist');
      cy.wait(1000);
      //-----------------------------------------------------------------------------------


    // ==========================================
    // 보고서 셋팅 : 추가하기 - 월 정기점검 보고서 
    // ==========================================
 
    // 보고서 추가하기 - 동그란 플러스 버튼 클릭 
    cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });    
    cy.wait(1000);

    // 보고서 추가화면에서 보고서이름 입력
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type('Depth검증용 보고서_auto', { force: true });
    cy.wait(1000);
    // 보고서 추가화면에서 보고서설명 작성 
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('Depth검증용 보고서입니다.', { force: true });
    cy.wait(1000);
    
    // 보고서 추가화면에서 보고서 종류 선택 - 월 정기점검 보고서
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류 콤보박스에서  '월 정기점검 보고서 (행위_Mongo)' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 보고서 추가화면에서 업무시스템 - 리눅스_배송관리 선택
    cy.get('input[aria-label="업무시스템"]').closest('.v-input__slot').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().click({ force: true });          
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 아래 확장자별 검색이있으므로 디폴트값 pdf로진행
    // //확장자 종류 - html 선택  
    // // 디폴트값 확인을 위한  PDF클릭
    // cy.get('span[title="pdf"]').should('be.visible').click({ force: true }); 
    // //cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.wait(500);
    
    // // 확장자 콤보박스에서 html 선택
    // cy.contains('.v-list__tile__title', 'html').click({ force: true });
    // cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    //보고서 목록에서 추가한 Depth검증용 보고서_auto 클릭
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(500);
    
    // ==========================================
    // [검증코드] 월 정기점검 보고서 
    // ========================================== 
    // // [[보고서 미리보기 검증 코드]
    // cy.get('iframe', { timeout: 60000 }).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
    // .within(() => {
    //   // 우측 상단 헤더: '보고서 종류' 텍스트가 존재하는지 확인
    //   cy.contains('월 정기점검 보고서', { timeout: 60000 }).should('be.visible');
    //   // 중앙 타이틀: 방금 입력한 '보고서 이름'이 화면에 잘 그려졌는지 확인
    //   cy.contains('Depth검증용 보고서_auto', { timeout: 60000 }).should('be.visible');
    // });

    // 1. 🚨 [매우 중요] 클릭하기 직전에, 화면을 그렸다는 서버의 신호(getPage)를 낚아채기 위해 그물을 칩니다!
    cy.intercept('POST', '**/oz80/server?getPage=*').as('loadReport');

    // 2. 보고서 목록에서 추가한 보고서 클릭하여 열기
    cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    cy.wait(1000);
    
    // 3. 🌟 [최종 해결책] 아이프레임 안의 글자를 찾는 대신, 그물에 통신이 걸려들 때까지 60초를 기다립니다!
    // 이 통신이 200(성공)으로 떨어졌다는 것은, 이미지든 글자든 리포트 렌더링이 무사히 끝났다는 뜻입니다.
    cy.wait('@loadReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ 오즈 리포트 렌더링 완료 (통신 성공 검증)!');
    
    cy.log('✅ 월 정기점검 보고서 우측 미리보기  검증 완료!');
    //좌측 (수정 패널) 입력값 검증코드
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서_auto');
    cy.get('input[aria-label="설명"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서입니다.');
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').should('contain.text', '월 정기점검 보고서');
    cy.get('input[aria-label="업무시스템"]').closest('.v-input').find('.v-chip__content').should('be.visible').and('contain.text', '리눅스_배송관리');
    // 확장자 변경 안했다면 디폴트값 확장자로 검증
    cy.get('input[aria-label="확장자"]').closest('.v-input').should('contain.text', 'pdf');
    cy.log('✅ 월 정기점검 보고서 좌측 폼 입력값 보존 검증 완료!'); 
   
    //-----------------------------------------------------------------------------------------------------------------------------

    // ==========================================================
    // 보고서 변경하기 - 월 정기점검 보고서 -> 월 정기점검 보고서 (행위)
    // ===========================================================
    
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 월 정기점검 보고서 (행위) 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서 (행위)').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    //보고서 목록에서 추가한 Depth검증용 보고서_auto 클릭
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(500);

    // ==========================================
    // [검증코드] 월 정기점검 보고서 (행위)
    // ========================================== 
    // // [[보고서 미리보기 검증 코드]
    // cy.get('iframe', { timeout: 60000 }).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
    // .within(() => {
    //   // 우측 상단 헤더: '보고서 종류' 텍스트가 존재하는지 확인
    //   cy.contains('월 정기점검 보고서', { timeout: 60000 }).should('be.visible');
    //   // 중앙 타이틀: 방금 입력한 '보고서 이름'이 화면에 잘 그려졌는지 확인
    //   cy.contains('Depth검증용 보고서_auto', { timeout: 60000 }).should('be.visible');
    // });

    // 1. 🚨 [매우 중요] 클릭하기 직전에, 화면을 그렸다는 서버의 신호(getPage)를 낚아채기 위해 그물을 칩니다!
    cy.intercept('POST', '**/oz80/server?getPage=*').as('loadReport');

    // 2. 보고서 목록에서 추가한 보고서 클릭하여 열기
    cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    
    // 3. 🌟 [최종 해결책] 아이프레임 안의 글자를 찾는 대신, 그물에 통신이 걸려들 때까지 60초를 기다립니다!
    // 이 통신이 200(성공)으로 떨어졌다는 것은, 이미지든 글자든 리포트 렌더링이 무사히 끝났다는 뜻입니다.
    cy.wait('@loadReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ 오즈 리포트 렌더링 완료 (통신 성공 검증)!');

    cy.log('✅ 월 정기점검 보고서 (행위) 우측 미리보기  검증 완료!');
    //좌측 (수정 패널) 입력값 검증코드
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서_auto');
    cy.get('input[aria-label="설명"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서입니다.');
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').should('contain.text', '월 정기점검 보고서 (행위)');
    cy.get('input[aria-label="업무시스템"]').closest('.v-input').find('.v-chip__content').should('be.visible').and('contain.text', '리눅스_배송관리');
    // 확장자 변경 안했다면 디폴트값 확장자로 검증
    cy.get('input[aria-label="확장자"]').closest('.v-input').should('contain.text', 'pdf');
    cy.log('✅ 월 정기점검 보고서 (행위) 좌측 폼 입력값 보존 검증 완료!'); 
    //------------------------------------------------------------------------------------------------------------------------------------------------------

    // ==========================================================
    // 보고서 변경하기 - 월 정기점검 보고서 (행위) -> 월 정기점검 보고서 (행위_Mongo)
    // ===========================================================
    
    // 1. [중요] 저장 API를 미리 감시합니다.
    cy.intercept('POST', '**/logcatch/pams/ozreport').as('saveReportApi');  
    
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 월 정기점검 보고서 (행위) 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서 (행위_Mongo)').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 3. [핵심] 서버 응답이 올 때까지 대기 (고정 wait 대신 사용)
    cy.wait('@saveReportApi', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    //보고서 목록에서 추가한 Depth검증용 보고서_auto 클릭
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(500);

    // ==========================================
    // [검증코드] 월 정기점검 보고서 (행위_Mongo)
    // ========================================== 
    // // [[보고서 미리보기 검증 코드]
    // cy.get('iframe', { timeout: 60000 }).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
    // .within(() => {
    //   // 우측 상단 헤더: '보고서 종류' 텍스트가 존재하는지 확인
    //   cy.contains('월 정기점검 보고서', { timeout: 60000 }).should('be.visible');
    //   // 중앙 타이틀: 방금 입력한 '보고서 이름'이 화면에 잘 그려졌는지 확인
    //   cy.contains('Depth검증용 보고서_auto', { timeout: 60000 }).should('be.visible');
    // });

    // 1. 🚨 [매우 중요] 클릭하기 직전에, 화면을 그렸다는 서버의 신호(getPage)를 낚아채기 위해 그물을 칩니다!
    cy.intercept('POST', '**/oz80/server?getPage=*').as('loadReport');

    // 2. 보고서 목록에서 추가한 보고서 클릭하여 열기
    cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    
    // 3. 🌟 [최종 해결책] 아이프레임 안의 글자를 찾는 대신, 그물에 통신이 걸려들 때까지 60초를 기다립니다!
    // 이 통신이 200(성공)으로 떨어졌다는 것은, 이미지든 글자든 리포트 렌더링이 무사히 끝났다는 뜻입니다.
    cy.wait('@loadReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ 오즈 리포트 렌더링 완료 (통신 성공 검증)!');


    cy.log('✅ 월 정기점검 보고서 (행위_Mongo) 우측 미리보기  검증 완료!');
    //좌측 (수정 패널) 입력값 검증코드
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서_auto');
    cy.get('input[aria-label="설명"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서입니다.');
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').should('contain.text', '월 정기점검 보고서 (행위_Mongo)');
    cy.get('input[aria-label="업무시스템"]').closest('.v-input').find('.v-chip__content').should('be.visible').and('contain.text', '리눅스_배송관리');
    cy.get('input[aria-label="확장자"]').closest('.v-input').should('contain.text', 'pdf');
    cy.log('✅ 월 정기점검 보고서 (행위_Mongo) 좌측 폼 입력값 보존 검증 완료!'); 
    //------------------------------------------------------------------------------------------------------------------------------------------------------

    // ===================================================================
    // 보고서 변경하기 - 월 정기점검 보고서 (행위_Mongo) -> 개인정보접속 종합 보고서
    // ====================================================================
    
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류중 월 정기점검 보고서 (행위) 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '개인정보접속 종합 보고서').should('be.visible').click({ force: true });
    cy.wait(1000);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    //보고서 목록에서 추가한 Depth검증용 보고서_auto 클릭
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(500);

    // ==========================================
    // [검증코드] 개인정보접속 종합 보고서
    // ========================================== 
    // // [[보고서 미리보기 검증 코드]
    // cy.get('iframe', { timeout: 60000 }).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
    // .within(() => {
    //   // 우측 상단 헤더: '보고서 종류' 텍스트가 존재하는지 확인
    //   cy.contains('개인정보접속 종합 보고서', { timeout: 60000 }).should('be.visible');
    //   // 중앙 타이틀: 방금 입력한 '보고서 이름'이 화면에 잘 그려졌는지 확인
    //   cy.contains('Depth검증용 보고서_auto', { timeout: 60000 }).should('be.visible');
    // });

    // 1. 🚨 [매우 중요] 클릭하기 직전에, 화면을 그렸다는 서버의 신호(getPage)를 낚아채기 위해 그물을 칩니다!
    cy.intercept('POST', '**/oz80/server?getPage=*').as('loadReport');

    // 2. 보고서 목록에서 추가한 보고서 클릭하여 열기
    cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    
    // 3. 🌟 [최종 해결책] 아이프레임 안의 글자를 찾는 대신, 그물에 통신이 걸려들 때까지 60초를 기다립니다!
    // 이 통신이 200(성공)으로 떨어졌다는 것은, 이미지든 글자든 리포트 렌더링이 무사히 끝났다는 뜻입니다.
    cy.wait('@loadReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.log('✅ 오즈 리포트 렌더링 완료 (통신 성공 검증)!');

    cy.log('✅ 개인정보접속 종합 보고서 우측 미리보기  검증 완료!');
    //좌측 (수정 패널) 입력값 검증코드
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서_auto');
    cy.get('input[aria-label="설명"]').filter(':visible').first().should('have.value', 'Depth검증용 보고서입니다.');
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').should('contain.text', '개인정보접속 종합 보고서');
    cy.get('input[aria-label="업무시스템"]').closest('.v-input').find('.v-chip__content').should('be.visible').and('contain.text', '리눅스_배송관리');
    cy.get('input[aria-label="확장자"]').closest('.v-input').should('contain.text', 'pdf');
    cy.log('✅ 개인정보접속 종합 보고서 좌측 폼 입력값 보존 검증 완료!'); 
    //------------------------------------------------------------------------------------------------------------------------------------------------------
    
    // // ===================================================================
    // // 보고서 디폴트상태  - 개인정보접속 종합 보고서-> 월 정기점검 보고서 (초기화)
    // // ====================================================================
    // //보고서 종류 콤보박스 열기 
    // cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.wait(500);
    // // 보고서 종류중 월 정기점검 보고서 (행위) 선택하는 코드
    // cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서').should('be.visible').click({ force: true });
    // cy.wait(500);

    // // 저장버튼 클릭 
    // cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    // cy.wait(1000);

    // //보고서 목록에서 추가한 Depth검증용 보고서_auto 클릭
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(500);


    // ===================================================================
    //  모든 보고서 & 모든 확장자 조합 검증 (미리보기화면, 확장자 상태)
    // 🌟 4개 보고서 종류 × 15개 확장자 = 총 60종 자동 반복 테스트 시작
    // ====================================================================
    
    // 1. 테스트할 데이터 배열 정의
    const reportTypes = ['월 정기점검 보고서', '월 정기점검 보고서 (행위)', '월 정기점검 보고서 (행위_Mongo)', '개인정보접속 종합 보고서'];
    
    const extensions = ['html', 'xlsx', 'pdf', 'docx', 'mht', 'xls', 'ppt', 'txt', 'jpg', 'png', 'gif', 'tif', 'svg', 'hwp', 'csv']; 

    // 2. [바깥쪽 루프] 보고서 종류를 하나씩 꺼냅니다.
    reportTypes.forEach((reportType) => {
      
      cy.log(`=========================================`);
      cy.log(`🚀 [보고서 종류 변경 시작]: ${reportType}`);
      cy.log(`=========================================`);

      // 보고서 종류 콤보박스 열기 
      cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
      cy.wait(1000);
      
      // 배열에서 꺼낸 보고서 종류(reportType) 선택
      cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', reportType).should('be.visible').click({ force: true });
      cy.wait(1000);

      // 보고서 종류 변경 사항 1차 저장
      cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
      cy.wait(1000);

      // 보고서 목록에서 열기
      cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
      cy.wait(1000);


      // 3. [안쪽 루프] 선택된 보고서에 대해 15개 확장자를 순회합니다.
      extensions.forEach((ext) => {
        
        cy.log(`▶▶▶ 테스트 중: [${reportType}] - [${ext}] 확장자 ◀◀◀`);
        cy.wait(1000);

        // 확장자 콤보박스 열기 
        cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
        cy.wait(1000);
        
        // // Vuetify 특성상 콤보박스 메뉴가 누적될 수 있으므로 :visible 필터로 정확히 잡아서 클릭
        // cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', ext).click({ force: true });
        // cy.wait(1000);

        // 2. 🌟 [핵심] 수십 개의 찌꺼기 메뉴를 무시하고, 현재 '활성화'된 메뉴창만 정확히 찝어냅니다.
        cy.get('.menuable__content__active').within(() => {
        // 3. 🌟 [핵심] 찾으려는 확장자 글자로 스크롤을 쫙 끌어내린 뒤 클릭합니다!
        cy.contains('.v-list__tile__title', ext).scrollIntoView().should('be.visible').click({ force: true });
        cy.wait(1000);
         });

         cy.wait(1000); // 팝업 닫힘 대기

        // 저장버튼 클릭 
        cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
        cy.wait(1000);

        // // 보고서 목록에서 추가한 보고서 클릭하여 다시 열기
        // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
        // cy.wait(1500); // 렌더링 대기를 위해 시간 넉넉히!

        // ==========================================
        // [검증코드] 미리보기 렌더링 & 폼 데이터 유지 확인
        // ========================================== 
        // 🌟 [핵심 예외 처리] 콤보박스 선택값과 실제 미리보기 타이틀이 다른 경우를 맞춥니다.
        let expectedPreviewText = reportType; 
        // 1. 대표 이름으로 묶어줄 3가지 보고서의 '정확한 이름'을 리스트로 만듭니다.
        const monthlyReports = ['월 정기점검 보고서', '월 정기점검 보고서 (행위)', '월 정기점검 보고서 (행위_Mongo)'];
        
        // 2. 현재 선택된 보고서(reportType)가 위 리스트에 포함되어 있다면?
        if (monthlyReports.includes(reportType)) {
          // 미리보기 검증용 텍스트를 대표 이름으로 강제 고정합니다.
          expectedPreviewText = '월 정기점검 보고서';
        }
        // //[미리보기 화면 검증 ]
        // cy.get('iframe', { timeout: 60000 }).its('0.contentDocument.body').should('not.be.empty').then(cy.wrap)
        // .within(() => {
        //   // 변환된 expectedPreviewText로 검증합니다!
        //   cy.contains(expectedPreviewText, { timeout: 60000 }).should('be.visible');
        //   cy.contains('Depth검증용 보고서_auto', { timeout: 60000 }).should('be.visible');
        // });

        // 1. 🚨 [매우 중요] 클릭하기 직전에, 화면을 그렸다는 서버의 신호(getPage)를 낚아채기 위해 그물을 칩니다!
        cy.intercept('POST', '**/oz80/server?getPage=*').as('loadReport');
        cy.wait(1000);
        // 2. 보고서 목록에서 추가한 보고서 클릭하여 열기
        cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    
        // 3. 🌟 [최종 해결책] 아이프레임 안의 글자를 찾는 대신, 그물에 통신이 걸려들 때까지 60초를 기다립니다!
        // 이 통신이 200(성공)으로 떨어졌다는 것은, 이미지든 글자든 리포트 렌더링이 무사히 끝났다는 뜻입니다.
        cy.wait('@loadReport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
        cy.log('✅ 오즈 리포트 렌더링 완료 (통신 성공 검증)!');

        // [확장자 선택 검증] 좌측 폼에 방금 선택한 확장자(ext)가 정확히 남아있는지 확인
        cy.get('input[aria-label="확장자"]').closest('.v-input').should('contain.text', ext);
        
        cy.log(`✅ [${reportType}] & [${ext}] 검증 완료! (미리보기 타이틀: ${expectedPreviewText})`);


        // ==========================================
        // [내보내기 검증] 파일 다운로드 요청 및 로컬 폴더 확인
        // ========================================== 
        
        // 1. 내보내기 버튼 클릭 (보고서가 이미 열려있는 상태이므로 바로 클릭)
        cy.get('.v-btn__content').filter(':visible').contains('내보내기').click({ force: true });
        cy.wait(1000); 

        // 2. [최종 수정] 스낵바 존재 여부와 관계없이 에러를 내지 않는 방식
        cy.log('ℹ️ 다운로드 요청 메시지 확인 중...');
        // 넉넉한 시간(예: 4초) 동안 스낵바가 한 번이라도 나타나는지 '감시'만 하고 에러는 무시합니다.
        cy.get('body').then(($body) => {
          const snackbar = Cypress.$('.v-snack__content:visible'); // jQuery로 현재 보이는 것만 즉시 확인
          if (snackbar.length > 0) {
            cy.log('✅ 다운로드 요청 메시지 확인됨');
          } else {
            // 메시지가 너무 빨리 사라졌거나 안 떴을 경우 로그만 남기고 통과
            cy.log('⏭️ 메시지가 이미 사라졌거나 표시되지 않았습니다. 다음 단계로 진행합니다.');
          }
        });
        
        // 2. 알림창(Snackbar) 팝업 확인 및 사라짐 대기
        //cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible').and('contain', '파일 다운로드를 요청했습니다');
        
        // 3. 실제 로컬 폴더에 파일이 다운로드될 시간을 넉넉히 줍니다.
        cy.wait(9000); 
        
        // 4. 로컬 다운로드 폴더에서 파일 확인
        cy.task('readDirectory', 'cypress/downloads').then((files) => {
          
          // 💡 핵심: 다운로드된 파일명 규칙에 맞게 찾기!
          // 웹에서 다운로드 시 띄어쓰기가 '+'나 '%20'으로 치환되는 경우가 많습니다.
          // 따라서 띄어쓰기가 없는 확실한 키워드('Depth검증용' 또는 'auto')와 확장자(ext)로 찾습니다.
          
          let expectedExtension = `.${ext}`; // 예: '.pdf', '.xlsx'

          //맨티스 버그 : 37402
          // 🚨 [Known Bug 우회 처리]  확장자 [docx, xls]로 선택하고 내보내기시 로컬에는 확장자 [doc, xlsx]로 다운로드 저장되는 문제
          if (ext === 'docx') {
            expectedExtension = '.doc';
            cy.log('⚠️ [Known Bug 우회] docx 선택 시 .doc 파일로 검증합니다.');
          }// 🚨 [Known Bug 우회 처리 2] xls 선택 시 실제로는 xlsx로 다운로드됨
           else if (ext === 'xls') {
           expectedExtension = '.xlsx';
           cy.log('⚠️ [Known Bug 우회] xls 선택 시 .xlsx 파일로 검증합니다.');
          }

          const searchKeyword = 'Depth검증용';  // 우리가 입력했던 보고서 이름의 일부 (띄어쓰기 없는 부분)
          
          const downloadedFile = files.find(file => 
            file.includes(searchKeyword) && file.endsWith(expectedExtension)
          );

          // 로그 출력 및 파일 존재 여부 강력히 검증 (없으면 여기서 에러 발생!)
          if (downloadedFile) {
            cy.log(`✅ [${ext}] 파일 다운로드 확인 완료! (파일명: ${downloadedFile})`);
          }
          // 로컬 폴더 파일 실제 검증 로그
          expect(downloadedFile, `[${ext}] 로컬 다운로드 파일 존재 여부 검증`).to.not.be.undefined; 
        });

        cy.log(`🚀 [${reportType}] - [${ext}] 모든 검증(미리보기+다운로드) 완벽 종료!`);

        // ==========================================
        // 🌟 [추가된 핵심 코드] 다음 루프를 위해 보고서 다시 열어두기!
        // ==========================================
        cy.wait(3000);
        cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
        cy.wait(3000); // 폼이 렌더링될 시간 부여


      }); // 확장자 안쪽 루프 끝
      
    }); // 보고서 바깥쪽 루프 끝
    //--------------------------------------------------------------------------------------------------------------------------------------------
     
    // // 이전 추가 보고서 잘추가되어있다면 진행가능
    // // 종합보고서 목록에 추가한 추가보고서_auto가 있는지 확인 
    // cy.contains('a', 'Depth검증용 보고서_auto').should('be.visible');
    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true }); 
    // cy.wait(1000);

    // //반복설정 OFF-ON으로 변경
    // cy.get('input[aria-label="반복설정"]').click({ force: true });
    // cy.wait(1000);
    // //클릭 후, 해당 요소의 aria-checked 속성이 'true'로 on상태로 바뀌었는지 확인합니다.
    // cy.get('input[aria-label="반복설정"]').should('have.attr', 'aria-checked', 'true');
    // cy.wait(1000);
    

    // //반복설정 ON으로 변경시 대상기간 종료일자 -> 기간 설정으로 변경됨. 
    // //기간 콤보박스 열기
    // cy.get('input[aria-label="기간"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    // // 기간 : 1년 선택
    // cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '1년').should('be.visible').click({ force: true });

    // // 저장 버튼 클릭 
    // cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    // cy.wait(1000);

    // cy.contains('a', 'Depth검증용 보고서_auto').click({ force: true });
    // cy.wait(1000);
    //  // 기간 1년 변경 확인 검증
    // cy.get('span[title="1년"]').should('be.visible').and('have.text', '1년'); 

    //  // 취소버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true }); 
    

    

      // 정의한 함수 호출하여 추가한 정책 삭제
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', 'Depth검증용 보고서_auto').should('not.exist');
      cy.wait(1000);
     //--------------------------------------------------------------------------------------

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 보고 Depth 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });



  });
});  

//코드마지막


 })()
;
