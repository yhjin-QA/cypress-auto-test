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
      'Redirected when going from', // ◀◀◀ 이 문구를 추가하세요!
      'navigation guard',           // ◀◀◀ 이 문구도 추가하세요!
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
    // STEP 9: 분석 서브메뉴 
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '정책 유형').should('exist');
    cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    
    // 기능 확인 -------------------------------------------------
    cy.log('🔍 기존 정책 존재 여부를 확인합니다.');
    
    //예외처리  test_auto_개인정보과다조회 삭제 --------------------------
    // 1. [조건부 삭제] test_auto_개인정보과다조회 정책이 있으면 삭제, 없으면 패스
    cy.get('body').then(($body) => {
    // jQuery의 :contains 선택자를 이용해 해당 텍스트가 있는 <tr>을 찾습니다.
    const hasPolicy = $body.find('tr:contains("test_auto_개인정보과다조회")').length > 0;

    if (hasPolicy) {
      cy.log('🗑️ 기존 정책이 발견되었습니다. 삭제를 진행합니다.');
    
      // 삭제 버튼(휴지통) 클릭
      cy.contains('tr', 'test_auto_개인정보과다조회').find('.fa-trash').click({ force: true });
      cy.wait(500);
    
      // 삭제 확인 팝업에서 '확인' 클릭
      cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });
      cy.wait(1000); // 삭제 처리가 서버에 반영될 시간 대기

      // 추가한 정책 삭제 검증코드 
      cy.contains('tr', 'test_auto_개인정보과다조회').should('not.exist'); 
      cy.log('✅ 기존 정책 삭제 완료!');
    
    } else {
      // 정책이 없으면 에러 없이 이 구문을 타고 자연스럽게 통과합니다.
      cy.log('⚪ 기존 정책이 없습니다. 삭제 단계를 패스합니다.');
     }
     });

     //정책추가
     //----------------------------------------------------------------------------
     // 우측 동그란 + 플러스 버튼 클릭
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);


    // 개인정보 과다조회  정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_개인정보과다조회', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500);  
    
    // 업무시스템 - 리눅스_배송관리 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    
    cy.wait(1000);
    // 그룹별중 총무,인사팀 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('인사팀').click({ force: true });
    cy.wait(500);
    cy.get('.v-menu__content').filter(':visible').contains('총무팀').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 정책 상세 설정 
    // 경보등급 - 주의단계 이력 셋팅 
    cy.get('input[aria-label="주의"]').filter(':visible').clear({ force: true }).type('100', { force: true });
    cy.wait(500);

    // 경계 입력
    cy.get('input[aria-label="경계"]').filter(':visible').clear({ force: true }).type('300', { force: true });
    cy.wait(500);

    // 심각 입력
    cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('500', { force: true });
    cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

    

    // -----------------------------------------------------------
    // 기존 정책이 추가되어 있는상태라면 확인 알림창 조건부 처리 (예외처리)
    // ------------------------------------------------ -----------
    cy.get('body').then(($body) => {
     // [조건] body 안에 '이미 포함되어 있습니다'라는 텍스트가 존재하는가?
     if ($body.text().includes('이미 포함되어 있습니다')) {
    
       // [실행] 존재한다면 -> 팝업의 '확인' 버튼 클릭
       cy.log('⚠️ 정책 알림 팝업이 감지되어 확인 버튼을 클릭합니다.');
    
       // 팝업(.v-dialog) 안에 있는 '확인' 버튼을 찾아서 클릭
       cy.get('.v-dialog').filter(':visible').contains('.v-btn', '확인').click({ force: true });
       cy.wait(1000);

        // 추가된 정책 화면으로 이동 -----
        // 정책이름 입력 
        cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_개인정보과다조회', { force: true });
        cy.wait(500);

        // 심각 300-> 500 변경 입력
        cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('500', { force: true });

        // 저장버튼 클릭 
        cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
        cy.wait(500);

          // 추가한 정책  검증코드 
          cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');   


      } else {
       // [실행] 존재하지 않는다면 -> 그냥 로그만 남기고 통과
       cy.log('✅ 중복 알림 없이 정책 추가되었습니다.');
       // 추가한 정책  검증코드 
       cy.contains('tr', 'test_auto_개인정보과다조회').should('be.visible');
       cy.wait(500);

     }
   });


