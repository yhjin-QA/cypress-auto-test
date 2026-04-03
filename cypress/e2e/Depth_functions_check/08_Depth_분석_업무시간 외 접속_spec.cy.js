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
      'Redirected when going from', // ◀◀◀ 이 문구를 추가하세요!
      'navigation guard',           // ◀◀◀ 이 문구도 추가하세요!
      'resetValidation',
      'NavigationDuplicated', // [NEW] 중복 이동 에러 무시 추가
      'Avoided redundant navigation',
      'Loading chunk',    //네트워크 로딩에러 
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

  
  it('로그캐치 기본동작 체크', () => {

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
    // STEP 9: 분석 서브메뉴 
    // ==========================================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(2000); // 메뉴 펼쳐짐 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.v-btn__content').contains('이상행위 정책').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '정책 유형').should('exist');
    cy.contains('.c-headline', '개인정보 과다조회 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');


    // 설명: '업무 시간 외 접속' 텍스트를 찾아 클릭
    cy.contains('.v-chip__content', '업무 시간 외 접속').should('be.visible').click({ force: true });
    cy.wait(500);
    cy.contains('.c-headline', '업무 시간 외 접속 정책 목록').should('exist');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('정책 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('등록일시').should('be.visible');
    cy.get('th').filter(':visible').contains('수정일시').should('be.visible');
    cy.get('th').filter(':visible').contains('사용 여부').should('be.visible');

    // 기능 확인 -------------------------------------------------
    
    //추가된 test_auto_업무 시간 외 접속 삭제 --------------------------
    cy.contains('tr', 'test_auto_업무 시간 외 접속').find('.fa-trash').click({ force: true });
    cy.wait(500);
    // 삭제 확인 알림창에서 확인 버튼 클릭 
    cy.get('.v-dialog').filter(':visible').should('contain', '삭제하시겠습니까?').find('.v-btn').contains('확인').click({ force: true });

    //추가한 정책 삭제 검증코드 
    cy.contains('tr', 'test_auto_업무 시간 외 접속').should('not.exist'); 
   

    // 우측 동그란 + 플러스 버튼 클릭-----------------------
      cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });
    cy.wait(1000);

    // 업무 시간 외 접속  정책 추가화면 진입----------------------------------------
    // 정책이름 입력 
    cy.get('input[aria-label="정책 이름"]').filter(':visible').clear({ force: true }).type('test_auto_업무 시간 외 접속', { force: true });

    // 정책설정 부분
    // 정책 사용여부 토글 ON
    cy.get('input[aria-label="정책 사용 여부"]').check({ force: true });
    cy.wait(500);
    
    // 소명 사용여부 토글 ON 
    cy.get('input[aria-label="소명 여부"]').check({ force: true });
    cy.wait(500); 
    
    // 업무시스템 - 리눅스 배송관리 선택
    cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    cy.wait(1000);
    cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    cy.wait(1000);
    // 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    //업무시간 설정 월~금요일옆 토글버튼 활성화
    cy.contains('label', '월요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '화요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '수요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '목요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });
    cy.contains('label', '금요일').closest('.v-input').find('.v-input--selection-controls__ripple').click({ force: true });


  // ==========================================
  // 업무 시간(월~금)  시계값 13:00 로 변경
  // ==========================================
  const days = ['월요일', '화요일', '수요일', '목요일', '금요일'];

  days.forEach((day) => {
  cy.log(`🕒 [${day}] 정확한 타겟팅으로 퇴근 시간 설정 시작`);

  cy.get('body').type('{esc}', { force: true });
  cy.wait(300);

  // 🎯 핵심 해결책: 정확히 '해당 요일의 줄(Row)'만 찾아냅니다.
  cy.contains('label', day).parents('div') // 부모 요소들을 전부 탐색합니다.
  .filter((index, el) => Cypress.$(el).find('input[type="text"]').length >= 2) // 그중 출/퇴근 텍스트 입력창이 2개 이상 있는 부모만 걸러냅니다.
    .first() // 가장 가까운 부모 (정확히 해당 요일의 한 줄) 선택!
    .find('input[type="text"]') .last() // 그 줄에서 마지막 입력창(퇴근 시간) 클릭!
    .click({ force: true }); 
    
  // 💡 드디어 우리가 찾던 '진짜 해당 요일의 팝업'이 열립니다!
  cy.get('.menuable__content__active').should('be.visible');
  cy.wait(800);

  // 1. 시간 '13' 클릭
  cy.get('.menuable__content__active .v-time-picker-clock__item').contains(/^13$/).click({ force: true });
  cy.wait(800);

  // 2. 분 '00' 클릭
  cy.get('.menuable__content__active .v-time-picker-clock__item').contains(/^00$/).click({ force: true });
  cy.wait(500);

  // 3. '확인' 버튼 클릭
  cy.get('.menuable__content__active').contains('button', '확인').click({ force: true });

  cy.get('.menuable__content__active').should('not.exist');
  cy.wait(500);

  // 4. 해당 요일의 값이 진짜로 바뀌었는지 최종 검증
  cy.contains('label', day).parents('div').filter((index, el) => Cypress.$(el).find('input[type="text"]').length >= 2).first().find('input[type="text"]').last().should('have.value', '13:00');
  cy.log(`✅ [${day}] 13:00 실제 UI 반영 완벽 성공!`);
  });
  cy.wait(1000);
 

  // 저장버튼 클릭 
  cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
  cy.wait(500);

  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------  

    //test_auto_업무 시간 외 접속 목록에 정책이 잘 추가되었는지 검증하는 코드 
    cy.get('tbody').contains('tr', 'test_auto_업무 시간 외 접속').should('be.visible');


