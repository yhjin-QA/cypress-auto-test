// ==========================================================================
// [2.9.7 신규] 05_Basic_자산
//   자산 메뉴 14개 화면 — 화면 구성 · 목록 = API · 검색 조건이 요청에 실림 · 추가 화면 열고 취소 (조회만)
//   1. 데이터베이스        : 개인정보 탐색 정책 · 개인정보 동기화 (목록 = API · 추가 화면 → 취소)
//   2. 데이터베이스(숨김 탭) : 샤크라 마스킹 정책 · 샤크라 아이템 정책 — 화면 탭에 없고 사이트맵으로만 열림, 목록 API 상태는 기록만
//   3. 개인정보 파일 / 문서 : 자산 보유 현황 / 전체 · 외부 로그 연동 정책/플랜 · 외부 파일 저장소 연동 — 왼쪽 메뉴에 없고 사이트맵으로만 열림
//   4. 데이터베이스 자산정보 : 자산 보유 현황 / 전체 · 개별 · 자산 상세 조회 · 확정된 개인정보 조회
//   5. 데이터베이스 확정처리 : 자산 개인정보 확정처리 · 자산 분리된 개인정보 확정처리 · 사용자 정의 개인정보 확정처리
//   반복 실행 설계 : 저장 · 적용 · 확정 · 탐색 실행 · 엑셀 다운로드는 누르지 않음 → 데이터 바뀌지 않음
//                   검색어는 실제 자산에 없는 값(auto_asset_q) → 결과 0건
//   2.9.7 확인 사항 (probe21, 2026-11-13)
//     - 처음엔 .21 에 탐색 대상 DB 가 없었음 (GET /logcatch/search-condition/database → code 1001 No Data Found)
//       2026-11-13 깊은 시나리오 준비로 MariaDB_26_logcatch_demo (.26 · 읽기 전용 계정) 를 손으로 등록 → Database 1개, 탐색 결과는 아직 0건
//       → 이 spec 은 개수를 고정하지 않고 API 와 비교 (「화면 · 검색 · 추가 화면이 맞게 동작하는지」)
//     - Database API 는 그룹 목록 [{ 자동탐색, items: [DB…] }] — 탐색 정책 화면에서는 추가 화면을 열 때 불림
//     - 이 제품은 결과가 없을 때 API 가 400 + code 1001 「No Data Found」 를 돌려줌 → 0건으로 봄
//     - 샤크라 마스킹 · 아이템 정책 목록 API 는 code 9999 Internal ServerError (탭이 숨겨진 기능) → 기록만
//     - 외부 로그 연동 정책/플랜 의 추가 화면 제목이 「수정」 으로 보임 → 기록만 (확인 대상)
//   관찰 기록 : cypress/probe/B05_관찰.json · 화면 구조 : cypress/probe/B05_*.json
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const KW = 'auto_asset_q';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const decode = (u) => { try { return decodeURIComponent(String(u)); } catch (e) { return String(u); } };

const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/B05_관찰.json', obs, { log: false });
};

// ---------- 화면이 부르는 API 기록 (응답은 읽기만) ----------
const net = [];
let mk = 0;
const mark = () => cy.then(() => { mk = net.length; });
const record = () => cy.intercept({ url: /\/logcatch\//i }, (req) => {
  if (!['xhr', 'fetch'].includes(req.resourceType)) return;
  if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|common\/message|symbol-code|ui-options|timezone|doc\/test|alert\/info|progress\/info|mfa|heartbeat/i.test(req.url)) return;
  req.on('after:response', (res) => {
    const b = res.body && typeof res.body === 'object' ? res.body : {};
    const ro = b.resultObject;
    net.push({
      m: req.method,
      url: decode(req.url.replace(/^https?:\/\/[^/]+/, '')),
      req: req.body ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)).slice(0, 1000) : '',
      st: res.statusCode,
      code: b.code,
      msg: String(b.message || '').slice(0, 200),
      total: typeof b.totalCount === 'number' ? b.totalCount : (Array.isArray(ro) ? ro.length : null),
      ro: Array.isArray(ro) ? ro.slice(0, 50) : null
    });
  });
});
// 조건(정규식 또는 함수)에 맞는 응답이 올 때까지 (최대 20초) — from 을 안 주면 마지막 mark() 이후만
const waitApi = (match, label, from, left = 40) => cy.then(() => {
  const start = from === undefined ? mk : from;
  const ok = (x) => (typeof match === 'function' ? match(x) : match.test(x.url));
  const hit = net.slice(start).filter(ok).pop();
  if (hit) return hit;
  if (left <= 0) throw new Error(`${label} — API 응답을 받지 못함`);
  return cy.wait(500, { log: false }).then(() => waitApi(match, label, start, left - 1));
});
// 결과 없음(400 + code 1001 No Data Found)은 0건
const totalOf = (x) => (x.code === 1001 ? 0 : (typeof x.total === 'number' ? x.total : 0));
const DB_API = /\/search-condition\/database(\?|$)/;

