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
      'Avoided redundant navigation',
      'Loading chunk',
      'operate.task.packageManagement'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  
  it('DEV_Release 로그캐치 UI기본체크', () => {

    // ==========================================
    // STEP 1: 로그인
    // ==========================================
    // 1. 사이트 방문
    cy.visit('https://10.10.54.51:18443/logcatch/login');
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
          .contains('확정')
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
    //2.9.1.262_r35274 내보내기 -> EXPORT 문구 변경
    cy.get('.v-btn__content').filter(':visible').contains('Export').should('be.visible');
    cy.get('.v-btn__content').filter(':visible').contains('저장').should('be.visible');
    //v3.0.3.0_R34785 취소 버튼 없어짐 
    //cy.get('.v-btn__content').filter(':visible').contains('취소').should('be.visible');
    cy.log('✅ 설정 - [패스워드 규칙] 출력 확인 완료');

 
    //설정 클릭
    cy.log('--- [설정] 메뉴 클릭 ---');
    cy.contains('button.side-menu', '설정').should('be.visible').click({ force: true });
    // 설정 > 관리자  서브메뉴 클릭 
    cy.wait(1000)
    cy.log('--- 서브메뉴 [관리자] 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("관리자")').filter(':visible').click({ force: true });
    cy.wait(2000); // 화면 전환 대기

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
    cy.contains('th', '이름').should('be.visible');
    // 2.9.1.262_r35274 상태 -> 조건으로 문구변경됨.
    cy.contains('th', '조건').should('be.visible');     
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

 

    // 설정 > 관리자 > [운영 이력] 탭 클릭
    cy.get('.v-btn__content').filter(':visible').contains('운영 이력').last().click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    cy.get('input[aria-label="기간"]').filter(':visible').first().closest('.v-input').find('.material-icons').contains('event').should('be.visible');
    // 종료날짜 달력 아이콘확인
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
    cy.log('✅ 설정 - 관리자 - [운영 이력] 출력 확인 완료');

   
     // 설정 > 관리자 > [관리자 알림] 탭 클릭
     cy.get('.v-btn__content').filter(':visible').contains('관리자 알림').last().click({ force: true });
     cy.wait(3000);
     cy.log('--- 화면 검증 시작 ---');
     cy.contains('.c-headline', '정책 목록').should('exist');
     // v버튼 확인
     cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
     //표열 문구확인
     //2.9.1.262_r35274 정책이름 -> 정책명 문구 변경
     cy.get('th').filter(':visible').contains('정책명').should('be.visible');
     cy.get('th').filter(':visible').contains('생성일').should('be.visible');
     cy.get('th').filter(':visible').contains('생성자').should('be.visible');
     //2.9.1.262_r35274 타입 -> 유형 문구 변경
     cy.get('th').filter(':visible').contains('유형').should('be.visible');
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
    // 3.0.3.0_R34785 버전에서 취소버튼 사라짐 
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
    //cy.get('.font-weight-bold').filter(':visible').contains('시간').should('be.visible');
    //cy.get('input[aria-label="시"]').should('be.visible')
    //cy.get('input[aria-label="분"]').should('be.visible')
    //cy.get('input[aria-label="초"]').should('be.visible')
    // v 아이콘 확인하는 코드
    cy.get('.material-icons').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 저장 버튼 확인
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
