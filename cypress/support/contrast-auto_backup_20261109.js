// =====================================================================
// 다크 모드 대비 "자동" 검사 — 기존 spec 을 그대로 돌리면서 화면이 바뀔 때마다 검사
//
//   사용) Dark_Contrast_Check 의 spec 에서
//     import '../../support/contrast-auto';
//     import '../UI_Module_GitLab_Check/03_Dev_이력_spec.cy.js';
//
//   동작)
//   - cy.click() 을 덧씌워, 클릭 "직전" 화면 상태가 처음 보는 상태면 대비 검사를 한 번 실행
//     (기존 spec 이 창을 열고 확인한 뒤 다음 클릭을 하기 직전 = 화면이 다 그려진 시점)
//   - 상태 구분 : URL 경로 + 열린 탭 + 열린 창(v-dialog--active) 제목
//     → 같은 상태는 한 번만 검사 (중복 기록 없음)
//   - 창이 열려 있으면 창만, 아니면 화면 전체 검사
//   - 다크 모드가 아니면 검사하지 않고 kind=not-dark 로만 기록
//   - 기존 spec 의 동작·판정은 바꾸지 않음 (검사는 기록만, 실패 처리 없음)
//
//   결과) cypress/reports/contrast/contrast-YYYYMMDD.ndjson  (spec 열에 spec 이름)
// =====================================================================
import './contrast';

const seen = new Set();
const MAX_SCAN = Number(Cypress.env('CONTRAST_MAX_SCAN') || 300); // spec 당 최대 검사 횟수

const ymd = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};
const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

const currentState = () => {
  let win;
  try { win = cy.state('window'); } catch (e) { return null; }
  if (!win || !win.location || !win.document) return null;
  const path = win.location.pathname || '';
  if (!path || path.includes('/login') || path === 'blank') return null;

  const $ = Cypress.$;
  const doc = win.document;
  const $dlg = $(doc).find('.v-dialog--active').filter(':visible').last();
  let dlg = '';
  if ($dlg.length) {
    dlg = clean($dlg.find('.v-card__title, .v-toolbar__title, .headline, h1, h2, h3').first().text())
      || clean($dlg.text()).slice(0, 30) || '(제목 없는 창)';
    dlg = dlg.slice(0, 40);
  }
  const tab = $(doc).find('.v-tabs__item--active').filter(':visible')
    .map((i, el) => clean(el.textContent)).get().join('/').slice(0, 60);

  const key = `${path}|${tab}|${dlg}`;
  return { key, path, tab, dlg, scope: $dlg.length ? '.v-dialog--active' : null };
};

// Cypress 12+ 제약: 덧씌운 명령 안에서 다른 cy 명령 뒤에 originalFn 을 부르면 멈춤
//  → 검사 후에는 cy.wrap(subject).click(...) 으로 click 을 다시 큐에 넣고,
//    다시 들어온 click 은 bypass 표시를 보고 originalFn 을 바로 실행
let bypass = false;

Cypress.Commands.overwrite('click', (originalFn, subject, ...args) => {
  if (bypass) {
    bypass = false;
    return originalFn(subject, ...args);
  }
  const st = currentState();
  if (!st || seen.has(st.key) || seen.size >= MAX_SCAN) {
    return originalFn(subject, ...args);
  }
  seen.add(st.key);
  const label = [st.path, st.tab, st.dlg ? `[창] ${st.dlg}` : ''].filter(Boolean).join(' > ');

  cy.isDarkTheme().then((dark) => {
    if (!dark) {
      const row = { spec: Cypress.spec.name, screen: label, kind: 'not-dark', host: (cy.state('window') || {}).location?.host || '', at: new Date().toISOString() };
      cy.writeFile(`cypress/reports/contrast/contrast-${ymd()}.ndjson`, JSON.stringify(row) + '\n', { flag: 'a+', log: false });
    } else {
      cy.checkContrast(label, st.scope, { auto: true });
      cy.checkDarkLeaks(label, st.scope);
    }
  });
  return cy.then({ log: false }, () => { bypass = true; })
    .then(() => cy.wrap(subject, { log: false }).click(...args));
});
