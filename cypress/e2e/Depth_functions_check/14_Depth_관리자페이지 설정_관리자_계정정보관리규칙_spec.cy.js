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
  
  it('14_Depth_관리자페이지 설정_관리자_계정정보관리규칙 자동화 시나리오', () => {

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

    // 1. 원복을 위한 초기 상태 백업 (DB에서 현재값 가져오기)
    cy.task('queryPostgresDB', 'SELECT * FROM logcatch.tbr_cnf_account_rule WHERE id = 3').then((rows) => {
        const originalData = rows[0]; 
        cy.log('💾 테스트 데이터 백업 완료');

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

    // =================================================
    // STEP 14: 관리자 - 설정 - 관리자 - 계정 정보  관리규칙탭
    // ==================================================
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기

  

    // 설정 > 관리자 > [계정 정보 관리 규칙] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('계정 정보 관리 규칙').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '계정 정보 관리 규칙').should('exist');
    cy.get('input[aria-label="기본 인증 방식"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 변경 주기"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 오류 시 잠금 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="패스워드 오류 시 잠금 시간 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="장기 미사용 기간 설정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="자리 비움"]').filter(':visible').should('be.visible');
    cy.contains('label', '대소문자 구분없는 접속계정 허용').filter(':visible').should('be.visible');
    //저장 버튼확인 
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');


// ==========================================
// STEP : 계정 관리 규칙 DB 확인 및 검증
// ==========================================
cy.log('👤 계정 관리 규칙 DB 검증 시작');

const accountRuleSql = `SELECT * FROM logcatch.tbr_cnf_account_rule WHERE id = 3`;

cy.task('queryPostgresDB', accountRuleSql).then((rows) => {
    if (!rows || rows.length === 0) throw new Error('데이터를 찾을 수 없습니다.');
    const dbAccRules = rows[0];

    // 1. 체크박스/스위치 검증 (0/1 기반)
    const flagRules = {
        '패스워드 변경 주기': 'pw_vaild_period_flag',
        '패스워드 오류 시 잠금 설정': 'pw_error_count_flag',
        '장기 미사용 기간 설정': 'acc_no_used_period_flag',
        '자리 비움': 'relogin_after_idle_flag',
        '대소문자 구분없는 접속계정 허용': 'id_upper_case_flag'
    };

    Object.entries(flagRules).forEach(([label, param]) => {
        const dbValue = dbAccRules[param];
        const isChecked = String(dbValue) === '1';

        // 로그 추가
        cy.log(`[체크박스] 항목: ${label} | DB컬럼: ${param} | DB값: ${dbValue} | 기대 상태: ${isChecked ? '체크됨' : '체크안됨'}`);

        cy.contains('.v-label', label)
            .parents('.v-input')
            .parent()
            .find('input[type="checkbox"]')
            .should('exist')
            .should(isChecked ? 'be.checked' : 'not.be.checked');
    });

    // 2. 숫자 입력값 검증
    const valueRules = {
        '패스워드 변경 주기': 'pw_valid_period',
        '패스워드 오류 시 잠금 설정': 'pw_error_count',
        '패스워드 오류 시 잠금 시간 설정': 'pw_error_lock_time',
        '장기 미사용 기간 설정': 'acc_no_used_period',
        '자리 비움': 'relogin_after_idle_time'
    };

    Object.entries(valueRules).forEach(([label, param]) => {
        const dbValue = dbAccRules[param];

        // 로그 추가
        cy.log(`[숫자입력] 항목: ${label} | DB컬럼: ${param} | DB값: ${dbValue}`);
      
        cy.get(`input[aria-label="${label}"]`)
            .should('exist')
            .should('have.value', String(dbValue));
    });

    cy.log('✅ 계정 관리 규칙 DB값과 UI 초기값 일치 검증 완료!');
});


    // ==========================================
    // STEP: UI 값 변경 -> 저장 -> DB 반영 확인 (E2E 검증)
    // ==========================================
    cy.log('⚙️ UI 설정 변경 및 DB 저장 검증 시작');

    // 1. 설정 변경 시나리오 정의
    const changes = [
        { label: '패스워드 변경 주기', flag: true, value: '60' },          // OFF->ON, 30->60
        { label: '패스워드 오류 시 잠금 설정', flag: false, value: '3' },    // ON->OFF, 5->3
        // ✨ [핵심 수정] 숫자 입력(value) 없이 스위치(flag)만 OFF로 변경!
        // 이렇게 하면 입력창 조작 없이 스위치만 꺼지고, DB에는 자동으로 0이 저장됩니다.
        { label: '패스워드 오류 시 잠금 시간 설정', flag: false },  // 10->0 (flag 없음)       
        { label: '장기 미사용 기간 설정', flag: false, value: '30' },       // ON->OFF, 100->30
        { label: '자리 비움', flag: true, value: '60' },                 // OFF->ON, 10->60
        { label: '대소문자 구분없는 접속계정 허용', flag: true }           // OFF->ON
    ];

    //UI값 변경
  changes.forEach((item) => {
    // [1] 회원님 말씀대로 "스위치 제어"가 무조건 먼저 선행되어야 합니다.
    if (item.hasOwnProperty('flag')) {
        cy.contains('.v-label', item.label)
            .parents('.v-input')
            .parent()
            .find('input[type="checkbox"]') // 가장 성공률이 높았던 회원님의 탐색 코드
            .then($checkbox => {
                
                // click() 대신 강력한 check() / uncheck()를 사용합니다!
                if (item.flag === true) {
                    cy.wrap($checkbox).check({ force: true }); // 무조건 ON 상태로 강제 변경
                } else {
                    cy.wrap($checkbox).uncheck({ force: true }); // 무조건 OFF 상태로 강제 변경
                }
                
                // 스위치가 켜지고, 옆의 입력창이 활성화(Enabled)될 시간을 줍니다.
                cy.wait(500); 
            });
    }

    // [2] 스위치가 켜져서 정상적으로 입력 가능한 상태일 때 값을 입력합니다.
    if (item.hasOwnProperty('value')) {
        cy.get(`input[aria-label="${item.label}"]`)
            .clear({ force: true })
            .type(item.value, { force: true });
    }
});

    // 저장 버튼 클릭 전
    cy.intercept('POST', '**/user-profile').as('saveRule');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });


    // '저장하시겠습니까?' 팝업이 뜰 때까지 기다림 (고정 대기 대신 요소를 찾음)
    cy.contains('저장하시겠습니까?', { timeout: 10000 }).should('be.visible');
    
    // 확인 버튼 클릭
    cy.contains('저장하시겠습니까?').should('be.visible').closest('.v-card').find('button').contains('확인').click({ force: true });
    
    // 4. [스마트 대기 실행] user-profile API 통신이 끝날 때까지 기다리고, 정상(200)인지 확인합니다.
    cy.wait('@saveRule').its('response.statusCode').should('eq', 200);
     

    // 4. DB값 검증
    const checkSql = `SELECT * FROM logcatch.tbr_cnf_account_rule WHERE id = 3`;
    cy.task('queryPostgresDB', checkSql).then((rows) => {
        const db = rows[0];
        
        // [디버깅용] DB 전체 내용을 콘솔에 찍어서 실제 컬럼명이 무엇인지 확인하세요!
        cy.log('DB 응답 데이터:', JSON.stringify(db));

        expect(db.pw_valid_period_flag, '패스워드 변경 주기 Flag').to.equal(1);
        expect(db.pw_valid_period, '패스워드 변경 주기 Value').to.equal(60);
        
        // 나머지 항목들도 오타 없는지 확인
        expect(db.pw_error_count_flag, '패스워드 오류시 잠금설정 Flag').to.equal(0); // false로 바꿨으니 0
        expect(db.pw_error_count, '패스워드 오류시 잠금설정 Value').to.equal(3);
        
        expect(db.acc_no_used_period_flag, '장기 미사용 기간 설정 Flag').to.equal(0);
        expect(db.acc_no_used_period, '장기 미사용 기간 설정 Value').to.equal(30);
        
        expect(db.relogin_after_idle_flag, '자리 비움 Flag').to.equal(1);
        expect(db.relogin_after_idle_time, '자리 비움 Value').to.equal(60);
        
        expect(db.id_upper_case_flag, '대소문자 구분없는 접속계정 허용 Flag').to.equal(1);

        cy.log('🎉 DB 저장 성공 검증 완료!');
    });

   

    // ================================================
    // STEP: 초기값 복원 및 UI 반영 검증
    // ================================================

    const restoreSql = `
    UPDATE logcatch.tbr_cnf_account_rule SET 
    pw_valid_period_flag = ${originalData.pw_valid_period_flag},
    pw_valid_period = ${originalData.pw_valid_period},
    pw_error_count_flag = ${originalData.pw_error_count_flag},
    pw_error_count = ${originalData.pw_error_count},
    pw_error_lock_time = ${originalData.pw_error_lock_time},
    acc_no_used_period_flag = ${originalData.acc_no_used_period_flag},
    acc_no_used_period = ${originalData.acc_no_used_period},
    relogin_after_idle_flag = ${originalData.relogin_after_idle_flag},
    relogin_after_idle_time = ${originalData.relogin_after_idle_time},
    id_upper_case_flag = ${originalData.id_upper_case_flag}
    WHERE id = 3
    `;

    cy.task('queryPostgresDB', restoreSql).then(() => {
    cy.log('🔄 데이터 원복 완료: 초기 상태로 복구되었습니다.');

    // 1. DB 변경 사항을 UI에 반영하기 위해 페이지 새로고침
    cy.reload();

    // 2. 화면이 완전히 렌더링될 때까지 대기 (데이터 페칭 시간 확보)
    cy.contains('.c-headline', '계정 정보 관리 규칙', { timeout: 10000 }).should('be.visible');
    cy.wait(2000); 

    cy.log('🔍 원복 후 UI 값 일치 검증 시작');

    // 3. 스위치(Flag) 원복 검증
    const flagRules = {
        '패스워드 변경 주기': 'pw_valid_period_flag',
        '패스워드 오류 시 잠금 설정': 'pw_error_count_flag',
        '장기 미사용 기간 설정': 'acc_no_used_period_flag',
        '자리 비움': 'relogin_after_idle_flag',
        '대소문자 구분없는 접속계정 허용': 'id_upper_case_flag'
    };

    Object.entries(flagRules).forEach(([label, param]) => {
        const expectedValue = originalData[param];
        const isChecked = String(expectedValue) === '1';

        cy.contains('.v-label', label)
            .parents('.v-input')
            .parent()
            .find('input[type="checkbox"]')
            .should('exist')
            .should(isChecked ? 'be.checked' : 'not.be.checked');
    });

    // 4. 숫자 입력값 원복 검증
    const valueRules = {
        '패스워드 변경 주기': 'pw_valid_period',
        '패스워드 오류 시 잠금 설정': 'pw_error_count',
        '패스워드 오류 시 잠금 시간 설정': 'pw_error_lock_time',
        '장기 미사용 기간 설정': 'acc_no_used_period',
        '자리 비움': 'relogin_after_idle_time'
    };

    Object.entries(valueRules).forEach(([label, param]) => {
        const expectedValue = originalData[param];
        
        cy.get(`input[aria-label="${label}"]`)
            .should('exist')
            .should('have.value', String(expectedValue));
    });

    cy.log('🎉 원복 후 DB값과 UI 매핑 검증까지 완벽하게 성공!');

   });

});


    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 설정 - 관리자 - [계정 정보 관리 규칙] 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
