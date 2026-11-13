// [임시 탐색용 26] 자산 깊은 시나리오 — 첫 실제 탐색 1회 (결과 기록용) (2026-11-13)
//   ※ 이 스크립트는 데이터를 바꿈 : .21 에 임시 탐색 정책 · 스케줄러 플랜(auto_임시_자산탐색_MMDD_HHmm)을 만들고 탐색 1회 실행
//      → 끝나면(실패해도 after 에서) 플랜 중지 · 삭제, 정책 삭제
//      .26(MariaDB_26_logcatch_demo, 읽기 전용 계정 lc_scan)은 읽기만 함 (테이블당 최대 100행 · 기본값)
//      탐색 결과(자산 데이터)는 .21 에 남음 — 반복 실행 시 덮어쓰는지 쌓이는지 이번에 확인
//   운영가이드 5.1.1 : 탐색 정책은 운영 > 실행 플랜 > 스케줄러 에 등록해 동작, 스키마 · 테이블 선택은 필요할 때만 (비우면 DB 전체)
//   패턴 : Pattern Korea · Pattern Korea2 (LogCatch 설치 시 기본 제공 — 사용자 확인 2026-11-13)
//   1. 남은 auto_임시_자산탐색_ 플랜 · 정책 정리
//   2. 탐색 정책 등록 : Database = MariaDB_26_logcatch_demo, 패턴 = Pattern Korea + Pattern Korea2
//   3. 스케줄러 플랜 등록 (작업 유형 기본값 그대로 · 즉시 검사) → 체크 → 「시작」
//   4. 끝날 때까지 30초 간격 최대 15분 : 스케줄러 플랜 행 기록
//   5. 결과 기록 : 자산 상세 조회 · 자산 보유 현황 전체/개별 · 자산 개인정보 확정처리 · 확정된 개인정보 조회 · 탐색 정책 화면 스키마 수
//   6. 정리 : 정책 삭제(본문 끝) · after 에서 한 번 더 (플랜 중지 · 삭제, 정책 삭제)
//   [2026-11-13 1차 실행] 탐색 37초에 끝났지만 결과 0건 · 스키마 0건 — Mantis 0039010 (메타정보 수집 NPE ScanColumnAll.java:96, 태스크는 Success)
//                         after 정책 정리 실패(빈 화면) → 본문 끝에서 정리
//   결과 : cypress/probe/P26_*.json · 스크린샷 P26_*.png · P26_api.json · P26_요약.json
const A = require('../../support/anomaly');
const DB_NAME = 'MariaDB_26_logcatch_demo';
const PATTERNS = ['Pattern Korea', 'Pattern Korea2'];
const PREFIX = 'auto_임시_자산탐색_';
const PREFIX_RE = /auto_임시_자산탐색_\d{4}_\d{4}/;
const stamp = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; })();
const NAME = `${PREFIX}${stamp}`;
const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);