//==========================================
// Depth 개인정보과다조회 - 경보등급별 검증 CASE 1
//===========================================
   
// ----------------------------------------------------------
// [STEP 1] WAS 시스템 로그인 및 이상행위(과다조회) 타격
// ----------------------------------------------------------
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 기존 코드에서 옵션 추가
cy.visit('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', { 
  timeout: 60000,           // 타임아웃을 60초로 연장
  onBeforeLoad(win) {      // 페이지 로드 전 속도 향상을 위한 설정
    delete win.fetch; 
  }
});

cy.origin('http://10.10.54.22:8080', () => {
  Cypress.on('uncaught:exception', () => false);

  // 2. WAS 화면 UI 로그인 진행 (yunho 계정)
  cy.log('1️⃣ UI를 통해 완벽하게 로그인을 수행합니다.');
  cy.visit('/uat/uia/egovLoginUsr.do');
  cy.get('#id').should('be.visible').clear().type('yunho');
  cy.get('#password').should('be.visible').clear().type('Manager1{enter}');

  // 3. 로그인 성공 검증 (로그아웃 버튼 렌더링 대기)
  cy.contains('a', '로그아웃', { timeout: 15000 }).should('be.visible');
  cy.log('✅ 로그인 성공! 방금 생성된 싱싱한 세션 확보 완료!');

  // 4. ✨ 핵심 로직: 쿠키 또는 URL에서 JSESSIONID를 안전하게 추출합니다.
  cy.url().then((currentUrl) => {
    cy.getCookie('JSESSIONID').then((cookie) => {
      let freshSessionId = '';

      // ① 먼저 쿠키에 JSESSIONID가 있는지 확인
      if (cookie && cookie.value) {
        freshSessionId = cookie.value;
        cy.log(`🔑 쿠키에서 세션 ID 추출 완료`);
      } 
      // ② 쿠키가 없다면, URL에 jsessionid가 붙어있는지 확인 (URL Rewriting 대응)
      else if (currentUrl.toLowerCase().includes('jsessionid=')) {
        // 정규식을 사용해 URL에서 jsessionid 값만 쏙 뽑아냅니다.
        const match = currentUrl.match(/jsessionid=([^?&#]+)/i);
        if (match && match[1]) {
          freshSessionId = match[1];
          cy.log(`🔑 URL에서 세션 ID 추출 완료`);
        }
      }

      // 방어 코드: 둘 다 실패했을 경우
      if (!freshSessionId) {
        throw new Error('❌ JSESSIONID를 쿠키와 URL 모두에서 찾을 수 없습니다.');
      }

      cy.log(`✅ 최종 사용될 세션 ID: ${freshSessionId}`);

      // 5. 추출한 새 세션 ID를 헤더에 꽂아서 API 타격!
      cy.request({
        method: 'POST',
        url: '/cop/logcatch/btnExcessCheck.do',
        form: true,
        headers: {
          'Cookie': `JSESSIONID=${freshSessionId}`, 
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'http://10.10.54.22:8080/uat/uia/actionMain.do'
        },
        body: { 
          menuNo: '41' 
        }
      }).then((response) => {
        // 6. 정상 응답 검증 (200 OK)
        expect(response.status).to.eq(200);
        cy.log('🎉 매번 새로운 세션으로 과다조회 자동 타격 성공!');
      });
    });
  });
});


// ----------------------------------------------------------
// [STEP 2] 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// ----------------------------------------------------------
cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
cy.clearCookies();
cy.clearLocalStorage();

// 2. 주소 뒤에 아무것도 붙지 않은 '순수 도메인' 주소로 접속합니다.
// 경로를 생략하고 도메인까지만 입력하면 서버가 404를 내뱉을 확률이 줄어듭니다.
cy.visit('https://10.10.54.21:18443/logcatch/login'); 

cy.wait(8000); // 페이지 로딩 및 안정화 대기

  
    
// ----------------------------------------------------------
// [STEP 3] 이력 메뉴 화면 이동진입 (Chunk Error 방어 로직 포함)
// ----------------------------------------------------------
cy.log('🔄 페이지 안정화 확인 및 이력 메뉴 클릭 시도');

// 1. '이력' 버튼이 있는지 확인하고, 없으면 새로고침 (Chunk Error 대비)
cy.get('body').then(($body) => {
  if ($body.find('button:contains("이력")').length === 0) {
    cy.log('⚠️ 메뉴 렌더링 실패 감지! 새로고침 후 재시도합니다.');
    cy.reload();
    cy.wait(5000);
  }
});

// 💡 [STEP 0] 에러 방어막 강화 (JS 청크, CSS 청크, 라우터 에러 모두 무시)
// 이 코드는 가급적 테스트 파일 최상단(describe 블록 바로 아래 등)에 한 번만 선언해 두는 것이 좋습니다.
Cypress.on('uncaught:exception', (err, runnable) => {
  if (
    err.message.includes('ChunkLoadError') || 
    err.message.includes('Loading CSS chunk') ||  // 👈 이 부분이 추가되었습니다!
    err.message.includes('Loading chunk') ||
    err.message.includes('navigation guard')
  ) {
    return false; // Cypress가 테스트를 멈추지 않고 계속 진행하게 함
  }
});

// ---------------------------------------------------------------------------
// 1. '이력' 버튼 클릭
cy.contains('button', '이력').should('be.visible').click({ force: true });
cy.wait(1000); 

// 2. 서브메뉴 '접속기록 이력' 클릭
cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });

// 💡 넉넉하게 4초 정도 기다려 줍니다. (정상이면 화면이 뜨고, 에러면 무한 로딩이 걸릴 시간)
cy.wait(4000); 

// 3. 무한 로딩 감지 및 자동 복구 로직 (Self-Healing)
cy.get('body').then(($body) => {
  // '이상행위' 탭이 화면에 그려졌는지 확인합니다.
  const isTabLoaded = $body.find('.tab-btn:contains("이상행위")').length > 0;

  if (isTabLoaded) {
    cy.log('🟢 화면이 정상적으로 로드되었습니다.');
  } else {
    // 탭이 없다면 청크 다운로드 실패(무한 로딩)로 간주하고 강제 새로고침!
    cy.log('🔴 ChunkLoadError(무한 로딩) 감지! 페이지를 강제로 새로고침합니다.');
    cy.reload();
    cy.wait(5000); // 새로고침 후 화면 안정화 대기

    // 새로고침 후 메인 화면으로 튕겼을 수 있으므로, 메뉴를 다시 차분하게 찾아 들어갑니다.
    cy.get('body').then(($newBody) => {
      // 여전히 이상행위 탭이 없다면 메뉴부터 다시 클릭
      if ($newBody.find('.tab-btn:contains("이상행위")').length === 0) {
        cy.log('🔄 메뉴를 다시 클릭하여 진입합니다.');
        cy.contains('button', '이력').click({ force: true });
        cy.wait(1000);
        cy.contains('.v-list__tile__title', '접속기록 이력').click({ force: true });
        cy.wait(4000);
      }
    });
  }
});

// 4. 최종 확인 및 탭 클릭 (이제 무조건 화면에 나타나 있을 것입니다)
cy.contains('.tab-btn', '이상행위', { timeout: 15000 }).should('be.visible').click({ force: true });
//------------------------------------------------------------------------------------------------------
cy.log('✅ 이상행위 탭 진입 성공');

// 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 개인정보 과다조회 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 과다조회').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '주의' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('주의').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

// ----------------------------------------------------------
// [STEP 4] 이상행위 첫 번째 행(최신 로그) 데이터 검증 (경보등급 확인)
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡습니다.
// .v-datatable이나 해당 테이블의 클래스가 있다면 더 정확합니다. 
// 여기서는 일반적인 tr 기준으로 작성합니다.
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 2. 사용자명 확인
  cy.contains('진윤호(yunho)').should('be.visible');

  // 3. 이상행위 유형 확인
  cy.contains('개인정보 과다조회').should('be.visible');

  // 4. 적용된 정책명 확인
  cy.contains('test_auto_개인정보과다조회').should('be.visible');

  // 5. 개인정보 유무 및 소명 대상 여부 확인
  cy.contains('존재').should('be.visible');
  cy.contains('소명 대상').should('be.visible');

  // 6. 경보 등급 아이콘 확인 (초록색 경보등급 - 주의 아이콘)
  cy.get('i.v-icon.c-data-grid-icons-icon').should('be.visible').and('have.class', 'g-ICriticalAlert').and('have.css', 'color', 'rgb(169, 209, 142)'); 

});

 cy.log('🎉 경보등급 주의 (초록색) 이력행위 발생 확인 !');


