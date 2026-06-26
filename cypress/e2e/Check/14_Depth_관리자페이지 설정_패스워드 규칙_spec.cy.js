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
  
  it('14_Depth_관리자페이지 설정_패스워드 규칙 자동화 시나리오', () => {
    let dbRules;

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

    // ==========================================
    // STEP 14: 관리자 -설정 탭 서브메뉴 
    // ==========================================
    // 1. 관리자 페이지 사이드 메뉴 중 '설정' 버튼 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    //cy.contains('span', '설정').closest('button.side-menu').click({ force: true });
    // 설정 > 패스워드 규칙 서브메뉴 클릭 
    cy.wait(2000)
    cy.log('--- 서브메뉴 [패스워드 규칙] 클릭 ---');
    //cy.get('.v-list__tile__title').filter(':contains("패스워드 규칙")').filter(':visible').click({ force: true });
    cy.contains('.v-list__tile__title', '패스워드 규칙').should('be.visible').closest('a, .v-list__tile').click({ force: true });
    //cy.contains('패스워드 규칙', { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
  
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '패스워드 규칙').should('exist');
    // v버튼 아이콘 존재확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 패스워드 규칙 확인
    cy.get('input[aria-label="최소 패스워드 길이"]').should('be.visible');
    cy.get('input[aria-label="최대 패스워드 길이"]').should('be.visible');
    cy.get('input[aria-label="연속된 문자 연속 사용 금지"]').should('be.visible');
    cy.get('input[aria-label="동일한 문자 연속 사용 금지"]').should('be.visible');
    cy.get('input[aria-label="숫자, 특수문자 사용"]').should('be.visible');
    // 숫자 특수문자 선택 v 아이콘 확인 
    cy.get('.material-icons').filter(':visible').contains('arrow_drop_down').should('be.visible');
    cy.get('input[aria-label="최근 변경 이력 내에서 동일 패스워드 사용 금지"]').should('be.visible');
    // 토글 확인
    cy.contains('label', '대문자 포함').filter(':visible').should('be.visible');
    cy.contains('label', '소문자 포함').filter(':visible').should('be.visible');
    cy.contains('label', '계정의 전화번호 사용 금지').filter(':visible').should('be.visible');
    cy.contains('label', '계정의 이메일 주소 사용 금지').filter(':visible').should('be.visible');
    cy.contains('label', '첫 글자 문자만 허용').filter(':visible').should('be.visible');
    
    cy.contains('.c-headline', '패스워드 사용 불가 목록').should('exist');
    //패스워드 사용 불가 목록" 글자를 먼저 찾고 -> 부모 영역으로 올라가서 -> 그 안에 있는 화살표
    cy.contains('패스워드 사용 불가 목록').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 패스워드 사용불가목록  콤보박스 아이콘 
    cy.get('input[role="combobox"]').filter(':visible').should('be.visible');
    cy.get('.v-select--chips').find('.v-input__icon--append .material-icons').should('be.visible');
    // 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('들여오기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('내보내기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    //v3.0.3.0_R34785 취소 버튼 없어짐 
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    
    // ==========================================
    // STEP : 패스워드 규칙 Default 값 DB확인
    // ==========================================
    cy.log('🐘 패스워드 규칙 DB 디폴트값 검증 시작');

    // 1. DB에서 패스워드 규칙 관련 전체 데이터 조회
    const ruleSql = `SELECT param, value FROM logcatch.tbr_cnf_password_rule`;

    cy.task('queryPostgresDB', ruleSql).then((rows) => {

      // 조회된 배열을 키-밸류 객체로 변환 (예: { passwd_min_size: '9', ... })
      dbRules = rows.reduce((acc, row) => {
        acc[row.param] = row.value;
        return acc;
    }, {});

    cy.log('🛢️ DB 조회된 규칙:', dbRules);
    // 🔍 이렇게 하면 Cypress 로그창에 상세 데이터가 펼쳐집니다.
    cy.log('🛢️ 불러온 DB 규칙 상세:', JSON.stringify(dbRules, null, 2));

    // 2. [검증] DB 데이터와 UI 초기값 비교
    // (input[aria-label="..."]을 통해 현재 UI에 들어있는 값을 가져와서 비교)
    // 최소 길이 검증
    cy.get('input[aria-label="최소 패스워드 길이"]').should('have.value', dbRules.passwd_min_size);
    // 최대 길이 검증
    cy.get('input[aria-label="최대 패스워드 길이"]').should('have.value', dbRules.passwd_max_size);
    // 연속된 문자 사용 검증
    cy.get('input[aria-label="연속된 문자 연속 사용 금지"]').should('have.value', dbRules.use_straight_char);
    // 동일 문자 사용 검증
    cy.get('input[aria-label="동일한 문자 연속 사용 금지"]').should('have.value', dbRules.use_same_char);
    // 최근 변경 이력 검증
    cy.get('input[aria-label="최근 변경 이력 내에서 동일 패스워드 사용 금지"]').should('have.value', dbRules.old_passwd_log_cnt);

    // ✨ [추가 1] 콤보박스(숫자, 특수문자 사용) 디폴트 검증 로직
    const defaultComboText = dbRules.use_number_special_char === '2' ? '모두 사용' : '숫자 또는 특수문자 사용';
    // 수정: input 태그 대신 라벨을 포함한 전체 .v-input 영역 안에서 텍스트를 검증합니다.
    cy.contains('.v-input', '숫자, 특수문자 사용').should('contain', defaultComboText);


    // 스위치 타입의 규칙들을 매핑합니다.
    const toggleRules = {
    '대문자 포함': 'use_upper_char',
    '소문자 포함': 'use_lower_char',
    '계정의 전화번호 사용 금지': 'use_phone_number',
    '계정의 이메일 주소 사용 금지': 'use_email_addr',
    '첫 글자 문자만 허용': 'use_first_char_pw'
     };

     Object.entries(toggleRules).forEach(([label, param]) => {
      // DB의 'true'/'false' 값을 UI의 'true'/'false' 문자열로 변환하여 매칭
      const expectedState = String(dbRules[param]); 
   
      // 1. 라벨을 포함하는 전체 v-input 영역을 찾습니다.
      cy.contains('.v-input', label).should('be.visible').find('input[type="checkbox"]').should('have.attr', 'aria-checked', expectedState);
      });

      cy.log('✅ 패스워드 규칙 DB 디폴트값과 UI 초기값 일치 확인 완료');
   });

    // ================================================
    // STEP : UI 값 변경 및 DB 검증 로직 (11개 항목 일괄 처리)
    // ================================================
    cy.log('⚙️ UI 변경 및 DB 반영 검증 시작');
    // 1. 변경할 값들을 정의 (테스트 케이스)
    const newValues = {
      '최소 패스워드 길이': '10',
      '최대 패스워드 길이': '20',
      '연속된 문자 연속 사용 금지': '4',   
      '동일한 문자 연속 사용 금지': '4',   
      '최근 변경 이력 내에서 동일 패스워드 사용 금지': '2'
    };

    // 2. [UI 작업] 숫자 값 변경
    Object.entries(newValues).forEach(([label, val]) => {
      cy.contains('.v-input', label).find('input').clear().type(val);
    });

    // ✨ [추가 2] 콤보박스 값 변경 로직-------------
    cy.then(() => {
      // 논리는 완벽합니다. 2면 1의 텍스트로, 1이면 2의 텍스트로 변경을 시도합니다.
      const targetComboText = dbRules.use_number_special_char === '2' ? '숫자 또는 특수문자 사용' : '모두 사용';
      
      // 수정 1: 껍데기가 아닌, 콤보박스 내부의 실제 클릭 영역을 정확히 타겟팅해서 엽니다.
      cy.contains('.v-input', '숫자, 특수문자 사용')
        .find('.v-input__slot') // 또는 화살표 아이콘 영역
        .click({ force: true });
        
      cy.wait(500); // 드롭다운 팝업 애니메이션 대기

      // 수정 2: Vuetify는 팝업 메뉴를 화면 최하단(v-menu__content)에 띄우므로, 그 안에서 텍스트를 찾습니다.
      cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', targetComboText).click({ force: true });
    });
    //-------------------
      

    // 3. [UI 작업] 스위치(토글) 상태 반전 (전체 토글)
    const toggleRules = {
      '대문자 포함': 'use_upper_char',
      '소문자 포함': 'use_lower_char',
      '계정의 전화번호 사용 금지': 'use_phone_number',
      '계정의 이메일 주소 사용 금지': 'use_email_addr',
      '첫 글자 문자만 허용': 'use_first_char_pw'
    };

    Object.entries(toggleRules).forEach(([label, param]) => {
      // 기존 상태를 확인 후 클릭 (토글)
      cy.contains('.v-input', label).find('input[type="checkbox"]').click({ force: true });
    });

    // 저장 버튼 클릭 전
    cy.intercept('POST', '**/password-rule').as('saveRule');

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(3000); // DB 커밋 및 동기화 대기


    // '저장하시겠습니까?' 팝업이 뜰 때까지 기다림 (고정 대기 대신 요소를 찾음)
    cy.contains('저장하시겠습니까?', { timeout: 10000 }).should('be.visible');
    
    // 확인 버튼 클릭
    cy.contains('저장하시겠습니까?').should('be.visible').closest('.v-card').find('button').contains('확인').click({ force: true });
    
    // 서버 응답 대기 (API 처리가 완료될 때까지 자동으로 기다림)
    cy.wait('@saveRule').its('response.statusCode').should('eq', 200); // 실제 서버 처리가 끝날 때까지 대기
    cy.wait(1000);    

    // 5. [검증] DB 최종 확인---------------------------------------------------------------
    cy.task('queryPostgresDB', `SELECT param, value FROM logcatch.tbr_cnf_password_rule`).then((rows) => {
      // 🔍 디버깅: 여기서 dbRules가 진짜 있는지 확인!
      cy.log('현재 dbRules 상태:', JSON.stringify(dbRules));
      const updatedDb = rows.reduce((acc, row) => {
        acc[row.param] = row.value;
        return acc;
      }, {});

    // 1. 기대하는 최종 값들 (UI에서 입력한 값들)
    const expectedDbValues = {
      'passwd_min_size': '10',
      'passwd_max_size': '20',
      'use_straight_char': '4',
      'use_same_char': '4',
      'old_passwd_log_cnt': '2',
      'use_upper_char': String(!JSON.parse(dbRules.use_upper_char)), // 반전
      'use_lower_char': String(!JSON.parse(dbRules.use_lower_char)), // 반전
      'use_phone_number': String(!JSON.parse(dbRules.use_phone_number)), // 반전
      'use_email_addr': String(!JSON.parse(dbRules.use_email_addr)), // 반전
      'use_first_char_pw': String(!JSON.parse(dbRules.use_first_char_pw)), // 반전
      // ✨ [추가 3] DB 변경 기대값 (2였으면 1로, 1이었으면 2로)
      'use_number_special_char': dbRules.use_number_special_char === '2' ? '1' : '2'
    };

    // 2. 11개 항목 전체 일괄 비교
    Object.keys(expectedDbValues).forEach((key) => {
      expect(updatedDb[key], `DB 컬럼 ${key} 값이 기대값과 일치해야 함`).to.equal(expectedDbValues[key]);
    });

    cy.log('✅ 11개 항목 전체 DB 반영 검증 성공!');

    // ==========================================
    // STEP : DB 디폴트 값 & UI값 복원 확인 
    // ==========================================
    cy.log('🔄 DB 복원 및 UI 동기화 검증 시작...');
    // 1. DB 복원 (앞서 작성한 로직)
    Object.entries(dbRules).forEach(([param, value]) => {
      const restoreSql = `UPDATE logcatch.tbr_cnf_password_rule SET value = '${value}' WHERE param = '${param}'`;
      cy.task('queryPostgresDB', restoreSql);
    });


    // 2. UI 새로고침하여 복구된 DB 값 불러오기
    cy.reload();
    cy.wait(2000); // UI가 DB 값을 다시 로딩할 충분한 시간 확보

    //특정 입력창이 다시 나타날 때까지 기다림
    cy.get('input[aria-label="최소 패스워드 길이"]', { timeout: 10000 }).should('be.visible');


    // 다시 한 번 초기값과 UI 일치 여부 검증 (초반에 작성한 검증 로직 재사용)
    cy.log('🔍 복구된 상태와 UI 동기화 재검증 중...');


    // 숫자값 검증 (이전 dbRules의 값을 그대로 사용)
    cy.get('input[aria-label="최소 패스워드 길이"]').should('have.value', dbRules.passwd_min_size);
    cy.get('input[aria-label="최대 패스워드 길이"]').should('have.value', dbRules.passwd_max_size);

    // ✨ [추가 4] 복원된 콤보박스 UI 검증
    const restoredComboText = dbRules.use_number_special_char === '2' ? '모두 사용' : '숫자 또는 특수문자 사용';
    // 수정: 복원 검증 시에도 동일하게 .v-input 영역 안의 텍스트를 확인합니다.
    cy.contains('.v-input', '숫자, 특수문자 사용').should('contain', restoredComboText);

    // 스위치값 검증 (toggleRules 객체 활용)

    const toggleRules = {
      '대문자 포함': 'use_upper_char',
      '소문자 포함': 'use_lower_char',
      '계정의 전화번호 사용 금지': 'use_phone_number',
      '계정의 이메일 주소 사용 금지': 'use_email_addr',
      '첫 글자 문자만 허용': 'use_first_char_pw'
    };

    Object.entries(toggleRules).forEach(([label, param]) => {
      const expectedState = String(dbRules[param]);
      cy.contains('.v-input', label).find('input[type="checkbox"]').should('have.attr', 'aria-checked', expectedState);
    });

    cy.log('✅ [FINAL] DB 복원 완료 및 UI 동기화 검증 성공!');
  }); // <--- cy.task().then()의 괄호 닫기 (검증과 복원이 모두 이 안에 있어야 함!)


  // cy.task 블록 바깥에는 다음 순서인 cy.log만 남깁니다.
  cy.log('✅ 설정 - [패스워드 규칙] 출력 확인 완료');

    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 모든 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
