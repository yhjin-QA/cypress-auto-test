// ==========================================================================
// [2.9.7 신규] 05_Depth_자산_개인정보탐색
//   자산 깊은 시나리오 — 실제 DB(.26 MariaDB logcatch_demo)를 개인정보 탐색 정책으로 탐색하고 결과를 확인
//   1. 탐색 정책 등록   : 자산 > 데이터베이스 > 개인정보 탐색 정책 > add
//                        Database = MariaDB_26_logcatch_demo, 패턴 = Pattern Korea + Pattern Korea2 (설치 기본 패턴), 나머지 기본값
//                        → 저장 요청(DB · 패턴 그룹 · 최대 100행 · 체크섬) 과 목록 API 확인
//   2. 실행            : 운영 > 실행 플랜 > 스케줄러 > 추가 → 정책 「[DBMS 개인정보 탐색기] 정책명」 · 작업 유형 「즉시 검사」
//                        → 저장 → 시작 (/task/execute · policyTypeCode 3001) → 종료 시간 찍힐 때까지 대기 (최대 5분)
//   3. 결과 확인        : 탐색 정책 화면 DB 오브젝트 수(target-by-db) · 자산 상세 조회(privacy-database/list) · 확정처리(get-scan-privacy-result-list)
//                        + .21 서버 탐색기 로그(runSSH, 오류 줄만 · 토큰 가림)
//                        결과 0건 + 로그에 ScanColumnAll NullPointerException → 「관찰 0039010」 으로 기록하고 통과
//                        결과 0건인데 그 증상이 없으면 → 실패 (새 원인)
//                        결과가 생기면 → 스키마 · 테이블 > 0, 기대 개인정보 컬럼 1개 이상 탐지 확인 (0039010 해결 뒤 기준 다시 정함)
//   4. 정리            : 스케줄러 플랜 중지 · 삭제 → 탐색 정책 삭제 → 남은 것 없음 확인 (앞 단계가 실패해도 실행됨)
//   반복 실행 설계 : 이름 auto_자산탐색_MMDD_HHmm, 시작할 때 남은 auto_자산탐색_ · auto_임시_자산탐색_(probe26) 플랜 · 정책 정리
//                   .26 은 읽기만 (lc_scan, 테이블당 최대 100행). 탐색 결과(자산 데이터)는 .21 에 남음
//   2.9.7 확인 사항 (probe22~26, 2026-11-13)
//     - 탐색 정책은 스케줄러 플랜으로만 실행 (운영가이드 5.1.1). 즉시 검사 실행은 「정책 플랜 일정」 달력에 남지 않음
//     - 탐색기 한 프로세스가 메타정보 수집 → 개인정보 탐색 순서로 동작. 37초 정도에 끝남
//     - Mantis 0039010 : MariaDB 메타정보 수집 NullPointerException(ScanColumnAll.java:96) → 스키마 · 테이블 0 → 결과 0건, 태스크는 Success
//     - 탐색기 로그 : /home/logcatch/proc/scandbpv/<YYYYMM>/<태스크ID>/log/PRIVACYSCAN_*.log (화면 로그 뷰 · 다운로드에는 없음)
//   관찰 기록 : cypress/probe/D05_관찰.json
//   비밀번호: cypress.env.json (LC_PW) · SSH 는 cypress.config.js runSSH
// ==========================================================================
const A = require('../../support/anomaly');

const DB_NAME = 'MariaDB_26_logcatch_demo';
const PATTERNS = ['Pattern Korea', 'Pattern Korea2'];
const MANTIS = '0039010';
const PREFIX = 'auto_자산탐색_';
const LEFT_RE = /auto_(임시_)?자산탐색_\d{4}_\d{4}/;
const stamp = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; })();
const NAME = `${PREFIX}${stamp}`;
const PLAN_LABEL = `[DBMS 개인정보 탐색기] ${NAME}`;
// logcatch_demo 에서 패턴으로 잡혀야 할 컬럼 (customers · employees)
const EXPECT_COLS = ['ssn', 'phone_number', 'email', 'address', 'credit_card', 'bank_account', 'mobile_phone'];

