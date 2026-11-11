// [임시 탐색용] 2.9.7 분석·소명 화면 구조 수집 — 결과: cypress/probe/*.json + 스크린샷
//   화면을 읽기만 하며, 「복사」 1회로 'XXX (복사)' 정책이 하나 생길 수 있음 (본 스크립트 작성 후 정리)
describe('PROBE 분석·소명 화면 구조 수집', () => {
  Cypress.on('uncaught:exception', () => false);

  const dump = (name) => {
    cy.wait(1500);
    cy.document().then((doc) => {
      const vis = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const txt = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 150);
      const q = (s) => [...doc.querySelectorAll(s)].filter(vis);
      const uniq = (a) => [...new Set(a.filter((x) => x && (typeof x !== 'string' || x.length)))];
      const data = {
        url: doc.location.href,
        headlines: uniq(q('.c-headline,.v-toolbar__title,.section-header,.v-card__title,.c-title,h1,h2,h3').map(txt)),
        buttons: uniq(q('button,.v-btn,a.v-tabs__item,.tab-btn').map(txt)).slice(0, 120),
        inputs: q('input,textarea').map((e) => ({
          type: e.type, aria: e.getAttribute('aria-label'), ph: e.getAttribute('placeholder'),
          role: e.getAttribute('data-role'), val: (e.value || '').slice(0, 40), ro: e.readOnly,
          checked: e.getAttribute('aria-checked'), cls: (e.className || '').slice(0, 60)
        })),
        labels: uniq(q('label,.v-label,.filter-label').map(txt)),
        th: uniq(q('th').map(txt)),
        rows: q('tbody tr').slice(0, 6).map((tr) => ({
          text: txt(tr),
          icons: [...tr.querySelectorAll('i')].map((i) => (i.innerText.trim() || i.className)).slice(0, 15),
          links: [...tr.querySelectorAll('a')].map(txt).slice(0, 10),
          roles: [...tr.querySelectorAll('[data-role]')].map((e) => e.getAttribute('data-role'))
        })),
        cards: q('.policy-card,.incident-header,.v-card').slice(0, 5).map((c) => ({ cls: c.className.slice(0, 80), text: txt(c) })),
        menus: uniq(q('.v-list__tile__title').map(txt)),
        dialogs: q('.v-dialog--active').map((d) => (d.innerText || '').replace(/\s+/g, ' ').slice(0, 1500)),
        dataRoles: uniq(q('[data-role]').map((e) => `${e.tagName.toLowerCase()}:${e.getAttribute('data-role')}`)),
        snack: uniq(q('.v-snack,.v-snack__content,.v-alert').map(txt))
      };
      cy.writeFile(`cypress/probe/${name}.json`, data);
    });
    cy.screenshot(`probe_${name}`, { capture: 'viewport', overwrite: true });
  };
  const clickIf = (selector, text, then) => {
    cy.get('body').then(($b) => {
      const $el = $b.find(selector).filter(':visible').filter((i, e) => !text || (e.innerText || '').trim().includes(text));
      if ($el.length) { cy.wrap($el.first()).click({ force: true }); if (then) then(true); }
      else { cy.log(`⚠️ 없음: ${selector} ${text || ''}`); if (then) then(false); }
    });
  };
  const closeDialog = () => {
    cy.get('body').type('{esc}', { force: true });
    cy.wait(500);
    clickIf('.v-dialog--active .v-btn', '취소');
    clickIf('.v-dialog--active .v-btn', '닫기');
  };

  it('분석·소명 화면 구조 수집', { retries: 0 }, () => {
    // ---------- 로그인 (기존 Basic 스크립트와 동일) ----------
    cy.visit('https://10.10.54.21:18443/logcatch/login');
    cy.wait(5000);
    cy.get('body').then(($b) => { if ($b.find('input[aria-label="사용자 계정"]').length === 0) { cy.reload(); cy.wait(2000); } });
    cy.get('input[aria-label="사용자 계정"]').type(Cypress.env('LC_USER') || 'admin', { force: true });
    cy.get('input[aria-label="패스워드"]').type(Cypress.env('LC_PW'), { force: true, log: false });
    cy.get('input[aria-label="패스워드"]').type('{enter}', { force: true });
    cy.wait(2000);
    cy.get('body').then(($b) => {
      if ($b.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length) {
        cy.contains('.v-card__title', '이미 접속 중인 계정입니다.').closest('.v-card').contains('확인').click({ force: true });
      }
    });
    cy.url({ timeout: 15000 }).should('not.include', '/login');
    cy.wait(3000);

    // ================= A. 분석 =================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(1500);
    dump('A0_분석_메뉴');
    cy.contains('.v-list__tile__title', '이상행위').click({ force: true });
    cy.wait(2500);
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
    cy.wait(2500);
    dump('A1_정책목록');

    // 보기 방식(카드/목록)에 관계없이 동작 — 2.9.7 기본은 계정에 저장된 방식(현재 카드)
    // 정책 이름 클릭(편집 화면)
    cy.get('body').then(($b) => {
      const $n = $b.find('.policy-card-name:visible');
      if ($n.length) { cy.wrap($n.first()).click({ force: true }); }
      else { cy.get('table.v-datatable tbody tr').filter(':visible').first().find('td').eq(2).click({ force: true }); }
    });
    dump('A2_정책열기');
    closeDialog();
    // 카드 뒤집기(설명 면)
    clickIf('button[data-role="policy-card-flip"]', null);
    dump('A2b_카드뒤집기');
    clickIf('button[data-role="policy-card-flip"]', null);

    // 첫 정책 선택 → 복사
    cy.get('input[data-role="policy-select"]').first().check({ force: true });
    cy.wait(800);
    dump('A3_행선택');
    cy.contains('.toolbar-action-btn', '복사').click({ force: true });
    dump('A4_복사클릭');
    clickIf('.v-dialog--active .v-btn', '확인');
    dump('A5_복사후목록');
    closeDialog();

    // 새 정책 화면 - 범주 선택 목록, 탐지 규칙 영역
    cy.get('.v-btn__content').filter(':visible').contains('새 정책').click({ force: true });
    cy.wait(1500);
    clickIf('.v-dialog--active input[data-role="policy-category"]', null);
    dump('A6_새정책_범주');
    cy.get('body').type('{esc}', { force: true });
    cy.contains('.v-dialog--active .section-header', '탐지 규칙').scrollIntoView();
    dump('A7_새정책_탐지규칙');
    clickIf('.v-dialog--active .v-btn', '사용자 모드에 열 값');
    dump('A8_사용자모드');
    closeDialog(); closeDialog();

    // 결과 탭
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
    cy.wait(2500);
    clickIf('button.sev-filter-btn', '최근 30일');
    cy.wait(1500);
    clickIf('.datamode-btn', '전체');
    dump('A9_결과_전체');
    cy.get('body').then(($b) => {
      const $r = $b.find('table tbody tr:visible, .incident-header:visible');
      if ($r.length) { cy.wrap($r.first()).click({ force: true }); dump('A10_결과_행클릭'); closeDialog(); }
    });
    clickIf('.v-btn__content', '사용자 이상행위 대시보드');
    cy.wait(2500);
    dump('A11_대시보드');

    // ================= B. 소명 =================
    ['관리', '나의 소명', '결재함', '결재 라인', '소명 정책', '설정'].forEach((sub, idx) => {
      cy.contains('button', '소명하기').click({ force: true });
      cy.wait(1200);
      if (idx === 0) dump('B0_소명_메뉴');
      cy.get('body').then(($b) => {
        const $t = $b.find('.v-menu__content:visible .v-list__tile__title').filter((i, e) => e.innerText.trim() === sub || e.innerText.trim().startsWith(sub));
        if (!$t.length) { cy.log(`⚠️ 소명 서브메뉴 없음: ${sub}`); cy.get('body').type('{esc}', { force: true }); return; }
        cy.wrap($t.first()).click({ force: true });
        cy.wait(2500);
        dump(`B_${sub}`);
        cy.get('body').then(($b2) => {
          const tabs = [...$b2.find('.tab-btn:visible, .v-tabs__item:visible')].map((e) => e.innerText.trim()).filter(Boolean);
          tabs.slice(1, 5).forEach((t, k) => {
            cy.contains('.tab-btn, .v-tabs__item', t).click({ force: true });
            cy.wait(2000);
            dump(`B_${sub}_tab${k + 1}_${t.replace(/[\\/:*?"<>| ]/g, '')}`);
          });
        });
      });
    });

    // 상단 「소명하기」 외 메뉴(소명 메뉴 이름이 다른 경우 대비) - 좌측 메뉴 전체 목록
    dump('C_마지막화면');
  });
});
