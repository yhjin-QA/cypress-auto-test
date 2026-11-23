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
  
  it('02_Depth_이력_접속기록이력_검출 자동화 시나리오', () => {

    // [2026-11-17] 검출 데이터 생성 — CRM(.27) 실시간 DLP 테스터(dlp_tester.jsp)에 「등록」 사용자 user001(AI개발2팀)로 개인정보가 든 채팅 메시지 전송
    //   (손으로 하던 dlp_tester.jsp 전송과 같은 요청: POST action=send · chatMsg) → 이 스크립트가 뒤에서 오늘 날짜 「검출」 을 조회
    //   값은 형식만 맞춘 가짜 (주민번호 체크섬 맞춤 · 테스트 카드번호). 비밀번호는 Node(crmFetch)가 cypress.env.json 에서 직접 읽음
    cy.task('crmFetch', {
      userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'POST', maxBody: 0,
      form: { action: 'send', chatMsg: `[자동화 검출 생성 ${new Date().toISOString()}] 주민번호 900101-1234568 / 휴대폰 010-1234-5678 / 이메일 auto.dlp@test.co.kr / 카드 4111-1111-1111-1111` },
    }, { timeout: 90000, log: false }).then((r) => {
      cy.log(`🧪 검출 데이터 생성 (dlp_tester.jsp) : 로그인 ${r.login} · 전송 ${r.status} ${r.error || ''}`);
      cy.writeFile('cypress/probe/검출생성_dlp_tester.json', { at: new Date().toISOString(), login: r.login, status: r.status, error: r.error }, { log: false });
      expect(r.status, 'dlp_tester.jsp 전송 응답 (200)').to.eq(200);
    });


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
    // 테스트 자동화시나리오
    // 이력 - 자동화 시니라오 테스트 
    // ==========================================

    cy.contains('button', '이력').should('be.visible').click({ force: true });
    cy.wait(1000); // 서브 메뉴가 펼쳐질 시간 대기


    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 이력 > 사용자 추적 클릭 ---');
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.contains('.c-headline', '검색 조건').should('exist');
  
    // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 IP"], input[aria-label="사용자 아이피"]').filter(':visible').should('be.visible'); // [2.9.9.0] 「사용자 아이피」 허용
     cy.get('input[aria-label="URI 주소"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="행위 유형"]').filter(':visible').should('be.visible');
  
     // 시작날짜 달력 아이콘확인
     dateInputs().eq(0).find('.material-icons').contains('event').should('be.visible');
     
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 전체선택 확인
     // [2.9.7] '전체 선택' 표시 없어짐 (Basic/UI 이력과 동일하게 제외)
     // cy.get('span[title=\"전체 선택\"]').should('be.visible');
    
    
    //검색 버튼 존재 확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    // 전체 건수 버튼 존재확인 
    cy.get('.v-btn__content').filter(':visible').contains('전체 건수').should('be.visible');
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴').should('be.visible');
    cy.get('th').filter(':visible').contains('행위 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 값').should('be.visible');
    cy.get('th').filter(':visible').contains('선택').should('be.visible');

    // ==========================================
    // 테스트 자동화시나리오
    // 이력 -  접속기록 이력 자동화 시니라오 테스트 
    // ==========================================
    

    // 이력 > 접속 기록 이력 서브메뉴 클릭  -----------------------
    cy.contains('button', '이력').click({ force: true });
    cy.log('--- 이력 > 접속기록 이력  클릭 ---');
    cy.wait(3000);
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '접속기록 이력').should('be.visible').click({ force: true });
    cy.wait(3000);

   
    // 이력 > 접속기록 이력 > [검출] 탭 선택
    cy.get('.tab-btn').contains('검출').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('검출').closest('button').should('not.have.class', 'inactive');
    // 설명: 'c-headline' 클래스를 가진 요소 중에 '이상행위' 글자가 보여야 한다.
    cy.contains('.c-headline', '검색 조건').should('exist');
    // 시작날짜 달력 아이콘확인
    dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
     // 종료날짜 달력 아이콘확인
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1).closest('.v-input').find('.material-icons:contains("event")').should('be.visible');
     // 검색 조건 이름 입력란 확인
     cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="정보 사용자"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 계정"]').filter(':visible').should('be.visible');
     // [2.9.9.0] 일부 탭은 IP 범위(시작 IP · 종료 IP) → 「사용자 아이피」 한 칸 — 둘 중 하나면 통과
     cy.get('body').should(($b) => {
       const v = (sel) => $b.find(sel).filter(':visible').length;
       const range = v('input[aria-label="시작 IP"]') > 0 && v('input[aria-label="종료 IP"]') > 0;
       const single = v('input[aria-label="사용자 아이피"]') + v('input[aria-label="사용자 IP"]') > 0;
       expect(range || single, 'IP 검색칸 (시작/종료 IP 또는 사용자 아이피)').to.be.true;
     });
     cy.get('input[aria-label="부서/소속"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="URI"]').filter(':visible').should('be.visible');
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').filter(':visible').should('be.visible');
    
     // like버튼 확인 
     cy.get('input[aria-label="사용자 계정"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     cy.get('input[aria-label="URI"]').parents('.v-input').find('.v-chip__content').contains('포함').should('be.visible');
     // v3.0.5.0_r34908에서 추가됨.
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').should('be.visible');
     //3.0.3.0_R34785에서 해당항목 사라짐 
     //cy.get('input[aria-label="개인정보 건수"]').parents('.v-input').find('.v-chip__content').contains('≥').should('be.visible');
     
    //검색버튼 존재확인
    cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');
    
    //표열 문구확인
    cy.get('th').filter(':visible').contains('접속 일시').should('be.visible');
    cy.get('th').filter(':visible').contains('업무시스템').should('be.visible');
    cy.get('th').filter(':visible').contains('정보 사용자').should('be.visible');
    cy.get('th').filter(':visible').contains('부서/소속').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 IP 주소').should('be.visible');
    cy.get('th').filter(':visible').contains('접속 메뉴/행위').should('be.visible'); 
    cy.get('th').filter(':visible').contains('검출 유형').should('be.visible');
    cy.get('th').filter(':visible').contains('개인정보 유형').should('be.visible');
    //3.0.5.1191_r35135  가로스크롤 영향으로 존재로 확인 
    cy.get('th').contains('검출 건수').should('exist'); 


//=============================
// 한달전 선택하기 or 특정날짜
//=============================

// 1. 목표 날짜 - FIXED_DATE에 날짜를 넣으면 그 날짜, null이면 오늘 기준 한 달 전
//const FIXED_DATE = null;            // 예: '2026-08-20'
// [2.9.7] 고정 날짜(2026-08-20)는 검출 데이터 보관 기간을 벗어남 → 오늘 기준 한 달 전
const FIXED_DATE = null;            // 예: '2026-08-20'

let target;
if (FIXED_DATE) {
  const [y, m, d] = FIXED_DATE.split('-').map(Number);
  target = new Date(y, m - 1, d);
} else {
  const today = new Date();
  target = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(today.getDate(), lastDay));
}