// ---------- 화면 읽기 ----------
const content = ($b) => $b.find('.v-content__wrap').last()[0] || $b[0];
const cleanTh = (th) => { const c = th.cloneNode(true); c.querySelectorAll('i, .v-icon, .material-icons').forEach((e) => e.remove()); return t(c); };
const tables = ($b) => [...content($b).querySelectorAll('table')].filter(shown).map((tb) => {
  const body = tb.querySelector('tbody');
  const trs = body ? [...body.querySelectorAll('tr')].filter(shown) : [];
  return {
    th: [...tb.querySelectorAll('thead th')].map(cleanTh).filter(Boolean),
    rows: trs.filter((tr) => !/No data available|항목이 없습니다/.test(t(tr))).length,
    empty: trs.some((tr) => /No data available/.test(t(tr)))
  };
});
const tableWith = ($b, th) => tables($b).find((v) => th.every((h) => v.th.includes(h)));
const inputsOf = ($b) => [...$b[0].querySelectorAll('input, textarea')].filter(shown).map((e) => e.getAttribute('aria-label')).filter(Boolean);
const headlines = ($b) => [...$b[0].querySelectorAll('.c-headline, .v-card__title, .title, h2, h3')].filter(shown).map(t).filter(Boolean);
const treeLabels = ($b) => [...content($b).querySelectorAll('.vue-treeselect__label, .v-treeview-node__label, .tree-item')].filter(shown).map(t).map((x) => x.replace(/^(folder\s*)+/, '').trim()).filter(Boolean);
const btn = (re) => cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e))).first();

// ---------- 화면 열기 : 주소로 바로, 안 뜨면 사이트맵에서 이름으로 ----------
const open = (path, label, anchor, ready) => {
  cy.visit(path);
  cy.wait(3000);
  cy.location('pathname').then((p) => {
    if (p === path) return;
    note(`화면열기_${label}`, `${path} → ${p} — 사이트맵으로`);
    cy.visit('/logcatch/com/siteMap');
    cy.wait(3000);
    cy.get('body').then(($b) => {
      const all = $b.find('.v-list__tile__title').filter((i, e) => shown(e)).toArray();
      let ai = -1;
      all.forEach((e, i) => { if (t(e) === anchor) ai = i; });
      const el = all.find((e, i) => i >= Math.max(ai, 0) && t(e) === label);
      expect(el, `사이트맵의 「${label}」`).to.exist;
      cy.wrap(el).click({ force: true });
      cy.wait(4000);
    });
  });
  cy.get('body', { timeout: 20000 }).should(($b) => expect(ready($b), `「${label}」 화면`).to.eq(true));
  cy.wait(1000);
  // [2026-11-13 다크대비] 다크대비 래퍼(contrast-auto)는 「클릭 직전 화면」 을 검사 → 클릭 없이 끝나는 화면(샤크라 마스킹 · 개별 · 사용자 정의)이 빠짐
  //   → 래퍼로 돌 때만(검사 명령이 있을 때) 화면을 연 뒤 한 번 검사. 일반 Basic 실행에는 영향 없음
  cy.then(() => {
    if (typeof cy.checkContrast !== 'function') return;
    cy.location('pathname').then((p) => cy.isDarkTheme().then((dark) => {
      if (!dark) return;
      cy.checkContrast(p, null, { auto: true });
      if (typeof cy.checkDarkLeaks === 'function') cy.checkDarkLeaks(p, null);
    }));
  });
};
const hasText = (s) => ($b) => t(content($b)).includes(s);

