describe('시나리오 6: 고객 보안 제어 및 감사 로그(Modal) 자동화 검증', () => {
  
  beforeEach(() => {
    // 1. 해상도 세팅 및 보안 포털 로그인
    cy.viewport(1920, 1080);
    cy.visit('http://10.10.54.27:8080/crm/login.jsp');
    cy.get('#login_id').type('user118');
    cy.get('#login_pw').type('Manager1!');
    cy.get('#login_btn').click();
    
    // 메인 화면(고객 통합 관리 탭) 진입 확인
    cy.url().should('include', 'index.jsp');
  });

  it('특정 고객에 대한 민감한 보안 제어(마스킹 해제, 파기 등) 시 모달 경고와 로깅이 정상 작동한다', () => {
    
    // ---------------------------------------------------------
    // 🎯 1단계: 마스킹 해제(Unmask) 타격
    // ---------------------------------------------------------
    cy.log('▶ 1단계: 마스킹 해제(Unmask) 로깅 타격');
    
    // 테이블의 첫 번째 행에서 '👁️ 해제' 버튼 클릭
    cy.get('tbody tr').first().contains('해제').click();
    
    // 페이지가 새로고침되며 action=unmask 파라미터가 서버로 전송되었는지 검증
    cy.url().should('include', 'action=unmask');
    
    // 화면에 마스킹이 풀린 데이터(빨간색 글씨의 .unmasked 클래스)가 노출되었는지 확인
    cy.get('.unmasked').should('be.visible');


    // ---------------------------------------------------------
    // 🎯 2단계: 모달(Modal) 기반 보안 제어 연속 타격
    // ---------------------------------------------------------
    // 타격할 버튼 이름과, 클릭 시 서버로 전송될 action 파라미터 값 매핑
    const auditActions = [
      { btnText: '인쇄', actionParam: 'print' },
      { btnText: '수정', actionParam: 'edit' },
      { btnText: '결제이력', actionParam: 'payment' },
      { btnText: '비번초기화', actionParam: 'reset_pw' },
      { btnText: '블랙리스트', actionParam: 'blacklist' },
      { btnText: '파기', actionParam: 'delete' }
    ];

    // 배열을 순회하며 모달창 호출 -> 실행 확인 -> 서버 로깅을 반복 타격
    auditActions.forEach((audit, index) => {
      cy.log(`▶ 2단계-${index + 1}: [${audit.btnText}] 작업 모달 타격`);
      
      // 첫 번째 고객 행에서 해당 버튼(예: 파기) 클릭
      cy.get('tbody tr').first().contains(audit.btnText).click();

      // 보안 감사 알림 모달창이 화면에 떴는지 검증
      cy.get('#auditModal').should('be.visible');
      
      // 모달창 내용에 클릭한 작업의 이름(예: '파기 작업 실행')이 정확히 찍혔는지 확인
      cy.get('#modalActionName').should('contain', audit.btnText);

      // 모달창의 '실행 확인' 파란색 버튼 클릭
      cy.contains('button', '실행 확인').click();

      // 페이지가 새로고침된 후, URL에 해당 action 파라미터가 제대로 들어갔는지 검증
      // (이 URL 호출을 통해 백엔드에서 System.out.println 로그캐치 알람이 발생함)
      cy.url().should('include', `action=${audit.actionParam}`);
    });

    cy.log('✅ 개별 고객 보안 제어 및 로깅 자동화 검증 완료!');
  });
});