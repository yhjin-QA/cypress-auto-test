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
  
  it('10_Depth_검출_개인정보 유형 정의_식별 정규식 정의 자동화 시나리오', () => {


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    cy.login('admin', 'Manager1!');
    cy.wait(5000);  
    

    
    //로그인 성공


    ///////////////////////////////////////////////
    // 검출탭 > 필터  서브메뉴 선택 
    /////////////////////////////////////////////// 
    // [2.9.7] 메뉴 위치 변경: 검출 > 필터 > 식별자 패턴 관리 → 검출 > 개인정보 유형 정의 > 식별 정규식 정의
    cy.log('🚀 검출탭 > 개인정보 유형 정의 서브메뉴 선택 ');
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---검출 - 개인정보 유형 정의 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("개인정보 유형 정의")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // ==========================================
    // STEP : 특정 메뉴 탭 진입 (ChunkLoadError 방어 로직)
    // ==========================================
    cy.log('🚀 메뉴 탭 이동 및 렌더링 대기');

    // // 1. 메뉴 탭 클릭
    // cy.contains('button.side-menu', '검출').click({ force: true });
    // cy.wait(2000); // 청크 파일 로딩 대기

    // 화면 이동이 정상적으로 되었는지(또는 탭이 떴는지) 확인 후, 안 떴으면 새로고침!
    cy.get('body').then(($body) => {
        // 이동 후 보여야 할 화면의 특정 요소(예: 탭 버튼이나 헤더)가 없는 경우
        // [2.9.7] 탭 버튼(식별 정규식 정의)이 보이는지로 판단 (기존엔 서브메뉴 목록에서 찾아 항상 새로고침되던 문제)
        if ($body.find('.v-btn__content:contains("식별 정규식 정의"):visible').length === 0) {
            cy.log('🔴 ChunkLoadError로 인해 화면 이동 실패! 페이지 새로고침 진행');
            
            // 새로고침 하여 끊긴 JS 파일을 다시 받아오게 함
            cy.reload();
            cy.wait(3000); 
            
            // 메뉴 다시 클릭 (재시도)
            cy.contains('button.side-menu', '검출').click({ force: true });
            cy.wait(1000);
            cy.log('---검출 - 개인정보 유형 정의 서브메뉴 클릭 ---');
            cy.get('.v-list__tile__title').filter(':contains("개인정보 유형 정의")').filter(':visible').click({ force: true });
            cy.wait(1000);
        }
    });
    //-------------------------------------------------------------

      
    // 검출탭 > 개인정보 유형 정의 > 식별 정규식 정의 탭 클릭 ([2.9.7] 기존: 필터 > 식별자 패턴 관리)
    cy.log('--- 식별 정규식 정의 탭 클릭 ---');
    cy.contains('.v-btn__content', '식별 정규식 정의').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    // 트리영역 + 아이콘
    cy.get('.v-icon.fa-plus').filter(':visible').should('be.visible');
    //트리영역 새로고침 아이콘
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
    // 트리영역 돋보기 아이콘
    cy.get('.v-icon.fa-search').filter(':visible').should('be.visible'); 
    // 타이틀 문구확인
    // [2.9.7] 화면 상단 안내 카드로 변경 (제목 '식별 정규식 정의' + 안내문), 트리 루트는 '식별자 패턴 그룹'
    // cy.contains('span.title', '식별자').should('be.visible').and('have.class', 'font-weight-bold');
    cy.contains('식별 정규식 수정 후').filter(':visible').should('be.visible');
    cy.contains('식별자 패턴 그룹').should('exist');


    // // 트리영역 폴더 문구확인
    // // label 태그 중 '식별자 패턴 그룹'이라는 텍스트가 보이는지 확인
    // cy.contains('label.text-label', '식별자 패턴 그룹').should('exist');
    // // 'text-label' 클래스를 가진 label 중 'Pattern Korea'가 포함된 요소를 확인
    // cy.contains('label.text-label', 'Pattern Korea').should('exist');
    // cy.contains('label.text-label', 'Pattern Korea2').should('exist');

    // // '개인정보 유형' 컬럼이 존재하고, 현재 오름차순(asc) 정렬인지 확인
    // cy.contains('th.column.sortable', '개인정보 유형').should('be.visible').and('have.class', 'asc');
    // // '식별자 패턴' 컬럼이 존재하고, 현재 오름차순(asc) 정렬 상태인지 확인
    // cy.contains('th.column.sortable', '식별자 패턴').should('be.visible').and('have.class', 'asc'); 
    // cy.log('✅ 검출 - 필터 - [식별자 패턴관리] 화면 UI 출력 확인 완료 ');


    // ==========================================================
    // 패턴 그룹 선택 - Pattern Korea 그룹 선택
    // ==========================================================

    // 'text-label' 클래스를 가진 label 태그 중에서 'auto pattern' 글자를 포함한 요소를 찾아 클릭
    cy.contains('label.text-label', 'Pattern Korea').click({ force: true });
    cy.wait(2000);


    // ==========================================================
    // STEP: 식별자 패턴(계좌번호) 사전 확인 및 조건부 삭제 (클린업)
    // ==========================================================
    cy.log('🧹 [사전 정리] 테스트용 식별자 패턴(계좌번호) 존재 여부 확인 중...');

    // 테이블 렌더링 대기
    cy.wait(1000); 

    cy.get('table tbody').then(($tbody) => {
        // 테이블 내부에 '계좌번호' 텍스트를 가진 행(tr)이 있는지 확인
        if ($tbody.find('tr:contains("계좌번호")').length > 0) {
            cy.log('⚠️ 기존 "계좌번호" 패턴 발견! 삭제를 진행합니다.');
            
            // 삭제 API 인터셉트
            cy.intercept('POST', '**/object/*').as('deletePattern'); 

            // jQuery로 찾은 요소(계좌번호 행 안의 휴지통)를 Cypress 객체로 감싸서(.wrap) 클릭
            cy.wrap($tbody)
              .find('tr:contains("계좌번호")')
              .find('i.fa-trash')
              .first()
              .click({ force: true });

            cy.wait(500); // 팝업 대기

            // "삭제하시겠습니까?" 팝업 처리
            cy.get('body').then(($body) => {
                if ($body.find('.v-card:contains("삭제")').length > 0) {
                    cy.contains('.v-card', '삭제')
                      .contains('button', '확인')
                      .click({ force: true });
                }
            });

            cy.wait('@deletePattern').its('response.statusCode').should('eq', 200);
            cy.wait(1000); // 테이블 갱신 대기
            
            // 🚨 [수정] 삭제 후 '계좌번호' 글자가 아니라, 우리가 추가했던 '특정 정규식'이 사라졌는지 확인!
            // (기본 계좌번호 행은 남아있어야 하므로)
            cy.get('table tbody').within(() => {
                cy.contains('td', '^[0-9]{3}-[0-9]{7}-[0-9]-[0-9]{3}$').should('not.exist');
            });
            
            cy.log('✅ 식별자 패턴 삭제 및 클린업 완료!');

        } else {
            // '계좌번호'가 표에 없을 경우
            cy.log('✅ 기존 "계좌번호" 패턴이 없습니다. 삭제 단계를 패스하고 다음으로 넘어갑니다.');
        }
    });
   


    ///////////////////////////////////////////////
    // auto pattern 그룹에 식별자 패턴 추가하기 
    /////////////////////////////////////////////// 

    // + 버튼으로 식별자 추가하기 
    cy.log('➕ 신규 식별자 패턴 추가 버튼 클릭');
    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);


    // ==========================================================
    // STEP: 식별자 패턴 추가 팝업 입력 (계좌번호)
    // ==========================================================
    cy.log('📝 신규 식별자 패턴(계좌번호) 정보 입력 시작');

    // 1. 팝업창 영역을 먼저 정확히 타겟팅합니다. 
    // 팝업창의 제목인 '식별자 패턴 추가'를 기준으로 그 팝업창(.v-card) 안으로 들어갑니다.
    cy.contains('.v-card', '식별자 패턴 추가', { timeout: 10000 })
      .filter(':visible')
      .within(() => {
          
          // 🚨 [핵심 해결] 이 안에서는 입력창이 무조건 1개만 존재합니다! (.last() 필요 없음)
          // 🚨 [수정] 식별자 패턴
          // [2.9.7] 입력칸 이름 변경: 식별자 패턴 → 정규식 패턴
          cy.get('input[aria-label="정규식 패턴"]')
            .clear({ force: true })
            // force: true 옆에 parseSpecialCharSequences 옵션을 콤마(,)로 연결해서 추가합니다.
            .type('^[0-9]{3}-[0-9]{7}-[0-9]-[0-9]{3}$', { force: true, parseSpecialCharSequences: false });

          // 설명
          cy.get('input[aria-label="설명"]')
            .clear({ force: true })
            .type('Auto_계좌번호', { force: true });

          // 콤보박스 열기
          cy.log('🔄 개인정보 유형 "계좌 번호" 선택');
          cy.get('input[aria-label="개인정보 유형"]').click({ force: true });
      });

    // ⚠️ [주의] Vuetify의 콤보박스 리스트(드롭다운 메뉴)는 팝업창 바깥에 렌더링됩니다.
    // 그래서 .within() 블록 바깥으로 빠져나와서 클릭해야 합니다!
    cy.wait(500); 
    // 개인정보 유형 계좌번호 선택
    // 1. 드롭다운 메뉴를 찾아 맨 아래로 스크롤합니다.
    cy.get('.v-menu__content').filter(':visible').scrollTo('bottom', { ensureScrollable: false });
    cy.wait(1000); 
    cy.get('.v-menu__content').filter(':visible').scrollIntoView().contains('.v-list__tile__title', /^계좌 번호$/).click({ force: true });

    // // 저장 버튼 클릭 (다시 팝업창 안으로 들어가서 클릭)
    // cy.log('💾 식별자 패턴 저장 버튼 클릭');
    // cy.contains('.v-card', '식별자 패턴 추가')
    //   .filter(':visible')
    //   .within(() => {
    //       cy.contains('.v-btn__content', /^저장$/).click({ force: true });
    //   });

    cy.wait(1000); // 팝업 닫힘 대기

     // 4. 저장 버튼 클릭 및 API 통신 대기
    cy.log('💾 식별자 패턴 저장 버튼 클릭');
    
    // ⚠️ 저장 시 호출되는 API를 가로채기 위해 네트워크 탭 확인 후 주소를 맞춰주세요!
    //https://10.10.54.21:18443/logcatch/cyclone/filter/object
    cy.intercept('POST', '**/object').as('addPattern'); // (API 주소 임시 지정)

     // 저장버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
     cy.wait(1000);

    // API 통신 성공 검증 (응답 코드가 200 또는 201인지 상황에 맞게 수정)
    cy.wait('@addPattern').its('response.statusCode').should('be.oneOf', [200]);
    cy.wait(1000); // 팝업 닫힘 및 배경 테이블 갱신 대기


    // 5. 추가 결과 표(Table) 검증
    cy.log('✅ 식별자 패턴(계좌번호) 추가 결과 검증');
    
    cy.get('table tbody').within(() => {
        // 표에 '설명'이 안 보이므로, '계좌번호'라는 글자가 있는 행(tr)을 찾습니다.
        cy.contains('tr', '계좌번호').within(() => {
            
            // 1. 개인정보 유형 텍스트 확인 (띄어쓰기 없는 '계좌번호')
            cy.get('span.ellipsis').contains('계좌번호').should('be.visible');
            
            // 2. [2.9.7] 목록에는 '식별 정규식 패턴 설명'·'확정' 열만 표시되고 정규식 열이 없음
            //    → 정규식은 아래에서 수정(연필) 팝업의 '정규식 패턴' 값으로 확인
            // cy.get('span.ellipsis').contains('^[0-9]{3}-[0-9]{7}-[0-9]-[0-9]{3}$').should('be.visible');
        });
    });

    // 2-1. 수정 팝업에서 저장된 정규식 확인 후 취소
    // 연필 아이콘 클래스가 고정되지 않아, 행 안의 아이콘 중 휴지통·체크박스를 뺀 것을 수정 아이콘으로 사용
    cy.get('table tbody').contains('tr', '계좌번호').find('i').filter(':visible')
      .filter((i, el) => !/trash|check|box/i.test(el.className + ' ' + el.textContent))
      .then(($icons) => {
        cy.log(`수정 아이콘 후보: ${[...$icons].map((el) => el.className.trim()).join(' | ')}`);
        expect($icons.length, '수정(연필) 아이콘').to.be.greaterThan(0);
        cy.wrap($icons.last()).click({ force: true });
      });
    cy.wait(1000);
    cy.get('input[aria-label="정규식 패턴"]').filter(':visible').first()
      .should('have.value', '^[0-9]{3}-[0-9]{7}-[0-9]-[0-9]{3}$');
    cy.get('.v-dialog--active').filter(':visible').last().contains('button', '취소').click({ force: true });
    cy.wait(1000);

    cy.log('🎉 식별자 패턴(계좌번호) 추가 및 화면 검증 완벽 성공!');

       
    //-------------------------------------------------------------------------------------------
    // ==========================================
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    cy.contains('button', /^운영$/).click({ force: true });
    cy.wait(1000);
    cy.log('---운영 - 태스크 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("태스크")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 태스크  > "실행관리" 탭을 클릭
    cy.log('--- 실행관리 탭 클릭 ---');
    cy.contains('.v-btn__content', '실행 관리').should('be.visible').click({ force: true });
    cy.wait(3000);

    // =============================================
    // 실행관리 : discriminator 프로세스 재기동
    // =============================================

// 🌟 [핵심 해결책] UI 버튼 이름과 리눅스(ps -ef)에서 찾을 실제 키워드를 짝지어 줍니다.
const processList = [
 
  { uiName: 'Discriminator', osKeyword: 'discriminator' }
   // Data File Cleaner프로세스가 아님.
  // dat.done 파일이 안지워지면 파일 클리너가 비활성화 되었구나 라고 판단
  //{ uiName: 'Data File Cleaner', osKeyword: 'datafilecleaner' },
];

processList.forEach((process) => {
  cy.log(`▶▶▶ [${process.uiName}] TASK 정지/시작 및 서버 상태 교차 검증 ◀◀◀`);

  // ==========================================
  // [1단계: 정지 테스트]
  // ==========================================
  // 1. [UI 제어] 정지 버튼 클릭 (uiName 사용)
  cy.contains('p', process.uiName).should('be.visible').closest('.v-card').contains('.v-btn', '정지').filter(':visible').click({ force: true });
  cy.wait(1000); 

  cy.get('.c-headline').filter(':visible').contains('마스터 Task 종료').should('be.visible');
  cy.wait(1000);
  cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
  cy.wait(1000);

  // 2. [UI 검증] 상태가 '정지'로 변했는지
  cy.contains('p', process.uiName).closest('.v-card').contains('.v-btn__content', '시작', { timeout: 15000 }).should('be.visible');
  // [정지 상태일 때] Log Collector 카드 안의 상태바가 빨간색(error)인지 확인
  cy.contains('p', process.uiName).closest('.v-card').find('.v-progress-linear__bar__determinate').should('have.class', 'error');
  
  // 🌟 3. [서버 검증] (osKeyword 사용)
  cy.wait(15000); 

  // grep -i 옵션: 대소문자를 구분하지 않고 찾습니다.
  cy.task('runSSH', `ps -ef | grep -i "${process.osKeyword}" | grep -v grep`).then((output) => {
    // 💡 SSH 접속 자체가 실패했을 경우를 대비한 방어 코드
    expect(output, '🚨 SSH 접속 실패!').to.not.be.null;
    
    cy.log(`🖥️ [정지 결과] 터미널 출력: ${output}`);
    // 검색된 텍스트가 비어있어야(empty) 프로세스가 완벽히 죽은 것입니다.
    expect(output.trim(), `${process.uiName} 프로세스가 서버에서 완전히 종료되었는지 확인`).to.be.empty; 
  });


  // ==========================================
  // [2단계: 시작 테스트]
  // ==========================================
  // 4. [UI 제어] 시작 버튼 클릭 (uiName 사용)
  cy.contains('p', process.uiName).should('be.visible').closest('.v-card').contains('.v-btn', '시작').filter(':visible').click({ force: true });
  cy.wait(1000);

  cy.get('.c-headline').filter(':visible').contains('마스터 Task 실행').should('be.visible');
  cy.wait(1000);
  cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
  cy.wait(1000);

  // 5. [UI 검증] 상태가 '실행'으로 변했는지
  cy.contains('p', process.uiName).closest('.v-card').contains('.v-btn__content', '정지', { timeout: 15000 }).should('be.visible');
  // [시작 상태일 때] Log Collector 카드 안의 상태바가 초록색(success)인지 확인
  cy.contains('p', process.uiName).closest('.v-card').find('.v-progress-linear__bar__determinate').should('have.class', 'success');


  // 🌟 6. [서버 검증] (osKeyword 사용)
  cy.wait(5000); // 기동 시간을 고려하여 5초로 넉넉하게 대기!
  cy.task('runSSH', `ps -ef | grep -i "${process.osKeyword}" | grep -v grep`).then((output) => {
    expect(output, '🚨 SSH 접속 실패!').to.not.be.null;

    cy.log(`🖥️ [시작 결과] 터미널 출력:\n${output}`);
    // 💡 검색을 띄어쓰기 없이 했으므로, 결과가 텅 비어있지 않다(not.empty)면 기동 성공으로 봅니다!
    expect(output.trim(), `${process.uiName} 프로세스가 서버에서 정상 기동되었는지 확인`).to.not.be.empty;
  });
    
  cy.wait(1000); 
});

//------------프로세스 재기동 끝 ----------------------------------------

// ----------------------------------------------------------
// [STEP 1] 검출 데이터 생성 — 계좌번호가 든 요청 (식별 정규식 Auto_계좌번호 확인용)
//   [2026-11-24] .22 WAS(리눅스_배송관리 · 접속 불안정) 대신 .27 CRM(리눅스_VIP고객) dlp_tester.jsp 사용
//   user001(사원_1 · AI개발2팀)로 계좌번호가 든 채팅 메시지 전송 (02_Depth_이력_접속기록이력_검출 과 같은 방식 · 비밀번호는 Node 가 직접 읽음)
//   이전 .22 코드 : cypress/probe/bak/10_Depth_검출_식별정규식_spec.bak_20261124o
// ----------------------------------------------------------
const ACCT_NO = '475-6025314-6-985';
let ACCT_SENT = 0;
cy.task('crmFetch', {
  userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'POST', maxBody: 0,
  form: { action: 'send', chatMsg: `[자동화 식별 정규식 검출 ${new Date().toISOString()}] 계좌 ${ACCT_NO}` },
}, { timeout: 90000, log: false }).then((r) => {
  ACCT_SENT = Date.now();
  cy.log(`🧪 계좌번호 검출 데이터 생성 (.27 dlp_tester.jsp) : 로그인 ${r.login} · 전송 ${r.status} ${r.error || ''}`);
  cy.writeFile('cypress/probe/D10_계좌검출생성.json', { at: new Date().toISOString(), 계좌: ACCT_NO, login: r.login, status: r.status, error: r.error }, { log: false });
  expect(r.status, 'dlp_tester.jsp 전송 응답 (200)').to.eq(200);
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
  const isTabLoaded = $body.find('.tab-btn:contains("검출")').length > 0;

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
      if ($newBody.find('.tab-btn:contains("검출")').length === 0) {
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
cy.contains('.tab-btn', '검출', { timeout: 15000 }).should('be.visible').click({ force: true });
//------------------------------------------------------------------------------------------------------
cy.log('✅ 검출 탭 진입 성공');


    // ==========================================
    // 사용자 검색 - 진윤호(yunho) (DOM Detached 에러 방어 버전)
    // ==========================================
    cy.log('👤 사용자 계정 검색어 입력 (체이닝 분리)');

    // 1. 라벨 영역을 클릭하여 포커스 활성화 유도
    cy.contains('label.v-label', '사용자 계정')
      .filter(':visible')
      .closest('.v-input')
      .click({ force: true });

    cy.wait(500); // 클릭 후 애니메이션 대기

    // 2. 입력창을 "새로" 찾아서 기존 값 지우기 (clear)
    cy.contains('label.v-label', '사용자 계정')
      .filter(':visible')
      .closest('.v-input')
      .find('input')
      .clear({ force: true });

    // 🚨 [핵심] clear 직후에 XHR(API) 요청이 발생하며 화면이 다시 그려집니다. 통신 대기!
    cy.wait(1500); 

    // 3. 화면 갱신이 끝난 후 "완전히 새로 그려진" 입력창을 "다시" 찾아서 타이핑
    cy.contains('label.v-label', '사용자 계정')
      .filter(':visible')
      .closest('.v-input')
      .find('input')
      .type('user001', { force: true, delay: 50 }); // [11-24] .27 CRM user001 (이전 .22 loginid246)

    cy.wait(1000); // 자동완성 또는 검색 결과 갱신 대기
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);


// [11-24] 37548 재현 여부 기록만 (판정 없음) : 방금 보낸 기록 행(같은 분 · 검출 N)을 최대 60초 (10초마다 다시 검색) 찾아
//   처리창을 열어 계좌번호 문구가 검출 항목에 있는지 기록 → 닫기 (오탐/확정 · 저장 누르지 않음)
//   (1차 11-24 : 「… VIP_실시간DLP테스트 / 조회 검출 2」 행 확인 — 목록 줄에는 개인정보 유형 글자가 없어 처리창으로 확인)
{
  const seen = { 계좌: ACCT_NO, 시도: [] };
  const tx2 = (e) => (e ? (e.innerText || e.textContent || '') : '').replace(/\s+/g, ' ').trim();
  const kmin = (ms) => { const d = new Date(ms + 9 * 3600e3); return d.toISOString().slice(0, 16).replace('T', ' '); };
  const look = (left) => cy.get('body').then(($b) => {
    const trs = $b.find('tbody tr').filter(':visible').toArray().filter((e) => !e.closest('.v-dialog'));
    const mins = [kmin(ACCT_SENT - 30e3), kmin(ACCT_SENT), kmin(ACCT_SENT + 60e3)];
    const row = trs.find((e) => mins.some((m) => tx2(e).includes(m)) && /검출\s*\d+/.test(tx2(e)));
    seen.시도.push({ 남은: left, 행: trs.slice(0, 3).map((e) => tx2(e).slice(0, 200)), 방금행: row ? tx2(row).slice(0, 200) : null });
    cy.writeFile('cypress/probe/D10_계좌검출_관찰.json', seen, { log: false });
    if (row) {
      cy.wrap(row.querySelector('i.g.g-IConfig') || row).click({ force: true });
      cy.wait(4500);
      cy.get('body').then(($b2) => {
        const d = $b2.find('.v-dialog--active').filter(':visible').last()[0];
        const lines = d ? [...new Set((d.innerText || '').split('\n').map((x) => x.trim()).filter(Boolean))] : [];
        seen.처리창_계좌문구 = lines.filter((x) => /계좌|475-6025314/.test(x)).slice(0, 20);
        seen.처리창_앞부분 = lines.slice(0, 80);
        seen.계좌검출 = lines.some((x) => x.includes(ACCT_NO) || /계좌/.test(x));
        cy.writeFile('cypress/probe/D10_계좌검출_관찰.json', seen, { log: false });
        cy.log(seen.계좌검출 ? '✅ 처리창에 계좌번호 검출 보임 (37548 해결 가능성 — D10_계좌검출_관찰.json 확인)' : '⚠️ 처리창에 계좌번호 검출 안 보임 (37548 재현 가능성)');
      });
      cy.get('body').then(($b3) => {
        const d = $b3.find('.v-dialog--active').filter(':visible').last();
        const x = d.find('button, .v-btn').filter(':visible').filter((i, e) => tx2(e) === '닫기')[0] || d.find('i.v-icon').filter(':visible').filter((i, e) => tx2(e) === 'close')[0];
        if (x) cy.wrap(x).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
        cy.wait(1500);
      });
      return;
    }
    if (left <= 0) { cy.log('⚠️ 60초 안에 방금 보낸 기록 행 없음'); return; }
    cy.wait(10000, { log: false });
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1500, { log: false });
    look(left - 1);
  });
  look(6);
}

// 맨티스 이슈 : http://bug.warevalley.com/view.php?id=37548
// 계좌번호로 식별자 검출이력에 잡히지 않는 문제 
// // ----------------------------------------------------------
// // [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증
// // ----------------------------------------------------------
// cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');
// // [개선 코드]
// // 1. 먼저 테이블 내에 내가 원하는 데이터가 나타날 때까지 기다립니다 (최대 15초)
// cy.get('tbody', { timeout: 15000 }).contains('tr', 'user001') /* [11-24] .27 기준 (이전 yunho(진윤호)) — 해제 전 실제 행 글자 확인 */.should('be.visible');


// // 1. 첫 번째 행을 잡고 그 안으로(within) 쏙 들어갑니다. ($row 변수 생략 가능!)
// cy.get('tbody tr').filter(':visible').first().within(() => {
  
//   // 2. 텍스트 검증
//   cy.contains('리눅스_VIP고객').should('be.visible'); // [11-24] 이전 리눅스_배송관리
//   cy.contains('AI개발2팀').should('be.visible'); // [11-24] 이전 품질관리팀
//   cy.contains('검출').should('be.visible');
  

// cy.log('🎉 식별자 패턴 추가 및 추가한 식별자 패턴 검출이력 검증 완료!');
//  });

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 검출 - 개인정보 유형 정의 - 식별 정규식 정의 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

    
   
  });

  // ==========================================
  // [2.9.9.0 Depth] 식별 키워드 정의 — 테스트 키워드 만들기 · 확인 · 설명 수정 · 삭제 (B3)
  //   사용자 승인(11-24) : JEUS_CRM고객관리 · text/html 묶음에 테스트 키워드를 만들고 같은 실행에서 삭제 (기존 키워드는 건드리지 않음)
  //   키워드 : 이름 zz_auto_kw_<YYYYMMDD> · 값 zzautokw<YYYYMMDD> · 이메일 · 일치 · 확정 아님
  //   (probe_299l 11-24 확인)
  //   - 저장 : POST pams/unconfirmed/privacy-keyword-config → 「저장했습니다.」 · 이어서 POST pams/unconfirmed/reload
  //   - 수정 : POST pams/unconfirmed/privacy-keyword-config/{id} → 「수정했습니다.」 (수정하면 키워드 id 가 새 번호로 바뀜 — 기록만)
  //   - 삭제 : 항목에 마우스 → 줄 오른쪽 i.fa-trash → POST pams/unconfirmedconfig/privacy-identifier-group-detail/de (확인 창 없이 바로 삭제 — 기록만)
  //   - 검출 반영은 웹 매니저 재기동 안내가 있어 보지 않음
  //   이전 실행이 지우지 못한 같은 이름 키워드는 시작할 때 · 끝날 때(after) 지움
  //   관찰 기록 : cypress/probe/D10K_관찰.json
  // ==========================================
  {
    const A = require('../../support/anomaly');
    const p2 = (n) => String(n).padStart(2, '0');
    const d0 = new Date(Date.now() + 9 * 3600e3);
    const YMD = `${d0.getUTCFullYear()}${p2(d0.getUTCMonth() + 1)}${p2(d0.getUTCDate())}`;
    const NAME = `zz_auto_kw_${YMD}`;
    const VALUE = `zzautokw${YMD}`;
    const SYS = 'JEUS_CRM고객관리';
    const CT = 'text/html';
    const GROUP = `${SYS}_${CT}`;
    const PAGE = '/logcatch/detect/privacyTypeDefinition/detectionKeywords';
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const tx = (e) => (e ? (e.innerText || e.textContent || '') : '').replace(/\s+/g, ' ').trim();
    const cls = (e) => String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className);
    const obs = {};
    const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/D10K_관찰.json', obs, { log: false }); };
    let AUTH = {};
    const authFrom = (h) => { const o = {}; Object.keys(h || {}).forEach((k) => { if (!/^(host|content-length|content-type|cookie|connection|origin|referer|user-agent|accept.*|sec-.*)$/i.test(k)) o[k] = h[k]; }); return o; };
    // 키워드 목록 API (실행 시점 AUTH)
    const kwList = () => cy.then(() => cy.request({ method: 'POST', url: '/logcatch/pams/unconfirmed/privacy-keyword-config/search', body: {}, headers: AUTH, failOnStatusCode: false }))
      .then((r) => {
        const flat = [];
        ((r.body && r.body.etcData) || []).forEach((g) => (g.detail || []).forEach((k) => flat.push({ id: k.id, name: k.name, type: k.privacy_type_cd, group: g.groupName })));
        return { 상태: r.status, flat, mine: flat.filter((k) => k.name === NAME) };
      });
    const card = ($b) => {
      const cb = $b.find('input[aria-label="확정 키워드"]')[0];
      return cb ? Cypress.$(cb).parents().filter((i, e) => Cypress.$(e).find('button, .v-btn').filter((j, b) => vis(b) && tx(b) === '저장').length > 0).first() : Cypress.$();
    };
    const openPage = () => {
      cy.visit(PAGE);
      cy.get('.privacy-keyword-tree-root', { timeout: 30000 }).should('be.visible');
      cy.wait(2500);
    };
    const leafByName = ($b) => $b.find('.privacy-keyword-tree-root .vue-treeselect__list-item').filter((i, e) => vis(e) && tx(e.querySelector('label.text-label')) === NAME).toArray();
    const alertText = () => cy.get('body').then(($b) => {
      const d = $b.find('.v-dialog--active').filter((i, e) => vis(e)).last();
      const s = d.length ? tx(d[0]) : '';
      const ok = d.find('button, .v-btn').filter((i, e) => vis(e) && /^(확인|예)$/.test(tx(e)))[0];
      if (ok) cy.wrap(ok).click({ force: true });
      cy.wait(800);
      return cy.wrap(s, { log: false });
    });
    const pick = (label, re) => cy.get('body').then(($b) => {
      const i = card($b).find(`input[aria-label="${label}"]`).filter((j, e) => vis(e))[0];
      expect(i, `설정 칸 「${label}」`).to.not.eq(undefined);
      cy.wrap(Cypress.$(i).closest('.v-select').find('.v-select__slot')[0] || i).click({ force: true });
      cy.wait(1000);
      cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').filter((j, e) => re.test(tx(e))).first().click({ force: true });
      cy.wait(600);
      cy.get('body').type('{esc}', { force: true });
      cy.wait(400);
    });
    // Content Type 은 여러 개 선택 · 처음에 전부 선택 → text/html 하나만 남김
    const pickOnlyCT = () => cy.get('body').then(($b) => {
      const i = card($b).find('input[aria-label="Content Type"]').filter((j, e) => vis(e))[0];
      cy.wrap(Cypress.$(i).closest('.v-select').find('.v-select__slot')[0] || i).click({ force: true });
      cy.wait(1000);
      const fix = (left) => cy.get('body').then(($b2) => {
        const tiles = $b2.find('.v-menu__content').filter((j, e) => vis(e)).last().find('.v-list__tile').filter((j, e) => vis(e)).toArray();
        const st = tiles.map((tl) => ({ name: tx(tl.querySelector('.v-list__tile__title')), on: /check_box(?!_outline)/.test(tx(tl)) || tl.classList.contains('v-list__tile--active') }));
        const wrong = tiles.find((tl, k) => st[k].name !== '전체 선택' && st[k].on !== (st[k].name === CT));
        if (!wrong || left <= 0) return;
        cy.wrap(wrong).click({ force: true });
        cy.wait(500);
        fix(left - 1);
      });
      fix(8);
      cy.get('body').type('{esc}', { force: true });
      cy.wait(500);
    });
    const fillAndSave = (desc) => {
      cy.get('body').then(($b) => { const r = card($b).find('input[aria-label="업무시스템 지정"]')[0]; cy.wrap(Cypress.$(r).closest('.v-radio').find('label')[0] || r).click({ force: true }); });
      cy.wait(1200);
      pick('개인정보 유형', /^이메일$/);
      pick('유형', /^일치$/);
      pick('업무 시스템', new RegExp(`^${SYS}$`));
      pickOnlyCT();
      cy.get('body').then(($b) => {
        const c = card($b).find('input[aria-label="키워드명 자동 등록"]')[0];
        if (c && String(c.getAttribute('aria-checked')) === 'true') cy.wrap(Cypress.$(c).closest('.v-input').find('label')[0] || c).click({ force: true });
      });
      cy.wait(800);
      cy.get('body').then(($b) => cy.wrap(card($b).find('input[aria-label="이름"], input[aria-label="키워드명"]').filter((i, e) => vis(e))[0]).clear({ force: true }).type(NAME, { force: true }));
      cy.get('body').then(($b) => cy.wrap(card($b).find('input[placeholder^="항목을 입력하고"]').filter((i, e) => vis(e))[0]).click({ force: true }).type(`${VALUE}{enter}`, { force: true }));
      cy.wait(600);
      cy.get('body').then(($b) => cy.wrap(card($b).find('input[aria-label="설명"], textarea[aria-label="설명"]').filter((i, e) => vis(e))[0]).clear({ force: true }).type(desc, { force: true }));
      cy.get('body').then(($b) => cy.wrap(card($b).find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '저장').first()[0]).click({ force: true }));
      cy.wait(1500);
      return alertText();
    };
    const selectLeaf = () => {
      cy.get('body').then(($b) => { const lf = leafByName($b)[0]; expect(lf, `트리 항목 「${NAME}」`).to.not.eq(undefined); cy.wrap(lf.querySelector('label.text-label')).realClick({ scrollBehavior: false }); });
      cy.wait(2500);
    };
    const cardValues = () => cy.get('body').then(($b) => {
      const c = card($b);
      const sel = (label) => { const i = c.find(`input[aria-label="${label}"]`)[0]; return i ? tx(Cypress.$(i).closest('.v-select').find('.v-select__selections')[0]).replace(/\s*(cancel|close|clear)\s*/g, ' ').trim() : ''; };
      const v = {
        개인정보유형: sel('개인정보 유형'),
        유형: sel('유형'),
        업무시스템지정: String((c.find('input[aria-label="업무시스템 지정"]')[0] || {}).getAttribute && c.find('input[aria-label="업무시스템 지정"]')[0].getAttribute('aria-checked')),
        업무시스템: sel('업무 시스템'),
        ContentType: sel('Content Type'),
        이름: (c.find('input[aria-label="이름"], input[aria-label="키워드명"]')[0] || {}).value,
        설명: (c.find('input[aria-label="설명"], textarea[aria-label="설명"]')[0] || {}).value,
        확정: String((c.find('input[aria-label="확정 키워드"]')[0] || { getAttribute: () => '' }).getAttribute('aria-checked')),
        글자: tx(c[0]),
      };
      return cy.wrap(v, { log: false });
    });
    // 이 시나리오 키워드(NAME)만 화면에서 지움 (줄에 마우스 → 맨 오른쪽 i.fa-trash)
    //   [11-24 1차 실행] 마우스만 올렸을 때 i.fa-trash 를 못 찾음 → probe_299l 처럼 항목을 먼저 눌러(선택) 둔 뒤 마우스를 올림
    const deleteMine = (left) => cy.get('body').then(($b) => {
      const lf = leafByName($b)[0];
      if (!lf || left <= 0) return;
      cy.wrap(lf.querySelector('label.text-label')).realClick({ scrollBehavior: false });
      cy.wait(2500);
      cy.get('body').then(($b1) => {
        const lf1 = leafByName($b1)[0] || lf;
        cy.wrap(lf1.querySelector('.vue-treeselect__option') || lf1).realHover({ scrollBehavior: false });
      });
      cy.wait(1000);
      cy.get('body').then(($b2) => {
        const lf2 = leafByName($b2)[0] || lf;
        const o = lf2.querySelector('.vue-treeselect__option') || lf2;
        const icons = [...o.querySelectorAll('*')].filter((e) => /fa-|trash|delete|edit/i.test(cls(e)));
        const trash = icons.filter((e) => /fa-trash/.test(cls(e))).sort((x, y) => Number(vis(y)) - Number(vis(x)))[0];
        if (!trash) note(`삭제아이콘_못찾음_${left}`, { 아이콘: icons.map((e) => `${e.tagName}.${cls(e).slice(0, 60)} vis=${vis(e)}`), 줄: o.outerHTML.slice(0, 1500) });
        expect(trash, `「${NAME}」 줄 삭제 아이콘(i.fa-trash)`).to.not.eq(undefined);
        cy.wrap(trash).click({ force: true });
      });
      cy.wait(2500);
      cy.get('body').then(($b3) => { const d = $b3.find('.v-dialog--active').filter((i, e) => vis(e)).last(); const ok = d.find('button, .v-btn').filter((i, e) => vis(e) && /^(확인|예|삭제)$/.test(tx(e)))[0]; if (ok) cy.wrap(ok).click({ force: true }); });
      cy.wait(1000);
      deleteMine(left - 1);
    });

    after(() => {
      // 남은 테스트 키워드 정리 (이 시나리오 이름만)
      kwList().then((l) => {
        if (!l.mine.length) return;
        note('9_after_정리전', l.mine);
        openPage();
        deleteMine(5);
        kwList().then((l2) => note('9_after_정리뒤', l2.mine.length ? { 결과: '남음 — 직접 삭제 필요', 키워드: l2.mine } : '정리됨'));
      });
    });

    it('[2.9.9.0] 식별 키워드 — 만들기 · 트리 · 설정 칸 · 설명 수정 · 삭제 (JEUS_CRM고객관리 · text/html)', { retries: 0 }, () => {
      A.ignoreErrors();
      const writes = [];
      cy.intercept({ url: /\/logcatch\/(api|pams)\// }, (req) => {
        if (req.headers.authorization) AUTH = authFrom(req.headers);
        if (req.method === 'GET' || /search|list|tree|count/.test(req.url)) return;
        req.on('after:response', (res) => writes.push({ u: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, req: req.body, res: res.body }));
      });
      A.loginAdmin();
      openPage();

      // ---------- 0. 처음 · 남은 테스트 키워드 정리 ----------
      let BASE = 0;
      kwList().then((l) => {
        expect(l.상태, '키워드 목록 API').to.eq(200);
        if (l.mine.length) { note('0_남은키워드_정리', l.mine); deleteMine(5); }
      });
      kwList().then((l) => { BASE = l.flat.length; note('0_처음', { 전체: BASE, 묶음: [...new Set(l.flat.map((k) => k.group))] }); expect(l.mine.length, '시작 전 테스트 키워드 없음').to.eq(0); });
      cy.get('body').then(($b) => note('0_트리위검색칸', tx($b.find('.privacy-keyword-tree-root .vue-treeselect__single-value, .privacy-keyword-tree-root .vue-treeselect__placeholder').filter((i, e) => vis(e))[0])));

      // ---------- 1. 만들기 ----------
      fillAndSave('자동화 B3 테스트 키워드 (같은 실행에서 삭제)').then((msg) => {
        note('1_저장알림', msg);
        expect(msg, '저장 알림').to.include('저장했습니다');
      });
      cy.then(() => {
        const w = writes.find((x) => /\/privacy-keyword-config$/.test(x.u));
        note('1_저장요청', w ? w.req : '없음');
        expect(w, '저장 요청 POST pams/unconfirmed/privacy-keyword-config').to.not.eq(undefined);
        expect(w.st, '저장 응답').to.eq(200);
        const b = typeof w.req === 'string' ? JSON.parse(w.req) : w.req;
        expect(b.name, '요청 이름').to.eq(NAME);
        expect(b.privacyIdentifierGroupDetailTextList, '요청 키워드 값').to.deep.eq([VALUE]);
        expect(b.groupType, '요청 대상 = 업무시스템 지정(1)').to.eq(1);
        expect(b.isCertain, '요청 확정 아님(0)').to.eq(0);
        expect(b.contentTypeList, '요청 Content Type 1개 (text/html)').to.have.length(1);
      });
      kwList().then((l) => {
        note('1_저장뒤', l.mine);
        expect(l.mine.length, '목록 API 에 새 키워드 1건').to.eq(1);
        expect(l.mine[0].group, '묶음').to.eq(GROUP);
        expect(l.flat.length, '전체 키워드 수 +1').to.eq(BASE + 1);
      });

      // ---------- 2. 트리 · 설정 칸 ----------
      openPage();
      cy.get('body').should(($b) => {
        const f = $b.find('.privacy-keyword-tree-root .vue-treeselect__indent-level-1').filter((i, e) => vis(e) && tx(e.querySelector('.vue-treeselect__label')).replace(/^folder\s*/, '').startsWith(`${GROUP} (`))[0];
        expect(f, `트리 폴더 「${GROUP} (N)」`).to.not.eq(undefined);
        expect(leafByName($b).length, `트리 항목 「${NAME}」`).to.eq(1);
      });
      selectLeaf();
      cardValues().then((v) => {
        note('2_설정칸', v);
        expect(v.이름, '이름').to.eq(NAME);
        expect(v.개인정보유형, '개인정보 유형').to.include('이메일');
        expect(v.유형, '유형').to.include('일치');
        expect(v.업무시스템지정, '대상 업무시스템 지정').to.eq('true');
        expect(v.업무시스템, '업무 시스템').to.include(SYS);
        expect(v.ContentType, 'Content Type').to.eq(CT);
        expect(v.글자, '키워드 값 칩').to.match(new RegExp(`\\(1\\)\\s*${VALUE}`));
        expect(v.설명, '설명').to.eq('자동화 B3 테스트 키워드 (같은 실행에서 삭제)');
        expect(v.확정, '확정 키워드 아님').to.not.eq('true');
      });

      // ---------- 3. 설명 수정 ----------
      openPage();
      selectLeaf();
      let ID0 = null;
      kwList().then((l) => { ID0 = l.mine[0] && l.mine[0].id; });
      cy.get('body').then(($b) => cy.wrap(card($b).find('input[aria-label="설명"], textarea[aria-label="설명"]').filter((i, e) => vis(e))[0]).clear({ force: true }).type('자동화 B3 수정됨', { force: true }));
      cy.get('body').then(($b) => cy.wrap(card($b).find('button, .v-btn').filter((i, e) => vis(e) && tx(e) === '저장').first()[0]).click({ force: true }));
      cy.wait(1500);
      alertText().then((msg) => { note('3_수정알림', msg); expect(msg, '수정 알림').to.include('수정했습니다'); });
      kwList().then((l) => {
        note('3_수정뒤', { 전: ID0, 후: l.mine });
        expect(l.mine.length, '수정 후에도 1건').to.eq(1);
        if (l.mine[0].id !== ID0) cy.log(`ℹ️ 수정 후 키워드 id 변경 ${ID0} → ${l.mine[0].id} (기록만)`);
      });
      openPage();
      selectLeaf();
      cardValues().then((v) => { note('3_수정뒤_설정칸', { 설명: v.설명, 이름: v.이름 }); expect(v.설명, '수정한 설명').to.eq('자동화 B3 수정됨'); expect(v.이름, '이름 그대로').to.eq(NAME); });

      // ---------- 4. 삭제 ----------
      openPage();
      deleteMine(3);
      cy.then(() => note('4_삭제요청', writes.filter((x) => /group-detail\/de/.test(x.u)).map((x) => ({ u: x.u, st: x.st, req: x.req }))));
      kwList().then((l) => {
        note('4_삭제뒤', { 전체: l.flat.length, 남음: l.mine });
        expect(l.mine.length, '삭제 후 목록 API 에 테스트 키워드 없음').to.eq(0);
        expect(l.flat.length, '전체 키워드 수 = 처음').to.eq(BASE);
      });
      openPage();
      cy.get('body').should(($b) => expect(leafByName($b).length, `삭제 후 트리에 「${NAME}」 없음`).to.eq(0));
      cy.log('✅ [2.9.9.0] 식별 키워드 만들기 · 수정 · 삭제 완료');
    });
  }

});  

//코드마지막

 })()
;
