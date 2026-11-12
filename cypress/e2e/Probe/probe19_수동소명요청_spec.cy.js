// [임시 탐색용 19] 소명 > 신청 > 이상행위 경보 (관리자) — 수동 소명 요청 화면 · 요청 창 구조 (2026-11-12)
//   요청 창은 열어 보기만 하고 취소 (메일 보내지 않음). 체크는 했다가 다시 해제
//   결과 : cypress/probe/P19_*.json / *.html
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter((i, e) => shown(e)).last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 120000) : '(없음)');
});
const dlg = (name) => cy.get('body').then(($b) => {
  const d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0];
  if (!d) { cy.writeFile(`cypress/probe/${name}.json`, { dialog: null }); return; }
  cy.writeFile(`cypress/probe/${name}.json`, {
    text: t(d).slice(0, 4000),
    inputs: [...d.querySelectorAll('input, textarea, select')].map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), ph: e.getAttribute('placeholder'), val: (e.value || '').slice(0, 80), checked: e.getAttribute('aria-checked'), shown: shown(e) })),
    buttons: [...d.querySelectorAll('button, .v-btn')].filter(shown).map((e) => ({ text: t(e), disabled: e.disabled || e.classList.contains('v-btn--disabled') }))
  });
});
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn, i').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
});

describe('PROBE19', () => {
  A.ignoreErrors();
  it('관리자 — 수동 소명 요청 (보내지 않음)', { retries: 0 }, () => {
    const api = [];
    cy.intercept({ url: /\/logcatch\/api\/.*(explanation|approval|mail)/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 2500); } catch (e) { body = ''; }
        api.push({ m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 220), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 500) : null, body });
      });
    });
    A.loginAdmin();
    cy.visit('/logcatch/approval/submit/anomaly-alerts');
    cy.wait(5000);
    A.dumpScreen('P19_1_목록');
    html('P19_1_목록', '.v-content__wrap');

    // 사용자 묶음 펼치기 → 경보 줄
    cy.get('.incident-header').filter(':visible').first().find('i').filter((i, e) => t(e) === 'chevron_right').first().click({ force: true });
    cy.wait(2500);
    A.dumpScreen('P19_2_펼침');
    html('P19_2_펼침', '.incident-list');

    // 사용자 체크 → 일괄 요청 버튼 생기는지 → 다시 해제
    cy.get('.incident-header').filter(':visible').first().find('.explreq-check').click({ force: true });
    cy.wait(1500);
    A.dumpScreen('P19_3_체크');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P19_3_체크_버튼.json', {
      selectall: t($b.find('.explreq-selectall')[0]),
      buttons: $b.find('button, .v-btn').filter((i, e) => shown(e) && /소명 요청|요청|선택/.test(t(e))).toArray().map(t)
    }));
    cy.get('.incident-header').filter(':visible').first().find('.explreq-check').click({ force: true });
    cy.wait(1000);

    // 줄의 「소명 요청」 → 요청 창 구조 → 취소
    cy.get('.incident-header').filter(':visible').first().find('.explreq-open-btn').click({ force: true });
    cy.wait(3000);
    A.dumpScreen('P19_4_요청창');
    html('P19_4_요청창', '.v-dialog--active');
    dlg('P19_4_요청창_구조');
    closeTop();
    closeTop();

    // 범위 「내 경보만」 → 다시 「전체 사용자」
    cy.get('.esh-scope-btn').filter((i, e) => t(e) === '내 경보만').click({ force: true });
    cy.wait(2500);
    A.dumpScreen('P19_5_내경보만');
    cy.get('.esh-scope-btn').filter((i, e) => t(e) === '전체 사용자').click({ force: true });
    cy.wait(2500);
    cy.then(() => cy.writeFile('cypress/probe/P19_api.json', api));
  });
});
