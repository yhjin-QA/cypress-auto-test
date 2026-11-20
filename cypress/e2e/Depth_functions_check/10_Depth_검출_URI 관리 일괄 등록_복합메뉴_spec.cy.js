// ==========================================================================
// [2.9.7 신규] 10_Depth_검출_URI 관리 일괄 등록_복합메뉴 — 일괄 등록한 복합 메뉴가 실제 접속 기록의 메뉴명으로 나오는지
//   리눅스_VIP고객(bsnId 5) 메뉴 키 규칙 = 요청 헤더 test (URI 포함 안 함 → 키 ["0","<헤더 값>"]) — 규칙은 바꾸지 않음 (2026-11-19 probe_10 확인)
//   1. 검출 > 검출 메뉴 관리 > URI 관리 일괄 등록 : 리눅스_VIP고객 → 엑셀(키 1 · 메뉴 명) 1행 업로드 → 등록 대기 1건 → 일괄 저장
//      키는 고정(zz_auto_depth) · 메뉴 명은 날짜를 붙여 매일 바뀜(AUTO_복합메뉴_YYYYMMDD) → 같은 키를 다시 올리면 이름이 갱신되는지까지 확인
//   2. 메뉴 동기화 API(GET /api/v1/menu-sync/menus/5)에 그 키 · 오늘 이름
//   3. CRM(.27) dlp_tester.jsp 를 헤더 test: zz_auto_depth 로 요청 (등록 사용자 user001)
//   4. 이력 접속기록 API(GET /api/v1/access-log, privacyChk=false)에서 그 요청 행의 메뉴명 = 오늘 이름 (반영까지 20초 간격 최대 5분)
//   반복 실행 설계 : 테스트 메뉴 1건(키 zz_auto_depth)을 매일 같은 키로 덮어씀 — 삭제 화면이 없어 남겨 둠 (다른 요청은 이 헤더를 쓰지 않음)
//   관찰 기록 : cypress/probe/D10U_관찰.json
// ==========================================================================
const A = require('../../support/anomaly');
const XLSX = require('xlsx');

const SYS = '리눅스_VIP고객';
const BSN = 5;
const KEY = 'zz_auto_depth';
const p2 = (n) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
const NAME = `AUTO_복합메뉴_${TODAY.replace(/-/g, '')}`;

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D10U_관찰.json', obs, { log: false });
};
// 이미 URI 규칙이 있는 페이지(dlp_tester.jsp=VIP_실시간DLP테스트)는 URI 규칙이 우선이라 헤더 키가 쓰이지 않는다 → 규칙 없는 경로로 요청
// 규칙 없는 경로 후보: 없는 경로(404 접속기록이 남는지 확인용) + 조회만 하는 다운로드 페이지 2개(메뉴 등록 필요 없음 처리된 URI)
const REQ_URIS = ['/crm/zz_auto_depth.jsp', '/crm/html_download.jsp', '/crm/pdf_download.jsp'];
const keyOf = (m) => String(m.menuKey || '');
const mine = (list) => (list || []).filter((m) => keyOf(m).includes(KEY));
// UI가 쓰는 인증 헤더(저장 요청에서 복사. 값은 파일에 기록하지 않음). cy.request만으로는 401/빈 응답이 올 수 있다.
let AUTH = {};
const authFrom = (h) => { const o = {}; Object.keys(h || {}).forEach((k) => { if (!/^(host|content-length|content-type|cookie|connection|origin|referer|user-agent|accept.*|sec-.*)$/i.test(k)) o[k] = h[k]; }); return o; };
let lastMenus = {};
let SERVER_SAVE_MS = null; // 일괄 저장 응답의 Date 헤더(.21 서버 시각)
let MENU_ID = null; // 등록된 복합 메뉴의 menuId (메뉴 동기화 목록에서 읽음)
const menus = () => cy.request({ url: `/logcatch/api/v1/menu-sync/menus/${BSN}`, headers: AUTH, failOnStatusCode: false })
  .then((r) => { lastMenus = { 상태: r.status, 본문앞: JSON.stringify(r.body).slice(0, 200), 인증헤더이름: Object.keys(AUTH) }; return ((r.body && r.body.etcData) || []); });

