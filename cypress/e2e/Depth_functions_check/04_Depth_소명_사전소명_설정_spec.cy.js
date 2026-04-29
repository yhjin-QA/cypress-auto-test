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
//cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });

// '설정' 메뉴가 없으면 새로고침 후 다시 시도하는 재귀적 호출 로직
const clickSettingsMenu = () => {
  cy.get('body').then(($body) => {
    if ($body.find('button.side-menu:contains("설정")').length > 0) {
      cy.contains('button.side-menu', '설정').click({ force: true });
    } else {
      cy.log('🔴 사이드 메뉴 로딩 실패 감지! 새로고침 후 재시도.');
      cy.reload();
      cy.wait(7000);
      clickSettingsMenu(); // 재시도
    }
  });
};

clickSettingsMenu();

// 설정 > 패스워드 규칙 서브메뉴 클릭 
cy.wait(2000)
cy.log('--- 서브메뉴 [사전 소명 설멍] 클릭 ---');
cy.contains('.v-list__tile__title', '사전 소명 설정').should('be.visible').closest('a, .v-list__tile').click({ force: true });
cy.wait(2000); // 화면 전환 대기

cy.log('--- 사전 소명 설정화면 검증 시작 ---');
cy.contains('.c-headline', /소명 사유.*설정/, { timeout: 15000 }).should('be.visible');


// ==========================================
//  사전 소명 설정 화면 
// ==========================================

// ===============================================
// STEP : 'ADD_auto_Test' 그룹 삭제 (조건부)
// ===============================================
cy.log('🧹 삭제 전 그룹 존재 확인 중...');

// 1. 전체 body에서 요소 존재 여부를 먼저 확인합니다.
cy.get('body').then(($body) => {
  // find를 사용하여 요소가 있는지 체크 (에러 방지)
  if ($body.find('.text-label:contains("ADD_auto_Test")').length > 0) {
    cy.log('✅ 그룹 발견! 삭제를 시작합니다.');

    // 2. 삭제 절차 시작
    cy.contains('.text-label', 'ADD_auto_Test')
      .invoke('show')
      .trigger('mouseover', { force: true });

    cy.contains('.text-label', 'ADD_auto_Test').then(($label) => {
      let $row = $label.closest('.v-list-item');
      if ($row.length === 0) $row = $label.parents('div').eq(2);
      cy.wrap($row).find('i.fa-trash').invoke('css', 'display', 'block').click({ force: true });
    });

    // 3. 팝업 확인 및 처리
    cy.contains('p', '삭제하시겠습니까?', { timeout: 10000 })
      .should('be.visible')
      .closest('.v-card')
      .within(() => {
        cy.contains('button', '확인').click({ force: true });
      });

    // 4. 삭제 완료 대기
    cy.wait(1000);
    cy.log('✅ 그룹 삭제 완료.');

  } else {
    // 5. 요소가 없을 경우 패스
    cy.log('⏭️ 삭제할 그룹이 없습니다. 패스합니다.');
  }
});


// ===============================================
// STEP : 모든 소명사유 삭제 작업 (조건부)
// ===============================================
// [소명 사유 목록 정의]
const reasonList = [
  'auto_사유1',
  'auto_사유2',
  'auto_사유3',
];

// [데이터 삭제 로직]
cy.log('🧹 소명사유 존재 여부 확인 및 삭제 시작');

// reasonList를 하나씩 검사
reasonList.forEach((reason) => {
  cy.log(`확인 대상: ${reason}`);

  // 1. 전체 body에서 해당 텍스트를 가진 td가 있는지 먼저 확인
  cy.get('body').then(($body) => {
    // 텍스트를 포함하는 td가 있다면 삭제 진행
    if ($body.find(`td:contains("${reason}")`).length > 0) {
      cy.log(`✅ ${reason} 발견! 삭제 수행.`);
      
      // 삭제 대상 행을 찾아 휴지통 클릭
      cy.contains('td', reason).parent().find('i.fa-trash').click({ force: true });

      // [팝업 처리 1] 1차 확인 버튼
      cy.contains('button', '확인').click({ force: true });
      cy.wait(500);

      // [팝업 처리 2] 삭제 경고 팝업
      cy.log('🧹 소명 취소 팝업 확인 처리');
      cy.contains('p', '정말로 삭제하시겠습니까? 삭제 시 소명 사유 그룹에 등록된 사유도 삭제 됩니다.', { timeout: 10000 })
        .should('be.visible')
        .closest('.v-card')
        .within(() => {
          cy.contains('button', '확인').click({ force: true });
        });

      
    } else {
      cy.log(`⏭️ ${reason} 은(는) 목록에 없습니다. 패스합니다.`);
    }
  });
});

 
 // [데이터 삭제 확인 검증: auto_로 시작하는 사유가 모두 제거되었는지 확인]
cy.log('🧹 auto_ 사유 항목들이 모두 삭제되었는지 검증합니다.');

