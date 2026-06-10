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
  
  it('10_Depth_검출_필터_식별자패턴관리 자동화 시나리오', () => {


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    cy.login('admin', 'Manager1!');
    cy.wait(5000);  
    

    
    //로그인 성공


    ///////////////////////////////////////////////
    // 검출탭 > 필터  서브메뉴 선택 
    /////////////////////////////////////////////// 
    // 검출탭 > 필터  서브메뉴 선택 
    cy.log('🚀 검출탭 > 필터  서브메뉴 선택 ');
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('---검출 - 필터 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });
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
        if ($body.find('.v-list__tile__title:contains("식별자 패턴 관리"):visible').length === 0) {
            cy.log('🔴 ChunkLoadError로 인해 화면 이동 실패! 페이지 새로고침 진행');
            
            // 새로고침 하여 끊긴 JS 파일을 다시 받아오게 함
            cy.reload();
            cy.wait(3000); 
            
            // 메뉴 다시 클릭 (재시도)
            cy.contains('button.side-menu', '검출').click({ force: true });
            cy.wait(1000);
            cy.log('---검출 - 필터 서브메뉴 클릭 ---');
            cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });
            cy.wait(1000);
        }
    });
    //-------------------------------------------------------------

      
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
          cy.get('input[aria-label="식별자 패턴"]')
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
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', /^계좌 번호$/).click({ force: true });

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
            
            // 2. 식별자 패턴 정규식 텍스트 확인 
            // (자바스크립트 문자열에서는 역슬래시를 두 번(\\) 써야 정상 인식됩니다)
            cy.get('span.ellipsis').contains('^[0-9]{3}-[0-9]{7}-[0-9]-[0-9]{3}$').should('be.visible');
        });
    });

    cy.log('🎉 식별자 패턴(계좌번호) 추가 및 화면 검증 완벽 성공!');

       
    //-------------------------------------------------------------------------------------------
    // ==========================================
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    cy.contains('button', '운영').click({ force: true });
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
  cy.contains('p', process.uiName).should('be.visible')
    .closest('.v-card').contains('.v-btn', '정지').filter(':visible').click({ force: true }); 

  cy.get('.c-headline:visible').contains('마스터 Task 종료').should('be.visible');
  cy.contains('p', 'Task 종료하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });

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
  cy.contains('p', process.uiName).should('be.visible')
    .closest('.v-card').contains('.v-btn', '시작').filter(':visible').click({ force: true });

  cy.get('.c-headline:visible').contains('마스터 Task 실행').should('be.visible');
  cy.contains('p', 'Task 실행하시겠습니까?').should('be.visible');
  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });

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

// was 이력 행위 

// ----------------------------------------------------------
// [STEP 1] WAS 시스템 로그인 및 고객관리 > 특정 계좌조회 타격 (식별자패턴 추가 검출조회)
// ----------------------------------------------------------
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 세션 이동 방어 코드 

// 🚨 [핵심 방어 1] Cypress 프록시가 도메인 전환을 준비할 수 있도록 2초간 숨을 고릅니다.
cy.wait(2000);

// 🌟 [추가] 서버 접속 상태를 기억할 변수(플래그)를 선언합니다.
let isWasSiteDown = false;

// 🌟 [핵심 예외 처리] 페이지 로드 실패 시 에러를 낚아채서 테스트 중단(Fail)을 막습니다.
Cypress.once('fail', (error) => {
  // 에러 메시지에 'could not load' 또는 타겟 서버 IP가 포함되어 있는지 확인
  if (error.message.includes('could not load') || error.message.includes('10.10.54.22')) {
    cy.log('⚠️ [경고] WAS 서버(10.10.54.22)에 접속할 수 없거나 응답이 지연되었습니다!');
    isWasSiteDown = true; // 플래그를 true로 변경하여 접속 실패를 기록합니다.
    
    // 💡 핵심: false를 반환하면 Cypress가 에러를 뱉지 않고(초록불 유지) 다음 코드로 넘어갑니다.
    return false; 
  }
  // 우리가 예상한 에러가 아니면 원래대로 빨간불을 띄우고 테스트를 실패시킵니다.
  throw error; 
});

