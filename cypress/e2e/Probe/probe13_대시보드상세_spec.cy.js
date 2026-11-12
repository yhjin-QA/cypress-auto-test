// [임시 탐색용 13] 사용자 이상행위 대시보드 — 위젯·버튼 동작 구조 파악 (2026-11-12)
//   조회 위주. 상태가 바뀌는 동작(숨김 보기, 레이아웃 편집, 실시간 시작, 기간)은 모두 원래대로 되돌리고 끝냄
//   결과 : cypress/probe/P13_*.json / *.html
const A = require('../../support/anomaly');
const html = (name, sel) => cy.get('body').then(($b) => {
  const el = $b.find(sel).filter(':visible').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 150000) : '(없음)');
});
const t = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
// 위젯 카드 목록 (제목 · 클래스 · 본문 앞부분 · 버튼)
const widgets = (name) => cy.get('body').then(($b) => {
  const cards = $b.find('.anomaly-widget-card').toArray().map((c) => ({
    cls: c.className,
    visible: !!(c.offsetWidth || c.offsetHeight),
    title: t(c.querySelector('.anomaly-widget-card__title') || c).slice(0, 80),
    body: t(c.querySelector('.anomaly-widget-card__body') || c).slice(0, 600),
    actions: [...c.querySelectorAll('.anomaly-widget-card__actions button, .anomaly-widget-card__actions .v-btn, .anomaly-widget-card__actions i')].map((x) => `${x.className.split(' ').slice(0, 3).join('.')}|${t(x)}`)
  }));
  const sections = $b.find('.anomaly-dashboard__section-bar').toArray().map(t);
  const buttons = $b.find('button:visible').toArray().map(t).filter(Boolean);
  cy.writeFile(`cypress/probe/${name}.json`, { sections, count: cards.length, cards, buttons });
});
const menu = (name) => cy.get('body').then(($b) => {
  const m = $b.find('.v-menu__content:visible, .menuable__content__active:visible').toArray().map(t);
  cy.writeFile(`cypress/probe/${name}.json`, m);
});
const esc = () => { cy.get('body').type('{esc}', { force: true }); cy.wait(800); };

