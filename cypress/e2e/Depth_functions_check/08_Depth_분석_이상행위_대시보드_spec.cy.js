// ==========================================================================
// [2.9.7 신규] 08_Depth_분석_이상행위_대시보드
//   사용자 이상행위 대시보드 : 경보 위젯 숫자가 결과 탭과 맞는지 + 화면 동작(기간 · 숨김 보기 · 확대 · 실시간 · 레이아웃 편집)
//   전용 정책 「auto_소명_접속량 과다」(#36) : 시작 때 즉시실행(사용 ON) → 끝나면 사용 OFF (사용 여부는 버전에 영향 없음)
//     - 대시보드·결과 탭은 사용 OFF 정책의 경보를 빼고 보여 줌 → 이 정책만 잠시 켜서 비교
//     - 「실시간」 정책이라 켜져 있는 동안 매분 실행됨 → 즉시실행 결과(실행이력 성공)가 남은 뒤에 비교
//       (경보는 정책 × 사용자 × 하루 1건이라 그 뒤로는 건수가 늘지 않음)
//   반복 실행 설계
//     - 정책 규칙은 바꾸지 않음
//     - 숨김 보기 · 실시간(정지) · 레이아웃 편집(취소) · 기간(오늘) 모두 원래대로 → after() 에서 한 번 더 되돌림
//   2.9.7 확인 사항 (probe13·14, 2026-11-12)
//     - 위젯 데이터 : GET /api/v1/anomaly/chart-data/<위젯ID>/_transient?from=YYYY-MM-DD&to=YYYY-MM-DD
//         → data.chartDataSets = [{ id, name, chartDatas: [{ name: '건', data: 'N' }] }]
//       9094 정책별 · 9096 위험도별 · 9097 범주별 · 9090 업무시스템별 · 9091 부서별 · 9092 일자별 추이 · 9093 위험도별 일자 추이 · 9095 요일별
//     - 결과 탭(정책 묶음) : GET /api/v1/anomaly/detection/alerts?dateFrom&dateTo&keyword&viewMode=policy → content[].alert_count
//     - 기간 「최근 30일」 = 오늘 포함 30일 (from = 오늘 - 29일) · 대시보드 기간은 다시 들어와도 유지됨
//     - 부서별 경보는 경보가 있어도 비어 있음 (chart-data/_axis-availability 의 DEPT=false) → 합계 비교에서 빼고 기록만
//       정책 집계 항목에 dept 가 없으면 부서 집계에서 빠지는 설계 (결과 탭 「부서」 묶음도 「값 없는 경보 N건 제외」)
//       → [Mantis 0038995] 인사정보 부서로 보완 요청 (개선) — 반영되면 부서별 합계도 비교 대상에 넣기
//   비밀번호: cypress.env.json (LC_PW)
// ==========================================================================
const A = require('../../support/anomaly');
const POLICY = 'auto_소명_접속량 과다';
const USER_ID = 'user014';   // 이 정책의 적용 대상 (사원_14)
// 합계가 서로 같아야 하는 경보 위젯 (같은 기간 · 사용 중인 정책의 경보 전체)
const SUM_WIDGETS = { 9094: '정책별 경보', 9096: '위험도별 경보', 9097: '범주별 경보', 9090: '업무시스템별 경보', 9092: '일자별 경보 추이', 9093: '위험도별 일자 추이', 9095: '요일별 경보' };
const DEPT_WIDGET = 9091;

const p2 = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const t = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
const sumSets = (sets) => (sets || []).reduce((a, s) => a + (s.chartDatas || []).reduce((b, c) => b + (parseFloat(c.data) || 0), 0), 0);
const policySum = (sets) => sumSets((sets || []).filter((s) => s.name === POLICY));

