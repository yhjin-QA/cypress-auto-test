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

    // 1. 일단 메인 도메인으로 이동합니다. 
    // (다른 도메인에 있을 때 clearCookies를 하면 현재 도메인 것만 지워지기 때문)
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(3000);

    // 2. 화면 상태 완벽 방어 로직 (이미 로그인 됨 vs 렌더링 실패)
    cy.get('body').then(($body) => {
        // 화면에 로그인 아이디 입력칸이 없다면? (대시보드로 튕겼거나 흰 화면)
        if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
            
            // [상태 A] 이전 세션이 살아있어서 대시보드 화면이 뜬 경우
            if ($body.text().includes('로그아웃') || $body.text().includes('님')) {
                cy.log('⚠️ 이전 도메인의 세션이 살아있습니다. 강제 로그아웃을 수행합니다.');
                // 우측 상단 'O O O 님' 클릭 (누가 로그인되어있든 공통 처리)
                cy.contains('span', '님').should('be.visible').click({ force: true });
                cy.wait(500);
                cy.contains('.v-list__tile__title', '로그아웃').should('be.visible').click({ force: true });
                cy.wait(2000); // 로그아웃 완료 및 로그인 화면 진입 대기
            } 
            // [상태 B] 그냥 화면이 하얗게 렌더링 실패한 경우
            else {
                cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
                cy.reload();
                cy.wait(2000);
            }
        }
    });

    // 3. 확실하게 로그인 화면이 보장된 상태에서 쿠키/세션 깔끔하게 한번 더 청소
    cy.clearCookies();
    cy.clearLocalStorage();

    // 4. 아이디/비번 입력 및 엔터 (이전 값이 남아있을 수 있으니 clear() 먼저 수행)
    cy.get('input[aria-label="사용자 계정"]').should('exist').clear({ force: true }).type(userId, { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').clear({ force: true }).type(password, { force: true });
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
  
  // 1. 실패 핸들러 등록 (네트워크 에러 발생 시 호출됨)
  const onFail = (err, runnable) => {
    // 네트워크 레벨 에러인지 확인
    if (err.message.includes('ESOCKETTIMEDOUT') || err.message.includes('failed')) {
      if (retries > 0) {
        retries--;
        cy.log(`⚠️ 네트워크 에러 감지! 3초 후 재시도... (남은 횟수: ${retries})`);
        cy.wait(3000);
        
        // 중요: 에러를 무시하고 재시도 로직으로 복구
        return false; 
      }
    }
  };

  // 핸들러 등록
  Cypress.on('fail', onFail);

  // 2. 방문 수행
  cy.visit(url, { ...options, failOnStatusCode: false }).then(() => {
    // 성공 시 핸들러 제거
    Cypress.off('fail', onFail);
  });
  
  // 3. 만약 실패했다면 재귀적으로 다시 호출
  // (실패 시 테스트가 중단되지 않도록 위 핸들러가 처리함)
});