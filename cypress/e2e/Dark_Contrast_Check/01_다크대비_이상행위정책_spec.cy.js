// =====================================================================
// 다크 모드 글자 대비 검사 — 분석 > 이상행위 > 사용자 이상행위 정책
//   첫 검증 기준 (이미 등록된 결함이 실제로 잡히는지)
//     0038920 「폴더 이동」 창 폴더 선택 칸 글자 안 보임
//     0038921 「정책 가져오기」 창 단계 제목 흐림
//   창은 열린 상태에서만 검사되므로 창을 연 직후 checkContrast 를 부르고,
//   모든 창은 「취소」로 닫아 데이터는 바꾸지 않습니다.
//
//   실행 예)
//   npx cypress run --headed --browser chrome --config-file cypress.local.config.js ^
//     --spec "cypress/e2e/Dark_Contrast_Check/*.cy.js" --env TARGET_HOST=10.10.54.71
//   계정은 CypressWork/cypress.env.json (LC_USER / LC_PW, Git 제외) 에서 읽음
// =====================================================================
import '../../support/contrast';

const DIALOG = '.v-dialog--active';

// 로그인 — 09_Dev_분석 spec 과 같은 흐름 (공통 cy.login 은 「확정」 버튼을 찾아 실패하므로 쓰지 않음)
const loginLC = (userId, password) => {
  cy.visit('/logcatch/login');
  cy.wait(3000);
  cy.get('body').then(($body) => {
    if ($body.find('input[aria-label="사용자 계정"]').length === 0) { cy.reload(); cy.wait(3000); }
  });
  cy.get('input[aria-label="사용자 계정"]').should('exist').clear({ force: true }).type(userId, { force: true });
  cy.get('input[aria-label="패스워드"]').should('exist').clear({ force: true }).type(password, { force: true, log: false });
  cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });
  cy.wait(2000);
  cy.get('body').then(($body) => {
    if ($body.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length > 0) {
      cy.contains('.v-card__title', '이미 접속 중인 계정입니다.').closest('.v-card').contains('확인').click({ force: true });
      cy.wait(1000);
    }
  });
  cy.url({ timeout: 10000 }).should('not.include', '/login');
  cy.wait(3000);
};

const goPolicy = () => {
  loginLC(Cypress.env('LC_USER') || 'admin', Cypress.env('LC_PW'));
  cy.contains('button.has-child', '분석').click({ force: true });
  cy.wait(2000);
  cy.contains('.v-list__tile__title', '이상행위').should('be.visible').click({ force: true });
  cy.wait(2000);
  cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
  cy.wait(2000);
  cy.url().should('include', '/analyze/customAnomalyBehaviorPolicy');
  cy.get('.v-toolbar__title').filter(':visible').contains('정책 목록').should('be.visible');
  cy.ensureDarkTheme();
};

describe('다크 모드 대비 — 사용자 이상행위 정책', () => {
  Cypress.on('uncaught:exception', () => false);

  beforeEach(() => {
    const pw = Cypress.env('LC_PW');
    if (!pw || pw.startsWith('여기에')) {
      throw new Error('CypressWork/cypress.env.json 의 LC_PW 에 admin 비밀번호를 적어 주세요 (Git 제외 파일)');
    }
    goPolicy();
  });

  it('정책 목록 화면', () => {
    // 정책 카드는 배경 그라데이션이라 axe 가 계산하지 못함(incomplete) — 화면으로 확인해 기록에서 제외
    cy.checkContrast('정책 목록', null, { skipIncomplete: ['.policy-card'] });
    cy.checkDarkLeaks('정책 목록');
  });

  it('정책 가져오기 창 (0038921 재현 확인)', () => {
    cy.get('button.toolbar-action-btn').filter(':visible').contains('가져오기').click({ force: true });
    cy.contains('정책 가져오기').should('be.visible');
    cy.wait(1000);
    cy.checkContrast('정책 가져오기 창', DIALOG);
    cy.checkDarkLeaks('정책 가져오기 창', DIALOG);
    cy.get('.v-card__actions').filter(':visible').contains('button', '취소').click({ force: true });
  });

  it('폴더 이동 창 (0038920 재현 확인)', () => {
    // 정책 1건 선택 (이동은 하지 않고 취소)
    cy.get('[data-role="policy-select"][type="checkbox"]').first().then(($in) => {
      const $ripple = $in.siblings('.v-input--selection-controls__ripple');
      cy.wrap($ripple.length ? $ripple : $in).click({ force: true });
    });
    cy.wait(500);
    cy.get('button.toolbar-action-btn').filter(':visible').contains('폴더 이동').click({ force: true });
    cy.get(DIALOG).should('be.visible').and('contain.text', '정책을 이동합니다');
    cy.wait(1000);
    cy.checkContrast('폴더 이동 창', DIALOG);
    cy.checkDarkLeaks('폴더 이동 창', DIALOG);
    cy.get(DIALOG).contains('button', '취소').click({ force: true });
  });
});
