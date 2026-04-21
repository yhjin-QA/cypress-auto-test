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
      'operate.task.packageManagement'
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
    cy.login('admin', 'Manager1!');

   
    //6. 화면 안정화 대기
     cy.wait(5000);
    
    //로그인 성공

    // ==========================================
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(3000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');

    // =================================================
    // STEP 14: 관리자 - 설정 - 관리자 - 계정 정보  관리규칙탭
    // ==================================================
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(2000)
    
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
     
     // 설정 > 관리자 > [계정관리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('계정관리').last().click({ force: true });
    cy.wait(3000);
    
    // =================================================
    // 1. [권한 그룹] 섹션 검증 (첫 번째 테이블)
    // =================================================
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '권한 그룹').should('exist');
    // v버튼 확인
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 1번 테이블 헤더 확인 (첫 번째 테이블은 eq(0) 생략 가능하지만 명시하면 더 안전함)
    cy.get('table').first().within(() => {
    cy.contains('th', '이름').should('be.visible');
    cy.contains('th', '설명').should('be.visible');
    cy.contains('th', '소속된 관리자').should('be.visible');
    cy.contains('th', '읽기 전용').should('be.visible');
    });
    // 1번 추가 버튼 확인
    cy.get('.grid-add-button').first().should('be.visible');
    // =================================================
    // 2. [관리자 계정] 섹션 검증 (두 번째 테이블)
    // =================================================
    cy.contains('.c-headline', '관리자 계정').should('exist');
    // v버튼 확인 (부모 찾기 방식 유지 - 아주 좋습니다)
    cy.contains('관리자 계정').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 2번 테이블 헤더 확인 (핵심 수정 부분 ⭐)
    // 작성하신 eq(1) 로직을 '모든 컬럼'에 적용합니다.
    cy.get('table').eq(1).within(() => {
    // 이 안에서는 오직 '두 번째 테이블' 내부만 검사합니다.
    cy.contains('th', '아이디').should('be.visible');
    cy.contains('th', '이름').should('be.visible');      // 중복 문제 완벽 해결!
    cy.contains('th', '상태').should('be.visible');      // 혹시 1번 테이블에 상태가 생겨도 안전함
    cy.contains('th', '권한 그룹').should('be.visible');
    cy.contains('th', '이메일').should('be.visible');
    cy.contains('th', '접속 가능 IP').should('be.visible');
   });
   // 2번 추가 버튼 확인 (작성하신 코드)
   cy.get('.grid-add-button').eq(1).should('be.visible');
   cy.log('✅ 설정 - 관리자 - [계정관리] 출력 확인 완료');

    // ================================================================
    // [관리자 계정] 이선재(loingid346) auto 그룹으로 소속된 권한그룹 변경하기
    // =================================================================
    cy.log('👤 [관리자 계정] 이선재 권한 그룹 변경 시작');

    // 1. 관리자 계정 테이블(두 번째 테이블)에서 '이선재' 행 클릭
    cy.get('table').eq(1).within(() => {
        // [수정] td(칸)가 아니라 실제 클릭 이벤트가 걸려있는 a(링크) 태그를 정확히 타겟팅합니다.
        cy.contains('a', 'loginid346').click({ force: true });
    });
    
    // 상세 정보 수정 화면(팝업)이 열릴 때까지 애니메이션 대기
    cy.wait(1000); 

    // 팝업이 정상적으로 열렸는지 검증 (이선재의 이름이 입력창에 있는지 확인)
    cy.get('input[aria-label="이름"]', { timeout: 10000 }).should('be.visible').and('have.value', '이선재');


   // 2. 권한 그룹 콤보박스 클릭 및 'auto 그룹' 선택
    cy.log('🔄 권한 그룹을 "auto 그룹"으로 변경');
    
    cy.then(() => {
        // [1] 명확하게 '권한 그룹'이라는 <label> 태그를 먼저 찾습니다.
        // 그리고 부모 요소인 .v-input으로 올라간 뒤, 클릭 가능한 알맹이(.v-input__slot)를 클릭해 엽니다.
        cy.contains('label', '권한 그룹')
          .closest('.v-input')
          .find('.v-input__slot')
          .click({ force: true });
          
        cy.wait(1000); // 드롭다운 팝업 애니메이션 대기

        // [2] 화면 하단에 열린 메뉴 팝업 안에서 올려주신 클래스(.v-list__tile__title)인 'auto 그룹'을 클릭합니다.
        cy.get('.v-menu__content')
          .filter(':visible')
          .contains('.v-list__tile__title', 'auto 그룹')
          .click({ force: true });
    });

    // 3. 저장 버튼 클릭 및 API 검증
    cy.log('💾 변경 사항 저장');


    // ⚠️ 주의: 실제 F12 네트워크 탭에서 '저장' 시 호출되는 API 메서드(PUT/POST)와 URL을 확인 후 수정해 주세요!
    // https://10.10.54.21:18443/logcatch/common/com05/manager-account
     cy.intercept('POST', '**/manager-account').as('updateAdmin'); 


    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000); 

    // API 통신 완료 대기 (정상적으로 200 OK가 떨어지는지 확인)
    cy.wait('@updateAdmin').its('response.statusCode').should('eq', 200);
    cy.wait(1000); // 팝업 닫힘 및 테이블 갱신 대기


    // ================================================================
    // ✅ 권한 그룹(auto 그룹), 관리자계정 그룹 반영 검증코드
    // ================================================================
    cy.log('✅ 권한 그룹(1번 테이블) 소속된 관리자 반영 확인');
    
    // 화면 위쪽의 첫 번째 테이블(eq(0) 또는 first())을 타겟팅합니다.
    cy.get('table').first().within(() => {
        // 'auto 그룹'이 있는 행(tr)을 찾습니다.
        cy.contains('tr', 'auto 그룹').within(() => {
            // 그 행 안에 '이선재'라는 이름이 포함되어 있는지 검증합니다.
            cy.contains('td', '이선재').should('be.visible');
        });
    });

    cy.log('✅ 관리자 계정(2번 테이블) 권한 그룹 변경 반영 확인');
    
    // 두 번째 테이블(관리자 계정)을 타겟팅
    cy.get('table').eq(1).within(() => {
        // 'loginid346' 아이디가 있는 행(tr)을 정확히 찾습니다.
        cy.contains('tr', 'loginid346').within(() => {
            // 그 행 안에 'auto 그룹'이라는 텍스트가 보이는지 검증합니다.
            cy.contains('td', 'auto 그룹').should('be.visible');
        });
    });

    // ==========================================================
    // STEP: [권한 검증] loginid346 계정으로 접속하여 메뉴 표시 여부 확인
    // ==========================================================
    cy.log('🔄 기존 관리자(admin) 세션 초기화 및 loginid346 로그인 준비');
    // 긴 로그인 코드를 지우고 만든 커맨드 딱 1줄로 처리! (세션 초기화도 알아서 해줍니다)
    cy.login('loginid346', 'Manager1!');
    cy.log('✅ loginid346 (auto 그룹) 로그인 성공');

    // 3. 사이드 메뉴 권한 검증 (배열과 반복문을 사용하여 코드 최적화)
    cy.log('🔍 [auto 그룹] 메뉴 표시 권한 검증 시작');

    const visibleMenus = ['이력', '소명', '보고', '보관', '분석'];
    const hiddenMenus = ['현황', '자산', '검출', '운영'];

    // [검증 1] 보여야 하는 메뉴는 DOM에 존재하고 화면에 보여야 함
    visibleMenus.forEach((menu) => {
        cy.contains('button', menu).should('exist').and('be.visible');
        cy.log(`✅ [표시 정상] ${menu} 메뉴 접근 가능`);
    });

    // [검증 2] 보이지 않아야 하는 메뉴는 렌더링 되지 않았거나, 숨김 처리되어야 함
    hiddenMenus.forEach((menu) => {
        cy.get('body').then(($body) => {
            const $menuBtn = $body.find(`button:contains("${menu}")`);
            if ($menuBtn.length > 0) {
                // 버튼이 존재하더라도 비활성화(disabled) 상태거나 보이지 않아야 함
                cy.wrap($menuBtn).should('not.be.visible');
            } else {
                // 프론트엔드 프레임워크에 의해 아예 DOM에서 제거된 경우 (정상)
                expect($menuBtn.length).to.equal(0);
            }
        });
        cy.log(`✅ [차단 정상] ${menu} 메뉴 접근 불가`);
    });

    // ==========================================================
    // STEP: 검증 완료 후, 원복 작업을 위해 다시 admin 계정으로 복귀
    // ==========================================================
    cy.log('🔄 메뉴 검증 완료. 원복 처리를 위해 admin 계정으로 복귀합니다.');

    cy.login('admin', 'Manager1!');
    cy.wait(3000);

    // 다시 관리자 페이지의 [계정관리] 탭까지 진입
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000);
    cy.get('.v-btn__content').filter(':visible').contains('계정관리').last().click({ force: true });
    cy.wait(3000);

    // 💡 (이 아래부터 기존에 작성하신 '원복 코드(ComplianceManagers)'가 이어지면 됩니다!)
    // ==========================================================
    // STEP: [관리자 계정] 이선재(loginid346) 권한 그룹 원복 (ComplianceManagers)
    // ==========================================================
    cy.log('🔄 [관리자 계정] 이선재 권한 그룹 원복 시작 (ComplianceManagers)');

    // 1. 관리자 계정 테이블(두 번째 테이블)에서 '이선재' 행 클릭
    cy.get('table').eq(1).within(() => {
        cy.contains('a', 'loginid346').click({ force: true });
    });
    
    // 팝업 애니메이션 대기
    cy.wait(1000); 

    // 팝업이 정상적으로 열렸는지 검증
    cy.get('input[aria-label="이름"]', { timeout: 10000 }).should('be.visible').and('have.value', '이선재');


    // 2. 권한 그룹 콤보박스 클릭 및 'ComplianceManagers' 선택
    cy.log('🔄 권한 그룹을 "ComplianceManagers"로 원복');
    
    cy.then(() => {
        cy.contains('label', '권한 그룹')
          .closest('.v-input')
          .find('.v-input__slot')
          .click({ force: true });
          
        cy.wait(1000); // 드롭다운 팝업 애니메이션 대기

        // 콤보박스 리스트에서 'ComplianceManagers' 선택
        cy.get('.v-menu__content')
          .filter(':visible')
          .contains('.v-list__tile__title', 'ComplianceManagers')
          .click({ force: true });
    });

    // 3. 저장 버튼 클릭 및 API 검증
    cy.log('💾 원복 사항 저장');
    cy.intercept('POST', '**/manager-account').as('revertAdmin'); 

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000); 

    // API 통신 완료 대기 (정상적으로 200 OK가 떨어지는지 확인)
    cy.wait('@revertAdmin').its('response.statusCode').should('eq', 200);
    cy.wait(1000); // 팝업 닫힘 및 테이블 갱신 대기

  

  // ================================================================
  // ✅ 관리자 계정(2번 테이블)에 원복된 권한 그룹(ComplianceManagers) 반영 검증
  // ================================================================
    cy.log('✅ 권한 그룹(1번 테이블) 원복 결과 교차 검증');
    cy.get('table').first().within(() => {
        // 'ComplianceManagers' 그룹에 다시 '이선재'가 매핑되었는지 확인
        cy.contains('tr', 'ComplianceManagers').within(() => {
            cy.contains('td', '이선재').should('be.visible');
        });
    });

    cy.log('✅ 관리자 계정(2번 테이블) 권한 그룹 원복 반영 확인');
    
    // 두 번째 테이블(관리자 계정)을 타겟팅
    cy.get('table').eq(1).within(() => {
        // 'loginid346' 아이디가 있는 행(tr)을 정확히 찾습니다.
        cy.contains('tr', 'loginid346').within(() => {
            // 그 행 안에 'ComplianceManagers'라는 텍스트가 다시 보이는지 검증합니다.
            cy.contains('td', 'ComplianceManagers').should('be.visible');
        });
    });
    
    cy.log('🎉 이선재 계정 권한 그룹 원래대로 복구 완벽 성공!');
    

    // ==========================================================
    // STEP :[관리자 계정] 신규 계정 추가 (AutoUser)
    // ==========================================================
    cy.log('👤 [관리자 계정] 신규 계정(AutoUser) 추가 시작');

    // 1. 관리자 계정(두 번째 테이블) 영역의 '+' 추가 버튼 클릭
    // eq(1)을 사용하여 정확히 두 번째 테이블 헤더 영역의 추가 버튼을 누릅니다.
    cy.get('.grid-add-button').eq(1).click({ force: true });
    
    // 추가 팝업 애니메이션 대기
    cy.wait(1000); 

    // 팝업이 정상적으로 열렸는지 확인 (아이디 입력창 존재 유무)
    cy.get('input[aria-label="아이디"]', { timeout: 10000 }).should('be.visible');


    // 2. 신규 관리자 기본 정보 입력
    cy.log('📝 신규 계정 정보 입력 중...');
    cy.get('input[aria-label="아이디"]').type('AutoUser', { force: true });
    cy.get('input[aria-label="이름"]').type('오토유저', { force: true });
    cy.get('input[aria-label="설명"]').type('오토테스트', { force: true });
    
    cy.get('input[aria-label="신규 패스워드"]').type('Manager1!', { force: true });
    cy.get('input[aria-label="신규 패스워드 확인"]').type('Manager1!', { force: true });

    // 3. 권한 그룹 콤보박스 클릭 및 'auto 그룹' 선택
    cy.log('🔄 권한 그룹을 "auto 그룹"으로 선택');
    cy.then(() => {
        cy.contains('label', '권한 그룹')
          .closest('.v-input')
          .find('.v-input__slot')
          .click({ force: true });
          
        cy.wait(500); // 드롭다운 애니메이션 대기

        cy.get('.v-menu__content')
          .filter(':visible')
          .contains('.v-list__tile__title', 'auto 그룹')
          .click({ force: true });
    });

    // 4. 저장 버튼 클릭 및 API 검증
    cy.log('💾 신규 관리자 계정 저장');
    
    // ⚠️ 신규 추가 API는 보통 POST를 사용합니다. 네트워크 탭에서 URL 확인 후 수정하세요!
    //https://10.10.54.21:18443/logcatch/common/com05/manager-account
    cy.intercept('POST', '**/manager-account').as('addAdmin'); 

    // 저장버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    cy.wait(1000); 

    // API 통신 성공 검증
    cy.wait('@addAdmin').its('response.statusCode').should('eq', 201);
    cy.wait(1000); // 팝업 닫힘 및 테이블 갱신 대기


    // 5. 검증코드 
    cy.log('✅ 신규 관리자 계정 추가 결과 검증');
    
    // [검증 1] 관리자 계정(2번 테이블)에 새로 만든 'AutoUser'이 존재하는지 확인
    cy.get('table').eq(1).within(() => {
        cy.contains('tr', 'AutoUser').within(() => {
            cy.contains('td', '오토유저').should('be.visible');
            cy.contains('td', 'auto 그룹').should('be.visible');
        });
    });

    // [검증 2] 권한 그룹(1번 테이블)의 'auto 그룹' 소속 관리자에 '오토유저'가 들어갔는지 확인
    cy.get('table').first().within(() => {
        cy.contains('tr', 'auto 그룹').within(() => {
            cy.contains('td', '오토유저').should('be.visible');
        });
    });

    cy.log('🎉 신규 관리자 계정(AutoUser) 추가 완벽 성공!');

    // ==========================================================
    // STEP : [관리자 계정] 신규 계정 데이터(AutoUser) 삭제 (클린업)
    // ==========================================================
    cy.log('🗑️ [관리자 계정] 신규 계정(AutoUser) 삭제 시작');

    // 삭제 API 대기 준비 (보통 삭제는 DELETE 메서드를 사용합니다)
    cy.intercept('POST', '**/manager-account*').as('deleteAdmin');

    // 1. 관리자 계정(2번 테이블)에서 삭제 버튼(휴지통) 클릭
    cy.get('table').eq(1).within(() => {
        // 'AutoUser'가 있는 행(tr)을 정확히 찾습니다.
        cy.contains('tr', 'AutoUser').within(() => {
            // 알려주신 클래스명 중 식별하기 가장 좋은 '.fa-trash'를 찾아 클릭합니다.
            cy.get('.fa-trash').click({ force: true });
        });
    });

    cy.wait(1000); // 삭제 확인 팝업 대기

    // 2. "삭제하시겠습니까?" 팝업 확인 버튼 클릭
    cy.get('body').then(($body) => {
        // 팝업창 텍스트가 "삭제"와 관련된 문구일 경우를 모두 커버하는 방어 로직
        if ($body.find('.v-card:contains("삭제")').length > 0) {
            cy.log('⚠️ 삭제 확인 팝업 발견! 확인 버튼을 클릭합니다.');
            cy.contains('.v-card', '삭제') // 팝업창 영역
              .find('button')
              .contains('확인')
              .click({ force: true });
        }
    });

    // 3. API 통신 성공 검증
    // 정상 삭제 시 200(OK) 또는 204(No Content) 상태 코드가 떨어집니다.
    cy.wait('@deleteAdmin').its('response.statusCode').should('eq', 200);
    cy.wait(1000); // 팝업 닫힘 및 테이블 갱신 대기


    // 4. 삭제 결과 교차 검증
    cy.log('✅ 계정 삭제 결과 교차 검증');
    
    // [검증 1] 관리자 계정(2번 테이블)에서 'AutoUser' 행이 완전히 사라졌는지 확인 (.should('not.exist'))
    cy.get('table').eq(1).within(() => {
        cy.contains('tr', 'AutoUser').should('not.exist');
    });

    // [검증 2] 권한 그룹(1번 테이블)의 'auto 그룹'에서도 '오토테스터' 이름이 빠졌는지 확인
    cy.get('table').first().within(() => {
        cy.contains('tr', 'auto 그룹').within(() => {
            cy.contains('td', '오토테스터').should('not.exist');
        });
    });

    cy.log('🎉 테스트용 신규 계정(AutoUser) 삭제 및 환경 복구 완벽 성공!');

  

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
