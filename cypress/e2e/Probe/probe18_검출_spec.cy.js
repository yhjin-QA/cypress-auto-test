// [임시 탐색용 18] 검출 메뉴 — 기능 동작 구조 파악 (2026-11-12)
//   대상 : 필터(전처리 5개) · 검출 메뉴 관리(URI 관리 룰 · 일괄 등록) · 개인정보 유형 정의(식별 유형 · 식별 키워드) · 행위유형 관리
//   조회만 함 : 트리 첫 항목 선택 · 검색 · 추가 창 열어 보기(취소). 저장 · 삭제 · 들여오기 · 업로드는 누르지 않음
//   결과 : cypress/probe/P18_*.json / *.html
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const html = (name) => cy.get('body').then(($b) => {
  const el = $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 120000) : '(없음)');
});
// 화면 구조 : 주소 · 트리 항목 · 표(머리·행 수·앞 3행) · 입력칸 · 버튼 · 탭
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  const tables = q('table').map((tb) => ({
    th: [...tb.querySelectorAll('th')].map(t).filter(Boolean),
    rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length,
    first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 3).map(t)
  }));
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    headlines: q('.c-headline, .title, .v-toolbar__title').map(t).filter(Boolean).slice(0, 12),
    tree: q('.vue-treeselect__label, .v-treeview-node__label, .tree-item').map(t).filter(Boolean).slice(0, 30),
    tables,
    inputs: q('input, textarea, select').map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), val: (e.value || '').slice(0, 40), checked: e.getAttribute('aria-checked') })),
    buttons: q('button, .v-btn').map(t).filter(Boolean),
    tabs: q('.v-tabs__item').map(t),
    paging: (t(root).match(/\d+\s*-\s*\d+\s*(of|\/)\s*\d+|전체\s*\d+\s*건|총\s*\d+\s*건/g) || []).slice(0, 5)
  });
});
const sub = (menu) => {
  cy.visit('/logcatch/com/siteMap'); cy.wait(2500);
  cy.contains('button', '검출').click({ force: true }); cy.wait(1500);
  cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === menu).first().click({ force: true });
  cy.wait(3500);
};
const tab = (label) => { cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === label).first().click({ force: true }); cy.wait(3000); };
const vtab = (label) => { cy.get('.v-tabs__item').filter(':visible').filter((i, e) => t(e).toUpperCase() === label.toUpperCase()).first().click({ force: true }); cy.wait(2500); };
// 트리 첫 항목 선택 → 오른쪽 폼 값
const pickFirstTree = (name) => cy.get('body').then(($b) => {
  const $n = $b.find('.vue-treeselect__label, .v-treeview-node__label, .tree-item').filter((i, e) => shown(e) && t(e).length > 0);
  cy.writeFile(`cypress/probe/${name}_트리.json`, $n.toArray().map(t).slice(0, 40));
  if ($n.length) { cy.wrap($n.first()).click({ force: true }); cy.wait(2000); snap(`${name}_선택`); }
});
// 열린 창 닫기 (취소 · 닫기 · close · esc)
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn, i').filter((i, e) => shown(e) && /^(취소|닫기|close)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1000);
});

describe('PROBE18', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\/(api\/v1\/(?!chart-data|widgets|dashboards|theme|version|mfa)|detect\/)/i }, (req) => {
      if (/\.(js|css|png|svg|woff)/.test(req.url)) return;
      req.continue((res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 800); } catch (e) { body = ''; }
        api.push({ step: Cypress.currentTest.title.slice(0, 14), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 200), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 300) : null, body });
      });
    });
    A.loginAdmin();
  });
  after(() => cy.writeFile('cypress/probe/P18_api.json', api));

  it('필터 — 전처리 5개 화면', { retries: 0 }, () => {
    sub('필터');
    tab('전처리 파일 구분 설정'); snap('P18_1_파일구분'); html('P18_1_파일구분'); pickFirstTree('P18_1_파일구분');
    tab('전처리 필터링 정책');
    ['사용자 IP 제외', '화면 (URI) 제외', '특정 SQL 제외', 'Content-Type 제외'].forEach((v, i) => { vtab(v); snap(`P18_2_필터링_${i + 1}`); });
    html('P18_2_필터링');
    tab('전처리 사용자 계정 탐색 설정'); snap('P18_3_계정탐색'); html('P18_3_계정탐색'); pickFirstTree('P18_3_계정탐색');
    tab('전처리 디코더 설정'); snap('P18_4_디코더'); html('P18_4_디코더'); pickFirstTree('P18_4_디코더');
    tab('전처리 인코더 설정'); snap('P18_5_인코더'); html('P18_5_인코더'); pickFirstTree('P18_5_인코더');
  });

  it('검출 메뉴 관리 — URI 관리 룰 · 일괄 등록', { retries: 0 }, () => {
    sub('검출 메뉴 관리');
    tab('URI 관리 룰'); snap('P18_6_URI룰'); html('P18_6_URI룰'); pickFirstTree('P18_6_URI룰');
    tab('URI 관리 일괄 등록'); snap('P18_7_일괄등록'); html('P18_7_일괄등록');
  });

  it('개인정보 유형 정의 — 식별 유형 · 식별 키워드', { retries: 0 }, () => {
    sub('개인정보 유형 정의');
    snap('P18_8_식별유형'); html('P18_8_식별유형');
    // 정보주체만 조회 켜고 검색 → 행 수 비교 (조회만)
    cy.get('body').then(($b) => {
      const $c = $b.find('label.v-label').filter((i, e) => shown(e) && t(e) === '정보주체만 조회');
      if ($c.length) { cy.wrap($c.first()).click({ force: true }); cy.wait(500); }
    });
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => /검색$/.test(t(e))).first().click({ force: true });
    cy.wait(2500);
    snap('P18_8_식별유형_정보주체만');
    tab('식별 키워드 정의'); snap('P18_9_키워드'); html('P18_9_키워드'); pickFirstTree('P18_9_키워드');
  });

  it('행위유형 관리 — 정책 관리 (검색 · 추가 창 보기)', { retries: 0 }, () => {
    sub('행위유형 관리');
    snap('P18_10_행위유형'); html('P18_10_행위유형');
    cy.get('input[aria-label="URI 주소"]').filter(':visible').first().clear({ force: true }).type('zz_없는주소_zz', { force: true });
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => /검색$/.test(t(e))).first().click({ force: true });
    cy.wait(2500);
    snap('P18_10_행위유형_없는주소검색');
    cy.get('input[aria-label="URI 주소"]').filter(':visible').first().clear({ force: true });
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => /^(add\s*)?추가$/.test(t(e))).first().click({ force: true });
    cy.wait(2000);
    A.dumpScreen('P18_11_행위유형_추가창');
    cy.get('body').then(($b) => {
      const d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last()[0];
      cy.writeFile('cypress/probe/P18_11_행위유형_추가창.html', d ? d.outerHTML.replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 60000) : '(창 없음)');
    });
    closeTop();
  });
});
