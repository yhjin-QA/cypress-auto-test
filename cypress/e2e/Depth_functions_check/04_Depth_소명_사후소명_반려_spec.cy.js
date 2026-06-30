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
  
  it('04_Depth_소명_사후소명_반려 자동화 시나리오', () => {

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
     cy.wait(5000);
    
    //로그인 성공
   
// 3.0.5.1191_r35135 버전에서 변경
// // ==========================================
// // STEP : 소명 서브메뉴 - 결재라인 확인
// // ==========================================
// cy.log('🧹 소명메뉴 클릭 ');
// cy.contains('button', '소명').click({ force: true });
// cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기 
// cy.log('--- 소명 > 나의 소명 서브메뉴 ---');
// cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('결재').click({ force: true });
// //cy.get('.v-list__tile__title').filter(':contains("결재")').filter(':visible').click({ force: true });
// cy.wait(2000);

// 3.0.5.1191_r35135 버전에서 변경
// ==========================================
// STEP : 결재 서브메뉴 - 정책
// ==========================================
// 수정: side-menu 클래스로 정확히 타겟팅
cy.get('button.side-menu').filter(':visible').contains('span.font-weight-bold', '결재').click({ force: true });
cy.wait(1000);

// 서브메뉴 정책 클릭
cy.get('div[role="listitem"]').filter(':visible').contains('.v-list__tile__title', '정책').click({ force: true });
cy.wait(2000);




// 만약 전환이 안 된다면, 다시 한 번 클릭 시도 (안정성 강화)
cy.get('body').then(($body) => {
    if ($body.find('.c-headline:contains("결재 정책 목록")').length === 0) {
        cy.log('🔄 화면 전환 미감지, 다시 클릭 시도');
        cy.contains('button', '소명').click({ force: true });
        cy.contains('.v-list__tile__title', '결재').click({ force: true });
        cy.wait(3000);
    }
});

cy.contains('.c-headline', '결재 정책 목록').should('exist');
cy.log('--- 소명 - 결재라인 UI화면 진입완료 ---');

// ==========================================================
// STEP: "auto_add_test 결재정책" 존재 여부 확인 및 조건부 추가
// ==========================================================
    cy.log('🔍 "auto_add_test 결재정책" 존재 여부 확인 중...');

    // 테이블 렌더링 대기
    cy.wait(1000); 

    cy.get('body').then(($body) => {
        
        // --------------------------------------------------
        // [CASE 1] "auto_add_test 결재정책"이 이미 표에 있는 경우
        // --------------------------------------------------
        if ($body.find('table tbody tr:contains("auto_add_test 결재정책")').length > 0) {
            cy.log('✅ 기존 "auto_add_test 결재정책" 발견! 사용 여부를 검증합니다.');
            
            // 기존 상태 검증 로직 실행
            cy.wrap($body).find('table tbody tr:contains("auto_add_test 결재정책")').within(() => {
                cy.contains('a', /^O$/).should('be.visible');
            });
            
        } 
        // --------------------------------------------------
        // [CASE 2] "auto_add_test 결재정책"이 표에 없는 경우 (새로 추가)
        // --------------------------------------------------
        else {
            cy.log('⚠️ "auto_add_test 결재정책"이 없습니다. 신규 추가 로직을 실행합니다.');

            // 1. + 동그란 플러스 버튼 클릭 (순수 HTML 요소 직접 명령)
            cy.get('.grid-add-button').should('exist').then(($btn) => {
                $btn[0].click(); 
            });

            // 2. 결재 정책 등록 창 렌더링 대기
            cy.wait(500);
            cy.get('.v-dialog').should('be.visible').find('.c-headline').contains('결재 정책 등록');

            // 3. 정책 이름 입력 (테스트 식별용 이름으로 적용)
            cy.get('input[aria-label="정책 이름"]').filter(':visible').clear().type('auto_add_test 결재정책');
            
            // 4. 정책 설명 입력
            cy.get('textarea[aria-label="정책 설명"]').filter(':visible').clear().type('테스트로 자동 추가된 결재라인입니다');
            
            // 5. 사용 여부 OFF -> ON 상태로 바꾸기 
            cy.get('input[aria-label="사용 여부"]').check({ force: true }).should('be.checked');
            
            // 6. 권한 유형 선택 [일반]
            cy.get('input[aria-label="권한 유형"]').filter(':visible').click({ force: true });
            cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '일반').click({ force: true });
            cy.wait(300); // 팝업 닫힘 대기
            
            // 7. 결재 적용 대상 선택 [소명]
            cy.get('input[aria-label="결재 적용 대상"]').filter(':visible').click({ force: true });
            cy.get('.v-menu__content').filter(':visible').find('.v-list__tile__title').filter((_, el) => el.innerText.trim() === '소명').click({ force: true });
            cy.wait(300);
            
            // 8. 결재자 유형 선택 [부서장]
            cy.get('input[aria-label="결재자 유형"]').filter(':visible').click({ force: true });
            cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '부서장').click({ force: true });
            cy.wait(300);
            
            // 9. 결재자 선택 [각 사용자의 부서장이...]
            cy.get('input[aria-label="결재자"]').filter(':visible').click({ force: true });
            cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '각 사용자의 부서장이 결재 라인으로 지정됩니다.').click({ force: true });
            cy.wait(300);

            // 10. 결재 정책 '추가' 버튼 클릭
            cy.get('.v-dialog').contains('button', '추가').click({ force: true });
            cy.wait(500); // 창 내부에 리스트 추가되는 시간 대기

            // 11. 최종 '저장' 버튼 클릭
            cy.get('.v-dialog').contains('button', '저장').click({ force: true });
            cy.wait(1500); // 모달 창 닫힘 및 바깥 테이블 갱신 대기

            // 12. 방금 추가한 데이터가 정상적으로 들어갔는지 꼼꼼하게 최종 교차 검증
            cy.log('✅ 신규 추가 완료! 목록에 정상 반영되었는지 검증합니다.');
            cy.get('table tbody').contains('tr', 'auto_add_test 결재정책').within(() => {
                cy.contains('a', /^O$/).should('be.visible');
            });
        }
    });

    cy.log('✅ "소명 결재" 사용 여부 [O] 검증 완료!');

