// ==========================================================================
// [2.9.7 신규] 08_Depth_분석_이상행위_정책수명주기
//   기본 정책 「접속량 과다」 를 카드 메뉴 「복제」로 복사 → 임시 정책 생성(v1) → 임계값 수정(v2) → 삭제
//   반복 실행 설계
//     - 임시 정책 이름 : auto_임시_<실행 시각> (매번 다름)
//     - 시작할 때 남아 있는 auto_임시_ 정책을 먼저 모두 삭제 → 이전 실행이 중간에 멈췄어도 정책이 쌓이지 않음
//     - 원본 「접속량 과다」 는 바꾸지 않음 (복제 창에서 사본만 저장). 임시 정책은 사용 OFF 그대로라 경보를 만들지 않음
//   2.9.7 확인 사항
//     - 카드 오른쪽 클릭 메뉴 : 편집 · 복제 · 내보내기 · JSON 복사 · 활성화 · 폴더 이동 · 즉시실행 · 실행이력 · 삭제
//     - 복제 → 사용자 모드 창이 「<원본> (복사)」 제목으로 열림 (저장해야 생성)
//     - 규칙·위험도·메시지·정책명 변경 → 버전 증가 / 설명·라벨·사용 여부 변경 → 버전 그대로
//     - 삭제 확인창 「정책 삭제 — 선택한 N건의 정책을 삭제하시겠습니까?」 (경보·결재 문서가 있으면 함께 삭제됨을 표시)
// ==========================================================================
const A = require('../../support/anomaly');
const SRC = '접속량 과다';
const PREFIX = 'auto_임시_';

const hhmmss = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
const listHeadline = () => cy.get('.v-toolbar__title, .c-headline').filter(':visible').contains('정책 목록');
const searchKw = (kw) => { A.goAnomaly('사용자 이상행위 정책'); A.searchPolicy(kw); };
// 카드(또는 목록 행)에서 버전 숫자
//   jQuery text() 는 「#36」「v3」 를 붙여 「#36v3」 로 돌려줘 단어 경계가 사라짐 → 화면 글자(innerText) 기준
const versionOf = (name) => A.policyName(name).closest('.policy-card, tr')
  .then(($c) => parseInt(($c[0].innerText.match(/(?:^|\s)v(\d+)(?=\s|$)/) || [])[1] || '0', 10));
const save = () => {
  A.activeDialog().contains('button', /^\s*저장\s*$/).click({ force: true });
  A.confirmIfAny();
  cy.wait(1500);
  cy.get('.v-dialog--active:visible').should('not.exist');
};
// 선택한 정책 삭제 (확인창 문구 확인)
const deleteSelected = (n) => {
  cy.contains('.toolbar-action-btn', '삭제').click({ force: true });
  cy.wait(1200);
  A.activeDialog().should('contain', '정책 삭제').and('contain', `선택한 ${n}건의 정책을 삭제하시겠습니까?`)
    .contains('button', /^\s*확인\s*$/).click({ force: true });
  cy.wait(2500);
};
// 남아 있는 임시 정책 정리
const cleanup = () => {
  searchKw(PREFIX);
  cy.get('body').then(($b) => {
    const names = $b.find('.policy-card-name:visible, table.v-datatable tbody td:visible').toArray()
      .map((e) => e.innerText.trim()).filter((t) => t.startsWith(PREFIX));
    const uniq = [...new Set(names)];
    if (!uniq.length) return;
    cy.log(`🧹 남아 있던 임시 정책 ${uniq.length}건 삭제 : ${uniq.join(', ')}`);
    uniq.forEach((n) => A.policySelect(n).check({ force: true }));
    deleteSelected(uniq.length);
    searchKw(PREFIX);
    listHeadline().should('contain', '(0)');
  });
};

describe('08_Depth_분석_이상행위_정책수명주기', () => {
  A.ignoreErrors();

  it('복제로 정책 생성 → 수정 시 버전 증가 → 삭제', { retries: 0 }, () => {
    const NAME = `${PREFIX}${hhmmss()}`;
    A.loginAdmin();
    cleanup();

    // ---------- 1. 원본 카드 오른쪽 클릭 → 복제 ----------
    searchKw(SRC);
    versionOf(SRC).as('srcVer');
    A.policyName(SRC).closest('.policy-card, tr').rightclick({ force: true });
    cy.wait(1200);
    cy.get('.v-menu__content').filter(':visible').should('contain', '복제').and('contain', '삭제')
      .contains('.v-list__tile, [role="menuitem"], div', /^\s*(content_copy\s*)?복제\s*$/).click({ force: true });
    cy.wait(2500);
    A.activeDialog().should('contain', `${SRC} (복사)`);
    // 제목 → 임시 이름, 임계값 → 5
    A.activeDialog().find('input').filter((i, e) => e.value === `${SRC} (복사)`).first()
      .clear({ force: true }).type(NAME, { force: true });
    A.thresholdInput().clear({ force: true }).type('5', { force: true });
    A.dialogSwitch('사용').should('have.attr', 'aria-checked', 'false');      // 원본처럼 사용 OFF
    A.dumpScreen('D08L_1_복제창');
    save();

    // ---------- 2. 생성 확인 (v1) · 원본은 그대로 ----------
    searchKw(NAME);
    listHeadline().should('contain', '(1)');
    versionOf(NAME).should('eq', 1);
    A.policyName(NAME).click({ force: true });
    cy.wait(1500);
    A.thresholdInput().should('have.value', '5');
    A.activeDialog().contains('button', /^\s*취소\s*$/).click({ force: true }); A.confirmIfAny();
    searchKw(SRC);
    cy.get('@srcVer').then((v) => versionOf(SRC).should('eq', v));             // 원본 버전 변화 없음

    // ---------- 3. 임계값 수정 → v2 ----------
    searchKw(NAME);
    A.policyName(NAME).click({ force: true });
    cy.wait(1500);
    A.thresholdInput().clear({ force: true }).type('6', { force: true });
    save();
    searchKw(NAME);
    versionOf(NAME).should('eq', 2);
    A.dumpScreen('D08L_3_수정후_v2');

    // ---------- 4. 삭제 ----------
    A.policySelect(NAME).check({ force: true });
    deleteSelected(1);
    searchKw(NAME);
    listHeadline().should('contain', '(0)');
    searchKw(SRC);
    A.policyName(SRC).should('exist');                                        // 원본은 남아 있음
    A.dumpScreen('D08L_4_삭제후');
  });
});
