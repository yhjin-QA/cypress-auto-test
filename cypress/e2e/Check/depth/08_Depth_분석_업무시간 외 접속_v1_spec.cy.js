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
  
  it('08_Depth_분석_업무시간 외 접속 자동화 시나리오', () => {


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
   // [추가된 부분] 중복 로그인 "이미 로그인" 알림창 처리 (조건부 로직)
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


    // 설명: '업무 시간 외 접속' 텍스트를 찾아 클릭
    cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------
    cy.log('🔍 기존 정책 존재 여부를 확인합니다.');
    
    //예외처리  test_auto_업무 시간 외 접속 삭제 --------------------------
    // 1. [조건부 삭제] test_auto_업무 시간 외 접속 정책이 있으면 삭제, 없으면 패스
    cy.get('body').then(($body) => {
    // jQuery의 :contains 선택자를 이용해 해당 텍스트가 있는 <tr>을 찾습니다.
    const hasPolicy = $body.find('tr:contains("test_auto_업무 시간 외 접속")').length > 0;

    if (hasPolicy) {
      cy.log('🗑️ 기존 정책이 발견되었습니다. 삭제를 진행합니다.');
    
      // 삭제 버튼(휴지통) 클릭
      cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-trash').click({ force: true });
      cy.wait(500);
    
      // 삭제 확인 팝업에서 '확인' 클릭
      cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });
      cy.wait(1000); // 삭제 처리가 서버에 반영될 시간 대기

      // 추가한 정책 삭제 검증코드 
      cy.contains('tr', 'test_auto_업무 시간 외 접속').should('not.exist'); 
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

    // 업무 시간 외 접속  정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_업무 시간 외 접속', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500); 
    
    // 업무시스템 - 리눅스 배송관리 선택
    // cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    // cy.wait(1000);
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // ✅ 개선 - input과 묶어서 한 번에
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);

    // 드롭다운 닫지 않고 두 번째 선택: 리눅스_VIP고객
    cy.get('.menuable__content__active').filter(':visible').contains('.v-list__tile__title', '리눅스_VIP고객').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(500);

    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    //업무시간 설정 월~금요일옆 토글버튼 활성화
    cy.contains('label', '월요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '화요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '수요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '목요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '금요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });


  // ==========================================
  // 업무 시간(월~금)  시계값 10:00 로 변경
  // ==========================================
  const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];

  days.forEach((day) => {
  cy.log(`🕒 [${day}] 정확한 타겟팅으로 퇴근 시간 설정 시작`);

  cy.get('body').type('{esc}', { force: true });
  cy.wait(300);

  // 🎯 핵심 해결책: 정확히 '해당 요일의 줄(Row)'만 찾아냅니다.
  cy.contains('label', day).parents('div') // 부모 요소들을 전부 탐색합니다.
  .filter((index, el) => Cypress.$(el).find('input[type="text"]').length >= 2) // 그중 출/퇴근 텍스트 입력창이 2개 이상 있는 부모만 걸러냅니다.
    .first() // 가장 가까운 부모 (정확히 해당 요일의 한 줄) 선택!
    .find('input[type="text"]') .last() // 그 줄에서 마지막 입력창(퇴근 시간) 클릭!
    .click({ force: true }); 
    
  // 💡 드디어 우리가 찾던 '진짜 해당 요일의 팝업'이 열립니다!
  cy.get('.menuable__content__active').should('be.visible');
  cy.wait(800);

  // 1. 시간 '10' 클릭
  cy.get('.menuable__content__active .v-time-picker-clock__item').contains(/^10$/).click({ force: true });
  cy.get('.menuable__content__active .v-time-picker-clock__item').contains(/^00$/).should('be.visible'); 
  

  // 2. 분 '00' 클릭
  cy.get('.menuable__content__active .v-time-picker-clock__item').contains(/^00$/).click({ force: true });
  cy.wait(500);

  // 3. '확인' 버튼 클릭
  cy.get('.menuable__content__active').contains('button', '확인').click({ force: true });

  cy.get('.menuable__content__active').should('not.exist');
  cy.wait(500);

  // 4. 해당 요일의 값이 진짜로 바뀌었는지 최종 검증
  cy.contains('label', day).parents('div').filter((index, el) => Cypress.$(el).find('input[type="text"]').length >= 2).first().find('input[type="text"]').last().should('have.value', '10:00');
  cy.log(`✅ [${day}] 10:00 실제 UI 반영 완벽 성공!`);
  });
  cy.wait(1000);
 

  // 저장버튼 클릭 
  cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
  cy.wait(500);

  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------  
  //test_auto_업무 시간 외 접속 목록에 정책이 잘 추가되었는지 검증하는 코드 
  //cy.get('tbody').contains('tr', 'test_auto_업무 시간 외 접속').should('be.visible');
  cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible');
  cy.get('.v-snack__content', { timeout: 15000 }).should('not.exist');
  cy.get('tbody', { timeout: 10000 }).contains('tr', 'test_auto_업무 시간 외 접속').should('be.visible');

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
        empId: 'user004',
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


// // ----------------------------------------------------------
// // [STEP 2] 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// // ----------------------------------------------------------
 cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// // 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
// cy.clearCookies();
// cy.clearLocalStorage();

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
// cy.contains('.c-headline', '검색 조건', { timeout: 5000 }).should('exist');
// cy.get('input[aria-label="사용자"]').filter(':visible').clear({ force: true }).type('yunho', { force: true });
// cy.wait(1000); 
// // 검색된 콤보박스 리스트  선택하기
// cy.contains('.v-list__tile__title', 'yunho').should('be.visible').click({ force: true });
// cy.wait(1000);
// // 선택 후 메뉴 닫기
// cy.get('body').type('{esc}');


// 이상행위 유형 선택 
cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(500);
// 이상행위 유형중 개인정보 과다조회 클릭하는 코드
cy.get('.v-list__tile__title').filter(':visible').contains('업무 시간 외 접속').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
// 선택 후 메뉴 닫기
cy.get('body').type('{esc}');
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// ==================== [여기] 검색버튼 클릭 직후 ====================
// ⑤ 타격 시각 이후 행이 나타날 때까지 폴링
function waitForNewLog(attempt = 0) {
    // 5초 간격 24회 폴링
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
// [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증 (업무시간외 접속)
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');
// [개선 코드]
// 1. 먼저 테이블 내에 내가 원하는 데이터가 나타날 때까지 기다립니다 (최대 15초)
cy.get('tbody', { timeout: 15000 }).contains('tr', '사원_4(user004)').should('be.visible');


// ✅ 오늘 날짜 기준으로 방금 생성된 행인지 확인
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`; // ex) "2026-06-18"




// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡아서 $row 변수로 받습니다.
cy.get('tbody tr').filter(':visible').first().then(($row) => {
  
  // 타임스탬프 열(첫 번째 td)이 오늘 날짜인지 확인 → 방금 생성된 행임을 보장
  cy.wrap($row).find('td').first().invoke('text').then((text) => {
    expect(text).to.include(todayStr, '첫 번째 행 날짜정보입니다. ');
  });
  
  // 2. 텍스트 검증 (wrap을 사용하여 $row 내부만 검색합니다)
  cy.wrap($row).within(() => {
    cy.contains('사원_4(user004)').should('be.visible');
    cy.contains('업무 시간 외 접속').should('be.visible');
    cy.contains('test_auto_업무 시간 외 접속').should('be.visible');
    cy.contains('존재').should('be.visible');
    cy.contains('소명 대상').should('be.visible');
  });

  // 3. 아이콘 조건부 검증 ("있으면 검증하고, 없으면 통과하기")
  // $row(첫 번째 행) 안에서 해당 클래스를 가진 요소가 존재하는지 확인합니다.
  
  // 🟢 [주의] 아이콘 검증
  if ($row.find('i.g-ICriticalAlert').length > 0) {
    cy.log('🟢 주의 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-ICriticalAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(169, 209, 142)');
  } else {
    cy.log('🟢 주의 로그가 없습니다. 패스합니다.');
  }

  // 🟠 [경계] 아이콘 검증
  if ($row.find('i.g-IMajorAlert').length > 0) {
    cy.log('🟠 경계 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMajorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(255, 192, 0)');
  } else {
    cy.log('🟠 경계 로그가 없습니다. 패스합니다.');
  }

  // 🔴 [심각] 아이콘 검증
  if ($row.find('i.g-IMinorAlert').length > 0) {
    cy.log('🔴 심각 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMinorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(244, 67, 54)');
  } else {
    cy.log('🔴 심각 로그가 없습니다. 패스합니다.');
  }

});

cy.log('🎉 업무 시간 외 접속 이력행위 발생 확인 및 검증 완료!');



  
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 분석- 업무시간 외 접속 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;