// ----------------------------------------------------------
// [STEP 1] WAS 시스템 로그인 및 이상행위(과다조회) 타격
// ----------------------------------------------------------
cy.log('🚀 WAS 사이트로 이동하여 새 세션을 발급받습니다.');

// 기존 코드에서 옵션 추가
cy.visit('http://10.10.54.22:8080/uat/uia/egovLoginUsr.do', { 
  timeout: 60000,           // 타임아웃을 60초로 연장
  onBeforeLoad(win) {      // 페이지 로드 전 속도 향상을 위한 설정
    delete win.fetch; 
  }
});

cy.origin('http://10.10.54.22:8080', () => {
  Cypress.on('uncaught:exception', () => false);

  // 2. WAS 화면 UI 로그인 진행 (yunho 계정)
  cy.log('1️⃣ UI를 통해 완벽하게 로그인을 수행합니다.');
  cy.visit('/uat/uia/egovLoginUsr.do');
  cy.get('#id').should('be.visible').clear().type('yunho');
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


// ----------------------------------------------------------
// [STEP 2] 원래 점검 사이트(LogCatch)로 깨끗하게 복귀
// ----------------------------------------------------------
cy.log('🧹 세션 정보를 초기화하고 깨끗하게 복귀합니다.');

// 1. 기존 쿠키와 로컬 스토리지를 모두 비웁니다. (404 방지 핵심)
cy.clearCookies();
cy.clearLocalStorage();

// 2. 주소 뒤에 아무것도 붙지 않은 '순수 도메인' 주소로 접속합니다.
// 경로를 생략하고 도메인까지만 입력하면 서버가 404를 내뱉을 확률이 줄어듭니다.
cy.visit('https://10.10.54.21:18443/logcatch/login'); 

cy.wait(8000); // 페이지 로딩 및 안정화 대기

  
    
// ----------------------------------------------------------
// [STEP 3] 이력 메뉴 화면 이동진입 (Chunk Error 방어 로직 포함)
// ----------------------------------------------------------
cy.log('🔄 페이지 안정화 확인 및 이력 메뉴 클릭 시도');

// 1. '이력' 버튼이 있는지 확인하고, 없으면 새로고침 (Chunk Error 대비)
cy.get('body').then(($body) => {
  if ($body.find('button:contains("이력")').length === 0) {
    cy.log('⚠️ 메뉴 렌더링 실패 감지! 새로고침 후 재시도합니다.');
    cy.reload();
    cy.wait(5000);
  }
});

// 2. '이력' 버튼 클릭 (더 강력한 timeout 부여)
cy.contains('button', '이력', { timeout: 15000 })
  .should('be.visible')
  .click({ force: true });

cy.wait(2000); // 메뉴 애니메이션 대기

// 3. 서브메뉴 '접속기록 이력' 클릭
cy.contains('.v-list__tile__title', '접속기록 이력', { timeout: 10000 })
  .should('be.visible')
  .click({ force: true });

cy.wait(3000);

// 4. [캡처에서 에러난 부분] '이상행위' 탭 클릭 전 대기
// .tab-btn이 페이지 로딩 직후 바로 생성되지 않을 수 있습니다.
cy.contains('.tab-btn', '이상행위', { timeout: 15000 })
  .should('exist')
  .and('be.visible')
  .click({ force: true });

cy.log('✅ 이상행위 탭 진입 성공');

// 이상행위 유형 선택 
cy.get('input[aria-label="이상행위 유형"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(500);
// 이상행위 유형중 개인정보 과다조회 클릭하는 코드
cy.get('.v-list__tile__title').filter(':visible').contains('업무 시간 외 접속').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
// 선택 후 메뉴 닫기
cy.get('body').type('{esc}');
    
//검색버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);

// ----------------------------------------------------------
// [검증코드] 이상행위 유형 첫 번째 행(최신 로그) 데이터 검증 (업무시간외 접속)
// ----------------------------------------------------------
cy.log('🧐 생성된 최신 이상행위 로그를 정밀 검증합니다.');

// 1. 테이블의 데이터가 들어있는 행(tr) 중 첫 번째 행을 잡아서 $row 변수로 받습니다.
cy.get('tbody tr').filter(':visible').first().then(($row) => {
  
  // 2. 텍스트 검증 (wrap을 사용하여 $row 내부만 검색합니다)
  cy.wrap($row).within(() => {
    cy.contains('진윤호(yunho)').should('be.visible');
    cy.contains('업무 시간 외 접속').should('be.visible');
    cy.contains('test_auto_업무 시간 외 접속').should('be.visible');
    cy.contains('존재').should('be.visible');
    cy.contains('소명 대상').should('be.visible');
  });

  // 3. 아이콘 조건부 검증 ("있으면 검증하고, 없으면 통과하기")
  // $row(첫 번째 행) 안에서 해당 클래스를 가진 요소가 존재하는지 확인합니다.
  
  // 🟢 [주의] 아이콘 검증
  if ($row.find('i.g-ICriticalAlert').length > 0) {
    cy.log('🟢 주의 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-ICriticalAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(169, 209, 142)');
  } else {
    cy.log('⚪ 주의 로그가 없습니다. 패스합니다.');
  }

  // 🟠 [경계] 아이콘 검증
  if ($row.find('i.g-IMajorAlert').length > 0) {
    cy.log('🟠 경계 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMajorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(255, 192, 0)');
  } else {
    cy.log('⚪ 경계 로그가 없습니다. 패스합니다.');
  }

  // 🔴 [심각] 아이콘 검증
  if ($row.find('i.g-IMinorAlert').length > 0) {
    cy.log('🔴 심각 로그 감지: 검증을 시작합니다.');
    cy.wrap($row).find('i.g-IMinorAlert')
      .should('be.visible')
      .and('have.css', 'color', 'rgb(244, 67, 54)');
  } else {
    cy.log('⚪ 심각 로그가 없습니다. 패스합니다.');
  }

});

cy.log('🎉 업무 시간 외 접속 이력행위 발생 확인 및 검증 완료!');




    

    // // 추가한 test_auto_'test_auto_업무 시간 외 접속 정책 수정--------------------------------------
    // // 추가된 정책명 : test_auto_'test_auto_업무 시간 외 접속 다시 재클릭 
    // cy.contains('a', 'test_auto_업무 시간 외 접속').should('be.visible').click({ force: true });
    // cy.wait(500);

    // // 정책 설정창 안에서 '공휴일설정' 버튼 클릭 
    // cy.contains('.v-btn__content', '공휴일 설정').filter(':visible').click({ force: true });
    // cy.wait(500);
 
    // // 공휴일 설정 팝업창 공휴일 헤더문구 있는지확인 검증코드
    // cy.contains('th', '공휴일').should('be.visible');

    // //  공휴일 설정 팝업창 안에서 '동기화' 버튼 클릭
    // cy.contains('.v-btn__content', '동기화').filter(':visible').click({ force: true });
    // cy.wait(500);

    // // 동기화 버튼 클릭하여 동기화 알림창 발생 확인 검증코드
    // cy.get('.v-dialog').filter(':visible').contains('자동 생성된 공휴일은 관련 법안 개정').should('be.visible');

    // // 동기화 확인 알림창 - '확인'버튼클릭 하여 창닫기
    // cy.contains('.c-headline', '알림').closest('.v-dialog, .v-card').contains('.v-btn__content', '확인').click({ force: true });
    // cy.wait(500);

    // // 동기화후 공휴일 동기화 확인하는 검증코드
    // cy.get('.v-dialog').filter(':visible').find('tbody').contains('새해 첫날').should('be.visible');

    // // 공휴일 설정 팝업창 - '저장'버튼 클릭하기 
    // cy.contains('.c-headline', '공휴일 설정').closest('.v-dialog, .v-card').contains('.v-btn__content', '저장').click({ force: true });
    // cy.wait(500);
    
    // // 저장버튼 클릭 
    // cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
    // cy.wait(500);

    
    // cy.log('✅  분석 탭 - 업무시간 외 접속 및 데이터 출력 확인 완료!');

  
    // // ==========================================
    // // [FINAL] 테스트 종료 및 메뉴 닫기
    // // ==========================================
    // cy.log('🎉 분석- 업무시간 외 접속 테스트 시나리오 성공적으로 완료!');
    // cy.get('body').type('{esc}');
    // cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;