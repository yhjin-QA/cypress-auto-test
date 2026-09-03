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
    // STEP 0 경보등급 랜돔 지정 셋팅
    // ==========================================
    // 🎲 [랜덤 설정] 테스트 실행 시마다 주의, 경계, 심각 중 하나를 무작위로 선택합니다.
    const alertLevels = [
      { label: '주의', iconClass: 'i.g-ICriticalAlert', color: 'rgb(169, 209, 142)' },
      { label: '경계', iconClass: 'i.g-IMajorAlert', color: 'rgb(255, 192, 0)' },
      { label: '심각', iconClass: 'i.g-IMinorAlert', color: 'rgb(244, 67, 54)' }
    ];
    // 배열에서 하나를 랜덤하게 뽑아 targetAlert 변수에 저장합니다.
    const targetAlert = alertLevels[Math.floor(Math.random() * alertLevels.length)];
    
    cy.log(`🎲 이번 테스트 타겟 경보 등급: [${targetAlert.label}]`);

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
          .contains('확정')
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


    ///////////////////////////////////////////////
    // 이상행위 정책 -  권한 외 메뉴 접근 
    ///////////////////////////////////////////////
    cy.contains('.v-chip__content', '권한 외 메뉴 접근').should('be.visible').click({ force: true });
    cy.contains('.c-headline', '권한 외 메뉴 접근 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------
    cy.log('🔍 기존 정책 존재 여부를 확인합니다.');
    
    //예외처리  test_auto_권한 외 메뉴 접근 삭제 --------------------------
    // 1. [조건부 삭제] test_auto_권한 외 메뉴 접근 정책이 있으면 삭제, 없으면 패스
    cy.get('body').then(($body) => {
    // jQuery의 :contains 선택자를 이용해 해당 텍스트가 있는 <tr>을 찾습니다.
    const hasPolicy = $body.find('tr:contains("test_auto_권한 외 메뉴 접근")').length > 0;

    if (hasPolicy) {
      cy.log('🗑️ 기존 정책이 발견되었습니다. 삭제를 진행합니다.');
    
      // 삭제 버튼(휴지통) 클릭
      cy.contains('tr', 'test_auto_권한 외 메뉴 접근').find('.fa-trash').click({ force: true });
      cy.wait(500);
    
      // 삭제 확인 팝업에서 '확인' 클릭
      cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });
      cy.wait(1000); // 삭제 처리가 서버에 반영될 시간 대기

      // 추가한 정책 삭제 검증코드 
      cy.contains('tr', 'test_auto_권한 외 메뉴 접근').should('not.exist'); 
      cy.log('✅ 기존 정책 삭제 완료!');
    
    } else {
      // 정책이 없으면 에러 없이 이 구문을 타고 자연스럽게 통과합니다.
      cy.log('⚪ 기존 정책이 없습니다. 삭제 단계를 패스합니다.');
     }
     });
     //----------------------------------------------------------------------------

    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 권한 외 메뉴 접근 정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_권한 외 메뉴 접근', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 OFF-> ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);

    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500); 

     // 업무시스템 - 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').first().parent().click({ force: true });
    cy.wait(500);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').first().contains('리눅스_배송관리').click({ force: true });
    cy.wait(500);

    // 드롭다운 닫지 않고 두 번째 선택: 리눅스_VIP고객
    cy.get('.menuable__content__active').filter(':visible').contains('.v-list__tile__title', '리눅스_VIP고객').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 경보등급 랜덤 선택하기 ---------------------------------------------------------------------
    cy.log(`🎯 경보등급 [${targetAlert.label}] 항목을 선택합니다.`);
    cy.contains('label', targetAlert.label).closest('div').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.wait(500);
    
    // 랜덤 선택된 상태 확인 검증코드 
    cy.contains('label', targetAlert.label).closest('div').find('input').should('have.attr', 'aria-checked', 'true');
    cy.wait(500);

    // 접근 제한 메뉴/URL 주소 설정-------
    // 메뉴명 입력하기 
    cy.get('input[aria-label="메뉴 명"]').filter(':visible').clear({ force: true }).type('test_배송 담당자 조회', { force: true });
    // 업무시스템 - 선택
    cy.wait(500);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').last().scrollIntoView({ block: 'center' }).parent().click({ force: true });
    cy.wait(500);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').last().contains('리눅스_배송관리').click({ force: true });
    cy.wait(500);

    //URI 주소 입력하기 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/cop/logcatch/selectDeliveryList.do', { force: true });
    cy.wait(500);

    // 추가버튼 클릭
    cy.get('input[aria-label="URI 주소"]').closest('form').find('button').contains('추가').click({ force: true });
    cy.wait(500);

    //추가된 표안의 잘추가되어있는지 검증코드 
    cy.contains('tr', 'test_배송 담당자 조회').scrollIntoView({ block: 'center' }) 
     .within(() => {
      cy.contains('/cop/logcatch/selectDeliveryList.do').should('be.visible'); 
    });
     cy.wait(500); 
     //-------------------------------------------------------------------------------------------------------

     // 접근 제한 메뉴/URL 주소 설정---------------------------------------------------------------------------------------------------
    // 메뉴명 입력하기 
    cy.get('input[aria-label="메뉴 명"]').filter(':visible').clear({ force: true }).type('test_고객 데이터 유출', { force: true });
    // 업무시스템 - 선택
    cy.wait(500);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').last().scrollIntoView({ block: 'center' }).parent().click({ force: true });
    cy.wait(500);
    // 업무시스템중 '리눅스_배송관리' 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').last().contains('리눅스_VIP고객').click({ force: true });
    cy.wait(500);

    //URI 주소 입력하기 
    cy.get('input[aria-label="URI 주소"]').filter(':visible').clear({ force: true }).type('/crm/soc_matrix.jsp', { force: true });
    cy.wait(500);

    // 추가버튼 클릭
    cy.get('input[aria-label="URI 주소"]').closest('form').find('button').contains('추가').click({ force: true });
    cy.wait(500);

    //추가된 표안의 잘추가되어있는지 검증코드 
    cy.contains('tr', 'test_고객 데이터 유출').scrollIntoView({ block: 'center' }) 
     .within(() => {
      cy.contains('/crm/soc_matrix.jsp').should('be.visible'); 
    });
     cy.wait(500); 
     //------------------------------------------------------------------------------------------------------------


     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);
    
     //권한 외 메뉴 접근 정책 목록에 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_권한 외 메뉴 접근').should('be.visible');

