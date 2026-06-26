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

// ==========================================================
// 무적의 로그캐치 공통 로그인 커맨드 (도메인 전환 방어 + 강제 로그아웃 포함)
// ==========================================================
Cypress.Commands.add('login', (userId, password) => {
    cy.log(`🔑 [${userId}] 계정으로 로그인 진행`);

    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(3000);

    // 2. 새로고침 방어 및 세션 처리 통합 로직
    cy.get('body').then(($body) => {
        // [케이스 A] 입력창이 아예 안 보임 (흰 화면 혹은 렌더링 실패)
        if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
            
            // [케이스 B] 이전 세션이 살아있는 경우 (로그아웃 버튼 존재)
            if ($body.text().includes('로그아웃') || $body.text().includes('님')) {
                cy.log('⚠️ 이전 세션 감지, 로그아웃 처리');
                cy.contains('span', '님').should('be.visible').click({ force: true });
                cy.contains('.v-list__tile__title', '로그아웃').should('be.visible').click({ force: true });
                cy.wait(2000);
            } 
            // [케이스 C] 그냥 렌더링 실패인 경우
            else {
                cy.log('🔴 화면 렌더링 실패 감지! 새로고침 후 대기.');
                cy.reload();
                cy.wait(5000); // 새로고침 후 안정화 대기
            }
        } else {
            cy.log('🟢 로그인 화면이 정상적으로 로드되었습니다.');
        }
    });

    cy.clearCookies();
    cy.clearLocalStorage();

    // 4. 입력 및 로그인 시도
    cy.get('input[aria-label="사용자 계정"]').should('exist').clear({ force: true }).type(userId, { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').clear({ force: true }).type(password, { force: true });
    cy.contains('button', '로그인').click({ force: true }); // 엔터보다 클릭이 확실할 때가 많습니다.

    // 5. 중복 로그인 및 경고창 방어 로직 (수정된 부분)
    cy.wait(2000);
    cy.get('body').then(($body) => {
        // 상황 1: 일반 모달(이미 접속 중)
        if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
            cy.log('⚠️ 모달 알림창 발견! 확인 클릭');
            cy.contains('.v-card', '확인').find('button').click({ force: true });
            cy.wait(1000);
        }
        
        // 상황 2: 에러 경고창 (동일 계정 다른 곳 접속) - 이미지 속 상황
        if ($body.find('.v-alert.error:contains("동일 계정으로 다른 곳에서 접속되었습니다."):visible').length > 0) {
            cy.log('⚠️ 동일 계정 접속 경고 감지! 다시 아이디/비번 입력 시도');
            
            // 경고창 닫기 (X 버튼 클릭)
            cy.get('.v-alert.error').find('.v-alert__dismissible').click({ force: true });
            cy.wait(500);

            // 다시 입력 (이미 입력되어 있다면 지우고 재입력)
            cy.get('input[aria-label="사용자 계정"]').clear({ force: true }).type(userId, { force: true });
            cy.get('input[aria-label="패스워드"]').clear({ force: true }).type(password, { force: true });
            cy.contains('button', '로그인').click({ force: true });
            cy.wait(2000);
        }
    });

    // 6. 로그인 성공 검증
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(3000);
    cy.log(`✅ [${userId}] 로그인 완벽 성공!`);
});

// ==========================================================
// 2. 관리자페이지 설정 - 관리자 - 계정관리 - 페이지네이션 노출 개수 변경 커맨드 (새로 추가할 코드)
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

// ==========================================================
// 3. WAS 접속 실패시 재시도 3회 
// ==========================================================
Cypress.Commands.add('visitWithRetry', (url, options = {}, retries = 3) => {
  const attempt = (remaining) => {
    let failed = false;

    const onFail = (err) => {
      if (
        (err.message.includes('ESOCKETTIMEDOUT') || err.message.includes('failed')) &&
        remaining > 0
      ) {
        failed = true;
        Cypress.off('fail', onFail);
        cy.log(`⚠️ 접속 실패. 3초 후 재시도... (남은 횟수: ${remaining - 1})`);
        cy.wait(3000).then(() => attempt(remaining - 1));
        return false; // 에러 삼키기
      }
    };

    Cypress.on('fail', onFail);

    cy.visit(url, { ...options, timeout: 60000, failOnStatusCode: false }).then(() => {
      if (!failed) {
        Cypress.off('fail', onFail);
        cy.log('✅ 페이지 접속 성공');
      }
    });
  };

  attempt(retries);
});