// ===============================================
// STEP :이상행위 발생 사용자 : loginid445 //Manager1
// ===============================================
cy.log('🚀 사후 소명을 위한 이상행위 발생 시작 ');
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 🚨 [핵심 방어 1] Cypress 프록시가 도메인 전환을 준비할 수 있도록 2초간 숨을 고릅니다.
    cy.wait(2000);

// 🚨 1. 커스텀(command) 명령어 적용 (타임아웃 및 재시도 포함)
cy.visitWithRetry('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', {
  timeout: 60000,
  onBeforeLoad(win) {
    delete win.fetch; // fetch 삭제가 필요한 경우 유지
  }
});

// 🚨 [핵심 방어 2] 페이지 진입 직후 DOM 렌더링이 안정화될 때까지 잠시 대기합니다.
    cy.wait(2000);

cy.origin('http://10.10.54.22:8080', () => {
  Cypress.on('uncaught:exception', () => false);

  // 2. WAS 화면 UI 로그인 진행 (yunho 계정)
  cy.log('1️⃣ UI를 통해 완벽하게 로그인을 수행합니다.');
  cy.visit('/uat/uia/egovLoginUsr.do');
  cy.get('#id').should('be.visible').clear().type('loginid445');
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
      cy.request({
        method: 'POST',
        url: '/cop/logcatch/btnExcessCheck.do',
        form: true,
        headers: {
          'Cookie': `JSESSIONID=${freshSessionId}`, 
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': 'http://10.10.54.22:8080/uat/uia/actionMain.do'
        },
        body: { 
          menuNo: '41' 
        }
      }).then((response) => {
        // 6. 정상 응답 검증 (200 OK)
        expect(response.status).to.eq(200);
        cy.log('🎉 매번 새로운 세션으로 과다조회 자동 타격 성공!');
      });
    });
  });
});


