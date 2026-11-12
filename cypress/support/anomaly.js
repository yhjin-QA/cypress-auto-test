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
//   [2026-11-11] 결과 화면을 주소로 바로 열면 탭·내용 없이 빈 화면으로 뜰 때가 있음(같은 날 2회 관찰)
//     → 탭 버튼이 안 보이면 새로 고침 1회, 그래도 없으면 정책 화면으로 들어가 탭 버튼을 눌러 이동
const goAnomaly = (tab) => {
  const name = tab || '사용자 이상행위 정책';
  const hasTab = ($b) => $b.find('.v-btn__content:visible').toArray().some((e) => e.innerText.trim() === name);
  cy.visit(ANOMALY_URL[name] || ANOMALY_URL['사용자 이상행위 정책']);
  cy.wait(3500);
  cy.get('body').then(($b) => {
    if (hasTab($b)) return;
    cy.log(`↻ 「${name}」 화면이 비어 있음 → 새로 고침`);
    cy.reload(); cy.wait(5000);
    cy.get('body').then(($b2) => {
      if (hasTab($b2) || name === '사용자 이상행위 정책') return;
      cy.log(`↻ 정책 화면을 거쳐 「${name}」 탭으로 이동`);
      cy.visit(ANOMALY_URL['사용자 이상행위 정책']); cy.wait(4000);
      cy.get('.v-btn__content', { timeout: 20000 }).filter(':visible').contains(name).click({ force: true });
      cy.wait(3000);
    });
  });
  cy.get('.v-btn__content', { timeout: 20000 }).filter(':visible').contains(name).should('exist');
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
    // [2026-11-11] 계정 잠금·비밀번호 오류 안내가 떠 있으면 재시도하지 않고 바로 멈춤
    //   (재시도하면 실패 횟수가 더 쌓여 자동화가 계정을 잠그게 됨)
    const msg = Cypress.$('.v-alert:visible').text().replace(/\s+/g, ' ').trim();
    if (/잠금|비밀번호|패스워드|일치하지|틀렸|실패/.test(msg)) {
      throw new Error(`[${id}] 로그인 실패 (재시도 안 함) — 화면 안내 : 「${msg.slice(0, 80)}」 → 계정 잠금 해제 또는 cypress.env.json 비밀번호 확인`);
    }
    if (retry > 0) { cy.log(`↻ [${id}] 로그인 화면에 머묾 → 재시도`); login(id, pw, retry - 1); }
    else throw new Error(`[${id}] 로그인 실패 — 비밀번호(cypress.env.json) 또는 계정 잠금을 확인하세요`);
  });
  cy.wait(1500);
};
// 필수 입력 검증용 : 빈 값으로 눌렀을 때 「입력해 주세요」류 안내창이 따로 뜨면 그 안내창만 닫음
//   (2.9.7 소명 신청 : 「알림 — 소명 내용을 작성해 주세요.」)
//   (keepSelector 가 들어 있는 원래 창은 건드리지 않음 — 「확인」을 눌러도 처리가 진행되지 않는 안내창일 때만)
const dismissInputNotice = (keepSelector) => cy.get('body', { log: false }).then(($b) => {
  const $top = $b.find('.v-dialog--active:visible').last();
  if ($top.length && !$top.find(keepSelector).length && /입력|필수|작성|주세요|알림/.test($top.text())) {
    cy.log(`ℹ️ 안내창 닫음 : ${$top.text().replace(/\s+/g, ' ').trim().slice(0, 60)}`);
    cy.wrap($top).contains('button', /확인|닫기/).click({ force: true });
    cy.wait(800);
  }
});
const isDisabled = ($b) => $b.is(':disabled') || $b.hasClass('v-btn--disabled');

const loginAdmin = () => login(ADMIN_ID(), ADMIN_PW());

// [CRM .27 접속 기록] Node task(crmTraffic, cypress.config.js)로 로그인 → 조회 — 네트워크 오류 시 10초 간격 최대 3회
//   required=true  : 끝내 실패하면 테스트 실패 (접속 기록이 꼭 있어야 하는 시나리오)
//   required=false : 끝내 실패해도 경고만 남기고 진행 (이미 있는 경보로 진행할 수 있는 시나리오)
//   반환 : { ok, attempts, login, inquiry, cookie, error } — 비밀번호는 Node 쪽에서 cypress.env.json 을 직접 읽음
const crmTraffic = (userId, name, required = true) =>
  cy.task('crmTraffic', { userId }, { timeout: 180000 }).then((r) => {
    cy.log(`CRM(.27) ${userId} : ${r.ok ? '✅ 접속 기록 발생' : '❌ 실패'} (로그인 ${r.login} · 조회 ${r.inquiry} · ${r.attempts}회 시도)`);
    const saved = name ? cy.writeFile(`cypress/probe/${name}.json`, { userId, ...r, at: new Date().toISOString() }) : cy.wrap(null);
    return saved.then(() => {
      if (!r.ok && required) throw new Error(`CRM(.27) ${userId} 접속 기록을 만들지 못했습니다 (${r.attempts}회 시도) — ${r.error}`);
      if (!r.ok) cy.log(`⚠️ CRM(.27) 접속 실패 — 이미 있는 경보로 계속 진행 (${r.error})`);
      return cy.wrap(r);
    });
  });