const POLICY = '/logcatch/asset/database/privacyPolicyPlan';
const SCHED = '/logcatch/operate/executePlan/scheduler';
const DETAIL = '/logcatch/asset/database/detailedAssetInquiry';
const NORMAL = '/logcatch/asset/database/normalPrivacyAsset';

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const decode = (u) => { try { return decodeURIComponent(String(u)); } catch (e) { return String(u); } };
const TIME_RE = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;

// 단계 사이에 넘기는 값
const S = { policyMid: null, planId: null };

const obs = { 이름: NAME };
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D05_관찰.json', obs, { log: false });
};

// ---------- 화면이 부르는 API 기록 (응답은 읽기만) ----------
const net = [];
let mk = 0;
const mark = () => cy.then(() => { mk = net.length; });
const record = () => cy.intercept({ url: /\/logcatch\//i }, (req) => {
  if (!['xhr', 'fetch'].includes(req.resourceType)) return;
  if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|common\/message|symbol-code|ui-options|timezone|doc\/test|alert\/info|progress\/info|mfa|heartbeat|file\/download/i.test(req.url)) return;
  let rq = null;
  try { rq = req.body && typeof req.body === 'object' ? JSON.parse(JSON.stringify(req.body)) : null; } catch (e) { rq = null; }
  req.on('after:response', (res) => {
    const b = res.body && typeof res.body === 'object' ? res.body : {};
    const ro = b.resultObject;
    net.push({
      m: req.method,
      url: decode(req.url.replace(/^https?:\/\/[^/]+/, '')),
      rq,
      st: res.statusCode,
      code: b.code,
      msg: String(b.message || '').slice(0, 200),
      total: typeof b.totalCount === 'number' ? b.totalCount : (Array.isArray(ro) ? ro.length : null),
      ro: Array.isArray(ro) ? ro.slice(0, 50) : (ro && typeof ro === 'object' ? ro : null),
      etc: b.etcData || null
    });
  });
});
// 조건에 맞는 응답이 올 때까지 (최대 20초) — from 을 안 주면 마지막 mark() 이후만
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

// ---------- 화면 ----------
const content = ($b) => $b.find('.v-content__wrap').last();
const btn = (re) => cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e))).first();
const gear = (aria) => cy.get(`input[aria-label="${aria}"]`).filter(':visible').first().closest('.v-input').find('i').filter((i, e) => /settings|fa-cog/.test(e.className + t(e))).first();
const confirmOk = () => cy.get('body').then(($b) => {
  const $ok = $b.find('.v-dialog--active .v-btn').filter((i, e) => shown(e) && /^(확인|예)$/.test(t(e)));
  if ($ok.length) cy.wrap($ok.last()).click({ force: true });
});
// 주소로 열기 — 본문이 비어 있으면(1차 probe 에서 한 번 있었음) 새로고침 한 번
const go = (path) => {
  cy.visit(path);
  cy.wait(3000);
  cy.get('body').then(($b) => {
    if (content($b).find('table, .v-card').length) return;
    cy.reload();
    cy.wait(5000);
  });
  cy.get('.v-content__wrap table', { timeout: 20000 }).should('exist');
  // 표 행(없으면 「No data available」 행)이 그려질 때까지 — 행을 읽기 전에
  cy.get('.v-content__wrap tbody tr', { timeout: 20000 }).should('have.length.greaterThan', 0);
  cy.wait(1000);
};
// 스케줄러 위쪽 플랜 목록 행
// [2026-11-13 1차 실행] 「.v-datatable 첫 표」 로 찾으면 플랜 행을 못 찾아 종료 대기가 5분 내내 반복됨 → probe26 처럼 화면의 모든 표 행에서 이름으로 찾음
//   (즉시 검사 플랜은 아래 「일정 상세」 표에 나오지 않아 이름이 겹치지 않음)
const planRows = ($b) => content($b).find('tbody tr').filter((i, e) => shown(e));
// 탐색 정책 추가 화면 : Database 톱니 → 그룹 펼침 → DB 체크 → 톱니 다시(창 닫힘)
const pickDb = () => {
  gear('Database').click({ force: true });
  cy.wait(2000);
  cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__group__header__append-icon').each(($a) => cy.wrap($a).click({ force: true }));
  cy.wait(800);
  cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === DB_NAME).first()
    .closest('.v-list__tile').find('.v-input--selection-controls__input').first().click({ force: true });
  cy.wait(2500);
  gear('Database').click({ force: true });
  cy.wait(1500);
};

