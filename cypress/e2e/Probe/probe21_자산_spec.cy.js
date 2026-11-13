// [임시 탐색용 21] 자산 메뉴 — 기능 동작 구조 파악 (2026-11-13)
//   대상 : 데이터베이스(4) · 개인정보 파일 / 문서(3) · 데이터베이스 자산정보(4) · 데이터베이스 확정처리(3) = 14개 화면
//   조회만 함 : 화면 열기, 트리가 있으면 첫 항목 선택, 「add」(추가) 창 열어 보기 → 취소. 탐색 실행 · 동기화 · 확정 · 저장 · 삭제 · 업로드는 누르지 않음
//   결과 : cypress/probe/P21_*.json / *.html · 스크린샷 P21_*.png · API 기록 P21_api.json · 메뉴 · 주소 · 없는 화면 P21_요약.json
//   [13:2x 첫 실행] 사이트맵에 「개인정보 파일 / 문서」 머리가 없고(그 아래 탭 이름만 있음), 데이터베이스 화면에는 샤크라 탭 2개가 안 보임
//     → 하위 메뉴 · 탭 버튼 대신 사이트맵의 화면 이름을 바로 누름 (같은 이름이 여럿이면 앞 항목 뒤에서 찾음)
//     → 응답을 고치는 intercept 가 「Socket closed」 로 실패 → 응답을 읽기만 하는 after:response 로 바꿈, 화면마다 it 을 나눔
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const html = (name) => cy.get('body').then(($b) => {
  const el = $b.find('.v-content__wrap').last()[0];
  cy.writeFile(`cypress/probe/${name}.html`, el ? el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').replace(/ data-v-[a-z0-9]+=""/g, '').slice(0, 120000) : '(없음)');
});
// 화면 구조 : 주소 · 트리 · 표(머리 · 행 수 · 앞 3행) · 입력칸 · 버튼 · 안쪽 탭 · 쪽 표시 · 창
const snap = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  const tables = q('table').map((tb) => ({
    th: [...tb.querySelectorAll('th')].map(t).filter(Boolean),
    rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length,
    first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 3).map((r) => t(r).slice(0, 200))
  }));
  const dlg = [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown);
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    headlines: q('.c-headline, .title, .v-toolbar__title, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 15),
    tree: q('.vue-treeselect__label, .v-treeview-node__label, .tree-item').map(t).filter(Boolean).slice(0, 30),
    tables,
    inputs: q('input, textarea, select').map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), ph: e.getAttribute('placeholder'), val: (e.value || '').slice(0, 40), checked: e.getAttribute('aria-checked') })),
    buttons: [...new Set(q('button, .v-btn').map(t).filter(Boolean))],
    tabs: q('.v-tabs__item').map(t),
    chips: [...new Set(q('.v-chip').map(t).filter(Boolean))].slice(0, 20),
    alerts: q('.v-alert, .v-snack__content').map(t).filter(Boolean),
    paging: (t(root).match(/\d+\s*-\s*\d+\s*(of|\/)\s*\d+|전체\s*\d+\s*건|총\s*\d+\s*건/g) || []).slice(0, 5),
    dialogs: dlg.map((d) => t(d).slice(0, 2500)),
    dialogInputs: dlg.flatMap((d) => [...d.querySelectorAll('input, textarea')].filter(shown).map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), ph: e.getAttribute('placeholder'), val: (e.value || '').slice(0, 40) }))),
    text: t(root).slice(0, 1500)
  });
});

const out = { sitemap: [], urls: {}, missing: [] };
const save = () => cy.writeFile('cypress/probe/P21_요약.json', out, { log: false });

