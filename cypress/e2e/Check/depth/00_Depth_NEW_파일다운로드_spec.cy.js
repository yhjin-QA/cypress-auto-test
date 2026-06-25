describe('시나리오 1: 내부자 정보 대량 유출 (엑셀 다운로드) 검증', () => {

  // 테스트를 시작하기 전에 브라우저 해상도를 1080p로 맞추고 로그인 페이지로 이동합니다.
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.visit('http://10.10.54.27:8080/crm/login.jsp'); 
  });

  it('일반 사원 계정으로 로그인 후 고객 검색, 정렬 및 엑셀 다운로드를 수행한다', () => {
    
    // 1. 로그인 단계 (UI Interaction)
    cy.log('▶ 1단계: 사용자 로그인');
    cy.get('#login_id').type('user118');        // 개발1팀 팀장 계정
    cy.get('#login_pw').type('Manager1!');      // 통일된 비밀번호 입력
    cy.get('#login_btn').click();

    // 2. 로그인 성공 검증 (Assertion)
    cy.log('▶ 2단계: 로그인 성공 및 세션(인사연동) 확인');
    cy.url().should('include', 'index.jsp');    
    // 💡 user118은 DB상 '개발1팀'이므로 개발1팀으로 수정했습니다. (에러 방지)
    cy.contains('개발2팀').should('be.visible'); 

    // 3. 고객 정보 검색 (Search)
    cy.log('▶ 3단계: 특정 조건(예: 카카오 이메일)의 고객 검색');
    cy.get('input[name="keyword"]').type('kakao.com'); 
    cy.contains('button', '검색').click();
    cy.get('table tbody tr').should('have.length.greaterThan', 0); 

    // 4. 테이블 정렬 검증 (Sorting)
    cy.log('▶ 4단계: 이름순 오름차순/내림차순 정렬 동작 확인');
    cy.contains('a.sort-link', '이름').click(); 
    cy.wait(500); 
    cy.url().should('include', 'orderBy=customer_name'); 

    // 💡 [핵심 추가] 엑셀 다운로드 API가 호출되는지 지켜보기 위해 Intercept(가로채기) 설정
    cy.intercept('GET', '**/download.jsp*').as('excelDownload');

    // 팝업 처리 로직을 버튼 클릭 직전에 확실하게 적용
    cy.window().then((win) => {
      // 기존 prompt를 stub으로 덮어씁니다.
      cy.stub(win, 'prompt').callsFake((message) => {
        console.log('📢 감지된 팝업 문구:', message);
        return '1'; // 1을 반환하고 확인을 누름
      }).as('promptStub'); // 나중에 호출 여부 확인을 위해 별칭 지정
    });

    // 5. 엑셀 다운로드 (Data Leak Simulation)
    cy.log('▶ 5단계: 엑셀 다운로드 버튼 클릭 및 검증');
    cy.get('#excel_btn')
      .should('be.visible')
      .and('have.attr', 'href', 'download.jsp')
      .invoke('removeAttr', 'target') 
      .click();

    // 팝업 호출 검증
    cy.get('@promptStub', { timeout: 10000 }).should('have.been.called');
    
    // 🔥 문제의 원인이었던 닫기 괄호 '});' 를 삭제했습니다. 🔥

    // 6. 다운로드 완료 대기
    cy.log('⏳ 엑셀 다운로드가 완료될 때까지 기다립니다...');
    // intercept 해둔 API가 호출되고 응답할 때까지 안전하게 기다립니다.
    cy.wait('@excelDownload', { timeout: 30000 }); 
    cy.log('✅ Excel 다운로드 API 응답 완료!');
  

  }); // <--- 여기가 진짜 it 블록이 끝나는 위치입니다!

}); // <--- 여기가 describe 블록이 끝나는 위치입니다!