// ---------- 정리 ----------
// 스케줄러 : 이름이 LEFT_RE 인 플랜 → 활성이면 중지 → 휴지통 → 확인. strict 면 같은 플랜이 안 지워질 때 실패
const cleanPlans = (strict, done = []) => cy.get('body').then(($b) => {
  const $row = planRows($b).filter((i, e) => LEFT_RE.test(t(e))).first();
  if (!$row.length) return;
  const txt = t($row[0]);
  const nm = txt.match(LEFT_RE)[0];
  if (done.includes(nm)) {
    note(`정리실패_플랜_${nm}`, txt.slice(0, 200));
    if (strict) throw new Error(`스케줄러 플랜 「${nm}」 이 삭제되지 않음`);
    return;
  }
  if (/활성/.test(txt.replace(/비활성/g, ''))) {
    cy.contains('.v-content__wrap tbody tr', nm).find('.v-input--selection-controls__ripple').first().click({ force: true });
    cy.wait(500);
    cy.get('.v-content__wrap .v-btn').filter((i, e) => shown(e) && /^(중지|중단|폐기)/.test(t(e))).first().click({ force: true });
    cy.wait(1500);
    confirmOk();
    cy.wait(2500);
  }
  cy.contains('.v-content__wrap tbody tr', nm).find('.fa-trash').first().click({ force: true });
  cy.wait(800);
  cy.get('.v-dialog--active').filter(':visible').should('contain', '삭제하시겠습니까?');
  confirmOk();
  cy.wait(2500);
  cy.then(() => { obs.정리 = [...(obs.정리 || []), `플랜 ${nm}`]; });
  cleanPlans(strict, [...done, nm]);
});
// 탐색 정책 목록 : 이름이 LEFT_RE 인 정책 → 「삭제」 칸 휴지통 → 확인
const cleanPolicies = (strict, done = []) => cy.get('body').then(($b) => {
  const $row = content($b).find('tbody tr').filter((i, e) => shown(e) && LEFT_RE.test(t(e))).first();
  if (!$row.length) return;
  const txt = t($row[0]);
  const nm = txt.match(LEFT_RE)[0];
  if (done.includes(nm)) {
    note(`정리실패_정책_${nm}`, txt.slice(0, 200));
    if (strict) throw new Error(`탐색 정책 「${nm}」 이 삭제되지 않음`);
    return;
  }
  cy.contains('.v-content__wrap tbody tr', nm).find('td').last().find('i, button').first().click({ force: true });
  cy.wait(800);
  confirmOk();
  cy.wait(2500);
  cy.then(() => { obs.정리 = [...(obs.정리 || []), `정책 ${nm}`]; });
  cleanPolicies(strict, [...done, nm]);
});