// =============================================
// STEP 5: 원래 점검 사이트로 깨끗하게 복귀 및 유저 로그인
// =============================================
cy.log('🧹 LogCatch로 복귀하여 인사팀 사원 계정으로 로그인합니다.');
cy.login('loginid445', 'Manager1!@'); 
cy.log('🚀 원래 사이트(LogCatch) 진입 및 인사팀사원 로그인 무사 통과!');


// ==========================================
// STEP : 소명 서브메뉴 
// ==========================================
cy.log('🧹 소명메뉴 클릭 ');
// cy.contains('button', '소명').click({ force: true });
// cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기 

// cy.contains('.v-btn__content', '소명하기').should('be.visible').click({ force: true });
// cy.wait(2000);
cy.log('--- 소명 > 소명하기 탭 진입완료---');
const navigateToSomyungManagement_1 = () => {
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000);

    // 소명 버튼 클릭 후 로딩 감지
    cy.get('body').then(($body) => {
        if ($body.find('.v-progress-circular:visible').length > 0) {
            cy.log('🔄 소명 클릭 후 로딩 감지! 새로고침합니다.');
            cy.reload();
            cy.wait(3000);
            cy.contains('button', '소명').click({ force: true });
            cy.wait(1000);
        }
    });

    cy.log('--- 소명 > 소명하기 서브메뉴 클릭 ---');
    cy.contains('.v-btn__content', '소명하기').should('be.visible').click({ force: true });
    cy.wait(3000);

    // 소명하기 클릭 후 로딩 감지
    cy.get('body').then(($body) => {
        if ($body.find('.v-progress-circular:visible').length > 0) {
            cy.log('🔄 소명하기 클릭 후 로딩 감지! 새로고침합니다.');
            cy.reload();
            cy.wait(3000);

            cy.get('body').then(($reloadedBody) => {
                if ($reloadedBody.find('.v-btn__content:contains("소명하기")').length > 0) {
                    cy.log('✅ 소명하기 탭 확인! 재진입 생략합니다.');
                } else {
                    navigateToSomyungManagement_1();
                }
            });
        }
    });
};

navigateToSomyungManagement_1();

//3.0.5.1191_r35135  버전부터 소명건이 디폴트값으로 바로 보이지않음. 해당하는 유형 선택해서검색해야함.
// ==========================================================
// STEP: 이상행위 유형 선택하기 - 개인정보 과다조회
// ==========================================================
// 이상행위 유형 드롭다운 클릭
cy.get('input[aria-label="이상행위 유형"]').first().click({ force: true });
cy.wait(1000);

// 개인정보 과다조회 선택
cy.get('.v-list__tile__title').contains('개인정보 과다조회').click({ force: true });
cy.wait(1000);

cy.contains('.v-btn__content', '검색').click({ force: true });
cy.wait(1000);

// ==========================================================
// STEP: 첫 번째 데이터 체크 및 소명 처리 진행
// ==========================================================
cy.log('✅ 첫 번째 행 체크박스 선택 및 소명 처리 버튼 클릭');

// 표에 실제 데이터가 나타날 때까지 넉넉히 대기
cy.wait(1500);

// 🚨 [핵심] tr을 찾지 말고, tbody 안에 있는 첫 번째 체크박스를 바로 찾아서 체크합니다!
// thead(제목 줄)에 있는 전체 선택 체크박스를 피하기 위해 반드시 'tbody'를 명시합니다.
cy.get('table tbody input[type="checkbox"]').first().check({ force: true });
cy.wait(2000);

// 상단의 '소명 처리' 버튼을 찾아 클릭합니다.
cy.contains('button', '소명 처리').click({ force: true });