const out = { 이름: NAME, 시작: new Date().toISOString(), 단계: [] };
const save = () => cy.writeFile('cypress/probe/P26_요약.json', out, { log: false });
const step = (k, v) => { out.단계.push({ at: new Date().toISOString().slice(11, 19), [k]: v }); cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 200)}`); save(); };
// 로딩(스피너) 끝날 때까지 최대 20초 기다림 — 실패시키지 않음
const waitIdle = (n = 0) => cy.get('body', { log: false }).then(($b) => {
  const busy = $b.find('.v-progress-circular, .v-progress-linear--query').filter((i, e) => shown(e)).length;
  if (busy && n < 20) { cy.wait(1000, { log: false }); waitIdle(n + 1); }
});
// [2026-11-13 1차 실행] fullPage 캡처는 자산 화면이 빈 화면 · 스피너로 찍힘 → 로딩 끝난 뒤 viewport 캡처
const snap = (name) => waitIdle().then(() => cy.get('body')).then(($b) => {
  const root = $b.find('.v-content__wrap').last()[0] || $b[0];
  const q = (s) => [...root.querySelectorAll(s)].filter(shown);
  cy.writeFile(`cypress/probe/${name}.json`, {
    url: root.ownerDocument.location.href,
    dialogs: [...$b[0].querySelectorAll('.v-dialog--active')].filter(shown).map((d) => t(d).slice(0, 1500)),
    snack: [...$b[0].querySelectorAll('.v-snack__content, .v-alert')].filter(shown).map(t),
    headlines: q('.c-headline, .v-card__title, h2, h3').map(t).filter(Boolean).slice(0, 25),
    counts: (t(root).match(/(Database\s*\(\d+\)|스키마\s*\d+건|테이블\s*\d+건|컬럼\s*\d+건|\d+건이 검색)/g) || []),
    tree: q('.vue-treeselect__label, .v-treeview-node__label').map(t).filter(Boolean).slice(0, 60),
    tables: q('table').map((tb) => ({ th: [...tb.querySelectorAll('th')].map(t).filter(Boolean), rows: [...tb.querySelectorAll('tbody tr')].filter(shown).length, first: [...tb.querySelectorAll('tbody tr')].filter(shown).slice(0, 30).map((r) => t(r).slice(0, 260)) })),
    paging: (t(root).match(/\d+\s*-\s*\d+\s*of\s*\d+/g) || []).slice(0, 4),
    text: t(root).slice(0, 3000)
  });
  cy.screenshot(name, { capture: 'viewport', overwrite: true });
});
const content = ($b) => $b.find('.v-content__wrap').last();
const btnIn = (re) => cy.get('.v-content__wrap').last().find('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e))).first();
// 있으면 누름 (결과 화면 「검색」 등 — 없어도 기록은 계속)
const clickIf = (re, label) => cy.get('body').then(($b) => {
  const $x = content($b).find('button, .v-btn').filter((i, e) => shown(e) && re.test(t(e)));
  if ($x.length) cy.wrap($x.first()).click({ force: true }); else step(`${label}_버튼없음`, String(re));
});
const gear = (aria) => cy.get(`input[aria-label="${aria}"]`).filter(':visible').first().closest('.v-input').find('i').filter((i, e) => /settings|fa-cog/.test(e.className + t(e))).first();
const confirmOk = () => cy.get('body').then(($b) => {
  const $ok = $b.find('.v-dialog--active .v-btn').filter((i, e) => shown(e) && /^(확인|예)$/.test(t(e)));
  if ($ok.length) cy.wrap($ok.last()).click({ force: true });
});
const goScheduler = () => {
  cy.visit('/logcatch/com/siteMap');
  cy.wait(3000);
  cy.get('.v-list__tile__title', { timeout: 15000 }).filter((i, e) => shown(e) && t(e) === '스케줄러').first().click({ force: true });
  cy.wait(4000);
  cy.location('pathname').then((p) => { out.스케줄러주소 = p; });
};
// 스케줄러에서 PREFIX 플랜 정리 (활성이면 중지 → 삭제) — 행은 이름으로 다시 찾음
const cleanPlans = (n = 0) => cy.get('body').then(($b) => {
  if (n > 5) return;
  const $row = $b.find('tbody tr').filter((i, e) => shown(e) && PREFIX_RE.test(t(e))).first();
  if (!$row.length) return;
  const txt = t($row[0]);
  const nm = txt.match(PREFIX_RE)[0];
  if (/활성/.test(txt.replace(/비활성/g, ''))) {
    cy.contains('tbody tr', nm).find('.v-input--selection-controls__ripple').first().click({ force: true });
    cy.wait(500);
    cy.contains('.v-btn__content', '중지').closest('button').click({ force: true });
    cy.wait(1500);
    confirmOk();
    cy.wait(2000);
  }
  cy.contains('tbody tr', nm).find('.fa-trash').first().click({ force: true });
  cy.wait(800);
  confirmOk();
  cy.wait(2500);
  step('플랜정리', txt.slice(0, 160));
  cleanPlans(n + 1);
});
// 탐색 정책 목록에서 PREFIX 정책 정리 (삭제 칸 아이콘)
const cleanPolicies = (n = 0) => cy.get('body').then(($b) => {
  if (n > 5) return;
  const $row = content($b).find('tbody tr').filter((i, e) => shown(e) && PREFIX_RE.test(t(e))).first();
  if (!$row.length) return;
  const txt = t($row[0]);
  const nm = txt.match(PREFIX_RE)[0];
  cy.contains('.v-content__wrap tbody tr', nm).find('i').filter((i, e) => /fa-trash|delete/.test(e.className + t(e))).first().click({ force: true });
  cy.wait(800);
  confirmOk();
  cy.wait(2500);
  step('정책정리', txt.slice(0, 120));
  cleanPolicies(n + 1);
});
// 탐색 정책 추가 화면 : Database 톱니 → 그룹 펼침 → DB 체크 → 톱니 다시(닫힘, probe25)
const pickDb = () => {
  gear('Database').click({ force: true });
  cy.wait(2000);
  cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__group__header__append-icon').each(($a) => cy.wrap($a).click({ force: true }));
  cy.wait(800);
  cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === DB_NAME).first()
    .closest('.v-list__tile').find('.v-input--selection-controls__input').first().click({ force: true });
  cy.wait(2500);
  gear('Database').click({ force: true });
  cy.wait(2000);
};

describe('PROBE26 자산 탐색 실행', () => {
  A.ignoreErrors();
  const api = [];
  beforeEach(() => {
    cy.intercept({ url: /\/logcatch\//i }, (req) => {
      if (!['xhr', 'fetch'].includes(req.resourceType)) return;
      if (/\.(js|css|png|svg|woff2?|ico|jpg)(\?|$)|chart-data|widgets|dashboards|theme|version|mfa|alert\/info|progress\/info|common\/message|symbol-code|ui-options|timezone|doc\/test|oauth|login-token|me\/admin|password-rule|siteMap|menu/i.test(req.url)) return;
      req.on('after:response', (res) => {
        let body = '';
        const big = /scan|privacy|asset|confirmed|schedul|plan|policy|db-object|stastics/i.test(req.url);
        try { body = JSON.stringify(res.body).slice(0, big ? 8000 : 1200); } catch (e) { body = ''; }
        api.push({ at: new Date().toISOString().slice(11, 19), m: req.method, url: req.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 240), st: res.statusCode, req: req.body ? JSON.stringify(req.body).slice(0, 1500) : null, body });
      });
    });
    A.loginAdmin();
  });
  afterEach(() => cy.writeFile('cypress/probe/P26_api.json', api, { log: false }));
  // 실패해도 임시 플랜 · 정책은 지움
  after(() => {
    goScheduler();
    cleanPlans();
    snap('P26_20_플랜정리뒤');
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    // 화면이 비어 있으면(메뉴 · 본문 없음) 새로고침 한 번
    cy.get('body').then(($b) => { if (!$b.find('.v-content__wrap tbody').length) { cy.reload(); cy.wait(6000); } });
    cleanPolicies();
    snap('P26_21_정책정리뒤');
    cy.then(() => { out.끝 = new Date().toISOString(); });
    save();
    cy.writeFile('cypress/probe/P26_api.json', api, { log: false });
  });

  it('탐색 정책 → 스케줄러 즉시 실행 → 결과 기록', { retries: 0 }, () => {
    // ---------- 1. 남은 임시 플랜 · 정책 정리 ----------
    goScheduler();
    snap('P26_0_스케줄러처음');
    cleanPlans();
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    cleanPolicies();

    // ---------- 2. 탐색 정책 등록 ----------
    btnIn(/^add$/).click({ force: true });
    cy.wait(3500);
    cy.get('input[aria-label="정책명"]').filter(':visible').first().clear({ force: true }).type(NAME, { force: true, delay: 0 });
    cy.get('input[aria-label="설명"]').filter(':visible').first().clear({ force: true }).type('자동화 첫 탐색 (MariaDB_26, 100행)', { force: true, delay: 0 });
    pickDb();
    cy.get('body').should(($b) => expect(t(content($b)[0]), 'Database (1)').to.match(/Database\s*\(1\)/));
    // 패턴 : 톱니 → Pattern Korea · Pattern Korea2 체크 → 톱니 다시
    gear('패턴').click({ force: true });
    cy.wait(2000);
    PATTERNS.forEach((p) => {
      cy.get('.v-dialog--active').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === p).first()
        .closest('.v-list__tile').then(($tile) => {
          const $c = $tile.find('.v-input--selection-controls__input');
          cy.wrap($c.length ? $c.first() : $tile).click({ force: true });
        });
      cy.wait(1000);
    });
    snap('P26_1_패턴선택');
    gear('패턴').click({ force: true });
    cy.wait(1500);
    cy.get('body').then(($b) => {
      const pat = $b.find('input[aria-label="패턴"]').filter((i, e) => shown(e)).first().closest('.v-input');
      step('패턴칸', t(pat[0]).slice(0, 200));
      step('창남음', $b.find('.v-dialog--active').filter((i, e) => shown(e)).length);
    });
    snap('P26_2_정책입력');
    // 저장 (추가 화면 위쪽 「저장」)
    btnIn(/^저장$/).click({ force: true });
    cy.wait(3000);
    confirmOk();
    cy.wait(2000);
    cy.get('body').then(($b) => step('정책저장_알림', $b.find('.v-snack__content, .v-alert').filter((i, e) => shown(e)).toArray().map(t).join(' / ') || '(없음)'));
    snap('P26_3_정책저장뒤');
    cy.get('.v-content__wrap tbody', { timeout: 15000 }).should('contain', NAME);

    // ---------- 3. 스케줄러 플랜 등록 → 시작 ----------
    goScheduler();
    cy.contains('.v-btn__content', '추가').click({ force: true });
    cy.wait(3000);
    cy.get('input[aria-label="정책 목록"]').filter(':visible').first().click({ force: true });
    cy.wait(1500);
    cy.get('.v-menu__content:visible .v-list__tile__title').then(($items) => {
      const all = $items.toArray().map(t);
      const hit = all.find((x) => x.includes(NAME));
      out.정책목록_탐색 = all.filter((x) => /탐색|auto_임시/.test(x)).slice(0, 20);
      step('스케줄러_정책항목', hit || '(못 찾음)');
      expect(hit, `스케줄러 정책 목록에 「${NAME}」`).to.be.a('string');
      cy.wrap($items.filter((i, e) => t(e) === hit).first()).scrollIntoView().click({ force: true });
    });
    cy.wait(1000);
    cy.get('input[aria-label="플랜 이름"]').filter(':visible').first().clear({ force: true }).type(NAME, { force: true, delay: 0 });
    cy.get('body').then(($b) => {
      const box = (a) => t($b.find(`input[aria-label="${a}"]`).filter((i, e) => shown(e)).first().closest('.v-input')[0]);
      step('플랜입력', { 정책: box('정책 목록'), 작업유형: box('작업 유형'), 서버IP: box('서버 IP') });
    });
    snap('P26_4_플랜입력');
    cy.get('.v-btn__content').filter(':visible').filter((i, e) => t(e) === '저장').last().click({ force: true });
    cy.wait(2500);
    confirmOk();
    cy.wait(1500);
    cy.get('body').then(($b) => step('플랜저장_알림', $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).join(' / ') || '(없음)'));
    cy.get('tbody', { timeout: 15000 }).contains('tr', NAME).should('be.visible');
    cy.contains('tr', NAME).then(($r) => step('저장뒤_플랜행', t($r[0])));
    cy.contains('tr', NAME).find('.v-input--selection-controls__ripple').first().click({ force: true });
    cy.wait(800);
    cy.contains('.v-btn__content', '시작').closest('button').click({ force: true });
    cy.wait(2000);
    confirmOk();
    cy.get('body').then(($b) => step('시작_알림', $b.find('.v-snack__content').filter((i, e) => shown(e)).toArray().map(t).join(' / ') || '(없음)'));
    cy.wait(3000);
    cy.contains('tr', NAME).then(($r) => step('시작뒤_플랜행', t($r[0])));
    snap('P26_5_시작뒤');
    // 실시간 모니터링 탭 : 진행 중인 탐색만 보임 (1차 실행은 37초에 끝남 → 시작 직후 바로 기록, 「진행 중인 탐색(N)」 펼침)
    cy.contains('.v-btn__content, button, .v-tabs__item', '실시간 모니터링').click({ force: true });
    cy.wait(2500);
    cy.get('body').then(($b) => {
      const $h = content($b).find('*').filter((i, e) => shown(e) && /^진행 중인 탐색\(\d+\)$/.test(t(e))).last();
      step('실시간_진행중', $h.length ? t($h[0]) : '(못 찾음)');
      if ($h.length) cy.wrap($h).click({ force: true });
    });
    cy.wait(2000);
    snap('P26_5b_실시간모니터링');

    // ---------- 4. 완료 대기 (30초 간격 최대 15분) ----------
    const poll = (n) => {
      if (n > 30) { step('대기', '15분 안에 끝나지 않음'); return; }
      cy.wait(30000);
      goScheduler();
      cy.get('body').then(($b) => {
        const $r = $b.find('tbody tr').filter((i, e) => shown(e) && t(e).includes(NAME)).first();
        const row = $r.length ? t($r[0]) : '(행 없음)';
        step(`대기${n}`, row.slice(0, 200));
        // [2026-11-13 1차 실행] 즉시 검사 플랜 : 대기 → 활성(시작 시간) → 끝나면 다시 「대기」 + 종료 시간 (37초) → 시간 2개면 끝
        const times = row.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g) || [];
        if (times.length >= 2 || /완료|실패|오류|에러/.test(row)) { out.걸린시간 = times.length >= 2 ? `${(new Date(times[1]) - new Date(times[0])) / 1000}초 (${times[0]} → ${times[1]})` : row; return; }
        poll(n + 1);
      });
    };
    poll(1);
    snap('P26_6_대기끝');

    // ---------- 5. 결과 기록 ----------
    cy.visit('/logcatch/asset/database/detailedAssetInquiry');
    cy.wait(5000);
    clickIf(/^검색/, '자산상세');
    cy.wait(5000);
    snap('P26_7_자산상세');
    cy.visit('/logcatch/asset/database/totalStatus');
    cy.wait(6000);
    snap('P26_8_자산현황전체');
    cy.visit('/logcatch/asset/database/individualStatus');
    cy.wait(6000);
    snap('P26_9_자산현황개별');
    cy.visit('/logcatch/asset/database/normalPrivacyAsset');
    cy.wait(5000);
    clickIf(/^검색/, '확정처리');
    cy.wait(5000);
    snap('P26_10_확정처리');
    cy.visit('/logcatch/asset/database/confirmedPrivacy');
    cy.wait(5000);
    clickIf(/^검색/, '확정조회');
    cy.wait(4000);
    snap('P26_11_확정조회');
    // 탐색 뒤 정책 추가 화면에서 DB 를 골랐을 때 스키마 · 테이블 · 컬럼 수 (오브젝트가 수집됐는지) → 취소
    cy.visit('/logcatch/asset/database/privacyPolicyPlan');
    cy.wait(5000);
    btnIn(/^add$/).click({ force: true });
    cy.wait(3000);
    pickDb();
    snap('P26_12_탐색뒤_스키마수');
    clickIf(/^취소$/, '추가취소');
    cy.wait(2500);
    // 정책 정리는 여기서 먼저 (1차 실행 : after 의 직접 이동 화면이 빈 화면이라 정책이 남음)
    cleanPolicies();
    snap('P26_13_정책정리');
  });
});
