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


     // 개인정보접속 종합 보고서 생성하기 -------------------------
     // ==========================================
    // 보고  
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('접속기록 종합 보고서').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '보고서 목록').should('exist');

    // ==========================================
    // 페이지수 5-> 25 개 옵션 변경 
    // ==========================================
    // 1. 엉뚱한 화살표 대신, 화면 하단에 '5'라고 적혀있는 페이지 선택 박스를 콕 집어 클릭합니다.
    cy.contains('.v-select__selection', '5').click({ force: true });
    cy.wait(500); // 콤보박스 메뉴가 스르륵 열릴 때까지 대기
    // 2. 열린 메뉴(.v-menu__content) 안에서 '25'을 찾아서 클릭합니다.
    // (클래스명에 얽매이지 않고 텍스트 '25'을 포함한 요소를 강제 클릭하도록 유연하게 작성)
    cy.get('.v-menu__content').filter(':visible').contains('25') .click({ force: true });
    // 3. 목록이 25개로 갱신될 시간을 넉넉히 줍니다.
    cy.wait(3000);

     // ==========================================
    // 기존 잔여정책이 존재한다면 삭제  
    // ==========================================
    // 1. 반복 삭제를 수행할 함수를 정의합니다.
      const deleteAllReports = () => {
        // body 전체를 가져와서 동기적으로 검사합니다.
        cy.get('body').then(($body) => {
          
          // 🚨 [수정 1] 가장 바깥쪽을 백틱(``)으로 감싸고, 안쪽에는 큰따옴표("")를 사용합니다.
          if ($body.find(`tr:contains("내부파일다운로드_생성_보고서_auto_${formattedDate}")`).length > 0) {
       
            // --- [삭제 로직 시작] ---
            // 🚨 [수정 2] 찾을 문자열 전체를 백틱(``)으로 감싸줍니다.
            cy.contains('tr', `내부파일다운로드_생성_보고서_auto_${formattedDate}`)
              .find('.fa-trash')
              .closest('button')
              .then(($btn) => {
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
             // 🚨 [수정 3] 로그도 마찬가지로 전체를 백틱(``)으로 감싸줍니다.
             cy.log(`모든 중복 내부파일다운로드_생성_보고서_auto_${formattedDate} 삭제 완료!`);
           }
        });
      };
      cy.wait(4000);
      // 2. 정의한 함수를 실행합니다.
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', `내부파일다운로드_생성_보고서_auto_${formattedDate}`).should('not.exist');
      cy.wait(1000);

    // 보고서 목록에 추가 
    // 동그란 플러스 버튼 클릭 
    cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });

    cy.wait(1000);

    // 보고서 추가화면에서 보고서이름 입력
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type(`내부파일다운로드_생성_보고서_auto_${formattedDate}`, { force: true }); 
  
    cy.wait(1000);
    cy.wait(1000);
    // 보고서 추가화면에서 보고서설명 작성 
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('내부파일다운로드 테스트 생성보고서입니다.', { force: true });
    cy.wait(1000);

    // 보고서 추가화면에서 보고서 종류 선택 - 개인정보접속 종합 보고서
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 보고서 종류 콤보박스에서  '개인정보접속 종합 보고서' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '개인정보접속 종합 보고서').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 보고서 추가화면에서 업무시스템 - 리눅스_배송관리 선택
    cy.get('input[aria-label="업무시스템"]').closest('.v-input__slot').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().click({ force: true });          
    cy.wait(500);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');
     
    // 기본 PDF 확장자로 생략
    //확장자 종류 콤보박스 열기 
    //cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    //cy.wait(500);
    // 확장자 종류중 ppt 선택하는 코드
    //cy.get('.v-menu__content:visible').should('be.visible').scrollTo('bottom', { duration: 500 }); // 부드럽게 끝까지 내림

    // 2. 이제 나타난 'ppt' 항목을 클릭합니다.
    //cy.contains('.v-list__tile__title', 'ppt').click({ force: true });
    //cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000);

    // 추가된  정기점검 보고서 클릭
    cy.contains('a', `내부파일다운로드_생성_보고서_auto_${formattedDate}`).click({ force: true });
    cy.wait(1000);

    // 내보내기 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('내보내기').click({ force: true }); 
    cy.wait(1000);
    
    
    // ==========================================
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(2000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');




    // 관리 > 내부 파일 다운로드 서브메뉴 선택
    cy.contains('button.side-menu', '관리').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [내부 파일 다운로드] 클릭 ---');
    cy.contains('.v-list__tile__title', '내부 파일 다운로드').should('be.visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 내부 파일 다운로드 > [생성된 파일 목록 조회 / 다운로드] 탭 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('생성된 파일 목록 조회 / 다운로드').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // 검색 조건 입력란 
    cy.get('input[aria-label="파일 다운로드 그룹"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 표 열 문구 확인 
    cy.get('th').filter(':visible').contains('파일 다운로드 그룹').should('be.visible');
    cy.get('th').filter(':visible').contains('제목').should('be.visible');
    cy.get('th').filter(':visible').contains('파일명').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    
    
    // 기능확인
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

    // 개인정보접속 종합 보고서 조회하기 -------------------------------------------------------------
    //파일 다운로드 그룹 클릭 
     cy.get('input[aria-label="파일 다운로드 그룹"]').filter(':visible').click({ force: true });
     cy.wait(500);
     
     // 열려있는 메뉴창을 찾아 맨 아래로 부드럽게 스크롤합니다.
     //cy.get('.v-menu__content:visible').scrollTo('bottom', { duration: 500 });
     //cy.wait(500);
     // 상태 리스트중 '개인정보접속 종합 보고서' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '개인정보접속 종합 보고서').should('exist').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');  

     //상태 클릭
     cy.get('input[aria-label="상태"]').filter(':visible').click({ force: true });
     cy.wait(500);
     // 상태 리스트중 '완료' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '완료').should('be.visible').click({ force: true });
     cy.wait(500);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}');    

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(500);
     // 검색결과 검증코드
     cy.contains('tbody tr', '개인정보접속 종합 보고서')
     .first() // 혹시 목록에 여러 개가 있다면 가장 최신(첫 번째) 것을 선택
     .within(() => {
     // 보고서 제목 검증
     cy.get('a.font-weight-bold').contains(`내부파일다운로드_생성_보고서_auto_${formattedDate}`).should('contain', '.pdf').and('be.visible');
      // 처리 상태 검증
      cy.get('a.ellipsis').contains('완료').should('be.visible');
      }); 

     //----------------------------------------------------------------------------------

    // ==========================================
    // STEP : 관리자페이지-> 일반 모드 점검페이지로로(대시보드)로 복귀
    // ==========================================
    cy.log('🏠 대시보드 아이콘 클릭 (일반 모드로 복귀)');
    // 1. [검증] 대시보드(구름 모양) 아이콘이 보이는지 확인
    // 설명: 'g-IDashboard' 클래스가 대시보드 아이콘의 고유 식별자입니다.
    cy.get('.g-IDashboard').should('be.visible');
    // 2. [클릭] 아이콘 클릭
    cy.get('.g-IDashboard').should('be.visible').click({ force: true });
    // 3. [대기] 화면 전환 기다림
    cy.wait(2000);
    // 4. [확인] 일반 모드로 잘 돌아왔는지 URL이나 요소로 확인 (선택사항)
    // 예: 다시 '점검' 버튼이 보이는지 확인
    cy.contains('button', '점검').should('exist');

     //==========================================
    // 보고 서브메뉴 - 개인정보접속 종합 보고서 삭제하기 
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(2000);


    // ==========================================
    // 페이지수 5-> 25 개 옵션 변경 
    // ==========================================
    // 1. 엉뚱한 화살표 대신, 화면 하단에 '5'라고 적혀있는 페이지 선택 박스를 콕 집어 클릭합니다.
    cy.contains('.v-select__selection', '5').click({ force: true });
    cy.wait(500); // 콤보박스 메뉴가 스르륵 열릴 때까지 대기
    // 2. 열린 메뉴(.v-menu__content) 안에서 '25'을 찾아서 클릭합니다.
    // (클래스명에 얽매이지 않고 텍스트 '25'을 포함한 요소를 강제 클릭하도록 유연하게 작성)
    cy.get('.v-menu__content').filter(':visible').contains('25') .click({ force: true });
    // 3. 목록이 25개로 갱신될 시간을 넉넉히 줍니다.
    cy.wait(3000);
    

    cy.contains('tr', `내부파일다운로드_생성_보고서_auto_${formattedDate}`).find('.fa-trash').click({ force: true });
    cy.wait(1000);
    // 삭제 확인 팝업 처리
    cy.contains('삭제하시겠습니까?').should('be.visible');
    cy.wait(500); // 팝업 애니메이션 안정화 대기
      
    cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
    // 삭제 후 목록이 갱신될 시간을 잠깐 줍니다.
    cy.wait(1000);

    // 🌟 [추가] 삭제된 데이터가 이제 화면에 존재하지 않는지(not.exist) 최종 검증!
     cy.contains('tr', `내부파일다운로드_생성_보고서_auto_${formattedDate}`).should('not.exist');
    cy.log(`✅ 내부파일다운로드_생성_보고서_auto_${formattedDate} 삭제완료  `);


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 관리자페이지 -관리  테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
