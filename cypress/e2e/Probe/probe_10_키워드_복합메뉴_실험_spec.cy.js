// ==========================================================================
// [Probe] 검출 Depth 설계용 2차 — LogCatch 설정은 바꾸지 않음 (저장 · 삭제 · 일괄 저장 · 정책 업데이트 안 누름, 쓰기 요청 418)
//   CRM(.27) 테스트 사이트에는 접속 기록 2건을 만듦 (dlp_tester.jsp, 등록 사용자 user001)
//   1. DB(.21 PG) : 식별 키워드 · 메뉴 동기화 관련 테이블 이름과 키워드 행 (select 만)
//   2. CRM 실험 : (a) 기존 키워드 말(거주지 주소 · 도로명 주소)을 넣은 채팅 메시지 POST
//                 (b) 요청 헤더 test: zz_probe_key 로 GET (리눅스_VIP고객 메뉴 키 규칙 = RequestHeader['test'])
//      → 3분 뒤 이력 검출 · 통합 목록 API 응답에서 user001 오늘 행 기록 (개인정보 유형 · 접속 메뉴)
//   3. 검출 메뉴 관리 > 메뉴 관리 : 리눅스_VIP고객 메뉴 행 · 행 버튼/아이콘 (삭제 방법 확인용, 누르지 않음)
//   결과 : cypress/probe/P10X_관찰.json · P10X_API.json
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => { obs[k] = v; cy.writeFile('cypress/probe/P10X_관찰.json', obs, { log: false }); };
const api = [];
const blocked = [];
const READ_POST = /search|list|select|find|query|tree|check|valid|count|page|login|preview|statistics|log-/i;
const pg = (key, sql) => cy.task('queryPostgresDB', sql, { timeout: 60000 }).then((r) => note(key, Array.isArray(r) ? r.slice(0, 60) : r));