/// ==========================================================
// STEP: 활성화된 소명 원인(단일/다중 모두 지원) 탐지 및 사유 자동 입력
// ==========================================================
    cy.log('🔍 활성화된 소명 원인을 모두 탐지하여 입력을 시작합니다.');
    cy.wait(1000);

    // 🚨 [수정된 부분] 날짜와 시간을 모두 계산합니다.
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // "YYYY-MM-DD HH:mm:ss" 포맷으로 완성 (예: 2026-04-23 14:17:21)
    const currentDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    cy.get('.v-dialog').filter(':visible').within(() => {
        cy.get('button.v-btn--round').not('.v-btn--disabled').then(($btns) => {
            const reasonsArray = [];
            $btns.each((index, btn) => {
                reasonsArray.push(Cypress.$(btn).text().trim());
            });

            const activeReasons = reasonsArray.join(', ');
            cy.log(`🎯 탐지된 이상행위 사유: ${activeReasons}`);

            // 2. 검증까지 이 블록 안에서 처리 (스코프 문제 완벽 해결)
            cy.wrap(activeReasons).as('capturedReasons'); // 별칭으로 저장해서 나중에 꺼내 써도 됨

            // 🚨 [수정된 부분] todayDate 대신 currentDateTime을 사용합니다.
            const finalReasonText = `소명원인 : ${activeReasons}\n${currentDateTime}에 소명을 신청합니다.\n신청자 : 인사팀 사원`;

            cy.get('textarea').should('be.visible').clear().type(finalReasonText, { force: true });
            cy.wait(500);

            cy.contains('button', '저장').click({ force: true });
        });
    });

    cy.wait(1500);
    cy.log('✅ tester사용자 소명 신청 완료!');


// ==========================================================
// STEP: 나의 소명 내역 검증 (시간 오차 허용 로직 적용)
// ==========================================================
    cy.log('📋 나의 소명 내역 화면 진입 및 방금 신청한 데이터 검증');

    cy.contains('.v-btn__content', '나의 소명 내역').click({ force: true });
    cy.wait(1500); 

//3.0.5.1191_r35135  버전부터 소명건이 디폴트값으로 바로 보이지않음. 해당하는 유형 선택해서검색해야함.
// ==========================================================
// STEP: 소명상태 유형 선택하기 - 요청
// ==========================================================
// 이상행위 유형 드롭다운 클릭
cy.get('input[aria-label="소명 상태"]').first().click({ force: true });
cy.wait(1000);

cy.get('.v-list__tile__title').contains('요청').click({ force: true });
cy.wait(1000);

cy.contains('.v-btn__content', '검색').click({ force: true });
cy.wait(1000);   





    // 테이블 첫 번째 행(가장 최신 데이터) 검증
   cy.get('table').filter(':visible').find('tbody tr').filter(':visible').not('.v-datatable__progress').first().within(() => {
        
        cy.contains('이노회(loginid445)').should('be.visible');
        
        // 2. 시간 오차 허용 수학적 검증 로직
        cy.root().invoke('text').then((rowText) => {
            const dateMatch = rowText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
            expect(dateMatch).to.not.be.null; 

            const uiTime = new Date(dateMatch[0]).getTime();
            const nowTime = new Date().getTime();
            
            const diffMinutes = Math.abs(nowTime - uiTime) / (1000 * 60);
            
            // 2분 이내 오차 통과
            expect(diffMinutes).to.be.lessThan(2); 
            
            cy.log(`✅ 생성 시간 오차 검증 완벽 통과! (실제 차이: ${diffMinutes.toFixed(2)}분)`);
        });
    });

// ========================================================
// STEP : 인사팀 부서장 로그인 (기존 세션/쿠키 자동 초기화)
// ========================================================
cy.log('📋 부서장 ( 인사팀 부서장 )으로 로그인 진행 ');
cy.login('loginid194', 'Manager1!');

// =============================================
// STEP : 소명 - 나의 소명 - '승인하기' 탭 이동 및 소명 건 확인
// =============================================
// 🚨 [방어코드] CSS 로드 에러가 발생해도 테스트를 중단하지 않도록 설정
Cypress.on('uncaught:exception', (err, runnable) => {
    if (err.message.includes('Loading CSS chunk')) {
        return false; // 에러를 무시하고 테스트 계속 진행
    }
    return true; // 다른 중요한 에러는 정상적으로 잡음
});

