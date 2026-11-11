// [임시 탐색용] 2.9.7 분석·소명 화면 구조 수집 — 결과: cypress/probe/*.json + 스크린샷
//   화면을 읽기만 하며, 「복사」 1회로 'XXX (복사)' 정책이 하나 생길 수 있음 (본 스크립트 작성 후 정리)
describe('PROBE3 소명 정책·신청·결재함', () => {
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

  it('소명 사이드 메뉴 구조 수집', { retries: 0 }, () => {
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

    ['정책', '신청', '결재함'].forEach((t, k) => {
      cy.get('button').filter(':visible').filter((i, e) => e.innerText.trim() === '소명').first().click({ force: true });
      cy.wait(1500);
      cy.contains('.v-list__tile__title', new RegExp(`^\\s*${t}\\s*$`)).click({ force: true });
      cy.wait(3000);
      dump(`R${k + 1}_소명_${t}`);
      cy.get('body').then(($b) => {
        const tabs = [...$b.find('.tab-btn:visible, .v-tabs__item:visible')].map((e) => e.innerText.trim()).filter(Boolean);
        tabs.slice(1, 4).forEach((tb, j) => {
          cy.contains('.tab-btn, .v-tabs__item', tb).click({ force: true });
          cy.wait(2000);
          dump(`R${k + 1}_${t}_tab${j + 1}`);
        });
      });
      if (t === '정책') {
        clickIf('.v-btn__content', '정책 추가');
        cy.wait(1500);
        dump('R1b_정책추가_화면');
        closeDialog();
      }
    });
  });
});
