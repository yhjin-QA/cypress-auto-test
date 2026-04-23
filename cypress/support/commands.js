// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// ====================================================================
// 1. 로그캐치 공통 로그인 커맨드 (세션 초기화 + 화면 렌더링 방어 + 중복 팝업 방어)
// =====================================================================
Cypress.Commands.add('login', (userId, password) => {
    cy.log(`🔑 [${userId}] 계정으로 로그인 진행`);

    // 1. 기존 세션 깔끔하게 초기화 (강제 로그아웃 효과)
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => { win.sessionStorage.clear(); });

    // 2. 로그인 페이지 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(3000);

    // 3. 간헐적 흰 화면(렌더링 실패) 방어 로직
    cy.get('body').then(($body) => {
        if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
            cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
            cy.reload();
            cy.wait(2000);
        }
    });

    // 4. 아이디/비번 입력 및 엔터
    cy.get('input[aria-label="사용자 계정"]').should('exist').type(userId, { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').type(password, { force: true });
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });

    // 5. 중복 로그인 알림창 방어 로직
    cy.wait(2000);
    cy.get('body').then(($body) => {
        if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
            cy.log('⚠️ 알림창 발견! 확인 버튼을 클릭합니다.');
            cy.contains('.v-card__title', '이미 접속 중인 계정입니다.').closest('.v-card').contains('확인').click({ force: true });
            cy.wait(1000);
        }
    });

    // 6. 로그인 성공 검증 및 대기
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(3000);
    cy.log(`✅ [${userId}] 로그인 완벽 성공!`);
});

// ==========================================================
// 2. 페이지네이션 노출 개수 변경 커맨드 (새로 추가할 코드)
// ==========================================================
Cypress.Commands.add('changePageRow', (targetCount = '10') => {
    cy.log(`📄 페이지네이션 노출 개수를 [${targetCount}]개로 변경 시도`);
    cy.wait(500); 

    cy.get('body').then(($body) => {
        const currentVal = $body.find('.v-select__selection').last().text().trim();

        if (currentVal !== targetCount.toString()) {
            cy.log(`🔄 현재 ${currentVal}개 노출. ${targetCount}개로 변경합니다.`);
            
            cy.wrap($body).find('.v-select__selection').last().click({ force: true });
            cy.wait(500); 

            cy.get('.v-menu__content')
              .filter(':visible')
              .last()
              .contains('.v-list__tile__title', targetCount.toString()) 
              .closest('a, div.v-list__tile')
              .click({ force: true });

            cy.wait(1500); 
            cy.log(`✅ ${targetCount}개 노출로 변경 완료!`);
        } else {
            cy.log(`✅ 이미 ${targetCount}개 노출 상태입니다. 패스합니다.`);
        }
    });
});