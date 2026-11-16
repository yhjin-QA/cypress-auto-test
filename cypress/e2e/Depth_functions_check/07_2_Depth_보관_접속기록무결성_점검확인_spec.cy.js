// ==========================================================================
// [2.9.7 신규] 07_2_Depth_보관_접속기록무결성_점검확인 — 조회 전용 (정책 · 플랜 · 설정을 바꾸지 않음)
//   .21 은 위변조 검사 정책 「무결성 검사 정책」(2026-02-04) 을 스케줄러 플랜 2개가 매일 실행 (2026-11-16 probe_07_무결성_현황 확인)
//     - 「무결성 검사 정책」 플랜 : 주기 반복 · 매일 02:00
//     - 「test_auto_무결성검사」 플랜 : 주기 반복 · 매일 00:00
//   파일 위변조(체크섬)는 접속기록 보관 정기 백업(11:00)이 생성 · 검증
//   확인
//   1. 위변조 검사 정책 목록에 「무결성 검사 정책」
//   2. 스케줄러 일정 상세에 오늘(02:10 전이면 어제) 「무결성 검사 정책」 완료 행
//   3. 위변조 검사 이력 : 최근 접속기록 날짜 = 오늘 - 3 ～ 5일, 각 행 최초 점검일 ≥ 접속기록 날짜 + 1일(다음 날이 아니면 기록), 최종 점검일 = 오늘(02:10 전이면 어제 이후)
//      점검 상태(정상 · 무결성 오류)는 기록만 — 「무결성 오류」는 원장 압축 때문 (0039030)
//   3-2. DB 기준값 : 접속기록 DB 파티션(type 2)은 일치해야 통과, 원장 폴더(type 1) 불일치는 관찰 0039030
//   4. 파일 위변조 검사 이력 : 화면 행의 최근 검증일시 ≥ 어제, 위변조 여부는 일치 · 불일치만 (불일치 건수는 기록)
// ==========================================================================
const A = require('../../support/anomaly');

const t = (e) => (e ? (e.innerText || '') : '').replace(/\s+/g, ' ').trim();
const shown = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
const obs = {};
const note = (k, v) => {
  obs[k] = v;
  cy.log(`📝 ${k}: ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)}`);
  cy.writeFile('cypress/probe/D07I_관찰.json', obs, { log: false });
};
const POLICY = '무결성 검사 정책';
const KST = 9 * 3600 * 1000;
const kst = (ms = Date.now()) => new Date(ms + KST);
const d8 = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
const dash = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const addDays = (s, n) => d8(new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) + n * 86400000));
const NOW = kst();
const TODAY = d8(NOW);
const RUN_DAY = (NOW.getUTCHours() < 2 || (NOW.getUTCHours() === 2 && NOW.getUTCMinutes() < 10)) ? addDays(TODAY, -1) : TODAY; // 02:10 전이면 어제 실행분 기준

const rowsOf = ($b) => $b.find('.v-content__wrap').last().find('tbody tr').filter((i, e) => shown(e) && e.querySelectorAll('td').length > 1)
  .toArray().map((r) => [...r.querySelectorAll('td')].map(t));
const tab = (label) => {
  cy.get('.tab-btn').filter((i, e) => shown(e) && t(e) === label).first().click({ force: true });
  cy.wait(2000);
  cy.get('body', { timeout: 20000 }).should(($b) => expect(rowsOf($b).length, `「${label}」 목록 행`).to.be.greaterThan(0));
};

// 「1-25 of N」 에서 N
const totalOf = ($b) => Number((t($b.find('.v-content__wrap').last()[0]).match(/\d+\s*-\s*\d+\s*of\s*(\d+)/) || [])[1] || 0);
const STATUS = 'input[aria-label="DB 무결성 점검 상태"]';
const filterStatus = (label) => {
  cy.get(STATUS).filter(':visible').closest('.v-input').then(($v) => {
    const $x = $v.find('.v-input__icon--clear .v-icon, .v-input__icon--clear i');
    if ($x.length) { cy.wrap($x.first()).click({ force: true }); cy.wait(500); }
  });
  if (label) {
    cy.get(STATUS).filter(':visible').click({ force: true });
    cy.wait(800);
    cy.get('.v-menu__content').filter(':visible').last().find('.v-list__tile__title').filter((i, e) => t(e) === label).first().click({ force: true });
    cy.wait(500);
    cy.get('body').type('{esc}');
  }
  cy.get('.v-btn__content').filter((i, e) => shown(e) && /^검색/.test(t(e))).first().click({ force: true });
  cy.wait(3000);
};

