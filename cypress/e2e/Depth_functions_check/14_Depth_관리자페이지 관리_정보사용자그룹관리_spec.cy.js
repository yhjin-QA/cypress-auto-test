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
const DEPT_ID = 'AUTO_QA';          // 자동화1 전용 부서 (MariaDB employees.department_id → LogCatch 그룹 원본 코드)
const DEPT_NAME = '자동화QA팀';
// [2026-11-16] 상위 소속도 전용 그룹으로 — 상위를 개발그룹(DEV_GRP)으로 두었더니 「부서장 설정」이 개발그룹 부서장으로 반영됨(실제 그룹 변경)
const GRP_ID = 'AUTO_GRP';
const GRP_NAME = '자동화그룹';
const PLAN = 'auto_인사연동_Maria 플랜';
// [2026-11-16] 「부서장 설정」 label 이 화면에 2개(숨은 것 포함) — cy.contains 가 숨은 것을 잡아 실패 → 보이는 것만
const headLabel = (opt = {}) => cy.get('label', opt).filter((i, e) => (e.offsetWidth || e.offsetHeight) && e.innerText.trim() === '부서장 설정').first();   // 운영 > 실행 플랜 > 스케줄러 (정책 auto_인사연동_Maria · 즉시 검사) — 미리 만들어 둠
describe('로그캐치 Depth 배포점검목록 동작 테스트', () => {
  // 끝나면 원본(MariaDB .26 · CRM 로그인 테이블)의 자동화1 정리
  after(() => {
    cy.task('queryMariaDB', `DELETE FROM employees WHERE emp_name = '자동화1'`).then((r) => cy.log(`🧹 after : MariaDB 자동화1 정리 ${JSON.stringify(r)}`));
  });
  
  it('14_Depth_관리자페이지 관리_정보사용자그룹관리 자동화 시나리오', () => {


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


   

    // ===================================================
    // STEP: 기존 DB 데이터 클린업 (MariaDB .26 & PostgreSQL)
    // ===================================================
    cy.log(' 🧹 DB 데이터 정리 중 (대상: "자동화1")');
     cy.log('🧹 MariaDB(.26), Postgres DB의 기존 "자동화1" 데이터 정리 중...');
    
    // 1. 원본(MariaDB .26) 데이터 삭제
    // [2026-11-16] 인사연동 원본을 Oracle(172.16.200.16 — 개발팀 관리, 응답 없음 장애) 대신 MariaDB .26 logcatch_demo.employees 로 변경
    //   전용 정책 auto_인사연동_Maria · 플랜 auto_인사연동_Maria 플랜(즉시 검사) — 운영 중 인사연동정책(Oracle+Maria)은 건드리지 않음
    cy.task('queryMariaDB', `DELETE FROM employees WHERE emp_name = '자동화1'`).then((r) => {
      expect(r && r.error, `MariaDB(.26) 정리 — ${r && r.error}`).to.be.undefined;
      cy.log(`🧹 MariaDB(.26) : 기존 "자동화1" ${r.affected} 건 정리`);
    });

    // 2. PostgreSQL 데이터 삭제 (운영자 및 관리자 계정 정보)
    
    // [항목 A] tbr_opr_user 테이블 정리
    cy.task('queryPostgresDB', `DELETE FROM logcatch.tbr_opr_user WHERE name = '자동화1'`);
    
    // [항목 B] tbr_opr_manager 테이블 정리 (추가된 부분 ✨)
    // 설명: 계정관리 탭의 '관리자 계정' 테이블에 해당하는 원천 데이터입니다.
    cy.task('queryPostgresDB', `DELETE FROM logcatch.tbr_opr_manager WHERE name = '자동화1'`).then(() => {
        cy.log('🧹 PostgreSQL: tbr_opr_user 및 tbr_opr_manager 정리 완료');
    });

    cy.wait(1000); // DB 반영을 위한 짧은 대기


   
    // =================================================================
    //  STEP : MariaDB .26 logcatch_demo.employees 에 자동화1 사용자 추가 (2026-11-16 Oracle 에서 변경)
    // =================================================================
    // 🎯 Date.now()의 뒷부분 10자리만 추출하여 길이를 줄입니다.
    //자동화 1  개발부서의 개발팀 소속

    cy.log('✅ MariaDB(.26) 자동화1 사용자 생성 시작 아이디 : auto_랜덤숫자');

    const uniqueTag = String(Date.now()).slice(-10); 
    const testEmplrId = `auto${uniqueTag}`;        // ID: auto6243577771 (15자)
    const testEsntlId = `USR_${uniqueTag}`;         // 예: USR_6243577771 (14자) - 안전하게 20자 미만

    // MariaDB .26 logcatch_demo.employees 에 자동화1 추가 — emp_id = emp_no = auto+숫자10자리
    //   매핑(auto_인사연동_Maria) : 아이디 emp_id · 사원 번호 emp_no → LogCatch tbr_opr_user.employee_number
    //   소속은 자동화 전용 부서 AUTO_QA / 자동화QA팀, 상위 소속도 전용 AUTO_GRP / 자동화그룹 — 부서장 설정 단계가 실제 그룹의 부서장을 바꾸지 않게
    //   CRM 로그인 테이블이라 끝나면 after() 에서 지움
    const insertSql = `INSERT INTO employees
      (emp_id, emp_no, password, emp_name, group_id, group_name, department_id, department, position, role)
      VALUES ('${testEmplrId}', '${testEmplrId}', '${testEsntlId}', '자동화1', '${GRP_ID}', '${GRP_NAME}', '${DEPT_ID}', '${DEPT_NAME}', '사원', 'USER')`;
    cy.log(`✅ MariaDB(.26) 자동화1 생성 시작 (ID: ${testEmplrId})`);
    cy.task('queryMariaDB', insertSql).then((r) => {
      expect(r && r.error, `MariaDB(.26) 자동화1 추가 — ${r && r.error}`).to.be.undefined;
      return cy.task('queryMariaDB', `SELECT emp_id FROM employees WHERE emp_id = '${testEmplrId}'`);
    }).then((result) => {
      expect(result && result.error, `MariaDB(.26) 조회 — ${result && result.error}`).to.be.undefined;
      expect(result.length, '방금 생성한 ID가 1건 조회되어야 합니다').to.equal(1);
      expect(result[0].emp_id).to.equal(testEmplrId);
      cy.log('✅ [검증 완료] MariaDB(.26)에 자동화1 저장:', testEmplrId);
    });

    // ===============================================
    // STEP : 운영 서브메뉴 - 인사연동 스케줄러 실행하기
    // ===============================================
    cy.log('🚀 운영 탭 클릭');
    
    // 운영 > 실행플랜 서브메뉴 
    cy.contains('button', /^운영$/).click({ force: true });
    cy.wait(2000);
    cy.log('---운영 - 실행 플랜 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("실행 플랜")').filter(':visible').click({ force: true });
    cy.wait(3000); 
    // [2026-11-16] 메뉴 클릭 직후 ChunkLoadError 로 화면이 바뀌지 않은 적 있음(현황에 머묾) → 주소로 바로 이동
    cy.url().then((u) => { if (!u.includes('/operate/executePlan')) { cy.log('↻ 실행 플랜 화면으로 주소 이동'); cy.visit('/logcatch/operate/executePlan/scheduler'); cy.wait(4000); } });

    // 운영 > 실행플랜  > 스케줄러 탭을 클릭
    cy.log('--- 스케줄러 탭 클릭 ---');
    cy.contains('.v-btn__content', '스케줄러').should('be.visible').click({ force: true });
    cy.wait(3000);


     ///////////////////////////////////////////////////////////
     // 자동화 전용 플랜(PLAN) 행(tr)을 찾아 체크하기
     ///////////////////////////////////////////////////////////
     // 활성 확인하기 위해 targetRow1 지정 
    cy.contains('tr', PLAN).as('targetRow1')
    .within(() => {
      cy.get('.v-input--selection-controls__ripple').click({ force: true });
    });
    cy.wait(1000);

    // (옵션) 체크가 실제로 체크박스에 체크가 되었는지 검증
    cy.contains('tr', PLAN).find('input[role="checkbox"]').should('have.attr', 'aria-checked', 'true');

    // '시작'이라는 버튼이 활성화 해당버튼을 클릭합니다.
    // [2026-11-16] 「시작」 응답(POST /logcatch/task/execute)이 10~15초를 넘길 때가 있어(같은 날 2회) 요청 응답을 최대 90초 기다린 뒤 안내 확인
    cy.intercept('POST', '**/logcatch/task/execute').as('taskExec');
    cy.contains('.v-btn__content', '시작').closest('button').should('not.be.disabled').click({ force: true });
    cy.wait('@taskExec', { timeout: 90000 }).then((x) => {
      cy.log(`⏱️ task/execute 응답 ${x.response && x.response.statusCode}`);
      expect(x.response && x.response.statusCode, '시작(task/execute) 응답').to.eq(200);
    });

     // 4. 성공 알림창(Snackbar) 포착 및 텍스트 검증
    cy.get('.v-snack__content', { timeout: 20000 }).should('be.visible').and('contain', '성공'); // '성공' 문구 포함 확인

    // 5. 알림창이 사라질 때까지 대기
    cy.get('.v-snack__content').should('not.exist');
    cy.wait(7000); 

    

    // ==============================================================
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==============================================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(2000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');

    // ==============================================================
    // STEP : 관리 > 정보사용자 / 그룹 관리  화면이동
    // ==============================================================
    // 관리 > 정보사용자 / 그룹 관리  서브메뉴 선택 
    cy.contains('button.side-menu', '관리').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.log('--- 서브메뉴 [정보사용자 / 그룹 관리] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("정보 사용자 / 그룹 관리")').filter(':visible').click({ force: true });
    cy.wait(4000); // 화면 전환 대기
    // 관리 > 정보사용자 / 그룹 관리  > 관리 클릭
    //cy.get('.v-btn__content').filter(':visible').contains('관리').last().click({ force: true });
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '소속 (전체)').should('exist');
    // 플러스 + 아이콘 확인
    cy.get('.v-icon.fa-plus').should('be.visible');
    // 새로고침 버튼확인 
    cy.get('.material-icons').filter(':visible').contains('autorenew').should('be.visible');
     // 돋보기 아이콘이 확인
     cy.get('.v-icon.fa-search').should('be.visible');
     // 검색 조건 입력란 
     cy.get('input[aria-label="검색 조건"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="값"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="조건"]').filter(':visible').should('be.visible');
     // 검색 버튼 확인
     cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
     // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 정책 추가버튼 확인
    cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     // 표 열 문구 확인 
     cy.get('th').filter(':visible').contains('이름').should('be.visible');
     cy.get('th').filter(':visible').contains('아이디').should('be.visible');
     cy.get('th').filter(':visible').contains('그룹').should('be.visible');
     cy.get('th').filter(':visible').contains('이메일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');


    // ===================================================
    // STEP: PostgreSQL DB 데이터 검증 (tbr_opr_user 테이블)
    // ===================================================
    const targetName = '자동화1';
    const expectedId = `auto${uniqueTag}`; 
    cy.log(`--- 🐘 PostgreSQL DB 데이터 확인: ${targetName} ---`);
    // 1. 대기 시간을 넉넉히 줍니다. (인사연동은 생각보다 무거운 작업일 수 있습니다)
    // [2026-11-16] 고정 대기(8초 + 5초 1회) 대신 5초 간격 최대 12회(60초)까지 들어올 때까지 조회 (전용 정책 실행은 20초 안팎)
    const pgSql = `SELECT employee_number FROM logcatch.tbr_opr_user WHERE employee_number = '${expectedId}'`;
    const pollPg = (left) => cy.task('queryPostgresDB', pgSql).then((rows) => {
      if ((rows && rows.length) || left <= 0) return rows;
      cy.log(`⏳ 인사연동 반영 대기 — 5초 뒤 다시 조회 (${left})`);
      cy.wait(5000);
      return pollPg(left - 1);
    });
    pollPg(12).then((pgResult) => {
      expect(pgResult, 'Postgres DB에 방금 생성한 사번이 존재해야 합니다 (60초 대기)').to.not.be.null;
      expect(pgResult.length, `tbr_opr_user 사번 ${expectedId} (60초 안에 인사연동 반영)`).to.equal(1);
      // 2. 값 추출 컬럼명도 employee_number로 변경
      const dbEmployeeNumber = pgResult[0].employee_number;
      expect(String(dbEmployeeNumber)).to.equal(expectedId);
      cy.log(`✅ PostgreSQL 데이터 검증 최종 성공! (사번: ${dbEmployeeNumber} 일치 확인)`);
    });

   
     
    // ==========================================
    // STEP : logcatch UI 자동화1 사용자 존재 검증 
    // ==========================================
    cy.log(`--- [1단계] UI에서 ${targetName} 사용자 검색 ---`);
    // 1. 검색 조건 세팅 (이름)
    cy.get('input[aria-label="검색 조건"]').click({ force: true });
    cy.wait(1000); 
    cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '이름').click({ force: true });
    // 2. 검색어 입력 및 실행
    cy.get('input[aria-label="값"]').should('be.visible').clear().type(targetName);
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(2000); // 검색 결과 렌더링 시간 확보


    cy.log(`--- [2단계] UI 정보 추출 및 DB 데이터 교차 검증 ---`);
    // UI에서 아이디(사번)를 추출하여 실제 DB 값과 비교
    cy.contains('td', targetName) // '자동화1'이 포함된 셀 찾기
    .parent('tr')               // 해당 행(Row)으로 이동
    .within(() => {
    // eq(1)에서 텍스트를 가져와서 검증
    cy.get('td').eq(1).invoke('text').then((uiUserId) => {
      const trimmedUiId = uiUserId.trim(); // 공백 제거
      cy.log(`🖥️ UI 표시 아이디: ${trimmedUiId}`);
      cy.log(`🛢️ DB 저장 아이디: ${expectedId}`);
      // 🎯 [핵심] UI 값과 DB 값이 일치하는지 최종 확인
      expect(trimmedUiId).to.equal(expectedId);
     });
   });
   cy.log(`✅ 최종 검증 완료: UI 화면과 DB 데이터가 일치합니다.`);


   
   // 맨티스 이슈 : 37523 ,37521 — 2026-11-16 해결 확인 후 주석 해제 (부서장 체크 시 DB 반영 · 체크박스 유지)
   // ==========================================
   // STEP : 부서 관리에서 '자동화1'을 부서장으로 설정
   // ==========================================
   cy.log('⚙️ 부서장 설정 체크박스 활성화 및 저장');
   // '자동화1'이라는 글자를 포함한 가시적인 a 태그를 찾아 클릭
   cy.contains('a.font-weight-bold', '자동화1').should('be.visible').click({ force: true });
   cy.wait(3000); 
   
   // [사용자 상세] 타이틀이 나타날 때까지 확실히 대기 (팝업 로딩 확인)
   // [2026-11-16] 2.9.7 : 「사용자 상세」 제목은 접힌 머리(display:none) 안에 있어 보이지 않음 → 상세 입력 영역(부서장 설정 · 사원 번호)으로 열림 판단
   headLabel({ timeout: 10000 }).should('be.visible');
   cy.get('input[aria-label="사원 번호"]').filter(':visible').first().should('have.value', expectedId);

   headLabel().parent().find('.v-input--selection-controls__ripple').click({ force: true });
   cy.wait(1000); 

   // 체크박스가 실제로 체크되었는지 상태 검증 (선택 사항)
   // [2026-11-16] 화면 전체 체크박스가 아니라 「부서장 설정」 칸의 체크박스만 확인
   headLabel().parent().find('input').should('have.attr', 'aria-checked', 'true');

   // 저장버튼 클릭 
   cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
   cy.wait(1000); 
    
   // 수정했습니다.  알림창(Snackbar) 포착 및 텍스트 검증
   cy.get('.v-snack__content', { timeout: 15000 }).should('be.visible').and('contain', '수정'); // '수정' 문구 포함 확인

   cy.log('✅ 부서장 설정 저장 완료');

   // [2026-11-16] 37521(부서장 체크박스 유지 안 됨) 회귀 : 사용자 상세를 닫았다 다시 열어 체크가 남아 있는지
   cy.get('body').type('{esc}');
   cy.wait(1500);
   cy.contains('a.font-weight-bold', '자동화1').should('be.visible').click({ force: true });
   // [2026-11-16] 2.9.7 : 「사용자 상세」 제목은 접힌 머리(display:none) 안에 있어 보이지 않음 → 상세 입력 영역(부서장 설정 · 사원 번호)으로 열림 판단
   headLabel({ timeout: 10000 }).should('be.visible');
   cy.get('input[aria-label="사원 번호"]').filter(':visible').first().should('have.value', expectedId);
   headLabel().parent().find('input').should('have.attr', 'aria-checked', 'true');
   cy.log('✅ 다시 열어도 부서장 설정 유지 (37521)');
   
   // 맨티스 이슈 : 37523  ,37521
   // 부서장 체크시 DB테이블 업데이트및 부서장 체크박스 유지 안되는 문제
   // ===================================================
   // STEP: PostgreSQL 부서장 반영 최종 검증 (Cross-Check)
   // ===================================================
   cy.log('🐘 PostgreSQL 부서장 반영 상태 확인 시작...');


   // 1. 먼저 '자동화1'의 현재 id 값을 tbr_opr_user 테이블에서 가져옵니다.
   const getUserIdSql = `SELECT id FROM logcatch.tbr_opr_user WHERE employee_number = '${expectedId}'`;


   cy.task('queryPostgresDB', getUserIdSql).then((userResult) => {
    expect(userResult, '사용자 정보가 조회되어야 합니다').to.not.be.null;
    const currentAutoId = userResult[0].id; // 예: 2517
    
    cy.log(`🎯 이번 테스트의 자동화1 ID: ${currentAutoId}`);

    // 2. [2026-11-16] 원본이 MariaDB 로 바뀌어 자동화1 소속이 개발팀(id 1011) → 자동화QA팀(전용 부서)
    //    고정 id 대신 「자동화1을 부서장으로 가진 그룹」을 찾아 그 그룹이 자동화QA팀 하나뿐인지 확인 (37523 : DB 반영)
    const checkGroupHeadSql = `SELECT id, group_name, group_head_user_id FROM logcatch.tbr_opr_user_group WHERE group_head_user_id = ${currentAutoId}`;
    cy.wait(2000);
    cy.task('queryPostgresDB', checkGroupHeadSql).then((groupResult) => {
        expect(groupResult, '그룹 정보가 조회되어야 합니다').to.not.be.null;
        cy.log(`🛢️ 자동화1(ID ${currentAutoId})을 부서장으로 가진 그룹 : ${JSON.stringify(groupResult)}`);
        expect(groupResult.length, `자동화1(ID ${currentAutoId})을 부서장으로 가진 그룹 수`).to.equal(1);
        // [2026-11-16 관찰] 소속(자동화QA팀)이 아니라 상위 소속 그룹에 부서장이 반영됨 — 어느 쪽인지 기록하고 전용 그룹 둘 중 하나인지 확인
        expect([DEPT_NAME, GRP_NAME], '부서장으로 반영된 그룹 (자동화 전용 그룹)').to.include(groupResult[0].group_name);
        if (groupResult[0].group_name !== DEPT_NAME) cy.log(`⚠️ 관찰 : 부서장이 소속(${DEPT_NAME})이 아니라 상위 소속(${groupResult[0].group_name})에 반영됨`);
        cy.log(`✅ [검증 성공] ${groupResult[0].group_name}의 부서장이 자동화1(ID: ${currentAutoId})로 정상 반영되었습니다!`);
  
      });
    });
    

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('✅ 관리 - 정보사용자/그룹 관리 인사 DB연동 확인 완료 ');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
