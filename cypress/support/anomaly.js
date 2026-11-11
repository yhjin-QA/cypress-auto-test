// ==========================================================================
// [2.9.7 신규] 분석(사용자 이상행위) 공통 helper
//   - 계정/비밀번호는 cypress.env.json 에서 읽음 (코드에 비밀번호를 쓰지 않음)
//   - 정책 보기 방식(카드/목록)은 계정에 저장되므로 둘 다 대응
// ==========================================================================
const ADMIN_ID = () => Cypress.env('LC_USER') || 'admin';
const ADMIN_PW = () => Cypress.env('LC_PW');

const ignoreErrors = () => {
  Cypress.on('uncaught:exception', (err) => {
    const ignored = ['Navigation cancelled', 'Cannot read properties', 'resetValidation', 'NavigationDuplicated',
      'Redirected when going from', 'navigation guard', 'Avoided redundant navigation', 'Loading chunk',
      'Loading CSS chunk', 'e is not defined', 'Script error', 'not valid JSON', 'ChunkLoadError', 'ResizeObserver'];
    if (ignored.some((e) => err.message.includes(e))) return false;
  });
};

// 화면 구조를 JSON 으로 남김 (실패 지점 분석용)
const dumpScreen = (name) => {
  cy.document().then((doc) => {
    const vis = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const txt = (el) => (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 150);
    const q = (s) => [...doc.querySelectorAll(s)].filter(vis);
    const uniq = (a) => [...new Set(a.filter(Boolean))];
    cy.writeFile(`cypress/probe/${name}.json`, {
      url: doc.location.href,
      headlines: uniq(q('.c-headline,.v-toolbar__title,.section-header,.v-card__title').map(txt)),
      buttons: uniq(q('button,.v-btn').map(txt)).slice(0, 120),
      inputs: q('input,textarea').map((e) => ({ type: e.type, aria: e.getAttribute('aria-label'), ph: e.getAttribute('placeholder'), val: (e.value || '').slice(0, 40), checked: e.getAttribute('aria-checked') })),
      th: uniq(q('th').map(txt)),
      rows: q('tbody tr').slice(0, 6).map(txt),
      cards: q('.policy-card,.incident-header').slice(0, 6).map(txt),
      menus: uniq(q('.v-list__tile__title').map(txt)),
      dialogs: q('.v-dialog--active').map((d) => (d.innerText || '').replace(/\s+/g, ' ').slice(0, 2000)),
      snack: uniq(q('.v-snack__content,.v-alert').map(txt))
    });
  });
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
};

const activeDialog = () => cy.get('.v-dialog--active').filter(':visible').last();

// 확인창이 뜨면 「확인」 (없으면 넘어감)
const confirmIfAny = () => {
  cy.wait(800);
  cy.get('body').then(($b) => {
    const $btn = $b.find('.v-dialog--active:visible .v-btn:visible').filter((i, e) => /^(확인|예|저장)$/.test(e.innerText.trim()));
    if ($btn.length) cy.wrap($btn.last()).click({ force: true });
  });
  cy.wait(800);
};

// 분석 > 이상행위 탭으로 이동 — 메뉴 클릭은 화면 전환 직후(로그인·다른 사이트 방문 뒤)에 안 먹힐 때가 있어 주소로 직접 이동
const ANOMALY_URL = {
  '사용자 이상행위 정책': '/logcatch/analyze/customAnomalyBehaviorPolicy',
  '사용자 이상행위 결과': '/logcatch/analyze/customAnomalyBehaviorPolicyResult',
  '사용자 이상행위 대시보드': '/logcatch/analyze/customAnomalyBehaviorPolicyDashboard'
};
const goAnomaly = (tab) => {
  cy.visit(ANOMALY_URL[tab] || ANOMALY_URL['사용자 이상행위 정책']);
  cy.wait(3500);
  cy.get('.v-btn__content', { timeout: 20000 }).filter(':visible').contains(tab || '사용자 이상행위 정책').should('exist');
};

const policyTotal = () => cy.get('.v-toolbar__title').filter(':visible').contains('정책 목록')
  .invoke('text').then((t) => parseInt((t.match(/\((\d+)\)/) || [])[1], 10));

const searchPolicy = (kw) => {
  cy.get('input[placeholder="정책명 / 설명 / 라벨 검색"]').clear({ force: true });
  if (kw) cy.get('input[placeholder="정책명 / 설명 / 라벨 검색"]').type(kw, { force: true });
  cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
  cy.wait(2000);
};

// 정책 이름 요소 (카드/목록 공통, 이름 완전 일치)
const policyName = (name) => cy.get('.policy-card-name, table.v-datatable tbody td').filter(':visible')
  .filter((i, e) => e.innerText.trim() === name).first();
