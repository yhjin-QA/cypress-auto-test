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


// ===============================================
// WAS (JEUS) -엑설 다운로드 버튼이용한 사전소명 CASE
// ===============================================


// ==========================================
// STEP : 로그인
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
// STEP : 일반모드 -> 관리자페이지 탭 진입 (자동 복구 로직 적용)
// ==========================================
cy.log('🚀 관리자(톱니바퀴) 버튼 클릭 및 렌더링 대기');

cy.get('body').then(($body) => {
  // 1차 방어: 화면에 톱니바퀴 아이콘이 아예 렌더링되지 않았다면?
  if ($body.find('.g-IConfig:visible').length === 0) {
  cy.log('🔴 톱니바퀴 아이콘 렌더링 실패 감지! 페이지 새로고침');
        cy.reload();
        cy.wait(7000);
      }
});

// 톱니바퀴 클릭
cy.get('.g-IConfig').should('be.visible').click({ force: true });
cy.wait(2000); // 청크 로딩 대기

cy.get('body').then(($body) => {
  // 2차 방어: 클릭은 했는데 ChunkLoadError 때문에 '설정' 메뉴가 안 나타났다면?
  if ($body.find('button.side-menu:contains("설정"):visible').length === 0) {
      cy.log('🔴 ChunkLoadError 감지! (사이드 메뉴 렌더링 실패). 새로고침 후 재시도합니다.');
      cy.reload();
      cy.wait(7000);
      cy.get('.g-IConfig').should('be.visible').click({ force: true });
      cy.wait(7000);
       }
  });
 cy.log('✅ 관리자 메뉴 렌더링 및 클릭 완벽 성공');


// ===============================================
// STEP : 관리자페이지  설정 - 사전소명 메뉴 설정 
// ===============================================

// 1. 관리자 페이지 사이드 메뉴 중 '설정' 버튼 클릭
cy.log('--- [설정] 메뉴 클릭 ---');
cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
// 설정 > 패스워드 규칙 서브메뉴 클릭 
cy.wait(2000)
cy.log('--- 서브메뉴 [사전 소명 설멍] 클릭 ---');
cy.contains('.v-list__tile__title', '사전 소명 설정').should('be.visible').closest('a, .v-list__tile').click({ force: true });
cy.wait(2000); // 화면 전환 대기

cy.log('--- 사전 소명 설정화면 검증 시작 ---');
cy.contains('.c-headline', /소명 사유.*설정/, { timeout: 15000 }).should('be.visible');


// ===============================================
// STEP : 'auto_사전소명설정' 존재 검증
// ===============================================
cy.log('🔎 [검증] 그룹 저장 상태 확인 중...');

// 2. 목록에 'auto_사전소명설정'이 여전히 존재하는지 확인
cy.contains('.text-label', 'auto_사전소명설정', { timeout: 10000 }).should('exist');

cy.log('🎉 auto_사전소명설정 그룹 검증 완료!');




//-------------------------------------------------------------------------------------------

// ===============================================
// STEP : 관리 - 시스템 - 접속기록 수집기 화면이동
// (접속기록기에서 사전소명 정책 설정)
// ===============================================
// 관리 > 시스템  서브메뉴 선택 
cy.contains('button.side-menu', '관리').should('be.visible').click({ force: true });
cy.wait(1000);
cy.log('--- 서브메뉴 [정보사용자 / 그룹 관리] 클릭 ---');
cy.get('.v-list__tile__title').filter(':contains("시스템")').filter(':visible').click({ force: true });
cy.wait(1000);
cy.get('.v-btn__content').filter(':visible').contains('접속기록 수집기').last().click({ force: true });
cy.wait(3000);

//Log Tracer WAS Jeus선택하기 
cy.contains('.pl-1', 'Log Tracer_10.10.54.31_8088').should('be.visible').click({ force: true });


// 맨티스 이슈 :  http://bug.warevalley.com/view.php?id=37567
// 삭제시 UI에서는 삭제되지만 DB에서는 남아있는 문제 
// // ======================================================
// // STEP : 시스템 - 접속기록 수집기 - 사전 소명 이벤트 삭제 처리
// // ======================================================
// cy.log('🗑️ 사전 소명 이벤트 삭제 시작');


// // 1. 해당 이벤트가 포함된 행(tr)을 찾고 휴지통 클릭
// cy.contains('td', '사전소명페이지(Jeus)').closest('tr').find('i.fa-trash').click({ force: true });

//   // 삭제 후 데이터가 목록에서 사라졌는지 확인
// cy.contains('td', '사전소명페이지(Jeus)').should('not.exist');
// cy.wait(1000); // 스크롤 애니메이션이 끝날 때까지 대기


// cy.log('✅ 사전 소명 이벤트 삭제 완료');

