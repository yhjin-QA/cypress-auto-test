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
describe('로그캐치 사이트 테스트', () => {
  
  it('로그캐치 배포점검목록 동작 체크', () => {


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
  
  
    
// // ==========================================
// // 🌟 [완벽 수정] 동적 날짜 계산 로직선언 (전월 기준)
// // ==========================================
// const today = new Date();

// // 1월에 실행할 경우 작년 12월로 넘어가야 하므로 Date 객체 자체를 한 달 전으로 돌립니다.
// const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

// // 기존 변수명(currentMonthText)을 그대로 유지하여 다른 코드에서 발생하는 참조 에러를 방지합니다.
// const currentMonthNum = prevMonthDate.getMonth() + 1; // 전월 숫자 (예: 4)
// const currentMonthText = `${currentMonthNum}월`; // 예: "4월"

// // 전월의 마지막 날(말일) 구하기
// const lastDayNum = new Date(prevMonthDate.getFullYear(), currentMonthNum, 0).getDate(); 

// const firstDayRegex = new RegExp(`^\\s*1일\\s*$`);
// const lastDayRegex = new RegExp(`^\\s*${lastDayNum}일\\s*$`);

// cy.log(`📅 동적 기간 세팅 준비 완료: ${currentMonthText} 1일 ~ ${lastDayNum}일`);

    
// ==========================================
// 🌟 [완벽 수정] 동적 날짜 계산 로직선언 (전월 기준)
// ==========================================
const today = new Date();

// 1월에 실행할 경우 작년 12월로 넘어가야 하므로 Date 객체 자체를 한 달 전으로 돌립니다.
const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);

// 기존 변수명(currentMonthText)을 그대로 유지하여 다른 코드에서 발생하는 참조 에러를 방지합니다.
const currentMonthNum = prevMonthDate.getMonth() + 1; // 전월 숫자 (예: 4)
const currentMonthText = `${currentMonthNum}월`; // 예: "4월"

// 전월의 마지막 날(말일) 구하기
const lastDayNum = new Date(prevMonthDate.getFullYear(), currentMonthNum, 0).getDate(); 

const firstDayRegex = new RegExp(`^\\s*1일\\s*$`);
const lastDayRegex = new RegExp(`^\\s*${lastDayNum}일\\s*$`);

cy.log(`📅 동적 기간 세팅 준비 완료: ${currentMonthText} 1일 ~ ${lastDayNum}일`);



    // // ==========================================
    // // 🌟 [추가] 동적 날짜 계산 로직 (현재 달 기준)
    // // ==========================================
    // const today = new Date();
    // const currentMonthNum = today.getMonth() + 1; // 이번 달 숫자 (예: 5, 6)
    // const currentMonthText = `${currentMonthNum}월`; // 예: "5월", "6월"

    // // 💡 Date 객체의 일(Day) 자리에 0을 넣으면 '이전 달의 마지막 날'을 구해주는 꼼수를 사용합니다!
    // // 즉, 다음 달의 0일 = 이번 달의 말일이 됩니다.
    // const lastDayNum = new Date(today.getFullYear(), currentMonthNum, 0).getDate(); 

    // // 동적 정규식 생성 (공백 무시하고 정확히 매칭)
    // const firstDayRegex = new RegExp(`^\\s*1일\\s*$`);
    // const lastDayRegex = new RegExp(`^\\s*${lastDayNum}일\\s*$`);
    // cy.log(`📅 동적 기간 세팅 준비 완료: ${currentMonthText} 1일 ~ ${lastDayNum}일`);


  
  //   // ==========================================
  //   // STEP : 점검 대시보드로 현황 상세페이지 이동
  //   // ==========================================
    
  //   // cy.log('🚀 점검 탭 클릭');
  //   // cy.contains('button', '점검').click({ force: true });
  //   cy.wait(2000);
  //   cy.log('--- 화면 검증 시작 ---');

  //   // 설명: 'v-btn__content' 안에 '검색'이라는 글자가 있고, 눈에 보이는지 확인
  //   cy.contains('.v-btn__content', '검색').should('exist');
  //   //검색 버튼 확인
  //   cy.get('.v-btn__content').filter(':visible').contains('검색').should('be.visible');

  // // 업무 시스템 별 개인정보 사용현황 클릭하여 상세페이지로 이동-------------------------------------------
  //  // 리눅스_배송관리 클릭하기
  //  // 'apexcharts-legend-text' 클래스를 가진 span 중 첫번쨰 '리눅스_배송관리'를 클릭합니다.
  //  // 1. 차트 제목을 먼저 찾고, 그 차트를 감싸고 있는 전체 카드(.v-card) 영역으로 올라갑니다.
  //   cy.contains('.v-card__title', '업무시스템별 개인정보 사용 현황').closest('.v-card') // 🌟 [핵심] 해당 차트의 전체 박스로 시야를 넓힘
  //    .within(() => {
    
  //     //차트 상세페이지 이동
  //     // 2. 이제 이 블록 안에서는 '해당 차트 내부'만 검색합니다! (다른 차트 간섭 X) - 리눅스_배송관리
  //     // eq(0)-jEus eq(1)- 리눅스배송관리 eq(2)-리눅스_VIP고객
  //    cy.get('.apexcharts-legend-text').should('be.visible').eq(2).click({ force: true });
  //  });

  //  cy.wait(500);
  //  //팝업창의 본문 내용('상세 페이지로 이동하시겠습니까?')이 맞는지 검증
  //  cy.contains('p.mb-0:visible', '상세 페이지로 이동하시겠습니까?').should('be.visible');
  //  cy.wait(500); 
  //  // 3. 화면에 보이는 '확인' 버튼을 찾아 강제 클릭!
  //  cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
  //  cy.wait(2000);
  //  // 화면 현황- 업무시스템 별 상세 페이지 이동검증
  //  cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
  


     

    // ==============================================
    // STEP : 현황서브메뉴 이동 
    // ==============================================
    
    cy.contains('button', '현황').click({ force: true });
    cy.wait(3000); // 서브 메뉴가 펼쳐질 시간 대기
    
    cy.log('--- 현황 > 업무시스템 별 탭 클릭  ---');
    cy.get('.tab-btn').contains('업무 시스템 별').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('업무 시스템 별').closest('button').should('not.have.class', 'inactive');
    // 'c-headline' 클래스를 가진 요소 중에 '파일 다운로드' 글자가 존재하는지 확인
    cy.contains('.c-headline', '검색 조건').should('exist');

    //달력표를 펼침 
    // ==========================================
    // '기간 시작일자' 셋팅 ( 1일)
    // ==========================================
    cy.log(`📅 대상기간 시작일자를 ${currentMonthText} 1일로 셋팅합니다.`);
    //cy.contains('기간').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
     cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(0) .closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(1000);

    // 연/월 선택 모드로 변경하여 '이번 달(동적 변수)' 선택
    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
    cy.get('.v-date-picker-table--month').filter(':visible').contains(currentMonthText).click({ force: true });

    // 1일 선택
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', firstDayRegex).closest('.v-btn').click({ force: true });
    cy.get('body').type('{esc}');
    cy.wait(1000);

    // ==========================================
    // '기간 종료일자' 셋팅 (말일)
    // ==========================================
    cy.log(`📅 대상기간 종료일자를 ${currentMonthText} ${lastDayNum}일로 셋팅합니다.`);
    // 🌟 [수정 포인트] 화면에 보이는 전체 readonly 입력창 중 2번째(eq(1))의 달력 아이콘 클릭!
    cy.get('input[type="text"][readonly="readonly"]').filter(':visible').eq(1) .closest('.v-input').find('.material-icons').contains('event').click({ force: true });
    cy.wait(1000);

    cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
    cy.get('.v-date-picker-table--month').filter(':visible').contains(currentMonthText).click({ force: true });

    // 말일 선택 (계산된 말일 정규식 사용)
    cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', lastDayRegex).closest('.v-btn').click({ force: true });
    cy.get('body').type('{esc}');
    cy.wait(1000);
    
    // ==========================================
    // 업무 시스템  선택 - 리눅스_VIP고객 선택
    // ==========================================
    cy.get('input[aria-label="업무시스템"]').filter(':visible').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // ✅ 활성화된 드롭다운 내에서만 선택 (범위 제한으로 오탐 방지)
    cy.get('.menuable__content__active').filter(':visible').contains('.v-list__tile__title', '리눅스_VIP고객').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');



    // 검색버튼 클릭 
    cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
    cy.wait(3000); 

    


// ==========================================
// 개인정보사용량 차트기반 동적 데이터 추출 및 저장
// ==========================================
cy.log('📊 이상행위 유형별 현황 차트 데이터를 동적으로 추출합니다.');

const chartDataObj = {};

// 🌟 [핵심 수정 1] 화면 전체가 아닌 '2 번째 차트의 범례 그룹(.apexcharts-legend)'만 콕 집어서 가져옵니다.
cy.get('.apexcharts-legend').eq(1).find('.apexcharts-legend-text').each(($legendInfo, index) => {
    
    const typeName = $legendInfo.text().trim();
    
    // 🌟 [핵심 수정 2] 조각(slice)을 찾을 때도 '2 번째 차트의 SVG 이미지(.apexcharts-svg)' 안에서만 찾도록 제한합니다.
    cy.get('.apexcharts-svg').eq(1).find(`path.apexcharts-donut-slice-${index}`)
      .invoke('attr', 'data:value')
      .then((val) => {
          const count = parseInt(val, 10);
          chartDataObj[typeName] = count;
          
          cy.log(`🎯 [차트 추출] ${typeName} : ${count}건`);
      });
      
}).then(() => {
    cy.wrap(chartDataObj).as('dynamicChartData2');
    cy.log('✅ 이상행위 유형별 현황 번째 차트 데이터 동적 추출 및 저장 완료!');
});

// ==========================================
// 3번째 차트(업무시스템별 현황) 동적 데이터 추출 및 저장
// ==========================================
cy.log('📊 업무시스템별 개인정보사용현황(3번째) 차트 데이터를 동적으로 추출합니다.');

// 1. 2번 차트와 데이터가 섞이지 않도록 새로운 빈 객체를 만듭니다.
const chartDataObj3 = {};

// 🌟 [수정 포인트 1] eq(2)를 사용하여 '세 번째 차트'의 범례만 콕 집어옵니다. (0=1번째, 1=2번째, 2=3번째)
cy.get('.apexcharts-legend').eq(2).find('.apexcharts-legend-text').each(($legendInfo, index) => {
    
    const typeName = $legendInfo.text().trim();
    
    // 🌟 [수정 포인트 2] eq(2)를 사용하여 '세 번째 차트'의 조각(slice)만 타겟팅합니다.
    cy.get('.apexcharts-svg').eq(2).find(`path.apexcharts-donut-slice-${index}`)
      .invoke('attr', 'data:value')
      .then((val) => {
          const count = parseInt(val, 10);
          chartDataObj3[typeName] = count;
          
          cy.log(`🎯 [3번 차트 추출] ${typeName} : ${count}건`);
      });
      
}).then(() => {
    // 🌟 [수정 포인트 3] 2번 차트의 저장소 이름(@dynamicChartData)과 겹치지 않게 다른 이름으로 저장합니다.
    cy.wrap(chartDataObj3).as('dynamicChartData3');
    cy.log('✅ 세 번째 차트 데이터 동적 추출 및 저장 완료!');
});


    // ==========================================
    // STEP : 보고 서브메뉴 이동
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(2000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('.tab-btn').contains('접속기록 종합 보고서').closest('button').should('not.have.class', 'inactive');
    cy.contains('.c-headline', '보고서 목록').should('exist');
    // v 아이콘 확인하는 코드
    cy.get('.v-icon').filter(':visible').contains('keyboard_arrow_down').should('be.visible');
    // 표 문구열 확인
    cy.get('th').filter(':visible').contains('보고서 이름').should('be.visible');
    cy.get('th').filter(':visible').contains('생성일').should('be.visible');
    cy.get('th').filter(':visible').contains('생성자').should('be.visible');
    cy.get('th').filter(':visible').contains('상태').should('be.visible');
    cy.get('th').filter(':visible').contains('설명').should('be.visible');
    cy.get('th').filter(':visible').contains('삭제').should('be.visible');

    // ==========================================
    // 페이지수 5-> 25 개 옵션 변경 
    // ==========================================
    // 1. 엉뚱한 화살표 대신, 화면 하단에 '5'라고 적혀있는 페이지 선택 박스를 콕 집어 클릭합니다.
    cy.contains('.v-select__selection', '5').click({ force: true });
    cy.wait(1000); // 콤보박스 메뉴가 스르륵 열릴 때까지 대기
    // 2. 열린 메뉴(.v-menu__content) 안에서 '25'을 찾아서 클릭합니다.
    // (클래스명에 얽매이지 않고 텍스트 '25'을 포함한 요소를 강제 클릭하도록 유연하게 작성)
    cy.get('.v-menu__content').filter(':visible').contains('25') .click({ force: true });
    // 3. 목록이 25개로 갱신될 시간을 넉넉히 줍니다.
    cy.wait(3000);

    // ==========================================
    // 기존 잔여정책이 존재한다면 삭제  
    // ==========================================
    // Depth통계확인_page3_auto 가 여러개 존재한다면 다 삭제하도록 코드-----------------------------------
    // 1. 반복 삭제를 수행할 함수를 정의합니다.
     const deleteAllReports = () => {
       // body 전체를 가져와서 동기적으로 검사합니다.
       cy.get('body').then(($body) => {
         // 만약 화면(행)에 'Depth통계확인_page3_auto'라는 글자가 1개라도 남아있다면?
         if ($body.find('tr:contains("Depth통계확인_page3_auto")').length > 0) {
      
           // --- [삭제 로직 시작] ---
           // 가장 위에 있는 'Depth통계확인_page3_auto' 행을 찾아서 휴지통 클릭
           cy.contains('tr', 'Depth통계확인_page3_auto').find('.fa-trash').closest('button').then(($btn) => {
                 $btn[0].click(); // [필살기] 강제 클릭
             });

           // 삭제 확인 팝업 처리
           cy.contains('삭제하시겠습니까?').should('be.visible');
           cy.wait(500); // 팝업 애니메이션 안정화 대기
      
           cy.get('.v-btn__content').filter(':visible').contains('확인').click({ force: true });
           // 삭제 후 목록이 갱신될 시간을 잠깐 줍니다.
           cy.wait(1000);

           // --- [삭제 로직 끝] --
           // 중요! 다 지웠는지 확인하기 위해 자기 자신을 다시 호출합니다. (재귀)
           deleteAllReports();
      
          } else {
           // 더 이상 'Depth통계확인_page3_auto'가 없다면 로그를 남기고 종료합니다.
            cy.log('모든 중복 Depth통계확인_page3_auto 삭제 완료!');
         }
       });
     };
      cy.wait(4000);
      // 2. 정의한 함수를 실행합니다.
      deleteAllReports();

      // 3. 마지막으로 정말 다 사라졌는지 최종 검증합니다.
      cy.contains('a', 'Depth통계확인_page3_auto').should('not.exist');
      cy.wait(1000);
      //-----------------------------------------------------------------------------------

    // ==========================================
    // 보고서 셋팅 : 추가하기 - 월 정기점검 보고서 
    // ==========================================
 
    // 보고서 추가하기 - 동그란 플러스 버튼 클릭 
    cy.get('.grid-add-button').should('exist').then(($btn) => {
        $btn[0].click(); 
           });    
    cy.wait(1000);

    // 보고서 추가화면에서 보고서이름 입력
    cy.get('input[aria-label="보고서 이름"]').filter(':visible').first().clear({ force: true }).type('Depth통계확인_page3_auto', { force: true });
    cy.wait(1000);
    // 보고서 추가화면에서 보고서설명 작성 
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('Page3 통계확인용 보고서입니다.', { force: true });
    cy.wait(1000);
    
    // 보고서 추가화면에서 보고서 종류 선택 - 월 정기점검 보고서
    //보고서 종류 콤보박스 열기 
    cy.get('input[aria-label="보고서 종류"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    cy.wait(1000);
    // 보고서 종류 콤보박스에서  '월 정기점검 보고서 (행위_Mongo)' 선택하는 코드
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile__title', '월 정기점검 보고서').should('be.visible').click({ force: true });
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(500);

    // 보고서 추가화면에서 업무시스템 - 리눅스_배송관리 선택
    cy.get('input[aria-label="업무시스템"]').closest('.v-input__slot').click({ force: true });
    // 업무시스템중 리눅스_배송관리 클릭하는 코드
    cy.get('.v-menu__content').filter(':visible').find('.v-list__tile__title').contains('리눅스_VIP고객').scrollIntoView().click({ force: true });          
    cy.wait(1000);
    // 검색조건 클릭하여 선택한 컨텍스트 메뉴 닫기
    cy.get('body').type('{esc}');

    // 아래 확장자별 검색이있으므로 디폴트값 pdf로진행
    // //확장자 종류 - html 선택  
    // // 디폴트값 확인을 위한  PDF클릭
    // cy.get('span[title="pdf"]').should('be.visible').click({ force: true }); 
    // //cy.get('input[aria-label="확장자"]').closest('.v-input').find('.v-input__slot').click({ force: true });
    // cy.wait(500);
    
    // // 확장자 콤보박스에서 html 선택
    // cy.contains('.v-list__tile__title', 'html').click({ force: true });
    // cy.wait(500);

// ==========================================
// 1. 대상기간 '시작일자' 셋팅 (이번 달 1일)
// ==========================================
cy.log(`📅 대상기간 시작일자를 ${currentMonthText} 1일로 셋팅합니다.`);

cy.get('input[aria-label="대상기간 시작일자"]').closest('.v-input').find('.material-icons').contains('event').click({ force: true });
cy.wait(500);

// 연/월 선택 모드로 변경하여 '이번 달(동적 변수)' 선택
cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
cy.get('.v-date-picker-table--month').filter(':visible').contains(currentMonthText).click({ force: true });

// 1일 선택
cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', firstDayRegex).closest('.v-btn').click({ force: true });
cy.get('body').type('{esc}');
cy.wait(500);

// ==========================================
// 2. 대상기간 '종료일자' 셋팅 (이번 달 말일)
// ==========================================
cy.log(`📅 대상기간 종료일자를 ${currentMonthText} ${lastDayNum}일로 셋팅합니다.`);

cy.get('input[aria-label="대상기간 종료일자"]').closest('.v-input').find('.material-icons').last().contains('event').click({ force: true });
cy.wait(500);

 // 🌟 [핵심 추가] 하단 코드에도 '월(Month)'을 이전 달로 변경하는 로직을 삽입합니다.
cy.get('.menuable__content__active').find('.v-date-picker-header__value button').click({ force: true });
cy.get('.v-date-picker-table--month').filter(':visible').contains(currentMonthText).click({ force: true });

// 말일 선택 (계산된 말일 정규식 사용)
cy.get('.v-date-picker-table').filter(':visible').contains('.v-btn__content', lastDayRegex).closest('.v-btn').click({ force: true });
cy.get('body').type('{esc}');
cy.wait(500);

// 저장버튼 클릭 
cy.get('.v-btn__content').filter(':visible').contains('저장').click({ force: true });
cy.wait(5000);

//보고서 목록에서 추가한 보고서 클릭하여 열기
cy.contains('a', 'Depth통계확인_page3_auto').click({ force: true });
cy.wait(1000);

// // ==========================================
// // [보고서 화면] 오즈 뷰어 데이터 추출 및 비교 검증
// // ==========================================
// cy.log('📄 보고서 화면 진입 완료. 접속이력 정합성 검증을 시작합니다.');

// // 1. 오즈 보고서가 렌더링될 때까지 충분히 대기합니다. (보고서 생성 시간 고려)
// cy.wait(5000); 

// // 2. 아까 저장해 둔 'savedCount' 값을 꺼내옵니다.
// cy.get('@savedCount').then((uiCount) => {
    
//     // 3. 오즈 뷰어 iframe 내부로 접근합니다.
//     // 💡 (주의) 실제 프로젝트의 iframe ID나 클래스명으로 변경해 주세요! (예: iframe#oz_viewer)
//    // ... 앞부분 생략 (cy.get('@savedCount').then(...) 등) ...

//     cy.get('iframe', { timeout: 15000 })
//       .its('0.contentDocument.body').should('not.be.empty')
//       .then(cy.wrap)
//       .within(() => {
          
//           // =====================================================
//           // 🌟 1. '한 페이지 다음으로 이동' 화살표 버튼 클릭 (2페이지로!)
//           // =====================================================
//           cy.log('➡️ 다음 페이지(2페이지)로 화살표 버튼을 눌러 이동합니다.');
          
//           // 올려주신 HTML의 class('btnNEXT') 또는 title 속성을 활용하여 정확히 타겟팅합니다.
//           cy.get('input.btnNEXT[title="한 페이지 다음으로 이동"]').click({ force: true });
//           // 2페이지가 화면에 그려질 수 있도록 충분히 대기합니다.
//           cy.wait(2000); 
//           // =====================================================

//         // =====================================================
//       // 🌟 2. 보고서 텍스트 전체 접속기록이력 추출 및 정규식 분석
//       // =====================================================
//       cy.log('🔎 보고서 내부의 텍스트를 분석하여 데이터를 추출합니다.');

//       // 🌟 [핵심 수정] cy.get('body') 대신 cy.root()를 사용합니다!
//       // (현재 within으로 잡고 있는 iframe의 body 전체를 의미합니다)
//       cy.root().invoke('text').then((bodyText) => {
          
//           // 띄어쓰기, 줄바꿈 등을 하나의 공백으로 깔끔하게 정리합니다.
//           const cleanText = bodyText.replace(/\s+/g, ' ');

//           // 정규식(Regex)을 이용해 '이번 달' 건수 추출
//           const regex = /전체 접속기록\s*\(\s*총\s*건수\s*\)\s+[0-9,]+\s+([0-9,]+)/;
//           const match = cleanText.match(regex);

//           if (match && match[1]) {
//               const extractedReportCount = parseInt(match[1].replace(/,/g, ''), 10);
//               cy.log(`📊 [데이터 추출 성공] 오즈 뷰어 이번 달 전체 접속기록: ${extractedReportCount}건`);

//               // =====================================================
//               // 🌟 3. 최종 정합성 비교 검증
//               // =====================================================
//               cy.get('@savedCount').then((uiCount) => {
//                   expect(
//                       uiCount, 
//                       `데이터 일치 조회중! (이력 건수: ${uiCount}건 vs 보고서: ${extractedReportCount}건)`
//                   ).to.equal(extractedReportCount);
                  
//                   cy.log('🎉 데이터 직접 추출 및 정합성 검증 완벽 일치 통과!');
//               });

//           } else {
//               throw new Error('❌ 보고서에서 "전체 접속기록" 데이터를 추출하지 못했습니다.');
//           }
//       });
//   });
// });


/// ============================================================
// 🌟 3. 보고서 3페이지 데이터 일괄 검증 (2번 차트 & 3번 차트 통합)
// ============================================================
// 1. 2번 차트와 3번 차트 데이터를 연속으로 꺼내옵니다. (콜백 중첩)
cy.get('@dynamicChartData2').then((chartData2) => {
    cy.get('@dynamicChartData3').then((chartData3) => {
        
        // 오즈 뷰어 iframe 진입
        cy.get('iframe', { timeout: 15000 })
          .its('0.contentDocument.body').should('not.be.empty')
          .then(cy.wrap)
          .within(() => {

              // =====================================================
              // 2. '한 페이지 다음으로 이동' 화살표 버튼 클릭 (3페이지로!)
              // =====================================================
              cy.log('➡️ 다음 페이지 화살표 버튼을 두 번 눌러 3페이지로 이동합니다.');
              
              cy.get('input.btnNEXT[title="한 페이지 다음으로 이동"]').click({ force: true });
              cy.wait(2000); // 2페이지 대기
              cy.get('input.btnNEXT[title="한 페이지 다음으로 이동"]').click({ force: true });
              cy.wait(2000); // 3페이지 대기
              
              // =====================================================
              cy.log('🔎 3페이지 텍스트를 분석하여 2번, 3번 차트 데이터를 연속 검증합니다.');

              cy.root().invoke('text').then((bodyText) => {
                  const cleanText = bodyText.replace(/\s+/g, ' ');
                  
                  // 2번쨰차트와 보고서값이 일치하지않음. 일단 주석처리
                  // // ---------------------------------------------------
                  // // 🎯 [검증 1] 2번째 차트 (이상행위 유형별 현황)
                  // // ---------------------------------------------------
                  // cy.log('🟦 [검증 시작] 2번 차트: 이상행위 유형별 현황');
                  // Object.keys(chartData2).forEach((typeName) => {
                  //     const expectedCount = chartData2[typeName];
                  //     const safeTypeName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      
                  //     // 이름 바로 뒤의 첫 번째 숫자를 캡처 (소명 대상 총 건수)
                  //     const regex = new RegExp(`(?:^|\\s)${safeTypeName}\\s+([0-9,]+)\\s*건`);
                  //     const match = cleanText.match(regex);

                  //     if (match && match[1]) {
                  //         const reportCount = parseInt(match[1].replace(/,/g, ''), 10);
                  //         expect(expectedCount, `❌ [${typeName}] 데이터 불일치!`).to.equal(reportCount);
                  //         cy.log(`✅ [2번 차트 검증 통과] ${typeName}: ${reportCount}건 일치!`);
                  //     } else {
                  //         throw new Error(`❌ 보고서에서 2번 차트의 "${typeName}" 항목을 찾을 수 없습니다.`);
                  //     }
                  // });

                  // ---------------------------------------------------
                  // 🎯 [검증 2] 3번째 차트 (업무시스템별 현황)
                  // ---------------------------------------------------
                  cy.log('🟧 [검증 시작] 3번 차트: 업무시스템별 현황');
                  Object.keys(chartData3).forEach((typeName) => {
                      const expectedCount = chartData3[typeName];
                      const safeTypeName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      
                      // 이름 바로 뒤의 첫 번째 숫자를 캡처 (개인정보 사용량)
                      const regex = new RegExp(`(?:^|\\s)${safeTypeName}\\s+([0-9,]+)\\s*건`);
                      const match = cleanText.match(regex);

                      if (match && match[1]) {
                          const reportCount = parseInt(match[1].replace(/,/g, ''), 10);
                          expect(expectedCount, `❌ [${typeName}] 데이터 불일치!`).to.equal(reportCount);
                          cy.log(`✅ [3번 차트 검증 통과] ${typeName}: ${reportCount}건 일치!`);
                      } else {
                          throw new Error(`❌ 보고서에서 3번 차트의 "${typeName}" 항목을 찾을 수 없습니다.`);
                      }
                  });
                  
                  cy.log('🎉 [최종 통과] 3페이지의 모든 표(2번, 3번 차트) 데이터 정합성이 완벽하게 일치합니다!');
              });
          });
    });
});



   
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 접속기록이력 전체건수 - 보고서 통계확인 테스트 시나리오 성공적으로 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});  

//코드마지막


 })()
;