const policySelect = (name) => cy.get('input[data-role="policy-select"]')
  .filter((i, e) => (e.getAttribute('aria-label') || '') === `정책 선택${name}`).first();
const policyActive = (name) => cy.get('input[data-role="policy-active-toggle"]')
  .filter((i, e) => (e.getAttribute('aria-label') || '').endsWith(`(${name})`)).first();

// 편집창의 토글(사용/소명/경보 알림 메일)을 원하는 상태로
//   전문가 모드: input[aria-label="사용"] 등 / 사용자 모드: 라벨 없는 스위치 3개가 [사용, 소명, 경보 알림 메일] 순서
const SWITCH_ORDER = ['사용', '소명', '경보 알림 메일'];
const dialogSwitch = (label) => activeDialog().then(($d) => {
  let $i = $d.find(`input[type="checkbox"][aria-label="${label}"]`);
  if (!$i.length) $i = $d.find('input[type="checkbox"]').filter((i, e) => !e.getAttribute('aria-label')).eq(SWITCH_ORDER.indexOf(label));
  return cy.wrap($i.first());
});
const setDialogSwitch = (label, on) => {
  // 편집창 스위치는 강제 클릭(force)에는 반응하지 않고 실제 마우스 클릭(realClick)에만 반응함 (2.9.7 확인)
  // 소명 ON 시 서버가 소명 가능 여부를 확인하고(POST .../explanation-shape) 「소명 사용 시 탐지 대상은 사용자로 지정됩니다.」 안내가 뜸
  dialogSwitch(label).invoke('attr', 'aria-checked').then((c) => {
    if ((c === 'true') === on) return;
    dialogSwitch(label).parents('.v-input').first().find('.v-input--switch__thumb').first().realClick();
    cy.wait(1500);
  });
  dialogSwitch(label).should('have.attr', 'aria-checked', on ? 'true' : 'false');
};
// 사용자 모드 임계값 칸 (뒤에 「건 이상」 표시가 붙은 숫자 칸)
const thresholdInput = () => activeDialog().find('.v-text-field__slot').filter((i, e) => /건 이상/.test(e.innerText)).find('input[type="number"]').first();

// 로그인 (계정 전환용)
//   - 앞 계정의 쿠키·localStorage·sessionStorage 를 모두 비우고 로그인 화면부터 시작
//   - 로그인 요청은 성공했는데 화면이 로그인에 머무는 경우(계정 전환 직후 간헐 발생)가 있어 1회 재시도
//   - 비밀번호는 실행 기록에 남기지 않음 (log: false)
const login = (id, pw, retry = 1) => {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.window({ log: false }).then((w) => { try { w.sessionStorage.clear(); } catch (e) { /* ignore */ } });
  cy.visit('/logcatch/login');
  cy.wait(3000);
  // 로그인 화면이 빈 화면으로 뜨는 경우(실행 첫 접속 시 간헐 발생)가 있어 입력칸이 없으면 새로 고침 (최대 2회)
  const ensureForm = (left) => cy.get('body', { log: false }).then(($b) => {
    if ($b.find('input[aria-label="사용자 계정"]').length || left <= 0) return;
    cy.log('↻ 로그인 화면이 비어 있음 → 새로 고침');
    cy.reload();
    cy.wait(4000);
    ensureForm(left - 1);
  });
  ensureForm(2);
  cy.get('input[aria-label="사용자 계정"]', { timeout: 20000 }).clear({ force: true }).type(id, { force: true });
  cy.get('input[aria-label="패스워드"]').clear({ force: true }).type(pw, { force: true, log: false });
  cy.contains('button', '로그인').click({ force: true });
  cy.wait(2500);
  cy.get('body').then(($b) => {
    if ($b.find('.v-card__title:contains("이미 접속 중인 계정입니다."):visible').length) {
      cy.contains('.v-card__title', '이미 접속 중인 계정입니다.').closest('.v-card').contains('확인').click({ force: true });
    }
  });
  cy.wait(3000);
  cy.url().then((u) => {
    if (!u.includes('/login')) { cy.log(`✅ [${id}] 로그인`); return; }
    if (retry > 0) { cy.log(`↻ [${id}] 로그인 화면에 머묾 → 재시도`); login(id, pw, retry - 1); }
    else throw new Error(`[${id}] 로그인 실패 — 비밀번호(cypress.env.json) 또는 계정 잠금을 확인하세요`);
  });
  cy.wait(1500);
};
const loginAdmin = () => login(ADMIN_ID(), ADMIN_PW());

module.exports = { ADMIN_ID, ADMIN_PW, ignoreErrors, dumpScreen, activeDialog, confirmIfAny, goAnomaly, policyTotal, searchPolicy, policyName, policySelect, policyActive, dialogSwitch, setDialogSwitch, thresholdInput, login, loginAdmin };
