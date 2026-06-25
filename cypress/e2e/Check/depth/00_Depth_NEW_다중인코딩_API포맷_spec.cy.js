describe('시나리오 5: 다중 인코딩 및 최신 API 포맷 우회(Bypass) 타격', () => {
  beforeEach(() => {
    // 1. 해상도 세팅 및 보안 포털 로그인
    cy.viewport(1920, 1080);
    cy.visit('http://10.10.54.27:8080/crm/login.jsp');
    cy.get('#login_id').type('user118');
    cy.get('#login_pw').type('Manager1!');
    cy.get('#login_btn').click();
    
    // 메인 화면 진입 확인
    cy.url().should('include', 'index.jsp');
  });

  it('20종의 변칙 인코딩 및 API 포맷 페이로드를 서버에 융단폭격한다', () => {
    
    // 2. 인코딩/API 테스터 탭으로 이동 (a 태그 직접 클릭 방식)
    cy.log('▶ 2단계: API 테스터 화면 진입');
    cy.get('a[href="api_tester.jsp"]').click();
    cy.contains('인코딩 및 다중 응답 포맷 종합 검증 존').should('be.visible');

    // 3. 화면에 있는 모든 API 검증 버튼(완벽 복구된 20개)을 수집하여 순차 타격
    cy.get('.api-card a.btn').each(($btn, index) => {
      const apiEndpoint = $btn.attr('href');
      const formatName = $btn.text().trim();

      // 로그에 20발의 타격 상황을 명시적으로 출력
      cy.log(`[타격 ${index + 1}/20] 🎯 ${formatName} (경로: ${apiEndpoint})`);

      // 💡 UI 멈춤 방지를 위해 백엔드로 직접 패킷 발사!
      cy.request({
        method: 'GET',
        url: apiEndpoint,
        failOnStatusCode: false // api.jsp가 없어서 404가 나더라도 에러 없이 폭격 계속 진행
      }).then((response) => {
         cy.log(`   👉 서버 응답 상태: ${response.status}`);
      });
    });
    
    cy.log('✅ 20종의 변칙 API 우회 페이로드 전송 완료!');
  });
});