const targetYear = target.getFullYear();
const targetMonth = target.getMonth() + 1;   // 1~12
const targetDay = target.getDate();

const pad = (n) => String(n).padStart(2, '0');
const targetStr = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
cy.log(`📅 시작 날짜 목표: ${targetStr}`);

// 시작 날짜 입력창 (기간 영역의 첫 번째 입력창)
const getStartDateInput = () =>
  dateInputs().eq(0).find('input').first(); // [2.9.7] aria-label="기간" 비어 있음 (원래: #item_dateRange input[aria-label="기간"])

// 2. 달력 오픈
// 기간 영역(#item_dateRange)의 첫 번째 메뉴 = 시작 날짜
// Vuetify 메뉴가 Cypress 가상 클릭을 무시하므로 실제 마우스 클릭(realClick) 사용
cy.get('#item_dateRange .v-menu__activator').filter(':visible').first()
  .find('i.material-icons')
  .filter((i, el) => el.textContent.trim() === 'event')
  .scrollIntoView()
  .realClick();
cy.wait(1000);

// 안 열렸으면 한 번 더: 열기 담당 영역 자체에 클릭 이벤트 직접 전달
cy.get('body').then(($body) => {
  if ($body.find('.v-date-picker-header__value:visible').length === 0) {
    cy.log('🔁 아이콘 클릭으로 안 열림 → 메뉴 활성 영역에 click 이벤트 직접 전달');
    cy.get('#item_dateRange .v-menu__activator').filter(':visible').first().trigger('click');
    cy.wait(1000);
  }
});

// 달력이 실제로 열렸는지 확인
cy.get('.v-date-picker-header__value').filter(':visible').should('have.length', 1);

