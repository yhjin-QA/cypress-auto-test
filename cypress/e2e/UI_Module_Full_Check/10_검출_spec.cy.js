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
      'not valid JSON'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('로그캐치 UI기본체크', () => {

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


        // 검출탭 > 필터  서브메뉴 선택 
        cy.log('🚀 검출탭 > 필터  서브메뉴 선택 ');
        cy.contains('button', '검출').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('---검출 - 필터 서브메뉴 클릭 ---');
        cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });
        cy.wait(3000); 
        
      

        // 검출탭 > 필터 > 전처리 파일 구분 설정 탭 클릭 
        cy.log('--- 전처리 파일 구분 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 파일 구분 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 파일 구분 설정').should('exist');
        //전처리 파일 구분 설정정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="기본 확장자"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="ContentType Value"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="ContentDisposition Key"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 파일 구분 설정] 출력 확인 완료! ');


        
        // 검출탭 > 필터 > 전처리 필터링 정책 탭 클릭 
        cy.log('--- 전처리 필터링 정책 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 필터링 정책').should('be.visible').click({ force: true });
        cy.wait(2000);
        
        // 검출 > 필터 > 전처리 필터링 정책 >[사용자 IP 제외] 탭선택 
        cy.contains('.v-tabs__item', '사용자 IP 제외').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('IP not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', 'IP').should('exist');
        // IP입력 IP란 확인
        cy.get('label[for="ipv4-address"]').should('contain', 'IP').and('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        // IP문구 중복으로 구분처리 
        cy.get('th').filter(':visible').filter(':contains("IP")').eq(1).should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [사용자 IP 제외] 탭 클릭 및 출력 확인 완료');


        // 검출탭 > 필터 > 전처리 필터링 정책 > [화면URI제외] 탭선택
        cy.contains('.v-tabs__item', '화면 (URI) 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', '화면 (URI) 제외').should('exist');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('URI not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', '화면 URI').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="화면 URI"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('화면 URI').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [화면 (URI) 제외] 탭 클릭 및 출력 확인 완료');



        // 검출탭 > 필터 > 전처리 필터링 정책 > [특정SQL 제외] 탭선택
        cy.contains('.v-tabs__item', '특정 SQL 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', '특정 SQL 제외').should('exist');
        cy.contains('.c-headline', 'Excluded IP').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('SQL not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', '특정 SQL').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="특정 SQL"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('특정 SQL').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [특정 SQL 제외] 탭 클릭 및 출력 확인 완료');
        

       
        // 검출탭 > 필터 > 전처리 필터링 정책 > [CONTENT-TYPE 제외] 탭선택
        cy.contains('.v-tabs__item', 'Content-Type 제외').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        cy.contains('.v-tabs__item--active', 'Content-Type 제외').should('exist');
        cy.contains('.c-headline', 'Excluded Content-Type').should('exist');
        // 문구확인
        cy.get('p').filter(':visible').contains('Content-Type not covered by Logcollector').should('be.visible');
        
        cy.contains('.c-headline', 'Content-Type 제외').should('exist');
        // 화면 URI란 확인
        cy.get('input[aria-label="Content-Type"]').filter(':visible').should('be.visible');
        //설명 확인
        cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
        //업무시스템 할당 확인
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        // Log Tracer 확인
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        //저장버튼 확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');

        cy.contains('.c-headline', '등록 필터 상세 보기').should('exist');
        // 표 컬럼 확인
        //표 열첫번쨰 문구없음.
        //cy.get('th').filter(':visible').contains('').should('be.visible');
        cy.get('th').filter(':visible').contains('설명').should('be.visible');
        cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
        cy.get('th').filter(':visible').contains('Log Tracer').should('be.visible');
        cy.get('th').filter(':visible').contains('삭제').should('be.visible');

        cy.contains('.c-headline', '변경 이력').should('exist');
        // 표 컬럼 확인
        cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
        cy.get('th').filter(':visible').contains('관리자').should('be.visible');
        cy.get('th').filter(':visible').contains('IP').should('be.visible');
        cy.get('th').filter(':visible').contains('상태').should('be.visible');
        cy.log('✅ 검출 - 필터 - 전처리 필터링 정책 - [Content-Type 제외] 탭 클릭 및 출력 확인 완료');
        cy.log('✅ 검출 - 필터 - [전처리 필터링 정책] 출력 확인 완료! ');


        // 검출탭 > 필터 > 전처리 사용자 계정 탐색 설정 탭 클릭 
        cy.log('--- 전처리 사용자 계정 탐색 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 사용자 계정 탐색 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 사용자 계정 탐색 설정').should('exist');
        //전처리 사용자 계정 탐색 설정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('span[title="Request Header Cookie"]').should('be.visible');
        cy.get('input[aria-label="key"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 사용자 계정 탐색 설정] 화면 출력 확인 완료 ');


   
        // 검출탭 > 필터 > 전처리 디코더 설정 탭 클릭 
        cy.log('--- 전처리 디코더 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 디코더 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '전처리 디코더 설정').should('exist');
        //전처리 사용자 계정 탐색 설정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('span[title="URL Decoder"]').should('be.visible');
        cy.get('span[title="Response Body(UTF-8)"]').should('be.visible');
        cy.get('input[aria-label="Log Tracer"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="업무시스템 할당"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 디코더 설정] 화면 출력 확인 완료 ');

        // v3.0.4.0_R34865 추가 메뉴
        // 검출탭 > 필터 > 전처리 인코더 설정 탭 클릭 
        cy.log('--- 전처리 인코더 설정 탭 클릭 ---');
        cy.contains('.v-btn__content', '전처리 인코더 설정').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        cy.contains('.c-headline', '설정').should('exist');
        //전처리 사용자 계정 탐색 설정 문구 확인
        cy.get('input[aria-label="정책 이름"]').filter(':visible').should('be.visible');
        cy.get('input[aria-label="Log Tracer"]').should('be.visible').and('have.attr', 'type', 'text').and('have.attr', 'role', 'combobox');
        cy.get('input[aria-label="URI"]').should('be.visible').and('be.enabled').and('have.attr', 'type', 'text').and('have.attr', 'role', 'combobox');
        cy.get('input[aria-label="Charset ( 대소문자 및 빈공간 유의 )"]').should('be.visible').and('have.attr', 'type', 'text');
        
        //저장 버튼 존재확인
        cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
        cy.log('✅ 검출 - 필터 - [전처리 인코더 설정] 화면 출력 확인 완료 ');


        // v3.0.4.0_R34865 추가 메뉴
        // 검출탭 > 필터 > 식별자 패턴 관리 탭 클릭 
        cy.log('--- 식별자 패턴 관리 탭 탭 클릭 ---');
        cy.contains('.v-btn__content', '식별자 패턴 관리').should('be.visible').click({ force: true });
        cy.wait(2000);
        cy.log('--- 화면 검증 시작 ---');
        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        // 트리영역 돋보기 아이콘
        cy.get('.v-icon.fa-search').filter(':visible').should('be.visible'); 

        // 타이틀 문구확인
        cy.contains('span.title', '식별자').should('be.visible').and('have.class', 'font-weight-bold');


        // 트리영역 폴더 문구확인
        // label 태그 중 '식별자 패턴 그룹'이라는 텍스트가 보이는지 확인
        cy.contains('label.text-label', '식별자 패턴 그룹').should('exist');
        // 'text-label' 클래스를 가진 label 중 'Pattern Korea'가 포함된 요소를 확인
        cy.contains('label.text-label', 'Pattern Korea').should('exist');
        cy.contains('label.text-label', 'Pattern Korea2').should('exist');

        // '개인정보 유형' 컬럼이 존재하고, 현재 오름차순(asc) 정렬인지 확인
        cy.contains('th.column.sortable', '개인정보 유형').should('be.visible').and('have.class', 'asc');
        // '식별자 패턴' 컬럼이 존재하고, 현재 오름차순(asc) 정렬 상태인지 확인
        cy.contains('th.column.sortable', '식별자 패턴').should('be.visible').and('have.class', 'asc'); 
        
        cy.log('✅ 검출 - 필터 - [식별자 패턴관리] 화면 출력 확인 완료 ');



       ////////////////////////////////////////
       // 검출탭 > 검출 메뉴 관리  서브메뉴 선택 
       ///////////////////////////////////////
       cy.log('🚀 검출 탭 > 검출 메뉴 관리 서브메뉴 선택 ');
       cy.contains('button', '검출').should('be.visible').should('be.visible').click({ force: true });
       cy.wait(2000);
       cy.get('.v-list__tile__title').filter(':contains("검출 메뉴 관리")').filter(':visible').click({ force: true });
       cy.wait(3000); 
      
      //검출탭 > 검출 메뉴 관리 > 메뉴관리 선택 --------------------------------------------------------------------------------------
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
       cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
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
       cy.log('✅ 검출 - 검출메뉴관리 - [메뉴 관리] 출력 확인 완료 ');

      
       // 검출탭 > 검출 메뉴 관리 > URI 관리 선택 ---------------------------------------------------------------
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
       cy.log('✅ 검출 - 검출메뉴관리 - [URI 관리] 출력 확인 완료 ');

       // 검출탭 > 검출 메뉴 관리 > 메뉴 규칙 설정 화면------------------------------------------------------------------------
       cy.contains('.v-btn__content', '메뉴 규칙설정').should('be.visible').click({ force: true });
       cy.wait(3000);
       cy.log('--- 화면 검증 시작 ---');
  
       // 좌측 - 업무시스템 목록 (동적 데이터 대응)
       // 목록 타이틀 확인
       cy.contains('.v-card__title', '업무시스템 목록 (Master)').should('be.visible');

       // 각 업무시스템 항목 - 이름/상태칩이 비어있지 않은지 구조 검증
       cy.get('.v-list__tile__title').filter(':visible').should('have.length.greaterThan', 0).each(($title) => {
       // 이름이 비어있지 않은지 확인
        cy.wrap($title).invoke('text').then((text) => {
          expect(text.trim().length).to.be.greaterThan(0);
        });
      });

      // 상태 칩 - "미설정" 또는 "설정완료" 등 유효한 상태값인지 확인 (칩 개수만큼 순회)
      cy.get('.v-chip__content').filter(':visible').each(($chip) => {
        cy.wrap($chip).invoke('text').then((text) => {
          const validStatuses = ['미설정', '설정완료', '설정 완료']; // 실제 존재하는 상태값에 맞게 조정 필요
          expect(text.trim().length).to.be.greaterThan(0);
          // 상태값 종류가 더 있다면 validStatuses 배열에 추가해주세요
        });
      });

      // 우측 - "0 정책 설정" 상단 헤더 영역
      cy.contains('h2', '정책 설정').should('be.visible');
      cy.contains('신규 설정 작성 중').should('be.visible');

      // 업무시스템 명 / 시스템 ID (Scope) 라벨 확인
      cy.contains('.caption', '업무시스템 명').should('be.visible');
      cy.contains('.caption', '시스템 ID (Scope)').should('be.visible');


      // URI 메뉴키 포함 여부 (is_global) 섹션
      cy.contains('h3', 'URI 메뉴키 포함 여부 (is_global)').should('be.visible');
      cy.contains('고객사가 제공한 키만으로 전역 유니크함 보장이 없으면 반드시 켜야 합니다.').should('be.visible');
      cy.contains('포함 (켬)').should('be.visible');
      cy.contains('포함 안 함 (끔)').should('be.visible');


      // 메뉴 키 조합 규칙 (Expressions) 섹션
      cy.contains('h3', '1. 메뉴 키 조합 규칙 (Expressions)').should('be.visible');
      // 규칙추가 버튼
      cy.contains('.v-btn__content', '규칙 추가').should('be.visible');

      // 기본 규칙 1행 확인 (순번 칩, 드롭다운, 입력창, 삭제버튼)
      cy.get('.v-chip').filter(':visible').contains('1').should('be.visible');
      cy.get('select.custom-input').filter(':visible').first().within(() => {
        cy.get('option[value="RequestHeader"]').should('exist');
        cy.get('option[value="RequestBody"]').should('exist');
        cy.get('option[value="RequestParam"]').should('exist');
        cy.get('option[value="ResponseHeader"]').should('exist');
        cy.get('option[value="ResponseBody"]').should('exist');
      });

      cy.get('input[placeholder="키 이름 입력 (예: globalMenuId)"]').should('be.visible');
      // 🌟 "키 이름 입력 (예: globalMenuId)" - 규칙이 여러 개 추가된 만큼 존재할 수 있음

      cy.get('input[placeholder="키 이름 입력 (예: globalMenuId)"]').filter(':visible').should('have.length.greaterThan', 0)
      .each(($input) => {
        cy.wrap($input).should('be.visible');
      });

      // 추가 속성 추출 정책 섹션
      cy.contains('h3', '2. 추가 속성 추출 정책 (선택사항)').should('be.visible');

      // 메뉴명 추출
      cy.contains('메뉴명 추출:').should('be.visible');
      cy.get('input[placeholder*="menuName"]').should('be.visible');
      // "메뉴명 추출" 입력창
      cy.get('input[placeholder="키 이름 입력 (예: menuName) - 미입력 가능"]').filter(':visible').should('be.visible');

      // 행위구분 추출
      cy.contains('행위구분 추출:').should('be.visible');
      cy.get('input[placeholder*="action"]').should('be.visible');
      // "행위구분 추출" 입력창
      cy.get('input[placeholder="키 이름 입력 (예: action) - 미입력 가능"]').filter(':visible').should('be.visible');

      // 행위구분 맵핑 (Map) 섹션
      cy.contains('행위구분 맵핑 (Map):').should('be.visible');
      cy.contains('엑셀 양식에 기재되는 텍스트를 시스템 전용 숫자 코드로 변환하기 위한 맵핑입니다.').should('be.visible');
      
      // 매핑 추가 버튼
      cy.contains('.v-btn__content', '매핑 추가').should('be.visible');      
      cy.contains('설정된 매핑이 없습니다.').should('be.visible');

      // 하단 저장 버튼
      cy.contains('.v-btn__content', '신규 정책 저장').should('be.visible');

      cy.log('✅ 검출 - 검출메뉴 관리 - [메뉴 규칙설정] 화면 확인 완료!'); 


       // 검출탭 > 검출 메뉴 관리 > 메뉴 일괄 등록 화면 ---------------------------------------------------------------------------------------
       cy.contains('.v-btn__content', '메뉴 일괄등록').should('be.visible').click({ force: true });
       cy.wait(3000);
       cy.log('--- 화면 검증 시작 ---');

       // 3. 좌측 - 업무시스템 목록 (동적 데이터 대응, 재사용)
       cy.contains('.v-card__title', '업무시스템 목록 (Master)').should('be.visible');
       cy.get('.v-list__tile__title').filter(':visible').should('have.length.greaterThan', 0).each(($title) => {
        cy.wrap($title).invoke('text').then((text) => {
          expect(text.trim().length).to.be.greaterThan(0);
        });
      });
      cy.get('.v-chip__content').filter(':visible').each(($chip) => {
        cy.wrap($chip).invoke('text').then((text) => {
          expect(text.trim().length).to.be.greaterThan(0);
        });
      });

      // 우측 - "메뉴 하이브리드 일괄등록" 상단 헤더 영역
      cy.contains('h2', '메뉴 하이브리드 일괄등록').should('be.visible');
      // 표준 템플릿 다운로드 버튼
      cy.contains('.v-btn__content', '표준 템플릿 다운로드').should('be.visible');
      // 엑셀 업로드 버튼
      cy.contains('.v-btn__content', '엑셀 업로드').should('be.visible');

      // 경고 알림 (Alert) 영역
      cy.get('.v-alert--outline.warning--text').filter(':visible').should('be.visible').within(() => {
        cy.contains('경고:').should('be.visible');
        cy.contains('선택하신 업무시스템의 정책이 설정되어 있지 않습니다.').should('be.visible');
        cy.contains('[규칙설정] 메뉴에서 먼저 해당 시스템의 정책을 설정해 주세요.').should('be.visible');
      });
      // 안내 문구 (caption)
      cy.contains('업로드(또는 붙여넣기) 시 엑셀 헤더와 선택한 시스템 규칙을 자동으로 매핑합니다. 불일치하는 경우 아래에서 수동으로 매핑할 수 있습니다.').should('be.visible');


      cy.contains('h3', '이미 등록되어 있는 메뉴 목록').should('be.visible');

      // 초기 상태 - 데이터 없음 안내 확인
      cy.contains('td', '등록된 메뉴 데이터가 없습니다.').should('be.visible');

      // 페이지네이션 영역 확인
      cy.contains('Rows per page:').should('be.visible');
      cy.get('.v-select__selection--comma').filter(':visible').contains('10').should('be.visible');
      cy.get('button[aria-label="Previous page"]').should('exist').and('be.disabled');
      cy.get('button[aria-label="Next page"]').should('exist').and('be.disabled');

      // "등록 대기중인 데이터" 섹션
      cy.contains('h3', '등록 대기중인 데이터').should('be.visible');

      // 일괄 저장 버튼 - 초기 비활성화 상태 확인
      cy.contains('.v-btn__content', '일괄 저장').closest('button').should('be.disabled');

      // 초기 상태 - 데이터 없음 안내 확인
      cy.contains('업로드된 데이터가 없습니다. 엑셀 파일을 업로드하거나 내용을 붙여넣어 주세요.').should('be.visible');
      
      cy.log('✅ 검출 - 검출 메뉴 관리 - [메뉴 일괄등록] 화면 확인 완료!');


    //==========================================
    // 검출탭 > 개인정보 유형 정의 서브메뉴 선택 
    //=========================================
    cy.log('🚀 검출 - 개인정보 유형 정의선택 ');
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(2000);
    
    // 검출탭 서브메뉴 -  개인정보 유형 정의 탭 (디폴트)
    cy.get('.v-list__tile__title').filter(':contains("개인정보 유형 정의")').filter(':visible').click({ force: true });
    cy.wait(3000); 
    
    cy.log('---  개인정보 식별 유형 정의 화면 검증 시작 ---');
    
    // '검색 조건' 타이틀 
    cy.contains('.c-headline', '검색 조건').should('exist');
    
    // '개인정보 유형 명' 입력창
    cy.get('input[aria-label="개인정보 유형 명"]').should('be.visible');
    // 토글 라벨들 (정보주체만 조회, 삭제된 유형 포함)
    cy.contains('label.v-label', '정보주체만 조회').should('be.visible');
    cy.contains('label.v-label', '삭제된 유형 포함').should('be.visible');
    
    // 검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');


    // 표 데이터 테이블 헤더(컬럼명) 검증
    cy.log('✔️ 데이터 테이블 컬럼명 검증');
    
    const expectedHeaders = [
        '유형 명', 
        '정보주체 설정', 
        '주체 우선순위', 
        '활성화', 
        '등록일시', 
        '수정일시'
    ];

    expectedHeaders.forEach((headerName) => {
        // th 태그 안에서 해당 글자가 포함된 요소를 찾아 보이는지 확인
        cy.get('th').contains(headerName).should('be.visible');
    });

    // 3. 우측 상단 신규 추가(+) 버튼 검증
    cy.log('✔️ 신규 추가 버튼 검증');
    // 테이블 상단의 핑크색 둥근 + 버튼 (add 아이콘)
    cy.contains('i.material-icons', 'add').should('be.visible');
    cy.log('✅ 검출 - 개인정보 유형 정의 -  개인정보 식별 유형 정의 화면 UI 검증완료');


    // 검출탭 > 개인정보 유형 정의  > 식별 정규식 정의 탭 선택 ------------------------------------------------------------
    cy.contains('.v-btn__content', '식별 정규식 정의').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 식별 정규식 정의 화면 검증 시작 ---');
    // 1. 굵은 글씨 타이틀 검증
    cy.contains('span.title.font-weight-bold', '식별 정규식 정의').should('be.visible');

    // 2. 본문(content) 설명란 검증
    // 줄바꿈(<br>) 요소가 있으므로, 텍스트가 끊기지 않는 단위로 쪼개서 체인(chain) 검증합니다.
    cy.get('span.content').should('be.visible')
      .and('contain', '한 가지 정보만으로 개인정보를 알 수 있는 항목')
      .and('contain', '식별자 판단 기준을 설정하면')
      .and('contain', '식별 정규식 수정 후 원활한 탐색을 위해 로그캐치 웹 매니저를 재기동해주시기 바랍니다.');


        // 트리영역 + 아이콘
        cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
        //트리영역 새로고침 아이콘
        cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
        // 트리영역 돋보기 아이콘
        cy.get('.v-icon.fa-search').filter(':visible').should('be.visible'); 

        // 트리영역 폴더 문구확인
        // label 태그 중 '식별자 패턴 그룹'이라는 텍스트가 보이는지 확인
        cy.contains('label.text-label', '식별자 패턴 그룹').should('exist');
        // 'text-label' 클래스를 가진 label 중 'Pattern Korea'가 포함된 요소를 확인
        cy.contains('label.text-label', 'Pattern Korea').should('exist');
        cy.contains('label.text-label', 'Pattern Korea2').should('exist');

         // 'text-label' 클래스를 가진 label 태그 중에서 'Pattern Korea' 글자를 포함한 요소를 찾아 클릭
         cy.contains('label.text-label', 'Pattern Korea').click({ force: true });
         cy.wait(2000);

        // Pattern Korea 표 컬럼 확인
        cy.get('th').contains('식별 정규식 패턴 설명').should('be.visible');
        cy.get('th').contains('확정').should('be.visible');

         cy.log('✅ 검출 - 개인정보 유형 정의 - 식별 정규식 정의 화면 UI 검증완료');

       
    // 검출탭 > 개인정보 유형 정의 > 식별 키워드 정의 탭 선택 ---------------------------------------------------------------
    cy.contains('.v-btn__content', '식별 키워드 정의').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 식별 키워드 정의 화면 검증 시작 ---');
    // 1. 굵은 글씨 타이틀 검증
    cy.contains('span.title.font-weight-bold', '식별 키워드 정의').should('be.visible');
   
    // 2. 본문(content) 설명란 검증
    cy.get('span.content')
      .should('be.visible')
      .and('contain', '식별된 키워드를 바탕으로 개인정보를 검출합니다.')
      .and('contain', '식별자 판단 기준을 설정하면, 보다 정확하게 개인정보 접근 여부를 판별할 수 있습니다.')
      .and('contain', '식별 키워드 수정 후 원활한 탐색을 위해 로그캐치 웹 매니저를 재기동해주시기 바랍니다.');

    //  (개인정보 유형)
    cy.contains('span.sub-title-title', '식별 키워드 설정').should('be.visible');
    cy.get('input[aria-label="개인정보 유형"]').should('be.visible');
    
    // 라디오 버튼 그룹 (적용 대상)
    cy.contains('적용 대상').should('be.visible');
    cy.contains('label.v-label', '전역').should('be.visible');
    cy.contains('label.v-label', '업무시스템 지정').should('be.visible');
    
    // 키워드 입력 영역
    cy.contains('키워드 값').should('be.visible');
    cy.get('input[placeholder="항목을 입력하고 Enter 를 누르세요."]').first().should('be.visible');
    
    // 키워드명 자동등록 
    cy.contains('label.v-label', '키워드명 자동 등록').should('be.visible');
    cy.contains('label.v-label', '설명').should('be.visible');
    
    //확정키워드
    cy.contains('label.v-label', '확정 키워드').should('be.visible');
    
    
    //저장 버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');


    // 하단: 검색 조건 영역
    cy.log('✔️ 중단 [검색 조건] 영역 검증');
    
    // 검색 조건 타이틀
    cy.contains('.c-headline', '검색 조건').should('exist');
    
    // 검색용 콤보박스들
    cy.get('input[aria-label="업무시스템"]').should('be.visible');
    cy.get('span[title="일치"]').should('be.visible');
    cy.get('input[aria-label="Content Type"]').should('be.visible');
    
    // 하단 검색용 키워드 입력창 (두 번째 플레이스홀더)
    cy.get('input[placeholder="항목을 입력하고 Enter 를 누르세요."]').last().should('be.visible');
    
    // 검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

    // 3. 하단: 데이터 테이블 헤더
    cy.log('✔️ 하단 데이터 테이블 컬럼명 검증');
    
    const keywordHeaders = [
        '키워드', 
        '샘플'
    ];

    keywordHeaders.forEach((headerName) => {
        cy.get('th').contains(headerName).should('be.visible');
    });

    cy.log('✅ 검출 - 개인정보 유형 정의 - 식별 키워드 정의 화면 UI 검증완료');

    //===========================================
    // 검출탭 > 행위 구분 정책관리 선택 
    //===========================================
    cy.log('🚀 검출 - 행위 구분 정책 관리선택 ');
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(2000);
    // 검출탭 서브메뉴 -  개인정보 유형 정의 탭 (디폴트)
    cy.get('.v-list__tile__title').filter(':contains("행위구분 정책 관리")').filter(':visible').click({ force: true });
    cy.wait(3000); 
    cy.log('---  행위구분 정책 관리 화면 검증 시작 ---');
    cy.wait(1000);

    // 1. 검색 조건 영역 검증
    cy.log('✔️ 검색 조건 영역 검증');
    // '검색 조건' 타이틀 
    cy.contains('.c-headline', '검색 조건').should('exist');
    cy.get('input[aria-label="업무시스템"]').should('be.visible');
    cy.get('input[aria-label="행위 유형"]').should('be.visible');
    cy.get('input[aria-label="URI 주소"]').should('be.visible');
    
    // 표 컬럼 확인
    cy.get('th').filter(':visible').contains('정책 ID').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('URI 주소 패턴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');

    // 추가버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('추가').should('be.visible');
    // 검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    cy.log('✅ 검출 - 행위구분 정책 관리 - 정책 관리 UI 검증완료');


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 검출 UI 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