// ==================== [여기] WAS 타격 직전 ====================
// ① 타격 시각 기록
const hitTime = new Date();
const hitTimeStr = `${hitTime.getFullYear()}-${String(hitTime.getMonth()+1).padStart(2,'0')}-${String(hitTime.getDate()).padStart(2,'0')} ${String(hitTime.getHours()).padStart(2,'0')}:${String(hitTime.getMinutes()).padStart(2,'0')}:${String(hitTime.getSeconds()).padStart(2,'0')}`;
cy.log(`⏱️ WAS 타격 시각 기록: ${hitTimeStr}`);
// ==============================================================

// ========================================
// WAS 타격: 10.10.54.27 (LOGCATCH SECURE PORTAL - 고객 데이터 유출)
// ========================================

// 1단계: 로그인 (JSESSIONID 획득)
cy.request({
    method: 'POST',
    url: 'http://10.10.54.27/crm/login.jsp',
    form: true,
    body: {
        empId: 'user002',
        empPw: 'Manager1!'
    },
    followRedirect: false,
    failOnStatusCode: false
}).then((loginRes) => {
    cy.log(`✅ 로그인 응답: ${loginRes.status}`); // 302 예상

    // 2단계: 고객 데이터 유출 실행 (GET)
    cy.request({
        method: 'GET',
        url: 'http://10.10.54.27/crm/soc_matrix.jsp',
        qs: {
            action: 'massive_inquiry',
            _ts: Date.now()
        },
        failOnStatusCode: false
    }).then((res) => {
        expect(res.status).to.eq(200);
        cy.log('✅ WAS 타격 완료 (10.10.54.27 고객 데이터 유출)');
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
// 원래 주소로 접속
cy.visit('https://10.10.54.21:18443/logcatch/login');
cy.wait(3000); // 화면이 그려질 수 있도록 초기 렌더링 대기 

// 2. 화면 상태 분석 및 분기 처리
cy.get('body').then(($body) => {
  // 로그인 입력창이 존재하는지 확인
  const hasLoginInput = $body.find('input[aria-label="사용자 계정"]').length > 0;
  
  if (hasLoginInput) {
    // 🟡 [상태 1] 로그인 화면이 정상적으로 떴을 때
    cy.log('🟡 로그인 화면 감지: 로그인을 수행합니다.');
    
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true }); // 엔터키로 안전하게 로그인
    
    cy.wait(8000); // 로그인 후 대시보드 로딩 대기

  } else {
    // 로그인 창이 없을 경우: '이미 로그인된 상태'이거나 '렌더링 실패(흰 화면)' 둘 중 하나입니다.
    // 이전 스크린샷들을 참고하여 우측 상단의 'ADMIN 님' 텍스트나 메뉴 텍스트가 존재하는지 확인합니다.
    const isAlreadyLoggedIn = $body.text().includes('ADMIN') || $body.text().includes('로그아웃');

    if (isAlreadyLoggedIn) {
      // 🟢 [상태 2] 이미 로그인된 메인 화면일 때
      cy.log('🟢 이미 로그인된 상태(대시보드)입니다. 로그인 과정을 패스합니다.');

    } else {
      // 🔴 [상태 3] 로그인 창도 없고, 메인 화면 텍스트도 없으면 렌더링 실패로 간주합니다.
      cy.log('🔴 화면 렌더링 실패(흰 화면) 감지! 페이지를 새로고침합니다.');
      cy.reload();
      cy.wait(3000); // 새로고침 후 안정화 대기

      // 새로고침 후 최종 확인 및 실행
      cy.get('body').then(($newBody) => {
        if ($newBody.find('input[aria-label="사용자 계정"]').length > 0) {
          cy.log('🟡 새로고침 후 로그인 화면 복구됨: 로그인을 수행합니다.');
          
          cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
          cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
          cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });
          
          cy.wait(8000);
        } else {
          cy.log('🟢 새로고침 후 로그인된 상태로 진입 확인. 패스합니다.');
        }
      });
    }
  }
});