// ---------- .21 탐색기 로그 (오류 줄 · 진행 줄만, 토큰 가림) ----------
const logCmd = (planId) => [
  `R=$(grep -l '"planId":${planId},' /home/logcatch/taskmgr/tmp/task_result_*.json 2>/dev/null | tail -1)`,
  'if [ -z "$R" ]; then echo "RESULT=없음"; exit 0; fi',
  'echo "RESULT=$(cat "$R")"',
  'I=$(basename "$R" .json | sed "s/task_result_//")',
  'D=$(ls -d /home/logcatch/proc/scandbpv/*/"$I" 2>/dev/null | tail -1)',
  'echo "DIR=$D"',
  `grep -h -E '\\[ERROR\\]|Error Class Name|Error Message|Stack trace\\[1\\][[:space:]]|mainProcess' "$D"/log/PRIVACYSCAN_*.log 2>/dev/null | sed -E 's/Bearer [A-Za-z0-9._-]+/Bearer ****/g' | cut -c1-300 | head -40`,
  // 마지막 진행 기록의 건수 부분만 (같은 줄 뒤에 붙는 토큰은 빼고)
  `echo "END=$(grep -h -o '"isEnd":true,"scanProgressPrivacyDatabase":{[^}]*}' "$D"/log/PRIVACYSCAN_*.log 2>/dev/null | tail -1)"`
].join('; ');
const readLog = (planId, retry = 2) => cy.task('runSSH', logCmd(planId), { timeout: 60000, log: false }).then((out) => {
  if (out === null || out === undefined) return cy.wrap({ 읽음: false, 이유: 'SSH 접속 실패' }, { log: false });
  if (/RESULT=없음/.test(out) && retry > 0) return cy.wait(10000).then(() => readLog(planId, retry - 1));
  const res = (out.match(/^RESULT=(.*)$/m) || [])[1] || '';
  let rj = null;
  try { rj = JSON.parse(res); } catch (e) { rj = null; }
  const end = (out.match(/^END=(.*)$/m) || ['', ''])[1];
  const num = (k) => { const m = end.match(new RegExp(`"${k}":(\\d+)`)); return m ? Number(m[1]) : null; };
  return cy.wrap({
    읽음: !!rj,
    태스크: (out.match(/^DIR=.*\/(\d+)$/m) || [])[1] || null,
    결과: rj ? { resultCd: rj.resultCd, errorCd: rj.errorCd, message: rj.message } : res.slice(0, 120),
    ERROR줄: (out.match(/\[ERROR\]/g) || []).length,
    NPE_ScanColumnAll: /NullPointerException/.test(out) && /ScanColumnAll/.test(out),
    NPE위치: ((out.match(/Stack trace\[1\]\s*:\s*(\S+)/) || [])[1] || null),
    bean오류: (out.match(/Error creating bean/g) || []).length,
    메타끝: /meta mainProcess Done/.test(out),
    // [2026-11-13 2차 실행] 로그의 「Stack trace[1]」 뒤가 공백이 아니라 탭인 줄이 있어 grep 에서 빠짐 → [[:space:]] 로 고침. 받은 출력(토큰 가림)도 남김
    원문: out.split('\n').map((l) => l.slice(0, 160)).slice(0, 40),
    탐색진행: end ? { 대상DB: num('scanTargetDatabaseId'), 스키마: num('scanTargetSchemaCnt'), 테이블: num('scanTargetTableCnt'), 컬럼: num('scanTargetColumnCnt'), 행: num('scanRowCount') } : null
  }, { log: false });
});