describe('probe_10_키워드_복합메뉴_실험', () => {
  A.ignoreErrors();
  beforeEach(() => {
    A.loginAdmin();
    cy.intercept({ method: 'GET', url: /\/logcatch\/(api|pams)\// }, (req) => {
      req.continue((res) => { api.push({ m: 'GET', url: req.url.replace(/^https?:\/\/[^/]+/, ''), status: res.statusCode, body: JSON.stringify(res.body || '').slice(0, 6000) }); });
    });
    cy.intercept({ method: /^(POST|PUT|DELETE|PATCH)$/, url: /\/logcatch\// }, (req) => {
      const url = req.url.replace(/^https?:\/\/[^/]+/, '');
      if (req.method === 'POST' && READ_POST.test(url)) {
        req.continue((res) => { api.push({ m: 'POST', url, req: JSON.stringify(req.body || '').slice(0, 1500), status: res.statusCode, body: JSON.stringify(res.body || '').slice(0, 12000) }); });
        return;
      }
      blocked.push({ m: req.method, url, body: JSON.stringify(req.body || '').slice(0, 800) });
      req.reply({ statusCode: 418, body: { code: 418, message: 'probe blocked' } });
    });
  });
  afterEach(() => { cy.writeFile('cypress/probe/P10X_API.json', { api, blocked }, { log: false }); });

  it('1. DB 테이블 · 키워드 행 (select 만)', { retries: 0 }, () => {
    pg('P10X_DB_테이블', "select table_schema, table_name from information_schema.tables where table_name ilike '%keyword%' or table_name ilike '%menu_sync%' or table_name ilike '%menusync%' or table_name ilike '%content_type%' order by 1, 2");
    cy.task('queryPostgresDB', "select table_schema||'.'||table_name as t from information_schema.tables where table_name ilike '%keyword%' order by 1", { timeout: 60000 }).then((rows) => {
      (Array.isArray(rows) ? rows : []).slice(0, 6).forEach((r, i) => pg(`P10X_DB_키워드_${i}_${r.t}`, `select * from ${r.t} limit 40`));
    });
  });

  it('2. CRM 실험 (기존 키워드 말 · 메뉴 키 헤더) → 3분 뒤 검출 · 통합 목록', { retries: 0 }, () => {
    const at = new Date().toISOString();
    cy.task('crmFetch', { userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'POST', maxBody: 0,
      form: { action: 'send', chatMsg: `[probe 키워드 ${at}] 거주지 주소 : 서울특별시 강남구 테헤란로 123 / 도로명 주소 : 서울특별시 중구 세종대로 110` } }, { timeout: 90000, log: false })
      .then((r) => note('P10X_CRM_a_키워드말', { at, login: r.login, status: r.status, error: r.error }));
    cy.task('crmFetch', { userId: 'user001', path: '/crm/dlp_tester.jsp', method: 'GET', maxBody: 0, headers: { test: 'zz_probe_key' } }, { timeout: 90000, log: false })
      .then((r) => note('P10X_CRM_b_헤더키', { at: new Date().toISOString(), login: r.login, status: r.status, error: r.error }));
    cy.wait(180000);
    cy.visit('/logcatch/record/accessLog/doubtLog');
    cy.wait(5000);
    cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });
    cy.wait(6000);
    A.dumpScreen('P10X_1_검출');
    cy.get('.tab-btn').filter((i, e) => shown(e) && t(e) === '통합').first().click({ force: true });
    cy.wait(5000);
    cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });
    cy.wait(6000);
    A.dumpScreen('P10X_2_통합');
    cy.get('body').then(($b) => {
      const rows = $b.find('.v-content__wrap').last().find('tbody tr').filter((i, e) => shown(e)).toArray().slice(0, 15)
        .map((r) => [...r.querySelectorAll('td')].map((td) => `${t(td)}${[...td.querySelectorAll('[title]')].map((x) => `{${x.getAttribute('title')}}`).join('')}`));
      note('P10X_통합_화면행', rows);
    });
  });

  it('3. 메뉴 관리 — 리눅스_VIP고객 메뉴 행 · 행 버튼 (누르지 않음)', { retries: 0 }, () => {
    cy.visit('/logcatch/com/siteMap');
    cy.wait(2500);
    cy.contains('button', '검출').click({ force: true });
    cy.wait(1500);
    cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '검출 메뉴 관리').first().click({ force: true });
    cy.wait(3500);
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === '메뉴 관리').first().click({ force: true });
    cy.wait(4000);
    cy.get('body').then(($b) => {
      const root = $b.find('.v-content__wrap').last()[0] || $b[0];
      note('P10X_메뉴관리_처음', { 본문: t(root).slice(0, 1500), 입력칸: $b.find('input[aria-label]').filter((i, e) => shown(e)).toArray().map((e) => e.getAttribute('aria-label')) });
    });
    A.dumpScreen('P10X_3_메뉴관리');
    cy.get('body').then(($b) => {
      const inp = $b.find('input[aria-label="업무시스템"]').filter((i, e) => shown(e));
      if (!inp.length) return;
      cy.wrap(inp.first()).click({ force: true });
      cy.wait(1000);
      cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === '리눅스_VIP고객').first().click({ force: true });
      cy.get('body').type('{esc}');
      cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });
      cy.wait(4000);
    });
    cy.get('body').then(($b) => {
      const root = $b.find('.v-content__wrap').last()[0] || $b[0];
      const rows = [...root.querySelectorAll('tbody tr')].filter(shown).slice(0, 20);
      note('P10X_메뉴관리_VIP', {
        머리: [...root.querySelectorAll('th')].filter(shown).map(t),
        행: rows.map((r) => [...r.querySelectorAll('td')].map(t)),
        행버튼: rows.slice(0, 3).map((r) => [...r.querySelectorAll('button, i, a')].map((e) => `${e.tagName}.${(e.className || '').toString().slice(0, 50)}:${t(e)}`)),
        버튼: $b.find('button, .v-btn').filter((i, e) => shown(e)).toArray().map(t).filter(Boolean),
      });
    });
    A.dumpScreen('P10X_4_메뉴관리_VIP');
  });
});
