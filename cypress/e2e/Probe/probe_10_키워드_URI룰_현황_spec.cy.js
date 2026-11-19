// ==========================================================================
// [Probe · 조회 전용] 검출 Depth 설계용 — 식별 키워드 정의 · URI 관리 룰 · URI 관리 일괄 등록 현황 기록
//   저장 · 삭제 · 일괄 저장 · 정책 업데이트를 누르지 않음. 혹시 모를 쓰기 요청(PUT · DELETE · PATCH, 읽기형이 아닌 POST)은 서버로 보내지 않음(418)
//   1. 식별 키워드 정의 : 버튼 · 트리 · 리눅스_VIP고객 키워드 하나 선택(그때 부르는 API) · 「추가」 칸의 입력 항목과 선택지(개인정보 유형 · 대상 · 업무 시스템 · Content Type …)
//   2. URI 관리 룰 : 시스템 · 설정 API 전체 (리눅스_VIP고객 메뉴 키 조합 규칙 확인)
//   3. URI 관리 일괄 등록 : 리눅스_VIP고객 고르기 → 표준 템플릿 내려받기 · 등록된 메뉴 목록 앞부분 · 행의 버튼/아이콘
//   결과 : cypress/probe/P10K_관찰.json · P10K_API.json · cypress/downloads 의 템플릿
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P10K_관찰.json', obs, { log: false }); };
const api = [];
const blocked = [];
const SYS = '리눅스_VIP고객';
const READ_POST = /search|list|select|find|query|tree|check|valid|count|page|login|preview|parse|excel|template|download/i;

const buttons = ($b) => $b.find('button, .v-btn').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean);
const inputsOf = ($b) => $b.find('input[aria-label], textarea[aria-label]').filter((i, e) => shown(e)).toArray()
  .map((e) => ({ label: e.getAttribute('aria-label'), type: e.type, role: e.getAttribute('role'), value: (e.value || '').slice(0, 80), readonly: e.readOnly, disabled: e.disabled }));
const optionsOf = (label) => {
  cy.get(`input[aria-label="${label}"]`).filter((i, e) => shown(e)).first().click({ force: true });
  cy.wait(1200);
  cy.get('body').then(($b) => {
    const opts = $b.find('.v-menu__content').filter((i, e) => shown(e)).last().find('.v-list__tile__title, .v-list-item__title').toArray().map(t).slice(0, 80);
    obs.P10K_선택지 = { ...(obs.P10K_선택지 || {}), [label]: opts };
    note('P10K_선택지', obs.P10K_선택지);
  });
  cy.get('body').type('{esc}');
  cy.wait(500);
};

