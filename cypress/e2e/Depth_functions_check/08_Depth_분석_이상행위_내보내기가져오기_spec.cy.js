// ==========================================================================
// [2.9.7 신규] 08_Depth_분석_이상행위_내보내기가져오기
//   정책을 파일로 내보낸 뒤 지우고, 그 파일을 「가져오기 > 파일 선택」으로 다시 들여와 같은 설정으로 복원되는지 확인
//     1) 기본 정책 「접속량 과다」 복제 → 임시 정책 auto_임시_IO_<시각> (임계값 7) 저장
//     2) 카드 오른쪽 클릭 > 내보내기 → cypress/downloads 에 policy-<ID>.json 이 생기고, JSON 안에 정책 1건(이름 · 사용 OFF)
//     3) 임시 정책 삭제
//     4) 가져오기 > 파일 선택 (내보낸 파일) → 「가져오기 (1건)」 → 같은 이름 · 임계값 7 정책이 다시 생김
//     5) 가져온 정책 삭제
//   반복 실행 설계
//     - 임시 정책 이름은 매번 다르고, 시작할 때 남아 있는 auto_임시_ 정책을 먼저 삭제 (수명주기 스크립트와 같은 규칙)
//     - 원본 「접속량 과다」 는 바꾸지 않음. 임시 정책은 사용 OFF 라 경보를 만들지 않음
//     - 내려받은 파일은 cypress/downloads (git 제외 폴더) 에 남음
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

const IMPORT_PREFIX = `${PREFIX}IO_`;
const listDownloads = () => cy.task('readDirectory', 'cypress/downloads');
// 복제로 임시 정책 생성 (임계값 지정)
const createTemp = (name, threshold) => {
  searchKw(SRC);
  A.policyName(SRC).closest('.policy-card, tr').rightclick({ force: true });
  cy.wait(1200);
  cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile, [role="menuitem"], div', /^\s*(content_copy\s*)?복제\s*$/).click({ force: true });
  cy.wait(2500);
  A.activeDialog().should('contain', `${SRC} (복사)`);
  A.activeDialog().find('input').filter((i, e) => e.value === `${SRC} (복사)`).first().clear({ force: true }).type(name, { force: true });
  A.thresholdInput().clear({ force: true }).type(String(threshold), { force: true });
  save();
  searchKw(name);
  listHeadline().should('contain', '(1)');
};
const openThreshold = (name) => {
  searchKw(name);
  A.policyName(name).click({ force: true });
  cy.wait(1500);
  return A.thresholdInput();
};

describe('08_Depth_분석_이상행위_내보내기가져오기', () => {
  A.ignoreErrors();

  it('정책 내보내기(파일) → 삭제 → 가져오기(파일 선택)로 복원', { retries: 0 }, () => {
    const NAME = `${IMPORT_PREFIX}${hhmmss()}`;
    A.loginAdmin();
    cleanup();

    // ---------- 1. 임시 정책 생성 (임계값 7) ----------
    createTemp(NAME, 7);

    // ---------- 2. 내보내기 → 새 파일 ----------
    listDownloads().then((before) => cy.wrap(before).as('filesBefore'));
    searchKw(NAME);
    A.policyName(NAME).closest('.policy-card, tr').rightclick({ force: true });
    cy.wait(1200);
    cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile, [role="menuitem"], div', /^\s*(save_alt\s*)?내보내기\s*$/).click({ force: true });
    cy.wait(2500);
    A.dumpScreen('D08IO_2_내보내기후');
    // 내보내기 창이 따로 뜨면 그 창의 내보내기/다운로드 버튼
    cy.get('body').then(($b) => {
      const $btn = $b.find('.v-dialog--active:visible button:visible').filter((i, e) => /^(내보내기|다운로드|확인)/.test(e.innerText.trim()));
      if ($btn.length) { cy.log('내보내기 창 → 버튼 클릭'); cy.wrap($btn.last()).click({ force: true }); cy.wait(2500); }
    });
    const waitNewFile = (left) => listDownloads().then((after) => {
      cy.get('@filesBefore').then((before) => {
        const fresh = after.filter((f) => !before.includes(f) && !/\.crdownload$/.test(f));
        if (!fresh.length && left > 0) { cy.wait(2000); waitNewFile(left - 1); return; }
        cy.log(`내보낸 파일 : ${fresh.join(', ')}`);
        expect(fresh.length, '내보내기로 새로 생긴 파일 수').to.eq(1);
        cy.wrap(`cypress/downloads/${fresh[0]}`).as('exported');
      });
    });
    waitNewFile(10);
    cy.get('@exported').then((p) => cy.readFile(p).then((c) => {
      const text = typeof c === 'string' ? c : JSON.stringify(c);
      cy.writeFile('cypress/probe/D08IO_2_내보낸파일_앞부분.txt', text.slice(0, 4000));
      expect(text, '내보낸 파일 안의 정책 이름').to.include(NAME);
      // 2.9.7 내보내기 형식 : policy-<정책ID>.json — {version, exportedAt, source:"logcatch", policies:[{name, code, ruleConfig, …}]}
      const j = typeof c === 'string' ? JSON.parse(c) : c;
      expect(j.source, '내보내기 파일 source').to.eq('logcatch');
      expect(j.policies, '내보낸 정책 수').to.have.length(1);
      expect(j.policies[0].name, '내보낸 정책 이름').to.eq(NAME);
      expect(j.policies[0].isActive, '내보낸 정책 사용 여부').to.eq(false);
    }));
    cy.get('@exported').should('match', /policy-\d+\.json$/);

    // ---------- 3. 임시 정책 삭제 ----------
    searchKw(NAME);
    A.policySelect(NAME).check({ force: true });
    deleteSelected(1);
    searchKw(NAME);
    listHeadline().should('contain', '(0)');

    // ---------- 4. 가져오기 > 파일 선택 ----------
    A.goAnomaly('사용자 이상행위 정책');
    cy.contains('.toolbar-action-btn', '가져오기').click({ force: true });
    cy.wait(2000);
    cy.contains('정책 가져오기', { timeout: 10000 }).should('be.visible');
    cy.contains('클립보드 붙여넣기').should('be.visible');
    A.dumpScreen('D08IO_4_가져오기창');
    cy.get('@exported').then((p) => {
      cy.get('body').then(($b) => {
        const n = $b.find('input[type="file"]').length;
        cy.log(`파일 입력칸 ${n}개`);
        cy.writeFile('cypress/probe/D08IO_4_가져오기창.html', ($b.find(':contains("정책 가져오기")').last().closest('div').parent()[0] || $b[0]).outerHTML.slice(0, 40000));
      });
      cy.get('input[type="file"]').last().selectFile(p, { force: true });
    });
    cy.wait(2500);
    A.dumpScreen('D08IO_4_파일선택후');
    cy.contains('button', /가져오기\s*\(\s*1\s*건\s*\)/, { timeout: 10000 }).should('be.visible').click({ force: true });
    cy.wait(2500);
    A.confirmIfAny();
    A.dumpScreen('D08IO_4_가져온후');

    // ---------- 5. 복원 확인 → 삭제 ----------
    searchKw(NAME);
    listHeadline().should('contain', '(1)');
    openThreshold(NAME).should('have.value', '7');
    A.activeDialog().contains('button', /^\s*취소\s*$/).click({ force: true }); A.confirmIfAny();
    searchKw(NAME);
    A.policySelect(NAME).check({ force: true });
    deleteSelected(1);
    searchKw(NAME);
    listHeadline().should('contain', '(0)');
    searchKw(SRC);
    A.policyName(SRC).should('exist');
  });
});