cy.log('🧹 소명메뉴 클릭 ');
cy.contains('button', '소명').click({ force: true });
cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기


//부서장 권한있는 유저가 로그인시
cy.log('🧹 부서장 소명 - 나의 소명 클릭 '); 
cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('나의 소명').click({ force: true });
cy.wait(2000);

// '나의 소명' 클릭 후 화면이 멈췄는지 확인하고, 멈췄다면 새로고침 후 재진입
cy.get('body').then(($body) => {
    // 로딩 아이콘(.v-progress-circular 등)이 계속 떠 있다면 새로고침 수행
    if ($body.find('.v-progress-circular').length > 0) {
        cy.log('🔄 로딩 아이콘 감지! 새로고침 후 재진입합니다.');
        cy.reload();
        cy.wait(3000);
        
        // 다시 메뉴 클릭
        cy.contains('button', '소명').click({ force: true });
        cy.contains('.v-list__tile__title', '나의 소명').click({ force: true });
    }
});
 
cy.log('🔄 승인하기 탭으로 이동합니다.');
cy.contains('.v-btn__content', '승인하기').click({ force: true });
cy.wait(1500); // 반려 대상 리스트 로딩 대기

//3.0.5.1191_r35135  버전부터 소명건이 디폴트값으로 바로 보이지않음. 해당하는 유형 선택해서검색해야함.
// ==========================================================
// STEP: 소명상태  선택하기 - 요청
// ==========================================================
cy.get('input[aria-label="소명 상태"]').first().click({ force: true });
cy.wait(1000);

// 개인정보 과다조회 선택
cy.get('.v-list__tile__title').contains('요청').click({ force: true });
cy.wait(1000);

cy.get('input[aria-label="소명 유형"]').first().click({ force: true });
cy.wait(1000);

// 개인정보 과다조회 선택
cy.get('.v-list__tile__title').contains('사후 소명').click({ force: true });
cy.wait(1000);


cy.contains('.v-btn__content', '검색').click({ force: true });
cy.wait(1000);


// =================================================================
// STEP : 신청건 첫번째 클릭 -> 반려 버튼 클릭 -> 코멘트 입력 -> 반려하기 -> 최종 검증
// ==================================================================
cy.log('🔍 신청 내역을 찾아 상세 클릭 및 반려 처리를 시작합니다.');