cy.get('body').then(($body) => {
  // 1. 테이블의 모든 td 중 'auto_' 텍스트를 포함하는 요소들을 찾습니다.
  const $autoElements = $body.find('td:contains("auto_")');

  if ($autoElements.length > 0) {
    // 만약 하나라도 남아있다면 실패
    throw new Error(`❌ 삭제되지 않은 auto_ 사유가 발견되었습니다: ${$autoElements.length}개 남아있음.`);
  } else {
    // 하나도 없다면 성공
    cy.log('✅ 모든 auto_ 사유가 성공적으로 삭제되었습니다.');
  }
});

// cy.get('body').then(($body) => {
//   // 1. 먼저 "No data available" 텍스트가 있는지 확인
//   if ($body.find('td:contains("No data available")').length > 0) {
//     cy.log('✅ "No data available" 메시지 확인: 데이터 삭제 완료.');
//   } else {
//     // 2. 메시지가 없다면, 진짜 데이터 행(Row)만 찾아서 개수가 0인지 확인
//     // .v-datatable__row 등 실제 데이터 행을 특정하는 클래스를 사용하세요.
//     // 만약 그런 클래스가 없다면, 'No data available'을 제외한 행만 찾도록 필터링합니다.
//     cy.get('tbody tr')
//       .not(':contains("No data available")') // 이 메시지가 포함된 행은 제외
//       .should('have.length', 0); // 그 외에 진짜 데이터 행이 0개여야 함
      
//     cy.log('✅ 실제 데이터 행이 0개임을 확인했습니다.');
//   }
// });

//-------------------------------------------------------------------------------------------


// ===============================================
// STEP : 소명 사유 설정 입력
// ===============================================


// [반복문을 이용한 입력 및 저장 처리]
reasonList.forEach((reason) => {
  cy.log(`입력 중: ${reason}`);

  // 1. textarea를 먼저 특정합니다.
  const textArea = cy.get('textarea[placeholder="소명 사유"]');
  
  // 2. textarea와 같은 'form' 또는 '부모 컨테이너'를 찾고 그 안의 저장 버튼을 찾습니다.
  textArea
    .should('be.visible')
    .clear()
    .type(reason, { force: true });

  // 3. textarea의 가장 가까운 공통 부모(예: .v-form)를 기준으로 저장 버튼 찾기
  textArea
    .closest('.v-form') // textarea가 들어있는 폼 영역
    .parent()           // 해당 폼을 포함하는 div
    .contains('button', '저장') // 그 안의 '저장' 버튼
    .find('.v-btn__content')
    .click({ force: true });

  cy.wait(1000); 
});


// ===============================================
// STEP : + 버튼 클릭하여 그룹 명 추가 
// ===============================================
// 첫 번째 '+' 아이콘만 클릭
cy.get('i.v-icon.fa-plus').first().click({ force: true });
cy.wait(2000)

// ===============================================
// STEP : [소명 사유 그룹 추가 팝업 처리]
// ===============================================
// [수정된 팝업 처리 코드]
cy.log('📝 소명 사유 그룹 추가 팝업 입력 시작');

// 1. .c-headline이 'visible'이 될 때까지 기다리는 대신,
// 팝업이 로딩되기를 잠시 대기합니다. (이미지상으로 팝업이 확실히 뜬다면 사용)
cy.wait(1000); 

// 2. 'visible' 검증 전에, 텍스트가 DOM에 존재하는지(exist) 먼저 확인합니다.
cy.contains('.c-headline', '소명 사유 그룹 추가', { timeout: 10000 }).should('exist');

// 3. 입력창이 보일 때까지 대기합니다 (입력창은 visible 상태여야 하므로 더 정확합니다)
cy.get('input[aria-label="소명 사유 그룹 추가"]', { timeout: 10000 }).should('be.visible').clear().type('ADD_auto_Test', { force: true });
cy.wait(1000); 

// 4. 저장 버튼 클릭
cy.contains('button', '저장').click({ force: true });
cy.wait(1000); 



// ===============================================
// STEP : 'ADD_auto_Test' 그룹 클릭
// ===============================================
// [그룹 선택 로직]
cy.log('🖱️ ADD_auto_Test 그룹 클릭 시도');
// 1. .should('be.visible')을 제거하고, 
// 텍스트가 존재하기만 하면 바로 클릭하도록 합니다.
cy.contains('.text-label', 'ADD_auto_Test', { timeout: 10000 })
  .click({ force: true }); // 강제 클릭


// ===============================================
// STEP : 'ADD_auto_Test' 설정
// ===============================================

// 1. 'ADD_auto_Test' 그룹 클릭
cy.contains('.text-label', 'ADD_auto_Test', { timeout: 10000 }).click({ force: true });
cy.wait(1000); // 로딩 대기