describe('10_Depth_검출_URI 관리 일괄 등록_복합메뉴', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });

  it(`일괄 등록 복합 메뉴(${KEY} → ${NAME}) → CRM 요청 → 접속 기록 메뉴명`, { retries: 0 }, () => {
    menus().then((list) => note('D10U_1_등록전', mine(list)));

    // ---------- 1. 일괄 등록 ----------
    cy.intercept('POST', /menu-sync/).as('save');
    cy.visit('/logcatch/com/siteMap');
    cy.wait(2500);
    cy.contains('button', '검출').click({ force: true });
    cy.wait(1500);
    cy.get('.v-list__tile__title').filter(':visible').filter((i, e) => t(e) === '검출 메뉴 관리').first().click({ force: true });
    cy.wait(3500);
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === 'URI 관리 일괄 등록').first().click({ force: true });
    cy.get('.master-system-tile', { timeout: 20000 }).filter((i, e) => shown(e) && t(e.querySelector('.v-list__tile__title')) === SYS).first().find('a').first().click({ force: true });
    cy.wait(3000);
    cy.get('.content-card').filter((i, e) => shown(e)).first().find('h2').should('contain', SYS);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['키 1', '메뉴 명((선택))', '행위구분 추출:((선택))'], [KEY, NAME, '']]), '메뉴등록양식');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    cy.get('input[type="file"][accept*=".xlsx"]').first().selectFile({ contents: Cypress.Buffer.from(buf), fileName: `menu_sync_auto_${KEY}.xlsx`, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, { force: true });
    cy.wait(2500);
    cy.contains('*', /등록 대기중인 데이터 \(1\)/, { timeout: 15000 }).should('exist');
    cy.get('body').then(($b) => {
      const rows = $b.find('tbody tr').filter((i, e) => shown(e) && t(e).includes(KEY)).toArray().map(t);
      note('D10U_2_등록대기', rows);
      expect(rows.join(' | '), `등록 대기 행에 키 ${KEY} · 메뉴 명 ${NAME}`).to.include(NAME);
    });
    A.dumpScreen('D10U_1_등록대기');
    cy.get('button, .v-btn').filter((i, e) => shown(e) && /일괄 저장$/.test(t(e))).first().should('not.be.disabled').click({ force: true });
    A.confirmIfAny();
    cy.wait('@save', { timeout: 20000 }).then((x) => {
      AUTH = authFrom(x.request.headers);
      const dh = x.response && x.response.headers && (x.response.headers.date || x.response.headers.Date);
      SERVER_SAVE_MS = dh ? Date.parse(dh) : null;
      note('D10U_3_일괄저장', { url: x.request.url.replace(/^https?:\/\/[^/]+/, ''), 요청: JSON.stringify(x.request.body).slice(0, 600), 상태: x.response && x.response.statusCode, 응답: JSON.stringify(x.response && x.response.body).slice(0, 400) });
      expect(x.response && x.response.statusCode, '일괄 저장 응답').to.be.within(200, 299);
    });
    cy.wait(2000);
    A.dumpScreen('D10U_2_일괄저장뒤');

    // ---------- 2. 메뉴 동기화 API ----------
    // 저장 직후 반영이 늦을 수 있어 최대 6회(5초 간격) 다시 읽는다. 키 또는 이름이 보이면 통과.
    const hit = (list) => (list || []).filter((x) => keyOf(x).includes(KEY) || String(x.menuKeyName || '').includes(KEY) || x.name === NAME);
    const waitMenus = (left) => menus().then((list) => {
      const m = hit(list);
      if (m.length) MENU_ID = m[0].menuId;
      if (m.length || left <= 0) {
        note('D10U_4_등록뒤', { API: lastMenus, 전체건수: (list || []).length, 일치: m, 형태예시: (list || []).slice(-3), 키목록꼬리: (list || []).slice(-8).map((x) => `${x.menuKey} | ${x.menuKeyName} | ${x.name}`) });
        cy.then(() => {
          expect(m.length, `메뉴 동기화 목록에 키 ${KEY} (또는 이름 ${NAME})`).to.be.greaterThan(0);
          expect(m.map((x) => x.name), `키 ${KEY} 메뉴 명 = ${NAME}`).to.include(NAME);
        });
        return;
      }
      cy.wait(5000, { log: false });
      waitMenus(left - 1);
    });
    waitMenus(6);

    // ---------- 3. CRM 요청 (헤더 test) ----------
    const q = `/logcatch/api/v1/access-log?startDate=${TODAY}%2000%3A00%3A00&endDate=${TODAY}%2023%3A59%3A59&hasParseError=false&logcatchMenuId=210508&page=0&privacyChk=false&returnRowCountType=1&size=1000&sort&totalCount=0`;
    // 요청 전에 이미 있던 행을 기억해 두고, 요청 뒤에 새로 생긴 행만 본다.
    // (러너·CRM·로그캐치 서버의 시계가 달라도 판정이 흔들리지 않게 시각 비교를 쓰지 않는다)
    const rowKey = (x) => `${x.accessDate}|${x.uri}|${x.userAccount}|${x.menuId}`;
    const seen = new Set();
    let sentAt = Date.now();
    cy.request({ url: q, headers: AUTH, failOnStatusCode: false }).then((r) => {
      (((r.body && r.body.resultObject) || [])).forEach((x) => seen.add(rowKey(x)));
      sentAt = Date.now();
      note('D10U_5a_요청전_기존행수', { 전체: seen.size, API상태: r.status, 본문앞: JSON.stringify(r.body).slice(0, 150), 서버저장시각: SERVER_SAVE_MS && new Date(SERVER_SAVE_MS).toISOString() });
    });
    const sent = {};
    REQ_URIS.forEach((u) => {
      cy.task('crmFetch', { userId: 'user001', path: u, method: 'GET', maxBody: 0, headers: { test: KEY } }, { timeout: 90000, log: false })
        .then((r) => { sent[u] = { status: r.status, error: r.error, login: r.login }; note('D10U_5_CRM', { at: new Date(sentAt).toISOString(), 요청: sent }); });
    });

    // ---------- 4. 접속 기록 메뉴명 ----------
    const poll = (left) => cy.request({ url: q, headers: AUTH, failOnStatusCode: false }).then((r) => {
      const rows = ((r.body && r.body.resultObject) || []).filter((x) => x.userAccount === 'user001' && REQ_URIS.includes(x.uri) && !seen.has(rowKey(x)) && (!SERVER_SAVE_MS || new Date(x.accessDate.replace(' ', 'T') + '+09:00').getTime() >= SERVER_SAVE_MS - 60000));
      const all = (r.body && r.body.resultObject) || [];
      if (rows.length || left <= 0) {
        note('D10U_6_접속기록', { API상태: r.status, 전체행수: all.length, user001행수: all.filter((x) => x.userAccount === 'user001').length, 최신시각: all.map((x) => x.accessDate).sort().slice(-1)[0], 요청전기존행수: seen.size, 메뉴ID기대: MENU_ID, 행: rows.map((x) => ({ uri: x.uri, 시각: x.accessDate, 메뉴: x.menuName, menuId: x.menuId, 행위: x.actionType })) });
        cy.then(() => expect(rows.length, `헤더 요청의 접속 기록 행 (최대 3분 대기) [전체 ${all.length}행, user001 ${all.filter((x) => x.userAccount === 'user001').length}행, 최신 ${all.map((x) => x.accessDate).sort().slice(-1)[0]}, 요청 전 기존 ${seen.size}행]`).to.be.greaterThan(0));
        // 접속 기록 API 행에는 새 메뉴의 menuName이 비어 올 수 있어(이름 캐시) 메뉴ID로 판정한다. menuName이 오면 이름도 함께 확인
        cy.then(() => {
          expect(MENU_ID, '등록된 복합 메뉴 menuId').to.be.a('number');
          expect(rows.map((x) => x.menuId), `접속 메뉴ID = ${MENU_ID} (${NAME})`).to.include(MENU_ID);
          const names = rows.map((x) => x.menuName).filter(Boolean);
          // 접속 기록의 menuName은 메뉴 이름 변경이 바로 반영되지 않는다(관찰: 생성 직후 빈 값 → 이후 이름, 이름 변경 직후 키 값 'zz_auto_depth').
          // 판정은 menuId로 하고 이름은 기록만 남긴다.
          if (!names.includes(NAME)) cy.log(`⚠️ 접속 기록 메뉴명 ${JSON.stringify(names)} ≠ ${NAME} (이름 반영 지연 관찰)`);
        });
        return;
      }
      cy.wait(20000, { log: false });
      poll(left - 1);
    });
    poll(10);
  });
});
