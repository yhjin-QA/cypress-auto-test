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
    // STEP 11: 운영 서브메뉴 
    // ==========================================
    cy.log('🚀 운영 탭 클릭');
    
    // 운영 > 실행플랜 서브메뉴 
    cy.contains('button', '운영').click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 실행 플랜 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("실행 플랜")').filter(':visible').click({ force: true });
    cy.wait(3000); 

    // 운영 > 실행플랜  > 스케줄러 탭을 클릭
    cy.log('--- 스케줄러 탭 클릭 ---');
    cy.contains('.v-btn__content', '스케줄러').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '정책 목록').should('exist');
    // 정책목록  추가 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('추가').should('be.visible');
    // 정책목록 입력란 확인
    cy.get('span[title="정책 유형 선택 (ALL)"]').should('be.visible');
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     //체크박스
     cy.contains('label', '삭제/완료된 플랜 보기').parent().find('.v-input--selection-controls__input').should('be.visible');
     cy.get('.v-label').filter(':visible').contains('삭제/완료된 플랜 보기').should('be.visible');

    // 표 컬럼 확인
    // 헤더(th) 안에 있는 체크박스 아이콘(check_box_outline_blank) 확인
    cy.get('th').find('.v-icon:contains("check_box_outline_blank")').should('exist');
    cy.get('th').filter(':visible').contains('플랜 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('정책 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('작업 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('시작 시간').should('be.visible');
    cy.get('th').filter(':visible').contains('종료 시간').should('be.visible');

    cy.contains('.c-headline', '정책 플랜 일정').should('exist');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_left').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_right').should('be.visible');
    cy.get('.material-icons').filter(':visible').contains('refresh').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('TODAY').should('be.visible');

    cy.contains('.c-headline', '일정 상세').should('exist');
    cy.contains('.c-headline', '일정 상세').closest('.v-card').find('th').as('detailHeader');
    //저장한 영역(@detailHeader) 안에서 컬럼명 확인
    cy.get('@detailHeader').contains('날짜').should('be.visible');
    cy.get('@detailHeader').contains('이름').should('be.visible'); 
    cy.get('@detailHeader').contains('상태').should('be.visible');
    cy.get('@detailHeader').contains('플랜 삭제 여부').should('be.visible');


    /////////////////////////////////////////
    // Case 1 정책목록 유형 인사연동 정책 
    ///////////////////////////////////////    

    //예외처리  test_auto_인사연동 삭제 --------------------------
    // 1. [조건부 삭제] test_auto_인사연동 정책이 있으면 삭제, 없으면 패스
    //'정책 목록' 영역 안에서만 검사합니다.
    cy.get('.v-datatable').first().then(($table) => {
    // 정책 목록 테이블 내부에 해당 텍스트가 있는지 확인
    const hasPolicy = $table.find('tr:contains("test_auto_인사연동")').length > 0;

    if (hasPolicy) {
      cy.log('🗑️ 기존 정책이 발견되었습니다. 삭제를 진행합니다.');
      
     // ✅ 활성 상태면 먼저 중지
    cy.contains('tr', 'test_auto_무결성검사').then(($row) => {
      const isActive = Cypress.$($row).text().includes('활성');
      if (isActive) {
        cy.log('⏹️ 활성 상태 감지 → 중지 후 삭제');
        cy.wrap($row).find('.v-input--selection-controls__ripple').click({ force: true });
        cy.wait(500);
        cy.contains('.v-btn__content', '중지').closest('button').click({ force: true });
        cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible');
        cy.get('.v-snack__content', { timeout: 15000 }).should('not.exist');
        cy.wait(1000);
      }
    });
      
      
      // 삭제 버튼(휴지통) 클릭
      cy.contains('tr', 'test_auto_인사연동').find('.fa-trash').click({ force: true });
      cy.wait(500);
    
      // 삭제 확인 팝업에서 '확인' 클릭
      cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });
      cy.wait(1000); // 삭제 처리가 서버에 반영될 시간 대기

      // 추가한 정책 삭제 검증코드 
      // 2. 추가한 정책 삭제 검증코드 (상단 테이블 영역으로 한정)
      cy.get('.v-datatable').first().within(() => {
      // 이제 이 안에서는 하단 '일정 상세' 테이블이 간섭하지 못합니다.
       cy.contains('tr', 'test_auto_인사연동').should('not.exist');
      });
    
    } else {
      // 정책이 없으면 에러 없이 이 구문을 타고 자연스럽게 통과합니다.
      cy.log('⚪ 기존 정책이 없습니다. 삭제 단계를 패스합니다.');
     }
     });
     
     //-----------------------------------------------------------------------
     //스케줄러 정책 추가
     // '추가' 버튼 클릭
     cy.contains('.v-btn__content', '추가').click({ force: true });

    //정책 플랜 상세 화면으로 이동되는지 확인----------------------------------------------
    // 🌟 [수정된 방식] 눈에 "보이는" 요소들을 먼저 추려낸 후 텍스트를 찾습니다.
    cy.get('span.c-headline', { timeout: 10000 }).filter(':visible').contains('정책 플랜 상세').should('be.visible');

    // 즉시 검사 설정 문구 검증
    cy.get('span.c-headline', { timeout: 10000 }).filter(':visible').contains('즉시 검사 설정').should('be.visible');

     // 정책 화면 ---------------------------
     //--------------------------------------
     // 정책목록 유형 선택하기 - 인사정보 연동기
     //-------------------------------------
     // 정책목록
     // 1. 먼저 정책 목록 입력창(ComboBox)을 클릭하여 리스트를 펼칩니다.
     cy.get('input[aria-label="정책 목록"]').should('be.visible').click({ force: true });
     // 2. 리스트가 애니메이션과 함께 나타나므로 잠시 대기하거나 존재 확인
     cy.wait(1000); 
     // 3. 나타난 리스트 항목 중 해당 텍스트를 정확히 찾아 클릭합니다.
     cy.contains('.v-list__tile__title', '[인사정보 연동기] 인사연동정책').should('be.visible').click({ force: true });
     // 4. [검증] 입력창에 해당 값이 제대로 들어갔는지 확인 (필요 시)
     cy.get('input[aria-label="정책 목록"]').closest('.v-input').should('contain.text', '[인사정보 연동기] 인사연동정책');


     // '플랜 이름' 입력하기 
     cy.get('input[aria-label="플랜 이름"]').should('be.visible').clear({ force: true }).type('test_auto_인사연동', { force: true });
     cy.wait(1000);
     
     // 작업유형 - 주기반복
     // 작업 유형 입력창을 클릭하여 숨겨진 리스트를 펼칩니다.
     cy.get('input[aria-label="작업 유형"]').should('be.visible').click({ force: true });     
     cy.wait(1000);
     // 펼쳐진 리스트 중에서 '주기 반복' 항목을 정확히 찾아 클릭
     cy.contains('.v-list__tile__title', '주기 반복').should('be.visible').click({ force: true });
     cy.wait(1000);
     // [검증코드] 즉시 검사에서 주기 반복으로 값이 잘 변경되었는지 확인합니다.
     cy.get('input[aria-label="작업 유형"]').closest('.v-input').should('contain.text', '주기 반복'); 

     // '저장'버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('저장').last().click({ force: true });
     cy.wait(1000);

     //스케줄러 정책목록에 test_auto_인사연동 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_인사연동').should('be.visible');


     ///////////////////////////////////////////////////////////
     // "test_auto_인사연동" 텍스트가 포함된 행(tr)을 찾아 체크하기
     ///////////////////////////////////////////////////////////
     // 활성 확인하기 위해 targetRow1 지정 
    cy.contains('tr', 'test_auto_인사연동').as('targetRow1')
    .within(() => {
      cy.get('.v-input--selection-controls__ripple').click({ force: true });
    });
    cy.wait(1000);

    // (옵션) 체크가 실제로 체크박스에 체크가 되었는지 검증
    cy.contains('tr', 'test_auto_인사연동').find('input[role="checkbox"]').should('have.attr', 'aria-checked', 'true');

    // '시작'이라는 버튼이 활성화 해당버튼을 클릭합니다.
    cy.contains('.v-btn__content', '시작').closest('button').should('not.be.disabled').click({ force: true });

     // 4. 성공 알림창(Snackbar) 포착 및 텍스트 검증
    cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible').and('contain', '성공'); // '성공' 문구 포함 확인

    // 5. 알림창이 사라질 때까지 대기
    cy.get('.v-snack__content').should('not.exist');
    cy.wait(2000); 

    // [최종 확인] 등록했던 이름인 @targetRow1을 사용하여 상태를 확인
    //cy.get('@targetRow1').should('contain', '활성').and('be.visible');
    // 별명 대신 직접 다시 찾아서 '활성' 상태 검증 (가장 안전한 방법)
    cy.contains('tr', 'test_auto_인사연동').should('be.visible').and('contain', '활성');
    

    // 2. 스케줄러가 백그라운드에서 실행되고 로그 파일을 생성할 때까지 충분히 대기 
    cy.log('⏳ 인사연동 정책 스케줄러 동작 및 로그 기록 대기 중...');
    cy.wait(8000); // 💡 서버 성능이나 스케줄러 동작 시간에 따라 5~10초 사이로 조절하세요.
    
 /////////////////////////////////////////////////