describe('probe_10_키워드_URI룰_현황', () => {
  A.ignoreErrors();
  beforeEach(() => {
    A.loginAdmin();
    cy.intercept({ method: 'GET', url: /\/logcatch\/(api|common)\// }, (req) => {
      req.continue((res) => { api.push({ m: 'GET', url: req.url.replace(/^https?:\/\/[^/]+/, ''), status: res.statusCode, body: JSON.stringify(res.body || '').slice(0, 2500) }); });
    });
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: /\/logcatch\// }, (req) => {
      const url = req.url.replace(/^https?:\/\/[^/]+/, '');
      if (req.method === 'POST' && READ_POST.test(url)) {
        req.continue((res) => { api.push({ m: 'POST', url, req: JSON.stringify(req.body || '').slice(0, 800), status: res.statusCode, body: JSON.stringify(res.body || '').slice(0, 2500) }); });
        return;
      }
      blocked.push({ m: req.method, url, body: JSON.stringify(req.body || '').slice(0, 800) });
      req.reply({ statusCode: 418, body: { code: 418, message: 'probe blocked' } });
    });
  });
  afterEach(() => {
    cy.writeFile('cypress/probe/P10K_API.json', { api, blocked }, { log: false });
  });

  it('1. 식별 키워드 정의 — 트리 · 키워드 선택 API · 추가 칸 항목/선택지', { retries: 0 }, () => {
    cy.visit('/logcatch/detect/privacyTypeDefinition/detectionKeywords');
    cy.get('.privacy-keyword-tree-root', { timeout: 30000 }).should('exist');
    cy.wait(3000);
    cy.get('body').then(($b) => {
      note('P10K_키워드_버튼', buttons($b));
      note('P10K_키워드_아이콘버튼', $b.find('i.material-icons, i.v-icon').filter((i, e) => shown(e) && e.closest('button')).toArray().map((e) => t(e)).slice(0, 40));
      note('P10K_키워드_트리', $b.find('.privacy-keyword-tree-root .vue-treeselect__label').filter((i, e) => shown(e)).toArray().map(t).slice(0, 80));
      note('P10K_키워드_처음입력칸', inputsOf($b));
    });
    A.dumpScreen('P10K_1_키워드_처음');
    // VIP 키워드 하나 선택 → 설정 칸
    const leafSel = '.privacy-keyword-tree-root .vue-treeselect__list-item.vue-treeselect__indent-level-2';
    cy.get('body').then(($b) => {
      const leaf = $b.find(leafSel).filter((i, e) => shown(e) && (e.closest('.vue-treeselect__indent-level-1') || { innerText: '' }).innerText.includes(SYS)).first();
      if (!leaf.length) { note('P10K_키워드_VIP선택', '(VIP 키워드 없음)'); return; }
      cy.wrap(leaf).find('label.text-label').first().realClick({ scrollBehavior: false });
      cy.wait(3000);
      cy.get('body').then(($c) => note('P10K_키워드_VIP선택', { 입력칸: inputsOf($c), 본문: t(($c.find('.v-content__wrap').last()[0]) || $c[0]).slice(0, 1500) }));
      A.dumpScreen('P10K_2_키워드_VIP선택');
    });
    // 추가 칸
    cy.get('body').then(($b) => {
      const add = $b.find('button, .v-btn').filter((i, e) => shown(e) && /추가|신규|^add$/.test(t(e)) && !e.closest('.v-dialog')).first();
      note('P10K_키워드_추가버튼', add.length ? t(add[0]) : '(없음)');
      if (!add.length) return;
      cy.wrap(add).click({ force: true });
      cy.wait(2500);
      cy.get('body').then(($c) => {
        const ins = inputsOf($c);
        note('P10K_키워드_추가칸', { 입력칸: ins, 버튼: buttons($c), 대화창: t($c.find('.v-dialog--active')[0]).slice(0, 800) });
        A.dumpScreen('P10K_3_키워드_추가');
        ins.filter((x) => x.role === 'combobox' || x.readonly).forEach((x) => optionsOf(x.label));
      });
    });
    cy.get('body').type('{esc}');
  });

  it('2 · 3. URI 관리 룰 설정 · 일괄 등록 (리눅스_VIP고객) — 템플릿 내려받기 · 등록된 메뉴', { retries: 0 }, () => {
    cy.intercept('GET', /\/api\/v1\/menu-sync\/systems/).as('sys');
    cy.intercept('GET', /\/api\/v1\/menu-sync\/configs/).as('cfg');
    cy.visit('/logcatch/com/siteMap');
    cy.wait(2500);
    cy.contains('button', '검출').click({ force: true });
    cy.wait(1500);
    cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '검출 메뉴 관리').first().click({ force: true });
    cy.wait(3500);
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === 'URI 관리 룰').first().click({ force: true });
    cy.wait('@sys', { timeout: 20000 }).then((x) => note('P10K_시스템', (x.response.body && x.response.body.etcData) || x.response.body));
    cy.wait('@cfg', { timeout: 20000 }).then((x) => note('P10K_설정', (x.response.body && x.response.body.etcData) || x.response.body));
    cy.get('.master-system-tile', { timeout: 15000 }).filter((i, e) => shown(e) && t(e.querySelector('.v-list__tile__title')) === SYS).first().find('a').first().click({ force: true });
    cy.wait(2500);
    cy.get('body').then(($b) => {
      const card = $b.find('.rule-content-card').filter((i, e) => shown(e))[0];
      note('P10K_룰_VIP화면', { 본문: t(card).slice(0, 1500), 선택지: [...(card ? card.querySelectorAll('select') : [])].map((s) => [...s.options].map((o) => t(o))) });
    });
    A.dumpScreen('P10K_4_룰_VIP');

    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === 'URI 관리 일괄 등록').first().click({ force: true });
    cy.wait(3500);
    cy.get('.master-system-tile', { timeout: 15000 }).filter((i, e) => shown(e) && t(e.querySelector('.v-list__tile__title')) === SYS).first().find('a').first().click({ force: true });
    cy.wait(3500);
    cy.get('body').then(($b) => {
      const root = $b.find('.v-content__wrap').last()[0] || $b[0];
      const rows = [...root.querySelectorAll('tbody tr')].filter(shown).slice(0, 15);
      note('P10K_일괄_화면', {
        본문앞: t(root).slice(0, 1200), 버튼: buttons($b),
        머리: [...root.querySelectorAll('th')].filter(shown).map(t),
        행: rows.map((r) => [...r.querySelectorAll('td')].map(t)),
        행버튼: rows.slice(0, 2).map((r) => [...r.querySelectorAll('button, i, a')].map((e) => `${e.tagName}.${(e.className || '').toString().slice(0, 60)}:${t(e)}`)),
      });
    });
    A.dumpScreen('P10K_5_일괄_VIP');
    cy.task('readDirectory', 'cypress/downloads').then((before = []) => {
      cy.get('button, .v-btn').filter((i, e) => shown(e) && t(e) === '표준 템플릿 다운로드').first().click({ force: true });
      const waitFile = (left) => cy.task('readDirectory', 'cypress/downloads').then((after = []) => {
        const fresh = after.filter((f) => !before.includes(f) && !/\.crdownload$|\.tmp$/.test(f));
        if (fresh.length || left <= 0) { note('P10K_일괄_템플릿', fresh); return; }
        cy.wait(1000, { log: false });
        waitFile(left - 1);
      });
      waitFile(20);
    });
  });
});
