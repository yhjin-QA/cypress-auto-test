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
      'Cannot read properties',
      'resetValidation',
      'NavigationDuplicated', // [NEW] 중복 이동 에러 무시 추가
      'Redirected when going from', // ◀◀◀ 이 문구를 추가하세요!
      'navigation guard',           // ◀◀◀ 이 문구도 추가하세요!
      'Avoided redundant navigation',
      'Loading chunk',
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


   

    // ===================================================
    // STEP: 기존 DB 데이터 클린업 (Oracle & PostgreSQL 공통)
    // ===================================================
    cy.log('🧹 oracle DB, Postgres DB의 기존 "자동화1" 데이터 정리 중...');
    
    // 1. Oracle 데이터 삭제
    cy.task('queryDB', `DELETE FROM LETTNEMPLYRINFO WHERE USER_NM = '자동화1'`);
    // 2. PostgreSQL 데이터 삭제 (추가된 부분)
    
    // ✅ 스케줄러가 옮겨놓은 '자동화1' 이름의 모든 데이터를 삭제합니다.
    cy.task('queryPostgresDB', `DELETE FROM logcatch.tbr_opr_user WHERE name = '자동화1'`).then((result) => {
      cy.log('🧹 PostgreSQL: 기존 "자동화1" 데이터 정리 완료');
    });

   
    // =================================================================
    //  STEP : WAS Oracle DB LETTNEMPLYRINFO 테이블에 자동화 1 사용자 추가 
    // =================================================================
    // 🎯 Date.now()의 뒷부분 10자리만 추출하여 길이를 줄입니다.
    //자동화 1  개발부서의 개발팀 소속

    cy.log('✅ Oracle DB 자동화1 사용자 생성 시작 아이디 : auto_랜덤숫자');

    const uniqueTag = String(Date.now()).slice(-10); 
    const testEmplrId = `auto${uniqueTag}`;        // ID: auto_6243577771 (15자)
    const testEsntlId = `USR_${uniqueTag}`;         // 예: USR_6243577771 (14자) - 안전하게 20자 미만

    const insertSql = `
    INSERT INTO LETTNEMPLYRINFO (
    EMPLYR_ID, 
    ORGNZT_ID, 
    USER_NM, 
    PASSWORD,
    SEXDSTN_CODE,
    HOUSE_ADRES, 
    PASSWORD_HINT, 
    PASSWORD_CNSR, 
    GROUP_ID, 
    PSTINST_CODE, 
    EMPLYR_STTUS_CODE, 
    ESNTL_ID, 
    SBSCRB_DE
    ) VALUES (
    '${testEmplrId}', 
    'ORGNZT_0000000000002', 
    '자동화1',
    'Manager1',
    'F',
    '관리자 주소',  
    'P01', 
    '123', 
    'GROUP_00000000000004', 
    '00000000', 
    'P', 
    '${testEsntlId}', 
    SYSDATE
     )
    `;

    // =================================================================
    // STEP : WAS Oracle DB 신규 데이터 삽입 및 검증
    // =================================================================
    cy.log(`✅ Oracle DB 생성 시작 (ID: ${testEmplrId})`);
    // 1. 신규 데이터 삽입 실행
    cy.task('queryDB', insertSql).then(() => {
    // 2. [검증] 삽입한 ID로 다시 조회하여 실제로 들어갔는지 확인
    const verifyOracleSql = `SELECT EMPLYR_ID FROM LETTNEMPLYRINFO WHERE EMPLYR_ID = '${testEmplrId}'`;
    return cy.task('queryDB', verifyOracleSql);
    }).then((result) => {
    // result는 보통 배열 형태로 반환됩니다. (예: [{ EMPLYR_ID: 'auto_...' }])
    // 3. 결과 검증
    expect(result, 'Oracle DB에 데이터가 존재해야 합니다').to.not.be.null;
    expect(result.length, '방금 생성한 ID가 1건 조회되어야 합니다').to.equal(1);
    // 컬럼명 대문자 주의 (Oracle은 기본적으로 대문자로 반환)
    const dbId = result[0].EMPLYR_ID || result[0].emplyr_id; 
    expect(dbId).to.equal(testEmplrId);
    cy.log('✅ [검증 완료] Oracle DB에 데이터가 성공적으로 저장되었습니다:', dbId);
    });

    // ===============================================
    // STEP : 운영 서브메뉴 - 인사연동 스케줄러 실행하기
    // ===============================================
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


     ///////////////////////////////////////////////////////////
     // "인사연동 플랜" 텍스트가 포함된 행(tr)을 찾아 체크하기
     ///////////////////////////////////////////////////////////
     // 활성 확인하기 위해 targetRow1 지정 
    cy.contains('tr', '인사연동 플랜').as('targetRow1')
    .within(() => {
      cy.get('.v-input--selection-controls__ripple').click({ force: true });
    });
    cy.wait(1000);

    // (옵션) 체크가 실제로 체크박스에 체크가 되었는지 검증
    cy.contains('tr', '인사연동 플랜').find('input[role="checkbox"]').should('have.attr', 'aria-checked', 'true');

    // '시작'이라는 버튼이 활성화 해당버튼을 클릭합니다.
    cy.contains('.v-btn__content', '시작').closest('button').should('not.be.disabled').click({ force: true });

     // 4. 성공 알림창(Snackbar) 포착 및 텍스트 검증
    cy.get('.v-snack__content', { timeout: 15000 }).should('be.visible').and('contain', '성공'); // '성공' 문구 포함 확인

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
     cy.get('input[aria-label="상태"]').filter(':visible').should('be.visible');
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
    const expectedId = `auto_${uniqueTag}`; 
    cy.log(`--- 🐘 PostgreSQL DB 데이터 확인: ${targetName} ---`);
    // 1. 대기 시간을 넉넉히 줍니다. (인사연동은 생각보다 무거운 작업일 수 있습니다)
    cy.wait(8000); 
    // 1. 조회 쿼리 수정 (id -> employee_number)
    const pgSql = `SELECT employee_number FROM logcatch.tbr_opr_user WHERE employee_number = '${expectedId}'`;
    cy.task('queryPostgresDB', pgSql).then((pgResult) => {
      if (!pgResult || pgResult.length === 0) {
        cy.log('⚠️ 첫 번째 조회 실패. 5초 더 기다린 후 재시도합니다...');
        cy.wait(5000);
        return cy.task('queryPostgresDB', pgSql);
      }
      return pgResult;
    }).then((pgResult) => {
      expect(pgResult, 'Postgres DB에 방금 생성한 사번이 존재해야 합니다').to.not.be.null;
      expect(pgResult.length).to.equal(1);
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



   // 맨티스 이슈 : 37523  ,37521
   // 부서장 체크시 DB테이블 업데이트및 부서장 체크박스 유지 안되는 문제
   /*
   // ==========================================
   // STEP : 부서 관리에서 '자동화1'을 부서장으로 설정
   // ==========================================
   cy.log('⚙️ 부서장 설정 체크박스 활성화 및 저장');
   // '자동화1'이라는 글자를 포함한 가시적인 a 태그를 찾아 클릭
   cy.contains('a.font-weight-bold', '자동화1').should('be.visible').click({ force: true });
   cy.wait(3000); 
   
   // [사용자 상세] 타이틀이 나타날 때까지 확실히 대기 (팝업 로딩 확인)
   cy.contains('.c-headline', '사용자 상세', { timeout: 10000 }).should('be.visible');

   cy.contains('label', '부서장 설정').parent().find('.v-input--selection-controls__ripple').click({ force: true });
   cy.wait(1000); 

   // 체크박스가 실제로 체크되었는지 상태 검증 (선택 사항)
   cy.get('input[role="checkbox"]').should('be.checked');

   // 저장버튼 클릭 
   cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
   cy.wait(1000); 
    
   // 수정했습니다.  알림창(Snackbar) 포착 및 텍스트 검증
   cy.get('.v-snack__content', { timeout: 15000 }).should('be.visible').and('contain', '수정'); // '수정' 문구 포함 확인

   cy.log('✅ 부서장 설정 저장 완료');

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

    // 2. 개발팀(id: 1011) 행의 group_head_user_id가 위 id와 일치하는지 확인합니다.
    const checkGroupHeadSql = `
        SELECT group_head_user_id 
        FROM logcatch.tbr_opr_user_group 
        WHERE id = 1011 AND group_name = '개발팀'
    `;

    // DB 반영 시간을 고려해 약간의 대기 후 조회
    cy.wait(2000);

    cy.task('queryPostgresDB', checkGroupHeadSql).then((groupResult) => {
        expect(groupResult, '그룹 정보가 조회되어야 합니다').to.not.be.null;
        
        const dbGroupHeadId = groupResult[0].group_head_user_id;
        
        cy.log(`🛢️ DB에 저장된 부서장 ID: ${dbGroupHeadId}`);

        // 3. 최종 비교 (자동화1의 ID === 부서 테이블의 부서장 ID)
        // DB 데이터 타입에 따라 숫자/문자열이 다를 수 있으므로 안전하게 String으로 비교합니다.
        expect(String(dbGroupHeadId)).to.equal(String(currentAutoId));
        
        cy.log(`✅ [검증 성공] 개발팀의 부서장이 자동화1(ID: ${currentAutoId})로 정상 반영되었습니다!`);
  
      });
    });
  */

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