describe('PROBE13', () => {
  A.ignoreErrors();
  it('관리자 — 이상행위 대시보드 위젯·버튼', { retries: 0 }, () => {
    // 대시보드가 부르는 API 기록 (주소 · 상태 · 응답 앞부분)
    const api = [];
    cy.intercept({ url: /\/logcatch\/api\/.*(anomaly|dashboard|widget|cluster|topology)/i }, (req) => {
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 1500); } catch (e) { body = String(res.body).slice(0, 300); }
        api.push({ m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, body });
      });
    });
    A.loginAdmin();
    A.goAnomaly('사용자 이상행위 대시보드');
    cy.wait(5000);
    A.dumpScreen('P13_1_기본');
    html('P13_1_기본', '.anomaly-dashboard-root, .cabp-dashboard, main');
    widgets('P13_1_위젯');

    // ---- 기간 버튼 → 선택지
    cy.get('.pcpf__btn').filter(':visible').first().click({ force: true });
    cy.wait(1200);
    menu('P13_2_기간메뉴');
    A.dumpScreen('P13_2_기간메뉴');
    html('P13_2_기간메뉴', '.v-menu__content, .menuable__content__active');
    esc();

    // ---- 숨김 위젯 보기 → 목록 → 다시 숨기기 (되돌림)
    cy.get('button:visible').filter((i, e) => /숨김\s*\d+\s*개/.test(e.innerText)).first().then(($btn) => {
      const before = t($btn[0]);
      cy.wrap($btn).click({ force: true });
      cy.wait(2500);
      A.dumpScreen('P13_3_숨김보기');
      widgets('P13_3_숨김보기_위젯');
      html('P13_3_숨김보기', '.anomaly-dashboard-root, .cabp-dashboard, main');
      // 같은 위치의 버튼을 다시 눌러 원래대로
      cy.get('.anomaly-dashboard__vis-btn, button').filter(':visible').filter((i, e) => /숨김|보기|감추기/.test(e.innerText)).first().then(($b2) => {
        cy.writeFile('cypress/probe/P13_3_버튼글자.json', { before, after: t($b2[0]) });
        cy.wrap($b2).click({ force: true });
      });
      cy.wait(2000);
      widgets('P13_3_되돌린후_위젯');
    });

    // ---- 첫 위젯(보이는 것) 확대 → 창 구조 → 닫기
    const card = ($b) => $b.find('.anomaly-widget-card:visible').filter((i, e) => e.querySelector('.anomaly-widget-card__enlarge')).first();
    cy.get('body').then(($b) => { const $e = card($b).find('.anomaly-widget-card__enlarge'); if ($e.length) cy.wrap($e.first()).click({ force: true }); });
    cy.wait(2500);
    A.dumpScreen('P13_4_확대');
    html('P13_4_확대', '.v-dialog--active');
    esc();
    cy.get('body').then(($b) => { if ($b.find('.v-dialog--active:visible').length) esc(); });

    // ---- 위젯 내보내기 버튼 → 메뉴만 보고 닫기 (선택 안 함)
    cy.get('body').then(($b) => { const $e = card($b).find('.anomaly-widget-card__export'); if ($e.length) cy.wrap($e.first()).click({ force: true }); });
    cy.wait(1500);
    menu('P13_5_내보내기메뉴');
    A.dumpScreen('P13_5_내보내기');
    esc();

    // ---- Top N 선택 (lp-select) 선택지
    cy.get('body').then(($b) => { const $s = $b.find('.anomaly-widget-card__lp-select:visible'); cy.writeFile('cypress/probe/P13_6_topN.html', $s.length ? $s[0].outerHTML.slice(0, 5000) : '(없음)'); });

    // ---- 레이아웃 편집 → 화면 구조 → 취소(저장 안 함)
    cy.get('body').then(($b) => { const $s = $b.find('button:visible').filter((i, e) => /레이아웃 편집/.test(t(e))); if ($s.length) cy.wrap($s.first()).click({ force: true }); });
    cy.wait(2500);
    A.dumpScreen('P13_7_레이아웃편집');
    widgets('P13_7_레이아웃편집_위젯');
    html('P13_7_레이아웃편집', '.anomaly-dashboard-root, .cabp-dashboard, main');
    cy.get('body').then(($b) => {
      const $c = $b.find('button:visible').filter((i, e) => /^(취소|편집 취소|닫기)$/.test(t(e)));
      cy.writeFile('cypress/probe/P13_7_취소버튼.json', $c.toArray().map(t));
      if ($c.length) cy.wrap($c.first()).click({ force: true }); else esc();
    });
    cy.wait(2000);
    A.confirmIfAny();
    widgets('P13_7_취소후_위젯');

    // ---- 실시간 모니터링 ▶ 시작 → 화면 → 중지
    cy.get('body').then(($b) => { const $s = $b.find('button:visible').filter((i, e) => /^▶?\s*시작$/.test(t(e))); if ($s.length) cy.wrap($s.first()).click({ force: true }); });
    cy.wait(6000);
    A.dumpScreen('P13_8_실시간시작');
    html('P13_8_실시간시작', '.topology-wrap');
    cy.get('body').then(($b) => {
      const $s = $b.find('button:visible').filter((i, e) => /중지|정지|멈춤|■/.test(t(e)));
      cy.writeFile('cypress/probe/P13_8_중지버튼.json', $s.toArray().map(t));
      if ($s.length) cy.wrap($s.first()).click({ force: true });
    });
    cy.wait(2000);
    A.dumpScreen('P13_8_실시간중지');

    // ---- 결과 탭 오늘 경보 (대조용) — 정책 묶음 헤더 글자
    A.goAnomaly('사용자 이상행위 결과');
    cy.wait(3000);
    A.dumpScreen('P13_9_결과_오늘');
    cy.get('body').then(($b) => cy.writeFile('cypress/probe/P13_9_결과_묶음.json',
      $b.find('.incident-header:visible').toArray().map(t)));
    cy.then(() => cy.writeFile('cypress/probe/P13_api.json', api));
  });
});