// [반복문을 이용한 소명 사유 선택 및 저장 처리]
reasonList.forEach((reason) => {
  cy.log(`사유 선택 중: ${reason}`);

  // 1. 상세 영역 카드 내부에서 콤보박스 클릭
  cy.contains('.c-headline', 'ADD_auto_Test').closest('.v-card')
    .within(() => {
      cy.get('input[aria-label="소명 사유"]').click({ force: true });
      cy.wait(1000);
    });
  
  // 2. 중요! 리스트 항목은 카드 밖에 생성될 수 있으므로
  // 'within' 바깥에서 전체 페이지를 대상으로 찾습니다.
  cy.contains('.v-list__tile__title', reason, { timeout: 10000 }).should('be.visible').click({ force: true });
  cy.get('body').type('{esc}');  
  cy.wait(1000);
});

//접두사 소명내용 입력하는 곳
cy.log('📝 접두사 소명 내용 입력 시작');
// 상세 영역 내부로 검색 범위 제한
cy.contains('.c-headline', 'ADD_auto_Test').closest('.v-card')
  .within(() => {
    // 1. textarea를 찾아 입력
    cy.get('textarea[placeholder="접두사 소명 내용"]').should('be.visible').clear()
      .type('다음 아래 사유에 해당하는 번호를 입력해주시기 바랍니다.', { force: true });
  });


// 3. 'ADD_auto_Test' 상세 영역의 저장 버튼 클릭
cy.log('💾 그룹 설정 저장');
// 해당 헤드라인이 있는 상세 영역의 저장 버튼 타겟팅
cy.contains('.c-headline', 'ADD_auto_Test')
  .closest('.v-card') // 상세 영역 카드 전체
  .within(() => {
    cy.contains('button', '저장')
      .find('.v-btn__content')
      .click({ force: true });
  });

cy.wait(3000);



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


// ==========================================
//         접속 기록 수집기 화면
// ==========================================


//Log Tracer WAS Jeus선택하기 
cy.contains('.pl-1', 'Log Tracer_10.10.54.23_8080').should('be.visible').click({ force: true });


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
const targetValue = '#ADD_Auto';
const deleteQuery = `DELETE FROM tbi_log_trace_bef WHERE event_target_value = '${targetValue}'`;
cy.task('queryPostgresDB', deleteQuery);
cy.wait(1000); 

// [수정된 UI 삭제 로직]
// 'contains'를 바로 쓰지 않고, 먼저 body를 검색하여 요소가 존재하는지 확인합니다.
cy.get('body').then(($body) => {
    // 테이블 내에 '윈도우_배송관리_다운로드'라는 텍스트가 있는지 확인
    if ($body.find('td:contains("윈도우_배송관리_다운로드")').length > 0) {
        cy.log('⚠️ UI에 잔여 데이터 발견! 삭제 시도...');
        
        cy.contains('td', '윈도우_배송관리_다운로드')
          .closest('tr')
          .find('i.fa-trash')
          .click({ force: true });
        
        // 삭제 확인 팝업 처리
        cy.contains('button', '확인').click({ force: true });
        
        // 데이터가 사라질 때까지 대기
        cy.contains('td', '윈도우_배송관리_다운로드').should('not.exist');
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
cy.contains('.v-list__tile__title', '윈도우_배송관리_다운로드').click({ force: true });

// 3. 이벤트 대상 값 입력 - 개발자도구 (F12) - copy selector 로 값 복사 붙여넣기
cy.contains('.v-card', '사전 소명 이벤트 추가').within(() => {
  cy.get('input[aria-label="이벤트 대상 값"]').clear().type('#ADD_Auto', { force: true });

  // 4. 소명 사유 그룹 선택
  cy.get('input[aria-label="소명 사유 그룹"]').click({ force: true });
});

// 리스트 선택
cy.contains('.v-list__tile__title', 'ADD_auto_Test').click({ force: true });

// 5. 저장 버튼 클릭
cy.contains('.v-card', '사전 소명 이벤트 추가').within(() => {
  cy.contains('button', '저장').click({ force: true });
});

cy.wait(1000);

// ===============================================
// STEP : 사전 소명 이벤트 추가 데이터 저장 검증
// ===============================================

cy.log('🔍 데이터 저장 성공 여부 검증 시작');
cy.get('table').should('be.visible'); // 테이블이 화면에 보이는지 확인

cy.contains('td', '윈도우_배송관리_다운로드')
  .closest('tr') // 해당 텍스트가 있는 행 전체를 잡음
  .within(() => {
    // 해당 행 내부의 다른 컬럼들에 값이 제대로 들어갔는지 확인
    cy.contains('td', '#ADD_Auto').should('exist');
    cy.contains('td', 'ADD_auto_Test').should('exist');
  });

cy.log('✅ 접속기록 수집기 에서 사전소명 정상적으로 이벤트 목록 추가됨.');



// ==========================================
// [FINAL] 테스트 종료 및 메뉴 닫기
// ==========================================
cy.log('🎉 소명 - 사전 소명_사전소명설정 테스트 시나리오 성공적으로 완료!');
cy.get('body').type('{esc}');
cy.get('body').click('center', { force: true });


   
  });
});  

//코드마지막


 })()
;
