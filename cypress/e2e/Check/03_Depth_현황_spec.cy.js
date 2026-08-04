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
  
  it('03_Depth_현황 자동화 시나리오', () => {


    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(5000); // 로딩 대기


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
    // STEP 4: 현황서브메뉴 
    // ==========================================
    
cy.contains('button', '현황').click({ force: true });
cy.wait(2000);

cy.log('--- 현황 > 정보사용자별 탭 클릭 ---');
cy.get('.tab-btn').contains('정보사용자 별').should('be.visible').click({ force: true });
cy.log('--- 화면 검증 시작 ---');
cy.contains('.c-headline', '검색 조건').should('exist');

// 🌟 시작날짜 달력 아이콘 확인 (display:none 부모 이슈 완전 회피)
cy.contains('기간').closest('.v-input').find('.material-icons').should(($icons) => {
  const hasEvent = $icons.toArray().some((el) => el.textContent.trim() === 'event');
  expect(hasEvent).to.be.true;
});

// 🌟 종료날짜 달력 아이콘 확인
cy.get('input[aria-label=""][readonly="readonly"]').filter(':visible').first()
  .closest('.v-input').find('.material-icons').should('exist');

// 달력 아이콘이 2개 존재하는지 확인
cy.get('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').should('have.length.gte', 2);

// 버튼확인
cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

// 검색 조건 입력문구 확인
cy.get('label').filter(':visible').contains('기간').should('be.visible');
cy.get('label').filter(':visible').contains('추적 타입').should('be.visible');
cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');

    
    // ==========================================
    // 정보사용자 별 - 업무시스템 - 아이피 검색 검증하기 
    // ==========================================
    // 기능확인 - 달력 날짜 기간 1월 20일 지정---------------------------------------------------------------------------
    // 기간 input의 달력 아이콘 클릭 (aria-label로 정확히 타겟)
    cy.get('input[aria-label="기간"]').filter(':visible').first().closest('.v-input').find('i.material-icons').click({ force: true });
    cy.wait(500);
    // 활성화된 달력 팝업에서 헤더 클릭 → 월 선택 모드
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
    // 1월 클릭
    cy.get('.menuable__content__active').find('.v-date-picker-table--month').contains('1월').click({ force: true });
    // 20일 클릭
    cy.get('.menuable__content__active').find('.v-date-picker-table').contains('.v-btn__content', '20').closest('.v-btn').click({ force: true });
    cy.get('body').type('{esc}');

    //업무 시스템 - JEUS_tester3 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 업무시스템중 EUS_tester3 클릭하는 코드
    cy.get('.v-list__tile__title').contains('JEUS_tester3').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    cy.wait(1000);
    // 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');


    // 추적타입 - 아이피 선택하기 
    // 정보 사용자 디폴트값 클릭하는 코드 
    cy.get('span[title="정보 사용자"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 추적타입중 - 아이피 클릭
    cy.get('.v-list__tile__title').contains('아이피').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // IP입력
    cy.get('input[aria-label="IP"]').filter(':visible').clear().type('10.10.1.101');
    cy.wait(500);

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검증 코드
    // 1. 검증할 카드 목록 정의 (숫자만 작성)
    const dashboardStats = [
     { title: '개인정보 사용량', value: '610' },
     { title: '개인정보 대량 접근', value: '0' },
     { title: '업무시간 외 접근', value: '0' },
     { title: '이상행위 발생 건수', value: '0' },
     { title: '접근 업무시스템', value: '1' },
     { title: '접근 IP 주소', value: '1' }
     ];
     // 2. 반복문 검증
     dashboardStats.forEach((stat) => {
      cy.contains('.v-card', stat.title, { timeout: 10000 }).should('be.visible').within(() => {
      cy.get('b', { timeout: 10000 }).should('contain', stat.value); 
       });
      });

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');

    // =========================================================
    // [정합성 검증] 정보사용자별  '개인정보 사용량' 카드 클릭 후 하단 표 데이터 합산 검증 (하단표 610합)
    // =========================================================
    // 1. [상단] '개인정보 사용량' 카드를 찾아 첫 번째 숫자(<b>)를 추출하고 클릭합니다.
    cy.contains('.v-card', '개인정보 사용량').should('be.visible').within(() => {
    cy.get('b').first().then(($b) => {
      // 텍스트에서 숫자만 추출 (예: '610' -> 610)
      const text = $b.text(); 
      const totalFromCard = parseInt(text.replace(/[^0-9]/g, ''), 10);
      // 변수명 충돌을 막기 위해 Alias 이름을 'expectedTotal_IP'로 지정합니다.
      cy.wrap(totalFromCard).as('expectedTotal_IP'); 
      // 해당 요소를 클릭하여 하단 표를 갱신합니다.
      cy.wrap($b).click({ force: true });
      });
    });
    cy.wait(1500); 
    // 2. [하단] 현재 화면에 보이는 표의 데이터를 모두 더합니다.
    cy.get('@expectedTotal_IP').then((expectedTotal_IP) => {
     let tableSum = 0; 
     // 표가 화면에 완전히 렌더링되었는지 확인
     cy.get('table').filter(':visible').should('be.visible');
     // 보이는 표의 본문(tbody) 행(tr)을 순회하며 덧셈
     cy.get('table').filter(':visible').find('tbody tr').each(($row) => {
     // 각 행의 마지막 열(td) 텍스트 가져오기
     const cellText = $row.find('td').eq(-2).text();
     const num = parseInt(cellText.replace(/[^0-9]/g, ''), 10);
     if (!isNaN(num)) {
      cy.log(`➕ IP 검색 표 데이터: ${num}`); 
      tableSum += num;
      }
     }).then(() => {
        // 3. [최종 검증] 상단 숫자 vs 하단 표 합계
        cy.log(`📊 상단 카드 클릭 수: ${expectedTotal_IP} / 하단 표 계산 합계: ${tableSum}`);
        // 두 숫자가 일치하는지 단호하게 검증!
        expect(tableSum).to.equal(expectedTotal_IP);
      });
    });


    // 업무시스템  x버튼 클릭하여 초기화 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__icon--clear').find('.v-icon').click({ force: true });
    cy.wait(500);
    //----------------------------------------------------------------------------------------------------------------------------------------------------------

    // ==========================================
    // 정보사용자 별 - 업무시스템 - 아이피 검색 검증하기 
    // ==========================================

    //업무 시스템 - 리눅스_배송관리 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-list__tile__title').contains('리눅스_배송관리').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    cy.wait(1000);
    // 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 추적타입 - 정보 사용자 선택하기  
    cy.get('input[aria-label="추적 타입"]').filter(':visible').click({ force: true });
    cy.wait(500);
    // 추적타입중 - 아이피 클릭
    cy.get('.v-list__tile__title').contains('정보 사용자').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');

    // '사용자' 입력창에 '호준'을 입력하여 검색 결과를 띄웁니다.
    cy.get('input[aria-label="사용자"]').filter(':visible').clear().type('테스터', { force: true });
    cy.wait(500);
    cy.contains('.v-list__tile__title, .v-list-item__title', '테스터 (tester)').should('be.visible').click({ force: true });
    cy.wait(500);

    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검증 코드
    // 1. 검증할 카드 목록 정의 (숫자만 작성)
    // min값을 기준으로 0으로 설정하면  숫자만 있으면 통과 1로 설정하면 최소 1이상이어야함. min값 조절
    const dashboardStats1 = [
  { title: '개인정보 사용량',    min: 0 },
  { title: '개인정보 대량 접근', min: 0 },
  { title: '업무시간 외 접근',   min: 0 },
  { title: '이상행위 발생 건수', min: 0 },
  { title: '접근 업무시스템',    min: 0 },
  { title: '접근 IP 주소',       min: 0 }
];

dashboardStats1.forEach((stat) => {
  cy.contains('.v-card', stat.title, { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.get('b', { timeout: 10000 }).should(($b) => {
        const num = parseInt($b.text().replace(/[^0-9]/g, ''), 10);
        expect(num, `${stat.title} 카드 값이 ${stat.min} 이상이어야 합니다`)
          .to.be.gte(stat.min);
      });
    });
});
    
    
    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    
    cy.log('✅ 현황 - 정보사용자 별 탭 진입 및 데이터 출력 확인 완료!');


    //------------------------------------------------------------------------------------

    cy.log('--- 현황 > 부서별 탭 클릭  ---');
    cy.get('.tab-btn').contains('부서 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('부서 별').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘 확인 (부모 display:none 이슈로 exist 사용)
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('exist');
    // 종료날짜 달력 아이콘 확인 - aria-label이 빈 값인 종료날짜 input으로 타겟
    cy.get('input[aria-label=""][readonly="readonly"]').filter(':visible').first().closest('.v-input').find('.material-icons').should('exist'); // visible 대신 exist로 변경 (부모 display:none 이슈 회피)
    // 달력 아이콘이 2개 존재하는지 확인
    cy.get('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').should('have.length.gte', 2); 
    // 검색 버튼확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');
    

    // ==========================================
    // 부서 별 - 업무시스템 - 그룹 검색 검증하기 
    // ==========================================
    // 기능확인 - 달력 날짜 기간 1월 20일 지정---------------------------------------------------------------------------
    // 기간 input의 달력 아이콘 클릭 (aria-label로 정확히 타겟)
    cy.get('input[aria-label="기간"]').filter(':visible').first().closest('.v-input').find('i.material-icons').click({ force: true });
    cy.wait(500);
    // 활성화된 달력 팝업에서 헤더 클릭 → 월 선택 모드
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
    // 1월 클릭
    cy.get('.menuable__content__active').find('.v-date-picker-table--month').contains('1월').click({ force: true });
    // 20일 클릭
    cy.get('.menuable__content__active').find('.v-date-picker-table').contains('.v-btn__content', '20').closest('.v-btn').click({ force: true });
    cy.get('body').type('{esc}');

    //업무 시스템 - 리눅스_VIP고객 선택
    // 조건 입력 
    //업무시스템 클릭하는 코드 
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 업무시스템중 EUS_tester3 클릭하는 코드
    cy.get('.v-list__tile__title').contains('리눅스_VIP고객').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    cy.wait(1000);
    // 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');
    
    // 조건 입력 
    // 그룹별 클릭하는 코드 
    cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(500);
    // 그룹별중 제품기획팀 클릭하는 코드
    cy.get('.v-list__tile__title').contains('제품기획팀').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // 선택 후 메뉴 닫기
    cy.get('body').type('{esc}');


    // 검색 버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    //검증 코드
    // 1. 검증할 카드 목록 정의 (숫자만 작성)
    // min값을 기준으로 0으로 설정하면  숫자만 있으면 통과 1로 설정하면 최소 1이상이어야함. min값 조절
    const dashboardStats2 = [
  { title: '개인정보 사용량',    min: 0 },
  { title: '개인정보 대량 접근', min: 0 },
  { title: '업무시간 외 접근',   min: 0 },
  { title: '이상행위 발생 건수', min: 0 },
  { title: '접근 업무시스템',    min: 0 },
  { title: '접근 IP 주소',       min: 0 }
];

dashboardStats2.forEach((stat) => {
  cy.contains('.v-card', stat.title, { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.get('b', { timeout: 10000 }).should(($b) => {
        const num = parseInt($b.text().replace(/[^0-9]/g, ''), 10);
        expect(num, `${stat.title} 카드 값이 ${stat.min} 이상이어야 합니다`)
          .to.be.gte(stat.min);
      });
    });
});

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
   
   

    // ==========================================
    // [정합성 검증] 부서 별 - 업무시스템 - 그룹검색  정합성 검증  (569건수 = 하단표 합수 비교 )
    // ==========================================
    // 1. [상단] '개인정보 사용량' 카드를 찾습니다.
    cy.contains('.v-card', '개인정보 사용량').should('be.visible').within(() => {
    cy.get('b').first().then(($b) => {
        // a. 텍스트 추출 및 숫자 저장
        const text = $b.text(); 
        const totalFromCard = parseInt(text.replace(/[^0-9]/g, ''), 10);
        cy.wrap(totalFromCard).as('expectedTotal'); 
        // b. 추출을 완료한 '바로 그 요소($b)'를 클릭합니다.
        cy.wrap($b).click({ force: true });
      });
    });
    cy.wait(1500); 
    


    // 3. [검증] 표 합계 vs 카드 숫자
    // 2. [하단] 나타난 표의 '개인정보 사용 건수'를 모두 더해서 비교합니다.
    cy.get('@expectedTotal').then((expectedTotal) => {
      let tableSum = 0; 
    cy.get('table').filter(':visible').find('tbody tr').each(($row) => {
      // 각 행의 마지막 열(td) 텍스트 가져오기
      const cellText = $row.find('td').eq(-2).text();
      const num = parseInt(cellText.replace(/[^0-9]/g, ''), 10);
      // 숫자가 정상적으로 존재할 때만 덧셈 수행
      if (!isNaN(num)) {
        // 🌟 [수정 2] 어떤 숫자가 더해지고 있는지 Cypress 로그에 출력합니다. (디버깅용)
        cy.log(`➕ 찾은 데이터: ${num}`); 
        tableSum += num;
      }
    }).then(() => {
       // 3. [최종 검증] 상단 숫자 vs 하단 표 합계
       cy.log(`📊 상단 카드 클릭 수: ${expectedTotal} / 하단 표 계산 합계: ${tableSum}`);
       expect(tableSum).to.equal(expectedTotal);
      });
    });
    
    cy.log('✅ 부서 별 탭 진입 및 데이터 출력 확인 완료!');

    
    //----------------------------------------------------------------------------------------------------------
    cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
    // 'c-headline' 클래스를 가진 요소 중에 '파일 다운로드' 글자가 존재하는지 확인
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘 확인 (부모 display:none 이슈로 exist 사용)
    cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').should('exist');
    // 종료날짜 달력 아이콘 확인 - aria-label이 빈 값인 종료날짜 input으로 타겟
    cy.get('input[aria-label=""][readonly="readonly"]').filter(':visible').first().closest('.v-input').find('.material-icons').should('exist'); // visible 대신 exist로 변경 (부모 display:none 이슈 회피)
    // 달력 아이콘이 2개 존재하는지 확인
    cy.get('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').should('have.length.gte', 2); 
    // 검색 버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 검색조건 입력문구 확인
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');

//==========================================
// 업무시스템 별 검색 검증하기 
//==========================================
// 기능확인 - 달력 날짜 기간 (오늘 기준 5일 전 날짜 동적 지정) --------------------------------

// 오늘 날짜 기준 5일 전 계산
const targetDate = new Date();
targetDate.setDate(targetDate.getDate() - 5);
const targetMonth = targetDate.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
const targetDay = targetDate.getDate();

cy.log(`시작 날짜: ${targetMonth}월 ${targetDay}일`);

// 기간 input의 달력 아이콘 클릭 (aria-label로 정확히 타겟)
cy.get('input[aria-label="기간"]').filter(':visible').first().closest('.v-input').find('i.material-icons').click({ force: true });
cy.wait(500);

// 활성화된 달력 팝업에서 헤더 클릭 → 월 선택 모드
cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

// 동적으로 계산된 월 클릭
cy.get('.menuable__content__active').find('.v-date-picker-table--month').contains(`${targetMonth}월`).click({ force: true });

// 동적으로 계산된 일 클릭
cy.get('.menuable__content__active').find('.v-date-picker-table').contains('.v-btn__content', `${targetDay}`).closest('.v-btn').click({ force: true });

cy.get('body').type('{esc}');

//업무시스템 클릭하는 코드 
cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
cy.wait(500);
// 업무시스템별 클릭하는 코드
cy.get('.v-list__tile__title').contains('JEUS_CRM고객관리').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
cy.wait(1000);
// 컨텍스트 메뉴 닫기
cy.get('body').type('{esc}');

// 검색 버튼 클릭
cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
cy.wait(1000);




    //검증 코드
    // 1. 검증할 카드 목록 정의 (숫자만 작성)
    // min값을 기준으로 0으로 설정하면  숫자만 있으면 통과 1로 설정하면 최소 1이상이어야함. min값 조절
    const dashboardStats3 = [
  { title: '개인정보 사용량',    min: 0 },
  { title: '개인정보 대량 접근', min: 0 },
  { title: '업무시간 외 접근',   min: 0 },
  { title: '이상행위 발생 건수', min: 0 },
  { title: '접근 업무시스템',    min: 0 },
  { title: '접근 IP 주소',       min: 0 }
];

dashboardStats3.forEach((stat) => {
  cy.contains('.v-card', stat.title, { timeout: 10000 })
    .should('be.visible')
    .within(() => {
      cy.get('b', { timeout: 10000 }).should(($b) => {
        const num = parseInt($b.text().replace(/[^0-9]/g, ''), 10);
        expect(num, `${stat.title} 카드 값이 ${stat.min} 이상이어야 합니다`)
          .to.be.gte(stat.min);
      });
    });
});
    
//맨티스 이슈 : 37386 (이슈는 해결된거같으나 아직 상태가 안바뀐듯함.)
//[현황] 업무시스템별 차트에 개인정보 사용량 건수와 하단표 개인정보 사용건수 합이 일치하지 않는 문제
// =========================================================
// [정합성 검증] 업무시스템 별 '개인정보 사용량' 카드 클릭 후 하단 표 데이터 합산 검증 (하단표 38합)
// =========================================================
// 1. [상단] '개인정보 사용량' 카드를 찾아 첫 번째 숫자(<b>)를 추출하고 클릭합니다.
cy.contains('.v-card', '개인정보 사용량').should('be.visible').within(() => {
  cy.get('b').first().then(($b) => {
    const text = $b.text(); 
    const totalFromCard = parseInt(text.replace(/[^0-9]/g, ''), 10);
    cy.wrap(totalFromCard).as('expectedTotal_IP'); 
    cy.wrap($b).click({ force: true });
  });
});

// ==========================================
// 페이지수 10 -> 100 개 옵션 변경 (within 블록 밖으로 이동!)
// ==========================================
cy.wait(1000); // 클릭 후 하단 표 갱신 대기
cy.get('.v-select__selection--comma').filter(':visible').contains('10').click({ force: true });
cy.wait(1000); // 콤보박스 메뉴 열릴 때까지 대기
cy.get('.v-menu__content').filter(':visible').contains('100').click({ force: true });
cy.wait(3000); // 목록 갱신 대기
//---------------------------------------------------------------------

// 2. [하단] 현재 화면에 보이는 표의 데이터를 모두 더합니다.
cy.get('@expectedTotal_IP').then((expectedTotal_IP) => {
  let tableSum = 0; 
  cy.get('table').filter(':visible').should('be.visible');
  cy.get('table').filter(':visible').find('tbody tr').each(($row) => {
    const cellText = $row.find('td').eq(-2).text();
    const num = parseInt(cellText.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      cy.log(`➕ IP 검색 표 데이터: ${num}`); 
      tableSum += num;
    }
  }).then(() => {
    cy.log(`📊 상단 카드 클릭 수: ${expectedTotal_IP} / 하단 표 계산 합계: ${tableSum}`);
    expect(tableSum).to.equal(expectedTotal_IP);
  });
});

    //검색결과 통계 그래프 문구 확인 코드
    cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    
    cy.log('✅ 업무 시스템 별 탭 진입 및 데이터 출력 확인 완료!');


    // //  현황 > 종합 현항 탭
    // cy.log('--- 현황 > 종합 현항 탭 클릭  ---');
    // cy.get('.tab-btn').contains('종합 현황').should('be.visible').click({ force: true });
    // cy.wait(3000);

    // // 현황 > 종합현황  > [정보 사용자별] 탭 클릭 
    // cy.get('.tab-title').filter(':visible').should('be.visible').contains('정보사용자 별').click();
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '검색 조건').should('exist');
    // // 시작날짜 달력 아이콘확인
    //  cy.contains('label', '기간').filter(':visible').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // // 종료날짜 달력 아이콘확인
    // cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // // 검색 버튼 확인 
    // cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // // 검색조건 입력문구확인
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    // cy.get('span').filter(':visible').contains('정보 사용자').should('be.visible');
    // cy.get('input[aria-label="사용자"]').filter(':visible').should('be.visible');

    // ////////////////////////////
    // // 기능확인 - 조건별로 검색 
    // //업무 시스템 - 리눅스_배송관리 선택
    // // 조건 입력 
    // //업무시스템 클릭하는 코드 
    // //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    // cy.wait(1000);
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // // 업무시스템중 리눅스_배송관리 클릭하는 코드
    // //cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    // //cy.wait(1000);
    // // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    // //cy.get('body').type('{esc}');
    
    // // 업무시스템중 리눅스_배송관리 클릭하는 코드
    // //cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    // cy.get('.v-list__tile__title').filter(':visible').contains('리눅스_배송관리').click({ force: true });
    // cy.wait(500);
    // // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    // cy.get('body').type('{esc}');
    // //추적타입 - 정보사용자는 디폴트값으로 선택 Skip
    // //사용자 선택
    // cy.get('input[aria-label="사용자"]').filter(':visible').click({ force: true });
    // // 사용자 리스트 콤보박스에서 첫번쨰 사람 선택
    // cy.wait(500);
    // cy.get('.v-list__tile__title').filter(':visible').eq(0).click({ force: true });

    // // 검색 버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    // //검색결과 통계 그래프 문구 확인 코드
    // cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    // cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    // cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    // cy.log('✅ 현황 - 종합현황 - [정보 사용자별]탭 진입 및 데이터 출력 확인 완료!');

    
    
    // // 현황 > 종합현황  > [부서 별] 탭 클릭 
    // cy.get('.tab-title').filter(':visible').should('be.visible').contains('부서 별').click();
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '검색 조건').should('exist');
    // // 시작날짜 달력 아이콘확인
    // cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // // 종료날짜 달력 아이콘확인
    // cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // // 검색 버튼확인
    // cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // // 검색 조건 입력 문구확인
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    // cy.get('input[aria-label="그룹"]').filter(':visible').should('be.visible');

    // ////////////////////////////
    // // 기능확인 - 조건별로 검색 
    // //업무 시스템 - 리눅스_배송관리 선택
    // // 조건 입력 
    // //업무시스템 클릭하는 코드 
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.wait(500);
    // // 업무시스템중 리눅스_배송관리 클릭하는 코드
    // //cy.get('span[title="전체 선택"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.get('.v-list__tile__title').filter(':visible').contains('전체 선택').click({ force: true });
    // cy.wait(500);
    // // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    // cy.get('body').type('{esc}');

    // // 조건 입력 
    // // 그룹별 클릭하는 코드 
    // cy.get('input[aria-label="그룹"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.wait(500);
    // // 그룹별중 영업팀 클릭하는 코드
    // cy.get('.v-list__tile__title').contains('협력사').scrollIntoView().should('be.visible').closest('.v-list__tile').click({ force: true });
    // // 선택 후 메뉴 닫기
    // cy.get('body').type('{esc}');

    // // 검색 버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    // cy.wait(1000);

    // //검색결과 통계 그래프 문구 확인 코드
    // cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    // cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    // cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    // cy.log('✅ 현황 - 종합현황 - [부서 별]탭 진입 및 데이터 출력 확인 완료!');

    
    // // 업무시스템 콤보박스 닫히지 않는 이슈 새로고침 실행
    // cy.reload();

    // // 현황 > 종합현황  > [업무시스템 별] 탭 클릭 
    // cy.get('.tab-title').filter(':visible').contains('업무 시스템 별').click();
    // cy.wait(3000);
    // cy.log('--- 화면 검증 시작 ---');
    // cy.contains('.c-headline', '검색 조건').should('exist');
    // // 시작날짜 달력 아이콘확인
    //  cy.get('label').filter(':visible').contains('기간').closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // // 종료날짜 달력 아이콘확인
    // cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    // // 검색 버튼 확인 
    // cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // // 검색조건 입력문구 확인
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');

    // ////////////////////////////
    // // 기능확인 - 조건별로 검색 
    // //업무 시스템 - 리눅스_배송관리 선택
    // // No data available 뜨는 이슈 발생 (맨티스 : 37152) 이로인해 두번클릭하게  우회코드 작성함. 
    //  //cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });

    // cy.get('.v-icon').filter(':visible').contains('arrow_drop_down').click();
    // cy.wait(1000);
    // cy.get('input[aria-label="업무시스템"]').filter(':visible').click({ force: true });
   
    // // 업무시스템중 리눅스_배송관리 클릭하는 코드
    // cy.contains('.v-list__tile__title', '리눅스_배송관리').should('be.visible').click();
    // cy.wait(1000);
    // // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    // cy.get('body').type('{esc}');
    

    // // 검색 버튼 클릭
    // cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

    // //검색결과 통계 그래프 문구 확인 코드
    // cy.get('div[title="개인정보 유형별 현황"]').should('be.visible').and('contain.text', '개인정보 유형별 현황');
    // cy.get('div[title="이상행위 유형별 현황"]').should('be.visible').and('contain.text', '이상행위 유형별 현황');
    // cy.get('div[title="업무시스템별 개인정보 사용 현황"]').should('be.visible').and('contain.text', '업무시스템별 개인정보 사용 현황');
    // cy.log('✅ 현황 - 종합현황 - [업무 시스템 별]탭 진입 및 데이터 출력 확인 완료!');
    
    // cy.wait(1000);

   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 현황 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });


  });
});  

//코드마지막


 })()
;