//임시 조치로 UI & DB삭제 병행코드 
// ======================================================
// STEP : 사전 소명 이벤트 삭제 처리
// ======================================================
cy.log('🗑️ 사전 소명 이벤트 삭제 시작');

// [핵심] DB 우선 삭제
const targetValue = '#excel_btn';
const deleteQuery = `DELETE FROM tbi_log_trace_bef WHERE event_target_value = '${targetValue}'`;
cy.task('queryPostgresDB', deleteQuery);
cy.wait(1000); 

// [수정된 UI 삭제 로직]
// 'contains'를 바로 쓰지 않고, 먼저 body를 검색하여 요소가 존재하는지 확인합니다.
cy.get('body').then(($body) => {
    // 테이블 내에 '사전소명페이지(Jeus)'라는 텍스트가 있는지 확인
    if ($body.find('td:contains("사전소명페이지(Jeus)")').length > 0) {
        cy.log('⚠️ UI에 잔여 데이터 발견! 삭제 시도...');
        
        cy.contains('td', '사전소명페이지(Jeus)')
          .closest('tr')
          .find('i.fa-trash')
          .click({ force: true });
        
        // 삭제 확인 팝업 처리
        cy.contains('button', '확인').click({ force: true });
        
        // 데이터가 사라질 때까지 대기
        cy.contains('td', '사전소명페이지(Jeus)').should('not.exist');
    } else {
        cy.log('✅ UI 데이터가 이미 삭제된 상태입니다. 건너뜁니다.');
    }
});

cy.wait(1000);
cy.log('✅ 사전 소명 이벤트 삭제 절차 종료');



//-------------------------------------------------------------------------------------------

// ===============================================
// STEP : 접속기록 수집기 클릭한 상태에서 
//        사전 소명 이벤트 목록 내 첫 번째 '+' 클릭
// ===============================================
cy.wait(1000); // 스크롤 애니메이션이 끝날 때까지 대기

cy.contains('.c-headline', '사전 소명 이벤트 목록')
  .closest('.v-card') // 헤드라인을 포함하는 카드(또는 컨테이너)
  .then(($section) => {
    // 1. 해당 섹션으로 부드럽게 스크롤합니다.
    $section[0].scrollIntoView({ behavior: 'smooth' });
  });

cy.wait(1000); // 스크롤 애니메이션이 끝날 때까지 대기

// 2. 섹션 내부에서 '+' 아이콘을 찾습니다.
cy.contains('.c-headline', '사전 소명 이벤트 목록')
  .closest('.v-card')
  .within(() => {
    // i.v-icon만 찾는 것보다, 그 상위의 버튼(button)을 클릭하는 것이 훨씬 확실합니다.
    // Vuetify의 아이콘 버튼 구조에 따라 button 태그를 먼저 찾으세요.
    cy.get('button')
      .filter(':has(i.v-icon.material-icons)') // 아이콘이 포함된 버튼만 필터링
      .contains('add') 
      .first()
      .click({ force: true });
  });

cy.wait(1000);

// ===============================================
// STEP : 사전 소명 이벤트 추가 팝업 입력
// ===============================================

// 1. 팝업 카드 영역을 먼저 특정합니다.
cy.contains('.v-card', '사전 소명 이벤트 추가').within(() => {
  
  // 1-1. 메뉴 명 선택
  cy.get('input[aria-label="메뉴 명"]').click({ force: true });
});

// 2. 리스트는 body 하위에 생기므로 within 밖에서 선택
cy.contains('.v-list__tile__title', '사전소명페이지(Jeus)').click({ force: true });

// 3. 이벤트 대상 값 입력 - 개발자도구 (F12) - copy selector 로 값 복사 붙여넣기
cy.contains('.v-card', '사전 소명 이벤트 추가').within(() => {
  cy.get('input[aria-label="이벤트 대상 값"]').clear().type('#excel_btn', { force: true });

  // 4. 소명 사유 그룹 선택
  cy.get('input[aria-label="소명 사유 그룹"]').click({ force: true });
});

// 리스트 선택
cy.contains('.v-list__tile__title', 'auto_사전소명설정').click({ force: true });

// 5. 저장 버튼 클릭
cy.contains('.v-card', '사전 소명 이벤트 추가').within(() => {
  cy.contains('button', '저장').click({ force: true });
});

cy.wait(2000);


// ===============================================
// STEP : 사전 소명 이벤트 추가 데이터 존재 확인
// ===============================================

cy.log('🔍 데이터 저장 성공 여부 검증 시작');
cy.get('table').should('be.visible'); // 테이블이 화면에 보이는지 확인