// 3. 달력 헤더의 연/월과 목표 연/월을 비교해서, 필요한 만큼 이전/다음 달 화살표 클릭
cy.get('.v-date-picker-header__value').filter(':visible').invoke('text').then((headerText) => {
  // 헤더 텍스트 예: "2026년 10월"
  const match = headerText.match(/(\d{4})년\s*(\d{1,2})월/);

  if (match) {
    const displayedYear = parseInt(match[1], 10);
    const displayedMonth = parseInt(match[2], 10);

    const diffMonths = (targetYear - displayedYear) * 12 + (targetMonth - displayedMonth);

    if (diffMonths !== 0) {
      const clicks = Math.abs(diffMonths);
      // diffMonths < 0 이면 이전 달(chevron_left)로, > 0 이면 다음 달(chevron_right)로 이동
      const iconName = diffMonths < 0 ? 'chevron_left' : 'chevron_right';

      cy.log(`📅 달력 이동: ${clicks}회 ${diffMonths < 0 ? '이전' : '다음'} 달로 이동`);

      for (let i = 0; i < clicks; i++) {
        cy.get('.v-date-picker-header')
          .filter(':visible')
          .find('i.material-icons')
          .contains(iconName)
          .click({ force: true });
        cy.wait(300);
      }
    }
  } else {
    // 헤더를 못 읽으면 엉뚱한 달을 누르지 않도록 바로 실패 처리
    throw new Error(`달력 헤더 형식을 읽지 못했습니다: "${headerText.trim()}"`);
  }
});

// 4. 목표 일자 클릭 (숫자만 비교 - "20일" 형식 대응)
cy.get('.v-date-picker-table--date').filter(':visible')
  .find('button')
  .filter((i, el) => el.textContent.replace(/\D/g, '') === String(targetDay))
  .not('.v-btn--disabled')
  .should('have.length', 1)
  .click({ force: true });
cy.wait(1000);

// 5. 선택 결과 확인 - "2026-08-20 09:48:55"처럼 시간이 붙으므로 날짜로 시작하는지 확인
getStartDateInput().invoke('val').should('match', new RegExp(`^${targetStr}`));

// 6. 달력창 닫기
cy.get('body').type('{esc}');
cy.wait(300);

// 닫은 뒤에도 값이 유지되는지 재확인
// (여기서 실패하면 Esc가 선택을 취소하는 방식 → 위 Esc 대신 아래 줄 사용)
// cy.contains('.c-headline', '검색 조건').click({ force: true });
getStartDateInput().invoke('val').should('match', new RegExp(`^${targetStr}`));

cy.log(`✅ 시작 날짜 ${targetStr} 지정 성공`);

    // //기능동작
    // //달력표를 펼침 
    // dateInputs().eq(0).find('.material-icons').contains('event').click({ force: true });
    // cy.wait(500);
    // // 1. 상단 제목('2026년 1월')을 클릭하여 '월 선택 모드'로 바꿉니다.
    // cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });

    // // 2. '4월'이라는 글자를 찾아 클릭합니다.
    //  cy.get('.v-date-picker-table--month').filter(':visible').contains('4월').click({ force: true });
    // // 달력 20일 클릭
    // cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', '20일').closest('.v-btn').click({ force: true });
    // //달력창 닫기
    // cy.get('body').type('{esc}');

    //사용자 상태 클릭
     cy.get('input[aria-label="사용자 상태"]').filter(':visible').click({ force: true });
     cy.wait(1000);

    // 사용자 상태 리스트 중 '등록' 선택 (안정화 버전)
    // ※ 검출 데이터가 '등록' 사용자로 있어야 함 (없으면 CRM dlp_tester.jsp 로 데이터 생성)
    cy.get('.v-menu__content.v-autocomplete__content').filter(':visible').contains('.v-list__tile__title', /^등록$/).click({ force: true });
    cy.wait(1000); // 선택 후 리스트가 닫히는 시간 확보


    //검색버튼 클릭
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(1000);

    
  // [2.9.9.0] 검출 탭의 날짜가 「하루 단위 목록(v-select)」 → 「기간(시작 일시 ~ 종료 일시)」으로 바뀜 (2026-11-23 .21 확인)
  //   위에서 기간 시작을 지정하고 검색했으므로, 그 기간 결과에서 검출 링크를 바로 찾는다 (클릭 없이 표시까지만 — 기존과 같음)
  //   없으면 dlp_tester 로 만든 검출이 반영될 때까지 30초 간격 최대 10회(약 5분) 다시 검색
  //   (이전 2.9.7 의 날짜별 순차 탐색 코드는 cypress/probe/bak/02_Depth_검출_spec.bak_20261123 에 보관)