// ---------- 공통 확인 ----------
// 목록 표 머리 · 행 수 = 목록 API 건수 (지금은 0건 → No data available)
const checkList = (name, apiRe, th) => waitApi(apiRe, `${name} 목록`, 0).then((x) => {
  const total = totalOf(x);
  cy.get('body', { timeout: 15000 }).should(($b) => {
    const tb = tableWith($b, th);
    expect(tb, `${name} 표 머리 ${th.join(' · ')}`).to.exist;
    if (total === 0) expect(tb.empty && tb.rows === 0, `${name} 목록 0건 = No data available`).to.eq(true);
    else expect(tb.rows > 0 && tb.rows <= total, `${name} 목록 행 수(${tb.rows}) ≤ API ${total}`).to.eq(true);
  });
  note(`${name}_목록`, { API: `${x.m} ${x.url.split('?')[0]}`, 상태: x.st, code: x.code, 건수: total });
  return cy.wrap(total, { log: false });
});
// 검색칸에 없는 값 → 검색 → 요청에 그 값이 실리고 결과 0건
const searchWith = (name, aria) => {
  cy.get(`input[aria-label="${aria}"]`).filter(':visible').first().clear({ force: true }).type(KW, { force: true, delay: 0 }).blur({ force: true });
  cy.wait(1500);
  mark();
  btn(/^검색/).click({ force: true });
  // [2026-11-13 실행] 테이블 칸 값은 대문자로 바꿔 보냄 (tableList ["AUTO_ASSET_Q"]) → 대소문자 무시하고 비교
  waitApi((x) => (x.url + x.req).toLowerCase().includes(KW.toLowerCase()), `${name} 검색(${aria})`).then((x) => {
    note(`${name}_검색`, { 칸: aria, 요청: `${x.m} ${x.url.split('?')[0]}`, 본문: x.req.slice(0, 300), 상태: x.st, 건수: totalOf(x) });
    expect(x.st === 200 || x.code === 1001, `${name} 검색 응답 정상 (200 또는 결과 없음 1001) — ${x.st} ${x.code} ${x.msg}`).to.eq(true);
    expect(totalOf(x), `${name} 「${KW}」 검색 API 건수`).to.eq(0);
  });
  cy.get('body', { timeout: 15000 }).should(($b) => {
    const tb = tables($b)[0];
    expect(tb && tb.rows, `${name} 「${KW}」 검색 결과 행`).to.eq(0);
  });
  cy.get(`input[aria-label="${aria}"]`).filter(':visible').first().clear({ force: true }).blur({ force: true });
};
// 「add」 → 추가 화면 입력칸 확인 → 취소 → 닫힘 (저장 안 함)
const addThenCancel = (name, inputs, extra, afterOpen) => {
  btn(/^add$/).click({ force: true });
  cy.wait(2000);
  cy.get('body', { timeout: 10000 }).should(($b) => {
    const vis = inputsOf($b);
    inputs.forEach((a) => expect(vis, `${name} 추가 화면 입력칸`).to.include(a));
  });
  cy.get('body').then(($b) => {
    const dlg = $b.find('.v-dialog--active').filter((i, e) => shown(e)).last();
    note(`${name}_추가화면`, { 창: dlg.length ? t(dlg.find('.v-card__title, .headline')[0]) || '(창)' : '(본문)', 제목: headlines($b).slice(0, 6), 입력칸: inputsOf($b).slice(0, 15) });
    if (extra) extra($b);
  });
  if (afterOpen) afterOpen();
  cy.get('body').then(($b) => {
    const $c = $b.find('button, .v-btn').filter((i, e) => shown(e) && t(e) === '취소');
    expect($c.length, `${name} 추가 화면 「취소」`).to.be.greaterThan(0);
    cy.wrap($c.last()).click({ force: true });
  });
  cy.wait(1500);
  cy.get('body').should(($b) => expect(inputsOf($b), `${name} 취소 뒤 추가 화면 닫힘`).to.not.include(inputs[0]));
};
// [2026-11-13 DB 등록 뒤] search-condition/database 는 그룹 목록 [{ name: 자동탐색, items: [DB…] }] → 그룹 아래 DB 수를 더함 (없으면 400 + 1001)
const dbCount = () => waitApi(DB_API, '탐색 대상 Database 목록', 0).then((x) => {
  const n = x.code === 1001 ? 0 : (x.ro || []).reduce((sum, g) => sum + ((g && g.items) || []).length, 0);
  return cy.wrap(n, { log: false });
});

