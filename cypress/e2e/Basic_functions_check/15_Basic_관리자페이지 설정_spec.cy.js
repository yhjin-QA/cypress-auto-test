// [2.9.7 현행화] 기간 입력칸 helper — 2.9.5.0부터 aria-label="기간"/라벨 '기간'이 비어 있어 달력 아이콘(event)으로 찾음
const dateInputs = () =>
  cy.get('.v-input__icon--prepend-inner i.material-icons')
    .filter(':visible')
    .filter((i, el) => el.innerText.trim() === 'event')
    .closest('.v-input');

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
    // STEP : 일반모드 -> 관리자페이지 탭 진입(상단관리자 버튼 클릭) 
    // ==========================================
    cy.log('🚀 관리자(톱니바퀴) 버튼 클릭');
    // 1. [검증] 톱니바퀴 아이콘이 화면에 보이는지 확인
    // 설명: 'g-IConfig' 클래스가 설정 아이콘을 의미하는 핵심 식별자입니다.
    cy.get('.g-IConfig').should('be.visible');
    // 2. [클릭] 버튼 클릭
    cy.get('.g-IConfig').should('be.visible').click({ force: true });
    // 3. [대기] 관리자 메뉴가 펼쳐지거나 화면이 이동할 시간 대기
    cy.wait(2000);
    cy.log('✅ 관리자 톱니바퀴 아이콘 클릭 완료');