// [실행이력] 정책 카드 오른쪽 클릭 > 「실행이력」 창을 읽고 닫음 (관리자 화면)
//   반환 : [{ at: '실행 시각', status: '성공' 등 }] (실행 시각 오름차순)
//   2.9.7 : 같은 탐지 구간을 다시 실행하면 그 줄의 실행 시각이 새 시각으로 바뀜 (줄 수는 그대로일 수 있음)
const runHistory = (policy, name) => {
  goAnomaly('사용자 이상행위 정책');
  searchPolicy(policy);
  policyName(policy).closest('.policy-card, tr').rightclick({ force: true });
  cy.wait(1200);
  cy.get('.v-menu__content').filter(':visible').contains('.v-list__tile, [role="menuitem"], div', /^\s*(history\s*)?실행이력\s*$/).click({ force: true });
  cy.wait(2500);
  if (name) dumpScreen(name);
  return cy.get('.v-dialog--active').filter(':visible').last().then(($d) => {
    const t = $d[0].innerText.replace(/\s+/g, ' ');
    const re = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*~\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*(.*?)(?=\s\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+\d{4}-|\s총\s|$)/g;
    const runs = [...t.matchAll(re)].map((m) => ({ at: m[1], status: m[2].replace(/check_circle_outline|error_outline|highlight_off|cancel|sync|schedule/g, '').trim() }))
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    if (name) cy.writeFile(`cypress/probe/${name}.json`, { runs, text: t.slice(0, 3000) });
    cy.get('body').type('{esc}', { force: true });
    cy.wait(800);
    return cy.wrap(runs);
  });
};

// [즉시실행] 정책 선택 → 「즉시실행」 → 실행이력에 새 실행 기록(성공)이 생길 때까지 기다림
//   2.9.7 : 즉시실행은 요청만 받고 「최대 1분 안에」 따로 실행됨
//   → 기다리지 않으면 경보가 시험 도중에 늦게 생겨 건수 비교가 어긋남 (2026-11-12 승인·반려 실패 원인)
//   prefix : 덤프 이름 앞머리 (예 'D04_3_0' → D04_3_0_즉시실행후 / _실행이력_전 / _실행이력_후)
const runNowAndWait = (policy, prefix, tries = 10) => {
  const last = (a) => (a.length ? a[a.length - 1] : { at: '', status: '' });
  runHistory(policy, `${prefix}_실행이력_전`).then((before) => {
    goAnomaly('사용자 이상행위 정책');
    searchPolicy(policy);
    policySelect(policy).check({ force: true });
    cy.contains('.toolbar-action-btn', '즉시실행').click({ force: true });
    activeDialog().contains('button', '확인').click({ force: true });
    cy.wait(2000);
    policyActive(policy).should('have.attr', 'aria-checked', 'true');
    dumpScreen(`${prefix}_즉시실행후`);
    const poll = (left) => {
      cy.wait(15000);
      runHistory(policy).then((after) => {
        const b = last(before); const a = last(after);
        cy.log(`🕒 실행이력 최근 ${b.at || '(없음)'} → ${a.at || '(없음)'} ${a.status}`);
        const fresh = a.at > b.at;
        if (fresh && /성공/.test(a.status)) { runHistory(policy, `${prefix}_실행이력_후`); return; }
        if (fresh && /실패|오류/.test(a.status)) throw new Error(`즉시실행 결과가 「${a.status}」 입니다 (실행 시각 ${a.at})`);
        if (left > 0) { poll(left - 1); return; }
        runHistory(policy, `${prefix}_실행이력_후`);
        expect(fresh, `즉시실행 뒤 새 실행 기록 (최근 ${b.at || '없음'} → ${a.at || '없음'})`).to.be.true;
        expect(a.status, '새 실행 기록의 상태').to.match(/성공/);
      });
    };
    poll(tries);
  });
};

module.exports = { ADMIN_ID, ADMIN_PW, ignoreErrors, dumpScreen, activeDialog, confirmIfAny, goAnomaly, policyTotal, searchPolicy, policyName, policySelect, policyActive, dialogSwitch, setDialogSwitch, thresholdInput, login, loginAdmin, dismissInputNotice, isDisabled, runHistory, runNowAndWait, crmTraffic };