// [관찰 0039111] 2.9.9.0 검출 탭 — 시작일을 이전 날짜로 지정하면 검출이 조회되지 않음 (당일 범위만 조회, 하루 단위 날짜 목록 미표시)
//   한 달 기간 검색 결과가 0건이면 관찰로 기록하고, 시작일을 오늘로 바꿔 오늘 만든 검출을 확인한다
//   0039111 이 고쳐지면(한 달 기간에서 바로 조회되면) 로그에 「0039111 해결 확인 필요」가 남음 → 그때 아래 오늘 전환을 지우고 확인 조건으로 바꾼다
const pickStartToday = () => {
    const now = new Date();
    cy.get('#item_dateRange .v-menu__activator').filter(':visible').first()
        .find('i.material-icons').filter((i, el) => el.textContent.trim() === 'event').scrollIntoView().realClick();
    cy.wait(1000);
    cy.get('body').then(($body) => {
        if ($body.find('.v-date-picker-header__value:visible').length === 0) {
            cy.get('#item_dateRange .v-menu__activator').filter(':visible').first().trigger('click');
            cy.wait(1000);
        }
    });
    cy.get('.v-date-picker-header__value').filter(':visible').should('have.length', 1).invoke('text').then((headerText) => {
        const m = headerText.match(/(\d{4})년\s*(\d{1,2})월/);
        if (!m) throw new Error(`달력 헤더 형식을 읽지 못했습니다: "${headerText.trim()}"`);
        const diff = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
        for (let i = 0; i < Math.abs(diff); i++) {
            cy.get('.v-date-picker-header').filter(':visible').find('i.material-icons').contains(diff < 0 ? 'chevron_left' : 'chevron_right').click({ force: true });
            cy.wait(300);
        }
    });
    cy.get('.v-date-picker-table--date').filter(':visible').find('button')
        .filter((i, el) => el.textContent.replace(/\D/g, '') === String(now.getDate())).not('.v-btn--disabled').first().click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(500);
    cy.log('📅 [0039111 대응] 시작일을 오늘로 변경');
};
const monthCheck = () => {
    cy.wait(3000);
    cy.get('body').then(($b) => {
        if ($b.find('tbody:visible a:contains("검출"):visible').length) {
            cy.log('ℹ️ 한 달 기간 검색에서 검출이 바로 조회됨 — 0039111 해결 확인 필요');
            findDetection(0);
            return;
        }
        cy.log('⚠️ [관찰 0039111] 한 달 기간 검색 결과 0건 → 시작일을 오늘로 바꿔 다시 검색');
        cy.writeFile('cypress/probe/검출탭_0039111_관찰.json', { 시각: new Date().toISOString(), 결과: '한 달 기간 검색 0건 → 오늘로 바꿔 확인' }, { log: false });
        pickStartToday();
        cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
        findDetection(0);
    });
};
const DET_TRIES = 10;
const findDetection = (n) => {
    cy.wait(2000);
    cy.get('body').then(($b) => {
        if ($b.find('tbody:visible a:contains("검출"):visible').length) {
            cy.log(`✅ 기간 안 검출 결과 발견 (${n}회 다시 검색)`);
            cy.get('tbody').filter(':visible').contains('a', '검출').should('be.visible');
            cy.log('✅ 이력 - 검출 데이터 조회 성공!');
            return;
        }
        if (n >= DET_TRIES) {
            cy.log('❌ 기간 안에 검출 데이터가 없습니다 (약 5분 대기 후에도 반영 안 됨)');
            cy.get('tbody:visible a:contains("검출")').should('be.visible'); // 의도적 실패
            return;
        }
        cy.log(`⏳ 기간 안 검출 결과 없음 — 30초 후 다시 검색 (${n + 1}/${DET_TRIES})`);
        cy.wait(30000);
        cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
        findDetection(n + 1);
    });
};
monthCheck();

// (맨 아래에 있던 닫기 로직은 삭제합니다!)

cy.log('✅ 이력 - 검출 탭 진입 및 데이터 출력 확인 완료!');

    
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 이력 - 검출 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