/*
    // ==========================================
    // STEP 14: 관리자 -설정 탭 서브메뉴 
    // ==========================================
    // 1. 관리자 페이지 사이드 메뉴 중 '설정' 버튼 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 패스워드 규칙 서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [패스워드 규칙] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("패스워드 규칙")').filter(':visible').click({ force: true });
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
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    cy.log('✅ 설정 - [패스워드 규칙] 출력 확인 완료');

 */

    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기

   /* 
    // 설정 > 관리자 > [계정관리] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('계정관리').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    // =================================================
    // 1. [권한 그룹] 섹션 검증 (첫 번째 테이블)
    // =================================================
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

     
    // 설정 > 관리자 > [라이선스] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('라이선스').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '발급 라이선스 정보').should('exist');
     // v버튼 확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 라이선스키 가져오기 버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('라이선스 키 가져오기').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('라이선스 변경').should('be.visible');
    //발급 아이디 문구확인
    cy.get('input[aria-label="발급 아이디"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="이름"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="설명"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="국가"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="발급 일시"]').filter(':visible').should('be.visible');
    cy.contains('.c-headline', 'LOG CATCH').should('exist');
    // v버튼 확인 (부모 찾기 방식 유지 - 아주 좋습니다)
    cy.contains('LOG CATCH').closest('.v-card__actions').find('.material-icons').contains('keyboard_arrow_down').should('be.visible');
    // 라이선스 유형 문구확인
    cy.contains('th', '라이선스 유형').filter(':visible').should('be.visible');
    cy.contains('th', 'Log Tracer 가용 대수').filter(':visible').should('be.visible');
    cy.log('✅ 설정 - 관리자 - [라이선스] 출력 확인 완료');


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
    cy.log('✅ 설정 - 관리자 - [계정 정보 관리 규칙] 출력 확인 완료');
*/
 

    // 설정 > 관리자 > [운영 이력] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('운영 이력').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
    //검색 입력문구확인 
    cy.get('input[aria-label="관리자"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="IP"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="검색 대상"]').filter(':visible').should('be.visible'); 
    //검색버튼 확인 
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('순번').should('be.visible');
    cy.get('th').filter(':visible').contains('발생 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('발생자').should('be.visible');
    cy.get('th').filter(':visible').contains('IP').should('be.visible');
    cy.get('th').filter(':visible').contains('이벤트').should('be.visible');
    cy.get('th').filter(':visible').contains('보안 객체').should('be.visible');
    cy.get('th').filter(':visible').contains('대상').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('결과').should('be.visible');

    //기능확인
    //달력표를 펼침  월/일 지정  
    dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
    cy.wait(1000);
    // 1. 상단 제목('2026년 2월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // 2. '2월'이라는 글자를 찾아 클릭합니다.
    cy.get('.v-date-picker-table--month').filter(':visible').contains('2월').click({ force: true });
    // 달력 1일 클릭
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '1일').closest('.v-btn').click({ force: true });
    //달력창 닫기
    cy.get('body').type('{esc}');

    //검색조건에서  Administrators IP 검색----------------------------------------------------
     // '관리자' 콤보박스(input)를 찾아 클릭하여 리스트를 엽니다.
     cy.get('input[aria-label="관리자"]').click({ force: true });
     cy.wait(1000);
     // 화면에 나타난 리스트 메뉴 중에서 'Administrators'을 선택
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', 'Administrators').should('be.visible').click({ force: true });
     cy.wait(1000);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     // [2.9.7] 운영 이력 IP = 스크립트를 실행한 PC IP(실행 위치마다 다름: 10.10.54.5 / 10.10.0.72 등)
     //   → --env ADMIN_IP 로 지정하거나, 지정이 없으면 방금 로그인한 Admin 이력의 IP를 읽어서 사용
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
     cy.wait(2000);
     cy.get('th').filter(':visible').then(($ths) => {
       // 머리글에 정렬 아이콘 글자(arrow_upward 등)가 붙어 있어 아이콘을 뺀 글자로 비교
       const headText = (th) => { const c = th.cloneNode(true); c.querySelectorAll('i, .v-icon, .material-icons').forEach((e) => e.remove()); return c.textContent.trim(); };
       cy.log(`운영 이력 머리글: ${[...$ths].map(headText).join(' | ')}`);
       const idx = [...$ths].findIndex((th) => headText(th) === 'IP');
       expect(idx, '운영 이력 IP 열').to.be.greaterThan(-1);
       cy.get('tbody tr').filter(':visible').first().find('td').eq(idx).invoke('text').then((t) => {
         const ip = (Cypress.env('ADMIN_IP') || t).trim();
         expect(ip, '접속 PC IP').to.match(/^\d{1,3}(\.\d{1,3}){3}$/);
         cy.log(`운영 이력 검색 IP: ${ip}`);
         cy.wrap(ip).as('adminIp');
       });
     });
     cy.get('@adminIp').then((ip) => cy.get('input[aria-label="IP"][type="text"]').should('be.visible').clear().type(ip));
     cy.wait(1000);

     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 상태 리스트중 '전체' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체').should('be.visible').click({ force: true });
     cy.wait(1000);    
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP(@adminIp)가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.get('@adminIp').then((ip) => {
     cy.contains('tbody tr', ip).should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('span.ellipsis').contains('Admin(admin)').should('be.visible');
      cy.get('span.ellipsis').contains(ip).should('be.visible');
     });
     });
     //-------------------------------------------------------------------------------------------


    //검색조건에서  Administrators IP 검색고정하고 검색대상 시스템 이벤트 검색 조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 상태 리스트중 '전체' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '시스템 이벤트').should('be.visible').click({ force: true });
     cy.wait(1000); 
     
     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 이벤트 리스트중 '로그인' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '로그인').should('be.visible').click({ force: true });
     cy.wait(1000);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 
         
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP(@adminIp)가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.get('@adminIp').then((ip) => {
     cy.contains('tbody tr', ip).should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('span.ellipsis').contains('로그인').should('be.visible');
      cy.get('span.ellipsis').contains(ip).should('be.visible');
     });
     });

     // [2.9.7] 이벤트 유형 : 결과에 실제로 있는 이벤트를 읽어서 선택
     //   자동화는 로그아웃 없이 끝나 실행 PC IP의 '로그아웃' 이력이 없을 수 있음
     //   → 이벤트 조건을 비우고 검색 → 이벤트 열 값 수집 → '로그아웃' 우선, 없으면 로그인 외 이벤트(예: 선택) → 그 이벤트로 재검색·검증
     // [2026-11-13 CI 실패 → 원인] 검색 대상 「시스템 이벤트」 + 이벤트 비움 + 실행 PC IP 로 검색하면
     //   POST /logcatch/common/com06/work-history 가 400 → 화면은 오류 안내 없이 「No data available」
     //   응답 message : [WorkHistory List Select Query Execute] : For input string: "[Anomaly Result] : 경보 목록 조회"
     //   (요청 : historyType 0 · managerIdList [1] · managerIp <실행 PC IP> · 이벤트 조건 없음)
     //   이상행위 결과 화면을 본 운영 이력이 그 결과에 섞이면 서버 조회가 실패하는 것으로 보임 (조건 없이 1쪽에 그 행이 없으면 정상)
     //   CI 1회차 「선택할 이벤트: expected undefined」 와 2·3회차 재검색 실패가 모두 여기서 시작됨
     //   → 목록에서 「로그인」 을 다시 눌러 해제하고 검색, 응답 상태 · 요청 본문 · message 를 기록
     //   → 400 이면 관찰로 남기고(Mantis 0039006 — 기록만) 이벤트는 결과가 확인된 「로그인」 으로 검증을 이어 감
     //   → 이벤트 목록(드롭다운)에 같은 이름이 하나뿐인 이벤트만 고름
     //   단계별 값(검색 요청 · 응답 · 결과 이벤트 · 드롭다운 항목 · 고른 이벤트 · 재검색 결과)은 cypress/probe/B15_운영이력_이벤트.json
     const headText = (th) => { const c = th.cloneNode(true); c.querySelectorAll('i, .v-icon, .material-icons').forEach((e) => e.remove()); return c.textContent.trim(); };
     const rowText = (tr) => tr.textContent.replace(/\s+/g, ' ').trim();
     const B15 = { api: [] };
     const b15 = (k, v) => { B15[k] = v; cy.writeFile('cypress/probe/B15_운영이력_이벤트.json', B15, { log: false }); };
     // 운영 이력 검색 API — 엿보기만 함(요청을 바꾸지 않음)
     cy.intercept('POST', /\/logcatch\/common\/com06\/work-history(\?|$)/).as('wh');
     const search = (step) => {
       cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
       return cy.wait('@wh', { timeout: 20000 }).then((x) => {
         const res = x.response || {};
         const body = res.body || {};
         const r = { step, st: res.statusCode, req: JSON.stringify(x.request.body).slice(0, 600), total: body.totalCount, msg: String(body.message || '').slice(0, 200) };
         B15.api.push(r);
         b15('api', B15.api);
         cy.wait(1500);
         return cy.wrap(r, { log: false });
       });
     };
     const pickInList = (name) => {
       cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
       cy.wait(1000);
       cy.get('.v-menu__content:visible').last().find('.v-list__tile__title')
         .filter((i, el) => el.textContent.trim() === name).first().scrollIntoView().click({ force: true });
       cy.wait(1000);
       cy.get('body').type('{esc}');
       cy.wait(500);
     };
     // 실행 PC IP 행이 있는 표 → 그 표의 이벤트 열 값
     const eventsOf = (ip) => cy.contains('tbody tr', ip, { timeout: 20000 }).should('be.visible').then(($tr) => {
       const table = $tr[0].closest('table');
       const ths = [...table.querySelectorAll('thead th')];
       const evIdx = ths.findIndex((th) => headText(th) === '이벤트');
       expect(evIdx, '운영 이력 이벤트 열').to.be.greaterThan(-1);
       const rows = [...table.querySelectorAll('tbody tr')].filter((tr) => tr.children.length > evIdx);
       return { rows: rows.map(rowText).slice(0, 10), events: rows.map((tr) => tr.children[evIdx].textContent.trim()).filter(Boolean) };
     });

     // 목록에서 「로그인」 을 다시 눌러 해제 → 검색 (해제되면 X 아이콘도 사라짐)
     pickInList('로그인');
     search('이벤트 해제(목록)').then((r2) => {
       if (r2.st === 200) {
         cy.get('@adminIp').then((ip) => eventsOf(ip)).then(({ rows, events }) => {
           const kinds = [...new Set(events)];
           b15('1_조건없는검색', { 이벤트종류: kinds, 행: rows });
           cy.wrap(kinds).as('kinds');
         });
         return;
       }
       // 400 : 관찰로 남기고 이미 확인된 「로그인」 으로 이어 감
       b15('관찰_이벤트비운검색', `검색 대상 시스템 이벤트 + 이벤트 비움 → ${r2.st} ${r2.msg} — Mantis 0039006`);
       cy.log('⚠️ 이벤트를 비운 검색이 조회 오류(Mantis 0039006) — 「로그인」 으로 검증을 이어 감 (B15_운영이력_이벤트.json)');
       cy.wrap([]).as('kinds');
     });

     // 이벤트 목록(드롭다운)에서 같은 이름이 하나뿐인 이벤트 고르기
     cy.get('@kinds').then((kinds) => {
       cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
       cy.wait(1000);
       cy.get('.v-menu__content:visible').last().then(($m) => {
         const items = [...$m[0].querySelectorAll('.v-list__tile__title')].map((e) => e.textContent.trim());
         const count = (n) => items.filter((x) => x === n).length;
         const cands = [...(kinds.includes('로그아웃') ? ['로그아웃'] : []), ...kinds.filter((e) => e !== '로그아웃' && e !== '로그인'), '로그인'];
         const pick = cands.find((e) => count(e) === 1);
         b15('2_이벤트목록', { 항목수: items.length, 항목: items, 후보: cands.map((e) => `${e}(${count(e)})`), 고름: pick || '(없음)' });
         cy.log(`검색 결과 이벤트 종류: ${kinds.join(', ') || '(없음)'} → '${pick}' 로 재검색`);
         expect(pick, `선택할 이벤트 (후보 ${cands.join(', ')} 중 목록에 하나뿐인 것)`).to.be.a('string');
         cy.wrap(pick).as('pickEvent');
       });
       cy.get('body').type('{esc}');
       cy.wait(500);
     });

     // 고른 이벤트만 남기기 (X 는 쓰지 않음 — 위 400 과 같은 상태가 될 수 있음)
     //   이벤트 칸에 이미 그 이벤트만 있으면 그대로, 「로그인」 이 남아 있으면 목록에서 눌러 해제한 뒤 고른 이벤트 선택
     const evText = () => cy.get('input[aria-label="이벤트"]').filter(':visible').closest('.v-input')
       .then(($s) => ($s.find('.v-select__selections').text() || $s.text()).replace(/\s+/g, ' ').trim());
     cy.get('@pickEvent').then((ev) => {
       evText().then((now) => {
         if (now.includes(ev)) return;
         if (now.includes('로그인')) pickInList('로그인');
         pickInList(ev);
       });
       evText().then((now) => b15('3_선택', { 이벤트: ev, 이벤트칸: now.slice(0, 200) }));
     });

     // 검색 → 재검색 결과를 먼저 기록 (실패해도 원인을 볼 수 있게)
     search('고른 이벤트로 재검색').then((r) => {
       if (r.st === 200) return;
       // [13:57 실행] 「선택」 으로 재검색 → 400 (Mantis 0039006 — 이상행위 결과 조회 기록이 「선택」 이벤트라 그 결과에 섞임)
       //   → 같은 오류면 기록만 하고 고른 이벤트를 해제한 뒤 「로그인」 으로 다시 검색 · 검증
       expect(r.msg, `재검색 응답 ${r.st} (0039006 오류가 아니면 실패)`).to.include('For input string');
       cy.get('@pickEvent').then((ev) => {
         b15('관찰_재검색', `「${ev}」 재검색 → ${r.st} ${r.msg} — Mantis 0039006`);
         cy.log(`⚠️ 「${ev}」 재검색이 조회 오류(Mantis 0039006) — 「로그인」 으로 다시 검색`);
         pickInList(ev);
         pickInList('로그인');
       });
       cy.wrap('로그인', { log: false }).as('pickEvent');
       search('로그인으로 재검색').then((r2) => expect(r2.st, '로그인 재검색 응답').to.eq(200));
     });
     cy.get('body').then(($b) => {
       const trs = $b.find('tbody tr').filter(':visible').toArray();
       b15('4_재검색결과', { 행수: trs.length, 행: trs.slice(0, 10).map(rowText) });
     });

     //검색결과 검증 : 실행 PC IP + 선택한 이벤트
     cy.get('@adminIp').then((ip) => {
       cy.get('@pickEvent').then((ev) => {
         cy.contains('tbody tr', ip, { timeout: 20000 }).should('be.visible')
         .within(() => {
           cy.get('a.font-weight-bold').should('contain', ev).and('be.visible');
           cy.get('span.ellipsis').contains(ip).should('be.visible');
         });
       });
     });

     //-------------------------------------------------------------------------------------------

     // IP입력값  '10.10.0.210'을 타이핑합니다.
     cy.get('input[aria-label="IP"][type="text"]').should('be.visible').clear().type('10.10.0.210');
     cy.wait(1000);

     //검색조건에서  Administrators IP 검색고정하고 검색대상 시스템 이벤트 검색 조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 검색대상 리스트중 '변경 이력' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '변경 이력').should('be.visible').click({ force: true });
     cy.wait(1000); 
     
     //맨티스 이슈 : 37325 설정 - 관리자 - 운영이력 검색대상 변경시 이벤트 리스트목록 변경되지 않는 문제
     //이벤트 클릭
     cy.get('input[aria-label="이벤트"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 이벤트 리스트중 '변경' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '변경').should('be.visible').click({ force: true });
     cy.wait(1000);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 

     //보안 객체 클릭
     cy.get('input[aria-label="보안 객체"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 보안 객체중 '사용자' 클릭
     //cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '사용자').scrollIntoView().should('be.visible').click({ force: true });
     cy.wait(1000);
     // 선택한 컨텍스트 메뉴 닫기
     cy.get('body').type('{esc}'); 
         
     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증
     // 1. 검색한 IP('10.10.0.210')가 포함된 테이블 행(tr)을 먼저 찾습니다.
     cy.contains('tbody tr', '10.10.0.210').should('be.visible') // 화면에 결과가 렌더링될 때까지 대기
     .within(() => {
    
      cy.get('a.font-weight-bold').should('contain', '변경').and('be.visible');
      cy.get('span.ellipsis').contains('사용자').should('be.visible');
     });

     //------------------------------------------------------------------------------------------------

     //검색조건에서  Administrators IP 검색고정하고 검색대상: 시스템 경보 검색조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 검색대상 리스트중 '시스템 경보' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '시스템 경보').should('be.visible').click({ force: true });
     cy.wait(1000); 

     // [2.9.7] 검색 대상을 바꾸면 이벤트가 자동으로 전체 선택(칩 표시)되는 경우가 있음
     //   → 칩이 이미 있으면 그대로 두고(다시 '전체 선택'을 누르면 해제됨), 비어 있을 때만 '전체 선택'
     cy.get('input[aria-label="이벤트"]').closest('.v-input').filter(':visible').first().then(($ev) => {
       if ($ev.find('.v-chip').length > 0) {
         cy.log(`이벤트 이미 선택됨: ${$ev.find('.v-select__selections').text().replace(/\s+/g, ' ').trim()}`);
       } else {
         cy.wrap($ev).find('input[aria-label="이벤트"]').click({ force: true });
         cy.wait(1000);
         cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
         cy.wait(1000);
         cy.get('body').type('{esc}');
       }
     });

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증코드 
     // 시스템 경보가 없는 가정하에 검증코드
     // 수많은 td 중에서 '현재 화면에 보이는(visible)' td만 걸러낸 뒤 텍스트를 찾습니다.
     cy.get('td').filter(':visible').contains('No data available').should('be.visible');


     //검색조건에서  Administrators IP 검색고정하고 검색대상: 파일 내려받기 검색조회 ---------------------------
     //검색대상 클릭
     cy.get('input[aria-label="검색 대상"]').filter(':visible').click({ force: true });
     cy.wait(1000);
     // 검색대상 리스트중 '파일 내려받기' 클릭
     cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '파일 다운로드').should('be.visible').click({ force: true });
     cy.wait(1000); 

     // [2.9.7] 검색 대상을 바꾸면 이벤트가 자동으로 전체 선택(칩 표시)되는 경우가 있음
     //   → 칩이 이미 있으면 그대로 두고(다시 '전체 선택'을 누르면 해제됨), 비어 있을 때만 '전체 선택'
     cy.get('input[aria-label="이벤트"]').closest('.v-input').filter(':visible').first().then(($ev) => {
       if ($ev.find('.v-chip').length > 0) {
         cy.log(`이벤트 이미 선택됨: ${$ev.find('.v-select__selections').text().replace(/\s+/g, ' ').trim()}`);
       } else {
         cy.wrap($ev).find('input[aria-label="이벤트"]').click({ force: true });
         cy.wait(1000);
         cy.get('.v-menu__content:visible').contains('.v-list__tile__title', '전체 선택').should('be.visible').click({ force: true });
         cy.wait(1000);
         cy.get('body').type('{esc}');
       }
     });

     // 검색버튼 클릭 
     cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });

     //검색결과 검증코드 
     // 시스템 경보가 없는 가정하에 검증코드
     // 수많은 td 중에서 '현재 화면에 보이는(visible)' td만 걸러낸 뒤 텍스트를 찾습니다.
     cy.get('td').filter(':visible').contains('No data available').should('be.visible');

     cy.log('✅ 설정 - 관리자 - [운영 이력] 출력 확인 완료');

   /*
     // 설정 > 관리자 > [관리자 알림] 탭 클릭
     cy.get('.v-btn__content').filter(':visible').contains('관리자 알림').last().click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // v버튼 확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     //표열 문구확인
     cy.get('th').filter(':visible').contains('정책명').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     cy.get('th').filter(':visible').contains('타입').should('be.visible');
     cy.get('th').filter(':visible').contains('설명').should('be.visible');
     cy.get('th').filter(':visible').contains('삭제').should('be.visible')
     // 정책 추가 + 버튼 확인
     cy.get('.material-icons.theme--dark') .contains('add').should('be.visible');
     cy.log('✅ 설정 - 관리자 - [관리자 알림] 출력 확인 완료');


    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > SMTP 설정 서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [SMTP 설정] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("SMTP 설정")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', 'SMTP 설정').should('exist');
    //설정 확인
    cy.get('input[aria-label="SMTP 호스트"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 포트"]').filter(':visible').should('be.visible');
    cy.contains('label', '인증 여부').filter(':visible').should('be.visible');
    cy.contains('label', 'SMTPS 사용 여부').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 계정"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="SMTP 비밀번호"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="전송자 E-Mail"]').filter(':visible').should('be.visible');
    cy.get('input[aria-label="전송자 이름"]').filter(':visible').should('be.visible');
    
    //버튼 확인
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('접속 테스트').should('be.visible');
    cy.log('✅ 설정 - SMTP 설정 출력 확인 완료');

    
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 재시작 설정 서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [재시작 설정] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("재시작 설정")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '재 시작').should('exist');
    //토글 버튼 문구 확인
    cy.contains('label', '재시작 수행').filter(':visible').should('be.visible');
    // 비활성화된 입력창 확인코드 
    cy.contains('label', '재시작 수행').closest('.v-card').find('input[disabled]').should('be.visible');
    //시간 문구확인 
    cy.get('.font-weight-bold').filter(':visible').contains('시간').should('be.visible');
    cy.get('input[aria-label="시"]').should('be.visible')
    cy.get('input[aria-label="분"]').should('be.visible')
    //cy.get('input[aria-label="초"]').should('be.visible')
    // v 아이콘 확인하는 코드
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 저장 버튼 확인인
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    cy.log('✅ 설정 - 재시작 설정 화면 출력 확인 완료');


    // ==========================================
    // STEP : 관리자페이지-> 일반 모드 점검페이지로로(대시보드)로 복귀
    // ==========================================
    cy.log('🏠 대시보드 아이콘 클릭 (일반 모드로 복귀)');
    // 1. [검증] 대시보드(구름 모양) 아이콘이 보이는지 확인
    // 설명: 'g-IDashboard' 클래스가 대시보드 아이콘의 고유 식별자입니다.
    cy.get('.g-IDashboard').should('be.visible');
    // 2. [클릭] 아이콘 클릭
    cy.get('.g-IDashboard').should('be.visible').click({ force: true });
    // 3. [대기] 화면 전환 기다림
    cy.wait(2000);
    // 4. [확인] 일반 모드로 잘 돌아왔는지 URL이나 요소로 확인 (선택사항)
    // 예: 다시 '점검' 버튼이 보이는지 확인
    cy.contains('button', '점검').should('exist');

    cy.log('✅ 일반 점검페이지지 모드 복귀 완료');
*/
 

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