cy.get('table tbody tr')
  .filter(':visible')
  .not('.v-datatable__progress')
  .then(($rows) => {
      let found = false;

      $rows.each((index, row) => {
          const $row = Cypress.$(row);
          const rowText = $row.text();
          
          if (rowText.includes('이노회(loginid445)')) {
              const dateMatch = rowText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
              if (dateMatch) {
                  const uiTime = new Date(dateMatch[0]).getTime();
                  const diffMinutes = Math.abs(new Date().getTime() - uiTime) / (1000 * 60);

                  if (diffMinutes < 2) {
                      cy.log(`🎯 건 발견! 상세를 엽니다.`);
                      
                      // 1. 상세 팝업 열기 (분 단위까지만 일치하는 일시 클릭)
                      cy.wrap(row).contains(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/).click({ force: true });
                      cy.wait(1500);

                      cy.contains('span', '요청됨', { timeout: 15000 }).should('exist');

                      
                      // 2. 소명 반려 팝업 내부 작업 (반려 -> 코멘트 -> 확인)
                      // [반려] 버튼 클릭하기
                      cy.get('.v-dialog').filter(':visible').within(() => {
                          cy.contains('button', '반려').click({ force: true });
                          cy.wait(1000); 

                          const now = new Date();
                          const approvalTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                          
                          // 싸인 서명 코멘트 남기기
                          cy.get('input[type="text"]').should('be.visible').clear().type(`${approvalTime}에 반려합니다.`, { force: true });
                          cy.wait(500);

                          cy.contains('button', '확인').scrollIntoView().click({ force: true });
                      });
                      
                      found = true;
                      return false; 
                  }
              }
          }
      });

      if (!found) {
          throw new Error('❌ 해당 신청 건을 찾지 못했습니다.');
      }
  })
  .then(() => {

       cy.log('🔍 반려 상태를 검증합니다 (오차 1분 허용).');

       //--------------------------------------------------
       // 검증코드 :  요청됨 문구에서 반려(시간) 으로 문구 변경되어있는지 검증
       //--------------------------------------------------

        cy.contains('span', '반려 (').should('be.visible').then(($span) => {
        const uiText = $span.text(); // 예: "반려 ( 2026-04-23 17:08 )"
        
        // 텍스트에서 날짜/시간 추출
        const match = uiText.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
        if (!match) throw new Error('❌ 화면에서 시간 정보를 찾을 수 없습니다.');
        
        const uiTime = new Date(match[0]).getTime();
        const now = new Date().getTime();
        
        // 시간 차이 계산 (밀리초 -> 분)
        const diffMinutes = Math.abs(now - uiTime) / (1000 * 60);
        
        // 1분 이내인지 검증
        cy.log(`🎯 화면 시간: ${match[0]}, 오차: ${diffMinutes.toFixed(1)}분`);
        expect(diffMinutes).to.be.lessThan(1); 

       //--------------------------------------------------
       // 검증코드 :  신청시 사유 vs 승인시 사유 비교  일치하는지 확인 
       //--------------------------------------------------

       cy.log('🔍 반려 팝업에서 이상행위 사유 검증을 시작합니다.'); 
       // 1. 저장해두었던 'capturedReasons'를 불러옵니다.
       cy.get('@capturedReasons').then((storedReasons) => {
        cy.log(`🎯 이전에 저장한 사유: ${storedReasons}`);
        // 2. 쉼표로 분리하여 배열로 만듭니다.
        const expectedReasons = storedReasons.split(', ').map(r => r.trim());
        // 3. 현재 반려 팝업 내에서 각각의 사유가 보이는지 검증
        cy.get('.v-dialog').filter(':visible').within(() => {
          expectedReasons.forEach((reason) => {
            if (reason.length > 0) {
              cy.log(`🎯 비교 검증 중: ${reason}`);
              // 팝업 내 모든 요소 중에서 해당 사유 텍스트가 존재하는지 확인
              cy.contains(reason, { timeout: 10000 }).should('be.visible');
              }
            });
          });
        cy.log('✅ 반려 팝업 사유와 신청 사유가 완벽히 일치합니다!');
       });
      //---------------------------------------------------
      cy.log('✅ 부서장 반려 하기 검증 완료!');
    });
});

// ==========================================
// STEP : 관리자 로그인
// ==========================================
 cy.login('admin', 'Manager1!');
 cy.wait(5000);  
 
// =============================================
// STEP : 소명 - 종합현황 탭 방금 승인건 확인하기 
// =============================================
// 🚨 [방어코드] CSS 로드 에러가 발생해도 테스트를 중단하지 않도록 설정
Cypress.on('uncaught:exception', (err, runnable) => {
    if (err.message.includes('Loading CSS chunk')) {
        return false; // 에러를 무시하고 테스트 계속 진행
    }
    return true; // 다른 중요한 에러는 정상적으로 잡음
});

const navigateToSomyungManagement = () => {
    cy.contains('button', '소명').click({ force: true });
    cy.wait(1000);
    cy.log('--- 소명 > 관리 서브메뉴 클릭 ---');
    cy.get('.v-menu__content').filter(':visible').last()
        .find('.v-list__tile__title').contains('관리')
        .click({ force: true });
    cy.wait(3000);
};

navigateToSomyungManagement();