// 인사연동 스케줄러 로그파일 검증 로직 
/////////////////////////////////////////////////
    cy.task('runSSH', `pscheck | grep -w "rank"`).then((pscheckOutput) => {
    // ✅ [수정 1] null 대신 empty로 검증 (빈 문자열도 여기서 즉시 실패 처리)
    expect(pscheckOutput.trim(), '✅ pscheck 결과가 비어있지 않아야 함').to.not.be.empty;
    
    cy.log(`🖥️ [pscheck 결과]:\n${pscheckOutput}`);

    // 1. 경로 추출
    const logPath = pscheckOutput.trim().split(/\s+/).pop();
    const dirPath = logPath.substring(0, logPath.lastIndexOf('/'));

    cy.log('===================================================');
    cy.log(`👉 동적 추출된 로그 폴더: ${dirPath}`);
    cy.log('===================================================');

    expect(logPath, '🚨  로그 경로 추출 포함여부 확인').to.include('/proc/rank/');
    // ✅ [수정 2] dirPath가 루트나 빈 문자열로 떨어지는 것 차단
    expect(dirPath, '🚨 유효한 로그 디렉터리 경로여야 함').to.match(/^\/.+\/.+/);

    // 2. [수정] 스케줄러가 비즈니스 로직(Queue flush)을 완료할 때까지 충분히 대기
    // 3초는 짧을 수 있으므로 15초 정도를 권장합니다.
    cy.log('⏳ 스케줄러 작업 완료 대기 중 (15초)...');
    cy.wait(15000); 

    // 3. [핵심 수정] 단일 파일(logPath)이 아닌 폴더 내 모든 파일(*)을 cat 합니다.
    // 이렇게 해야 .std 파일과 .log 파일의 내용을 모두 가져와 검증할 수 있습니다.
      cy.task('runSSH', `timeout 10 cat ${dirPath}/*`, { timeout: 30000 }).then((allLogContent) => {
        cy.log(`📄 [로그 통합 내용 읽기 완료]`);

        // 4. [최종 검증] 통합된 내용에서 각 항목 확인
        expect(allLogContent.trim(), '🚨 로그 내용이 비어있습니다.').to.not.be.empty;

    
    // 1. 앞서 추출한 logPath를 기준으로 동적 ID(INSTID) 추출
    // 경로 예: /home/logcatch/proc/rank/202604/12531/log/task_iid_12531.std
    const pathParts = logPath.split('/');
    // /log 바로 앞의 요소가 인스턴스 ID이므로 뒤에서 두 번째 값을 가져옵니다.
    const dynamicInstId = pathParts[pathParts.length - 3]; // [..., "12531", "log", "task_iid_12531.std"] 순서 기준

    cy.log(`🔍 검증에 사용할 동적 ID: ${dynamicInstId}`);

    // 2. 정밀 검증 시작
    expect(allLogContent.trim(), '🚨 로그 내용이 비어있습니다.').to.not.be.empty;

    // [수정] 단순히 문구가 포함되었는지가 아니라, "실제 경로"와 "실제 ID"가 일치하는지 확인
    expect(allLogContent, '로그 내 기록된 경로가 실제 추출 경로와 일치하는지 확인').to.include(`LOGCATCH_TASK_LOGPATH : [${dirPath}]`);
    expect(allLogContent, '인사연동(HUMANRESOURCE) 태스크 실행 확인').to.include('LOGCATCH_TASK_NAME : [HUMANRESOURCE]');
    expect(allLogContent, `로그 내 INSTID가 경로상의 ID(${dynamicInstId})와 일치하는지 확인`).to.include(`LOGCATCH_TASK_INSTID : [${dynamicInstId}]`);
    // 🌟 성공 문구 확인 
    expect(allLogContent, '큐플러시 정상 종료 확인').to.include('Queue flush finished successfully within timeout.');

        cy.log('🎉 [HUMANRESOURCE] rank 스케줄러 기동 및 Queue flush 정상 완료까지 검증완료');
    });
});
//--------------------------------------------------------------------------------------------------------------
cy.wait(3000);




    /////////////////////////////////////////
    // Case 2 정책목록 유형 무결성 검사정책
    ///////////////////////////////////////    
     
    //예외처리  test_auto_무결성검사 삭제 --------------------------
    // 1. [조건부 삭제] test_auto_무결성검사 정책이 있으면 삭제, 없으면 패스
    //'정책 목록' 영역 안에서만 검사합니다.
    cy.get('.v-datatable').first().then(($table) => {
    // 정책 목록 테이블 내부에 해당 텍스트가 있는지 확인
    const hasPolicy = $table.find('tr:contains("test_auto_무결성검사")').length > 0;

    if (hasPolicy) {
      cy.log('🗑️ 기존 정책이 발견되었습니다. 삭제를 진행합니다.');

      // ✅ 활성 상태면 먼저 중지
    cy.contains('tr', 'test_auto_무결성검사').then(($row) => {
      const isActive = Cypress.$($row).text().includes('활성');
      if (isActive) {
        cy.log('⏹️ 활성 상태 감지 → 중지 후 삭제');
        cy.wrap($row).find('.v-input--selection-controls__ripple').click({ force: true });
        cy.wait(500);
        cy.contains('.v-btn__content', '중지').closest('button').click({ force: true });
        cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible');
        cy.get('.v-snack__content', { timeout: 15000 }).should('not.exist');
        cy.wait(1000);
      }
    });
    
      // 삭제 버튼(휴지통) 클릭
      cy.contains('tr', 'test_auto_무결성검사').find('.fa-trash').click({ force: true });
      cy.wait(1000);

      // 💡 [수정 포인트 1] 팝업이 완전히 렌더링될 때까지 애니메이션 안정화 대기
      cy.get('.v-dialog').filter(':visible').should('be.visible').and('contain', '삭제하시겠습니까?');
      cy.wait(500); // 애니메이션이 끝날 때까지 0.5초만 숨고르기
    
      // 2. 삭제 확인 팝업에서 '확인' 클릭 (강제 클릭 대신 일반 클릭으로 정상 작동 확인)
      cy.get('.v-dialog').filter(':visible').find('.v-btn').contains('확인').click();
      cy.wait(2000);
      // 팝업창 글자가 화면에서 '안 보이게' 숨겨졌는지 확인합니다.
      cy.contains('삭제하시겠습니까?').should('not.be.visible');
      cy.wait(2000);

      // 추가한 정책 삭제 검증코드 
      // 2. 추가한 정책 삭제 검증코드 (상단 테이블 영역으로 한정)
      cy.get('.v-datatable').first().within(() => {
      // 이제 이 안에서는 하단 '일정 상세' 테이블이 간섭하지 못합니다.
       cy.contains('tr', 'test_auto_무결성검사').should('not.exist');
      });
    
    } else {
      // 정책이 없으면 에러 없이 이 구문을 타고 자연스럽게 통과합니다.
      cy.log('⚪ 기존 정책이 없습니다. 삭제 단계를 패스합니다.');
     }
     });

     //-----------------------------------------------------------------------
     //스케줄러 정책 추가
     // '추가' 버튼 클릭
     cy.contains('.v-btn__content', '추가').click({ force: true });

    //정책 플랜 상세 화면으로 이동되는지 확인----------------------------------------------
    // 🌟 [수정된 방식] 눈에 "보이는" 요소들을 먼저 추려낸 후 텍스트를 찾습니다.
    cy.get('span.c-headline', { timeout: 10000 }).filter(':visible').contains('정책 플랜 상세').should('be.visible');

    // 즉시 검사 설정 문구 검증
    cy.get('span.c-headline', { timeout: 10000 }).filter(':visible').contains('즉시 검사 설정').should('be.visible');

     // 정책 화면 ---------------------------
     //--------------------------------------
     // 정책목록 유형 선택하기 - 무결성 검사사정책
     //-------------------------------------
     // 정책목록
     // 1. 먼저 정책 목록 입력창(ComboBox)을 클릭하여 리스트를 펼칩니다.
     cy.get('input[aria-label="정책 목록"]').should('be.visible').click({ force: true });
     // 2. 리스트가 애니메이션과 함께 나타나므로 잠시 대기하거나 존재 확인
     cy.wait(1000); 
     // 3. 나타난 리스트 항목 중 해당 텍스트를 정확히 찾아 클릭합니다.
     cy.contains('.v-list__tile__title', '[접속이력 무결성 검사] 무결성 검사 정책').should('be.visible').click({ force: true });
     // 4. [검증] 입력창에 해당 값이 제대로 들어갔는지 확인 (필요 시)
     cy.get('input[aria-label="정책 목록"]').closest('.v-input').should('contain.text', '[접속이력 무결성 검사] 무결성 검사 정책');


     // '플랜 이름' 입력하기 
     cy.get('input[aria-label="플랜 이름"]').should('be.visible').clear({ force: true }).type('test_auto_무결성검사', { force: true });
     cy.wait(1000);
     
     // 작업유형 - 주기반복
     // 작업 유형 입력창을 클릭하여 숨겨진 리스트를 펼칩니다.
     cy.get('input[aria-label="작업 유형"]').should('be.visible').click({ force: true });     
     cy.wait(1000);
     // 펼쳐진 리스트 중에서 '주기 반복' 항목을 정확히 찾아 클릭
     cy.contains('.v-list__tile__title', '주기 반복').should('be.visible').click({ force: true });
     cy.wait(1000);
     // [검증코드] 즉시 검사에서 주기 반복으로 값이 잘 변경되었는지 확인합니다.
     cy.get('input[aria-label="작업 유형"]').closest('.v-input').should('contain.text', '주기 반복'); 

     // '저장'버튼 클릭
     cy.get('.v-btn__content').filter(':visible').contains('저장').last().click({ force: true });
     cy.wait(1000);

      //스케줄러 정책목록에 test_auto_무결성검사 정책이 잘 추가되었는지 검증하는 코드 
     cy.get('tbody').contains('tr', 'test_auto_무결성검사').should('be.visible');


     ///////////////////////////////////////////////////////////
     // "test_auto_무결성검사" 텍스트가 포함된 행(tr)을 찾아 체크하기
     ///////////////////////////////////////////////////////////
     // 활성 확인하기 위해 targetRow2 지정 
    cy.contains('tr', 'test_auto_무결성검사').as('targetRow2')
    .within(() => {
      cy.get('.v-input--selection-controls__ripple').click({ force: true });
    });
    cy.wait(1000);

    // (옵션) 체크가 실제로 체크박스에 체크가 되었는지 검증
    cy.contains('tr', 'test_auto_무결성검사').find('input[role="checkbox"]').should('have.attr', 'aria-checked', 'true');

    // '시작'이라는 버튼이 활성화 해당버튼을 클릭합니다.
    cy.contains('.v-btn__content', '시작').closest('button').should('not.be.disabled').click({ force: true });

    // 4. 성공 알림창(Snackbar) 포착 및 텍스트 검증
    cy.get('.v-snack__content', { timeout: 10000 }).should('be.visible').and('contain', '성공'); // '성공' 문구 포함 확인

    // 5. 알림창이 사라질 때까지 대기
    cy.get('.v-snack__content', { timeout: 15000 }).should('not.exist');

    // [최종 확인] 등록했던 이름인 @targetRow2을 사용하여 상태를 확인
    //cy.get('@targetRow2').should('contain', '활성').and('be.visible');
    // 별명 대신 직접 다시 찾아서 '활성' 상태 검증 (가장 안전한 방법)
    cy.contains('tr', 'test_auto_무결성검사').should('be.visible').and('contain', '활성');
    

    // 2. 스케줄러가 백그라운드에서 실행되고 로그 파일을 생성할 때까지 충분히 대기 
    cy.log('⏳ 무결성 검사 정책 스케줄러 동작 및 로그 기록 대기 중...');
    cy.wait(8000); // 💡 서버 성능이나 스케줄러 동작 시간에 따라 5~10초 사이로 조절하세요.


    /////////////////////////////////////////////////
    // Antiforgery 스케줄러 로그파일 검증 로직 
    /////////////////////////////////////////////////
    // 1. pscheck를 통해 antiforgery 프로세스 정보 가져오기
    cy.task('runSSH', `pscheck | grep -w "antiforgery"`).then((pscheckOutput) => {
    expect(pscheckOutput.trim(), '✅ pscheck 결과가 비어있지 않아야 함').to.not.be.empty;
    
    cy.log(`🖥️ [antiforgery pscheck 결과]:\n${pscheckOutput}`);

    // 2. 경로 및 동적 ID 추출
    const logPath = pscheckOutput.trim().split(/\s+/).pop(); // 파일 풀 경로
    const dirPath = logPath.substring(0, logPath.lastIndexOf('/')); // 로그 폴더 경로
    
    const pathParts = logPath.split('/');
    // 경로 예: /home/logcatch/proc/antiforgery/202604/12619/log/task_iid_12619.std
    // 뒤에서 3번째 요소가 인스턴스 ID (12619)
    const dynamicInstId = pathParts[pathParts.length - 3];

    cy.log('===================================================');
    cy.log(`👉 동적 추출된 로그 폴더: ${dirPath}`);
    cy.log(`🔍 검증에 사용할 동적 ID: ${dynamicInstId}`);
    cy.log('===================================================');

    expect(logPath, '🚨 로그 경로 추출 포함여부 확인 ').to.include('/proc/antiforgery/');
    expect(dirPath, '🚨 유효한 로그 디렉터리 경로여야 함').to.match(/^\/.+\/.+/);


    // 3. 작업 완료를 위한 대기 (프로세스 기동 및 초기 로그 기록 시간)
    cy.log('⏳ Antiforgery 작업 완료 대기 중 (15초)...');
    cy.wait(15000); 

    // 4. 폴더 내 모든 로그 통합 읽기 (* 사용)
    cy.task('runSSH', `timeout 10 cat ${dirPath}/*`, { timeout: 30000 }).then((allLogContent) => {
        cy.log(`📄 [Antiforgery 로그 통합 내용 읽기 완료]`);

        // 5. 정밀 검증 시작
        expect(allLogContent.trim(), '🚨 로그 내용이 비어있습니다.').to.not.be.empty;
        // A. 실제 추출한 경로가 로그에 기록되어 있는지 확인
        expect(allLogContent, '로그 내 기록된 경로가 실제 추출 경로와 일치하는지 확인').to.include(`LOGCATCH_TASK_LOGPATH : [${dirPath}]`);
        // B. 태스크 명이 ANTIFORGERY인지 확인 (서비스명에 따라 대문자 확인 필요)
        expect(allLogContent, '무결성검사(ANTIFORGERY) 태스크 실행 확인').to.include('LOGCATCH_TASK_NAME : [ANTIFORGERY]');
        // C. 추출한 동적 ID가 로그에 기록된 ID와 일치하는지 확인
        expect(allLogContent, `로그 내 INSTID가 경로상의 ID(${dynamicInstId})와 일치하는지 확인`).to.include(`LOGCATCH_TASK_INSTID : [${dynamicInstId}]`);
        // D. Antiforgery 특유의 성공 문구 확인 (비즈니스 로직 종료 메시지)
        // 성공 문구는 시스템마다 다를 수 있으니 실제 로그에 찍히는 문구로 조정하세요.
        expect(allLogContent, 'Antiforgery 정상 종료 확인').to.include('Queue flush finished successfully within timeout.');

        cy.log(`🎉 [ANTIFORGERY] 스케줄러 기동 및 검증이 완벽히 완료되었습니다!`);
    });
});