//==========================================
// Depth 개인정보과다조회 - 경보등급별 검증  CASE 2
//===========================================

  // ==========================================
  // 분석 서브메뉴 - 경보등급 주의 -> 경계로 변경
  // ==========================================
  // 분석탭 이동
  cy.contains('button.has-child', '분석').click({ force: true });
  cy.wait(2000); // 메뉴 펼쳐짐 대기

  // 추가한 test_auto_개인정보과다 조회정책 수정--------------------------------------
  // 추가된 정책명 : test_auto_개인정보과다조회 다시 재클릭 
  cy.contains('a', 'test_auto_개인정보과다조회').should('be.visible').click({ force: true });
  cy.wait(500);

  // 정책 상세 설정 
    // 경보등급 - 주의단계 이력 셋팅 
    cy.get('input[aria-label="주의"]').filter(':visible').clear({ force: true }).type('50', { force: true });
    cy.wait(500);

    // 경계 입력
    cy.get('input[aria-label="경계"]').filter(':visible').clear({ force: true }).type('100', { force: true });
    cy.wait(500);

    // 심각 입력
    cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('500', { force: true });
    cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

//==========================================
// Depth 개인정보과다조회 - 경보등급별 검증 
//===========================================
   
// ----------------------------------------------------------
// [STEP 1] WAS 시스템 로그인 및 이상행위(과다조회) 타격
// ----------------------------------------------------------
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 기존 코드에서 옵션 추가
cy.visit('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', { 
  timeout: 60000,           // 타임아웃을 60초로 연장
  onBeforeLoad(win) {      // 페이지 로드 전 속도 향상을 위한 설정
    delete win.fetch; 
  }
});