// ---- 대시보드 화면 요소
// [2026-11-12] 「레이아웃 편집」 등 일부 버튼은 평소 투명(opacity 0)이라 Cypress :visible 로는 안 잡힘
//   → 화면에 자리를 차지하는지(크기)로 판단 (display:none 인 버튼은 제외)
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const BTN = 'button, .v-btn';
const btn = (re) => cy.get(BTN).filter((i, e) => shown(e) && re.test(t(e))).first();
const btnsOf = ($b, re) => $b.find(BTN).filter((i, e) => shown(e) && re.test(t(e)));
const visibleBtnCount = ($b, text) => $b.find(BTN).filter((i, e) => shown(e) && t(e) === text).length;
const cards = () => cy.get('.anomaly-widget-card').filter(':visible');
const cardOf = (title) => cards().filter((i, e) => t(e.querySelector('.anomaly-widget-card__title') || e).includes(title)).first();
const periodBtn = () => cy.get('.pcpf__btn').filter(':visible').first();
const pickPeriod = (label) => {
  periodBtn().click({ force: true });
  cy.wait(1000);
  cy.get('.v-menu__content:visible, .menuable__content__active:visible').contains(new RegExp(`^\\s*${label}\\s*$`)).click({ force: true });
  cy.wait(3000);
  periodBtn().should('contain', label);
};

// 정책 사용 ON/OFF (규칙은 그대로)
const setActive = (on) => {
  A.goAnomaly('사용자 이상행위 정책');
  A.searchPolicy(POLICY);
  A.policyActive(POLICY).invoke('attr', 'aria-checked').then((c) => {
    if ((c === 'true') === on) return;
    A.policyActive(POLICY).parents('.v-input--selection-controls').first().find('.v-input--selection-controls__input').click({ force: true });
    A.confirmIfAny();
  });
  A.policyActive(POLICY).should('have.attr', 'aria-checked', on ? 'true' : 'false');
};

// 대시보드를 원래 상태로 (레이아웃 편집 취소 · 실시간 정지 · 숨김 보기 끔 · 기간 오늘)
const restoreDashboard = () => {
  A.goAnomaly('사용자 이상행위 대시보드');
  cy.wait(3000);
  cy.get('body').then(($b) => {
    if (visibleBtnCount($b, '기본 배치로')) { cy.wrap(btnsOf($b, /^취소$/).first()).click({ force: true }); A.confirmIfAny(); }
    const $stop = btnsOf($b, /^■\s*정지$/);
    if ($stop.length) cy.wrap($stop.first()).click({ force: true });
    const $shown = btnsOf($b, /숨김\s*\d+\s*표시중/);
    if ($shown.length) cy.wrap($shown.first()).click({ force: true });
  });
  periodBtn().then(($p) => { if (!/오늘/.test(t($p[0]))) pickPeriod('오늘'); });
};

