// [임시 탐색용 20] 다크 모드 배지 대비 — Mantis 첨부용 화면 · 색 · 대비 값 (2026-11-13)
//   1. 분석 > 프로파일링 > 기본 프로파일 「쓰는 정책」(link) 창 : 위험도 「주의」 · 사용 여부 「미사용」 배지
//   2. 소명 > 신청 > 이상행위 경보 > 전체 사용자 : 사용자 묶음 머리 위험도 「주의」 배지
//   3. (참고) 이상행위 정책 편집 창 위험도 선택 「주의」
//   조회만 : 창은 닫기 · 취소로 닫음 (저장 안 함)
//   결과 : cypress/screenshots/probe20_다크배지_spec.cy.js/*.png · cypress/probe/P20_배지.json
const A = require('../../support/anomaly');
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

// ---- 글자색 · 실제 배경색(반투명 배경을 아래 배경과 합성) · 대비
const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
const hex = (c) => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const measure = (el) => {
  const w = el.ownerDocument.defaultView;
  const cs = w.getComputedStyle(el);
  const fg = parse(cs.color);
  const layers = [];
  for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
    const bg = parse(w.getComputedStyle(e).backgroundColor);
    if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
  }
  let bg = { r: 255, g: 255, b: 255, a: 1 };
  layers.reverse().forEach((l) => { bg = over(l, bg); });
  const f = fg.a < 1 ? over(fg, bg) : fg;
  const L1 = lum(f); const L2 = lum(bg);
  return { text: t(el), fg: hex(f), bg: hex(bg), ratio: Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100, font: `${cs.fontSize} ${cs.fontWeight}` };
};

const out = {};
const save = () => cy.writeFile('cypress/probe/P20_배지.json', out, { log: false });
const dialog = () => cy.get('.v-dialog--active').filter(':visible').last();
const closeTop = () => cy.get('body').then(($b) => {
  const $d = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
  if (!$d.length) return;
  const $x = $d.find('button, .v-btn').filter((i, e) => shown(e) && /^(취소|닫기|close|✕)$/.test(t(e)));
  if ($x.length) cy.wrap($x.last()).click({ force: true }); else cy.get('body').type('{esc}', { force: true });
  cy.wait(1000);
});

describe('PROBE20 다크 모드 배지', () => {
  A.ignoreErrors();
  beforeEach(() => A.loginAdmin());

  it('1. 프로파일링 쓰는 정책 창 배지', { retries: 0 }, () => {
    cy.visit('/logcatch/analyze/profiling/policy');
    cy.wait(4000);
    cy.get('.pp-card', { timeout: 20000 }).filter((i, e) => shown(e)).should('have.length.greaterThan', 0);
    // 쓰는 정책이 있는 첫 카드의 link
    cy.get('.pp-card').filter((i, e) => shown(e) && [...e.querySelectorAll('.pp-fact')].some((f) => /쓰는 정책/.test(t(f)) && /[1-9]/.test(t(f.querySelector('.pp-fact-v'))))).first().then(($c) => {
      out.profile = t($c[0].querySelector('.pp-card-name'));
      cy.wrap($c.find('button, .v-btn').filter((i, e) => shown(e) && t(e) === 'link').first()).click({ force: true });
    });
    cy.wait(2000);
    dialog().should('contain', '쓰는 정책');
    cy.screenshot('P20_1_쓰는정책창', { capture: 'viewport', overwrite: true });
    dialog().find('.pu-row').filter((i, e) => shown(e)).then(($rows) => {
      out.profileRows = $rows.toArray().map((row) => ({
        row: t(row),
        badges: [...row.querySelectorAll(':scope > span')].filter((s) => !s.classList.contains('pu-id') && !s.classList.contains('pu-name')).map(measure)
      }));
      save();
      cy.wrap($rows.first()).screenshot('P20_1b_쓰는정책_첫줄_확대', { padding: 6, overwrite: true });
    });
    closeTop();
  });

  it('2. 소명 신청 이상행위 경보 묶음 머리 배지', { retries: 0 }, () => {
    cy.visit('/logcatch/approval/submit/anomaly-alerts');
    cy.wait(3500);
    cy.get('.esh-scope-btn', { timeout: 15000 }).filter((i, e) => t(e) === '전체 사용자').click({ force: true });
    cy.wait(2500);
    cy.screenshot('P20_2_이상행위경보_목록', { capture: 'viewport', overwrite: true });
    cy.get('.incident-header').filter((i, e) => shown(e)).then(($h) => {
      out.alertHeaders = $h.toArray().slice(0, 5).map((h) => ({
        header: t(h).slice(0, 120),
        badges: [...h.querySelectorAll('span')].filter((s) => shown(s) && /^(주의|경계|심각)$/.test(t(s))).map(measure)
      }));
      save();
      if ($h.length) cy.wrap($h.first()).screenshot('P20_2b_묶음머리_확대', { padding: 6, overwrite: true });
    });
  });

  it('3. (참고) 이상행위 정책 편집 창 위험도 선택', { retries: 0 }, () => {
    A.goAnomaly('사용자 이상행위 정책');
    A.searchPolicy('신규 업무시스템 접속');
    A.policyName('신규 업무시스템 접속').click({ force: true });
    cy.wait(2500);
    cy.screenshot('P20_3_정책편집창', { capture: 'viewport', overwrite: true });
    cy.get('body').then(($b) => {
      out.severityRadio = $b.find('.severity-radio-label').filter((i, e) => shown(e)).toArray().map(measure);
      save();
    });
    closeTop();
  });
});