cy.origin('http://10.10.54.22:8080', () => {
  Cypress.on('uncaught:exception', () => false);

  // 2. WAS 화면 UI 로그인 진행 (yunho 계정)
  cy.log('1️⃣ UI를 통해 완벽하게 로그인을 수행합니다.');
  cy.visit('/uat/uia/egovLoginUsr.do');
  cy.get('#id').should('be.visible').clear().type('yunho');
  cy.get('#password').should('be.visible').clear().type('Manager1{enter}');

  // 3. 로그인 성공 검증 (로그아웃 버튼 렌더링 대기)
  cy.contains('a', '로그아웃', { timeout: 15000 }).should('be.visible');
  cy.log('✅ 로그인 성공! 방금 생성된 싱싱한 세션 확보 완료!');

  // 4. ✨ 핵심 로직: 쿠키 또는 URL에서 JSESSIONID를 안전하게 추출합니다.
  cy.url().then((currentUrl) => {
    cy.getCookie('JSESSIONID').then((cookie) => {
      let freshSessionId = '';

      // ① 먼저 쿠키에 JSESSIONID가 있는지 확인
      if (cookie && cookie.value) {
        freshSessionId = cookie.value;
        cy.log(`🔑 쿠키에서 세션 ID 추출 완료`);
      } 
      // ② 쿠키가 없다면, URL에 jsessionid가 붙어있는지 확인 (URL Rewriting 대응)
      else if (currentUrl.toLowerCase().includes('jsessionid=')) {
        // 정규식을 사용해 URL에서 jsessionid 값만 쏙 뽑아냅니다.
        const match = currentUrl.match(/jsessionid=([^?&#]+)/i);
        if (match && match[1]) {
          freshSessionId = match[1];
          cy.log(`🔑 URL에서 세션 ID 추출 완료`);
        }
      }

      // 방어 코드: 둘 다 실패했을 경우
      if (!freshSessionId) {
        throw new Error('❌ JSESSIONID를 쿠키와 URL 모두에서 찾을 수 없습니다.');
      }

      cy.log(`✅ 최종 사용될 세션 ID: ${freshSessionId}`);

      // 5. 추출한 새 세션 ID를 헤더에 꽂아서 API 타격!
      cy.request({
        method: 'POST',
        url: '/cop/logcatch/btnExcessCheck.do',
        form: true,
        headers: {
          'Cookie': `JSESSIONID=${freshSessionId}`, 
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'http://10.10.54.22:8080/uat/uia/actionMain.do'
        },
        body: { 
          menuNo: '41' 
        }
      }).then((response) => {
        // 6. 정상 응답 검증 (200 OK)
        expect(response.status).to.eq(200);
        cy.log('🎉 매번 새로운 세션으로 과다조회 자동 타격 성공!');
      });
    });
  });
});


// ----------------------------------------------------------
// [STEP 2] 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// ----------------------------------------------------------
cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
cy.clearCookies();
cy.clearLocalStorage();

// 2. 주소 뒤에 아무것도 붙지 않은 '순수 도메인' 주소로 접속합니다.
// 경로를 생략하고 도메인까지만 입력하면 서버가 404를 내뱉을 확률이 줄어듭니다.
cy.visit('https://10.10.54.21:18443/logcatch/login'); 

cy.wait(8000); // 페이지 로딩 및 안정화 대기

  
    
// ----------------------------------------------------------
// [STEP 3] 이력 메뉴 화면 이동진입 (Chunk Error 방어 로직 포함)
// ----------------------------------------------------------
cy.log('🔄 페이지 안정화 확인 및 이력 메뉴 클릭 시도');

// 1. '이력' 버튼이 있는지 확인하고, 없으면 새로고침 (Chunk Error 대비)
cy.get('body').then(($body) => {
  if ($body.find('button:contains("이력")').length === 0) {
    cy.log('⚠️ 메뉴 렌더링 실패 감지! 새로고침 후 재시도합니다.');
    cy.reload();
    cy.wait(5000);
  }
});

// 💡 [STEP 0] 에러 방어막 강화 (JS 청크, CSS 청크, 라우터 에러 모두 무시)
// 이 코드는 가급적 테스트 파일 최상단(describe 블록 바로 아래 등)에 한 번만 선언해 두는 것이 좋습니다.
Cypress.on('uncaught:exception', (err, runnable) => {
  if (
    err.message.includes('ChunkLoadError') || 
    err.message.includes('Loading CSS chunk') ||  // 👈 이 부분이 추가되었습니다!
    err.message.includes('Loading chunk') ||
    err.message.includes('navigation guard')
  ) {
    return false; // Cypress가 테스트를 멈추지 않고 계속 진행하게 함
  }
});

// ---------------------------------------------------------------------------
// 1. '이력' 버튼 클릭
cy.contains('button', '이력').should('be.visible').click({ force: true });
cy.wait(1000); 

// 2. 서브메뉴 '접속기록 이력' 클릭
cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });

// 💡 넉넉하게 4초 정도 기다려 줍니다. (정상이면 화면이 뜨고, 에러면 무한 로딩이 걸릴 시간)
cy.wait(4000); 

// 3. 무한 로딩 감지 및 자동 복구 로직 (Self-Healing)
cy.get('body').then(($body) => {
  // '이상행위' 탭이 화면에 그려졌는지 확인합니다.
  const isTabLoaded = $body.find('.tab-btn:contains("이상행위")').length > 0;

  if (isTabLoaded) {
    cy.log('🟢 화면이 정상적으로 로드되었습니다.');
  } else {
    // 탭이 없다면 청크 다운로드 실패(무한 로딩)로 간주하고 강제 새로고침!
    cy.log('🔴 ChunkLoadError(무한 로딩) 감지! 페이지를 강제로 새로고침합니다.');
    cy.reload();
    cy.wait(5000); // 새로고침 후 화면 안정화 대기

    // 새로고침 후 메인 화면으로 튕겼을 수 있으므로, 메뉴를 다시 차분하게 찾아 들어갑니다.
    cy.get('body').then(($newBody) => {
      // 여전히 이상행위 탭이 없다면 메뉴부터 다시 클릭
      if ($newBody.find('.tab-btn:contains("이상행위")').length === 0) {
        cy.log('🔄 메뉴를 다시 클릭하여 진입합니다.');
        cy.contains('button', '이력').click({ force: true });
        cy.wait(1000);
        cy.contains('.v-list__tile__title', '접속기록 이력').click({ force: true });
        cy.wait(4000);
      }
    });
  }
});

// 4. 최종 확인 및 탭 클릭 (이제 무조건 화면에 나타나 있을 것입니다)
cy.contains('.tab-btn', '이상행위', { timeout: 15000 }).should('be.visible').click({ force: true });
//------------------------------------------------------------------------------------------------------
cy.log('✅ 이상행위 탭 진입 성공');

// 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 개인정보 과다조회 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 과다조회').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '경계'이라는 텍스트를 가진 항목을 찾아 '경계' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('경계').click({ force: true });
    cy.wait(500);
    
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(500);

// ----------------------------------------------------------
// [STEP 4] 이상행위 첫 번째 행(최신 로그) 데이터 검증 (경보등급 확인)
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡습니다.
// .v-datatable이나 해당 테이블의 클래스가 있다면 더 정확합니다. 
// 여기서는 일반적인 tr 기준으로 작성합니다.
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 2. 사용자명 확인
  cy.contains('진윤호(yunho)').should('be.visible');

  // 3. 이상행위 유형 확인
  cy.contains('개인정보 과다조회').should('be.visible');

  // 4. 적용된 정책명 확인
  cy.contains('test_auto_개인정보과다조회').should('be.visible');

  // 5. 개인정보 유무 및 소명 대상 여부 확인
  cy.contains('존재').should('be.visible');
  cy.contains('소명 대상').should('be.visible');

  // 6. 경보 등급 아이콘 확인 (초록색 경보등급 - 주의 아이콘)
  cy.get('i.v-icon.c-data-grid-icons-icon').should('be.visible').and('have.class', 'g-IMajorAlert').and('have.css', 'color', 'rgb(255, 192, 0)'); 

});

 cy.log('🎉 경보등급 경계 (주황색) 이력행위 발생 확인 !');

 //==========================================