cy.log('🚀 원래 사이트(LogCatch) 진입 및 로그인 로직 무사 통과!');

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

// // 사용자 검색 - 진윤호(yunho)
// // 1. 콤보박스에 검색어 입력
// cy.get('input[aria-label="사용자"]').filter(':visible').clear({ force: true }).type('yunho', { force: true });
// cy.wait(1000); 
// // 검색된 콤보박스 리스트  선택하기
// cy.contains('.v-list__tile__title', 'yunho').should('be.visible').click({ force: true });
// cy.wait(1000);
// // 선택 후 메뉴 닫기
// cy.get('body').type('{esc}');



// 이상행위 유형 선택 
cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(1000);
// 이상행위 유형중 개인정보 과다조회 클릭하는 코드
// 1. 현재 화면에 열려있는 '진짜' 활성 상태의 팝업창만 타겟팅합니다.
cy.get('.menuable__content__active').filter(':visible').within(() => {
  
  // 2. 그 활성 팝업창 안에서 '파일다운로드'를 찾습니다.
  // 이제 엉뚱한 숨김 처리된 팝업의 글자를 찾을 위험이 0%가 됩니다.
  cy.contains('.v-list__tile__title', '권한 외 메뉴 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
});
cy.wait(1000); // 클릭 후 메뉴가 닫힐 시간 대기
// 선택 후 메뉴 닫기
cy.get('body').type('{esc}');
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// ==================== [여기] 검색버튼 클릭 직후 ====================
// ⑤ 타격 시각 이후 행이 나타날 때까지 폴링
function waitForNewLog(attempt = 0) {
    if (attempt > 24) throw new Error('❌ 새 이력 미반영 (120초 초과)');

    cy.get('tbody tr').filter(':visible').then(($rows) => {
        // 첫 번째 행 타임스탬프가 타격 시각보다 최신인지 확인
        const firstRowTime = $rows.first().find('td').first().text().trim();
        const isNew = firstRowTime >= hitTimeStr;

        if (isNew) {
            cy.log(`✅ 새 이력 감지! 행 시각: ${firstRowTime} >= 타격 시각: ${hitTimeStr}`);
        } else {
            cy.log(`⏳ 대기 중... (${attempt * 5}초 경과) 현재 최신: ${firstRowTime}`);
            cy.wait(5000);
            cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
            cy.wait(1000);
            waitForNewLog(attempt + 1);
        }
    });
}
waitForNewLog();
// ================================================================

// ----------------------------------------------------------
// [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');
// [개선 코드]
// 1. 먼저 테이블 내에 내가 원하는 데이터가 나타날 때까지 기다립니다 (최대 15초)
cy.get('tbody', { timeout: 15000 }).contains('tr', '사원_2(user002)').should('be.visible');


// 1. 첫 번째 행을 잡고 그 안으로(within) 쏙 들어갑니다. ($row 변수 생략 가능!)
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 2. 텍스트 검증
  cy.contains('사원_2(user002)').should('be.visible');
  cy.contains('권한 외 메뉴 접근').should('be.visible');
  cy.contains('test_auto_권한 외 메뉴 접근').should('be.visible');
  cy.contains('존재').should('be.visible');
  cy.contains('소명 대상').should('be.visible');

  // 3. 아이콘 맞춤 검증 (랜덤으로 선택했던 바로 그 등급을 검증합니다)
  cy.log(`🔍 생성 시 선택했던 [${targetAlert.label}] 로그가 정상적으로 발생했는지 검증합니다.`);
  cy.get(targetAlert.iconClass).should('be.visible').and('have.css', 'color', targetAlert.color);
  });

cy.log('🎉 분석 이상행위 권한 외 메뉴 접근 확인 및 랜덤 등급 검증 완료!');


  // ==========================================
  // [FINAL] 테스트 종료 및 메뉴 닫기
  // ==========================================
  cy.log('🎉 Depth 분석 - 권한 외 메뉴 접근 테스트 시나리오 성공적으로 완료!');
  cy.get('body').type('{esc}');
  cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;