describe('07_2_Depth_보관_접속기록무결성_점검확인', () => {
  A.ignoreErrors();
  beforeEach(() => { A.loginAdmin(); });

  it('접속기록 무결성 — 매일 위변조 검사 · 파일 위변조 검증이 돌았는지', { retries: 0 }, () => {
    note('D07I_기준', { 오늘: TODAY, 실행기준일: RUN_DAY });

    // 2. 스케줄러 일정 상세
    cy.visit('/logcatch/operate/executePlan/scheduler');
    cy.wait(5000);
    cy.get('body').then(($b) => {
      const rows = $b.find('.v-content__wrap').last().find('tbody tr').filter((i, e) => shown(e)).toArray().map(t);
      const plan = rows.filter((r) => r.includes(POLICY) && /주기 반복/.test(r));
      const sched = rows.filter((r) => r.startsWith(dash(RUN_DAY)) && r.includes(POLICY));
      note('D07I_스케줄러', { 플랜: plan, 일정: sched });
      expect(plan.length, `스케줄러에 「${POLICY}」 주기 반복 플랜`).to.be.greaterThan(0);
      expect(sched.join(' / '), `일정 상세에 ${dash(RUN_DAY)} 「${POLICY}」 완료`).to.include('완료');
    });
    A.dumpScreen('D07I_1_스케줄러');

    // 1 · 3 · 4. 보관 > 접속기록 무결성
    cy.visit('/logcatch/backup/integrityLogs/inspectForgeryPolicy');
    cy.wait(4000);
    // 화면 주소로 바로 열면 목록이 늦게 채워질 때가 있음(2026-11-16 1회) → 목록이 찰 때까지 최대 20초 다시 확인
    cy.get('body', { timeout: 20000 }).should(($b) => {
      expect(rowsOf($b).map((r) => r[0]), `위변조 검사 정책 「${POLICY}」`).to.include(POLICY);
    }).then(($b) => note('D07I_정책', rowsOf($b).map((r) => r.slice(0, 4))));

    tab('위변조 검사 이력 조회');
    cy.get('body').then(($b) => {
      const rows = rowsOf($b).slice(0, 10);
      note('D07I_이력', rows);
      expect(rows.length, '위변조 검사 이력 행').to.be.greaterThan(0);
      const latest = rows[0][0];
      const lag = (Date.UTC(+TODAY.slice(0, 4), +TODAY.slice(4, 6) - 1, +TODAY.slice(6, 8)) - Date.UTC(+latest.slice(0, 4), +latest.slice(4, 6) - 1, +latest.slice(6, 8))) / 86400000;
      note('D07I_최근날짜', { 접속기록날짜: latest, 오늘과차이: lag });
      expect(lag, `가장 최근 접속기록 날짜(${latest})가 오늘 기준 3 ～ 5일 전`).to.be.within(3, 5);
      const status = {};
      const late = [];
      rows.forEach((r) => {
        const [date, cnt, first, last, st] = r;
        expect(Number((cnt.match(/\d+/) || [])[0]), `${date} 점검 횟수`).to.be.greaterThan(0);
        // 보통 다음 날 00:00 이지만, 그날 점검이 건너뛰어지면 그 뒤 첫 점검일 (2026-11-16 : 20261018 → 10-20, 20261019 와 같은 날)
        const firstD = Number(first.replace(/\D/g, '').slice(0, 8));
        expect(firstD, `${date} 최초 점검일 ≥ 접속기록 날짜 + 1일`).to.be.at.least(Number(addDays(date, 1)));
        if (firstD !== Number(addDays(date, 1))) late.push(`${date} → ${first.slice(0, 10)}`);
        expect(Number(last.replace(/\D/g, '').slice(0, 8)), `${date} 최종 점검일 ≥ ${dash(RUN_DAY)}`).to.be.at.least(Number(RUN_DAY));
        expect(['정상', '무결성 오류'], `${date} 점검 상태 값`).to.include(st);
        status[st] = (status[st] || 0) + 1;
      });
      note('D07I_점검상태', status);
      note('D07I_늦은첫점검', late);
    });
    A.dumpScreen('D07I_2_위변조이력');

    // 3-1. 「DB 무결성 점검 상태」 필터 건수 : 정상 + 오류 = 전체 (관찰 0039029 — 「정상」 필터가 전체를 돌려주고 오류 건도 「정상」 표시)
    const cnt = {};
    filterStatus(null);
    cy.get('body').then(($b) => { cnt.전체 = totalOf($b); });
    filterStatus('오류');
    cy.get('body').then(($b) => { cnt.오류 = totalOf($b); cnt.오류행상태 = [...new Set(rowsOf($b).map((r) => r[4]))]; });
    filterStatus('정상');
    cy.get('body').then(($b) => {
      cnt.정상 = totalOf($b);
      cnt.정상행상태 = [...new Set(rowsOf($b).map((r) => r[4]))];
      note('D07I_필터건수', cnt);
      expect(cnt.전체, '위변조 검사 이력 전체 건수').to.be.greaterThan(0);
      expect(cnt.오류행상태.filter((x) => x !== '무결성 오류'), '「오류」 필터 결과는 모두 무결성 오류').to.deep.eq([]);
      if (cnt.오류 > 0 && cnt.정상 === cnt.전체) {
        note('D07I_관찰_0039029', `「정상」 필터 ${cnt.정상}건 = 전체 ${cnt.전체}건 (오류 ${cnt.오류}건 포함) — 해결되면 아래 확인으로 통과`);
        cy.log('⚠️ [관찰 0039029] 「정상」 필터가 걸러지지 않음');
      } else {
        expect(cnt.정상 + cnt.오류, '정상 + 오류 = 전체').to.eq(cnt.전체);
        expect(cnt.정상행상태.filter((x) => x !== '정상'), '「정상」 필터 결과는 모두 정상').to.deep.eq([]);
      }
    });
    filterStatus(null);

    // 3-2. 무결성 기준값 DB (tbr_integrity_mongo) — 최근 30일, 유형별 기준 · 최근 점검값 비교
    //   type 2 = 접속기록 DB 파티션(access_log_YYYYMMDD) → 일치해야 함 (실제 위변조 감지 대상)
    //   type 1 = 원장 폴더(contentLedger/<서버ID>/YYYYMMDD) → 정기 백업 원장 압축(.zst) 뒤 체크섬 불일치 = 관찰 0039030
    cy.task('queryPostgresDB', "select date, type, count(*)::int as n, sum(case when chksum is distinct from latest_chksum or analyze_log_count is distinct from latest_count then 1 else 0 end)::int as diff from logcatch.tbr_integrity_mongo where date >= to_char(now() - interval '30 day', 'YYYYMMDD') group by date, type order by date desc, type", { timeout: 60000 }).then((rows) => {
      expect(rows, '무결성 기준값 DB 조회').to.be.an('array').and.not.be.empty;
      const by = (ty) => rows.filter((r) => Number(r.type) === ty);
      const db = by(2); const ledger = by(1);
      const dbBad = db.filter((r) => Number(r.diff) > 0).map((r) => r.date);
      const ledgerBad = ledger.filter((r) => Number(r.diff) > 0).map((r) => r.date);
      note('D07I_기준값비교', { 접속기록DB: { 날짜수: db.length, 불일치: dbBad }, 원장: { 날짜수: ledger.length, 불일치: ledgerBad.length, 날짜: ledgerBad.slice(0, 10) } });
      expect(db.length, '최근 30일 접속기록 DB 파티션 기준값').to.be.greaterThan(0);
      expect(dbBad, '접속기록 DB 파티션(type 2) 기준값 = 최근 점검값 (실제 위변조 없음)').to.deep.eq([]);
      if (ledgerBad.length) {
        note('D07I_관찰_0039030', `원장 폴더(type 1) 체크섬 불일치 ${ledgerBad.length}개 날짜 — 정기 백업 원장 압축 뒤 「무결성 오류」 (해결되면 0 이어야 함)`);
        cy.log(`⚠️ [관찰 0039030] 원장 폴더 불일치 ${ledgerBad.length}개 날짜`);
      }
    });

    tab('파일 위변조 검사 이력 조회');
    cy.get('body').then(($b) => {
      const rows = rowsOf($b).map((r) => r.slice(1)); // 첫 칸은 체크박스
      note('D07I_파일이력', rows.slice(0, 10));
      expect(rows.length, '파일 위변조 검사 이력 행').to.be.greaterThan(0);
      const lastVerify = rows.map((r) => r[3].replace(/\D/g, '').slice(0, 8)).sort().pop();
      const bad = rows.filter((r) => r[5] !== '일치');
      note('D07I_파일검증', { 최근검증일: lastVerify, 불일치: bad.length, 값: [...new Set(rows.map((r) => r[5]))] });
      expect(Number(lastVerify), '파일 위변조 최근 검증일 ≥ 어제').to.be.at.least(Number(addDays(TODAY, -1)));
      rows.forEach((r) => expect(['일치', '불일치'], `${r[1]} 위변조 여부 값`).to.include(r[5]));
    });
    A.dumpScreen('D07I_3_파일위변조이력');
  });
});
