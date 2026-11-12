// [임시 탐색용 15] 분석 > 프로파일링 정책 · 결과 — 화면 구조 파악 (2026-11-12)
//   조회만 함 : 등록 창·카드 창은 열어 보기만 하고 취소/닫기. 등록·삭제·즉시 실행은 누르지 않음
//   결과 : cypress/probe/P15_*.json / *.html
const A = require('../../support/anomaly');
const t = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter((i, e) => shown(e)).last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 150000) : '(없음)');
});
// 열린 창 닫기 : 취소 · 닫기 · close 순서, 없으면 esc
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn, i').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
  A.confirmIfAny();
});
// 카드 목록 (글자 · 카드 안 버튼)
const cards = (name) => cy.get('body').then(($b) => {
  const $c = $b.find('.policy-card, .profile-card, .v-card').filter((i, e) => shown(e) && /v\d|#\d|프로파일|기준|사용/.test(t(e)) && t(e).length < 600);
  cy.writeFile(`cypress/probe/${name}.json`, $c.toArray().slice(0, 12).map((c) => ({
    cls: c.className.slice(0, 120), text: t(c).slice(0, 400),
    buttons: [...c.querySelectorAll('button, .v-btn, i')].filter(shown).map(t).filter(Boolean)
  })));
});

describe('PROBE15', () => {
  A.ignoreErrors();
  it('관리자 — 프로파일링 정책 · 결과', { retries: 0 }, () => {
    const api = [];
    cy.intercept({ url: /\/logcatch\/api\/.*profil/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 4000); } catch (e) { body = String(res.body).slice(0, 300); }
        api.push({ m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, body });
      });
    });
    A.loginAdmin();
    cy.visit('/logcatch/analyze/profiling/policy');
    cy.wait(5000);
    A.dumpScreen('P15_1_정책');
    html('P15_1_정책', 'main .v-content__wrap, main');
    cards('P15_1_카드');

    // ---- 프로파일 정책 등록 창 (열어 보기만)
    cy.get('body').then(($b) => {
      const $r = $b.find('button, .v-btn').filter((i, e) => shown(e) && /프로파일 정책 등록/.test(t(e)));
      if ($r.length) cy.wrap($r.first()).click({ force: true });
    });
    cy.wait(2500);
    A.dumpScreen('P15_2_등록창');
    html('P15_2_등록창', '.v-dialog--active');
    closeTop();
    closeTop();

    // ---- 첫 카드의 history · link 아이콘
    ['history', 'link'].forEach((ic) => {
      cy.get('body').then(($b) => {
        const $i = $b.find('button, .v-btn, i').filter((i, e) => shown(e) && t(e) === ic);
        cy.writeFile(`cypress/probe/P15_3_${ic}_개수.json`, { count: $i.length });
        if ($i.length) cy.wrap($i.first()).click({ force: true });
      });
      cy.wait(2500);
      A.dumpScreen(`P15_3_${ic}`);
      html(`P15_3_${ic}`, '.v-dialog--active, .v-menu__content');
      closeTop();
      cy.get('body').type('{esc}', { force: true });
      cy.wait(800);
    });

    // ---- 첫 카드 이름 클릭 (편집/상세 창?) → 닫기
    cy.get('body').then(($b) => {
      const $n = $b.find('.policy-card-name, .profile-card-name, .v-card__title').filter((i, e) => shown(e) && t(e).length > 1).first();
      if ($n.length) cy.wrap($n).click({ force: true });
    });
    cy.wait(2500);
    A.dumpScreen('P15_4_카드클릭');
    html('P15_4_카드클릭', '.v-dialog--active');
    closeTop();
    closeTop();

    // ---- 카드 오른쪽 클릭 메뉴
    cy.get('body').then(($b) => {
      const $n = $b.find('.policy-card, .profile-card').filter((i, e) => shown(e)).first();
      if ($n.length) cy.wrap($n).rightclick({ force: true });
    });
    cy.wait(1500);
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P15_5_오른쪽메뉴.json',
      $b.find('.v-menu__content, .menuable__content__active').filter((i, e) => shown(e)).toArray().map(t)));
    cy.get('body').type('{esc}', { force: true });
    cy.wait(800);

    // ---- 보기 방식 (카드 ▾) 선택지
    cy.get('body').then(($b) => {
      const $v = $b.find('button, .v-btn').filter((i, e) => shown(e) && /카드\s*▾/.test(t(e)));
      if ($v.length) cy.wrap($v.first()).click({ force: true });
    });
    cy.wait(1200);
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P15_6_보기방식.json',
      $b.find('.v-menu__content, .menuable__content__active').filter((i, e) => shown(e)).toArray().map(t)));
    cy.get('body').type('{esc}', { force: true });
    cy.wait(800);

    // ---- 프로파일링 결과 탭
    cy.get('body').then(($b) => {
      const $tab = $b.find('.v-btn__content, button').filter((i, e) => shown(e) && t(e) === '프로파일링 결과');
      if ($tab.length) cy.wrap($tab.first()).click({ force: true });
    });
    cy.wait(5000);
    A.dumpScreen('P15_7_결과');
    html('P15_7_결과', 'main .v-content__wrap, main');
    cy.then(() => cy.writeFile('cypress/probe/P15_api.json', api));
  });
});
