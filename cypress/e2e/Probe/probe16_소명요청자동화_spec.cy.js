// [임시 탐색용 16] 소명 > 신청 > 소명 요청 자동화 — 화면 구조 · 현재 설정값 · 권한별 화면 (2026-11-12)
//   저장 · 지금 실행은 누르지 않음 (관리자). 권한 없는 계정은 화면만 보고, 「저장」은 권한 없음 안내가 보일 때만 눌러 이유 문구 확인
//   결과 : cypress/probe/P16_*.json / *.html
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter((i, e) => shown(e)).last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 150000) : '(없음)');
});
// 설정 화면 값 (입력칸 · 스위치 · 선택 · 최종 수정 · 흐림 여부)
const values = (name) => cy.get('body').then(($b) => {
  const root = $b.find('main').last()[0] || $b[0];
  const inputs = [...root.querySelectorAll('input, select, textarea')].filter(shown).map((e) => ({
    tag: e.tagName, type: e.type, aria: e.getAttribute('aria-label'), val: e.value, checked: e.getAttribute('aria-checked'),
    disabled: e.disabled, readonly: e.readOnly, row: t(e.closest('.v-card, .row, div') || e).slice(0, 120)
  }));
  const blurred = [...root.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return shown(e) && s.filter && s.filter !== 'none'; })
    .map((e) => ({ cls: String(e.className).slice(0, 80), filter: getComputedStyle(e).filter, text: t(e).slice(0, 80) })).slice(0, 10);
  const buttons = [...root.querySelectorAll('button, .v-btn')].filter(shown).map((e) => ({ text: t(e), disabled: e.disabled || e.classList.contains('v-btn--disabled') }));
  cy.writeFile(`cypress/probe/${name}.json`, { text: t(root).slice(0, 3000), inputs, buttons, blurred });
});
const openTab = () => {
  cy.visit('/logcatch/approval/submit/anomaly-alerts');
  cy.wait(4000);
  cy.get('body').then(($b) => {
    const $tab = $b.find('button, .v-btn, .v-btn__content, a, .tab-btn').filter((i, e) => shown(e) && t(e) === '소명 요청 자동화');
    if ($tab.length) cy.wrap($tab.first()).click({ force: true });
  });
  cy.wait(4000);
};

describe('PROBE16', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/api\/.*(approval|explanation|auto|remind|request|schedul)/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 3000); } catch (e) { body = String(res.body).slice(0, 300); }
        api.push({ who: Cypress.currentTest.title, m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 500) : null, body });
      });
    });
  });
  after(() => cy.writeFile('cypress/probe/P16_api.json', api));

  it('관리자 — 소명 요청 자동화 화면 (저장·지금 실행 안 함)', { retries: 0 }, () => {
    A.loginAdmin();
    openTab();
    A.dumpScreen('P16_1_관리자');
    html('P16_1_관리자', 'main .v-content__wrap, main');
    values('P16_1_관리자_값');
    // 발송 시각 선택지 (열어 보기만)
    cy.get('body').then(($b) => {
      const $sel = $b.find('.v-select, select').filter((i, e) => shown(e) && /시/.test(t(e.closest('.row, .v-card, div') || e)));
      if ($sel.length) cy.wrap($sel.last()).find('.v-input__slot').first().click({ force: true });
    });
    cy.wait(1200);
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P16_2_발송시각_선택지.json',
      $b.find('.v-menu__content, .menuable__content__active').filter((i, e) => shown(e)).toArray().map(t)));
    cy.get('body').type('{esc}', { force: true });
    cy.wait(800);
    cy.url().then((u) => cy.writeFile('cypress/probe/P16_1_주소.json', { url: u }));
  });

  ['user014', 'user001'].forEach((id) => {
    it(`${id} — 소명 요청 자동화 화면 (권한 확인)`, { retries: 0 }, () => {
      const pw = id === 'user014' ? Cypress.env('LC_USER014_PW') : Cypress.env('LC_HEAD001_PW');
      A.login(id, pw);
      openTab();
      A.dumpScreen(`P16_3_${id}`);
      html(`P16_3_${id}`, 'main .v-content__wrap, main');
      values(`P16_3_${id}_값`);
      // 권한 없음 안내가 보일 때만 「저장」을 눌러 이유 문구 확인 (권한이 없으면 저장되지 않는 설계)
      cy.get('body').then(($b) => {
        const s = t($b.find('main').last()[0] || $b[0]);
        const noPerm = /권한|Managers|관리자만|읽지 못|불러오지 못/.test(s);
        cy.writeFile(`cypress/probe/P16_3_${id}_권한문구.json`, { noPerm, hint: (s.match(/[^.。]*(권한|Managers|관리자만)[^.。]*/g) || []).slice(0, 5) });
        if (!noPerm) return;
        const $save = $b.find('button, .v-btn').filter((i, e) => shown(e) && /^(save\s*)?저장$/.test(t(e)));
        if ($save.length) {
          cy.wrap($save.first()).click({ force: true });
          cy.wait(1500);
          A.dumpScreen(`P16_4_${id}_저장클릭`);
          cy.get('body').type('{esc}', { force: true });
        }
      });
    });
  });
});