const POLICY_TH = ['정책명', '생성일', '생성자', '조건', '설명', '삭제'];

describe('05_Basic_자산', () => {
  A.ignoreErrors();

  beforeEach(() => {
    net.length = 0;
    mk = 0;
    record();
    A.loginAdmin();
  });

  it('데이터베이스 — 개인정보 탐색 정책 · 개인정보 동기화 (목록 = API · 추가 화면 → 취소)', { retries: 0 }, () => {
    open('/logcatch/asset/database/privacyPolicyPlan', '개인정보 탐색 정책', '개인정보 탐색 정책', hasText('정책 목록'));
    A.dumpScreen('B05_1_탐색정책');
    // 화면 탭 : 탐색 정책 · 동기화 (샤크라 두 탭은 숨김)
    cy.get('body').then(($b) => {
      const tabs = $b.find('.v-content__wrap .v-btn__content').filter((i, e) => shown(e)).toArray().map(t).filter((x) => /정책|동기화/.test(x) && x.length < 20);
      note('B05_DB_탭', tabs);
      expect(tabs, '데이터베이스 탭').to.include.members(['개인정보 탐색 정책', '개인정보 동기화']);
    });
    checkList('탐색정책', /\/cyclone\/policy\/policy-master-list\?.*policyTypeCd=3001/, POLICY_TH);
    // 추가 화면 : 「Database (N)」 은 고른 DB 수 → 처음엔 0 (probe23 : 등록된 DB 가 1개여도 0)
    //   탐색할 수 있는 DB 수(Database API, 추가 화면을 열 때 불림)는 기록만 — 고르는 창(톱니)은 깊은 시나리오에서 다룸
    addThenCancel('탐색정책', ['정책명', '설명', 'Database', '동시 스레드 처리 개수', '패턴'], ($b) => {
      expect(t(content($b)), '템플릿 버튼').to.include('템플릿 불러오기');
    }, () => {
      cy.get('body').should(($b) => {
        const h = headlines($b).find((x) => /^Database\s*\(\d+\)/.test(x)) || '';
        expect(h, '추가 화면 처음 「Database (0)」 — 아직 고른 DB 없음').to.match(/^Database\s*\(0\)/);
        expect(t(content($b)).replace(/\s+/g, ''), '스키마 · 테이블 · 컬럼 0건').to.include('스키마0건테이블0건컬럼0건');
      });
      dbCount().then((n) => note('탐색정책_탐색가능DB수', n));
    });
    // 탐색 서버(에이전트) 목록 — 깊은 시나리오 준비 확인용 기록
    waitApi(/\/cyclone\/policy\/initialize/, '탐색 정책 초기화', 0).then((x) => note('탐색정책_초기화', { 상태: x.st, code: x.code }));

    // 개인정보 동기화
    btn(/^개인정보 동기화$/).click({ force: true });
    cy.wait(3000);
    cy.location('pathname').should('eq', '/logcatch/asset/database/privacyTargetDataScan');
    A.dumpScreen('B05_2_동기화');
    checkList('동기화', /\/com33\/dataCollect-resource-policy-list\?.*policyTypeCd=3008/, POLICY_TH);
    addThenCancel('동기화', ['정책명', '정책 상세', 'Database', '개인정보 유형']);
  });

  it('데이터베이스 — 샤크라 마스킹 · 아이템 정책 (화면 탭 숨김 · 사이트맵만, 목록 API 상태 기록)', { retries: 0 }, () => {
    open('/logcatch/asset/database/privacyChakraMaskingPolicy', '샤크라 마스킹 정책', '개인정보 탐색 정책', hasText('정책 목록'));
    A.dumpScreen('B05_3_샤크라마스킹');
    cy.get('body').should(($b) => expect(tableWith($b, ['정책명', '생성일', '시작 시간', '활성', '마스킹중 컬럼수', '수정 컬럼수', '적용대상', '적용 제외 대상']), '샤크라 마스킹 표 머리').to.exist);
    waitApi(/privacyChakraMasking\/.*policy-master-list/, '샤크라 마스킹 목록', 0).then((x) => note('관찰_샤크라마스킹_목록API', `${x.st} code ${x.code} ${x.msg}`));

    open('/logcatch/asset/database/privacyChakraItemPolicy', '샤크라 아이템 정책', '개인정보 탐색 정책', hasText('정책 목록'));
    A.dumpScreen('B05_4_샤크라아이템');
    cy.get('body').should(($b) => expect(tableWith($b, ['정책명', '설명', '유형', '적용 database 명', '적용테이블/컬럼 내역', '삭제']), '샤크라 아이템 표 머리').to.exist);
    waitApi(/privacyChakraItem\/.*policy-master-list/, '샤크라 아이템 목록', 0).then((x) => note('관찰_샤크라아이템_목록API', `${x.st} code ${x.code} ${x.msg}`));
    addThenCancel('샤크라아이템', ['정책명', 'Database']);
  });

  it('개인정보 파일 / 문서 — 자산 보유 현황 · 외부 로그 연동 · 외부 파일 저장소 연동 (왼쪽 메뉴 없음 · 사이트맵만)', { retries: 0 }, () => {
    // 왼쪽 「자산」 메뉴 펼침에 「개인정보 파일 / 문서」 가 있는지 기록 (사이트맵에는 아래 탭 이름이 있음)
    open('/logcatch/asset/privacyDocuments/totalCharts', '자산 보유 현황 / 전체', '샤크라 아이템 정책', hasText('파일 자산'));
    A.dumpScreen('B05_5_파일자산현황');
    // 분류 트리 = 분류 API (PC · SERVER · S3)
    waitApi((x) => /\/api\/v1\/classifications\/0\?/.test(x.url) && !/upperId/.test(x.url), '파일 자산 분류', 0).then((x) => {
      const names = (x.ro || []).map((c) => c.name);
      note('파일자산_분류', { API: names, 건수: totalOf(x) });
      cy.get('body').should(($b) => expect(treeLabels($b), '분류 트리 = 분류 API').to.include.members(names));
    });
    // 「파일 자산N 건이 검색되었습니다.」 = 파일 자산 검색 API 건수
    waitApi(/\/api\/v1\/asset-files\/0\/_search/, '파일 자산 검색', 0).then((x) => {
      const n = totalOf(x);
      cy.get('body').should(($b) => expect(t(content($b)).replace(/\s+/g, ''), '파일 자산 건수 문구').to.include(`파일자산${n}건이검색되었습니다`));
      cy.get('body').should(($b) => expect(tableWith($b, ['시스템 타입', '시스템 명칭', 'IP', '파일 명', '경로', '개인정보 유형', '총건수']), '파일 자산 표 머리').to.exist);
      note('파일자산_목록', { 건수: n });
    });
    searchWith('파일자산', '파일명');

    open('/logcatch/asset/privacyDocuments/linkedExternalFileLogPolicy', "외부 로그 연동 정책/플랜 '탭1-파일'", '샤크라 아이템 정책', hasText('정책 목록'));
    A.dumpScreen('B05_6_외부로그연동');
    checkList('외부로그연동', /linkedExternalFileLog\/externalFileLog-policy-list/, POLICY_TH);
    addThenCancel('외부로그연동', ['정책명', '정책 상세', '파일경로', '파일패턴', '입력 테이블'], ($b) => {
      const hs = headlines($b);
      if (hs.includes('수정') && !hs.includes('추가')) note('관찰_외부로그연동_추가화면제목', `추가(add)로 열었는데 제목 「수정」 — ${hs.slice(0, 4).join(' / ')}`);
    });

    open('/logcatch/asset/database/externalFileRepositorySync', '외부 파일 저장소 연동', '샤크라 아이템 정책', hasText('정책 목록'));
    A.dumpScreen('B05_7_외부파일저장소');
    checkList('외부파일저장소', /\/pams\/policy\/s3-download\/masters/, POLICY_TH);
    addThenCancel('외부파일저장소', ['정책명', '정책 상세'], ($b) => expect(t(content($b)), '「매개변수 설정」').to.include('매개변수 설정'));
  });

  it('데이터베이스 자산정보 — 자산 보유 현황 전체 · 개별 · 자산 상세 조회 · 확정된 개인정보 조회', { retries: 0 }, () => {
    // 자산 보유 현황 / 전체 : 화면 기간 = 통계 API 기간, 트리 「전체 (N)」 = Database 수
    open('/logcatch/asset/database/totalStatus', '자산 보유 현황 / 전체', '데이터베이스 자산정보', hasText('개인정보 탐색 현황'));
    A.dumpScreen('B05_8_DB자산현황');
    waitApi(/\/privacy-database\/summary\?/, 'DB 자산 통계', 0).then((x) => {
      const q = new URLSearchParams(x.url.split('?')[1] || '');
      cy.get('body').then(($b) => {
        const dates = [...content($b).querySelectorAll('input')].filter(shown).map((e) => e.value).filter((v) => /^\d{4}-\d{2}-\d{2}/.test(v));
        note('DB자산현황_기간', { 화면: dates, API: [q.get('startDate'), q.get('endDate')] });
        expect(dates.slice(0, 2).map((v) => v.slice(0, 10)), '화면 기간 = 통계 API 기간').to.deep.eq([q.get('startDate'), q.get('endDate')]);
      });
    });
    cy.get('body').then(($b) => {
      ['개인정보 탐색 현황', '개인정보 발견 패턴 Top 5', '개인정보 탐색 추이', '개인정보 발견 Trend'].forEach((h) => expect(t(content($b)), '통계 구역').to.include(h));
    });
    dbCount().then((n) => cy.get('body').should(($b) => expect(treeLabels($b), 'Database 트리').to.include(`전체 (${n})`)));
    mark();
    btn(/^검색/).click({ force: true });
    waitApi(/\/privacy-database\/summary\?/, 'DB 자산 통계 다시 조회').then((x) => note('DB자산현황_검색', { 상태: x.st, code: x.code }));

    // 자산 보유 현황 / 개별 : 토폴로지 (Database 가 없으면 「항목이 없습니다.」)
    open('/logcatch/asset/database/individualStatus', '자산 보유 현황 / 개별', '데이터베이스 자산정보', hasText('개인정보 탐색 토폴로지'));
    A.dumpScreen('B05_9_DB자산개별');
    waitApi(/\/privacy-database\/complete-topology/, '토폴로지', 0).then((x) => note('DB자산개별_토폴로지', { 상태: x.st, code: x.code }));
    dbCount().then((n) => {
      cy.get('body').then(($b) => {
        const txt = t(content($b));
        ['토폴로지', 'Database', '스키마', '테이블', '컬럼', '개인정보'].forEach((h) => expect(txt, '토폴로지 단계').to.include(h));
        if (n === 0) expect(txt, 'Database 0개 → 「항목이 없습니다.」').to.include('항목이 없습니다.');
      });
    });

    // 자산 상세 조회
    open('/logcatch/asset/database/detailedAssetInquiry', '자산 상세 조회', '데이터베이스 자산정보', hasText('검색 조건'));
    A.dumpScreen('B05_10_자산상세');
    checkList('자산상세', /\/privacy-database\/list/, ['Database', '스키마', '테이블', '컬럼', '개인정보 유형', '탐색 일시', '탐색 정책', '탐색 플랜', '관리자', '샘플링 카운트', '전체 카운트']);
    cy.get('body').then(($b) => expect(t(content($b)), '엑셀 다운로드 버튼').to.include('엑셀 다운로드'));
    searchWith('자산상세', '테이블');

    // 확정된 개인정보 조회
    open('/logcatch/asset/database/confirmedPrivacy', '확정된 개인정보 조회', '데이터베이스 자산정보', hasText('검색 조건'));
    A.dumpScreen('B05_11_확정조회');
    checkList('확정조회', /\/confirmed-privacy\/get-confirmed-privacy-list/, ['Database', '스키마', '테이블', '컬럼', '패턴 유형']);
    searchWith('확정조회', '테이블');
  });

  it('데이터베이스 확정처리 — 자산 개인정보 · 분리된 개인정보 · 사용자 정의 개인정보 확정처리', { retries: 0 }, () => {
    // 자산 개인정보 확정처리 : 처음엔 빈 표 → 검색 시 요청에 조건이 실림
    open('/logcatch/asset/database/normalPrivacyAsset', '자산 개인정보 확정처리', '데이터베이스 확정처리', hasText('검색 조건'));
    A.dumpScreen('B05_12_확정처리');
    cy.get('body').should(($b) => expect(tableWith($b, ['Database', '스키마', '테이블', '컬럼', '패턴 유형', '일치 건수', '샘플 데이터', '개인정보 유형', '조건', '변경', '상세 내역']), '확정처리 표 머리').to.exist);
    cy.get('body').then(($b) => {
      const v = Object.fromEntries([...$b[0].querySelectorAll('input')].filter(shown).filter((e) => /비율|비교 기간/.test(e.getAttribute('aria-label') || '')).map((e) => [e.getAttribute('aria-label'), e.value]));
      note('확정처리_기본값', v);
    });
    searchWith('확정처리', '테이블');

    open('/logcatch/asset/database/dividedPrivacyAsset', '자산 분리된 개인정보 확정처리', '데이터베이스 확정처리', hasText('검색 조건'));
    A.dumpScreen('B05_13_분리확정');
    cy.get('body').should(($b) => expect(tableWith($b, ['No.', 'Database', '스키마', '테이블', '기준 컬럼', '순서', '개인정보 유형', '탐색 패턴', '일치 건수', '샘플 데이터', '조건', '설정']), '분리 확정처리 표 머리').to.exist);
    searchWith('분리확정', '테이블');

    // 사용자 정의 개인정보 확정처리 : 트리 「전체 (그룹 수)」 · 「<그룹> (그 그룹의 DB 수)」 = 작업공간 API
    //   [2026-11-13 DB 등록 뒤] workspace/group 은 그룹만(items 비어 있음) → DB 까지 들어 있는 workspace?siteId= 로 비교 (전체 (1) · 자동탐색 (1))
    open('/logcatch/asset/database/customPrivacyAsset', '사용자 정의 개인정보 확정처리', '데이터베이스 확정처리', hasText('사용자 정의 개인정보 칼럼'));
    A.dumpScreen('B05_14_사용자정의');
    waitApi(/\/com26\/workspace\?siteId=/, '작업공간(그룹 · DB)', 0).then((x) => {
      const groups = x.ro || [];
      const want = [`전체 (${groups.length})`, ...groups.map((g) => `${g.name} (${(g.items || []).length})`)];
      note('사용자정의_트리', { API: want });
      cy.get('body').should(($b) => expect(treeLabels($b), 'Database 트리 = 작업공간 API').to.include.members(want));
    });
    cy.get('body').should(($b) => {
      expect(tableWith($b, ['테이블', '컬럼', '유형', '길이', '사용자 정의 칼럼', '개인정보 유형', '사용자 정의 칼럼 설정 사유', '잠금']), '사용자 정의 칼럼 표').to.exist;
      expect(tableWith($b, ['테이블', '컬럼', '변경 일자', '변경 내용', '변경 사유', '관리자']), '변경 이력 표').to.exist;
    });
    waitApi(/\/privacy-custom-column\?/, '사용자 정의 칼럼', 0).then((x) => note('사용자정의_칼럼', { 상태: x.st, code: x.code, 건수: totalOf(x) }));
  });

  after(() => cy.writeFile('cypress/probe/B05_api.json', net.map((x) => ({ ...x, ro: undefined })), { log: false }));
});