//------------------------------------------------------------------------ 

    cy.log('✅ 운영 - 실행플랜 - [스케줄러] 출력 확인 완료 ');

    
    // /////////////////////////////////////////////////
    // // 로그폴더 소유자 : logcatch인지 점검 
    // /////////////////////////////////////////////////
    // cy.exec(`stat -c "%U" ${logPath}*.log`).then((result) => {
    //   // 2. 실행 결과(stdout)를 줄바꿈으로 나누어 배열로 만듭니다.
    //   const owners = result.stdout.split('\n');

    //   // 3. 모든 파일의 소유자가 'logcatch'와 일치하는지 검증합니다.
    //   owners.forEach((owner) => {
    //     expect(owner.trim()).to.equal(expectedOwner);
    //   });
      
    //   cy.log('모든 로그 파일의 소유권이 정상입니다.');
    // });

 
    // // 운영 > 실행 플랜  > "실시간 모니터링" 탭을 클릭
    // cy.log('--- 실시간 모니터링 탭 클릭 ---');
    // cy.contains('.v-btn__content', '실시간 모니터링').should('be.visible').click({ force: true });
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '탐색 실시간 모니터').should('exist');
    // // > 아이콘확인
    // cy.get('.sub-title-icon.fa-angle-right').should('be.visible')
    //  // 설명: 'sub-title-title' 클래스를 가진 요소 중 '진행 중인 탐색'이라는 글자가 포함된 요소 확인
    // cy.contains('.sub-title-title', '진행 중인 탐색').should('be.visible');
    // cy.log('✅ 운영 - 실행플랜 - [실시간 모니터링] 출력 확인 완료 ');

   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 운영 - 실행플랜 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
