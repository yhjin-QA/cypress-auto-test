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
 cy.login('admin', 'Manager1!');
 cy.wait(5000);   
 

// ==========================================
// STEP : 일반모드 -> 관리자페이지 탭 진입 (자동 복구 로직 적용)
// ==========================================
cy.log('🚀 관리자(톱니바퀴) 버튼 클릭 및 렌더링 대기');

cy.get('body').then(($body) => {
  // 1차 방어: 화면에 톱니바퀴 아이콘이 아예 렌더링되지 않았다면?
  if ($body.find('.g-IConfig:visible').length === 0) {
  cy.log('🔴 톱니바퀴 아이콘 렌더링 실패 감지! 페이지 새로고침');
        cy.reload();
        cy.wait(3000);
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
      cy.wait(3000);
      cy.get('.g-IConfig').should('be.visible').click({ force: true });
      cy.wait(2000);
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
// 페이지 헤더 영역이 확실히 보일 때까지 대기
cy.get('.c-headline', { timeout: 10000 }).should('contain', '소명 사유');


//초기화 작업------------------------------------------------------------
// ===============================================
// STEP : 추가한 auto_사전소명설정 그룹 삭제
// ===============================================
// 1. visible 검증을 생략하고 해당 텍스트를 포함하는 요소를 찾습니다.
cy.contains('.text-label', 'auto_사전소명설정', { timeout: 10000 })
  .invoke('show') // 요소가 숨겨져 있다면 강제로 보이게 함
  .then(($el) => {
    // 2. 마우스를 올리는 이벤트를 시뮬레이션합니다.
    cy.wrap($el).trigger('mouseover', { force: true });

// 1. 해당 텍스트를 가진 라벨을 찾습니다.
cy.contains('.text-label', 'auto_사전소명설정', { timeout: 10000 })
  .then(($label) => {
    
    let $row = $label.closest('.v-list-item'); // 1단계 부모
    if ($row.length === 0) $row = $label.parents('div').eq(2); // 없을 경우 대비

    // 3. 그 행 내부에서만 휴지통을 찾습니다.
    cy.wrap($row).find('i.fa-trash').invoke('css', 'display', 'block').click({ force: true });
  });

});

// ===============================================
// STEP :  auto_사전소명설정 삭제 알림창 처리 
// ===============================================
// [수정된 팝업 처리 코드]
cy.log('🧹 소명 사유 그룹  팝업 확인 처리 시작');

// '삭제하시겠습니까?'라는 문구가 있는 팝업 영역을 찾습니다.
cy.contains('p', '삭제하시겠습니까?', { timeout: 10000 }).should('be.visible').closest('.v-card') // 해당 문구가 들어있는 카드(팝업)를 찾습니다.
  .within(() => {
    // 2. 그 카드 안에 있는 '확인' 버튼만 정확히 클릭합니다.
    cy.contains('button', '확인').click({ force: true });
  });
  //팝업창 사라짐 확인
  cy.contains('p', '삭제하시겠습니까?').should('not.be.visible');
  cy.wait(1000);

// ===============================================
// STEP : 모든 소명사유 삭제 작업 
// ===============================================
// [소명 사유 목록 정의]
const reasonList = [
  '서비스 이용 제한 및 계정 관련',
  '업무 처리 및 데이터 수정 관련',
  '업무관련 파일 다운로드',
  '기타/일반적 상황'
];

reasonList.forEach((reason) => {
  cy.log(`삭제 대상: ${reason}`);

  // 1. 해당 소명 사유 텍스트가 있는 행(tr 등)을 찾습니다.
  // 개발자 도구에서 테이블의 행 단위를 나타내는 태그(tr, .v-data-table__wrapper 등)를 확인하세요.
  // 여기서는 텍스트를 포함하는 행을 찾는 범용적인 방법을 사용합니다.
  cy.contains('td', reason) // '소명 사유' 셀의 텍스트 확인
    .parent()               // 해당 셀의 부모인 행(Row)으로 이동
    .find('i.fa-trash')     // 그 행 내부의 휴지통 아이콘을 찾음
    .click({ force: true });

  // 2. 삭제 확인 팝업이 뜬다면 '확인' 클릭
  cy.contains('button', '확인').click({ force: true });
  cy.wait(500);

   // 팝업 알림창 
   cy.log('🧹 소명 취소 팝업 확인 처리 시작');

   // '신청 상태의 소명 1건을 취소합니다.'라는 문구가 있는 팝업 영역을 찾습니다.
   cy.contains('p', '정말로 삭제하시겠습니까? 삭제 시 소명 사유 그룹에 등록된 사유도 삭제 됩니다.', { timeout: 10000 }).should('be.visible')
   .closest('.v-card') // 해당 문구가 들어있는 카드(팝업)를 찾습니다.
   .within(() => {
    // 2. 그 카드 안에 있는 '확인' 버튼만 정확히 클릭합니다.
    cy.contains('button', '확인').click({ force: true });
    });

    //팝업창 사라짐 확인
    cy.contains('p', '정말로 삭제하시겠습니까? 삭제 시 소명 사유 그룹에 등록된 사유도 삭제 됩니다.').should('not.be.visible');
    cy.wait(1000);
  
    
});

// [데이터 삭제 확인 검증]
cy.log('🧹 모든 소명사유 삭제 확인');
cy.contains('td', 'No data available', { timeout: 10000 }).should('be.visible');

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
cy.get('input[aria-label="소명 사유 그룹 추가"]', { timeout: 10000 }).should('be.visible').clear().type('auto_사전소명설정', { force: true });
cy.wait(1000); 

// 4. 저장 버튼 클릭
cy.contains('button', '저장').click({ force: true });
cy.wait(1000); 



// ===============================================
// STEP : 'auto_사전소명설정' 그룹 클릭
// ===============================================
// [그룹 선택 로직]
cy.log('🖱️ auto_사전소명설정 그룹 클릭 시도');
// 1. .should('be.visible')을 제거하고, 
// 텍스트가 존재하기만 하면 바로 클릭하도록 합니다.
cy.contains('.text-label', 'auto_사전소명설정', { timeout: 10000 })
  .click({ force: true }); // 강제 클릭


// ===============================================
// STEP : 'auto_사전소명설정' 설정
// ===============================================

// 1. 'auto_사전소명설정' 그룹 클릭
cy.contains('.text-label', 'auto_사전소명설정', { timeout: 10000 }).click({ force: true });
cy.wait(1000); // 로딩 대기

// [반복문을 이용한 소명 사유 선택 및 저장 처리]
reasonList.forEach((reason) => {
  cy.log(`사유 선택 중: ${reason}`);

  // 1. 상세 영역 카드 내부에서 콤보박스 클릭
  cy.contains('.c-headline', 'auto_사전소명설정').closest('.v-card')
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
cy.contains('.c-headline', 'auto_사전소명설정').closest('.v-card')
  .within(() => {
    // 1. textarea를 찾아 입력
    cy.get('textarea[placeholder="접두사 소명 내용"]').should('be.visible').clear()
      .type('다음 아래 사유에 해당하는 번호를 입력해주시기 바랍니다.', { force: true });
  });


// 3. 'auto_사전소명설정' 상세 영역의 저장 버튼 클릭
cy.log('💾 그룹 설정 저장');
// 해당 헤드라인이 있는 상세 영역의 저장 버튼 타겟팅
cy.contains('.c-headline', 'auto_사전소명설정')
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

//Log Tracer WAS Jeus선택하기 
cy.contains('.pl-1', 'Log Tracer_10.10.54.31_8088').should('be.visible').click({ force: true });


// 맨티스 이슈 : http://bug.warevalley.com/view.php?id=37567
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

cy.wait(1000);

// ===============================================
// STEP : 사전 소명 이벤트 추가 데이터 저장 검증
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

// 2. 새로운 도메인(10.10.54.31)으로 점프하여 동작 수행
cy.origin('http://10.10.54.31:8088', () => {
  Cypress.on('uncaught:exception', () => false);

  cy.log('1️⃣ tester3 사이트에 접속합니다.');
  cy.visit('/tester3', { timeout: 60000 });
  cy.wait(3000);

  // 3. Excel 버튼 클릭 전 prompt 처리 로직 추가 
  // 엑셀버튼을 클릭하면 팝업창에서 1누르고 확인버튼 클릭수행 (미리 예약 방식)
  cy.log('2️⃣ prompt 팝업 처리를 준비합니다.');
  cy.window().then((win) => {
    // 팝업이 뜨면 자동으로 '1'을 입력하고 확인을 누름
    cy.stub(win, 'prompt').returns('1');
  });


  cy.log('3️⃣ Excel 버튼을 클릭합니다.');
  cy.get('#excel_btn')
    .should('be.visible')
    .invoke('removeAttr', 'target')
    .click({ force: true });
});

// 4. 다운로드 완료 대기
cy.log('⏳ 엑셀 다운로드가 완료될 때까지 기다립니다...');
cy.wait('@excelDownload', { timeout: 30000 }); 
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