// Depth 개인정보과다조회 - 경보등급별 검증  CASE 3
//===========================================

  // ==========================================
  // 분석 서브메뉴 - 경보등급 주의 -> 경계로 변경
  // ==========================================
  // 분석탭 이동
  cy.contains('button.has-child', '분석').click({ force: true });
  cy.wait(2000); // 메뉴 펼쳐짐 대기

  // 추가한 test_auto_개인정보과다 조회정책 수정--------------------------------------
  // 추가된 정책명 : test_auto_개인정보과다조회 다시 재클릭 
  cy.contains('a', 'test_auto_개인정보과다조회').should('be.visible').click({ force: true });
  cy.wait(500);

  // 정책 상세 설정 
    // 경보등급 - 주의단계 이력 셋팅 
    cy.get('input[aria-label="주의"]').filter(':visible').clear({ force: true }).type('10', { force: true });
    cy.wait(500);

    // 경계 입력
    cy.get('input[aria-label="경계"]').filter(':visible').clear({ force: true }).type('25', { force: true });
    cy.wait(500);

    // 심각 입력
    cy.get('input[aria-label="심각"]').filter(':visible').clear({ force: true }).type('50', { force: true });
    cy.wait(500);

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(500);

//==========================================
// Depth 개인정보과다조회 - 경보등급별 검증 
//===========================================
   