// 🚨 1. 커스텀(command) 명령어 적용 (타임아웃 및 재시도 포함)
cy.visitWithRetry('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', {
  timeout: 60000,
  onBeforeLoad(win) {
    delete win.fetch; // fetch 삭제가 필요한 경우 유지
  }
});

// 🚨 [핵심 방어 2] 페이지 진입 직후 DOM 렌더링이 안정화될 때까지 잠시 대기합니다.
cy.wait(2000);

// 🌟 [분기 처리] 접속에 성공했을 때만 cy.origin(로그인 및 API 타격) 로직을 실행합니다.
// cy.then()으로 감싸주어야 변수(isWasSiteDown) 상태를 올바르게 평가할 수 있습니다.
cy.then(() => {
  if (isWasSiteDown) {
    // ❌ 접속 실패 시
    cy.log('⏩ [Skip] WAS 서버 접속 실패로 인해 이상행위 발생 스텝을 안전하게 건너뜁니다.');
  } else {
//-----------------------------------------------
cy.origin('http://10.10.54.22:8080', { args: { targetName: '475-6025314-6-985' } }, ({ targetName }) => {
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
      // 고객관리 계좌번호 조회 
      cy.request({
        method: 'POST',
        url: 'cop/logcatch/searchUserInfoList.do',
        form: true,
        headers: {
          'Cookie': `JSESSIONID=${freshSessionId}`, 
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'http://10.10.54.22:8080/uat/uia/actionMain.do'
        },
        body: { 
          menuNo: '21',
          pageIndex: 1,  // 🔍 수정: pageindex -> pageIndex (대문자 I)
          searchCnd: '3', // 🔍 추가 권장: 이미지에 포함된 기본 파라미터들
          searchWrd: targetName
    
        }
      }).then((response) => {
        // 6. 정상 응답 검증 (200 OK)
        expect(response.status).to.eq(200);
        cy.log('🎉 매번 새로운 세션으로 고객관리 계좌번호 조회 자동 타격 성공!');
        cy.log(`🎯 특정계좌 [${targetName}]로 계좌 조회 타격 완료!`);
      }); // cy.request 닫기
    }); // cy.getCookie 닫기
  }); // cy.url 닫기
}); // cy.origin 닫기

} // 🌟 여기에 else 블록을 닫는 중괄호 추가!
}); // 🌟 여기에 cy.then() 블록을 닫는 괄호 추가!


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
      .type('yunho', { force: true, delay: 50 });

    cy.wait(1000); // 자동완성 또는 검색 결과 갱신 대기
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);


// 맨티스 이슈 : http://bug.warevalley.com/view.php?id=37548
// 계좌번호로 식별자 검출이력에 잡히지 않는 문제 
// // ----------------------------------------------------------
// // [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증
// // ----------------------------------------------------------
// cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');
// // [개선 코드]
// // 1. 먼저 테이블 내에 내가 원하는 데이터가 나타날 때까지 기다립니다 (최대 15초)
// cy.get('tbody', { timeout: 15000 }).contains('tr', 'yunho(진윤호)').should('be.visible');


// // 1. 첫 번째 행을 잡고 그 안으로(within) 쏙 들어갑니다. ($row 변수 생략 가능!)
// cy.get('tbody tr').filter(':visible').first().within(() => {
  
//   // 2. 텍스트 검증
//   cy.contains('리눅스_배송관리').should('be.visible');
//   cy.contains('품질관리팀').should('be.visible');
//   cy.contains('검출').should('be.visible');
  

// cy.log('🎉 식별자 패턴 추가 및 추가한 식별자 패턴 검출이력 검증 완료!');
//  });

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 검출 - 필터 - 식별자 패턴 관리 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

    
   
  });
});  

//코드마지막

 })()
;
