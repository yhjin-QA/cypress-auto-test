describe('시나리오 7: 실시간 DLP(텍스트 & 파일 유출 방지) 알고리즘 전수 검증', () => {
  beforeEach(() => {
    // 1. 보안 포털 로그인
    cy.viewport(1920, 1080);
    cy.visit('http://10.10.54.27:8080/crm/login.jsp');
    cy.get('#login_id').type('user118');
    cy.get('#login_pw').type('Manager1!');
    cy.get('#login_btn').click();
  });

  it('채팅 메시지 및 첨부파일 내 민감정보 패턴 위반 시 외부 유출이 전면 차단된다', () => {
    
    // 2. DLP 테스터 화면 진입
    cy.log('▶ 1단계: DLP 테스터 화면 진입');
    cy.visit('http://10.10.54.27:8080/crm/dlp_tester.jsp');
    cy.contains('DCI & 파일 시그니처 가동 중').should('be.visible');

    // =========================================================
    // [PART A] 텍스트 기반 기밀정보(PII) 유출 차단 전수 검증
    // =========================================================

    cy.log('🟢 타격 A-1: 일반 텍스트 전송 테스트 (정상 통과)');
    cy.get('input[name="chatMsg"]').type('안녕하세요, 요청하신 회의록 파일은 내일 오전 중으로 메일로 송부해 드리겠습니다.{enter}');
    cy.get('.msg-right').should('contain', '회의록 파일은 내일');
    cy.get('.msg-system.text-danger').should('not.exist');

    cy.log('🔴 타격 A-2: 휴대폰 번호 전송 시도 (차단)');
    cy.get('input[name="chatMsg"]').type('VIP 고객님 긴급 연락처입니다. 010-8282-5353 으로 바로 전화주세요!{enter}');
    cy.get('.msg-system.text-danger').should('contain', '[휴대폰번호]');
    cy.get('.msg-blocked').should('contain', '010-****-****');

    cy.log('🔴 타격 A-3: 신용카드 번호 전송 시도 (차단)');
    cy.get('input[name="chatMsg"]').type('수수료 결제를 위해 법인카드 번호 남겨드립니다. 1234-5678-9012-3456 입니다. 확인 부탁드려요!{enter}');
    cy.get('.msg-system.text-danger').should('be.visible').and('contain', '보안 정책 위반').and('contain', '[신용카드]');
    cy.get('.msg-blocked').should('contain', '****-****-****-****');

    cy.log('🔴 타격 A-4: 주민등록번호 전송 시도 (차단)');
    // 주의: 테스트 환경 통과를 위해 서버 정규식에 맞는 임의의 13자리 숫자로 변경하여 사용하세요.
    cy.get('input[name="chatMsg"]').type('계약서 작성을 위해 제 정보 남깁니다. 991231-1234567 입니다.{enter}');
    cy.get('.msg-system.text-danger').should('be.visible').and('contain', '보안 정책 위반').and('contain', '[주민등록번호]');
    cy.get('.msg-blocked').should('contain', '******-*******');

    cy.log('🔴 타격 A-5: 복합 민감정보(여권+카드) 전송 시도 (다중 차단)');
    cy.get('input[name="chatMsg"]').type('항공권 예매를 위한 여권번호 M12345678, 그리고 결제용 카드 9876-5432-1098-7654 입니다.{enter}');
    cy.get('.msg-system.text-danger').should('contain', '[신용카드]').and('contain', '[여권번호]');
    cy.get('.msg-blocked').should('contain', '*********').and('contain', '****-****-****-****');


    // =========================================================
    // [PART B] 파일 DLP 및 확장자 위장(웹쉘) 우회 공격 차단 검증
    // =========================================================

    cy.log('🟢 파일 타격 B-1: 일반 이미지 파일 업로드 (정상 통과)');
    cy.get('#realFileInput').selectFile({
      contents: Cypress.Buffer.from('dummy_image_data'),
      fileName: 'family_photo.jpg'
    });
    cy.contains('보안 스캔 및 파일 전송').click();
    cy.get('.msg-right').should('contain', '성공적으로 전송했습니다: 📄 family_photo.jpg');

    cy.log('🔴 파일 타격 B-2: 대량 개인정보 포함 엑셀 유출 시도 (DCI 탐지 차단)');
    cy.get('#realFileInput').selectFile({
      contents: Cypress.Buffer.from('customer_ssn_card_list'),
      fileName: 'VIP고객기밀명단.xlsx'
    });
    cy.contains('보안 스캔 및 파일 전송').click();
    cy.get('.msg-system.text-danger').should('contain', 'DCI 엔진 작동');
    cy.get('.msg-blocked').should('contain', '전송 실패 파일명: VIP고객기밀명단.xlsx');

    cy.log('🔴 파일 타격 B-3: 고위험 .jsp 스크립트(웹쉘) 업로드 시도 (APT 방어 차단)');
    cy.get('#realFileInput').selectFile({
      contents: Cypress.Buffer.from('<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>'),
      fileName: 'cmd_webshell.jsp'
    });
    cy.contains('보안 스캔 및 파일 전송').click();
    cy.get('.msg-system.text-danger').should('contain', '위험 고위험 확장자(.jsp)');
    cy.get('.msg-blocked').should('contain', '전송 실패 파일명: cmd_webshell.jsp');

    cy.log('✅ 실시간 DLP 차단 및 마스킹 훈련 자동화 완료!');
  });
});