// ----------------------------------------------------------
// [STEP 1] WAS 시스템 로그인 및 이상행위(과다조회) 타격
// ----------------------------------------------------------
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 기존 코드에서 옵션 추가
cy.visit('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', { 
  timeout: 60000,           // 타임아웃을 60초로 연장
  onBeforeLoad(win) {      // 페이지 로드 전 속도 향상을 위한 설정
    delete win.fetch; 
  }
});

cy.origin('http://10.10.54.22:8080', () => {
  Cypress.on('uncaught:exception', () => false);

  // 2. WAS 화면 UI 로그인 진행 (yunho 계정)
  cy.log('1️⃣ UI를 통해 완벽하게 로그인을 수행합니다.');
  cy.visit('/uat/uia/egovLoginUsr.do');
  cy.get('#id').should('be.visible').clear().type('yunho');
  cy.get('#password').should('be.visible').clear().type('Manager1{enter}');

  // 3. 로그인 성공 검증 (로그아웃 버튼 렌더링 대기)
  cy.contains('a', '로그아웃', { timeout: 15000 }).should('be.visible');
  cy.log('✅ 로그인 성공! 방금 생성된 싱싱한 세션 확보 완료!');

  // 4. ✨ 핵심 로직: 쿠키 또는 URL에서 JSESSIONID를 안전하게 추출합니다.
  cy.url().then((currentUrl) => {
    cy.getCookie('JSESSIONID').then((cookie) => {
      let freshSessionId = '';

      // ① 먼저 쿠키에 JSESSIONID가 있는지 확인
      if (cookie && cookie.value) {
        freshSessionId = cookie.value;
        cy.log(`🔑 쿠키에서 세션 ID 추출 완료`);
      } 
      // ② 쿠키가 없다면, URL에 jsessionid가 붙어있는지 확인 (URL Rewriting 대응)
      else if (currentUrl.toLowerCase().includes('jsessionid=')) {
        // 정규식을 사용해 URL에서 jsessionid 값만 쏙 뽑아냅니다.
        const match = currentUrl.match(/jsessionid=([^?&#]+)/i);
        if (match && match[1]) {
          freshSessionId = match[1];
          cy.log(`🔑 URL에서 세션 ID 추출 완료`);
        }
      }

      // 방어 코드: 둘 다 실패했을 경우
      if (!freshSessionId) {
        throw new Error('❌ JSESSIONID를 쿠키와 URL 모두에서 찾을 수 없습니다.');
      }

      cy.log(`✅ 최종 사용될 세션 ID: ${freshSessionId}`);

      // 5. 추출한 새 세션 ID를 헤더에 꽂아서 API 타격!
      cy.request({
        method: 'POST',
        url: '/cop/logcatch/btnExcessCheck.do',
        form: true,
        headers: {
          'Cookie': `JSESSIONID=${freshSessionId}`, 
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'http://10.10.54.22:8080/uat/uia/actionMain.do'
        },
        body: { 
          menuNo: '41' 
        }
      }).then((response) => {
        // 6. 정상 응답 검증 (200 OK)
        expect(response.status).to.eq(200);
        cy.log('🎉 매번 새로운 세션으로 과다조회 자동 타격 성공!');
      });
    });
  });
});


// ----------------------------------------------------------
// [STEP 2] 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// ----------------------------------------------------------
cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
cy.clearCookies();
cy.clearLocalStorage();

// 2. 주소 뒤에 아무것도 붙지 않은 '순수 도메인' 주소로 접속합니다.
// 경로를 생략하고 도메인까지만 입력하면 서버가 404를 내뱉을 확률이 줄어듭니다.
cy.visit('https://10.10.54.21:18443/logcatch/login'); 

cy.wait(8000); // 페이지 로딩 및 안정화 대기

  
    
// ----------------------------------------------------------
// [STEP 3] 이력 메뉴 화면 이동진입 (Chunk Error 방어 로직 포함)
// ----------------------------------------------------------
cy.log('🔄 페이지 안정화 확인 및 이력 메뉴 클릭 시도');

// 1. '이력' 버튼이 있는지 확인하고, 없으면 새로고침 (Chunk Error 대비)
cy.get('body').then(($body) => {
  if ($body.find('button:contains("이력")').length === 0) {
    cy.log('⚠️ 메뉴 렌더링 실패 감지! 새로고침 후 재시도합니다.');
    cy.reload();
    cy.wait(5000);
  }
});

// 💡 [STEP 0] 에러 방어막 강화 (JS 청크, CSS 청크, 라우터 에러 모두 무시)
// 이 코드는 가급적 테스트 파일 최상단(describe 블록 바로 아래 등)에 한 번만 선언해 두는 것이 좋습니다.
Cypress.on('uncaught:exception', (err, runnable) => {
  if (
    err.message.includes('ChunkLoadError') || 
    err.message.includes('Loading CSS chunk') ||  // 👈 이 부분이 추가되었습니다!
    err.message.includes('Loading chunk') ||
    err.message.includes('navigation guard')
  ) {
    return false; // Cypress가 테스트를 멈추지 않고 계속 진행하게 함
  }
});

// ---------------------------------------------------------------------------
// 1. '이력' 버튼 클릭
cy.contains('button', '이력').should('be.visible').click({ force: true });
cy.wait(1000); 

// 2. 서브메뉴 '접속기록 이력' 클릭
cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });

// 💡 넉넉하게 4초 정도 기다려 줍니다. (정상이면 화면이 뜨고, 에러면 무한 로딩이 걸릴 시간)
cy.wait(4000); 

// 3. 무한 로딩 감지 및 자동 복구 로직 (Self-Healing)
cy.get('body').then(($body) => {
  // '이상행위' 탭이 화면에 그려졌는지 확인합니다.
  const isTabLoaded = $body.find('.tab-btn:contains("이상행위")').length > 0;

  if (isTabLoaded) {
    cy.log('🟢 화면이 정상적으로 로드되었습니다.');
  } else {
    // 탭이 없다면 청크 다운로드 실패(무한 로딩)로 간주하고 강제 새로고침!
    cy.log('🔴 ChunkLoadError(무한 로딩) 감지! 페이지를 강제로 새로고침합니다.');
    cy.reload();
    cy.wait(5000); // 새로고침 후 화면 안정화 대기

    // 새로고침 후 메인 화면으로 튕겼을 수 있으므로, 메뉴를 다시 차분하게 찾아 들어갑니다.
    cy.get('body').then(($newBody) => {
      // 여전히 이상행위 탭이 없다면 메뉴부터 다시 클릭
      if ($newBody.find('.tab-btn:contains("이상행위")').length === 0) {
        cy.log('🔄 메뉴를 다시 클릭하여 진입합니다.');
        cy.contains('button', '이력').click({ force: true });
        cy.wait(1000);
        cy.contains('.v-list__tile__title', '접속기록 이력').click({ force: true });
        cy.wait(4000);
      }
    });
  }
});

// 4. 최종 확인 및 탭 클릭 (이제 무조건 화면에 나타나 있을 것입니다)
cy.contains('.tab-btn', '이상행위', { timeout: 15000 }).should('be.visible').click({ force: true });
//------------------------------------------------------------------------------------------------------
cy.log('✅ 이상행위 탭 진입 성공');

// 이상행위 유형 선택 
    cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 이상행위 유형중 개인정보 과다조회 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('개인정보 과다조회').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');
    
    //경보등급 선택
    // '경보 등급' 입력창(콤보박스)을 클릭하여 리스트를 펼칩니다.
    cy.get('input[aria-label="경보 등급"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 펼쳐진 리스트 중에서 '심각'이라는 텍스트를 가진 항목을 찾아 '심각' 클릭합니다.
    cy.get('.v-list__tile__title').filter(':visible').contains('심각').click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');

    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(500);

// ----------------------------------------------------------
// [STEP 4] 이상행위 첫 번째 행(최신 로그) 데이터 검증 (경보등급 확인)
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡습니다.
// .v-datatable이나 해당 테이블의 클래스가 있다면 더 정확합니다. 
// 여기서는 일반적인 tr 기준으로 작성합니다.
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 2. 사용자명 확인
  cy.contains('진윤호(yunho)').should('be.visible');

  // 3. 이상행위 유형 확인
  cy.contains('개인정보 과다조회').should('be.visible');

  // 4. 적용된 정책명 확인
  cy.contains('test_auto_개인정보과다조회').should('be.visible');

  // 5. 개인정보 유무 및 소명 대상 여부 확인
  cy.contains('존재').should('be.visible');
  cy.contains('소명 대상').should('be.visible');

  // 6. 경보 등급 아이콘 확인 (초록색 경보등급 - 주의 아이콘)
  cy.get('i.v-icon.c-data-grid-icons-icon').should('be.visible').and('have.class', 'g-IMinorAlert').and('have.css', 'color', 'rgb(244, 67, 54)'); 

});

 cy.log('🎉 경보등급 심각 (빨강색) 이력행위 발생 확인 !');

 
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 분석 - 개인정보 과다조회 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;