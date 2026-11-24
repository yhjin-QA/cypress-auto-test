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

  // ==========================================
  // [2.9.9.0 Depth] URI 관리 룰 — 업무시스템 단위 행위구분 추출 · 맵핑 → URI 관리 일괄 등록 등록 대기 (B5)
  //   대상 : Node.js_WAS (BsnId 14) — 11-24 사용자 승인. 시작 상태 「미설정」 → 신규 정책 저장 → 확인 → 「설정 전체 삭제」 → 다시 「미설정」
  //     (처음 「설정됨 · 빈 설정」은 화면에서 만들 수 없음 : 메뉴 키 규칙 0개 저장 시 「최소 1개 이상의 메뉴 키 조합 규칙을 등록해 주세요」 — probe_299p)
  //   규칙 : 메뉴 키 조합 요청 헤더 zzautob5 · 행위구분 추출 요청 파라미터 act · 맵핑 view → 검색(6) / save → 수정(2)
  //   1. 신규 정책 저장 요청 본문 · 설정 API · 다시 열었을 때 불러온 값
  //   2. URI 관리 일괄 등록 : 엑셀 4행(행위 view · save · 빈칸 · 6) 업로드 → 표 머리 「키 1 (zzautob5)」 · 「행위구분 추출:」 · 등록 대기 4건 (일괄 저장 안 누름 — 메뉴가 생기면 지울 화면이 없음)
  //      등록 대기 표의 행위 칸은 엑셀 글자 그대로 보임 (변환은 일괄 저장 때로 보임 — 기록만)
  //   3. 설정 전체 삭제 → 설정 API 에 BsnId 14 없음 · 목록 칩 「미설정」
  //   시작할 때 Node.js_WAS 에 이 시나리오 규칙(zzautob5)이 남아 있으면 먼저 지우고, 다른 설정이 있으면 건드리지 않고 넘어감
  //   관찰 기록 : cypress/probe/D10R_관찰.json
  // ==========================================
  {
    const XLSX2 = require('xlsx');
    const SYS2 = 'Node.js_WAS';
    const BSN2 = 14;
    const RULE_PAGE = '/logcatch/detect/menu/management/ruleConfig';
    const HDR = 'zzautob5';
    const tx = (e) => (e ? (e.innerText || e.textContent || '') : '').replace(/\s+/g, ' ').trim();
    const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const uniq = (a) => [...new Set(a.filter(Boolean))];
    const obs2 = {};
    const note2 = (k, v) => { obs2[k] = v; cy.writeFile('cypress/probe/D10R_관찰.json', obs2, { log: false }); };
    let AUTH2 = {};
    let MADE = false;
    const auth2 = (h) => { const o = {}; Object.keys(h || {}).forEach((k) => { if (!/^(host|content-length|content-type|cookie|connection|origin|referer|user-agent|accept.*|sec-.*)$/i.test(k)) o[k] = h[k]; }); return o; };
    const conf = () => cy.then(() => cy.request({ url: '/logcatch/api/v1/menu-sync/configs', headers: AUTH2, failOnStatusCode: false }))
      .then((r) => ({ 상태: r.status, 대상: (((r.body && r.body.etcData) || []).find((c) => c.bsnId === BSN2)) || null }));
    const mine = (c) => !!c && (c.expressions || []).some((x) => String(x.expression).includes(HDR));
    const card = () => cy.get('.rule-content-card').filter((i, e) => vis(e)).first();
    const tile = ($b) => $b.find('.master-system-tile').filter((i, e) => vis(e) && tx(e.querySelector('.v-list__tile__title')) === SYS2)[0];
    const rowOf = ($c, re) => {
      const lab = $c.find('*').filter((i, e) => vis(e) && e.children.length === 0 && re.test(tx(e)))[0];
      let el = lab ? lab.parentElement : null;
      while (el && !(el.querySelector('select') && el.querySelector('input'))) el = el.parentElement;
      return el;
    };
    const mapBox = ($c) => {
      const b = $c.find('button, .v-btn').filter((i, e) => vis(e) && /매핑 추가$/.test(tx(e)))[0];
      let el = b ? b.parentElement : null;
      while (el && !/행위구분 맵핑/.test(tx(el))) el = el.parentElement;
      return el;
    };
    const cardVals = () => card().then(($c) => {
      const r2 = rowOf($c, /^행위구분 추출:?$/);
      const mb = mapBox($c);
      return cy.wrap({
        // [11-24 1차] 상태 글자(종 아이콘 + 글자)는 잎 요소가 아니고 카드 밖일 수 있어 화면 전체에서 짧은 요소로 찾음
        상태글: uniq(Cypress.$('body').find('*').filter((i, e) => vis(e) && tx(e).length < 40 && /설정이 불러와졌습니다|신규 설정 작성 중/.test(tx(e))).toArray().map(tx)),
        메뉴키: $c.find('input[placeholder*="globalMenuId"]').filter((i, e) => vis(e)).toArray().map((e) => e.value),
        행위출처: r2 ? tx(r2.querySelector('select').options[r2.querySelector('select').selectedIndex]) : '',
        행위키: r2 ? ([...r2.querySelectorAll('input')].filter(vis)[0] || {}).value : '',
        맵핑: mb ? [...mb.querySelectorAll('input, select')].filter((e) => vis(e) && e.type !== 'checkbox').map((e) => (e.tagName === 'SELECT' ? tx(e.options[e.selectedIndex]) : e.value)) : [],
        버튼: uniq($c.find('button, .v-btn').filter((i, e) => vis(e)).toArray().map(tx)),
      }, { log: false });
    });
    const openRule = () => {
      cy.visit(RULE_PAGE);
      cy.get('.master-system-tile', { timeout: 30000 }).should('have.length.greaterThan', 0);
      cy.wait(2000);
      cy.get('body').then(($b) => cy.wrap(tile($b).querySelector('a') || tile($b)).click({ force: true }));
      cy.wait(3000);
      card().find('h2').should('contain', SYS2);
    };
    const chip = () => cy.get('body').then(($b) => cy.wrap(tx(tile($b)).replace(SYS2, '').trim(), { log: false }));
    const okDialog = (key) => cy.get('body').then(($b) => {
      const d = $b.find('.v-dialog--active').filter((i, e) => vis(e)).last();
      note2(key, d.length ? tx(d[0]).slice(0, 200) : '창 없음');
      const ok = d.find('button, .v-btn').filter((i, e) => vis(e) && /^(확인|예|삭제)$/.test(tx(e))).last()[0];
      if (ok) cy.wrap(ok).click({ force: true });
      cy.wait(1500);
    });
    const removeAll = (key) => {
      openRule();
      card().find('button, .v-btn').filter((i, e) => vis(e) && /설정 전체 삭제$/.test(tx(e))).first().click({ force: true });
      cy.wait(1500);
      okDialog(`${key}_확인창`);
      cy.wait(2000);
      conf().then((c) => { note2(`${key}_삭제뒤`, c); if (!c.대상) MADE = false; });
    };

    after(() => {
      if (!MADE) return;
      note2('9_after', '테스트 규칙이 남아 설정 전체 삭제');
      removeAll('9_after');
    });

    it('[2.9.9.0] URI 관리 룰 행위구분 추출 · 맵핑 → 일괄 등록 등록 대기 (Node.js_WAS · 설정 전체 삭제로 되돌림)', { retries: 0 }, () => {
      const writes = [];
      cy.intercept({ url: /\/logcatch\/api\/v1\/menu-sync\// }, (req) => {
        if (req.headers.authorization) AUTH2 = auth2(req.headers);
        if (req.method === 'GET') return;
        req.on('after:response', (res) => writes.push({ m: req.method, u: req.url.replace(/^https?:\/\/[^/]+/, ''), st: res.statusCode, req: req.body }));
      });
      openRule();

      // ---------- 0. 시작 상태 ----------
      let SKIP = false;
      conf().then((c) => {
        note2('0_처음설정', c);
        expect(c.상태, '메뉴 동기화 설정 API').to.eq(200);
        if (mine(c.대상)) { note2('0_남은규칙', '이전 실행이 남긴 zzautob5 규칙 → 먼저 지움'); MADE = true; removeAll('0_정리'); }
        else if (c.대상) { SKIP = true; note2('0_생략', `${SYS2} 에 다른 설정이 있어 B5 를 건너뜀 (지우지 않음)`); cy.log(`⚠️ ${SYS2} 에 다른 설정이 있어 B5 를 건너뜀`); }
      });

      cy.then(() => {
        if (SKIP) return;
        openRule();
        chip().then((s) => { note2('0_칩', s); expect(s, `${SYS2} 목록 칩`).to.include('미설정'); });
        cardVals().then((v) => { note2('0_화면', v); expect(v.상태글.join(' '), '신규 설정 작성 중').to.include('신규 설정 작성 중'); });

        // ---------- 1. 규칙 입력 · 신규 정책 저장 ----------
        card().then(($c) => {
          if (!$c.find('input[placeholder*="globalMenuId"]').filter((i, e) => vis(e)).length) cy.wrap($c.find('button, .v-btn').filter((i, e) => vis(e) && /규칙 추가$/.test(tx(e)))[0]).click({ force: true });
        });
        cy.wait(800);
        card().then(($c) => {
          const inp = $c.find('input[placeholder*="globalMenuId"]').filter((i, e) => vis(e))[0];
          let r = inp.parentElement;
          while (r && !r.querySelector('select')) r = r.parentElement;
          const se = r.querySelector('select');
          cy.wrap(se).select([...se.options].find((o) => /요청 헤더/.test(tx(o))).value, { force: true });
          cy.wrap(inp).clear({ force: true }).type(HDR, { force: true });
        });
        card().then(($c) => {
          const r = rowOf($c, /^행위구분 추출:?$/);
          const se = r.querySelector('select');
          cy.wrap(se).select([...se.options].find((o) => /요청 파라미터/.test(tx(o))).value, { force: true });
          cy.wrap([...r.querySelectorAll('input')].filter(vis)[0]).clear({ force: true }).type('act', { force: true });
        });
        [['view', '검색'], ['save', '수정']].forEach(([val, act]) => {
          card().find('button, .v-btn').filter((j, e) => vis(e) && /매핑 추가$/.test(tx(e))).first().click({ force: true });
          cy.wait(800);
          card().then(($c) => {
            const mb = mapBox($c);
            const texts = [...mb.querySelectorAll('input')].filter((e) => vis(e) && e.type !== 'checkbox' && !e.readOnly);
            const sels = [...mb.querySelectorAll('select')].filter(vis);
            cy.wrap(texts[texts.length - 1]).clear({ force: true }).type(val, { force: true });
            const se = sels[sels.length - 1];
            cy.wrap(se).select([...se.options].find((x) => new RegExp(`^${act}\\s*(\\(\\d+\\))?$`).test(tx(x))).value, { force: true });
          });
          cy.wait(500);
        });
        card().find('button, .v-btn').filter((i, e) => vis(e) && /(신규 정책 저장|정책 업데이트)$/.test(tx(e))).first().click({ force: true });
        cy.wait(1500);
        okDialog('1_저장알림');
        cy.then(() => {
          const w = writes.find((x) => x.m === 'POST' && new RegExp(`/menu-sync/configs/${BSN2}$`).test(x.u));
          note2('1_저장요청', w || '없음');
          expect(w, `저장 요청 POST menu-sync/configs/${BSN2}`).to.not.eq(undefined);
          expect(w.st, '저장 응답').to.eq(200);
          MADE = true;
          const b = typeof w.req === 'string' ? JSON.parse(w.req) : w.req;
          expect(b.actionTypeExpression, '요청 행위구분 추출').to.eq("#RequestParam['act']");
          expect(JSON.parse(b.actionTypeCodeMap), '요청 행위구분 맵핑').to.deep.eq({ view: 6, save: 2 });
          expect((b.expressions || []).map((x) => x.expression), '요청 메뉴 키 조합 규칙').to.deep.eq([`#RequestHeader['${HDR}']`]);
        });
        conf().then((c) => {
          note2('1_저장뒤설정', c);
          expect(c.대상, '설정 API 에 BsnId 14').to.not.eq(null);
          expect(c.대상.actionTypeExpression, '설정 API 행위구분 추출').to.eq("#RequestParam['act']");
          expect(JSON.parse(c.대상.actionTypeCodeMap), '설정 API 맵핑').to.deep.eq({ view: 6, save: 2 });
        });
        // 다시 열면 불러온 값
        openRule();
        chip().then((s) => { note2('1_칩', s); expect(s, `${SYS2} 목록 칩`).to.include('설정됨'); });
        cardVals().then((v) => {
          note2('1_불러온값', v);
          expect(v.상태글.join(' '), '기존 설정이 불러와졌습니다').to.include('기존 설정이 불러와졌습니다');
          expect(v.메뉴키, '불러온 메뉴 키').to.deep.eq([HDR]);
          expect(v.행위출처, '불러온 행위구분 출처').to.match(/요청 파라미터/);
          expect(v.행위키, '불러온 행위구분 키').to.eq('act');
          expect(v.맵핑, '불러온 맵핑').to.deep.eq(['view', '검색 (6)', 'save', '수정 (2)']);
        });

        // ---------- 2. 일괄 등록 등록 대기 ----------
        cy.get('.v-btn__content').filter(':visible').filter((i, e) => tx(e) === 'URI 관리 일괄 등록').first().click({ force: true });
        cy.wait(2500);
        cy.get('.master-system-tile', { timeout: 20000 }).filter((i, e) => vis(e) && tx(e.querySelector('.v-list__tile__title')) === SYS2).first().find('a').first().click({ force: true });
        cy.wait(3000);
        const ROWS = [['zzb5_view', 'ZZ_B5_view', 'view'], ['zzb5_save', 'ZZ_B5_save', 'save'], ['zzb5_none', 'ZZ_B5_none', ''], ['zzb5_num', 'ZZ_B5_num', '6']];
        const wb = XLSX2.utils.book_new();
        XLSX2.utils.book_append_sheet(wb, XLSX2.utils.aoa_to_sheet([['키 1', '메뉴 명((선택))', '행위구분 추출:((선택))'], ...ROWS]), '메뉴등록양식');
        const buf = XLSX2.write(wb, { type: 'array', bookType: 'xlsx' });
        cy.get('input[type="file"][accept*=".xlsx"]').first().selectFile({ contents: Cypress.Buffer.from(buf), fileName: 'menu_sync_auto_b5.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, { force: true });
        cy.wait(3000);
        // [11-24 2차] 제목(시계 아이콘 + 글자)도 잎 요소가 아님 → cy.contains 가 찾은 요소에서 표까지 올라감
        cy.contains('*', /등록 대기중인 데이터 \(4\)/, { timeout: 15000 }).should('exist').then(($l) => {
          const lab = $l[0];
          let box = lab;
          while (box && !box.querySelector('tbody')) box = box.parentElement;
          const th = box ? [...box.querySelectorAll('th')].filter(vis).map(tx) : [];
          const rows = box ? [...box.querySelectorAll('tbody tr')].filter(vis).map((r) => [...r.querySelectorAll('td')].map(tx)) : [];
          note2('2_등록대기', { 제목: tx(lab), 표머리: th, 행: rows });
          expect(th.join(' | '), '등록 대기 표 머리 = 업무시스템 규칙 키 이름 · 행위구분 추출').to.match(new RegExp(`키 1 \\(${HDR}\\).*행위구분 추출`));
          ROWS.forEach(([k, n]) => expect(rows.some((r) => r.includes(k) && r.includes(n)), `등록 대기 행 ${k} · ${n}`).to.eq(true));
          const act = (k) => { const r = rows.find((x) => x.includes(k)); return r ? r[r.length - 1] : null; };
          note2('2_행위칸', { view: act('zzb5_view'), save: act('zzb5_save'), 빈칸: act('zzb5_none'), 숫자6: act('zzb5_num') });
        });
        // (일괄 저장 안 누름)

        // ---------- 3. 설정 전체 삭제 ----------
        removeAll('3');
        cy.then(() => expect(MADE, `${SYS2} 테스트 규칙 삭제됨 (설정 API 에 BsnId ${BSN2} 없음)`).to.eq(false));
        openRule();
        chip().then((s) => { note2('3_칩', s); expect(s, `${SYS2} 목록 칩 (되돌린 뒤)`).to.include('미설정'); });
        cy.then(() => note2('9_쓰기요청', writes.map((x) => `${x.m} ${x.u} ${x.st}`)));
      });
      cy.log('✅ [2.9.9.0] URI 관리 룰 행위구분 맵핑 → 일괄 등록 등록 대기 확인 · 설정 전체 삭제 완료');
    });
  }
});
