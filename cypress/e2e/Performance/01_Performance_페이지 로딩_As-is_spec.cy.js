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
      'operate.task.packageManagement',
      'e is not defined',
      'Script error'
    ];

    // 위 목록 중 하나라도 포함되면 에러를 무시함
    if (ignoredErrors.some(e => err.message.includes(e))) {
      return false;
    }
  });

  it('로그캐치 페이지별 성능 측정', () => {

      // 💡 [공통 설정] 성능 측정 옵션을 매번 쓰지 않도록 상단에 한 번만 정의합니다.
      // 성능 커트라인 기준 설정 
      const thresholds = {
      // 종합 성능점수 
      // 20점 이상이면 합격  만약 19점이면 테스트는 실패하며 에러 발생
      performance: 20, 

      // 페이지 화면 초기에 첫번째 글자나 이미지가 보이기까지 시간 
      // 40초 커트라인  40초안에 뭐라도 하나 뜨면 성공            
      'first-contentful-paint': 40000,
      
      // 가장 크고 중요한 요소가 완전히 다 그려지는데 걸리는 시간 
      // 60초 커트라인 60초이상이면 테스트 실패
      'largest-contentful-paint': 60000, 
    };
    const lighthouseOptions = {
      formFactor: 'desktop',
      screenEmulation: { disabled: true },
      // 주석처리시: 일반적인 가정용/사무용 광랜 또는 느린 3G/4G 수준(약 10Mbps)으로 대역폭 강제 제한 CPU 속도 강제제한 (네트워크 느린환경 구현 )
      //throttlingMethod: 'provided', // 사내망 쾌적한 속도 그대로 측정
    };
    const lighthouseConfig = {
      extends: 'lighthouse:default',
      settings: { output: 'html' } 
    };

    // 👇 파일명에 붙일수있는 숫자 - 전체 파일명에 일괄 적용
    const ServerIP = '42';
    // ==========================================
    // 🎯 [측정 1] 로그인 페이지 진입 및 성능 측정
    // ==========================================
    cy.visit('https://10.10.54.42:18443/logcatch/login');
    cy.wait(4000); // 로딩 대기

    // (흰 화면 새로고침 방어 로직)
    cy.get('body').then(($body) => {
      if ($body.find('input[aria-label="사용자 계정"]').length === 0) {
        cy.log('🔴 화면 렌더링 실패 감지! 페이지를 새로고침합니다.');
        cy.reload();
        cy.wait(2000);
      } else {
        cy.log('🟢 화면이 정상적으로 로드되었습니다.');
      }
    });

    // 👇 첫 번째 측정: 로그인 화면 자체의 로딩 속도
    cy.log('🚀 [0/11] 로그인 페이지 성능 측정을 시작합니다...');
    // 👇 [추가] 파일명을 '로그인'으로 지정
    cy.task('setReportName', `로그인 전_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // STEP 1: 로그인 수행
    // ==========================================
    cy.get('input[aria-label="사용자 계정"]').should('exist').type('admin', { force: true });
    cy.get('input[aria-label="패스워드"]').should('exist').type('Manager1!', { force: true }); 
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });

    // (이미 로그인 알림창 처리)
    cy.wait(2000); 
    cy.get('body').then(($body) => {
      if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
          cy.log('⚠️ 알림창 발견! 확인 버튼을 클릭합니다.');
          cy.contains('.v-card__title', '이미 접속 중인 계정입니다.')
            .closest('.v-card')
            .contains('확인')
            .click({ force: true }); 
          cy.wait(1000); 
      } else {
          cy.log('✅ 알림창이 없습니다. 넘어갑니다.');
      }
    });

    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(3000); // 메인 대시보드 로딩 안정화


    cy.log('🚀 [1/11] 로그인완료후 페이지 성능 측정을 시작합니다...');
    cy.task('setReportName', `로그인 후_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);



    // ==========================================
    // 🎯 [측정 2] '이력' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '이력').should('be.visible').click({ force: true });
    cy.wait(2000); // 서브 메뉴가 펼쳐질 시간 대기

    // 이력 > 사용자 추척 서브메뉴 클릭 
    cy.log('--- 이력 > 사용자 추적 클릭 ---');
    // 설명: .v-list__tile__title 클래스 내의 '사용자 추적' 글자를 찾아 클릭
    cy.contains('.v-list__tile__title', '사용자 추적').should('be.visible').click({ force: true });
    cy.wait(3000);
    cy.log('--- 화면 검증 시작 ---');
    cy.get('input[aria-label="업무시스템"]').filter(':visible').should('be.visible');
    cy.wait(3000);
  
    // 👇 두 번째 측정: 이력 화면 로딩 속도
    cy.log('🚀 [2/11] 이력 페이지 성능 측정을 시작합니다...');
    // 👇 [추가] 파일명을 '이력'으로 지정
    cy.task('setReportName', `이력_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 3] '현황' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '현황').click({ force: true });
    cy.wait(3000); 
  

    // 👇 세 번째 측정: 현황 화면 로딩 속도
    cy.log('🚀 [3/11] 현황 페이지 성능 측정을 시작합니다...');
    // 👇 [추가] 파일명을 '현황'으로 지정
    cy.task('setReportName', `현황_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);

    // ==========================================
    // 🎯 [측정 4] '소명' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '소명').click({ force: true });
    cy.wait(3000); 
   
    cy.log('--- 소명 > 관리 서브메뉴 클릭 ---');
    //서브메뉴 관리 클릭 (정교하게)
    cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').contains('관리').click({ force: true });

    cy.log('🚀 [4/11] 소명 페이지 성능 측정을 시작합니다...');
    cy.task('setReportName', `소명_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 5] '자산' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '자산').click({ force: true });
    cy.wait(3000); 
   

    cy.log('---자산-데이터베이스 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("데이터베이스")').filter(':visible').eq(0).click({ force: true });

    cy.log('🚀 [5/11] 자산 페이지 성능 측정을 시작합니다...');
    cy.task('setReportName', `자산_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 6] '보고' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '보고').click({ force: true });
    cy.wait(3000); 
    

    cy.log('🚀 [6/11] 보고 페이지 성능 측정을 시작합니다...');
    cy.task('setReportName', `보고_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 7] '보관' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '보관').click({ force: true });
    cy.wait(3000); 
   
    cy.log('---보관-접속기록 보관 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("접속기록 보관")').filter(':visible').click({ force: true });

    cy.log('🚀 [7/11] 보관 페이지 성능 측정을 시작합니다...');
    cy.task('setReportName', `보관_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 8] '분석' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '분석').click({ force: true });
    cy.wait(3000); 
   ;

    cy.log('🚀 [8/11] 분석 페이지 성능 측정을 시작합니다...');
     cy.task('setReportName', `분석_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 9] '검출' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '검출').should('be.visible').click({ force: true });
    cy.wait(3000); 
    

    cy.log('---검출 - 필터 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("필터")').filter(':visible').click({ force: true });

    cy.log('🚀 [9/11] 검출 페이지 성능 측정을 시작합니다...');
     cy.task('setReportName', `검출_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 10] '운영' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '운영').click({ force: true });
    cy.wait(3000); 
   
    cy.log('---운영 - 태스크 서브메뉴 클릭 ---');
    cy.get('.v-list__tile__title').filter(':contains("태스크")').filter(':visible').click({ force: true });

    cy.log('🚀 [10/11] 운영 페이지 성능 측정을 시작합니다...');
     cy.task('setReportName', `운영_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);


    // ==========================================
    // 🎯 [측정 11] '점검' 페이지 이동 및 성능 측정
    // ==========================================
    cy.contains('button', '점검').click({ force: true });
    cy.wait(3000); 
    

    cy.log('🚀 [11/11] 점검 페이지 성능 측정을 시작합니다...');
     cy.task('setReportName', `점검_${ServerIP}`);
    cy.lighthouse(thresholds, lighthouseOptions, lighthouseConfig);
  
    // ==========================================
    // [FINAL] 테스트 종료 및 메뉴 닫기
    // ==========================================
    cy.log('🎉 12 페이지 성능 측정 완료!');
    cy.get('body').type('{esc}');
    cy.get('body').click('center', { force: true });

  });
});