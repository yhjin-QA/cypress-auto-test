// [임시 탐색용] 2.9.7 분석·소명 화면 구조 수집 — 결과: cypress/probe/*.json + 스크린샷
//   화면을 읽기만 하며, 「복사」 1회로 'XXX (복사)' 정책이 하나 생길 수 있음 (본 스크립트 작성 후 정리)
describe('PROBE2 분석·소명 상세 구조 수집', () => {
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

  it('분석·소명 상세 구조 수집', { retries: 0 }, () => {
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

    const search = (kw) => {
      cy.get('input[placeholder="정책명 / 설명 / 라벨 검색"]').clear({ force: true }).type(kw, { force: true });
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      cy.wait(2000);
    };
    // ================= 분석 상세 =================
    cy.contains('button.has-child', '분석').click({ force: true });
    cy.wait(1500);
    cy.contains('.v-list__tile__title', '이상행위').click({ force: true });
    cy.wait(2500);
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 정책').click({ force: true });
    cy.wait(2500);

    // 1) 복사 결과 확인 (앞선 탐색에서 복사 클릭)
    search('복사');
    dump('P1_검색_복사');
    // 2) 접속량 과다 — 사용자 모드 편집 화면(임계값 등)
    search('접속량 과다');
    dump('P2_검색_접속량과다');
    cy.get('.policy-card-name, table.v-datatable tbody td').filter(':visible').filter((i, e) => e.innerText.trim() === '접속량 과다').first().click({ force: true });
    dump('P3_접속량과다_사용자모드');
    cy.get('body').then(($b) => {
      const $x = $b.find('.v-dialog--active .v-btn:visible').filter((i, e) => e.innerText.includes('전문가 모드로 열기'));
      if ($x.length) { cy.wrap($x.first()).click({ force: true }); dump('P4_접속량과다_전문가모드'); }
    });
    closeDialog(); closeDialog();
    // 3) 즉시실행 확인창 (실행하지 않고 취소)
    cy.get('input[data-role="policy-select"]').filter((i, e) => (e.getAttribute('aria-label') || '').endsWith('접속량 과다')).first().check({ force: true });
    cy.wait(800);
    cy.contains('.toolbar-action-btn', '즉시실행').click({ force: true });
    dump('P5_즉시실행_확인창');
    closeDialog();
    cy.contains('.toolbar-action-btn', '복사').click({ force: true });
    dump('P6_복사_확인창');
    closeDialog();
    // 4) 결과 1년
    cy.get('.v-btn__content').filter(':visible').contains('사용자 이상행위 결과').click({ force: true });
    cy.wait(2500);
    clickIf('button.sev-filter-btn', '1년');
    clickIf('button.sev-filter-btn', '사용');
    cy.wait(2000);
    dump('P7_결과_1년');

    // ================= 사이드 「소명」 메뉴 =================
    cy.get('button').filter(':visible').filter((i, e) => e.innerText.trim() === '소명').first().click({ force: true });
    cy.wait(1500);
    dump('Q0_소명메뉴');
    cy.get('body').then(($b) => {
      const titles = [...$b.find('.v-menu__content:visible .v-list__tile__title')].map((e) => e.innerText.trim()).filter(Boolean);
      cy.get('body').type('{esc}', { force: true });
      titles.slice(0, 6).forEach((t, k) => {
        cy.get('button').filter(':visible').filter((i, e) => e.innerText.trim() === '소명').first().click({ force: true });
        cy.wait(1200);
        cy.get('.v-menu__content').filter(':visible').last().contains('.v-list__tile__title', t).click({ force: true });
        cy.wait(2500);
        dump(`Q${k + 1}_${t.replace(/[\\/:*?"<>| ]/g, '')}`);
      });
    });
  });
});