describe('08_Depth_분석_이상행위_대시보드', () => {
  A.ignoreErrors();

  after(() => {
    cy.log('🧹 대시보드 원래대로 · 전용 정책 사용 OFF');
    A.loginAdmin();
    // [2026-11-23] 정책 OFF 를 먼저 — 대시보드 복원 중 화면 오류로 hook 이 멈춰도 실시간 정책이 켜진 채 남지 않게
    setActive(false);
    restoreDashboard();
  });

  it('대시보드 경보 위젯 = 결과 탭 건수 · 기간 · 숨김 보기 · 확대 · 실시간 · 레이아웃 편집', { retries: 0 }, () => {
    const today = ymd(new Date());
    const from30 = daysAgo(29);

    // 위젯 데이터 응답 (위젯ID → 마지막 응답) · 결과 탭 정책 묶음 응답
    const charts = {};
    cy.intercept({ method: 'GET', url: /\/api\/v1\/anomaly\/chart-data\/\d+\/_transient/ }, (req) => {
      req.continue((res) => {
        const id = (req.url.match(/chart-data\/(\d+)\//) || [])[1];
        const u = new URL(req.url);
        charts[id] = { from: u.searchParams.get('from'), to: u.searchParams.get('to'), sets: (res.body && res.body.data && res.body.data.chartDataSets) || [] };
      });
    });
    const results = [];
    cy.intercept({ method: 'GET', url: /\/api\/v1\/anomaly\/detection\/alerts\?.*viewMode=policy/ }, (req) => {
      req.continue((res) => {
        const u = new URL(req.url);
        results.push({ keyword: u.searchParams.get('keyword'), from: u.searchParams.get('dateFrom'), to: u.searchParams.get('dateTo'),
          content: (res.body && res.body.data && res.body.data.content) || [] });
      });
    });

    // ---------- 1. 접속 기록 → 전용 정책 즉시실행(사용 ON) → 실행 완료까지 대기 ----------
    //   [2026-11-12] 새 접속 기록이 없으면 즉시실행해도 실행 기록이 안 생김 → 먼저 user014 접속을 만들고 적재 대기
    //   CRM(.27) 접속이 끝내 실패하거나 실행 기록이 안 생겨도 진행 (비교 대상은 이미 있는 경보 — 실행 중이 아니므로 숫자는 고정)
    A.crmTraffic(USER_ID, 'D08D_0_CRM27_user014', false).then((r) => { if (r.ok) cy.wait(60000); }); // 수집 → 적재 대기
    A.loginAdmin();
    A.runNowAndWait(POLICY, 'D08D_1', 6, false);

    // [2026-11-18] 결과 탭 → 대시보드 순서로 읽는 사이에 실시간 정책이 오늘 경보를 새로 만들면 1건 차이 (11-18 05시 정기 실행 : 대시보드 6 · 결과 탭 5)
    //   → 정책별 경보 건수가 결과 탭과 다르면 결과 탭 · 대시보드를 한 번 더 읽고 그 값으로 비교 (경보는 정책 × 사용자 × 하루 1건이라 두 번째는 고정)
    const readResult = () => {
      results.length = 0;
      // ---------- 2. 결과 탭 : 최근 30일 · 이 정책 경보 건수 ----------
      A.goAnomaly('사용자 이상행위 결과');
      cy.contains('button', /^\s*최근 30일\s*$/).click({ force: true });
      cy.wait(2000);
      cy.get('input[placeholder="메시지 + 정책명 검색"]').clear({ force: true }).type(POLICY, { force: true });
      cy.get('.v-btn__content').filter(':visible').contains('검색').click({ force: true });
      cy.wait(3000);
      A.dumpScreen('D08D_2_결과_30일');
      cy.wrap(results, { timeout: 15000 }).should((r) => {
        expect(r.filter((x) => x.keyword === POLICY && x.from === from30 && x.to === today).length, `결과 탭 조회 (${from30} ~ ${today}, ${POLICY})`).to.be.greaterThan(0);
      }).then((r) => {
        const last = r.filter((x) => x.keyword === POLICY && x.from === from30 && x.to === today).pop();
        const row = last.content.find((c) => c.policy_name === POLICY);
        const n = row ? Number(row.alert_count) : 0;
        cy.log(`결과 탭 최근 30일 ${POLICY} 경보 ${n}건`);
        if (n > 0) {
          // 화면 묶음 머리글 「… auto_소명_접속량 과다 N (k회 실행) …」
          cy.get('.incident-header').filter(':visible').filter((i, e) => t(e).includes(POLICY)).first()
            .should(($h) => expect(t($h[0]), '결과 탭 묶음 머리글의 건수').to.match(new RegExp(`${POLICY}\\s+${n}\\s*\\(`)));
        }
        cy.wrap(n).as('resultCount');
      });

    };
    const readDashboard = () => {
      Object.keys(charts).forEach((k) => delete charts[k]);
      // ---------- 3. 대시보드 : 최근 30일 → 위젯 숫자 대조 ----------
      A.goAnomaly('사용자 이상행위 대시보드');
      cy.wait(4000);
      pickPeriod('최근 30일');
      // 기간을 바꾸면 위젯 데이터를 그 기간으로 다시 불러옴
      cy.wrap(charts, { timeout: 20000 }).should((c) => {
        Object.keys(SUM_WIDGETS).forEach((id) => {
          expect(c[id] && `${c[id].from}~${c[id].to}`, `${SUM_WIDGETS[id]} 데이터 기간`).to.eq(`${from30}~${today}`);
        });
      });
    };
    readResult();
    readDashboard();
    cy.get('@resultCount').then((n) => {
      const mine = policySum(charts[9094].sets);
      if (mine === n) return;
      cy.writeFile('cypress/probe/D08D_3_첫비교_차이.json', { resultCount: n, policyBar: mine, at: new Date().toISOString() });
      cy.log(`⚠️ 정책별 경보 ${mine}건 ≠ 결과 탭 ${n}건 — 읽는 사이 새 경보가 생겼을 수 있어 한 번 더 읽음`);
      readResult();
      readDashboard();
    });
    cy.get('@resultCount').then((n) => {
      const sums = Object.keys(SUM_WIDGETS).map((id) => ({ id, name: SUM_WIDGETS[id], sum: sumSets(charts[id].sets) }));
      const mine = policySum(charts[9094].sets);
      const dept = charts[DEPT_WIDGET] ? sumSets(charts[DEPT_WIDGET].sets) : null;
      cy.writeFile('cypress/probe/D08D_3_위젯합계.json', { from: from30, to: today, resultCount: n, policyBar: mine, sums, deptSum: dept });
      cy.log(`정책별 경보 ${POLICY} ${mine}건 / 결과 탭 ${n}건 · 위젯 합계 ${sums.map((s) => `${s.name} ${s.sum}`).join(', ')} · 부서별 ${dept}`);
      expect(mine, `정책별 경보의 ${POLICY} 건수 = 결과 탭 건수`).to.eq(n);
      sums.forEach((s) => expect(s.sum, `${s.name} 합계 = 정책별 경보 합계`).to.eq(sums[0].sum));
    });

    // ---------- 4. 숨김 위젯 보기 → 원래대로 ----------
    //   [2026-11-12] 숨겨진 위젯 수는 데이터에 따라 달라짐 (경보가 없을 때 8개 → #36 경보가 있을 때 부서별 1개)
    //   → 누르기 바로 전의 카드 수를 기준으로 「+ 숨김 수」 → 되돌리면 「기준 수」 인지 확인
    cy.get('body').then(($b) => {
      const $show = btnsOf($b, /숨김\s*\d+\s*개\s*보기/);
      if (!$show.length) { cy.log('ℹ️ 숨겨진 위젯 없음 — 숨김 보기 확인 건너뜀'); return; }
      const hidden = parseInt((t($show[0]).match(/숨김\s*(\d+)/) || [])[1] || '0', 10);
      const before = $b.find('.anomaly-widget-card:visible').length;
      cy.log(`숨김 보기 전 카드 ${before}개 · 숨김 ${hidden}개`);
      cy.wrap($show.first()).click({ force: true });
      cy.wait(3000);
      cards().should('have.length', before + hidden);
      // 새로 보이는 카드는 「숨김」 표시(숨김 아이콘 활성)가 붙어 있음
      cy.get('.anomaly-widget-card:visible .anomaly-widget-card__hide.is-active').should('have.length', hidden);
      btn(/숨김\s*\d+\s*표시중/).should('exist');
      A.dumpScreen('D08D_4_숨김보기');
      cy.get('@resultCount').then((n) => {
        if (n > 0) cardOf('정책별 경보').should('contain', POLICY);
        else cardOf('정책별 경보').should('contain', '없습니다');
      });
      btn(/숨김\s*\d+\s*표시중/).click({ force: true });
      cy.wait(2000);
      cards().should('have.length', before);
      btn(/숨김\s*\d+\s*개\s*보기/).should('exist');
    });

    // ---------- 5. 기간 「오늘」 → 위젯 데이터 기간이 오늘로 ----------
    pickPeriod('오늘');
    cy.wrap(charts, { timeout: 20000 }).should((c) => {
      expect(c[9094] && `${c[9094].from}~${c[9094].to}`, '정책별 경보 데이터 기간').to.eq(`${today}~${today}`);
    });
    cy.get('@resultCount').then((n) => {
      const mineToday = policySum(charts[9094].sets);
      cy.log(`오늘 ${POLICY} 경보 ${mineToday}건 (최근 30일 ${n}건)`);
      expect(mineToday, '오늘 건수 ≤ 최근 30일 건수').to.be.at.most(n);
      cy.wrap(mineToday).as('todayCount');
    });

    // ---------- 6. 위젯 확대 → 닫기 ----------
    const BIG = '개인정보 유형별 사용자';
    cardOf(BIG).find('.anomaly-widget-card__enlarge').first().click({ force: true });
    cy.wait(2000);
    cy.get('.v-dialog--active').filter(':visible').last().should('contain', BIG);
    A.dumpScreen('D08D_6_확대');
    cy.get('.v-dialog--active').filter(':visible').last().then(($d) => {
      const $x = $d.find('button, .v-btn, i').filter((i, e) => t(e) === 'close');
      expect($x.length, '확대 창 닫기(close) 버튼').to.be.greaterThan(0);
      cy.wrap($x.first()).click({ force: true });
    });
    cy.wait(1000);
    cy.get('.v-dialog--active:visible').should('not.exist');

    // ---------- 7. 클러스터 토폴로지 실시간 시작 → 정지 ----------
    // [2.9.9.0] 사용자 이상행위 대시보드에서 클러스터 토폴로지 「▶ 시작」 버튼이 보이지 않음 (2026-11-23 .21) → 있으면 점검, 없으면 기록만
    cy.get('body').then(($tb) => {
      if (!btnsOf($tb, /^▶?\s*시작$/).length) {
        cy.writeFile('cypress/probe/D08D_7_실시간_관찰.json', { 시각: new Date().toISOString(), 결과: '「▶ 시작」 버튼 없음 (2.9.9.0) — 실시간 토폴로지 점검 생략' }, { log: false });
        cy.log('⏭️ 클러스터 토폴로지 「▶ 시작」 버튼 없음 (2.9.9.0) — 점검 생략');
        return;
      }
      btn(/^▶?\s*시작$/).click({ force: true });
      cardOf('클러스터 토폴로지').should(($c) => {
        const s = t($c[0]);
        expect(s, '실시간 토폴로지 표시 (노드 · CPU)').to.match(/CPU/).and.match(/MASTER|CLUSTER/);
      });
      btn(/^■\s*정지$/).should('exist');
      A.dumpScreen('D08D_7_실시간');
      btn(/^■\s*정지$/).click({ force: true });
      cy.wait(1500);
      btn(/^▶?\s*시작$/).should('exist');
      cy.get('body').should(($b) => expect(btnsOf($b, /^■\s*정지$/).length, '정지 후 「■ 정지」 버튼').to.eq(0));
    });

    // ---------- 8. 레이아웃 편집 → 취소 (저장 안 함) ----------
    cards().its('length').as('cardsBeforeEdit');
    btn(/레이아웃 편집/).click({ force: true });
    cy.wait(1500);
    cy.get('body').should(($b) => {
      ['기본 배치로', '취소', '저장'].forEach((x) => expect(visibleBtnCount($b, x), `편집 모드 「${x}」 버튼`).to.be.greaterThan(0));
    });
    A.dumpScreen('D08D_8_레이아웃편집');
    btn(/^취소$/).click({ force: true });
    cy.wait(1000);
    A.confirmIfAny();
    cy.get('body').should(($b) => expect(visibleBtnCount($b, '기본 배치로'), '취소 후 편집 모드 종료').to.eq(0));
    cy.get('@cardsBeforeEdit').then((n) => cards().should('have.length', n));
    periodBtn().should('contain', '오늘');
    A.dumpScreen('D08D_9_끝');

    // ---------- 9. [2.9.9.0] 새 화면 연계 : 이력 > 이상행위 탭 · 점검 > 이상행위 대시보드 ----------
    //   전용 정책이 켜져 있는 지금 (경보 있음) 같은 경보가 새 화면에도 같은 건수로 보이는지
    //   (1) 이력 > 접속기록 이력 > 이상행위 탭 : 최근 30일 · 정책명 검색 → 정책 묶음 건수 = 분석 결과 탭 건수
    //   (2) 같은 탭 「오늘」 → 기간 조건이 요청에 실리는지 · 오늘 건수 = 대시보드 오늘 건수
    //       (Basic 02 관찰 : 「최근 7일」을 눌러도 요청에 기간 조건이 없었음 — 경보가 있는 여기서 결과로 확인)
    //   (3) 점검 > 이상행위 대시보드 : 켜진 정책이 있으므로 「정책이 없어 접속기록 기준」 안내가 없어야 함 · 오늘 경보 합계 = 오늘 건수
    const tabReq = [];
    // 응답을 가로채지 않고 끝난 뒤 기록 (화면 이동·종료 때 연결이 끊겨도 테스트가 실패하지 않게)
    cy.intercept({ method: 'GET', url: /\/api\/v1\/anomaly\/detection\/alerts\?/ }, (req) => {
      req.on('after:response', (res) => {
        const u = new URL(req.url);
        tabReq.push({ url: decodeURIComponent(req.url.replace(/^https?:\/\/[^/]+/, '')), viewMode: u.searchParams.get('viewMode'), from: u.searchParams.get('dateFrom'),
          to: u.searchParams.get('dateTo'), keyword: u.searchParams.get('keyword'), sev: u.searchParams.get('severities'),
          total: res.body && res.body.data ? res.body.data.totalCount : null, content: (res.body && res.body.data && res.body.data.content) || [] });
      });
    });
    const tabBtn = (re) => cy.get('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e))).first();
    const tabSearch = () => cy.get('.v-btn').filter((i, e) => shown(e) && /검색$/.test(t(e))).last().click({ force: true });
    const countOf = (r) => { const row = (r.content || []).find((c) => c.policy_name === POLICY); return row ? Number(row.alert_count) : 0; };

    cy.visit('/logcatch/record/accessLog/fileDownloadLog');
    cy.wait(4000);
    cy.get('.tab-btn').contains('이상행위').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/record/accessLog/anomalyResult');
    cy.wait(3000);
    // (1) 최근 30일 + 정책명
    cy.then(() => { tabReq.length = 0; });
    tabBtn(/^최근 30일$/).click({ force: true });
    cy.get('input[placeholder="메시지 + 정책명 검색"]').filter(':visible').clear({ force: true }).type(POLICY, { force: true });
    tabSearch();
    cy.wait(3000);
    A.dumpScreen('D08D_10_이력탭_30일');
    cy.wrap(tabReq, { timeout: 20000 }).should((r) => expect(r.filter((x) => x.viewMode === 'policy').length, '이상행위 탭 검색 요청').to.be.greaterThan(0));
    cy.get('@resultCount').then((n) => {
      const last = tabReq.filter((x) => x.viewMode === 'policy').pop();
      const m = countOf(last);
      cy.writeFile('cypress/probe/D08D_10_이력탭_30일.json', { 요청: last.url, 기간조건: !!(last.from || /date|from|start/i.test(last.url.split('?')[1] || '')), 탭건수: m, 분석결과탭: n });
      cy.log(`이력 이상행위 탭 ${POLICY} ${m}건 / 분석 결과 탭 최근 30일 ${n}건`);
      expect(m, '이력 > 이상행위 탭 건수 = 분석 > 결과 탭 건수 (최근 30일)').to.eq(n);
    });
    // (1-2) 최근 7일 → 요청 기간 = 오늘-6 ~ 오늘 (Basic 02 에서 「최근 7일」 요청에 기간이 없던 관찰 재확인)
    cy.then(() => { tabReq.length = 0; });
    tabBtn(/^최근 7일$/).click({ force: true });
    tabSearch();
    cy.wait(3000);
    cy.wrap(tabReq, { timeout: 20000 }).should((r) => expect(r.filter((x) => x.viewMode === 'policy').length, '이상행위 탭 「최근 7일」 검색 요청').to.be.greaterThan(0));
    cy.then(() => {
      const last = tabReq.filter((x) => x.viewMode === 'policy').pop();
      cy.writeFile('cypress/probe/D08D_10b_이력탭_7일.json', { 요청: last.url, from: last.from, to: last.to, 기대: [daysAgo(6), today], 건수: countOf(last) });
      cy.then(() => expect(`${last.from}~${last.to}`, '이상행위 탭 「최근 7일」 검색 요청 기간').to.eq(`${daysAgo(6)}~${today}`));
    });
    // (2) 오늘
    cy.then(() => { tabReq.length = 0; });
    tabBtn(/^오늘$/).click({ force: true });
    tabSearch();
    cy.wait(3000);
    A.dumpScreen('D08D_11_이력탭_오늘');
    cy.wrap(tabReq, { timeout: 20000 }).should((r) => expect(r.filter((x) => x.viewMode === 'policy').length, '이상행위 탭 「오늘」 검색 요청').to.be.greaterThan(0));
    cy.get('@todayCount').then((td) => {
      const last = tabReq.filter((x) => x.viewMode === 'policy').pop();
      const m = countOf(last);
      const hasPeriod = !!(last.from || /date|from|start/i.test(last.url.split('?')[1] || ''));
      cy.writeFile('cypress/probe/D08D_11_이력탭_오늘.json', { 요청: last.url, 기간조건: hasPeriod, 탭건수: m, 대시보드오늘: td });
      cy.log(`이력 이상행위 탭 「오늘」 ${m}건 / 대시보드 오늘 ${td}건 · 요청 기간조건 ${hasPeriod}`);
      expect(hasPeriod, '이상행위 탭 「오늘」 검색 요청에 기간 조건').to.eq(true);
      expect(m, '이력 > 이상행위 탭 「오늘」 건수 = 대시보드 오늘 건수').to.eq(td);
    });
    // (3) 점검 > 이상행위 대시보드
    cy.then(() => { tabReq.length = 0; });
    cy.get('body').type('{esc}');
    cy.contains('button', '점검').click({ force: true });
    cy.contains('.side-sub-menu-title', '이상행위 대시보드').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/inspection/anomalyMonitoringDashboard');
    cy.wait(8000);
    A.dumpScreen('D08D_12_점검_이상행위대시보드');
    cy.get('body').should(($b) => expect(t($b[0]), '켜진 정책이 있을 때 「정책이 없어 접속기록 기준」 안내').not.to.include('활성화된 이상행위 정책이 없어'));
    cy.get('@todayCount').then((td) => {
      // 위험도별 조회(severities=1·2·3)만 합산 — 소명 대기 등 다른 조회는 제외
      const flat = tabReq.filter((x) => x.viewMode === 'flat' && x.from === today && /^[123]$/.test(x.sev || ''));
      const bySev = {};
      flat.forEach((x) => { bySev[x.sev] = x.total; });
      const sum = Object.values(bySev).reduce((a, v) => a + (Number(v) || 0), 0);
      cy.get('body').then(($b) => {
        const body = t($b[0]);
        const card = Number((body.match(/오늘 이상행위\s*(\d+)\s*건/) || [])[1]);
        cy.writeFile('cypress/probe/D08D_12_점검대시보드.json', { 위험도별: bySev, 합계: sum, 화면_오늘이상행위: card, 분석대시보드오늘: td, 보기버튼: ['이상행위', '접속기록'].filter((x) => body.includes(x)) });
        cy.log(`점검 이상행위 대시보드 오늘 경보 ${JSON.stringify(bySev)} 합계 ${sum} · 카드 ${card} / 분석 대시보드 오늘 ${td}건`);
        cy.then(() => {
          expect(body, '제목 (켜진 정책이 있으면 이상행위 보기)').to.include('이상행위 모니터링 대시보드');
          expect(Object.keys(bySev).sort(), '위험도별 경보 조회 (심각 · 경계 · 주의)').to.deep.equal(['1', '2', '3']);
          expect(sum, '위험도별 오늘 경보 합계 = 분석 대시보드 오늘 건수').to.eq(td);
          expect(card, '「오늘 이상행위」 카드 = 분석 대시보드 오늘 건수').to.eq(td);
        });
      });
    });
  });
});