// 사이트맵에서 anchor 다음에 나오는 label 을 눌러 그 화면으로 감
const go = (anchor, label) => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(3000);
  const titles = () => Cypress.$('.v-list__tile__title').filter((i, e) => shown(e)).toArray();
  const open = (left) => cy.get('body').then(() => {
    if (titles().some((e) => t(e) === label) || left <= 0) return;
    cy.contains('button', '자산').click({ force: true });
    cy.wait(2000);
    open(left - 1);
  });
  open(3);
  return cy.get('body').then(() => {
    const all = titles();
    if (!out.sitemap.length) out.sitemap = all.map(t);
    // 왼쪽 메뉴 펼침 목록에도 같은 이름이 있을 수 있어 기준 이름은 마지막(사이트맵 쪽) 것을 씀
    let ai = -1;
    all.forEach((e, i) => { if (t(e) === anchor) ai = i; });
    const el = all.find((e, i) => i >= Math.max(ai, 0) && t(e) === label);
    if (!el) { out.missing.push(`사이트맵에 「${label}」 없음 (기준 「${anchor}」 ${ai})`); save(); return cy.wrap(false, { log: false }); }
    cy.wrap(el).click({ force: true });
    cy.wait(4500);
    cy.location('pathname').then((p) => { out.urls[label] = p; save(); });
    return cy.wrap(true, { log: false });
  });
};
// 트리가 있으면 첫 항목 선택 → 오른쪽 내용 (조회만)
const pickFirstTree = (name) => cy.get('body').then(($b) => {
  const $n = $b.find('.vue-treeselect__label, .v-treeview-node__label, .tree-item').filter((i, e) => shown(e) && t(e).length > 0);
  if (!$n.length) return;
  cy.writeFile(`cypress/probe/${name}_트리.json`, $n.toArray().map(t).slice(0, 60));
  cy.wrap($n.first()).click({ force: true });
  cy.wait(2500);
  snap(`${name}_트리선택`);
});
// 창이 떠 있으면 닫기 (취소 · 닫기 · close · esc)
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|clear)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1200);
});
// 본문의 「add」(추가) 버튼이 있으면 창을 열어 입력칸만 보고 취소
const peekAdd = (name) => cy.get('body').then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0];
  const $add = Cypress.$(root ? root.querySelectorAll('button, .v-btn') : []).filter((i, e) => shown(e) && /^add$/.test(t(e)));
  if (!$add.length) return;
  cy.wrap($add.first()).click({ force: true });
  cy.wait(2500);
  snap(`${name}_추가창`);
  cy.screenshot(`${name}_추가창`, { capture: 'viewport', overwrite: true });
  closeTop();
  closeTop();
});
const look = (name) => {
  snap(name); html(name);
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
  pickFirstTree(name);
  peekAdd(name);
};

const SCREENS = [
  ['개인정보 탐색 정책', '개인정보 탐색 정책'],
  ['개인정보 탐색 정책', '개인정보 동기화'],
  ['개인정보 탐색 정책', '샤크라 마스킹 정책'],
  ['개인정보 탐색 정책', '샤크라 아이템 정책'],
  ['샤크라 아이템 정책', '자산 보유 현황 / 전체'],
  ['샤크라 아이템 정책', "외부 로그 연동 정책/플랜 '탭1-파일'"],
  ['샤크라 아이템 정책', '외부 파일 저장소 연동'],
  ['데이터베이스 자산정보', '자산 보유 현황 / 전체'],
  ['데이터베이스 자산정보', '자산 보유 현황 / 개별'],
  ['데이터베이스 자산정보', '자산 상세 조회'],
  ['데이터베이스 자산정보', '확정된 개인정보 조회'],
  ['데이터베이스 확정처리', '자산 개인정보 확정처리'],
  ['데이터베이스 확정처리', '자산 분리된 개인정보 확정처리'],
  ['데이터베이스 확정처리', '사용자 정의 개인정보 확정처리']
];

describe('PROBE21 자산', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    // 화면이 부르는 XHR · fetch — 응답은 읽기만 함 (정적 파일 · 공통 · 알림류 제외)
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        try { body = JSON.stringify(res.body).slice(0, 800); } catch (e) { body = ''; }
        api.push({ step: Cypress.currentTest.title.slice(0, 20), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 220), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 300) : null, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => cy.writeFile('cypress/probe/P21_api.json', api, { log: false }));

  SCREENS.forEach(([anchor, label], i) => {
    const key = `P21_${String(i + 1).padStart(2, '0')}_${label.replace(/[\s/'-]+/g, '').slice(0, 12)}`;
    it(`${i + 1}. ${label}`, { retries: 0 }, () => {
      go(anchor, label).then((ok) => {
        if (!ok) return;
        look(key);
      });
    });
  });
});