cy.contains('td', '사전소명페이지(Jeus)')
  .closest('tr') // 해당 텍스트가 있는 행 전체를 잡음
  .within(() => {
    // 해당 행 내부의 다른 컬럼들에 값이 제대로 들어갔는지 확인
    cy.contains('td', '#excel_btn').should('exist');
    cy.contains('td', 'auto_사전소명설정').should('exist');
  });

cy.log('✅ 접속기록 수집기 에서 사전소명 정상적으로 이벤트 목록 추가됨.');



// ===============================================
// STEP : WAS Jeus접속
// ===============================================
cy.log('🚀 다른 도메인(tester3 서버)으로 크로스 오리진 점프를 시도합니다.');

cy.clearCookies();
cy.clearLocalStorage();

cy.intercept('GET', '/tester3/api/file-download*').as('excelDownload');

cy.origin('http://10.10.54.31:8088', () => {
  Cypress.on('uncaught:exception', () => false);

  cy.visit('/tester3', { timeout: 60000 });
  cy.wait(3000);

  // 팝업 처리 로직을 버튼 클릭 직전에 확실하게 적용
  cy.window().then((win) => {
    // 기존 prompt를 stub으로 덮어씁니다.
    cy.stub(win, 'prompt').callsFake((message) => {
     // cy.log 대신 console.log 사용 (에러 방지)
      console.log('📢 감지된 팝업 문구:', message);
      return '1'; // 1을 반환하고 확인을 누름
    }).as('promptStub'); // 나중에 호출 여부 확인을 위해 별칭 지정
  });

  cy.log('3️⃣ Excel 버튼을 클릭합니다.');
  cy.get('#excel_btn')
    .should('be.visible')
    .invoke('removeAttr', 'target')
    .click({ force: true });

  // 2. 팝업 호출 검증
  cy.get('@promptStub', { timeout: 50000 }).should('have.been.called');
});

// 4. 다운로드 완료 대기
cy.log('⏳ 엑셀 다운로드가 완료될 때까지 기다립니다...');
cy.wait('@excelDownload', { timeout: 80000 }); 
cy.log('✅ Excel 다운로드 API 응답 완료!');
cy.wait(2000);


// =============================================
// STEP 5: 원래 점검 사이트로 깨끗하게 복귀 및 유저 로그인
// =============================================
cy.log('🧹 원래 점검 사이트(LogCatch)로 깨끗하게 복귀');
cy.login('admin', 'Manager1!'); 

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
// 1. 현재 화면에 열려있는 '진짜' 활성 상태의 팝업창만 타겟팅합니다.
cy.get('.menuable__content__active').filter(':visible').within(() => {
  
  // 2. 그 활성 팝업창 안에서 '파일다운로드'를 찾습니다.
  // 이제 엉뚱한 숨김 처리된 팝업의 글자를 찾을 위험이 0%가 됩니다.
  cy.contains('.v-list__tile__title', '사전 소명 메뉴 접근').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
});

cy.wait(500); // 클릭 후 메뉴가 닫힐 시간 대기
// 선택 후 메뉴 닫기
cy.get('body').type('{esc}');

 //사용자 상태 클릭 --------------------------------------------------------------------------
 cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
 cy.wait(1000);

 // 사용자 상태 리스트 중 '미등록' 선택
 cy.get('.v-menu__content.theme--light.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', '미등록').click({ force: true });
 cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// ----------------------------------------------------------
// [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 첫 번째 행을 잡고 그 안으로(within) 쏙 들어갑니다. ($row 변수 생략 가능!)
cy.get('tbody tr').filter(':visible').first().within(() => {
  
  // 2. 텍스트 검증
  cy.contains('(미등록 사용자)').should('be.visible');
  cy.contains('사전 소명 메뉴 접근').should('be.visible');
  cy.contains('DEFAULT').should('be.visible');
  cy.contains('존재').should('be.visible');
  cy.contains('소명 불필요').should('be.visible'); 
  // [신규] 시간 검증 로직
  cy.get('a.ellipsis').first().invoke('text').then((text) => {
    const logTime = new Date(text.trim()).getTime(); // 로그의 시간
    const now = new Date().getTime(); // 현재 시간
    const diffMinutes = Math.abs(now - logTime) / (1000 * 60); // 차이를 분 단위로 계산

    cy.log(`로그 시간: ${text}, 차이: ${diffMinutes.toFixed(2)}분`);
    
    // 2분(120,000ms) 이내인지 확인
    expect(diffMinutes).to.be.below(2);
  });
  
});

cy.log('🎉 사전소명 메뉴 접근  검증 완료!');



// ==========================================
// [FINAL] 테스트 종료 및 메뉴 닫기
// ==========================================
cy.log('🎉 소명 - 사전 소명 테스트 시나리오 성공적으로 완료!');
cy.get('body').type('{esc}');
cy.get('body').click('center', { force: true });


   
  });
});  

//코드마지막


 })()
;
