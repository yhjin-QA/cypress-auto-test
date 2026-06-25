describe('시나리오 4: 16-Way 제로 트러스트 & 메가 데이터 유출 자동화 타격', () => {

  // 테스트를 시작하기 전에 브라우저 해상도를 1080p로 맞추고 로그인 페이지로 이동합니다.
  beforeEach(() => {
    cy.viewport(1920, 1080);
    cy.visit('http://10.10.54.27:8080/crm/login.jsp'); 
  });

  it('16개의 모든 침해 사고 시나리오를 0.1초 단위로 순차 타격하고 관제망을 도배한다', () => {
    
    // 1. 로그인 단계 (UI Interaction)
    cy.log('▶ 1단계: 사용자 로그인');
    cy.get('#login_id').type('user118');        // 개발1팀 팀장 계정
    cy.get('#login_pw').type('Manager1!');      // 통일된 비밀번호 입력
    cy.get('#login_btn').click();

    // 🔥 16가지 타격 시나리오 명세서
    const scenarios = [
      { title: '고객 데이터 유출', result: '대량 고객 민감정보 노출' },
      { title: '임직원 주소록 유출', result: '사내 임직원 연락처 노출' },
      { title: '인증 크리덴셜 덤프', result: '패스워드 해시 무단 덤프' },
      { title: '감사 로그 스크래핑', result: '관리자 감사 로그 스크래핑' },
      { title: '기업 재무/원장 유출', result: '1급 기밀 재무 거래 원장 유출' },
      { title: '소스코드/지재권 유출', result: '핵심 소스코드 및 지적재산 유출' },
      { title: '의료정보(PHI) 유출', result: 'VIP 민감 건강/의료정보 탈취' },
      { title: '클라우드 인프라 탈취', result: '클라우드 인프라/네트워크 설정 스크래핑' },
      { title: '법무/M&A 기밀문서', result: '법무 및 M&A 기밀문서 열람' },
      { title: 'CS/챗봇 상담 로그', result: 'CS/챗봇 상담 로그 및 PII 노출' },
      { title: '물리 보안/생체 인증', result: '물리 보안/생체 인증 로그 탈취' },
      { title: '공급망(3rd) 토큰 탈취', result: '외부 공급망(3rd-Party) 웹훅 및 토큰 탈취' },
      { title: 'AI 모델/학습 데이터 탈취', result: '사내 AI 모델/학습 데이터 무단 추출' },
      { title: 'OT/SCADA 제어망 탈취', result: 'OT/SCADA 공장 및 사옥 제어망 탈취' },
      { title: '경영진(C-Level) 통신망', result: '경영진(C-Level) 비공개 통신망 스크래핑' },
      { title: '법인 가상자산 지갑 키', result: '법인 가상자산 콜드월렛 프라이빗 키 덤프' }
    ];

    // 로봇이 16개 시나리오를 순회하며 폭격 시작
    scenarios.forEach((scenario, index) => {
      cy.log(`▶ 타격 ${index + 1}: ${scenario.title}`);
      
      // 💡 [핵심 패치] 페이지가 새로고침 되었을 수 있으므로, 매 타격마다 3번 탭을 강제로 눌러줍니다.
      cy.visit('http://10.10.54.27:8080/crm/soc_matrix.jsp');
      
      // 사람처럼 카드 제목(h6)을 찾고 -> 실행 버튼 클릭
      cy.contains('h6', scenario.title).parents('.card').find('a').click();
      
      // 결과 테이블이 정상적으로 팝업되었는지 검증
      cy.contains(scenario.result).should('be.visible');
      
      // '닫기' 버튼을 눌러 상태 초기화 (페이지 새로고침 발생)
      cy.contains('닫기').click();
    });
  });
});