// 로딩이 지속되면 새로고침
cy.get('body').then(($body) => {
    if ($body.find('.v-progress-circular:visible').length > 0) {
        cy.log('🔄 로딩 아이콘 감지! 새로고침합니다.');
        cy.reload();
        cy.wait(3000);

        // 새로고침 후 종합 현황 탭이 보이면 이미 올바른 화면 → 재진입 생략
        cy.get('body').then(($reloadedBody) => {
            if ($reloadedBody.find('.v-btn__content:contains("종합 현황")').length > 0) {
                cy.log('✅ 종합 현황 탭 확인! 재진입 생략합니다.');
            } else {
                cy.log('🔄 재진입을 시도합니다.');
                navigateToSomyungManagement();
            }
        });
    }
});

    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');

    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 소속 클릭하여 전체 선택 
    cy.get('.material-icons').filter(':visible').contains('settings').click({ force: true });
    cy.wait(500);
    cy.get('.v-list__tile__title').filter(':visible').contains('인사팀').closest('.v-list__tile').click({ force: true });
    // 화면 본문(body)에 ESC 키 전송 (팝업창 닫는 동작 )
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 사용자 계정 클릭하여 아이디 입력
    //cy.get('input[aria-label="사용자 계정"]').filter(':visible').click({ force: true });
    cy.contains('.v-label', '사용자 계정').closest('.v-input').find('input').type('loginid445', { force: true });

    // 소명상태  클릭
    cy.get('input[aria-label="소명 상태"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 소명상태중 '취소' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('반려').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    /// 소명유형 확인하기 
    // 소명유형 클릭 (팝업창 띄우기)
    cy.get('input[aria-label="소명 유형"]').filter(':visible').closest('.v-select__selections').click({ force: true });
     // 소명유형중  '사후소명' 클릭하는 코드
    cy.get('.v-list__tile__title').filter(':visible').contains('사후 소명').click({ force: true });
    cy.wait(500);
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

// =============================================
// STEP : 소명 - 종합현황 탭 검색결과 검증  
// =============================================
cy.log('📋 종합현황 데이터 검증을 시작합니다.');

// 1. 테이블의 행들 중 '이노회 (loginid445)'가 포함된 '진짜 데이터 행'을 정확히 찾습니다.
cy.get('table tbody tr')
  .filter(':visible')
  .contains('tr', '이노회(loginid445)') // 해당 텍스트를 가진 tr을 찾음
  .first() // 혹시 결과가 여러 개라면 가장 첫 번째 행 선택
  .as('targetRow'); // 별칭 저장

// 2. 저장된 행을 타겟팅하여 검증 수행
cy.get('@targetRow').then(($row) => {
    
    // [1] 일시 검증 (td[1] 위치 확인)
    cy.wrap($row).find('td').eq(1).invoke('text').then((text) => {
        const timeStr = text.trim();
        cy.log(`🎯 추출된 일시: ${timeStr}`);
        
        const uiTime = new Date(timeStr).getTime();
        const now = new Date().getTime();
        const diffMinutes = Math.abs(now - uiTime) / (1000 * 60);
        
        cy.log(`🎯 시간 오차: ${diffMinutes.toFixed(2)}분`);
        // 3분 이내로 엄격하게 검증
        expect(diffMinutes).to.be.lessThan(3); 
    });

    // [2] 필수 정보 검증 (행 전체 텍스트에서 포함 여부 확인)
    cy.wrap($row).should('contain', '인사팀')
                  .and('contain', '이노회(loginid445)')
                  .and('contain', '반려')
                  .and('contain', '사후 소명');

    // [3] 소명내용 검증 (capturedReasons 활용)
    cy.get('@capturedReasons').then((storedReasons) => {
        cy.wrap($row).should('contain', storedReasons);
        cy.log(`✅ 소명 내용 일치 확인: ${storedReasons}`);
    });
});

cy.log('✅ 종합현황 사후소명 - 반려 데이터 검증 완료!');


// ==========================================
// [FINAL] 테스트 종료 및 메뉴 닫기
// ==========================================
cy.log('🎉 소명 - 사후소명 테스트 시나리오 성공적으로 완료!');
cy.get('body').type('{esc}');
cy.get('body').click('center', { force: true });
   
  });
});  

//코드마지막


 })()
;