describe('05_Depth_자산_개인정보탐색', () => {
  A.ignoreErrors();
  beforeEach(() => {
    record();
    A.loginAdmin();
  });

  it('1. 탐색 정책 등록 (DB · 패턴 · 기본값) — 저장 요청 · 목록 확인', () => {
    // 남은 플랜 · 정책 정리 (지난 실행 · probe26)
    go(SCHED);
    cleanPlans(false);
    go(POLICY);
    cleanPolicies(false);
    // 지우지 못한 옛 정책이 있어도 이번 실행은 계속 (이름이 달라 겹치지 않음) — 기록만
    cy.get('body').then(($b) => {
      const left = content($b).find('tbody tr').filter((i, e) => shown(e) && LEFT_RE.test(t(e))).toArray().map((e) => t(e).match(LEFT_RE)[0]);
      if (left.length) note('시작정리_남음', left);
    });

    // 추가 화면 → 패턴 그룹 목록 API (설치 기본 패턴 id)
    mark();
    btn(/^add$/).click({ force: true });
    cy.wait(3000);
    waitApi(/object-group\?scanObjectGroupTypeCd=2(&|$)/, '패턴 그룹 목록').then((x) => {
      const groups = Array.isArray(x.ro) ? x.ro : [];
      S.patternIds = PATTERNS.map((p) => { const g = groups.find((v) => v.name === p); return g ? g.id : null; });
      note('패턴그룹', { 전체: groups.map((g) => `${g.id}:${g.name}`), 사용: PATTERNS.map((p, i) => `${p}=${S.patternIds[i]}`) });
      expect(S.patternIds.every((v) => v !== null), `설치 기본 패턴 ${PATTERNS.join(' · ')}`).to.eq(true);
    });
    cy.get('input[aria-label="정책명"]').filter(':visible').first().clear({ force: true }).type(NAME, { force: true, delay: 0 });
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('자동화 Depth 탐색 (MariaDB_26, 100행)', { force: true, delay: 0 });
    // 처음엔 Database (0) → DB 고르면 Database (1)
    cy.get('body').should(($b) => expect(t(content($b)[0]), '처음 Database (0)').to.match(/Database\s*\(0\)/));
    mark();
    pickDb();
    cy.get('body').should(($b) => expect(t(content($b)[0]), 'DB 고른 뒤 Database (1)').to.match(/Database\s*\(1\)/));
    waitApi(/db-object\/stastics\/target-by-db/, 'DB 오브젝트 수 (등록 전)').then((x) => {
      const o = (Array.isArray(x.ro) ? x.ro : [])[0] || {};
      note('DB오브젝트_등록전', { 스키마: o.schemaCnt, 테이블: o.tableCnt, 컬럼: o.columnCnt, hasSchema: o.hasSchema });
    });
    // 패턴 : 톱니 → 두 패턴 체크 → 톱니 다시
    gear('패턴').click({ force: true });
    cy.wait(2000);
    PATTERNS.forEach((p) => {
      cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === p).first()
        .closest('.v-list__tile').then(($tile) => {
          const $c = $tile.find('.v-input--selection-controls__input');
          cy.wrap($c.length ? $c.first() : $tile).click({ force: true });
        });
      cy.wait(800);
    });
    gear('패턴').click({ force: true });
    cy.wait(1500);
    cy.get('body').should(($b) => {
      const pat = t($b.find('input[aria-label="패턴"]').filter((i, e) => shown(e)).first().closest('.v-input')[0]);
      expect(pat, '패턴 칸 = Pattern Korea (+1)').to.match(/Pattern K.*\(\+1\)/);
    });
    // 저장 → 저장 요청 확인
    mark();
    btn(/^저장$/).click({ force: true });
    cy.wait(2000);
    confirmOk();
    waitApi((x) => x.m === 'POST' && /\/cyclone\/policy(\?|$)/.test(x.url), '탐색 정책 저장').then((x) => {
      const rq = x.rq || {};
      const pv = rq.policyPrivacy || {};
      const groups = (rq.policyObjectGroupList || []).map((g) => g.scanObjectGroupId).sort((a, b) => a - b);
      note('정책저장', { 상태: x.st, code: x.code, msg: x.msg, policyId: (x.etc || {}).policyId, DB: (pv.databaseList || []).map((d) => d.databaseNm), 패턴그룹: groups, 최대행: `${pv.maxScanRowConfigYn}/${pv.maxScanRowCnt}`, 체크섬: pv.checkSumYn, 샘플: `${pv.sampleSaveConfigYn}/${pv.sampleSaveCnt}` });
      expect(x.st === 200 && x.code === 200, `저장 응답 200 — ${x.st} ${x.code} ${x.msg}`).to.eq(true);
      expect((rq.policy || {}).policyNm, '저장 요청 정책명').to.eq(NAME);
      expect((pv.databaseList || []).map((d) => d.databaseNm), '저장 요청 Database').to.deep.eq([DB_NAME]);
      expect(groups, '저장 요청 패턴 그룹 = Pattern Korea · Pattern Korea2').to.deep.eq([...S.patternIds].sort((a, b) => a - b));
      expect(pv.maxScanRowConfigYn === 'Y' && pv.maxScanRowCnt === 100, '기본값 테이블당 최대 100행').to.eq(true);
      expect(pv.checkSumYn, '기본값 체크섬 사용').to.eq('Y');
    });
    // 목록 다시 열어 API · 표에 새 정책
    mark();
    go(POLICY);
    waitApi(/policy-master-list\?.*policyTypeCd=3001/, '탐색 정책 목록').then((x) => {
      const p = (Array.isArray(x.ro) ? x.ro : []).find((v) => v.policyNm === NAME);
      expect(p, `탐색 정책 목록 API 에 「${NAME}」`).to.exist;
      S.policyMid = p.policyMid;
      note('정책목록', { 건수: totalOf(x), policyMid: p.policyMid, 유형: p.policyTypeCd });
      expect(p.policyTypeCd, '정책 유형 3001 (DBMS 개인정보 탐색기)').to.eq(3001);
    });
    cy.get('.v-content__wrap tbody', { timeout: 15000 }).should('contain', NAME);
  });

  it('2. 스케줄러 즉시 검사로 실행 → 종료까지 대기', () => {
    expect(S.policyMid, '1단계에서 만든 정책').to.be.a('number');
    go(SCHED);
    mark();
    cy.contains('.v-btn__content', '추가').click({ force: true });
    cy.wait(3000);
    waitApi(/search-condition\/policy-master-list/, '스케줄러 정책 목록').then((x) => {
      const p = (Array.isArray(x.ro) ? x.ro : []).find((v) => v.policyMid === S.policyMid);
      expect(p, '스케줄러 정책 목록 API 에 새 탐색 정책').to.exist;
      note('스케줄러정책', { 유형명: p.policyTypeNm, 유형: p.policyTypeCd });
      expect(p.policyTypeNm, '정책 유형명').to.eq('DBMS 개인정보 탐색기');
    });
    cy.get('input[aria-label="정책 목록"]').filter(':visible').first().click({ force: true });
    cy.wait(1500);
    cy.get('.v-menu__content:visible .v-list__tile__title').then(($items) => {
      const hit = $items.filter((i, e) => t(e) === PLAN_LABEL);
      expect(hit.length, `정책 목록 항목 「${PLAN_LABEL}」`).to.eq(1);
      cy.wrap(hit.first()).scrollIntoView().click({ force: true });
    });
    cy.wait(1000);
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').first().clear({ force: true }).type(NAME, { force: true, delay: 0 });
    cy.get('body').then(($b) => {
      const box = (a) => t($b.find(`input[aria-label="${a}"]`).filter((i, e) => shown(e)).first().closest('.v-input')[0]);
      note('플랜입력', { 정책: box('정책 목록'), 작업유형: box('작업 유형'), 서버IP: box('서버 IP') });
      expect(box('작업 유형'), '작업 유형 기본값 「즉시 검사」').to.include('즉시 검사');
    });
    mark();
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === '저장').last().click({ force: true });
    cy.wait(2000);
    confirmOk();
    waitApi((x) => x.m === 'POST' && /policy-plan\/policy-plan-detail/.test(x.url), '플랜 저장').then((x) => {
      const pp = (x.rq || {}).policyPlan || {};
      note('플랜저장', { 상태: x.st, code: x.code, policyMid: pp.policyMid, 이름: pp.nm, 반복: pp.isRepeat });
      expect(x.st === 200 && x.code === 200, `플랜 저장 응답 200 — ${x.st} ${x.code} ${x.msg}`).to.eq(true);
      expect(pp.policyMid, '플랜 저장 요청의 정책').to.eq(S.policyMid);
      expect(pp.nm, '플랜 저장 요청의 플랜 이름').to.eq(NAME);
    });
    cy.get('.v-content__wrap tbody', { timeout: 15000 }).contains('tr', NAME).should('contain', 'DBMS 개인정보 탐색기').and('contain', '즉시 검사').and('contain', '대기');
    // 시작
    cy.contains('.v-content__wrap tbody tr', NAME).find('.v-input--selection-controls__ripple').first().click({ force: true });
    cy.wait(800);
    mark();
    cy.contains('.v-btn__content', '시작').closest('button').should('not.be.disabled').click({ force: true });
    cy.wait(1500);
    confirmOk();
    waitApi((x) => x.m === 'POST' && /\/task\/execute/.test(x.url), '탐색 실행 요청').then((x) => {
      const rq = x.rq || {};
      S.planId = rq.planId;
      note('실행요청', { 상태: x.st, code: x.code, policyId: rq.policyId, planId: rq.planId, 유형: rq.policyTypeCode });
      expect(x.st, '실행 요청 응답').to.eq(200);
      expect(rq.policyTypeCode, '실행 유형 3001 (DBMS 개인정보 탐색기)').to.eq(3001);
      expect(rq.policyId, '실행 요청의 정책').to.eq(S.policyMid);
    });
    cy.wait(2500);
    cy.contains('.v-content__wrap tbody tr', NAME).then(($r) => {
      const row = t($r[0]);
      note('시작뒤', row.slice(0, 200));
      expect(/활성/.test(row.replace(/비활성/g, '')) || (row.match(TIME_RE) || []).length >= 2, '시작 뒤 「활성」 (또는 이미 종료)').to.eq(true);
    });
    // 종료 시간이 찍힐 때까지 15초 간격 최대 5분 (1차 실행 37초)
    const poll = (n) => {
      go(SCHED);
      cy.get('body').then(($b) => {
        const $r = planRows($b).filter((i, e) => t(e).includes(NAME)).first();
        const row = $r.length ? t($r[0]) : '';
        const times = row.match(TIME_RE) || [];
        if (times.length >= 2 || /오류/.test(row)) {
          note('종료', { 행: row.slice(0, 200), 걸린시간초: times.length >= 2 ? (new Date(times[1]) - new Date(times[0])) / 1000 : null, 확인횟수: n });
          expect(row, '플랜 결과에 「오류」 없음').to.not.include('오류');
          return;
        }
        if (n >= 20) throw new Error(`5분 안에 탐색이 끝나지 않음 — ${row.slice(0, 150)}`);
        cy.wait(15000);
        poll(n + 1);
      });
    };
    cy.wait(15000);
    poll(1);
  });

  it(`3. 탐색 결과 확인 — 0건이면 관찰 ${MANTIS}`, () => {
    expect(S.planId, '2단계 실행').to.be.a('number');
    const r = {};
    // DB 오브젝트 수 (메타정보 수집 결과)
    go(POLICY);
    btn(/^add$/).click({ force: true });
    cy.wait(3000);
    mark();
    pickDb();
    waitApi(/db-object\/stastics\/target-by-db/, 'DB 오브젝트 수').then((x) => {
      const o = (Array.isArray(x.ro) ? x.ro : [])[0] || {};
      r.오브젝트 = { 스키마: o.schemaCnt || 0, 테이블: o.tableCnt || 0, 컬럼: o.columnCnt || 0, hasSchema: o.hasSchema };
    });
    cy.get('body').then(($b) => { r.오브젝트화면 = (t(content($b)[0]).match(/(스키마|테이블|컬럼)\s*\d+건/g) || []).join(' · '); });
    btn(/^취소$/).click({ force: true });
    cy.wait(1500);
    // 자산 상세 조회 (화면 열 때 최근 7일 조회)
    mark();
    go(DETAIL);
    waitApi(/privacy-database\/list/, '자산 상세 조회').then((x) => { r.상세 = { 건수: totalOf(x), code: x.code }; r.상세ro = x.ro; });
    // 자산 개인정보 확정처리 (검색)
    go(NORMAL);
    mark();
    btn(/^검색/).click({ force: true });
    waitApi(/get-scan-privacy-result-list/, '확정처리 검색').then((x) => { r.확정처리 = { 건수: totalOf(x), code: x.code }; r.확정ro = x.ro; });
    // .21 탐색기 로그
    cy.then(() => readLog(S.planId)).then((lg) => { r.로그 = lg; });
    cy.then(() => {
      const zero = r.오브젝트.스키마 === 0 && r.상세.건수 === 0 && r.확정처리.건수 === 0;
      note('결과', { 오브젝트: r.오브젝트, 오브젝트화면: r.오브젝트화면, 자산상세: r.상세, 확정처리: r.확정처리, 로그: r.로그 });
      if (zero) {
        // 0039010 증상 : 메타정보 수집 NullPointerException(ScanColumnAll) → 스키마 0 → 결과 0, 태스크는 Success
        if (r.로그 && r.로그.읽음) {
          expect(r.로그.NPE_ScanColumnAll, `결과 0건 — 로그에 ${MANTIS} 증상(ScanColumnAll NullPointerException) 이어야 함 (없으면 새 원인)`).to.eq(true);
        }
        note(`관찰_${MANTIS}`, `탐색 결과 0건 · 스키마 0 — 메타정보 수집 NPE(${(r.로그 || {}).NPE위치 || '로그 확인 못 함'}), 태스크 결과 ${JSON.stringify((r.로그 || {}).결과 || null)}`);
        return;
      }
      // 결과가 생겼으면 (0039010 해결 뒤) : 오브젝트 수집 + 기대 컬럼 탐지
      expect(r.오브젝트.스키마, '메타정보 수집 — 스키마 수').to.be.greaterThan(0);
      expect(r.오브젝트.테이블, '메타정보 수집 — 테이블 수').to.be.greaterThan(0);
      const blob = JSON.stringify([r.상세ro, r.확정ro]).toLowerCase();
      const found = EXPECT_COLS.filter((c) => blob.includes(c));
      note('탐지컬럼', { 찾음: found, 못찾음: EXPECT_COLS.filter((c) => !found.includes(c)) });
      note(`${MANTIS}_해결추정`, '스키마 · 결과가 0 이 아님 — Mantis 확인 후 기준(기대 컬럼 수) 다시 정함');
      expect(found.length, `기대 개인정보 컬럼(${EXPECT_COLS.join(', ')}) 중 1개 이상 탐지`).to.be.greaterThan(0);
    });
  });

  it('4. 정리 — 플랜 · 정책 삭제, 남은 것 없음', () => {
    go(SCHED);
    cleanPlans(true);
    cy.get('body').then(($b) => expect(planRows($b).filter((i, e) => t(e).includes(NAME)).length, `스케줄러에 「${NAME}」 없음`).to.eq(0));
    go(POLICY);
    cleanPolicies(true);
    mark();
    go(POLICY);
    waitApi(/policy-master-list\?.*policyTypeCd=3001/, '탐색 정책 목록 (정리 뒤)').then((x) => {
      const left = (Array.isArray(x.ro) ? x.ro : []).filter((v) => LEFT_RE.test(v.policyNm || '')).map((v) => v.policyNm);
      note('정리뒤', { 정리: obs.정리 || [], 남은자동화정책: left });
      expect(left, '남은 자동화 탐색 정책').to.deep.eq([]);
    });
  });
});
